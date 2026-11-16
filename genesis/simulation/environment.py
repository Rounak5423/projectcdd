"""Pollution, green cover, water availability, sustainability and overall environmental health."""
from .config import BUILDINGS, BASE_EXTRACTION
from .infrastructure import level_mult


def new_environment():
    return {"pollution": 15.0, "green_cover": 62.0, "water_availability": 85.0, "sustainability": 90.0,
            "env_health": 80.0, "emission_today": 0.0}


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def step_environment(w, mods):
    s = w.s
    env = s["environment"]
    B = [b for b in s["buildings"].values() if b["status"] == "active"]
    pop = len(s["citizens"])
    factories = sum(0.6 * level_mult(b["level"]) * b["staff_ratio"] for b in B if b["type"] == "factory")
    power = sum(0.5 * level_mult(b["level"]) * b["staff_ratio"] for b in B if b["type"] == "power_plant")
    parks = s["services"]["parks"]
    emission = (factories + power * mods["power_pollution"] + pop * 0.004) * mods["pollution"]
    decay = 0.06 + env["green_cover"] / 3000 + mods["add_pollution_decay"]
    env["emission_today"] = emission
    env["pollution"] = clamp(env["pollution"] * (1 - decay) + emission - 0.35 * parks, 0, 100)
    building_sites = sum(1 for b in s["buildings"].values() if b["status"] == "building")
    regrow = 0.03 if env["pollution"] < 30 else -0.02
    env["green_cover"] = clamp(env["green_cover"] + mods["add_green"] + 0.03 * parks + regrow
                               - 0.01 * building_sites, 5, 100)
    env["water_availability"] = clamp(85 - 0.25 * env["pollution"] + 0.12 * (env["green_cover"] - 50), 20, 100)
    used = s["resources"]["materials"]["production"] / BASE_EXTRACTION
    env["sustainability"] = clamp(env["sustainability"] - 0.04 * used + 0.05 + 0.5 * mods["add_green"], 20, 100)
    env["env_health"] = round(0.4 * (100 - env["pollution"]) + 0.3 * env["green_cover"]
                              + 0.2 * env["water_availability"] + 0.1 * env["sustainability"], 2)
