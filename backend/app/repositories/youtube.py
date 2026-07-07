from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

import httpx

from app.core.config import Settings
from app.core.http_errors import ConfigurationError
from app.services.youtube import YouTubeCollection


@dataclass(slots=True)
class ScanVideoRecord:
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


class YouTubeStorageRepository(Protocol):
    async def store_scan_collection(self, scan_id: UUID, collection: YouTubeCollection) -> None:
        ...

    async def list_scan_videos(self, scan_id: UUID) -> list[ScanVideoRecord]:
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

    async def list_scan_videos(self, scan_id: UUID) -> list[ScanVideoRecord]:
        async with self._client() as client:
            response = await client.get(
                "/rest/v1/scan_videos",
                params={
                    "select": (
                        "rank,video_id,"
                        "youtube_videos("
                        "title,channel_id,view_count,like_count,comment_count,"
                        "published_at,thumbnail_url,"
                        "youtube_channels(title)"
                        ")"
                    ),
                    "scan_id": f"eq.{scan_id}",
                    "order": "rank.asc",
                },
            )
            response.raise_for_status()
            payload = response.json()

        return [self._to_scan_video_record(item) for item in payload]

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

    @staticmethod
    def _to_scan_video_record(item: dict[str, object]) -> ScanVideoRecord:
        video = item["youtube_videos"]

        if not isinstance(video, dict):
            raise ValueError("scan_videos payload is missing youtube_videos")

        channel = video.get("youtube_channels", {})

        if not isinstance(channel, dict):
            channel = {}

        return ScanVideoRecord(
            rank=int(item["rank"]),
            video_id=str(item["video_id"]),
            title=str(video["title"]),
            channel_id=str(video["channel_id"]),
            channel_title=str(channel.get("title", "")),
            view_count=(
                int(video["view_count"]) if video.get("view_count") is not None else None
            ),
            like_count=(
                int(video["like_count"]) if video.get("like_count") is not None else None
            ),
            comment_count=(
                int(video["comment_count"]) if video.get("comment_count") is not None else None
            ),
            published_at=(
                str(video["published_at"]) if video.get("published_at") is not None else None
            ),
            thumbnail_url=(
                str(video["thumbnail_url"]) if video.get("thumbnail_url") is not None else None
            ),
        )
