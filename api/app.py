"""FastAPI Backend Application for Genesis Civilisation Simulator."""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from genesis.core.civilisation import CivilisationConfig
from genesis.core.engine import SimulationEngine
from genesis.core.scenarios import ScenarioType
from genesis.api.schemas import (
    CreateCivilisationRequest,
    RunSimulationRequest,
    GodPowerRequest,
    TriggerScenarioRequest,
    CitizenSummary,
    CitizenDetail,
    MemoryItemDTO,
)
from genesis.knowledge.database import get_default_knowledge_registry

app = FastAPI(
    title="GENESIS — The Artificial Civilisation Engine",
    description="AI-powered multi-agent civilisation simulation platform & game engine.",
    version="1.1.0",
)

# Global in-memory active simulation engine
_default_config = CivilisationConfig(name="Mesopotamia Prime", initial_population=20, seed=42)
active_engine: SimulationEngine = SimulationEngine(config=_default_config)
knowledge_registry = get_default_knowledge_registry()

# Static files path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
STATIC_DIR = BASE_DIR / "static"


@app.get("/", include_in_schema=False)
def get_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Genesis API Gateway running. Web interface files not found in /static."}


@app.post("/api/civilisation/create")
def create_civilisation(req: CreateCivilisationRequest):
    """Instantiates a new experimental civilisation simulation."""
    global active_engine
    config = CivilisationConfig(
        name=req.name,
        initial_population=req.initial_population,
        intelligence_mean=req.intelligence_mean,
        intelligence_std_dev=req.intelligence_std_dev,
        climate=req.climate,
        social_structure=req.social_structure,
        starting_tech_level=req.starting_tech_level,
        seed=req.seed,
    )
    active_engine = SimulationEngine(config=config, knowledge_registry=knowledge_registry)
    return {
        "status": "success",
        "message": f"Civilisation '{config.name}' created with seed {config.seed}.",
        "config": config.model_dump(),
    }


@app.get("/api/civilisation/overview")
def get_overview():
    """Returns high-level snapshot of current simulation and game state."""
    latest_snap = active_engine.metrics.get_latest()
    if not latest_snap:
        unlocked = [
            knowledge_registry.get(tid).title
            for tid in active_engine.unlocked_technologies
            if knowledge_registry.get(tid)
        ]
        latest_snap = active_engine.metrics.capture_tick(
            tick=active_engine.current_tick,
            citizens=list(active_engine.citizens.values()),
            environment=active_engine.environment,
            governance=active_engine.governance,
            unlocked_knowledge_titles=unlocked,
            total_deaths=active_engine.total_deaths,
            total_births=active_engine.total_births,
        )

    # Active scenario summary if present
    scenario_info = None
    if active_engine.active_scenario:
        scenario_info = {
            "title": active_engine.active_scenario.title,
            "description": active_engine.active_scenario.description,
            "remaining_ticks": active_engine.active_scenario.remaining_ticks,
            "duration_ticks": active_engine.active_scenario.duration_ticks,
            "priority": active_engine.active_scenario.behavioral_priority,
            "story": active_engine.active_scenario.ai_story_narration,
        }

    return {
        "civilisation_name": active_engine.config.name,
        "seed": active_engine.config.seed,
        "current_tick": active_engine.current_tick,
        "climate": active_engine.config.climate.value,
        "social_structure": active_engine.config.social_structure.value,
        "governance_model": active_engine.governance.model_type.value,
        "prosperity_score": active_engine.prosperity_score,
        "civilisation_era": active_engine.civilisation_era,
        "active_scenario": scenario_info,
        "metrics": latest_snap.model_dump(),
    }


@app.post("/api/simulation/step")
def step_simulation():
    """Advances the simulation by exactly 1 tick."""
    snapshot = active_engine.step()
    return {"status": "success", "snapshot": snapshot.model_dump()}


@app.post("/api/simulation/run")
def run_simulation(req: RunSimulationRequest):
    """Advances the simulation synchronously by N ticks."""
    snapshots = active_engine.run(req.ticks)
    latest = snapshots[-1] if snapshots else None
    return {
        "status": "success",
        "ticks_executed": req.ticks,
        "current_tick": active_engine.current_tick,
        "latest_snapshot": latest.model_dump() if latest else None,
    }


@app.post("/api/simulation/reset")
def reset_simulation():
    """Resets the current civilisation back to tick 0 with initial seed."""
    global active_engine
    active_engine = SimulationEngine(config=active_engine.config, knowledge_registry=knowledge_registry)
    return {"status": "success", "message": "Simulation reset to tick 0."}


@app.post("/api/game/god-power")
def trigger_god_power(req: GodPowerRequest):
    """Executes a divine God Power intervention into the game."""
    power = req.power.lower().strip()
    if power == "rain":
        return active_engine.cast_rain_miracle()
    elif power == "feast":
        return active_engine.cast_feast_miracle()
    elif power == "eureka":
        return active_engine.cast_eureka_miracle()
    elif power == "sunshine":
        return active_engine.cast_sunshine_miracle()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown God Power '{req.power}'. Viable: rain, feast, eureka, sunshine.")


@app.post("/api/game/trigger-scenario")
def trigger_scenario(req: TriggerScenarioRequest):
    """Triggers an AI scenario or custom natural language crisis."""
    try:
        scen_type = ScenarioType(req.scenario_type.lower())
    except ValueError:
        scen_type = ScenarioType.CUSTOM

    scenario = active_engine.trigger_scenario(
        scenario_type=scen_type,
        custom_prompt=req.custom_prompt,
        duration=req.duration,
    )
    return {
        "status": "success",
        "scenario": scenario.model_dump(),
    }


@app.get("/api/simulation/telemetry")
def get_telemetry():
    """Returns the historical time-series of telemetry snapshots."""
    return [s.model_dump() for s in active_engine.metrics.get_history()]


@app.get("/api/citizens", response_model=List[CitizenSummary])
def list_citizens():
    """Lists all citizens with demographic, job title, emoji, and live thought indicators."""
    result = []
    for c in active_engine.citizens.values():
        mastered_count = sum(1 for m in c.knowledge_inventory.values() if m >= 1.0)
        result.append(
            CitizenSummary(
                id=c.id,
                name=c.name,
                avatar_emoji=c.avatar_emoji,
                job_title=c.job_title,
                current_thought=c.current_thought,
                age_years=c.age_years,
                alive=c.alive,
                cause_of_death=c.cause_of_death,
                intelligence=c.intelligence,
                health=round(c.needs.health, 1),
                hunger=round(c.needs.hunger, 1),
                thirst=round(c.needs.thirst, 1),
                fatigue=round(c.needs.fatigue, 1),
                current_action=c.current_action,
                inventory_food=round(c.inventory_food, 1),
                inventory_water=round(c.inventory_water, 1),
                mastered_knowledge_count=mastered_count,
            )
        )
    return result


@app.get("/api/citizens/{citizen_id}", response_model=CitizenDetail)
def get_citizen_detail(citizen_id: str):
    """Returns complete cognitive profile, memories, skills, and decisions for an agent."""
    citizen = active_engine.citizens.get(citizen_id)
    if not citizen:
        raise HTTPException(status_code=404, detail="Citizen not found.")

    recent_mems = [
        MemoryItemDTO(
            id=m.id,
            tick_created=m.tick_created,
            description=m.description,
            category=m.category,
            importance=round(m.importance, 2),
            emotional_valence=round(m.emotional_valence, 2),
        )
        for m in citizen.memory.memories.values()
    ]

    skills_dict = {name: rec.level for name, rec in citizen.skills.skills.items()}

    return CitizenDetail(
        id=citizen.id,
        name=citizen.name,
        avatar_emoji=citizen.avatar_emoji,
        job_title=citizen.job_title,
        current_thought=citizen.current_thought,
        age_years=citizen.age_years,
        alive=citizen.alive,
        cause_of_death=citizen.cause_of_death,
        intelligence=citizen.intelligence,
        personality={
            "openness": round(citizen.personality.openness, 2),
            "conscientiousness": round(citizen.personality.conscientiousness, 2),
            "extraversion": round(citizen.personality.extraversion, 2),
            "agreeableness": round(citizen.personality.agreeableness, 2),
            "neuroticism": round(citizen.personality.neuroticism, 2),
        },
        needs={
            "health": round(citizen.needs.health, 1),
            "hunger": round(citizen.needs.hunger, 1),
            "thirst": round(citizen.needs.thirst, 1),
            "fatigue": round(citizen.needs.fatigue, 1),
        },
        inventory={
            "food": round(citizen.inventory_food, 1),
            "water": round(citizen.inventory_water, 1),
            "wood": round(citizen.inventory_wood, 1),
            "stone": round(citizen.inventory_stone, 1),
        },
        current_action=citizen.current_action,
        skills=skills_dict,
        knowledge_inventory={kid: round(val, 2) for kid, val in citizen.knowledge_inventory.items()},
        recent_memories=recent_mems,
        decision_history=citizen.decision_history,
        learning_history=citizen.learning_history,
    )


@app.get("/api/knowledge")
def list_knowledge():
    """Returns structured 13-domain knowledge catalog with civilisational unlock status."""
    all_nodes = knowledge_registry.get_all()
    res = []
    for node in all_nodes:
        unlocked = node.knowledge_id in active_engine.unlocked_technologies
        res.append({
            "knowledge_id": node.knowledge_id,
            "domain": node.domain.value,
            "title": node.title,
            "description": node.description,
            "difficulty": node.difficulty,
            "prerequisites": node.prerequisites,
            "related_activity": node.related_activity,
            "related_skill": node.related_skill,
            "historical_context": node.historical_context,
            "is_unlocked": unlocked,
        })
    return res


@app.get("/api/governance")
def get_governance():
    """Returns governance regime policies and reserves."""
    gov = active_engine.governance
    return {
        "model_type": gov.model_type.value,
        "tax_rate": gov.tax_rate,
        "research_subsidy": gov.research_subsidy_multiplier,
        "public_food_reserve": round(gov.public_food_reserve, 1),
        "public_water_reserve": round(gov.public_water_reserve, 1),
    }


@app.get("/api/events")
def get_events():
    """Returns chronological event ledger."""
    return active_engine.event_log


# Mount static directory if available
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
