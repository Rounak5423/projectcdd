import sqlite3
import json
import os
import uuid
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone

DB_PATH = os.environ.get("GENESIS_DB_PATH", os.path.join(os.path.dirname(__file__), "genesis.db"))


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
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
            FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
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
        """)

        # Backward compatibility: safely add owner_id to worlds if it doesn't exist
        try:
            conn.execute("ALTER TABLE worlds ADD COLUMN owner_id TEXT REFERENCES users(id)")
        except Exception:
            pass

    conn.close()
    seed_default_users()


def seed_default_users():
    """
    Seeds default admin and user accounts if they don't already exist.
    Admin: admin / AdminPassword123!
    User: player1 / UserPassword123!
    """
    from auth.security import hash_password
    conn = get_db_connection()
    now = datetime.now(timezone.utc).isoformat()
    with conn:
        # Check admin
        admin = conn.execute("SELECT id FROM users WHERE username = 'admin'").fetchone()
        if not admin:
            p_hash, salt = hash_password("AdminPassword123!")
            conn.execute("""
            INSERT INTO users (id, username, email, password_hash, salt, role, is_active, created_at, updated_at)
            VALUES ('usr_admin_001', 'admin', 'admin@genesis.ai', ?, ?, 'admin', 1, ?, ?)
            """, (p_hash, salt, now, now))

        # Check player1
        player1 = conn.execute("SELECT id FROM users WHERE username = 'player1'").fetchone()
        if not player1:
            p_hash, salt = hash_password("UserPassword123!")
            conn.execute("""
            INSERT INTO users (id, username, email, password_hash, salt, role, is_active, created_at, updated_at)
            VALUES ('usr_player1_001', 'player1', 'player1@genesis.ai', ?, ?, 'user', 1, ?, ?)
            """, (p_hash, salt, now, now))

        # Assign existing worlds with NULL owner_id to player1
        conn.execute("UPDATE worlds SET owner_id = 'usr_player1_001' WHERE owner_id IS NULL")

    conn.close()


init_db()

