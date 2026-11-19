"""
GENESIS Engine v2.0 - Movement Contract Specification
Module: engine.modules.movement_contract

Defines authoritative contracts, states, reasons, and audit schemas for every
moving agent (vehicles and pedestrians) in the simulation.
Enforces:
1. Stable entity and owner IDs.
2. Valid origin and destination buildings/nodes.
3. Explicit state machine transitions.
4. Mandatory reason codes for speed adjustments and wait states.
5. Full explainability endpoint schema.
"""

from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field, asdict
import time


class MoverType(str, Enum):
    VEHICLE = "vehicle"
    PEDESTRIAN = "pedestrian"


class MoverCategory(str, Enum):
    # Vehicles
    SEDAN = "sedan"
    BUS = "bus"
    TRUCK = "truck"
    AMBULANCE = "ambulance"
    FIRE_TRUCK = "fire_truck"
    POLICE = "police"
    GARBAGE = "garbage"
    SERVICE = "service"
    # Pedestrians
    ADULT = "adult"
    CHILD = "child"
    ELDER = "elder"
    STUDENT = "student"
    WORKER = "worker"


class MoverPurpose(str, Enum):
    WORK = "work"
    SCHOOL = "school"
    SHOP = "shop"
    LEISURE = "leisure"
    HOME = "home"
    DELIVERY = "delivery"
    HOSPITAL = "hospital"
    EMERGENCY = "emergency"
    SERVICE = "service"


class MoverState(str, Enum):
    PARKED = "parked"
    DEPARTING = "departing"
    DRIVING = "driving"
    QUEUING = "queuing"
    YIELDING = "yielding"
    WAITING_SIGNAL = "waiting_signal"
    BOARDING = "boarding"
    ALIGHTING = "alighting"
    LOADING = "loading"
    BLOCKED = "blocked"
    REROUTING = "rerouting"
    ARRIVED = "arrived"
    DESPAWNED = "despawned"


@dataclass
class TripContract:
    """Every vehicle and pedestrian movement MUST have an active TripContract."""
    trip_id: str
    entity_id: str
    owner_id: str                          # citizen_id, company_id, service_id
    purpose: MoverPurpose
    origin_id: str                         # building_id, parking_id, transit_stop_id
    dest_id: str                           # building_id, transit_stop_id
    origin_coords: Tuple[float, float, float]
    dest_coords: Tuple[float, float, float]
    departure_tick: int                    # Simulation hour of departure
    departure_second: float = 0.0          # Second offset within the hour
    route_node_ids: List[str] = field(default_factory=list)
    route_segment_ids: List[str] = field(default_factory=list)
    distance_meters: float = 0.0
    estimated_travel_time_sec: float = 0.0
    actual_travel_time_sec: float = 0.0
    completed: bool = False

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["purpose"] = self.purpose.value if isinstance(self.purpose, MoverPurpose) else str(self.purpose)
        return d


@dataclass
class MovementExplanation:
    """Payload for GET /api/v1/worlds/{id}/entities/{entity_id}/explain."""
    entity_id: str
    entity_type: MoverType
    category: MoverCategory
    owner_id: str
    current_state: MoverState
    reason_code: str
    last_rule_applied: str
    current_speed_kmh: float
    target_speed_kmh: float
    current_coords: Tuple[float, float, float]
    heading_deg: float
    trip: Optional[Dict[str, Any]] = None
    route: List[str] = field(default_factory=list)
    leader_entity_id: Optional[str] = None
    gap_to_leader_m: Optional[float] = None
    junction_id: Optional[str] = None
    signal_phase: Optional[str] = None
    updated_at_sim_tick: int = 0
    updated_at_sim_second: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entity_id": self.entity_id,
            "entity_type": self.entity_type.value if isinstance(self.entity_type, MoverType) else str(self.entity_type),
            "category": self.category.value if isinstance(self.category, MoverCategory) else str(self.category),
            "owner_id": self.owner_id,
            "current_state": self.current_state.value if isinstance(self.current_state, MoverState) else str(self.current_state),
            "reason_code": self.reason_code,
            "last_rule_applied": self.last_rule_applied,
            "current_speed_kmh": round(self.current_speed_kmh, 1),
            "target_speed_kmh": round(self.target_speed_kmh, 1),
            "current_coords": [round(c, 2) for c in self.current_coords],
            "heading_deg": round(self.heading_deg, 1),
            "trip": self.trip,
            "route": self.route,
            "leader_entity_id": self.leader_entity_id,
            "gap_to_leader_m": round(self.gap_to_leader_m, 2) if self.gap_to_leader_m is not None else None,
            "junction_id": self.junction_id,
            "signal_phase": self.signal_phase,
            "updated_at_sim_tick": self.updated_at_sim_tick,
            "updated_at_sim_second": round(self.updated_at_sim_second, 2),
        }
