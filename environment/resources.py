"""Environmental Resource Matrix and Seasonal Thermodynamics (Module D)."""

from enum import Enum
import math
from typing import Dict
from pydantic import BaseModel, Field

from genesis.core.civilisation import ClimateType


class ResourceType(str, Enum):
    FOOD = "food"
    WATER = "water"
    WOOD = "wood"
    STONE = "stone"
    ORE = "ore"


class Season(str, Enum):
    SPRING = "spring"
    SUMMER = "summer"
    AUTUMN = "autumn"
    WINTER = "winter"


class ResourceNode(BaseModel):
    """Represents a localized natural resource deposit with regeneration and carrying capacity."""

    resource_type: ResourceType
    current_stock: float = Field(default=500.0, ge=0.0)
    max_capacity: float = Field(default=1000.0, ge=0.0)
    base_regeneration_rate: float = Field(default=10.0, ge=0.0)

    def regenerate(self, climate_multiplier: float, seasonal_multiplier: float) -> float:
        """Logistic or bounded growth replenishment."""
        if self.current_stock >= self.max_capacity:
            return 0.0

        # Regeneration scales with remaining stock (seed population/biomass)
        growth_ratio = max(0.1, self.current_stock / self.max_capacity)
        delta = self.base_regeneration_rate * growth_ratio * climate_multiplier * seasonal_multiplier
        replenished = min(delta, self.max_capacity - self.current_stock)
        self.current_stock += replenished
        return replenished

    def harvest(self, requested_amount: float) -> float:
        """Extracts available resources up to requested amount."""
        yield_amount = min(self.current_stock, requested_amount)
        self.current_stock -= yield_amount
        return yield_amount


class EnvironmentMatrix(BaseModel):
    """The physical ecosystem supporting the artificial civilisation."""

    climate: ClimateType = ClimateType.FERTILE_RIVER_VALLEY
    current_season: Season = Season.SPRING
    season_tick_count: int = 0
    ticks_per_season: int = 25  # 100 ticks = 1 annual seasonal cycle

    resources: Dict[str, ResourceNode] = Field(default_factory=dict)

    def __init__(self, **data) -> None:
        super().__init__(**data)
        if not self.resources:
            self._initialize_resources()

    def _initialize_resources(self) -> None:
        """Populates baseline resource capacities modulated by climate."""
        food_cap = 1500.0
        water_cap = 2000.0
        wood_cap = 1200.0
        stone_cap = 800.0

        if self.climate == ClimateType.FERTILE_RIVER_VALLEY:
            food_cap *= 1.5
            water_cap *= 2.0
        elif self.climate == ClimateType.ARID_DESERT:
            water_cap *= 0.25
            food_cap *= 0.5
        elif self.climate == ClimateType.HARSH_TUNDRA:
            food_cap *= 0.4
            wood_cap *= 0.5

        self.resources[ResourceType.FOOD.value] = ResourceNode(
            resource_type=ResourceType.FOOD,
            current_stock=food_cap * 0.75,
            max_capacity=food_cap,
            base_regeneration_rate=25.0,
        )
        self.resources[ResourceType.WATER.value] = ResourceNode(
            resource_type=ResourceType.WATER,
            current_stock=water_cap * 0.85,
            max_capacity=water_cap,
            base_regeneration_rate=40.0,
        )
        self.resources[ResourceType.WOOD.value] = ResourceNode(
            resource_type=ResourceType.WOOD,
            current_stock=wood_cap * 0.8,
            max_capacity=wood_cap,
            base_regeneration_rate=15.0,
        )
        self.resources[ResourceType.STONE.value] = ResourceNode(
            resource_type=ResourceType.STONE,
            current_stock=stone_cap * 0.9,
            max_capacity=stone_cap,
            base_regeneration_rate=5.0,  # Stone regenerates very slowly
        )

    def get_seasonal_multiplier(self, res_type: ResourceType) -> float:
        """Returns environmental productivity multiplier based on season."""
        if self.current_season == Season.SPRING:
            return 1.4 if res_type in (ResourceType.FOOD, ResourceType.WATER) else 1.0
        elif self.current_season == Season.SUMMER:
            return 1.2 if res_type == ResourceType.FOOD else 0.8
        elif self.current_season == Season.AUTUMN:
            return 1.5 if res_type == ResourceType.FOOD else 1.0
        elif self.current_season == Season.WINTER:
            return 0.2 if res_type == ResourceType.FOOD else 0.6
        return 1.0

    def tick(self, current_tick: int) -> None:
        """Progresses seasonal cycles and regenerates environmental resources."""
        self.season_tick_count += 1
        if self.season_tick_count >= self.ticks_per_season:
            self.season_tick_count = 0
            # Advance season: Spring -> Summer -> Autumn -> Winter -> Spring
            order = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]
            idx = order.index(self.current_season)
            self.current_season = order[(idx + 1) % len(order)]

        climate_mult = 1.0
        if self.climate == ClimateType.FERTILE_RIVER_VALLEY:
            climate_mult = 1.3
        elif self.climate == ClimateType.ARID_DESERT:
            climate_mult = 0.5
        elif self.climate == ClimateType.HARSH_TUNDRA:
            climate_mult = 0.4

        for res_type_str, node in self.resources.items():
            res_enum = ResourceType(res_type_str)
            s_mult = self.get_seasonal_multiplier(res_enum)
            node.regenerate(climate_multiplier=climate_mult, seasonal_multiplier=s_mult)

    def harvest(self, resource_type: ResourceType, amount: float) -> float:
        node = self.resources.get(resource_type.value)
        if not node:
            return 0.0
        return node.harvest(amount)
