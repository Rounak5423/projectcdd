"""
GENESIS Engine v2.0 - Authoritative Simulation Configuration & Time Standards
Module: engine.modules.config
Defines time scale, deterministic PRNG seed management, and versioned causal coefficients.
"""

from typing import Dict, Any
import hashlib
import random

# ==============================================================================
# 1. TIME SCALE DEFINITION
# ==============================================================================
# 1 tick = 1 simulated hour
# 24 ticks = 1 simulated day
# 30 days = 1 simulated month (720 ticks)
# 365 days = 1 simulated year (8760 ticks)

TICKS_PER_HOUR = 1
HOURS_PER_DAY = 24
TICKS_PER_DAY = 24
DAYS_PER_MONTH = 30
TICKS_PER_MONTH = 24 * 30  # 720 ticks
DAYS_PER_YEAR = 365
TICKS_PER_YEAR = 24 * 365  # 8760 ticks

SIMULATION_SPEED_MAP: Dict[str, float] = {
    "0.5x": 2.0,    # 1 tick every 2.0 seconds
    "1x": 1.0,      # 1 tick every 1.0 second
    "2x": 0.5,      # 1 tick every 0.5 seconds
    "4x": 0.25,     # 1 tick every 0.25 seconds
    "10x": 0.1,     # 1 tick every 0.1 seconds
}

# ==============================================================================
# 2. DETERMINISTIC SEEDED RNG
# ==============================================================================

def get_seeded_rng(seed_input: Any) -> random.Random:
    """
    Returns an isolated deterministic random.Random instance seeded with input.
    Guarantees deterministic replay across runs regardless of host or platform.
    """
    if isinstance(seed_input, int):
        seed_int = seed_input
    else:
        seed_str = str(seed_input)
        seed_int = int(hashlib.sha256(seed_str.encode("utf-8")).hexdigest()[:12], 16)
    return random.Random(seed_int)


# ==============================================================================
# 3. DEMOGRAPHIC & BIOLOGICAL COEFFICIENTS
# ==============================================================================
# Gompertz mortality model: m(x) = a * exp(b * x)
# Calibrated against UN World Population Prospects (2024 Revision)
GOMPERTZ_ALPHA = 0.0001295  # Baseline intrinsic mortality rate (R2 = 0.9959)
GOMPERTZ_BETA = 0.08016     # Age acceleration factor

# Calibrated Hadwiger fertility parameters (UN WPP 2024 ASFR cohorts, R2 = 0.975)
HADWIGER_PEAK_AGE = 27.3           # Peak maternal age
HADWIGER_PEAK_RATE = 0.13518       # Peak annual fertility rate at age 27.3
HADWIGER_SPREAD = 9.99             # Cohort variance spread (years)
POSTPARTUM_COOLDOWN_TICKS = 6570   # ~9 months cooldown (273.75 days * 24 hours)

# Baseline Infant Mortality Rate (WPP 2024 global baseline)
INFANT_MORTALITY_BASELINE = 0.024  # 24 deaths per 1000 live births
SEX_RATIO_AT_BIRTH_MALE = 0.512    # Standard biological ratio (105 M : 100 F)

# Age Cohort Classifications
AGE_COHORTS = {
    "Infant": (0.0, 1.99),
    "Child": (2.0, 12.99),
    "Youth": (13.0, 17.99),
    "Young Adult": (18.0, 24.99),
    "Prime Adult": (25.0, 54.99),
    "Mature Adult": (55.0, 64.99),
    "Senior": (65.0, 79.99),
    "Elder": (80.0, 150.0)
}

# Per citizen consumption rates per tick (1 hour)
# Daily: food 1.0 kg, water 3.0 liters, energy 0.5 kWh
CITIZEN_HOURLY_FOOD = 1.0 / 24.0      # ~0.04167 units/tick
CITIZEN_HOURLY_WATER = 3.0 / 24.0     # ~0.125 units/tick
CITIZEN_HOURLY_ENERGY = 0.5 / 24.0    # ~0.02083 units/tick

# Health decay penalties under unmet needs
STARVATION_HEALTH_DECAY = 0.008       # per tick under 0 food
DEHYDRATION_HEALTH_DECAY = 0.018      # per tick under 0 water
FREEZING_HEALTH_DECAY = 0.005         # per tick under 0 power in cold season
POLLUTION_HEALTH_DECAY = 0.003        # per tick under air pollution > 0.5

# ==============================================================================
# 4. ENVIRONMENTAL & CLIMATE COEFFICIENTS
# ==============================================================================
SEASONS = ("Spring", "Summer", "Autumn", "Winter")
SEASON_DAYS = 91.25

SEASONAL_TEMPERATURE_OFFSETS = {
    "Spring": 0.0,
    "Summer": 12.0,
    "Autumn": -2.0,
    "Winter": -15.0
}

AIR_DIFFUSION_RATE = 0.15     # Spatial diffusion coefficient per tick
WATER_DIFFUSION_RATE = 0.08   # Hydraulic dispersion coefficient per tick
GREEN_COVER_ABSORPTION = 0.05 # Pollution absorbed per park/green lot

# ==============================================================================
# 5. MOVEMENT & TRAFFIC COEFFICIENTS (BPR Curve)
# ==============================================================================
BPR_ALPHA = 0.15
BPR_BETA = 4.0
LOD_ACTIVE_RADIUS_METERS = 75.0  # Full agent tracking radius; statistical elsewhere

# ==============================================================================
# 6. GOVERNANCE POLICIES CATALOG (At least 8 policies, with 3 fully working)
# ==============================================================================
POLICY_CATALOG = {
    "universal_healthcare": {
        "id": "universal_healthcare",
        "name": "Universal Healthcare Mandate",
        "category": "social",
        "activation_delay_ticks": 24, # 1 day delay to take effect
        "cost_credits_per_day": 2500.0,
        "effects": {
            "health_bonus": 0.18,
            "mortality_multiplier": 0.65,
            "happiness_bonus": 0.12,
            "budget_overhead": 0.08
        },
        "description": "Publicly funded primary and trauma care. Reduces mortality by 35% and increases health."
    },
    "clean_energy_subsidy": {
        "id": "clean_energy_subsidy",
        "name": "Clean Energy Subsidies",
        "category": "environment",
        "activation_delay_ticks": 48, # 2 days delay
        "cost_credits_per_day": 1800.0,
        "effects": {
            "pollution_reduction": 0.40,
            "green_energy_efficiency": 0.25,
            "industrial_tax_drag": -0.02
        },
        "description": "Grants for renewable solar and fusion infrastructure. Slashes air emissions by 40%."
    },
    "congestion_pricing": {
        "id": "congestion_pricing",
        "name": "Smart Congestion Tolls",
        "category": "transport",
        "activation_delay_ticks": 12, # 12 hours delay
        "cost_credits_per_day": 300.0,
        "effects": {
            "traffic_reduction": 0.30,
            "transit_ridership_bonus": 0.35,
            "daily_revenue": 1200.0,
            "happiness_penalty": -0.04
        },
        "description": "Dynamic road user charges during peak commuting hours. Cuts traffic by 30%."
    },
    "free_public_transit": {
        "id": "free_public_transit",
        "name": "Free Public Transit",
        "category": "transport",
        "activation_delay_ticks": 24,
        "cost_credits_per_day": 1500.0,
        "effects": {
            "traffic_reduction": 0.25,
            "happiness_bonus": 0.08,
            "air_quality_improvement": 0.15
        },
        "description": "Fare-free bus and light rail network across all districts."
    },
    "rent_control": {
        "id": "rent_control",
        "name": "Affordable Housing Price Caps",
        "category": "social",
        "activation_delay_ticks": 72,
        "cost_credits_per_day": 600.0,
        "effects": {
            "poverty_reduction": 0.20,
            "happiness_bonus": 0.06,
            "housing_investment_drag": -0.15
        },
        "description": "Caps rent escalation to inflation rate. Enhances lower-income stability."
    },
    "industrial_tax_holiday": {
        "id": "industrial_tax_holiday",
        "name": "Industrial Growth Tax Holiday",
        "category": "economy",
        "activation_delay_ticks": 24,
        "cost_credits_per_day": 0.0,
        "effects": {
            "industrial_job_growth": 0.25,
            "gdp_growth_boost": 0.04,
            "pollution_penalty": 0.20,
            "tax_revenue_drag": -0.15
        },
        "description": "Temporary tax waivers for heavy industrial and manufacturing zones."
    },
    "emergency_food_rationing": {
        "id": "emergency_food_rationing",
        "name": "Emergency Food Stockpile Rationing",
        "category": "emergency",
        "activation_delay_ticks": 6,
        "cost_credits_per_day": 500.0,
        "effects": {
            "food_efficiency_boost": 0.35,
            "starvation_mitigation": 0.80,
            "happiness_penalty": -0.08
        },
        "description": "Strict nutritional rationing to prevent mass starvation during shortages."
    },
    "education_endowment": {
        "id": "education_endowment",
        "name": "Civic STEM & AI Endowment",
        "category": "education",
        "activation_delay_ticks": 120,
        "cost_credits_per_day": 2000.0,
        "effects": {
            "education_growth_boost": 0.30,
            "high_tech_gdp_bonus": 0.15,
            "civic_stability_bonus": 0.07
        },
        "description": "Long-term investment in secondary and tertiary STEM education."
    }
}
