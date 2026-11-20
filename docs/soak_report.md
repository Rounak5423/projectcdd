# GENESIS Engine v2.0 - 30-Minute Movement Soak Test Report

**Date:** 2026-11-20 09:53:28 UTC  
**Execution Mode:** Seeded Deterministic Micro-step Simulation (dt=0.2s, 30 sim-minutes per map)  
**Total Maps Tested:** 5 / 5  

## Invariant Glitch Metrics Table

| Map ID | Terrain Preset | Sim Time | Wall Time | Teleports | Overlaps | Off-Net | Clips | Flips | Orphans | Census Violations | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `aurora-prime` | Verdant River Valley | 1800s | 0.27s | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **PASS** |
| `highland-plateau` | Highland Plateau | 1800s | 0.2s | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **PASS** |
| `archipelago` | Archipelago | 1800s | 0.21s | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **PASS** |
| `boreal-basin` | Boreal Basin | 1800s | 0.24s | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **PASS** |
| `arid-oasis` | Arid Oasis | 1800s | 0.2s | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **PASS** |

## Executive Summary

> [!IMPORTANT]
> **SOAK TEST GATE PASSED WITH ZERO INVARIANT VIOLATIONS (0/7 glitches across 5 maps).**

- **Teleport Glitches:** 0 detected. Micro-stepping and BPR A* dynamic rerouting kept all agents strictly bounded.
- **Kinematic Overlaps:** 0 detected. Intelligent Driver Model (IDM) car-following maintained safe minimum gaps.
- **Network Confinement:** 0 off-network deviations. Multi-lane offset vector perpendicular checks validated.
- **Terrain Elevation Conformance:** 0 clips. Bicubic terrain height evaluation matched vehicle elevations.
- **Orientation Continuity:** 0 angular flips. Heading degree continuity maintained without discontinuities.
- **Trip Contracts & Orphans:** 0 orphan entities. 100% of vehicles and pedestrians carried authoritative contracts.
- **Demographic Census Conservation:** 100% invariant adherence ($walking + driving + riding\_bus + indoor == total\_living$).
