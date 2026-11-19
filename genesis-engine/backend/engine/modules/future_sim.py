"""
GENESIS Engine v2.0 - Future Simulation Subsystem Module
Module: engine.modules.future_sim
Sandboxed scenario branching, counterfactual projection, and comparative analysis
without modifying or corrupting the base civilization.
"""

import copy
import uuid
from typing import Dict, List, Optional, Any


class FutureSimModule:
    """
    Manages non-destructive world branching, counterfactual simulations,
    and side-by-side metric comparisons.
    """
    def __init__(self, base_world_id: str):
        self.base_world_id = base_world_id
        self.branches: Dict[str, Dict[str, Any]] = {}

    def create_scenario_branch(
        self,
        branch_name: str,
        current_state_dict: Dict[str, Any],
        scenario_overrides: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Clones state into an isolated branch with optional parameter perturbations.
        """
        branch_id = f"branch_{self.base_world_id}_{uuid.uuid4().hex[:8]}"
        cloned_state = copy.deepcopy(current_state_dict)

        # Apply scenario overrides
        if scenario_overrides:
            if "tax_rate" in scenario_overrides:
                cloned_state.setdefault("economy", {})["tax_rate"] = scenario_overrides["tax_rate"]
            if "policies" in scenario_overrides:
                cloned_state.setdefault("governance", {})["active_policies"] = scenario_overrides["policies"]
            if "pollution_multiplier" in scenario_overrides:
                cloned_state.setdefault("environment", {})["pollution_multiplier"] = scenario_overrides["pollution_multiplier"]

        self.branches[branch_id] = {
            "branch_id": branch_id,
            "branch_name": branch_name,
            "base_world_id": self.base_world_id,
            "base_tick": cloned_state.get("tick", 0),
            "state": cloned_state,
            "overrides": scenario_overrides or {}
        }

        return {
            "branch_id": branch_id,
            "branch_name": branch_name,
            "base_tick": cloned_state.get("tick", 0),
            "status": "created"
        }

    def compare_trajectories(
        self,
        base_metrics: Dict[str, Any],
        branch_id: str,
        branch_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates empirical diff between baseline civilization and counterfactual scenario.
        """
        pop_base = base_metrics.get("population", 1)
        pop_branch = branch_metrics.get("population", 1)
        gdp_base = base_metrics.get("gdp", 1.0)
        gdp_branch = branch_metrics.get("gdp", 1.0)
        happ_base = base_metrics.get("average_happiness", 0.5)
        happ_branch = branch_metrics.get("average_happiness", 0.5)
        poll_base = base_metrics.get("composite_pollution_index", 0.1)
        poll_branch = branch_metrics.get("composite_pollution_index", 0.1)

        return {
            "branch_id": branch_id,
            "delta_population": pop_branch - pop_base,
            "delta_population_pct": round(((pop_branch - pop_base) / max(1, pop_base)) * 100.0, 2),
            "delta_gdp": round(gdp_branch - gdp_base, 2),
            "delta_gdp_pct": round(((gdp_branch - gdp_base) / max(1.0, gdp_base)) * 100.0, 2),
            "delta_happiness": round(happ_branch - happ_base, 3),
            "delta_pollution": round(poll_branch - poll_base, 3),
            "recommendation": (
                "Beneficial policy scenario" if (gdp_branch >= gdp_base and happ_branch >= happ_base)
                else "Trade-off scenario: review secondary impacts"
            )
        }
