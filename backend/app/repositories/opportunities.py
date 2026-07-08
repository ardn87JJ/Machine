from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol
from uuid import UUID

import httpx

from app.core.config import Settings
from app.core.http_errors import ConfigurationError


@dataclass(slots=True)
class OpportunityUpsertInput:
    scan_id: UUID
    keyword: str
    title: str
    verdict: str
    model_version: str
    summary: str
    scores: dict[str, int]
    evidence_video_ids: list[str]
    competitor_channels: list[str]
    execution_plan: dict[str, str]
    source: str = "scout"


@dataclass(slots=True)
class OpportunityRecord:
    id: UUID
    scan_id: UUID
    keyword: str
    title: str
    verdict: str
    model_version: str
    summary: str
    scores: dict[str, int]
    evidence_video_ids: list[str]
    competitor_channels: list[str]
    execution_plan: dict[str, str]
    source: str
    created_at: datetime
    updated_at: datetime


class OpportunityRepository(Protocol):
    async def upsert(self, opportunity: OpportunityUpsertInput) -> OpportunityRecord:
        ...

    async def list_recent(self, limit: int = 20) -> list[OpportunityRecord]:
        ...


class SupabaseOpportunityRepository:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def upsert(self, opportunity: OpportunityUpsertInput) -> OpportunityRecord:
        async with self._client() as client:
            response = await client.post(
                "/rest/v1/opportunities",
                params={"on_conflict": "scan_id"},
                headers={"Prefer": "resolution=merge-duplicates,return=representation"},
                json={
                    "scan_id": str(opportunity.scan_id),
                    "keyword": opportunity.keyword,
                    "title": opportunity.title,
                    "verdict": opportunity.verdict,
                    "model_version": opportunity.model_version,
                    "summary": opportunity.summary,
                    "scores": opportunity.scores,
                    "evidence_video_ids": opportunity.evidence_video_ids,
                    "competitor_channels": opportunity.competitor_channels,
                    "execution_plan": opportunity.execution_plan,
                    "source": opportunity.source,
                },
            )
            response.raise_for_status()
            payload = response.json()

        return self._to_record(payload[0])

    async def list_recent(self, limit: int = 20) -> list[OpportunityRecord]:
        async with self._client() as client:
            try:
                response = await client.get(
                    "/rest/v1/opportunities",
                    params={
                        "select": ",".join(
                            [
                                "id",
                                "scan_id",
                                "keyword",
                                "title",
                                "verdict",
                                "model_version",
                                "summary",
                                "scores",
                                "evidence_video_ids",
                                "competitor_channels",
                                "execution_plan",
                                "source",
                                "created_at",
                                "updated_at",
                            ],
                        ),
                        "order": "created_at.desc",
                        "limit": str(limit),
                    },
                )
                response.raise_for_status()
            except httpx.HTTPStatusError as error:
                if is_missing_opportunities_table_error(error):
                    return []
                raise
            payload = response.json()

        return [self._to_record(item) for item in payload]

    def _client(self) -> httpx.AsyncClient:
        url = self._settings.supabase_url
        service_role_key = self._settings.supabase_service_role_key

        if not url:
            raise ConfigurationError(
                code="supabase_url_missing",
                message="SUPABASE_URL doit etre configure pour stocker les opportunites.",
            )

        if not service_role_key:
            raise ConfigurationError(
                code="supabase_service_role_key_missing",
                message=(
                    "SUPABASE_SERVICE_ROLE_KEY doit etre configure pour stocker "
                    "les opportunites."
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
    def _to_record(item: dict[str, object]) -> OpportunityRecord:
        return OpportunityRecord(
            id=UUID(str(item["id"])),
            scan_id=UUID(str(item["scan_id"])),
            keyword=str(item["keyword"]),
            title=str(item["title"]),
            verdict=str(item["verdict"]),
            model_version=str(item["model_version"]),
            summary=str(item["summary"]),
            scores={key: int(value) for key, value in dict(item["scores"]).items()},  # type: ignore[arg-type]
            evidence_video_ids=[str(value) for value in list(item["evidence_video_ids"])],
            competitor_channels=[str(value) for value in list(item["competitor_channels"])],
            execution_plan={key: str(value) for key, value in dict(item["execution_plan"]).items()},  # type: ignore[arg-type]
            source=str(item["source"]),
            created_at=datetime.fromisoformat(str(item["created_at"]).replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(str(item["updated_at"]).replace("Z", "+00:00")),
        )


def is_missing_opportunities_table_error(error: httpx.HTTPStatusError) -> bool:
    if error.response.status_code != 404:
        return False

    try:
        payload = error.response.json()
    except ValueError:
        return False

    return payload.get("code") == "PGRST205"
