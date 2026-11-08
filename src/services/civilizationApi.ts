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

// Base URL for FastAPI backend service (127.0.0.1:8000 or relative /api/v1)
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.port === '8000'
    ? '/api/v1'
    : 'http://127.0.0.1:8000/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Auto-inject JWT token from localStorage if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('civora_token') || localStorage.getItem('genesis_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  isFallback?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  admin_count: number;
  user_count: number;
  total_worlds: number;
  total_population: number;
  total_gdp: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  worlds_count: number;
  worlds: Array<{
    id: string;
    name: string;
    level: number;
    population?: number;
    gdp?: number;
    thriving_score?: number;
    simulation_status?: string;
  }>;
}

/**
 * Service bridge for FastAPI backend integration with graceful local fallback.
 */
export const civilizationApi = {
  // Civilization & World telemetry
  async getCivilization(civId: string): Promise<ApiResponse<CivilizationProfile>> {
    try {
      const response = await apiClient.get<CivilizationProfile>(`/worlds/${civId}`);
      return { success: true, data: response.data };
    } catch {
      try {
        const altResponse = await apiClient.get<CivilizationProfile>(`/civilizations/${civId}`);
        return { success: true, data: altResponse.data };
      } catch {
        return {
          success: true,
          message: 'FastAPI service not reachable; running in authoritative local simulation engine mode.',
          isFallback: true,
        };
      }
    }
  },

  async listWorlds(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get('/worlds');
      return { success: true, data: response.data };
    } catch {
      return { success: false, data: [] };
    }
  },

  async advanceSimulationTicks(civId: string, ticks: number): Promise<ApiResponse<{ ticksProcessed: number }>> {
    try {
      const response = await apiClient.post(`/worlds/${civId}/simulate`, { ticks });
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
      const response = await apiClient.post<PlacedBuilding>(`/worlds/${civId}/buildings`, payload);
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
      const response = await apiClient.patch(`/worlds/${civId}/buildings/${buildingId}/upgrade`);
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },

  async decommissionFacility(civId: string, buildingId: string): Promise<ApiResponse<{ buildingId: string }>> {
    try {
      const response = await apiClient.delete(`/worlds/${civId}/buildings/${buildingId}`);
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },

  // Science & Tech tree
  async queueResearch(civId: string, techId: string): Promise<ApiResponse<{ techId: string; status: string }>> {
    try {
      const response = await apiClient.post(`/worlds/${civId}/technologies/${techId}/unlock`);
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },

  // Policy Laboratory
  async enactPolicy(civId: string, policyId: string, sliderValue: number): Promise<ApiResponse<Policy>> {
    try {
      const response = await apiClient.post<Policy>(`/worlds/${civId}/policies/${policyId}/toggle`, {
        is_active: sliderValue > 0,
        parameters: { intensity: sliderValue },
      });
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },

  // Scenario Simulator
  async runQuantumScenario(civId: string, scenarioId: string, horizon: number): Promise<ApiResponse<SimulationScenario>> {
    try {
      const response = await apiClient.post<SimulationScenario>(`/worlds/${civId}/scenarios`, {
        scenario_id: scenarioId,
        horizon_ticks: horizon,
      });
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },

  // Research Observatory
  async submitEmpiricalTrial(civId: string, experimentId: string): Promise<ApiResponse<Experiment>> {
    try {
      const response = await apiClient.post<Experiment>(`/worlds/${civId}/observatory/${experimentId}/start`);
      return { success: true, data: response.data };
    } catch {
      return { success: true, isFallback: true };
    }
  },

  // Authentication Endpoints
  async login(username: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { username, password });
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid username or password';
      return { success: false, message: msg };
    }
  },

  async register(username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', { username, email, password });
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Account registration failed';
      return { success: false, message: msg };
    }
  },

  async getMe(): Promise<ApiResponse<AuthResponse['user']>> {
    try {
      const response = await apiClient.get<AuthResponse['user']>('/auth/me');
      return { success: true, data: response.data };
    } catch {
      return { success: false, message: 'Not authenticated' };
    }
  },

  async logout(): Promise<ApiResponse<null>> {
    try {
      await apiClient.post('/auth/logout');
      return { success: true };
    } catch {
      return { success: true };
    }
  },

  // Administrator Controls (RBAC: Admin Role Required)
  async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    try {
      const response = await apiClient.get<AdminStats>('/admin/stats');
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Admin statistics access restricted';
      return { success: false, message: msg };
    }
  },

  async getAdminUsers(): Promise<ApiResponse<AdminUser[]>> {
    try {
      const response = await apiClient.get<AdminUser[]>('/admin/users');
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Admin roster access restricted';
      return { success: false, message: msg };
    }
  },

  async createAdminUser(data: {
    username: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
  }): Promise<ApiResponse<AdminUser>> {
    try {
      const response = await apiClient.post<AdminUser>('/admin/users', data);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create user record';
      return { success: false, message: msg };
    }
  },

  async updateAdminUser(
    userId: string,
    data: Partial<{ email: string; role: 'user' | 'admin'; is_active: boolean; password?: string }>
  ): Promise<ApiResponse<AdminUser>> {
    try {
      const response = await apiClient.put<AdminUser>(`/admin/users/${userId}`, data);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update user';
      return { success: false, message: msg };
    }
  },

  async deleteAdminUser(userId: string): Promise<ApiResponse<{ status: string; user_id: string }>> {
    try {
      const response = await apiClient.delete<{ status: string; user_id: string }>(`/admin/users/${userId}`);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to delete user';
      return { success: false, message: msg };
    }
  },
};
