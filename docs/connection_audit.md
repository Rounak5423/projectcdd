# Frontend <-> Backend Connection & Contract Audit

Generated automatically by `scripts/compare_contracts.py`.
- **Total Backend Routes in OpenAPI:** 186
- **Total Frontend Calls Extracted:** 51
- **Contract Matched Routes:** 45
- **Mismatches / Unmatched Calls:** 6

## 1. API Call Audit Matrix

| Frontend Call | Backend Route | Mismatch Type | Evidence | Fix |
|---|---|---|---|---|
| `GET /api/v1/worlds/${worldId}/vitals?limit=60 (src/features/causal/CausalInsightsPage.tsx)` | `NONE` | Missing Backend Route or URL Drift | No route matching /worlds/{param}/vitals?limit=60 in backend OpenAPI schema | Add additive alias route in backend or route through generated typed client |
| `GET /api/v1/worlds/${worldId}/causal-trace (src/features/causal/CausalInsightsPage.tsx)` | `/api/v1/worlds/{param}/causal-trace` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/causal-trace | Integrate with typed API client and runtime Zod validation |
| `POST /api/v1/worlds/${worldId}/simulation/advance (src/features/causal/CausalInsightsPage.tsx)` | `/api/v1/worlds/{param}/simulation/advance` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/simulation/advance | Integrate with typed API client and runtime Zod validation |
| `GET /api/v1/worlds/${worldId}/events (src/features/causal/CausalInsightsPage.tsx)` | `/api/v1/worlds/{param}/events` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/events | Integrate with typed API client and runtime Zod validation |
| `POST /api/v1/worlds/${worldId}/simulation/advance (src/features/causal/CausalInsightsPage.tsx)` | `/api/v1/worlds/{param}/simulation/advance` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/simulation/advance | Integrate with typed API client and runtime Zod validation |
| `POST /api/v1/worlds/${worldId}/commands (src/features/causal/CausalInsightsPage.tsx)` | `/api/v1/worlds/{param}/commands` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/commands | Integrate with typed API client and runtime Zod validation |
| `POST /api/v1/worlds/${worldId}/simulation/advance (src/features/causal/CausalInsightsPage.tsx)` | `/api/v1/worlds/{param}/simulation/advance` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/simulation/advance | Integrate with typed API client and runtime Zod validation |
| `GET /worlds/${this.worldId}/state (src/world/worldStore.ts)` | `/api/v1/worlds/{param}/state` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/state | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${this.worldId}/commands (src/world/worldStore.ts)` | `/api/v1/worlds/{param}/commands` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/commands | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${this.worldId}/undo (src/world/worldStore.ts)` | `/api/v1/worlds/{param}/undo` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/undo | Integrate with typed API client and runtime Zod validation |
| `GET /diagnostics/metrics (src/components/diagnostics/PerformanceDashboardModal.tsx)` | `/api/v1/diagnostics/metrics` | None (Contract Matched) | Route matches backend /api/v1/diagnostics/metrics | Integrate with typed API client and runtime Zod validation |
| `POST /diagnostics/toggle (src/components/diagnostics/PerformanceDashboardModal.tsx)` | `/api/v1/diagnostics/toggle` | None (Contract Matched) | Route matches backend /api/v1/diagnostics/toggle | Integrate with typed API client and runtime Zod validation |
| `POST /diagnostics/reset (src/components/diagnostics/PerformanceDashboardModal.tsx)` | `/api/v1/diagnostics/reset` | None (Contract Matched) | Route matches backend /api/v1/diagnostics/reset | Integrate with typed API client and runtime Zod validation |
| `GET /worlds/${civId} (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param} | Integrate with typed API client and runtime Zod validation |
| `GET /civilizations/${civId} (src/services/civilizationApi.ts)` | `NONE` | Missing Backend Route or URL Drift | No route matching /civilizations/{param} in backend OpenAPI schema | Add additive alias route in backend or route through generated typed client |
| `GET /worlds (src/services/civilizationApi.ts)` | `/api/v1/worlds` | None (Contract Matched) | Route matches backend /api/v1/worlds | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${civId}/simulation/advance (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/simulation/advance` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/simulation/advance | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${civId}/buildings (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/buildings` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/buildings | Integrate with typed API client and runtime Zod validation |
| `PATCH /worlds/${civId}/buildings/${buildingId}/upgrade (src/services/civilizationApi.ts)` | `NONE` | Missing Backend Route or URL Drift | No route matching /worlds/{param}/buildings/{param}/upgrade in backend OpenAPI schema | Add additive alias route in backend or route through generated typed client |
| `DELETE /worlds/${civId}/buildings/${buildingId} (src/services/civilizationApi.ts)` | `NONE` | Missing Backend Route or URL Drift | No route matching /worlds/{param}/buildings/{param} in backend OpenAPI schema | Add additive alias route in backend or route through generated typed client |
| `GET /worlds/${civId}/technology (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/technology` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/technology | Integrate with typed API client and runtime Zod validation |
| `GET /worlds/${civId}/technology/overview (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/technology/overview` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/technology/overview | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${civId}/technologies/${techId}/unlock (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/technologies/{param}/unlock` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/technologies/{param}/unlock | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${civId}/technology/${techId}/eureka (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/technology/{param}/eureka` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/technology/{param}/eureka | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${civId}/technology/${techId}/complete (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/technology/{param}/complete` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/technology/{param}/complete | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${civId}/policies/${policyId}/toggle (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/policies/{param}/toggle` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/policies/{param}/toggle | Integrate with typed API client and runtime Zod validation |
| `POST /policies/deliberate (src/services/civilizationApi.ts)` | `/api/v1/policies/deliberate` | None (Contract Matched) | Route matches backend /api/v1/policies/deliberate | Integrate with typed API client and runtime Zod validation |
| `POST /policies/custom (src/services/civilizationApi.ts)` | `/api/v1/policies/custom` | None (Contract Matched) | Route matches backend /api/v1/policies/custom | Integrate with typed API client and runtime Zod validation |
| `POST /policies/record-feedback (src/services/civilizationApi.ts)` | `/api/v1/policies/record-feedback` | None (Contract Matched) | Route matches backend /api/v1/policies/record-feedback | Integrate with typed API client and runtime Zod validation |
| `GET /policies/learning-status (src/services/civilizationApi.ts)` | `/api/v1/policies/learning-status` | None (Contract Matched) | Route matches backend /api/v1/policies/learning-status | Integrate with typed API client and runtime Zod validation |
| `GET /policies/model-accuracy (src/services/civilizationApi.ts)` | `/api/v1/policies/model-accuracy` | None (Contract Matched) | Route matches backend /api/v1/policies/model-accuracy | Integrate with typed API client and runtime Zod validation |
| `POST /policies/train-benchmark (src/services/civilizationApi.ts)` | `/api/v1/policies/train-benchmark` | None (Contract Matched) | Route matches backend /api/v1/policies/train-benchmark | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${civId}/scenarios (src/services/civilizationApi.ts)` | `NONE` | Missing Backend Route or URL Drift | No route matching /worlds/{param}/scenarios in backend OpenAPI schema | Add additive alias route in backend or route through generated typed client |
| `POST /worlds/${civId}/observatory/${experimentId}/start (src/services/civilizationApi.ts)` | `NONE` | Missing Backend Route or URL Drift | No route matching /worlds/{param}/observatory/{param}/start in backend OpenAPI schema | Add additive alias route in backend or route through generated typed client |
| `POST /auth/login (src/services/civilizationApi.ts)` | `/api/v1/auth/login` | None (Contract Matched) | Route matches backend /api/v1/auth/login | Integrate with typed API client and runtime Zod validation |
| `POST /auth/register (src/services/civilizationApi.ts)` | `/api/v1/auth/register` | None (Contract Matched) | Route matches backend /api/v1/auth/register | Integrate with typed API client and runtime Zod validation |
| `GET /auth/me (src/services/civilizationApi.ts)` | `/api/v1/auth/me` | None (Contract Matched) | Route matches backend /api/v1/auth/me | Integrate with typed API client and runtime Zod validation |
| `POST /auth/logout (src/services/civilizationApi.ts)` | `/api/v1/auth/logout` | None (Contract Matched) | Route matches backend /api/v1/auth/logout | Integrate with typed API client and runtime Zod validation |
| `GET /admin/stats (src/services/civilizationApi.ts)` | `/api/v1/admin/stats` | None (Contract Matched) | Route matches backend /api/v1/admin/stats | Integrate with typed API client and runtime Zod validation |
| `GET /admin/users (src/services/civilizationApi.ts)` | `/api/v1/admin/users` | None (Contract Matched) | Route matches backend /api/v1/admin/users | Integrate with typed API client and runtime Zod validation |
| `POST /admin/users (src/services/civilizationApi.ts)` | `/api/v1/admin/users` | None (Contract Matched) | Route matches backend /api/v1/admin/users | Integrate with typed API client and runtime Zod validation |
| `PUT /admin/users/${userId} (src/services/civilizationApi.ts)` | `/api/v1/admin/users/{param}` | None (Contract Matched) | Route matches backend /api/v1/admin/users/{param} | Integrate with typed API client and runtime Zod validation |
| `DELETE /admin/users/${userId} (src/services/civilizationApi.ts)` | `/api/v1/admin/users/{param}` | None (Contract Matched) | Route matches backend /api/v1/admin/users/{param} | Integrate with typed API client and runtime Zod validation |
| `GET /worlds/${worldId}/budget (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/budget` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/budget | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${worldId}/budget (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/budget` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/budget | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${worldId}/bonds/issue (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/bonds/issue` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/bonds/issue | Integrate with typed API client and runtime Zod validation |
| `POST /worlds/${worldId}/bonds/repay (src/services/civilizationApi.ts)` | `/api/v1/worlds/{param}/bonds/repay` | None (Contract Matched) | Route matches backend /api/v1/worlds/{param}/bonds/repay | Integrate with typed API client and runtime Zod validation |
| `POST ${baseUrl}/register (src/services/authApi.ts)` | `/api/v1/auth/register` | None (Contract Matched) | Route matches backend /api/v1/auth/register | Integrate with typed API client and runtime Zod validation |
| `POST ${baseUrl}/login (src/services/authApi.ts)` | `/api/v1/auth/login` | None (Contract Matched) | Route matches backend /api/v1/auth/login | Integrate with typed API client and runtime Zod validation |
| `GET ${baseUrl}/me (src/services/authApi.ts)` | `/api/v1/auth/me` | None (Contract Matched) | Route matches backend /api/v1/auth/me | Integrate with typed API client and runtime Zod validation |
| `POST ${baseUrl}/logout (src/services/authApi.ts)` | `/api/v1/auth/logout` | None (Contract Matched) | Route matches backend /api/v1/auth/logout | Integrate with typed API client and runtime Zod validation |

## 2. WebSocket Connection Audit

| Component | Endpoint | Status | Features | Planned Fix |
|---|---|---|---|---|
| `CivoraEventClient.ts` | `/ws/world/{world_id}` | Active | Exponential backoff, token auth query param, heartbeat, auto-resync | Connection status UI indicator & TS discriminated union payload typing |
| `worldStore.ts` | `/ws/world/{world_id}` | Duplicate WebSocket implementation | Ad-hoc reconnect with fixed timeout | Unify into central CivoraEventClient single source of truth |

## 3. High-Priority Connection Findings

1. **Duplicate WebSocket Implementations**: `CivoraEventClient.ts` and `worldStore.ts` both maintain separate WebSockets to `/ws/world/{id}`. They must be consolidated so all real-time events flow through `CivoraEventClient`.
2. **Missing UI Connection Status Indicator**: While `CivoraEventClient` sets status in `performanceMonitor`, the top navigation bar lacks a persistent, styled connection status pill (Connected / Reconnecting / Offline).
3. **Missing Typed Boundary Validation**: API responses are cast directly to interfaces without schema validation. Any schema drift silently produces undefined/NaN values.
4. **Base URL Normalization**: Production runs on same origin `/api/v1` while dev runs on `http://127.0.0.1:8000/api/v1`. Unified API client standardizes this transparently.