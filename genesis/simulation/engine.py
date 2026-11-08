"""The daily simulation loop. One tick = one simulation day (see docs/ARCHITECTURE.md)."""
from . import (intelligence, population, resources, economy, infrastructure, environment, governance, events,
               progression)
from .metrics import record_history, today_lines, explain_day, dashboard_cards
from .recommendations import recommend


def tick(w):
    s = w.s
    prev = s.get("metrics") or None
    s["meta"]["day"] += 1
    s["daily"] = {"births": 0, "deaths": 0, "immigrants": 0, "emigrants": 0, "jobs_found": 0, "jobs_lost": 0,
                  "graduates": 0, "sick_new": 0, "treated": 0}
    mods = governance.get_modifiers(w)
    intelligence.step_citizens(w, mods)            # 1. needs and activities
    population.step_education(w, mods)             # 2. education and skills
    population.step_employment(w, mods)            # 3. employment
    population.step_demographics(w, mods)          # 4. births, deaths, migration
    resources.step_resources(w, mods)              # 5. production and consumption
    economy.step_economy(w, mods)                  # 6. economy
    infrastructure.step_infrastructure(w, mods)    # 7. buildings and services
    environment.step_environment(w, mods)          # 8. environment
    governance.step_policies(w, mods)              # 9. policies
    events.step_events(w, mods)                    # 10. events
    progression.step_progression(w, mods)          # 11. research and progression
    m = record_history(w)                          # 12. history
    explain_day(w, prev, m)
    s["today"] = today_lines(w, prev, m)
    return w                                       # 13. caller publishes the state


def advance(w, days=1):
    for _ in range(max(0, int(days))):
        tick(w)
    return w


def public_state(w, full_citizens=False):
    """What the browser receives. Compact citizen list for the 3D world; full profiles on request."""
    s = w.s
    m = s["metrics"]
    cits = [{"id": c["id"], "name": c["name"], "age": c["age"], "profession": c["profession"], "x": c["x"], "z": c["z"],
             "activity": c["activity"], "health": round(c["health"]), "happiness": round(c["happiness"]),
             "sick": c["sick_days"] > 0, "employed": c["employed"]} for c in s["citizens"].values()]
    return {
        "meta": s["meta"], "map": s["map"], "citizens": cits, "buildings": list(s["buildings"].values()),
        "resources": s["resources"], "economy": {k: v for k, v in s["economy"].items() if k != "gdp_hist"},
        "environment": s["environment"], "services": s["services"], "policies": s["policies"],
        "events": {"active": s["events"]["active"], "log": s["events"]["log"][-10:]},
        "progression": s["progression"], "research": s["research"], "grc": {"balance": s["grc"]["balance"]},
        "experiments": s["experiments"], "metrics": m, "cards": dashboard_cards(w, m),
        "today": s.get("today", []), "feed": s["feed"][-40:], "recommendations": recommend(w),
        "totals": s["totals"], "settings": s["settings"],
    }
