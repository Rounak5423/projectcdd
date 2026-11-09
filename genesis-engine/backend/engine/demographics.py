"""
Authoritative Demographics and Citizen Management Module
Single source of truth for citizen lifecycle, realistic age distributions,
housing allocation, and demographic vital synchronization.
"""

import math
import random
import uuid
import os
from typing import Dict, List, Optional, Tuple, Any
import sqlite3

DEMOGRAPHIC_AGE_DISTRIBUTION = [
    # (min_age, max_age, weight)
    (0.0, 14.9, 0.18),    # Children
    (15.0, 24.9, 0.15),   # Students / Young Adults
    (25.0, 54.9, 0.45),   # Prime Working / Fertile Adults
    (55.0, 64.9, 0.12),   # Mature Adults
    (65.0, 82.0, 0.10),   # Seniors
]

PIONEER_OCCUPATIONS = [
    'Expedition Commander', 'Botanist & Agronomist', 'Civil Infrastructure Engineer',
    'Energy Systems Technician', 'Hydrological Specialist', 'Materials Fabricator',
    'Field Medic', 'Cartographer & Surveyor', 'Biosphere Ecologist', 'Data & Comms Specialist',
    'Architectural Mason', 'Transport Logistics Pilot', 'Environmental Geologist',
    'Urban Planner', 'Robotics Technician', 'Biochemist', 'Solar Array Operator'
]


def sample_realistic_age() -> float:
    """Samples a human age according to realistic demographic pyramid."""
    r = random.random()
    cumulative = 0.0
    for min_age, max_age, weight in DEMOGRAPHIC_AGE_DISTRIBUTION:
        cumulative += weight
        if r <= cumulative:
            return round(random.uniform(min_age, max_age), 1)
    return round(random.uniform(25.0, 50.0), 1)


def sample_health_for_age(age: float) -> float:
    """Samples realistic baseline health based on age."""
    if age < 18.0:
        base = random.uniform(0.90, 0.98)
    elif age < 55.0:
        base = random.uniform(0.80, 0.95)
    else:
        deficit = (age - 55.0) * 0.008
        base = max(0.40, random.uniform(0.70, 0.88) - deficit)
    return round(base, 3)


def spawn_citizens_for_world(
    conn: sqlite3.Connection,
    world_id: str,
    count: int,
    residential_building_ids: List[str],
    work_building_ids: Optional[List[str]] = None,
    center_x: float = 16.0,
    center_y: float = 16.0
) -> List[str]:
    """
    Spawns real citizens in the database, assigning them to residential homes
    and workplaces, updating occupancy counters atomically.
    """
    if count <= 0 or not residential_building_ids:
        return []

    spawned_ids = []
    work_capacity_map = {}
    if work_building_ids:
        placeholders = ",".join("?" for _ in work_building_ids)
        rows = conn.execute(
            f"SELECT id, capacity, COALESCE(current_workers, 0) as workers FROM buildings WHERE id IN ({placeholders})",
            work_building_ids
        ).fetchall()
        for r in rows:
            work_capacity_map[r["id"]] = max(0, int(r["capacity"] or 0) - int(r["workers"] or 0))

    for i in range(count):
        cit_id = f"cit_{world_id}_{uuid.uuid4().hex[:8]}"
        age = sample_realistic_age()
        health = sample_health_for_age(age)
        home_id = residential_building_ids[i % len(residential_building_ids)]

        is_working_age = (18.0 <= age < 65.0)
        work_id = None
        employed = 0
        if is_working_age:
            for w_cand in (work_building_ids or []):
                if work_capacity_map.get(w_cand, 0) > 0:
                    work_id = w_cand
                    employed = 1
                    work_capacity_map[w_cand] -= 1
                    break

        occ = random.choice(PIONEER_OCCUPATIONS) if is_working_age else ("Student" if age < 18 else "Retiree")
        offset_x = (i % 5) * 0.5 - 1.0
        offset_y = (i // 5 % 5) * 0.5 - 1.0

        conn.execute("""
        INSERT INTO citizens (
            id, world_id, age, occupation, wealth, x, y, hunger, energy, wellbeing,
            education_level, health, independent_reasoning, problem_solving, critical_evaluation,
            creativity, knowledge_retention, ai_dependency, is_alive,
            home_building_id, work_building_id, employed
        ) VALUES (?, ?, ?, ?, 100.0, ?, ?, 0.1, 0.9, 0.85, 0.8, ?, 0.8, 0.85, 0.75, 0.8, 0.85, 0.05, 1, ?, ?, ?)
        """, (
            cit_id, world_id, age, occ, center_x + offset_x, center_y + offset_y,
            health, home_id, work_id, employed
        ))
        spawned_ids.append(cit_id)

    sync_demographics_state(conn, world_id)
    return spawned_ids


def sync_demographics_state(conn: sqlite3.Connection, world_id: str) -> int:
    """
    Synchronizes economy_resources.population and buildings.current_occupants
    directly from living citizen records in the citizens table.
    Enforces that citizens table is the single source of truth.
    """
    # Count living citizens
    living_row = conn.execute(
        "SELECT COUNT(*) as living FROM citizens WHERE world_id = ? AND is_alive = 1",
        (world_id,)
    ).fetchone()
    living_count = living_row["living"] if living_row else 0

    # Update economy_resources
    conn.execute(
        "UPDATE economy_resources SET population = ? WHERE world_id = ?",
        (living_count, world_id)
    )

    # Update current_occupants on all buildings
    conn.execute("""
    UPDATE buildings SET current_occupants = (
        SELECT COUNT(*) FROM citizens
        WHERE citizens.home_building_id = buildings.id AND citizens.is_alive = 1
    ) WHERE world_id = ?
    """, (world_id,))

    # Update current_workers on all buildings
    conn.execute("""
    UPDATE buildings SET current_workers = (
        SELECT COUNT(*) FROM citizens
        WHERE citizens.work_building_id = buildings.id AND citizens.is_alive = 1
    ) WHERE world_id = ?
    """, (world_id,))

    return living_count
