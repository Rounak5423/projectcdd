import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { MapLayer } from '../../context/GameStateContext';

// Procedural Terrain Height & Feature Functions
export function getRiverPath(x: number): { z: number; width: number } {
  // S-curved river meander from northwest to southeast
  // Passes near [-40, -12], through center [0, -3], and out towards [45, 16]
  const z = -3.0 + Math.sin(x * 0.045) * 8.5 + (x * 0.22);
  const width = 10.5 + Math.sin(x * 0.08) * 2.0;
  return { z, width };
}

export function isNearRiver(x: number, z: number, tolerance: number = 2.0): boolean {
  const { z: rz, width } = getRiverPath(x);
  return Math.abs(z - rz) < (width * 0.5 + tolerance);
}

export function isNearLake(x: number, z: number, tolerance: number = 2.0): boolean {
  // Mountain lake centered at [-38, -22] with radius ~12
  const dx = x - (-38);
  const dz = z - (-22);
  const dist = Math.sqrt(dx * dx + dz * dz);
  return dist < (12 + tolerance);
}

export function getTerrainHeight(x: number, z: number): number {
  // 1. Lake check
  const lakeDist = Math.hypot(x - (-38), z - (-22));
  if (lakeDist < 12) {
    const depthFactor = Math.cos((lakeDist / 12) * (Math.PI / 2));
    return -1.35 * depthFactor;
  }

  // 2. River check
  const { z: rz, width } = getRiverPath(x);
  const distToRiver = Math.abs(z - rz);
  const riverHalfWidth = width * 0.5;

  if (distToRiver < riverHalfWidth + 3.0) {
    if (distToRiver < riverHalfWidth - 1.0) {
      // Inside riverbed
      return -1.25;
    } else {
      // Sloped riverbank
      const t = (distToRiver - (riverHalfWidth - 1.0)) / 4.0;
      return THREE.MathUtils.lerp(-1.25, 0.4, Math.min(1, Math.max(0, t)));
    }
  }

  // 3. Central Citadel Plateau
  const distFromCenter = Math.hypot(x, z);
  if (distFromCenter < 16) {
    return 0.8 + (1 - distFromCenter / 16) * 0.5;
  }

  // 4. Science Ridge (Northwest)
  const distScience = Math.hypot(x - (-28), z - (-20));
  if (distScience < 16) {
    return 1.4 + (1 - distScience / 16) * 1.0;
  }

  // 5. Industrial Plateau (Northeast)
  const distInd = Math.hypot(x - 32, z - (-16));
  if (distInd < 18) {
    return 0.7;
  }

  // 6. Agrisector Valley (Southwest)
  const distAgri = Math.hypot(x - (-24), z - 28);
  if (distAgri < 20) {
    return 0.4 + Math.sin(x * 0.2) * 0.15;
  }

  // 7. Residential Terraces (Southeast)
  const distRes = Math.hypot(x - 20, z - 26);
  if (distRes < 18) {
    return 0.6 + Math.cos(z * 0.15) * 0.2;
  }

  // 8. Outer Mountain Ridges (Perimeter peaks)
  const edgeDistX = Math.abs(x);
  const edgeDistZ = Math.abs(z);
  const maxEdge = Math.max(edgeDistX, edgeDistZ);

  if (maxEdge > 44) {
    const mountainFactor = (maxEdge - 44) / 18;
    const ridgeNoise =
      Math.sin(x * 0.25) * 2.2 +
      Math.cos(z * 0.3) * 2.5 +
      Math.sin((x + z) * 0.15) * 3.0;
    return Math.max(0.5, mountainFactor * 8.5 + ridgeNoise);
  }

  // Default gentle meadow roll
  return 0.4 + Math.sin(x * 0.08) * 0.2 + Math.cos(z * 0.08) * 0.2;
}

function Terrain({ activeLayer }: { activeLayer: MapLayer }) {
  // Generate high quality procedural terrain geometry with vertex colors
  const { geometry, wireframeGeo } = useMemo(() => {
    const size = 136;
    const segments = 80;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    // Color definitions
    const cLushGreen = new THREE.Color(activeLayer === 'environment' ? '#3d823b' : '#477943');
    const cDeepGreen = new THREE.Color('#386435');
    const cHillOlive = new THREE.Color('#58854b');
    const cSandRiver = new THREE.Color('#a89b7b');
    const cBedClay = new THREE.Color('#786b51');
    const cCliffStone = new THREE.Color('#58625d');
    const cMountainRock = new THREE.Color('#727d78');
    const cSnowPeak = new THREE.Color('#dce6e0');
    const cUrbanTint = new THREE.Color('#415744');

    for (let i = 0; i < positions.count; i++) {
      const vx = positions.getX(i);
      const vz = positions.getZ(i);

      const vy = getTerrainHeight(vx, vz);
      positions.setY(i, vy);

      // Vertex color blending based on elevation, slope, and water proximity
      let vertexColor = cLushGreen.clone();

      if (vy < -0.8) {
        // Riverbed / Lake bottom
        vertexColor = cBedClay.clone();
      } else if (vy < 0.2) {
        // Sandy beach / bank transition
        const t = (vy + 0.8) / 1.0;
        vertexColor.lerpColors(cBedClay, cSandRiver, t);
      } else if (vy < 2.0) {
        // Valley grasslands & district foundations
        const distCitadel = Math.hypot(vx, vz);
        if (distCitadel < 14) {
          vertexColor.lerpColors(cLushGreen, cUrbanTint, 0.4);
        } else {
          vertexColor = Math.sin(vx * 0.3 + vz * 0.3) > 0 ? cLushGreen : cDeepGreen;
        }
      } else if (vy < 5.0) {
        // Foothills & ridges
        vertexColor = cHillOlive.clone();
      } else if (vy < 9.0) {
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

    return { geometry: geo, wireframeGeo: geo };
  }, [activeLayer]);

  // Clean up GPU buffer on unmount or layer changes
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <group raycast={() => null}>
      {/* Main Procedural Vertex-Colored Terrain Mesh */}
      <mesh
        geometry={geometry}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.88}
          metalness={0.08}
          flatShading
        />
      </mesh>

      {/* District Terraces & Low-Poly Decorative Cliff Pillars */}
      <group>
        {/* Citadel Grand Dais Foundation */}
        <mesh position={[0, 0.35, 0]} receiveShadow>
          <cylinderGeometry args={[14.8, 15.6, 0.7, 32]} />
          <meshStandardMaterial color="#445447" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.72, 0]} receiveShadow>
          <cylinderGeometry args={[14.2, 14.8, 0.1, 32]} />
          <meshStandardMaterial color="#697f67" roughness={0.6} />
        </mesh>

        {/* Outer Mountain Crest Accents (Low poly geometric peaks) */}
        {[
          [-54, -48, 14, 11],
          [52, -50, 15, 12],
          [-52, 50, 13, 10],
          [50, 52, 16, 12],
          [-56, 0, 12, 10],
          [55, 6, 13, 9],
          [0, -56, 14, 11],
          [0, 56, 12, 9],
        ].map(([mx, mz, my, radius], idx) => (
          <group key={idx} position={[mx, my * 0.45, mz]}>
            <mesh castShadow receiveShadow>
              <coneGeometry args={[radius, my, 7]} />
              <meshStandardMaterial color="#55605b" roughness={0.9} flatShading />
            </mesh>
            {/* Snow cap */}
            <mesh position={[0, my * 0.35, 0]} castShadow>
              <coneGeometry args={[radius * 0.35, my * 0.32, 7]} />
              <meshStandardMaterial color="#e3ede8" roughness={0.4} flatShading />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export default React.memo(Terrain);

