/**
 * Generated Typed API Client with Boundary Validation.
 * Interacts with backend OpenAPI routes cleanly and transparently.
 */
import axios, { AxiosInstance } from 'axios';
import * as Types from './types';
import { validateObject } from './validator';

export function createGeneratedApiClient(customAxios?: AxiosInstance) {
  const client = customAxios || axios.create({ baseURL: '/api/v1', timeout: 10000 });

  return {
    // Health and vitals
    async getHealth() {
      const res = await client.get('/health');
      return res.data;
    },
    async getMLHealth() {
      const res = await client.get('/ml/health');
      return res.data;
    },

    // Worlds & Simulation
    async listWorlds(): Promise<Types.WorldSummary[]> {
      const res = await client.get('/worlds');
      return res.data;
    },
    async getWorld(worldId: string): Promise<any> {
      const res = await client.get(`/worlds/${encodeURIComponent(worldId)}`);
      return validateObject(res.data, ['id', 'name'], `/worlds/${worldId}`);
    },
    async advanceSimulation(worldId: string, ticks: number = 1) {
      const res = await client.post(`/worlds/${encodeURIComponent(worldId)}/simulation/advance`, { ticks });
      return res.data;
    },

    // Budget & Bonds
    async getBudget(worldId: string) {
      const res = await client.get(`/worlds/${encodeURIComponent(worldId)}/budget`);
      return validateObject(res.data, ['rates', 'sector_budgets'], `/worlds/${worldId}/budget`);
    },
    async updateBudget(worldId: string, data: Types.BudgetUpdateRequest) {
      const res = await client.post(`/worlds/${encodeURIComponent(worldId)}/budget`, data);
      return res.data;
    },
    async issueBond(worldId: string, amount: number) {
      const res = await client.post(`/worlds/${encodeURIComponent(worldId)}/bonds/issue`, { amount });
      return res.data;
    },
    async repayBond(worldId: string, amount: number) {
      const res = await client.post(`/worlds/${encodeURIComponent(worldId)}/bonds/repay`, { amount });
      return res.data;
    },

    // Buildings & Infrastructure
    async getBuildings(worldId: string): Promise<Types.Building[]> {
      const res = await client.get(`/worlds/${encodeURIComponent(worldId)}/buildings`);
      return res.data;
    },
    async constructBuilding(worldId: string, req: Types.BuildingConstructRequest): Promise<Types.Building> {
      const res = await client.post(`/worlds/${encodeURIComponent(worldId)}/buildings`, req);
      return validateObject<Types.Building>(res.data, ['id', 'type'], `/worlds/${worldId}/buildings`);
    },
    async decommissionBuilding(worldId: string, buildingId: string) {
      const res = await client.delete(`/worlds/${encodeURIComponent(worldId)}/buildings/${encodeURIComponent(buildingId)}`);
      return res.data;
    },

    // Technology
    async getTechnologyOverview(worldId: string): Promise<Types.TechnologyOverviewResponse> {
      const res = await client.get(`/worlds/${encodeURIComponent(worldId)}/technology/overview`);
      return validateObject<Types.TechnologyOverviewResponse>(res.data, ['world_id'], `/worlds/${worldId}/technology/overview`);
    },
    async unlockTechnology(worldId: string, techId: string) {
      const res = await client.post(`/worlds/${encodeURIComponent(worldId)}/technologies/${encodeURIComponent(techId)}/unlock`);
      return res.data;
    },

    // Policies
    async getPolicies(worldId: string): Promise<Types.Policy[]> {
      const res = await client.get(`/worlds/${encodeURIComponent(worldId)}/policies`);
      return res.data;
    },
    async updatePolicy(worldId: string, policyId: string, req: Types.PolicyUpdateRequest) {
      const res = await client.post(`/worlds/${encodeURIComponent(worldId)}/policies/${encodeURIComponent(policyId)}/toggle`, req);
      return res.data;
    },
  };
}
