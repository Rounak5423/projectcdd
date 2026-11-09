"""
Authoritative Disaster & Weather API Routes
Provides endpoints for monitoring, triggering, containing, and resolving natural disasters and weather events.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import json
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from db.database import get_db_connection

router = APIRouter(tags=["Disasters & Weather"])


def _resolve_world_id(world_id: str) -> str:
    if world_id in ["civ-aurora-01", "civ-default", "prime", "default"]:
        return "aurora-prime"
    return world_id


class DisasterTriggerRequest(BaseModel):
    type: str = Field(..., description="e.g. earthquake, wildfire, flood, solar_storm, tornado")
    name: Optional[str] = None
    intensity: str = Field(default="moderate", description="minor, moderate, high, critical")
    epicenter_x: float = Field(default=0.0)
    epicenter_z: float = Field(default=0.0)
    radius: float = Field(default=40.0)
    duration_days: int = Field(default=14)


class DisasterContainRequest(BaseModel):
    containment_delta: float = Field(default=25.0, ge=1.0, le=100.0)


@router.get("/worlds/{id}/disasters")
def get_world_disasters(id: str):
    world_id = _resolve_world_id(id)
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT * FROM disasters WHERE world_id = ? ORDER BY created_at DESC",
        (world_id,)
    ).fetchall()
    conn.close()

    return {
        "world_id": world_id,
        "disasters": [dict(r) for r in rows],
        "active_disasters": [dict(r) for r in rows if r["stage"] in ["active", "containing"]]
    }


@router.get("/worlds/{id}/weather")
def get_world_weather(id: str):
    world_id = _resolve_world_id(id)
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM weather_state WHERE world_id = ?", (world_id,)).fetchone()
    conn.close()

    if not row:
        return {
            "world_id": world_id,
            "temperature_c": 22.0,
            "weather_condition": "clear",
            "wind_speed_kph": 12.0,
            "precipitation_pct": 0.0,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

    return dict(row)


@router.post("/worlds/{id}/disasters/trigger")
def trigger_world_disaster(id: str, req: DisasterTriggerRequest):
    world_id = _resolve_world_id(id)
    conn = get_db_connection()
    world = conn.execute("SELECT * FROM worlds WHERE id = ?", (world_id,)).fetchone()
    if not world:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")

    disaster_id = f"dis_{uuid.uuid4().hex[:8]}"
    name = req.name or f"{req.type.capitalize()} Alpha"
    now_str = datetime.now(timezone.utc).isoformat()

    with conn:
        conn.execute("""
        INSERT INTO disasters (
            id, world_id, type, name, intensity, stage, epicenter_x, epicenter_z,
            radius, duration_days, elapsed_days, containment_percent, casualties_count,
            economic_damage_credits, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, 0, 0.0, 0, 0.0, ?, ?)
        """, (
            disaster_id, world_id, req.type, name, req.intensity,
            req.epicenter_x, req.epicenter_z, req.radius, req.duration_days,
            now_str, now_str
        ))

        # Log event in events table
        conn.execute("""
        INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
        SELECT 'evt_' || hex(randomblob(4)), id, year, day, 'Disaster Alert: ' || ?, 'disaster', ?, datetime('now')
        FROM worlds WHERE id = ?
        """, (name, f"Emergency Alert: {req.intensity.capitalize()} {req.type} struck near coordinates ({req.epicenter_x}, {req.epicenter_z}).", world_id))

    conn.close()
    return {
        "status": "triggered",
        "disaster_id": disaster_id,
        "world_id": world_id,
        "type": req.type,
        "name": name,
        "intensity": req.intensity
    }


@router.post("/worlds/{id}/disasters/{disaster_id}/contain")
def contain_world_disaster(id: str, disaster_id: str, req: DisasterContainRequest):
    world_id = _resolve_world_id(id)
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM disasters WHERE id = ? AND world_id = ?", (disaster_id, world_id)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Disaster not found")

    new_containment = min(100.0, float(row["containment_percent"]) + req.containment_delta)
    new_stage = "resolved" if new_containment >= 100.0 else "containing"
    now_str = datetime.now(timezone.utc).isoformat()

    with conn:
        conn.execute("""
        UPDATE disasters
        SET containment_percent = ?, stage = ?, updated_at = ?
        WHERE id = ? AND world_id = ?
        """, (new_containment, new_stage, now_str, disaster_id, world_id))

    conn.close()
    return {
        "status": "contained",
        "disaster_id": disaster_id,
        "containment_percent": new_containment,
        "stage": new_stage
    }


@router.post("/worlds/{id}/disasters/{disaster_id}/clear")
def clear_world_disaster(id: str, disaster_id: str):
    world_id = _resolve_world_id(id)
    conn = get_db_connection()
    now_str = datetime.now(timezone.utc).isoformat()
    with conn:
        conn.execute("""
        UPDATE disasters
        SET stage = 'resolved', containment_percent = 100.0, updated_at = ?
        WHERE id = ? AND world_id = ?
        """, (now_str, disaster_id, world_id))
    conn.close()
    return {"status": "resolved", "disaster_id": disaster_id}
