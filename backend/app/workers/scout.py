from __future__ import annotations

import asyncio
import socket
from dataclasses import dataclass
from typing import Literal
from uuid import UUID

from app.core.config import Settings, get_settings
from app.repositories.jobs import JobRepository, SupabaseJobRepository

WorkerStatus = Literal["no_job", "failed"]


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
        worker_id: str,
    ) -> None:
        self._settings = settings
        self._repository = repository
        self._worker_id = worker_id

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

        error_code = "youtube_collection_not_implemented"
        error_message = "Le collecteur YouTube n'est pas encore implemente."
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


async def run_once() -> ScoutWorkerResult:
    settings = get_settings()
    worker_id = f"scout-worker:{socket.gethostname()}"
    worker = ScoutWorker(
        settings=settings,
        repository=SupabaseJobRepository(settings=settings),
        worker_id=worker_id,
    )
    return await worker.run_once()


def main() -> None:
    result = asyncio.run(run_once())
    print(result)


if __name__ == "__main__":
    main()
