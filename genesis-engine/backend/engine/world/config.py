"""
Centralized, Versioned Configuration for GENESIS Unified World & Simulation Engine
Version: 2.0.0
Covers:
- Infrastructure costs, construction times, refund rates
- Utility supply/demand parameters and grid transmission radius
- RCI demand factors, zone lot specifications, and building lifecycle
- Road network parameters, speed limits, capacities, and BPR congestion coefficients
- Citizen daily schedule hours, transportation choices, and LOD parameters
- Policy effects, tax response elasticity, and budget multipliers
"""

CONFIG_VERSION = "2.0.0"

# ==============================================================================
# 1. INFRASTRUCTURE & BUILDING CATALOG
# ==============================================================================
BUILDING_CONFIGS = {
    # Residential
    "Residential": {
        "cost_materials": 120,
        "cost_credits": 250,
        "residents_capacity": 60,
        "jobs_capacity": 0,
        "power_demand_mw": 0.45,
        "water_demand_t": 0.50,
        "pollution_generated": 0.01,
        "default_width": 2.5,
        "default_length": 2.5,
        "default_height": 3.8,
    },
    "ResidentialHigh": {
        "cost_materials": 350,
        "cost_credits": 800,
        "residents_capacity": 250,
        "jobs_capacity": 0,
        "power_demand_mw": 1.80,
        "water_demand_t": 2.20,
        "pollution_generated": 0.03,
        "default_width": 3.5,
        "default_length": 3.5,
        "default_height": 8.5,
    },
    # Commercial
    "Commercial": {
        "cost_materials": 180,
        "cost_credits": 450,
        "residents_capacity": 0,
        "jobs_capacity": 45,
        "power_demand_mw": 0.85,
        "water_demand_t": 0.60,
        "pollution_generated": 0.02,
        "default_width": 3.0,
        "default_length": 3.0,
        "default_height": 4.5,
    },
    "CommercialHigh": {
        "cost_materials": 420,
        "cost_credits": 1100,
        "residents_capacity": 0,
        "jobs_capacity": 180,
        "power_demand_mw": 2.50,
        "water_demand_t": 1.50,
        "pollution_generated": 0.04,
        "default_width": 4.0,
        "default_length": 4.0,
        "default_height": 10.0,
    },
    # Industrial & Agriculture
    "Industrial": {
        "cost_materials": 250,
        "cost_credits": 600,
        "residents_capacity": 0,
        "jobs_capacity": 80,
        "power_demand_mw": 3.20,
        "water_demand_t": 2.80,
        "pollution_generated": 0.18,
        "materials_generation_t": 12.0,
        "default_width": 4.5,
        "default_length": 4.5,
        "default_height": 3.5,
    },
    "Agriculture": {
        "cost_materials": 150,
        "cost_credits": 350,
        "residents_capacity": 0,
        "jobs_capacity": 30,
        "power_demand_mw": 0.50,
        "water_demand_t": 4.50,
        "pollution_generated": 0.02,
        "food_generation_t": 25.0,
        "default_width": 5.0,
        "default_length": 5.0,
        "default_height": 2.0,
    },
    # Utilities
    "Energy": {
        "cost_materials": 500,
        "cost_credits": 1500,
        "residents_capacity": 0,
        "jobs_capacity": 25,
        "power_generation_mw": 75.0,
        "power_demand_mw": 0.0,
        "water_demand_t": 2.0,
        "pollution_generated": 0.12,
        "default_width": 5.0,
        "default_length": 5.0,
        "default_height": 6.0,
    },
    "Water": {
        "cost_materials": 300,
        "cost_credits": 900,
        "residents_capacity": 0,
        "jobs_capacity": 15,
        "water_generation_t": 80.0,
        "power_demand_mw": 2.5,
        "pollution_generated": 0.01,
        "default_width": 4.0,
        "default_length": 4.0,
        "default_height": 3.5,
    },
    # Services
    "Healthcare": {
        "cost_materials": 400,
        "cost_credits": 1200,
        "residents_capacity": 0,
        "jobs_capacity": 50,
        "hospital_beds": 150,
        "power_demand_mw": 1.5,
        "water_demand_t": 1.8,
        "coverage_radius": 24.0,
        "health_bonus": 0.15,
        "default_width": 4.0,
        "default_length": 4.0,
        "default_height": 5.0,
    },
    "Education": {
        "cost_materials": 320,
        "cost_credits": 850,
        "residents_capacity": 0,
        "jobs_capacity": 35,
        "student_capacity": 200,
        "power_demand_mw": 1.0,
        "water_demand_t": 0.8,
        "coverage_radius": 22.0,
        "education_bonus": 0.12,
        "default_width": 3.5,
        "default_length": 3.5,
        "default_height": 4.0,
    },
    "Civic": {
        "cost_materials": 600,
        "cost_credits": 2000,
        "residents_capacity": 0,
        "jobs_capacity": 60,
        "power_demand_mw": 2.0,
        "water_demand_t": 1.2,
        "coverage_radius": 30.0,
        "stability_bonus": 0.20,
        "default_width": 5.5,
        "default_length": 5.5,
        "default_height": 8.0,
    },
    "Research": {
        "cost_materials": 450,
        "cost_credits": 1400,
        "residents_capacity": 0,
        "jobs_capacity": 40,
        "power_demand_mw": 2.8,
        "water_demand_t": 1.0,
        "research_rate_boost": 8.0,
        "default_width": 4.0,
        "default_length": 4.0,
        "default_height": 6.0,
    }
}

# Demolition refund percentage
BULLDOZE_REFUND_RATE = 0.70

# ==============================================================================
# 2. ROAD NETWORK & TRAFFIC
# ==============================================================================
ROAD_TYPES = {
    "two_lane": {
        "speed_limit_kmh": 50.0,
        "capacity_vph": 600,
        "cost_materials_per_meter": 2.0,
        "cost_credits_per_meter": 4.0,
        "width_meters": 2.4,
    },
    "four_lane": {
        "speed_limit_kmh": 70.0,
        "capacity_vph": 1500,
        "cost_materials_per_meter": 4.5,
        "cost_credits_per_meter": 8.0,
        "width_meters": 4.8,
    },
    "highway": {
        "speed_limit_kmh": 100.0,
        "capacity_vph": 3200,
        "cost_materials_per_meter": 8.0,
        "cost_credits_per_meter": 16.0,
        "width_meters": 7.2,
    },
    "service": {
        "speed_limit_kmh": 30.0,
        "capacity_vph": 300,
        "cost_materials_per_meter": 1.2,
        "cost_credits_per_meter": 2.5,
        "width_meters": 1.8,
    }
}

# Bureau of Public Roads (BPR) Congestion Function:
# Travel_Time = Free_Flow_Time * (1.0 + BPR_ALPHA * (V / C)^BPR_BETA)
BPR_ALPHA = 0.15
BPR_BETA = 4.0

# ==============================================================================
# 3. ZONING & RCI SPECIFICATIONS
# ==============================================================================
ZONE_LOT_SIZE = 8.0 # meters per lot square
ZONE_TYPES = [
    "residential_low",
    "residential_high",
    "commercial_low",
    "commercial_high",
    "industrial",
    "office"
]
ZONE_PAINT_COST_CREDITS = 25.0

# Building spawn demand threshold [0.0, 1.0]
SPAWN_DEMAND_THRESHOLD = 0.55
# Building abandonment conditions
ABANDONMENT_UNPOWERED_TICKS = 5
ABANDONMENT_UNWATERED_TICKS = 5

# ==============================================================================
# 4. CITIZEN SCHEDULES & LOD THRESHOLDS
# ==============================================================================
CITIZEN_SCHEDULE = {
    "morning_commute_start": 7,
    "work_start": 9,
    "work_end": 17,
    "evening_commute_end": 19,
    "leisure_end": 22,
}

# LOD: Detail full agents near camera/district, aggregate others
MAX_LOD_FULL_AGENTS = 500
MAX_LOD_FULL_VEHICLES = 150

# ==============================================================================
# 5. ECONOMIC & POLICY ELASTICITY
# ==============================================================================
DEFAULT_TAX_RATE = 0.18 # 18% base corporate/income tax
TAX_ELASTICITY_HAPPINESS = -0.45 # Higher taxes reduce happiness
TAX_ELASTICITY_INVESTMENT = -0.35 # Higher taxes reduce commercial/industrial RCI demand

BUDGET_MIN_PCT = 0.50 # 50%
BUDGET_MAX_PCT = 1.50 # 150%
BUDGET_SERVICE_ELASTICITY = 0.85 # Coverage scales with budget^0.85

