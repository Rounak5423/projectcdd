"""
CIVILIZATION TECHNOLOGY ENGINE (GIVORA Civ VI Science & Technology Horizons)
Handles era-based technology progression, Eureka breakthroughs, prerequisite tree validation,
science turn calculations, and civilization technological buffs.
"""
import json
import math
import uuid
import sqlite3
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

CIV_TECHNOLOGY_DEFINITIONS: List[Dict[str, Any]] = [
    # ==================== FOUNDATIONAL ERA ====================
    {
        "id": "tech-masonry",
        "name": "Masonry",
        "category": "Engineering",
        "era": "Foundational",
        "level": 1,
        "turns": 2,
        "icon": "🧱",
        "is_boosted": True,
        "boost_text": "BOOSTED: Built a Quarry",
        "description": "Carved stone blocks and hydraulic mortar enabling durable city walls and aqueducts.",
        "unlocked_effects": ["+25% City Defense", "Unlocks Stone Walls & Paved Roads"],
        "prerequisites": [],
        "unlocks": ["tech-construction"],
        "cost_points": 200,
        "is_unlocked": 1,
        "is_researching": 0,
        "research_progress": 200.0,
        "effects": {"defense_boost": 0.25, "unlocks": ["stone_walls", "paved_roads"]}
    },
    {
        "id": "tech-bronze",
        "name": "Bronze Working",
        "category": "Military & Metallurgic",
        "era": "Foundational",
        "level": 1,
        "turns": 2,
        "icon": "🛡️",
        "is_boosted": True,
        "boost_text": "BOOSTED! (-50% Turns Left)",
        "description": "Smelting copper and tin into resilient bronze alloys for armaments and metal tools.",
        "unlocked_effects": ["Unlocks Spearmen & Foundries", "+15% Mining Yield"],
        "prerequisites": [],
        "unlocks": ["tech-iron"],
        "cost_points": 288,
        "is_unlocked": 0,
        "is_researching": 0,
        "research_progress": 0.0,
        "effects": {"mining_yield": 0.15, "unlocks": ["spearmen", "foundries"]}
    },
    {
        "id": "tech-wheel",
        "name": "The Wheel",
        "category": "Logistics",
        "era": "Foundational",
        "level": 1,
        "turns": 3,
        "icon": "☸️",
        "is_boosted": True,
        "boost_text": "BOOSTED: Mined raw copper vein",
        "description": "Rotational axle mechanics revolutionizing logistics, chariots, and grain mills.",
        "unlocked_effects": ["Unlocks Watermills & Carts", "+20% Trade Logistics"],
        "prerequisites": [],
        "unlocks": ["tech-horseback", "tech-currency"],
        "cost_points": 240,
        "is_unlocked": 0,
        "is_researching": 0,
        "research_progress": 0.0,
        "effects": {"trade_logistics": 0.20, "unlocks": ["watermills", "carts"]}
    },
    {
        "id": "tech-celestial",
        "name": "Celestial Navigation",
        "category": "Naval Exploration",
        "era": "Foundational",
        "level": 1,
        "turns": 5,
        "icon": "⛵",
        "is_boosted": False,
        "boost_text": "To Boost: Improve 2 sea resources",
        "description": "Astrolabes and star charting enabling coastal exploration and ocean fishing.",
        "unlocked_effects": ["Unlocks Harbors & Fishing Fleets", "Deep Ocean Visibility"],
        "prerequisites": [],
        "unlocks": ["tech-mathematics"],
        "cost_points": 320,
        "is_unlocked": 0,
        "is_researching": 1,
        "research_progress": 0.0,
        "effects": {"naval_exploration": 1.0, "unlocks": ["harbors", "fishing_fleets"]}
    },

    # ==================== INDUSTRIAL ERA ====================
    {
        "id": "tech-horseback",
        "name": "Horseback Riding",
        "category": "Exploration",
        "era": "Industrial",
        "level": 2,
        "turns": 4,
        "icon": "🐎",
        "is_boosted": True,
        "boost_text": "BOOSTED: Built a Pasture",
        "description": "Equine domestication and saddle craftsmanship granting rapid overland cavalry movement.",
        "unlocked_effects": ["Unlocks Cavalry & Mounted Scouts", "+2 Movement across Plains"],
        "prerequisites": ["tech-wheel"],
        "unlocks": ["tech-engineering"],
        "cost_points": 480,
        "is_unlocked": 0,
        "is_researching": 0,
        "research_progress": 0.0,
        "effects": {"movement_speed": 2.0, "unlocks": ["cavalry", "mounted_scouts"]}
    },
    {
        "id": "tech-currency",
        "name": "Currency & Minting",
        "category": "Economy",
        "era": "Industrial",
        "level": 2,
        "turns": 5,
        "icon": "🪙",
        "is_boosted": False,
        "boost_text": "To Boost: Establish 2 trade routes",
        "description": "Standardized precious coin mints and ledger accounting facilitating commercial markets.",
        "unlocked_effects": ["Unlocks Marketplace & Imperial Banks", "+35% Tax Revenue"],
        "prerequisites": ["tech-wheel"],
        "unlocks": ["tech-mathematics"],
        "cost_points": 520,
        "is_unlocked": 0,
        "is_researching": 0,
        "research_progress": 0.0,
        "effects": {"tax_revenue_boost": 0.35, "unlocks": ["marketplace", "imperial_banks"]}
    },
    {
        "id": "tech-iron",
        "name": "Iron Working",
        "category": "Metallurgy",
        "era": "Industrial",
        "level": 2,
        "turns": 6,
        "icon": "⚔️",
        "is_boosted": False,
        "boost_text": "To Boost: Build an Iron Mine",
        "description": "Blast furnace metallurgy forging high-carbon steel blades and heavy plowshares.",
        "unlocked_effects": ["Unlocks Swordsmen & Blast Furnaces", "+30% Heavy Industry"],
        "prerequisites": ["tech-bronze"],
        "unlocks": ["tech-construction"],
        "cost_points": 600,
        "is_unlocked": 0,
        "is_researching": 0,
        "research_progress": 0.0,
        "effects": {"heavy_industry_boost": 0.30, "unlocks": ["swordsmen", "blast_furnaces"]}
    },
    {
        "id": "tech-construction",
        "name": "Construction",
        "category": "Engineering",
        "era": "Industrial",
        "level": 2,
        "turns": 5,
        "icon": "🏛️",
        "is_boosted": True,
        "boost_text": "BOOSTED: Built a Water Mill",
        "description": "Arch engineering, crane hoists, and terracotta kiln masonry for monumental works.",
        "unlocked_effects": ["Unlocks Terracotta Palaces & Lumber Mills", "+2 Housing per City"],
        "prerequisites": ["tech-masonry", "tech-iron"],
        "unlocks": ["tech-engineering"],
        "cost_points": 640,
        "is_unlocked": 0,
        "is_researching": 0,
        "research_progress": 0.0,
        "effects": {"housing_bonus": 2, "unlocks": ["terracotta_palaces", "lumber_mills"]}
    },
    {
        "id": "tech-mathematics",
        "name": "Mathematics",
        "category": "Science",
        "era": "Industrial",
        "level": 2,
        "turns": 7,
        "icon": "📐",
        "is_boosted": False,
        "boost_text": "To Boost: Build 3 specialty districts",
        "description": "Geometry, algebraic notation, and celestial geometry for advanced architecture.",
        "unlocked_effects": ["Unlocks Academies & Amphitheaters", "+40% Science Generation"],
        "prerequisites": ["tech-celestial", "tech-currency"],
        "unlocks": ["tech-engineering"],
        "cost_points": 720,
        "is_unlocked": 0,
        "is_researching": 0,
        "research_progress": 0.0,
        "effects": {"science_boost": 0.40, "unlocks": ["academies", "amphitheaters"]}
    },
    {
        "id": "tech-engineering",
        "name": "Engineering",
        "category": "Engineering",
        "era": "Industrial",
        "level": 2,
        "turns": 6,
        "icon": "⚙️",
        "is_boosted": True,
        "boost_text": "BOOSTED: Built Ancient Walls",
        "description": "Geared machinery, aqueduct siphons, and fortified stone catapult bastions.",
        "unlocked_effects": ["Unlocks Aqueducts, Stone Bridges & Catapults", "+50% Siege Power"],
        "prerequisites": ["tech-construction", "tech-horseback", "tech-mathematics"],
        "unlocks": ["tech-steam"],
        "cost_points": 850,
        "is_unlocked": 0,
        "is_researching": 0,
        "research_progress": 0.0,
        "effects": {"siege_power": 0.50, "unlocks": ["aqueducts", "stone_bridges", "catapults"]}
    },

    # ==================== DIGITAL / MODERN ERA ====================
    {
        "id": "tech-steam",
        "name": "Steam & Power Grid",
        "category": "Energy",
        "era": "Digital",
        "level": 3,
        "turns": 8,
        "icon": "⚡",
        "is_boosted": True,
        "boost_text": "BOOSTED: Built 2 Coal Foundries",
        "description": "High-pressure steam boilers and electromagnetic dynamo generators.",
        "unlocked_effects": ["Unlocks Factories & Power Grids", "+85MW Base Output"],
        "prerequisites": ["tech-engineering"],
        "unlocks": ["tech-quantum"],
        "cost_points": 1200,
        "is_unlocked": 0,
        "is_researching": 0,
        "research_progress": 0.0,
        "effects": {"base_power_mw": 85.0, "unlocks": ["factories", "power_grids"]}
    },
    {
        "id": "tech-quantum",
        "name": "Quantum Telemetry",
        "category": "High Tech",
        "era": "Digital",
        "level": 3,
        "turns": 5,
        "icon": "🔬",
        "is_boosted": True,
        "boost_text": "BOOSTED! (-50% Turns Left)",
        "description": "Superconducting cryostats and cryogenic quantum entanglement sensors.",
        "unlocked_effects": ["Unlocks Quantum Observatories", "+50% All Science Yields"],
        "prerequisites": ["tech-steam"],
        "unlocks": ["tech-synthetic"],
        "cost_points": 1800,
        "is_unlocked": 0,
        "is_researching": 0,
        "research_progress": 0.0,
        "effects": {"science_yield_boost": 0.50, "unlocks": ["quantum_observatories"]}
    },

    # ==================== SYNTHETIC ERA ====================
    {
        "id": "tech-synthetic",
        "name": "Autonomous Synthesis",
        "category": "Artificial Intelligence",
        "era": "Synthetic / AI",
        "level": 4,
        "turns": 12,
        "icon": "🤖",
        "is_boosted": False,
        "boost_text": "To Boost: Automate 5 Heavy Industries",
        "description": "Self-replicating robotic assemblies and neural governance algorithms.",
        "unlocked_effects": ["Unlocks Synthetic Android Labor", "+100% Civilization Productivity"],
        "prerequisites": ["tech-quantum"],
        "unlocks": [],
        "cost_points": 2600,
        "is_unlocked": 0,
        "is_researching": 0,
        "research_progress": 0.0,
        "effects": {"productivity_boost": 1.0, "unlocks": ["synthetic_android_labor"]}
    }
]


def ensure_tech_table_columns(conn: sqlite3.Connection):
    """Safely adds missing Civ technology columns to the technologies table if not present."""
    cols_info = conn.execute("PRAGMA table_info(technologies)").fetchall()
    existing_cols = {r[1] for r in cols_info}

    new_cols = [
        ("era", "TEXT DEFAULT 'Foundational'"),
        ("turns_required", "INTEGER DEFAULT 5"),
        ("turns_remaining", "INTEGER DEFAULT 5"),
        ("icon", "TEXT DEFAULT '🔬'"),
        ("is_boosted", "INTEGER DEFAULT 0"),
        ("boost_text", "TEXT DEFAULT ''"),
        ("description", "TEXT DEFAULT ''"),
        ("unlocked_effects", "TEXT DEFAULT '[]'"),
        ("prerequisites", "TEXT DEFAULT '[]'"),
        ("unlocks", "TEXT DEFAULT '[]'"),
        ("cost_points", "INTEGER DEFAULT 300")
    ]

    for col_name, col_def in new_cols:
        if col_name not in existing_cols:
            try:
                conn.execute(f"ALTER TABLE technologies ADD COLUMN {col_name} {col_def}")
            except sqlite3.OperationalError:
                pass


def seed_civilization_technologies(conn: sqlite3.Connection, world_id: str):
    """Seeds or syncs the complete Civ VI style technology tree into the given world."""
    ensure_tech_table_columns(conn)

    existing_techs = conn.execute(
        "SELECT id FROM technologies WHERE world_id = ? AND id LIKE 'tech-%'",
        (world_id,)
    ).fetchall()

    if len(existing_techs) >= len(CIV_TECHNOLOGY_DEFINITIONS):
        return

    with conn:
        for t in CIV_TECHNOLOGY_DEFINITIONS:
            # Check if this node already exists
            found = conn.execute(
                "SELECT id, is_unlocked, is_researching, research_progress, is_boosted FROM technologies WHERE world_id = ? AND id = ?",
                (world_id, t["id"])
            ).fetchone()

            if not found:
                conn.execute("""
                INSERT INTO technologies (
                    id, world_id, name, category, level, research_cost, research_progress,
                    is_unlocked, is_researching, effects, era, turns_required, turns_remaining,
                    icon, is_boosted, boost_text, description, unlocked_effects, prerequisites,
                    unlocks, cost_points
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    t["id"],
                    world_id,
                    t["name"],
                    t["category"],
                    t["level"],
                    float(t["cost_points"]),
                    t["research_progress"],
                    t["is_unlocked"],
                    t["is_researching"],
                    json.dumps(t["effects"]),
                    t["era"],
                    t["turns"],
                    t["turns"],
                    t["icon"],
                    1 if t["is_boosted"] else 0,
                    t["boost_text"],
                    t["description"],
                    json.dumps(t["unlocked_effects"]),
                    json.dumps(t["prerequisites"]),
                    json.dumps(t["unlocks"]),
                    t["cost_points"]
                ))


def get_world_science_rate(conn: sqlite3.Connection, world_id: str) -> float:
    """Calculates active science generation per turn based on laboratories, universities, and population."""
    try:
        row = conn.execute("SELECT research_rate FROM world_resources WHERE world_id = ?", (world_id,)).fetchone()
        if row and row["research_rate"]:
            return max(36.0, float(row["research_rate"]))
    except Exception:
        pass
    return 36.0


def format_technology_row(r: sqlite3.Row, science_per_turn: float = 36.0) -> Dict[str, Any]:
    """Formats an SQLite row from `technologies` into a complete TechnologyNode dict."""
    keys = r.keys()

    cost_val = r["cost_points"] if "cost_points" in keys and r["cost_points"] else int(r["research_cost"])
    prog_val = float(r["research_progress"] or 0.0)
    is_unlocked = bool(r["is_unlocked"])
    is_researching = bool(r["is_researching"])

    # Calculate dynamic turns remaining
    if is_unlocked:
        turns = 0
    elif is_researching:
        turns = max(1, math.ceil((cost_val - prog_val) / max(science_per_turn, 1.0)))
    else:
        turns = r["turns_required"] if "turns_required" in keys and r["turns_required"] else max(1, math.ceil(cost_val / max(science_per_turn, 1.0)))

    # Parse JSON fields safely
    effects_json = json.loads(r["effects"]) if "effects" in keys and r["effects"] else {}
    unlocked_effs = json.loads(r["unlocked_effects"]) if "unlocked_effects" in keys and r["unlocked_effects"] else []
    prereqs = json.loads(r["prerequisites"]) if "prerequisites" in keys and r["prerequisites"] else []
    unlocks_list = json.loads(r["unlocks"]) if "unlocks" in keys and r["unlocks"] else []

    return {
        "id": r["id"],
        "name": r["name"],
        "category": r["category"],
        "description": r["description"] if "description" in keys and r["description"] else "",
        "level_required": r["level"] if "level" in keys and r["level"] else 1,
        "research_cost": float(cost_val),
        "research_progress": prog_val,
        "is_unlocked": is_unlocked,
        "is_researching": is_researching,
        "effects": effects_json,
        "era": r["era"] if "era" in keys and r["era"] else "Foundational",
        "turns": turns,
        "icon": r["icon"] if "icon" in keys and r["icon"] else "🔬",
        "is_boosted": bool(r["is_boosted"]) if "is_boosted" in keys else False,
        "boost_text": r["boost_text"] if "boost_text" in keys and r["boost_text"] else "",
        "unlocked_effects": unlocked_effs,
        "prerequisites": prereqs,
        "unlocks": unlocks_list,
        "cost_points": cost_val
    }


def trigger_eureka(conn: sqlite3.Connection, world_id: str, tech_id: str) -> Dict[str, Any]:
    """Applies a 50% Eureka Breakthrough discount to the target technology."""
    ensure_tech_table_columns(conn)

    tech = conn.execute("SELECT * FROM technologies WHERE world_id = ? AND id = ?", (world_id, tech_id)).fetchone()
    if not tech:
        raise ValueError(f"Technology '{tech_id}' not found in world '{world_id}'")

    keys = tech.keys()
    is_boosted = bool(tech["is_boosted"]) if "is_boosted" in keys else False
    current_cost = tech["cost_points"] if "cost_points" in keys and tech["cost_points"] else tech["research_cost"]
    turns_req = tech["turns_required"] if "turns_required" in keys and tech["turns_required"] else 5

    discount = round(current_cost * 0.5)
    new_turns = max(1, round(turns_req * 0.5))

    with conn:
        conn.execute("""
        UPDATE technologies
        SET is_boosted = 1,
            turns_remaining = ?,
            boost_text = 'BOOSTED! (-50% Turns Left)'
        WHERE world_id = ? AND id = ?
        """, (new_turns, world_id, tech_id))

        # Record breakthrough event in the civilisation log
        evt_id = f"evt_{uuid.uuid4().hex[:8]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            conn.execute("""
            INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
            VALUES (?, ?, 1, 1, ?, 'eureka', ?, ?)
            """, (
                evt_id,
                world_id,
                f"⚡ Eureka Breakthrough: {tech['name']}",
                f"Scientific breakthrough achieved! Research duration for {tech['name']} halved (-50%).",
                now_iso
            ))
        except sqlite3.OperationalError:
            pass

    updated = conn.execute("SELECT * FROM technologies WHERE world_id = ? AND id = ?", (world_id, tech_id)).fetchone()
    formatted = format_technology_row(updated)
    return {
        "success": True,
        "technology": formatted,
        "turns_saved": max(1, turns_req - new_turns),
        "discount_applied": float(discount),
        "message": f"Eureka breakthrough triggered for {tech['name']}! Research accelerated by 50%."
    }


def set_active_research(conn: sqlite3.Connection, world_id: str, tech_id: str) -> Dict[str, Any]:
    """Switches the civilisation's scientific research vector to the chosen paradigm."""
    ensure_tech_table_columns(conn)

    tech = conn.execute("SELECT * FROM technologies WHERE world_id = ? AND id = ?", (world_id, tech_id)).fetchone()
    if not tech:
        raise ValueError(f"Technology '{tech_id}' not found in world '{world_id}'")

    if tech["is_unlocked"]:
        raise ValueError(f"Technology '{tech['name']}' is already unlocked and mastered.")

    with conn:
        # Pause any current research project
        conn.execute("UPDATE technologies SET is_researching = 0 WHERE world_id = ?", (world_id,))
        # Set new technology as active
        conn.execute("UPDATE technologies SET is_researching = 1 WHERE world_id = ? AND id = ?", (world_id, tech_id))

    updated = conn.execute("SELECT * FROM technologies WHERE world_id = ? AND id = ?", (world_id, tech_id)).fetchone()
    science_per_turn = get_world_science_rate(conn, world_id)
    return format_technology_row(updated, science_per_turn)
