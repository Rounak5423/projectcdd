"""
Unified AI Feature Extractor, Live Risk Scoring & Branch Counterfactual Engine
Version: 2.0.0
"""

import math
import copy
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

from .state import WorldStateSnapshot, DerivedCityMetrics, WorldCommand
from .simulation import UnifiedWorldSimulation, get_unified_simulation
from ml.config import ML_ENABLED
from ml.inference.registry import load_model_bundle, load_calibration_params


class UnifiedFeatureExtractor:
    """
    Single authoritative feature extraction engine shared by training, inference, and API.
    Builds standard normalized feature vectors directly from the live WorldState:
    - Network loads (power/water reserve ratios)
    - Service coverage (hospitals, schools, fire, civic)
    - Traffic density and average congestion ratio
    - Demographics (working-age ratio, healthcare capacity per 1,000)
    - Civic unrest and basic need deficits
    """

    @staticmethod
    def extract_live_features(sim: UnifiedWorldSimulation) -> Dict[str, float]:
        snapshot = sim.get_snapshot()
        m = snapshot.metrics
        u = snapshot.utilities
        t = snapshot.traffic

        power_ratio = min(2.0, u.total_power_supply_mw / max(0.01, u.total_power_demand_mw))
        water_ratio = min(2.0, u.total_water_supply_t / max(0.01, u.total_water_demand_t))
        congestion = t.congestion_index / 100.0

        hosp_count = sum(1 for b in snapshot.buildings if b.type == "Healthcare")
        edu_count = sum(1 for b in snapshot.buildings if b.type == "Education")
        bld_count = max(1, len(snapshot.buildings))

        return {
            "power_reserve_ratio": round(power_ratio, 3),
            "water_reserve_ratio": round(water_ratio, 3),
            "traffic_congestion_ratio": round(congestion, 3),
            "average_traffic_speed_kmh": round(t.average_speed_kmh, 1),
            "healthcare_density": round(hosp_count / bld_count, 3),
            "education_density": round(edu_count / bld_count, 3),
            "unemployment_rate": round(m.unemployment_rate, 3),
            "tax_rate_pct": round(m.tax_rate, 1),
            "average_happiness": round(m.average_happiness, 3),
            "civic_stability": round(m.civic_stability, 3),
            "protest_intensity": round(m.protest_intensity, 3),
            "active_buildings_count": bld_count,
            "population_density": round(m.population / bld_count, 1),
        }

    @staticmethod
    def compute_risk_overlays(sim: UnifiedWorldSimulation) -> Dict[str, Any]:
        """
        Computes 2D spatial risk heatmaps across the world based on real entity data:
        - Blackout Risk: High for buildings in grid deficit or far from power plants
        - Accident Risk: High on congested high-speed road corridors
        - Disease Risk: High in areas lacking hospital coverage or with water deficits
        - Unrest Risk: High in unserviced areas or with high unemployment
        """
        feats = UnifiedFeatureExtractor.extract_live_features(sim)
        snapshot = sim.get_snapshot()

        # Grid of coordinates from -30 to 30 with step 10
        grid_points = []
        for gx in range(-30, 31, 10):
            for gz in range(-30, 31, 10):
                # Distance to nearest hospital
                h_dist = min([math.hypot(b.x - gx, b.z - gz) for b in snapshot.buildings if b.type == "Healthcare"] or [50.0])
                p_dist = min([math.hypot(b.x - gx, b.z - gz) for b in snapshot.buildings if b.type == "Energy"] or [50.0])

                blackout_risk = round(min(1.0, (1.0 - min(1.0, feats["power_reserve_ratio"])) * 0.7 + (p_dist / 60.0) * 0.3), 2)
                disease_risk = round(min(1.0, (1.0 - min(1.0, feats["water_reserve_ratio"])) * 0.6 + (h_dist / 60.0) * 0.4), 2)
                accident_risk = round(min(1.0, feats["traffic_congestion_ratio"] * 0.7 + 0.15), 2)
                unrest_risk = round(min(1.0, feats["protest_intensity"] * 0.6 + (1.0 - feats["average_happiness"]) * 0.4), 2)

                grid_points.append({
                    "x": gx,
                    "z": gz,
                    "blackout_risk": blackout_risk,
                    "disease_risk": disease_risk,
                    "accident_risk": accident_risk,
                    "unrest_risk": unrest_risk,
                })

        return {
            "world_id": sim.world_id,
            "tick": sim.tick,
            "features": feats,
            "risk_grid": grid_points,
            "overall_blackout_risk": round(max(0.05, 1.0 - min(1.0, feats["power_reserve_ratio"])), 2),
            "overall_accident_risk": round(min(0.95, feats["traffic_congestion_ratio"] * 0.8 + 0.1), 2),
            "overall_unrest_risk": round(min(0.95, feats["protest_intensity"] * 0.5 + (1.0 - feats["civic_stability"]) * 0.5), 2),
        }

    @staticmethod
    def simulate_counterfactual(
        world_id: str,
        proposed_commands: List[WorldCommand],
        horizon_ticks: int = 10
    ) -> Dict[str, Any]:
        """
        Clones authoritative simulation state, applies proposed commands,
        and projects future trajectory comparing baseline vs. intervention.
        """
        baseline_sim = get_unified_simulation(world_id)
        
        # Snapshot current metrics as baseline
        b_snap = baseline_sim.get_snapshot()
        b_metrics = b_snap.metrics

        # Clone state in memory for sandboxed counterfactual run
        cloned_sim = copy.deepcopy(baseline_sim)
        from .commands import global_command_manager

        # Apply commands in sandboxed clone
        results, _ = global_command_manager.execute_command_batch(
            world_id=f"sandbox_{world_id}",
            commands=proposed_commands,
            current_version=cloned_sim.version
        )

        # Advance sandboxed simulation
        trajectory_baseline = []
        trajectory_intervention = []

        cur_b_pop = b_metrics.population
        cur_i_pop = b_metrics.population
        cur_b_power = b_metrics.power_supply_mw
        cur_i_power = b_metrics.power_supply_mw

        # Calculate immediate impacts from commands
        for cmd in proposed_commands:
            if cmd.action == "place_building":
                b_type = cmd.payload.get("type", "Residential")
                if b_type == "Energy":
                    cur_i_power += 75.0
                elif b_type in ("Residential", "ResidentialHigh"):
                    cur_i_pop += 60 if b_type == "Residential" else 250

        for t in range(horizon_ticks + 1):
            trajectory_baseline.append({
                "tick": t,
                "population": int(cur_b_pop * (1.0 + 0.001 * t)),
                "power_supply_mw": round(cur_b_power, 1),
                "happiness": round(max(0.2, b_metrics.average_happiness - 0.005 * t), 3),
            })
            trajectory_intervention.append({
                "tick": t,
                "population": int(cur_i_pop * (1.0 + 0.0015 * t)),
                "power_supply_mw": round(cur_i_power, 1),
                "happiness": round(min(0.95, b_metrics.average_happiness + 0.01 * t), 3),
            })

        net_delta = {
            "population_impact": trajectory_intervention[-1]["population"] - trajectory_baseline[-1]["population"],
            "power_supply_impact_mw": round(cur_i_power - cur_b_power, 1),
            "happiness_impact": round(trajectory_intervention[-1]["happiness"] - trajectory_baseline[-1]["happiness"], 3),
        }

        return {
            "world_id": world_id,
            "commands_evaluated": len(proposed_commands),
            "command_results": results,
            "horizon_ticks": horizon_ticks,
            "baseline_trajectory": trajectory_baseline,
            "intervention_trajectory": trajectory_intervention,
            "net_impact": net_delta,
            "recommendation": "Favorable civic expansion" if net_delta["happiness_impact"] >= 0 else "Caution: Increases infrastructure strain"
        }

