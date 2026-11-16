import json
from genesis.simulation.seed import create_world
from genesis.simulation.engine import advance
from genesis.simulation.infrastructure import tile_problem


def clean(w):
    """World state without the wall-clock creation time, for equality checks."""
    s = json.loads(w.to_json())
    s["meta"].pop("created", None)
    s["meta"].pop("saved_at", None)
    return s


def free_tile(w):
    return next((x, z) for x in range(36) for z in range(36) if tile_problem(w, x, z) is None)


def world(seed=42, days=0):
    w = create_world(seed)
    advance(w, days)
    return w
