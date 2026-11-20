# GENESIS Engine: Docker & Container Operations Manual

Complete guide to building, running, developing, testing, and deploying the **GENESIS Persistent Artificial Civilisation Engine** using Docker and Docker Compose.

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Prerequisites](#2-prerequisites)
3. [Quick Start (One-Command Production Launch)](#3-quick-start-one-command-production-launch)
4. [Development Workflow (Live Hot-Reload)](#4-development-workflow-live-hot-reload)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Volumes, Persistence & Backup Runbook](#6-volumes-persistence--backup-runbook)
7. [Running Automated Tests in Containers](#7-running-automated-tests-in-containers)
8. [Machine Learning Training Container & GPU Acceleration](#8-machine-learning-training-container--gpu-acceleration)
9. [Updating Dependencies](#9-updating-dependencies)
10. [Troubleshooting & Frequently Asked Questions](#10-troubleshooting--frequently-asked-questions)

---

## 1. Architectural Overview

GENESIS runs as a decoupled, multi-tier containerized system:

```
+---------------------------------------------------------------------------------------+
|                                    HOST MACHINE                                       |
|                                                                                       |
|   HTTP/WS Traffic (Browser)                                                           |
|             |                                                                         |
|             v                                                                         |
|   +-------------------------------------------------------------------------------+   |
|   | Port 3000 (Host)                                                              |   |
|   |         |                                                                     |   |
|   |         v                                                                     |   |
|   | +---------------------------------------------------------------------------+ |   |
|   | |                   FRONTEND SERVICE CONTAINER (Port 8080)                  | |   |
|   | |                         (Nginx 1.27 Alpine, Non-Root)                     | |   |
|   | |                                                                           | |   |
|   | |   Static SPA Files (/assets, index.html)                                  | |   |
|   | |   Reverse Proxy Routes:                                                   | |   |
|   | |     /api/  --> http://backend:8000/api/                                   | |   |
|   | |     /health--> http://backend:8000/health                                 | |   |
|   | |     /ws/   --> http://backend:8000/ws/ (WebSocket Upgrade, 24h timeout) | |   |
|   | +------------------------------------|--------------------------------------+ |   |
|   +--------------------------------------|----------------------------------------+   |
|                                          |                                            |
|                               Internal Bridge Network                                 |
|                                (genesis-internal)                                     |
|                                          |                                            |
|                                          v                                            |
|   +-------------------------------------------------------------------------------+   |
|   |                     BACKEND SERVICE CONTAINER (Port 8000)                     |   |
|   |                    (Python 3.12-slim, Non-Root UID 10001)                     |   |
|   |                                                                               |   |
|   |   FastAPI REST API & Authenticated WebSocket Server                           |   |
|   |   Discrete Deterministic Simulation Tick Loop (1 Worker Process)              |   |
|   |   SQLite Write-Ahead Logging (WAL) Persistent Database Engine                 |   |
|   +--------------------------------------|----------------------------------------+   |
|                                          |                                            |
|                                          | POSIX File Locks & Shared Memory           |
|                                          v                                            |
|   +-------------------------------------------------------------------------------+   |
|   |                          NAMED DOCKER VOLUMES                                 |   |
|   |                                                                               |   |
|   |   genesis_db_data     --> /app/db (SQLite genesis.db, WAL & SHM files)        |   |
|   |   genesis_ml_models   --> /app/ml/models (Serialized .joblib model bundles)   |   |
|   |   genesis_ml_runs     --> /app/ml/runs (Experiment traces & evaluations)      |   |
|   |   genesis_ml_data     --> /app/ml/data (Generated Parquet telemetry)          |   |
|   |   genesis_uploads     --> /app/uploads (Civic badges & avatar media)          |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

### Key Architectural Tenets
1. **Single Writer SQLite WAL Constraint:** SQLite in Write-Ahead Log (WAL) mode requires shared POSIX memory (`-shm`) and inter-process locking. The backend is configured as a single process (`--workers 1`) on a local Docker named volume. **Do NOT scale the backend service to multiple container replicas**, as network filesystems or multi-writer setups will corrupt SQLite file locks.
2. **Same-Origin Reverse Proxy:** The Nginx frontend acts as a unified reverse proxy on port `8080` (mapped to host `3000`). The browser communicates exclusively with the frontend container; `/api/` calls and `/ws/` WebSocket connections are transparently routed to `http://backend:8000`.
3. **Hardened Non-Root Security:** All containers run as an unprivileged system user (`genesis`, UID `10001`, GID `10001`) with read-only root filesystems and explicit `tmpfs` mounts.

---

## 2. Prerequisites

- **Docker Engine:** Version 24.0 or newer
- **Docker Compose:** Version 2.20 or newer (or Docker Compose v5+)
- **Make:** Standard GNU Make (optional, for CLI shortcuts)

Verify installation:
```bash
docker --version
docker compose version
```

---

## 3. Quick Start (One-Command Production Launch)

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/Rounak5423/projectcdd.git
cd projectcdd
git checkout feat/docker

# Copy environment template
cp .env.example .env
```

> [!IMPORTANT]
> When `ENVIRONMENT=production`, you must provide a secure 64-character JWT secret and custom admin password. Generate one with:
> ```bash
> python3 -c "import secrets; print(secrets.token_hex(32))"
> ```
> In development mode (`ENVIRONMENT=development`), the default development fallbacks can be used.

### Step 2: Build & Start Stack
Using Make:
```bash
make up
```
Or directly with Docker Compose:
```bash
docker compose up -d
```

### Step 3: Access Application & Default Credentials
- **Main Web Application:** [http://localhost:3000](http://localhost:3000)
- **Health Probes:**
  - Gateway: [http://localhost:3000/health](http://localhost:3000/health)
  - API Health: [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health)

#### Default Pre-Seeded User Accounts (Development Mode):
| Role | Username | Default Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `AdminPassword123!` | Full control, policy override, world resets, diagnostics |
| **Player / Citizen** | `player1` | `UserPassword123!` | Standard player gameplay, building, research |

Verify container health:
```bash
make status
# or
docker compose ps
```

---

## 4. Development Workflow (Live Hot-Reload)

In development mode:
- The **Backend** binds host port `8000`, live bind-mounts `./genesis-engine/backend:/app`, and executes `uvicorn --reload`.
- The **Frontend** runs the Vite HMR development server on port `5173`, live bind-mounting source files for sub-second hot updates.

Launch development stack:
```bash
make dev
```
Or:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Access points in dev mode:
- **Vite Frontend (HMR):** [http://localhost:5173](http://localhost:5173)
- **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 5. Environment Variables Reference

| Variable Name | Default | Required in Prod | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | Yes | App runtime mode (`production`, `development`, `staging`, `test`). |
| `GENESIS_JWT_SECRET` | `None` | **YES** | Cryptographic key for JWT tokens (min 32 chars). Backend halts if default is used in prod. |
| `ADMIN_DEFAULT_PASSWORD` | `None` | **YES** | Initial administrator password. Backend halts if `AdminPassword123!` is used in prod. |
| `USER_DEFAULT_PASSWORD` | `None` | Optional | Initial default player password. |
| `GENESIS_DB_PATH` | `/app/db/genesis.db` | No | SQLite database file location inside container. |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Yes | Comma-separated whitelist of allowed CORS origins. Wildcard `*` prohibited in prod. |
| `FRONTEND_PORT` | `3000` | No | Host port mapped to Nginx reverse proxy. |
| `BACKEND_PORT` | `8000` | No | Host port mapped to FastAPI (exposed in dev mode). |
| `ML_ENABLED` | `false` | No | Toggles empirical ML models vs. deterministic rule-based algorithms. |
| `TELEMETRY_ENABLED` | `false` | No | Enables streaming parquet simulation telemetry generation. |
| `AUTH_RATE_LIMIT_PER_MINUTE`| `30` | No | Maximum authentication attempts allowed per client IP per minute. |

---

## 6. Volumes, Persistence & Backup Runbook

### SQLite WAL Mechanics
GENESIS uses SQLite with `PRAGMA journal_mode = WAL`.
- `genesis.db`: Authoritative relational database.
- `genesis.db-wal`: Write-Ahead Log containing committed transactions not yet checkpointed.
- `genesis.db-shm`: Shared-memory index mapping WAL frames.

The Docker volume `genesis_db_data` uses the default `local` storage driver, guaranteeing native POSIX memory mapping and file locking.

### Live Hot Backup
Never copy `genesis.db` directly while the simulation is running, as this risks capturing an inconsistent WAL checkpoint. Use the automated hot-backup target:

```bash
make backup-db
```
This instructs SQLite to take an atomic vacuum snapshot using the SQLite Online Backup API into `./backups/genesis_backup_<TIMESTAMP>.db`.

### Database Restoration
To restore a snapshot:
```bash
make restore-db BACKUP_FILE=backups/genesis_backup_20261115_120000.db
```
The restoration target cleanly stops the backend, restores the database, deletes any stale `-wal` or `-shm` files, and restarts the service.

### Full Data Purge (Reset)
To reset the database and begin with a clean slate:
```bash
make reset-db
```

---

## 7. Running Automated Tests in Containers

### Direct In-Container Test Execution (Fastest & Standard)
Execute the verification suites directly inside the running backend container:

```bash
# 1. Complete Pytest Suite (219 tests)
docker compose exec backend pytest tests/ -v

# 2. Map & Topology Invariant Validation (all 5 maps)
docker compose exec backend python -m engine.validate_maps

# 3. 30-Minute Movement & Invariant Soak Test
docker compose exec backend python scripts/soak_test_movement.py

# 4. Online SQLite Backup Validation
docker compose exec backend python db/backup.py create
```

### Dedicated E2E Stack Test Profile
GENESIS also provides a dedicated test container service (profile `tests`) built on Microsoft Playwright that executes verification against the live container stack:

```bash
make test
# or
docker compose --profile tests run --rm tests
```

The test runner validates:
1. **Pytest Regression Suite:** 171 tests covering authentication, RBAC, economics, demographics, road network graph, causal DAG, and API contract drift.
2. **365-Tick Live Simulation Verification:** Verifies 100% population-to-citizen parity, resource conservation, and zero drift across a full simulation year.
3. **Playwright E2E Suite:** Runs headless Chromium tests asserting zero visual blanks ("undefined", "NaN", null) and verifies live telemetry updates.

---

## 8. Machine Learning Training Container & GPU Acceleration

The `ml` service is maintained as an on-demand container profile containing the complete scientific stack (`requirements-ml.txt`: NumPy, SciPy, Pandas, Scikit-Learn, LightGBM, XGBoost):

### Running ML Training (CPU)
```bash
make train
```
Or:
```bash
docker compose --profile ml run --rm ml python ml/train_simulation_models.py
```

### NVIDIA GPU Acceleration Override
If you have an NVIDIA GPU and the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) installed:

```bash
docker compose -f docker-compose.yml -f docker-compose.gpu.yml --profile ml run --rm ml
```

---

## 9. Updating Dependencies

### Backend Dependencies
1. Edit `genesis-engine/backend/requirements.txt` (or `requirements-ml.txt`).
2. Rebuild the backend image without cache:
   ```bash
   docker compose build --no-cache backend
   ```

### Frontend Dependencies
1. Edit `package.json`.
2. Update the lockfile: `npm install --package-lock-only`.
3. Rebuild the frontend image without cache:
   ```bash
   docker compose build --no-cache frontend
   ```

---

## 10. Troubleshooting & Frequently Asked Questions

### Port Conflicts (Port 3000 or 8000 Already in Use)
- **Symptom:** `Error response from daemon: driver failed programming external connectivity: Bind for 0.0.0.0:3000 failed: port is already allocated`.
- **Cause:** A local dev server (like Vite or Node) or another container is occupying port 3000 or 8000.
- **Fix:** Identify and stop the occupying process:
  ```bash
  # Check what process is on port 3000
  lsof -i :3000
  # Kill the conflicting PID
  kill -9 <PID>
  # Alternatively, change FRONTEND_PORT in .env (e.g. FRONTEND_PORT=3001)
  ```

### SQLite WAL Lock / Concurrency Errors
- **Symptom:** `database is locked` or `sqlite3.OperationalError: cannot operate on a closed database`.
- **Cause:** Multiple worker processes attempting concurrent writes to SQLite WAL, or database located on an unsupported network filesystem (NFS/CIFS) that lacks POSIX locking.
- **Fix:**
  1. The backend **must run exactly 1 worker process** (`--workers 1`). Do not configure multiple replicas or workers.
  2. Always use Docker local named volumes (`genesis_db_data`), never network mounts.
  3. If stale lock files remain after a crash:
     ```bash
     docker compose stop backend
     # Restarting will cleanly recover WAL frames
     docker compose start backend
     ```

### Volume Cleanup & Fresh Reset
- **Symptom:** Need to completely reset all simulation databases and volume state.
- **Fix:**
  ```bash
  # Stop containers and purge all named volumes
  docker compose down -v
  # Restart clean
  docker compose up -d
  ```

### WebSocket disconnects or fails to connect
- **Cause:** Proxy timeout or misconfigured host header.
- **Fix:** Nginx is configured with `proxy_read_timeout 86400s;` and passes `Upgrade` and `Connection "upgrade"` headers. Ensure your browser connects via same-origin `http://localhost:3000` so requests reach Nginx directly.

### "CRITICAL SECURITY FAILURE: GENESIS_JWT_SECRET must be set..."
- **Cause:** Starting with `ENVIRONMENT=production` while using the development default JWT secret.
- **Fix:** Set a 64-character hex string in your `.env` file or switch to `ENVIRONMENT=development` for local testing.

### Volume permission denied on Linux / WSL2
- **Cause:** Host volume ownership differs from the in-container UID `10001`.
- **Fix:** Local Docker named volumes handle ownership automatically. If using host bind mounts on Linux:
  ```bash
  sudo chown -R 10001:10001 /var/lib/docker/volumes/projectcdd_genesis_db_data/_data
  ```

### Apple Silicon (M1/M2/M3) Multi-Arch Performance
- Images are built natively for `linux/arm64` on Apple Silicon and `linux/amd64` on x86 servers. No Rosetta translation is needed.
