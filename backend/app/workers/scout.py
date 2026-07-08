from __future__ import annotations

import asyncio
import socket
from dataclasses import dataclass
from typing import Literal, Protocol
from uuid import UUID

import httpx

from app.core.config import Settings, get_settings
from app.repositories.jobs import JobRepository, SupabaseJobRepository
from app.repositories.opportunities import OpportunityRepository, SupabaseOpportunityRepository
from app.repositories.youtube import (
    ScanVideoRecord,
    SupabaseYouTubeStorageRepository,
    YouTubeStorageRepository,
)
from app.services.scout import build_opportunity_upsert_input, build_scan_analysis
from app.services.youtube import YouTubeApiError, YouTubeCollection, YouTubeCollector, YouTubeVideo

WorkerStatus = Literal["no_job", "completed", "failed"]


class ScoutCollector(Protocol):
    async def collect(self, keyword: str) -> YouTubeCollection:
        ...


@dataclass(slots=True)
class ScoutWorkerResult:
    status: WorkerStatus
    job_id: UUID | None = None
    scan_id: UUID | None = None
    error_code: str | None = None
    error_message: str | None = None


class ScoutWorker:
    def __init__(
        self,
        settings: Settings,
        repository: JobRepository,
        storage: YouTubeStorageRepository,
        opportunities: OpportunityRepository,
        worker_id: str,
        collector: ScoutCollector | None = None,
    ) -> None:
        self._settings = settings
        self._repository = repository
        self._storage = storage
        self._opportunities = opportunities
        self._worker_id = worker_id
        self._collector = collector

    async def run_once(self) -> ScoutWorkerResult:
        job = await self._repository.claim_next_scout_scan(worker_id=self._worker_id)

        if job is None:
            return ScoutWorkerResult(status="no_job")

        if not self._settings.youtube_api_key:
            error_code = "youtube_api_key_missing"
            error_message = "YOUTUBE_API_KEY doit etre configure pour executer un scan Scout."
            await self._repository.fail_scout_scan(
                job_id=job.id,
                scan_id=job.entity_id,
                error_code=error_code,
                error_message=error_message,
            )
            return ScoutWorkerResult(
                status="failed",
                job_id=job.id,
                scan_id=job.entity_id,
                error_code=error_code,
                error_message=error_message,
            )

        keyword = job.payload.get("keyword")

        if not isinstance(keyword, str) or not keyword.strip():
            return await self._fail(
                job_id=job.id,
                scan_id=job.entity_id,
                error_code="invalid_job_payload",
                error_message="La tache Scout ne contient pas de mot-cle valide.",
            )

        collector = self._collector or YouTubeCollector(api_key=self._settings.youtube_api_key)

        try:
            collection = await collector.collect(keyword=keyword)
            await self._storage.store_scan_collection(scan_id=job.entity_id, collection=collection)
            channel_titles = {channel.id: channel.title for channel in collection.channels}
            analysis = build_scan_analysis(
                [
                    _collection_video_to_record(
                        video=video,
                        channel_title=channel_titles.get(video.channel_id, ""),
                    )
                    for video in collection.videos
                ],
            )
            await self._opportunities.upsert(
                build_opportunity_upsert_input(
                    scan_id=job.entity_id,
                    keyword=keyword,
                    analysis=analysis,
                ),
            )
            await self._repository.complete_scout_scan(
                job_id=job.id,
                scan_id=job.entity_id,
                video_count=len(collection.videos),
            )
        except YouTubeApiError as error:
            return await self._fail(
                job_id=job.id,
                scan_id=job.entity_id,
                error_code=error.code,
                error_message=error.message,
            )
        except httpx.HTTPError as error:
            return await self._fail(
                job_id=job.id,
                scan_id=job.entity_id,
                error_code="scout_http_error",
                error_message=str(error),
            )

        return ScoutWorkerResult(
            status="completed",
            job_id=job.id,
            scan_id=job.entity_id,
        )

    async def _fail(
        self,
        job_id: UUID,
        scan_id: UUID,
        error_code: str,
        error_message: str,
    ) -> ScoutWorkerResult:
        await self._repository.fail_scout_scan(
            job_id=job_id,
            scan_id=scan_id,
            error_code=error_code,
            error_message=error_message,
        )
        return ScoutWorkerResult(
            status="failed",
            job_id=job_id,
            scan_id=scan_id,
            error_code=error_code,
            error_message=error_message,
        )


async def run_once() -> ScoutWorkerResult:
    settings = get_settings()
    worker_id = f"scout-worker:{socket.gethostname()}"
    worker = ScoutWorker(
        settings=settings,
        repository=SupabaseJobRepository(settings=settings),
        storage=SupabaseYouTubeStorageRepository(settings=settings),
        opportunities=SupabaseOpportunityRepository(settings=settings),
        worker_id=worker_id,
    )
    return await worker.run_once()


def _collection_video_to_record(video: YouTubeVideo, channel_title: str) -> ScanVideoRecord:
    return ScanVideoRecord(
        rank=0,
        video_id=video.id,
        title=video.title,
        channel_id=video.channel_id,
        channel_title=channel_title,
        view_count=video.view_count,
        like_count=video.like_count,
        comment_count=video.comment_count,
        published_at=video.published_at,
        thumbnail_url=video.thumbnail_url,
    )


def main() -> None:
    result = asyncio.run(run_once())
    print(result)


if __name__ == "__main__":
    main()
