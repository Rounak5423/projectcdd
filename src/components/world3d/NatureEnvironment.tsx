import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTerrainHeight, isNearRiver, isNearLake } from './Terrain';
import { MapLayer } from '../../context/GameStateContext';

interface NatureEnvironmentProps {
  activeLayer: MapLayer;
}

export default function NatureEnvironment({ activeLayer }: NatureEnvironmentProps) {
  const pineMeshRef = useRef<THREE.InstancedMesh>(null);
  const deciduousMeshRef = useRef<THREE.InstancedMesh>(null);
  const rockMeshRef = useRef<THREE.InstancedMesh>(null);
  const bushMeshRef = useRef<THREE.InstancedMesh>(null);

  // Generate deterministic scattered trees, rocks and bushes
  const { pineTransforms, decTransforms, rockTransforms, bushTransforms } = useMemo(() => {
    // Excluded zones (near central roads or initial building cores)
    const isExcluded = (x: number, z: number) => {
      // In river or lake
      if (isNearRiver(x, z, 3.5) || isNearLake(x, z, 4.0)) return true;

      // Central Citadel core
      if (Math.hypot(x, z) < 14) return true;

      // Main cardinal roads (x ≈ 0, z ≈ 0, x ≈ -25, x ≈ 25, z ≈ -25, z ≈ 25)
      if (Math.abs(x) < 3.5 || Math.abs(z) < 3.5) return true;
      if (Math.abs(x - (-25)) < 3.2 || Math.abs(x - 25) < 3.2) return true;
      if (Math.abs(z - (-25)) < 3.2 || Math.abs(z - 25) < 3.2) return true;

      // Close to main district centers
      if (Math.hypot(x - (-28), z - (-20)) < 7) return true; // Science
      if (Math.hypot(x - 32, z - (-16)) < 8) return true; // Industrial
      if (Math.hypot(x - (-24), z - 28) < 8) return true; // Agri
      if (Math.hypot(x - 20, z - 26) < 8) return true; // Residential

      return false;
    };

    // Pseudo-random deterministic generator
    let seed = 42;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const pines: THREE.Matrix4[] = [];
    const decs: THREE.Matrix4[] = [];
    const rocks: THREE.Matrix4[] = [];
    const bushes: THREE.Matrix4[] = [];

    const dummy = new THREE.Object3D();

    // 1. Generate Trees in forest clusters & mountain flanks
    for (let i = 0; i < 450; i++) {
      const rx = (random() - 0.5) * 115;
      const rz = (random() - 0.5) * 115;

      if (isExcluded(rx, rz)) continue;

      const ry = getTerrainHeight(rx, rz);
      if (ry < 0.2 || ry > 11.5) continue; // Not under water and not on extreme jagged peaks

      const scale = 0.75 + random() * 0.65;
      const rotY = random() * Math.PI * 2;

      dummy.position.set(rx, ry, rz);
      dummy.rotation.set(0, rotY, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      // Higher elevations prefer Pine/Conifer, valley meadows prefer Deciduous/Oak
      if (ry > 2.0 || Math.abs(rx) > 35 || Math.abs(rz) > 35) {
        pines.push(dummy.matrix.clone());
      } else {
        decs.push(dummy.matrix.clone());
      }
    }

    // 2. Generate Boulders / Rocks along riverbanks, hilltops, and cliff bases
    for (let i = 0; i < 180; i++) {
      const rx = (random() - 0.5) * 118;
      const rz = (random() - 0.5) * 118;

      const ry = getTerrainHeight(rx, rz);
      if (ry < -1.0) continue; // avoid deep riverbed center

      // Rocks cluster near river edges or steeper slopes
      const nearWaterEdge = isNearRiver(rx, rz, 5.5) && !isNearRiver(rx, rz, 1.0);
      const isHighSlope = ry > 2.5;

      if (!nearWaterEdge && !isHighSlope && random() > 0.3) continue;

      const sx = 0.6 + random() * 1.4;
      const sy = 0.5 + random() * 1.0;
      const sz = 0.6 + random() * 1.4;

      dummy.position.set(rx, ry + sy * 0.3, rz);
      dummy.rotation.set(random() * 0.4, random() * Math.PI * 2, random() * 0.4);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();

      rocks.push(dummy.matrix.clone());
    }

    // 3. Generate Bushes & Wild Flora
    for (let i = 0; i < 220; i++) {
      const rx = (random() - 0.5) * 105;
      const rz = (random() - 0.5) * 105;

      if (isExcluded(rx, rz)) continue;
      const ry = getTerrainHeight(rx, rz);
      if (ry < 0.2 || ry > 6.0) continue;

      const scale = 0.45 + random() * 0.55;
      dummy.position.set(rx, ry, rz);
      dummy.rotation.set(0, random() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      bushes.push(dummy.matrix.clone());
    }

    return {
      pineTransforms: pines,
      decTransforms: decs,
      rockTransforms: rocks,
      bushTransforms: bushes,
    };
  }, []);

  // Apply transforms to instanced meshes
  useEffect(() => {
    if (pineMeshRef.current) {
      pineTransforms.forEach((matrix, i) => {
        pineMeshRef.current?.setMatrixAt(i, matrix);
      });
      pineMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (deciduousMeshRef.current) {
      decTransforms.forEach((matrix, i) => {
        deciduousMeshRef.current?.setMatrixAt(i, matrix);
      });
      deciduousMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (rockMeshRef.current) {
      rockTransforms.forEach((matrix, i) => {
        rockMeshRef.current?.setMatrixAt(i, matrix);
      });
      rockMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (bushMeshRef.current) {
      bushTransforms.forEach((matrix, i) => {
        bushMeshRef.current?.setMatrixAt(i, matrix);
      });
      bushMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [pineTransforms, decTransforms, rockTransforms, bushTransforms]);

  // Subtle wind sway animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const sway = Math.sin(t * 1.8) * 0.02;

    if (pineMeshRef.current) {
      pineMeshRef.current.rotation.z = sway * 0.5;
    }
    if (deciduousMeshRef.current) {
      deciduousMeshRef.current.rotation.x = sway * 0.4;
    }
  });

  // Pine tree compound geometry (trunk + 3 tiered conical foliage rings)
  const pineGeometry = useMemo(() => {
    const groupGeo = new THREE.BufferGeometry();
    // Trunk
    const trunk = new THREE.CylinderGeometry(0.16, 0.28, 1.8, 6);
    trunk.translate(0, 0.9, 0);
    // Lower Cone
    const cone1 = new THREE.ConeGeometry(1.6, 2.4, 7);
    cone1.translate(0, 2.4, 0);
    // Mid Cone
    const cone2 = new THREE.ConeGeometry(1.2, 2.0, 7);
    cone2.translate(0, 3.6, 0);
    // Top Cone
    const cone3 = new THREE.ConeGeometry(0.75, 1.6, 7);
    cone3.translate(0, 4.6, 0);

    return { trunk, foliage: cone1 }; // Return base for instancing
  }, []);

  // Deciduous compound geometry (trunk + rounded multifaceted crown)
  const decGeometry = useMemo(() => {
    const crown = new THREE.DodecahedronGeometry(1.4, 1);
    crown.scale(1.0, 1.25, 1.0);
    crown.translate(0, 2.6, 0);
    return crown;
  }, []);

  const rockGeometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1.0, 0);
    geo.scale(1.2, 0.8, 1.0);
    return geo;
  }, []);

  const bushGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.9, 6, 5);
    geo.scale(1.2, 0.75, 1.1);
    geo.translate(0, 0.5, 0);
    return geo;
  }, []);

  const foliageColor = activeLayer === 'environment' ? '#246b33' : '#2d6139';
  const decFoliageColor = activeLayer === 'environment' ? '#448a3c' : '#3d7a36';

  return (
    <group>
      {/* Instanced Pine / Conifer Trees */}
      {pineTransforms.length > 0 && (
        <instancedMesh
          ref={pineMeshRef}
          args={[pineGeometry.foliage, undefined, pineTransforms.length]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={foliageColor}
            roughness={0.7}
            flatShading
          />
        </instancedMesh>
      )}

      {/* Instanced Deciduous / Oak Trees */}
      {decTransforms.length > 0 && (
        <instancedMesh
          ref={deciduousMeshRef}
          args={[decGeometry, undefined, decTransforms.length]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={decFoliageColor}
            roughness={0.65}
            flatShading
          />
        </instancedMesh>
      )}

      {/* Instanced Boulders & Rock Formations */}
      {rockTransforms.length > 0 && (
        <instancedMesh
          ref={rockMeshRef}
          args={[rockGeometry, undefined, rockTransforms.length]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#5e6662"
            roughness={0.85}
            metalness={0.1}
            flatShading
          />
        </instancedMesh>
      )}

      {/* Instanced Flowering Bushes & Meadows */}
      {bushTransforms.length > 0 && (
        <instancedMesh
          ref={bushMeshRef}
          args={[bushGeometry, undefined, bushTransforms.length]}
          receiveShadow
        >
          <meshStandardMaterial
            color="#4f7a46"
            roughness={0.8}
            flatShading
          />
        </instancedMesh>
      )}
    </group>
  );
}

