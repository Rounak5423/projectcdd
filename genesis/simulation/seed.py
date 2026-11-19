"""Creating a brand-new, seeded civilisation."""
import time
from ..models.world import World
from .config import MAP_SIZE, BUILDINGS, PROFESSIONS, DAYS_PER_YEAR as DPY
from .citizens import new_citizen
from .economy import new_economy
from .environment import new_environment
from .events import new_events_state
from .governance import default_policy_state
from .infrastructure import is_road, level_mult, compute_services
from .population import build_slots
from .progression import new_progression, new_grc, grant_grc
from .research import default_research_state
from .resources import new_resource

LAYOUT = [("residential", 18, (11, 17)), ("farm", 6, (9, 29)), ("hospital", 1, (17, 17)), ("school", 2, (15, 15)),
          ("university", 1, (21, 15)), ("factory", 2, (28, 9)), ("power_plant", 2, (31, 14)),
          ("research_centre", 1, (18, 9)), ("park", 2, (17, 21))]


def _make_water(rng):
    cx, cz = rng.choice([(5, 5), (30, 31), (31, 4), (4, 31)])
    water = []
    for x in range(MAP_SIZE):
        for z in range(MAP_SIZE):
            if is_road(x, z):
                continue
            d = ((x - cx) ** 2 + (z - cz) ** 2) ** 0.5
            if d < 3.2 + rng.random() * 1.2:
                water.append([x, z])
    return water


def _free_tiles(w, center):
    taken = {(b["x"], b["z"]) for b in w.s["buildings"].values()}
    water = {tuple(t) for t in w.s["map"]["water"]}
    tiles = [(x, z) for x in range(MAP_SIZE) for z in range(MAP_SIZE)
             if not is_road(x, z) and (x, z) not in taken and (x, z) not in water]
    tiles.sort(key=lambda t: ((t[0] - center[0]) ** 2 + (t[1] - center[1]) ** 2, t))
    return tiles


def create_world(seed=42, name="My Civilisation"):
    state = {
        "meta": {"world_id": "main", "name": name, "seed": seed, "day": 0, "status": "paused", "speed": 1,
                 "kind": "main", "parent_id": None, "created": time.time(), "counters": {}},
        "map": {"size": MAP_SIZE, "road_step": 6, "water": []},
        "citizens": {}, "buildings": {},
        "resources": {"food": new_resource(450), "water": new_resource(300), "energy": new_resource(150),
                      "materials": new_resource(500)},
        "industry": {"output": 0.0, "potential": 0.0},
        "economy": new_economy(4500), "environment": new_environment(),
        "services": {"health_capacity": 0, "health_needed": 0, "health_coverage": 1.0, "school_seats": 0, "school_demand": 0,
                     "school_cov": 1.0, "uni_seats": 0, "uni_free": 0, "parks": 0, "housing_capacity": 0, "homeless": 0},
        "policies": default_policy_state(), "events": new_events_state(), "progression": new_progression(),
        "research": default_research_state(), "grc": new_grc(), "experiments": [], "history": [], "feed": [],
        "daily": {"births": 0, "deaths": 0, "immigrants": 0, "emigrants": 0, "jobs_found": 0, "jobs_lost": 0,
                  "graduates": 0, "sick_new": 0, "treated": 0},
        "metrics": {}, "custom_mods": {}, "totals": {"births": 0, "deaths": 0, "immigrants": 0, "emigrants": 0},
        "settings": {"offline_progression": False}, "rng": None,
    }
    w = World(state)
    w.rng.seed(seed)
    state["map"]["water"] = _make_water(w.rng)
    for btype, n, center in LAYOUT:
        tiles = _free_tiles(w, center)
        for i in range(n):
            x, z = tiles[i]
            bid = w.next_id("B")
            state["buildings"][bid] = {"id": bid, "type": btype, "x": x, "z": z, "level": 1, "status": "active",
                                       "remaining": 0, "condition": 100.0, "staff_ratio": 0.0, "workers": 0,
                                       "started": 0, "built": 0}
            tiles = _free_tiles(w, center)
    _seed_population(w)
    from .infrastructure import compute_services
    compute_services(w)
    grant_grc(w, 20, "Welcome grant to start your first experiment", "grant:start")
    w.feed("info", "Welcome to GENESIS", "Your civilisation has been founded.",
           why="A seeded starting society was created: homes, farms, a hospital, schools and more.",
           effect="Press Start (Control tab) to let time pass, or step one day at a time.",
           action="Open Help to learn what to do.")
    from .metrics import record_history
    record_history(w)
    return w


def _seed_population(w):
    s, r = w.s, w.rng
    slots = build_slots(w)
    # assume the final population is about 1.9x the workforce when sizing sector jobs
    workers_target = {}
    for (emp, prof), n in slots.items():
        if emp != "sector":
            workers_target[(emp, prof)] = n
    sector_total = 215
    sect = {"service_worker": sector_total // 10, "government_employee": sector_total // 25,
            "business_owner": sector_total // 30, "construction_worker": 2 + sector_total // 40}
    for p, n in sect.items():
        workers_target[("sector", p)] = n
    adults = []
    for (emp, prof), n in workers_target.items():
        _, _, edu, _ = PROFESSIONS[prof]
        for _ in range(max(0, round(n * 0.96))):
            c = new_citizen(w, r.randint(23, 62), profession=prof, education=max(edu, r.choice([1, 2, 2, 3]) if edu < 3 else 3))
            c["employer"] = None if emp == "sector" else emp
            adults.append(c)
    n_work = len(adults)
    total = int(n_work / 0.52)
    dep = []
    for _ in range(int(total * 0.12)):
        dep.append(new_citizen(w, r.randint(0, 5), profession="child"))
    for _ in range(int(total * 0.20)):
        a = r.randint(6, 21)
        dep.append(new_citizen(w, a, profession="student", education=0 if a < 12 else 1 if a < 18 else 2))
    for _ in range(int(total * 0.09)):
        dep.append(new_citizen(w, r.randint(65, 82), profession="retired", education=r.choice([0, 1, 1, 2])))
    for _ in range(int(total * 0.05)):
        adults.append(new_citizen(w, r.randint(20, 55), education=r.choice([1, 1, 2])))
    for c in dep:
        c["uni"] = c["profession"] == "student" and c["age"] >= 18
    # families: pair adults, hand dependents to parents
    men = [c for c in adults if c["sex"] == "M"]
    women = [c for c in adults if c["sex"] == "F"]
    r.shuffle(men)
    r.shuffle(women)
    couples = []
    for m_ in men:
        match = next((f for f in women if f["partner"] is None and abs(f["age"] - m_["age"]) <= 8), None)
        if match:
            m_["partner"], match["partner"] = match["id"], m_["id"]
            match["family_name"] = m_["family_name"]
            match["name"] = match["name"].split()[0] + " " + m_["family_name"]
            couples.append((m_, match))
    kids = [c for c in dep if c["profession"] in ("child", "student")]
    for k in kids:
        pool = [cp for cp in couples if cp[1]["age"] - k["age"] >= 20 and cp[1]["age"] - k["age"] <= 45 and len(cp[1]["children"]) < 3]
        if pool:
            m_, f_ = r.choice(pool)
            f_["children"].append(k["id"])
            m_["children"].append(k["id"])
            k["parents"] = [f_["id"], m_["id"]]
            k["family_name"] = m_["family_name"]
            k["name"] = k["name"].split()[0] + " " + m_["family_name"]
    # homes
    homes = [b for b in s["buildings"].values() if b["type"] == "residential"]
    cap = {b["id"]: int(14 * level_mult(b["level"])) for b in homes}
    order = [c for c in s["citizens"].values() if not c["parents"]]
    for c in order:
        if c["home"]:
            continue
        group = [c]
        if c["partner"]:
            group.append(s["citizens"][c["partner"]])
        for x in list(group):
            group += [s["citizens"][k] for k in x["children"] if k in s["citizens"]]
        seen = []
        group = [g for g in group if not (g["id"] in seen or seen.append(g["id"]))]
        home = max(cap, key=lambda b: (cap[b], b))
        if cap[home] < len(group):
            home = max(cap, key=lambda b: cap[b])
        for g in group:
            if cap[home] > 0:
                g["home"] = home
                cap[home] -= 1
    # unplaced (e.g. orphan dependents) take any free space
    for c in s["citizens"].values():
        if not c["home"]:
            free = [b for b in cap if cap[b] > 0]
            if free:
                c["home"] = free[0]
                cap[free[0]] -= 1
    # an initial staffing pass so buildings produce from day 1
    from .population import step_employment
    from .governance import get_modifiers
    s["daily"]["jobs_found"] = s["daily"]["jobs_lost"] = 0
    step_employment(w, get_modifiers(w))
    s["daily"]["jobs_found"] = s["daily"]["jobs_lost"] = 0
    for c in s["citizens"].values():
        c["memories"] = [{"day": 0, "text": "Was part of the founding generation."}]
        c["savings"] = round(c["savings"], 1)
