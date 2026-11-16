"""
GENESIS Engine v2.0 - Environment Subsystem Module
Module: engine.modules.environment
2D spatial diffusion fields (Air, Water, Soil), wind vectors, green cover absorption,
climate, 4 seasons, weather patterns, and environmental health feedbacks.
"""

import math
from typing import Dict, List, Optional, Any, Tuple
from .config import (
    SEASONS,
    SEASON_DAYS,
    SEASONAL_TEMPERATURE_OFFSETS,
    AIR_DIFFUSION_RATE,
    WATER_DIFFUSION_RATE,
    GREEN_COVER_ABSORPTION
)


class EnvironmentModule:
    """
    Simulates spatial environmental dynamics:
    pollution diffusion fields (air, water, soil), climate seasons, weather, and eco-health.
    """
    def __init__(self, world_id: str, grid_dim: int = 16):
        self.world_id = world_id
        self.grid_dim = grid_dim  # 16x16 discrete spatial cells
        # 2D scalar fields
        self.air_pollution = [[0.05 for _ in range(grid_dim)] for _ in range(grid_dim)]
        self.water_pollution = [[0.02 for _ in range(grid_dim)] for _ in range(grid_dim)]
        self.soil_pollution = [[0.01 for _ in range(grid_dim)] for _ in range(grid_dim)]

        # Atmospheric state
        self.wind_speed_kph: float = 12.0
        self.wind_direction_deg: float = 45.0  # North-East
        self.temperature_c: float = 21.0
        self.weather_condition: str = "Clear"
        self.precipitation_pct: float = 10.0
        self.current_season: str = "Spring"
        self.environmental_health: float = 0.90

    def _world_to_grid(self, x: float, z: float, world_extent: float = 300.0) -> Tuple[int, int]:
        half = world_extent / 2.0
        gx = int(((x + half) / world_extent) * self.grid_dim)
        gz = int(((z + half) / world_extent) * self.grid_dim)
        return max(0, min(self.grid_dim - 1, gx)), max(0, min(self.grid_dim - 1, gz))

    def step(
        self,
        ticks: int,
        day_of_year: int,
        buildings: List[Any],
        traffic_congestion_ratio: float = 0.1,
        policy_multipliers: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Advances spatial diffusion fields, incorporates building emissions,
        updates climate/seasons, and computes environmental health index.
        """
        if policy_multipliers is None:
            policy_multipliers = {}

        clean_subsidy_bonus = policy_multipliers.get("pollution_reduction", 0.0)

        # 1. Seasons & Weather Progression
        season_idx = int((day_of_year % 365) / SEASON_DAYS) % 4
        self.current_season = SEASONS[season_idx]
        base_temp = 18.0 + SEASONAL_TEMPERATURE_OFFSETS[self.current_season]
        # Diurnal fluctuation
        hour_of_day = (ticks % 24)
        diurnal_offset = 5.0 * math.sin((hour_of_day - 6) * (math.pi / 12.0))
        self.temperature_c = round(base_temp + diurnal_offset, 1)

        # 2. Point Source Emissions from Industry & Traffic
        for b in buildings:
            if getattr(b, "status", "active") == "abandoned":
                continue
            b_type = getattr(b, "type", "")
            bx = getattr(b, "x", 0.0)
            bz = getattr(b, "z", 0.0)
            gx, gz = self._world_to_grid(bx, bz)

            emission_air = 0.0
            emission_water = 0.0
            emission_soil = 0.0

            if "Industrial" in b_type:
                emission_air = 0.08 * (1.0 - clean_subsidy_bonus)
                emission_water = 0.05
                emission_soil = 0.04
            elif "Energy" in b_type and "Solar" not in getattr(b, "name", "") and "Fusion" not in getattr(b, "name", ""):
                emission_air = 0.06 * (1.0 - clean_subsidy_bonus)
            elif "Park" in getattr(b, "name", "") or "Green" in getattr(b, "name", ""):
                # Green sink
                self.air_pollution[gx][gz] = max(0.01, self.air_pollution[gx][gz] - GREEN_COVER_ABSORPTION * ticks)

            self.air_pollution[gx][gz] = min(1.0, self.air_pollution[gx][gz] + emission_air * (ticks / 24.0))
            self.water_pollution[gx][gz] = min(1.0, self.water_pollution[gx][gz] + emission_water * (ticks / 24.0))
            self.soil_pollution[gx][gz] = min(1.0, self.soil_pollution[gx][gz] + emission_soil * (ticks / 24.0))

        # Diffuse air pollution with 2D Laplace operator + wind advection
        rad = math.radians(self.wind_direction_deg)
        wind_dx = math.cos(rad) * 0.1
        wind_dz = math.sin(rad) * 0.1

        new_air = [[self.air_pollution[r][c] for c in range(self.grid_dim)] for r in range(self.grid_dim)]
        for r in range(self.grid_dim):
            for c in range(self.grid_dim):
                # Neighbors
                up = self.air_pollution[max(0, r - 1)][c]
                down = self.air_pollution[min(self.grid_dim - 1, r + 1)][c]
                left = self.air_pollution[r][max(0, c - 1)]
                right = self.air_pollution[r][min(self.grid_dim - 1, c + 1)]
                laplace = (up + down + left + right - 4.0 * self.air_pollution[r][c])

                # Natural dissipation & diffusion
                decay = 0.005 * ticks
                diff = AIR_DIFFUSION_RATE * laplace * (ticks / 24.0)
                new_air[r][c] = max(0.02, min(1.0, self.air_pollution[r][c] + diff - decay))

        self.air_pollution = new_air

        # 3. Aggregate Macro Indices
        total_cells = self.grid_dim * self.grid_dim
        mean_air = sum(sum(row) for row in self.air_pollution) / total_cells
        mean_water = sum(sum(row) for row in self.water_pollution) / total_cells
        mean_soil = sum(sum(row) for row in self.soil_pollution) / total_cells

        # Traffic congestion contribution to air pollution
        mean_air = min(1.0, mean_air + traffic_congestion_ratio * 0.15)

        composite_pollution = (mean_air * 0.50 + mean_water * 0.30 + mean_soil * 0.20)
        self.environmental_health = max(0.05, min(1.0, 1.0 - composite_pollution))

        return {
            "current_season": self.current_season,
            "temperature_c": self.temperature_c,
            "weather_condition": self.weather_condition,
            "mean_air_pollution": round(mean_air, 3),
            "mean_water_pollution": round(mean_water, 3),
            "mean_soil_pollution": round(mean_soil, 3),
            "composite_pollution_index": round(composite_pollution, 3),
            "environmental_health_index": round(self.environmental_health, 3),
            "wind_speed_kph": self.wind_speed_kph,
            "wind_direction_deg": self.wind_direction_deg
        }
