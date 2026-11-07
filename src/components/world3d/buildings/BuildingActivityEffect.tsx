import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlacedBuilding } from '../../../types/game';
import { useDayNight } from '../DayNightController';
import { useGameState } from '../../../context/GameStateContext';

interface BuildingActivityEffectProps {
  building: PlacedBuilding;
}

/**
 * Procedural Building Activity Component
 * Renders purposeful architectural visual activity tailored to each building's category:
 * - Industrial: Rising stylized thermal plume from foundry smokestacks & molten furnace core
 * - Healthcare: Dedicated emergency bay markings & pulsing blue/cyan medical beacon
 * - Residential: Warm interior night window illumination & front doorstep lantern
 * - Commercial: Vibrant facade sign luminescence & entrance patio canopy lights
 * - Education: Colonnade portico wash lights & entrance beacons
 * - Government: Monumental staircase flickering torchieres & classical portico floodlights
 * - Agriculture: Geodesic dome photosynthetic violet night grow light
 * - Dynamically responds to city power grid health (brownout flicker) and economic prosperity!
 */
export default function BuildingActivityEffect({ building }: BuildingActivityEffectProps) {
  const { isNight, timeOfDay } = useDayNight();
  const { economyReport } = useGameState();
  const isActive = building.status === 'active' && building.health > 25;

  const isBrownout = economyReport.hasCriticalPowerDeficit;
  const isProsperous = economyReport.isProsperous;

  // Evening/Night illumination transition (starts brightening at 18:00, peaks at night, fades by 6:30)
  const baseNightIntensity = useMemo(() => {
    if (timeOfDay >= 18.0 || timeOfDay < 6.0) return 1.0;
    if (timeOfDay >= 6.0 && timeOfDay < 7.5) return (7.5 - timeOfDay) / 1.5;
    if (timeOfDay >= 16.5 && timeOfDay < 18.0) return (timeOfDay - 16.5) / 1.5;
    return 0.0;
  }, [timeOfDay]);

  // Modulate intensity based on power grid status and prosperity
  const nightIntensity = isBrownout ? baseNightIntensity * 0.4 : isProsperous ? baseNightIntensity * 1.25 : baseNightIntensity;

  // Torch / furnace flicker reference
  const flickerRef = useRef<THREE.PointLight>(null);
  const smokeGroupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!isActive) return;
    const t = clock.getElapsedTime();

    // 1. Torchier & furnace organic flame flicker
    if (flickerRef.current) {
      const brownoutFlicker = isBrownout ? (Math.sin(t * 16.0) > 0 ? 0.3 : 1.0) : 1.0;
      const flicker = (Math.sin(t * 7.3) * 0.15 + Math.cos(t * 13.1) * 0.1 + 0.9) * brownoutFlicker;
      flickerRef.current.intensity = flicker * (isNight ? 1.6 : 0.8);
    }

    // 2. Healthcare emergency beacon pulse
    if (beaconRef.current) {
      const pulse = 0.5 + Math.sin(t * 6.0) * 0.5;
      (beaconRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0 + pulse * 2.5;
    }

    // 3. Industrial smokestack thermal plume drift
    if (smokeGroupRef.current) {
      const children = smokeGroupRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const puff = children[i];
        // Vertical cycle
        const cycle = ((t * 0.7 + i * 0.35) % 1.0);
        puff.position.y = 4.2 + cycle * 2.2;
        const scale = 0.25 + cycle * 0.65;
        puff.scale.set(scale, scale, scale);
        // Horizontal gentle breeze drift
        puff.position.x = 0.8 + Math.sin(t * 0.8 + i) * 0.15 + cycle * 0.4;
        puff.position.z = Math.cos(t * 0.6 + i) * 0.12;
        // Fade out as it climbs
        const opacity = (1.0 - cycle) * 0.42;
        ((puff as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = opacity;
      }
    }
  });

  if (!isActive) return null;

  const cat = building.category;
  const cid = building.catalogId.toLowerCase();

  return (
    <group raycast={() => null}>
      {/* ================= 1. RESIDENTIAL ACTIVITY ================= */}
      {cat === 'residential' && (
        <group>
          {/* Front doorstep entrance lantern */}
          <mesh position={[0, 0.5, 1.85]}>
            <cylinderGeometry args={[0.06, 0.08, 0.14, 8]} />
            <meshStandardMaterial
              color="#ffeedd"
              emissive="#ffaa44"
              emissiveIntensity={nightIntensity > 0.1 ? 2.5 : 0.4}
            />
          </mesh>
          {nightIntensity > 0.15 && (
            <pointLight
              position={[0, 0.7, 1.95]}
              color="#ffc870"
              intensity={0.6 * nightIntensity}
              distance={4.5}
            />
          )}

          {/* Warm night interior window luminescence panels */}
          {nightIntensity > 0.05 && (
            <group>
              <mesh position={[0.7, 1.6, 1.25]}>
                <boxGeometry args={[0.35, 0.45, 0.02]} />
                <meshBasicMaterial color="#ffdc88" transparent opacity={0.75 * nightIntensity} />
              </mesh>
              <mesh position={[-0.7, 1.6, 1.25]}>
                <boxGeometry args={[0.35, 0.45, 0.02]} />
                <meshBasicMaterial color="#ffe6a8" transparent opacity={0.65 * nightIntensity} />
              </mesh>
              <mesh position={[0.7, 2.5, 1.25]}>
                <boxGeometry args={[0.35, 0.45, 0.02]} />
                <meshBasicMaterial color="#ffc466" transparent opacity={0.8 * nightIntensity} />
              </mesh>
              <mesh position={[-0.7, 2.5, 1.25]}>
                <boxGeometry args={[0.35, 0.45, 0.02]} />
                <meshBasicMaterial color="#ffd877" transparent opacity={0.7 * nightIntensity} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ================= 2. COMMERCIAL ACTIVITY ================= */}
      {cat === 'commercial' && (
        <group>
          {/* Illuminated Storefront Canopy Sign */}
          <mesh position={[0, 1.2, 1.55]}>
            <boxGeometry args={[1.8, 0.22, 0.06]} />
            <meshStandardMaterial
              color="#222"
              emissive="#00e5ff"
              emissiveIntensity={nightIntensity > 0.2 ? 2.2 : 0.8}
            />
          </mesh>
          {/* Warm Entrance Threshold Lighting */}
          <mesh position={[0, 0.04, 1.65]}>
            <planeGeometry args={[1.6, 0.6]} />
            <meshBasicMaterial
              color="#ffeedd"
              transparent
              opacity={nightIntensity > 0.1 ? 0.35 : 0.15}
            />
          </mesh>
          {nightIntensity > 0.2 && (
            <pointLight
              position={[0, 1.4, 1.65]}
              color="#88f0ff"
              intensity={0.8 * nightIntensity}
              distance={5.0}
            />
          )}
        </group>
      )}

      {/* ================= 3. HEALTHCARE ACTIVITY ================= */}
      {(cat === 'healthcare' || cid.includes('clinic') || cid.includes('hospital')) && (
        <group>
          {/* Ground Paved Ambulance Bay Marking */}
          <group position={[1.4, 0.05, 1.95]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.65, 0.78, 16]} />
              <meshBasicMaterial color="#e74c3c" transparent opacity={0.85} />
            </mesh>
            {/* Red Cross Symbol on Bay Deck */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.55, 0.16]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.16, 0.55]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Pulsing Emergency Medical Beacon over Entrance */}
          <mesh ref={beaconRef} position={[1.4, 1.65, 1.55]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color="#00ffff" emissive="#00e5ff" emissiveIntensity={2.0} />
          </mesh>
          <pointLight position={[1.4, 1.8, 1.7]} color="#00e5ff" intensity={0.9} distance={6.0} />
        </group>
      )}

      {/* ================= 4. INDUSTRIAL ACTIVITY ================= */}
      {cat === 'industrial' && (
        <group>
          {/* Molten Smelter Interior Hearth Glow */}
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshBasicMaterial color="#ff5500" transparent opacity={0.4} />
          </mesh>
          <pointLight
            ref={flickerRef}
            position={[0, 1.1, 0]}
            color="#ff6611"
            intensity={1.2}
            distance={8.0}
          />

          {/* Operational Smokestack Thermal Steam Emission (Stylized Rising Puffs) */}
          <group ref={smokeGroupRef}>
            {[0, 1, 2, 3].map((idx) => (
              <mesh key={idx} position={[0.8, 4.2 + idx * 0.5, 0]}>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshBasicMaterial color="#dfe6e9" transparent opacity={0.3} depthWrite={false} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* ================= 5. EDUCATION ACTIVITY ================= */}
      {cat === 'education' && (
        <group>
          {/* Campus Colonnade Pedestrian Canopy Lights */}
          <mesh position={[-1.2, 1.4, 1.4]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#fff" emissive="#74b9ff" emissiveIntensity={nightIntensity > 0.1 ? 2.5 : 0.8} />
          </mesh>
          <mesh position={[1.2, 1.4, 1.4]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#fff" emissive="#74b9ff" emissiveIntensity={nightIntensity > 0.1 ? 2.5 : 0.8} />
          </mesh>
          {nightIntensity > 0.2 && (
            <pointLight position={[0, 1.8, 1.5]} color="#90caf9" intensity={0.7 * nightIntensity} distance={6.5} />
          )}
        </group>
      )}

      {/* ================= 6. GOVERNMENT / CITADEL ACTIVITY ================= */}
      {(cat === 'government' || cid.includes('citadel')) && (
        <group>
          {/* Twin Grand Staircase Torchieres with Active Flickering Fire */}
          <group position={[-1.6, 0.85, 2.2]}>
            <mesh position={[0, 0.15, 0]}>
              <coneGeometry args={[0.1, 0.22, 8]} />
              <meshStandardMaterial color="#ffa000" emissive="#ff5500" emissiveIntensity={2.5} />
            </mesh>
          </group>
          <group position={[1.6, 0.85, 2.2]}>
            <mesh position={[0, 0.15, 0]}>
              <coneGeometry args={[0.1, 0.22, 8]} />
              <meshStandardMaterial color="#ffa000" emissive="#ff5500" emissiveIntensity={2.5} />
            </mesh>
          </group>
          <pointLight
            position={[0, 1.2, 2.4]}
            color="#ffaa33"
            intensity={nightIntensity > 0.1 ? 1.4 : 0.6}
            distance={7.5}
          />
        </group>
      )}

      {/* ================= 7. AGRICULTURE ACTIVITY ================= */}
      {cat === 'agriculture' && (
        <group>
          {/* Internal Photosynthetic Grow-Light (Soft Violet Glow through Geodesic Glass) */}
          {nightIntensity > 0.1 && (
            <group position={[0, 1.2, 0]}>
              <mesh>
                <sphereGeometry args={[1.2, 12, 12]} />
                <meshBasicMaterial color="#ba68c8" transparent opacity={0.22 * nightIntensity} side={THREE.BackSide} />
              </mesh>
              <pointLight color="#e040fb" intensity={0.85 * nightIntensity} distance={7.0} />
            </group>
          )}
        </group>
      )}
    </group>
  );
}

