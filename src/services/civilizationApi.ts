import axios from 'axios';
import { performanceMonitor } from './monitoring/performanceMonitor';
import { apiCache } from './apiCache';
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

// Base URL for FastAPI backend service (supports relative URLs in production and custom VITE_API_URL)
const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    if (import.meta.env.PROD || window.location.port === '8000' || !window.location.port) {
      return '/api/v1';
    }
    const host = window.location.hostname || '127.0.0.1';
    return `http://${host}:8000/api/v1`;
  }
  return 'http://127.0.0.1:8000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Auto-inject JWT token from localStorage if present and timestamp request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('civora_token') || localStorage.getItem('genesis_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  (config as any)._perfStartTime = performance.now();
  return config;
});

// Non-intrusively record API response latency to Central Performance Monitor
apiClient.interceptors.response.use(
  (response) => {
    const startTime = (response.config as any)?._perfStartTime;
    if (startTime) {
      const duration = performance.now() - startTime;
      performanceMonitor.recordApiCall(
        response.config.method?.toUpperCase() || 'GET',
        response.config.url || '',
        duration,
        response.status
      );
    }
    return response;
  },
  (error) => {
    const startTime = error.config?._perfStartTime;
    if (startTime) {
      const duration = performance.now() - startTime;
      performanceMonitor.recordApiCall(
        error.config?.method?.toUpperCase() || 'GET',
        error.config?.url || '',
        duration,
        error.response?.status || 0
      );
    }
    return Promise.reject(error);
  }
);

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
    return apiCache.deduplicate(`civ_${civId}`, async () => {
      try {
        const response = await apiClient.get<CivilizationProfile>(`/worlds/${civId}`);
        return { success: true, data: response.data };
      } catch (err: any) {
        try {
          const altResponse = await apiClient.get<CivilizationProfile>(`/civilizations/${civId}`);
          return { success: true, data: altResponse.data };
        } catch (innerErr: any) {
          const msg = innerErr.response?.data?.detail || err.response?.data?.detail || 'Failed to load civilization profile from server.';
          console.error(`[civilizationApi.getCivilization] Error:`, innerErr);
          return {
            success: false,
            message: msg,
          };
        }
      }
    }, 5000);
  },

  async listWorlds(): Promise<ApiResponse<any[]>> {
    return apiCache.deduplicate('worlds_list', async () => {
      try {
        const response = await apiClient.get('/worlds');
        return { success: true, data: response.data };
      } catch (err: any) {
        console.error(`[civilizationApi.listWorlds] Error:`, err);
        return { success: false, data: [], message: err.response?.data?.detail || err.message };
      }
    }, 6000);
  },

  async advanceSimulationTicks(civId: string, ticks: number): Promise<ApiResponse<{ ticksProcessed: number }>> {
    try {
      const response = await apiClient.post(`/worlds/${civId}/simulation/advance`, { ticks });
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to advance simulation ticks';
      console.error(`[civilizationApi.advanceSimulationTicks] Error:`, err);
      return {
        success: false,
        message: msg,
      };
    }
  },

  // Building infrastructure commands
  async constructFacility(civId: string, payload: Partial<PlacedBuilding>): Promise<ApiResponse<PlacedBuilding>> {
    try {
      const response = await apiClient.post<PlacedBuilding>(`/worlds/${civId}/buildings`, payload);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to construct facility on backend';
      console.error(`[civilizationApi.constructFacility] Error:`, err);
      return {
        success: false,
        message: msg,
      };
    }
  },

  async upgradeFacility(civId: string, buildingId: string): Promise<ApiResponse<{ buildingId: string; newLevel: number }>> {
    try {
      const response = await apiClient.patch(`/worlds/${civId}/buildings/${buildingId}/upgrade`);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to upgrade facility';
      console.error(`[civilizationApi.upgradeFacility] Error:`, err);
      return { success: false, message: msg };
    }
  },

  async decommissionFacility(civId: string, buildingId: string): Promise<ApiResponse<{ buildingId: string }>> {
    try {
      const response = await apiClient.delete(`/worlds/${civId}/buildings/${buildingId}`);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to decommission facility';
      console.error(`[civilizationApi.decommissionFacility] Error:`, err);
      return { success: false, message: msg };
    }
  },

  // Science & Tech tree
  async getTechnologyTree(civId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get(`/worlds/${civId}/technology`);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to fetch technology tree';
      console.error(`[civilizationApi.getTechnologyTree] Error:`, err);
      return { success: false, message: msg };
    }
  },

  async getTechnologyOverview(civId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/worlds/${civId}/technology/overview`);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to fetch technology overview';
      console.error(`[civilizationApi.getTechnologyOverview] Error:`, err);
      return { success: false, message: msg };
    }
  },

  async queueResearch(civId: string, techId: string): Promise<ApiResponse<{ techId: string; status: string; technology?: any }>> {
    try {
      const response = await apiClient.post(`/worlds/${civId}/technologies/${techId}/unlock`);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to queue research';
      console.error(`[civilizationApi.queueResearch] Error:`, err);
      return { success: false, message: msg };
    }
  },

  async triggerEurekaBoost(civId: string, techId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(`/worlds/${civId}/technology/${techId}/eureka`);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to trigger eureka boost';
      console.error(`[civilizationApi.triggerEurekaBoost] Error:`, err);
      return { success: false, message: msg };
    }
  },

  async completeTechnology(civId: string, techId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(`/worlds/${civId}/technology/${techId}/complete`);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to complete technology';
      console.error(`[civilizationApi.completeTechnology] Error:`, err);
      return { success: false, message: msg };
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
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to enact policy';
      console.error(`[civilizationApi.enactPolicy] Error:`, err);
      return { success: false, message: msg };
    }
  },

  async deliberatePolicy(policy: any, worldId?: string, societyState?: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<any>('/policies/deliberate', {
        policy,
        world_id: worldId,
        society_state: societyState,
      });
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Policy deliberation failed';
      console.error(`[civilizationApi.deliberatePolicy] Error:`, err);
      return { success: false, message: msg };
    }
  },

  async createCustomPolicy(policyData: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<any>('/policies/custom', policyData);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Custom policy creation failed';
      console.error(`[civilizationApi.createCustomPolicy] Error:`, err);
      return { success: false, message: msg };
    }
  },

  async recordPolicyFeedback(feedback: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<any>('/policies/record-feedback', feedback);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Recording policy feedback failed';
      console.error(`[civilizationApi.recordPolicyFeedback] Error:`, err);
      return { success: false, message: msg };
    }
  },

  async getPolicyLearningStatus(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<any>('/policies/learning-status');
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to get policy learning status';
      console.error(`[civilizationApi.getPolicyLearningStatus] Error:`, err);
      return { success: false, message: msg };
    }
  },

  async getPolicyModelAccuracy(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get<any>('/policies/model-accuracy');
      return { success: true, data: response.data };
    } catch {
      return { success: false, isFallback: true };
    }
  },

  async runPolicyModelBenchmark(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post<any>('/policies/train-benchmark', {});
      return { success: true, data: response.data };
    } catch {
      return { success: false, isFallback: true };
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
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to run scenario';
      console.error(`[civilizationApi.runQuantumScenario] Error:`, err);
      return { success: false, message: msg };
    }
  },

  // Research Observatory
  async submitEmpiricalTrial(civId: string, experimentId: string): Promise<ApiResponse<Experiment>> {
    try {
      const response = await apiClient.post<Experiment>(`/worlds/${civId}/observatory/${experimentId}/start`);
      return { success: true, data: response.data };
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to submit empirical trial';
      console.error(`[civilizationApi.submitEmpiricalTrial] Error:`, err);
      return { success: false, message: msg };
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

  async getBudget(worldId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`/worlds/${worldId}/budget`);
      return { success: true, data: response.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.detail || 'Failed to fetch budget' };
    }
  },

  async updateBudget(worldId: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(`/worlds/${worldId}/budget`, data);
      return { success: true, data: response.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.detail || 'Failed to update budget' };
    }
  },

  async issueBond(worldId: string, amount: number): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(`/worlds/${worldId}/bonds/issue`, { amount });
      return { success: true, data: response.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.detail || 'Failed to issue municipal bond' };
    }
  },

  async repayBond(worldId: string, amount: number): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(`/worlds/${worldId}/bonds/repay`, { amount });
      return { success: true, data: response.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.detail || 'Failed to repay municipal bond' };
    }
  },
};
