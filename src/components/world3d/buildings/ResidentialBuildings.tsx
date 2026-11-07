import React from 'react';
import * as THREE from 'three';
import { useIsNight } from '../DayNightController';
import {
  ArchitecturalDoor,
  ArchitecturalWindow,
  ArchitecturalBalcony,
  RooftopSolarPanel,
  RooftopHVAC,
  RooftopWaterTank,
  AntennaMast,
} from './BuildingSharedElements';

interface ModelProps {
  isSelected: boolean;
  level: number;
}

// 1. Small Suburban House (Single-family villa with pitched roof and garden)
export function SmallHouseModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();

  return (
    <group>
      {/* Garden Green Base */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[3.2, 0.24, 2.8]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#476f41'} roughness={0.9} />
      </mesh>
      {/* Front Stone Driveway */}
      <mesh position={[0.8, 0.14, 0.5]}>
        <boxGeometry args={[1.1, 0.04, 1.4]} />
        <meshStandardMaterial color="#69736b" />
      </mesh>
      {/* Ground Floor House Body */}
      <mesh position={[-0.4, 0.72, 0]} castShadow>
        <boxGeometry args={[1.9, 0.95, 1.8]} />
        <meshStandardMaterial color="#ecefe8" roughness={0.4} />
      </mesh>
      {/* Pitched Gable Roof with Blue Solar Tiles */}
      <mesh position={[-0.4, 1.45, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[1.45, 1.45, 2.05]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Entrance Door */}
      <ArchitecturalDoor position={[-0.4, 0.24, 0.92]} width={0.45} height={0.75} />
      {/* Windows */}
      <ArchitecturalWindow position={[-1.0, 0.75, 0.92]} width={0.4} height={0.4} />
      <ArchitecturalWindow position={[0.2, 0.75, 0.92]} width={0.4} height={0.4} />

      {/* Level 2 Development: Attached Garage & Second Floor Bedroom */}
      {level >= 2 && (
        <group position={[0.7, 0.8, -0.2]}>
          <mesh castShadow>
            <boxGeometry args={[1.2, 0.85, 1.3]} />
            <meshStandardMaterial color="#dde4d8" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
            <boxGeometry args={[0.95, 0.95, 1.4]} />
            <meshStandardMaterial color="#2c3e50" metalness={0.6} />
          </mesh>
        </group>
      )}

      {/* Level 3 Development: Rooftop Solar Collectors & Garden Deck */}
      {level >= 3 && (
        <group position={[-0.4, 2.0, 0]}>
          <RooftopSolarPanel position={[0, 0.2, 0.3]} />
          <AntennaMast position={[0.6, 0.2, -0.4]} height={1.2} />
        </group>
      )}
    </group>
  );
}

// 2. Medium Residential Townhouse / Modular Habitat
export function MediumResidentialModel({ isSelected, level }: ModelProps) {
  return (
    <group>
      {/* Foundation */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.4, 3.0]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#333e36'} roughness={0.7} />
      </mesh>
      {/* Lower Living Pods */}
      <mesh position={[-0.75, 0.9, -0.3]} castShadow>
        <boxGeometry args={[1.5, 1.0, 1.8]} />
        <meshStandardMaterial color="#495a4c" roughness={0.4} />
      </mesh>
      <mesh position={[0.75, 0.9, 0.3]} castShadow>
        <boxGeometry args={[1.5, 1.0, 1.8]} />
        <meshStandardMaterial color="#556959" roughness={0.4} />
      </mesh>
      {/* Front Entrance Doors */}
      <ArchitecturalDoor position={[-0.75, 0.4, 0.62]} width={0.45} height={0.75} />
      <ArchitecturalDoor position={[0.75, 0.4, 1.22]} width={0.45} height={0.75} />

      {/* Level 1+ Second Floor Living Pod */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[1.8, 0.9, 1.8]} />
        <meshStandardMaterial color="#3c4c3e" roughness={0.4} />
      </mesh>
      <ArchitecturalBalcony position={[0, 1.85, 0.92]} width={1.4} />

      {/* Level 2 Development: Third Floor Penthouse Pod */}
      {level >= 2 && (
        <group position={[0.3, 2.7, -0.2]}>
          <mesh castShadow>
            <boxGeometry args={[1.4, 0.85, 1.4]} />
            <meshStandardMaterial color="#556c59" roughness={0.4} />
          </mesh>
          <ArchitecturalWindow position={[0, 0, 0.72]} width={0.8} height={0.45} />
        </group>
      )}

      {/* Level 3 Development: Rooftop Solar & HVAC Array */}
      {level >= 3 && (
        <group>
          <RooftopSolarPanel position={[-0.5, 2.35, 0.3]} />
          <RooftopHVAC position={[0.5, 3.15, -0.3]} />
          <AntennaMast position={[-0.5, 2.35, -0.4]} height={1.4} />
        </group>
      )}
    </group>
  );
}

// 3. Urban Apartment Block (Multi-story residential apartments)
export function ApartmentBlockModel({ isSelected, level }: ModelProps) {
  const stories = 2 + level; // Level 1: 3 stories, Level 2: 4 stories, Level 3: 5 stories
  const storyHeight = 0.85;
  const totalHeight = stories * storyHeight + 0.4;

  return (
    <group>
      {/* Ground Podium & Lobby */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.6, 2.8]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#2d372e'} roughness={0.6} />
      </mesh>
      {/* Main Apartment Tower Core */}
      <mesh position={[0, totalHeight * 0.5 + 0.3, 0]} castShadow>
        <boxGeometry args={[2.7, totalHeight, 2.3]} />
        <meshStandardMaterial color="#404f43" roughness={0.4} />
      </mesh>
      {/* Ground Lobby Entrance */}
      <ArchitecturalDoor position={[0, 0.6, 1.17]} width={0.9} height={0.95} />

      {/* Balconies on each residential story */}
      {Array.from({ length: stories - 1 }).map((_, idx) => {
        const floorY = 0.9 + idx * storyHeight;
        return (
          <group key={idx}>
            <ArchitecturalBalcony position={[-0.6, floorY, 1.17]} width={0.9} depth={0.45} />
            <ArchitecturalBalcony position={[0.6, floorY, 1.17]} width={0.9} depth={0.45} />
            {/* Rear Windows */}
            <ArchitecturalWindow position={[-0.6, floorY + 0.35, -1.17]} rotation={[0, Math.PI, 0]} />
            <ArchitecturalWindow position={[0.6, floorY + 0.35, -1.17]} rotation={[0, Math.PI, 0]} />
          </group>
        );
      })}

      {/* Rooftop Parapet, Water Cistern & HVAC */}
      <mesh position={[0, totalHeight + 0.35, 0]}>
        <boxGeometry args={[2.8, 0.15, 2.4]} />
        <meshStandardMaterial color="#273229" />
      </mesh>
      <RooftopWaterTank position={[-0.6, totalHeight + 0.35, -0.4]} />
      <RooftopHVAC position={[0.5, totalHeight + 0.35, 0.3]} />

      {/* Level 3 Development: Rooftop Garden Terrace & Solar Canopy */}
      {level >= 3 && (
        <group position={[0, totalHeight + 0.4, 0]}>
          <RooftopSolarPanel position={[-0.4, 0, 0.4]} />
          <AntennaMast position={[0.8, 0, -0.5]} height={1.6} />
        </group>
      )}
    </group>
  );
}

// 4. High-Rise Arcology Spire (Futuristic Vertical City)
export function HighRiseArcologyModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();
  const heightBoost = (level - 1) * 1.1;

  return (
    <group>
      {/* Ground Bastion Podium */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 1.2, 3.4]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#263127'} roughness={0.6} />
      </mesh>
      {/* Lower Residential Body */}
      <mesh position={[0, 2.0 + heightBoost * 0.3, 0]} castShadow>
        <boxGeometry args={[2.5, 2.0 + heightBoost * 0.6, 2.5]} />
        <meshStandardMaterial color="#354437" roughness={0.4} />
      </mesh>
      {/* Cantilever Sky-Garden Promenade */}
      <mesh position={[0, 3.2 + heightBoost * 0.6, 0]} castShadow>
        <boxGeometry args={[2.9, 0.28, 2.9]} />
        <meshStandardMaterial color="#4a6346" roughness={0.5} />
      </mesh>
      {/* Upper Spire Section */}
      <mesh position={[0, 4.6 + heightBoost * 0.9, 0]} castShadow>
        <boxGeometry args={[1.6, 2.5 + heightBoost * 0.6, 1.6]} />
        <meshStandardMaterial color="#4b5d4e" roughness={0.3} />
      </mesh>
      {/* Illuminated Window Ribbon Strips */}
      {[-1.27, 1.27].map((wx, i) => (
        <mesh key={`win-x-${i}`} position={[wx, 2.1 + heightBoost * 0.4, 0]}>
          <planeGeometry args={[0.05, 2.2 + heightBoost * 0.6]} />
          <meshBasicMaterial
            color={isNight ? '#ffe08a' : '#cce4b0'}
            transparent
            opacity={isNight ? 0.95 : 0.6}
          />
        </mesh>
      ))}

      {/* Level 2 Development: Skybridge Docking Portal */}
      {level >= 2 && (
        <mesh position={[0, 5.8 + heightBoost * 1.1, 0]}>
          <cylinderGeometry args={[1.1, 1.3, 0.4, 8]} />
          <meshStandardMaterial color="#c6a76a" metalness={0.8} />
        </mesh>
      )}

      {/* Level 3 Development: Rooftop Helipad & Quantum Zenith Spire */}
      {level >= 3 && (
        <group position={[0, 6.2 + heightBoost * 1.2, 0]}>
          {/* Helipad Deck */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[1.0, 1.05, 0.12, 16]} />
            <meshStandardMaterial color="#303831" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.9, 16]} />
            <meshBasicMaterial color="#e0be70" />
          </mesh>
          <AntennaMast position={[0, 0.2, 0]} height={2.2} />
        </group>
      )}
    </group>
  );
}

