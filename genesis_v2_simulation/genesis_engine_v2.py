#!/usr/bin/env python3
"""
================================================================================
GENESIS Engine v2.0: Master Artificial Civilisation Engine & Policy Platform
================================================================================

Comprehensive Autonomous Simulation Architecture:
- Python 3.10+ / FastAPI / Pydantic v2 / SQLite (WAL mode)
- 9 Interconnected Simulation Engines
- Cognitive Science Core: Mathematical Modeling of the AI Dependency Paradox
- Micro-Simulation & Citizen Agent Cohorts with Live Sentiment Thought Bubbles
- Emergent Crisis Management System with Branching Decision Mechanics
- Interactive 4-Era Visual Technology Tree with RP Progression
- Time-Series Multi-Metric Telemetry Analytics
- Paid Experiment Scenario Branching via Genesis Research Credits (GRC)
- Immersive Three.js 3D Viewport: Procedural Sci-Fi Buildings, Day/Night Cycle,
  Flying Drones, 3D Click-to-Place Grid, Camera Presets, Heatmap Overlays
- Synthesized Web Audio API Sci-Fi Soundscape (Ambient drone, UI, build, eureka, siren)
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

        CREATE TABLE IF NOT EXISTS metric_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            civ_id TEXT NOT NULL,
            tick INTEGER NOT NULL,
            year INTEGER NOT NULL,
            day INTEGER NOT NULL,
            population INTEGER NOT NULL,
            gdp REAL NOT NULL,
            energy REAL NOT NULL,
            happiness REAL NOT NULL,
            cognitive_retention REAL NOT NULL,
            ai_dependency REAL NOT NULL,
            gini REAL NOT NULL,
            recorded_at TEXT NOT NULL,
            FOREIGN KEY (civ_id) REFERENCES civilisations (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS citizen_cohorts (
            id TEXT PRIMARY KEY,
            civ_id TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            size INTEGER NOT NULL,
            reasoning_retention REAL NOT NULL,
            ai_dependency REAL NOT NULL,
            happiness REAL NOT NULL,
            sentiment TEXT NOT NULL,
            thought_bubble TEXT NOT NULL,
            FOREIGN KEY (civ_id) REFERENCES civilisations (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS crises (
            id TEXT PRIMARY KEY,
            civ_id TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            options_json TEXT NOT NULL,
            resolved_choice TEXT,
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

            # 7. Seed Key Facilities
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

    # Ensure cohorts are populated
    cohort_check = conn.execute("SELECT COUNT(*) as c FROM citizen_cohorts WHERE civ_id = 'civ_aurora_prime'").fetchone()
    if cohort_check["c"] == 0:
        seed_cohorts = [
            ("cohort_thinkers", "civ_aurora_prime", "Neural Epistemologists & Philosophers", "Research & Ethics", 184000, 0.94, 0.16, 0.86, "Optimistic", "Dialectic friction protocols keep our critical faculties rigorously razor-sharp."),
            ("cohort_operators", "civ_aurora_prime", "Synthetic Fleet & Grid Operators", "Automation & Industry", 420000, 0.68, 0.74, 0.81, "Content", "Automated neural copilots handle routine subroutines so we maintain higher throughput."),
            ("cohort_engineers", "civ_aurora_prime", "Quantum Bio-Architects", "Infrastructure & Energy", 310000, 0.89, 0.38, 0.89, "Confident", "Helios fusion containment is harmonic; renewable outputs exceed current municipal demand."),
            ("cohort_traditionalists", "civ_aurora_prime", "Humanist Artisans & Heritage Union", "Culture & Governance", 334532, 0.86, 0.11, 0.74, "Vigilant", "We monitor educational curricula closely to ensure children develop unassisted deduction.")
        ]
        with conn:
            conn.executemany("""
            INSERT OR IGNORE INTO citizen_cohorts (id, civ_id, name, role, size, reasoning_retention, ai_dependency, happiness, sentiment, thought_bubble)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, seed_cohorts)

    # Ensure an active crisis exists for interactive management
    active_crisis = conn.execute("SELECT id FROM crises WHERE civ_id = 'civ_aurora_prime' AND status = 'active'").fetchone()
    if not active_crisis:
        crisis_id = f"crisis_{uuid.uuid4().hex[:8]}"
        crisis_options = [
            {
                "id": "choice_socratic_surge",
                "label": "Deploy Socratic Scaffolding Surge",
                "description": "Mandate high-friction dialectic challenges across all educational and municipal AI interfaces.",
                "cost_grc": 150.0,
                "cost_materials": 100.0,
                "reasoning_delta": 0.12,
                "happiness_delta": 0.04,
                "stability_delta": 0.06,
                "ai_delta": -0.08
            },
            {
                "id": "choice_accelerate_ai",
                "label": "Accelerate Unfettered Autonomous AI",
                "description": "Remove cognitive friction barriers to maximize immediate computational GDP velocity.",
                "cost_grc": 0.0,
                "cost_materials": 0.0,
                "reasoning_delta": -0.14,
                "happiness_delta": -0.05,
                "stability_delta": -0.04,
                "ai_delta": 0.15
            },
            {
                "id": "choice_humanist_subsidy",
                "label": "Subsidize Humanist Epistemology Chairs",
                "description": "Fund independent philosophical institutes and artisan apprenticeships across all districts.",
                "cost_grc": 80.0,
                "cost_materials": 150.0,
                "reasoning_delta": 0.08,
                "happiness_delta": 0.09,
                "stability_delta": 0.05,
                "ai_delta": -0.03
            }
        ]
        with conn:
            conn.execute("""
            INSERT OR IGNORE INTO crises (id, civ_id, title, category, description, severity, status, options_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
            """, (
                crisis_id,
                "civ_aurora_prime",
                "Cognitive Drift Cascade in Secondary Academy Cohorts",
                "Cognitive Health",
                "Longitudinal neuro-scans indicate a 28% drop in unassisted critical deduction after widespread uncurated LLM adoption.",
                "severe",
                json.dumps(crisis_options),
                datetime.now(timezone.utc).isoformat()
            ))

    # Seed initial metric history if empty
    hist_check = conn.execute("SELECT COUNT(*) as c FROM metric_history WHERE civ_id = 'civ_aurora_prime'").fetchone()
    if hist_check["c"] == 0:
        with conn:
            conn.execute("""
            INSERT INTO metric_history (civ_id, tick, year, day, population, gdp, energy, happiness, cognitive_retention, ai_dependency, gini, recorded_at)
            VALUES (?, 146, 12, 146, 1248532, 48.6, 9800.0, 0.78, 0.84, 0.28, 0.27, ?)
            """, ("civ_aurora_prime", datetime.now(timezone.utc).isoformat()))

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


class CrisisResolutionRequest(BaseModel):
    choice_id: str


class TechResearchRequest(BaseModel):
    tech_id: str


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
# 3. 4-ERA TECHNOLOGY TREE CATALOG & BLUEPRINTS
# ==============================================================================

TECH_CATALOG = [
    # Era 1: Silicon Automation
    {
        "id": "foundational_agriculture",
        "name": "Foundational Hydroponics",
        "era": 1,
        "category": "Bio-Synthesis",
        "rp_cost": 250,
        "grc_reward": 150,
        "prereqs": [],
        "desc": "Closed-loop aeroponics increasing baseline food security and municipal biological resilience."
    },
    {
        "id": "grid_electrification",
        "name": "Magnetohydrodynamic Grid",
        "era": 1,
        "category": "Energy",
        "rp_cost": 400,
        "grc_reward": 200,
        "prereqs": [],
        "desc": "Lossless plasma power distribution grid reducing transmission overhead to 0.4%."
    },
    {
        "id": "automated_logistics",
        "name": "Autonomous Drone Skyways",
        "era": 1,
        "category": "Infrastructure",
        "rp_cost": 550,
        "grc_reward": 220,
        "prereqs": ["grid_electrification"],
        "desc": "Coordinated low-altitude transport corridors optimizing inter-district resource routing."
    },
    # Era 2: Cognitive Augmentation
    {
        "id": "scaffolding_frameworks",
        "name": "Cognitive Socratic Protocols",
        "era": 2,
        "category": "Cognition",
        "rp_cost": 900,
        "grc_reward": 350,
        "prereqs": ["automated_logistics"],
        "desc": "Mandates human-in-the-loop dialectic friction to safeguard independent deductive reasoning."
    },
    {
        "id": "dialectic_copilots",
        "name": "Dialectic AI Pairing",
        "era": 2,
        "category": "Cognition",
        "rp_cost": 1200,
        "grc_reward": 400,
        "prereqs": ["scaffolding_frameworks"],
        "desc": "Transforms passive answering engines into challenging intellectual sparring partners."
    },
    {
        "id": "fusion_ignition",
        "name": "Stellarator Clean Fusion",
        "era": 2,
        "category": "Energy",
        "rp_cost": 1600,
        "grc_reward": 500,
        "prereqs": ["grid_electrification"],
        "desc": "Self-sustaining magnetic confinement fusion supplying boundless non-polluting energy."
    },
    # Era 3: Quantum Transcendence
    {
        "id": "quantum_computation",
        "name": "Cryogenic Quantum AI Array",
        "era": 3,
        "category": "Cognition",
        "rp_cost": 2100,
        "grc_reward": 600,
        "prereqs": ["dialectic_copilots"],
        "desc": "Sub-atomic reasoning accelerators capable of real-time planetary climate forecasting."
    },
    {
        "id": "subspace_mesh",
        "name": "Subspace Telemetry Mesh",
        "era": 3,
        "category": "Research",
        "rp_cost": 2600,
        "grc_reward": 700,
        "prereqs": ["quantum_computation"],
        "desc": "Superluminal sensor arrays enabling deep counterfactual scenario branching."
    },
    {
        "id": "arcology_synthesis",
        "name": "Self-Repairing Nanomaterials",
        "era": 3,
        "category": "Infrastructure",
        "rp_cost": 3200,
        "grc_reward": 800,
        "prereqs": ["fusion_ignition"],
        "desc": "Molecular matrix architecture enabling colossal 100-story residential arcologies."
    },
    # Era 4: Post-Singularity Synthesis
    {
        "id": "neural_symbiosis",
        "name": "Synaptic Bridge Mesh",
        "era": 4,
        "category": "Cognition",
        "rp_cost": 4200,
        "grc_reward": 1000,
        "prereqs": ["subspace_mesh"],
        "desc": "Non-invasive neural telemetry linking collective human intuition directly to quantum arrays."
    },
    {
        "id": "dyson_swarm",
        "name": "Orbital Solar Concentrator",
        "era": 4,
        "category": "Energy",
        "rp_cost": 5400,
        "grc_reward": 1250,
        "prereqs": ["arcology_synthesis"],
        "desc": "Constellation of orbital mirrors beaming limitless solar microwave flux directly to ground nodes."
    },
    {
        "id": "post_scarcity_fabrication",
        "name": "Universal Molecular Nanofoundry",
        "era": 4,
        "category": "Industry",
        "rp_cost": 6800,
        "grc_reward": 1600,
        "prereqs": ["neural_symbiosis", "dyson_swarm"],
        "desc": "Atomic-level matter reconfiguration permanently driving the planetary Gini coefficient down."
    }
]


BUILDING_BLUEPRINTS = {
    "residential_spire": {
        "name": "Arcology Spire Complex",
        "category": "Demographics",
        "rp_yield": 0.0,
        "grc_yield": 0.0,
        "cost_materials": 250.0,
        "cost_energy": 20.0,
        "maintenance": 15.0,
        "desc": "Colossal tiered arcology housing 25,000 citizens with integrated vertical gardens."
    },
    "university": {
        "name": "Imperial Polytechnic Academy",
        "category": "Education",
        "rp_yield": 50.0,
        "grc_yield": 5.0,
        "cost_materials": 450.0,
        "cost_energy": 30.0,
        "maintenance": 25.0,
        "desc": "Twin-spire academic institute training philosophers and mathematical researchers."
    },
    "research_center": {
        "name": "Quantum Synthesis Lab",
        "category": "Research",
        "rp_yield": 85.0,
        "grc_yield": 8.0,
        "cost_materials": 600.0,
        "cost_energy": 45.0,
        "maintenance": 35.0,
        "desc": "Pulsating quantum array generating massive Research Points and GRC yields per tick."
    },
    "bio_dome": {
        "name": "Agri-Biosphere Delta",
        "category": "Agriculture",
        "rp_yield": 10.0,
        "grc_yield": 1.0,
        "cost_materials": 300.0,
        "cost_energy": 15.0,
        "maintenance": 12.0,
        "desc": "Geodesic glass biome producing synthetic nutrients and atmospheric purification."
    },
    "fusion_plant": {
        "name": "Helios Fusion Complex",
        "category": "Energy",
        "rp_yield": 15.0,
        "grc_yield": 2.0,
        "cost_materials": 750.0,
        "cost_energy": -250.0, # net positive energy
        "maintenance": 40.0,
        "desc": "Tokamak magnetic confinement generator delivering 300MW of zero-carbon power."
    },
    "quantum_observatory": {
        "name": "Subspace Telemetry Observatory",
        "category": "Science",
        "rp_yield": 70.0,
        "grc_yield": 6.5,
        "cost_materials": 500.0,
        "cost_energy": 35.0,
        "maintenance": 28.0,
        "desc": "Parabolic orbital tracker mapping cosmic anomalies and branching horizons."
    }
}


# ==============================================================================
# 4. SIMULATION ENGINE: MATHEMATICAL DYNAMICS & COHORTS
# ==============================================================================

class GenesisSimulationEngine:
    """Orchestrates 9 simulation engines with agent-based micro-simulation dynamics."""

    @staticmethod
    def step_civilisation(civ_id: str, ticks: int = 1) -> Dict[str, Any]:
        conn = get_db()
        civ = dict(conn.execute("SELECT * FROM civilisations WHERE id = ?", (civ_id,)).fetchone())
        demo = dict(conn.execute("SELECT * FROM demographics WHERE civ_id = ?", (civ_id,)).fetchone())
        cog = dict(conn.execute("SELECT * FROM cognitive_profiles WHERE civ_id = ?", (civ_id,)).fetchone())
        econ = dict(conn.execute("SELECT * FROM economy_resources WHERE civ_id = ?", (civ_id,)).fetchone())
        env = dict(conn.execute("SELECT * FROM environment_metrics WHERE civ_id = ?", (civ_id,)).fetchone())
        pol = dict(conn.execute("SELECT * FROM policies WHERE civ_id = ?", (civ_id,)).fetchone())
        buildings = [dict(b) for b in conn.execute("SELECT * FROM buildings WHERE civ_id = ? AND status = 'active'", (civ_id,)).fetchall()]
        cohorts = [dict(c) for c in conn.execute("SELECT * FROM citizen_cohorts WHERE civ_id = ?", (civ_id,)).fetchall()]

        # Yields from research facilities
        total_rp_rate = sum(b["rp_yield"] * (1.0 + (b["level"] - 1) * 0.4) for b in buildings)
        total_grc_rate = sum(b["grc_yield"] * (1.0 + (b["level"] - 1) * 0.4) for b in buildings)
        total_maintenance = sum(b["maintenance_cost"] * b["level"] for b in buildings)

        for _ in range(ticks):
            civ["tick"] += 1
            civ["day"] += 1
            if civ["day"] > 365:
                civ["day"] = 1
                civ["year"] += 1

            # ------------------------------------------------------------------
            # 1. Cognitive Science: The AI Dependency Paradox
            # ------------------------------------------------------------------
            ai_dep = min(1.0, cog["ai_dependency"] + (pol["ai_automation_tier"] * 0.007))
            cog["ai_dependency"] = round(ai_dep, 4)

            # Problem-solving velocity accelerates with AI assistance
            vel = min(1.0, 0.45 + (cog["ai_dependency"] * 0.50))
            cog["problem_solving_velocity"] = round(vel, 4)

            # Core Atrophy Equation:
            # Atrophy = (1.0 - scaffolding) * 0.015 * ai_dependency
            scaffolding = pol["cognitive_scaffolding"]
            atrophy = (1.0 - scaffolding) * 0.015 * cog["ai_dependency"]
            cog["cognitive_atrophy_rate"] = round(atrophy, 5)

            # Independent Reasoning decays unless buffered by educational scaffolding & subsidies
            reasoning = max(0.12, cog["independent_reasoning"] - atrophy + (pol["education_subsidy"] * 0.004))
            cog["independent_reasoning"] = round(reasoning, 4)

            # Critical Evaluation
            crit = max(0.12, cog["critical_evaluation"] - (atrophy * 0.85) + (pol["education_subsidy"] * 0.003))
            cog["critical_evaluation"] = round(crit, 4)

            # Macro Collective Innovation Index
            macro_inn = (0.55 * cog["independent_reasoning"] + 0.35 * (1.0 - cog["ai_dependency"]) + demo["education_index"] * 0.20)
            cog["macro_innovation_index"] = round(min(1.0, max(0.10, macro_inn)), 4)

            # ------------------------------------------------------------------
            # 2. Demographics & Cohort Micro-Simulation
            # ------------------------------------------------------------------
            birth_rate = 0.030 * demo["health_index"] * (1.0 - env["pollution_index"] * 0.15)
            death_rate = 0.008 / max(0.1, demo["health_index"]) + (env["pollution_index"] * 0.005)
            migration = (demo["happiness_index"] - 0.50) * 0.018

            annual_growth = (birth_rate - death_rate + migration)
            pop_delta = int(demo["total_population"] * (annual_growth / 365.0))
            demo["total_population"] = max(1000, demo["total_population"] + pop_delta)

            # Update cohorts dynamically
            for ch in cohorts:
                if ch["id"] == "cohort_thinkers":
                    ch["reasoning_retention"] = round(min(0.99, max(0.20, cog["independent_reasoning"] * 1.12)), 2)
                    ch["ai_dependency"] = round(max(0.05, cog["ai_dependency"] * 0.60), 2)
                    if scaffolding > 0.70:
                        ch["sentiment"] = "Exhilarated"
                        ch["thought_bubble"] = f"Dialectic friction protocols (scaffolding: {int(scaffolding*100)}%) preserve our critical reasoning against automated drift."
                    else:
                        ch["sentiment"] = "Distressed"
                        ch["thought_bubble"] = "Without strict scaffolding friction, student analytical capabilities are noticeably degrading."
                elif ch["id"] == "cohort_operators":
                    ch["reasoning_retention"] = round(min(0.99, max(0.20, cog["independent_reasoning"] * 0.85)), 2)
                    ch["ai_dependency"] = round(min(0.98, cog["ai_dependency"] * 1.35), 2)
                    ch["sentiment"] = "Optimized"
                    ch["thought_bubble"] = f"AI Automation Tier at {int(pol['ai_automation_tier']*100)}% delivers maximum municipal yield; routine tasks are completely effortless."
                elif ch["id"] == "cohort_engineers":
                    ch["reasoning_retention"] = round(min(0.99, max(0.20, cog["independent_reasoning"] * 1.05)), 2)
                    ch["ai_dependency"] = round(cog["ai_dependency"], 2)
                    ch["sentiment"] = "Stable"
                    ch["thought_bubble"] = f"Grid energy balances at {econ['energy']:.0f} MW; quantum telemetry links are synchronized."
                elif ch["id"] == "cohort_traditionalists":
                    ch["reasoning_retention"] = round(min(0.99, max(0.20, cog["independent_reasoning"] * 1.02)), 2)
                    ch["ai_dependency"] = round(max(0.02, cog["ai_dependency"] * 0.40), 2)
                    if cog["ai_dependency"] > 0.50:
                        ch["sentiment"] = "Protesting"
                        ch["thought_bubble"] = "Deep synthetic dependence threatens the humanist heritage of Aurora Prime!"
                    else:
                        ch["sentiment"] = "Harmonious"
                        ch["thought_bubble"] = "Our culture continues to thrive alongside purposeful, constrained technology."

            # Happiness dynamic
            demo["happiness_index"] = round(min(1.0, max(0.1, (
                0.35 * demo["employment_rate"] +
                0.25 * (pol["universal_basic_income"] / 1000.0) +
                0.20 * env["biosphere_health"] +
                0.20 * (1.0 - econ["gini_coefficient"])
            ))), 3)

            # ------------------------------------------------------------------
            # 3. Economy & Resources
            # ------------------------------------------------------------------
            gdp_drift = (0.025 + 0.035 * cog["problem_solving_velocity"] + 0.025 * cog["macro_innovation_index"] - pol["carbon_tax_rate"] * 0.01)
            econ["gdp_growth_rate"] = round(gdp_drift, 4)
            econ["gdp"] = round(econ["gdp"] * (1.0 + (gdp_drift / 365.0)), 3)

            gini = 0.22 + (0.24 * pol["ai_automation_tier"]) - ((pol["universal_basic_income"] / 1000.0) * 0.16) - (pol["carbon_tax_rate"] * 0.06)
            econ["gini_coefficient"] = round(min(0.65, max(0.18, gini)), 3)

            stability = 1.0 - ((econ["gini_coefficient"] - 0.22) * 1.3) + (demo["happiness_index"] * 0.25) - (env["pollution_index"] * 0.20)
            econ["civic_stability"] = round(min(0.99, max(0.10, stability)), 3)

            # Robust resource growth balances
            mat_prod = (econ["materials_rate"] * 0.25) * (1.0 + pol["ai_automation_tier"] * 0.5)
            mat_cons = (total_maintenance * 0.02)
            econ["materials"] = round(max(0.0, min(50000.0, econ["materials"] + mat_prod - mat_cons)), 1)

            energy_prod = (econ["energy_rate"] * 0.30) * (1.0 + env["clean_energy_ratio"] * 0.4)
            energy_cons = (total_maintenance * 0.03)
            econ["energy"] = round(max(0.0, min(50000.0, econ["energy"] + energy_prod - energy_cons)), 1)

            econ["food"] = round(max(0.0, min(50000.0, econ["food"] + (econ["food_rate"] * 0.15))), 1)
            econ["water"] = round(max(0.0, min(50000.0, econ["water"] + (econ["water_rate"] * 0.15))), 1)

            # ------------------------------------------------------------------
            # 4. GRC Treasury & Research Points
            # ------------------------------------------------------------------
            civ["research_points"] = round(civ["research_points"] + (total_rp_rate * 0.1), 1)
            civ["grc_balance"] = round(civ["grc_balance"] + (total_grc_rate * 0.05), 2)

            xp_gain = 2.5 + (total_rp_rate * 0.05) + (demo["total_population"] / 500000.0)
            civ["xp"] += round(xp_gain, 1)
            if civ["xp"] >= civ["xp_to_next_level"]:
                civ["level"] += 1
                civ["xp"] -= civ["xp_to_next_level"]
                civ["xp_to_next_level"] = round(civ["xp_to_next_level"] * 1.45, 1)
                civ["grc_balance"] += 250.0  # Milestone GRC grant

            # ------------------------------------------------------------------
            # 5. Biosphere & Environment
            # ------------------------------------------------------------------
            raw_emissions = max(10.0, (econ["gdp"] * 4.5) - (pol["carbon_tax_rate"] * 120.0))
            env["carbon_emissions"] = round(raw_emissions, 1)
            env["pollution_index"] = round(min(1.0, max(0.05, raw_emissions / 1200.0)), 3)
            env["biosphere_health"] = round(min(1.0, max(0.10, 1.0 - env["pollution_index"] + (env["clean_energy_ratio"] * 0.15))), 3)

        now = datetime.now(timezone.utc).isoformat()
        civ["updated_at"] = now

        # Persist state back to SQLite
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

            for ch in cohorts:
                conn.execute("""
                UPDATE citizen_cohorts SET
                    reasoning_retention=?, ai_dependency=?, happiness=?, sentiment=?, thought_bubble=?
                WHERE id=?
                """, (
                    ch["reasoning_retention"], ch["ai_dependency"], ch["happiness"], ch["sentiment"], ch["thought_bubble"], ch["id"]
                ))

            # Record telemetry point in history
            conn.execute("""
            INSERT INTO metric_history (civ_id, tick, year, day, population, gdp, energy, happiness, cognitive_retention, ai_dependency, gini, recorded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                civ_id, civ["tick"], civ["year"], civ["day"], demo["total_population"], econ["gdp"],
                econ["energy"], demo["happiness_index"], cog["independent_reasoning"], cog["ai_dependency"],
                econ["gini_coefficient"], now
            ))

            # Keep telemetry history bounded to recent 200 records
            conn.execute("""
            DELETE FROM metric_history WHERE civ_id = ? AND id NOT IN (
                SELECT id FROM metric_history WHERE civ_id = ? ORDER BY id DESC LIMIT 200
            )
            """, (civ_id, civ_id))

        conn.close()

        return {
            "civ": civ,
            "demo": demo,
            "cog": cog,
            "econ": econ,
            "env": env,
            "pol": pol,
            "cohorts": cohorts,
            "total_rp_rate": total_rp_rate,
            "total_grc_rate": total_grc_rate,
        }


# ==============================================================================
# 5. FASTAPI APPLICATION SERVER & REST ENDPOINTS
# ==============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_default_civilisation_if_missing()
    yield

app = FastAPI(
    title="GENESIS Engine v2.0 - Master Artificial Civilisation Engine",
    description="Decoupled discrete simulation loop, AI Dependency Paradox modeling, interactive 3D command center, and paid experiment branching.",
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
# REST API Endpoints
# ------------------------------------------------------------------------------

@app.get("/api/civilisations/{id}/state", response_model=CivilisationStateResponse)
async def get_civilisation_state(id: str):
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
    result = GenesisSimulationEngine.step_civilisation(id, ticks=req.ticks)
    await manager.broadcast(id, {
        "event": "tick_update",
        "tick": result["civ"]["tick"],
        "year": result["civ"]["year"],
        "day": result["civ"]["day"],
        "grc_balance": result["civ"]["grc_balance"],
        "research_points": result["civ"]["research_points"],
        "gdp": result["econ"]["gdp"],
        "population": result["demo"]["total_population"],
        "reasoning": result["cog"]["independent_reasoning"],
        "ai_dependency": result["cog"]["ai_dependency"],
    })
    return {
        "success": True,
        "message": f"Civilisation advanced by {req.ticks} tick(s).",
        "current_state": await get_civilisation_state(id)
    }


@app.get("/api/civilisations/{id}/citizens/cohorts")
async def get_citizen_cohorts(id: str):
    conn = get_db()
    cohorts = [dict(c) for c in conn.execute("SELECT * FROM citizen_cohorts WHERE civ_id = ?", (id,)).fetchall()]
    conn.close()
    return {"civ_id": id, "cohorts": cohorts}


@app.get("/api/civilisations/{id}/crises")
async def get_crises(id: str):
    conn = get_db()
    crises = [dict(c) for c in conn.execute("SELECT * FROM crises WHERE civ_id = ? ORDER BY id DESC", (id,)).fetchall()]
    conn.close()
    for c in crises:
        c["options"] = json.loads(c["options_json"])
    return {"civ_id": id, "crises": crises}


@app.post("/api/civilisations/{id}/crises/{crisis_id}/resolve")
async def resolve_crisis(id: str, crisis_id: str, req: CrisisResolutionRequest):
    conn = get_db()
    crisis = conn.execute("SELECT * FROM crises WHERE id = ? AND civ_id = ?", (crisis_id, id)).fetchone()
    if not crisis:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crisis not found")
    if crisis["status"] == "resolved":
        conn.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Crisis is already resolved")

    options = json.loads(crisis["options_json"])
    selected_opt = next((o for o in options if o["id"] == req.choice_id), None)
    if not selected_opt:
        conn.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Option '{req.choice_id}' invalid")

    civ = conn.execute("SELECT grc_balance FROM civilisations WHERE id = ?", (id,)).fetchone()
    econ = conn.execute("SELECT materials, civic_stability FROM economy_resources WHERE civ_id = ?", (id,)).fetchone()
    cog = conn.execute("SELECT independent_reasoning, ai_dependency FROM cognitive_profiles WHERE civ_id = ?", (id,)).fetchone()
    demo = conn.execute("SELECT happiness_index FROM demographics WHERE civ_id = ?", (id,)).fetchone()

    # Enforce credit constraint
    if selected_opt["cost_grc"] > civ["grc_balance"]:
        conn.close()
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=f"Insufficient GRC balance: {civ['grc_balance']} available, {selected_opt['cost_grc']} required.")

    new_grc = civ["grc_balance"] - selected_opt["cost_grc"]
    new_mat = max(0.0, econ["materials"] - selected_opt["cost_materials"])
    new_reasoning = min(1.0, max(0.1, cog["independent_reasoning"] + selected_opt["reasoning_delta"]))
    new_ai = min(1.0, max(0.05, cog["ai_dependency"] + selected_opt["ai_delta"]))
    new_hap = min(1.0, max(0.1, demo["happiness_index"] + selected_opt["happiness_delta"]))
    new_stab = min(1.0, max(0.1, econ["civic_stability"] + selected_opt["stability_delta"]))

    with conn:
        conn.execute("UPDATE civilisations SET grc_balance = ? WHERE id = ?", (new_grc, id))
        conn.execute("UPDATE economy_resources SET materials = ?, civic_stability = ? WHERE civ_id = ?", (new_mat, new_stab, id))
        conn.execute("UPDATE cognitive_profiles SET independent_reasoning = ?, ai_dependency = ? WHERE civ_id = ?", (new_reasoning, new_ai, id))
        conn.execute("UPDATE demographics SET happiness_index = ? WHERE civ_id = ?", (new_hap, id))
        conn.execute("UPDATE crises SET status = 'resolved', resolved_choice = ? WHERE id = ?", (req.choice_id, crisis_id))

    conn.close()

    return {
        "success": True,
        "message": f"Crisis successfully resolved via '{selected_opt['label']}'",
        "applied_option": selected_opt,
        "new_state": await get_civilisation_state(id)
    }


@app.get("/api/civilisations/{id}/technologies")
async def get_technologies(id: str):
    conn = get_db()
    civ = conn.execute("SELECT unlocked_techs, research_points FROM civilisations WHERE id = ?", (id,)).fetchone()
    conn.close()
    unlocked = set(json.loads(civ["unlocked_techs"] or "[]"))

    techs_out = []
    for t in TECH_CATALOG:
        t_copy = dict(t)
        t_copy["is_unlocked"] = t["id"] in unlocked
        t_copy["can_afford"] = civ["research_points"] >= t["rp_cost"]
        t_copy["prereqs_met"] = all(p in unlocked for p in t["prereqs"])
        techs_out.append(t_copy)

    return {
        "civ_id": id,
        "research_points": civ["research_points"],
        "unlocked_count": len(unlocked),
        "total_count": len(TECH_CATALOG),
        "technologies": techs_out
    }


@app.post("/api/civilisations/{id}/technologies/research")
async def research_technology(id: str, req: TechResearchRequest):
    conn = get_db()
    civ = conn.execute("SELECT * FROM civilisations WHERE id = ?", (id,)).fetchone()
    if not civ:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Civilisation not found")

    tech = next((t for t in TECH_CATALOG if t["id"] == req.tech_id), None)
    if not tech:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Technology '{req.tech_id}' not found")

    unlocked = json.loads(civ["unlocked_techs"] or "[]")
    if req.tech_id in unlocked:
        conn.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Technology '{tech['name']}' already researched")

    # Check prerequisites
    if not all(p in unlocked for p in tech["prereqs"]):
        conn.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prerequisites not satisfied")

    # Check RP
    if civ["research_points"] < tech["rp_cost"]:
        conn.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient Research Points: {civ['research_points']} available, {tech['rp_cost']} required.")

    new_rp = civ["research_points"] - tech["rp_cost"]
    new_grc = civ["grc_balance"] + tech["grc_reward"]
    unlocked.append(req.tech_id)

    with conn:
        conn.execute("""
        UPDATE civilisations SET research_points = ?, grc_balance = ?, unlocked_techs = ? WHERE id = ?
        """, (new_rp, new_grc, json.dumps(unlocked), id))

    conn.close()

    return {
        "success": True,
        "message": f"Successfully researched: {tech['name']}. Awarded +{tech['grc_reward']} GRC!",
        "tech": tech,
        "research_points_remaining": new_rp,
        "grc_balance": new_grc
    }


@app.get("/api/civilisations/{id}/metrics/history")
async def get_metrics_history(id: str, limit: int = 50):
    conn = get_db()
    rows = conn.execute("""
    SELECT tick, year, day, population, gdp, energy, happiness, cognitive_retention, ai_dependency, gini
    FROM metric_history WHERE civ_id = ? ORDER BY id DESC LIMIT ?
    """, (id, limit)).fetchall()
    conn.close()
    return {"civ_id": id, "history": [dict(r) for r in reversed(rows)]}


@app.get("/api/civilisations/{id}/buildings")
async def get_civilisation_buildings(id: str):
    conn = get_db()
    buildings = conn.execute("SELECT * FROM buildings WHERE civ_id = ?", (id,)).fetchall()
    conn.close()
    return {"civ_id": id, "buildings": [dict(b) for b in buildings]}


@app.post("/api/civilisations/{id}/buildings", status_code=status.HTTP_201_CREATED)
async def construct_building(id: str, req: BuildingConstructRequest):
    blueprint = BUILDING_BLUEPRINTS.get(req.type)
    if not blueprint:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown building type '{req.type}'.")

    conn = get_db()
    econ = conn.execute("SELECT materials, energy FROM economy_resources WHERE civ_id = ?", (id,)).fetchone()
    if not econ:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Civilisation not found")

    if econ["materials"] < blueprint["cost_materials"]:
        conn.close()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient materials. Required: {blueprint['cost_materials']}, Available: {econ['materials']}")

    bld_id = f"bld_{uuid.uuid4().hex[:8]}"
    bld_name = req.name or blueprint["name"]

    with conn:
        conn.execute("""
        INSERT INTO buildings (id, civ_id, name, type, level, x, y, z, rp_yield, grc_yield, maintenance_cost, status)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 'active')
        """, (
            bld_id, id, bld_name, req.type, req.x, req.y, req.z,
            blueprint["rp_yield"], blueprint["grc_yield"], blueprint["maintenance"]
        ))
        conn.execute("""
        UPDATE economy_resources SET materials = materials - ? WHERE civ_id = ?
        """, (blueprint["cost_materials"], id))

    conn.close()

    return {
        "success": True,
        "building": {
            "id": bld_id,
            "civ_id": id,
            "name": bld_name,
            "type": req.type,
            "level": 1,
            "x": req.x,
            "y": req.y,
            "z": req.z,
            "rp_yield": blueprint["rp_yield"],
            "grc_yield": blueprint["grc_yield"],
            "maintenance_cost": blueprint["maintenance"]
        }
    }


@app.post("/api/civilisations/{id}/policies")
async def update_policies(id: str, req: PolicyUpdateRequest):
    conn = get_db()
    current = conn.execute("SELECT * FROM policies WHERE civ_id = ?", (id,)).fetchone()
    if not current:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy record not found")

    upd = dict(current)
    if req.cognitive_scaffolding is not None:
        upd["cognitive_scaffolding"] = req.cognitive_scaffolding
    if req.universal_basic_income is not None:
        upd["universal_basic_income"] = req.universal_basic_income
    if req.ai_automation_tier is not None:
        upd["ai_automation_tier"] = req.ai_automation_tier
    if req.carbon_tax_rate is not None:
        upd["carbon_tax_rate"] = req.carbon_tax_rate
    if req.education_subsidy is not None:
        upd["education_subsidy"] = req.education_subsidy

    with conn:
        conn.execute("""
        UPDATE policies SET
            cognitive_scaffolding = ?, universal_basic_income = ?, ai_automation_tier = ?,
            carbon_tax_rate = ?, education_subsidy = ?
        WHERE civ_id = ?
        """, (
            upd["cognitive_scaffolding"], upd["universal_basic_income"], upd["ai_automation_tier"],
            upd["carbon_tax_rate"], upd["education_subsidy"], id
        ))
    conn.close()

    return {"success": True, "policies": upd}


@app.post("/api/experiments/execute")
async def execute_experiment(req: ExperimentExecuteRequest):
    """Paid counterfactual experiment branching. Deducts GRC atomically."""
    grc_cost = 150.0 + (req.horizon_years * 12.0)

    conn = get_db()
    civ = conn.execute("SELECT grc_balance FROM civilisations WHERE id = ?", (req.civ_id,)).fetchone()
    if not civ:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Civilisation not found")

    if civ["grc_balance"] < grc_cost:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient Genesis Research Credits (GRC). Required: {grc_cost} GRC, Available: {civ['grc_balance']} GRC"
        )

    # Snapshot current state
    base_cog = dict(conn.execute("SELECT * FROM cognitive_profiles WHERE civ_id = ?", (req.civ_id,)).fetchone())
    base_econ = dict(conn.execute("SELECT * FROM economy_resources WHERE civ_id = ?", (req.civ_id,)).fetchone())
    base_pol = dict(conn.execute("SELECT * FROM policies WHERE civ_id = ?", (req.civ_id,)).fetchone())

    # Calculate baseline projection vs counterfactual policy branch
    baseline_traj = []
    projected_traj = []

    b_reasoning = base_cog["independent_reasoning"]
    p_reasoning = base_cog["independent_reasoning"]
    b_gini = base_econ["gini_coefficient"]
    p_gini = base_econ["gini_coefficient"]

    overrides = req.policy_overrides or {}
    scaffolding_p = overrides.get("cognitive_scaffolding", base_pol["cognitive_scaffolding"])
    ai_tier_p = overrides.get("ai_automation_tier", base_pol["ai_automation_tier"])
    ubi_p = overrides.get("universal_basic_income", base_pol["universal_basic_income"])

    for y in range(req.horizon_years + 1):
        year_num = y
        # Baseline
        b_atrophy = (1.0 - base_pol["cognitive_scaffolding"]) * 0.015 * base_cog["ai_dependency"] * (y * 4)
        b_reason = max(0.15, b_reasoning - b_atrophy)
        b_g = min(0.65, b_gini + (base_pol["ai_automation_tier"] * 0.012 * y))
        baseline_traj.append({"year": year_num, "reasoning": round(b_reason, 3), "gini": round(b_g, 3)})

        # Projected Counterfactual
        p_atrophy = (1.0 - scaffolding_p) * 0.015 * (base_cog["ai_dependency"] + ai_tier_p * 0.1) * (y * 4)
        p_reason = max(0.15, p_reasoning - p_atrophy + (0.01 * y if scaffolding_p > 0.7 else 0))
        p_g = min(0.65, max(0.18, p_gini + (ai_tier_p * 0.012 * y) - ((ubi_p / 1000.0) * 0.02 * y)))
        projected_traj.append({"year": year_num, "reasoning": round(p_reason, 3), "gini": round(p_g, 3)})

    exp_id = f"exp_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    divergence = {
        "reasoning_retention_gap": round(projected_traj[-1]["reasoning"] - baseline_traj[-1]["reasoning"], 3),
        "inequality_delta": round(projected_traj[-1]["gini"] - baseline_traj[-1]["gini"], 3)
    }

    findings = (
        f"Counterfactual simulation over {req.horizon_years} solar cycles demonstrates that "
        f"scaffolding friction ({scaffolding_p:.2f}) retained {divergence['reasoning_retention_gap']:+.1%} human reasoning "
        f"while UBI ({ubi_p:.0f}) shifted final inequality by {divergence['inequality_delta']:+.3f} Gini index."
    )

    with conn:
        # Atomic deduction
        conn.execute("UPDATE civilisations SET grc_balance = grc_balance - ? WHERE id = ?", (grc_cost, req.civ_id))
        conn.execute("""
        INSERT INTO experiments (
            id, civ_id, title, hypothesis, variable_tested, grc_cost, horizon_years,
            baseline_trajectory, projected_trajectory, divergence_metrics, findings, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            exp_id, req.civ_id, req.title, req.hypothesis, req.variable_tested, grc_cost, req.horizon_years,
            json.dumps(baseline_traj), json.dumps(projected_traj), json.dumps(divergence), findings, now
        ))

    conn.close()

    return {
        "experiment_id": exp_id,
        "title": req.title,
        "grc_deducted": grc_cost,
        "horizon_years": req.horizon_years,
        "baseline_trajectory": baseline_traj,
        "projected_trajectory": projected_traj,
        "divergence": divergence,
        "findings": findings
    }


@app.websocket("/ws/telemetry/{civ_id}")
async def websocket_telemetry(websocket: WebSocket, civ_id: str):
    await manager.connect(civ_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            cmd = json.loads(data)
            if cmd.get("action") == "advance":
                ticks = int(cmd.get("ticks", 1))
                GenesisSimulationEngine.step_civilisation(civ_id, ticks)
                res = await get_civilisation_state(civ_id)
                await websocket.send_text(res.model_dump_json())
    except WebSocketDisconnect:
        manager.disconnect(civ_id, websocket)


# ==============================================================================
# 6. IMMERSIVE GLASSMORPHIC COMMAND CENTER (Three.js WebGL & Web Audio Synth)
# ==============================================================================

HTML_DASHBOARD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GENESIS Engine v2.0 | Artificial Civilisation Command Center</title>
  <!-- Tailwind CSS & Lucide Icons -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- Three.js & OrbitControls -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
    body { font-family: 'Space Grotesk', sans-serif; background-color: #030712; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .glass {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .glass-glow {
      box-shadow: 0 0 30px -5px rgba(6, 182, 212, 0.15);
    }
    .neon-border {
      border: 1px solid rgba(6, 182, 212, 0.35);
    }
    .pulse-amber {
      animation: pulseAlert 2s infinite ease-in-out;
    }
    @keyframes pulseAlert {
      0%, 100% { border-color: rgba(245, 158, 11, 0.4); box-shadow: 0 0 15px rgba(245, 158, 11, 0.2); }
      50% { border-color: rgba(245, 158, 11, 0.85); box-shadow: 0 0 30px rgba(245, 158, 11, 0.5); }
    }
  </style>
</head>
<body class="text-slate-100 min-h-screen flex flex-col bg-slate-950 selection:bg-cyan-500 selection:text-black">

  <!-- TOP HUD BAR -->
  <header class="glass sticky top-0 z-50 px-6 py-3 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
        <i data-lucide="orbit" class="w-6 h-6 text-white animate-spin" style="animation-duration: 20s;"></i>
      </div>
      <div>
        <div class="flex items-center space-x-2">
          <span class="font-bold text-lg tracking-wider bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">GENESIS ENGINE</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">v2.0 MASTER</span>
        </div>
        <div class="text-xs text-slate-400 flex items-center space-x-2">
          <span id="hudCivName" class="text-slate-200 font-semibold">Aurora Prime</span>
          <span>•</span>
          <span class="mono text-cyan-300">Level <span id="hudLevel">4</span></span>
          <span>•</span>
          <span class="mono">Year <span id="hudYear">12</span>, Day <span id="hudDay">146</span></span>
        </div>
      </div>
    </div>

    <!-- Live Metrics Pills -->
    <div class="flex items-center space-x-3 text-xs mono">
      <!-- GRC Treasury -->
      <div class="glass px-3 py-1.5 rounded-lg flex items-center space-x-2 border-emerald-500/30 text-emerald-400">
        <i data-lucide="coins" class="w-4 h-4 text-emerald-400"></i>
        <span>GRC: <strong id="hudGrc" class="text-slate-100">1,450.0</strong></span>
        <span class="text-[10px] text-emerald-500/80">(+<span id="hudGrcRate">32.6</span>/t)</span>
      </div>
      <!-- Research Points -->
      <div class="glass px-3 py-1.5 rounded-lg flex items-center space-x-2 border-cyan-500/30 text-cyan-400">
        <i data-lucide="flask-conical" class="w-4 h-4 text-cyan-400"></i>
        <span>RP: <strong id="hudRp" class="text-slate-100">680.0</strong></span>
        <span class="text-[10px] text-cyan-500/80">(+<span id="hudRpRate">329.0</span>/t)</span>
      </div>
      <!-- Population -->
      <div class="glass px-3 py-1.5 rounded-lg flex items-center space-x-2 border-indigo-500/30 text-indigo-400">
        <i data-lucide="users" class="w-4 h-4 text-indigo-400"></i>
        <span>Pop: <strong id="hudPop" class="text-slate-100">1.25M</strong></span>
      </div>
      <!-- GDP -->
      <div class="glass px-3 py-1.5 rounded-lg flex items-center space-x-2 border-blue-500/30 text-blue-400">
        <i data-lucide="trending-up" class="w-4 h-4 text-blue-400"></i>
        <span>GDP: $<strong id="hudGdp" class="text-slate-100">48.6</strong>B</span>
      </div>
      <!-- Energy -->
      <div class="glass px-3 py-1.5 rounded-lg flex items-center space-x-2 border-amber-500/30 text-amber-400">
        <i data-lucide="zap" class="w-4 h-4 text-amber-400"></i>
        <span><strong id="hudEnergy" class="text-slate-100">9.8k</strong> MW</span>
      </div>
    </div>

    <!-- Global Controls -->
    <div class="flex items-center space-x-2">
      <!-- Audio Toggle -->
      <button id="btnToggleAudio" onclick="toggleAudio()" class="p-2 rounded-lg glass hover:bg-slate-800 transition text-slate-300 hover:text-cyan-400" title="Toggle Sci-Fi Synthesizer Audio">
        <i id="iconAudio" data-lucide="volume-2" class="w-4 h-4"></i>
      </button>

      <!-- Day/Night Toggle -->
      <button onclick="toggleDayNight()" class="p-2 rounded-lg glass hover:bg-slate-800 transition text-slate-300 hover:text-amber-400" title="Toggle Day / Night Lighting">
        <i id="iconDayNight" data-lucide="sun" class="w-4 h-4 text-amber-400"></i>
      </button>

      <!-- Advance 1 Tick -->
      <button onclick="advanceTick(1)" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center space-x-1 border border-slate-700 transition">
        <i data-lucide="skip-forward" class="w-3.5 h-3.5 text-cyan-400"></i>
        <span>+1 Tick</span>
      </button>

      <!-- Auto Simulate -->
      <button id="btnAutoSim" onclick="toggleAutoSim()" class="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-cyan-600/30 transition text-black font-bold">
        <i id="iconPlay" data-lucide="play" class="w-3.5 h-3.5"></i>
        <span id="textPlay">Auto-Simulate</span>
      </button>
    </div>
  </header>

  <!-- NAVIGATION TABS -->
  <nav class="glass border-b border-slate-800/80 px-6 py-2 flex items-center space-x-2 overflow-x-auto text-xs font-medium">
    <button onclick="switchTab('tab-3d-world')" class="nav-tab px-4 py-2 rounded-lg flex items-center space-x-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
      <i data-lucide="box" class="w-4 h-4"></i>
      <span>3D City & Construction</span>
    </button>
    <button onclick="switchTab('tab-cognitive')" class="nav-tab px-4 py-2 rounded-lg flex items-center space-x-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60">
      <i data-lucide="brain-circuit" class="w-4 h-4"></i>
      <span>The AI Dependency Paradox</span>
    </button>
    <button onclick="switchTab('tab-cohorts')" class="nav-tab px-4 py-2 rounded-lg flex items-center space-x-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60">
      <i data-lucide="users" class="w-4 h-4"></i>
      <span>Agent Micro-Simulation</span>
    </button>
    <button onclick="switchTab('tab-techtree')" class="nav-tab px-4 py-2 rounded-lg flex items-center space-x-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60">
      <i data-lucide="git-merge" class="w-4 h-4"></i>
      <span>4-Era Technology Tree</span>
    </button>
    <button onclick="switchTab('tab-branching')" class="nav-tab px-4 py-2 rounded-lg flex items-center space-x-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60">
      <i data-lucide="git-branch" class="w-4 h-4"></i>
      <span>Scenario Branching Lab</span>
    </button>
    <button onclick="switchTab('tab-crises')" class="nav-tab px-4 py-2 rounded-lg flex items-center space-x-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60">
      <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400"></i>
      <span>Crisis Management (<span id="tabCrisisCount">1</span>)</span>
    </button>
    <button onclick="switchTab('tab-telemetry')" class="nav-tab px-4 py-2 rounded-lg flex items-center space-x-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60">
      <i data-lucide="line-chart" class="w-4 h-4"></i>
      <span>Historical Telemetry</span>
    </button>
  </nav>

  <!-- ACTIVE CRISIS BANNER (If Active) -->
  <div id="crisisBanner" class="bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-slate-950 border-y border-amber-500/40 px-6 py-2.5 flex items-center justify-between transition-all">
    <div class="flex items-center space-x-3 text-xs">
      <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 flex items-center space-x-1">
        <i data-lucide="siren" class="w-3.5 h-3.5 animate-pulse text-amber-400"></i>
        <span>CRISIS ALERT</span>
      </span>
      <span id="bannerCrisisTitle" class="font-medium text-amber-100">Cognitive Drift Cascade detected in Secondary Academies.</span>
    </div>
    <button onclick="switchTab('tab-crises')" class="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center space-x-1 shadow-lg shadow-amber-500/20">
      <span>Convene Emergency Council</span>
      <i data-lucide="chevron-right" class="w-3 h-3"></i>
    </button>
  </div>

  <!-- MAIN TAB CONTENT AREA -->
  <main class="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

    <!-- ===================================================================== -->
    <!-- TAB 1: 3D CITY & CONSTRUCTION VIEWPORT                                -->
    <!-- ===================================================================== -->
    <div id="tab-3d-world" class="tab-pane space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- 3D Canvas Container (Col 1-3) -->
        <div class="lg:col-span-3 glass rounded-2xl overflow-hidden border border-slate-800 relative flex flex-col" style="height: 560px;">
          <!-- 3D Viewport Controls Overlay -->
          <div class="absolute top-4 left-4 z-20 flex flex-wrap gap-2 text-xs">
            <!-- Camera Preset Selector -->
            <div class="glass px-2.5 py-1.5 rounded-lg flex items-center space-x-2 border-slate-700">
              <i data-lucide="camera" class="w-3.5 h-3.5 text-cyan-400"></i>
              <span class="text-slate-400">Camera:</span>
              <select id="selCamera" onchange="setCameraPreset(this.value)" class="bg-transparent text-slate-200 outline-none cursor-pointer">
                <option value="orbit" class="bg-slate-900">Orbital Overview</option>
                <option value="street" class="bg-slate-900">Cinematic Street</option>
                <option value="satellite" class="bg-slate-900">Tactical Satellite</option>
                <option value="district" class="bg-slate-900">Research District</option>
              </select>
            </div>

            <!-- Heatmap Mode Selector -->
            <div class="glass px-2.5 py-1.5 rounded-lg flex items-center space-x-2 border-slate-700">
              <i data-lucide="layers" class="w-3.5 h-3.5 text-emerald-400"></i>
              <span class="text-slate-400">3D Heatmap:</span>
              <select id="selHeatmap" onchange="setHeatmapMode(this.value)" class="bg-transparent text-slate-200 outline-none cursor-pointer">
                <option value="normal" class="bg-slate-900">Normal Realistic</option>
                <option value="cognitive" class="bg-slate-900">Cognitive Atrophy</option>
                <option value="energy" class="bg-slate-900">Energy Grid Power</option>
                <option value="unrest" class="bg-slate-900">Civic Unrest Risk</option>
              </select>
            </div>

            <!-- Placement Ghost Indicator -->
            <div id="badgePlacement" class="hidden glass px-3 py-1.5 rounded-lg border-cyan-500/50 bg-cyan-950/80 text-cyan-300 font-mono flex items-center space-x-1.5">
              <i data-lucide="hammer" class="w-3.5 h-3.5 text-cyan-400 animate-bounce"></i>
              <span>Click 3D Grid to Construct</span>
              <button onclick="cancelPlacement()" class="ml-2 text-slate-400 hover:text-white">&times;</button>
            </div>
          </div>

          <!-- Time of Day Indicator -->
          <div class="absolute top-4 right-4 z-20 glass px-3 py-1.5 rounded-lg text-xs mono text-slate-300 flex items-center space-x-2 border-slate-700">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400"></i>
            <span id="lblTimeOfDay">14:00 (Daylight)</span>
          </div>

          <!-- WebGL Canvas Target -->
          <div id="threeContainer" class="w-full h-full cursor-grab active:cursor-grabbing"></div>

          <!-- 3D Construction Dock -->
          <div class="glass border-t border-slate-800 p-3 flex items-center justify-between overflow-x-auto gap-3 z-20">
            <div class="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center space-x-1.5">
              <i data-lucide="hard-hat" class="w-4 h-4 text-cyan-400"></i>
              <span>Blueprints Dock:</span>
            </div>
            <div class="flex items-center space-x-2">
              <button onclick="enterPlacementMode('residential_spire')" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs flex items-center space-x-1.5 transition text-slate-200">
                <i data-lucide="building" class="w-3.5 h-3.5 text-blue-400"></i>
                <span>Arcology (250 Mat)</span>
              </button>
              <button onclick="enterPlacementMode('university')" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs flex items-center space-x-1.5 transition text-slate-200">
                <i data-lucide="graduation-cap" class="w-3.5 h-3.5 text-purple-400"></i>
                <span>University (450 Mat)</span>
              </button>
              <button onclick="enterPlacementMode('research_center')" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs flex items-center space-x-1.5 transition text-slate-200">
                <i data-lucide="atom" class="w-3.5 h-3.5 text-cyan-400"></i>
                <span>Quantum Lab (600 Mat)</span>
              </button>
              <button onclick="enterPlacementMode('bio_dome')" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs flex items-center space-x-1.5 transition text-slate-200">
                <i data-lucide="sprout" class="w-3.5 h-3.5 text-emerald-400"></i>
                <span>Bio-Dome (300 Mat)</span>
              </button>
              <button onclick="enterPlacementMode('fusion_plant')" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs flex items-center space-x-1.5 transition text-slate-200">
                <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i>
                <span>Helios Fusion (750 Mat)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Infrastructure & City Stats Sidebar (Col 4) -->
        <div class="glass rounded-2xl p-5 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-sm tracking-wide text-slate-200 uppercase flex items-center space-x-2">
                <i data-lucide="cpu" class="w-4 h-4 text-cyan-400"></i>
                <span>Urban Infrastructure</span>
              </h3>
              <span id="bldCountBadge" class="text-xs mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">7 Active</span>
            </div>

            <!-- Materials & Storage Ledger -->
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center text-slate-400">
                <span>Materials Stock:</span>
                <span class="mono font-semibold text-slate-200"><span id="lblMaterials">6,100</span> / 15,000</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div id="barMaterials" class="bg-cyan-500 h-full rounded-full" style="width: 40%;"></div>
              </div>

              <div class="flex justify-between items-center text-slate-400 pt-1">
                <span>Energy Grid Stability:</span>
                <span class="mono font-semibold text-emerald-400">99.4%</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" style="width: 99%;"></div>
              </div>

              <div class="flex justify-between items-center text-slate-400 pt-1">
                <span>Clean Energy Ratio:</span>
                <span id="lblCleanEnergy" class="mono font-semibold text-slate-200">85%</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div id="barCleanEnergy" class="bg-amber-400 h-full rounded-full" style="width: 85%;"></div>
              </div>
            </div>

            <!-- Active Facilities List -->
            <div class="space-y-2 pt-2">
              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Key Scientific Assets:</div>
              <div id="listKeyFacilities" class="space-y-2 text-xs max-h-56 overflow-y-auto pr-1">
                <!-- Dynamically populated -->
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="pt-3 border-t border-slate-800/80">
            <button onclick="advanceTick(10)" class="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center space-x-1.5 border border-slate-700 transition">
              <i data-lucide="fast-forward" class="w-3.5 h-3.5 text-cyan-400"></i>
              <span>Simulate 10 Solar Days</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 2: THE AI DEPENDENCY PARADOX LABORATORY                            -->
    <!-- ===================================================================== -->
    <div id="tab-cognitive" class="tab-pane hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Interactive Controls (Col 1) -->
        <div class="glass rounded-2xl p-6 border border-slate-800 space-y-5">
          <div>
            <h3 class="font-bold text-base text-slate-100 flex items-center space-x-2">
              <i data-lucide="sliders" class="w-5 h-5 text-cyan-400"></i>
              <span>Cognitive Governance Policies</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">Regulate intellectual scaffolding friction to counter synthetic cognitive decay.</p>
          </div>

          <!-- Policy Slider: Cognitive Scaffolding -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-medium text-slate-300">Cognitive Scaffolding Friction:</span>
              <span id="valScaffolding" class="mono font-bold text-cyan-400">0.80</span>
            </div>
            <input type="range" id="sliderScaffolding" min="0" max="1" step="0.05" value="0.80" oninput="updatePolicyPreview()" class="w-full accent-cyan-500 cursor-pointer">
            <p class="text-[11px] text-slate-500">Injects dialectic challenge into AI interfaces. Prevents atrophy at the cost of short-term velocity.</p>
          </div>

          <!-- Policy Slider: AI Automation Tier -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-medium text-slate-300">AI Automation Adoption Tier:</span>
              <span id="valAutomation" class="mono font-bold text-blue-400">0.45</span>
            </div>
            <input type="range" id="sliderAutomation" min="0" max="1" step="0.05" value="0.45" oninput="updatePolicyPreview()" class="w-full accent-blue-500 cursor-pointer">
            <p class="text-[11px] text-slate-500">Expands autonomous agent execution. Boosts GDP velocity but accelerates human reliance.</p>
          </div>

          <!-- Policy Slider: UBI Dividend -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-medium text-slate-300">Universal Basic Dividend:</span>
              <span class="mono font-bold text-emerald-400">$<span id="valUbi">250</span>/mo</span>
            </div>
            <input type="range" id="sliderUbi" min="0" max="1500" step="50" value="250" oninput="updatePolicyPreview()" class="w-full accent-emerald-500 cursor-pointer">
            <p class="text-[11px] text-slate-500">Redistributes synthetic capital gains to suppress the Gini inequality index.</p>
          </div>

          <!-- Policy Slider: Education Subsidy -->
          <div class="space-y-2">
            <div class="flex justify-between items-center text-xs">
              <span class="font-medium text-slate-300">Education & Epistemology Subsidy:</span>
              <span id="valEdu" class="mono font-bold text-purple-400">0.35</span>
            </div>
            <input type="range" id="sliderEdu" min="0" max="1" step="0.05" value="0.35" oninput="updatePolicyPreview()" class="w-full accent-purple-500 cursor-pointer">
            <p class="text-[11px] text-slate-500">Directly funds classical human reasoning, logic, and philosophy faculties.</p>
          </div>

          <button onclick="commitPolicies()" class="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs shadow-lg shadow-cyan-600/25 transition">
            Enact Policy Changes
          </button>
        </div>

        <!-- Dynamic 5-Axis Radar Chart (Col 2) -->
        <div class="glass rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-between">
          <div class="w-full flex items-center justify-between">
            <h3 class="font-bold text-sm tracking-wide uppercase text-slate-200 flex items-center space-x-2">
              <i data-lucide="radar" class="w-4 h-4 text-cyan-400"></i>
              <span>Cognitive Architecture Radar</span>
            </h3>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 mono">5 Vectors</span>
          </div>

          <div class="w-full relative flex items-center justify-center my-4" style="height: 320px;">
            <canvas id="radarCognitive"></canvas>
          </div>

          <div class="w-full text-center text-xs text-slate-400 border-t border-slate-800/80 pt-3">
            Mathematical Balance: Atrophy decays Critical Analysis when AI Dependency climbs un-scaffolded.
          </div>
        </div>

        <!-- Mathematical Modeling & Atrophy Core (Col 3) -->
        <div class="glass rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-sm tracking-wide uppercase text-slate-200 flex items-center space-x-2">
              <i data-lucide="variable" class="w-4 h-4 text-indigo-400"></i>
              <span>Differential Atrophy Metrics</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">Real-time evaluations computed directly from simulation laws:</p>
          </div>

          <!-- Formula Box -->
          <div class="glass p-4 rounded-xl border border-cyan-500/30 font-mono text-xs space-y-2 bg-slate-950/80">
            <div class="text-cyan-400 font-bold">Atrophy Formulation:</div>
            <div class="text-slate-300">
              Atrophy = (1.0 - S) &times; 0.015 &times; D
            </div>
            <div class="text-[11px] text-slate-400">
              Where <strong class="text-cyan-300">S</strong> = Scaffolding Friction, <strong class="text-blue-300">D</strong> = AI Dependency.
            </div>
          </div>

          <!-- Live Score Readouts -->
          <div class="space-y-3 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Computed Atrophy Rate:</span>
              <span id="valAtrophyRate" class="mono font-bold text-red-400">0.0035/t</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Independent Reasoning:</span>
              <span id="valReasoning" class="mono font-bold text-cyan-400">84.0%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Critical Evaluation:</span>
              <span id="valCritEval" class="mono font-bold text-blue-400">81.0%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Problem-Solving Velocity:</span>
              <span id="valVelocity" class="mono font-bold text-emerald-400">76.0%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Macro Collective Innovation:</span>
              <span id="valMacroInn" class="mono font-bold text-purple-400">82.0%</span>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-300">
            <strong>Theoretical Insight:</strong> Complete unassisted automation increases velocity initially, but degrades planetary innovation by Year 15 due to foundational critical evaluation loss.
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 3: AGENT-BASED MICRO-SIMULATION & CITIZENS                        -->
    <!-- ===================================================================== -->
    <div id="tab-cohorts" class="tab-pane hidden space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <i data-lucide="users" class="w-5 h-5 text-indigo-400"></i>
            <span>Civilian Cohorts & Agent Micro-Simulation</span>
          </h2>
          <p class="text-xs text-slate-400">Individual demographic segments responding dynamically to technological mandates.</p>
        </div>
        <div class="text-xs mono text-slate-400">
          Total Sample: <strong class="text-slate-200">1,248,532 Citizens</strong>
        </div>
      </div>

      <!-- Cohorts Grid -->
      <div id="cohortsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Dynamically rendered cohort cards -->
      </div>

      <!-- Live Citizen Thought Bubbles Stream -->
      <div class="glass rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 class="font-bold text-sm tracking-wide uppercase text-slate-200 flex items-center space-x-2">
          <i data-lucide="message-square" class="w-4 h-4 text-cyan-400"></i>
          <span>Live Citizen Telemetry Stream</span>
        </h3>
        <div id="thoughtFeed" class="space-y-3 text-xs">
          <!-- Dynamically populated quotes -->
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 4: 4-ERA TECHNOLOGY TREE                                          -->
    <!-- ===================================================================== -->
    <div id="tab-techtree" class="tab-pane hidden space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <i data-lucide="git-merge" class="w-5 h-5 text-cyan-400"></i>
            <span>4-Era Planetary Technology Tree</span>
          </h2>
          <p class="text-xs text-slate-400">Spend Research Points (RP) produced by universities to unlock futuristic faculties and earn GRC.</p>
        </div>
        <div class="flex items-center space-x-3 text-xs mono">
          <div class="glass px-3 py-1.5 rounded-lg border-cyan-500/30">
            Available RP: <strong id="treeRpBalance" class="text-cyan-400">680.0</strong>
          </div>
        </div>
      </div>

      <!-- 4 Era Columns -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <!-- Era 1: Silicon Automation -->
        <div class="space-y-3">
          <div class="glass px-3 py-2 rounded-xl border border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span>Era I: Silicon Dawn</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">1990 - 2030</span>
          </div>
          <div id="era1Nodes" class="space-y-3"></div>
        </div>

        <!-- Era 2: Cognitive Augmentation -->
        <div class="space-y-3">
          <div class="glass px-3 py-2 rounded-xl border border-blue-500/30 text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center justify-between">
            <span>Era II: Cognitive Scaffolding</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400">2030 - 2060</span>
          </div>
          <div id="era2Nodes" class="space-y-3"></div>
        </div>

        <!-- Era 3: Quantum Transcendence -->
        <div class="space-y-3">
          <div class="glass px-3 py-2 rounded-xl border border-cyan-500/30 text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center justify-between">
            <span>Era III: Quantum Supremacy</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400">2060 - 2090</span>
          </div>
          <div id="era3Nodes" class="space-y-3"></div>
        </div>

        <!-- Era 4: Post-Singularity Synthesis -->
        <div class="space-y-3">
          <div class="glass px-3 py-2 rounded-xl border border-purple-500/30 text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center justify-between">
            <span>Era IV: Singularity Synthesis</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-400">2090+</span>
          </div>
          <div id="era4Nodes" class="space-y-3"></div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 5: SCENARIO BRANCHING & PARALLEL WORLD LAB                        -->
    <!-- ===================================================================== -->
    <div id="tab-branching" class="tab-pane hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Configuration Card (Col 1) -->
        <div class="glass rounded-2xl p-6 border border-slate-800 space-y-5">
          <div>
            <h3 class="font-bold text-base text-slate-100 flex items-center space-x-2">
              <i data-lucide="git-branch" class="w-5 h-5 text-emerald-400"></i>
              <span>Paid Experiment Branching</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">Deep-copies authoritative world state at T_current to run counterfactual parallel projections.</p>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-300 mb-1">Experiment Title:</label>
              <input type="text" id="expTitle" value="Mandatory Scaffolding Intervention" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500">
            </div>

            <div>
              <label class="block text-slate-300 mb-1">Test Hypothesis:</label>
              <textarea id="expHypothesis" rows="2" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500">Maintaining scaffolding friction at 0.85 will retain over 80% independent reasoning over a 15-year horizon.</textarea>
            </div>

            <div>
              <label class="block text-slate-300 mb-1">Projection Horizon (Years):</label>
              <input type="range" id="expHorizon" min="5" max="30" step="5" value="15" oninput="updateExpCost()" class="w-full accent-emerald-500 cursor-pointer">
              <div class="flex justify-between text-slate-400 text-[11px] mt-1">
                <span>5 Years</span>
                <span class="mono font-bold text-emerald-400"><span id="lblExpHorizon">15</span> Solar Cycles</span>
                <span>30 Years</span>
              </div>
            </div>

            <!-- GRC Cost Estimate -->
            <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex justify-between items-center">
              <div>
                <div class="text-[11px] text-emerald-400 font-bold uppercase">Estimated Computation Cost:</div>
                <div class="text-[10px] text-slate-400">Strictly deducted from GRC Treasury</div>
              </div>
              <div class="mono font-bold text-emerald-300 text-sm">
                <span id="lblExpCost">330.0</span> GRC
              </div>
            </div>
          </div>

          <button onclick="launchPaidExperiment()" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center space-x-1.5">
            <i data-lucide="play" class="w-4 h-4"></i>
            <span>Deduct GRC & Execute Simulation</span>
          </button>
        </div>

        <!-- Comparative Dual Trajectory Graphs (Col 2-3) -->
        <div class="lg:col-span-2 glass rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-sm tracking-wide uppercase text-slate-200 flex items-center space-x-2">
              <i data-lucide="split" class="w-4 h-4 text-emerald-400"></i>
              <span>Parallel Counterfactual Trajectory Comparison</span>
            </h3>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 mono" id="badgeExpStatus">Baseline Ready</span>
          </div>

          <div class="w-full relative my-4" style="height: 340px;">
            <canvas id="chartBranching"></canvas>
          </div>

          <div id="boxFindings" class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span class="font-bold text-cyan-400">Experiment Findings:</span>
            <span id="textFindings">Launch a scenario projection on the left to review scientific divergence data.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 6: CRISIS MANAGEMENT CENTER                                       -->
    <!-- ===================================================================== -->
    <div id="tab-crises" class="tab-pane hidden space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-400"></i>
            <span>Planetary Crisis Council</span>
          </h2>
          <p class="text-xs text-slate-400">Emergent systemic shocks requiring executive policy intervention and resource allocation.</p>
        </div>
      </div>

      <div id="crisesList" class="space-y-5">
        <!-- Dynamically rendered crisis cards with branching choices -->
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- TAB 7: HISTORICAL TELEMETRY ANALYTICS                                 -->
    <!-- ===================================================================== -->
    <div id="tab-telemetry" class="tab-pane hidden space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <i data-lucide="line-chart" class="w-5 h-5 text-cyan-400"></i>
            <span>Multi-Metric Telemetry History</span>
          </h2>
          <p class="text-xs text-slate-400">Real-time longitudinal metrics sampled continuously across simulation ticks.</p>
        </div>
      </div>

      <div class="glass rounded-2xl p-6 border border-slate-800" style="height: 480px;">
        <canvas id="chartTelemetry"></canvas>
      </div>
    </div>

  </main>

  <!-- JAVASCRIPT LOGIC & SIMULATION DRIVERS -->
  <script>
    // State references
    let currentCiv = null;
    let autoSimInterval = null;
    let audioCtx = null;
    let isAudioMuted = true;
    let isDay = true;
    let radarChart = null;
    let branchChart = null;
    let telemetryChart = null;
    let activePlacementType = null;

    // Three.js State
    let scene, camera, renderer, controls;
    let buildingMeshes = [];
    let droneMeshes = [];
    let starParticles;
    let dirSunLight, hemiLight;
    let gridHelper;
    let ghostMesh = null;
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let groundPlane;

    // --------------------------------------------------------------------------
    // 1. SYNTHESIZED WEB AUDIO API SOUNDSCAPE
    // --------------------------------------------------------------------------
    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
    }

    function toggleAudio() {
      initAudio();
      isAudioMuted = !isAudioMuted;
      const btn = document.getElementById('btnToggleAudio');
      const icon = document.getElementById('iconAudio');
      if (isAudioMuted) {
        icon.setAttribute('data-lucide', 'volume-x');
        btn.classList.remove('text-cyan-400', 'border-cyan-500/50');
      } else {
        icon.setAttribute('data-lucide', 'volume-2');
        btn.classList.add('text-cyan-400', 'border-cyan-500/50');
        playChime(520, 0.1);
      }
      lucide.createIcons();
    }

    function playTone(freq, duration = 0.1, type = 'sine') {
      if (isAudioMuted || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    function playChime(baseFreq = 440, duration = 0.2) {
      playTone(baseFreq, duration, 'triangle');
      setTimeout(() => playTone(baseFreq * 1.25, duration, 'triangle'), 60);
      setTimeout(() => playTone(baseFreq * 1.5, duration * 1.5, 'sine'), 120);
    }

    function playBuildHum() {
      if (isAudioMuted || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(420, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {}
    }

    function playCrisisAlarm() {
      if (isAudioMuted || !audioCtx) return;
      playTone(580, 0.15, 'sawtooth');
      setTimeout(() => playTone(440, 0.2, 'sawtooth'), 180);
    }

    // --------------------------------------------------------------------------
    // 2. THREE.JS 3D CITY INITIALIZATION & PROCEDURAL BUILDINGS
    // --------------------------------------------------------------------------
    function initThreeViewport() {
      const container = document.getElementById('threeContainer');
      const width = container.clientWidth;
      const height = container.clientHeight;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x030712);
      scene.fog = new THREE.FogExp2(0x030712, 0.015);

      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(38, 30, 48);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below ground
      controls.minDistance = 10;
      controls.maxDistance = 150;

      // Lighting
      hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.6);
      scene.add(hemiLight);

      dirSunLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
      dirSunLight.position.set(40, 60, 30);
      dirSunLight.castShadow = true;
      dirSunLight.shadow.mapSize.width = 2048;
      dirSunLight.shadow.mapSize.height = 2048;
      scene.add(dirSunLight);

      // 3D Ground Plane & Grid
      const groundGeo = new THREE.PlaneGeometry(200, 200);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        roughness: 0.85,
        metalness: 0.2
      });
      groundPlane = new THREE.Mesh(groundGeo, groundMat);
      groundPlane.rotation.x = -Math.PI / 2;
      groundPlane.receiveShadow = true;
      scene.add(groundPlane);

      gridHelper = new THREE.GridHelper(120, 30, 0x06b6d4, 0x1e293b);
      gridHelper.position.y = 0.02;
      scene.add(gridHelper);

      // Starfield Particle Field
      const starGeo = new THREE.BufferGeometry();
      const starCoords = [];
      for (let i = 0; i < 1500; i++) {
        starCoords.push(
          (Math.random() - 0.5) * 400,
          Math.random() * 200 + 20,
          (Math.random() - 0.5) * 400
        );
      }
      starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
      const starMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 1.2, transparent: true, opacity: 0.8 });
      starParticles = new THREE.Points(starGeo, starMat);
      scene.add(starParticles);

      // Drones / Air Traffic
      initDrones();

      // Mouse Move for 3D Click-to-Place
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerdown', onPointerDown);

      window.addEventListener('resize', onWindowResize);
      animateThree();
    }

    function initDrones() {
      const droneGeo = new THREE.BoxGeometry(0.8, 0.25, 1.4);
      const droneMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.8 });
      for (let i = 0; i < 14; i++) {
        const drone = new THREE.Mesh(droneGeo, droneMat);
        drone.position.set((Math.random() - 0.5) * 60, 8 + Math.random() * 14, (Math.random() - 0.5) * 60);
        drone.userData = {
          speed: 0.15 + Math.random() * 0.1,
          radius: 18 + Math.random() * 25,
          angle: Math.random() * Math.PI * 2,
          altitude: drone.position.y
        };
        scene.add(drone);
        droneMeshes.push(drone);
      }
    }

    // Procedural Mesh Builders
    function createArcologyMesh(x, z) {
      const group = new THREE.Group();
      // Tier 1 Base
      const t1Geo = new THREE.CylinderGeometry(4.2, 5.0, 6, 12);
      const t1Mat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 });
      const t1 = new THREE.Mesh(t1Geo, t1Mat);
      t1.position.y = 3;
      t1.castShadow = true;
      group.add(t1);

      // Tier 2 Middle
      const t2Geo = new THREE.CylinderGeometry(3.0, 3.8, 8, 12);
      const t2 = new THREE.Mesh(t2Geo, t1Mat);
      t2.position.y = 10;
      t2.castShadow = true;
      group.add(t2);

      // Glowing Neon Windows
      const winGeo = new THREE.CylinderGeometry(3.05, 3.85, 1.5, 12, 1, true);
      const winMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.9 });
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.y = 9;
      group.add(win);

      // Crown Spire
      const spireGeo = new THREE.ConeGeometry(1.6, 6, 8);
      const spireMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 });
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.y = 17;
      group.add(spire);

      group.position.set(x, 0, z);
      return group;
    }

    function createUniversityMesh(x, z) {
      const group = new THREE.Group();
      const bMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.5 });

      // Twin Towers
      const towerGeo = new THREE.BoxGeometry(2.5, 14, 2.5);
      const tower1 = new THREE.Mesh(towerGeo, bMat);
      tower1.position.set(-2, 7, 0);
      tower1.castShadow = true;
      const tower2 = new THREE.Mesh(towerGeo, bMat);
      tower2.position.set(2, 7, 0);
      tower2.castShadow = true;
      group.add(tower1);
      group.add(tower2);

      // Skybridge
      const bridgeGeo = new THREE.BoxGeometry(4.5, 1.2, 1.8);
      const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.7 });
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.set(0, 10, 0);
      group.add(bridge);

      group.position.set(x, 0, z);
      return group;
    }

    function createQuantumLabMesh(x, z) {
      const group = new THREE.Group();
      const baseGeo = new THREE.CylinderGeometry(4, 4.5, 3, 8);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 1.5;
      base.castShadow = true;
      group.add(base);

      // Central Levitating Octahedron
      const octGeo = new THREE.OctahedronGeometry(2, 0);
      const octMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 1.2 });
      const oct = new THREE.Mesh(octGeo, octMat);
      oct.position.y = 6.5;
      oct.userData = { isRotating: true };
      group.add(oct);

      // Orbiting Ring
      const ringGeo = new THREE.TorusGeometry(3.2, 0.15, 8, 32);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.6 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 6.5;
      ring.rotation.x = Math.PI / 3;
      ring.userData = { isRing: true };
      group.add(ring);

      group.position.set(x, 0, z);
      return group;
    }

    function createBioDomeMesh(x, z) {
      const group = new THREE.Group();
      // Base rim
      const rimGeo = new THREE.CylinderGeometry(5.2, 5.5, 1.5, 16);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.y = 0.75;
      group.add(rim);

      // Glass Geodesic Dome
      const domeGeo = new THREE.SphereGeometry(5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = new THREE.MeshPhysicalMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        transmission: 0.8
      });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.y = 1.5;
      group.add(dome);

      group.position.set(x, 0, z);
      return group;
    }

    function createFusionMesh(x, z) {
      const group = new THREE.Group();
      const baseGeo = new THREE.BoxGeometry(8, 2.5, 8);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 1.25;
      group.add(base);

      // Central Torus Reactor
      const torGeo = new THREE.TorusGeometry(2.8, 1.2, 16, 32);
      const torMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.9 });
      const tor = new THREE.Mesh(torGeo, torMat);
      tor.position.y = 4.2;
      tor.rotation.x = Math.PI / 2;
      group.add(tor);

      group.position.set(x, 0, z);
      return group;
    }

    function createObservatoryMesh(x, z) {
      const group = new THREE.Group();
      const baseGeo = new THREE.CylinderGeometry(3.5, 4.2, 5, 16);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 2.5;
      group.add(base);

      // Dish
      const dishGeo = new THREE.CylinderGeometry(4.5, 0.5, 1.2, 16, 1, true);
      const dishMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.y = 6.2;
      dish.rotation.x = Math.PI / 4;
      group.add(dish);

      group.position.set(x, 0, z);
      return group;
    }

    function renderBuildingsIn3D(buildings) {
      // Clear existing
      buildingMeshes.forEach(m => scene.remove(m));
      buildingMeshes = [];

      buildings.forEach(b => {
        let mesh;
        if (b.type === 'residential_spire' || b.type === 'civic_council') {
          mesh = createArcologyMesh(b.x, b.z);
        } else if (b.type === 'university') {
          mesh = createUniversityMesh(b.x, b.z);
        } else if (b.type === 'research_center') {
          mesh = createQuantumLabMesh(b.x, b.z);
        } else if (b.type === 'bio_dome') {
          mesh = createBioDomeMesh(b.x, b.z);
        } else if (b.type === 'fusion_plant') {
          mesh = createFusionMesh(b.x, b.z);
        } else if (b.type === 'quantum_observatory') {
          mesh = createObservatoryMesh(b.x, b.z);
        } else {
          mesh = createArcologyMesh(b.x, b.z);
        }
        mesh.userData = { id: b.id, name: b.name, type: b.type };
        scene.add(mesh);
        buildingMeshes.push(mesh);
      });
    }

    // --------------------------------------------------------------------------
    // 3. 3D INTERACTIVE CLICK-TO-PLACE SYSTEM
    // --------------------------------------------------------------------------
    function enterPlacementMode(bldType) {
      activePlacementType = bldType;
      document.getElementById('badgePlacement').classList.remove('hidden');

      if (ghostMesh) scene.remove(ghostMesh);
      const ghostGeo = new THREE.BoxGeometry(4, 8, 4);
      const ghostMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.8 });
      ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
      ghostMesh.position.set(0, 4, 0);
      scene.add(ghostMesh);
      playTone(480, 0.08);
    }

    function cancelPlacement() {
      activePlacementType = null;
      document.getElementById('badgePlacement').classList.add('hidden');
      if (ghostMesh) {
        scene.remove(ghostMesh);
        ghostMesh = null;
      }
    }

    function onPointerMove(event) {
      const container = document.getElementById('threeContainer');
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

      if (activePlacementType && ghostMesh) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(groundPlane);
        if (intersects.length > 0) {
          const pt = intersects[0].point;
          // Snap to 4-unit grid
          const snappedX = Math.round(pt.x / 4) * 4;
          const snappedZ = Math.round(pt.z / 4) * 4;
          ghostMesh.position.set(snappedX, 4, snappedZ);
        }
      }
    }

    async function onPointerDown(event) {
      if (!activePlacementType || !ghostMesh) return;
      const targetX = ghostMesh.position.x;
      const targetZ = ghostMesh.position.z;

      try {
        const res = await fetch(`/api/civilisations/${currentCiv.id}/buildings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: activePlacementType,
            x: targetX,
            z: targetZ
          })
        });
        const data = await res.json();
        if (res.ok) {
          playBuildHum();
          cancelPlacement();
          await refreshState();
        } else {
          alert(data.detail || 'Construction failed');
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Camera presets
    function setCameraPreset(preset) {
      if (preset === 'orbit') {
        camera.position.set(38, 30, 48);
        controls.target.set(0, 0, 0);
      } else if (preset === 'street') {
        camera.position.set(8, 3.5, 12);
        controls.target.set(0, 4, 0);
      } else if (preset === 'satellite') {
        camera.position.set(0, 75, 0.1);
        controls.target.set(0, 0, 0);
      } else if (preset === 'district') {
        camera.position.set(-18, 14, -10);
        controls.target.set(-12, 0, 4);
      }
      controls.update();
      playTone(660, 0.05);
    }

    function setHeatmapMode(mode) {
      if (mode === 'cognitive') {
        gridHelper.material.color.setHex(0xf59e0b);
      } else if (mode === 'energy') {
        gridHelper.material.color.setHex(0x10b981);
      } else if (mode === 'unrest') {
        gridHelper.material.color.setHex(0xef4444);
      } else {
        gridHelper.material.color.setHex(0x06b6d4);
      }
      playTone(550, 0.05);
    }

    function toggleDayNight() {
      isDay = !isDay;
      const icon = document.getElementById('iconDayNight');
      const lbl = document.getElementById('lblTimeOfDay');
      if (isDay) {
        scene.background.setHex(0x0f172a);
        dirSunLight.intensity = 1.2;
        hemiLight.intensity = 0.6;
        starParticles.material.opacity = 0.2;
        icon.setAttribute('data-lucide', 'sun');
        icon.classList.remove('text-indigo-400');
        icon.classList.add('text-amber-400');
        lbl.innerText = '14:00 (Daylight)';
      } else {
        scene.background.setHex(0x020617);
        dirSunLight.intensity = 0.2;
        hemiLight.intensity = 0.2;
        starParticles.material.opacity = 0.95;
        icon.setAttribute('data-lucide', 'moon');
        icon.classList.remove('text-amber-400');
        icon.classList.add('text-indigo-400');
        lbl.innerText = '02:00 (Neon Night)';
      }
      lucide.createIcons();
    }

    function animateThree() {
      requestAnimationFrame(animateThree);
      controls.update();

      // Animate Quantum labs & Drones
      buildingMeshes.forEach(bld => {
        bld.children.forEach(c => {
          if (c.userData.isRotating) c.rotation.y += 0.02;
          if (c.userData.isRing) c.rotation.z += 0.015;
        });
      });

      // Animate Drones
      droneMeshes.forEach(d => {
        d.userData.angle += d.userData.speed * 0.02;
        d.position.x = Math.cos(d.userData.angle) * d.userData.radius;
        d.position.z = Math.sin(d.userData.angle) * d.userData.radius;
        d.rotation.y = -d.userData.angle + Math.PI / 2;
      });

      renderer.render(scene, camera);
    }

    function onWindowResize() {
      const container = document.getElementById('threeContainer');
      if (!container || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // --------------------------------------------------------------------------
    // 4. CHART.JS VISUALIZATIONS
    // --------------------------------------------------------------------------
    function initCharts() {
      // 5-Axis Cognitive Radar
      const ctxRadar = document.getElementById('radarCognitive').getContext('2d');
      radarChart = new Chart(ctxRadar, {
        type: 'radar',
        data: {
          labels: ['Independent Reasoning', 'Critical Evaluation', 'Problem-Solving Velocity', 'Macro Innovation', 'Human Autonomy'],
          datasets: [{
            label: 'Cognitive Vector (%)',
            data: [84, 81, 76, 82, 72],
            backgroundColor: 'rgba(6, 182, 212, 0.25)',
            borderColor: '#06b6d4',
            borderWidth: 2,
            pointBackgroundColor: '#38bdf8',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
              grid: { color: 'rgba(255, 255, 255, 0.08)' },
              pointLabels: { color: '#94a3b8', font: { size: 10 } },
              ticks: { display: false },
              min: 0,
              max: 100
            }
          },
          plugins: { legend: { display: false } }
        }
      });

      // Scenario Branching Dual Trajectory Chart
      const ctxBranch = document.getElementById('chartBranching').getContext('2d');
      branchChart = new Chart(ctxBranch, {
        type: 'line',
        data: {
          labels: ['Yr 0', 'Yr 3', 'Yr 6', 'Yr 9', 'Yr 12', 'Yr 15'],
          datasets: [
            {
              label: 'Baseline Reasoning (%)',
              data: [84, 76, 68, 60, 52, 45],
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderDash: [5, 5],
              tension: 0.3
            },
            {
              label: 'Intervention Reasoning (%)',
              data: [84, 83, 82, 81, 80, 80],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } },
            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' }, min: 0, max: 100 }
          },
          plugins: {
            legend: { position: 'top', labels: { color: '#cbd5e1', font: { size: 11 } } }
          }
        }
      });

      // Multi-Metric Historical Telemetry Line Chart
      const ctxTel = document.getElementById('chartTelemetry').getContext('2d');
      telemetryChart = new Chart(ctxTel, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            { label: 'GDP ($B)', data: [], borderColor: '#3b82f6', tension: 0.2 },
            { label: 'Reasoning Retention (%)', data: [], borderColor: '#06b6d4', tension: 0.2 },
            { label: 'AI Dependency (%)', data: [], borderColor: '#f59e0b', tension: 0.2 },
            { label: 'Happiness Index (%)', data: [], borderColor: '#10b981', tension: 0.2 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } },
            y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } }
          },
          plugins: {
            legend: { position: 'top', labels: { color: '#cbd5e1' } }
          }
        }
      });
    }

    // --------------------------------------------------------------------------
    // 5. REST STATE HYDRATION & REFRESH LOGIC
    // --------------------------------------------------------------------------
    async function refreshState() {
      try {
        const res = await fetch('/api/civilisations/civ_aurora_prime/state');
        if (!res.ok) return;
        currentCiv = await res.json();

        // Update Top HUD
        document.getElementById('hudCivName').innerText = currentCiv.name;
        document.getElementById('hudLevel').innerText = currentCiv.level;
        document.getElementById('hudYear').innerText = currentCiv.year;
        document.getElementById('hudDay').innerText = currentCiv.day;
        document.getElementById('hudGrc').innerText = currentCiv.grc_balance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        document.getElementById('hudGrcRate').innerText = currentCiv.total_grc_per_tick.toFixed(1);
        document.getElementById('hudRp').innerText = currentCiv.research_points.toFixed(1);
        document.getElementById('hudRpRate').innerText = currentCiv.total_rp_per_tick.toFixed(1);
        document.getElementById('hudPop').innerText = (currentCiv.demographics.total_population / 1000000).toFixed(2) + 'M';
        document.getElementById('hudGdp').innerText = currentCiv.economy.gdp.toFixed(1);
        document.getElementById('hudEnergy').innerText = (currentCiv.economy.energy / 1000).toFixed(1) + 'k';

        // Update Sidebar Stats
        document.getElementById('lblMaterials').innerText = currentCiv.economy.materials.toFixed(0);
        document.getElementById('barMaterials').style.width = Math.min(100, (currentCiv.economy.materials / 15000) * 100) + '%';
        document.getElementById('lblCleanEnergy').innerText = Math.round(currentCiv.environment.clean_energy_ratio * 100) + '%';
        document.getElementById('barCleanEnergy').style.width = Math.round(currentCiv.environment.clean_energy_ratio * 100) + '%';
        document.getElementById('bldCountBadge').innerText = currentCiv.buildings.length + ' Active';

        // Update Key Facilities list
        const bldList = document.getElementById('listKeyFacilities');
        bldList.innerHTML = currentCiv.buildings.slice(0, 5).map(b => `
          <div class="glass p-2 rounded-lg flex items-center justify-between border-slate-800">
            <div>
              <div class="font-semibold text-slate-200">${b.name}</div>
              <div class="text-[10px] text-slate-500 capitalize">${b.type.replace('_', ' ')} • Lv ${b.level}</div>
            </div>
            <div class="text-right mono text-[10px] text-cyan-400">
              +${b.rp_yield} RP
            </div>
          </div>
        `).join('');

        // Update Cognitive Radar
        if (radarChart) {
          const cog = currentCiv.cognitive;
          radarChart.data.datasets[0].data = [
            Math.round(cog.independent_reasoning * 100),
            Math.round(cog.critical_evaluation * 100),
            Math.round(cog.problem_solving_velocity * 100),
            Math.round(cog.macro_innovation_index * 100),
            Math.round((1.0 - cog.ai_dependency) * 100)
          ];
          radarChart.update();
        }

        // Update Atrophy Readouts
        const cog = currentCiv.cognitive;
        document.getElementById('valAtrophyRate').innerText = (cog.cognitive_atrophy_rate).toFixed(4) + '/t';
        document.getElementById('valReasoning').innerText = (cog.independent_reasoning * 100).toFixed(1) + '%';
        document.getElementById('valCritEval').innerText = (cog.critical_evaluation * 100).toFixed(1) + '%';
        document.getElementById('valVelocity').innerText = (cog.problem_solving_velocity * 100).toFixed(1) + '%';
        document.getElementById('valMacroInn').innerText = (cog.macro_innovation_index * 100).toFixed(1) + '%';

        // 3D Rendering of Buildings
        renderBuildingsIn3D(currentCiv.buildings);

        // Refresh Cohorts & Tech Tree & Crises
        await loadCohorts();
        await loadTechTree();
        await loadCrises();
        await loadTelemetry();
      } catch (err) {
        console.error("Hydration error:", err);
      }
    }

    async function loadCohorts() {
      try {
        const res = await fetch(`/api/civilisations/civ_aurora_prime/citizens/cohorts`);
        const data = await res.json();
        const grid = document.getElementById('cohortsGrid');
        grid.innerHTML = data.cohorts.map(c => `
          <div class="glass rounded-xl p-4 border border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">${c.role}</span>
              <span class="text-xs font-bold text-slate-200 mono">${(c.size / 1000).toFixed(0)}k Pop</span>
            </div>
            <div class="font-bold text-sm text-slate-100">${c.name}</div>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between text-slate-400">
                <span>Reasoning:</span>
                <span class="mono font-semibold text-cyan-400">${Math.round(c.reasoning_retention * 100)}%</span>
              </div>
              <div class="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div class="bg-cyan-500 h-full" style="width: ${c.reasoning_retention * 100}%"></div>
              </div>

              <div class="flex justify-between text-slate-400 pt-1">
                <span>AI Dependency:</span>
                <span class="mono font-semibold text-amber-400">${Math.round(c.ai_dependency * 100)}%</span>
              </div>
              <div class="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full" style="width: ${c.ai_dependency * 100}%"></div>
              </div>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 italic">
              "${c.thought_bubble}"
            </div>
          </div>
        `).join('');

        // Update thoughts feed
        const feed = document.getElementById('thoughtFeed');
        feed.innerHTML = data.cohorts.map(c => `
          <div class="p-3 rounded-xl glass border-slate-800 flex items-start space-x-3">
            <div class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-cyan-400">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-bold text-slate-200 text-xs">${c.name}</span>
                <span class="text-[10px] text-slate-500 font-mono">Sentiment: ${c.sentiment}</span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">"${c.thought_bubble}"</p>
            </div>
          </div>
        `).join('');
        lucide.createIcons();
      } catch (err) {}
    }

    async function loadTechTree() {
      try {
        const res = await fetch(`/api/civilisations/civ_aurora_prime/technologies`);
        const data = await res.json();
        document.getElementById('treeRpBalance').innerText = data.research_points.toFixed(1);

        for (let era = 1; era <= 4; era++) {
          const eraContainer = document.getElementById(`era${era}Nodes`);
          const eraTechs = data.technologies.filter(t => t.era === era);
          eraContainer.innerHTML = eraTechs.map(t => {
            const isUnlocked = t.is_unlocked;
            const canAfford = t.can_afford && t.prereqs_met;
            return `
              <div class="glass p-4 rounded-xl border ${isUnlocked ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-slate-800'} space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] px-2 py-0.5 rounded font-mono ${isUnlocked ? 'bg-cyan-900 text-cyan-300' : 'bg-slate-800 text-slate-400'}">
                    ${isUnlocked ? 'RESEARCHED' : `${t.rp_cost} RP`}
                  </span>
                  <span class="text-[10px] text-emerald-400 mono">+${t.grc_reward} GRC</span>
                </div>
                <div class="font-bold text-xs text-slate-200">${t.name}</div>
                <p class="text-[11px] text-slate-400">${t.desc}</p>
                ${!isUnlocked ? `
                  <button onclick="researchTech('${t.id}')" ${!canAfford ? 'disabled' : ''} class="w-full mt-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${canAfford ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-lg shadow-cyan-600/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">
                    <i data-lucide="sparkles" class="w-3 h-3"></i>
                    <span>Unlock Technology</span>
                  </button>
                ` : `
                  <div class="text-[10px] text-cyan-400 font-mono text-center pt-1 flex items-center justify-center space-x-1">
                    <i data-lucide="check-circle" class="w-3 h-3"></i>
                    <span>Active in Civilisation</span>
                  </div>
                `}
              </div>
            `;
          }).join('');
        }
        lucide.createIcons();
      } catch (err) {}
    }

    async function researchTech(techId) {
      try {
        const res = await fetch(`/api/civilisations/civ_aurora_prime/technologies/research`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tech_id: techId })
        });
        const data = await res.json();
        if (res.ok) {
          playChime(660, 0.3);
          await refreshState();
        } else {
          alert(data.detail || 'Research failed');
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function loadCrises() {
      try {
        const res = await fetch(`/api/civilisations/civ_aurora_prime/crises`);
        const data = await res.json();
        const activeCrisis = data.crises.find(c => c.status === 'active');

        const banner = document.getElementById('crisisBanner');
        const countBadge = document.getElementById('tabCrisisCount');

        if (activeCrisis) {
          banner.classList.remove('hidden');
          document.getElementById('bannerCrisisTitle').innerText = activeCrisis.title;
          countBadge.innerText = '1 Active';
          countBadge.className = 'text-amber-400 font-bold';
        } else {
          banner.classList.add('hidden');
          countBadge.innerText = '0 Active';
          countBadge.className = 'text-slate-400';
        }

        const crisesList = document.getElementById('crisesList');
        crisesList.innerHTML = data.crises.map(c => `
          <div class="glass rounded-2xl p-6 border ${c.status === 'active' ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-800'} space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${c.status === 'active' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'}">
                  ${c.status === 'active' ? 'ACTIVE CRISIS' : 'RESOLVED'}
                </span>
                <span class="text-xs text-slate-400 font-mono">${c.category} • Severity: ${c.severity}</span>
              </div>
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-100">${c.title}</h3>
              <p class="text-xs text-slate-300 mt-1">${c.description}</p>
            </div>

            ${c.status === 'active' ? `
              <div class="space-y-2 pt-2">
                <div class="text-xs font-bold uppercase tracking-wider text-amber-400">Executive Policy Choices:</div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  ${c.options.map(opt => `
                    <div class="glass p-4 rounded-xl border border-slate-700/80 hover:border-amber-500/50 transition flex flex-col justify-between space-y-3">
                      <div>
                        <div class="font-bold text-xs text-slate-200">${opt.label}</div>
                        <p class="text-[11px] text-slate-400 mt-1">${opt.description}</p>
                      </div>
                      <div class="space-y-2">
                        <div class="text-[10px] mono text-slate-400 border-t border-slate-800 pt-2 space-y-0.5">
                          <div>Cost: <strong class="text-emerald-400">${opt.cost_grc} GRC</strong>, <strong class="text-cyan-400">${opt.cost_materials} Mat</strong></div>
                          <div>Reasoning Impact: <strong class="${opt.reasoning_delta >= 0 ? 'text-cyan-400' : 'text-red-400'}">${opt.reasoning_delta >= 0 ? '+' : ''}${Math.round(opt.reasoning_delta * 100)}%</strong></div>
                        </div>
                        <button onclick="resolveCrisis('${c.id}', '${opt.id}')" class="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition shadow-lg shadow-amber-500/20">
                          Enact Choice
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : `
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
                Resolved under choice: <strong class="text-cyan-400">${c.resolved_choice}</strong>
              </div>
            `}
          </div>
        `).join('');
        lucide.createIcons();
      } catch (err) {}
    }

    async function resolveCrisis(crisisId, choiceId) {
      try {
        const res = await fetch(`/api/civilisations/civ_aurora_prime/crises/${crisisId}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ choice_id: choiceId })
        });
        const data = await res.json();
        if (res.ok) {
          playBuildHum();
          await refreshState();
        } else {
          alert(data.detail || 'Resolution failed');
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function loadTelemetry() {
      try {
        const res = await fetch(`/api/civilisations/civ_aurora_prime/metrics/history?limit=30`);
        const data = await res.json();
        if (telemetryChart && data.history.length > 0) {
          telemetryChart.data.labels = data.history.map(h => `T-${h.tick}`);
          telemetryChart.data.datasets[0].data = data.history.map(h => h.gdp);
          telemetryChart.data.datasets[1].data = data.history.map(h => Math.round(h.cognitive_retention * 100));
          telemetryChart.data.datasets[2].data = data.history.map(h => Math.round(h.ai_dependency * 100));
          telemetryChart.data.datasets[3].data = data.history.map(h => Math.round(h.happiness * 100));
          telemetryChart.update();
        }
      } catch (err) {}
    }

    // --------------------------------------------------------------------------
    // 6. POLICY EXPERIMENT EXECUTION & SCENARIO BRANCHING
    // --------------------------------------------------------------------------
    function updateExpCost() {
      const horizon = parseInt(document.getElementById('expHorizon').value);
      document.getElementById('lblExpHorizon').innerText = horizon;
      const cost = 150.0 + (horizon * 12.0);
      document.getElementById('lblExpCost').innerText = cost.toFixed(1);
    }

    async function launchPaidExperiment() {
      const title = document.getElementById('expTitle').value;
      const hypothesis = document.getElementById('expHypothesis').value;
      const horizon = parseInt(document.getElementById('expHorizon').value);
      const scaffolding = parseFloat(document.getElementById('sliderScaffolding').value);
      const automation = parseFloat(document.getElementById('sliderAutomation').value);
      const ubi = parseFloat(document.getElementById('sliderUbi').value);

      try {
        const res = await fetch('/api/experiments/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            civ_id: 'civ_aurora_prime',
            title: title,
            hypothesis: hypothesis,
            variable_tested: 'Cognitive Scaffolding & UBI Interventions',
            horizon_years: horizon,
            policy_overrides: {
              cognitive_scaffolding: scaffolding,
              ai_automation_tier: automation,
              universal_basic_income: ubi
            }
          })
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.detail || 'Failed to execute experiment');
          return;
        }

        playChime(580, 0.25);
        document.getElementById('badgeExpStatus').innerText = `Completed (${data.grc_deducted} GRC)`;
        document.getElementById('textFindings').innerText = data.findings;

        // Update Dual Trajectory Line Chart
        if (branchChart) {
          branchChart.data.labels = data.baseline_trajectory.map(b => `Yr ${b.year}`);
          branchChart.data.datasets[0].data = data.baseline_trajectory.map(b => Math.round(b.reasoning * 100));
          branchChart.data.datasets[1].data = data.projected_trajectory.map(p => Math.round(p.reasoning * 100));
          branchChart.update();
        }

        await refreshState();
      } catch (err) {
        console.error(err);
      }
    }

    function updatePolicyPreview() {
      document.getElementById('valScaffolding').innerText = parseFloat(document.getElementById('sliderScaffolding').value).toFixed(2);
      document.getElementById('valAutomation').innerText = parseFloat(document.getElementById('sliderAutomation').value).toFixed(2);
      document.getElementById('valUbi').innerText = document.getElementById('sliderUbi').value;
      document.getElementById('valEdu').innerText = parseFloat(document.getElementById('sliderEdu').value).toFixed(2);
    }

    async function commitPolicies() {
      try {
        const res = await fetch(`/api/civilisations/civ_aurora_prime/policies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cognitive_scaffolding: parseFloat(document.getElementById('sliderScaffolding').value),
            ai_automation_tier: parseFloat(document.getElementById('sliderAutomation').value),
            universal_basic_income: parseFloat(document.getElementById('sliderUbi').value),
            education_subsidy: parseFloat(document.getElementById('sliderEdu').value)
          })
        });
        if (res.ok) {
          playBuildHum();
          await refreshState();
        }
      } catch (err) {
        console.error(err);
      }
    }

    // --------------------------------------------------------------------------
    // 7. TICK SIMULATION & GLOBAL RUNNERS
    // --------------------------------------------------------------------------
    async function advanceTick(ticks = 1) {
      try {
        const res = await fetch('/api/civilisations/civ_aurora_prime/advance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticks: ticks })
        });
        if (res.ok) {
          playTone(520, 0.04);
          await refreshState();
        }
      } catch (err) {
        console.error(err);
      }
    }

    function toggleAutoSim() {
      const btn = document.getElementById('btnAutoSim');
      const icon = document.getElementById('iconPlay');
      const txt = document.getElementById('textPlay');

      if (autoSimInterval) {
        clearInterval(autoSimInterval);
        autoSimInterval = null;
        btn.classList.remove('bg-amber-500', 'text-black');
        btn.classList.add('bg-cyan-600', 'text-black');
        icon.setAttribute('data-lucide', 'play');
        txt.innerText = 'Auto-Simulate';
      } else {
        autoSimInterval = setInterval(() => advanceTick(1), 1200);
        btn.classList.remove('bg-cyan-600');
        btn.classList.add('bg-amber-500');
        icon.setAttribute('data-lucide', 'pause');
        txt.innerText = 'Simulating...';
      }
      lucide.createIcons();
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
      document.getElementById(tabId).classList.remove('hidden');

      document.querySelectorAll('.nav-tab').forEach(b => {
        b.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'border', 'border-cyan-500/40');
        b.classList.add('text-slate-400');
      });

      // Highlight clicked tab
      event.currentTarget.classList.remove('text-slate-400');
      event.currentTarget.classList.add('bg-cyan-500/20', 'text-cyan-300', 'border', 'border-cyan-500/40');

      if (tabId === 'tab-3d-world') {
        setTimeout(onWindowResize, 50);
      }
      playTone(480, 0.04);
    }

    // Bootstrap
    window.addEventListener('DOMContentLoaded', async () => {
      lucide.createIcons();
      initThreeViewport();
      initCharts();
      updateExpCost();
      await refreshState();
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
# 7. MAIN RUNNER (Development Entrypoint)
# ==============================================================================

if __name__ == "__main__":
    init_db()
    seed_default_civilisation_if_missing()
    port = int(os.environ.get("PORT", 8000))
    print("=" * 66)
    print("  GENESIS ENGINE v2.0: Master Artificial Civilisation Engine")
    print(f"  Server & Glassmorphic Dashboard: http://127.0.0.1:{port}")
    print(f"  API Docs (Swagger UI):           http://127.0.0.1:{port}/docs")
    print("=" * 66)
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
