# Running GENESIS Engine on Localhost

Complete instructions for launching, configuring, and verifying the GENESIS Civilisation Simulation Engine on localhost with zero errors.

---

## 1. Quick Start with a Single Command

To launch both the FastAPI backend and React frontend concurrently:

```bash
npm run dev:all
```

This command runs `scripts/dev_all.cjs`, which:
1. Verifies that port 8000 and port 5173 are free (exits with a clear diagnostic message if occupied).
2. Spawns the FastAPI backend on `http://localhost:8000`.
3. Spawns the Vite development frontend on `http://localhost:5173`.

---

## 2. Port Allocation Map

| Service | Port | Endpoint / URL | Purpose |
|---|---|---|---|
| **Vite Frontend** | `5173` | [http://localhost:5173](http://localhost:5173) | React 19 + Three.js 3D WebGL isometric city viewer & tactical HUD |
| **FastAPI Backend** | `8000` | [http://localhost:8000](http://localhost:8000) | Authoritative discrete simulation core, SQLite WAL, WebSockets |
| **Health Probe** | `8000` | [http://localhost:8000/health](http://localhost:8000/health) | Engine liveness and active worlds telemetry |
| **Interactive API Docs**| `8000`| [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger OpenAPI UI |
| **Alternative Standalone**| `8000`| `python -m uvicorn genesis.api.main:app` | Standalone Python prototype (`origin/Saanvi`) |

---

## 3. Environment Variables & Credentials

Create `.env` files in both the repository root and `genesis-engine/backend/`:

```bash
cp .env.example .env
cp genesis-engine/backend/.env.example genesis-engine/backend/.env
```

### Seeded Authentication Credentials

The local development database (`genesis-engine/backend/db/genesis.db`) is pre-seeded with two accounts:

| Role | Username | Password | Email | Access Scope |
|---|---|---|---|---|
| **Administrator** | `admin` | `AdminPassword123!` | `admin@genesis.ai` | Full simulation controls, speed overrides, policy enactment, admin console |
| **Player / Citizen** | `player1` | `UserPassword123!` | `player1@genesis.ai` | 3D observation, citizen inspection, statistics viewing |

### Production Environment Variables to Fill In

When deploying to production (`ENVIRONMENT=production`):
- `GENESIS_JWT_SECRET`: Must be a custom 64-character random hexadecimal string (generate with `python3 -c "import secrets; print(secrets.token_hex(32))"`). The server will refuse to start in production if the development placeholder is used.
- `ADMIN_DEFAULT_PASSWORD`: Custom strong administrator password.
- `USER_DEFAULT_PASSWORD`: Custom strong player password.
- `ALLOWED_ORIGINS`: Comma-separated list of exact production domains (e.g. `https://civora.example.com`).

---

## 4. Running the Verification Tests

### Complete Backend Test Suite (185 tests)
```bash
cd genesis-engine/backend
./venv/bin/pytest tests/ -q
```
*Expected: 185 passed, 0 failures.*

### Gate 2 Microscopic Movement Tests (7 tests)
```bash
cd genesis-engine/backend
./venv/bin/pytest tests/test_gate2_movement_logic.py -v
```
*Expected: 7 passed (IDM car-following, A\* dynamic rerouting, traffic signals, emergency priority, pedestrian crosswalks, headless scale).*

### Standalone Prototype Tests (43 tests)
```bash
./genesis-engine/backend/venv/bin/pytest tests/ -q
```
*Expected: 43 passed (Service API, citizen lifecycle, economy, persistence).*

### Automated Multi-Map Invariant Validation
```bash
cd genesis-engine/backend
./venv/bin/python3 -m engine.validate_maps
```
*Expected: 100% pass across all 5 maps (`aurora-prime`, `highland-plateau`, `archipelago`, `boreal-basin`, `arid-oasis`).*

### Frontend Typecheck & Production Build
```bash
npm run build
```
*Expected: `tsc` passes with 0 errors, Vite generates production assets in `dist/`.*

### Full Playwright End-to-End Verification (Desktop & Mobile)
```bash
node scripts/e2e_verification.cjs
```
*Expected: Desktop (1920x1080) and Mobile (390x844) flows pass with zero errors.*

---

## 5. Troubleshooting & Port Conflicts

### Port Already in Use (EADDRINUSE)
If `npm run dev:all` reports that port 8000 or 5173 is occupied:
```bash
# Check what process is holding port 8000 or 5173:
lsof -i :8000
lsof -i :5173

# Terminate occupied processes:
lsof -ti :8000 | xargs kill -9
lsof -ti :5173 | xargs kill -9
```

### Resetting SQLite Database
If the database needs to be re-initialized to initial world state:
```bash
cd genesis-engine/backend
rm -f db/genesis.db db/genesis.db-wal db/genesis.db-shm
./venv/bin/python3 -c "from engine.world.simulation import get_global_simulation; sim = get_global_simulation('aurora-prime'); print('Re-seeded aurora-prime at tick', sim.world.tick)"
```
