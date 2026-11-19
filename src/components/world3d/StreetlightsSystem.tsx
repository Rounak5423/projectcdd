import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useIsNight } from './DayNightController';
import { useGameState } from '../../context/GameStateContext';
import { getTerrainHeight } from './Terrain';

interface StreetlightCoord {
  x: number;
  z: number;
  rotationY: number;
}

export default React.memo(function StreetlightsSystem() {
  const isNight = useIsNight();
  const { civilization } = useGameState();
  const currentLevel = civilization?.level ?? 1;

  const lightPoleRef = useRef<THREE.InstancedMesh>(null);
  const lampLensRef = useRef<THREE.InstancedMesh>(null);

  // Generate organized streetlamp positions along sidewalks
  const lampCoords: StreetlightCoord[] = useMemo(() => {
    // LEVEL 1: Starter Settlement / Frontier Outpost
    // Only 4 warm brass lantern posts immediately flanking the Citadel court
    if (currentLevel <= 1) {
      return [
        { x: -5.0, z: 6.5, rotationY: -Math.PI / 2 },
        { x: 5.0, z: 6.5, rotationY: Math.PI / 2 },
        { x: -5.0, z: 17.5, rotationY: -Math.PI / 2 },
        { x: 5.0, z: 17.5, rotationY: Math.PI / 2 },
      ];
    }

    const list: StreetlightCoord[] = [];

    // LEVEL 2: Riverside Village (Civic Promenade + South Village Lane)
    for (let z = 6; z <= 22; z += 6) {
      list.push({ x: -13.2, z, rotationY: -Math.PI / 2 });
      list.push({ x: 13.2, z, rotationY: Math.PI / 2 });
    }
    for (let z = 28; z <= 36; z += 8) {
      list.push({ x: -3.2, z, rotationY: -Math.PI / 2 });
      list.push({ x: 3.2, z, rotationY: Math.PI / 2 });
    }
    if (currentLevel === 2) return list;

    // LEVEL 3: Market Town (Cross-Parkways + Grand Roundabout + Town Cul-de-Sacs)
    for (let x = -20; x <= -6; x += 12) {
      list.push({ x, z: 21.6, rotationY: 0 });
      list.push({ x, z: 26.4, rotationY: Math.PI });
    }
    for (let x = 6; x <= 20; x += 12) {
      list.push({ x, z: 21.6, rotationY: 0 });
      list.push({ x, z: 26.4, rotationY: Math.PI });
    }
    // Roundabout Corner Luminaires
    list.push({ x: -5.0, z: 19.0, rotationY: Math.PI / 4 });
    list.push({ x: 5.0, z: 19.0, rotationY: -Math.PI / 4 });
    list.push({ x: -5.0, z: 29.0, rotationY: (3 * Math.PI) / 4 });
    list.push({ x: 5.0, z: 29.0, rotationY: -(3 * Math.PI) / 4 });
    // Town Cul-de-Sacs
    list.push({ x: -25.0, z: 39.5, rotationY: Math.PI });
    list.push({ x: 14.0, z: 39.5, rotationY: Math.PI });
    if (currentLevel === 3) return list;

    // LEVEL 4+: City, Metropolis, Golden Realm (Full Regional Network)
    // North Grand Arterial
    for (let z = -40; z <= -14; z += 12) {
      list.push({ x: -3.2, z, rotationY: -Math.PI / 2 });
      list.push({ x: 3.2, z, rotationY: Math.PI / 2 });
    }
    // Extended South Grand Arterial
    for (let z = 38; z <= 42; z += 12) {
      list.push({ x: -3.2, z, rotationY: -Math.PI / 2 });
      list.push({ x: 3.2, z, rotationY: Math.PI / 2 });
    }
    // West Science Highway
    for (let z = -36; z <= -26; z += 10) {
      list.push({ x: -27.4, z, rotationY: -Math.PI / 2 });
      list.push({ x: -22.6, z, rotationY: Math.PI / 2 });
    }
    for (let z = 28; z <= 38; z += 10) {
      list.push({ x: -27.4, z, rotationY: -Math.PI / 2 });
      list.push({ x: -22.6, z, rotationY: Math.PI / 2 });
    }
    // East Vulcan Industrial Highway
    for (let z = -36; z <= -24; z += 12) {
      list.push({ x: 22.6, z, rotationY: -Math.PI / 2 });
      list.push({ x: 27.4, z, rotationY: Math.PI / 2 });
    }
    for (let z = 28; z <= 38; z += 12) {
      list.push({ x: 22.6, z, rotationY: -Math.PI / 2 });
      list.push({ x: 27.4, z, rotationY: Math.PI / 2 });
    }
    // Distant Cul-de-Sacs
    list.push({ x: -35.2, z: -2.0, rotationY: Math.PI / 2 });
    list.push({ x: 37.2, z: 24.0, rotationY: -Math.PI / 2 });

    return list;
  }, [currentLevel]);

  // Geometry: Sleek modern streetlamp post with cantilever mast and subterranean foundation
  const poleGeo = useMemo(() => {
    // Concrete underground foundation footing (spans y: -0.50m to +0.12m)
    const footing = new THREE.CylinderGeometry(0.16, 0.22, 0.65, 8);
    footing.translate(0, -0.2, 0);

    // Cast metal base collar
    const baseCollar = new THREE.CylinderGeometry(0.22, 0.25, 0.2, 8);
    baseCollar.translate(0, 0.1, 0);

    // Mast
    const mast = new THREE.CylinderGeometry(0.06, 0.09, 3.4, 8);
    mast.translate(0, 1.7, 0);

    // Cantilever arm
    const arm = new THREE.CylinderGeometry(0.04, 0.05, 0.9, 8);
    arm.rotateX(Math.PI / 2);
    arm.translate(0, 3.35, 0.4);

    // Lamp shade head
    const shade = new THREE.BoxGeometry(0.24, 0.08, 0.38);
    shade.translate(0, 3.32, 0.78);

    const merged = mergeGeometries([
      footing.toNonIndexed(),
      baseCollar.toNonIndexed(),
      mast.toNonIndexed(),
      arm.toNonIndexed(),
      shade.toNonIndexed(),
    ]);

    footing.dispose();
    baseCollar.dispose();
    mast.dispose();
    arm.dispose();
    shade.dispose();
    return merged || new THREE.BufferGeometry();
  }, []);

  // Geometry: Glowing LED luminaire lens
  const lensGeo = useMemo(() => {
    const lens = new THREE.BoxGeometry(0.18, 0.04, 0.28);
    lens.translate(0, 3.27, 0.78);
    return lens;
  }, []);

  // Materials
  const poleMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2a312c', roughness: 0.6, metalness: 0.7 }),
    []
  );

  const { economyReport } = useGameState();
  const isBrownout = economyReport.hasCriticalPowerDeficit;

  const lensMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isNight ? (isBrownout ? '#ff8833' : '#fff2b3') : '#4a4435',
        emissive: isNight ? (isBrownout ? '#ff5500' : '#ffb938') : '#000000',
        emissiveIntensity: isNight ? (isBrownout ? 0.9 : 2.8) : 0,
        roughness: 0.2,
      }),
    [isNight, isBrownout]
  );

  useEffect(() => {
    lensMat.color.set(isNight ? (isBrownout ? '#ff8833' : '#fff2b3') : '#4a4435');
    lensMat.emissive.set(isNight ? (isBrownout ? '#ff5500' : '#ffb938') : '#000000');
    lensMat.emissiveIntensity = isNight ? (isBrownout ? 0.9 : 2.8) : 0;
  }, [isNight, isBrownout, lensMat]);

  // Update instance matrices
  useEffect(() => {
    if (!lightPoleRef.current || !lampLensRef.current) return;

    const dummy = new THREE.Object3D();

    lampCoords.forEach((coord, i) => {
      // Anchored flush on the raised sidewalk level (+0.14m)
      const y = getTerrainHeight(coord.x, coord.z) + 0.14;
      dummy.position.set(coord.x, y, coord.z);
      dummy.rotation.set(0, coord.rotationY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      lightPoleRef.current?.setMatrixAt(i, dummy.matrix);
      lampLensRef.current?.setMatrixAt(i, dummy.matrix);
    });

    lightPoleRef.current.instanceMatrix.needsUpdate = true;
    lampLensRef.current.instanceMatrix.needsUpdate = true;
  }, [lampCoords]);

  return (
    <group raycast={() => null}>
      <instancedMesh
        ref={lightPoleRef}
        args={[poleGeo, poleMat, lampCoords.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={lampLensRef}
        args={[lensGeo, lensMat, lampCoords.length]}
      />
    </group>
  );
});

