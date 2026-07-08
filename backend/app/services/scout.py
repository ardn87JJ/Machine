from __future__ import annotations

import math
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.repositories.opportunities import OpportunityUpsertInput
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


class BusinessScores(BaseModel):
    money_score: int
    attack_score: int
    speed_cash_score: int
    quality_gap_score: int
    weak_competitor_score: int
    upload_pressure_score: int
    ecosystem_score: int
    confidence: int


class ScanAnalysisResponse(BaseModel):
    model_version: str
    opportunity_title: str
    verdict: Literal["GO", "WATCH", "SKIP"]
    scores: BusinessScores
    summary: str
    evidence_video_ids: list[str]
    competitor_channels: list[str]


class ExecutionPlanResponse(BaseModel):
    angle: str
    first_test: str
    criteria_go: str
    notes: str


class OpportunityResponse(BaseModel):
    id: UUID
    scan_id: UUID
    keyword: str
    title: str
    verdict: Literal["GO", "WATCH", "SKIP"]
    model_version: str
    summary: str
    scores: BusinessScores
    evidence_video_ids: list[str]
    competitor_channels: list[str]
    execution_plan: ExecutionPlanResponse
    source: str
    created_at: datetime
    updated_at: datetime


class ListOpportunitiesResponse(BaseModel):
    opportunities: list[OpportunityResponse]


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


def build_execution_plan(
    analysis: ScanAnalysisResponse,
    keyword: str,
) -> ExecutionPlanResponse:
    if analysis.verdict == "GO":
        angle = "Série verticale IA sur tension dramatique courte"
        first_test = f"Lancer 5 épisodes courts autour de {keyword} sur 7 jours"
        criteria_go = "Un épisode dépasse le benchmark de vues initial en 48h"
        notes = "Accélérer le hook, garder des formats courts, pousser le volume d'itérations."
    elif analysis.verdict == "WATCH":
        angle = "Observer et resserrer l'angle éditorial"
        first_test = f"Tester 3 hooks et 2 formulations de {keyword}"
        criteria_go = "Le score money et le score attack montent au-dessus de 70"
        notes = "Le marché est intéressant mais la préparation doit être affinée."
    else:
        angle = "Retirer cette piste du plan actif"
        first_test = f"Conserver {keyword} uniquement pour veille"
        criteria_go = "Réouverture si la concurrence baisse ou si les signaux montent"
        notes = "Ne pas investir de temps de production pour l'instant."

    return ExecutionPlanResponse(
        angle=angle,
        first_test=first_test,
        criteria_go=criteria_go,
        notes=notes,
    )


def build_opportunity_upsert_input(
    scan_id: UUID,
    keyword: str,
    analysis: ScanAnalysisResponse,
) -> OpportunityUpsertInput:
    execution_plan = build_execution_plan(analysis=analysis, keyword=keyword)

    return OpportunityUpsertInput(
        scan_id=scan_id,
        keyword=keyword,
        title=analysis.opportunity_title,
        verdict=analysis.verdict,
        model_version=analysis.model_version,
        summary=analysis.summary,
        scores=analysis.scores.model_dump(),
        evidence_video_ids=analysis.evidence_video_ids,
        competitor_channels=analysis.competitor_channels,
        execution_plan=execution_plan.model_dump(),
    )


async def analyze_scan(
    scan_id: UUID,
    repository: YouTubeStorageRepository,
) -> ScanAnalysisResponse:
    videos = await repository.list_scan_videos(scan_id=scan_id)
    return build_scan_analysis(videos)


def build_scan_analysis(videos: list[ScanVideoRecord]) -> ScanAnalysisResponse:
    total_views = sum(video.view_count or 0 for video in videos)
    average_views = total_views / len(videos) if videos else 0
    competitor_channels = sorted(
        {video.channel_title or video.channel_id for video in videos},
    )
    low_view_count = len([video for video in videos if (video.view_count or 0) < 30_000])
    high_view_count = len([video for video in videos if (video.view_count or 0) >= 50_000])

    scores = BusinessScores(
        money_score=_clamp_score(48 + _safe_log10(total_views) * 10),
        attack_score=_clamp_score(45 + low_view_count * 9 + len(competitor_channels) * 3),
        speed_cash_score=_clamp_score(42 + high_view_count * 13 + len(videos) * 2),
        quality_gap_score=_clamp_score(35 + low_view_count * 14),
        weak_competitor_score=_clamp_score(
            30 + low_view_count * 12 + (10 if len(competitor_channels) >= 4 else 0),
        ),
        upload_pressure_score=_clamp_score(55 + len(videos) * 5 - low_view_count * 3),
        ecosystem_score=_clamp_score(40 + len(competitor_channels) * 8 + high_view_count * 7),
        confidence=_clamp_score(35 + len(videos) * 8 + len(competitor_channels) * 4),
    )
    verdict: Literal["GO", "WATCH", "SKIP"] = "WATCH"

    if scores.money_score >= 70 and scores.attack_score >= 65 and scores.confidence >= 55:
        verdict = "GO"
    elif scores.money_score < 50 or scores.confidence < 40:
        verdict = "SKIP"

    return ScanAnalysisResponse(
        model_version="business-heuristic-v0.1",
        opportunity_title="Mini-drama IA vertical court",
        verdict=verdict,
        scores=scores,
        summary=(
            f"{round(average_views):,} vues moyennes sur {len(videos)} vidéos, "
            f"{len(competitor_channels)} chaînes observées, {low_view_count} quality gaps."
        ),
        evidence_video_ids=[video.video_id for video in videos[:5]],
        competitor_channels=competitor_channels[:8],
    )


def _clamp_score(value: float) -> int:
    return max(0, min(100, round(value)))


def _safe_log10(value: int) -> float:
    if value <= 0:
        return 0

    return math.log10(value)
