"""Experiments: run the same civilisation forward under different conditions and compare the results.

An experiment copies the current world into independent branches (one "business as usual" control plus
one or more variants), simulates each for N days with the same random seed state, and reports what
actually happened. Credits (GRC) only pay for access; they can never change the outcome.
"""
from ..errors import GenesisError
from .engine import advance
from .governance import activate_policy
from .metrics import compute_metrics
from .progression import spend_grc, refund_grc

COMPARE = [("population", "Population"), ("gdp", "GDP per day"), ("employment_rate", "Employment rate"),
           ("avg_education", "Education (0-3)"), ("avg_health", "Average health"), ("avg_happiness", "Average happiness"),
           ("resource_availability", "Resource availability"), ("pollution", "Pollution"), ("env_health", "Environmental health"),
           ("treasury", "Treasury")]


def _policy(key):
    return lambda b: activate_policy(b, key, free=True)


def _custom(**mods):
    def apply(b):
        b.s["custom_mods"].update(mods)
    return apply


def _both(*fns):
    def apply(b):
        for f in fns:
            f(b)
    return apply


EXPERIMENTS = {
    "education_boost": dict(
        label="Education boost", question="What happens if education investment increases?", cost=15, duration=45,
        description="Runs your civilisation 45 days forward with and without a free Education investment policy.",
        variants=[("Education-focused", _policy("education_investment"))],
        expected=["avg_education", "gdp", "avg_happiness", "treasury"]),
    "food_decline": dict(
        label="Food production drop", question="What happens if food production decreases?", cost=15, duration=45,
        description="Cuts food output of every farm by 30% to see how your society copes with shortages.",
        variants=[("Food output -30%", _custom(food=0.7))],
        expected=["resource_availability", "avg_health", "avg_happiness", "population"]),
    "population_boom": dict(
        label="Rapid population growth", question="What happens if the population grows rapidly?", cost=20, duration=45,
        description="Triples the birth and migration rate to test housing, food and jobs under pressure.",
        variants=[("Rapid growth", _custom(birth=3.0, migration=3.0))],
        expected=["population", "resource_availability", "employment_rate", "gdp"]),
    "environment_priority": dict(
        label="Environment first", question="What happens if environmental protection becomes a priority?", cost=20, duration=45,
        description="Compares business as usual with environmental protection, and with protection plus renewable energy (3 branches).",
        variants=[("Environmental protection", _policy("environmental_protection")),
                  ("Protection + renewable energy", _both(_policy("environmental_protection"),
                                                           _custom(power_pollution=0.35, energy=1.1)))],
        expected=["pollution", "env_health", "avg_health", "gdp"]),
    "renewable_energy": dict(
        label="Renewable energy", question="What happens if renewable energy is introduced?", cost=20, duration=45,
        description="Power plants pollute 65% less and produce 10% more energy.",
        variants=[("Renewable energy", _custom(power_pollution=0.35, energy=1.1))],
        expected=["pollution", "env_health", "resource_availability", "gdp"]),
}
ASSUMPTIONS = [
    "Results are simulated with this model's rules; they are not predictions of the real world.",
    "Every branch starts from an exact copy of your civilisation today, with the same random seed state.",
    "Differences come only from the change being tested, but random events may still differ between branches once decisions diverge.",
    "Policy experiments use the policy for free and for its normal duration (40 days).",
]


def experiment_info(key):
    e = EXPERIMENTS[key]
    return {"key": key, "label": e["label"], "question": e["question"], "description": e["description"], "cost": e["cost"],
            "branches": 1 + len(e["variants"]), "duration": e["duration"], "expected": e["expected"],
            "assumptions": ASSUMPTIONS}


def check_experiment(w, key):
    if key not in EXPERIMENTS:
        raise GenesisError("That experiment does not exist.")
    e = EXPERIMENTS[key]
    if any(x["key"] == key and x["status"] in ("queued", "running") for x in w.s["experiments"]):
        raise GenesisError("This experiment is already queued or running.")
    if w.s["grc"]["balance"] < e["cost"]:
        raise GenesisError(f"Not enough Genesis Research Credits: this needs {e['cost']} and you have {w.s['grc']['balance']}.")
    return experiment_info(key)


def start_experiment(w, key):
    info = check_experiment(w, key)
    xid = w.next_id("X")
    spend_grc(w, info["cost"], f"Experiment: {info['label']}", f"exp:{xid}")
    rec = {"id": xid, "key": key, "name": info["label"], "question": info["question"], "status": "queued", "cost": info["cost"],
           "branches": info["branches"], "duration": info["duration"], "created_day": w.day, "finished_day": None,
           "result": None, "error": None}
    w.s["experiments"].append(rec)
    return rec


def run_experiment(w, xid):
    rec = next((x for x in w.s["experiments"] if x["id"] == xid), None)
    if not rec:
        raise GenesisError("Experiment not found.")
    if rec["status"] != "queued":
        raise GenesisError("Only queued experiments can be run.")
    rec["status"] = "running"
    e = EXPERIMENTS[rec["key"]]
    try:
        runs = [("Business as usual", None)] + list(e["variants"])
        out = []
        for label, apply in runs:
            b = w.copy(kind="experiment")
            b.s["experiments"] = []
            if apply:
                apply(b)
            advance(b, e["duration"])
            out.append({"label": label, "metrics": {k: compute_metrics(b)[k] for k, _ in COMPARE}})
        control = out[0]["metrics"]
        lines = []
        for v in out[1:]:
            for k, lab in COMPARE:
                if k in e["expected"]:
                    d = v["metrics"][k] - control[k]
                    lines.append(f"{v['label']}: {lab} ended {abs(d):.2f} {'higher' if d > 0 else 'lower' if d < 0 else '(same)'} than business as usual.")
        rec["result"] = {"kind": "Actual simulation result", "start": {k: compute_metrics(w)[k] for k, _ in COMPARE},
                         "branches": out, "labels": dict(COMPARE), "summary": lines, "assumptions": ASSUMPTIONS}
        rec["status"] = "completed"
    except Exception as exc:  # noqa: BLE001 - any failure refunds the credits
        rec["status"] = "failed"
        rec["error"] = str(exc)
        refund_grc(w, rec["cost"], f"Refund: {rec['name']} failed", f"refund:{xid}")
    rec["finished_day"] = w.day
    return rec
