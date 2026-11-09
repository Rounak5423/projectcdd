import sqlite3
import json
import os
import uuid
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone

from monitoring.db_tracer import TracedConnection
from db.pool import SQLiteConnectionPool
from config import settings

DB_PATH = os.environ.get("GENESIS_DB_PATH", settings.DB_PATH)

# High-Performance SQLite Connection Pool (Phase 7)
db_pool = SQLiteConnectionPool(DB_PATH, max_connections=16, timeout=10.0)


def get_db_connection():
    """Acquires a pooled, traced SQLite connection with busy timeout protection."""
    if db_pool.db_path != DB_PATH:
        db_pool.reset_path(DB_PATH)
    return db_pool.get_connection()


def init_db():
    if db_pool.db_path != DB_PATH:
        db_pool.reset_path(DB_PATH)

    # Invalidate in-process cache on database initialization
    try:
        from cache.data_cache import data_cache
        data_cache.clear()
    except Exception:
        pass

    # Configure database-level WAL journal once
    try:
        raw = sqlite3.connect(DB_PATH, timeout=10.0)
        raw.execute("PRAGMA journal_mode = WAL")
        raw.execute("PRAGMA synchronous = NORMAL")
        raw.close()
    except Exception:
        pass

    conn = get_db_connection()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS worlds (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            parent_world_id TEXT,
            owner_id TEXT,
            tick INTEGER DEFAULT 0,
            year INTEGER DEFAULT 2026,
            day INTEGER DEFAULT 1,
            simulation_status TEXT DEFAULT 'paused',
            simulation_speed TEXT DEFAULT '1x',
            climate TEXT DEFAULT 'Temperate',
            technology_level TEXT DEFAULT 'Automated',
            grid_size INTEGER DEFAULT 32,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS buildings (
            id TEXT PRIMARY KEY,
            world_id TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            x REAL NOT NULL,
            y REAL NOT NULL,
            z REAL DEFAULT 0.0,
            width REAL DEFAULT 2.0,
            length REAL DEFAULT 2.0,
            height REAL DEFAULT 3.0,
            orientation REAL DEFAULT 0.0,
            status TEXT DEFAULT 'active',
            capacity INTEGER DEFAULT 50,
            current_occupants INTEGER DEFAULT 0,
            current_workers INTEGER DEFAULT 0,
            construction_cost TEXT DEFAULT '{}',
            upgrade_cost TEXT DEFAULT '{}',
            effects TEXT DEFAULT '{}',
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS citizens (
            id TEXT PRIMARY KEY,
            world_id TEXT NOT NULL,
            age REAL DEFAULT 25.0,
            occupation TEXT DEFAULT 'Scholar',
            wealth REAL DEFAULT 100.0,
            x REAL DEFAULT 0.0,
            y REAL DEFAULT 0.0,
            hunger REAL DEFAULT 0.2,
            energy REAL DEFAULT 0.8,
            wellbeing REAL DEFAULT 0.75,
            education_level REAL DEFAULT 0.6,
            health REAL DEFAULT 0.85,
            independent_reasoning REAL DEFAULT 0.7,
            problem_solving REAL DEFAULT 0.6,
            critical_evaluation REAL DEFAULT 0.65,
            creativity REAL DEFAULT 0.6,
            knowledge_retention REAL DEFAULT 0.7,
            ai_dependency REAL DEFAULT 0.1,
            is_alive INTEGER DEFAULT 1,
            home_building_id TEXT,
            work_building_id TEXT,
            employed INTEGER DEFAULT 0,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE,
            FOREIGN KEY (home_building_id) REFERENCES buildings(id) ON DELETE SET NULL,
            FOREIGN KEY (work_building_id) REFERENCES buildings(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS economy_resources (
            world_id TEXT PRIMARY KEY,
            population INTEGER DEFAULT 100,
            population_growth_rate REAL DEFAULT 0.02,
            gdp REAL DEFAULT 1000000.0,
            gdp_growth_rate REAL DEFAULT 0.03,
            employment_rate REAL DEFAULT 0.90,
            average_income REAL DEFAULT 45000.0,
            gini_coefficient REAL DEFAULT 0.28,
            civic_stability REAL DEFAULT 0.77,
            tax_rate REAL DEFAULT 0.15,
            food REAL DEFAULT 10000.0,
            food_rate REAL DEFAULT 100.0,
            water REAL DEFAULT 10000.0,
            water_rate REAL DEFAULT 150.0,
            energy REAL DEFAULT 8000.0,
            energy_rate REAL DEFAULT 80.0,
            materials REAL DEFAULT 5000.0,
            materials_rate REAL DEFAULT 50.0,
            research_points REAL DEFAULT 2500.0,
            research_rate REAL DEFAULT 30.0,
            genesis_research_credits REAL DEFAULT 1000.0,
            happiness REAL DEFAULT 0.75,
            environmental_health REAL DEFAULT 0.80,
            pollution REAL DEFAULT 0.15,
            residential_tax REAL DEFAULT 0.14,
            commercial_tax REAL DEFAULT 0.12,
            industrial_tax REAL DEFAULT 0.15,
            office_tax REAL DEFAULT 0.13,
            road_budget_pct REAL DEFAULT 100.0,
            power_budget_pct REAL DEFAULT 100.0,
            water_budget_pct REAL DEFAULT 100.0,
            health_budget_pct REAL DEFAULT 100.0,
            education_budget_pct REAL DEFAULT 100.0,
            police_budget_pct REAL DEFAULT 100.0,
            municipal_debt REAL DEFAULT 0.0,
            total_interest_paid REAL DEFAULT 0.0,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS technologies (
            id TEXT NOT NULL,
            world_id TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            research_cost REAL DEFAULT 1000.0,
            research_progress REAL DEFAULT 0.0,
            is_unlocked INTEGER DEFAULT 0,
            is_researching INTEGER DEFAULT 0,
            effects TEXT DEFAULT '{}',
            PRIMARY KEY (world_id, id),
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS policies (
            id TEXT NOT NULL,
            world_id TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            is_active INTEGER DEFAULT 0,
            implementation_cost REAL DEFAULT 100.0,
            parameters TEXT DEFAULT '{}',
            effects TEXT DEFAULT '{}',
            PRIMARY KEY (world_id, id),
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS progression (
            world_id TEXT PRIMARY KEY,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            title TEXT DEFAULT 'Level 1 Civilisation',
            thriving_score REAL DEFAULT 0.75,
            grc_balance REAL DEFAULT 1000.0,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS missions (
            id TEXT NOT NULL,
            world_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            target_metric TEXT NOT NULL,
            target_value REAL NOT NULL,
            current_value REAL DEFAULT 0.0,
            is_completed INTEGER DEFAULT 0,
            is_claimed INTEGER DEFAULT 0,
            reward_xp INTEGER DEFAULT 1000,
            reward_grc REAL DEFAULT 100.0,
            PRIMARY KEY (world_id, id),
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS achievements (
            id TEXT NOT NULL,
            world_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT DEFAULT 'trophy',
            is_unlocked INTEGER DEFAULT 0,
            unlocked_at TEXT,
            PRIMARY KEY (world_id, id),
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            world_id TEXT NOT NULL,
            year INTEGER NOT NULL,
            day INTEGER NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS snapshots (
            id TEXT PRIMARY KEY,
            world_id TEXT NOT NULL,
            name TEXT NOT NULL,
            tick INTEGER NOT NULL,
            year INTEGER NOT NULL,
            day INTEGER NOT NULL,
            state_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS scenarios (
            id TEXT PRIMARY KEY,
            world_id TEXT NOT NULL,
            snapshot_id TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'queued',
            credit_cost REAL DEFAULT 150.0,
            simulation_horizon_ticks INTEGER DEFAULT 50,
            current_tick INTEGER DEFAULT 0,
            policy_overrides TEXT DEFAULT '{}',
            results_summary TEXT DEFAULT '{}',
            history_json TEXT DEFAULT '[]',
            created_at TEXT NOT NULL,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS experiments (
            id TEXT PRIMARY KEY,
            world_id TEXT NOT NULL,
            title TEXT NOT NULL,
            research_question TEXT NOT NULL,
            variable_tested TEXT NOT NULL,
            credit_cost REAL DEFAULT 200.0,
            status TEXT DEFAULT 'running',
            baseline_metrics TEXT DEFAULT '{}',
            outcome_metrics TEXT DEFAULT '{}',
            findings TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS metrics_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            world_id TEXT NOT NULL,
            tick INTEGER NOT NULL,
            year INTEGER NOT NULL,
            day INTEGER NOT NULL,
            population INTEGER NOT NULL,
            gdp REAL NOT NULL,
            happiness REAL NOT NULL,
            employment REAL NOT NULL,
            environment REAL NOT NULL,
            gini REAL NOT NULL,
            civic_stability REAL NOT NULL,
            macro_innovation REAL NOT NULL,
            avg_ai_dependency REAL NOT NULL,
            avg_reasoning REAL NOT NULL,
            food REAL NOT NULL,
            energy REAL NOT NULL,
            materials REAL NOT NULL,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS causal_vitals (
            id TEXT PRIMARY KEY,
            world_id TEXT NOT NULL,
            tick INTEGER NOT NULL,
            year INTEGER NOT NULL,
            day INTEGER NOT NULL,
            population INTEGER NOT NULL,
            births INTEGER NOT NULL,
            deaths INTEGER NOT NULL,
            deaths_aging INTEGER NOT NULL,
            deaths_starvation INTEGER NOT NULL,
            deaths_dehydration INTEGER NOT NULL,
            deaths_hospital_overload INTEGER NOT NULL,
            deaths_pollution INTEGER NOT NULL,
            deaths_trauma INTEGER NOT NULL,
            hospital_admissions INTEGER NOT NULL,
            bed_capacity INTEGER NOT NULL,
            bed_occupancy_pct REAL NOT NULL,
            overflow_patients INTEGER NOT NULL,
            unmet_food REAL NOT NULL,
            unmet_water REAL NOT NULL,
            unmet_energy REAL NOT NULL,
            unmet_healthcare REAL NOT NULL,
            unmet_shelter REAL NOT NULL,
            health_index REAL NOT NULL,
            protest_intensity REAL NOT NULL,
            protest_participants INTEGER NOT NULL,
            grievance_score REAL NOT NULL,
            happiness REAL NOT NULL,
            civic_stability REAL NOT NULL,
            environmental_health REAL NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_causal_vitals_world_tick ON causal_vitals(world_id, tick);
        """)

        # High-Performance Secondary Indexes (Phase 7)
        conn.executescript("""
        CREATE INDEX IF NOT EXISTS idx_buildings_world_id ON buildings(world_id);
        CREATE INDEX IF NOT EXISTS idx_citizens_world_occ ON citizens(world_id, occupation);
        CREATE INDEX IF NOT EXISTS idx_metrics_history_world_id ON metrics_history(world_id, id DESC);
        CREATE INDEX IF NOT EXISTS idx_events_world_year ON events(world_id, year DESC, day DESC);
        CREATE INDEX IF NOT EXISTS idx_snapshots_world_tick ON snapshots(world_id, tick DESC);
        CREATE INDEX IF NOT EXISTS idx_experiments_world_date ON experiments(world_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_scenarios_world_id ON scenarios(world_id);
        CREATE INDEX IF NOT EXISTS idx_worlds_owner_id ON worlds(owner_id);
        CREATE INDEX IF NOT EXISTS idx_policies_world_active ON policies(world_id, is_active);
        CREATE INDEX IF NOT EXISTS idx_technologies_world_level ON technologies(world_id, level ASC);
        """)

        # Backward compatibility: safely add owner_id to worlds if it doesn't exist
        try:
            conn.execute("ALTER TABLE worlds ADD COLUMN owner_id TEXT REFERENCES users(id)")
        except Exception:
            pass

    conn.close()
    try:
        from db.migrations import run_migrations
        run_migrations()
    except Exception as e:
        print(f"Migration error: {e}")
    seed_default_users()
    seed_council_advisors()


def seed_council_advisors():
    """
    Initializes council tables and seeds the 6 permanent advisor identities idempotently.
    """
    try:
        from app.features.council.repository import init_council_tables, CouncilRepository
        init_council_tables()
        repo = CouncilRepository()
        repo.seed_advisors_idempotent()
    except Exception as e:
        pass


def seed_default_users():
    """
    Seeds default admin and user accounts if they don't already exist.
    Uses ADMIN_DEFAULT_PASSWORD and USER_DEFAULT_PASSWORD environment variables if provided.
    """
    from auth.security import hash_password
    admin_pwd = os.environ.get("ADMIN_DEFAULT_PASSWORD", "AdminPassword123!")
    user_pwd = os.environ.get("USER_DEFAULT_PASSWORD", "UserPassword123!")
    conn = get_db_connection()
    now = datetime.now(timezone.utc).isoformat()
    with conn:
        # Check admin
        admin = conn.execute("SELECT id FROM users WHERE username = 'admin'").fetchone()
        if not admin:
            p_hash, salt = hash_password(admin_pwd)
            conn.execute("""
            INSERT INTO users (id, username, email, password_hash, salt, role, is_active, created_at, updated_at)
            VALUES ('usr_admin_001', 'admin', 'admin@genesis.ai', ?, ?, 'admin', 1, ?, ?)
            """, (p_hash, salt, now, now))

        # Check player1
        player1 = conn.execute("SELECT id FROM users WHERE username = 'player1'").fetchone()
        if not player1:
            p_hash, salt = hash_password(user_pwd)
            conn.execute("""
            INSERT INTO users (id, username, email, password_hash, salt, role, is_active, created_at, updated_at)
            VALUES ('usr_player1_001', 'player1', 'player1@genesis.ai', ?, ?, 'user', 1, ?, ?)
            """, (p_hash, salt, now, now))

        # Assign existing worlds with NULL owner_id to player1
        conn.execute("UPDATE worlds SET owner_id = 'usr_player1_001' WHERE owner_id IS NULL")

    conn.close()


init_db()

