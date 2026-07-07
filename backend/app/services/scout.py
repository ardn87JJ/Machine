from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.repositories.scans import CreateScanInput, ScanRepository
from app.repositories.youtube import ScanVideoRecord, YouTubeStorageRepository


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


class ScanVideoSummary(BaseModel):
    rank: int
    video_id: str
    title: str
    channel_id: str
    channel_title: str
    view_count: int | None
    like_count: int | None
    comment_count: int | None
    published_at: str | None
    thumbnail_url: str | None


class ListScanVideosResponse(BaseModel):
    videos: list[ScanVideoSummary]


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


async def list_scan_videos(
    scan_id: UUID,
    repository: YouTubeStorageRepository,
) -> ListScanVideosResponse:
    videos = await repository.list_scan_videos(scan_id=scan_id)
    return ListScanVideosResponse(videos=[_to_scan_video_summary(video) for video in videos])


def _to_scan_video_summary(video: ScanVideoRecord) -> ScanVideoSummary:
    return ScanVideoSummary(
        rank=video.rank,
        video_id=video.video_id,
        title=video.title,
        channel_id=video.channel_id,
        channel_title=video.channel_title,
        view_count=video.view_count,
        like_count=video.like_count,
        comment_count=video.comment_count,
        published_at=video.published_at,
        thumbnail_url=video.thumbnail_url,
    )
