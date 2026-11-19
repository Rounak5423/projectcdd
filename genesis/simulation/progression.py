"""Experience, levels, achievements, missions and Genesis Research Credits (GRC)."""
import math
from ..errors import GenesisError


def new_progression():
    return {"xp": 0, "level": 1, "achievements": [], "missions": {}, "rewarded": [], "streaks": {}}


def new_grc():
    return {"balance": 0, "ledger": []}


def level_for(xp):
    return 1 + int(math.sqrt(xp / 60))


def add_xp(w, amount, key=None):
    p = w.s["progression"]
    if key:
        k = "xp:" + key
        if k in p["rewarded"]:
            return False
        p["rewarded"].append(k)
    p["xp"] += amount
    return True


def _ledger(w, kind, amount, reason, key):
    g = w.s["grc"]
    g["ledger"].append({"id": len(g["ledger"]) + 1, "day": w.day, "type": kind, "amount": amount,
                        "reason": reason, "key": key, "balance_after": g["balance"]})


def grant_grc(w, amount, reason, key):
    """Earn GRC. Each `key` can only ever pay out once (protects against duplicate rewards)."""
    p, g = w.s["progression"], w.s["grc"]
    k = "grc:" + key
    if amount <= 0 or k in p["rewarded"]:
        return False
    p["rewarded"].append(k)
    g["balance"] += int(amount)
    _ledger(w, "earn", int(amount), reason, key)
    return True


def spend_grc(w, amount, reason, key):
    g = w.s["grc"]
    if not isinstance(amount, int) or amount <= 0:
        raise GenesisError("Invalid credit amount.")
    if g["balance"] < amount:
        raise GenesisError(f"Not enough Genesis Research Credits: you need {amount} but have {g['balance']}.")
    g["balance"] -= amount
    _ledger(w, "spend", -amount, reason, key)


def refund_grc(w, amount, reason, key):
    g = w.s["grc"]
    g["balance"] += amount
    _ledger(w, "refund", amount, reason, key)


def _count(w, t):
    return sum(1 for b in w.s["buildings"].values() if b["type"] == t and b["status"] == "active")


ACHIEVEMENTS = [
    dict(id="first_steps", name="First steps", desc="Keep your civilisation going for 10 days.", days=1, grc=5, xp=20,
         check=lambda m, w: m["day"] >= 10),
    dict(id="growing_town", name="Growing town", desc="Reach 250 citizens.", days=1, grc=8, xp=40,
         check=lambda m, w: m["population"] >= 250),
    dict(id="well_fed", name="Well fed", desc="Everyone has enough food for 30 days in a row.", days=30, grc=6, xp=30,
         check=lambda m, w: m["food_availability"] >= 0.98),
    dict(id="educated_society", name="Educated society", desc="80% of adults finish secondary school.", days=1, grc=8, xp=40,
         check=lambda m, w: m["education_pct"] >= 0.8),
    dict(id="full_employment", name="Full employment", desc="Keep unemployment under 5% for 10 days (100+ citizens).", days=10, grc=8, xp=40,
         check=lambda m, w: m["unemployment_rate"] < 0.05 and m["population"] >= 100),
    dict(id="green_civilisation", name="Green civilisation", desc="Environmental health 75+ for 10 days with 150+ citizens.", days=10, grc=8, xp=40,
         check=lambda m, w: m["env_health"] >= 75 and m["population"] >= 150),
    dict(id="scientific_age", name="Scientific age", desc="Unlock three technologies.", days=1, grc=10, xp=50,
         check=lambda m, w: m["techs"] >= 3),
    dict(id="healthy_society", name="Healthy society", desc="Average health 88+ for 20 days.", days=20, grc=6, xp=30,
         check=lambda m, w: m["avg_health"] >= 88),
]

MISSIONS = [
    dict(id="m_school", name="Build a third school", desc="Open 3 schools so more children can learn.", target=3, grc=5, xp=30,
         value=lambda m, w: _count(w, "school")),
    dict(id="m_hospital", name="Open a second hospital", desc="Open 2 hospitals to improve healthcare capacity.", target=2, grc=6, xp=30,
         value=lambda m, w: _count(w, "hospital")),
    dict(id="m_pop", name="A city of 300", desc="Reach 300 citizens.", target=300, grc=8, xp=40,
         value=lambda m, w: m["population"]),
    dict(id="m_tech", name="First discovery", desc="Unlock your first technology.", target=1, grc=6, xp=30,
         value=lambda m, w: m["techs"]),
    dict(id="m_treasury", name="Rainy-day fund", desc="Save 5000 in the treasury.", target=5000, grc=6, xp=30,
         value=lambda m, w: m["treasury"]),
    dict(id="m_challenge", name="Research challenge", desc="Produce 150 research points in total.", target=150, grc=8, xp=40,
         value=lambda m, w: m["research_total"]),
]


def mission_progress(w):
    from .metrics import compute_metrics
    m = compute_metrics(w)
    out = []
    for ms in MISSIONS:
        done = w.s["progression"]["missions"].get(ms["id"], {}).get("done", False)
        out.append({"id": ms["id"], "name": ms["name"], "desc": ms["desc"], "target": ms["target"], "grc": ms["grc"],
                    "value": round(min(ms["value"](m, w), ms["target"]), 1) if not done else ms["target"], "done": done})
    return out


def step_progression(w, mods):
    from .metrics import compute_metrics
    from .research import step_research
    s = w.s
    p = s["progression"]
    step_research(w, mods)
    m = compute_metrics(w)
    if not any(s["resources"][r]["shortage"] for r in s["resources"]):
        p["xp"] += 1
    for a in ACHIEVEMENTS:
        if any(x["id"] == a["id"] for x in p["achievements"]):
            continue
        p["streaks"][a["id"]] = p["streaks"].get(a["id"], 0) + 1 if a["check"](m, w) else 0
        if p["streaks"][a["id"]] >= a["days"]:
            p["achievements"].append({"id": a["id"], "day": w.day})
            grant_grc(w, a["grc"], f"Achievement: {a['name']}", f"achv:{a['id']}")
            add_xp(w, a["xp"], f"achv:{a['id']}")
            w.feed("good", f"Achievement unlocked: {a['name']}", a["desc"], why="Your civilisation met the goal.",
                   effect=f"+{a['grc']} Genesis Research Credits and +{a['xp']} experience.", action="Spend credits on experiments in the Control tab.")
    for ms in MISSIONS:
        st = p["missions"].setdefault(ms["id"], {"done": False, "day": None})
        if not st["done"] and ms["value"](m, w) >= ms["target"]:
            st.update(done=True, day=w.day)
            grant_grc(w, ms["grc"], f"Mission: {ms['name']}", f"mission:{ms['id']}")
            add_xp(w, ms["xp"], f"mission:{ms['id']}")
            w.feed("good", f"Mission complete: {ms['name']}", ms["desc"], why="You reached the target.",
                   effect=f"+{ms['grc']} Genesis Research Credits.", action="")
    new_level = level_for(p["xp"])
    if new_level > p["level"]:
        for lv in range(p["level"] + 1, new_level + 1):
            grant_grc(w, 2, f"Reached level {lv}", f"level:{lv}")
        p["level"] = new_level
        w.feed("good", f"Your civilisation reached level {new_level}", "Experience points came from steady, healthy progress.",
               why="Meeting needs, building and researching all earn experience.", effect="+2 credits for each new level.")
