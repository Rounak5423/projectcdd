# GENESIS - The Artificial Civilisation Engine

An interactive, simulated society. Hundreds of individual citizens work, learn, fall ill, form families and
react to resources, the economy, the environment, your policies and random events. A Three.js 3D world shows the
real state of the simulation; the Python backend is the only source of truth.

**Stack:** Python 3.10+, FastAPI, SQLite, WebSockets, Three.js, plain HTML/CSS/JS.

## 1. Install on Windows (VS Code)

1. Install Python 3.10 or newer from python.org (tick **Add python.exe to PATH**).
2. Extract `GENESIS_NEW.zip` somewhere simple, e.g. `C:\Projects\`. You should get `C:\Projects\GENESIS_NEW\`.
3. In VS Code: **File > Open Folder...** and choose `GENESIS_NEW`.
4. Open a terminal: **Terminal > New Terminal** (PowerShell) and run:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn genesis.api.main:app --reload
```

If PowerShell says scripts are disabled, run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then activate again.
Expected output ends with `Uvicorn running on http://127.0.0.1:8000`.

5. Open **http://127.0.0.1:8000** in your browser (internet needed once for the Three.js library, see `genesis/static/vendor/README.txt` for offline use).

Shortcut: `.\run.ps1` does steps 4's commands for you.

## 2. Using GENESIS

* A short introduction appears on first launch (reopen it from **Help**).
* **Observe** tab: rotate/zoom the 3D world, click a person or building, read the dashboard cards (click one for an
  explanation), see history charts, events and the timeline that explains what happened, why and what you can do.
* **Control** tab: Start/Pause/Advance, speed, build (pick a building, click a green tile, confirm), upgrade (select a building),
  policies, research, experiments, snapshots, futures and comparison.
* Every spending action shows a confirmation screen first. Switching tabs never resets anything.
* Time: one simulation day = one tick. At 1x a day lasts 2 seconds. A simulated year = 60 days (citizens age one year per 60 days).
* Your civilisation is saved in `data/genesis.db` (autosave every 5 days and after every action). Closing the app freezes the world
  (offline progression is **off** by default; see `.env.example`).

## 3. Run the tests

```powershell
python -m pytest -q
```
or `python -m unittest discover -s tests -t .`. Expected: all tests pass (API tests need `fastapi` and `httpx` installed).

## 4. Project layout

```
GENESIS_NEW/
  genesis/
    simulation/   citizens, intelligence, population, resources, economy, infrastructure, environment,
                  governance, events, research, progression, metrics, recommendations, experiments,
                  scenarios, seed, engine, config
    models/       world.py (state container + seeded RNG), schemas.py (API request models)
    persistence/  store.py (SQLite)
    api/          main.py, deps.py, routes/api.py
    service.py    validation + actions (the only code the API calls)
    static/       index.html, style.css, app.js, world3d.js
  tests/  docs/ (API.md, ARCHITECTURE.md)  requirements.txt  .env.example
```

## 5. What is honestly implemented (and simplified)

Implemented and tested: seeded population with 13 professions, citizen needs/goals/learning/memories, births/deaths/migration/family pairing,
education (school, secondary, university) and retraining, jobs from building slots, four resources with shortages, economy (GDP, wages,
tax, treasury, Gini, poverty), 9 building types with construction/upgrade, environment, 6 policies, 8+ event types (random and condition-driven),
6 technologies, XP/levels/achievements/missions, GRC ledger, 5 experiments, snapshots, independent branches, comparison, SQLite save/load,
REST + WebSocket API.

Simplifications (by design):
* **Intelligence is rule-based**, not machine learning. `intelligence.decide()` is isolated so a learned policy can replace it later.
* Production depends on **staffing ratio and building condition**, not on each worker's daily activity (a worker "resting" still counts as staffed).
* Citizens move to a spot matching their activity each day (no pathfinding); the 3D view animates between positions.
* Water has no dedicated building: supply comes from the environment plus pipes in housing blocks.
* Upgrades are instant; construction takes fixed days; there is no demolition or repair button (upkeep repairs wear automatically).
* Policies and events affect the world through one-day-delayed modifiers computed at the start of each tick.
* Experiments use two to three independent copies of your civilisation and report simulated outcomes, **not real-world predictions**.
* Observe vs Control is a user-interface distinction; the API itself does not block actions in Observe.
* The numbers are tuned for playability, not calibrated to real economies.

Verification status: the simulation, persistence and service layers have automated tests. The FastAPI routes, WebSocket and browser UI
(including the 3D view) were written carefully and syntax-checked, but could not be run in the environment where they were built.
If something fails on your machine, send me the exact error message from the terminal or the browser console (F12).
