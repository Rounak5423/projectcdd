"""Technology tree and research progress."""
import math
from ..errors import GenesisError
from .config import RESEARCH_RATE

TECHS = {
    "precision_agriculture": dict(label="Precision agriculture", cost=60, area="Agriculture",
        needs_buildings={"research_centre": 1}, needs_techs=[],
        desc="Sensors and smart planting: +20% food and less water used by farms.",
        mods={"food": 1.2, "water_demand": 0.92}),
    "public_health": dict(label="Public health systems", cost=80, area="Health",
        needs_buildings={"hospital": 1}, needs_techs=[],
        desc="Vaccination and clean-care routines: fewer illnesses, faster recovery.",
        mods={"disease": 0.7, "recovery": 1.2}),
    "renewable_energy": dict(label="Renewable energy", cost=100, area="Energy",
        needs_buildings={"power_plant": 1}, needs_techs=[],
        desc="Solar and wind: power plants pollute 65% less and give 10% more energy.",
        mods={"power_pollution": 0.35, "energy": 1.1}),
    "advanced_materials": dict(label="Advanced materials", cost=120, area="Industry",
        needs_buildings={"university": 1}, needs_techs=[],
        desc="Better alloys: +25% raw materials and 10% cheaper construction.",
        mods={"materials": 1.25, "build_cost": 0.9}),
    "environmental_restoration": dict(label="Environmental restoration", cost=140, area="Environment",
        needs_buildings={"park": 1}, needs_techs=["renewable_energy"],
        desc="Replanting and clean-up: green cover grows and pollution fades faster.",
        mods={"add_green": 0.1, "add_pollution_decay": 0.01}),
    "industrial_automation": dict(label="Industrial automation", cost=170, area="Industry",
        needs_buildings={"factory": 1}, needs_techs=["advanced_materials"],
        desc="Robots on the factory floor: +30% industrial output.",
        mods={"industry": 1.3, "pollution": 1.05}),
}


def default_research_state():
    return {"points_total": 0.0, "pool": 0.0, "rp_today": 0.0, "current": None, "progress": {}, "unlocked": []}


def is_unlocked(w, tech):
    return any(t["id"] == tech for t in w.s["research"]["unlocked"])


def tech_status(w, tech):
    """Returns (status, missing-reasons) where status is unlocked/researching/available/locked."""
    t = TECHS[tech]
    if is_unlocked(w, tech):
        return "unlocked", []
    missing = []
    for pre in t["needs_techs"]:
        if not is_unlocked(w, pre):
            missing.append(f"Research {TECHS[pre]['label']} first")
    have = {}
    for b in w.s["buildings"].values():
        if b["status"] == "active":
            have[b["type"]] = have.get(b["type"], 0) + 1
    for bt, n in t["needs_buildings"].items():
        if have.get(bt, 0) < n:
            missing.append(f"Build a {bt.replace('_', ' ')}")
    if missing:
        return "locked", missing
    return ("researching" if w.s["research"]["current"] == tech else "available"), []


def start_research(w, tech):
    if tech not in TECHS:
        raise GenesisError("That technology does not exist.")
    status, missing = tech_status(w, tech)
    if status == "unlocked":
        raise GenesisError("You already have this technology.")
    if status == "locked":
        raise GenesisError("Not ready yet: " + "; ".join(missing) + ".")
    w.s["research"]["current"] = tech
    w.feed("info", f"Research started: {TECHS[tech]['label']}", "Your scientists begin working on this technology.",
           why="You chose it in the Control tab.", effect=f"It needs {TECHS[tech]['cost']} research points.",
           action="Build or upgrade research centres and universities to go faster.")


def research_output(w, mods):
    s = w.s
    cs = [b for b in s["buildings"].values() if b["status"] == "active"]
    unis = sum(b["staff_ratio"] for b in cs if b["type"] == "university")
    en = s["resources"]["energy"]["availability"]
    rp = 0.0
    for b in cs:
        if b["type"] == "research_centre":
            lm = 1 + 0.5 * (b["level"] - 1)
            rp += RESEARCH_RATE * lm * b["staff_ratio"] * (0.5 + 0.5 * b["condition"] / 100)
    rp *= (1 + 0.25 * unis) * mods["research"] * (0.7 + 0.3 * en)
    if rp > 0:
        rp += mods["add_rp"]
    return rp


def step_research(w, mods):
    from .progression import grant_grc, add_xp
    r = w.s["research"]
    rp = research_output(w, mods)
    r["rp_today"] = round(rp, 2)
    r["points_total"] += rp
    r["pool"] += rp
    cur = r["current"]
    if not cur:
        return
    r["progress"][cur] = r["progress"].get(cur, 0.0) + r["pool"]
    r["pool"] = 0.0
    cost = TECHS[cur]["cost"]
    if r["progress"][cur] >= cost:
        r["pool"] = r["progress"][cur] - cost
        r["progress"][cur] = cost
        r["unlocked"].append({"id": cur, "day": w.day})
        r["current"] = None
        t = TECHS[cur]
        w.feed("good", f"New technology: {t['label']}", f"Your scientists finished researching {t['label']}.",
               why="Research centres produced enough research points.", effect=t["desc"],
               action="Choose your next technology in the Control tab.")
        grant_grc(w, 12, f"Technology unlocked: {t['label']}", f"tech:{cur}")
        add_xp(w, 40, f"tech:{cur}")
