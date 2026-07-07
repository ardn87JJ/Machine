from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


class YouTubeApiError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(slots=True)
class YouTubeChannel:
    id: str
    title: str
    description: str
    published_at: str | None
    subscriber_count: int | None
    video_count: int | None
    view_count: int | None
    thumbnail_url: str | None
    raw: dict[str, Any]


@dataclass(slots=True)
class YouTubeVideo:
    id: str
    channel_id: str
    title: str
    description: str
    published_at: str | None
    duration: str | None
    view_count: int | None
    like_count: int | None
    comment_count: int | None
    thumbnail_url: str | None
    raw: dict[str, Any]


@dataclass(slots=True)
class YouTubeCollection:
    channels: list[YouTubeChannel]
    videos: list[YouTubeVideo]
    video_ranks: dict[str, int]


class YouTubeCollector:
    def __init__(self, api_key: str, max_results: int = 5) -> None:
        self._api_key = api_key
        self._max_results = max_results

    async def collect(self, keyword: str) -> YouTubeCollection:
        async with httpx.AsyncClient(
            base_url="https://www.googleapis.com/youtube/v3",
            timeout=20.0,
        ) as client:
            search_payload = await self._get_json(
                client,
                "/search",
                params={
                    "part": "snippet",
                    "q": keyword,
                    "type": "video",
                    "order": "relevance",
                    "maxResults": str(self._max_results),
                    "key": self._api_key,
                },
            )
            video_ranks = self._extract_video_ranks(search_payload)

            if not video_ranks:
                return YouTubeCollection(channels=[], videos=[], video_ranks={})

            videos_payload = await self._get_json(
                client,
                "/videos",
                params={
                    "part": "snippet,statistics,contentDetails",
                    "id": ",".join(video_ranks.keys()),
                    "key": self._api_key,
                },
            )
            videos = [self._to_video(item) for item in videos_payload.get("items", [])]

            channel_ids = sorted({video.channel_id for video in videos})
            channels_payload = await self._get_json(
                client,
                "/channels",
                params={
                    "part": "snippet,statistics",
                    "id": ",".join(channel_ids),
                    "key": self._api_key,
                },
            )
            channels = [self._to_channel(item) for item in channels_payload.get("items", [])]

        return YouTubeCollection(channels=channels, videos=videos, video_ranks=video_ranks)

    @staticmethod
    async def _get_json(
        client: httpx.AsyncClient,
        path: str,
        params: dict[str, str],
    ) -> dict[str, Any]:
        response = await client.get(path, params=params)

        if response.is_success:
            return dict(response.json())

        try:
            payload = response.json()
        except ValueError:
            payload = {}

        error = payload.get("error", {})
        message = error.get("message") if isinstance(error, dict) else None
        raise YouTubeApiError(
            code=f"youtube_http_{response.status_code}",
            message=message or f"YouTube a repondu avec le statut {response.status_code}.",
        )

    @staticmethod
    def _extract_video_ranks(payload: dict[str, Any]) -> dict[str, int]:
        ranks: dict[str, int] = {}

        for index, item in enumerate(payload.get("items", []), start=1):
            item_id = item.get("id", {})
            video_id = item_id.get("videoId") if isinstance(item_id, dict) else None

            if isinstance(video_id, str):
                ranks[video_id] = index

        return ranks

    @classmethod
    def _to_video(cls, item: dict[str, Any]) -> YouTubeVideo:
        snippet = item.get("snippet", {})
        statistics = item.get("statistics", {})
        content_details = item.get("contentDetails", {})

        return YouTubeVideo(
            id=str(item["id"]),
            channel_id=str(snippet["channelId"]),
            title=str(snippet.get("title", "")),
            description=str(snippet.get("description", "")),
            published_at=cls._optional_string(snippet.get("publishedAt")),
            duration=cls._optional_string(content_details.get("duration")),
            view_count=cls._optional_int(statistics.get("viewCount")),
            like_count=cls._optional_int(statistics.get("likeCount")),
            comment_count=cls._optional_int(statistics.get("commentCount")),
            thumbnail_url=cls._best_thumbnail_url(snippet),
            raw=item,
        )

    @classmethod
    def _to_channel(cls, item: dict[str, Any]) -> YouTubeChannel:
        snippet = item.get("snippet", {})
        statistics = item.get("statistics", {})

        return YouTubeChannel(
            id=str(item["id"]),
            title=str(snippet.get("title", "")),
            description=str(snippet.get("description", "")),
            published_at=cls._optional_string(snippet.get("publishedAt")),
            subscriber_count=cls._optional_int(statistics.get("subscriberCount")),
            video_count=cls._optional_int(statistics.get("videoCount")),
            view_count=cls._optional_int(statistics.get("viewCount")),
            thumbnail_url=cls._best_thumbnail_url(snippet),
            raw=item,
        )

    @staticmethod
    def _optional_int(value: object) -> int | None:
        if value is None:
            return None
        return int(value)

    @staticmethod
    def _optional_string(value: object) -> str | None:
        if value is None:
            return None
        return str(value)

    @staticmethod
    def _best_thumbnail_url(snippet: dict[str, Any]) -> str | None:
        thumbnails = snippet.get("thumbnails", {})

        if not isinstance(thumbnails, dict):
            return None

        for key in ("maxres", "standard", "high", "medium", "default"):
            thumbnail = thumbnails.get(key)
            if isinstance(thumbnail, dict) and isinstance(thumbnail.get("url"), str):
                return str(thumbnail["url"])

        return None
