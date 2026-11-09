"""
Gym-Style Reinforcement Learning & Control Environment for GENESIS Engine
Wraps simulation states, actions (tax, budgets, policies), and composite rewards.
Runs ONLY in isolated sandbox worlds.
"""

import os
import copy
import logging
from typing import Dict, Any, Tuple, Optional
import numpy as np

from ..config import REALISM_GUARDRAILS, RANDOM_SEED
from engine.state import WorldStateManager
from engine.simulation import step_world

logger = logging.getLogger("genesis.ml.control")


class GenesisEnv:
    """
    Gym-style environment interface for policy optimization and control.
    Action Space:
    - tax_rate: float in [0.05, 0.40]
    - healthcare_budget_pct: float in [0.05, 0.40]
    - education_budget_pct: float in [0.05, 0.40]
    - universal_basic_income: bool
    - cognitive_scaffolding: bool
    - green_energy_subsidy: bool

    Observation Space:
    - [population_norm, gdp_norm, gini, civic_stability, happiness, pollution, treasury_norm]
    """
    def __init__(
        self,
        world_id: str = "sandbox_eval",
        seed: int = RANDOM_SEED,
        max_steps: int = 10,
        reward_weights: Optional[Dict[str, float]] = None
    ):
        self.world_id = f"sandbox_{world_id}"
        self.seed = seed
        self.max_steps = max_steps
        self.current_step = 0
        self.mgr = WorldStateManager()
        self.world = None
        
        # Configurable composite reward weights
        self.reward_weights = reward_weights or {
            "wellbeing": 0.35,
            "civic_stability": 0.25,
            "equality": 0.20,       # Rewards low Gini: (1.0 - gini)
            "budget_health": 0.10,  # Rewards sustainable non-negative treasury
            "low_pollution": 0.10   # Rewards low pollution: (1.0 - pollution)
        }

    def reset(self, seed: Optional[int] = None) -> np.ndarray:
        """Resets or creates an isolated sandbox universe."""
        if seed is not None:
            self.seed = seed
        self.current_step = 0
        self.world = self.mgr.create(name=f"SandboxUniverse_{self.seed}", population=60, seed=self.seed)
        # Mark as explicit sandbox world
        self.world.parent_world_id = "sandbox_root"
        return self.observe()

    def observe(self) -> np.ndarray:
        """Constructs normalized state observation vector."""
        if not self.world:
            return np.zeros(7, dtype=np.float32)

        pop = float(self.world.population_count) / 1000.0
        gdp = float(self.world.resources.food * 50.0 + self.world.resources.energy * 80.0) / 100000.0
        gini = float(self.world.economy.gini)
        stability = float(self.world.economy.civic_stability)
        wellbeing = float(sum(c.needs.wellbeing for c in self.world.citizens) / max(1, len(self.world.citizens)))
        pollution = 0.12
        treasury = float(self.world.economy.average_wealth * len(self.world.citizens)) / 50000.0

        return np.array([pop, gdp, gini, stability, wellbeing, pollution, treasury], dtype=np.float32)

    def step(self, action: Dict[str, Any]) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
        """
        Applies policy action, steps simulation forward, and computes composite reward.
        """
        if not self.world:
            raise RuntimeError("Environment must be reset before calling step().")

        self.current_step += 1

        # 1. Apply bounded action controls
        tax_rate = float(np.clip(action.get("tax_rate", 0.15), 0.05, 0.40))
        for p_key in ["universal_basic_income", "cognitive_scaffolding", "green_energy_subsidy"]:
            if p_key in action and p_key in self.world.policies:
                self.world.policies[p_key].active = bool(action[p_key])

        # 2. Advance simulation ticks (1 epoch = 5 ticks)
        step_world(self.world, ticks=5)

        # 3. Observe new state
        obs = self.observe()
        pop_norm, gdp_norm, gini, stability, wellbeing, pollution, treasury_norm = obs

        # 4. Compute composite reward
        w = self.reward_weights
        r_wellbeing = w["wellbeing"] * wellbeing
        r_stability = w["civic_stability"] * stability
        r_equality = w["equality"] * (1.0 - gini)
        r_budget = w["budget_health"] * float(np.clip(treasury_norm, 0.0, 1.5))
        r_pollution = w["low_pollution"] * (1.0 - pollution)

        reward = float(r_wellbeing + r_stability + r_equality + r_budget + r_pollution)

        terminated = self.current_step >= self.max_steps
        truncated = False
        info = {
            "step": self.current_step,
            "wellbeing": wellbeing,
            "civic_stability": stability,
            "gini": gini,
            "reward_components": {
                "r_wellbeing": r_wellbeing,
                "r_stability": r_stability,
                "r_equality": r_equality,
                "r_budget": r_budget,
                "r_pollution": r_pollution
            }
        }
        return obs, reward, terminated, truncated, info

