import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { COUNCIL_SEATS } from './CouncilSeats';
import { COUNCIL_MODELS } from './CouncilModelRegistry';

interface CouncilTableProps {
  modelMapping?: Record<string, string>;
}

export const CouncilTable: React.FC<CouncilTableProps> = ({ modelMapping }) => {
  const materials = useMemo(() => {
    return {
      darkOak: new THREE.MeshStandardMaterial({
        color: '#261B12',
        roughness: 0.5,
        metalness: 0.1,
      }),
      darkOakRim: new THREE.MeshStandardMaterial({
        color: '#1C130D',
        roughness: 0.45,
        metalness: 0.15,
      }),
      brassTrim: new THREE.MeshStandardMaterial({
        color: '#C5A66A',
        roughness: 0.35,
        metalness: 0.8,
      }),
      parchmentMap: new THREE.MeshStandardMaterial({
        color: '#D8C6A5',
        roughness: 0.9,
        metalness: 0.0,
      }),
      mapDetail: new THREE.MeshStandardMaterial({
        color: '#4B3F2F',
        roughness: 0.8,
      }),
      leatherSeat: new THREE.MeshStandardMaterial({
        color: '#1B241C',
        roughness: 0.65,
        metalness: 0.1,
      }),
      scrollPaper: new THREE.MeshStandardMaterial({
        color: '#E8DCBF',
        roughness: 0.85,
      }),
      redWax: new THREE.MeshStandardMaterial({
        color: '#8A1C14',
        roughness: 0.3,
        metalness: 0.2,
      }),
      coinsGold: new THREE.MeshStandardMaterial({
        color: '#D4AF37',
        roughness: 0.25,
        metalness: 0.9,
      }),
      leatherLedger: new THREE.MeshStandardMaterial({
        color: '#4A2A18',
        roughness: 0.7,
      }),
      copperCompass: new THREE.MeshStandardMaterial({
        color: '#B87333',
        roughness: 0.3,
        metalness: 0.85,
      }),
      elixirGlass: new THREE.MeshPhysicalMaterial({
        color: '#5E936C',
        transmission: 0.8,
        opacity: 0.9,
        transparent: true,
        roughness: 0.15,
      }),
      botanicalGreen: new THREE.MeshStandardMaterial({
        color: '#3B5838',
        roughness: 0.9,
      }),
      candleWax: new THREE.MeshStandardMaterial({
        color: '#EAE1CE',
        roughness: 0.4,
      }),
      candleFlame: new THREE.MeshBasicMaterial({
        color: '#FFAE33',
      }),
    };
  }, []);

  // Clean up WebGL material resources on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach((mat) => mat.dispose());
    };
  }, [materials]);

  return (
    <group name="CouncilTableAndChairs">
      {/* 1. Central Council Table */}
      <group position={[0, 0, 0]}>
        {/* Tabletop Surface */}
        <mesh position={[0, 0.88, 0]} castShadow receiveShadow material={materials.darkOak}>
          <boxGeometry args={[1.7, 0.08, 5.2]} />
        </mesh>
        {/* Table Beveled Rim */}
        <mesh position={[0, 0.88, 0]} material={materials.darkOakRim}>
          <boxGeometry args={[1.74, 0.09, 5.24]} />
        </mesh>
        {/* Decorative Brass Edge Filigree Line */}
        <mesh position={[0, 0.925, 0]} material={materials.brassTrim}>
          <boxGeometry args={[1.62, 0.005, 5.12]} />
        </mesh>
        {/* Table Inner Inlay */}
        <mesh position={[0, 0.926, 0]} material={materials.darkOak}>
          <boxGeometry args={[1.56, 0.005, 5.06]} />
        </mesh>

        {/* Trestle Pedestals & Crossbar */}
        {[-1.8, 0, 1.8].map((zPos, idx) => (
          <group key={`trestle-${idx}`} position={[0, 0.42, zPos]}>
            {/* Top support bar */}
            <mesh position={[0, 0.4, 0]} castShadow material={materials.darkOak}>
              <boxGeometry args={[1.4, 0.08, 0.16]} />
            </mesh>
            {/* Carved double legs */}
            <mesh position={[-0.45, 0, 0]} castShadow material={materials.darkOak}>
              <boxGeometry args={[0.14, 0.8, 0.14]} />
            </mesh>
            <mesh position={[0.45, 0, 0]} castShadow material={materials.darkOak}>
              <boxGeometry args={[0.14, 0.8, 0.14]} />
            </mesh>
            {/* Base runner */}
            <mesh position={[0, -0.38, 0]} castShadow material={materials.darkOak}>
              <boxGeometry args={[1.5, 0.08, 0.22]} />
            </mesh>
          </group>
        ))}

        {/* Longitudinal Stretcher Beam */}
        <mesh position={[0, 0.15, 0]} castShadow material={materials.darkOak}>
          <boxGeometry args={[0.12, 0.1, 4.0]} />
        </mesh>

        {/* 2. Table Centerpiece: Strategic Realm Map */}
        <group position={[0, 0.93, 0]}>
          {/* Main unrolled parchment map */}
          <mesh castShadow receiveShadow material={materials.parchmentMap}>
            <boxGeometry args={[0.9, 0.008, 1.8]} />
          </mesh>
          {/* Map Topographical Markings */}
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.mapDetail}>
            <planeGeometry args={[0.8, 1.6]} />
          </mesh>
          {/* Brass Map Weights at corners */}
          {[
            [-0.4, 0.015, -0.85],
            [0.4, 0.015, -0.85],
            [-0.4, 0.015, 0.85],
            [0.4, 0.015, 0.85],
          ].map(([wx, wy, wz], wIdx) => (
            <mesh key={`weight-${wIdx}`} position={[wx, wy, wz]} material={materials.brassTrim}>
              <cylinderGeometry args={[0.035, 0.045, 0.03, 12]} />
            </mesh>
          ))}

          {/* Central Brass Astrolabe / Armillary Sphere */}
          <group position={[0, 0.02, 0]}>
            <mesh material={materials.brassTrim}>
              <cylinderGeometry args={[0.12, 0.14, 0.04, 16]} />
            </mesh>
            <mesh position={[0, 0.14, 0]} material={materials.brassTrim}>
              <torusGeometry args={[0.12, 0.012, 8, 24]} />
            </mesh>
            <mesh position={[0, 0.14, 0]} rotation={[0, Math.PI / 3, 0]} material={materials.brassTrim}>
              <torusGeometry args={[0.12, 0.012, 8, 24]} />
            </mesh>
            <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.brassTrim}>
              <torusGeometry args={[0.12, 0.012, 8, 24]} />
            </mesh>
            <mesh position={[0, 0.14, 0]} material={materials.brassTrim}>
              <sphereGeometry args={[0.03, 12, 12]} />
            </mesh>
          </group>
        </group>

        {/* 3. Personalized Desktop Artifacts */}
        {/* Chancellor (X = -0.85, Z = -1.5): Imperial Seal & Proclamation */}
        <group position={[-0.55, 0.93, -1.5]}>
          <mesh material={materials.scrollPaper}>
            <boxGeometry args={[0.3, 0.01, 0.45]} />
          </mesh>
          <mesh position={[0, 0.012, 0.12]} material={materials.redWax}>
            <cylinderGeometry args={[0.04, 0.04, 0.015, 16]} />
          </mesh>
          <mesh position={[0.18, 0.04, -0.1]} material={materials.brassTrim}>
            <cylinderGeometry args={[0.03, 0.04, 0.08, 12]} />
          </mesh>
        </group>

        {/* Scholar (X = -0.55, Z = 0): Books & Rolled Scrolls */}
        <group position={[-0.55, 0.93, 0]}>
          <mesh position={[0, 0.02, 0]} material={materials.leatherLedger}>
            <boxGeometry args={[0.26, 0.04, 0.35]} />
          </mesh>
          <mesh position={[-0.02, 0.05, 0.02]} rotation={[0, 0.1, 0]} material={materials.leatherSeat}>
            <boxGeometry args={[0.24, 0.03, 0.32]} />
          </mesh>
          <mesh position={[0.18, 0.025, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.scrollPaper}>
            <cylinderGeometry args={[0.025, 0.025, 0.35, 12]} />
          </mesh>
        </group>

        {/* Physician (X = -0.55, Z = 1.5): Elixir Vial & Mortar */}
        <group position={[-0.55, 0.93, 1.5]}>
          <mesh position={[-0.08, 0.04, 0]} material={materials.darkOak}>
            <cylinderGeometry args={[0.06, 0.04, 0.07, 12]} />
          </mesh>
          <mesh position={[0.08, 0.06, 0]} material={materials.elixirGlass}>
            <cylinderGeometry args={[0.035, 0.04, 0.12, 12]} />
          </mesh>
          <mesh position={[0.08, 0.13, 0]} material={materials.scrollPaper}>
            <cylinderGeometry args={[0.015, 0.015, 0.025, 8]} />
          </mesh>
        </group>

        {/* Treasurer (X = 0.55, Z = -1.5): Ledger & Stacks of Gold Coins */}
        <group position={[0.55, 0.93, -1.5]}>
          <mesh material={materials.leatherLedger}>
            <boxGeometry args={[0.34, 0.025, 0.42]} />
          </mesh>
          {/* Gold coin stacks */}
          <group position={[-0.18, 0.03, 0.08]}>
            <mesh material={materials.coinsGold}>
              <cylinderGeometry args={[0.03, 0.03, 0.05, 12]} />
            </mesh>
            <mesh position={[0.07, 0, 0]} material={materials.coinsGold}>
              <cylinderGeometry args={[0.03, 0.03, 0.035, 12]} />
            </mesh>
          </group>
        </group>

        {/* Architect (X = 0.55, Z = 0): Drafting Blueprint & Caliper Compass */}
        <group position={[0.55, 0.93, 0]}>
          <mesh material={materials.scrollPaper}>
            <boxGeometry args={[0.38, 0.008, 0.5]} />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[0, 0.4, 0]} material={materials.copperCompass}>
            <boxGeometry args={[0.02, 0.006, 0.22]} />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[0, -0.4, 0]} material={materials.copperCompass}>
            <boxGeometry args={[0.02, 0.006, 0.22]} />
          </mesh>
        </group>

        {/* Keeper (X = 0.55, Z = 1.5): Botanical Bowl & Herb Sprig */}
        <group position={[0.55, 0.93, 1.5]}>
          <mesh material={materials.darkOakRim}>
            <cylinderGeometry args={[0.08, 0.05, 0.04, 12]} />
          </mesh>
          <mesh position={[0, 0.04, 0]} material={materials.botanicalGreen}>
            <sphereGeometry args={[0.065, 8, 8]} />
          </mesh>
        </group>
      </group>

      {/* 4. Six Carved Advisor Chairs */}
      {COUNCIL_SEATS.map((seat) => {
        const modelKey = modelMapping?.[seat.id];
        const modelDef = modelKey ? COUNCIL_MODELS[modelKey] : undefined;
        if (modelDef?.hasOwnChair) {
          // Model includes its own integrated furniture / chair (e.g. Carl Manfred)
          return null;
        }

        return (
          <group key={`chair-${seat.id}`} position={seat.position} rotation={seat.rotation}>
          {/* Chair Seat Base */}
          <mesh position={[0, 0.46, 0]} castShadow material={materials.darkOak}>
            <boxGeometry args={[0.62, 0.06, 0.62]} />
          </mesh>
          {/* Velvet Seat Cushion */}
          <mesh position={[0, 0.51, 0]} material={materials.leatherSeat}>
            <boxGeometry args={[0.56, 0.06, 0.56]} />
          </mesh>
          {/* Chair 4 Legs */}
          {[
            [-0.26, 0.23, -0.26],
            [0.26, 0.23, -0.26],
            [-0.26, 0.23, 0.26],
            [0.26, 0.23, 0.26],
          ].map(([lx, ly, lz], lIdx) => (
            <mesh key={`leg-${lIdx}`} position={[lx, ly, lz]} castShadow material={materials.darkOak}>
              <cylinderGeometry args={[0.025, 0.035, 0.46, 8]} />
            </mesh>
          ))}
          {/* High Carved Backrest (placed at back of chair: -Z in local chair coords) */}
          <mesh position={[0, 1.05, -0.28]} castShadow material={materials.darkOak}>
            <boxGeometry args={[0.58, 1.1, 0.06]} />
          </mesh>
          {/* Velvet Backrest Inset */}
          <mesh position={[0, 1.05, -0.245]} material={materials.leatherSeat}>
            <boxGeometry args={[0.48, 0.95, 0.02]} />
          </mesh>
          {/* Ornate Gold Crown finial on chair peak */}
          <mesh position={[0, 1.63, -0.28]} material={materials.brassTrim}>
            <boxGeometry args={[0.2, 0.08, 0.07]} />
          </mesh>
          {/* Left and Right Armrests */}
          <mesh position={[-0.31, 0.72, 0.02]} castShadow material={materials.darkOak}>
            <boxGeometry args={[0.06, 0.04, 0.5]} />
          </mesh>
          <mesh position={[0.31, 0.72, 0.02]} castShadow material={materials.darkOak}>
            <boxGeometry args={[0.06, 0.04, 0.5]} />
          </mesh>
          {/* Armrest supports */}
          <mesh position={[-0.31, 0.58, 0.22]} material={materials.darkOak}>
            <cylinderGeometry args={[0.02, 0.02, 0.22, 6]} />
          </mesh>
          <mesh position={[0.31, 0.58, 0.22]} material={materials.darkOak}>
            <cylinderGeometry args={[0.02, 0.02, 0.22, 6]} />
          </mesh>
        </group>
        );
      })}
    </group>
  );
};
