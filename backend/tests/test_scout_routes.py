import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

import httpx

from app.api.dependencies import get_scan_repository
from app.core.http_errors import ConfigurationError
from app.main import app
from app.repositories.scans import CreateScanInput


@dataclass(slots=True)
class StubScanRecord:
    id: UUID
    platform: str
    keyword: str
    status: str
    error_code: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class StubScanRepository:
    def __init__(self) -> None:
        now = datetime(2026, 7, 5, 8, 0, tzinfo=UTC)
        self._records = [
            StubScanRecord(
                id=UUID("11111111-1111-1111-1111-111111111111"),
                platform="youtube",
                keyword="mini drama ia",
                status="queued",
                error_code=None,
                error_message=None,
                created_at=now,
                updated_at=now,
            )
        ]

    async def list_recent(self, limit: int = 20) -> list[StubScanRecord]:
        return self._records[:limit]

    async def create(self, scan: CreateScanInput) -> StubScanRecord:
        now = datetime(2026, 7, 5, 8, 30, tzinfo=UTC)
        record = StubScanRecord(
            id=UUID("22222222-2222-2222-2222-222222222222"),
            platform=scan.platform,
            keyword=scan.keyword,
            status="queued",
            error_code=None,
            error_message=None,
            created_at=now,
            updated_at=now,
        )
        self._records.insert(0, record)
        return record


class MisconfiguredScanRepository:
    async def list_recent(self, limit: int = 20) -> list[StubScanRecord]:
        raise ConfigurationError(
            code="supabase_url_missing",
            message="SUPABASE_URL doit etre configure pour creer ou lire des scans.",
        )

    async def create(self, scan: CreateScanInput) -> StubScanRecord:
        raise ConfigurationError(
            code="supabase_url_missing",
            message="SUPABASE_URL doit etre configure pour creer ou lire des scans.",
        )


async def get(path: str) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.get(path)


async def post(path: str, payload: dict[str, str]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=payload)


def test_list_scans() -> None:
    app.dependency_overrides[get_scan_repository] = lambda: StubScanRepository()

    response = asyncio.run(get("/api/v1/scout/scans"))

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "scans": [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "platform": "youtube",
                "keyword": "mini drama ia",
                "status": "queued",
                "error_code": None,
                "error_message": None,
                "created_at": "2026-07-05T08:00:00Z",
                "updated_at": "2026-07-05T08:00:00Z",
            }
        ]
    }


def test_create_scan_normalizes_keyword() -> None:
    repository = StubScanRepository()
    app.dependency_overrides[get_scan_repository] = lambda: repository

    response = asyncio.run(
        post("/api/v1/scout/scans", {"keyword": "  mini   drama   ia  "}),
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json() == {
        "scan": {
            "id": "22222222-2222-2222-2222-222222222222",
            "platform": "youtube",
            "keyword": "mini drama ia",
            "status": "queued",
            "error_code": None,
            "error_message": None,
            "created_at": "2026-07-05T08:30:00Z",
            "updated_at": "2026-07-05T08:30:00Z",
        }
    }


def test_list_scans_returns_structured_configuration_error() -> None:
    app.dependency_overrides[get_scan_repository] = lambda: MisconfiguredScanRepository()

    response = asyncio.run(get("/api/v1/scout/scans"))

    app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json() == {
        "detail": {
            "code": "supabase_url_missing",
            "message": "SUPABASE_URL doit etre configure pour creer ou lire des scans.",
        }
    }
