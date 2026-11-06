import asyncio
import json
import os
from typing import Dict, Set, Optional, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from engine.models import (
    WorldState, WorldCreationRequest, TickRequest, PolicyUpdateRequest,
    BranchRequest, CompareResponse
)
from engine.state import world_manager
from engine.simulation import step_world
from engine.simulation_v1 import seed_aurora_prime_if_not_exists, advance_world_simulation
from db.database import get_db_connection
from api.v1.router import api_v1_router

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))


class ConnectionManager:
    """Manages active WebSocket connections subscribed to world telemetry streams."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, world_id: str, websocket: WebSocket):
        await websocket.accept()
        if world_id not in self.active_connections:
            self.active_connections[world_id] = set()
        self.active_connections[world_id].add(websocket)

    def disconnect(self, world_id: str, websocket: WebSocket):
        if world_id in self.active_connections:
            self.active_connections[world_id].discard(websocket)
            if not self.active_connections[world_id]:
                del self.active_connections[world_id]

    async def broadcast(self, world_id: str, message: Dict[str, Any]):
        if world_id in self.active_connections:
            dead_connections = set()
            payload = json.dumps(message)
            for connection in list(self.active_connections[world_id]):
                try:
                    await connection.send_text(payload)
                except Exception:
                    dead_connections.add(connection)
            for dead in dead_connections:
                self.disconnect(world_id, dead)


ws_manager = ConnectionManager()
autotick_tasks: Dict[str, asyncio.Task] = {}


def serialize_world_state(world: WorldState, include_all_citizens: bool = True) -> Dict[str, Any]:
    """Helper to convert WorldState into JSON-serializable dictionary."""
    data = world.model_dump()
    if not include_all_citizens:
        # For lightweight delta streams, send a sample of citizens or aggregates
        data["citizens"] = [c for i, c in enumerate(data["citizens"]) if i < 30]
    return data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed persistent SQLite database with Aurora Prime
    seed_aurora_prime_if_not_exists()

    # Initialize default world on startup if empty
    if not world_manager.list_all():
        world_manager.create(
            name="Genesis Prime",
            population=120,
            grid_size=32,
            active_policies=["universal_ai"],
            world_id="prime"
        )
    yield
    # Cleanup background autotick tasks
    for task in autotick_tasks.values():
        task.cancel()


app = FastAPI(
    title="GENESIS Engine API",
    description="The Artificial Civilisation Engine - Discrete Simulation, AI Paradox Laboratory, Gamification & Counterfactual Branching",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local development and frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount /api/v1 router
app.include_router(api_v1_router)

# Mount frontend built assets if available
FRONTEND_DIST = os.path.join(FRONTEND_DIR, "dist")
assets_dir = os.path.join(FRONTEND_DIST, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
async def serve_frontend():
    dist_index = os.path.join(FRONTEND_DIR, "dist", "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "GENESIS Frontend not found at " + dist_index}


@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "engine": "GENESIS Civilisation Engine",
        "version": "1.0.0",
        "active_worlds": len(world_manager.list_all())
    }


@app.post("/api/worlds", response_model=WorldState)
async def create_world(req: WorldCreationRequest):
    world = world_manager.create(
        name=req.name,
        population=req.initial_population,
        grid_size=req.grid_size,
        climate=req.climate,
        technology_level=req.technology_level,
        resource_tier=req.resource_tier,
        active_policies=req.active_policies
    )
    return world


@app.get("/api/worlds")
async def list_worlds():
    worlds = world_manager.list_all()
    conn = get_db_connection()
    db_worlds = conn.execute("""
    SELECT w.*, e.population, e.gini_coefficient, e.civic_stability
    FROM worlds w
    LEFT JOIN economy_resources e ON w.id = e.world_id
    """).fetchall()
    conn.close()

    existing_ids = {w["id"] for w in worlds}
    for dw in db_worlds:
        if dw["id"] not in existing_ids:
            worlds.append({
                "id": dw["id"],
                "name": dw["name"],
                "parent_world_id": dw["parent_world_id"],
                "tick": dw["tick"],
                "year": dw["year"],
                "population": dw["population"] or 0,
                "gini": dw["gini_coefficient"] or 0.28,
                "civic_stability": dw["civic_stability"] or 0.77,
                "macro_innovation": 0.84,
                "active_policies": ["universal_ai", "cognitive_scaffolding"]
            })
    return worlds


@app.get("/api/worlds/{world_id}", response_model=WorldState)
async def get_world(world_id: str):
    world = world_manager.get(world_id)
    if world:
        return world

    # Check SQLite for aurora-prime or other persistent worlds
    conn = get_db_connection()
    w = conn.execute("SELECT * FROM worlds WHERE id = ?", (world_id,)).fetchone()
    if not w:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")

    econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    blds = conn.execute("SELECT * FROM buildings WHERE world_id = ?", (world_id,)).fetchall()
    cits = conn.execute("SELECT * FROM citizens WHERE world_id = ? LIMIT 60", (world_id,)).fetchall()
    conn.close()

    from engine.models import (
        Resources, EconomyStats, Policy, Building as BuildingModel,
        Citizen as CitizenModel, Demographics, NeedsVector, CognitiveProfile,
        EnvironmentStats
    )

    env = EnvironmentStats(
        climate=w["climate"] if w["climate"] in ["Temperate", "Arid", "Boreal", "Tropical", "Cyber-Industrial"] else "Temperate",
        technology_level=w["technology_level"] if w["technology_level"] in ["Emergent", "Automated", "Post-Scarcity", "Cognitive-Frontier"] else "Automated",
        environmental_quality=econ["environmental_health"] if econ else 0.85,
        temperature_celsius=21.0,
        weather="Clear"
    )

    buildings_list = [
        BuildingModel(
            id=b["id"],
            type=b["type"] if b["type"] in ["Civic", "Research", "Residential", "Agricultural", "Industrial", "Commercial"] else "Civic",
            x=b["x"],
            y=b["y"],
            height=b["height"],
            level=b["level"],
            capacity=b["capacity"]
        )
        for b in blds
    ]

    citizens_list = [
        CitizenModel(
            id=c["id"],
            demographics=Demographics(
                id=c["id"],
                age=c["age"],
                occupation=c["occupation"] if c["occupation"] in ["Farmer", "Engineer", "Scholar", "Builder", "Merchant"] else "Scholar",
                wealth=c["wealth"],
                x=c["x"],
                y=c["y"]
            ),
            needs=NeedsVector(hunger=c["hunger"], energy=c["energy"], wellbeing=c["wellbeing"]),
            cognitive=CognitiveProfile(
                independent_reasoning=c["independent_reasoning"],
                problem_solving=c["problem_solving"],
                critical_evaluation=c["critical_evaluation"],
                creativity=c["creativity"],
                knowledge_retention=c["knowledge_retention"],
                ai_dependency=c["ai_dependency"]
            ),
            is_alive=bool(c["is_alive"])
        )
        for c in cits
    ]

    res = Resources(
        food=econ["food"] if econ else 10000.0,
        water=econ["water"] if econ else 10000.0,
        energy=econ["energy"] if econ else 8000.0,
        materials=econ["materials"] if econ else 5000.0
    )

    eco_stats = EconomyStats(
        gini=econ["gini_coefficient"] if econ else 0.28,
        civic_stability=econ["civic_stability"] if econ else 0.77,
        average_wealth=econ["average_income"] if econ else 45000.0,
        total_wealth=econ["gdp"] if econ else 10000000.0,
        macro_innovation_index=0.84,
        avg_ai_dependency=0.18,
        avg_reasoning=0.79,
        avg_problem_solving=0.75
    )

    from engine.policies import get_default_policies
    pols = get_default_policies()
    pols["universal_ai"].active = True
    pols["cognitive_scaffolding"].active = True

    return WorldState(
        id=w["id"],
        name=w["name"],
        parent_world_id=w["parent_world_id"],
        tick=w["tick"],
        year=float(w["year"]),
        population_count=econ["population"] if econ else 100000,
        environment=env,
        buildings=buildings_list,
        citizens=citizens_list,
        resources=res,
        economy=eco_stats,
        policies=pols,
        grid_size=w["grid_size"],
        history=[]
    )


@app.delete("/api/worlds/{world_id}")
async def delete_world(world_id: str):
    # Stop autotick if running
    if world_id in autotick_tasks:
        autotick_tasks[world_id].cancel()
        del autotick_tasks[world_id]

    success = world_manager.delete(world_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")
    return {"status": "deleted", "world_id": world_id}


@app.post("/api/worlds/{world_id}/tick", response_model=WorldState)
async def advance_world_tick(world_id: str, req: TickRequest):
    world = world_manager.get(world_id)
    if world:
        step_world(world, ticks=req.ticks)
        await ws_manager.broadcast(world_id, {
            "type": "tick_update",
            "world_id": world_id,
            "tick": world.tick,
            "year": world.year,
            "economy": world.economy.model_dump(),
            "resources": world.resources.model_dump(),
            "population": world.population_count,
            "sample_citizens": [c.model_dump() for i, c in enumerate(world.citizens) if i < 40]
        })
        return world

    # Check SQLite-backed world
    try:
        delta = advance_world_simulation(world_id, ticks=req.ticks)
        await ws_manager.broadcast(world_id, {
            "type": "tick_update",
            **delta
        })
        return await get_world(world_id)
    except Exception:
        raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")


@app.post("/api/worlds/{world_id}/policies", response_model=WorldState)
async def update_policy(world_id: str, req: PolicyUpdateRequest):
    world = world_manager.get(world_id)
    if not world:
        raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")

    if req.policy_id not in world.policies:
        raise HTTPException(status_code=400, detail=f"Policy '{req.policy_id}' does not exist")

    world.policies[req.policy_id].active = req.active
    if req.parameters:
        world.policies[req.policy_id].parameters.update(req.parameters)

    # Broadcast policy change
    await ws_manager.broadcast(world_id, {
        "type": "policy_updated",
        "policy_id": req.policy_id,
        "active": req.active,
        "parameters": world.policies[req.policy_id].parameters
    })

    return world


@app.post("/api/worlds/{world_id}/branch", response_model=WorldState)
async def branch_world(world_id: str, req: BranchRequest):
    try:
        new_world = world_manager.branch(
            source_id=world_id,
            new_name=req.new_world_name,
            new_id=req.new_world_id,
            policy_overrides=req.policy_overrides,
            project_ticks=req.project_ticks
        )
        return new_world
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/worlds/{world_id}/compare/{target_id}", response_model=CompareResponse)
async def compare_worlds(world_id: str, target_id: str):
    try:
        comparison = world_manager.compare(world_id, target_id)
        return comparison
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Background continuous auto-tick runner
async def _run_autotick(world_id: str, interval: float):
    try:
        while True:
            await asyncio.sleep(interval)
            world = world_manager.get(world_id)
            if not world:
                break
            step_world(world, ticks=1)
            await ws_manager.broadcast(world_id, {
                "type": "tick_update",
                "world_id": world_id,
                "tick": world.tick,
                "year": world.year,
                "economy": world.economy.model_dump(),
                "resources": world.resources.model_dump(),
                "population": world.population_count,
                "sample_citizens": [c.model_dump() for i, c in enumerate(world.citizens) if i < 40]
            })
    except asyncio.CancelledError:
        pass


@app.post("/api/worlds/{world_id}/autotick/start")
async def start_autotick(world_id: str, interval: float = Query(default=0.4, ge=0.05, le=5.0)):
    world = world_manager.get(world_id)
    if not world:
        raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")

    if world_id in autotick_tasks and not autotick_tasks[world_id].done():
        return {"status": "already_running", "world_id": world_id}

    task = asyncio.create_task(_run_autotick(world_id, interval))
    autotick_tasks[world_id] = task
    return {"status": "started", "world_id": world_id, "interval_sec": interval}


@app.post("/api/worlds/{world_id}/autotick/stop")
async def stop_autotick(world_id: str):
    if world_id in autotick_tasks:
        autotick_tasks[world_id].cancel()
        del autotick_tasks[world_id]
        return {"status": "stopped", "world_id": world_id}
    return {"status": "not_running", "world_id": world_id}


# WebSocket streaming endpoint
@app.websocket("/ws/world/{world_id}")
async def websocket_world_stream(websocket: WebSocket, world_id: str):
    await ws_manager.connect(world_id, websocket)
    try:
        # Send initial full state immediately on connection
        world = world_manager.get(world_id)
        if world:
            await websocket.send_text(json.dumps({
                "type": "initial_state",
                "world": serialize_world_state(world, include_all_citizens=True)
            }))
        else:
            # Check SQLite persistent database
            conn = get_db_connection()
            db_w = conn.execute("SELECT * FROM worlds WHERE id = ?", (world_id,)).fetchone()
            if db_w:
                db_econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
                db_prog = conn.execute("SELECT * FROM progression WHERE world_id = ?", (world_id,)).fetchone()
                db_bld_count = conn.execute("SELECT COUNT(*) as c FROM buildings WHERE world_id = ?", (world_id,)).fetchone()["c"]
                conn.close()
                await websocket.send_text(json.dumps({
                    "type": "initial_state",
                    "world_id": world_id,
                    "name": db_w["name"],
                    "tick": db_w["tick"],
                    "year": db_w["year"],
                    "day": db_w["day"],
                    "simulation_status": db_w["simulation_status"],
                    "simulation_speed": db_w["simulation_speed"],
                    "economy": dict(db_econ) if db_econ else {},
                    "progression": dict(db_prog) if db_prog else {},
                    "buildings_count": db_bld_count
                }))
            else:
                conn.close()
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"World '{world_id}' does not exist"
                }))

        # Listen for client commands over WebSocket
        while True:
            data_text = await websocket.receive_text()
            try:
                cmd = json.loads(data_text)
                action = cmd.get("type")
                if action == "tick":
                    ticks = cmd.get("ticks", 1)
                    target_world = world_manager.get(world_id)
                    if target_world:
                        step_world(target_world, ticks=ticks)
                        await ws_manager.broadcast(world_id, {
                            "type": "tick_update",
                            "world_id": world_id,
                            "tick": target_world.tick,
                            "year": target_world.year,
                            "economy": target_world.economy.model_dump(),
                            "resources": target_world.resources.model_dump(),
                            "population": target_world.population_count,
                            "sample_citizens": [c.model_dump() for i, c in enumerate(target_world.citizens) if i < 40]
                        })
                    else:
                        # Advance in SQLite
                        try:
                            delta = advance_world_simulation(world_id, ticks=ticks)
                            await ws_manager.broadcast(world_id, {
                                "type": "tick_update",
                                **delta
                            })
                        except Exception:
                            pass
                elif action == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(world_id, websocket)


@app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
async def serve_spa_fallback(full_path: str):
    dist_dir = os.path.join(FRONTEND_DIR, "dist")
    candidate = os.path.join(dist_dir, full_path)
    if full_path and os.path.isfile(candidate):
        return FileResponse(candidate)
    dist_index = os.path.join(dist_dir, "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)
    raise HTTPException(status_code=404, detail="Resource not found")

