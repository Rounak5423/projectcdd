import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { MapLayer, useGameState } from '../../context/GameStateContext';
import { MapTerrainType } from '../../types/game';

// Procedural River Centerline Coordinate Z(x)
// Smoothly meanders through the landscape from NW Lake to SE Delta, perfectly aligned with the 3 bridges:
// - West Suspension Bridge at x = -25, z = -16.2
// - Central Citadel Arch Bridge at x = 0, z = -3.0
// - East Industrial Truss Bridge at x = 25, z = 8.0
export function getRiverZ(x: number): number {
  const natural =
    -3.0 + x * 0.235 + Math.sin(x * 0.044) * 7.8 + Math.sin(x * 0.105 + 0.7) * 1.4 + Math.cos(x * 0.19) * 0.5;

  const natW =
    -3.0 + (-25) * 0.235 + Math.sin((-25) * 0.044) * 7.8 + Math.sin((-25) * 0.105 + 0.7) * 1.4 + Math.cos((-25) * 0.19) * 0.5;
  const natC = -3.0 + 0 + Math.sin(0) * 7.8 + Math.sin(0.7) * 1.4 + Math.cos(0) * 0.5;
  const natE =
    -3.0 + 25 * 0.235 + Math.sin(25 * 0.044) * 7.8 + Math.sin(25 * 0.105 + 0.7) * 1.4 + Math.cos(25 * 0.19) * 0.5;

  const gW = Math.exp(-Math.pow((x - (-25)) / 8.0, 2));
  const gC = Math.exp(-Math.pow(x / 8.0, 2));
  const gE = Math.exp(-Math.pow((x - 25) / 8.0, 2));

  return natural + (-16.2 - natW) * gW + (-3.0 - natC) * gC + (8.0 - natE) * gE;
}

// Exact downstream tangent vector (unit length)
export function getRiverDerivative(x: number): { tangentX: number; tangentZ: number } {
  const dz = (getRiverZ(x + 0.1) - getRiverZ(x - 0.1)) / 0.2;
  const len = Math.hypot(1.0, dz);
  return { tangentX: 1.0 / len, tangentZ: dz / len };
}

// Naturally varying river width throughout its length (wider in valleys, narrower under bridges/gorges)
export function getRiverPath(x: number): { z: number; width: number } {
  const z = getRiverZ(x);
  const baseW = 12.4;
  const meanderVar = Math.sin(x * 0.072 + 0.5) * 1.6 + Math.cos(x * 0.13) * 0.8;
  const gW = Math.exp(-Math.pow((x - (-25)) / 6.0, 2)) * 2.8;
  const gC = Math.exp(-Math.pow(x / 6.0, 2)) * 2.2;
  const gE = Math.exp(-Math.pow((x - 25) / 6.0, 2)) * 2.6;
  const width = Math.max(8.8, baseW + meanderVar - gW - gC - gE);
  return { z, width };
}

export function isNearRiver(x: number, z: number, tolerance: number = 2.0): boolean {
  const { z: rz, width } = getRiverPath(x);
  const { tangentX } = getRiverDerivative(x);
  const distPerp = Math.abs(z - rz) * tangentX;
  return distPerp < width * 0.5 + tolerance;
}

export function isNearLake(x: number, z: number, tolerance: number = 2.0): boolean {
  // Mountain lake centered at [-38, -22] with radius ~12
  const dx = x - (-38);
  const dz = z - (-22);
  const dist = Math.sqrt(dx * dx + dz * dz);
  return dist < 12.2 + tolerance;
}

export function getTerrainHeight(x: number, z: number, terrainType: MapTerrainType = 'Verdant River Valley'): number {
  if (terrainType === 'Archipelago') {
    // 5 island centers with lagoons in between
    const islands = [
      { x: 0, z: 13, r: 16, h: 1.25 },
      { x: -28, z: -14, r: 18, h: 1.6 },
      { x: 26, z: -16, r: 17, h: 1.5 },
      { x: -22, z: 24, r: 15, h: 1.2 },
      { x: 24, z: 25, r: 15, h: 1.2 },
    ];
    let maxElevation = -1.1; // shallow ocean floor
    for (const isl of islands) {
      const d = Math.hypot(x - isl.x, z - isl.z);
      if (d < isl.r) {
        const t = Math.cos((d / isl.r) * (Math.PI / 2));
        const elev = isl.h * t - (1 - t) * 0.2;
        if (elev > maxElevation) maxElevation = elev;
      }
    }
    maxElevation += Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.08;
    return maxElevation;
  }

  if (terrainType === 'Crimson Canyon') {
    const canyonZ = x * 0.18 + Math.sin(x * 0.08) * 8.0;
    const distCanyon = Math.abs(z - canyonZ);
    if (distCanyon < 9.0) {
      const t = distCanyon / 9.0;
      return -0.85 + Math.pow(t, 2.0) * 1.2;
    }
    const mesaStep = Math.floor(Math.min(3, (distCanyon - 9.0) / 7.0));
    const mesaBase = 1.1 + mesaStep * 1.0;
    const roughness = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.12;
    if (Math.hypot(x, z - 13) < 13) return 1.15;
    return mesaBase + roughness;
  }

  if (terrainType === 'Frostpeak Taiga') {
    const lakeDist = Math.hypot(x - (-38), z - (-22));
    if (lakeDist < 12.2) {
      return -1.35 * Math.cos((lakeDist / 12.2) * (Math.PI / 2));
    }
    const distCitadel = Math.hypot(x, z - 13);
    if (distCitadel < 12) return 0.95;
    const taigaNoise = Math.sin(x * 0.12) * 0.35 + Math.cos(z * 0.1) * 0.35;
    if (z < -28 || x < -32) {
      const distFlank = Math.max(-28 - z, -32 - x);
      return 1.2 + taigaNoise + (distFlank / 15) * 7.5;
    }
    return 0.65 + taigaNoise;
  }

  if (terrainType === 'Obsidian Caldera') {
    const centerDist = Math.hypot(x, z - 2);
    if (centerDist < 11) {
      return -0.9 * Math.cos((centerDist / 11) * (Math.PI / 2));
    }
    if (centerDist >= 11 && centerDist < 36) {
      const rimProgress = (centerDist - 11) / 25;
      const rimHeight = Math.sin(rimProgress * Math.PI) * 4.5;
      if (Math.hypot(x, z - 13) < 12) return 1.15;
      return 0.6 + rimHeight + Math.sin(x * 0.2 + z * 0.2) * 0.2;
    }
    return 0.8 + Math.cos(centerDist * 0.1) * 0.4;
  }

  if (terrainType === 'Highland Plateau') {
    if (Math.abs(x) > 42 || Math.abs(z) > 42) {
      const edgeDist = Math.max(Math.abs(x) - 42, Math.abs(z) - 42);
      return Math.max(-0.5, 2.1 - edgeDist * 0.5);
    }
    return 1.9 + Math.sin(x * 0.08) * 0.15 + Math.cos(z * 0.08) * 0.15;
  }

  if (terrainType === 'Arid Oasis') {
    const oasisDist = Math.hypot(x, z - 6);
    if (oasisDist < 8.5) {
      return -0.65 * Math.cos((oasisDist / 8.5) * (Math.PI / 2));
    }
    if (Math.hypot(x, z - 13) < 12) return 0.85;
    const dunes = Math.sin(x * 0.14 + z * 0.06) * 0.75 + Math.cos(z * 0.12 - x * 0.04) * 0.45;
    return 0.6 + dunes;
  }

  // Default: Verdant River Valley
  // 1. Highland Lake check (Northwest mountain tarn & reservoir lake at [-38, -22])
  const lakeDist = Math.hypot(x - (-38), z - (-22));
  if (lakeDist < 12.2) {
    const depthFactor = Math.cos((lakeDist / 12.2) * (Math.PI / 2));
    return -1.35 * depthFactor;
  }

  // 2. River check: Organic parabolic riverbed and sloped natural riverbank
  const { z: rz, width } = getRiverPath(x);
  const { tangentX } = getRiverDerivative(x);
  const distPerp = Math.abs(z - rz) * tangentX;
  const halfW = width * 0.5;

  if (distPerp < halfW + 4.2) {
    const yWater = -0.14;
    if (distPerp < halfW) {
      const normD = distPerp / halfW;
      const bedDepth = 0.95 * Math.pow(1.0 - Math.pow(normD, 1.6), 0.85);
      return yWater - bedDepth;
    } else {
      const bankProgress = Math.min(1.0, (distPerp - halfW) / 4.2);
      const bankS = bankProgress * bankProgress * (3 - 2 * bankProgress);
      let baseGround = 0.42;
      if (Math.hypot(x, z - 13) < 13) baseGround = 0.85;
      else if (Math.hypot(x - (-28), z - (-20)) < 16) baseGround = 1.2;
      else if (Math.hypot(x - 32, z - (-16)) < 18) baseGround = 0.75;
      else if (Math.hypot(x - (-24), z - 28) < 20) baseGround = 0.42;
      return yWater + bankS * (baseGround - yWater);
    }
  }

  // 3. Central Citadel Dais & Civic Terrace
  const distCitadel = Math.hypot(x, z - 13);
  if (distCitadel < 12) {
    const t = 1 - distCitadel / 12;
    return 0.82 + t * 0.35;
  }

  // 4. Science Ridge
  const distScience = Math.hypot(x - (-28), z - (-20));
  if (distScience < 16) {
    return 1.4 + (1 - distScience / 16) * 1.0;
  }

  // 5. Industrial Plateau
  const distInd = Math.hypot(x - 32, z - (-16));
  if (distInd < 18) {
    return 0.75 + (1 - distInd / 18) * 0.25;
  }

  // 6. Agrisector Valley
  const distAgri = Math.hypot(x - (-24), z - 28);
  if (distAgri < 20) {
    return 0.42 + Math.sin(x * 0.2) * 0.12;
  }

  // 7. Residential Terraces
  const distRes = Math.hypot(x - 20, z - 26);
  if (distRes < 18) {
    return 0.55 + Math.cos(z * 0.15) * 0.15;
  }

  // 8. Northern Alpine Background Mountains
  if (z < -34 || x < -40 || (x > 38 && z < -14)) {
    let mountainStrength = 0;
    if (z < -34) mountainStrength = Math.max(mountainStrength, (-34 - z) / 20);
    if (x < -40) mountainStrength = Math.max(mountainStrength, (-40 - x) / 18);
    if (x > 38 && z < -14) mountainStrength = Math.max(mountainStrength, (x - 38) / 18);

    mountainStrength = Math.min(1.0, mountainStrength);
    const ridgeNoise =
      Math.sin(x * 0.16 + 1.2) * 3.2 +
      Math.cos(z * 0.18 + 0.8) * 3.6 +
      Math.sin((x - z) * 0.12) * 2.8;

    return 0.5 + mountainStrength * (11.5 + ridgeNoise);
  }

  return 0.42 + Math.sin(x * 0.08) * 0.14 + Math.cos(z * 0.08) * 0.14;
}

function Terrain({ activeLayer }: { activeLayer: MapLayer }) {
  const { civilization } = useGameState();
  const terrainType = civilization?.terrainType || 'Verdant River Valley';
  const isPioneerOutpost = (civilization?.level ?? 1) <= 1;

  // Generate high quality procedural terrain geometry with vertex colors
  const { geometry } = useMemo(() => {
    const size = 136;
    const segments = 128; // High resolution, silky smooth terrain mesh
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    // Natural Landscape Color Palette adapted per Biome
    let cLushGreen = new THREE.Color(activeLayer === 'environment' ? '#3d823b' : '#45793e');
    let cDeepGreen = new THREE.Color('#386435');
    let cHillOlive = new THREE.Color('#587848');
    let cSandRiver = new THREE.Color('#786f5c');
    let cBedSilt = new THREE.Color('#222d25');
    let cPebbleGravel = new THREE.Color('#4c5446');
    let cCliffStone = new THREE.Color('#5a645f');
    let cMountainRock = new THREE.Color('#747e79');
    let cSnowPeak = new THREE.Color('#e0ebe5');
    let cCitadelPaved = new THREE.Color('#4d5e4f');

    if (terrainType === 'Archipelago') {
      cLushGreen = new THREE.Color('#387a42');
      cDeepGreen = new THREE.Color('#285930');
      cHillOlive = new THREE.Color('#4c8052');
      cSandRiver = new THREE.Color('#c9b98b');
      cBedSilt = new THREE.Color('#1c4248');
      cPebbleGravel = new THREE.Color('#8a997d');
      cCliffStone = new THREE.Color('#62736b');
      cMountainRock = new THREE.Color('#748780');
      cCitadelPaved = new THREE.Color('#3d5448');
    } else if (terrainType === 'Crimson Canyon') {
      cLushGreen = new THREE.Color('#8c3826');
      cDeepGreen = new THREE.Color('#6e2d20');
      cHillOlive = new THREE.Color('#a84a32');
      cSandRiver = new THREE.Color('#c78d67');
      cBedSilt = new THREE.Color('#42231c');
      cPebbleGravel = new THREE.Color('#8f5745');
      cCliffStone = new THREE.Color('#5e2417');
      cMountainRock = new THREE.Color('#7a3424');
      cSnowPeak = new THREE.Color('#d4a896');
      cCitadelPaved = new THREE.Color('#542b24');
    } else if (terrainType === 'Frostpeak Taiga') {
      cLushGreen = new THREE.Color('#2f473c');
      cDeepGreen = new THREE.Color('#243830');
      cHillOlive = new THREE.Color('#42574e');
      cSandRiver = new THREE.Color('#677875');
      cBedSilt = new THREE.Color('#1b2629');
      cPebbleGravel = new THREE.Color('#465457');
      cCliffStone = new THREE.Color('#5c696e');
      cMountainRock = new THREE.Color('#78878f');
      cSnowPeak = new THREE.Color('#f0f6f8');
      cCitadelPaved = new THREE.Color('#3b4b52');
    } else if (terrainType === 'Obsidian Caldera') {
      cLushGreen = new THREE.Color('#26232e');
      cDeepGreen = new THREE.Color('#1b1921');
      cHillOlive = new THREE.Color('#363040');
      cSandRiver = new THREE.Color('#574a44');
      cBedSilt = new THREE.Color('#18141c');
      cPebbleGravel = new THREE.Color('#4a3b44');
      cCliffStone = new THREE.Color('#382e38');
      cMountainRock = new THREE.Color('#4d3a46');
      cSnowPeak = new THREE.Color('#9e7565');
      cCitadelPaved = new THREE.Color('#302836');
    } else if (terrainType === 'Highland Plateau') {
      cLushGreen = new THREE.Color('#5b694d');
      cDeepGreen = new THREE.Color('#44523a');
      cHillOlive = new THREE.Color('#6f785b');
      cSandRiver = new THREE.Color('#7d7767');
      cBedSilt = new THREE.Color('#2a2723');
      cPebbleGravel = new THREE.Color('#5c564a');
      cCliffStone = new THREE.Color('#6b655a');
      cMountainRock = new THREE.Color('#827b6f');
      cCitadelPaved = new THREE.Color('#4f4940');
    } else if (terrainType === 'Arid Oasis') {
      cLushGreen = new THREE.Color('#c29b63');
      cDeepGreen = new THREE.Color('#ab834b');
      cHillOlive = new THREE.Color('#dec28e');
      cSandRiver = new THREE.Color('#d4b479');
      cBedSilt = new THREE.Color('#3d301f');
      cPebbleGravel = new THREE.Color('#8c7247');
      cCliffStone = new THREE.Color('#785834');
      cMountainRock = new THREE.Color('#947046');
      cSnowPeak = new THREE.Color('#edd9b9');
      cCitadelPaved = new THREE.Color('#63513b');
    }

    for (let i = 0; i < positions.count; i++) {
      const vx = positions.getX(i);
      const vz = positions.getZ(i);

      const vy = getTerrainHeight(vx, vz, terrainType);
      positions.setY(i, vy);

      // Vertex color blending based on elevation, slope, and water proximity
      let vertexColor = cLushGreen.clone();

      // Check river channel proximity for rich riverbed geology
      const { z: rz, width: rWidth } = getRiverPath(vx);
      const { tangentX } = getRiverDerivative(vx);
      const distPerp = Math.abs(vz - rz) * tangentX;
      const halfW = rWidth * 0.5;

      if (distPerp < halfW + 3.5) {
        if (distPerp < halfW * 0.55) {
          vertexColor = cBedSilt.clone();
        } else if (distPerp < halfW) {
          const t = (distPerp - halfW * 0.55) / (halfW * 0.45);
          vertexColor = cBedSilt.clone().lerp(cPebbleGravel, t);
        } else {
          const t = (distPerp - halfW) / 3.5;
          vertexColor = cPebbleGravel.clone().lerp(cLushGreen, t);
        }
      } else if (vy < -0.8) {
        vertexColor = cBedSilt.clone();
      } else if (vy < 0.2) {
        const t = (vy + 0.8) / 1.0;
        vertexColor = cBedSilt.clone().lerp(cSandRiver, t);
      } else if (vy < 1.8) {
        const distCitadel = Math.hypot(vx, vz - 13);
        if (distCitadel < 12) {
          vertexColor = cCitadelPaved.clone();
        } else {
          vertexColor = Math.sin(vx * 0.3 + vz * 0.3) > 0 ? cLushGreen : cDeepGreen;
        }
      } else if (vy < 4.5) {
        vertexColor = cHillOlive.clone();
      } else if (vy < 8.5) {
        vertexColor = cCliffStone.clone();
      } else if (vy < 12.0) {
        vertexColor = cMountainRock.clone();
      } else {
        vertexColor = cSnowPeak.clone();
      }

      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    return { geometry: geo };
  }, [activeLayer, terrainType]);

  // Clean up GPU buffer on unmount or layer changes
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <group raycast={() => null}>
      {/* Main Procedural Vertex-Colored Terrain Mesh (Smooth shaded, organic slopes) */}
      <mesh
        geometry={geometry}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.82}
          metalness={0.06}
        />
      </mesh>

      {/* Conditionally render: Pioneer Frontier Landing Pad for Level 1, or Grand Civic Forum for Level 2+ */}
      {isPioneerOutpost ? (
        <group position={[0, 0.85, 11]}>
          {/* Modular Heavy Outpost Platform */}
          <mesh position={[0, -0.04, 0]} receiveShadow>
            <boxGeometry args={[13.2, 0.22, 12.0]} />
            <meshStandardMaterial color="#2d3430" roughness={0.7} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.08, 0]} receiveShadow>
            <boxGeometry args={[12.6, 0.06, 11.4]} />
            <meshStandardMaterial color="#3b4640" roughness={0.6} metalness={0.3} />
          </mesh>
          {/* Central Landing Inscription Medallion */}
          <mesh position={[0, 0.12, -2.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[0.0, 2.6, 24]} />
            <meshStandardMaterial color="#c6a76a" roughness={0.4} metalness={0.5} />
          </mesh>

          {/* High-Gain Orbital Telemetry Beacon Mast */}
          <group position={[-4.5, 0.1, -4.0]}>
            <mesh position={[0, 1.8, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.14, 3.6, 8]} />
              <meshStandardMaterial color="#7a8c82" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 3.65, 0]}>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial color="#3be8b0" emissive="#3be8b0" emissiveIntensity={1.8} />
            </mesh>
            <mesh position={[0, 2.8, 0]} rotation={[0.4, 0.6, 0]} castShadow>
              <cylinderGeometry args={[0.7, 0.1, 0.18, 12]} />
              <meshStandardMaterial color="#cbd5d0" metalness={0.7} roughness={0.2} />
            </mesh>
          </group>

          {/* Modular Expedition Survival Pods & Stacked Cargo Crates */}
          {[
            [-3.8, 1.2, '#c6a76a', 1.4, 1.0, 1.2],
            [-3.6, 2.8, '#4a6252', 1.2, 0.8, 1.0],
            [4.0, 1.5, '#7a6a50', 1.3, 0.9, 1.1],
            [4.2, -1.8, '#586a78', 1.5, 1.1, 1.3],
            [3.5, -3.2, '#c6a76a', 1.0, 0.7, 1.0],
          ].map(([cx, cz, col, w, h, d], idx) => (
            <mesh key={`crate-${idx}`} position={[Number(cx), Number(h) / 2 + 0.1, Number(cz)]} castShadow receiveShadow>
              <boxGeometry args={[Number(w), Number(h), Number(d)]} />
              <meshStandardMaterial color={String(col)} roughness={0.6} metalness={0.2} />
            </mesh>
          ))}

          {/* Portable Solar Survey Arrays */}
          {[-2.0, 2.0].map((px, idx) => (
            <group key={`solar-${idx}`} position={[px, 0.12, 3.8]} rotation={[-0.35, 0, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[2.2, 0.08, 1.2]} />
                <meshStandardMaterial color="#1f3b4d" roughness={0.2} metalness={0.8} />
              </mesh>
              <mesh position={[0, -0.3, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 0.6, 6]} />
                <meshStandardMaterial color="#4f5954" metalness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      ) : (
        /* Elysium Grand Civic Forum & Ceremonial Plaza (Level 2+) */
        <group position={[0, 0.82, 11]}>
          <mesh position={[0, -0.06, 0]} receiveShadow>
            <boxGeometry args={[14.8, 0.28, 13.6]} />
            <meshStandardMaterial color="#424c44" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.08, 0]} receiveShadow>
            <boxGeometry args={[14.2, 0.10, 13.0]} />
            <meshStandardMaterial color="#556358" roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.14, -3.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[0.0, 3.4, 32]} />
            <meshStandardMaterial color="#6a7a6e" roughness={0.5} />
          </mesh>

          <group position={[0, 0.15, -3.2]}>
            <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[2.2, 2.4, 0.36, 8]} />
              <meshStandardMaterial color="#48544b" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[1.95, 1.95, 0.08, 16]} />
              <meshStandardMaterial color="#388e9c" roughness={0.1} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.55, 0]} castShadow>
              <cylinderGeometry args={[0.4, 0.55, 0.5, 8]} />
              <meshStandardMaterial color="#657569" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.85, 0]} castShadow>
              <cylinderGeometry args={[0.85, 0.25, 0.25, 8]} />
              <meshStandardMaterial color="#657569" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.95, 0]}>
              <cylinderGeometry args={[0.75, 0.75, 0.05, 12]} />
              <meshStandardMaterial color="#48a0b0" roughness={0.1} metalness={0.9} />
            </mesh>
          </group>

          {[-6.6, 6.6].map((bx, i) => (
            <group key={`balustrade-${i}`} position={[bx, 0.3, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.35, 0.45, 12.0]} />
                <meshStandardMaterial color="#505e53" roughness={0.7} />
              </mesh>
              {[-4.8, -2.4, 0, 2.4, 4.8].map((uz, k) => (
                <mesh key={`urn-${k}`} position={[0, 0.32, uz]} castShadow>
                  <cylinderGeometry args={[0.18, 0.12, 0.28, 8]} />
                  <meshStandardMaterial color="#657569" />
                </mesh>
              ))}
            </group>
          ))}

          {[-3.6, 3.6].map((benchX, i) =>
            [-1.2, 1.4].map((benchZ, j) => (
              <group key={`bench-${i}-${j}`} position={[benchX, 0.26, benchZ]}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[1.4, 0.22, 0.42]} />
                  <meshStandardMaterial color="#6d7d71" roughness={0.5} />
                </mesh>
                <mesh position={[0, -0.1, 0]}>
                  <boxGeometry args={[1.2, 0.15, 0.3]} />
                  <meshStandardMaterial color="#424c44" />
                </mesh>
              </group>
            ))
          )}

          {[-5.2, 5.2].map((tx, i) =>
            [-4.5, -1.8, 1.8, 4.5].map((tz, j) => (
              <group key={`topiary-${i}-${j}`} position={[tx, 0.15, tz]}>
                <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.42, 0.32, 0.36, 8]} />
                  <meshStandardMaterial color="#49574c" roughness={0.7} />
                </mesh>
                <mesh position={[0, 0.65, 0]} castShadow>
                  <coneGeometry args={[0.38, 0.9, 8]} />
                  <meshStandardMaterial color="#2c5e32" roughness={0.8} />
                </mesh>
              </group>
            ))
          )}
        </group>
      )}

      {/* Majestic Northern Alpine Horizon Backdrop Peaks (Distant background mountains ONLY, Z < -48) */}
      {[
        [-52, -50, 15, 12],
        [-26, -54, 16, 13],
        [0, -56, 17, 14],
        [26, -54, 16, 13],
        [50, -50, 15, 12],
      ].map(([mx, mz, my, radius], idx) => (
        <group key={idx} position={[mx, my * 0.42, mz]}>
          <mesh castShadow receiveShadow>
            <coneGeometry args={[radius, my, 12]} />
            <meshStandardMaterial color="#4d5752" roughness={0.85} />
          </mesh>
          {/* Pristine Alpine Snow Summit */}
          <mesh position={[0, my * 0.35, 0]} castShadow>
            <coneGeometry args={[radius * 0.38, my * 0.34, 12]} />
            <meshStandardMaterial color="#e8f0ec" roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default React.memo(Terrain);
