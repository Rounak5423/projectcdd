"""Optional advice generated from real conditions. Recommendations never act by themselves."""
from .metrics import compute_metrics


def recommend(w):
    s = w.s
    m = compute_metrics(w)
    R, env, sv = s["resources"], s["environment"], s["services"]
    recs = []

    def add(rid, level, text, why, action):
        recs.append({"id": rid, "level": level, "text": text, "why": why, "action": action})

    f = R["food"]
    if f["production"] < f["demand"]:
        days = f["stock"] / (f["demand"] - f["production"])
        add("food", "bad" if days < 10 else "warn", "Food supplies are decreasing. Consider constructing another farm.",
            f"Food production ({f['production']:.0f}/day) is lower than consumption ({f['demand']:.0f}/day). The stock lasts about {days:.0f} more days.",
            {"type": "build", "key": "farm"})
    w_ = R["water"]
    if w_["production"] < w_["demand"]:
        add("water", "bad" if w_["availability"] < 0.8 else "warn", "Water is running short. Consider the Infrastructure investment policy.",
            f"Water supply is {w_['production']:.0f}/day but citizens and buildings use {w_['demand']:.0f}/day. More homes add pipes; a cleaner environment adds supply.",
            {"type": "policy", "key": "infrastructure_investment"})
    e = R["energy"]
    if e["production"] < e["demand"]:
        add("energy", "bad" if e["availability"] < 0.8 else "warn", "Energy is lower than demand. Consider building a power plant.",
            f"Power plants make {e['production']:.0f}/day but {e['demand']:.0f}/day is needed. Farms and factories slow down without energy.",
            {"type": "build", "key": "power_plant"})
    if sv["health_needed"] and sv["health_coverage"] < 0.8:
        add("health", "bad" if sv["health_coverage"] < 0.5 else "warn", "Healthcare capacity is low. Consider building a hospital.",
            f"{sv['health_needed']} citizens need care but hospitals can treat about {sv['health_capacity']:.0f} a day.",
            {"type": "build", "key": "hospital"})
    if m["unemployment_rate"] > 0.1:
        add("jobs", "bad" if m["unemployment_rate"] > 0.2 else "warn", "Unemployment is increasing. Consider supporting industrial development.",
            f"{m['unemployed']} of {m['labour_force']} working-age citizens ({m['unemployment_rate'] * 100:.0f}%) have no job. New factories and farms create jobs.",
            {"type": "policy", "key": "industrial_development"})
    if env["pollution"] > 40:
        add("pollution", "bad" if env["pollution"] > 60 else "warn", "Pollution is rising. Consider introducing environmental protection.",
            f"Pollution is {env['pollution']:.0f}/100, mostly from factories and power plants.", {"type": "policy", "key": "environmental_protection"})
    if sv["school_demand"] and sv["school_cov"] < 0.85:
        add("school", "warn", "Many children cannot get a school place. Consider building a school.",
            f"School places cover {sv['school_cov'] * 100:.0f}% of pupils; children who miss class may not finish school.", {"type": "build", "key": "school"})
    if sv["homeless"] > 5:
        add("housing", "warn", "Citizens are without homes. Consider building housing.",
            f"{sv['homeless']} citizens have no home, which lowers happiness and stops families growing.", {"type": "build", "key": "residential"})
    if s["economy"]["treasury"] < 300:
        add("money", "warn", "The treasury is low. Be careful with new spending.",
            f"Only {s['economy']['treasury']:.0f} left. Upkeep is paid every day and unpaid upkeep wears buildings down.", {"type": "none", "key": ""})
    r = s["research"]
    if not r["current"] and any(b["type"] == "research_centre" and b["status"] == "active" for b in s["buildings"].values()):
        add("research", "info", "Your research centre has no target. Choose a technology to research.",
            f"Research points are being saved ({r['pool']:.0f} banked) until you pick a technology.", {"type": "research", "key": ""})
    order = {"bad": 0, "warn": 1, "info": 2}
    recs.sort(key=lambda x: order[x["level"]])
    return recs
