"""
CIVORA — Performance Monitoring Diagnostics Router
Exposes developer diagnostics endpoints for the Developer Performance Dashboard.
"""

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from typing import Dict, Any, Optional

from monitoring.collector import perf_collector

router = APIRouter(prefix="/diagnostics", tags=["Performance Diagnostics"])


class ToggleMonitoringPayload(BaseModel):
    enabled: bool


@router.get("/metrics")
async def get_performance_metrics():
    """
    Returns complete real-time performance telemetry snapshot
    encompassing API, DB, Simulation, AI and WebSocket subsystems.
    """
    return perf_collector.get_metrics_snapshot()


@router.post("/toggle")
async def toggle_monitoring(payload: ToggleMonitoringPayload):
    """Enables or disables performance monitoring at runtime."""
    perf_collector.set_enabled(payload.enabled)
    return {
        "status": "success",
        "monitoring_enabled": perf_collector.is_enabled
    }


@router.post("/reset")
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
