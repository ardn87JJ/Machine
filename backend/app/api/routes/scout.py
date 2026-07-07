from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_scan_repository
from app.core.http_errors import ConfigurationError, configuration_http_exception
from app.repositories.scans import ScanRepository
from app.services.scout import (
    CreateScanRequest,
    CreateScanResponse,
    ListScansResponse,
    create_scan,
    list_scans,
)

router = APIRouter(prefix="/scout", tags=["scout"])


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
