"""
Pydantic Data Models for GENESIS Unified World State & Command Architecture
Version: 2.0.0
"""

import uuid
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field


# ==============================================================================
# 1. ENTITY MODELS (Stable Unique Identifiers)
# ==============================================================================

class BuildingEntity(BaseModel):
    id: str
    world_id: str
    catalog_id: str
    name: str
    type: str # e.g. Residential, Commercial, Industrial, Energy, Water, Healthcare, Education
    category: str
    level: int = 1
    x: float
    y: float = 0.6
    z: float
    rotation: float = 0.0
    width: float = 2.5
    length: float = 2.5
    height: float = 4.0
    district_id: str = "dist-citadel"
    status: str = "active" # 'constructing', 'active', 'unpowered', 'unwatered', 'abandoned'
    health: float = 100.0
    efficiency: float = 1.0
    capacity_residents: int = 0
    capacity_jobs: int = 0
    current_occupants: int = 0
    current_workers: int = 0
    power_demand_mw: float = 0.0
    water_demand_t: float = 0.0
    power_connected: bool = True
    water_connected: bool = True
    construction_progress: float = 1.0
    unpowered_ticks: int = 0
    unwatered_ticks: int = 0


class RoadNodeEntity(BaseModel):
    id: str
    world_id: str
    x: float
    y: float = 0.0
    z: float
    elevation: float = 0.0
    node_type: str = "intersection" # 'intersection', 'cul_de_sac', 'transit_hub', 'roundabout_center', 'highway_portal'
    has_traffic_light: bool = False
    congestion: float = 0.0

    @property
    def type(self) -> str:
        return self.node_type


class RoadSegmentEntity(BaseModel):
    id: str
    world_id: str
    start_node_id: str
    end_node_id: str
    road_type: str = "two_lane" # 'two_lane', 'four_lane', 'highway', 'service'
    lane_count: int = 2
    speed_limit_kmh: float = 50.0
    capacity_vph: int = 600
    current_traffic: int = 0
    condition: float = 1.0
    is_one_way: bool = False
    length: float
    congestion_ratio: float = 0.0
    average_speed_kmh: float = 50.0


class ZoneTileEntity(BaseModel):
    id: str
    world_id: str
    district_id: Optional[str] = "dist-citadel"
    x: float
    z: float
    zone_type: str # 'residential_low', 'residential_high', 'commercial_low', 'commercial_high', 'industrial', 'office', 'none'
    level: int = 1
    building_id: Optional[str] = None
    land_value: float = 50.0
    desirability: float = 0.70
    power_connected: bool = True
    water_connected: bool = True


class CitizenEntity(BaseModel):
    id: str
    world_id: str
    name: str
    age: float
    life_stage: str # 'Child', 'Teen', 'Adult', 'Senior'
    household_id: str
    home_building_id: Optional[str] = None
    work_building_id: Optional[str] = None
    education_level: float = 0.6
    wealth: float = 100.0
    health: float = 0.85
    happiness: float = 0.75
    current_x: float = 0.0
    current_z: float = 0.0
    schedule_state: str = "home" # 'home', 'commuting_work', 'at_work', 'commuting_leisure', 'leisure'
    transport_mode: str = "car" # 'car', 'transit', 'walking'


class VehicleEntity(BaseModel):
    id: str
    world_id: str
    citizen_id: Optional[str] = None
    category: str = "sedan" # 'sedan', 'bus', 'truck', 'ambulance', 'police', 'fire_truck', 'service'
    origin_x: float
    origin_z: float
    dest_x: float
    dest_z: float
    current_x: float
    current_z: float
    current_y: float = 0.0
    heading_deg: float = 0.0
    current_speed_kmh: float = 40.0
    acceleration: float = 0.0
    target_lane_index: int = 0
    lane_offset: float = 0.0
    current_segment_id: Optional[str] = None
    next_target_node_id: Optional[str] = None
    route_node_ids: List[str] = Field(default_factory=list)
    progress_pct: float = 0.0
    distance_along_segment: float = 0.0
    status: str = "moving" # 'moving', 'queued', 'waiting_signal', 'yielding', 'boarding', 'accident', 'arrived'
    purpose: str = "work" # 'work', 'school', 'shop', 'leisure', 'home', 'delivery', 'emergency'
    state_badge: str = "normal" # 'normal', 'waiting_signal', 'yielding', 'siren', 'boarding', 'blocked'
    length: float = 4.2
    width: float = 1.9
    siren_active: bool = False
    passengers_count: int = 0
    dwell_ticks_remaining: int = 0
    origin_building_id: Optional[str] = None
    dest_building_id: Optional[str] = None
    owner_id: Optional[str] = None
    trip_id: Optional[str] = None
    reason_code: str = "free_flow"
    last_rule_applied: str = "cruising at speed limit"


class PedestrianEntity(BaseModel):
    id: str
    world_id: str
    citizen_id: str
    archetype: str = "casual" # 'casual', 'executive', 'medical', 'student', 'worker', 'scientist'
    current_x: float
    current_y: float = 0.0
    current_z: float
    target_x: float = 0.0
    target_z: float = 0.0
    heading_deg: float = 0.0
    speed_mps: float = 1.35
    status: str = "walking" # 'walking', 'waiting_crossing', 'boarding_bus', 'inside_building'
    purpose: str = "work"
    origin_building_id: Optional[str] = None
    dest_building_id: Optional[str] = None
    owner_id: Optional[str] = None
    trip_id: Optional[str] = None
    reason_code: str = "free_flow"
    last_rule_applied: str = "cruising at speed limit"
    current_edge_id: Optional[str] = None
    route_node_ids: List[str] = Field(default_factory=list)
    progress_pct: float = 0.0
    is_crossing: bool = False
    bus_stop_id: Optional[str] = None


# ==============================================================================
# 2. AGGREGATE NETWORK & CITY METRICS
# ==============================================================================

class UtilityNetworkState(BaseModel):
    total_power_supply_mw: float = 0.0
    total_power_demand_mw: float = 0.0
    power_deficit_mw: float = 0.0
    grid_reliability_pct: float = 100.0
    unpowered_building_ids: List[str] = Field(default_factory=list)

    total_water_supply_t: float = 0.0
    total_water_demand_t: float = 0.0
    water_deficit_t: float = 0.0
    water_reliability_pct: float = 100.0
    unwatered_building_ids: List[str] = Field(default_factory=list)

    total_sewage_capacity_t: float = 0.0
    sewage_treatment_ratio: float = 1.0


class TrafficMetricsState(BaseModel):
    active_vehicles_count: int = 0
    active_pedestrians_count: int = 0
    average_speed_kmh: float = 45.0
    traffic_flow_efficiency: float = 90.0
    congestion_index: float = 10.0
    congested_segment_ids: List[str] = Field(default_factory=list)
    average_commute_minutes: float = 22.0
    stuck_vehicles_count: int = 0
    junction_queues: Dict[str, int] = Field(default_factory=dict)
    signals_state: Dict[str, str] = Field(default_factory=dict)


class DerivedCityMetrics(BaseModel):
    population: int
    households_count: int
    residential_capacity: int
    occupancy_rate: float
    
    total_jobs: int
    employed_citizens: int
    unemployment_rate: float
    
    tax_rate: float
    daily_tax_revenue: float
    gdp: float
    gdp_growth_rate: float
    
    power_supply_mw: float
    power_demand_mw: float
    water_supply_t: float
    water_demand_t: float
    
    air_pollution_index: float
    average_happiness: float
    civic_stability: float
    protest_intensity: float


# ==============================================================================
# 3. WORLD STATE SNAPSHOT & DELTA PROTOCOL
# ==============================================================================

class WorldStateSnapshot(BaseModel):
    world_id: str
    tick: int
    year: int
    day: int
    version: int # Monotonically increasing sync sequence number
    buildings: List[BuildingEntity]
    road_nodes: List[RoadNodeEntity]
    road_segments: List[RoadSegmentEntity]
    zone_tiles: List[ZoneTileEntity]
    vehicles_sample: List[VehicleEntity]
    citizens_sample: List[CitizenEntity]
    pedestrians_sample: List[PedestrianEntity] = Field(default_factory=list)
    utilities: UtilityNetworkState
    traffic: TrafficMetricsState
    metrics: DerivedCityMetrics


class WorldStateDelta(BaseModel):
    world_id: str
    from_version: int
    to_version: int
    tick: int
    year: int
    day: int
    created_buildings: List[BuildingEntity] = Field(default_factory=list)
    updated_buildings: List[BuildingEntity] = Field(default_factory=list)
    removed_building_ids: List[str] = Field(default_factory=list)
    created_roads: List[RoadSegmentEntity] = Field(default_factory=list)
    removed_road_ids: List[str] = Field(default_factory=list)
    updated_zone_tiles: List[ZoneTileEntity] = Field(default_factory=list)
    active_vehicles: List[VehicleEntity] = Field(default_factory=list)
    active_pedestrians: List[PedestrianEntity] = Field(default_factory=list)
    metrics: DerivedCityMetrics
    utilities: UtilityNetworkState
    traffic: TrafficMetricsState


# ==============================================================================
# 4. UNIFIED COMMAND ARCHITECTURE (POST /api/v1/worlds/{id}/commands)
# ==============================================================================

class WorldCommand(BaseModel):
    command_id: str = Field(default_factory=lambda: f"cmd_{uuid.uuid4().hex[:12]}")
    action: str # 'place_building', 'demolish_building', 'paint_zone', 'draw_road', 'remove_road', 'set_tax_rate', 'set_budget', 'set_policy'
    payload: Dict[str, Any]
    client_timestamp: Optional[str] = None


class CommandResult(BaseModel):
    command_id: str
    action: str
    status: str # 'accepted', 'rejected'
    reason: Optional[str] = None
    deducted_resources: Dict[str, float] = Field(default_factory=dict)
    refunded_resources: Dict[str, float] = Field(default_factory=dict)
    entity_id: Optional[str] = None
    state_version: int


class CommandBatchRequest(BaseModel):
    commands: List[WorldCommand]


class CommandBatchResponse(BaseModel):
    world_id: str
    batch_status: str # 'success', 'partial_rejection', 'failed'
    results: List[CommandResult]
    new_version: int
    latest_metrics: Optional[DerivedCityMetrics] = None


class ActionLogEntry(BaseModel):
    id: str
    world_id: str
    user_id: Optional[str] = None
    action_type: str
    entity_id: Optional[str] = None
    details: Dict[str, Any]
    created_at: str
