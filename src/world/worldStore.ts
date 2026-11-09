/**
 * Authoritative Client-Side World Store with Version Reconciliation & Optimistic Commands
 * Version: 2.0.0
 */

import {
  WorldStateSnapshot,
  BuildingEntity,
  RoadSegmentEntity,
  ZoneTileEntity,
  VehicleEntity,
  UtilityNetworkState,
  TrafficMetricsState,
  DerivedCityMetrics,
  WorldCommand,
  CommandResult,
  CommandBatchResponse,
} from './types';
import { apiClient } from '../services/civilizationApi';

type Listener = () => void;

class UnifiedWorldStore {
  private worldId: string = 'aurora-prime';
  private version: number = 0;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;
  private isConnected: boolean = false;
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();

  // Primary Entity Collections keyed by Stable ID
  private buildings: Map<string, BuildingEntity> = new Map();
  private roads: Map<string, RoadSegmentEntity> = new Map();
  private zones: Map<string, ZoneTileEntity> = new Map();
  private vehicles: Map<string, VehicleEntity> = new Map();

  // Subsystem Metrics
  private utilities: UtilityNetworkState = {
    total_power_supply_mw: 0,
    total_power_demand_mw: 0,
    power_deficit_mw: 0,
    grid_reliability_pct: 100,
    unpowered_building_ids: [],
    total_water_supply_t: 0,
    total_water_demand_t: 0,
    water_deficit_t: 0,
    water_reliability_pct: 100,
    unwatered_building_ids: [],
  };

  private traffic: TrafficMetricsState = {
    active_vehicles_count: 0,
    average_speed_kmh: 45,
    traffic_flow_efficiency: 92,
    congestion_index: 8,
    congested_segment_ids: [],
    average_commute_minutes: 22,
  };

  private metrics: DerivedCityMetrics = {
    population: 100,
    households_count: 38,
    residential_capacity: 500,
    occupancy_rate: 0.20,
    total_jobs: 200,
    employed_citizens: 80,
    unemployment_rate: 0.05,
    tax_rate: 18.0,
    daily_tax_revenue: 1500,
    gdp: 4500000,
    gdp_growth_rate: 0.03,
    power_supply_mw: 75.0,
    power_demand_mw: 15.0,
    water_supply_t: 80.0,
    water_demand_t: 12.0,
    air_pollution_index: 0.15,
    average_happiness: 0.77,
    civic_stability: 0.78,
    protest_intensity: 0.0,
  };

  constructor() {
    // Auto-initialize when running in browser
    if (typeof window !== 'undefined') {
      this.initWorld('aurora-prime');
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public async initWorld(worldId: string = 'aurora-prime') {
    const canonId = worldId in { 'civ-aurora-01': 1, 'prime': 1, 'default': 1 } ? 'aurora-prime' : worldId;
    this.worldId = canonId;
    await this.fetchSnapshot();
    this.connectWebSocket();
  }

  public async fetchSnapshot() {
    if (this.isLoading) return;
    this.isLoading = true;
    try {
      const res = await apiClient.get<WorldStateSnapshot>(`/worlds/${this.worldId}/state`);
      if (res.data) {
        this.applySnapshot(res.data);
        this.isLoaded = true;
      }
    } catch (err) {
      console.warn('UnifiedWorldStore: initial state fetch fallback', err);
    } finally {
      this.isLoading = false;
      this.notify();
    }
  }

  private applySnapshot(snap: WorldStateSnapshot) {
    this.version = snap.version;
    this.buildings.clear();
    snap.buildings.forEach((b) => this.buildings.set(b.id, b));

    this.roads.clear();
    snap.road_segments.forEach((r) => this.roads.set(r.id, r));

    this.zones.clear();
    snap.zone_tiles.forEach((z) => this.zones.set(z.id, z));

    this.vehicles.clear();
    snap.vehicles_sample.forEach((v) => this.vehicles.set(v.id, v));

    this.utilities = snap.utilities;
    this.traffic = snap.traffic;
    this.metrics = snap.metrics;
  }

  private connectWebSocket() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/world/${this.worldId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notify();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'world_state_delta') {
            this.handleDelta(msg);
          } else if (msg.type === 'tick_delta') {
            // Reconcile scalar delta if provided
            if (msg.delta) {
              if (msg.delta.population) this.metrics.population = msg.delta.population;
              if (msg.delta.gdp) this.metrics.gdp = msg.delta.gdp;
              if (msg.delta.happiness) this.metrics.average_happiness = msg.delta.happiness;
              if (msg.delta.civic_stability) this.metrics.civic_stability = msg.delta.civic_stability;
              this.notify();
            }
          }
        } catch {}
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notify();
        // Exponential reconnect
        setTimeout(() => this.connectWebSocket(), 4000);
      };
    } catch {}
  }

  private handleDelta(delta: any) {
    // Check for version gap: if delta.from_version does not match current version, resync
    if (delta.from_version && delta.from_version > this.version) {
      console.warn(`Version gap detected (store: ${this.version}, delta: ${delta.from_version}). Resyncing...`);
      this.fetchSnapshot();
      return;
    }

    this.version = delta.version || (this.version + 1);

    if (delta.created_buildings) {
      delta.created_buildings.forEach((b: BuildingEntity) => this.buildings.set(b.id, b));
    }
    if (delta.updated_buildings) {
      delta.updated_buildings.forEach((b: BuildingEntity) => this.buildings.set(b.id, b));
    }
    if (delta.removed_building_ids) {
      delta.removed_building_ids.forEach((id: string) => this.buildings.delete(id));
    }
    if (delta.active_vehicles) {
      this.vehicles.clear();
      delta.active_vehicles.forEach((v: VehicleEntity) => this.vehicles.set(v.id, v));
    }
    if (delta.metrics) {
      this.metrics = delta.metrics;
    }
    if (delta.utilities) {
      this.utilities = delta.utilities;
    }
    if (delta.traffic) {
      this.traffic = delta.traffic;
    }

    this.notify();
  }

  // ============================================================================
  // UNIFIED COMMAND PIPELINE WITH OPTIMISTIC UPDATES & ROLLBACK
  // ============================================================================

  public async sendCommand(cmd: WorldCommand): Promise<CommandResult> {
    const cmdId = cmd.command_id || `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullCmd = { ...cmd, command_id: cmdId };

    // 1. Optimistic Local Update
    let rollbackFn: (() => void) | null = null;

    if (fullCmd.action === 'demolish_building') {
      const bId = fullCmd.payload.building_id;
      const existing = this.buildings.get(bId);
      if (existing) {
        this.buildings.delete(bId);
        rollbackFn = () => this.buildings.set(bId, existing);
        this.notify();
      }
    } else if (fullCmd.action === 'paint_zone') {
      const { x, z, zone_type } = fullCmd.payload;
      const tileId = `zone_${Math.round(x)}_${Math.round(z)}`;
      const prev = this.zones.get(tileId);
      if (zone_type === 'none') {
        this.zones.delete(tileId);
      } else {
        this.zones.set(tileId, {
          id: tileId,
          world_id: this.worldId,
          district_id: 'dist-citadel',
          x,
          z,
          zone_type,
          level: 1,
          land_value: 50,
          desirability: 0.75,
          power_connected: true,
          water_connected: true,
        });
      }
      rollbackFn = () => {
        if (prev) this.zones.set(tileId, prev);
        else this.zones.delete(tileId);
      };
      this.notify();
    }

    // 2. Transmit to Backend Command API
    try {
      const res = await apiClient.post<CommandBatchResponse>(`/worlds/${this.worldId}/commands`, {
        commands: [fullCmd],
      });

      const batchRes = res.data;
      const cmdRes = batchRes?.results?.[0];

      if (cmdRes && cmdRes.status === 'accepted') {
        this.version = batchRes.new_version;
        if (batchRes.latest_metrics) {
          this.metrics = batchRes.latest_metrics;
        }
        // Fetch snapshot if new building placed to sync exact server ID
        if (fullCmd.action === 'place_building') {
          await this.fetchSnapshot();
        }
        this.notify();
        return cmdRes;
      } else {
        // Rollback on rejection
        if (rollbackFn) rollbackFn();
        this.notify();
        return {
          command_id: cmdId,
          action: fullCmd.action,
          status: 'rejected',
          reason: cmdRes?.reason || 'Command rejected by simulation authority',
          state_version: this.version,
        };
      }
    } catch (err: any) {
      if (rollbackFn) rollbackFn();
      this.notify();
      return {
        command_id: cmdId,
        action: fullCmd.action,
        status: 'rejected',
        reason: err?.response?.data?.detail || err.message || 'Network error reaching simulation engine',
        state_version: this.version,
      };
    }
  }

  public async undoLastAction(): Promise<boolean> {
    try {
      const res = await apiClient.post(`/worlds/${this.worldId}/undo`);
      if (res.data?.success) {
        await this.fetchSnapshot();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // GETTERS FOR REACT COMPONENTS
  // ============================================================================

  public getBuildings(): BuildingEntity[] {
    return Array.from(this.buildings.values());
  }

  public getRoads(): RoadSegmentEntity[] {
    return Array.from(this.roads.values());
  }

  public getZones(): ZoneTileEntity[] {
    return Array.from(this.zones.values());
  }

  public getVehicles(): VehicleEntity[] {
    return Array.from(this.vehicles.values());
  }

  public getUtilities(): UtilityNetworkState {
    return this.utilities;
  }

  public getTraffic(): TrafficMetricsState {
    return this.traffic;
  }

  public getMetrics(): DerivedCityMetrics {
    return this.metrics;
  }

  public getVersion(): number {
    return this.version;
  }

  public isReady(): boolean {
    return this.isLoaded;
  }
}

export const globalWorldStore = new UnifiedWorldStore();

