export interface DeathsByCause {
  aging: number;
  starvation: number;
  dehydration: number;
  hospital_overload: number;
  pollution: number;
  trauma: number;
}

export interface UnmetNeeds {
  food: number;
  water: number;
  energy: number;
  healthcare: number;
  shelter: number;
}

export interface CausalVitalsSnapshot {
  world_id: string;
  tick: number;
  year: number;
  day: number;
  population: number;
  births: number;
  deaths: number;
  deaths_by_cause: DeathsByCause;
  unmet_needs: UnmetNeeds;
  health_index: number;
  hospital_admissions: number;
  bed_capacity: number;
  bed_occupancy_pct: number;
  overflow_patients: number;
  protest_intensity: number;
  protest_participants: number;
  grievance_score: number;
  happiness: number;
  civic_stability: number;
  environmental_health: number;
  created_at: string;
}

export interface CausalNode {
  id: string;
  label: string;
  category: string;
  value: number;
  display_value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  description: string;
}

export interface CausalLink {
  source: string;
  target: string;
  strength: number;
  impact: 'mitigating' | 'aggravating' | 'neutral';
  description: string;
}

export interface CausalTraceGraph {
  world_id: string;
  tick: number;
  year: number;
  day: number;
  nodes: CausalNode[];
  links: CausalLink[];
  summary: string;
  contributing_factors: string[];
}

export interface CausalEvent {
  id: string;
  world_id: string;
  year: number;
  day: number;
  tick: number;
  category: string;
  title: string;
  severity: 'info' | 'warning' | 'emergency' | 'critical';
  description: string;
  metadata?: Record<string, any>;
}

