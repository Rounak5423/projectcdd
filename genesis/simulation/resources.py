"""Food, water, energy and raw materials: production, demand, storage and shortages."""
from .config import (BUILDINGS, FARM_OUTPUT, POWER_OUTPUT, FACTORY_GOODS, FACTORY_MATERIAL_USE, BASE_EXTRACTION,
                     FOOD_PER_CITIZEN, WATER_PER_CITIZEN, ENERGY_PER_CITIZEN, RESOURCES)
from .infrastructure import level_mult

BASE_CAPACITY = {"food": 800, "water": 500, "energy": 300, "materials": 800}


def new_resource(stock):
    return {"stock": float(stock), "capacity": 800.0, "production": 0.0, "potential": 0.0, "consumption": 0.0,
            "demand": 0.0, "availability": 1.0, "distribution": 0.0, "efficiency": 1.0, "shortage": False,
            "shortage_days": 0, "wasted": 0.0}


def _settle(r, production, demand, potential, pop):
    r["production"] = production
    r["potential"] = potential
    r["demand"] = demand
    avail = min(1.0, (r["stock"] + production) / demand) if demand > 0 else 1.0
    used = demand * avail
    stock = r["stock"] + production - used
    r["wasted"] = max(0.0, stock - r["capacity"])
    r["stock"] = max(0.0, min(stock, r["capacity"]))
    r["consumption"] = used
    r["availability"] = avail
    r["distribution"] = used / pop if pop else 0.0
    r["efficiency"] = production / potential if potential > 0 else 1.0
    r["shortage"] = avail < 0.98
    r["shortage_days"] = r["shortage_days"] + 1 if r["shortage"] else 0


def step_resources(w, mods):
    s = w.s
    pop = len(s["citizens"])
    R = s["resources"]
    env = s["environment"]
    B = [b for b in s["buildings"].values() if b["status"] == "active"]

    def eff(b):
        return b["staff_ratio"] * (0.5 + 0.5 * b["condition"] / 100)

    def of(t):
        return [b for b in B if b["type"] == t]

    for res in RESOURCES:
        R[res]["capacity"] = BASE_CAPACITY[res] + sum(
            BUILDINGS[b["type"]]["storage"].get(res, 0) * level_mult(b["level"]) for b in B)

    # Energy first: other sectors depend on it.
    pot = sum(POWER_OUTPUT * level_mult(b["level"]) for b in of("power_plant")) * mods["energy"]
    prod = sum(POWER_OUTPUT * level_mult(b["level"]) * eff(b) for b in of("power_plant")) * mods["energy"]
    dem = pop * ENERGY_PER_CITIZEN + sum(BUILDINGS[b["type"]]["energy"] * level_mult(b["level"]) for b in B)
    _settle(R["energy"], prod, dem, pot, pop)
    ea = R["energy"]["availability"]

    # Water: supply from the environment plus local pipes in housing.
    homes = sum(level_mult(b["level"]) for b in of("residential"))
    supply = (200 + 8 * homes) * env["water_availability"] / 100 * mods["water"]
    dem = pop * WATER_PER_CITIZEN * mods["water_demand"] + sum(
        BUILDINGS[b["type"]]["water"] * level_mult(b["level"]) * (0.5 + 0.5 * b["staff_ratio"]) for b in B)
    _settle(R["water"], supply, dem, supply, pop)
    wa = R["water"]["availability"]

    # Food
    envf = max(0.3, 1 - 0.004 * max(0.0, env["pollution"] - 10))
    pot = sum(FARM_OUTPUT * level_mult(b["level"]) for b in of("farm")) * mods["food"] * envf
    prod = sum(FARM_OUTPUT * level_mult(b["level"]) * eff(b) for b in of("farm")) * mods["food"] * envf \
        * (0.6 + 0.4 * wa) * (0.6 + 0.4 * ea)
    _settle(R["food"], prod, pop * FOOD_PER_CITIZEN, pot, pop)

    # Raw materials: natural extraction (limited by sustainability) used by factories and upkeep.
    extraction = BASE_EXTRACTION * env["sustainability"] / 100 * mods["materials"]
    dem = sum(FACTORY_MATERIAL_USE * level_mult(b["level"]) * b["staff_ratio"] for b in of("factory")) + 0.4 * len(B)
    _settle(R["materials"], extraction, dem, BASE_EXTRACTION * mods["materials"], pop)
    ma = R["materials"]["availability"]

    # Industry (goods) - not a stored resource, feeds the economy.
    out = sum(FACTORY_GOODS * level_mult(b["level"]) * eff(b) for b in of("factory")) \
        * min(1.0, ma) * (0.6 + 0.4 * ea) * mods["industry"]
    potential = sum(FACTORY_GOODS * level_mult(b["level"]) for b in of("factory")) * mods["industry"]
    s["industry"] = {"output": out, "potential": potential}
