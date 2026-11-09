/**
 * TypeScript Interfaces for Unified World State, Entities, Commands & Sync Protocol
 * Version: 2.0.0
 */

export interface BuildingEntity {
  id: string;
  world_id: string;
  catalog_id: string;
  name: string;
  type: string;
  category: string;
  level: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
  width: number;
  length: number;
  height: number;
  district_id: string;
  status: 'constructing' | 'active' | 'unpowered' | 'unwatered' | 'abandoned';
  health: number;
  efficiency: number;
  capacity_residents: number;
  capacity_jobs: number;
  current_occupants: number;
  current_workers: number;
  power_demand_mw: number;
  water_demand_t: number;
  power_connected: boolean;
  water_connected: boolean;
  construction_progress: number;
  unpowered_ticks: number;
  unwatered_ticks: number;
}

export interface RoadNodeEntity {
  id: string;
  world_id: string;
  x: number;
  y: number;
  z: number;
  elevation: number;
  node_type: string;
  has_traffic_light: boolean;
  congestion: number;
}

export interface RoadSegmentEntity {
  id: string;
  world_id: string;
  start_node_id: string;
  end_node_id: string;
  road_type: string;
  lane_count: number;
  speed_limit_kmh: number;
  capacity_vph: number;
  current_traffic: number;
  condition: number;
  is_one_way: boolean;
  length: number;
  congestion_ratio: number;
  average_speed_kmh: number;
}

export interface ZoneTileEntity {
  id: string;
  world_id: string;
  district_id: string;
  x: number;
  z: number;
  zone_type: string;
  level: number;
  building_id?: string | null;
  land_value: number;
  desirability: number;
  power_connected: boolean;
  water_connected: boolean;
}

export interface VehicleEntity {
  id: string;
  world_id: string;
  citizen_id?: string | null;
  category: string;
  origin_x: number;
  origin_z: number;
  dest_x: number;
  dest_z: number;
  current_x: number;
  current_z: number;
  heading_deg: number;
  current_speed_kmh: number;
  route_node_ids: string[];
  progress_pct: number;
  status: 'moving' | 'queued' | 'accident' | 'arrived';
}

export interface UtilityNetworkState {
  total_power_supply_mw: number;
  total_power_demand_mw: number;
  power_deficit_mw: number;
  grid_reliability_pct: number;
  unpowered_building_ids: string[];
  total_water_supply_t: number;
  total_water_demand_t: number;
  water_deficit_t: number;
  water_reliability_pct: number;
  unwatered_building_ids: string[];
}

export interface TrafficMetricsState {
  active_vehicles_count: number;
  average_speed_kmh: number;
  traffic_flow_efficiency: number;
  congestion_index: number;
  congested_segment_ids: string[];
  average_commute_minutes?: number;
}

export interface DerivedCityMetrics {
  population: number;
  households_count: number;
  residential_capacity: number;
  occupancy_rate: number;
  total_jobs: number;
  employed_citizens: number;
  unemployment_rate: number;
  tax_rate: number;
  daily_tax_revenue: number;
  gdp: number;
  gdp_growth_rate: number;
  power_supply_mw: number;
  power_demand_mw: number;
  water_supply_t: number;
  water_demand_t: number;
  air_pollution_index: number;
  average_happiness: number;
  civic_stability: number;
  protest_intensity: number;
}

export interface WorldStateSnapshot {
  world_id: string;
  tick: number;
  year: number;
  day: number;
  version: number;
  buildings: BuildingEntity[];
  road_nodes: RoadNodeEntity[];
  road_segments: RoadSegmentEntity[];
  zone_tiles: ZoneTileEntity[];
  vehicles_sample: VehicleEntity[];
  utilities: UtilityNetworkState;
  traffic: TrafficMetricsState;
  metrics: DerivedCityMetrics;
}

export interface WorldCommand {
  command_id?: string;
  action: 'place_building' | 'demolish_building' | 'paint_zone' | 'draw_road' | 'remove_road' | 'set_tax_rate' | 'set_budget' | 'set_policy';
  payload: Record<string, any>;
  client_timestamp?: string;
}

export interface CommandResult {
  command_id: string;
  action: string;
  status: 'accepted' | 'rejected';
  reason?: string;
  deducted_resources?: Record<string, number>;
  refunded_resources?: Record<string, number>;
  entity_id?: string;
  state_version: number;
}

export interface CommandBatchResponse {
  world_id: string;
  batch_status: 'success' | 'partial_rejection' | 'failed';
  results: CommandResult[];
  new_version: number;
  latest_metrics?: DerivedCityMetrics;
}

export interface ActionLogEntry {
  id: string;
  world_id: string;
  user_id?: string | null;
  action_type: string;
  entity_id?: string | null;
  details: Record<string, any>;
  created_at: string;
}

