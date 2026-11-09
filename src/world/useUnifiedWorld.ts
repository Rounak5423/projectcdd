/**
 * React Hook for Subscribing to the Authoritative Unified World Store
 * Version: 2.0.0
 */

import { useState, useEffect } from 'react';
import { globalWorldStore } from './worldStore';
import {
  BuildingEntity,
  RoadSegmentEntity,
  ZoneTileEntity,
  VehicleEntity,
  UtilityNetworkState,
  TrafficMetricsState,
  DerivedCityMetrics,
  WorldCommand,
  CommandResult,
} from './types';

export function useUnifiedWorld() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = globalWorldStore.subscribe(() => {
      setTick((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  return {
    isReady: globalWorldStore.isReady(),
    version: globalWorldStore.getVersion(),
    buildings: globalWorldStore.getBuildings(),
    roads: globalWorldStore.getRoads(),
    zones: globalWorldStore.getZones(),
    vehicles: globalWorldStore.getVehicles(),
    utilities: globalWorldStore.getUtilities(),
    traffic: globalWorldStore.getTraffic(),
    metrics: globalWorldStore.getMetrics(),
    sendCommand: (cmd: WorldCommand): Promise<CommandResult> => globalWorldStore.sendCommand(cmd),
    undoLastAction: (): Promise<boolean> => globalWorldStore.undoLastAction(),
    refreshSnapshot: (): Promise<void> => globalWorldStore.fetchSnapshot(),
  };
}

