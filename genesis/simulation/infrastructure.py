"""Buildings: placing, upgrading, daily upkeep and the services they provide."""
from ..errors import GenesisError
from .config import BUILDINGS, MAP_SIZE, ROAD_STEP, MAX_LEVEL


def level_mult(level):
    return 1 + 0.5 * (level - 1)


def is_road(x, z):
    return x % ROAD_STEP == 0 or z % ROAD_STEP == 0


def tile_problem(w, x, z):
    if not isinstance(x, int) or not isinstance(z, int) or isinstance(x, bool) or isinstance(z, bool):
        return "Tile coordinates must be whole numbers."
    if not (0 <= x < MAP_SIZE and 0 <= z < MAP_SIZE):
        return "That spot is outside the map."
    if is_road(x, z):
        return "That spot is a road. Choose an empty green tile."
    if [x, z] in w.s["map"]["water"]:
        return "That spot is water. Choose dry land."
    for b in w.s["buildings"].values():
        if b["x"] == x and b["z"] == z:
            return "There is already a building on that tile."
    return None


def construction_cost(w, btype, mods):
    d = BUILDINGS[btype]
    return round(d["cost"] * mods["build_cost"]), round(d["materials"] * mods["build_cost"])


def _check_afford(w, cost, mats):
    if w.s["economy"]["treasury"] < cost:
        raise GenesisError(f"Not enough money: this costs {cost} but the treasury has {w.s['economy']['treasury']:.0f}.")
    if w.s["resources"]["materials"]["stock"] < mats:
        raise GenesisError(f"Not enough raw materials: this needs {mats} but you have "
                           f"{w.s['resources']['materials']['stock']:.0f}.")


def plan_construct(w, btype, x, z, mods):
    if btype not in BUILDINGS:
        raise GenesisError("Unknown building type.")
    problem = tile_problem(w, x, z)
    if problem:
        raise GenesisError(problem)
    cost, mats = construction_cost(w, btype, mods)
    _check_afford(w, cost, mats)
    d = BUILDINGS[btype]
    return {"type": btype, "label": d["label"], "x": x, "z": z, "cost": cost, "materials": mats,
            "build_days": d["build_days"], "purpose": d["purpose"], "benefit": d["benefit"],
            "limitation": d["limitation"], "maintenance_per_day": d["maintenance"]}


def construct(w, btype, x, z, mods, free=False):
    plan = plan_construct(w, btype, x, z, mods) if not free else None
    if free:
        d = BUILDINGS[btype]
        plan = {"cost": 0, "materials": 0, "build_days": d["build_days"]}
    w.s["economy"]["treasury"] -= plan["cost"]
    w.s["resources"]["materials"]["stock"] -= plan["materials"]
    b = {"id": w.next_id("B"), "type": btype, "x": x, "z": z, "level": 1, "status": "building",
         "remaining": plan["build_days"], "condition": 100.0, "staff_ratio": 0.0, "workers": 0,
         "started": w.day, "built": None}
    w.s["buildings"][b["id"]] = b
    d = BUILDINGS[btype]
    w.feed("info", f"Construction started: {d['label']}",
           f"Builders began a new {d['label'].lower()} at tile ({x}, {z}).",
           why="You ordered it.", effect=f"It opens in {plan['build_days']} days. Cost {plan['cost']} money and "
                                         f"{plan['materials']} raw materials.", action="")
    return b


def upgrade_cost(w, b, mods):
    d = BUILDINGS[b["type"]]
    return round(d["cost"] * 0.7 * b["level"] * mods["build_cost"]), round(d["materials"] * 0.7 * b["level"] * mods["build_cost"])


def plan_upgrade(w, bid, mods):
    b = w.s["buildings"].get(bid)
    if not b:
        raise GenesisError("Building not found.")
    if b["status"] != "active":
        raise GenesisError("This building is still being constructed.")
    if b["level"] >= MAX_LEVEL:
        raise GenesisError("This building is already at the maximum level.")
    cost, mats = upgrade_cost(w, b, mods)
    _check_afford(w, cost, mats)
    d = BUILDINGS[b["type"]]
    return {"id": bid, "label": d["label"], "from_level": b["level"], "to_level": b["level"] + 1,
            "cost": cost, "materials": mats, "benefit": "Output, capacity and job slots grow by 50% of the base value.",
            "limitation": "Upkeep also rises by 50% of the base value."}


def upgrade(w, bid, mods):
    plan = plan_upgrade(w, bid, mods)
    w.s["economy"]["treasury"] -= plan["cost"]
    w.s["resources"]["materials"]["stock"] -= plan["materials"]
    b = w.s["buildings"][bid]
    b["level"] += 1
    w.feed("good", f"{plan['label']} upgraded", f"The {plan['label'].lower()} is now level {b['level']}.",
           why="You paid for the upgrade.", effect="More capacity, output and jobs.", action="")
    return b


def compute_services(w, mods=None):
    from .governance import get_modifiers
    mods = mods or get_modifiers(w)
    s = w.s
    en = s["resources"]["energy"]["availability"]
    sv = s["services"]
    hc = sc = uc = 0.0
    parks = res_cap = 0.0
    for b in s["buildings"].values():
        if b["status"] != "active":
            continue
        lm = level_mult(b["level"])
        q = b["staff_ratio"] * (0.5 + 0.5 * b["condition"] / 100) * (0.6 + 0.4 * en)
        d = BUILDINGS[b["type"]]
        if b["type"] == "hospital":
            hc += d["capacity"] * lm * q
        elif b["type"] == "school":
            sc += d["capacity"] * lm * q
        elif b["type"] == "university":
            uc += d["capacity"] * lm * q
        elif b["type"] == "park":
            parks += lm
        elif b["type"] == "residential":
            res_cap += d["capacity"] * lm
    cits = s["citizens"].values()
    needed = sum(1 for c in cits if c["sick_days"] > 0 or c["health"] < 50)
    pupils = sum(1 for c in cits if c["profession"] == "student" and not c["uni"])
    uni_occ = sum(1 for c in cits if c["uni"])
    sv.update(health_capacity=hc * mods["health_cap"], health_needed=needed,
              health_coverage=min(1.0, hc * mods["health_cap"] / needed) if needed else 1.0,
              school_seats=sc, school_demand=pupils, school_cov=min(1.0, sc / pupils) if pupils else 1.0,
              uni_seats=uc, uni_free=max(0, int(uc - uni_occ)), parks=parks,
              housing_capacity=res_cap, homeless=sum(1 for c in cits if not c["home"]))


def step_infrastructure(w, mods):
    from .progression import add_xp
    s = w.s
    eco = s["economy"]
    for b in s["buildings"].values():
        if b["status"] == "building":
            b["remaining"] -= 1
            if b["remaining"] <= 0:
                b["status"] = "active"
                b["built"] = w.day
                d = BUILDINGS[b["type"]]
                w.feed("good", f"New {d['label'].lower()} opened",
                       f"A new {d['label'].lower()} finished construction and is now open.",
                       why="You ordered its construction.", effect=d["benefit"],
                       action="It needs workers; unemployed citizens will apply over the next days.")
                add_xp(w, 10, f"build:{b['id']}")
    active = [b for b in s["buildings"].values() if b["status"] == "active"]
    due = sum(BUILDINGS[b["type"]]["maintenance"] * level_mult(b["level"]) for b in active) * mods["maintenance"]
    paid = min(max(eco["treasury"], 0), due)
    eco["treasury"] -= paid
    eco["spend_today"]["maintenance"] += paid
    ratio = paid / due if due else 1.0
    for b in active:
        before = b["condition"]
        if ratio >= 0.99:
            b["condition"] = min(100.0, b["condition"] + 0.35)
        else:
            b["condition"] = max(0.0, b["condition"] - 0.15 - 1.0 * (1 - ratio))
        if before >= 40 > b["condition"]:
            d = BUILDINGS[b["type"]]
            w.feed("warning", f"{d['label']} is falling into disrepair", f"The {d['label'].lower()} at ({b['x']}, {b['z']}) is in poor condition.",
                   why="The treasury could not pay full maintenance.", effect="Its output drops.",
                   action="Raise tax income or avoid new spending so upkeep can be paid.")
    compute_services(w, mods)
