"""
GENESIS Engine v2.0 - Resources Subsystem Module
Module: engine.modules.resources
Production chains (Food, Water, Energy, Materials), storage capacities,
transport line losses, shortages, and priority rationing based on building networks.
"""

from typing import Dict, List, Optional, Any
from .config import (
    CITIZEN_HOURLY_FOOD,
    CITIZEN_HOURLY_WATER,
    CITIZEN_HOURLY_ENERGY
)


class ResourcesModule:
    """
    Simulates production chains, distribution networks, storage limits,
    transport losses, and priority rationing for core civilization resources.
    """
    def __init__(self, world_id: str):
        self.world_id = world_id
        # Current stockpiles
        self.food_stock: float = 10000.0
        self.water_stock: float = 15000.0
        self.energy_stock: float = 5000.0
        self.materials_stock: float = 8000.0
        self.research_points: float = 100.0

        # Maximum storage limits
        self.food_capacity: float = 50000.0
        self.water_capacity: float = 50000.0
        self.energy_capacity: float = 20000.0
        self.materials_capacity: float = 30000.0

        # Loss coefficients (transport & storage dissipation per tick)
        self.energy_transmission_loss_pct: float = 0.03
        self.water_leakage_loss_pct: float = 0.02
        self.food_spoilage_rate: float = 0.0005

    def step(
        self,
        ticks: int,
        population: int,
        buildings: List[Any],
        policy_multipliers: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Executes production chain calculation, consumption by population and industry,
        loss factors, and priority rationing.
        """
        if policy_multipliers is None:
            policy_multipliers = {}

        food_efficiency = policy_multipliers.get("food_efficiency_boost", 1.0)
        energy_clean_efficiency = policy_multipliers.get("green_energy_efficiency", 1.0)

        # 1. Calculate Production Capacities from Active Buildings
        gross_food_prod = 0.0
        gross_water_prod = 0.0
        gross_power_prod = 0.0
        gross_materials_prod = 0.0

        food_storage_cap = 5000.0
        water_storage_cap = 5000.0
        energy_storage_cap = 2000.0
        materials_storage_cap = 5000.0

        for b in buildings:
            if getattr(b, "status", "active") == "abandoned":
                continue

            b_type = getattr(b, "type", "")
            b_name = getattr(b, "name", "")
            eff = getattr(b, "efficiency", 1.0)
            lvl = getattr(b, "level", 1)
            lvl_mult = 1.0 + (lvl - 1) * 0.25

            # Energy generators
            if "Energy" in b_type or "Solar" in b_name or "Fusion" in b_name or "Power" in b_name or "Wind" in b_name:
                base_pow = 15.0 if "Solar" in b_name else 40.0 if "Fusion" in b_name else 25.0
                if "Solar" in b_name or "Wind" in b_name:
                    base_pow *= (1.0 + energy_clean_efficiency)
                gross_power_prod += base_pow * eff * lvl_mult
                energy_storage_cap += 500.0 * lvl

            # Water facilities
            if "Water" in b_type or "Well" in b_name or "Treatment" in b_name or "Aquifer" in b_name:
                gross_water_prod += 25.0 * eff * lvl_mult
                water_storage_cap += 2000.0 * lvl

            # Agricultural facilities
            if "Farm" in b_name or "Hydroponic" in b_name or "Agriculture" in b_name or "Greenhouse" in b_name:
                gross_food_prod += 18.0 * eff * lvl_mult * (1.0 + food_efficiency)
                food_storage_cap += 2500.0 * lvl

            # Industrial facilities
            if "Industrial" in b_type or "Mine" in b_name or "Factory" in b_name or "Smelter" in b_name:
                gross_materials_prod += 12.0 * eff * lvl_mult
                materials_storage_cap += 2000.0 * lvl

            # Storage structures
            if "Silo" in b_name or "Warehouse" in b_name or "Reservoir" in b_name:
                food_storage_cap += 10000.0 * lvl
                water_storage_cap += 10000.0 * lvl
                materials_storage_cap += 10000.0 * lvl

        self.food_capacity = food_storage_cap
        self.water_capacity = water_storage_cap
        self.energy_capacity = energy_storage_cap
        self.materials_capacity = materials_storage_cap

        # 2. Production Chain Intermediate Requirements
        # Agriculture requires water and minor electricity
        water_for_farming = gross_food_prod * 0.35
        energy_for_farming = gross_food_prod * 0.10

        # Manufacturing requires energy and materials
        energy_for_industry = gross_materials_prod * 0.45

        # Check if intermediates are met
        food_throttle = 1.0
        if self.water_stock < water_for_farming:
            food_throttle = max(0.1, self.water_stock / max(1.0, water_for_farming))
        net_food_prod = gross_food_prod * food_throttle

        industry_throttle = 1.0
        if self.energy_stock < energy_for_industry:
            industry_throttle = max(0.1, self.energy_stock / max(1.0, energy_for_industry))
        net_materials_prod = gross_materials_prod * industry_throttle

        # 3. Consumption Calculation
        # Citizen direct hourly needs
        pop_food_demand = population * CITIZEN_HOURLY_FOOD * ticks
        pop_water_demand = population * CITIZEN_HOURLY_WATER * ticks
        pop_energy_demand = population * CITIZEN_HOURLY_ENERGY * ticks

        # Building base demand
        bld_power_demand = sum(getattr(b, "power_demand_mw", 0.5) for b in buildings if getattr(b, "status", "active") != "abandoned") * (ticks / 24.0)
        bld_water_demand = sum(getattr(b, "water_demand_t", 0.5) for b in buildings if getattr(b, "status", "active") != "abandoned") * (ticks / 24.0)

        total_food_demand = pop_food_demand
        total_water_demand = pop_water_demand + bld_water_demand + (water_for_farming * ticks)
        total_energy_demand = pop_energy_demand + bld_power_demand + (energy_for_industry * ticks) + (energy_for_farming * ticks)
        total_materials_demand = (len(buildings) * 0.05 * ticks) # maintenance wear

        # 4. Transmission Losses
        effective_power_supply = (gross_power_prod * ticks) * (1.0 - self.energy_transmission_loss_pct)
        effective_water_supply = (gross_water_prod * ticks) * (1.0 - self.water_leakage_loss_pct)
        effective_food_supply = (net_food_prod * ticks)

        # 5. Stockpile Updates
        self.food_stock = max(0.0, min(self.food_capacity, self.food_stock + effective_food_supply - total_food_demand - (self.food_stock * self.food_spoilage_rate * ticks)))
        self.water_stock = max(0.0, min(self.water_capacity, self.water_stock + effective_water_supply - total_water_demand))
        self.energy_stock = max(0.0, min(self.energy_capacity, self.energy_stock + effective_power_supply - total_energy_demand))
        self.materials_stock = max(0.0, min(self.materials_capacity, self.materials_stock + (net_materials_prod * ticks) - total_materials_demand))

        # 6. Rationing Ratios (0.0 to 1.0)
        food_available_ratio = 1.0 if total_food_demand <= 0 else min(1.0, (self.food_stock + effective_food_supply) / max(1.0, total_food_demand))
        water_available_ratio = 1.0 if total_water_demand <= 0 else min(1.0, (self.water_stock + effective_water_supply) / max(1.0, total_water_demand))
        energy_available_ratio = 1.0 if total_energy_demand <= 0 else min(1.0, (self.energy_stock + effective_power_supply) / max(1.0, total_energy_demand))

        return {
            "food_stock": round(self.food_stock, 1),
            "food_capacity": round(self.food_capacity, 1),
            "food_available_ratio": round(food_available_ratio, 3),
            "food_net_rate": round(effective_food_supply - total_food_demand, 2),
            "water_stock": round(self.water_stock, 1),
            "water_capacity": round(self.water_capacity, 1),
            "water_available_ratio": round(water_available_ratio, 3),
            "water_net_rate": round(effective_water_supply - total_water_demand, 2),
            "energy_stock": round(self.energy_stock, 1),
            "energy_capacity": round(self.energy_capacity, 1),
            "energy_available_ratio": round(energy_available_ratio, 3),
            "energy_net_rate": round(effective_power_supply - total_energy_demand, 2),
            "materials_stock": round(self.materials_stock, 1),
            "materials_capacity": round(self.materials_capacity, 1),
            "materials_net_rate": round((net_materials_prod * ticks) - total_materials_demand, 2),
            "has_food_shortage": self.food_stock < pop_food_demand * 2.0,
            "has_water_shortage": self.water_stock < pop_water_demand * 2.0,
            "has_energy_shortage": self.energy_stock < pop_energy_demand * 2.0
        }
