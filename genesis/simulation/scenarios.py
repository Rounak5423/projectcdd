"""Snapshots, independent future branches and side-by-side comparison."""
from ..errors import GenesisError
from ..models.world import World
from .experiments import COMPARE
from .governance import activate_policy

PRESETS = {
    "education_focus": dict(label="Future A: Education-focused civilisation", policy="education_investment",
                            description="Starts the Education investment policy in this future."),
    "environment_focus": dict(label="Future B: Environment-focused civilisation", policy="environmental_protection",
                              description="Starts the Environmental protection policy in this future."),
    "industry_focus": dict(label="Future C: Industry-focused civilisation", policy="industrial_development",
                           description="Starts the Industrial development policy in this future."),
    "none": dict(label="Same decisions", policy=None, description="No change: a copy to play differently."),
}


def make_snapshot(w, name):
    return {"name": name or f"Day {w.day}", "day": w.day, "state": w.to_json()}


def make_branch(state_json, name, preset, branch_id, parent_id):
    """Create an independent branch from a saved state (snapshot or current world)."""
    if preset not in PRESETS:
        raise GenesisError("Unknown scenario type.")
    b = World.from_json(state_json)
    b.s["meta"].update(world_id=branch_id, kind="branch", parent_id=parent_id, status="paused",
                       name=name or PRESETS[preset]["label"], preset=preset)
    b.s["experiments"] = []
    pol = PRESETS[preset]["policy"]
    if pol:
        activate_policy(b, pol)          # costs real money from the branch's own treasury
    return b


def compare_worlds(items):
    """items: list of (id, name, World). Returns a table of real metrics for each."""
    from .metrics import compute_metrics
    ms = {i: compute_metrics(w) for i, _, w in items}
    return {"worlds": [{"id": i, "name": n, "day": w.day} for i, n, w in items],
            "rows": [{"key": k, "label": lab, "values": {i: ms[i][k] for i, _, _ in items}} for k, lab in COMPARE]}
