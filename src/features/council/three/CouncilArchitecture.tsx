import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';

export const CouncilArchitecture: React.FC = () => {
  // Reusable materials
  const materials = useMemo(() => {
    return {
      floorStone: new THREE.MeshStandardMaterial({
        color: '#262925',
        roughness: 0.72,
        metalness: 0.1,
      }),
      floorBorder: new THREE.MeshStandardMaterial({
        color: '#151915',
        roughness: 0.55,
        metalness: 0.2,
      }),
      floorInlayGold: new THREE.MeshStandardMaterial({
        color: '#C5A66A',
        roughness: 0.35,
        metalness: 0.75,
      }),
      wallStone: new THREE.MeshStandardMaterial({
        color: '#343833',
        roughness: 0.88,
        metalness: 0.05,
      }),
      wallStoneDark: new THREE.MeshStandardMaterial({
        color: '#232622',
        roughness: 0.82,
        metalness: 0.08,
      }),
      pillarStone: new THREE.MeshStandardMaterial({
        color: '#424741',
        roughness: 0.75,
        metalness: 0.12,
      }),
      timberBeam: new THREE.MeshStandardMaterial({
        color: '#241B14',
        roughness: 0.9,
        metalness: 0.05,
      }),
      bannerVelvet: new THREE.MeshStandardMaterial({
        color: '#172B1E',
        roughness: 0.85,
        metalness: 0.15,
      }),
      bannerGoldTrim: new THREE.MeshStandardMaterial({
        color: '#C5A66A',
        roughness: 0.4,
        metalness: 0.7,
      }),
      wroughtIron: new THREE.MeshStandardMaterial({
        color: '#1A1C1A',
        roughness: 0.6,
        metalness: 0.85,
      }),
      candleWax: new THREE.MeshStandardMaterial({
        color: '#EAE1CE',
        roughness: 0.4,
        metalness: 0.0,
      }),
      candleFlame: new THREE.MeshBasicMaterial({
        color: '#FFAE33',
      }),
      windowGlass: new THREE.MeshPhysicalMaterial({
        color: '#D8ECF8',
        transmission: 0.7,
        opacity: 0.85,
        transparent: true,
        roughness: 0.2,
        ior: 1.5,
      }),
    };
  }, []);

  // Shared geometries for repeated architectural elements (pillars & chandeliers)
  const sharedGeoms = useMemo(() => {
    return {
      pillarPlinth: new THREE.BoxGeometry(0.85, 0.6, 0.85),
      pillarShaft: new THREE.CylinderGeometry(0.34, 0.38, 5.4, 16),
      pillarCapital: new THREE.BoxGeometry(0.8, 0.4, 0.8),
      sconceBracket: new THREE.BoxGeometry(0.2, 0.05, 0.12),
      sconceWax: new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8),
      sconceFlame: new THREE.SphereGeometry(0.035, 8, 8),
      chandelierCup: new THREE.CylinderGeometry(0.05, 0.03, 0.04, 8),
      chandelierWax: new THREE.CylinderGeometry(0.03, 0.03, 0.16, 8),
      chandelierFlame: new THREE.SphereGeometry(0.03, 8, 8),
    };
  }, []);

  // Clean up WebGL resources when unmounting
  useEffect(() => {
    return () => {
      Object.values(materials).forEach((mat) => mat.dispose());
      Object.values(sharedGeoms).forEach((geom) => geom.dispose());
    };
  }, [materials, sharedGeoms]);

  const pillarPositions: [number, number, number][] = [
    [-4.4, 0, -3.8],
    [-4.4, 0, 0],
    [-4.4, 0, 3.8],
    [4.4, 0, -3.8],
    [4.4, 0, 0],
    [4.4, 0, 3.8],
  ];

  return (
    <group name="CouncilArchitecture">
      {/* 1. Main Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        material={materials.floorStone}
      >
        <planeGeometry args={[11, 14]} />
      </mesh>

      {/* Outer Border of polished obsidian/marble */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.002, 0]}
        receiveShadow
        material={materials.floorBorder}
      >
        <ringGeometry args={[5.2, 5.8, 4]} />
      </mesh>

      {/* Central Chamber Runic Dais Inlay (under the table) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.004, 0]}
        receiveShadow
        material={materials.floorInlayGold}
      >
        <ringGeometry args={[2.8, 2.9, 64]} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.004, 0]}
        receiveShadow
        material={materials.floorInlayGold}
      >
        <ringGeometry args={[3.2, 3.25, 64]} />
      </mesh>

      {/* 2. Walls */}
      {/* North Wall (Behind the Throne) */}
      <mesh position={[0, 3.5, -6.5]} receiveShadow material={materials.wallStone}>
        <boxGeometry args={[11, 7, 0.5]} />
      </mesh>
      {/* North Decorative Arch Trim behind dais */}
      <mesh position={[0, 3.2, -6.2]} material={materials.wallStoneDark}>
        <boxGeometry args={[4.2, 5.8, 0.2]} />
      </mesh>

      {/* CIVORA Imperial Wall Relief Crest above Dais */}
      <group position={[0, 5.2, -6.05]}>
        {/* Outer Laurel Medallion */}
        <mesh material={materials.floorInlayGold} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.08, 32]} />
        </mesh>
        <mesh position={[0, 0, 0.05]} material={materials.wallStoneDark} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 0.06, 32]} />
        </mesh>
        {/* Crown Silhouette in Gold */}
        <mesh position={[0, 0.05, 0.1]} material={materials.floorInlayGold}>
          <boxGeometry args={[0.5, 0.35, 0.06]} />
        </mesh>
      </group>

      {/* South Wall (Chamber Entrance) */}
      <mesh position={[0, 3.5, 6.5]} receiveShadow material={materials.wallStone}>
        <boxGeometry args={[11, 7, 0.5]} />
      </mesh>
      {/* Grand Entrance Arch Portal */}
      <mesh position={[0, 2.4, 6.2]} material={materials.timberBeam}>
        <boxGeometry args={[3.0, 4.4, 0.25]} />
      </mesh>
      <mesh position={[0, 2.2, 6.25]} material={materials.wroughtIron}>
        <boxGeometry args={[2.6, 4.0, 0.1]} />
      </mesh>

      {/* West Wall (With Gothic Stained Glass Windows) */}
      <mesh position={[-5.5, 3.5, 0]} receiveShadow material={materials.wallStone}>
        <boxGeometry args={[0.5, 7, 13.5]} />
      </mesh>

      {/* East Wall (With Gothic Stained Glass Windows) */}
      <mesh position={[5.5, 3.5, 0]} receiveShadow material={materials.wallStone}>
        <boxGeometry args={[0.5, 7, 13.5]} />
      </mesh>

      {/* Gothic Arched Windows - West Side */}
      {[-2.0, 2.0].map((zPos, idx) => (
        <group key={`win-west-${idx}`} position={[-5.25, 3.8, zPos]}>
          {/* Stone frame */}
          <mesh material={materials.wallStoneDark}>
            <boxGeometry args={[0.2, 4.4, 1.8]} />
          </mesh>
          {/* Glass pane with soft glow */}
          <mesh position={[0.05, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={materials.windowGlass}>
            <planeGeometry args={[1.5, 3.8]} />
          </mesh>
          {/* Window iron tracery mullions */}
          <mesh position={[0.06, 0, 0]} material={materials.wroughtIron}>
            <boxGeometry args={[0.04, 3.8, 0.06]} />
          </mesh>
          <mesh position={[0.06, 0.6, 0]} material={materials.wroughtIron}>
            <boxGeometry args={[0.04, 0.06, 1.5]} />
          </mesh>
          <mesh position={[0.06, -0.6, 0]} material={materials.wroughtIron}>
            <boxGeometry args={[0.04, 0.06, 1.5]} />
          </mesh>
        </group>
      ))}

      {/* Gothic Arched Windows - East Side */}
      {[-2.0, 2.0].map((zPos, idx) => (
        <group key={`win-east-${idx}`} position={[5.25, 3.8, zPos]}>
          <mesh material={materials.wallStoneDark}>
            <boxGeometry args={[0.2, 4.4, 1.8]} />
          </mesh>
          <mesh position={[-0.05, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={materials.windowGlass}>
            <planeGeometry args={[1.5, 3.8]} />
          </mesh>
          <mesh position={[-0.06, 0, 0]} material={materials.wroughtIron}>
            <boxGeometry args={[0.04, 3.8, 0.06]} />
          </mesh>
          <mesh position={[-0.06, 0.6, 0]} material={materials.wroughtIron}>
            <boxGeometry args={[0.04, 0.06, 1.5]} />
          </mesh>
          <mesh position={[-0.06, -0.6, 0]} material={materials.wroughtIron}>
            <boxGeometry args={[0.04, 0.06, 1.5]} />
          </mesh>
        </group>
      ))}

      {/* 3. Ceiling & Timber Cross-Beams */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 6.8, 0]}
        material={materials.wallStoneDark}
      >
        <planeGeometry args={[11, 14]} />
      </mesh>

      {/* Longitudinal Ridge Beam */}
      <mesh position={[0, 6.6, 0]} material={materials.timberBeam}>
        <boxGeometry args={[0.4, 0.5, 13.5]} />
      </mesh>

      {/* Transverse Cross Beams */}
      {[-3.8, -1.9, 0, 1.9, 3.8].map((zPos, idx) => (
        <mesh key={`beam-${idx}`} position={[0, 6.4, zPos]} material={materials.timberBeam}>
          <boxGeometry args={[10.5, 0.35, 0.35]} />
        </mesh>
      ))}

      {/* 4. Six Monumental Architectural Pillars */}
      {pillarPositions.map((pos, idx) => (
        <group key={`pillar-${idx}`} position={pos}>
          {/* Base Plinth */}
          <mesh
            position={[0, 0.3, 0]}
            castShadow
            receiveShadow
            material={materials.pillarStone}
            geometry={sharedGeoms.pillarPlinth}
          />
          {/* Fluted Column Shaft */}
          <mesh
            position={[0, 3.3, 0]}
            castShadow
            receiveShadow
            material={materials.pillarStone}
            geometry={sharedGeoms.pillarShaft}
          />
          {/* Carved Capital */}
          <mesh
            position={[0, 6.1, 0]}
            castShadow
            material={materials.pillarStone}
            geometry={sharedGeoms.pillarCapital}
          />
          {/* Wall Candle Sconce on Pillars */}
          <group position={[pos[0] < 0 ? 0.38 : -0.38, 2.5, 0]}>
            <mesh material={materials.wroughtIron} geometry={sharedGeoms.sconceBracket} />
            <mesh position={[0, 0.12, 0]} material={materials.candleWax} geometry={sharedGeoms.sconceWax} />
            <mesh position={[0, 0.25, 0]} material={materials.candleFlame} geometry={sharedGeoms.sconceFlame} />
          </group>
        </group>
      ))}

      {/* 5. Royal Banners */}
      {/* North Wall Banners (Flanking the throne) */}
      {[-2.8, 2.8].map((xPos, idx) => (
        <group key={`banner-north-${idx}`} position={[xPos, 3.6, -6.15]}>
          {/* Brass Rod */}
          <mesh material={materials.bannerGoldTrim} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 1.4, 8]} />
          </mesh>
          {/* Hanging Velvet Banner Fabric */}
          <mesh position={[0, -1.5, 0]} material={materials.bannerVelvet}>
            <boxGeometry args={[1.1, 3.0, 0.02]} />
          </mesh>
          {/* Gold Trim Border */}
          <mesh position={[0, -1.5, 0.015]} material={materials.bannerGoldTrim}>
            <planeGeometry args={[0.95, 2.8]} />
          </mesh>
          {/* Golden Tassel Fringe at Bottom */}
          <mesh position={[0, -3.05, 0]} material={materials.bannerGoldTrim}>
            <boxGeometry args={[1.1, 0.1, 0.04]} />
          </mesh>
        </group>
      ))}

      {/* East & West Wall Banners */}
      {[-3.8, 3.8].map((zPos, idx) => (
        <group key={`banner-west-${idx}`} position={[-5.15, 3.6, zPos]}>
          <mesh material={materials.bannerVelvet}>
            <boxGeometry args={[0.02, 2.8, 0.9]} />
          </mesh>
          <mesh position={[0.015, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={materials.bannerGoldTrim}>
            <planeGeometry args={[0.8, 2.6]} />
          </mesh>
        </group>
      ))}
      {[-3.8, 3.8].map((zPos, idx) => (
        <group key={`banner-east-${idx}`} position={[5.15, 3.6, zPos]}>
          <mesh material={materials.bannerVelvet}>
            <boxGeometry args={[0.02, 2.8, 0.9]} />
          </mesh>
          <mesh position={[-0.015, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={materials.bannerGoldTrim}>
            <planeGeometry args={[0.8, 2.6]} />
          </mesh>
        </group>
      ))}

      {/* 6. Grand Wrought-Iron Chandeliers */}
      {[-1.2, 1.2].map((zPos, cIdx) => (
        <group key={`chandelier-${cIdx}`} position={[0, 4.4, zPos]}>
          {/* Hanging Chains */}
          <mesh position={[0, 1.0, 0]} material={materials.wroughtIron}>
            <cylinderGeometry args={[0.02, 0.02, 2.0, 6]} />
          </mesh>
          {/* Main Iron Hoop */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.wroughtIron}>
            <torusGeometry args={[0.9, 0.04, 8, 24]} />
          </mesh>
          {/* Radial Spokes */}
          <mesh material={materials.wroughtIron}>
            <boxGeometry args={[1.8, 0.03, 0.03]} />
          </mesh>
          <mesh material={materials.wroughtIron}>
            <boxGeometry args={[0.03, 0.03, 1.8]} />
          </mesh>
          {/* 8 Candles around the ring */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, sIdx) => {
            const rad = (deg * Math.PI) / 180;
            const cx = Math.cos(rad) * 0.9;
            const cz = Math.sin(rad) * 0.9;
            return (
              <group key={`cand-${sIdx}`} position={[cx, 0.05, cz]}>
                {/* Candle holder cup */}
                <mesh material={materials.wroughtIron} geometry={sharedGeoms.chandelierCup} />
                {/* Candle stick */}
                <mesh position={[0, 0.1, 0]} material={materials.candleWax} geometry={sharedGeoms.chandelierWax} />
                {/* Flame point */}
                <mesh position={[0, 0.22, 0]} material={materials.candleFlame} geometry={sharedGeoms.chandelierFlame} />
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
};
