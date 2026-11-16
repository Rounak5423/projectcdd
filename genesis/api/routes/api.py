"""All /api routes. Each one is a thin wrapper around GenesisService (see docs/API.md)."""
import asyncio
from fastapi import APIRouter, Query
from ...models import schemas as S
from ..deps import get_service

router = APIRouter(prefix="/api")


async def _after(result=None):
    svc = get_service()
    await svc.notify()
    return result


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/state")
def state():
    return get_service().state()


@router.get("/catalog")
def catalog():
    return get_service().catalog()


@router.get("/history")
def history(limit: int = Query(400, ge=1, le=5000)):
    return get_service().history(limit)


@router.get("/feed")
def feed():
    return get_service().main.s["feed"][-100:]


@router.get("/recommendations")
def recommendations():
    return get_service().state()["recommendations"]


@router.get("/citizens/{cid}")
def citizen(cid: str):
    return get_service().citizen(cid)


@router.get("/buildings/{bid}")
def building(bid: str):
    return get_service().building(bid)


# ---- simulation control
@router.post("/sim/start")
async def sim_start():
    get_service().start()
    return await _after({"status": "running"})


@router.post("/sim/pause")
async def sim_pause():
    get_service().pause()
    return await _after({"status": "paused"})


@router.post("/sim/resume")
async def sim_resume():
    get_service().start()
    return await _after({"status": "running"})


@router.post("/sim/step")
async def sim_step(body: S.StepBody):
    get_service().step(body.days)
    return await _after({"day": get_service().main.day})


@router.post("/sim/speed")
async def sim_speed(body: S.SpeedBody):
    get_service().set_speed(body.speed)
    return await _after({"speed": body.speed})


# ---- buildings
@router.post("/buildings")
async def build(body: S.BuildBody):
    return await _after(get_service().construct(body.type, body.x, body.z, body.confirm))


@router.post("/buildings/{bid}/upgrade")
async def upgrade(bid: str, body: S.ConfirmBody):
    return await _after(get_service().upgrade(bid, body.confirm))


# ---- policies
@router.get("/policies")
def policies():
    return get_service().policies()


@router.post("/policies/{key}/activate")
async def policy_activate(key: str, body: S.ConfirmBody):
    return await _after(get_service().policy_activate(key, body.confirm))


@router.post("/policies/{key}/cancel")
async def policy_cancel(key: str):
    return await _after(get_service().policy_cancel(key))


# ---- research and experiments
@router.get("/research")
def research():
    return get_service().research()


@router.post("/research/start")
async def research_start(body: S.ResearchBody):
    return await _after(get_service().research_start(body.tech))


@router.get("/experiments")
def experiments():
    return get_service().experiments()


@router.post("/experiments")
async def experiment_start(body: S.ExperimentBody):
    svc = get_service()
    res = svc.experiment_start(body.key, body.confirm)
    if res.get("executed"):
        xid = res["experiment"]["id"]
        await svc.notify()                                    # shows "queued"
        await asyncio.to_thread(svc.experiment_run, xid)      # runs "running" -> "completed"/"failed"
        res["experiment"] = next(x for x in svc.main.s["experiments"] if x["id"] == xid)
    return await _after(res)


# ---- snapshots, branches, comparison
@router.post("/snapshots")
async def snapshot_create(body: S.SnapshotBody):
    return await _after(get_service().snapshot_create(body.name))


@router.get("/snapshots")
def snapshots():
    return get_service().snapshots()


@router.post("/branches")
async def branch_create(body: S.BranchBody):
    return await _after(get_service().branch_create(body.preset, body.name, body.snapshot_id))


@router.get("/branches")
def branches():
    return get_service().branches()


@router.post("/branches/{bid}/advance")
def branch_advance(bid: str, body: S.AdvanceBody):
    return get_service().branch_advance(bid, body.days)


@router.delete("/branches/{bid}")
def branch_delete(bid: str):
    return get_service().branch_delete(bid)


@router.get("/compare")
def compare(ids: str = Query(..., description="Comma-separated ids, e.g. main,W0001,W0002")):
    return get_service().compare([i for i in ids.split(",") if i])


# ---- world
@router.post("/save")
def save():
    get_service().save()
    return {"saved": True}


@router.post("/world/new")
async def world_new(body: S.NewWorldBody):
    return await _after(get_service().new_world(body.seed, body.name, body.confirm))
