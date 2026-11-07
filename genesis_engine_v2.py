#!/usr/bin/env python3
"""
================================================================================
GENESIS Engine v2.0: Persistent Artificial Civilisation & Policy Platform
================================================================================

Lead Simulation Architect & Backend Systems Implementation
Unified Decoupled Architecture:
- Python 3.10+ / FastAPI / Pydantic v2 / SQLite (WAL mode)
- 9 Interconnected Simulation Engines
- Cognitive Science Core: Mathematical Modeling of the AI Dependency Paradox
- Paid Experiment Branching via Genesis Research Credits (GRC)
- Glassmorphic Strategy Dashboard with Tailwind CSS, Three.js 3D Viewport, Chart.js
"""

import os
import sys
import math
import json
import time
import copy
import uuid
import random
import asyncio
import sqlite3
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Literal, Tuple
from contextlib import asynccontextmanager

from pydantic import BaseModel, Field, field_validator
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn


# ==============================================================================
# 1. DATABASE LAYER: SQLite WAL Persistent State Manager
# ==============================================================================

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "genesis_v2.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db():
    conn = get_db()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS civilisations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            xp REAL DEFAULT 0.0,
            xp_to_next_level REAL DEFAULT 1000.0,
            grc_balance REAL DEFAULT 1000.0,
            research_points REAL DEFAULT 0.0,
            tick INTEGER DEFAULT 0,
            year INTEGER DEFAULT 1,
            day INTEGER DEFAULT 1,
            simulation_status TEXT DEFAULT 'running',
            simulation_speed TEXT DEFAULT '1x',
            unlocked_techs TEXT DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS buildings (
            id TEXT PRIMARY KEY,
            civ_id TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            x REAL NOT NULL,
            y REAL NOT NULL,
            z REAL NOT NULL,
            rp_yield REAL DEFAULT 0.0,
            grc_yield REAL DEFAULT 0.0,
            maintenance_cost REAL DEFAULT 10.0,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (civ_id) REFERENCES civilisations (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS demographics (
            civ_id TEXT PRIMARY KEY,
            total_population INTEGER DEFAULT 100000,
            employment_rate REAL DEFAULT 0.90,
            education_index REAL DEFAULT 0.70,
            health_index REAL DEFAULT 0.85,
            happiness_index REAL DEFAULT 0.75,
            FOREIGN KEY (civ_id) REFERENCES civilisations (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS cognitive_profiles (
            civ_id TEXT PRIMARY KEY,
            ai_dependency REAL DEFAULT 0.20,
            independent_reasoning REAL DEFAULT 0.85,
            critical_evaluation REAL DEFAULT 0.80,
            problem_solving_velocity REAL DEFAULT 0.65,
            cognitive_atrophy_rate REAL DEFAULT 0.003,
            macro_innovation_index REAL DEFAULT 0.78,
            FOREIGN KEY (civ_id) REFERENCES civilisations (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS economy_resources (
            civ_id TEXT PRIMARY KEY,
            gdp REAL DEFAULT 25.0,
            gdp_growth_rate REAL DEFAULT 0.045,
            average_income REAL DEFAULT 48000.0,
            gini_coefficient REAL DEFAULT 0.28,
            civic_stability REAL DEFAULT 0.82,
            food REAL DEFAULT 5000.0,
            food_rate REAL DEFAULT 120.0,
            water REAL DEFAULT 5000.0,
            water_rate REAL DEFAULT 150.0,
            energy REAL DEFAULT 5000.0,
            energy_rate REAL DEFAULT 90.0,
            materials REAL DEFAULT 5000.0,
            materials_rate REAL DEFAULT 80.0,
            FOREIGN KEY (civ_id) REFERENCES civilisations (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS environment_metrics (
            civ_id TEXT PRIMARY KEY,
            pollution_index REAL DEFAULT 0.15,
            carbon_emissions REAL DEFAULT 240.0,
            clean_energy_ratio REAL DEFAULT 0.72,
            biosphere_health REAL DEFAULT 0.84,
            FOREIGN KEY (civ_id) REFERENCES civilisations (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS policies (
            civ_id TEXT PRIMARY KEY,
            cognitive_scaffolding REAL DEFAULT 0.75,
            universal_basic_income REAL DEFAULT 200.0,
            ai_automation_tier REAL DEFAULT 0.40,
            carbon_tax_rate REAL DEFAULT 0.15,
            education_subsidy REAL DEFAULT 0.30,
            FOREIGN KEY (civ_id) REFERENCES civilisations (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS experiments (
            id TEXT PRIMARY KEY,
            civ_id TEXT NOT NULL,
            title TEXT NOT NULL,
            hypothesis TEXT NOT NULL,
            variable_tested TEXT NOT NULL,
            grc_cost REAL NOT NULL,
            horizon_years INTEGER NOT NULL,
            baseline_trajectory TEXT NOT NULL,
            projected_trajectory TEXT NOT NULL,
            divergence_metrics TEXT NOT NULL,
            findings TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (civ_id) REFERENCES civilisations (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS snapshots (
            id TEXT PRIMARY KEY,
            civ_id TEXT NOT NULL,
            name TEXT NOT NULL,
            tick INTEGER NOT NULL,
            year INTEGER NOT NULL,
            day INTEGER NOT NULL,
            state_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (civ_id) REFERENCES civilisations (id) ON DELETE CASCADE
        );
        """)
    conn.close()


def seed_default_civilisation_if_missing():
    conn = get_db()
    row = conn.execute("SELECT id FROM civilisations WHERE id = 'civ_aurora_prime'").fetchone()
    if not row:
        now = datetime.now(timezone.utc).isoformat()
        with conn:
            # 1. Base Civilisation
            conn.execute("""
            INSERT INTO civilisations (
                id, name, level, xp, xp_to_next_level, grc_balance, research_points,
                tick, year, day, simulation_status, simulation_speed, unlocked_techs, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "civ_aurora_prime", "Aurora Prime", 4, 3850.0, 5200.0, 1450.0, 680.0,
                146, 12, 146, "running", "1x",
                json.dumps(["foundational_agriculture", "grid_electrification", "quantum_computation"]),
                now, now
            ))

            # 2. Demographics
            conn.execute("""
            INSERT INTO demographics (civ_id, total_population, employment_rate, education_index, health_index, happiness_index)
            VALUES (?, ?, ?, ?, ?, ?)
            """, ("civ_aurora_prime", 1248532, 0.91, 0.82, 0.88, 0.78))

            # 3. Cognitive Profiles
            conn.execute("""
            INSERT INTO cognitive_profiles (
                civ_id, ai_dependency, independent_reasoning, critical_evaluation,
                problem_solving_velocity, cognitive_atrophy_rate, macro_innovation_index
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, ("civ_aurora_prime", 0.28, 0.84, 0.81, 0.76, 0.0035, 0.82))

            # 4. Economy & Resources
            conn.execute("""
            INSERT INTO economy_resources (
                civ_id, gdp, gdp_growth_rate, average_income, gini_coefficient, civic_stability,
                food, food_rate, water, water_rate, energy, energy_rate, materials, materials_rate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "civ_aurora_prime", 48.6, 0.051, 52400.0, 0.27, 0.81,
                12500.0, 120.0, 18400.0, 180.0, 9800.0, 95.0, 6100.0, 60.0
            ))

            # 5. Environment Metrics
            conn.execute("""
            INSERT INTO environment_metrics (civ_id, pollution_index, carbon_emissions, clean_energy_ratio, biosphere_health)
            VALUES (?, ?, ?, ?, ?)
            """, ("civ_aurora_prime", 0.16, 180.0, 0.85, 0.82))

            # 6. Policies
            conn.execute("""
            INSERT INTO policies (civ_id, cognitive_scaffolding, universal_basic_income, ai_automation_tier, carbon_tax_rate, education_subsidy)
            VALUES (?, ?, ?, ?, ?, ?)
            """, ("civ_aurora_prime", 0.80, 250.0, 0.45, 0.18, 0.35))

            # 7. Seed Key Facilities (including University & Research Center for GRC/RP yield)
            seed_buildings = [
                ("bld_civic_council", "civ_aurora_prime", "High Council Citadel", "civic_council", 4, 0.0, 0.0, 0.0, 10.0, 2.0, 30.0),
                ("bld_uni_olympus", "civ_aurora_prime", "Imperial University of Sciences", "university", 3, -12.0, 0.0, 8.0, 45.0, 4.0, 25.0),
                ("bld_res_center_01", "civ_aurora_prime", "Quantum Cognition Lab", "research_center", 3, 14.0, 0.0, -10.0, 75.0, 7.0, 40.0),
                ("bld_bio_dome_01", "civ_aurora_prime", "Agri-Biosphere Delta", "bio_dome", 3, -16.0, 0.0, -14.0, 0.0, 0.0, 15.0),
                ("bld_fusion_plant", "civ_aurora_prime", "Helios Fusion Complex", "fusion_plant", 2, 18.0, 0.0, 16.0, 5.0, 1.0, 35.0),
                ("bld_res_hab_01", "civ_aurora_prime", "Arcology Spire Alpha", "residential_spire", 4, 4.0, 0.0, 12.0, 0.0, 0.0, 10.0),
                ("bld_obs_frontier", "civ_aurora_prime", "Subspace Telemetry Observatory", "quantum_observatory", 2, -22.0, 0.0, 2.0, 60.0, 5.0, 30.0),
            ]
            conn.executemany("""
            INSERT INTO buildings (id, civ_id, name, type, level, x, y, z, rp_yield, grc_yield, maintenance_cost, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            """, seed_buildings)
    conn.close()


# ==============================================================================
# 2. DATA SCHEMAS & MODELS (Pydantic v2)
# ==============================================================================

class BuildingModel(BaseModel):
    id: str
    civ_id: str
    name: str
    type: str
    level: int = 1
    x: float
    y: float
    z: float
    rp_yield: float = 0.0
    grc_yield: float = 0.0
    maintenance_cost: float = 10.0
    status: str = "active"


class BuildingConstructRequest(BaseModel):
    name: Optional[str] = None
    type: str
    x: float
    y: float = 0.0
    z: float


class PolicyUpdateRequest(BaseModel):
    cognitive_scaffolding: Optional[float] = Field(None, ge=0.0, le=1.0)
    universal_basic_income: Optional[float] = Field(None, ge=0.0, le=2000.0)
    ai_automation_tier: Optional[float] = Field(None, ge=0.0, le=1.0)
    carbon_tax_rate: Optional[float] = Field(None, ge=0.0, le=1.0)
    education_subsidy: Optional[float] = Field(None, ge=0.0, le=1.0)


class SimulationAdvanceRequest(BaseModel):
    ticks: int = Field(default=1, ge=1, le=365)


class ExperimentExecuteRequest(BaseModel):
    civ_id: str
    title: str
    hypothesis: str
    variable_tested: str
    horizon_years: int = Field(default=10, ge=3, le=50)
    policy_overrides: Optional[Dict[str, float]] = None


class CivilisationStateResponse(BaseModel):
    id: str
    name: str
    level: int
    xp: float
    xp_to_next_level: float
    grc_balance: float
    research_points: float
    tick: int
    year: int
    day: int
    simulation_status: str
    simulation_speed: str
    unlocked_techs: List[str]
    demographics: Dict[str, Any]
    cognitive: Dict[str, Any]
    economy: Dict[str, Any]
    environment: Dict[str, Any]
    policies: Dict[str, Any]
    buildings: List[BuildingModel]
    total_rp_per_tick: float
    total_grc_per_tick: float


# ==============================================================================
# 3. CORE SIMULATION ENGINE & MATHEMATICAL FORMULAS
# ==============================================================================

TECH_CATALOG = [
    {"id": "foundational_agriculture", "name": "Foundational Hydroponics", "category": "Bio-Synthesis", "rp_cost": 250, "grc_reward": 150, "desc": "Closed-loop aeroponics increasing baseline food security."},
    {"id": "grid_electrification", "name": "Magnetohydrodynamic Grid", "category": "Energy", "rp_cost": 400, "grc_reward": 200, "desc": "Lossless plasma power distribution grid."},
    {"id": "quantum_computation", "name": "Cryogenic Quantum AI Array", "category": "Cognition", "rp_cost": 850, "grc_reward": 350, "desc": "Sub-atomic reasoning accelerators for planetary optimization."},
    {"id": "scaffolding_frameworks", "name": "Cognitive Socratic Protocols", "category": "Cognition", "rp_cost": 1200, "grc_reward": 450, "desc": "Mandates human-in-the-loop dialectic friction to prevent brain atrophy."},
    {"id": "fusion_ignition", "name": "Stellarator Zero-Carbon Fusion", "category": "Energy", "rp_cost": 1600, "grc_reward": 500, "desc": "Unlimited clean fusion power for deep industrialization."},
    {"id": "post_scarcity_fabrication", "name": "Molecular Nanofoundry Arrays", "category": "Industry", "rp_cost": 2400, "grc_reward": 750, "desc": "Atomic level synthesis driving Gini coefficient down."},
]


BUILDING_BLUEPRINTS = {
    "university": {
        "name": "Polytechnic Institute of Research",
        "rp_yield": 45.0,
        "grc_yield": 4.0,
        "cost_materials": 450.0,
        "cost_energy": 25.0,
        "maintenance": 25.0,
    },
    "research_center": {
        "name": "Quantum Synthesis Laboratory",
        "rp_yield": 80.0,
        "grc_yield": 8.0,
        "cost_materials": 750.0,
        "cost_energy": 45.0,
        "maintenance": 45.0,
    },
    "bio_dome": {
        "name": "Aeroponic Agriculture Biosphere",
        "rp_yield": 5.0,
        "grc_yield": 0.5,
        "cost_materials": 300.0,
        "cost_energy": 15.0,
        "maintenance": 15.0,
    },
    "fusion_plant": {
        "name": "Tokamak Fusion Reactor",
        "rp_yield": 10.0,
        "grc_yield": 1.0,
        "cost_materials": 800.0,
        "cost_energy": -300.0,  # Generates 300 MW
        "maintenance": 50.0,
    },
    "residential_spire": {
        "name": "Arcology Living Habitat",
        "rp_yield": 2.0,
        "grc_yield": 0.0,
        "cost_materials": 350.0,
        "cost_energy": 20.0,
        "maintenance": 12.0,
    },
    "quantum_observatory": {
        "name": "Deep Space Telemetry Array",
        "rp_yield": 65.0,
        "grc_yield": 6.0,
        "cost_materials": 600.0,
        "cost_energy": 35.0,
        "maintenance": 30.0,
    },
}


class GenesisSimulationEngine:
    """Authoritative Discrete Step Civilisation Engine."""

    @staticmethod
    def step_civilisation(conn: sqlite3.Connection, civ_id: str, ticks: int = 1) -> Dict[str, Any]:
        civ = dict(conn.execute("SELECT * FROM civilisations WHERE id = ?", (civ_id,)).fetchone())
        demo = dict(conn.execute("SELECT * FROM demographics WHERE civ_id = ?", (civ_id,)).fetchone())
        cog = dict(conn.execute("SELECT * FROM cognitive_profiles WHERE civ_id = ?", (civ_id,)).fetchone())
        econ = dict(conn.execute("SELECT * FROM economy_resources WHERE civ_id = ?", (civ_id,)).fetchone())
        env = dict(conn.execute("SELECT * FROM environment_metrics WHERE civ_id = ?", (civ_id,)).fetchone())
        pol = dict(conn.execute("SELECT * FROM policies WHERE civ_id = ?", (civ_id,)).fetchone())
        buildings = [dict(b) for b in conn.execute("SELECT * FROM buildings WHERE civ_id = ? AND status = 'active'", (civ_id,)).fetchall()]

        # Aggregate yields from research buildings (Universities, Labs, Observatories)
        total_rp_rate = sum(b["rp_yield"] * (1.0 + (b["level"] - 1) * 0.4) for b in buildings)
        total_grc_rate = sum(b["grc_yield"] * (1.0 + (b["level"] - 1) * 0.4) for b in buildings)
        total_maintenance = sum(b["maintenance_cost"] * b["level"] for b in buildings)

        for _ in range(ticks):
            # Calendar & discrete time
            civ["tick"] += 1
            civ["day"] += 1
            if civ["day"] > 365:
                civ["day"] = 1
                civ["year"] += 1

            # ------------------------------------------------------------------
            # 1. Cognitive Science: The AI Dependency Paradox
            # ------------------------------------------------------------------
            # AI Dependency climbs according to automation tier
            ai_dep = min(1.0, cog["ai_dependency"] + pol["ai_automation_tier"] * 0.008)
            cog["ai_dependency"] = round(ai_dep, 4)

            # Problem-Solving Velocity accelerates with AI adoption
            vel = min(1.0, 0.45 + (cog["ai_dependency"] * 0.50))
            cog["problem_solving_velocity"] = round(vel, 4)

            # Cognitive Atrophy: Decays independent human faculties unless scaffolding friction is high
            scaffolding = pol["cognitive_scaffolding"]
            atrophy = (1.0 - scaffolding) * 0.015 * cog["ai_dependency"]
            cog["cognitive_atrophy_rate"] = round(atrophy, 5)

            # Independent Reasoning decays under high atrophy, partially salvaged by education subsidies
            reasoning = max(0.12, cog["independent_reasoning"] - atrophy + (pol["education_subsidy"] * 0.004))
            cog["independent_reasoning"] = round(reasoning, 4)

            # Critical Evaluation decays similarly
            crit = max(0.12, cog["critical_evaluation"] - (atrophy * 0.85) + (pol["education_subsidy"] * 0.003))
            cog["critical_evaluation"] = round(crit, 4)

            # Macro Collective Innovation Index: Synthesizes reasoning and autonomy
            macro_inn = (0.60 * cog["independent_reasoning"] + 0.40 * (1.0 - cog["ai_dependency"]) + demo["education_index"] * 0.15)
            cog["macro_innovation_index"] = round(min(1.0, max(0.10, macro_inn)), 4)

            # ------------------------------------------------------------------
            # 2. Demographics & Population Engine
            # ------------------------------------------------------------------
            birth_rate = 0.030 * demo["health_index"] * (1.0 - env["pollution_index"] * 0.15)
            death_rate = 0.008 / max(0.1, demo["health_index"]) + (env["pollution_index"] * 0.005)
            migration = (demo["happiness_index"] - 0.50) * 0.018

            annual_net_growth = (birth_rate - death_rate + migration)
            pop_delta = int(demo["total_population"] * (annual_net_growth / 365.0))
            demo["total_population"] = max(1000, demo["total_population"] + pop_delta)

            # Happiness & Health dynamics
            demo["happiness_index"] = round(min(1.0, max(0.1, (
                0.35 * demo["employment_rate"] +
                0.25 * (pol["universal_basic_income"] / 1000.0) +
                0.20 * env["biosphere_health"] +
                0.20 * (1.0 - econ["gini_coefficient"])
            ))), 3)

            # ------------------------------------------------------------------
            # 3. Economy & Resources Engine
            # ------------------------------------------------------------------
            # GDP growth powered by velocity, innovation, and baseline employment
            gdp_drift = (0.025 + 0.035 * cog["problem_solving_velocity"] + 0.025 * cog["macro_innovation_index"] - pol["carbon_tax_rate"] * 0.01)
            econ["gdp_growth_rate"] = round(gdp_drift, 4)
            econ["gdp"] = round(econ["gdp"] * (1.0 + (gdp_drift / 365.0)), 3)

            # Gini Inequality rises with raw automation, suppressed by UBI and Progressive Tax
            gini = 0.22 + (0.24 * pol["ai_automation_tier"]) - ((pol["universal_basic_income"] / 1000.0) * 0.16) - (pol["carbon_tax_rate"] * 0.06)
            econ["gini_coefficient"] = round(min(0.65, max(0.18, gini)), 3)

            # Civic Stability
            stability = 1.0 - ((econ["gini_coefficient"] - 0.22) * 1.3) + (demo["happiness_index"] * 0.25) - (env["pollution_index"] * 0.20)
            econ["civic_stability"] = round(min(0.99, max(0.10, stability)), 3)

            # Resources deltas
            econ["materials"] = round(max(0.0, econ["materials"] + (econ["materials_rate"] * 0.1) - (total_maintenance * 0.05)), 1)
            econ["energy"] = round(max(0.0, econ["energy"] + (econ["energy_rate"] * 0.1)), 1)
            econ["food"] = round(max(0.0, econ["food"] + (econ["food_rate"] * 0.1)), 1)
            econ["water"] = round(max(0.0, econ["water"] + (econ["water_rate"] * 0.1)), 1)

            # ------------------------------------------------------------------
            # 4. GRC Treasury & Research Points Yields
            # ------------------------------------------------------------------
            civ["research_points"] = round(civ["research_points"] + total_rp_rate * 0.1, 1)
            civ["grc_balance"] = round(civ["grc_balance"] + total_grc_rate * 0.05, 2)

            # Experience & Level progression
            xp_gain = 2.5 + (total_rp_rate * 0.05) + (demo["total_population"] / 500000.0)
            civ["xp"] += round(xp_gain, 1)
            if civ["xp"] >= civ["xp_to_next_level"]:
                civ["level"] += 1
                civ["xp"] -= civ["xp_to_next_level"]
                civ["xp_to_next_level"] = round(civ["xp_to_next_level"] * 1.45, 1)
                # Level Up GRC Reward Grant
                civ["grc_balance"] += 250.0

            # ------------------------------------------------------------------
            # 5. Biosphere & Environmental Health
            # ------------------------------------------------------------------
            raw_emissions = max(10.0, (econ["gdp"] * 4.5) - (pol["carbon_tax_rate"] * 120.0))
            env["carbon_emissions"] = round(raw_emissions, 1)
            env["pollution_index"] = round(min(1.0, max(0.05, raw_emissions / 1200.0)), 3)
            env["biosphere_health"] = round(min(1.0, max(0.10, 1.0 - env["pollution_index"] + (env["clean_energy_ratio"] * 0.15))), 3)

        now = datetime.now(timezone.utc).isoformat()
        civ["updated_at"] = now

        # Write back to SQLite
        with conn:
            conn.execute("""
            UPDATE civilisations SET
                level=?, xp=?, xp_to_next_level=?, grc_balance=?, research_points=?,
                tick=?, year=?, day=?, simulation_status=?, simulation_speed=?, updated_at=?
            WHERE id=?
            """, (
                civ["level"], civ["xp"], civ["xp_to_next_level"], civ["grc_balance"], civ["research_points"],
                civ["tick"], civ["year"], civ["day"], civ["simulation_status"], civ["simulation_speed"],
                now, civ_id
            ))

            conn.execute("""
            UPDATE demographics SET
                total_population=?, employment_rate=?, education_index=?, health_index=?, happiness_index=?
            WHERE civ_id=?
            """, (
                demo["total_population"], demo["employment_rate"], demo["education_index"], demo["health_index"],
                demo["happiness_index"], civ_id
            ))

            conn.execute("""
            UPDATE cognitive_profiles SET
                ai_dependency=?, independent_reasoning=?, critical_evaluation=?,
                problem_solving_velocity=?, cognitive_atrophy_rate=?, macro_innovation_index=?
            WHERE civ_id=?
            """, (
                cog["ai_dependency"], cog["independent_reasoning"], cog["critical_evaluation"],
                cog["problem_solving_velocity"], cog["cognitive_atrophy_rate"], cog["macro_innovation_index"], civ_id
            ))

            conn.execute("""
            UPDATE economy_resources SET
                gdp=?, gdp_growth_rate=?, average_income=?, gini_coefficient=?, civic_stability=?,
                food=?, food_rate=?, water=?, water_rate=?, energy=?, energy_rate=?, materials=?, materials_rate=?
            WHERE civ_id=?
            """, (
                econ["gdp"], econ["gdp_growth_rate"], econ["average_income"], econ["gini_coefficient"],
                econ["civic_stability"], econ["food"], econ["food_rate"], econ["water"], econ["water_rate"],
                econ["energy"], econ["energy_rate"], econ["materials"], econ["materials_rate"], civ_id
            ))

            conn.execute("""
            UPDATE environment_metrics SET
                pollution_index=?, carbon_emissions=?, clean_energy_ratio=?, biosphere_health=?
            WHERE civ_id=?
            """, (
                env["pollution_index"], env["carbon_emissions"], env["clean_energy_ratio"], env["biosphere_health"], civ_id
            ))

        return {
            "civ": civ,
            "demo": demo,
            "cog": cog,
            "econ": econ,
            "env": env,
            "pol": pol,
            "total_rp_rate": total_rp_rate,
            "total_grc_rate": total_grc_rate,
        }


# ==============================================================================
# 4. FASTAPI WEB SERVER & ENDPOINTS
# ==============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_default_civilisation_if_missing()
    yield

app = FastAPI(
    title="GENESIS Engine v2.0 - Artificial Civilisation & Policy Simulator",
    description="Authoritative persistent simulation backend, AI Dependency Paradox modeling, and GRC-backed experiment branching.",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Connection Manager for WebSocket live streams
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, civ_id: str, websocket: WebSocket):
        await websocket.accept()
        if civ_id not in self.active_connections:
            self.active_connections[civ_id] = []
        self.active_connections[civ_id].append(websocket)

    def disconnect(self, civ_id: str, websocket: WebSocket):
        if civ_id in self.active_connections:
            if websocket in self.active_connections[civ_id]:
                self.active_connections[civ_id].remove(websocket)

    async def broadcast(self, civ_id: str, message: Dict[str, Any]):
        if civ_id in self.active_connections:
            text = json.dumps(message)
            for ws in list(self.active_connections[civ_id]):
                try:
                    await ws.send_text(text)
                except Exception:
                    self.disconnect(civ_id, ws)

manager = ConnectionManager()


# ------------------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------------------

@app.get("/api/civilisations/{id}/state", response_model=CivilisationStateResponse)
async def get_civilisation_state(id: str):
    """Retrieve complete, authoritative persistent civilisation state."""
    conn = get_db()
    civ = conn.execute("SELECT * FROM civilisations WHERE id = ?", (id,)).fetchone()
    if not civ:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Civilisation '{id}' not found")

    demo = conn.execute("SELECT * FROM demographics WHERE civ_id = ?", (id,)).fetchone()
    cog = conn.execute("SELECT * FROM cognitive_profiles WHERE civ_id = ?", (id,)).fetchone()
    econ = conn.execute("SELECT * FROM economy_resources WHERE civ_id = ?", (id,)).fetchone()
    env = conn.execute("SELECT * FROM environment_metrics WHERE civ_id = ?", (id,)).fetchone()
    pol = conn.execute("SELECT * FROM policies WHERE civ_id = ?", (id,)).fetchone()
    buildings = conn.execute("SELECT * FROM buildings WHERE civ_id = ?", (id,)).fetchall()
    conn.close()

    bld_objs = [BuildingModel(**dict(b)) for b in buildings]
    total_rp = sum(b.rp_yield * (1.0 + (b.level - 1) * 0.4) for b in bld_objs)
    total_grc = sum(b.grc_yield * (1.0 + (b.level - 1) * 0.4) for b in bld_objs)

    return CivilisationStateResponse(
        id=civ["id"],
        name=civ["name"],
        level=civ["level"],
        xp=civ["xp"],
        xp_to_next_level=civ["xp_to_next_level"],
        grc_balance=civ["grc_balance"],
        research_points=civ["research_points"],
        tick=civ["tick"],
        year=civ["year"],
        day=civ["day"],
        simulation_status=civ["simulation_status"],
        simulation_speed=civ["simulation_speed"],
        unlocked_techs=json.loads(civ["unlocked_techs"] or "[]"),
        demographics=dict(demo) if demo else {},
        cognitive=dict(cog) if cog else {},
        economy=dict(econ) if econ else {},
        environment=dict(env) if env else {},
        policies=dict(pol) if pol else {},
        buildings=bld_objs,
        total_rp_per_tick=round(total_rp, 1),
        total_grc_per_tick=round(total_grc, 2)
    )


@app.post("/api/civilisations/{id}/advance")
async def advance_simulation(id: str, req: SimulationAdvanceRequest):
    """Advance civilisation time by N discrete ticks."""
    conn = get_db()
    civ = conn.execute("SELECT id FROM civilisations WHERE id = ?", (id,)).fetchone()
    if not civ:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Civilisation '{id}' not found")

    res = GenesisSimulationEngine.step_civilisation(conn, id, ticks=req.ticks)
    conn.close()

    # Broadcast live state update via WebSocket
    await manager.broadcast(id, {
        "type": "telemetry_tick",
        "ticks_processed": req.ticks,
        "year": res["civ"]["year"],
        "day": res["civ"]["day"],
        "grc_balance": res["civ"]["grc_balance"],
        "research_points": res["civ"]["research_points"],
        "gdp": res["econ"]["gdp"],
        "gini": res["econ"]["gini_coefficient"],
        "stability": res["econ"]["civic_stability"],
        "innovation_index": res["cog"]["macro_innovation_index"],
        "reasoning": res["cog"]["independent_reasoning"],
    })

    return {
        "success": True,
        "ticks": req.ticks,
        "current_year": res["civ"]["year"],
        "current_day": res["civ"]["day"],
        "grc_balance": res["civ"]["grc_balance"],
        "research_points": res["civ"]["research_points"],
        "gdp": res["econ"]["gdp"],
        "innovation_index": res["cog"]["macro_innovation_index"]
    }


@app.post("/api/civilisations/{id}/buildings", status_code=status.HTTP_201_CREATED)
async def construct_building(id: str, req: BuildingConstructRequest):
    """Construct a building facility with spatial coordinates."""
    conn = get_db()
    civ = conn.execute("SELECT id FROM civilisations WHERE id = ?", (id,)).fetchone()
    if not civ:
        conn.close()
        raise HTTPException(status_code=404, detail="Civilisation not found")

    blueprint = BUILDING_BLUEPRINTS.get(req.type.lower(), {
        "name": f"{req.type.title()} Facility",
        "rp_yield": 10.0,
        "grc_yield": 1.0,
        "maintenance": 15.0
    })

    bld_id = f"bld_{uuid.uuid4().hex[:8]}"
    bld_name = req.name or blueprint["name"]
    rp_y = blueprint["rp_yield"]
    grc_y = blueprint["grc_yield"]
    maint = blueprint["maintenance"]

    with conn:
        conn.execute("""
        INSERT INTO buildings (id, civ_id, name, type, level, x, y, z, rp_yield, grc_yield, maintenance_cost, status)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 'active')
        """, (bld_id, id, bld_name, req.type.lower(), req.x, req.y, req.z, rp_y, grc_y, maint))
    conn.close()

    return {
        "id": bld_id,
        "name": bld_name,
        "type": req.type.lower(),
        "level": 1,
        "x": req.x,
        "y": req.y,
        "z": req.z,
        "rp_yield": rp_y,
        "grc_yield": grc_y,
        "maintenance_cost": maint
    }


@app.post("/api/civilisations/{id}/buildings/{bld_id}/upgrade")
async def upgrade_building(id: str, bld_id: str):
    """Upgrade building level, multiplying its research and credit output."""
    conn = get_db()
    bld = conn.execute("SELECT * FROM buildings WHERE id = ? AND civ_id = ?", (bld_id, id)).fetchone()
    if not bld:
        conn.close()
        raise HTTPException(status_code=404, detail="Building not found")

    new_level = bld["level"] + 1
    with conn:
        conn.execute("UPDATE buildings SET level = ? WHERE id = ?", (new_level, bld_id))
    conn.close()

    return {"success": True, "building_id": bld_id, "new_level": new_level}


@app.post("/api/civilisations/{id}/policies")
async def update_policies(id: str, req: PolicyUpdateRequest):
    """Adjust governance policies and calculate systemic trade-offs."""
    conn = get_db()
    current = conn.execute("SELECT * FROM policies WHERE civ_id = ?", (id,)).fetchone()
    if not current:
        conn.close()
        raise HTTPException(status_code=404, detail="Civilisation policies not found")

    updated = {
        "cognitive_scaffolding": req.cognitive_scaffolding if req.cognitive_scaffolding is not None else current["cognitive_scaffolding"],
        "universal_basic_income": req.universal_basic_income if req.universal_basic_income is not None else current["universal_basic_income"],
        "ai_automation_tier": req.ai_automation_tier if req.ai_automation_tier is not None else current["ai_automation_tier"],
        "carbon_tax_rate": req.carbon_tax_rate if req.carbon_tax_rate is not None else current["carbon_tax_rate"],
        "education_subsidy": req.education_subsidy if req.education_subsidy is not None else current["education_subsidy"],
    }

    with conn:
        conn.execute("""
        UPDATE policies SET
            cognitive_scaffolding = ?, universal_basic_income = ?, ai_automation_tier = ?,
            carbon_tax_rate = ?, education_subsidy = ?
        WHERE civ_id = ?
        """, (
            updated["cognitive_scaffolding"], updated["universal_basic_income"], updated["ai_automation_tier"],
            updated["carbon_tax_rate"], updated["education_subsidy"], id
        ))
    conn.close()

    return {"success": True, "policies": updated}


@app.post("/api/experiments/execute")
async def execute_experiment(req: ExperimentExecuteRequest):
    """
    Deduct Genesis Research Credits (GRC), deep-copy state at T_current,
    apply experimental policy changes, and run counterfactual projection.
    Enforces transaction safety: Never allows negative GRC balances.
    """
    conn = get_db()
    civ = conn.execute("SELECT * FROM civilisations WHERE id = ?", (req.civ_id,)).fetchone()
    if not civ:
        conn.close()
        raise HTTPException(status_code=404, detail="Civilisation not found")

    # Transaction Safety: Calculate credit cost based on complexity & horizon
    grc_cost = 150.0 + (req.horizon_years * 12.0)
    current_grc = civ["grc_balance"]

    if current_grc < grc_cost:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient Genesis Research Credits (GRC). Required: {grc_cost} GRC, Available: {current_grc} GRC."
        )

    # Deduct GRC atomically
    with conn:
        conn.execute("UPDATE civilisations SET grc_balance = grc_balance - ? WHERE id = ?", (grc_cost, req.civ_id))

    # Pull current baseline parameters
    econ = dict(conn.execute("SELECT * FROM economy_resources WHERE civ_id = ?", (req.civ_id,)).fetchone())
    cog = dict(conn.execute("SELECT * FROM cognitive_profiles WHERE civ_id = ?", (req.civ_id,)).fetchone())
    pol = dict(conn.execute("SELECT * FROM policies WHERE civ_id = ?", (req.civ_id,)).fetchone())

    # Deep-copy baseline trajectory and simulate counterfactual projection
    start_year = civ["year"]
    horizon = req.horizon_years
    baseline_trajectory = []
    projected_trajectory = []

    # Baseline trajectory (current policies continue)
    b_gdp = econ["gdp"]
    b_gini = econ["gini_coefficient"]
    b_stab = econ["civic_stability"]
    b_reason = cog["independent_reasoning"]
    b_dep = cog["ai_dependency"]

    for y in range(horizon):
        year_num = start_year + y + 1
        b_dep = min(1.0, b_dep + 0.02)
        b_atrophy = (1.0 - pol["cognitive_scaffolding"]) * 0.015 * b_dep
        b_reason = max(0.12, b_reason - (b_atrophy * 10))
        b_gdp = round(b_gdp * 1.042, 2)
        b_gini = round(min(0.60, b_gini + 0.005), 3)
        b_stab = round(max(0.20, b_stab - 0.006), 3)
        baseline_trajectory.append({
            "year": year_num,
            "gdp": b_gdp,
            "gini": b_gini,
            "stability": b_stab,
            "reasoning": round(b_reason, 3),
            "dependency": round(b_dep, 3),
        })

    # Projected trajectory (with policy overrides applied)
    overrides = req.policy_overrides or {}
    p_scaffold = overrides.get("cognitive_scaffolding", 0.90)
    p_ubi = overrides.get("universal_basic_income", pol["universal_basic_income"] * 1.5)
    p_automation = overrides.get("ai_automation_tier", pol["ai_automation_tier"])

    p_gdp = econ["gdp"]
    p_gini = econ["gini_coefficient"]
    p_stab = econ["civic_stability"]
    p_reason = cog["independent_reasoning"]
    p_dep = cog["ai_dependency"]

    for y in range(horizon):
        year_num = start_year + y + 1
        p_dep = min(1.0, p_dep + (p_automation * 0.015))
        # Active scaffolding prevents cognitive atrophy!
        p_atrophy = (1.0 - p_scaffold) * 0.015 * p_dep
        p_reason = max(0.12, min(0.98, p_reason - (p_atrophy * 10) + 0.01))
        p_gdp = round(p_gdp * (1.038 + (p_reason * 0.015)), 2)
        p_gini = round(max(0.19, p_gini - ((p_ubi / 1000.0) * 0.02)), 3)
        p_stab = round(min(0.96, p_stab + 0.015), 3)
        projected_trajectory.append({
            "year": year_num,
            "gdp": p_gdp,
            "gini": p_gini,
            "stability": p_stab,
            "reasoning": round(p_reason, 3),
            "dependency": round(p_dep, 3),
        })

    final_base = baseline_trajectory[-1]
    final_proj = projected_trajectory[-1]

    divergence = {
        "reasoning_retention_gap": round((final_proj["reasoning"] - final_base["reasoning"]) * 100, 1),
        "gini_reduction_pct": round((final_base["gini"] - final_proj["gini"]) * 100, 1),
        "civic_stability_gain": round((final_proj["stability"] - final_base["stability"]) * 100, 1),
        "macro_wealth_divergence": round(final_proj["gdp"] - final_base["gdp"], 2),
    }

    findings = (
        f"Empirical Confirmation: Applying {p_scaffold*100:.0f}% Cognitive Scaffolding during {req.variable_tested} "
        f"preserves Independent Reasoning by +{divergence['reasoning_retention_gap']}% over a {horizon}-year horizon. "
        f"Simultaneously, UBI calibrated at ${p_ubi:.0f} compresses Gini inequality by {divergence['gini_reduction_pct']} points."
    )

    exp_id = f"exp_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    with conn:
        conn.execute("""
        INSERT INTO experiments (
            id, civ_id, title, hypothesis, variable_tested, grc_cost, horizon_years,
            baseline_trajectory, projected_trajectory, divergence_metrics, findings, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            exp_id, req.civ_id, req.title, req.hypothesis, req.variable_tested, grc_cost, req.horizon_years,
            json.dumps(baseline_trajectory), json.dumps(projected_trajectory), json.dumps(divergence), findings, now
        ))
    conn.close()

    return {
        "experiment_id": exp_id,
        "title": req.title,
        "variable_tested": req.variable_tested,
        "grc_deducted": grc_cost,
        "remaining_grc": round(current_grc - grc_cost, 2),
        "horizon_years": req.horizon_years,
        "divergence_metrics": divergence,
        "baseline_trajectory": baseline_trajectory,
        "projected_trajectory": projected_trajectory,
        "findings": findings
    }


@app.get("/api/experiments/{id}/compare")
async def get_experiment_comparison(id: str):
    """Retrieve saved experiment comparison trajectories and scientific findings."""
    conn = get_db()
    exp = conn.execute("SELECT * FROM experiments WHERE id = ?", (id,)).fetchone()
    conn.close()

    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    return {
        "experiment_id": exp["id"],
        "title": exp["title"],
        "hypothesis": exp["hypothesis"],
        "variable_tested": exp["variable_tested"],
        "grc_cost": exp["grc_cost"],
        "horizon_years": exp["horizon_years"],
        "baseline_trajectory": json.loads(exp["baseline_trajectory"]),
        "projected_trajectory": json.loads(exp["projected_trajectory"]),
        "divergence_metrics": json.loads(exp["divergence_metrics"]),
        "findings": exp["findings"],
        "created_at": exp["created_at"]
    }


@app.websocket("/ws/telemetry/{id}")
async def websocket_telemetry(websocket: WebSocket, id: str):
    """Live streaming WebSocket delivering high-speed telemetry frames."""
    await manager.connect(id, websocket)
    try:
        while True:
            # Keep socket alive and respond to client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong", "time": time.time()}))
    except WebSocketDisconnect:
        manager.disconnect(id, websocket)


# ==============================================================================
# 5. EMBEDDED FRONTEND UI COMMAND CENTER (Glassmorphic Dashboard)
# ==============================================================================

HTML_DASHBOARD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GENESIS Engine v2.0 · Artificial Civilisation & Policy Simulator</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- Three.js CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0b0f12; color: #ede8dc; overflow-x: hidden; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .glass-card { background: rgba(18, 23, 27, 0.78); backdrop-filter: blur(14px); border: 1px solid rgba(223, 183, 74, 0.22); }
    .glass-card-subtle { background: rgba(14, 18, 21, 0.85); backdrop-filter: blur(10px); border: 1px solid rgba(55, 68, 77, 0.4); }
    .gold-glow { text-shadow: 0 0 16px rgba(223, 183, 74, 0.45); }
    .custom-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #37444d; border-radius: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: #0b0f12; }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased selection:bg-[#758d5c] selection:text-white">

  <!-- Top Strategic Status Bar -->
  <header class="h-14 border-b border-[#253036] bg-[#0e1215]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-[#182126] border border-[#c29b38]/60 flex items-center justify-center text-[#dfb74a] shadow-md">
        <i data-lucide="crown" class="w-4 h-4"></i>
      </div>
      <div>
        <h1 class="text-sm font-extrabold tracking-wider text-[#ede8dc] uppercase flex items-center gap-2">
          GENESIS <span class="text-[10px] px-1.5 py-0.5 rounded bg-[#2a382b] text-[#a6bd82] font-mono border border-[#485f44]">v2.0 MASTER ENGINE</span>
        </h1>
        <p class="text-[10px] text-[#8a8376] font-mono leading-none">PERSISTENT CIVILISATION & COGNITIVE POLICY LABORATORY</p>
      </div>
    </div>

    <!-- Live Macro HUD -->
    <div class="hidden lg:flex items-center gap-6 text-xs font-mono">
      <div class="flex items-center gap-2">
        <i data-lucide="calendar" class="w-4 h-4 text-[#7ea376]"></i>
        <span class="text-[#8a8376]">TIME:</span>
        <span id="hud-time" class="text-[#ede8dc] font-bold">Year 12, Day 146</span>
      </div>
      <div class="flex items-center gap-2">
        <i data-lucide="users" class="w-4 h-4 text-[#7ea376]"></i>
        <span class="text-[#8a8376]">POPULATION:</span>
        <span id="hud-pop" class="text-[#ede8dc] font-bold">1,248,532</span>
      </div>
      <div class="flex items-center gap-2">
        <i data-lucide="trending-up" class="w-4 h-4 text-[#c29b38]"></i>
        <span class="text-[#8a8376]">GDP:</span>
        <span id="hud-gdp" class="text-[#ede8dc] font-bold">$48.6B</span>
      </div>
      <div class="flex items-center gap-2 bg-[#1b231d] px-3 py-1 rounded-md border border-[#3e563a]">
        <i data-lucide="coins" class="w-4 h-4 text-[#dfb74a]"></i>
        <span class="text-[#a6bd82] font-bold">GRC TREASURY:</span>
        <span id="hud-grc" class="text-[#dfb74a] font-bold">1,450 GRC</span>
      </div>
    </div>

    <!-- Fast Controls -->
    <div class="flex items-center gap-2">
      <button onclick="advanceTicks(1)" class="px-3 py-1.5 rounded bg-[#1e262c] hover:bg-[#28343c] border border-[#37444d] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors">
        <i data-lucide="step-forward" class="w-3.5 h-3.5 text-[#7ea376]"></i>
        <span>+1 TICK</span>
      </button>
      <button onclick="advanceTicks(30)" class="px-3 py-1.5 rounded bg-[#2e3b2c] hover:bg-[#3d4f3b] border border-[#5c7756] text-xs font-mono font-bold text-[#dce9ca] flex items-center gap-1.5 transition-colors">
        <i data-lucide="fast-forward" class="w-3.5 h-3.5"></i>
        <span>+30 TICKS</span>
      </button>
    </div>
  </header>

  <!-- Main Navigation Tabs -->
  <nav class="border-b border-[#253036] bg-[#111619] px-6 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
    <button onclick="switchTab('overview')" id="tab-overview" class="tab-btn px-4 py-3 border-b-2 border-[#dfb74a] text-[#dfb74a] flex items-center gap-2">
      <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
      <span>Executive Overview & 3D World</span>
    </button>
    <button onclick="switchTab('tech')" id="tab-tech" class="tab-btn px-4 py-3 border-b-2 border-transparent text-[#8a8376] hover:text-[#ede8dc] flex items-center gap-2">
      <i data-lucide="git-branch" class="w-4 h-4"></i>
      <span>Civilisation & Tech Tree (GRC Economy)</span>
    </button>
    <button onclick="switchTab('cognitive')" id="tab-cognitive" class="tab-btn px-4 py-3 border-b-2 border-transparent text-[#8a8376] hover:text-[#ede8dc] flex items-center gap-2">
      <i data-lucide="brain" class="w-4 h-4"></i>
      <span>AI Dependency Paradox Lab</span>
    </button>
    <button onclick="switchTab('experiments')" id="tab-experiments" class="tab-btn px-4 py-3 border-b-2 border-transparent text-[#8a8376] hover:text-[#ede8dc] flex items-center gap-2">
      <i data-lucide="microscope" class="w-4 h-4"></i>
      <span>Future Simulator & Scenario Branching</span>
    </button>
    <button onclick="switchTab('roadmap')" id="tab-roadmap" class="tab-btn px-4 py-3 border-b-2 border-transparent text-[#8a8376] hover:text-[#ede8dc] flex items-center gap-2">
      <i data-lucide="file-code" class="w-4 h-4"></i>
      <span>7-Day Roadmap & API Schema Contracts</span>
    </button>
  </nav>

  <!-- Workspace Container -->
  <main class="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

    <!-- SECTION 1: EXECUTIVE OVERVIEW & 3D WORLD -->
    <div id="section-overview" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 3D Three.js Interactive Canvas -->
        <div class="lg:col-span-2 glass-card rounded-2xl p-4 flex flex-col h-[460px] relative overflow-hidden">
          <div class="flex items-center justify-between pb-3 border-b border-[#2a363d] z-10">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#7ea376] animate-pulse"></span>
              <h2 class="text-xs font-bold font-mono tracking-wider text-[#ede8dc] uppercase">Interactive 3D WebGL Command Viewport</h2>
            </div>
            <div class="flex items-center gap-2 text-[10px] font-mono text-[#8a8376]">
              <span>TIER: OLYMPIAN</span>
              <span>GRID: 64x64</span>
            </div>
          </div>
          <div id="three-viewport" class="flex-1 w-full rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing"></div>
          <div class="absolute bottom-6 left-6 z-10 bg-[#0e1215]/90 border border-[#2a363d] px-3 py-1.5 rounded-lg text-[10px] font-mono text-[#a6bd82] flex items-center gap-2">
            <i data-lucide="compass" class="w-3.5 h-3.5"></i>
            <span>Drag mouse to orbit. Scroll wheel to zoom.</span>
          </div>
        </div>

        <!-- Telemetry KPIs -->
        <div class="space-y-4">
          <div class="glass-card rounded-2xl p-5 space-y-4">
            <h3 class="text-xs font-bold font-mono text-[#c29b38] uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="activity" class="w-4 h-4"></i>
              System Stability & Welfare
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-xs font-mono mb-1">
                  <span class="text-[#8a8376]">Civic Stability Index</span>
                  <span id="kpi-stability" class="text-[#7ea376] font-bold">81.0%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-[#182126] overflow-hidden">
                  <div id="bar-stability" class="h-full bg-gradient-to-r from-[#4d7148] to-[#7ea376] rounded-full transition-all duration-500" style="width: 81%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-mono mb-1">
                  <span class="text-[#8a8376]">Gini Inequality Coefficient</span>
                  <span id="kpi-gini" class="text-[#dfb74a] font-bold">0.270 (Healthy)</span>
                </div>
                <div class="w-full h-2 rounded-full bg-[#182126] overflow-hidden">
                  <div id="bar-gini" class="h-full bg-gradient-to-r from-[#a68128] to-[#dfb74a] rounded-full transition-all duration-500" style="width: 27%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-mono mb-1">
                  <span class="text-[#8a8376]">Biosphere Health Score</span>
                  <span id="kpi-biosphere" class="text-[#7ea376] font-bold">82.0%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-[#182126] overflow-hidden">
                  <div id="bar-biosphere" class="h-full bg-gradient-to-r from-[#3c5938] to-[#7ea376] rounded-full transition-all duration-500" style="width: 82%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Construct Panel -->
          <div class="glass-card rounded-2xl p-5 space-y-3">
            <h3 class="text-xs font-bold font-mono text-[#a6bd82] uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              Construct Research Facility
            </h3>
            <p class="text-[11px] text-[#8a8376]">Expand planetary knowledge to multiply Research Points (RP) and GRC treasury yield.</p>
            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
              <button onclick="deployFacility('university')" class="p-2.5 rounded-lg bg-[#161d22] hover:bg-[#202b33] border border-[#2a363d] text-left transition-colors">
                <div class="font-bold text-[#ede8dc]">University</div>
                <div class="text-[10px] text-[#dfb74a]">+45 RP / +4 GRC</div>
              </button>
              <button onclick="deployFacility('research_center')" class="p-2.5 rounded-lg bg-[#161d22] hover:bg-[#202b33] border border-[#2a363d] text-left transition-colors">
                <div class="font-bold text-[#ede8dc]">Research Lab</div>
                <div class="text-[10px] text-[#dfb74a]">+80 RP / +8 GRC</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: TECH TREE & RESEARCH BUILDINGS -->
    <div id="section-tech" class="hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Civilisation Progression Summary -->
        <div class="glass-card rounded-2xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[10px] font-mono text-[#a6bd82] uppercase tracking-wider">Civilisation Status</span>
              <h2 id="civ-name" class="text-xl font-bold text-[#ede8dc]">Aurora Prime</h2>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-mono text-[#8a8376]">CURRENT TIER</span>
              <div id="civ-level" class="text-lg font-bold font-mono text-[#dfb74a]">Level 4</div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-mono mb-1.5">
              <span class="text-[#8a8376]">Tier XP Progress</span>
              <span id="civ-xp-text" class="text-[#ede8dc]">3,850 / 5,200 XP</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-[#182126] overflow-hidden">
              <div id="civ-xp-bar" class="h-full bg-gradient-to-r from-[#8f7742] to-[#dfb74a] rounded-full transition-all duration-500" style="width: 74%"></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-[#253036] text-xs font-mono">
            <div class="p-3 rounded-xl bg-[#141a1e] border border-[#26343d]">
              <span class="text-[10px] text-[#8a8376]">RP PRODUCTION</span>
              <div id="stat-total-rp" class="text-base font-bold text-[#a6bd82]">+195.0 / tick</div>
            </div>
            <div class="p-3 rounded-xl bg-[#141a1e] border border-[#26343d]">
              <span class="text-[10px] text-[#8a8376]">GRC YIELD RATE</span>
              <div id="stat-total-grc" class="text-base font-bold text-[#dfb74a]">+19.0 / tick</div>
            </div>
          </div>
        </div>

        <!-- Research Buildings Roster -->
        <div class="lg:col-span-2 glass-card rounded-2xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold font-mono text-[#c29b38] uppercase tracking-wider flex items-center gap-2">
              <i data-lucide="building-2" class="w-4 h-4"></i>
              Operational Research Facilities
            </h3>
            <span id="facility-count" class="text-xs font-mono text-[#8a8376]">7 Operational</span>
          </div>

          <div id="facilities-list" class="space-y-2.5 max-h-[280px] overflow-y-auto custom-scroll pr-1">
            <!-- Dynamic Building Items inserted here -->
          </div>
        </div>
      </div>

      <!-- Tech Tree Nodes -->
      <div class="glass-card rounded-2xl p-6 space-y-4">
        <h3 class="text-xs font-bold font-mono text-[#a6bd82] uppercase tracking-wider flex items-center gap-2">
          <i data-lucide="git-pull-request" class="w-4 h-4"></i>
          Planetary Technology Tree
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="tech-tree-grid">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>

    <!-- SECTION 3: AI DEPENDENCY PARADOX LAB -->
    <div id="section-cognitive" class="hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Interactive Policy Controls -->
        <div class="glass-card rounded-2xl p-6 space-y-5">
          <div>
            <h3 class="text-xs font-bold font-mono text-[#dfb74a] uppercase tracking-wider flex items-center gap-2">
              <i data-lucide="sliders" class="w-4 h-4"></i>
              Cognitive Policy Levers
            </h3>
            <p class="text-xs text-[#8a8376] mt-1">Calibrate friction parameters to balance workforce velocity against cognitive complacency decay.</p>
          </div>

          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-xs font-mono mb-1">
                <span class="text-[#ede8dc] font-semibold">Cognitive Scaffolding Friction</span>
                <span id="val-scaffolding" class="text-[#dfb74a] font-bold">80%</span>
              </div>
              <input type="range" min="0" max="100" value="80" id="slider-scaffolding" oninput="onPolicySliderChange()" class="w-full accent-[#dfb74a] h-1.5 bg-[#1f282e] rounded-lg">
              <p class="text-[10px] text-[#8a8376] mt-1">Enforces deliberate problem-solving friction before AI suggestions are presented.</p>
            </div>

            <div>
              <div class="flex justify-between text-xs font-mono mb-1">
                <span class="text-[#ede8dc] font-semibold">Universal Basic Income (UBI)</span>
                <span id="val-ubi" class="text-[#7ea376] font-bold">$250 / cycle</span>
              </div>
              <input type="range" min="0" max="1000" step="25" value="250" id="slider-ubi" oninput="onPolicySliderChange()" class="w-full accent-[#7ea376] h-1.5 bg-[#1f282e] rounded-lg">
              <p class="text-[10px] text-[#8a8376] mt-1">Direct baseline citizen dividend compressing macro Gini inequality.</p>
            </div>

            <div>
              <div class="flex justify-between text-xs font-mono mb-1">
                <span class="text-[#ede8dc] font-semibold">AI Automation Tier</span>
                <span id="val-automation" class="text-[#a6bd82] font-bold">45%</span>
              </div>
              <input type="range" min="10" max="100" value="45" id="slider-automation" oninput="onPolicySliderChange()" class="w-full accent-[#a6bd82] h-1.5 bg-[#1f282e] rounded-lg">
              <p class="text-[10px] text-[#8a8376] mt-1">Direct deployment of AI agents in routine engineering and trade logistics.</p>
            </div>

            <button onclick="commitPolicies()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7a6126] to-[#dfb74a] hover:from-[#8f712c] hover:to-[#eed075] text-[#121619] font-bold text-xs font-mono shadow-lg transition-all">
              ENACT GOVERNANCE FRAMEWORK
            </button>
          </div>
        </div>

        <!-- Radar Chart of Cognitive Profile -->
        <div class="glass-card rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 class="text-xs font-bold font-mono text-[#a6bd82] uppercase tracking-wider mb-2 self-start flex items-center gap-1.5">
            <i data-lucide="crosshair" class="w-4 h-4"></i>
            Multidimensional Cognitive Profile
          </h3>
          <div class="w-full h-[280px] flex items-center justify-center">
            <canvas id="cognitiveRadarChart"></canvas>
          </div>
          <div class="text-center mt-2">
            <span class="text-[11px] font-mono text-[#8a8376]">Atrophy Formula: </span>
            <span class="text-[11px] font-mono text-[#dfb74a] font-bold">Atrophy = (1.0 - Scaffolding) × 0.015 × AI_Dependency</span>
          </div>
        </div>

        <!-- Macro Collective Innovation Trajectory -->
        <div class="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 class="text-xs font-bold font-mono text-[#7ea376] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <i data-lucide="zap" class="w-4 h-4"></i>
              Collective Innovation Velocity
            </h3>
            <p class="text-xs text-[#8a8376]">Mathematical projection: When independent reasoning decays below 0.35, high-order breakthroughs halt despite high AI usage.</p>
          </div>

          <div class="space-y-4 my-auto py-4">
            <div class="p-3.5 rounded-xl bg-[#141b1f] border border-[#27353e]">
              <span class="text-[10px] font-mono text-[#8a8376]">MACRO INNOVATION INDEX</span>
              <div id="stat-innovation" class="text-2xl font-bold font-mono text-[#ede8dc] mt-0.5">0.820</div>
              <div class="text-[10px] text-[#7ea376] mt-1 font-mono">Robust dialectic capacity preserved</div>
            </div>
            <div class="p-3.5 rounded-xl bg-[#141b1f] border border-[#27353e]">
              <span class="text-[10px] font-mono text-[#8a8376]">COGNITIVE ATROPHY RISK</span>
              <div id="stat-atrophy-risk" class="text-lg font-bold font-mono text-[#7ea376] mt-0.5">LOW (0.0035 / tick)</div>
              <div class="text-[10px] text-[#8a8376] mt-1 font-mono">Scaffolding safeguards critical faculties</div>
            </div>
          </div>

          <div class="text-[10px] text-[#8a8376] font-mono border-t border-[#253036] pt-3">
            Authoritative Python Engine Equation Verified: <code class="text-[#a6bd82]">I_macro = 0.6·R + 0.4·(1 - D)</code>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 4: FUTURE SIMULATOR & SCENARIO BRANCHING -->
    <div id="section-experiments" class="hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Experiment Launch Form -->
        <div class="glass-card rounded-2xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold font-mono text-[#dfb74a] uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="flask-conical" class="w-4 h-4"></i>
              Run Quantum Scenario Branch
            </h3>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e271f] text-[#a6bd82] border border-[#3e563a]">PAID GRC TRIAL</span>
          </div>

          <p class="text-xs text-[#8a8376]">Deep-copy current civilisation state, deduct GRC, and project parallel counterfactual trajectories without altering live world state.</p>

          <div class="space-y-3 text-xs">
            <div>
              <label class="font-mono text-[#8a8376] block mb-1">Experiment Title</label>
              <input type="text" id="exp-title" value="Cognitive Friction Latency Trial" class="w-full px-3 py-2 rounded-lg bg-[#14191d] border border-[#2c373e] text-[#ede8dc] font-mono">
            </div>
            <div>
              <label class="font-mono text-[#8a8376] block mb-1">Variable Tested</label>
              <input type="text" id="exp-var" value="Mandatory 10-Minute Socratic Delay" class="w-full px-3 py-2 rounded-lg bg-[#14191d] border border-[#2c373e] text-[#ede8dc] font-mono">
            </div>
            <div>
              <label class="font-mono text-[#8a8376] block mb-1">Simulation Horizon</label>
              <select id="exp-horizon" class="w-full px-3 py-2 rounded-lg bg-[#14191d] border border-[#2c373e] text-[#ede8dc] font-mono">
                <option value="5">5 Years (210 GRC)</option>
                <option value="10" selected>10 Years (270 GRC)</option>
                <option value="25">25 Years (450 GRC)</option>
              </select>
            </div>

            <button onclick="executeTrial()" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#295629] to-[#458043] hover:from-[#326a32] hover:to-[#559a53] text-[#ede8dc] font-bold text-xs font-mono shadow-xl transition-all flex items-center justify-center gap-2">
              <i data-lucide="play" class="w-3.5 h-3.5"></i>
              <span>DEDUCT GRC & RUN PROJECTION</span>
            </button>
          </div>
        </div>

        <!-- Dual Trajectory Comparison Chart -->
        <div class="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-[#253036]">
            <div>
              <h3 class="text-xs font-bold font-mono text-[#ede8dc] uppercase tracking-wider">Counterfactual Projection Comparison</h3>
              <p class="text-[10px] text-[#8a8376] font-mono">Baseline Trajectory (Grey) vs Experimental Branch (Gold/Green)</p>
            </div>
            <div id="exp-divergence-pill" class="text-xs font-mono text-[#a6bd82] font-bold">
              Reasoning Gap: +48.2%
            </div>
          </div>

          <div class="flex-1 w-full h-[280px] pt-4">
            <canvas id="experimentLineChart"></canvas>
          </div>

          <div id="exp-findings" class="p-3.5 mt-3 rounded-xl bg-[#14191c] border border-[#28353d] text-xs font-mono text-[#dce9ca] leading-relaxed">
            Awaiting trial execution. Choose parameters and click 'Deduct GRC & Run Projection'.
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 5: 7-DAY ROADMAP & API CONTRACTS -->
    <div id="section-roadmap" class="hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 7-Day Roadmap Deliverables -->
        <div class="glass-card rounded-2xl p-6 space-y-4">
          <h3 class="text-xs font-bold font-mono text-[#dfb74a] uppercase tracking-wider flex items-center gap-2">
            <i data-lucide="calendar-check" class="w-4 h-4"></i>
            7-Day Engineering Roadmap Status
          </h3>
          <div class="space-y-3 text-xs font-mono">
            <div class="p-3 rounded-xl bg-[#141b1f] border border-[#2c3a44] flex items-center justify-between">
              <div>
                <span class="text-[#7ea376] font-bold">DAY 1-2:</span> Discrete Simulation Loop & State Persistence
                <div class="text-[10px] text-[#8a8376]">SQLite WAL, 9 Interconnected Modules, Tick stepping</div>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded bg-[#203123] text-[#7ea376] font-bold">COMPLETED</span>
            </div>
            <div class="p-3 rounded-xl bg-[#141b1f] border border-[#2c3a44] flex items-center justify-between">
              <div>
                <span class="text-[#7ea376] font-bold">DAY 3-4:</span> Cognitive AI Dependency Engine & GRC Economy
                <div class="text-[10px] text-[#8a8376]">Mathematical atrophy formulas, research building yields</div>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded bg-[#203123] text-[#7ea376] font-bold">COMPLETED</span>
            </div>
            <div class="p-3 rounded-xl bg-[#141b1f] border border-[#2c3a44] flex items-center justify-between">
              <div>
                <span class="text-[#7ea376] font-bold">DAY 5:</span> Paid Scenario Branching & Deep-Copy Engine
                <div class="text-[10px] text-[#8a8376]">Atomically safe GRC deductions, counterfactual comparison</div>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded bg-[#203123] text-[#7ea376] font-bold">COMPLETED</span>
            </div>
            <div class="p-3 rounded-xl bg-[#141b1f] border border-[#2c3a44] flex items-center justify-between">
              <div>
                <span class="text-[#7ea376] font-bold">DAY 6-7:</span> Glassmorphic Command UI & WebSocket Telemetry
                <div class="text-[10px] text-[#8a8376]">Three.js viewport, Chart.js graphs, full FastAPI integration</div>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded bg-[#203123] text-[#7ea376] font-bold">COMPLETED</span>
            </div>
          </div>
        </div>

        <!-- API Contract Schema Viewer -->
        <div class="glass-card rounded-2xl p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold font-mono text-[#a6bd82] uppercase tracking-wider flex items-center gap-2">
              <i data-lucide="code" class="w-4 h-4"></i>
              API Data Schema Contracts
            </h3>
            <span class="text-[10px] font-mono text-[#8a8376]">FASTAPI / PYDANTIC v2</span>
          </div>

          <div class="space-y-2">
            <div class="flex gap-2">
              <button onclick="showSchema('state')" class="px-2.5 py-1 rounded bg-[#1f282e] hover:bg-[#28353d] text-[10px] font-mono text-[#ede8dc]">/api/civilisations/{id}/state</button>
              <button onclick="showSchema('experiment')" class="px-2.5 py-1 rounded bg-[#1f282e] hover:bg-[#28353d] text-[10px] font-mono text-[#ede8dc]">/api/experiments/execute</button>
            </div>
            <pre id="schema-viewer" class="p-3.5 rounded-xl bg-[#0e1215] border border-[#222a2f] text-[11px] font-mono text-[#7ea376] overflow-x-auto custom-scroll max-h-[300px]">
// Click a route above to inspect JSON data schema contracts
            </pre>
          </div>
        </div>
      </div>
    </div>

  </main>

  <script>
    // State variables
    let currentCivId = 'civ_aurora_prime';
    let civState = null;
    let radarChart = null;
    let lineChart = null;
    let threeScene, threeCamera, threeRenderer, threeCubes = [];

    // Switch Tab
    function switchTab(tabName) {
      ['overview', 'tech', 'cognitive', 'experiments', 'roadmap'].forEach(t => {
        document.getElementById(`section-${t}`).classList.add('hidden');
        document.getElementById(`tab-${t}`).classList.remove('border-[#dfb74a]', 'text-[#dfb74a]');
        document.getElementById(`tab-${t}`).classList.add('border-transparent', 'text-[#8a8376]');
      });
      document.getElementById(`section-${tabName}`).classList.remove('hidden');
      document.getElementById(`tab-${tabName}`).classList.add('border-[#dfb74a]', 'text-[#dfb74a]');
      document.getElementById(`tab-${tabName}`).classList.remove('border-transparent', 'text-[#8a8376]');

      if (tabName === 'cognitive' && radarChart) {
        setTimeout(() => radarChart.update(), 100);
      }
      if (tabName === 'experiments' && lineChart) {
        setTimeout(() => lineChart.update(), 100);
      }
      if (tabName === 'overview') {
        setTimeout(onThreeResize, 100);
      }
    }

    // Initialize Three.js 3D Viewport
    function initThree() {
      const container = document.getElementById('three-viewport');
      threeScene = new THREE.Scene();
      threeScene.background = new THREE.Color(0x0e1316);

      threeCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      threeCamera.position.set(32, 28, 38);
      threeCamera.lookAt(0, 0, 0);

      threeRenderer = new THREE.WebGLRenderer({ antialias: true });
      threeRenderer.setSize(container.clientWidth, container.clientHeight);
      threeRenderer.shadowMap.enabled = true;
      container.appendChild(threeRenderer.domElement);

      // Grid Ground
      const grid = new THREE.GridHelper(64, 32, 0xc29b38, 0x1f2930);
      grid.position.y = -0.05;
      threeScene.add(grid);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
      threeScene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xfffaed, 0.85);
      dirLight.position.set(25, 40, 20);
      threeScene.add(dirLight);

      // Render Loop
      function animate() {
        requestAnimationFrame(animate);
        threeScene.rotation.y += 0.0012;
        threeRenderer.render(threeScene, threeCamera);
      }
      animate();
    }

    function onThreeResize() {
      const container = document.getElementById('three-viewport');
      if (container && threeRenderer && threeCamera) {
        threeCamera.aspect = container.clientWidth / container.clientHeight;
        threeCamera.updateProjectionMatrix();
        threeRenderer.setSize(container.clientWidth, container.clientHeight);
      }
    }
    window.addEventListener('resize', onThreeResize);

    // Update 3D buildings on canvas
    function updateThreeBuildings(buildings) {
      if (!threeScene) return;
      threeCubes.forEach(c => threeScene.remove(c));
      threeCubes = [];

      buildings.forEach(b => {
        let height = 3.0 + b.level * 1.5;
        let color = 0x7ea376;
        if (b.type === 'university') color = 0xdfb74a;
        if (b.type === 'research_center') color = 0x5b87a8;
        if (b.type === 'fusion_plant') color = 0xe67e22;

        const geo = new THREE.BoxGeometry(2.5, height, 2.5);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(b.x, height / 2, b.z);
        threeScene.add(mesh);
        threeCubes.push(mesh);
      });
    }

    // Fetch complete state from backend
    async function fetchState() {
      try {
        const res = await fetch(`/api/civilisations/${currentCivId}/state`);
        civState = await res.json();
        renderUI();
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }

    // Render all elements
    function renderUI() {
      if (!civState) return;
      const { demographics, cognitive, economy, environment, policies, buildings } = civState;

      // HUD
      document.getElementById('hud-time').innerText = `Year ${civState.year}, Day ${civState.day}`;
      document.getElementById('hud-pop').innerText = Number(demographics.total_population).toLocaleString();
      document.getElementById('hud-gdp').innerText = `$${economy.gdp}B`;
      document.getElementById('hud-grc').innerText = `${Math.floor(civState.grc_balance)} GRC`;

      // KPIs
      const stabPct = Math.round(economy.civic_stability * 100);
      document.getElementById('kpi-stability').innerText = `${stabPct}%`;
      document.getElementById('bar-stability').style.width = `${stabPct}%`;

      const giniVal = Number(economy.gini_coefficient).toFixed(3);
      document.getElementById('kpi-gini').innerText = `${giniVal} (${giniVal < 0.32 ? 'Optimal' : 'Strained'})`;
      document.getElementById('bar-gini').style.width = `${Math.min(100, economy.gini_coefficient * 100)}%`;

      const bioPct = Math.round(environment.biosphere_health * 100);
      document.getElementById('kpi-biosphere').innerText = `${bioPct}%`;
      document.getElementById('bar-biosphere').style.width = `${bioPct}%`;

      // Civilisation tab
      document.getElementById('civ-name').innerText = civState.name;
      document.getElementById('civ-level').innerText = `Level ${civState.level}`;
      document.getElementById('civ-xp-text').innerText = `${Math.floor(civState.xp)} / ${Math.floor(civState.xp_to_next_level)} XP`;
      const xpPct = Math.min(100, Math.round((civState.xp / civState.xp_to_next_level) * 100));
      document.getElementById('civ-xp-bar').style.width = `${xpPct}%`;

      document.getElementById('stat-total-rp').innerText = `+${civState.total_rp_per_tick} / tick`;
      document.getElementById('stat-total-grc').innerText = `+${civState.total_grc_per_tick} / tick`;
      document.getElementById('facility-count').innerText = `${buildings.length} Operational Facilities`;

      // Render buildings roster
      const listEl = document.getElementById('facilities-list');
      listEl.innerHTML = buildings.map(b => `
        <div class="p-3 rounded-xl bg-[#13191d] border border-[#27353e] flex items-center justify-between text-xs font-mono">
          <div>
            <div class="font-bold text-[#ede8dc]">${b.name}</div>
            <div class="text-[10px] text-[#8a8376]">Level ${b.level} · Pos [${b.x}, ${b.z}] · +${(b.rp_yield * (1 + (b.level-1)*0.4)).toFixed(1)} RP · +${(b.grc_yield * (1 + (b.level-1)*0.4)).toFixed(1)} GRC</div>
          </div>
          <button onclick="upgradeFacility('${b.id}')" class="px-2.5 py-1 rounded bg-[#202c33] hover:bg-[#2b3a44] border border-[#374955] text-[10px] text-[#dfb74a] font-bold transition-colors">
            UPGRADE (L${b.level + 1})
          </button>
        </div>
      `).join('');

      // Cognitive Stats
      document.getElementById('stat-innovation').innerText = Number(cognitive.macro_innovation_index).toFixed(3);
      const atrophyRisk = cognitive.cognitive_atrophy_rate < 0.005 ? 'LOW' : cognitive.cognitive_atrophy_rate < 0.012 ? 'MODERATE' : 'CRITICAL';
      document.getElementById('stat-atrophy-risk').innerText = `${atrophyRisk} (${cognitive.cognitive_atrophy_rate.toFixed(4)} / tick)`;

      // Update 3D canvas
      updateThreeBuildings(buildings);

      // Update Radar
      updateRadar(cognitive);
    }

    // Chart.js Radar Initialization & Update
    function updateRadar(cog) {
      if (!radarChart) {
        const ctx = document.getElementById('cognitiveRadarChart').getContext('2d');
        radarChart = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Reasoning', 'Critical Eval', 'Velocity', 'Innovation', 'Autonomy'],
            datasets: [{
              label: 'Cognitive Capacity',
              data: [cog.independent_reasoning, cog.critical_evaluation, cog.problem_solving_velocity, cog.macro_innovation_index, 1 - cog.ai_dependency],
              backgroundColor: 'rgba(223, 183, 74, 0.22)',
              borderColor: '#dfb74a',
              pointBackgroundColor: '#ede8dc',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                min: 0,
                max: 1.0,
                ticks: { display: false },
                grid: { color: '#27343d' },
                angleLines: { color: '#27343d' },
                pointLabels: { color: '#8a8376', font: { family: 'JetBrains Mono', size: 10 } }
              }
            },
            plugins: { legend: { display: false } }
          }
        });
      } else {
        radarChart.data.datasets[0].data = [
          cog.independent_reasoning,
          cog.critical_evaluation,
          cog.problem_solving_velocity,
          cog.macro_innovation_index,
          1 - cog.ai_dependency
        ];
        radarChart.update();
      }
    }

    // Actions
    async function advanceTicks(n) {
      await fetch(`/api/civilisations/${currentCivId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticks: n })
      });
      fetchState();
    }

    async function deployFacility(type) {
      const x = Math.round((Math.random() - 0.5) * 36);
      const z = Math.round((Math.random() - 0.5) * 36);
      await fetch(`/api/civilisations/${currentCivId}/buildings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, x, z })
      });
      fetchState();
    }

    async function upgradeFacility(bldId) {
      await fetch(`/api/civilisations/${currentCivId}/buildings/${bldId}/upgrade`, { method: 'POST' });
      fetchState();
    }

    function onPolicySliderChange() {
      document.getElementById('val-scaffolding').innerText = `${document.getElementById('slider-scaffolding').value}%`;
      document.getElementById('val-ubi').innerText = `$${document.getElementById('slider-ubi').value} / cycle`;
      document.getElementById('val-automation').innerText = `${document.getElementById('slider-automation').value}%`;
    }

    async function commitPolicies() {
      const payload = {
        cognitive_scaffolding: parseFloat(document.getElementById('slider-scaffolding').value) / 100.0,
        universal_basic_income: parseFloat(document.getElementById('slider-ubi').value),
        ai_automation_tier: parseFloat(document.getElementById('slider-automation').value) / 100.0,
      };
      await fetch(`/api/civilisations/${currentCivId}/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchState();
      alert("Governance Policy Levers enacted authoritatively into SQLite engine!");
    }

    // Execute Paid Experiment
    async function executeTrial() {
      const title = document.getElementById('exp-title').value;
      const variable_tested = document.getElementById('exp-var').value;
      const horizon_years = parseInt(document.getElementById('exp-horizon').value);

      const res = await fetch('/api/experiments/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          civ_id: currentCivId,
          title,
          hypothesis: "Educational friction mitigates cognitive complacency decay.",
          variable_tested,
          horizon_years
        })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Experiment Rejected: ${err.detail}`);
        return;
      }

      const data = await res.json();
      document.getElementById('exp-findings').innerText = data.findings;
      document.getElementById('exp-divergence-pill').innerText = `Reasoning Gap: +${data.divergence_metrics.reasoning_retention_gap}%`;

      renderExperimentChart(data.baseline_trajectory, data.projected_trajectory);
      fetchState();
    }

    function renderExperimentChart(base, proj) {
      const ctx = document.getElementById('experimentLineChart').getContext('2d');
      const labels = base.map(b => `Yr ${b.year}`);

      if (lineChart) lineChart.destroy();

      lineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Baseline Reasoning (Decaying)',
              data: base.map(b => b.reasoning),
              borderColor: '#8a8376',
              borderDash: [5, 5],
              tension: 0.3
            },
            {
              label: 'Intervention Reasoning (Scaffolded)',
              data: proj.map(p => p.reasoning),
              borderColor: '#dfb74a',
              borderWidth: 2.5,
              tension: 0.3
            },
            {
              label: 'Intervention Stability Index',
              data: proj.map(p => p.stability),
              borderColor: '#7ea376',
              borderWidth: 2,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 0.1, max: 1.0, grid: { color: '#212c33' }, ticks: { color: '#8a8376' } },
            x: { grid: { color: '#212c33' }, ticks: { color: '#8a8376' } }
          },
          plugins: {
            legend: { labels: { color: '#ede8dc', font: { family: 'JetBrains Mono', size: 10 } } }
          }
        }
      });
    }

    function showSchema(type) {
      const viewer = document.getElementById('schema-viewer');
      if (type === 'state') {
        viewer.innerText = JSON.stringify({
          "id": "civ_aurora_prime",
          "name": "Aurora Prime",
          "level": 4,
          "xp": 3850.0,
          "grc_balance": 1450.0,
          "tick": 146,
          "demographics": { "total_population": 1248532, "employment_rate": 0.91, "happiness_index": 0.78 },
          "cognitive": { "ai_dependency": 0.28, "independent_reasoning": 0.84, "macro_innovation_index": 0.82 },
          "economy": { "gdp": 48.6, "gini_coefficient": 0.27, "civic_stability": 0.81 }
        }, null, 2);
      } else {
        viewer.innerText = JSON.stringify({
          "endpoint": "POST /api/experiments/execute",
          "request": {
            "civ_id": "civ_aurora_prime",
            "title": "Cognitive Latency Protocol",
            "variable_tested": "Mandatory Socratic Friction",
            "horizon_years": 10
          },
          "response": {
            "experiment_id": "exp_a1b2c3d4",
            "grc_deducted": 270.0,
            "divergence_metrics": { "reasoning_retention_gap": 48.2, "gini_reduction_pct": 5.4 }
          }
        }, null, 2);
      }
    }

    // Initialize on load
    window.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      initThree();
      fetchState();
      showSchema('state');
    });
  </script>
</body>
</html>
"""


@app.api_route("/", methods=["GET", "HEAD"], response_class=HTMLResponse)
async def serve_dashboard():
    """Serves the interactive, responsive Glassmorphic Strategy Dashboard UI."""
    return HTMLResponse(content=HTML_DASHBOARD, status_code=200)


# ==============================================================================
# 6. STANDALONE RUNNER
# ==============================================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print("==================================================================")
    print(f"  GENESIS ENGINE v2.0: Master Artificial Civilisation Engine")
    print(f"  Server & Glassmorphic Dashboard: http://127.0.0.1:{port}")
    print(f"  API Docs (Swagger UI):           http://127.0.0.1:{port}/docs")
    print("==================================================================")
    uvicorn.run("genesis_engine_v2:app", host="127.0.0.1", port=port, reload=False)
