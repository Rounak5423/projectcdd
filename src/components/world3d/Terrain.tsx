import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { MapLayer } from '../../context/GameStateContext';

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

export function getTerrainHeight(x: number, z: number): number {
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
      // Submerged riverbed: parabolic cross-section dipping to deep channel
      const normD = distPerp / halfW;
      const bedDepth = 0.95 * Math.pow(1.0 - Math.pow(normD, 1.6), 0.85);
      return yWater - bedDepth;
    } else {
      // Sloped natural riverbank: smooth S-curve transition from water edge to meadow
      const bankProgress = Math.min(1.0, (distPerp - halfW) / 4.2);
      const bankS = bankProgress * bankProgress * (3 - 2 * bankProgress);
      // Base ground elevation surrounding this river reach
      let baseGround = 0.42;
      if (Math.hypot(x, z - 13) < 13) baseGround = 0.85; // Raised Citadel Dais ground
      else if (Math.hypot(x - (-28), z - (-20)) < 16) baseGround = 1.2;
      else if (Math.hypot(x - 32, z - (-16)) < 18) baseGround = 0.75;
      else if (Math.hypot(x - (-24), z - 28) < 20) baseGround = 0.42;
      return yWater + bankS * (baseGround - yWater);
    }
  }

  // 3. Central Citadel Dais & Civic Terrace (South of river, centered at [0, 13])
  const distCitadel = Math.hypot(x, z - 13);
  if (distCitadel < 12) {
    const t = 1 - distCitadel / 12;
    return 0.82 + t * 0.35; // Majestic elevated civic terrace at ~0.82m to 1.17m
  }

  // 4. Science Ridge (Northwest, overlooking lake)
  const distScience = Math.hypot(x - (-28), z - (-20));
  if (distScience < 16) {
    return 1.4 + (1 - distScience / 16) * 1.0;
  }

  // 5. Industrial Plateau (Northeast)
  const distInd = Math.hypot(x - 32, z - (-16));
  if (distInd < 18) {
    return 0.75 + (1 - distInd / 18) * 0.25;
  }

  // 6. Agrisector Valley (Southwest)
  const distAgri = Math.hypot(x - (-24), z - 28);
  if (distAgri < 20) {
    return 0.42 + Math.sin(x * 0.2) * 0.12;
  }

  // 7. Residential Terraces (Southeast)
  const distRes = Math.hypot(x - 20, z - 26);
  if (distRes < 18) {
    return 0.55 + Math.cos(z * 0.15) * 0.15;
  }

  // 8. Northern Alpine Background Mountains (STRICTLY on North & NW horizon, Z < -34 or X < -40)
  // NEVER obstructs the foreground camera (Z > 16 is completely open, unobstructed meadow!)
  if (z < -34 || x < -40 || (x > 38 && z < -14)) {
    let mountainStrength = 0;
    if (z < -34) mountainStrength = Math.max(mountainStrength, (-34 - z) / 20);
    if (x < -40) mountainStrength = Math.max(mountainStrength, (-40 - x) / 18);
    if (x > 38 && z < -14) mountainStrength = Math.max(mountainStrength, (x - 38) / 18);

    mountainStrength = Math.min(1.0, mountainStrength);
    // Smooth natural mountain sculpting with layered ridge harmonics
    const ridgeNoise =
      Math.sin(x * 0.16 + 1.2) * 3.2 +
      Math.cos(z * 0.18 + 0.8) * 3.6 +
      Math.sin((x - z) * 0.12) * 2.8;

    return 0.5 + mountainStrength * (11.5 + ridgeNoise);
  }

  // Default gentle, sunny meadow roll
  return 0.42 + Math.sin(x * 0.08) * 0.14 + Math.cos(z * 0.08) * 0.14;
}

function Terrain({ activeLayer }: { activeLayer: MapLayer }) {
  // Generate high quality procedural terrain geometry with vertex colors
  const { geometry } = useMemo(() => {
    const size = 136;
    const segments = 128; // High resolution, silky smooth terrain mesh
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    // Natural Landscape Color Palette
    const cLushGreen = new THREE.Color(activeLayer === 'environment' ? '#3d823b' : '#45793e');
    const cDeepGreen = new THREE.Color('#386435');
    const cHillOlive = new THREE.Color('#587848');
    const cSandRiver = new THREE.Color('#786f5c');
    const cBedSilt = new THREE.Color('#222d25');
    const cPebbleGravel = new THREE.Color('#4c5446');
    const cCliffStone = new THREE.Color('#5a645f');
    const cMountainRock = new THREE.Color('#747e79');
    const cSnowPeak = new THREE.Color('#e0ebe5');
    const cCitadelPaved = new THREE.Color('#4d5e4f');

    for (let i = 0; i < positions.count; i++) {
      const vx = positions.getX(i);
      const vz = positions.getZ(i);

      const vy = getTerrainHeight(vx, vz);
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
          // Deep river channel thalweg: dark river silt, sunken slate, gravel
          vertexColor = cBedSilt.clone();
        } else if (distPerp < halfW) {
          // Submerged shallows & gravel bars: weathered river gravel, fine sand
          const t = (distPerp - halfW * 0.55) / (halfW * 0.45);
          vertexColor = cBedSilt.clone().lerp(cPebbleGravel, t);
        } else {
          // Riverbank margin: moist sand/loam to lush emerald riverbank vegetation
          const t = (distPerp - halfW) / 3.5;
          vertexColor = cPebbleGravel.clone().lerp(cLushGreen, t);
        }
      } else if (vy < -0.8) {
        // Lake bottom
        vertexColor = cBedSilt.clone();
      } else if (vy < 0.2) {
        // Sandy beach / bank transition
        const t = (vy + 0.8) / 1.0;
        vertexColor = cBedSilt.clone().lerp(cSandRiver, t);
      } else if (vy < 1.8) {
        // Valley grasslands & district foundations
        const distCitadel = Math.hypot(vx, vz - 13);
        if (distCitadel < 12) {
          vertexColor = cCitadelPaved.clone();
        } else {
          vertexColor = Math.sin(vx * 0.3 + vz * 0.3) > 0 ? cLushGreen : cDeepGreen;
        }
      } else if (vy < 4.5) {
        // Foothills & ridges
        vertexColor = cHillOlive.clone();
      } else if (vy < 8.5) {
        // Rocky mountain cliffs
        vertexColor = cCliffStone.clone();
      } else if (vy < 12.0) {
        // High mountain granite
        vertexColor = cMountainRock.clone();
      } else {
        // Snow capped summits
        vertexColor = cSnowPeak.clone();
      }

      colors[i * 3] = vertexColor.r;
      colors[i * 3 + 1] = vertexColor.g;
      colors[i * 3 + 2] = vertexColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    return { geometry: geo };
  }, [activeLayer]);

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

      {/* Citadel Grand Dais Civic Terrace (South of river, centered at [0, 13]) */}
      <group position={[0, 0.82, 13]}>
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <cylinderGeometry args={[11.8, 12.5, 0.2, 36]} />
          <meshStandardMaterial color="#354038" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <cylinderGeometry args={[11.2, 11.6, 0.08, 36]} />
          <meshStandardMaterial color="#4f5e52" roughness={0.6} />
        </mesh>
      </group>

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
