/**
 * Authoritative Movement Synchronization Hook
 * File: src/world/movement/useMovementSync.ts
 * 
 * Provides smooth, client-side interpolation of backend-authoritative vehicles
 * and pedestrians with terrain elevation snapping, heading smoothing, and extrapolation limits.
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUnifiedWorld } from '../useUnifiedWorld';
import { VehicleEntity, PedestrianEntity } from '../types';
import { getTerrainHeight } from '../../components/world3d/Terrain';
import { MapTerrainType } from '../../types/game';

export interface InterpolatedVehicle {
  id: string;
  category: string;
  position: [number, number, number];
  headingRad: number;
  speedKmh: number;
  status: string;
  stateBadge: string;
  sirenActive: boolean;
  length: number;
  width: number;
  opacity: number;
}

export interface InterpolatedPedestrian {
  id: string;
  archetype: string;
  position: [number, number, number];
  headingRad: number;
  speedMps: number;
  status: string;
  isCrossing: boolean;
  opacity: number;
}

interface EntityTargetState {
  x: number;
  z: number;
  y: number;
  headingRad: number;
  speed: number;
  status: string;
  badge: string;
  siren: boolean;
  lastUpdateTime: number;
}

export function useMovementSync(terrainType: MapTerrainType = 'Verdant River Valley') {
  const { vehicles: serverVehicles, pedestrians: serverPedestrians, traffic } = useUnifiedWorld();

  const vehicleTargets = useRef<Map<string, EntityTargetState>>(new Map());
  const vehicleCurrents = useRef<Map<string, InterpolatedVehicle>>(new Map());

  const pedTargets = useRef<Map<string, EntityTargetState>>(new Map());
  const pedCurrents = useRef<Map<string, InterpolatedPedestrian>>(new Map());

  // Ingest vehicle telemetry updates from backend
  useEffect(() => {
    const now = performance.now();
    const seenIds = new Set<string>();

    for (const sv of serverVehicles) {
      seenIds.add(sv.id);
      const rad = THREE.MathUtils.degToRad(sv.heading_deg || 0);
      const y = sv.current_y !== undefined && sv.current_y !== 0
        ? sv.current_y
        : getTerrainHeight(sv.current_x, sv.current_z, terrainType);

      vehicleTargets.current.set(sv.id, {
        x: sv.current_x,
        z: sv.current_z,
        y,
        headingRad: rad,
        speed: sv.current_speed_kmh || 0,
        status: sv.status || 'moving',
        badge: sv.state_badge || (sv.siren_active ? 'siren' : 'normal'),
        siren: !!sv.siren_active,
        lastUpdateTime: now,
      });

      if (!vehicleCurrents.current.has(sv.id)) {
        vehicleCurrents.current.set(sv.id, {
          id: sv.id,
          category: sv.category || 'sedan',
          position: [sv.current_x, y, sv.current_z],
          headingRad: rad,
          speedKmh: sv.current_speed_kmh || 0,
          status: sv.status || 'moving',
          stateBadge: sv.state_badge || 'normal',
          sirenActive: !!sv.siren_active,
          length: sv.length || (sv.category === 'bus' ? 11.5 : 4.2),
          width: sv.width || (sv.category === 'bus' ? 2.5 : 1.9),
          opacity: 1.0,
        });
      }
    }

    // Prune despawned targets
    for (const id of vehicleTargets.current.keys()) {
      if (!seenIds.has(id)) {
        vehicleTargets.current.delete(id);
      }
    }
  }, [serverVehicles, terrainType]);

  // Ingest pedestrian telemetry updates from backend
  useEffect(() => {
    const now = performance.now();
    const seenIds = new Set<string>();

    for (const sp of serverPedestrians) {
      seenIds.add(sp.id);
      const rad = THREE.MathUtils.degToRad(sp.heading_deg || 0);
      const y = sp.current_y !== undefined && sp.current_y !== 0
        ? sp.current_y
        : getTerrainHeight(sp.current_x, sp.current_z, terrainType);

      pedTargets.current.set(sp.id, {
        x: sp.current_x,
        z: sp.current_z,
        y,
        headingRad: rad,
        speed: sp.speed_mps || 1.35,
        status: sp.status || 'walking',
        badge: sp.status,
        siren: false,
        lastUpdateTime: now,
      });

      if (!pedCurrents.current.has(sp.id)) {
        pedCurrents.current.set(sp.id, {
          id: sp.id,
          archetype: sp.archetype || 'casual',
          position: [sp.current_x, y, sp.current_z],
          headingRad: rad,
          speedMps: sp.speed_mps || 1.35,
          status: sp.status || 'walking',
          isCrossing: !!sp.is_crossing,
          opacity: 1.0,
        });
      }
    }

    for (const id of pedTargets.current.keys()) {
      if (!seenIds.has(id)) {
        pedTargets.current.delete(id);
      }
    }
  }, [serverPedestrians, terrainType]);

  // Per-frame smooth interpolation
  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.1);
    const lerpFactor = Math.min(1.0, clampedDelta * 12.0);

    // 1. Interpolate Vehicles
    for (const [id, curr] of vehicleCurrents.current.entries()) {
      const target = vehicleTargets.current.get(id);
      if (target) {
        // Position lerp
        curr.position[0] += (target.x - curr.position[0]) * lerpFactor;
        curr.position[2] += (target.z - curr.position[2]) * lerpFactor;
        
        // Snap height to terrain elevation
        const groundH = getTerrainHeight(curr.position[0], curr.position[2], terrainType);
        curr.position[1] += (Math.max(groundH, target.y) - curr.position[1]) * lerpFactor;

        // Heading angle interpolation (handling 2pi wrap-around)
        let dHeading = target.headingRad - curr.headingRad;
        while (dHeading > Math.PI) dHeading -= Math.PI * 2;
        while (dHeading < -Math.PI) dHeading += Math.PI * 2;
        curr.headingRad += dHeading * lerpFactor;

        curr.speedKmh += (target.speed - curr.speedKmh) * lerpFactor;
        curr.status = target.status;
        curr.stateBadge = target.badge;
        curr.sirenActive = target.siren;
        curr.opacity = Math.min(1.0, curr.opacity + clampedDelta * 3.0);
      } else {
        // Smooth fade out on arrival / despawn
        curr.opacity -= clampedDelta * 4.0;
        if (curr.opacity <= 0.05) {
          vehicleCurrents.current.delete(id);
        }
      }
    }

    // 2. Interpolate Pedestrians
    for (const [id, curr] of pedCurrents.current.entries()) {
      const target = pedTargets.current.get(id);
      if (target) {
        curr.position[0] += (target.x - curr.position[0]) * lerpFactor;
        curr.position[2] += (target.z - curr.position[2]) * lerpFactor;
        
        const groundH = getTerrainHeight(curr.position[0], curr.position[2], terrainType);
        curr.position[1] = groundH + 0.15;

        let dHeading = target.headingRad - curr.headingRad;
        while (dHeading > Math.PI) dHeading -= Math.PI * 2;
        while (dHeading < -Math.PI) dHeading += Math.PI * 2;
        curr.headingRad += dHeading * lerpFactor;

        curr.speedMps += (target.speed - curr.speedMps) * lerpFactor;
        curr.status = target.status;
        curr.opacity = Math.min(1.0, curr.opacity + clampedDelta * 3.0);
      } else {
        curr.opacity -= clampedDelta * 4.0;
        if (curr.opacity <= 0.05) {
          pedCurrents.current.delete(id);
        }
      }
    }
  });

  return {
    vehicles: Array.from(vehicleCurrents.current.values()),
    pedestrians: Array.from(pedCurrents.current.values()),
    traffic,
  };
}
