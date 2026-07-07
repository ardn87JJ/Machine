import asyncio
from uuid import UUID

from app.core.config import Settings
from app.repositories.jobs import JobRecord
from app.workers.scout import ScoutWorker


class InMemoryJobRepository:
    def __init__(self, job: JobRecord | None) -> None:
        self.job = job
        self.claimed_by: str | None = None
        self.failed_job_id: UUID | None = None
        self.failed_scan_id: UUID | None = None
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


def test_worker_returns_no_job_when_queue_is_empty() -> None:
    repository = InMemoryJobRepository(job=None)
    worker = ScoutWorker(
        settings=Settings(youtube_api_key=None),
        repository=repository,
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
    worker = ScoutWorker(
        settings=Settings(youtube_api_key=None),
        repository=repository,
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
