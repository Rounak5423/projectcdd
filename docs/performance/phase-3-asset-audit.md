# CIVORA — Phase 3: Comprehensive 3D Asset & Scene Audit

## 1. Executive Summary

This asset audit inspects all 3D assets, meshes, materials, textures, geometry complexities, and scene configurations across the CIVORA application (Civilization World, Royal Council Chamber, and Advisor Environments).

### Total 3D Asset Footprint
- **Total Models on Disk**: 14 GLB files (10 unique assets, 4 duplicates in downloaded directories).
- **Total Uncompressed Disk Footprint**: ~217.4 MB.
- **Council Active Quorum Footprint**: ~29.13 MB uncompressed per default conclave session (real_carl_manfred + real_fullbody_male + real_freefire_pace + 3 historical models).
- **Extremes Identified**:
  - `real_undead_wizard.glb`: **80.01 MB** and **2,408,689 triangles** (2.4M polygons for a single character)!
  - `real_carl_manfred.glb`: **20.13 MB**, **71,572 triangles**, 15 embedded textures.
  - `real_fullbody_male.glb`: **6.83 MB**, **17,759 triangles**, 17 embedded textures, 1 rigged skeleton.
  - `real_freefire_pace.glb`: **1.24 MB**, **8,197 triangles**, 6 embedded textures.
  - Historical Advisor Models (`adv_*.glb` x 6): **~0.31 MB each**, ~8,150 triangles each, 0 embedded textures.

---

## 2. Model Catalog & Geometry Complexity Audit

| Asset Name | Relative Path | File Size | Meshes | Primitives | Approx. Triangles | Materials | Textures | Embedded Images | Animations / Bones | Compression Used | Loaded Scene |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`real_undead_wizard.glb`** | `public/models/council/` | **80.01 MB** | 24 | 24 | **2,408,689** | 1 | 1 | 1 | 0 anims / 0 skins | None (Raw GLTF) | Optional Council (`real-magus`) |
| **`real_carl_manfred.glb`** | `public/models/council/` | **20.13 MB** | 16 | 16 | **71,572** | 16 | 15 | 15 | 0 anims / 0 skins | `KHR_materials_clearcoat` | Council Active (`real-carl`) |
| **`real_fullbody_male.glb`** | `public/models/council/` | **6.83 MB** | 10 | 10 | **17,759** | 9 | 17 | 17 | 0 anims / 1 skin (78 bones)| None (Raw GLTF) | Council Active (`real-avatar`) |
| **`real_freefire_pace.glb`** | `public/models/council/` | **1.24 MB** | 6 | 6 | **8,197** | 6 | 6 | 6 | 0 anims / 0 skins | None (Raw GLTF) | Council Active (`real-tactical`) |
| **`adv_chancellor.glb`** | `public/models/council/` | **0.31 MB** | 62 | 62 | **8,506** | 15 | 0 | 0 | 0 anims / 0 skins | `KHR_materials_unlit` | Council Historical (`adv-chancellor`) |
| **`adv_treasurer.glb`** | `public/models/council/` | **0.30 MB** | 61 | 61 | **7,838** | 14 | 0 | 0 | 0 anims / 0 skins | `KHR_materials_unlit` | Council Historical (`adv-treasurer`) |
| **`adv_scholar.glb`** | `public/models/council/` | **0.31 MB** | 62 | 62 | **8,090** | 15 | 0 | 0 | 0 anims / 0 skins | `KHR_materials_unlit` | Council Active & Hist (`adv-scholar`) |
| **`adv_architect.glb`** | `public/models/council/` | **0.30 MB** | 61 | 61 | **7,914** | 14 | 0 | 0 | 0 anims / 0 skins | `KHR_materials_unlit` | Council Historical (`adv-architect`) |
| **`adv_physician.glb`** | `public/models/council/` | **0.31 MB** | 62 | 62 | **8,362** | 15 | 0 | 0 | 0 anims / 0 skins | `KHR_materials_unlit` | Council Active & Hist (`adv-physician`) |
| **`adv_keeper.glb`** | `public/models/council/` | **0.31 MB** | 65 | 65 | **8,210** | 18 | 0 | 0 | 0 anims / 0 skins | `KHR_materials_unlit` | Council Active & Hist (`adv-keeper`) |

### Duplicate & Unused Assets on Disk
- `public/models/council/downloaded/undead_wizard.glb` (80.01 MB): Duplicate of `real_undead_wizard.glb`.
- `public/models/council/downloaded/carl_manfred.glb` (20.13 MB): Duplicate of `real_carl_manfred.glb`.
- `public/models/council/downloaded/freefire_pace.glb` (1.24 MB): Duplicate of `real_freefire_pace.glb`.
- `public/models/council/downloaded/male_character/source/...glb` (6.83 MB): Duplicate of `real_fullbody_male.glb`.
- `public/models/council/downloaded/male_character/textures/` (15 unbundled JPEG files, ~18 MB): Loose source files duplicated inside `real_fullbody_male.glb`.

---

## 3. Scene Breakdown & Resource Consumption

### 3.1. Royal Council Chamber (`CouncilChamber3D`)
- **Render Mode**: Continuous rendering with smooth orbit controls and interactive camera transitions.
- **Characters Present**: 6 seated advisor models in conclave.
- **Current Draw Calls**: ~140–210 calls.
- **Identified Lighting Bottleneck**:
  - Two Grand Chandeliers with `castShadow=true` on `THREE.PointLight`.
  - In Three.js, each shadow-casting PointLight renders a 6-face cubemap every frame. Two point lights + one directional sunbeam = **13 shadow map passes per frame**!
  - Shadow map resolutions: Sunbeam (2048x2048), Chandeliers (1024x1024 each).
- **Identified Animation Drift**:
  - `torsoNode.position.y += breath * 0.15` in `AdvisorCharacter.tsx` accumulates numerical floating-point drift over time, causing models to slowly shift out of their chairs during prolonged sessions.
- **Lifecycle & Disposal**:
  - Materials and procedural geometries in `CouncilArchitecture` and `CouncilTable` are instantiated in `useMemo` without `dispose()` on unmount, accumulating memory on repeated navigation.

### 3.2. Civilization 3D World (`CivilizationWorld3D`)
- **Render Mode**: Continuous rendering with daytime/nighttime diurnal cycles and weather particles.
- **Models**: High-performance compound procedural Three.js models (Residential, Commercial, Industrial, Infrastructure, Agrisector, Citadels).
- **Instanced Subsystems**: `StreetlightsSystem` and `NatureEnvironment` already utilize `InstancedMesh` and buffer geometry merging.
- **Draw Calls**: ~550–750 calls under full settlement occupancy.
- **Identified Lighting Bottleneck**:
  - 2048x2048 directional sun/moon shadow map rendering over a 170x170 unit bounding box (`[-85, 85]`) every frame.
  - Vehicles and pedestrians update matrices every frame.

---

## 4. Optimization Action Plan

1. **GLB Pipeline & Progressive Caching**:
   - Create optimized lightweight copies of models with Draco/Meshopt and appropriately scaled texture maps without overwriting originals.
   - For `real_undead_wizard.glb` (2.4M triangles, 80 MB): Simplify/decimate geometry or keep original in safe archive and generate an optimized production variant.
   - For `real_carl_manfred.glb` (20 MB): Downsample 4K textures to crisp 1K/2K maps; compress geometry.
   - For `real_fullbody_male.glb` (6.8 MB): Optimize textures and clean duplicate mesh chunks.
2. **Three.js Lighting & Shadow Pass Reduction**:
   - In `CouncilLighting.tsx`: Disable cubemap shadow-casting on chandelier point lights (`castShadow=false`). Retain the primary sunbeam directional shadow map (which produces the authentic window arch shadows across the floor and table). This immediately eliminates 12 shadow rendering passes per frame.
   - Introduce an Adaptive Quality Tier manager to dynamically throttle shadow map resolution (2048 on High, 1024 on Medium, 512 / off on Low).
3. **Instancing & Geometry Reuse**:
   - In `CouncilArchitecture.tsx`: Convert the 6 stone pillars (plinth, shaft, capital) and 4 wall sconces to `InstancedMesh`, reducing 24 individual draw calls to 4.
4. **Disposal & Memory Leak Prevention**:
   - Implement strict cleanup hooks (`useEffect` returning disposal functions for geometries, materials, and textures) on unmount of all 3D chamber components.
5. **Animation Stabilization**:
   - Anchor `torsoNode` and joint micro-movements to static initial offsets (`basePosition + sin(...)`), eliminating time-step integration drift.
   - Throttle off-screen / non-selected advisor animation updates when camera is zoomed in on a specific advisor.
6. **Adaptive Resolution & DPR Controller**:
   - Centralize rendering DPR and shadow settings with hysteresis so low-tier or mobile GPUs maintain 60 FPS smoothly.

---

## 5. Baseline Telemetry (Pre-Optimization)

- **World Scene Draw Calls**: ~580–720 calls
- **World Scene Triangles**: ~180,000–260,000 triangles
- **Council Chamber Draw Calls**: ~160–210 calls (with 13 shadow passes)
- **Council Chamber Triangles (Default Quorum)**: ~120,000 triangles
- **Council Chamber Triangles (With Magus)**: ~2,480,000 triangles (severe GPU bottleneck)
- **Asset Transfer Volume**: ~29.1 MB for initial 6-advisor conclave load.

