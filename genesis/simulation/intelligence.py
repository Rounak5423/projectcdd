"""Citizen behaviour: needs, goals, rule-based decisions, learning, health and happiness.

This is transparent rule-based intelligence (no trained model). Each rule is a small function
so a machine-learning policy can later replace `decide()` without touching the rest.
"""
from .config import PROFESSIONS, MAP_SIZE, LIVING_COST, DAYS_PER_YEAR as DPY
from .citizens import remember


def clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


def choose_goal(c, day):
    if c["sick_days"] > 0 or c["health"] < 50:
        return "get_healthy"
    if c["profession"] == "student":
        return "study"
    if c["age"] >= 18 and not c["employed"] and c["profession"] != "retired":
        return "retrain" if c["target_prof"] else "find_job"
    if c["profession"] == "retired" or c["age"] < 6:
        return "contribute"
    if c["savings"] < 60:
        return "save_money"
    if c["sex"] == "F" and c["partner"] and 20 <= c["age"] <= 38 and day - c["last_birth"] > DPY * 1.5:
        return "raise_family"
    return "contribute"


def decide(c):
    """Decision rules in priority order (return the activity for today)."""
    n = c["needs"]
    if c["sick_days"] > 0 or c["health"] < 50:
        return "seek_healthcare"
    if c["age"] < 6:
        return "play"
    if c["profession"] == "student":
        return "study"
    if n["rest"] < 25:
        return "rest"
    if c["employed"]:
        return "socialise" if n["social"] < 25 else "work"
    if c["profession"] == "retired":
        return "socialise" if n["social"] < 50 else "rest"
    return "retrain" if c["target_prof"] else "seek_work"


def step_citizens(w, mods):
    s = w.s
    r = w.rng
    day = w.day
    R, env, sv = s["resources"], s["environment"], s["services"]
    fa, wa = R["food"]["availability"], R["water"]["availability"]
    parks = sv["parks"]
    cits = list(s["citizens"].values())
    # healthcare is rationed by hospital capacity, sickest first
    seekers = sorted((c for c in cits if decide(c) == "seek_healthcare"), key=lambda c: c["health"])
    cap = int(sv["health_capacity"])
    treated = {c["id"] for c in seekers[:cap]}
    for c in cits:
        n = c["needs"]
        n["food"] = clamp(0.6 * n["food"] + 0.4 * 100 * fa)
        n["water"] = clamp(0.6 * n["water"] + 0.4 * 100 * wa)
        n["social"] = clamp(n["social"] - 4 + (1.5 if parks else 0))
        n["purpose"] = clamp(n["purpose"] - 1)
        c["goal"] = choose_goal(c, day)
        act = decide(c)
        if act == "seek_healthcare":
            act = "healthcare" if c["id"] in treated else "rest"
        c["activity"] = act
        if act == "work":
            prim = PROFESSIONS[c["profession"]][0]
            c["skills"][prim] = round(min(100, c["skills"][prim] + 0.12 * c["learning"]), 2)
            n["purpose"] = clamp(n["purpose"] + 3)
            n["rest"] = clamp(n["rest"] - 6)
        elif act == "study":
            n["rest"] = clamp(n["rest"] - 4)
            n["purpose"] = clamp(n["purpose"] + 1)
        elif act == "retrain":
            prim = PROFESSIONS[c["target_prof"]][0]
            before = c["skills"][prim]
            c["skills"][prim] = round(min(100, before + 0.8 * c["learning"]), 2)
            if int(before // 10) != int(c["skills"][prim] // 10):
                remember(c, day, f"Practising {prim} to qualify as a {c['target_prof'].replace('_', ' ')}.")
            n["rest"] = clamp(n["rest"] - 4)
        elif act == "seek_work":
            n["purpose"] = clamp(n["purpose"] - 2)
            n["rest"] = clamp(n["rest"] - 2)
        elif act == "rest":
            n["rest"] = clamp(n["rest"] + 30)
        elif act == "socialise":
            n["social"] = clamp(n["social"] + 25 + (10 if parks else 0))
            n["rest"] = clamp(n["rest"] + 10)
        elif act == "play":
            n["social"] = clamp(n["social"] + 10)
            n["rest"] = clamp(n["rest"] + 10)
        elif act == "healthcare":
            n["rest"] = clamp(n["rest"] + 10)
            s["daily"]["treated"] += 1
        # ---- health
        was_sick = c["sick_days"] > 0
        d = 0.28 - 0.0032 * c["health"]
        if n["food"] < 40:
            d -= 1.5
        if n["water"] < 40:
            d -= 2.0
        if env["pollution"] > 40:
            d -= (env["pollution"] - 40) * 0.02
        if c["age"] > 50:
            d -= (c["age"] - 50) * 0.012
        if c["sick_days"] > 0:
            d -= 1.0
            c["sick_days"] -= 1
        if act == "healthcare":
            d += 6 * mods["recovery"]
            if r.random() < 0.7:
                c["sick_days"] = 0
        elif c["sick_days"] == 0 and r.random() < (0.002 * (1 + env["pollution"] / 50) + mods["add_disease"]) * mods["disease"]:
            c["sick_days"] = r.randint(5, 12)
            s["daily"]["sick_new"] += 1
            remember(c, day, "Fell ill.")
        c["health"] = round(clamp(c["health"] + d), 2)
        if was_sick and c["sick_days"] == 0:
            remember(c, day, "Recovered from illness.")
        # ---- happiness
        needs_avg = sum(n.values()) / 5
        inc_sat = 70.0 if c["age"] < 18 else clamp(100 * (c["income"] + 0.01) / (LIVING_COST * 1.5))
        busy = 100 if (c["employed"] or c["profession"] in ("student", "retired", "child")) else 25
        target = (0.28 * needs_avg + 0.2 * c["health"] + 0.15 * inc_sat + 0.10 * (100 if c["home"] else 20)
                  + 0.12 * env["env_health"] + 0.15 * busy + mods["add_happiness"] * 4 + min(1, parks * 0.25) * 6)
        c["happiness"] = round(clamp(c["happiness"] + 0.2 * (clamp(target) - c["happiness"])), 2)
    place_citizens(w)


def place_citizens(w):
    """Give every citizen a map position that matches today's activity."""
    s = w.s
    r = w.rng
    act_b = {t: [b for b in s["buildings"].values() if b["type"] == t and b["status"] == "active"]
             for t in ("school", "university", "hospital", "park")}
    mid = MAP_SIZE / 2
    for c in s["citizens"].values():
        a = c["activity"]
        tgt = None
        if a == "work" and c["employer"] in s["buildings"]:
            tgt = s["buildings"][c["employer"]]
        elif a == "study":
            lst = act_b["university"] if c["uni"] else act_b["school"]
            tgt = lst[int(c["id"][1:]) % len(lst)] if lst else None
        elif a == "healthcare" and act_b["hospital"]:
            tgt = act_b["hospital"][int(c["id"][1:]) % len(act_b["hospital"])]
        elif a in ("socialise", "play") and act_b["park"]:
            tgt = act_b["park"][int(c["id"][1:]) % len(act_b["park"])]
        elif a in ("rest", "play", "socialise", "healthcare", "work", "study") and c["home"] in s["buildings"]:
            tgt = s["buildings"][c["home"]]
        if tgt:
            c["x"] = round(tgt["x"] + 0.5 + r.uniform(-0.38, 0.38), 2)
            c["z"] = round(tgt["z"] + 0.5 + r.uniform(-0.38, 0.38), 2)
        else:  # town square (also where homeless citizens gather)
            c["x"] = round(mid + r.uniform(-3, 3), 2)
            c["z"] = round(mid + r.uniform(-3, 3), 2)
