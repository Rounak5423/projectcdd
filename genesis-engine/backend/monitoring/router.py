"""
CIVORA — Performance Monitoring Diagnostics Router
Exposes developer diagnostics endpoints for the Developer Performance Dashboard.
"""

from fastapi import APIRouter, HTTPException, Query, status, Header, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional

from monitoring.collector import perf_collector
from config import settings

router = APIRouter(prefix="/diagnostics", tags=["Performance Diagnostics"])


async def require_admin_in_production(authorization: Optional[str] = Header(None)):
    """In production mode, requires admin credentials to modify diagnostics state."""
    if settings.ENVIRONMENT == "production":
        from auth.security import get_current_user, get_current_admin
        user = get_current_user(authorization)
        get_current_admin(user)


class ToggleMonitoringPayload(BaseModel):
    enabled: bool


@router.get("/metrics")
async def get_performance_metrics():
    """
    Returns complete real-time performance telemetry snapshot
    encompassing API, DB, Simulation, AI and WebSocket subsystems.
    """
    return perf_collector.get_metrics_snapshot()


@router.post("/toggle", dependencies=[Depends(require_admin_in_production)])
async def toggle_monitoring(payload: ToggleMonitoringPayload):
    """Enables or disables performance monitoring at runtime."""
    perf_collector.set_enabled(payload.enabled)
    return {
        "status": "success",
        "monitoring_enabled": perf_collector.is_enabled
    }


@router.post("/reset", dependencies=[Depends(require_admin_in_production)])
async def reset_metrics():
    """Resets rolling telemetry buffers."""
    perf_collector.reset()
    return {
        "status": "success",
        "message": "Performance metrics buffers reset successfully."
    }


@router.get("/health")
async def diagnostics_health():
    """Lightweight health check for monitoring subsystem."""
    return {
        "status": "online",
        "subsystem": "CIVORA Performance Monitoring",
        "enabled": perf_collector.is_enabled,
    }

