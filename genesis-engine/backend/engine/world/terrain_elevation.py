"""
GENESIS Engine v2.0 - Authoritative Terrain Elevation Service
Mirroring the mathematical landscape elevation models of the 3D world engine.
"""

import math
from typing import Tuple, Dict, Any

VALID_TERRAIN_TYPES = [
    "Verdant River Valley",
    "Highland Plateau",
    "Archipelago",
    "Boreal Basin",
    "Arid Oasis",
    "Crimson Canyon",
    "Frostpeak Taiga",
    "Obsidian Caldera",
]


def get_river_z(x: float) -> float:
    natural = -3.0 + x * 0.235 + math.sin(x * 0.044) * 7.8 + math.sin(x * 0.105 + 0.7) * 1.4 + math.cos(x * 0.19) * 0.5
    nat_w = -3.0 + (-25.0) * 0.235 + math.sin((-25.0) * 0.044) * 7.8 + math.sin((-25.0) * 0.105 + 0.7) * 1.4 + math.cos((-25.0) * 0.19) * 0.5
    nat_c = -3.0 + 0.0 + math.sin(0.0) * 7.8 + math.sin(0.7) * 1.4 + math.cos(0.0) * 0.5
    nat_e = -3.0 + 25.0 * 0.235 + math.sin(25.0 * 0.044) * 7.8 + math.sin(25.0 * 0.105 + 0.7) * 1.4 + math.cos(25.0 * 0.19) * 0.5

    gw = math.exp(-math.pow((x - (-25.0)) / 8.0, 2))
    gc = math.exp(-math.pow(x / 8.0, 2))
    ge = math.exp(-math.pow((x - 25.0) / 8.0, 2))

    return natural + (-16.2 - nat_w) * gw + (-3.0 - nat_c) * gc + (8.0 - nat_e) * ge


def get_river_derivative(x: float) -> Tuple[float, float]:
    dz = (get_river_z(x + 0.1) - get_river_z(x - 0.1)) / 0.2
    length = math.hypot(1.0, dz)
    return (1.0 / length, dz / length)


def get_river_path(x: float) -> Tuple[float, float]:
    z = get_river_z(x)
    base_w = 12.4
    meander_var = math.sin(x * 0.072 + 0.5) * 1.6 + math.cos(x * 0.13) * 0.8
    gw = math.exp(-math.pow((x - (-25.0)) / 6.0, 2)) * 2.8
    gc = math.exp(-math.pow(x / 6.0, 2)) * 2.2
    ge = math.exp(-math.pow((x - 25.0) / 6.0, 2)) * 2.6
    width = max(8.8, base_w + meander_var - gw - gc - ge)
    return (z, width)


def get_core_terrain_height(x: float, z: float, terrain_type: str = "Verdant River Valley") -> float:
    if terrain_type == "Archipelago":
        islands = [
            {"x": 0.0, "z": 13.0, "r": 16.0, "h": 1.25},
            {"x": -28.0, "z": -14.0, "r": 18.0, "h": 1.6},
            {"x": 26.0, "z": -16.0, "r": 17.0, "h": 1.5},
            {"x": -22.0, "z": 24.0, "r": 15.0, "h": 1.2},
            {"x": 24.0, "z": 25.0, "r": 15.0, "h": 1.2},
        ]
        max_elev = -1.1
        for isl in islands:
            d = math.hypot(x - isl["x"], z - isl["z"])
            if d < isl["r"]:
                t = math.cos((d / isl["r"]) * (math.pi / 2.0))
                elev = isl["h"] * t - (1.0 - t) * 0.2
                if elev > max_elev:
                    max_elev = elev
        max_elev += math.sin(x * 0.2) * math.cos(z * 0.2) * 0.08
        return max_elev

    if terrain_type == "Crimson Canyon":
        canyon_z = x * 0.18 + math.sin(x * 0.08) * 8.0
        dist_canyon = abs(z - canyon_z)
        if dist_canyon < 9.0:
            t = dist_canyon / 9.0
            return -0.85 + math.pow(t, 2.0) * 1.2
        mesa_step = math.floor(min(3.0, (dist_canyon - 9.0) / 7.0))
        mesa_base = 1.1 + mesa_step * 1.0
        roughness = math.sin(x * 0.15) * math.cos(z * 0.15) * 0.12
        if math.hypot(x, z - 13.0) < 13.0:
            return 1.15
        return mesa_base + roughness

    if terrain_type == "Frostpeak Taiga":
        lake_dist = math.hypot(x - (-38.0), z - (-22.0))
        if lake_dist < 12.2:
            return -1.35 * math.cos((lake_dist / 12.2) * (math.pi / 2.0))
        dist_citadel = math.hypot(x, z - 13.0)
        if dist_citadel < 12.0:
            return 0.95
        taiga_noise = math.sin(x * 0.12) * 0.35 + math.cos(z * 0.1) * 0.35
        if z < -28.0 or x < -32.0:
            dist_flank = max(-28.0 - z, -32.0 - x)
            return 1.2 + taiga_noise + (dist_flank / 15.0) * 7.5
        return 0.65 + taiga_noise

    if terrain_type == "Obsidian Caldera":
        center_dist = math.hypot(x, z - 2.0)
        if center_dist < 11.0:
            return -0.9 * math.cos((center_dist / 11.0) * (math.pi / 2.0))
        if 11.0 <= center_dist < 36.0:
            rim_progress = (center_dist - 11.0) / 25.0
            rim_height = math.sin(rim_progress * math.pi) * 4.5
            if math.hypot(x, z - 13.0) < 12.0:
                return 1.15
            return 0.6 + rim_height + math.sin(x * 0.2 + z * 0.2) * 0.2
        return 0.8 + math.cos(center_dist * 0.1) * 0.4

    if terrain_type == "Highland Plateau":
        if abs(x) > 42.0 or abs(z) > 42.0:
            edge_dist = max(abs(x) - 42.0, abs(z) - 42.0)
            return max(-0.5, 2.1 - edge_dist * 0.5)
        return 1.9 + math.sin(x * 0.08) * 0.15 + math.cos(z * 0.08) * 0.15

    if terrain_type == "Arid Oasis":
        oasis_dist = math.hypot(x, z - 6.0)
        if oasis_dist < 8.5:
            return -0.65 * math.cos((oasis_dist / 8.5) * (math.pi / 2.0))
        if math.hypot(x, z - 13.0) < 12.0:
            return 0.85
        dunes = math.sin(x * 0.14 + z * 0.06) * 0.75 + math.cos(z * 0.12 - x * 0.04) * 0.45
        return 0.6 + dunes

    # Default: Verdant River Valley (and Boreal Basin)
    lake_dist = math.hypot(x - (-38.0), z - (-22.0))
    if lake_dist < 12.2:
        depth_factor = math.cos((lake_dist / 12.2) * (math.pi / 2.0))
        return -1.35 * depth_factor

    rz, width = get_river_path(x)
    tangent_x, _ = get_river_derivative(x)
    dist_perp = abs(z - rz) * tangent_x
    half_w = width * 0.5

    if dist_perp < half_w + 4.2:
        y_water = -0.14
        if dist_perp < half_w:
            norm_d = dist_perp / half_w
            bed_depth = 0.95 * math.pow(1.0 - math.pow(norm_d, 1.6), 0.85)
            return y_water - bed_depth
        else:
            bank_progress = min(1.0, (dist_perp - half_w) / 4.2)
            bank_s = bank_progress * bank_progress * (3.0 - 2.0 * bank_progress)
            base_ground = 0.42
            if math.hypot(x, z - 13.0) < 13.0:
                base_ground = 0.85
            elif math.hypot(x - (-28.0), z - (-20.0)) < 16.0:
                base_ground = 1.2
            elif math.hypot(x - 32.0, z - (-16.0)) < 18.0:
                base_ground = 0.75
            elif math.hypot(x - (-24.0), z - 28.0) < 20.0:
                base_ground = 0.42
            return y_water + bank_s * (base_ground - y_water)

    dist_citadel = math.hypot(x, z - 13.0)
    if dist_citadel < 12.0:
        t = 1.0 - dist_citadel / 12.0
        return 0.82 + t * 0.35

    dist_science = math.hypot(x - (-28.0), z - (-20.0))
    if dist_science < 16.0:
        return 1.4 + (1.0 - dist_science / 16.0) * 1.0

    dist_ind = math.hypot(x - 32.0, z - (-16.0))
    if dist_ind < 18.0:
        return 0.75 + (1.0 - dist_ind / 18.0) * 0.25

    dist_agri = math.hypot(x - (-24.0), z - 28.0)
    if dist_agri < 20.0:
        return 0.42 + math.sin(x * 0.2) * 0.12

    dist_res = math.hypot(x - 20.0, z - 26.0)
    if dist_res < 18.0:
        return 0.55 + math.cos(z * 0.15) * 0.15

    if z < -34.0 or x < -40.0 or (x > 38.0 and z < -14.0):
        mountain_strength = 0.0
        if z < -34.0:
            mountain_strength = max(mountain_strength, (-34.0 - z) / 20.0)
        if x < -40.0:
            mountain_strength = max(mountain_strength, (-40.0 - x) / 18.0)
        if x > 38.0 and z < -14.0:
            mountain_strength = max(mountain_strength, (x - 38.0) / 18.0)
        mountain_strength = min(1.0, mountain_strength)
        ridge_noise = (
            math.sin(x * 0.16 + 1.2) * 3.2
            + math.cos(z * 0.18 + 0.8) * 3.6
            + math.sin((x - z) * 0.12) * 2.8
        )
        return 0.5 + mountain_strength * (11.5 + ridge_noise)

    return 0.42 + math.sin(x * 0.08) * 0.14 + math.cos(z * 0.08) * 0.14


def get_terrain_height(x: float, z: float, terrain_type: str = "Verdant River Valley") -> float:
    """Master terrain elevation function returning exact height at (x, z)."""
    return get_core_terrain_height(x, z, terrain_type)
