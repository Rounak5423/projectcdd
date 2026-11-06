import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, isNearRiver } from './Terrain';
import { useDayNight } from './DayNightController';

interface BridgeProps {
  position: [number, number, number];
  length: number;
  width: number;
  rotationY?: number;
}

function ArchitecturalBridge({ position, length, width, rotationY = 0 }: BridgeProps) {
  const { isNight } = useDayNight();
  const [bx, by, bz] = position;

  return (
    <group position={[bx, by, bz]} rotation={[0, rotationY, 0]}>
      {/* Heavy Support Piers dipping into the riverbed */}
      {[-length * 0.28, length * 0.28].map((offset, idx) => (
        <group key={idx} position={[0, -1.1, offset]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.1, 1.4, 2.4, 8]} />
            <meshStandardMaterial color="#4a4339" roughness={0.8} />
          </mesh>
          {/* Waterbreak wedge */}
          <mesh position={[0, -0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[1.6, 2.0, 1.6]} />
            <meshStandardMaterial color="#3b352d" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Main Bridge Road Deck */}
      <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, 0.5, length]} />
        <meshStandardMaterial color="#363d38" roughness={0.85} />
      </mesh>

      {/* Road asphalt surface */}
      <mesh position={[0, 0.72, 0]} receiveShadow>
        <boxGeometry args={[width - 0.4, 0.05, length]} />
        <meshStandardMaterial color="#2a302c" roughness={0.95} />
      </mesh>

      {/* Center divider marking */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.16, 0.02, length - 0.6]} />
        <meshBasicMaterial color="#e3be66" />
      </mesh>

      {/* Side Curbs & Pedestrian Sidewalks */}
      {[-width * 0.5 + 0.35, width * 0.5 - 0.35].map((sideX, i) => (
        <mesh key={i} position={[sideX, 0.82, 0]} receiveShadow>
          <boxGeometry args={[0.7, 0.18, length]} />
          <meshStandardMaterial color="#666f68" roughness={0.7} />
        </mesh>
      ))}

      {/* Elegant Arch Suspension Trusses */}
      {[-width * 0.5 + 0.1, width * 0.5 - 0.1].map((archX, i) => (
        <group key={i} position={[archX, 1.6, 0]}>
          {/* Steel Arch Spine */}
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.12, length * 0.98, 8]} />
            <meshStandardMaterial color="#a89a7b" metalness={0.6} roughness={0.3} />
          </mesh>

          {/* Vertical Suspension Cables */}
          {[-length * 0.35, -length * 0.18, 0, length * 0.18, length * 0.35].map((cableZ, j) => (
            <mesh key={j} position={[0, -0.6, cableZ]}>
              <cylinderGeometry args={[0.03, 0.03, 1.3, 6]} />
              <meshStandardMaterial color="#d4cbb6" metalness={0.8} />
            </mesh>
          ))}

          {/* Safety Handrail with integrated night LEDs */}
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.08, 0.12, length]} />
            <meshStandardMaterial
              color="#d4cbb6"
              emissive={isNight ? '#e6be75' : '#000000'}
              emissiveIntensity={isNight ? 0.7 : 0}
            />
          </mesh>
        </group>
      ))}

      {/* Bridge Entrance Lantern Posts */}
      {[
        [-width * 0.5 - 0.3, -length * 0.48],
        [width * 0.5 + 0.3, -length * 0.48],
        [-width * 0.5 - 0.3, length * 0.48],
        [width * 0.5 + 0.3, length * 0.48],
      ].map(([px, pz], k) => (
        <group key={k} position={[px, 1.2, pz]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.12, 1.2, 6]} />
            <meshStandardMaterial color="#303831" metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.65, 0]}>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshStandardMaterial
              color={isNight ? '#ffe49e' : '#e8dec2'}
              emissive={isNight ? '#ffbe3b' : '#333333'}
              emissiveIntensity={isNight ? 1.8 : 0.1}
            />
          </mesh>
          {isNight && (
            <pointLight
              color="#ffbe3b"
              intensity={0.65}
              distance={6.5}
              position={[0, 0.8, 0]}
            />
          )}
        </group>
      ))}
    </group>
  );
}

export default function RoadNetwork() {
  const { isNight } = useDayNight();

  // Streetlight poles along roads
  const streetlights = useMemo(() => {
    const list: [number, number, number, number][] = []; // x, y, z, rotY
    // Along Main North-South Avenue (x ≈ 3.2 and x ≈ -3.2)
    for (let z = -46; z <= 46; z += 14) {
      if (Math.abs(z - (-3.0)) < 9) continue; // skip bridge span
      list.push([-3.2, getTerrainHeight(-3.2, z) + 0.1, z, 0]);
      list.push([3.2, getTerrainHeight(3.2, z) + 0.1, z, Math.PI]);
    }

    // Along East-West Avenue (z ≈ 3.2 and z ≈ -3.2)
    for (let x = -46; x <= 46; x += 14) {
      if (Math.abs(x) < 8) continue; // skip central intersection
      if (isNearRiver(x, 0, 4.0)) continue;
      list.push([x, getTerrainHeight(x, -3.2) + 0.1, -3.2, Math.PI * 0.5]);
      list.push([x, getTerrainHeight(x, 3.2) + 0.1, 3.2, -Math.PI * 0.5]);
    }

    return list;
  }, []);

  return (
    <group>
      {/* ================= MAIN GROUND ARTERIAL ROADS ================= */}
      {/* 1. North-South Grand Avenue (Width 5.4m) */}
      <group>
        {/* South segment */}
        <mesh position={[0, 0.22, 26]} receiveShadow>
          <boxGeometry args={[5.2, 0.2, 44]} />
          <meshStandardMaterial color="#343c36" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.33, 26]}>
          <boxGeometry args={[0.15, 0.02, 44]} />
          <meshBasicMaterial color="#e0c87e" />
        </mesh>

        {/* North segment */}
        <mesh position={[0, 0.22, -26]} receiveShadow>
          <boxGeometry args={[5.2, 0.2, 38]} />
          <meshStandardMaterial color="#343c36" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.33, -26]}>
          <boxGeometry args={[0.15, 0.02, 38]} />
          <meshBasicMaterial color="#e0c87e" />
        </mesh>
      </group>

      {/* 2. East-West Grand Avenue (Width 5.2m) */}
      <group>
        <mesh position={[0, 0.22, 0]} receiveShadow>
          <boxGeometry args={[94, 0.2, 5.2]} />
          <meshStandardMaterial color="#343c36" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.33, 0]}>
          <boxGeometry args={[94, 0.02, 0.15]} />
          <meshBasicMaterial color="#e0c87e" />
        </mesh>
      </group>

      {/* 3. Secondary Cardinal Roads (Grid Connections at X = ±25 and Z = ±25) */}
      {[-25, 25].map((gx, idx) => (
        <group key={`ns-${idx}`}>
          <mesh position={[gx, 0.2, 20]} receiveShadow>
            <boxGeometry args={[3.8, 0.18, 52]} />
            <meshStandardMaterial color="#39423b" roughness={0.9} />
          </mesh>
          <mesh position={[gx, 0.3, 20]}>
            <boxGeometry args={[0.12, 0.02, 52]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>

          <mesh position={[gx, 0.2, -26]} receiveShadow>
            <boxGeometry args={[3.8, 0.18, 40]} />
            <meshStandardMaterial color="#39423b" roughness={0.9} />
          </mesh>
          <mesh position={[gx, 0.3, -26]}>
            <boxGeometry args={[0.12, 0.02, 40]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        </group>
      ))}

      {[-25, 25].map((gz, idx) => (
        <group key={`ew-${idx}`}>
          <mesh position={[0, 0.2, gz]} receiveShadow>
            <boxGeometry args={[92, 0.18, 3.8]} />
            <meshStandardMaterial color="#39423b" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.3, gz]}>
            <boxGeometry args={[92, 0.02, 0.12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        </group>
      ))}

      {/* 4. Citadel Ring Boulevard (Circular Promenade around Elysium Citadel) */}
      <group position={[0, 0.45, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[12.8, 16.4, 48]} />
          <meshStandardMaterial color="#38423a" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* Ring Road Lane Dashes */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[14.5, 14.65, 48]} />
          <meshBasicMaterial color="#e0c87e" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ================= ARCHITECTURAL BRIDGES ACROSS RIVER ================= */}
      {/* Central Grand Citadel Bridge (Crossing river at X = 0, Z ≈ -3.0) */}
      <ArchitecturalBridge
        position={[0, 0.3, -3.0]}
        length={16.5}
        width={5.6}
        rotationY={0}
      />

      {/* West Science Highway Bridge (Crossing river at X = -25, Z ≈ -16.2) */}
      <ArchitecturalBridge
        position={[-25, 0.35, -16.2]}
        length={15.0}
        width={4.5}
        rotationY={-0.12}
      />

      {/* East Oasis Highway Bridge (Crossing river at X = 25, Z ≈ 8.0) */}
      <ArchitecturalBridge
        position={[25, 0.32, 8.0]}
        length={15.5}
        width={4.5}
        rotationY={0.14}
      />

      {/* ================= STREETLIGHTS ================= */}
      {streetlights.map(([lx, ly, lz, lrot], idx) => (
        <group key={idx} position={[lx, ly, lz]} rotation={[0, lrot, 0]}>
          {/* Mast Pole */}
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.06, 0.1, 2.8, 6]} />
            <meshStandardMaterial color="#2d332e" metalness={0.6} />
          </mesh>
          {/* Overhanging Arm */}
          <mesh position={[0.4, 2.7, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.04, 0.05, 0.8, 6]} />
            <meshStandardMaterial color="#2d332e" metalness={0.6} />
          </mesh>
          {/* Lantern Head */}
          <mesh position={[0.7, 2.85, 0]}>
            <boxGeometry args={[0.3, 0.1, 0.2]} />
            <meshStandardMaterial
              color={isNight ? '#ffdf94' : '#d2cbba'}
              emissive={isNight ? '#ffbe3b' : '#000000'}
              emissiveIntensity={isNight ? 1.6 : 0}
            />
          </mesh>
          {/* Soft Night Pool Light (placed every 2 poles for optimal performance) */}
          {isNight && idx % 2 === 0 && (
            <pointLight
              color="#ffc75e"
              intensity={0.55}
              distance={8.0}
              position={[0.7, 2.5, 0]}
            />
          )}
        </group>
      ))}
    </group>
  );
}

