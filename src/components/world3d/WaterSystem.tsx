import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRiverPath } from './Terrain';
import { useDayNight } from './DayNightController';

export default function WaterSystem() {
  const { isNight } = useDayNight();
  const riverRef = useRef<THREE.Mesh>(null);
  const lakeRef = useRef<THREE.Mesh>(null);
  const foamRef = useRef<THREE.Mesh>(null);

  // Procedural River Ribbon Geometry following getRiverPath(x)
  const { riverGeo, foamGeo } = useMemo(() => {
    const segments = 90;
    const minX = -65;
    const maxX = 65;
    const stepX = (maxX - minX) / segments;

    const riverPositions: number[] = [];
    const riverIndices: number[] = [];
    const foamPositions: number[] = [];
    const foamIndices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const x = minX + i * stepX;
      const { z: rz, width } = getRiverPath(x);
      const halfW = width * 0.5;

      const zLeft = rz - halfW;
      const zRight = rz + halfW;
      const waterY = -0.18; // Sits neatly in the riverbed

      // River vertices
      riverPositions.push(x, waterY, zLeft);
      riverPositions.push(x, waterY, zRight);

      // Foam boundary vertices (thin strip along bank)
      foamPositions.push(x, waterY + 0.015, zLeft - 0.4);
      foamPositions.push(x, waterY + 0.015, zLeft + 0.5);
      foamPositions.push(x, waterY + 0.015, zRight - 0.5);
      foamPositions.push(x, waterY + 0.015, zRight + 0.4);

      if (i < segments) {
        const base = i * 2;
        riverIndices.push(base, base + 1, base + 2);
        riverIndices.push(base + 1, base + 3, base + 2);

        const foamBase = i * 4;
        // Left foam strip
        foamIndices.push(foamBase, foamBase + 1, foamBase + 4);
        foamIndices.push(foamBase + 1, foamBase + 5, foamBase + 4);
        // Right foam strip
        foamIndices.push(foamBase + 2, foamBase + 3, foamBase + 6);
        foamIndices.push(foamBase + 3, foamBase + 7, foamBase + 6);
      }
    }

    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.Float32BufferAttribute(riverPositions, 3));
    rGeo.setIndex(riverIndices);
    rGeo.computeVertexNormals();

    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute('position', new THREE.Float32BufferAttribute(foamPositions, 3));
    fGeo.setIndex(foamIndices);
    fGeo.computeVertexNormals();

    return { riverGeo: rGeo, foamGeo: fGeo };
  }, []);

  // Frame animation for water flow, subtle ripple oscillations, and foam pulsing
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    if (riverRef.current) {
      const pos = riverRef.current.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        // Dynamic water ripple equation
        const wave =
          Math.sin(vx * 0.45 + elapsed * 2.8) * 0.06 +
          Math.cos(vz * 0.6 + elapsed * 1.8) * 0.04;
        pos.setY(i, -0.18 + wave);
      }
      pos.needsUpdate = true;
    }

    if (lakeRef.current) {
      lakeRef.current.position.y = -0.18 + Math.sin(elapsed * 1.5) * 0.025;
    }

    if (foamRef.current) {
      const mat = foamRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(elapsed * 3.5) * 0.15;
    }
  });

  return (
    <group>
      {/* Dynamic Flowing River */}
      <mesh
        ref={riverRef}
        geometry={riverGeo}
        receiveShadow
      >
        <meshStandardMaterial
          color={isNight ? '#16354d' : '#1d85a6'}
          roughness={0.08}
          metalness={0.7}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Foam Crests along Riverbanks */}
      <mesh
        ref={foamRef}
        geometry={foamGeo}
      >
        <meshBasicMaterial
          color="#dcf6ff"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Mountain Reservoir Lake */}
      <group position={[-38, -0.18, -22]}>
        <mesh
          ref={lakeRef}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[12.2, 48]} />
          <meshStandardMaterial
            color={isNight ? '#14324a' : '#1e8ea8'}
            roughness={0.06}
            metalness={0.75}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Lake shoreline pebble ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[11.8, 12.8, 48]} />
          <meshStandardMaterial color="#8b7d62" roughness={0.9} />
        </mesh>
      </group>

      {/* Secondary Mountain Tarn Pond (highland scenic lake) */}
      <group position={[-26, 1.45, -34]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[5.2, 24]} />
          <meshStandardMaterial
            color={isNight ? '#11293d' : '#2297b8'}
            roughness={0.08}
            metalness={0.65}
            transparent
            opacity={0.85}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <ringGeometry args={[4.9, 5.6, 24]} />
          <meshStandardMaterial color="#7a6e55" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

