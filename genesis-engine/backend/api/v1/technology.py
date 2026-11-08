import json
import math
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from db.database import get_db_connection
from engine.models_v1 import (
    TechnologyNode,
    TechResearchRequest,
    TechnologyOverviewResponse,
    EurekaBoostResponse,
)
from engine.technology_engine import (
    seed_civilization_technologies,
    ensure_tech_table_columns,
    get_world_science_rate,
    format_technology_row,
    trigger_eureka,
    set_active_research,
)

router = APIRouter(tags=["Technology & Research"])


@router.get("/worlds/{id}/technology", response_model=List[TechnologyNode])
async def get_technology_tree(id: str):
    """
    Returns the full civilisation technology tree including Civ VI eras, Eureka boost statuses,
    prerequisites, turns remaining, and unlocked capabilities.
    """
    conn = get_db_connection()
    # Auto-seed Civ paradigms if world has none
    seed_civilization_technologies(conn, id)
    science_per_turn = get_world_science_rate(conn, id)

    rows = conn.execute(
        "SELECT * FROM technologies WHERE world_id = ? ORDER BY level ASC, rowid ASC",
        (id,)
    ).fetchall()
    conn.close()

    result = []
    for r in rows:
        data = format_technology_row(r, science_per_turn)
        result.append(TechnologyNode(**data))
    return result


@router.get("/worlds/{id}/technology/overview", response_model=TechnologyOverviewResponse)
async def get_technology_overview(id: str):
    """
    Returns high-level civilisation research overview: active paradigm, science throughput (+36.0/ST),
    turns remaining, era progression, and full catalog.
    """
    conn = get_db_connection()
    seed_civilization_technologies(conn, id)
    science_per_turn = get_world_science_rate(conn, id)

    rows = conn.execute(
        "SELECT * FROM technologies WHERE world_id = ? ORDER BY level ASC, rowid ASC",
        (id,)
    ).fetchall()

    tech_nodes: List[TechnologyNode] = []
    active_tech: Optional[TechnologyNode] = None
    unlocked_count = 0
    highest_era = "Foundational"
    era_order = ["Foundational", "Industrial", "Digital", "Synthetic / AI"]

    for r in rows:
        formatted = format_technology_row(r, science_per_turn)
        node = TechnologyNode(**formatted)
        tech_nodes.append(node)

        if node.is_unlocked:
            unlocked_count += 1
            if node.era and node.era in era_order and era_order.index(node.era) > era_order.index(highest_era):
                highest_era = node.era

        if node.is_researching:
            active_tech = node

    conn.close()

    turns_rem = active_tech.turns if active_tech and active_tech.turns else 0

    return TechnologyOverviewResponse(
        world_id=id,
        science_per_turn=science_per_turn,
        active_technology=active_tech,
        turns_remaining=turns_rem,
        unlocked_count=unlocked_count,
        total_technologies=len(tech_nodes),
        current_era=highest_era,
        technologies=tech_nodes
    )


@router.post("/worlds/{id}/technology/research", response_model=TechnologyNode)
async def start_research(id: str, req: TechResearchRequest):
    """
    Sets the active research project for the civilisation.
    Validates prerequisite unlocking dependencies before commencing research.
    """
    conn = get_db_connection()
    seed_civilization_technologies(conn, id)

    tech = conn.execute(
        "SELECT * FROM technologies WHERE world_id = ? AND id = ?",
        (id, req.technology_id)
    ).fetchone()

    if not tech:
        conn.close()
        raise HTTPException(
            status_code=404,
            detail=f"Technology '{req.technology_id}' not found in world '{id}'"
        )

    if tech["is_unlocked"]:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail=f"Technology '{tech['name']}' is already unlocked"
        )

    # Validate prerequisites if present
    prereqs = json.loads(tech["prerequisites"] or "[]") if "prerequisites" in tech.keys() else []
    if prereqs:
        placeholders = ",".join("?" for _ in prereqs)
        unlocked_prereqs = conn.execute(
            f"SELECT id FROM technologies WHERE world_id = ? AND id IN ({placeholders}) AND is_unlocked = 1",
            [id] + prereqs
        ).fetchall()
        unlocked_set = {r["id"] for r in unlocked_prereqs}
        missing = [p for p in prereqs if p not in unlocked_set]
        if missing:
            conn.close()
            raise HTTPException(
                status_code=400,
                detail=f"Cannot research '{tech['name']}': Missing unlocked prerequisites ({', '.join(missing)})"
            )

    try:
        updated_dict = set_active_research(conn, id, req.technology_id)
    except ValueError as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

    conn.close()
    return TechnologyNode(**updated_dict)


@router.post("/worlds/{id}/technologies/{tech_id}/unlock")
async def queue_research_alias(id: str, tech_id: str):
    """
    API compatibility route for frontend civilizationApi.queueResearch(civId, techId).
    Sets the specified technology as active research.
    """
    conn = get_db_connection()
    seed_civilization_technologies(conn, id)

    tech = conn.execute(
        "SELECT * FROM technologies WHERE world_id = ? AND id = ?",
        (id, tech_id)
    ).fetchone()

    if not tech:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Technology '{tech_id}' not found")

    try:
        updated_dict = set_active_research(conn, id, tech_id)
    except ValueError as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))

    conn.close()
    return {
        "success": True,
        "techId": tech_id,
        "status": "researching",
        "technology": updated_dict
    }


@router.post("/worlds/{id}/technology/{tech_id}/eureka", response_model=EurekaBoostResponse)
@router.post("/worlds/{id}/technologies/{tech_id}/eureka", response_model=EurekaBoostResponse)
async def trigger_technology_eureka(id: str, tech_id: str):
    """
    Triggers an instant 50% Eureka scientific breakthrough discount for the target technology.
    """
    conn = get_db_connection()
    seed_civilization_technologies(conn, id)

    try:
        result = trigger_eureka(conn, id, tech_id)
    except ValueError as e:
        conn.close()
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to trigger Eureka: {str(e)}")

    conn.close()
    return EurekaBoostResponse(
        success=result["success"],
        technology=TechnologyNode(**result["technology"]),
        turns_saved=result["turns_saved"],
        discount_applied=result["discount_applied"],
        message=result["message"]
    )


@router.post("/worlds/{id}/technology/{tech_id}/complete", response_model=TechnologyNode)
async def complete_technology_instantly(id: str, tech_id: str):
    """
    Instantly masters and unlocks the target technology.
    Applies civilization bonuses and records research breakthrough.
    """
    conn = get_db_connection()
    seed_civilization_technologies(conn, id)

    tech = conn.execute(
        "SELECT * FROM technologies WHERE world_id = ? AND id = ?",
        (id, tech_id)
    ).fetchone()

    if not tech:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Technology '{tech_id}' not found")

    cost = tech["cost_points"] if "cost_points" in tech.keys() and tech["cost_points"] else tech["research_cost"]

    with conn:
        conn.execute("""
        UPDATE technologies
        SET is_unlocked = 1,
            is_researching = 0,
            research_progress = ?
        WHERE world_id = ? AND id = ?
        """, (float(cost), id, tech_id))

        # Add event
        conn.execute("""
        INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
        VALUES (?, ?, 1, 1, ?, 'breakthrough', ?, datetime('now'))
        """, (
            f"evt_{uuid.uuid4().hex[:8]}",
            id,
            f"Paradigmatic Breakthrough: {tech['name']}",
            f"Civilisation has fully mastered and operationalised {tech['name']}."
        ))

    updated = conn.execute("SELECT * FROM technologies WHERE world_id = ? AND id = ?", (id, tech_id)).fetchone()
    conn.close()
    return TechnologyNode(**format_technology_row(updated))


@router.post("/worlds/{id}/technology/tick")
async def simulate_research_tick(id: str, science_boost: Optional[float] = None):
    """
    Simulates a scientific research cycle/turn for this world.
    Advances progress towards the currently researching technology.
    """
    conn = get_db_connection()
    seed_civilization_technologies(conn, id)
    science_per_turn = science_boost if science_boost is not None else get_world_science_rate(conn, id)

    active_tech = conn.execute(
        "SELECT * FROM technologies WHERE world_id = ? AND is_researching = 1",
        (id,)
    ).fetchone()

    if not active_tech:
        conn.close()
        return {
            "status": "idle",
            "message": "No active research project selected.",
            "science_available": science_per_turn
        }

    cost = float(active_tech["cost_points"] if "cost_points" in active_tech.keys() and active_tech["cost_points"] else active_tech["research_cost"])
    current_prog = float(active_tech["research_progress"] or 0.0)
    new_prog = current_prog + science_per_turn
    completed = False

    with conn:
        if new_prog >= cost:
            completed = True
            conn.execute("""
            UPDATE technologies
            SET research_progress = ?, is_unlocked = 1, is_researching = 0
            WHERE world_id = ? AND id = ?
            """, (cost, id, active_tech["id"]))

            conn.execute("""
            INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
            VALUES (?, ?, 1, 1, ?, 'breakthrough', ?, datetime('now'))
            """, (
                f"evt_{uuid.uuid4().hex[:8]}",
                id,
                f"Scientific Discovery: {active_tech['name']}",
                f"Research labs have completed study of {active_tech['name']}."
            ))
        else:
            conn.execute("""
            UPDATE technologies
            SET research_progress = ?
            WHERE world_id = ? AND id = ?
            """, (new_prog, id, active_tech["id"]))

    updated = conn.execute(
        "SELECT * FROM technologies WHERE world_id = ? AND id = ?",
        (id, active_tech["id"])
    ).fetchone()
    formatted = format_technology_row(updated, science_per_turn)
    conn.close()

    return {
        "status": "completed" if completed else "progressing",
        "progress_added": science_per_turn,
        "technology": formatted
    }
