import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useIsNight } from './DayNightController';
import { getTerrainHeight } from './Terrain';

interface StreetlightCoord {
  x: number;
  z: number;
  rotationY: number;
}

export default React.memo(function StreetlightsSystem() {
  const isNight = useIsNight();

  const lightPoleRef = useRef<THREE.InstancedMesh>(null);
  const lampLensRef = useRef<THREE.InstancedMesh>(null);

  // Generate organized streetlamp positions along sidewalks
  const lampCoords: StreetlightCoord[] = useMemo(() => {
    const list: StreetlightCoord[] = [];

    // 1. North-South Grand Arterial (Along X = 0, sidewalks at X = -3.2 and +3.2)
    // North Parkway (Z from -40 to -14)
    for (let z = -40; z <= -14; z += 12) {
      list.push({ x: -3.2, z, rotationY: -Math.PI / 2 }); // Faces road (+X)
      list.push({ x: 3.2, z, rotationY: Math.PI / 2 }); // Faces road (-X)
    }
    // South Grand Arterial (Z from 28 to 42)
    for (let z = 28; z <= 42; z += 12) {
      list.push({ x: -3.2, z, rotationY: -Math.PI / 2 });
      list.push({ x: 3.2, z, rotationY: Math.PI / 2 });
    }

    // 2. South Cross-Arterial (Along Z = 24, sidewalks at Z = 21.6 and 26.4)
    // West Arm: X from -20 to -6
    for (let x = -20; x <= -6; x += 12) {
      list.push({ x, z: 21.6, rotationY: 0 }); // Faces road (+Z)
      list.push({ x, z: 26.4, rotationY: Math.PI }); // Faces road (-Z)
    }
    // East Arm: X from 6 to 20
    for (let x = 6; x <= 20; x += 12) {
      list.push({ x, z: 21.6, rotationY: 0 });
      list.push({ x, z: 26.4, rotationY: Math.PI });
    }

    // 3. West Science Highway (Along X = -25, sidewalks at X = -27.4 and -22.6)
    for (let z = -36; z <= -26; z += 10) {
      list.push({ x: -27.4, z, rotationY: -Math.PI / 2 });
      list.push({ x: -22.6, z, rotationY: Math.PI / 2 });
    }
    for (let z = 28; z <= 38; z += 10) {
      list.push({ x: -27.4, z, rotationY: -Math.PI / 2 });
      list.push({ x: -22.6, z, rotationY: Math.PI / 2 });
    }

    // 4. East Vulcan Industrial Highway (Along X = 25, sidewalks at X = 22.6 and 27.4)
    for (let z = -36; z <= -24; z += 12) {
      list.push({ x: 22.6, z, rotationY: -Math.PI / 2 });
      list.push({ x: 27.4, z, rotationY: Math.PI / 2 });
    }
    for (let z = 28; z <= 38; z += 10) {
      list.push({ x: 22.6, z, rotationY: -Math.PI / 2 });
      list.push({ x: 27.4, z, rotationY: Math.PI / 2 });
    }

    // 5. Citadel Ring Boulevard (Radius ~ 8.1, encircles Citadel Dais at [0, 13])
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const r = 8.1;
      const x = Math.cos(angle) * r;
      const z = 13 + Math.sin(angle) * r;
      // Facing inward towards the ring roadway
      const rot = Math.atan2(-x, -(z - 13));
      list.push({ x, z, rotationY: rot });
    }

    return list;
  }, []);

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

    const merged = new THREE.BufferGeometry();
    const pos = new Float32Array([
      ...footing.attributes.position.array,
      ...baseCollar.attributes.position.array,
      ...mast.attributes.position.array,
      ...arm.attributes.position.array,
      ...shade.attributes.position.array,
    ]);
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    merged.computeVertexNormals();

    footing.dispose();
    baseCollar.dispose();
    mast.dispose();
    arm.dispose();
    shade.dispose();
    return merged;
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

  const lensMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isNight ? '#fff2b3' : '#4a4435',
        emissive: isNight ? '#ffb938' : '#000000',
        emissiveIntensity: isNight ? 2.8 : 0,
        roughness: 0.2,
      }),
    [isNight]
  );

  useEffect(() => {
    lensMat.color.set(isNight ? '#fff2b3' : '#4a4435');
    lensMat.emissive.set(isNight ? '#ffb938' : '#000000');
    lensMat.emissiveIntensity = isNight ? 2.8 : 0;
  }, [isNight, lensMat]);

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

