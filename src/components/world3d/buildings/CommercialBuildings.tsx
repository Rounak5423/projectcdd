import React from 'react';
import * as THREE from 'three';
import { useIsNight } from '../DayNightController';
import {
  ArchitecturalDoor,
  ArchitecturalWindow,
  RooftopHVAC,
  RooftopWaterTank,
  RooftopSolarPanel,
  AntennaMast,
} from './BuildingSharedElements';

interface ModelProps {
  isSelected: boolean;
  level: number;
}

// 1. Street-Level Retail Boutique & Shops
export function RetailShopModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();

  return (
    <group>
      {/* Paved Pedestrian Apron */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[3.0, 0.3, 2.6]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#454f47'} roughness={0.7} />
      </mesh>
      {/* Main Ground Retail Storefront */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[2.5, 0.9, 1.8]} />
        <meshStandardMaterial color="#dcdfd8" roughness={0.4} />
      </mesh>
      {/* Large Glass Display Storefront Window */}
      <mesh position={[0.4, 0.7, 0.92]}>
        <planeGeometry args={[1.2, 0.65]} />
        <meshBasicMaterial
          color={isNight ? '#ffeaa7' : '#81ecec'}
          transparent
          opacity={isNight ? 0.95 : 0.7}
        />
      </mesh>
      {/* Entrance Door with Awning */}
      <ArchitecturalDoor position={[-0.7, 0.3, 0.92]} width={0.5} height={0.8} />
      {/* Striped Fabric Awning */}
      <mesh position={[0.4, 1.1, 1.1]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[1.4, 0.04, 0.5]} />
        <meshStandardMaterial color="#e74c3c" roughness={0.6} />
      </mesh>
      {/* Shop Front Neon Sign */}
      <mesh position={[0.4, 1.3, 0.93]}>
        <boxGeometry args={[1.1, 0.2, 0.04]} />
        <meshStandardMaterial
          color="#ff7675"
          emissive="#d63031"
          emissiveIntensity={isNight ? 2.0 : 0.8}
        />
      </mesh>

      {/* Level 2 Development: Second Floor Office & Inventory Room */}
      {level >= 2 && (
        <group position={[0, 1.65, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.3, 0.85, 1.7]} />
            <meshStandardMaterial color="#cbd3c8" roughness={0.4} />
          </mesh>
          <ArchitecturalWindow position={[-0.5, 0, 0.87]} width={0.6} height={0.4} />
          <ArchitecturalWindow position={[0.5, 0, 0.87]} width={0.6} height={0.4} />
        </group>
      )}

      {/* Level 3 Development: Rooftop Solar & HVAC */}
      {level >= 3 && (
        <group position={[0, level >= 2 ? 2.15 : 1.3, 0]}>
          <RooftopHVAC position={[-0.5, 0, 0]} />
          <RooftopSolarPanel position={[0.5, 0, 0]} />
        </group>
      )}

      {/* Level 4 Development: Rooftop Open-Air Dining Terrace & Pergola */}
      {level >= 4 && (
        <group position={[0, 2.2, 0]}>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[1.8, 0.08, 1.4]} />
            <meshStandardMaterial color="#8d6e63" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.5, 0.02, 0.35, 8]} />
            <meshStandardMaterial color="#e74c3c" />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Apex Boutique Wonder): High-Fashion Glass Penthouse & Neon Beacon */}
      {level >= 5 && (
        <group position={[0, 2.7, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.4, 0.7, 1.2]} />
            <meshStandardMaterial color="#81ecec" transparent opacity={0.75} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.8, 8]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={isNight ? 2.0 : 0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 2. Shopping Complex / Commercial Arcade Mall
export function ShoppingComplexModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();

  return (
    <group>
      {/* Ground Tier Plaza */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.7, 3.4]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#2f3831'} roughness={0.6} />
      </mesh>
      {/* Second Tier Shopping Arcade */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[3.0, 0.8, 2.6]} />
        <meshStandardMaterial color="#3d493f" roughness={0.5} />
      </mesh>
      {/* Central Spherical Glass Skylight Atrium Dome */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[1.0, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#527d94"
          transparent
          opacity={0.7}
          roughness={0.1}
          metalness={0.6}
        />
      </mesh>
      {/* Main Double Entrance */}
      <ArchitecturalDoor position={[0, 0.35, 1.72]} width={1.2} height={0.8} />

      {/* Neon Digital Billboard Displays */}
      <mesh position={[-0.9, 1.25, 1.32]}>
        <boxGeometry args={[1.2, 0.45, 0.05]} />
        <meshBasicMaterial
          color={isNight ? '#ff7675' : '#e06666'}
          transparent
          opacity={isNight ? 0.95 : 0.7}
        />
      </mesh>
      <mesh position={[0.9, 1.25, 1.32]}>
        <boxGeometry args={[1.2, 0.45, 0.05]} />
        <meshBasicMaterial
          color={isNight ? '#74b9ff' : '#0984e3'}
          transparent
          opacity={isNight ? 0.95 : 0.7}
        />
      </mesh>

      {/* Level 2 Development: Third Floor Food Court & Cineplex */}
      {level >= 2 && (
        <group position={[0, 1.85, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.2, 0.75, 1.8]} />
            <meshStandardMaterial color="#4a5a4c" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* Level 3 Development: Rooftop Solar Canopy & Communication Mast */}
      {level >= 3 && (
        <group position={[0, level >= 2 ? 2.3 : 1.7, 0]}>
          <RooftopSolarPanel position={[-0.8, 0, -0.6]} />
          <RooftopSolarPanel position={[0.8, 0, -0.6]} />
          <AntennaMast position={[0, 0, 0.6]} height={1.5} />
        </group>
      )}

      {/* Level 4 Development: Flank Skywalk Connectors & Extended Retail Wings */}
      {level >= 4 && (
        <group>
          <mesh position={[-2.1, 0.9, 0]} castShadow>
            <boxGeometry args={[0.8, 0.6, 1.8]} />
            <meshStandardMaterial color="#3d493f" />
          </mesh>
          <mesh position={[2.1, 0.9, 0]} castShadow>
            <boxGeometry args={[0.8, 0.6, 1.8]} />
            <meshStandardMaterial color="#3d493f" />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Apex Megamall Wonder): Holographic Brand Globe & Sky-Park Atrium */}
      {level >= 5 && (
        <group position={[0, 2.7, 0]}>
          {/* Holographic Rotating Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.5, 0.06, 16, 32]} />
            <meshStandardMaterial
              color="#00cec9"
              emissive="#00cec9"
              emissiveIntensity={isNight ? 2.0 : 1.0}
            />
          </mesh>
          {/* Floating Brand Prism */}
          <mesh position={[0, 0.5, 0]}>
            <octahedronGeometry args={[0.5]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 3. Corporate Office Headquarters
export function OfficeBuildingModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();
  const floors = 3 + level;
  const floorHeight = 0.75;
  const buildingHeight = floors * floorHeight;

  return (
    <group>
      {/* Ground Foundation & Plaza */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.5, 3.0]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#2b332d'} roughness={0.7} />
      </mesh>
      {/* Main Office Block Core */}
      <mesh position={[0, buildingHeight * 0.5 + 0.25, 0]} castShadow>
        <boxGeometry args={[2.8, buildingHeight, 2.4]} />
        <meshStandardMaterial color="#3f4d42" roughness={0.4} />
      </mesh>
      {/* Modern Glass Curtain Wall Facade */}
      <mesh position={[0, buildingHeight * 0.5 + 0.25, 1.22]}>
        <planeGeometry args={[2.4, buildingHeight * 0.85]} />
        <meshBasicMaterial
          color={isNight ? '#ffeaa7' : '#74b9ff'}
          transparent
          opacity={isNight ? 0.9 : 0.55}
        />
      </mesh>
      {/* Main Ground Lobby Entrance */}
      <ArchitecturalDoor position={[0, 0.5, 1.22]} width={1.0} height={0.9} />

      {/* Rooftop Plant Equipment */}
      <RooftopHVAC position={[-0.6, buildingHeight + 0.25, 0]} />
      <RooftopWaterTank position={[0.6, buildingHeight + 0.25, -0.4]} />

      {/* Level 3 Development: Apex Antennas & Heli-Approach Lights */}
      {level >= 3 && (
        <group position={[0, buildingHeight + 0.25, 0]}>
          <AntennaMast position={[0.7, 0, 0.6]} height={1.8} />
          <RooftopSolarPanel position={[-0.5, 0, 0.5]} />
        </group>
      )}

      {/* Level 4 Development: Cantilever Executive Boardroom Cube */}
      {level >= 4 && (
        <group position={[0, buildingHeight * 0.75, 1.45]}>
          <mesh castShadow>
            <boxGeometry args={[1.4, 0.7, 0.8]} />
            <meshStandardMaterial color="#81ecec" transparent opacity={0.8} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Corporate HQ Wonder): Sky-Pavilion & Architectural Crown Beacons */}
      {level >= 5 && (
        <group position={[0, buildingHeight + 0.45, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[2.0, 0.5, 1.8]} />
            <meshStandardMaterial color="#2d3436" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
            <meshBasicMaterial color="#00cec9" />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 4. Financial Commercial Tower (Crystalline Skyscraper)
export function CommercialTowerModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();
  const height = 4.4 + level * 0.9;

  return (
    <group>
      {/* Grand Granite Commercial Podium */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.0, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#29332a'} roughness={0.5} />
      </mesh>
      {/* Main Crystalline Faceted Skyscraper */}
      <mesh position={[0, height * 0.5 + 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.7, height, 6]} />
        <meshStandardMaterial
          color="#3e5b6e"
          metalness={0.8}
          roughness={0.15}
          transparent
          opacity={0.88}
        />
      </mesh>
      {/* Illuminated Golden Financial Ticker Ribbon */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[1.72, 1.72, 0.35, 6]} />
        <meshStandardMaterial
          color="#c6a76a"
          emissive={isNight ? '#e6be75' : '#c6a76a'}
          emissiveIntensity={isNight ? 1.5 : 0.6}
        />
      </mesh>
      {/* Apex Crown & Spire */}
      <mesh position={[0, height + 1.2, 0]}>
        <coneGeometry args={[0.5, 1.4, 6]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Level 3 Development: Crown Antenna */}
      {level >= 3 && (
        <AntennaMast position={[0, height + 1.8, 0]} height={2.2} />
      )}

      {/* Level 4 Development: External Panoramic Glass Express Elevators */}
      {level >= 4 && (
        <group>
          <mesh position={[1.4, height * 0.5 + 0.5, 0]}>
            <boxGeometry args={[0.3, height * 0.7, 0.4]} />
            <meshStandardMaterial color="#81ecec" transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Apex Financial Wonder): Floating Golden Halo & Searchlight Beacons */}
      {level >= 5 && (
        <group position={[0, height + 2.4, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.4, 0.08, 16, 32]} />
            <meshStandardMaterial
              color="#ffd700"
              emissive="#ffd700"
              emissiveIntensity={isNight ? 2.8 : 1.2}
            />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 2.5, 8]} />
            <meshBasicMaterial color="#ffeaa7" transparent opacity={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}
