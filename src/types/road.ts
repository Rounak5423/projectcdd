export type RoadCategory =
  | 'grand_arterial'
  | 'civic_boulevard'
  | 'secondary_loop'
  | 'district_collector'
  | 'local_spur'
  | 'district_avenue'
  | 'residential_street'
  | 'industrial_corridor'
  | 'architectural_bridge';

export interface RoadSegmentData {
  id: string;
  name: string;
  category: RoadCategory;
  speedLimitKmh: number;
  lanes: number;
  width: number;
  lengthMeters: number;
  status: 'Optimal' | 'Normal Flow' | 'Moderate Congestion';
  throughputVehiclesPerDay: number;
  connectedDistricts: string[];
  connectedBuildings: string[];
  description: string;
}

