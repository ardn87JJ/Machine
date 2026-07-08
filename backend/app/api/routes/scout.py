from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.dependencies import (
    get_opportunity_repository,
    get_scan_repository,
    get_youtube_repository,
)
from app.core.http_errors import ConfigurationError, configuration_http_exception
from app.repositories.opportunities import OpportunityRepository
from app.repositories.scans import ScanRepository
from app.repositories.youtube import YouTubeStorageRepository
from app.services.scout import (
    BusinessScores,
    CreateScanRequest,
    CreateScanResponse,
    ExecutionPlanResponse,
    ListOpportunitiesResponse,
    ListScansResponse,
    ListScanVideosResponse,
    OpportunityResponse,
    ScanAnalysisResponse,
    analyze_scan,
    create_scan,
    list_scan_videos,
    list_scans,
)
from app.workers.scout import run_once as scout_worker_run_once

router = APIRouter(prefix="/scout", tags=["scout"])


class RunScoutWorkerResponse(BaseModel):
    status: str
    job_id: UUID | None
    scan_id: UUID | None
    error_code: str | None
    error_message: str | None


@router.get("/scans", response_model=ListScansResponse)
async def read_scans(
    repository: Annotated[ScanRepository, Depends(get_scan_repository)],
) -> ListScansResponse:
    try:
        return await list_scans(repository)
    except ConfigurationError as error:
        raise configuration_http_exception(error) from error


@router.post("/scans", response_model=CreateScanResponse, status_code=201)
async def create_scout_scan(
    repository: Annotated[ScanRepository, Depends(get_scan_repository)],
    request: CreateScanRequest,
) -> CreateScanResponse:
    try:
        return await create_scan(request=request, repository=repository)
    except ConfigurationError as error:
        raise configuration_http_exception(error) from error


@router.post("/worker/run-once", response_model=RunScoutWorkerResponse)
async def run_scout_worker_once() -> RunScoutWorkerResponse:
    try:
        result = await scout_worker_run_once()
    except ConfigurationError as error:
        raise configuration_http_exception(error) from error

    return RunScoutWorkerResponse(
        status=result.status,
        job_id=result.job_id,
        scan_id=result.scan_id,
        error_code=result.error_code,
        error_message=result.error_message,
    )


@router.get("/scans/{scan_id}/videos", response_model=ListScanVideosResponse)
async def read_scan_videos(
    repository: Annotated[YouTubeStorageRepository, Depends(get_youtube_repository)],
    scan_id: UUID,
) -> ListScanVideosResponse:
    try:
        return await list_scan_videos(scan_id=scan_id, repository=repository)
    except ConfigurationError as error:
        raise configuration_http_exception(error) from error


@router.get("/scans/{scan_id}/analysis", response_model=ScanAnalysisResponse)
async def read_scan_analysis(
    repository: Annotated[YouTubeStorageRepository, Depends(get_youtube_repository)],
    scan_id: UUID,
) -> ScanAnalysisResponse:
    try:
        return await analyze_scan(scan_id=scan_id, repository=repository)
    except ConfigurationError as error:
        raise configuration_http_exception(error) from error


@router.get("/opportunities", response_model=ListOpportunitiesResponse)
async def read_opportunities(
    repository: Annotated[OpportunityRepository, Depends(get_opportunity_repository)],
) -> ListOpportunitiesResponse:
    try:
        opportunities = await repository.list_recent()
    except ConfigurationError as error:
        raise configuration_http_exception(error) from error

    return ListOpportunitiesResponse(
        opportunities=[
            OpportunityResponse(
                id=opportunity.id,
                scan_id=opportunity.scan_id,
                keyword=opportunity.keyword,
                title=opportunity.title,
                verdict=opportunity.verdict,  # type: ignore[arg-type]
                model_version=opportunity.model_version,
                summary=opportunity.summary,
                scores=BusinessScores.model_validate(opportunity.scores),
                evidence_video_ids=opportunity.evidence_video_ids,
                competitor_channels=opportunity.competitor_channels,
                execution_plan=ExecutionPlanResponse.model_validate(opportunity.execution_plan),
                source=opportunity.source,
                created_at=opportunity.created_at,
                updated_at=opportunity.updated_at,
            )
            for opportunity in opportunities
        ],
    )
