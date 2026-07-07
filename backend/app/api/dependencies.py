from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.repositories.scans import ScanRepository, SupabaseScanRepository


def get_scan_repository(settings: Annotated[Settings, Depends(get_settings)]) -> ScanRepository:
    return SupabaseScanRepository(settings=settings)
