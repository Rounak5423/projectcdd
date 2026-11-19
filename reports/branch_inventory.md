# Branch Inventory & Merge Strategy Report

**Repository:** GENESIS Civilisation Simulation Engine (`projectcdd.git`)  
**Base Branch:** `main` (Identified as the authoritative trunk containing Phase 0 baseline and Phase 1 simulation core v2)  
**Target Integration Branch:** `integration/all-branches`  
**Generated At:** 2026-11-16  

---

## 1. Executive Summary & Base Identification
A comprehensive audit of all 29 local and remote branches in the repository was executed.
- **Authoritative Trunk (`main`):** `636a92cc` (`feat(sim): implement authoritative simulation core v2 (Phase 1)`).
- **Core Contributor Branches:**
  - `origin/rounak`: Causal engine integration, telemetry, disaster routes, and world command API by Rounak.
  - `origin/saanavi`: Continuous spline road geometry, junction tables, and roundabout perimeter fixes by Saanavi.
  - `origin/Saanvi`: Early Python civilization prototype by Saanvi (Nov 8), providing complementary standalone agent/memory architecture.
  - `origin/Prince` & `origin/sarthak07`: Point to initial commit `669cd11b` (ancestral).
  - Feature branches (`feat/docker`, `feat/genesis-v2`, `feat/ml-models`, `feat/sim-ml`, `feat/unified-world`, `fix/*`): Feature-specific milestones authored by Divyamsh, already ancestor-merged into `main` and validated.
  - `integration/merge-rounak-saanavi`: Integration branch uniting Rounak and Saanavi's work plus authoritative microscopic movement logic (Gate 2).

---

## 2. Comprehensive Branch Inventory Table

| Branch | Last Commit Date | Author | Ahead / Behind `main` | Purpose & Changed Areas | Risk of Conflict | Merge Decision & Justification |
|---|---|---|---|---|---|---|
| `main` | 2026-11-16 | Divyamsh | 0 / 0 | Base trunk; authoritative discrete simulation core v2, 9 sub-modules, database WAL. | None | **Base**: Root for `integration/all-branches`. |
| `origin/main` | 2026-11-04 | Rounak5423 | 0 / 128 | Remote tracking placeholder at initial repository commit. | Low | **Ancestor**: Fully contained in `main`. |
| `origin/rounak` | 2026-11-10 | rounak5423 | 1 / 32 | Causal engine integration, vital signs telemetry, disaster routes, budget API. | Medium | **Merge**: Unified into integration trunk. |
| `origin/saanavi` | 2026-11-09 | SaanaviRB123 | 0 / 35 | Continuous road splines, flank boulevards, seamless junctions, roundabout perimeters. | Medium | **Merge**: Unified into integration trunk. |
| `origin/Saanvi` | 2026-11-08 | saanvilokesh08-debug | 2 / 128 | Standalone Python prototype (`agents/`, `core/engine.py`, `genesis/`). | Low (Root config only) | **Merge**: Merged cleanly; root config files unioned to preserve 100% of code. |
| `origin/Prince` | 2026-11-04 | Rounak5423 | 0 / 128 | Initial branch point at repo creation. | None | **Skip (Ancestor)**: 100% identical to initial commit, contained in `main`. |
| `origin/sarthak07` | 2026-11-04 | Rounak5423 | 0 / 128 | Initial branch point at repo creation. | None | **Skip (Ancestor)**: 100% identical to initial commit, contained in `main`. |
| `origin/Divyamsh` | 2026-11-10 | Divyamsh | 0 / 7 | Causal Insights page connection, apiClient routing, dev proxy. | None | **Ancestor**: Already merged into `main`. |
| `origin/feat/docker` | 2026-11-16 | Divyamsh | 0 / 2 | Multi-stage Dockerfiles, Docker Compose, Nginx config, non-root healthcheck. | None | **Ancestor**: Fully merged into `main`. |
| `origin/feat/genesis-v2` | 2026-11-16 | Divyamsh | 0 / 0 | Full simulation core v2 rebuild. | None | **Ancestor**: Matches `main`. |
| `origin/feat/ml-models` | 2026-11-08 | Divyamsh | 0 / 74 | ML models, training pipelines, policy weights. | None | **Ancestor**: Merged into `main`. |
| `origin/feat/sim-ml` | 2026-11-09 | Divyamsh | 0 / 72 | Multi-level AI model wiring across simulation hierarchy. | None | **Ancestor**: Merged into `main`. |
| `origin/feat/unified-world` | 2026-11-09 | Divyamsh | 0 / 65 | Unified world architecture, command layer, derived metrics. | None | **Ancestor**: Merged into `main`. |
| `origin/fix/integration-ml-blanks` | 2026-11-10 | Divyamsh | 0 / 7 | Fix causal telemetry and ML blank fallbacks. | None | **Ancestor**: Merged into `main`. |
| `origin/integration/merge-rounak-saanavi`| 2026-11-16 | Divyamsh | 3 / 0 | Integration branch uniting Rounak and Saanavi's work. | Low | **Merge**: Core foundation for `integration/all-branches`. |
| `Divyamsh` (local) | 2026-11-10 | Divyamsh | 0 / 8 | Local tracking branch for master report and changelog. | None | **Ancestor**: Merged into `main`. |
| `backup-divyamsh-work` | 2026-11-07 | Divyamsh | 0 / 111 | Local backup of CS2 depth deliverables. | None | **Ancestor**: Merged into `main`. |
| `backup/wip-2026-11-16` | 2026-11-16 | Divyamsh | 5 / 0 | Working branch with UTF-8 BOM sanitization and map validation. | None | **Merge**: Included in `integration/all-branches`. |
| `feat/docker` (local) | 2026-11-16 | Divyamsh | 0 / 2 | Local docker development branch. | None | **Ancestor**: Merged into `main`. |
| `feat/genesis-v2` (local) | 2026-11-16 | Divyamsh | 0 / 0 | Local simulation core rebuild branch. | None | **Ancestor**: Matches `main`. |
| `feat/ml-models` (local) | 2026-11-08 | Divyamsh | 0 / 74 | Local ML models branch. | None | **Ancestor**: Merged into `main`. |
| `feat/sim-ml` (local) | 2026-11-09 | Divyamsh | 0 / 72 | Local simulation-ML wiring branch. | None | **Ancestor**: Merged into `main`. |
| `feat/unified-world` (local) | 2026-11-10 | Divyamsh | 0 / 32 | Local unified world state branch. | None | **Ancestor**: Merged into `main`. |
| `fix/feature-logic` | 2026-11-09 | Divyamsh | 0 / 69 | Local feature logic wiring branch. | None | **Ancestor**: Merged into `main`. |
| `fix/integration-ml-blanks` | 2026-11-10 | Divyamsh | 0 / 7 | Local ML blanks fix branch. | None | **Ancestor**: Merged into `main`. |
| `fix/sim-coupling` | 2026-11-09 | Divyamsh | 0 / 70 | Local causal simulation coupling branch. | None | **Ancestor**: Merged into `main`. |
| `fix/ui-wiring` | 2026-11-08 | Divyamsh | 0 / 76 | Local UI hotkeys and modals branch. | None | **Ancestor**: Merged into `main`. |
| `integration/merge-rounak-saanavi` (local)| 2026-11-16 | Divyamsh | 5 / 0 | Merged Rounak + Saanvi + Microscopic Movement (Gate 2). | Low | **Merge**: Primary baseline for integration. |

---

## 3. Merge Ordering & Dependency Plan
1. **Base:** `main` (`636a92cc`).
2. **Branch from base:** `integration/all-branches`.
3. **Step 2.1 - Merge `integration/merge-rounak-saanavi`:** Unites all Rounak and Saanavi work, modern frontend components, and Gate 2 microscopic movement engine.
4. **Step 2.2 - Merge `origin/Saanvi`:** Merges legacy Python prototype codebase (`agents/`, `core/engine.py`, `genesis/`, etc.) ensuring 100% commit and file retention. Resolves root configuration files (`.env.example`, `.gitignore`, `README.md`, `requirements.txt`) by comprehensive union.
5. **Step 2.3 - Verify and Run Checks:** Ensure `pytest`, `tsc --noEmit`, and `npm run build` pass with zero regressions.
