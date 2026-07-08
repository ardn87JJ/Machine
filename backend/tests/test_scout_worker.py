import asyncio
from uuid import UUID

from app.core.config import Settings
from app.repositories.jobs import JobRecord
from app.repositories.opportunities import OpportunityUpsertInput
from app.services.youtube import YouTubeChannel, YouTubeCollection, YouTubeVideo
from app.workers.scout import ScoutWorker


class InMemoryJobRepository:
    def __init__(self, job: JobRecord | None) -> None:
        self.job = job
        self.claimed_by: str | None = None
        self.failed_job_id: UUID | None = None
        self.failed_scan_id: UUID | None = None
        self.completed_job_id: UUID | None = None
        self.completed_scan_id: UUID | None = None
        self.completed_video_count: int | None = None
        self.error_code: str | None = None
        self.error_message: str | None = None

    async def claim_next_scout_scan(self, worker_id: str) -> JobRecord | None:
        self.claimed_by = worker_id
        return self.job

    async def fail_scout_scan(
        self,
        job_id: UUID,
        scan_id: UUID,
        error_code: str,
        error_message: str,
    ) -> None:
        self.failed_job_id = job_id
        self.failed_scan_id = scan_id
        self.error_code = error_code
        self.error_message = error_message

    async def complete_scout_scan(
        self,
        job_id: UUID,
        scan_id: UUID,
        video_count: int,
    ) -> None:
        self.completed_job_id = job_id
        self.completed_scan_id = scan_id
        self.completed_video_count = video_count


class InMemoryYouTubeStorageRepository:
    def __init__(self) -> None:
        self.scan_id: UUID | None = None
        self.collection: YouTubeCollection | None = None

    async def store_scan_collection(
        self,
        scan_id: UUID,
        collection: YouTubeCollection,
    ) -> None:
        self.scan_id = scan_id
        self.collection = collection


class InMemoryOpportunityRepository:
    def __init__(self) -> None:
        self.last_input: OpportunityUpsertInput | None = None

    async def upsert(self, opportunity: OpportunityUpsertInput):
        self.last_input = opportunity
        return None


class StubYouTubeCollector:
    async def collect(self, keyword: str) -> YouTubeCollection:
        return YouTubeCollection(
            channels=[
                YouTubeChannel(
                    id="channel-1",
                    title="Demo channel",
                    description="",
                    published_at="2026-01-01T00:00:00Z",
                    subscriber_count=100,
                    video_count=10,
                    view_count=1000,
                    thumbnail_url=None,
                    raw={"id": "channel-1"},
                )
            ],
            videos=[
                YouTubeVideo(
                    id="video-1",
                    channel_id="channel-1",
                    title=f"Result for {keyword}",
                    description="",
                    published_at="2026-01-02T00:00:00Z",
                    duration="PT1M",
                    view_count=200,
                    like_count=20,
                    comment_count=2,
                    thumbnail_url=None,
                    raw={"id": "video-1"},
                )
            ],
            video_ranks={"video-1": 1},
        )


def test_worker_returns_no_job_when_queue_is_empty() -> None:
    repository = InMemoryJobRepository(job=None)
    storage = InMemoryYouTubeStorageRepository()
    opportunities = InMemoryOpportunityRepository()
    worker = ScoutWorker(
        settings=Settings(youtube_api_key=None),
        repository=repository,
        storage=storage,
        opportunities=opportunities,
        worker_id="test-worker",
    )

    result = asyncio.run(worker.run_once())

    assert result.status == "no_job"
    assert repository.claimed_by == "test-worker"
    assert repository.failed_job_id is None


def test_worker_marks_scan_failed_when_youtube_key_is_missing() -> None:
    job = JobRecord(
        id=UUID("11111111-1111-1111-1111-111111111111"),
        entity_id=UUID("22222222-2222-2222-2222-222222222222"),
        payload={"keyword": "test machine supabase"},
        attempt_count=0,
        max_attempts=3,
    )
    repository = InMemoryJobRepository(job=job)
    storage = InMemoryYouTubeStorageRepository()
    opportunities = InMemoryOpportunityRepository()
    worker = ScoutWorker(
        settings=Settings(youtube_api_key=None),
        repository=repository,
        storage=storage,
        opportunities=opportunities,
        worker_id="test-worker",
    )

    result = asyncio.run(worker.run_once())

    assert result.status == "failed"
    assert result.job_id == job.id
    assert result.scan_id == job.entity_id
    assert result.error_code == "youtube_api_key_missing"
    assert repository.failed_job_id == job.id
    assert repository.failed_scan_id == job.entity_id
    assert repository.error_code == "youtube_api_key_missing"


def test_worker_collects_and_completes_scan_when_youtube_key_is_configured() -> None:
    job = JobRecord(
        id=UUID("11111111-1111-1111-1111-111111111111"),
        entity_id=UUID("22222222-2222-2222-2222-222222222222"),
        payload={"keyword": "test machine supabase"},
        attempt_count=0,
        max_attempts=3,
    )
    repository = InMemoryJobRepository(job=job)
    storage = InMemoryYouTubeStorageRepository()
    opportunities = InMemoryOpportunityRepository()
    worker = ScoutWorker(
        settings=Settings(youtube_api_key="test-key"),
        repository=repository,
        storage=storage,
        opportunities=opportunities,
        worker_id="test-worker",
        collector=StubYouTubeCollector(),
    )

    result = asyncio.run(worker.run_once())

    assert result.status == "completed"
    assert result.job_id == job.id
    assert result.scan_id == job.entity_id
    assert storage.scan_id == job.entity_id
    assert storage.collection is not None
    assert storage.collection.videos[0].id == "video-1"
    assert repository.completed_job_id == job.id
    assert repository.completed_scan_id == job.entity_id
    assert repository.completed_video_count == 1
    assert opportunities.last_input is not None
    assert opportunities.last_input.keyword == "test machine supabase"
    assert opportunities.last_input.verdict in {"GO", "WATCH", "SKIP"}
