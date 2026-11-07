import axios from 'axios';
import {
  CivilizationProfile,
  ResourceState,
  ResourceRates,
  PlacedBuilding,
  Technology,
  Policy,
  SimulationScenario,
  Experiment,
  GameEvent,
} from '../types/game';

// Base URL for future FastAPI backend service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  isFallback?: boolean;
}

/**
 * Service bridge prepared for FastAPI integration.
 * In development or when offline, methods log telemetry and provide typed fallbacks.
 */
export const civilizationApi = {
  // Civilization telemetry
  async getCivilization(civId: string): Promise<ApiResponse<CivilizationProfile>> {
    try {
      const response = await apiClient.get<CivilizationProfile>(`/civilizations/${civId}`);
      return { success: true, data: response.data };
    } catch {
      return {
        success: true,
        message: 'FastAPI service not reachable; running in authoritative local simulation engine mode.',
        isFallback: true,
      };
    }
  },

  async advanceSimulationTicks(civId: string, ticks: number): Promise<ApiResponse<{ ticksProcessed: number }>> {
    try {
      const response = await apiClient.post(`/civilizations/${civId}/simulate`, { ticks });
      return { success: true, data: response.data };
    } catch {
      return {
        success: true,
        data: { ticksProcessed: ticks },
        isFallback: true,
      };
    }
  },

  // Building infrastructure commands
  async constructFacility(civId: string, payload: Partial<PlacedBuilding>): Promise<ApiResponse<PlacedBuilding>> {
    try {
      const response = await apiClient.post<PlacedBuilding>(`/civilizations/${civId}/buildings`, payload);
      return { success: true, data: response.data };
    } catch {
      return {
        success: true,
        message: 'Facility queued in client simulation state.',
        isFallback: true,
      };
    }
  },

  async upgradeFacility(civId: string, buildingId: string): Promise<ApiResponse<{ buildingId: string; newLevel: number }>> {
    try {
      const response = await apiClient.patch(`/civilizations/${civId}/buildings/${buildingId}/upgrade`);
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },

  async decommissionFacility(civId: string, buildingId: string): Promise<ApiResponse<{ buildingId: string }>> {
    try {
      const response = await apiClient.delete(`/civilizations/${civId}/buildings/${buildingId}`);
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },

  // Science & Tech tree
  async queueResearch(civId: string, techId: string): Promise<ApiResponse<{ techId: string; status: string }>> {
    try {
      const response = await apiClient.post(`/civilizations/${civId}/research/${techId}`);
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },

  // Policy Laboratory
  async enactPolicy(civId: string, policyId: string, sliderValue: number): Promise<ApiResponse<Policy>> {
    try {
      const response = await apiClient.post<Policy>(`/civilizations/${civId}/policies/${policyId}`, { sliderValue });
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },

  // Scenario Simulator
  async runQuantumScenario(civId: string, scenarioId: string, horizon: number): Promise<ApiResponse<SimulationScenario>> {
    try {
      const response = await apiClient.post<SimulationScenario>(`/civilizations/${civId}/scenarios/${scenarioId}`, { horizon });
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },

  // Research Observatory
  async submitEmpiricalTrial(civId: string, experimentId: string): Promise<ApiResponse<Experiment>> {
    try {
      const response = await apiClient.post<Experiment>(`/civilizations/${civId}/observatory/${experimentId}/start`);
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },
};

