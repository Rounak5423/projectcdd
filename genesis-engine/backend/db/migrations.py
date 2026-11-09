"""
GENESIS Engine Schema Migration System
Manages versioned, sequential, safe SQLite schema migrations.
"""
import sqlite3
import os
from datetime import datetime, timezone
from typing import List, Tuple, Callable


def create_migration_table(conn: sqlite3.Connection):
    with conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL
        );
        """)


def migration_v1_baseline(conn: sqlite3.Connection):
    """Initial baseline tables are already created by database.init_db()."""
    pass


def migration_v2_save_slots(conn: sqlite3.Connection):
    """Adds save slots and autosave table."""
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS world_saves (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slot_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'autosave', 'quick'
        tick INTEGER NOT NULL,
        year INTEGER NOT NULL,
        day INTEGER NOT NULL,
        state_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_world_saves_world_id ON world_saves(world_id);
    CREATE INDEX IF NOT EXISTS idx_world_saves_slot_type ON world_saves(slot_type);
    """)


def migration_v3_cs2_simulation_depth(conn: sqlite3.Connection):
    """Adds CS2 simulation depth tables: districts, road networks, zone lots, services, supply chain."""
    conn.executescript("""
    -- 1. Districts with localized policies and taxes
    CREATE TABLE IF NOT EXISTS districts (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#3b82f6',
        boundaries_json TEXT DEFAULT '[]', -- Array of [x, y] polygon vertices
        residential_tax REAL DEFAULT 0.12,
        commercial_tax REAL DEFAULT 0.12,
        industrial_tax REAL DEFAULT 0.12,
        office_tax REAL DEFAULT 0.12,
        policies_json TEXT DEFAULT '[]',   -- District policies
        population INTEGER DEFAULT 0,
        average_land_value REAL DEFAULT 50.0,
        average_happiness REAL DEFAULT 0.75,
        created_at TEXT NOT NULL,
        FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    );

    -- 2. Road Network Nodes (Intersections & Endpoints)
    CREATE TABLE IF NOT EXISTS road_nodes (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        x REAL NOT NULL,
        y REAL NOT NULL,
        elevation REAL DEFAULT 0.0,
        type TEXT DEFAULT 'intersection', -- 'intersection', 'cul_de_sac', 'transit_hub'
        has_traffic_light INTEGER DEFAULT 0,
        congestion REAL DEFAULT 0.0,
        FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    );

    -- 3. Road Network Segments (Edges in A* graph)
    CREATE TABLE IF NOT EXISTS road_segments (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        start_node_id TEXT NOT NULL,
        end_node_id TEXT NOT NULL,
        road_type TEXT NOT NULL DEFAULT 'two_lane', -- 'gravel', 'two_lane', 'four_lane', 'six_lane', 'highway', 'one_way'
        lane_count INTEGER DEFAULT 2,
        speed_limit REAL DEFAULT 50.0,
        capacity INTEGER DEFAULT 500,
        current_traffic INTEGER DEFAULT 0,
        condition REAL DEFAULT 1.0,
        is_one_way INTEGER DEFAULT 0,
        length REAL NOT NULL,
        control_points_json TEXT DEFAULT '[]', -- Bezier spline control points
        FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
        FOREIGN KEY (start_node_id) REFERENCES road_nodes(id) ON DELETE CASCADE,
        FOREIGN KEY (end_node_id) REFERENCES road_nodes(id) ON DELETE CASCADE
    );

    -- 4. Zone Lots (RCI lots bound to road segments)
    CREATE TABLE IF NOT EXISTS zone_lots (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        district_id TEXT,
        x REAL NOT NULL,
        y REAL NOT NULL,
        zone_type TEXT NOT NULL, -- 'residential_low', 'residential_high', 'commercial_low', 'commercial_high', 'industrial', 'office'
        level INTEGER DEFAULT 1,
        building_id TEXT,
        land_value REAL DEFAULT 50.0,
        desirability REAL DEFAULT 0.7,
        pollution_air REAL DEFAULT 0.0,
        pollution_ground REAL DEFAULT 0.0,
        pollution_noise REAL DEFAULT 0.0,
        crime_rate REAL DEFAULT 0.0,
        fire_hazard REAL DEFAULT 0.0,
        power_connected INTEGER DEFAULT 1,
        water_connected INTEGER DEFAULT 1,
        sewage_connected INTEGER DEFAULT 1,
        FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
        FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
        FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL
    );

    -- 5. Public Transit Lines & Stops
    CREATE TABLE IF NOT EXISTS transit_lines (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'bus', -- 'bus', 'tram', 'metro'
        color TEXT DEFAULT '#10b981',
        ticket_price REAL DEFAULT 2.50,
        monthly_budget REAL DEFAULT 500.0,
        daily_ridership INTEGER DEFAULT 0,
        stops_json TEXT DEFAULT '[]',
        vehicles_count INTEGER DEFAULT 3,
        created_at TEXT NOT NULL,
        FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    );

    -- 6. City Service Capacity & Coverage Matrix
    CREATE TABLE IF NOT EXISTS service_coverage (
        world_id TEXT PRIMARY KEY,
        fire_coverage REAL DEFAULT 0.85,
        police_coverage REAL DEFAULT 0.88,
        healthcare_coverage REAL DEFAULT 0.90,
        elementary_coverage REAL DEFAULT 0.82,
        highschool_coverage REAL DEFAULT 0.75,
        university_coverage REAL DEFAULT 0.65,
        garbage_capacity_used REAL DEFAULT 0.45,
        deathcare_capacity_used REAL DEFAULT 0.30,
        park_access_ratio REAL DEFAULT 0.78,
        power_grid_load_ratio REAL DEFAULT 0.65,
        water_grid_load_ratio REAL DEFAULT 0.58,
        sewage_treatment_ratio REAL DEFAULT 0.92,
        FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    );

    -- 7. Supply Chain & Commodity Market
    CREATE TABLE IF NOT EXISTS supply_chain_goods (
        world_id TEXT NOT NULL,
        commodity TEXT NOT NULL, -- 'grain', 'oil', 'ore', 'timber', 'plastics', 'metals', 'electronics', 'food_products', 'consumer_goods'
        production_rate REAL DEFAULT 0.0,
        consumption_rate REAL DEFAULT 0.0,
        stockpile REAL DEFAULT 100.0,
        import_rate REAL DEFAULT 0.0,
        export_rate REAL DEFAULT 0.0,
        market_price REAL DEFAULT 10.0,
        PRIMARY KEY (world_id, commodity),
        FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    );
    """)


def migration_v4_civilization_tech_tree(conn: sqlite3.Connection):
    """Adds Civ VI science & tech tree columns and seeds the foundational paradigms."""
    from engine.technology_engine import ensure_tech_table_columns, seed_civilization_technologies
    ensure_tech_table_columns(conn)

    worlds = conn.execute("SELECT id FROM worlds").fetchall()
    for w in worlds:
        seed_civilization_technologies(conn, w["id"])


def migration_v5_citizens_single_truth(conn: sqlite3.Connection):
    """Adds home/work building foreign keys and employment to citizens, occupants to buildings."""
    # Add columns to citizens if not present
    cit_cols = [c[1] for c in conn.execute("PRAGMA table_info(citizens)").fetchall()]
    if "home_building_id" not in cit_cols:
        conn.execute("ALTER TABLE citizens ADD COLUMN home_building_id TEXT REFERENCES buildings(id) ON DELETE SET NULL")
    if "work_building_id" not in cit_cols:
        conn.execute("ALTER TABLE citizens ADD COLUMN work_building_id TEXT REFERENCES buildings(id) ON DELETE SET NULL")
    if "employed" not in cit_cols:
        conn.execute("ALTER TABLE citizens ADD COLUMN employed INTEGER DEFAULT 0")

    # Add current_occupants and current_workers to buildings if not present
    bld_cols = [c[1] for c in conn.execute("PRAGMA table_info(buildings)").fetchall()]
    if "current_occupants" not in bld_cols:
        conn.execute("ALTER TABLE buildings ADD COLUMN current_occupants INTEGER DEFAULT 0")
    if "current_workers" not in bld_cols:
        conn.execute("ALTER TABLE buildings ADD COLUMN current_workers INTEGER DEFAULT 0")

    conn.executescript("""
    CREATE INDEX IF NOT EXISTS idx_citizens_home_bld ON citizens(world_id, home_building_id);
    CREATE INDEX IF NOT EXISTS idx_citizens_work_bld ON citizens(world_id, work_building_id);
    CREATE INDEX IF NOT EXISTS idx_citizens_alive ON citizens(world_id, is_alive);
    """)


MIGRATIONS: List[Tuple[int, str, Callable[[sqlite3.Connection], None]]] = [
    (1, "baseline_init", migration_v1_baseline),
    (2, "save_slots_and_autosaves", migration_v2_save_slots),
    (3, "cs2_simulation_depth_and_infrastructure", migration_v3_cs2_simulation_depth),
    (4, "civilization_tech_tree", migration_v4_civilization_tech_tree),
    (5, "citizens_single_truth", migration_v5_citizens_single_truth),
]


def run_migrations():
    from db.database import get_db_connection
    conn = get_db_connection()
    create_migration_table(conn)

    applied_rows = conn.execute("SELECT version FROM schema_migrations ORDER BY version ASC").fetchall()
    applied_versions = {r["version"] for r in applied_rows}

    for version, name, fn in MIGRATIONS:
        if version not in applied_versions:
            now = datetime.now(timezone.utc).isoformat()
            with conn:
                fn(conn)
                conn.execute(
                    "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
                    (version, name, now)
                )
    conn.close()
