import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsNight } from '../DayNightController';
import { AntennaMast } from './BuildingSharedElements';

interface ModelProps {
  isSelected: boolean;
  level: number;
}

// 1. Hydro-Reclamation & Water Treatment Plant
export function WaterTreatmentPlantModel({ isSelected, level }: ModelProps) {
  const armRef1 = useRef<THREE.Group>(null);
  const armRef2 = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (armRef1.current) armRef1.current.rotation.y += delta * 0.35;
    if (armRef2.current) armRef2.current.rotation.y += delta * 0.35;
  });

  return (
    <group>
      {/* Concrete Apron */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.4, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#333e36'} roughness={0.8} />
      </mesh>
      {/* Clarifier Settling Tank 1 */}
      <group position={[-0.9, 0.45, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.0, 1.1, 0.6, 16]} />
          <meshStandardMaterial color="#47544a" roughness={0.6} />
        </mesh>
        {/* Swirling Treated Water Basin */}
        <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.92, 16]} />
          <meshStandardMaterial color="#23829e" roughness={0.1} metalness={0.7} />
        </mesh>
        {/* Rotating Clarifier Skimmer Arm */}
        <group ref={armRef1} position={[0, 0.35, 0]}>
          <mesh>
            <boxGeometry args={[1.7, 0.08, 0.1]} />
            <meshStandardMaterial color="#c6a76a" />
          </mesh>
        </group>
      </group>
      {/* Clarifier Settling Tank 2 */}
      <group position={[0.9, 0.45, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.0, 1.1, 0.6, 16]} />
          <meshStandardMaterial color="#47544a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.92, 16]} />
          <meshStandardMaterial color="#23829e" roughness={0.1} metalness={0.7} />
        </mesh>
        <group ref={armRef2} position={[0, 0.35, 0]}>
          <mesh>
            <boxGeometry args={[1.7, 0.08, 0.1]} />
            <meshStandardMaterial color="#c6a76a" />
          </mesh>
        </group>
      </group>
      {/* Filtration Pump Manifold */}
      <mesh position={[0, 0.9, -0.9]} castShadow>
        <boxGeometry args={[1.4, 0.8, 0.8]} />
        <meshStandardMaterial color="#3b483e" />
      </mesh>

      {/* Level 2 Development: Chemical Disinfection & Aeration Unit */}
      {level >= 2 && (
        <mesh position={[0, 1.4, -0.9]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.6, 12]} />
          <meshStandardMaterial color="#2d829e" metalness={0.6} />
        </mesh>
      )}

      {/* Level 3 Development: Deep Aquifer Injection Well */}
      {level >= 3 && (
        <group position={[0, 1.8, -0.9]}>
          <AntennaMast position={[0, 0, 0]} height={1.4} />
        </group>
      )}

      {/* Level 4 Development: UV Sterilization Reactor & Pipeline Manifold */}
      {level >= 4 && (
        <group position={[0, 0.9, 1.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.3, 1.0, 12]} />
            <meshStandardMaterial color="#00cec9" emissive="#00cec9" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Aquifer Reclamation Wonder): Crystalline Hydro-Tower & Clean Water Beacons */}
      {level >= 5 && (
        <group position={[0, 2.0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.6, 0.7, 1.6, 12]} />
            <meshStandardMaterial color="#81ecec" transparent opacity={0.7} metalness={0.7} />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <coneGeometry args={[0.2, 0.5, 8]} />
            <meshStandardMaterial color="#00cec9" emissive="#00cec9" emissiveIntensity={1.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 2. Elevated Municipal Water Storage Facility (Water Tower)
export function WaterStorageFacilityModel({ isSelected, level }: ModelProps) {
  return (
    <group>
      {/* Base Staging Pad */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[1.8, 2.0, 0.3, 12]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#39443c'} roughness={0.7} />
      </mesh>
      {/* Steel Lattice Trestle Legs */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const ang = (i * Math.PI * 2) / 6;
        return (
          <mesh key={i} position={[Math.cos(ang) * 1.0, 1.5, Math.sin(ang) * 1.0]}>
            <cylinderGeometry args={[0.04, 0.05, 2.6, 6]} />
            <meshStandardMaterial color="#2c362f" metalness={0.7} />
          </mesh>
        );
      })}
      {/* Central Riser Pipe */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 2.6, 8]} />
        <meshStandardMaterial color="#404e44" metalness={0.6} />
      </mesh>
      {/* Elevated Spherical Hydro Reservoir Sphere */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshStandardMaterial color="#4a768c" metalness={0.5} roughness={0.2} />
      </mesh>
      {/* Civil Water District Beacon Cap */}
      <mesh position={[0, 4.6, 0]}>
        <coneGeometry args={[0.2, 0.4, 8]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.8} />
      </mesh>
    </group>
  );
}

// 3. Grid Energy Substation & Battery Bank
export function ElectricalSubstationModel({ isSelected, level }: ModelProps) {
  return (
    <group>
      {/* Gravel Substation Yard */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.3, 3.0]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#454a46'} roughness={0.9} />
      </mesh>
      {/* Heavy Step-Up Transformer 1 */}
      <mesh position={[-0.8, 0.7, 0]} castShadow>
        <boxGeometry args={[1.0, 0.8, 1.2]} />
        <meshStandardMaterial color="#303b33" roughness={0.6} />
      </mesh>
      {/* Heavy Step-Up Transformer 2 */}
      <mesh position={[0.8, 0.7, 0]} castShadow>
        <boxGeometry args={[1.0, 0.8, 1.2]} />
        <meshStandardMaterial color="#303b33" roughness={0.6} />
      </mesh>
      {/* Insulator Ceramic Bushing Bushings */}
      {[-0.8, 0.8].map((tx, i) =>
        [-0.3, 0, 0.3].map((bz, j) => (
          <mesh key={`${i}-${j}`} position={[tx, 1.25, bz]}>
            <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
            <meshStandardMaterial color="#c0392b" roughness={0.3} />
          </mesh>
        ))
      )}
      {/* Steel Transmission Gantry Tower */}
      <mesh position={[0, 1.8, -0.9]} castShadow>
        <cylinderGeometry args={[0.06, 0.12, 2.8, 6]} />
        <meshStandardMaterial color="#dcdad5" metalness={0.8} />
      </mesh>
    </group>
  );
}

// 4. Planetary Senate Citadel (Monumental Neoclassical Civic Command Palace)
export function SenateCitadelModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();

  return (
    <group>
      {/* 1. Grand Rusticated Stone Base Podium & Broad Entrance Terrace */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.2, 0.7, 5.8]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#3d443e'} roughness={0.7} />
      </mesh>

      {/* Broad Ceremonial Front Staircase */}
      {[0, 1, 2, 3].map((step) => (
        <mesh key={`stair-${step}`} position={[0, 0.08 + step * 0.12, 3.0 + (3 - step) * 0.28]} receiveShadow>
          <boxGeometry args={[3.6 - step * 0.15, 0.12, 0.32]} />
          <meshStandardMaterial color="#5a635b" roughness={0.6} />
        </mesh>
      ))}

      {/* Flanking Stone Stair Balustrades & Bronze Torches */}
      {[-1.9, 1.9].map((bx, i) => (
        <group key={`balustrade-${i}`} position={[bx, 0.45, 3.4]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.6, 1.4]} />
            <meshStandardMaterial color="#4c544d" roughness={0.7} />
          </mesh>
          {/* Bronze Torch Lantern */}
          <mesh position={[0, 0.45, 0.5]}>
            <cylinderGeometry args={[0.08, 0.05, 0.3, 8]} />
            <meshStandardMaterial color="#c6a76a" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.65, 0.5]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial
              color="#ffcc66"
              emissive="#ffaa33"
              emissiveIntensity={isNight ? 2.5 : 0.8}
            />
          </mesh>
        </group>
      ))}

      {/* 2. Symmetrical East & West Legislative Wings (2 Stories with Detailed Windows) */}
      {[-2.4, 2.4].map((wx, i) => (
        <group key={`wing-${i}`} position={[wx, 1.45, 0]}>
          {/* Wing Main Masonry Mass */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.2, 1.5, 4.8]} />
            <meshStandardMaterial color="#d8ded5" roughness={0.4} />
          </mesh>
          {/* Hipped Slate Mansard Roof */}
          <mesh position={[0, 1.1, 0]} castShadow>
            <boxGeometry args={[2.0, 0.7, 4.6]} />
            <meshStandardMaterial color="#2c3a47" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* First & Second Floor Windows */}
          {[-1.4, 0, 1.4].map((wz, j) => (
            <group key={`win-${j}`}>
              <mesh position={[i === 0 ? -1.12 : 1.12, -0.15, wz]}>
                <boxGeometry args={[0.04, 0.6, 0.45]} />
                <meshStandardMaterial color={isNight ? '#ffeaa7' : '#1a252f'} roughness={0.2} />
              </mesh>
              <mesh position={[i === 0 ? -1.12 : 1.12, 0.45, wz]}>
                <boxGeometry args={[0.04, 0.5, 0.45]} />
                <meshStandardMaterial color={isNight ? '#ffeaa7' : '#1a252f'} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* 3. Central Monumental Portico & Hexastyle Colonnade */}
      <group position={[0, 1.55, 1.6]}>
        {/* Portico Base Floor */}
        <mesh position={[0, -0.75, 0.6]} receiveShadow>
          <boxGeometry args={[3.2, 0.2, 1.4]} />
          <meshStandardMaterial color="#4c544d" />
        </mesh>
        {/* Hexastyle Classical Fluted Columns */}
        {[-1.3, -0.78, -0.26, 0.26, 0.78, 1.3].map((cx, i) => (
          <mesh key={`col-${i}`} position={[cx, 0.1, 1.15]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, 1.5, 10]} />
            <meshStandardMaterial color="#e8ece5" roughness={0.3} />
          </mesh>
        ))}
        {/* Triangular Pediment with Classical Tympanum */}
        <mesh position={[0, 1.05, 1.15]} castShadow>
          <cylinderGeometry args={[0.02, 1.85, 0.4, 3]} />
          <meshStandardMaterial color="#e8ece5" roughness={0.3} />
        </mesh>
        {/* Bronze Civic Crest Medallion in Tympanum */}
        <mesh position={[0, 1.02, 1.32]}>
          <circleGeometry args={[0.18, 16]} />
          <meshStandardMaterial color="#c6a76a" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Grand Bronze Entrance Portal */}
        <mesh position={[0, -0.1, 0.35]}>
          <boxGeometry args={[1.2, 1.2, 0.08]} />
          <meshStandardMaterial color="#2d261e" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* 4. Central Grand Rotunda Hall & Drum */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <cylinderGeometry args={[1.8, 1.9, 1.8, 16]} />
        <meshStandardMaterial color="#e2e6de" roughness={0.35} />
      </mesh>
      {/* Rotunda Arched Windows */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const ang = (i * Math.PI * 2) / 8;
        return (
          <mesh
            key={`rot-win-${i}`}
            position={[Math.cos(ang) * 1.82, 2.3, Math.sin(ang) * 1.82]}
            rotation={[0, -ang + Math.PI / 2, 0]}
          >
            <planeGeometry args={[0.55, 0.9]} />
            <meshStandardMaterial
              color={isNight ? '#ffeaa7' : '#1a252f'}
              emissive={isNight ? '#ffbe44' : '#000000'}
              emissiveIntensity={isNight ? 1.6 : 0}
            />
          </mesh>
        );
      })}

      {/* 5. Majestic Ribbed Gilded Civic Dome */}
      <mesh position={[0, 3.7, 0]} castShadow>
        <sphereGeometry args={[1.7, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#c6a76a"
          metalness={0.85}
          roughness={0.2}
          emissive="#b8934a"
          emissiveIntensity={isNight ? 0.6 : 0.2}
        />
      </mesh>

      {/* Lantern Cupola & Planetary Zenith Spire */}
      <mesh position={[0, 4.7, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 0.6, 12]} />
        <meshStandardMaterial color="#e2e6de" />
      </mesh>
      <mesh position={[0, 5.4, 0]}>
        <coneGeometry args={[0.15, 0.9, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.95} />
      </mesh>

      {/* Level 4 Development: Ceremonial Colonnaded Arcade Wings */}
      {level >= 4 && (
        <group>
          {[-3.8, 3.8].map((ax, i) => (
            <group key={`arcade-${i}`} position={[ax, 0.9, 0]}>
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.8, 1.1, 4.2]} />
                <meshStandardMaterial color="#d8ded5" roughness={0.4} />
              </mesh>
              {[-1.5, -0.5, 0.5, 1.5].map((az, k) => (
                <mesh key={`arc-col-${k}`} position={[i === 0 ? -0.45 : 0.45, 0, az]}>
                  <cylinderGeometry args={[0.07, 0.08, 1.1, 8]} />
                  <meshStandardMaterial color="#e8ece5" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}

      {/* Level 5 Development (Wonder of Civilization): Planetary Hologram & Zenith Light Beam */}
      {level >= 5 && (
        <group position={[0, 6.2, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.8, 0.05, 16, 32]} />
            <meshStandardMaterial
              color="#ffd700"
              emissive="#ffd700"
              emissiveIntensity={isNight ? 2.5 : 1.2}
            />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 3.6, 8]} />
            <meshBasicMaterial color="#ffeaa7" transparent opacity={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

