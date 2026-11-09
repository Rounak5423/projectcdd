"""
Unified Utility Networks Engine: Power Grid Flow, Water Pressure & Shortages
Version: 2.0.0
"""

import math
from typing import Dict, List, Set, Tuple, Any

from .state import BuildingEntity, UtilityNetworkState


class UnifiedUtilityNetwork:
    """
    Simulates physical infrastructure grids:
    - Electrical Power Transmission & Generation
    - Water Supply Pressure & Consumption
    - Identifies blackout / dry buildings and updates operational status
    """

    def __init__(self, world_id: str = "aurora-prime", transmission_range: float = 35.0):
        self.world_id = world_id
        self.transmission_range = transmission_range

    def solve_networks(
        self,
        buildings: List[BuildingEntity],
        road_network: Optional[Any] = None,
        ticks: int = 1
    ) -> Tuple[UtilityNetworkState, List[BuildingEntity]]:
        """
        Solves utility grid connectivity and capacity balancing:
        1. Identifies power generators and water sources.
        2. Determines grid connectivity via graph BFS across road network & transmission infrastructure.
        3. Allocates available capacity, computes sewage treatment ratio, and flags brownouts / shortages.
        """
        power_plants = [b for b in buildings if b.type == "Energy" and b.status != "abandoned"]
        water_facilities = [b for b in buildings if (b.type == "Water" or "water" in b.type.lower() or "hydro" in b.name.lower()) and b.status != "abandoned"]

        # Base municipal infrastructure reserve ensures initial towns have baseline water flow
        base_water = 50.0 if not water_facilities else 0.0

        total_power_supply = sum(
            75.0 * (b.level * 0.8 + 0.2) * b.efficiency for b in power_plants
        )
        total_water_supply = base_water + sum(
            80.0 * (b.level * 0.8 + 0.2) * b.efficiency for b in water_facilities
        )

        total_power_demand = sum(b.power_demand_mw for b in buildings)
        total_water_demand = sum(b.water_demand_t for b in buildings)

        connected_power_ids: Set[str] = set()
        connected_water_ids: Set[str] = set()

        if road_network and getattr(road_network, "nodes", None) and len(road_network.nodes) > 0:
            # -------------------------------------------------------------
            # Graph BFS Network Solving via Authoritative Road/Utility Graph
            # -------------------------------------------------------------
            # 1. Power Graph BFS
            powered_nodes: Set[str] = set()
            for p in power_plants:
                connected_power_ids.add(p.id)
                n_id = road_network.find_nearest_node(p.x, p.z)
                if n_id:
                    d = math.hypot(road_network.nodes[n_id].x - p.x, road_network.nodes[n_id].z - p.z)
                    if d <= 35.0:
                        powered_nodes.add(n_id)

            p_queue = list(powered_nodes)
            while p_queue:
                curr = p_queue.pop(0)
                for edge in road_network.adjacency.get(curr, []):
                    target = edge["target"]
                    if target not in powered_nodes:
                        powered_nodes.add(target)
                        p_queue.append(target)

            # 2. Water Graph BFS
            watered_nodes: Set[str] = set()
            for w in water_facilities:
                connected_water_ids.add(w.id)
                n_id = road_network.find_nearest_node(w.x, w.z)
                if n_id:
                    d = math.hypot(road_network.nodes[n_id].x - w.x, road_network.nodes[n_id].z - w.z)
                    if d <= 35.0:
                        watered_nodes.add(n_id)

            w_queue = list(watered_nodes)
            while w_queue:
                curr = w_queue.pop(0)
                for edge in road_network.adjacency.get(curr, []):
                    target = edge["target"]
                    if target not in watered_nodes:
                        watered_nodes.add(target)
                        w_queue.append(target)

            # Map buildings to grid via road graph reachability
            for b in buildings:
                is_pioneer = "Pioneer" in b.name or "Auto Habitation" in b.name or "Frontier Colony" in b.name
                if b.type == "Energy" or is_pioneer:
                    connected_power_ids.add(b.id)
                else:
                    # Direct proximity check to plant
                    is_p_near = any(math.hypot(b.x - p.x, b.z - p.z) <= 15.0 for p in power_plants)
                    if is_p_near:
                        connected_power_ids.add(b.id)
                    elif powered_nodes:
                        bn_id = road_network.find_nearest_node(b.x, b.z)
                        if bn_id and bn_id in powered_nodes:
                            dist = math.hypot(road_network.nodes[bn_id].x - b.x, road_network.nodes[bn_id].z - b.z)
                            if dist <= 25.0:
                                connected_power_ids.add(b.id)

                if b.type == "Water" or is_pioneer or (not water_facilities and base_water > 0):
                    connected_water_ids.add(b.id)
                else:
                    is_w_near = any(math.hypot(b.x - w.x, b.z - w.z) <= 15.0 for w in water_facilities)
                    if is_w_near:
                        connected_water_ids.add(b.id)
                    elif watered_nodes:
                        bn_id = road_network.find_nearest_node(b.x, b.z)
                        if bn_id and bn_id in watered_nodes:
                            dist = math.hypot(road_network.nodes[bn_id].x - b.x, road_network.nodes[bn_id].z - b.z)
                            if dist <= 25.0:
                                connected_water_ids.add(b.id)
        else:
            # Spatial proximity BFS fallback if no road network loaded
            if power_plants:
                power_queue = [p.id for p in power_plants]
                connected_power_ids.update(power_queue)
                b_map = {b.id: b for b in buildings}

                while power_queue:
                    curr_id = power_queue.pop(0)
                    curr_b = b_map.get(curr_id)
                    if not curr_b:
                        continue
                    for other_b in buildings:
                        if other_b.id not in connected_power_ids:
                            dist = math.hypot(other_b.x - curr_b.x, other_b.z - curr_b.z)
                            if dist <= self.transmission_range:
                                connected_power_ids.add(other_b.id)
                                power_queue.append(other_b.id)

            if water_facilities or base_water > 0:
                water_queue = [w.id for w in water_facilities]
                connected_water_ids.update(water_queue)
                b_map = {b.id: b for b in buildings}

                while water_queue:
                    curr_id = water_queue.pop(0)
                    curr_b = b_map.get(curr_id)
                    if not curr_b:
                        continue
                    for other_b in buildings:
                        if other_b.id not in connected_water_ids:
                            dist = math.hypot(other_b.x - curr_b.x, other_b.z - curr_b.z)
                            if dist <= self.transmission_range:
                                connected_water_ids.add(other_b.id)
                                water_queue.append(other_b.id)
                if not water_facilities and base_water > 0:
                    connected_water_ids.update(b.id for b in buildings)

        power_deficit = max(0.0, total_power_demand - total_power_supply)
        water_deficit = max(0.0, total_water_demand - total_water_supply)

        unpowered: List[str] = []
        unwatered: List[str] = []

        # If there is a capacity deficit, buildings furthest from sources experience rationing
        power_ratio = min(1.0, total_power_supply / max(0.01, total_power_demand)) if total_power_demand > 0 else 1.0
        water_ratio = min(1.0, total_water_supply / max(0.01, total_water_demand)) if total_water_demand > 0 else 1.0

        for b in buildings:
            # Power check
            is_physically_connected = b.id in connected_power_ids or b.type == "Energy"
            has_capacity = power_ratio >= 0.85
            if not is_physically_connected or not has_capacity:
                b.power_connected = False
                b.unpowered_ticks += ticks
                unpowered.append(b.id)
            else:
                b.power_connected = True
                b.unpowered_ticks = 0

            # Water check
            is_water_connected = b.id in connected_water_ids or b.type == "Water"
            has_water_capacity = water_ratio >= 0.85
            if not is_water_connected or not has_water_capacity:
                b.water_connected = False
                b.unwatered_ticks += ticks
                unwatered.append(b.id)
            else:
                b.water_connected = True
                b.unwatered_ticks = 0

            # Status and efficiency update
            if not b.power_connected and not b.water_connected:
                b.status = "unpowered"
                b.efficiency = 0.20
            elif not b.power_connected:
                b.status = "unpowered"
                b.efficiency = 0.40
            elif not b.water_connected:
                b.status = "unwatered"
                b.efficiency = 0.60
            elif b.status in ("unpowered", "unwatered"):
                b.status = "active"
                b.efficiency = 1.0

            # Abandonment if unserviced for too long
            if b.unpowered_ticks >= 5 or b.unwatered_ticks >= 5:
                if b.type not in ("Civic", "Energy", "Water"):
                    b.status = "abandoned"
                    b.efficiency = 0.05

        # Sewage Treatment Calculation
        sewage_facilities = [b for b in buildings if ("sewage" in b.type.lower() or "treatment" in b.name.lower() or "water" in b.type.lower()) and b.status != "abandoned"]
        total_sewage_cap = sum(80.0 * (b.level * 0.8 + 0.2) * b.efficiency for b in sewage_facilities) + base_water
        sewage_treatment_ratio = min(1.0, total_sewage_cap / max(0.01, total_water_demand)) if total_water_demand > 0 else 1.0

        grid_reliability = round(100.0 * (1.0 - (len(unpowered) / max(1, len(buildings)))), 1)
        water_reliability = round(100.0 * (1.0 - (len(unwatered) / max(1, len(buildings)))), 1)

        util_state = UtilityNetworkState(
            total_power_supply_mw=round(total_power_supply, 2),
            total_power_demand_mw=round(total_power_demand, 2),
            power_deficit_mw=round(power_deficit, 2),
            grid_reliability_pct=grid_reliability,
            unpowered_building_ids=unpowered,
            total_water_supply_t=round(total_water_supply, 2),
            total_water_demand_t=round(total_water_demand, 2),
            water_deficit_t=round(water_deficit, 2),
            water_reliability_pct=water_reliability,
            unwatered_building_ids=unwatered,
            total_sewage_capacity_t=round(total_sewage_cap, 2),
            sewage_treatment_ratio=round(sewage_treatment_ratio, 3),
        )

        return util_state, buildings
