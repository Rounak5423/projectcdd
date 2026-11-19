# API contract (base URL `http://127.0.0.1:8000`)

Errors: HTTP 400 `{"detail": "plain-language message"}` for invalid actions; 422 for malformed bodies.
**Confirmation pattern:** actions that spend resources accept `"confirm": false` (default) and return
`{"executed": false, "needs_confirmation": true, "preview": {...}}` without changing anything. Repeat with `"confirm": true` to execute
(`{"executed": true, "message": "..."}`).

| Method & path | Body | Returns |
|---|---|---|
| GET `/api/state` | - | Full public world state (meta, map, citizens[compact], buildings, resources, economy, environment, services, policies, events, progression, research, grc, experiments, metrics, cards, today, feed, recommendations, running) |
| GET `/api/catalog` | - | Buildings (current cost), policies, glossary, presets, experiments, speeds, offline rules |
| GET `/api/history?limit=400` | - | Daily metric records |
| GET `/api/citizens/{id}` / `/api/buildings/{id}` | - | Full profile / building details |
| GET `/api/feed`, `/api/recommendations` | - | Explanations / advice from real conditions |
| POST `/api/sim/start` `pause` `resume` | - | `{status}` |
| POST `/api/sim/step` | `{days:1-30}` | `{day}` (only while paused) |
| POST `/api/sim/speed` | `{speed:1\|2\|5\|10}` | `{speed}` |
| POST `/api/buildings` | `{type,x,z,confirm}` | construction preview / result |
| POST `/api/buildings/{id}/upgrade` | `{confirm}` | upgrade preview / result |
| GET `/api/policies` | - | Policies with state and measured results |
| POST `/api/policies/{key}/activate` | `{confirm}` | preview / result |
| POST `/api/policies/{key}/cancel` | - | result |
| GET `/api/research`, POST `/api/research/start` | `{tech}` | Tech tree status / start |
| GET `/api/experiments` | - | experiments (queued/running/completed/failed), GRC ledger, missions, achievements |
| POST `/api/experiments` | `{key,confirm}` | preview (cost, branches, duration, expected outputs, assumptions) or run |
| POST `/api/snapshots` `{name}`, GET `/api/snapshots` | | snapshot id / list |
| POST `/api/branches` | `{preset,name,snapshot_id?}` | new independent branch (`education_focus`, `environment_focus`, `industry_focus`, `none`) |
| GET `/api/branches`; POST `/api/branches/{id}/advance` `{days}`; DELETE `/api/branches/{id}` | | |
| GET `/api/compare?ids=main,W0001` | - | Table of real metrics per world |
| POST `/api/save`, POST `/api/world/new` `{seed,name,confirm}` | | |

**WebSocket `/ws`:** the server sends `{"type":"state","data":<same as GET /api/state>}` on connect and after every simulated day or action.
