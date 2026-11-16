"""
GENESIS Engine v2.0 - Infrastructure Subsystem Module
Module: engine.modules.infrastructure
Building lifecycles (construction, upgrades, maintenance, abandonment, recovery),
real utility networks (Power, Water, Sewage, Waste) as graphs with outage propagation,
and Road Network graph topology.
"""

from typing import Dict, List, Optional, Any, Tuple
from engine.world.utility_network import UnifiedUtilityNetwork
from engine.world.road_network import UnifiedRoadNetwork
from engine.world.state import BuildingEntity, UtilityNetworkState


class InfrastructureModule:
    """
    Manages the physical built environment of the civilization:
    buildings, road networks, and graph-based utility distribution.
    """
    def __init__(self, world_id: str):
        self.world_id = world_id
        self.utility_engine = UnifiedUtilityNetwork(world_id)
        self.road_network = UnifiedRoadNetwork(world_id)
        self.sewage_treatment_capacity: float = 5000.0
        self.waste_processing_capacity: float = 2000.0

    def step(
        self,
        ticks: int,
        buildings: Dict[str, BuildingEntity],
        current_tax_rate: float,
        policy_multipliers: Optional[Dict[str, float]] = None
    ) -> Tuple[UtilityNetworkState, List[BuildingEntity], Dict[str, Any]]:
        """
        Executes utility graph BFS distribution, outage propagation,
        building lifecycle state transitions (abandonment / recovery / upgrades).
        """
        if policy_multipliers is None:
            policy_multipliers = {}

        building_list = list(buildings.values())

        # 1. Solve Utility Flow BFS over Road Topology
        util_state, updated_buildings = self.utility_engine.solve_networks(
            building_list,
            self.road_network,
            ticks=ticks
        )

        # Update buildings dict with solved utility flags
        for ub in updated_buildings:
            buildings[ub.id] = ub

        # 2. Lifecycle Updates: Abandonment and Recovery
        recovered_count = 0
        abandoned_count = 0
        upgraded_count = 0

        for b in buildings.values():
            is_civic = b.type in ("Civic", "Energy", "Water", "Government", "Healthcare", "Education") or "Pioneer" in b.name

            # Prolonged outage or excessive tax abandonment
            if not is_civic and (b.unpowered_ticks >= 5 or b.unwatered_ticks >= 5 or current_tax_rate > 0.25):
                if b.status != "abandoned":
                    b.status = "abandoned"
                    b.efficiency = 0.05
                    b.current_occupants = 0
                    b.current_workers = 0
                    abandoned_count += 1
            elif b.status == "abandoned" and b.power_connected and b.water_connected and current_tax_rate <= 0.25:
                # Recovery
                b.status = "active"
                b.efficiency = 1.0
                b.unpowered_ticks = 0
                b.unwatered_ticks = 0
                recovered_count += 1

            # Upgrade check (high efficiency & sustained occupancy)
            if b.status == "active" and b.level < 5 and b.power_connected and b.water_connected:
                has_high_occ = (b.capacity_residents > 0 and b.current_occupants >= int(b.capacity_residents * 0.85)) or \
                               (b.capacity_jobs > 0 and b.current_workers >= int(b.capacity_jobs * 0.85))
                if has_high_occ and b.efficiency >= 0.90:
                    b.level += 1
                    b.height = round(b.height * 1.20, 1)
                    if b.capacity_residents > 0:
                        b.capacity_residents = int(b.capacity_residents * 1.25)
                    if b.capacity_jobs > 0:
                        b.capacity_jobs = int(b.capacity_jobs * 1.25)
                    upgraded_count += 1

        # 3. Sewage and Waste Metrics
        active_occupants = sum(b.current_occupants for b in buildings.values() if b.status != "abandoned")
        active_workers = sum(b.current_workers for b in buildings.values() if b.status != "abandoned")
        sewage_load = (active_occupants * 0.10 + active_workers * 0.05) * ticks
        sewage_ratio = min(1.0, self.sewage_treatment_capacity / max(1.0, sewage_load))
        util_state.sewage_treatment_ratio = round(sewage_ratio, 3)

        infra_summary = {
            "total_buildings": len(buildings),
            "active_buildings": len([b for b in buildings.values() if b.status == "active"]),
            "abandoned_buildings": len([b for b in buildings.values() if b.status == "abandoned"]),
            "unpowered_buildings_count": len(util_state.unpowered_building_ids),
            "unwatered_buildings_count": len(util_state.unwatered_building_ids),
            "grid_reliability_pct": util_state.grid_reliability_pct,
            "water_reliability_pct": util_state.water_reliability_pct,
            "abandoned_this_step": abandoned_count,
            "recovered_this_step": recovered_count,
            "upgraded_this_step": upgraded_count,
            "sewage_treatment_ratio": util_state.sewage_treatment_ratio
        }

        return util_state, list(buildings.values()), infra_summary
