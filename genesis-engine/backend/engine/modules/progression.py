"""
GENESIS Engine v2.0 - Progression Subsystem Module
Module: engine.modules.progression
Civilisation XP and Level system, real milestone achievements, and empirical missions.
"""

import math
from typing import Dict, List, Optional, Any


class ProgressionModule:
    """
    Manages civilization progression, experience points, levels,
    achievements, and missions evaluated against genuine simulation milestones.
    """
    def __init__(self, world_id: str):
        self.world_id = world_id
        self.xp: int = 1500
        self.level: int = 2
        self.title: str = "Nascent Settlement"
        self.grc_balance: float = 250.0

        # Real achievements definition & status
        self.achievements = {
            "pioneer_colony": {
                "id": "pioneer_colony",
                "title": "Pioneer Colony",
                "description": "Establish a living population of at least 150 citizens.",
                "unlocked": False,
                "unlocked_at_tick": None
            },
            "clean_skies": {
                "id": "clean_skies",
                "title": "Clean Skies Initiative",
                "description": "Maintain air pollution below 0.20 index across the region.",
                "unlocked": False,
                "unlocked_at_tick": None
            },
            "unbroken_grid": {
                "id": "unbroken_grid",
                "title": "Electrified Citadel",
                "description": "Achieve 100% utility grid reliability with zero power deficits.",
                "unlocked": False,
                "unlocked_at_tick": None
            },
            "equitable_society": {
                "id": "equitable_society",
                "title": "Equitable Commonwealth",
                "description": "Achieve a Gini wealth inequality coefficient under 0.25.",
                "unlocked": False,
                "unlocked_at_tick": None
            }
        }

        # Real missions definition & progress
        self.missions = {
            "daily_employment": {
                "id": "daily_employment",
                "title": "Full Civic Employment",
                "description": "Keep city unemployment below 10%.",
                "target_metric": "unemployment_rate",
                "target_value": 0.10,
                "reward_xp": 150,
                "reward_grc": 25.0,
                "is_completed": False
            },
            "expand_housing": {
                "id": "expand_housing",
                "title": "Metropolitan Expansion",
                "description": "Reach residential capacity of at least 300 occupants.",
                "target_metric": "residential_capacity",
                "target_value": 300,
                "reward_xp": 300,
                "reward_grc": 50.0,
                "is_completed": False
            }
        }

    def _xp_for_level(self, lvl: int) -> int:
        return int(1000 * math.pow(lvl, 1.4))

    def add_xp(self, amount: int) -> bool:
        """Adds XP and handles level-up transitions."""
        self.xp += amount
        leveled_up = False
        while self.xp >= self._xp_for_level(self.level):
            self.level += 1
            leveled_up = True
            # Update title
            if self.level >= 10:
                self.title = "Solar Ecumenopolis"
            elif self.level >= 5:
                self.title = "Thriving Metropolis"
            elif self.level >= 3:
                self.title = "Developing City-State"
            elif self.level >= 2:
                self.title = "Established Settlement"
        return leveled_up

    def step(
        self,
        tick: int,
        population: int,
        residential_capacity: int,
        unemployment_rate: float,
        air_pollution: float,
        grid_reliability: float,
        gini_coefficient: float
    ) -> Dict[str, Any]:
        """
        Evaluates milestones against true state variables.
        """
        unlocked_achievements = []
        completed_missions = []

        # Evaluate Achievements
        if population >= 150 and not self.achievements["pioneer_colony"]["unlocked"]:
            self.achievements["pioneer_colony"]["unlocked"] = True
            self.achievements["pioneer_colony"]["unlocked_at_tick"] = tick
            self.add_xp(250)
            unlocked_achievements.append("pioneer_colony")

        if air_pollution < 0.20 and not self.achievements["clean_skies"]["unlocked"]:
            self.achievements["clean_skies"]["unlocked"] = True
            self.achievements["clean_skies"]["unlocked_at_tick"] = tick
            self.add_xp(200)
            unlocked_achievements.append("clean_skies")

        if grid_reliability >= 99.5 and not self.achievements["unbroken_grid"]["unlocked"]:
            self.achievements["unbroken_grid"]["unlocked"] = True
            self.achievements["unbroken_grid"]["unlocked_at_tick"] = tick
            self.add_xp(200)
            unlocked_achievements.append("unbroken_grid")

        if gini_coefficient <= 0.25 and not self.achievements["equitable_society"]["unlocked"]:
            self.achievements["equitable_society"]["unlocked"] = True
            self.achievements["equitable_society"]["unlocked_at_tick"] = tick
            self.add_xp(350)
            unlocked_achievements.append("equitable_society")

        # Evaluate Missions
        if unemployment_rate <= 0.10 and not self.missions["daily_employment"]["is_completed"]:
            self.missions["daily_employment"]["is_completed"] = True
            self.add_xp(self.missions["daily_employment"]["reward_xp"])
            self.grc_balance += self.missions["daily_employment"]["reward_grc"]
            completed_missions.append("daily_employment")

        if residential_capacity >= 300 and not self.missions["expand_housing"]["is_completed"]:
            self.missions["expand_housing"]["is_completed"] = True
            self.add_xp(self.missions["expand_housing"]["reward_xp"])
            self.grc_balance += self.missions["expand_housing"]["reward_grc"]
            completed_missions.append("expand_housing")

        return {
            "level": self.level,
            "title": self.title,
            "xp": self.xp,
            "xp_next_level": self._xp_for_level(self.level),
            "grc_balance": round(self.grc_balance, 2),
            "achievements": list(self.achievements.values()),
            "missions": list(self.missions.values()),
            "newly_unlocked_achievements": unlocked_achievements,
            "newly_completed_missions": completed_missions
        }
