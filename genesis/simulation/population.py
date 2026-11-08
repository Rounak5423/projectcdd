"""Education, employment and demographics (births, deaths, migration, families)."""
import math
from collections import Counter
from .config import (BUILDINGS, PROFESSIONS, DAYS_PER_YEAR as DPY, BIRTH_RATE_YEAR)
from .citizens import new_citizen, remember
from .infrastructure import level_mult

PASS_DAYS = 0.55 * 6 * DPY      # attendance-equivalent days needed to pass primary / secondary
UNI_PASS_DAYS = 0.6 * 4 * DPY
FIELDS = {"medicine": "doctor", "engineering": "engineer", "science": "scientist", "teaching": "teacher"}


# ---------------------------------------------------------------- jobs ---
def build_slots(w):
    s = w.s
    slots = {}
    for b in s["buildings"].values():
        if b["status"] != "active":
            continue
        for prof, n in BUILDINGS[b["type"]]["jobs"].items():
            slots[(b["id"], prof)] = math.ceil(n * level_mult(b["level"]))
    pop = len(s["citizens"])
    slots[("sector", "service_worker")] = pop // 10
    slots[("sector", "government_employee")] = pop // 25 if s["economy"]["treasury"] > 0 else 0
    slots[("sector", "business_owner")] = pop // 30
    slots[("sector", "construction_worker")] = 2 + pop // 40
    return slots


def vacancies(w):
    """Open positions per profession (slots minus people currently employed in that profession)."""
    slots = build_slots(w)
    total = Counter()
    for (_, prof), n in slots.items():
        total[prof] += n
    for c in w.s["citizens"].values():
        if c["employed"]:
            total[c["profession"]] -= 1
    return {p: n for p, n in total.items() if n > 0}


def step_employment(w, mods):
    s = w.s
    r = w.rng
    cits = s["citizens"]
    day = w.day
    slots = build_slots(w)
    remaining = dict(slots)
    for c in cits.values():
        if c["employed"]:
            key = (c["employer"] or "sector", c["profession"])
            if remaining.get(key, 0) > 0:
                remaining[key] -= 1
            else:
                remember(c, day, f"Lost my job as a {c['profession'].replace('_', ' ')}.")
                c.update(employed=False, profession="unemployed", employer=None)
                s["daily"]["jobs_lost"] += 1
    keys_by_prof, vac = {}, Counter()
    for key, n in remaining.items():
        if n > 0:
            keys_by_prof.setdefault(key[1], []).append(key)
            vac[key[1]] += n
    seekers = [c for c in cits.values() if c["profession"] == "unemployed" and c["age"] >= 18]
    r.shuffle(seekers)
    for c in seekers:
        best, bs = None, -1.0
        for prof, n in vac.items():
            if n <= 0:
                continue
            prim, _, edu, minskill = PROFESSIONS[prof]
            if c["education"] >= edu and c["skills"][prim] >= minskill and c["skills"][prim] > bs:
                best, bs = prof, c["skills"][prim]
        if best:
            key = next(k for k in keys_by_prof[best] if remaining[k] > 0)
            remaining[key] -= 1
            vac[best] -= 1
            c.update(profession=best, employed=True, employer=None if key[0] == "sector" else key[0], target_prof=None)
            remember(c, day, f"Found a job as a {best.replace('_', ' ')}.")
            s["daily"]["jobs_found"] += 1
        else:
            tgt, tn = None, 0
            for prof, n in vac.items():
                if n > tn and c["education"] >= PROFESSIONS[prof][2]:
                    tgt, tn = prof, n
            c["target_prof"] = tgt
    filled = Counter(c["employer"] for c in cits.values() if c["employed"] and c["employer"])
    totals = Counter()
    for (emp, _), n in slots.items():
        totals[emp] += n
    for b in s["buildings"].values():
        b["workers"] = filled.get(b["id"], 0)
        b["staff_ratio"] = min(1.0, b["workers"] / totals[b["id"]]) if totals.get(b["id"]) else 0.0


# ----------------------------------------------------------- education ---
def step_education(w, mods):
    s = w.s
    r = w.rng
    day = w.day
    sv = s["services"]
    uni_occ = sum(1 for c in s["citizens"].values() if c["uni"])
    uni_cov = min(1.0, sv["uni_seats"] / uni_occ) if uni_occ else 1.0
    vac = None
    for c in s["citizens"].values():
        if c["profession"] == "student":
            gain = mods["edu"] * (0.6 + 0.4 * c["learning"])
            if c["uni"]:
                c["uni_days"] += gain * uni_cov
            elif r.random() < sv["school_cov"]:
                c["edu_days"] += gain
        age = (day - c["birth_day"]) // DPY
        if age == c["age"]:
            continue
        c["age"] = age
        if age == 6 and c["profession"] == "child":
            c.update(profession="student", edu_days=0.0)
            remember(c, day, "Started school.")
        elif age == 12 and c["profession"] == "student" and not c["uni"]:
            if c["edu_days"] >= PASS_DAYS:
                c["education"] = max(c["education"], 1)
                remember(c, day, "Finished primary school.")
            c["edu_days"] = 0.0
        elif age == 18 and c["profession"] == "student" and not c["uni"]:
            if c["edu_days"] >= PASS_DAYS:
                c["education"] = max(c["education"], 2)
                remember(c, day, "Finished secondary school.")
            c["edu_days"] = 0.0
            if c["education"] >= 2 and c["learning"] > 0.8 and sv["uni_free"] > 0:
                c.update(uni=True, uni_days=0.0)
                sv["uni_free"] -= 1
                remember(c, day, "Started university.")
            else:
                c.update(profession="unemployed", employed=False)
        elif age == 22 and c["uni"]:
            c["uni"] = False
            c.update(profession="unemployed", employed=False)
            if c["uni_days"] >= UNI_PASS_DAYS:
                vac = vac if vac is not None else vacancies(w)
                names = list(FIELDS)
                weights = [vac.get(FIELDS[f], 0) + 1 for f in names]
                field = r.choices(names, weights)[0]
                c["education"] = 3
                c["skills"][field] = round(max(c["skills"][field], 35 + r.uniform(0, 10)), 1)
                remember(c, day, f"Graduated from university (studied {field}).")
                s["daily"]["graduates"] += 1
            else:
                remember(c, day, "Left university without a degree.")
        elif age >= 65 and c["profession"] not in ("retired", "child", "student"):
            remember(c, day, "Retired.")
            c.update(profession="retired", employed=False, employer=None, target_prof=None)


# --------------------------------------------------------- demographics ---
def housing_free(w):
    free = {b["id"]: int(BUILDINGS["residential"]["capacity"] * level_mult(b["level"]))
            for b in w.s["buildings"].values() if b["type"] == "residential" and b["status"] == "active"}
    for c in w.s["citizens"].values():
        if c["home"] in free:
            free[c["home"]] -= 1
        else:
            c["home"] = None
    return free


def _most_free(free):
    best = None
    for bid, n in free.items():
        if n > 0 and (best is None or n > free[best]):
            best = bid
    return best


def step_demographics(w, mods):
    s = w.s
    r = w.rng
    day = w.day
    cits = s["citizens"]
    R = s["resources"]
    fa = R["food"]["availability"]
    free = housing_free(w)

    # homes for the homeless: family first, then any free home
    for c in list(cits.values()):
        if c["home"]:
            continue
        pool = [cits.get(p) for p in c["parents"] if p in cits] + [cits.get(c["partner"])]
        fam = next((p for p in pool if p and p["home"]), None)
        if fam:
            c["home"] = fam["home"]
            free[fam["home"]] = free.get(fam["home"], 0) - 1
        elif c["age"] >= 18 or not c["parents"]:
            h = _most_free(free)
            if h:
                c["home"] = h
                free[h] -= 1

    # pairing
    singles = [c for c in cits.values() if c["partner"] is None and 20 <= c["age"] <= 45 and c["profession"] != "student"]
    for c in singles:
        if c["partner"] is None and r.random() < 0.02:
            cand = [o for o in singles if o["partner"] is None and o["sex"] != c["sex"] and abs(o["age"] - c["age"]) <= 8
                    and o["id"] != c["id"]]
            if cand:
                o = r.choice(cand)
                c["partner"], o["partner"] = o["id"], c["id"]
                if not o["home"] and c["home"]:
                    o["home"] = c["home"]
                elif not c["home"] and o["home"]:
                    c["home"] = o["home"]
                remember(c, day, f"Became partners with {o['name']}.")
                remember(o, day, f"Became partners with {c['name']}.")

    # births
    for c in list(cits.values()):
        if c["sex"] == "F" and 18 <= c["age"] <= 40 and c["partner"] in cits and day - c["last_birth"] > DPY:
            p = BIRTH_RATE_YEAR / DPY * (0.6 + 0.8 * c["happiness"] / 100) * (1.5 if c["goal"] == "raise_family" else 1.0)
            p *= mods["birth"] * (1.0 if c["home"] else 0.3) * (1.0 if fa >= 0.8 else 0.4)
            if r.random() < p:
                dad = cits[c["partner"]]
                baby = new_citizen(w, 0, profession="child", surname=dad["family_name"], parents=[c["id"], dad["id"]],
                                   savings=0, home=c["home"])
                baby["happiness"] = 80.0
                c["children"].append(baby["id"])
                dad["children"].append(baby["id"])
                c["last_birth"] = day
                remember(c, day, f"Had a baby ({baby['name']}).")
                remember(dad, day, f"Became a parent ({baby['name']}).")
                s["daily"]["births"] += 1

    # deaths
    for c in list(cits.values()):
        age = c["age"]
        hazard = 0.02 if age == 0 else 0.0005 * math.exp(0.085 * age)
        hazard *= (1 + (100 - c["health"]) / 60) * (1 + 0.6 * (c["sick_days"] > 0))
        if c["needs"]["food"] < 25:
            hazard += 0.4
        if r.random() < 1 - (1 - min(0.95, hazard)) ** (1 / DPY):
            cause = "hunger" if c["needs"]["food"] < 25 else "illness" if c["sick_days"] > 0 else "old age" if age >= 60 else "poor health"
            part = cits.get(c["partner"])
            if part:
                part["partner"] = None
                remember(part, day, f"Lost my partner {c['name']}.")
            del cits[c["id"]]
            s["daily"]["deaths"] += 1
            s["daily"].setdefault("death_causes", []).append(cause)

    # migration
    free = housing_free(w)
    vac = vacancies(w)
    labour = [c for c in cits.values() if c["profession"] not in ("child", "student", "retired")]
    unemp = sum(1 for c in labour if not c["employed"]) / len(labour) if labour else 0.0
    avg_h = sum(c["happiness"] for c in cits.values()) / len(cits) if cits else 50.0
    attract = 0.3 * min(1.0, sum(vac.values()) / 10) + 0.25 * (1 if any(n > 0 for n in free.values()) else 0) \
        + 0.25 * avg_h / 100 + 0.2 * min(1.0, fa)
    s["daily"]["attractiveness"] = round(attract, 2)
    if vac and unemp < 0.15:
        for _ in range(3):
            h = _most_free(free)
            if h is None or r.random() > attract * 0.1 * mods["migration"]:
                continue
            names = list(vac)
            prof = r.choices(names, [vac[n] for n in names])[0]
            _, _, edu, _ = PROFESSIONS[prof]
            c = new_citizen(w, r.randint(20, 45), profession=prof, education=max(edu, 1), savings=100, home=h)
            c.update(profession="unemployed", employed=False)
            free[h] -= 1
            vac[prof] -= 1
            remember(c, day, "Moved here looking for work.")
            s["daily"]["immigrants"] += 1
            if vac[prof] <= 0:
                del vac[prof]
                if not vac:
                    break
    for c in list(cits.values()):
        if c["age"] >= 18 and c["happiness"] < 35 and (not c["employed"] or fa < 0.5) and r.random() < 0.01:
            del cits[c["id"]]
            s["daily"]["emigrants"] += 1
    t = s["totals"]
    for k_t, k_d in (("births", "births"), ("deaths", "deaths"), ("immigrants", "immigrants"), ("emigrants", "emigrants")):
        t[k_t] += s["daily"][k_d]
