from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from db.database import get_db_connection
from engine.models_v1 import (
    ProgressionOverview, MissionRecord, AchievementRecord, EventRecord
)

router = APIRouter(tags=["Gamification & Progression"])


@router.get("/worlds/{id}/progression", response_model=ProgressionOverview)
async def get_progression(id: str):
    conn = get_db_connection()
    p = conn.execute("SELECT * FROM progression WHERE world_id = ?", (id,)).fetchone()
    conn.close()

    if not p:
        raise HTTPException(status_code=404, detail=f"Progression data for '{id}' not found")

    xp = p["xp"]
    level = p["level"]
    level_xp_step = 15000
    next_level_xp = level * level_xp_step
    current_level_base = (level - 1) * level_xp_step
    level_progress = max(0.0, min(100.0, ((xp - current_level_base) / float(level_xp_step)) * 100.0))

    return ProgressionOverview(
        world_id=id,
        xp=xp,
        level=level,
        title=p["title"] or f"Level {level} Civilisation",
        thriving_score=p["thriving_score"] or 0.80,
        grc_balance=p["grc_balance"] or 1000.0,
        xp_to_next_level=max(0, next_level_xp - xp),
        progress_percentage=round(level_progress, 1)
    )


@router.get("/worlds/{id}/missions", response_model=List[MissionRecord])
async def get_missions(id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM missions WHERE world_id = ?", (id,)).fetchall()
    conn.close()

    result = []
    for r in rows:
        pct = min(100.0, (r["current_value"] / max(1.0, r["target_value"])) * 100.0)
        result.append(MissionRecord(
            id=r["id"],
            world_id=r["world_id"],
            title=r["title"],
            description=r["description"],
            target_metric=r["target_metric"],
            target_value=r["target_value"],
            current_value=r["current_value"],
            is_completed=bool(r["is_completed"]),
            is_claimed=bool(r["is_claimed"]),
            reward_xp=r["reward_xp"],
            reward_grc=r["reward_grc"],
            progress_percentage=round(pct, 1)
        ))
    return result


@router.post("/worlds/{id}/missions/{mission_id}/claim", response_model=Dict[str, Any])
async def claim_mission(id: str, mission_id: str):
    conn = get_db_connection()
    m = conn.execute("SELECT * FROM missions WHERE world_id = ? AND id = ?", (id, mission_id)).fetchone()
    if not m:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Mission '{mission_id}' not found")

    if not m["is_completed"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Objective is not yet completed")

    if m["is_claimed"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Objective reward has already been claimed")

    reward_xp = m["reward_xp"]
    reward_grc = m["reward_grc"]

    with conn:
        conn.execute("UPDATE missions SET is_claimed = 1 WHERE world_id = ? AND id = ?", (id, mission_id))
        conn.execute("UPDATE progression SET xp = xp + ?, grc_balance = grc_balance + ? WHERE world_id = ?", (reward_xp, reward_grc, id))
        conn.execute("UPDATE economy_resources SET genesis_research_credits = genesis_research_credits + ? WHERE world_id = ?", (reward_grc, id))

    conn.close()

    return {
        "status": "claimed",
        "mission_id": mission_id,
        "reward_xp": reward_xp,
        "reward_grc": reward_grc,
        "message": f"Claimed {reward_xp} XP and {reward_grc} GRC credits!"
    }


@router.get("/worlds/{id}/achievements", response_model=List[AchievementRecord])
async def get_achievements(id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM achievements WHERE world_id = ?", (id,)).fetchall()
    conn.close()

    return [
        AchievementRecord(
            id=r["id"],
            world_id=r["world_id"],
            title=r["title"],
            description=r["description"],
            icon=r["icon"],
            is_unlocked=bool(r["is_unlocked"]),
            unlocked_at=r["unlocked_at"]
        )
        for r in rows
    ]


@router.get("/worlds/{id}/events", response_model=List[EventRecord])
async def get_recent_events(
    id: str,
    limit: int = Query(default=20, ge=1, le=100)
):
    conn = get_db_connection()
    rows = conn.execute("""
    SELECT * FROM events WHERE world_id = ? ORDER BY id DESC LIMIT ?
    """, (id, limit)).fetchall()
    conn.close()

    return [
        EventRecord(
            id=r["id"],
            world_id=r["world_id"],
            year=r["year"],
            day=r["day"],
            title=r["title"],
            category=r["category"],
            description=r["description"],
            created_at=r["created_at"]
        )
        for r in rows
    ]
