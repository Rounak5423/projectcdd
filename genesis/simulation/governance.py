"""Government policies and the combined "modifier" table.

Every day the engine merges the effects of active policies, unlocked technologies,
active events and experiment overrides into one dictionary (`get_modifiers`).
Keys starting with `add_` are summed; every other key is multiplied.
"""
from ..errors import GenesisError

MULT_KEYS = ["food", "water", "water_demand", "energy", "materials", "industry", "pollution",
             "power_pollution", "edu", "health_cap", "recovery", "disease", "research",
             "build_cost", "maintenance", "income", "birth", "migration"]
ADD_KEYS = ["add_happiness", "add_green", "add_disease", "add_rp", "add_pollution_decay"]

POLICIES = {
    "education_investment": dict(
        label="Education investment", cost=300, upkeep=40, duration=40,
        intended="Citizens learn faster and more of them finish school.",
        mods={"edu": 1.5, "add_happiness": 1.0},
        advantages="Faster learning, better skills, more graduates for skilled jobs.",
        disadvantages="Costs 40 per day, and the benefits take many days to appear.",
        measure=["avg_education", "education_pct", "school_coverage"]),
    "environmental_protection": dict(
        label="Environmental protection", cost=350, upkeep=35, duration=40,
        intended="Cleaner air, more green land and healthier water.",
        mods={"pollution": 0.7, "industry": 0.93, "add_green": 0.12},
        advantages="Pollution falls, green cover grows, people are healthier.",
        disadvantages="Industry produces about 7% less and the policy costs 35 per day.",
        measure=["pollution", "green_cover", "env_health"]),
    "agricultural_development": dict(
        label="Agricultural development", cost=300, upkeep=30, duration=40,
        intended="Bigger harvests from existing farms.",
        mods={"food": 1.25, "water_demand": 1.1, "add_green": -0.04},
        advantages="About 25% more food from every farm.",
        disadvantages="Uses about 10% more water and slowly reduces green cover.",
        measure=["food_availability", "food_production"]),
    "healthcare_investment": dict(
        label="Healthcare investment", cost=350, upkeep=45, duration=40,
        intended="More patients treated and faster recovery.",
        mods={"health_cap": 1.4, "recovery": 1.3, "disease": 0.8},
        advantages="Hospitals treat 40% more patients; illness spreads less.",
        disadvantages="Costs 45 per day.",
        measure=["avg_health", "healthcare_coverage"]),
    "industrial_development": dict(
        label="Industrial development", cost=400, upkeep=40, duration=40,
        intended="Stronger industry, a bigger economy and more output.",
        mods={"industry": 1.25, "pollution": 1.25, "add_green": -0.02},
        advantages="Factories make about 25% more goods, raising GDP and income.",
        disadvantages="Pollution rises by about 25% and the policy costs 40 per day.",
        measure=["gdp", "unemployment_rate", "pollution"]),
    "infrastructure_investment": dict(
        label="Infrastructure investment", cost=300, upkeep=30, duration=40,
        intended="Cheaper upkeep and construction, steadier utilities.",
        mods={"maintenance": 0.75, "build_cost": 0.9, "energy": 1.05, "water": 1.1},
        advantages="Maintenance 25% cheaper, new buildings 10% cheaper, a bit more water and energy.",
        disadvantages="Costs 30 per day.",
        measure=["treasury", "water_availability", "energy_availability"]),
}


def default_policy_state():
    return {k: {"active": False, "started": None, "ends": None, "baseline": {}, "times_used": 0}
            for k in POLICIES}


def get_modifiers(w):
    from .research import TECHS
    m = {k: 1.0 for k in MULT_KEYS}
    m.update({k: 0.0 for k in ADD_KEYS})

    def apply(src):
        for k, v in src.items():
            if k.startswith("add_"):
                m[k] = m.get(k, 0.0) + v
            else:
                m[k] = m.get(k, 1.0) * v

    s = w.s
    for key, st in s["policies"].items():
        if st["active"]:
            apply(POLICIES[key]["mods"])
    for t in s["research"]["unlocked"]:
        apply(TECHS[t["id"]]["mods"])
    for e in s["events"]["active"]:
        apply(e["mods"])
    apply(s.get("custom_mods", {}))
    return m


def policy_effective_cost(w, key):
    return POLICIES[key]["cost"]


def check_policy(w, key, free=False):
    if key not in POLICIES:
        raise GenesisError("That policy does not exist.")
    st = w.s["policies"][key]
    if st["active"]:
        raise GenesisError(f"{POLICIES[key]['label']} is already active (until day {st['ends']}).")
    cost = POLICIES[key]["cost"]
    if not free and w.s["economy"]["treasury"] < cost + POLICIES[key]["upkeep"]:
        raise GenesisError(f"Not enough money. This policy needs {cost} to start plus {POLICIES[key]['upkeep']} "
                           f"per day; the treasury has {w.s['economy']['treasury']:.0f}.")
    return POLICIES[key]


def activate_policy(w, key, free=False):
    from .metrics import compute_metrics
    p = check_policy(w, key, free)
    st = w.s["policies"][key]
    if not free:
        w.s["economy"]["treasury"] -= p["cost"]
    m = compute_metrics(w)
    st.update(active=True, started=w.day, ends=w.day + p["duration"], times_used=st["times_used"] + 1,
              baseline={k: m.get(k) for k in p["measure"]})
    w.feed("info", f"Policy started: {p['label']}", f"You introduced the {p['label']} policy for {p['duration']} days.",
           why=p["intended"], effect=p["advantages"] + " Downside: " + p["disadvantages"],
           action="Watch the measured results in the Control tab.")
    return st


def cancel_policy(w, key):
    if key not in POLICIES or not w.s["policies"][key]["active"]:
        raise GenesisError("That policy is not active.")
    w.s["policies"][key]["active"] = False
    w.feed("info", f"Policy cancelled: {POLICIES[key]['label']}", "You ended the policy early (no refund).")


def policy_report(w, key):
    """Measured consequences: baseline at start vs now."""
    from .metrics import compute_metrics
    st = w.s["policies"][key]
    if not st["baseline"]:
        return []
    m = compute_metrics(w)
    return [{"metric": k, "before": st["baseline"][k], "now": m.get(k),
             "change": None if st["baseline"][k] is None or m.get(k) is None
             else round(m[k] - st["baseline"][k], 2)} for k in st["baseline"]]


def step_policies(w, mods):
    s = w.s
    for key, st in s["policies"].items():
        if not st["active"]:
            continue
        p = POLICIES[key]
        up = p["upkeep"]
        eco = s["economy"]
        if eco["treasury"] >= up:
            eco["treasury"] -= up
            eco["spend_today"]["policies"] += up
        else:
            st["active"] = False
            w.feed("warning", f"Policy lapsed: {p['label']}", f"The treasury could not pay the {up} daily upkeep.",
                   why="Tax income was lower than spending.", effect="The policy's benefits stopped.",
                   action="Build up the treasury, then restart the policy.")
            continue
        if w.day >= st["ends"]:
            st["active"] = False
            w.feed("info", f"Policy finished: {p['label']}", "The policy ran its full duration.",
                   effect="Its bonuses no longer apply.", action="Restart it if you still want the benefits.")
