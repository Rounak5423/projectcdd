/**
 * GENESIS — City Life & Intelligent Movement System Types
 * Defines data structures for pedestrians, vehicles, traffic networks, and building activity.
 */

export type CitizenArchetype =
  | 'casual'       // General urban resident in casual attire
  | 'executive'    // Civic dignitary or administrator in formal wear
  | 'medical'      // Healthcare clinician or paramedic in scrubs/lab coat
  | 'student'      // Academy scholar with satchel/backpack
  | 'worker'       // Industrial foundry technician with safety vest and hardhat
  | 'scientist'    // High-tech researcher with datapad

export interface PedestrianAgent {
  id: string;
  archetype: CitizenArchetype;
  pathId: string;
  pathProgress: number; // 0 to 1 along the path
  speed: number;        // walking speed in m/s (approx 1.1 to 1.5 m/s)
  direction: 1 | -1;    // 1 = forward along path, -1 = return
  heightScale: number;  // 0.90 to 1.12 (simulating height from 1.6m to 1.88m)
  clothingColor: string;
  pantsColor: string;
  skinTone: string;
  accessoryType: 'none' | 'backpack' | 'satchel' | 'helmet' | 'datapad';
  isWaitingAtCrossing: boolean;
  waitTimer: number;
}

export interface PedestrianPathNode {
  x: number;
  z: number;
  isCrossing?: boolean;      // Node is a zebra crosswalk
  crossingDirection?: 'NS' | 'EW'; // Traffic direction to yield to
  districtId?: string;
  description?: string;
}

export interface PedestrianPath {
  id: string;
  name: string;
  nodes: PedestrianPathNode[];
  isLoop: boolean;
  districtId: string;
}

export type VehicleCategory =
  | 'commuter'    // Civilian personal transport (sedans, pods)
  | 'shuttle'     // Public mass transit (buses, automated shuttles)
  | 'hauler'      // Intermodal freight and delivery cargo trucks
  | 'cruiser'     // Executive luxury cruisers
  | 'ambulance';   // Emergency medical response vehicle

export interface VehicleAgent {
  id: string;
  name: string;
  category: VehicleCategory;
  routeId: string;
  routeProgress: number; // 0 to 1 along route
  currentSpeed: number;  // current actual speed in m/s
  maxSpeed: number;      // cruise speed in m/s
  acceleration: number;  // m/s^2
  deceleration: number;  // m/s^2
  color: string;
  isEmergencyActive?: boolean;
  isBraking: boolean;
  districtId: string;
  length: number;        // physical body length for headway clearance
}

export interface TrafficFlowMetrics {
  activeVehicles: number;
  activePedestrians: number;
  averageSpeedMps: number;
  averageSpeedKph: number;
  trafficFlowEfficiency: number; // 0 to 100%
  congestionIndex: number;       // 0 to 100%
  ambulanceInTransit: boolean;
}

