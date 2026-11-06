import json
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from db.database import get_db_connection
from engine.models_v1 import TechnologyNode, TechResearchRequest

router = APIRouter(tags=["Technology & Research"])


@router.get("/worlds/{id}/technology", response_model=List[TechnologyNode])
async def get_technology_tree(id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM technologies WHERE world_id = ? ORDER BY level ASC", (id,)).fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append(TechnologyNode(
            id=r["id"],
            name=r["name"],
            category=r["category"],
            description="",
            level_required=r["level"],
            research_cost=r["research_cost"],
            research_progress=r["research_progress"],
            is_unlocked=bool(r["is_unlocked"]),
            is_researching=bool(r["is_researching"]),
            effects=json.loads(r["effects"] or "{}")
        ))
    return result


@router.post("/worlds/{id}/technology/research", response_model=TechnologyNode)
async def start_research(id: str, req: TechResearchRequest):
    conn = get_db_connection()
    tech = conn.execute("SELECT * FROM technologies WHERE world_id = ? AND id = ?", (id, req.technology_id)).fetchone()
    if not tech:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Technology '{req.technology_id}' not found in world '{id}'")

    if tech["is_unlocked"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Technology is already unlocked")

    with conn:
        # Pause any current research
        conn.execute("UPDATE technologies SET is_researching = 0 WHERE world_id = ?", (id,))
        # Set this technology as researching
        conn.execute("UPDATE technologies SET is_researching = 1 WHERE world_id = ? AND id = ?", (id, req.technology_id))

    row = conn.execute("SELECT * FROM technologies WHERE world_id = ? AND id = ?", (id, req.technology_id)).fetchone()
    conn.close()

    return TechnologyNode(
        id=row["id"],
        name=row["name"],
        category=row["category"],
        description="",
        level_required=row["level"],
        research_cost=row["research_cost"],
        research_progress=row["research_progress"],
        is_unlocked=bool(row["is_unlocked"]),
        is_researching=bool(row["is_researching"]),
        effects=json.loads(row["effects"] or "{}")
    )

