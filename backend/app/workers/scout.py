from __future__ import annotations

import asyncio
import socket
from dataclasses import dataclass
from typing import Literal, Protocol
from uuid import UUID

import httpx

from app.core.config import Settings, get_settings
from app.repositories.jobs import JobRepository, SupabaseJobRepository
from app.repositories.youtube import SupabaseYouTubeStorageRepository, YouTubeStorageRepository
from app.services.youtube import YouTubeApiError, YouTubeCollection, YouTubeCollector

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
        worker_id: str,
        collector: ScoutCollector | None = None,
    ) -> None:
        self._settings = settings
        self._repository = repository
        self._storage = storage
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
        worker_id=worker_id,
    )
    return await worker.run_once()


def main() -> None:
    result = asyncio.run(run_once())
    print(result)


if __name__ == "__main__":
    main()
