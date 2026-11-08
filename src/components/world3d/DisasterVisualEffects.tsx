import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';
import { getTerrainHeight } from './Terrain';
import { ActiveDisaster } from '../../types/disaster';

/**
 * Procedural 3D Natural Disaster Visual Effects
 * Renders high-performance, polished environmental phenomena:
 * - Flood: Swollen river water surface inundation & animated foam ripples
 * - Wildfire: Flickering flame tongues, rising soot smoke plumes & ground scorch
 * - Severe Storm: Intermittent lightning flash light strikes & gale wind lines
 * - Earthquake: Expanding tectonic shockwave rings & ground dust puffs
 * - Drought: Arid heat haze & low-water riverbed exposure
 */
export default function DisasterVisualEffects() {
  const { disasterState } = useGameState();
  const activeDisaster = disasterState?.activeDisaster;

  const flameGroupRef = useRef<THREE.Group>(null);
  const smokeGroupRef = useRef<THREE.Group>(null);
  const lightningLightRef = useRef<THREE.PointLight>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const floodWaterRef = useRef<THREE.Mesh>(null);

  const isFlood = activeDisaster?.type === 'flood';
  const isFire = activeDisaster?.type === 'wildfire';
  const isStorm = activeDisaster?.type === 'storm';
  const isEarthquake = activeDisaster?.type === 'earthquake';
  const isDrought = activeDisaster?.type === 'drought';

  const epicenter = activeDisaster?.epicenter || [0, 0];
  const radius = activeDisaster?.radius || 20;

  // Ground elevation at disaster epicenter
  const groundY = useMemo(
    () => getTerrainHeight(epicenter[0], epicenter[1]),
    [epicenter[0], epicenter[1]]
  );

  useFrame(({ clock }) => {
    if (!activeDisaster) return;
    const t = clock.getElapsedTime();

    // 1. Wildfire Flame & Smoke Animation
    if (isFire) {
      if (flameGroupRef.current) {
        const flames = flameGroupRef.current.children;
        for (let i = 0; i < flames.length; i++) {
          const flame = flames[i];
          const flicker = Math.sin(t * 14.0 + i * 2.1) * 0.2 + 0.9;
          flame.scale.set(flicker, flicker * 1.3, flicker);
          flame.rotation.y = Math.sin(t * 5.0 + i) * 0.4;
        }
      }
      if (smokeGroupRef.current) {
        const puffs = smokeGroupRef.current.children;
        for (let i = 0; i < puffs.length; i++) {
          const puff = puffs[i];
          const cycle = (t * 0.65 + i * 0.2) % 1.0;
          puff.position.y = 0.5 + cycle * 4.5;
          const s = 0.4 + cycle * 1.4;
          puff.scale.set(s, s, s);
          puff.position.x = Math.sin(t * 0.8 + i) * 0.8 + cycle * 1.2;
          ((puff as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1.0 - cycle) * 0.45;
        }
      }
    }

    // 2. Storm Lightning Flash
    if (isStorm && lightningLightRef.current) {
      // Periodic intense lightning strobe every 7.5s with micro-flashes
      const stormCycle = t % 7.5;
      const isFlash = stormCycle < 0.18 && (Math.sin(t * 45.0) > 0.2);
      lightningLightRef.current.intensity = isFlash ? 6.5 : 0.0;
    }

    // 3. Earthquake Tectonic Shockwave Ring Expansion
    if (isEarthquake && shockwaveRef.current) {
      const waveCycle = (t * 1.2) % 1.0;
      const scale = 0.5 + waveCycle * (radius * 0.65);
      shockwaveRef.current.scale.set(scale, scale, 1);
      (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity = (1.0 - waveCycle) * 0.65;
    }

    // 4. Flood Water Swell Pulsation
    if (isFlood && floodWaterRef.current) {
      const surge = Math.sin(t * 2.2) * 0.04;
      floodWaterRef.current.position.y = 0.35 + surge;
    }
  });

  if (!activeDisaster) return null;

  return (
    <group raycast={() => null}>
      {/* ================= 1. FLOOD WATER INUNDATION OVERLAY ================= */}
      {isFlood && (
        <group position={[0, 0, 0]}>
          <mesh
            ref={floodWaterRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.35, -2.5]}
            receiveShadow
          >
            <planeGeometry args={[100, 36, 32, 16]} />
            <meshStandardMaterial
              color="#1a6d7c"
              roughness={0.15}
              metalness={0.6}
              transparent
              opacity={0.82}
            />
          </mesh>
          {/* Flood Water Silt Shore Decal */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.36, -2.5]}>
            <ringGeometry args={[14, 28, 48]} />
            <meshBasicMaterial color="#30717c" transparent opacity={0.35} />
          </mesh>
        </group>
      )}

      {/* ================= 2. WILDFIRE CONFLAGRATION ================= */}
      {isFire && (
        <group position={[epicenter[0], groundY, epicenter[1]]}>
          {/* Scorched Earth Decal Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <ringGeometry args={[0.5, radius * 0.75, 32]} />
            <meshBasicMaterial color="#1a1512" transparent opacity={0.75} />
          </mesh>

          {/* Multi-Point Flickering Fire Cones */}
          <group ref={flameGroupRef}>
            {[
              [0, 0, 0],
              [-3.5, 0, 2.0],
              [3.8, 0, -2.2],
              [-2.2, 0, -3.4],
              [2.5, 0, 3.1],
              [5.0, 0, 1.0],
            ].map((pos, idx) => (
              <group key={idx} position={[pos[0], pos[1], pos[2]]}>
                {/* Inner Bright Yellow Flame Core */}
                <mesh position={[0, 0.75, 0]}>
                  <coneGeometry args={[0.45, 1.5, 7]} />
                  <meshStandardMaterial
                    color="#f1c40f"
                    emissive="#ff9f43"
                    emissiveIntensity={3.2}
                  />
                </mesh>
                {/* Outer Orange Flame Shell */}
                <mesh position={[0, 0.85, 0]}>
                  <coneGeometry args={[0.7, 1.7, 7]} />
                  <meshStandardMaterial
                    color="#e67e22"
                    emissive="#d35400"
                    emissiveIntensity={2.5}
                    transparent
                    opacity={0.85}
                  />
                </mesh>
              </group>
            ))}
          </group>

          {/* Thermal Conflagration Dynamic Point Light */}
          <pointLight position={[0, 2.5, 0]} color="#ff7700" intensity={3.5} distance={radius * 1.4} />

          {/* Rising Soot & Ash Smoke Column */}
          <group ref={smokeGroupRef} position={[0, 0.8, 0]}>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <mesh key={idx} position={[0, idx * 0.8, 0]}>
                <sphereGeometry args={[0.5, 7, 7]} />
                <meshBasicMaterial color="#2d2a26" transparent opacity={0.4} depthWrite={false} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* ================= 3. SEVERE STORM LIGHTNING STRIKE ================= */}
      {isStorm && (
        <group position={[epicenter[0], 25, epicenter[1]]}>
          {/* Sky-Burst Lightning Illuminator */}
          <pointLight
            ref={lightningLightRef}
            position={[0, 0, 0]}
            color="#dff9fb"
            intensity={0}
            distance={160}
          />
          {/* Vertical Lightning Channel Filament */}
          <mesh position={[0, -12.5, 0]}>
            <cylinderGeometry args={[0.08, 0.18, 25, 6]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#c7ecee"
              emissiveIntensity={3.5}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      )}

      {/* ================= 4. EARTHQUAKE TECTONIC SHOCKWAVE ================= */}
      {isEarthquake && (
        <group position={[epicenter[0], groundY + 0.05, epicenter[1]]}>
          {/* Expanding Ground Shockwave Decal */}
          <mesh ref={shockwaveRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.9, 1.25, 36]} />
            <meshBasicMaterial color="#e74c3c" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>

          {/* Secondary Subterranean Fault Fracture Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, radius * 0.5, 36]} />
            <meshBasicMaterial color="#4d2b2b" transparent opacity={0.45} />
          </mesh>
        </group>
      )}

      {/* ================= 5. DROUGHT HEAT HAZE ================= */}
      {isDrought && (
        <group position={[epicenter[0], groundY + 0.2, epicenter[1]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2, radius * 0.85, 36]} />
            <meshBasicMaterial color="#c29d5b" transparent opacity={0.25} />
          </mesh>
        </group>
      )}
    </group>
  );
}

