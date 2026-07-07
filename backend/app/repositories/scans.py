from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Protocol
from uuid import UUID, uuid4

import httpx

from app.core.config import Settings
from app.core.http_errors import ConfigurationError

ScanStatus = Literal["queued", "running", "cancel_requested", "cancelled", "completed", "failed"]


@dataclass(slots=True)
class ScanRecord:
    id: UUID
    platform: Literal["youtube"]
    keyword: str
    status: ScanStatus
    error_code: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class CreateScanInput:
    platform: Literal["youtube"]
    keyword: str


class ScanRepository(Protocol):
    async def list_recent(self, limit: int = 20) -> list[ScanRecord]:
        ...

    async def create(self, scan: CreateScanInput) -> ScanRecord:
        ...


class SupabaseScanRepository:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def list_recent(self, limit: int = 20) -> list[ScanRecord]:
        async with self._client() as client:
            response = await client.get(
                "/rest/v1/scans",
                params={
                    "select": ",".join(
                        [
                            "id",
                            "platform",
                            "keyword",
                            "status",
                            "error_code",
                            "error_message",
                            "created_at",
                            "updated_at",
                        ],
                    ),
                    "order": "created_at.desc",
                    "limit": str(limit),
                },
            )
            response.raise_for_status()
            payload = response.json()

        return [self._to_scan_record(item) for item in payload]

    async def create(self, scan: CreateScanInput) -> ScanRecord:
        scan_id = str(uuid4())
        idempotency_key = f"scout-scan:{scan_id}"

        async with self._client() as client:
            scan_response = await client.post(
                "/rest/v1/scans",
                headers={"Prefer": "return=representation"},
                json={
                    "id": scan_id,
                    "platform": scan.platform,
                    "keyword": scan.keyword,
                    "status": "queued",
                },
            )
            scan_response.raise_for_status()
            payload = scan_response.json()

            try:
                job_response = await client.post(
                    "/rest/v1/jobs",
                    headers={"Prefer": "return=representation"},
                    json={
                        "job_type": "scout.scan",
                        "entity_type": "scan",
                        "entity_id": scan_id,
                        "idempotency_key": idempotency_key,
                        "payload": {
                            "scan_id": scan_id,
                            "platform": scan.platform,
                            "keyword": scan.keyword,
                        },
                    },
                )
                job_response.raise_for_status()
            except httpx.HTTPError as error:
                await self._mark_failed(
                    client=client,
                    scan_id=scan_id,
                    error_code="queue_insert_failed",
                    error_message="Impossible de creer la tache associee au scan.",
                )
                raise error

        return self._to_scan_record(payload[0])

    def _client(self) -> httpx.AsyncClient:
        url = self._settings.supabase_url
        service_role_key = self._settings.supabase_service_role_key

        if not url:
            raise ConfigurationError(
                code="supabase_url_missing",
                message="SUPABASE_URL doit etre configure pour creer ou lire des scans.",
            )

        if not service_role_key:
            raise ConfigurationError(
                code="supabase_service_role_key_missing",
                message=(
                    "SUPABASE_SERVICE_ROLE_KEY doit etre configure pour creer "
                    "ou lire des scans."
                ),
            )

        base_url = f"{url.rstrip('/')}"

        return httpx.AsyncClient(
            base_url=base_url,
            headers={
                "apikey": service_role_key,
                "Authorization": f"Bearer {service_role_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            timeout=20.0,
        )

    async def _mark_failed(
        self,
        client: httpx.AsyncClient,
        scan_id: str,
        error_code: str,
        error_message: str,
    ) -> None:
        response = await client.patch(
            "/rest/v1/scans",
            params={"id": f"eq.{scan_id}"},
            json={
                "status": "failed",
                "error_code": error_code,
                "error_message": error_message,
            },
        )
        response.raise_for_status()

    @staticmethod
    def _to_scan_record(item: dict[str, object]) -> ScanRecord:
        return ScanRecord(
            id=UUID(str(item["id"])),
            platform=str(item["platform"]),  # type: ignore[arg-type]
            keyword=str(item["keyword"]),
            status=str(item["status"]),  # type: ignore[arg-type]
            error_code=str(item["error_code"]) if item["error_code"] is not None else None,
            error_message=str(item["error_message"]) if item["error_message"] is not None else None,
            created_at=datetime.fromisoformat(str(item["created_at"]).replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(str(item["updated_at"]).replace("Z", "+00:00")),
        )
