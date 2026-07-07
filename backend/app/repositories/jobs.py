from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Literal, Protocol
from uuid import UUID

import httpx

from app.core.config import Settings
from app.core.http_errors import ConfigurationError

JobStatus = Literal["queued", "running", "cancel_requested", "cancelled", "completed", "failed"]


@dataclass(slots=True)
class JobRecord:
    id: UUID
    entity_id: UUID
    payload: dict[str, Any]
    attempt_count: int
    max_attempts: int


class JobRepository(Protocol):
    async def claim_next_scout_scan(self, worker_id: str) -> JobRecord | None:
        ...

    async def fail_scout_scan(
        self,
        job_id: UUID,
        scan_id: UUID,
        error_code: str,
        error_message: str,
    ) -> None:
        ...


class SupabaseJobRepository:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def claim_next_scout_scan(self, worker_id: str) -> JobRecord | None:
        async with self._client() as client:
            response = await client.get(
                "/rest/v1/jobs",
                params={
                    "select": "id,entity_id,payload,attempt_count,max_attempts",
                    "job_type": "eq.scout.scan",
                    "status": "eq.queued",
                    "order": "priority.asc,available_at.asc,created_at.asc",
                    "limit": "1",
                },
            )
            response.raise_for_status()
            payload = response.json()

            if not payload:
                return None

            record = self._to_job_record(payload[0])
            now = datetime.now(UTC)

            claim_response = await client.patch(
                "/rest/v1/jobs",
                params={"id": f"eq.{record.id}", "status": "eq.queued"},
                headers={"Prefer": "return=representation"},
                json={
                    "status": "running",
                    "attempt_count": record.attempt_count + 1,
                    "locked_by": worker_id,
                    "locked_until": (now + timedelta(minutes=10)).isoformat(),
                    "heartbeat_at": now.isoformat(),
                    "started_at": now.isoformat(),
                    "updated_at": now.isoformat(),
                },
            )
            claim_response.raise_for_status()
            claimed_payload = claim_response.json()

            if not claimed_payload:
                return None

            await self._mark_scan_running(client=client, scan_id=record.entity_id, now=now)
            await self._write_event(
                client=client,
                job_id=record.id,
                event_type="worker.claimed",
                level="info",
                message="La tache Scout a ete reservee par un worker.",
                details={"worker_id": worker_id},
            )

        return self._to_job_record(claimed_payload[0])

    async def fail_scout_scan(
        self,
        job_id: UUID,
        scan_id: UUID,
        error_code: str,
        error_message: str,
    ) -> None:
        now = datetime.now(UTC)

        async with self._client() as client:
            job_response = await client.patch(
                "/rest/v1/jobs",
                params={"id": f"eq.{job_id}"},
                json={
                    "status": "failed",
                    "finished_at": now.isoformat(),
                    "locked_by": None,
                    "locked_until": None,
                    "heartbeat_at": now.isoformat(),
                    "error_code": error_code,
                    "error_message": error_message,
                    "updated_at": now.isoformat(),
                },
            )
            job_response.raise_for_status()

            scan_response = await client.patch(
                "/rest/v1/scans",
                params={"id": f"eq.{scan_id}"},
                json={
                    "status": "failed",
                    "error_code": error_code,
                    "error_message": error_message,
                    "updated_at": now.isoformat(),
                },
            )
            scan_response.raise_for_status()

            await self._write_event(
                client=client,
                job_id=job_id,
                event_type="worker.failed",
                level="error",
                message=error_message,
                details={"error_code": error_code},
            )

    def _client(self) -> httpx.AsyncClient:
        url = self._settings.supabase_url
        service_role_key = self._settings.supabase_service_role_key

        if not url:
            raise ConfigurationError(
                code="supabase_url_missing",
                message="SUPABASE_URL doit etre configure pour traiter les taches Scout.",
            )

        if not service_role_key:
            raise ConfigurationError(
                code="supabase_service_role_key_missing",
                message=(
                    "SUPABASE_SERVICE_ROLE_KEY doit etre configure pour traiter "
                    "les taches Scout."
                ),
            )

        return httpx.AsyncClient(
            base_url=url.rstrip("/"),
            headers={
                "apikey": service_role_key,
                "Authorization": f"Bearer {service_role_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            timeout=20.0,
        )

    @staticmethod
    async def _mark_scan_running(
        client: httpx.AsyncClient,
        scan_id: UUID,
        now: datetime,
    ) -> None:
        response = await client.patch(
            "/rest/v1/scans",
            params={"id": f"eq.{scan_id}"},
            json={"status": "running", "updated_at": now.isoformat()},
        )
        response.raise_for_status()

    @staticmethod
    async def _write_event(
        client: httpx.AsyncClient,
        job_id: UUID,
        event_type: str,
        level: Literal["debug", "info", "warning", "error"],
        message: str,
        details: dict[str, Any],
    ) -> None:
        response = await client.post(
            "/rest/v1/job_events",
            json={
                "job_id": str(job_id),
                "event_type": event_type,
                "level": level,
                "message": message,
                "details": details,
            },
        )
        response.raise_for_status()

    @staticmethod
    def _to_job_record(item: dict[str, Any]) -> JobRecord:
        return JobRecord(
            id=UUID(str(item["id"])),
            entity_id=UUID(str(item["entity_id"])),
            payload=dict(item["payload"]),
            attempt_count=int(item["attempt_count"]),
            max_attempts=int(item["max_attempts"]),
        )
