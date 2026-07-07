from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.repositories.scans import CreateScanInput, ScanRepository


class ScanSummary(BaseModel):
    id: UUID
    platform: Literal["youtube"]
    keyword: str
    status: Literal[
        "queued",
        "running",
        "cancel_requested",
        "cancelled",
        "completed",
        "failed",
    ]
    error_code: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class CreateScanRequest(BaseModel):
    keyword: str = Field(min_length=2, max_length=120)
    platform: Literal["youtube"] = "youtube"

    @field_validator("keyword", mode="before")
    @classmethod
    def normalize_keyword_before_validation(cls, value: object) -> object:
        if isinstance(value, str):
            return normalize_keyword(value)
        return value


class CreateScanResponse(BaseModel):
    scan: ScanSummary


class ListScansResponse(BaseModel):
    scans: list[ScanSummary]


def normalize_keyword(keyword: str) -> str:
    return " ".join(keyword.split()).strip()


async def list_scans(repository: ScanRepository) -> ListScansResponse:
    scans = await repository.list_recent()
    return ListScansResponse(
        scans=[ScanSummary.model_validate(scan, from_attributes=True) for scan in scans],
    )


async def create_scan(
    request: CreateScanRequest,
    repository: ScanRepository,
) -> CreateScanResponse:
    normalized_keyword = normalize_keyword(request.keyword)
    scan = await repository.create(
        CreateScanInput(
            platform=request.platform,
            keyword=normalized_keyword,
        ),
    )
    return CreateScanResponse(scan=ScanSummary.model_validate(scan, from_attributes=True))
