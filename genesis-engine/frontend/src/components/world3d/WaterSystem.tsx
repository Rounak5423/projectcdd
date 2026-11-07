import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getRiverPath } from './Terrain';
import { useIsNight } from './DayNightController';

export default React.memo(function WaterSystem() {
  const isNight = useIsNight();
  const riverRef = useRef<THREE.Mesh>(null);
  const lakeRef = useRef<THREE.Mesh>(null);
  const foamRef = useRef<THREE.Mesh>(null);

  // 1. Procedural 7-Cross-Section Curved River Ribbon with Depth-Based Vertex Colors
  const { riverGeo, foamGeo, shoreGeo, riverBasePositions, lakeGeo, lakeBasePositions } = useMemo(() => {
    const SEGMENTS_X = 110;
    const minX = -66;
    const maxX = 66;
    const stepX = (maxX - minX) / SEGMENTS_X;
    const LATERAL_COLS = 7; // 7 cross-section samples across the river ribbon

    const riverPositions: number[] = [];
    const riverColors: number[] = [];
    const riverNormals: number[] = [];
    const riverUvs: number[] = [];
    const riverIndices: number[] = [];

    // Left & Right Shore Sand Bed Margins
    const shorePositions: number[] = [];
    const shoreIndices: number[] = [];

    // Shoreline Foam Crest Strips
    const foamPositions: number[] = [];
    const foamIndices: number[] = [];

    // Color palettes for river gradient
    const cDeepThalweg = new THREE.Color(isNight ? '#07202d' : '#0d4a5d');
    const cMidChannel  = new THREE.Color(isNight ? '#0c2d3d' : '#19778c');
    const cShallows    = new THREE.Color(isNight ? '#123d4e' : '#28988e');
    const cShoreMargin = new THREE.Color(isNight ? '#174958' : '#3f9a8a');

    for (let r = 0; r <= SEGMENTS_X; r++) {
      const x = minX + r * stepX;
      const { z: rz, width } = getRiverPath(x);
      const halfW = width * 0.53; // Slightly widened for snug riverbank alignment
      const u = r / SEGMENTS_X;

      // 7 lateral vertices across the river ribbon
      for (let c = 0; c < LATERAL_COLS; c++) {
        const lateralT = c / (LATERAL_COLS - 1); // 0.0 (left bank) to 1.0 (right bank)
        const z = rz - halfW + lateralT * (halfW * 2);
        const y = -0.17; // Resting river water elevation

        riverPositions.push(x, y, z);
        riverNormals.push(0, 1, 0);
        riverUvs.push(u, lateralT);

        // Depth profile: Center (c=3) is deepest, edges (c=0, 6) are shallowest
        const centerDist = Math.abs(lateralT - 0.5) * 2.0; // 0.0 at center, 1.0 at shores
        const vColor = new THREE.Color();
        if (centerDist < 0.35) {
          vColor.lerpColors(cDeepThalweg, cMidChannel, centerDist / 0.35);
        } else if (centerDist < 0.75) {
          const t = (centerDist - 0.35) / 0.40;
          vColor.lerpColors(cMidChannel, cShallows, t);
        } else {
          const t = (centerDist - 0.75) / 0.25;
          vColor.lerpColors(cShallows, cShoreMargin, t);
        }

        riverColors.push(vColor.r, vColor.g, vColor.b);
      }

      // Shore Wet Sand & Gravel Under-Ribbons (left & right)
      const zL0 = rz - halfW;
      const zL1 = rz - halfW - 0.85;
      const zR0 = rz + halfW;
      const zR1 = rz + halfW + 0.85;

      shorePositions.push(x, -0.22, zL0, x, -0.15, zL1); // Left shore bank transition
      shorePositions.push(x, -0.22, zR0, x, -0.15, zR1); // Right shore bank transition

      // Shoreline gentle foam strips (tucked just along inner banks)
      foamPositions.push(x, -0.155, zL0 - 0.1, x, -0.155, zL0 + 0.45);
      foamPositions.push(x, -0.155, zR0 - 0.45, x, -0.155, zR0 + 0.1);

      // Generate Quad Triangles
      if (r < SEGMENTS_X) {
        // River grid quads
        for (let c = 0; c < LATERAL_COLS - 1; c++) {
          const p0 = r * LATERAL_COLS + c;
          const p1 = r * LATERAL_COLS + (c + 1);
          const p2 = (r + 1) * LATERAL_COLS + c;
          const p3 = (r + 1) * LATERAL_COLS + (c + 1);

          riverIndices.push(p0, p2, p1);
          riverIndices.push(p1, p2, p3);
        }

        // Shore quads
        const sBase = r * 4;
        shoreIndices.push(sBase, sBase + 4, sBase + 1);
        shoreIndices.push(sBase + 1, sBase + 4, sBase + 5);
        shoreIndices.push(sBase + 2, sBase + 3, sBase + 6);
        shoreIndices.push(sBase + 3, sBase + 7, sBase + 6);

        // Foam quads
        const fBase = r * 4;
        foamIndices.push(fBase, fBase + 4, fBase + 1);
        foamIndices.push(fBase + 1, fBase + 4, fBase + 5);
        foamIndices.push(fBase + 2, fBase + 3, fBase + 6);
        foamIndices.push(fBase + 3, fBase + 7, fBase + 6);
      }
    }

    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.Float32BufferAttribute(riverPositions, 3));
    rGeo.setAttribute('color', new THREE.Float32BufferAttribute(riverColors, 3));
    rGeo.setAttribute('normal', new THREE.Float32BufferAttribute(riverNormals, 3));
    rGeo.setAttribute('uv', new THREE.Float32BufferAttribute(riverUvs, 2));
    rGeo.setIndex(riverIndices);
    rGeo.computeVertexNormals();

    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.Float32BufferAttribute(shorePositions, 3));
    sGeo.setIndex(shoreIndices);
    sGeo.computeVertexNormals();

    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute('position', new THREE.Float32BufferAttribute(foamPositions, 3));
    fGeo.setIndex(foamIndices);
    fGeo.computeVertexNormals();

    // 2. Alpine Reservoir Lake Concentric Mesh (Subdivided with radial ripple vertex dynamics)
    const LAKE_RINGS = 12;
    const LAKE_SLICES = 48;
    const lakeRadius = 12.2;
    const lakePos: number[] = [];
    const lakeCols: number[] = [];
    const lakeIdx: number[] = [];

    const cLakeDeep = new THREE.Color(isNight ? '#082131' : '#0b4254');
    const cLakeEdge = new THREE.Color(isNight ? '#10374a' : '#228986');

    // Center vertex
    lakePos.push(0, 0, 0);
    lakeCols.push(cLakeDeep.r, cLakeDeep.g, cLakeDeep.b);

    for (let ring = 1; ring <= LAKE_RINGS; ring++) {
      const ringFrac = ring / LAKE_RINGS;
      const rDist = ringFrac * lakeRadius;
      const ringColor = new THREE.Color().lerpColors(cLakeDeep, cLakeEdge, Math.pow(ringFrac, 1.2));

      for (let s = 0; s < LAKE_SLICES; s++) {
        const theta = (s / LAKE_SLICES) * Math.PI * 2;
        const lx = Math.cos(theta) * rDist;
        const lz = Math.sin(theta) * rDist;
        lakePos.push(lx, 0, lz);
        lakeCols.push(ringColor.r, ringColor.g, ringColor.b);
      }
    }

    // Lake center fan indices
    for (let s = 0; s < LAKE_SLICES; s++) {
      const nextS = (s + 1) % LAKE_SLICES;
      lakeIdx.push(0, s + 1, nextS + 1);
    }

    // Lake ring quad indices
    for (let ring = 1; ring < LAKE_RINGS; ring++) {
      const ringStart = 1 + (ring - 1) * LAKE_SLICES;
      const nextRingStart = 1 + ring * LAKE_SLICES;
      for (let s = 0; s < LAKE_SLICES; s++) {
        const nextS = (s + 1) % LAKE_SLICES;
        const p0 = ringStart + s;
        const p1 = ringStart + nextS;
        const p2 = nextRingStart + s;
        const p3 = nextRingStart + nextS;
        lakeIdx.push(p0, p2, p1);
        lakeIdx.push(p1, p2, p3);
      }
    }

    const lkGeo = new THREE.BufferGeometry();
    lkGeo.setAttribute('position', new THREE.Float32BufferAttribute(lakePos, 3));
    lkGeo.setAttribute('color', new THREE.Float32BufferAttribute(lakeCols, 3));
    lkGeo.setIndex(lakeIdx);
    lkGeo.computeVertexNormals();

    return {
      riverGeo: rGeo,
      foamGeo: fGeo,
      shoreGeo: sGeo,
      riverBasePositions: new Float32Array(riverPositions),
      lakeGeo: lkGeo,
      lakeBasePositions: new Float32Array(lakePos),
    };
  }, [isNight]);

  // GPU Buffer Cleanup
  useEffect(() => {
    return () => {
      riverGeo.dispose();
      foamGeo.dispose();
      shoreGeo.dispose();
      lakeGeo.dispose();
    };
  }, [riverGeo, foamGeo, shoreGeo, lakeGeo]);

  // Smooth Dual-Phase Downstream River Flow & Lake Ripple Dynamics
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    // 1. Dynamic River Ribbon Wave Update
    if (riverRef.current) {
      const posAttr = riverRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const vx = riverBasePositions[i3];
        const vz = riverBasePositions[i3 + 2];

        // Lateral column index (c in 0..6)
        const col = i % 7;
        const lateralT = col / 6.0;

        // Bank damping factor (0.0 at shores, 1.0 at thalweg center):
        // Eliminates terrain clipping and prevents water from lifting above the riverbanks!
        const bankDamping = Math.sin(lateralT * Math.PI);

        // Realistic dual-phase downstream traveling wave:
        // Main downstream progression along X
        const uFlow = vx * 0.22 - elapsed * 1.25;
        // Lateral undulating eddy
        const vCross = (lateralT - 0.5) * 2.8 + Math.sin(vx * 0.12 + elapsed * 0.65) * 0.4;

        const waveHeight =
          (Math.sin(uFlow) * 0.042 +
            Math.cos(uFlow * 1.6 + vCross * 1.8) * 0.022 +
            Math.sin(vx * 0.45 + vz * 0.35 + elapsed * 2.1) * 0.012) * bankDamping;

        posArray[i3 + 1] = -0.17 + waveHeight;
      }
      posAttr.needsUpdate = true;
    }

    // 2. Concentric Lake Water Ripple Update
    if (lakeRef.current) {
      const posAttr = lakeRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const lx = lakeBasePositions[i3];
        const lz = lakeBasePositions[i3 + 2];
        const rDist = Math.sqrt(lx * lx + lz * lz);

        // Concentric radial ripple that gracefully dampens to zero at the lake perimeter (12.2m)
        const edgeDamping = Math.max(0, 1.0 - rDist / 12.2);
        const ripple = Math.sin(rDist * 1.45 - elapsed * 1.7) * 0.024 * edgeDamping;

        posArray[i3 + 1] = ripple;
      }
      posAttr.needsUpdate = true;
    }

    // 3. Shoreline Gentle Foam Highlight Pulsing
    if (foamRef.current) {
      const mat = foamRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.28 + Math.sin(elapsed * 2.6) * 0.10;
    }
  });

  return (
    <group raycast={() => null}>
      {/* Soft Wet Shore Sand / Gravel Foundation (Prevents sharp terrain seam cuts) */}
      <mesh geometry={shoreGeo} receiveShadow>
        <meshStandardMaterial
          color={isNight ? '#3a342a' : '#6b5f49'}
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* Main Flowing River Ribbon with Depth-Based Vertex Colors */}
      <mesh
        ref={riverRef}
        geometry={riverGeo}
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.12}
          metalness={0.32}
          transparent
          opacity={0.91}
        />
      </mesh>

      {/* Subtle Natural Foam Highlights along Riverbanks */}
      <mesh
        ref={foamRef}
        geometry={foamGeo}
      >
        <meshBasicMaterial
          color={isNight ? '#85b3cb' : '#def3fc'}
          transparent
          opacity={0.32}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Alpine Reservoir Lake with Concentric Ripples */}
      <group position={[-38, -0.16, -22]}>
        <mesh
          ref={lakeRef}
          geometry={lakeGeo}
          receiveShadow
        >
          <meshStandardMaterial
            vertexColors
            roughness={0.09}
            metalness={0.35}
            transparent
            opacity={0.92}
          />
        </mesh>

        {/* Lake shoreline wet sand inner ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
          <ringGeometry args={[11.2, 12.3, 48]} />
          <meshStandardMaterial
            color={isNight ? '#322b22' : '#574a39'}
            roughness={0.75}
            metalness={0.1}
          />
        </mesh>

        {/* Lake shoreline dry pebble outer beach */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[12.1, 13.2, 48]} />
          <meshStandardMaterial
            color={isNight ? '#484033' : '#82745d'}
            roughness={0.94}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* Secondary Mountain Tarn Pond (highland scenic turquoise mirror) */}
      <group position={[-26, 1.46, -34]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[5.2, 32]} />
          <meshStandardMaterial
            color={isNight ? '#0b2633' : '#19788a'}
            roughness={0.06}
            metalness={0.38}
            transparent
            opacity={0.88}
          />
        </mesh>
        {/* Tarn pebble ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
          <ringGeometry args={[4.9, 5.7, 32]} />
          <meshStandardMaterial
            color={isNight ? '#3a342b' : '#736652'}
            roughness={0.94}
          />
        </mesh>
      </group>
    </group>
  );
});
