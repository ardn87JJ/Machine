from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import Settings, get_settings

router = APIRouter(tags=["system"])


class SystemStatus(BaseModel):
    name: str
    environment: str
    status: Literal["ok"]
    version: str


@router.get("/status", response_model=SystemStatus)
async def read_system_status() -> SystemStatus:
    settings: Settings = get_settings()
    return SystemStatus(
        name=settings.app_name,
        environment=settings.app_env,
        status="ok",
        version=settings.app_version,
    )
