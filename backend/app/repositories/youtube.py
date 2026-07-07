from __future__ import annotations

from typing import Protocol
from uuid import UUID

import httpx

from app.core.config import Settings
from app.core.http_errors import ConfigurationError
from app.services.youtube import YouTubeCollection


class YouTubeStorageRepository(Protocol):
    async def store_scan_collection(self, scan_id: UUID, collection: YouTubeCollection) -> None:
        ...


class SupabaseYouTubeStorageRepository:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def store_scan_collection(self, scan_id: UUID, collection: YouTubeCollection) -> None:
        async with self._client() as client:
            if collection.channels:
                channel_response = await client.post(
                    "/rest/v1/youtube_channels",
                    params={"on_conflict": "id"},
                    headers={"Prefer": "resolution=merge-duplicates"},
                    json=[
                        {
                            "id": channel.id,
                            "title": channel.title,
                            "description": channel.description,
                            "published_at": channel.published_at,
                            "subscriber_count": channel.subscriber_count,
                            "video_count": channel.video_count,
                            "view_count": channel.view_count,
                            "thumbnail_url": channel.thumbnail_url,
                            "raw": channel.raw,
                        }
                        for channel in collection.channels
                    ],
                )
                channel_response.raise_for_status()

            if collection.videos:
                video_response = await client.post(
                    "/rest/v1/youtube_videos",
                    params={"on_conflict": "id"},
                    headers={"Prefer": "resolution=merge-duplicates"},
                    json=[
                        {
                            "id": video.id,
                            "channel_id": video.channel_id,
                            "title": video.title,
                            "description": video.description,
                            "published_at": video.published_at,
                            "duration": video.duration,
                            "view_count": video.view_count,
                            "like_count": video.like_count,
                            "comment_count": video.comment_count,
                            "thumbnail_url": video.thumbnail_url,
                            "raw": video.raw,
                        }
                        for video in collection.videos
                    ],
                )
                video_response.raise_for_status()

                link_response = await client.post(
                    "/rest/v1/scan_videos",
                    params={"on_conflict": "scan_id,video_id"},
                    headers={"Prefer": "resolution=merge-duplicates"},
                    json=[
                        {
                            "scan_id": str(scan_id),
                            "video_id": video.id,
                            "rank": collection.video_ranks[video.id],
                        }
                        for video in collection.videos
                    ],
                )
                link_response.raise_for_status()

    def _client(self) -> httpx.AsyncClient:
        url = self._settings.supabase_url
        service_role_key = self._settings.supabase_service_role_key

        if not url:
            raise ConfigurationError(
                code="supabase_url_missing",
                message="SUPABASE_URL doit etre configure pour stocker les resultats YouTube.",
            )

        if not service_role_key:
            raise ConfigurationError(
                code="supabase_service_role_key_missing",
                message=(
                    "SUPABASE_SERVICE_ROLE_KEY doit etre configure pour stocker "
                    "les resultats YouTube."
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
