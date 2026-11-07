import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, isNearRiver, isNearLake } from './Terrain';
import { MapLayer, useGameState } from '../../context/GameStateContext';
import { CITY_ROAD_CORRIDORS, JUNCTION_CLEARANCE_PLAZAS, projectPointToSegment } from './cityPlanning';

interface NatureEnvironmentProps {
  activeLayer: MapLayer;
}

// High-performance geometry merger for compound instanced models
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  let totalVerts = 0;
  let totalIdx = 0;

  for (const g of geometries) {
    const pos = g.attributes.position;
    if (!pos) continue;
    totalVerts += pos.count;
    if (g.index) {
      totalIdx += g.index.count;
    } else {
      totalIdx += pos.count;
    }
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = totalVerts > 65535 ? new Uint32Array(totalIdx) : new Uint16Array(totalIdx);

  let vertOffset = 0;
  let idxOffset = 0;

  for (const g of geometries) {
    const pos = g.attributes.position;
    if (!pos) continue;
    const count = pos.count;

    positions.set(pos.array as Float32Array, vertOffset * 3);

    if (g.attributes.normal) {
      normals.set(g.attributes.normal.array as Float32Array, vertOffset * 3);
    }

    if (g.index) {
      const idx = g.index.array;
      for (let i = 0; i < idx.length; i++) {
        indices[idxOffset + i] = idx[i] + vertOffset;
      }
      idxOffset += idx.length;
    } else {
      for (let i = 0; i < count; i++) {
        indices[idxOffset + i] = i + vertOffset;
      }
      idxOffset += count;
    }

    vertOffset += count;
  }

  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeVertexNormals();

  return merged;
}

function NatureEnvironment({ activeLayer }: NatureEnvironmentProps) {
  const { placedBuildings } = useGameState();

  // Instanced mesh references for paired trunk and foliage rendering
  const pineTrunkRef = useRef<THREE.InstancedMesh>(null);
  const pineFoliageRef = useRef<THREE.InstancedMesh>(null);

  const decTrunkRef = useRef<THREE.InstancedMesh>(null);
  const decFoliageRef = useRef<THREE.InstancedMesh>(null);

  const birchTrunkRef = useRef<THREE.InstancedMesh>(null);
  const birchFoliageRef = useRef<THREE.InstancedMesh>(null);

  const rockMeshRef = useRef<THREE.InstancedMesh>(null);
  const bushMeshRef = useRef<THREE.InstancedMesh>(null);

  // Generate deterministic scattered trees, rocks, and flora firmly anchored to the terrain
  const { pineTransforms, decTransforms, birchTransforms, rockTransforms, bushTransforms } = useMemo(() => {
    const isExcluded = (x: number, z: number, clearance: number = 2.4) => {
      // 1. Keep clear of water bodies (river ribbons & lakes)
      if (isNearRiver(x, z, 3.8) || isNearLake(x, z, 4.2)) return true;
      if (Math.hypot(x - (-26), z - (-34)) < 6.8) return true; // Tarn pond

      // 2. Elysium Grand Civic Forum, Boulevard Loop & Bridge Approach
      if ((Math.abs(x) < 12.2 && z >= 4.5 && z <= 20.5) || Math.hypot(x, z) < 7.5) return true;

      // 3. Roads and Sidewalks Corridors
      for (const road of CITY_ROAD_CORRIDORS) {
        const proj = projectPointToSegment(x, z, road.p1[0], road.p1[1], road.p2[0], road.p2[1]);
        const reqClearance = road.width * 0.5 + 1.8 + clearance;
        if (proj.dist < reqClearance) return true;
      }

      // 4. Junction Clearance Plazas
      for (const [jx, jz, jRadius] of JUNCTION_CLEARANCE_PLAZAS) {
        if (Math.hypot(x - jx, z - jz) < jRadius + 1.8 + clearance) return true;
      }

      // 5. Placed Buildings & Construction Lots
      for (const b of placedBuildings) {
        if (Math.hypot(x - b.x, z - b.z) < 4.6 + clearance) return true;
      }

      return false;
    };

    // Deterministic pseudo-random generator
    let seed = 42;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const pines: THREE.Matrix4[] = [];
    const decs: THREE.Matrix4[] = [];
    const birches: THREE.Matrix4[] = [];
    const rocks: THREE.Matrix4[] = [];
    const bushes: THREE.Matrix4[] = [];

    const dummy = new THREE.Object3D();

    // 1. Generate Trees in natural biome clusters
    for (let i = 0; i < 480; i++) {
      const rx = (random() - 0.5) * 116;
      const rz = (random() - 0.5) * 116;

      if (isExcluded(rx, rz, 2.0)) continue;

      const ry = getTerrainHeight(rx, rz);
      // Ensure trees are neither submerged in water nor on jagged snow-caps
      if (ry < 0.25 || ry > 10.8) continue;

      const scale = 0.82 + random() * 0.55;
      const rotY = random() * Math.PI * 2;
      // Subtle natural tree lean (1.5 - 2 degrees)
      const tiltX = (random() - 0.5) * 0.05;
      const tiltZ = (random() - 0.5) * 0.05;

      // Position set strictly at terrain surface height
      dummy.position.set(rx, ry, rz);
      dummy.rotation.set(tiltX, rotY, tiltZ);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      // Biome distribution:
      // Mountain flanks & high elevations -> Conifer Pines
      // Lowland plains & rolling hills -> Broadleaf Oaks & Silver Birches
      if (ry > 2.0 || Math.abs(rx) > 34 || Math.abs(rz) > 34) {
        pines.push(dummy.matrix.clone());
      } else if (random() > 0.42) {
        decs.push(dummy.matrix.clone());
      } else {
        birches.push(dummy.matrix.clone());
      }
    }

    // 2. Generate Boulders & River Rocks (Firmly embedded into ground)
    for (let i = 0; i < 160; i++) {
      const rx = (random() - 0.5) * 118;
      const rz = (random() - 0.5) * 118;

      if (isExcluded(rx, rz, 1.2)) continue;

      const ry = getTerrainHeight(rx, rz);
      if (ry < -0.9) continue;

      const nearWaterEdge = isNearRiver(rx, rz, 5.5) && !isNearRiver(rx, rz, 1.2);
      const isHighSlope = ry > 2.2;

      if (!nearWaterEdge && !isHighSlope && random() > 0.3) continue;

      const sx = 0.7 + random() * 1.3;
      const sy = 0.5 + random() * 0.9;
      const sz = 0.7 + random() * 1.3;

      // Base firmly sunk into terrain
      dummy.position.set(rx, ry, rz);
      dummy.rotation.set((random() - 0.5) * 0.3, random() * Math.PI * 2, (random() - 0.5) * 0.3);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();

      rocks.push(dummy.matrix.clone());
    }

    // 3. Generate Bushes & Wild Shrubs
    for (let i = 0; i < 210; i++) {
      const rx = (random() - 0.5) * 108;
      const rz = (random() - 0.5) * 108;

      if (isExcluded(rx, rz, 1.0)) continue;
      const ry = getTerrainHeight(rx, rz);
      if (ry < 0.25 || ry > 6.0) continue;

      const scale = 0.5 + random() * 0.5;
      dummy.position.set(rx, ry, rz);
      dummy.rotation.set(0, random() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      bushes.push(dummy.matrix.clone());
    }

    return {
      pineTransforms: pines,
      decTransforms: decs,
      birchTransforms: birches,
      rockTransforms: rocks,
      bushTransforms: bushes,
    };
  }, []);

  // Update instance matrices on GPU
  useEffect(() => {
    // Pines
    if (pineTrunkRef.current) {
      pineTransforms.forEach((matrix, i) => pineTrunkRef.current?.setMatrixAt(i, matrix));
      pineTrunkRef.current.instanceMatrix.needsUpdate = true;
    }
    if (pineFoliageRef.current) {
      pineTransforms.forEach((matrix, i) => pineFoliageRef.current?.setMatrixAt(i, matrix));
      pineFoliageRef.current.instanceMatrix.needsUpdate = true;
    }

    // Deciduous Oaks
    if (decTrunkRef.current) {
      decTransforms.forEach((matrix, i) => decTrunkRef.current?.setMatrixAt(i, matrix));
      decTrunkRef.current.instanceMatrix.needsUpdate = true;
    }
    if (decFoliageRef.current) {
      decTransforms.forEach((matrix, i) => decFoliageRef.current?.setMatrixAt(i, matrix));
      decFoliageRef.current.instanceMatrix.needsUpdate = true;
    }

    // Silver Birches
    if (birchTrunkRef.current) {
      birchTransforms.forEach((matrix, i) => birchTrunkRef.current?.setMatrixAt(i, matrix));
      birchTrunkRef.current.instanceMatrix.needsUpdate = true;
    }
    if (birchFoliageRef.current) {
      birchTransforms.forEach((matrix, i) => birchFoliageRef.current?.setMatrixAt(i, matrix));
      birchFoliageRef.current.instanceMatrix.needsUpdate = true;
    }

    // Rocks
    if (rockMeshRef.current) {
      rockTransforms.forEach((matrix, i) => rockMeshRef.current?.setMatrixAt(i, matrix));
      rockMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Bushes
    if (bushMeshRef.current) {
      bushTransforms.forEach((matrix, i) => bushMeshRef.current?.setMatrixAt(i, matrix));
      bushMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [pineTransforms, decTransforms, birchTransforms, rockTransforms, bushTransforms]);

  // ================= 3D MODEL GEOMETRY GENERATION =================

  // 1. Alpine Pine / Conifer Tree
  const { pineTrunkGeo, pineFoliageGeo } = useMemo(() => {
    // Trunk: Tapered central timber pillar anchored -0.50m into terrain
    const trunk = new THREE.CylinderGeometry(0.14, 0.28, 4.1, 8);
    trunk.translate(0, 1.55, 0); // Spans Y: -0.50m (soil anchor) to +3.60m

    // Root flare spreading into ground
    const flare = new THREE.CylinderGeometry(0.28, 0.58, 0.6, 8);
    flare.translate(0, -0.2, 0);

    // Root buttresses
    const rootGeos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + 0.3;
      const root = new THREE.BoxGeometry(0.18, 0.25, 0.7);
      root.rotateY(angle);
      root.translate(Math.cos(angle) * 0.35, -0.12, Math.sin(angle) * 0.35);
      rootGeos.push(root);
    }

    const tGeo = mergeBufferGeometries([trunk, flare, ...rootGeos]);
    trunk.dispose();
    flare.dispose();
    rootGeos.forEach((g) => g.dispose());

    // Foliage: 4 tiered conical branch needle skirts
    const skirt1 = new THREE.ConeGeometry(1.85, 1.8, 8);
    skirt1.translate(0, 1.8, 0);

    const skirt2 = new THREE.ConeGeometry(1.48, 1.6, 8);
    skirt2.rotateY(0.4);
    skirt2.translate(0, 2.7, 0);

    const skirt3 = new THREE.ConeGeometry(1.1, 1.4, 8);
    skirt3.rotateY(0.8);
    skirt3.translate(0, 3.6, 0);

    const skirt4 = new THREE.ConeGeometry(0.65, 1.2, 8);
    skirt4.rotateY(0.2);
    skirt4.translate(0, 4.4, 0);

    const fGeo = mergeBufferGeometries([skirt1, skirt2, skirt3, skirt4]);
    skirt1.dispose();
    skirt2.dispose();
    skirt3.dispose();
    skirt4.dispose();

    return { pineTrunkGeo: tGeo, pineFoliageGeo: fGeo };
  }, []);

  // 2. Broadleaf Deciduous Oak Tree
  const { decTrunkGeo, decFoliageGeo } = useMemo(() => {
    // Trunk: Thick organic timber trunk anchored -0.50m into terrain
    const trunk = new THREE.CylinderGeometry(0.25, 0.44, 2.9, 8);
    trunk.translate(0, 0.95, 0); // Spans Y: -0.50m (soil anchor) to +2.40m

    // Root flare at base
    const flare = new THREE.CylinderGeometry(0.44, 0.78, 0.65, 8);
    flare.translate(0, -0.2, 0);

    // Root buttresses embedding into the ground
    const roots: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + 0.2;
      const root = new THREE.BoxGeometry(0.24, 0.3, 0.85);
      root.rotateY(angle);
      root.translate(Math.cos(angle) * 0.45, -0.15, Math.sin(angle) * 0.45);
      roots.push(root);
    }

    // 3 Major architectural limbs holding the canopy
    const b1 = new THREE.CylinderGeometry(0.14, 0.22, 1.4, 7);
    b1.rotateZ(0.55);
    b1.rotateY(0.2);
    b1.translate(-0.6, 2.1, 0.2);

    const b2 = new THREE.CylinderGeometry(0.13, 0.2, 1.3, 7);
    b2.rotateZ(-0.52);
    b2.rotateY(-0.4);
    b2.translate(0.55, 2.15, -0.25);

    const b3 = new THREE.CylinderGeometry(0.12, 0.18, 1.2, 7);
    b3.rotateX(-0.48);
    b3.translate(0.1, 2.2, 0.5);

    const tGeo = mergeBufferGeometries([trunk, flare, ...roots, b1, b2, b3]);
    trunk.dispose();
    flare.dispose();
    roots.forEach((g) => g.dispose());
    b1.dispose();
    b2.dispose();
    b3.dispose();

    // Foliage: Lush 6-clump multi-lobed cloud canopy
    const cCore = new THREE.IcosahedronGeometry(1.4, 1);
    cCore.scale(1.25, 1.05, 1.25);
    cCore.translate(0, 2.85, 0);

    const cLeft = new THREE.IcosahedronGeometry(1.0, 1);
    cLeft.translate(-0.95, 2.55, 0.35);

    const cRight = new THREE.IcosahedronGeometry(1.08, 1);
    cRight.translate(0.9, 2.65, -0.3);

    const cFront = new THREE.IcosahedronGeometry(0.88, 1);
    cFront.translate(0.25, 2.35, 0.85);

    const cBack = new THREE.IcosahedronGeometry(0.92, 1);
    cBack.translate(-0.35, 2.45, -0.8);

    const cTop = new THREE.IcosahedronGeometry(0.95, 1);
    cTop.translate(0.05, 3.75, 0.05);

    const fGeo = mergeBufferGeometries([cCore, cLeft, cRight, cFront, cBack, cTop]);
    cCore.dispose();
    cLeft.dispose();
    cRight.dispose();
    cFront.dispose();
    cBack.dispose();
    cTop.dispose();

    return { decTrunkGeo: tGeo, decFoliageGeo: fGeo };
  }, []);

  // 3. Silver Birch / Meadow Orchard Tree
  const { birchTrunkGeo, birchFoliageGeo } = useMemo(() => {
    // Slender trunk anchored -0.45m in the soil
    const trunk = new THREE.CylinderGeometry(0.11, 0.22, 3.3, 7);
    trunk.translate(0, 1.2, 0); // Spans Y: -0.45m to +2.85m

    const flare = new THREE.CylinderGeometry(0.22, 0.42, 0.5, 7);
    flare.translate(0, -0.2, 0);

    const tGeo = mergeBufferGeometries([trunk, flare]);
    trunk.dispose();
    flare.dispose();

    // Foliage: Graceful 4-clump leafy crown
    const cCore = new THREE.IcosahedronGeometry(1.15, 1);
    cCore.scale(1.0, 1.2, 1.0);
    cCore.translate(0, 2.7, 0);

    const cLeft = new THREE.IcosahedronGeometry(0.75, 1);
    cLeft.translate(-0.65, 2.4, 0.2);

    const cRight = new THREE.IcosahedronGeometry(0.75, 1);
    cRight.translate(0.65, 2.45, -0.2);

    const cTop = new THREE.IcosahedronGeometry(0.7, 1);
    cTop.translate(0, 3.45, 0);

    const fGeo = mergeBufferGeometries([cCore, cLeft, cRight, cTop]);
    cCore.dispose();
    cLeft.dispose();
    cRight.dispose();
    cTop.dispose();

    return { birchTrunkGeo: tGeo, birchFoliageGeo: fGeo };
  }, []);

  // 4. Weathered Boulders & River Rocks (Firmly embedded into ground)
  const rockGeometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1.0, 0);
    geo.scale(1.3, 0.85, 1.1);
    // Lower 35% deeply embedded into terrain to prevent any floating
    geo.translate(0, -0.30, 0);
    return geo;
  }, []);

  // 5. Wild Flowering Bushes
  const bushGeometry = useMemo(() => {
    const c1 = new THREE.SphereGeometry(0.75, 7, 6);
    c1.scale(1.1, 0.8, 1.0);
    c1.translate(0, -0.05, 0); // Base penetrates slightly into meadow soil

    const c2 = new THREE.SphereGeometry(0.55, 6, 5);
    c2.scale(1.0, 0.7, 0.9);
    c2.translate(0.4, 0.05, 0.2);

    const c3 = new THREE.SphereGeometry(0.5, 6, 5);
    c3.scale(0.9, 0.65, 1.0);
    c3.translate(-0.35, 0.02, -0.2);

    const bGeo = mergeBufferGeometries([c1, c2, c3]);
    c1.dispose();
    c2.dispose();
    c3.dispose();
    return bGeo;
  }, []);

  // GPU Buffer Cleanup
  useEffect(() => {
    return () => {
      pineTrunkGeo.dispose();
      pineFoliageGeo.dispose();
      decTrunkGeo.dispose();
      decFoliageGeo.dispose();
      birchTrunkGeo.dispose();
      birchFoliageGeo.dispose();
      rockGeometry.dispose();
      bushGeometry.dispose();
    };
  }, [
    pineTrunkGeo,
    pineFoliageGeo,
    decTrunkGeo,
    decFoliageGeo,
    birchTrunkGeo,
    birchFoliageGeo,
    rockGeometry,
    bushGeometry,
  ]);

  // Color palettes adapting to environment data layer
  const pineFoliageColor = activeLayer === 'environment' ? '#1f6131' : '#23562e';
  const decFoliageColor = activeLayer === 'environment' ? '#418b36' : '#397832';
  const birchFoliageColor = activeLayer === 'environment' ? '#619c3b' : '#568d34';

  return (
    <group raycast={() => null}>
      {/* 1. Instanced Alpine Pine Trees (Trunk + 4-Tier Conical Needle Foliage) */}
      {pineTransforms.length > 0 && (
        <group>
          {/* Timber Trunks & Buttress Roots */}
          <instancedMesh
            ref={pineTrunkRef}
            args={[pineTrunkGeo, undefined, pineTransforms.length]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#3b291a" roughness={0.92} />
          </instancedMesh>
          {/* Conifer Foliage */}
          <instancedMesh
            ref={pineFoliageRef}
            args={[pineFoliageGeo, undefined, pineTransforms.length]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={pineFoliageColor}
              roughness={0.72}
              flatShading
            />
          </instancedMesh>
        </group>
      )}

      {/* 2. Instanced Broadleaf Deciduous Oaks (Bough Trunks + Multi-Lobed Canopy) */}
      {decTransforms.length > 0 && (
        <group>
          {/* Oak Trunks & Angled Boughs */}
          <instancedMesh
            ref={decTrunkRef}
            args={[decTrunkGeo, undefined, decTransforms.length]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#4d3725" roughness={0.9} />
          </instancedMesh>
          {/* Broadleaf Leaf Canopy */}
          <instancedMesh
            ref={decFoliageRef}
            args={[decFoliageGeo, undefined, decTransforms.length]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={decFoliageColor}
              roughness={0.68}
              flatShading
            />
          </instancedMesh>
        </group>
      )}

      {/* 3. Instanced Silver Birches / Meadow Orchards */}
      {birchTransforms.length > 0 && (
        <group>
          {/* Silver Birch Trunks */}
          <instancedMesh
            ref={birchTrunkRef}
            args={[birchTrunkGeo, undefined, birchTransforms.length]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#d2ccc0" roughness={0.85} />
          </instancedMesh>
          {/* Golden-Lime Foliage */}
          <instancedMesh
            ref={birchFoliageRef}
            args={[birchFoliageGeo, undefined, birchTransforms.length]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={birchFoliageColor}
              roughness={0.65}
              flatShading
            />
          </instancedMesh>
        </group>
      )}

      {/* 4. Instanced Boulders & Rock Formations */}
      {rockTransforms.length > 0 && (
        <instancedMesh
          ref={rockMeshRef}
          args={[rockGeometry, undefined, rockTransforms.length]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#5e6662"
            roughness={0.88}
            metalness={0.08}
            flatShading
          />
        </instancedMesh>
      )}

      {/* 5. Instanced Flowering Bushes & Ground Flora */}
      {bushTransforms.length > 0 && (
        <instancedMesh
          ref={bushMeshRef}
          args={[bushGeometry, undefined, bushTransforms.length]}
          receiveShadow
        >
          <meshStandardMaterial
            color="#4e7c45"
            roughness={0.8}
            flatShading
          />
        </instancedMesh>
      )}
    </group>
  );
}

export default React.memo(NatureEnvironment);
