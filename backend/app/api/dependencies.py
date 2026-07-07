from typing import Annotated

from fastapi import Depends

from app.core.config import Settings, get_settings
from app.repositories.scans import ScanRepository, SupabaseScanRepository
from app.repositories.youtube import SupabaseYouTubeStorageRepository, YouTubeStorageRepository


def get_scan_repository(settings: Annotated[Settings, Depends(get_settings)]) -> ScanRepository:
    return SupabaseScanRepository(settings=settings)


def get_youtube_repository(
    settings: Annotated[Settings, Depends(get_settings)],
) -> YouTubeStorageRepository:
    return SupabaseYouTubeStorageRepository(settings=settings)
