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

      {/* Level 4 Development: Glass Conservatory Solarium & Landscaped Patio */}
      {level >= 4 && (
        <group position={[-0.4, 0.5, -1.1]}>
          {/* Glass Solarium */}
          <mesh castShadow>
            <boxGeometry args={[1.5, 0.8, 0.8]} />
            <meshStandardMaterial
              color="#81ecec"
              transparent
              opacity={0.7}
              roughness={0.1}
            />
          </mesh>
          {/* Pergola Wooden Slats */}
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[1.6, 0.06, 0.9]} />
            <meshStandardMaterial color="#8d6e63" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Apex Wonder Villa): Turquoise Infinity Pool & Luxury Terrace */}
      {level >= 5 && (
        <group position={[0.9, 0.2, -0.8]}>
          {/* Pool Deck */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.3, 0.25, 1.2]} />
            <meshStandardMaterial color="#dcdde1" roughness={0.3} />
          </mesh>
          {/* Glowing Infinity Water */}
          <mesh position={[0, 0.14, 0]}>
            <planeGeometry args={[1.1, 1.0]} />
            <meshStandardMaterial
              color="#00cec9"
              emissive="#00cec9"
              emissiveIntensity={isNight ? 0.6 : 0.2}
              roughness={0.05}
            />
          </mesh>
          {/* Sleek Cantilever Upper Lounge */}
          <mesh position={[-0.4, 1.4, 0]} castShadow>
            <boxGeometry args={[1.0, 0.5, 0.9]} />
            <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
          </mesh>
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

      {/* Level 4 Development: Cantilever Duplex Wing & Glass Stair Atrium */}
      {level >= 4 && (
        <group position={[-1.1, 1.8, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 1.2, 1.6]} />
            <meshStandardMaterial color="#405244" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.81]}>
            <planeGeometry args={[0.7, 0.9]} />
            <meshStandardMaterial color="#81ecec" transparent opacity={0.65} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Apex Modular Habitat): Geodesic Leisure Dome & LED Light Ribbons */}
      {level >= 5 && (
        <group position={[0, 3.2, 0]}>
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.75, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial
              color="#a8e6cf"
              transparent
              opacity={0.6}
              metalness={0.7}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.7, 0.8, 24]} />
            <meshBasicMaterial color="#c6a76a" side={THREE.DoubleSide} />
          </mesh>
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

      {/* Level 4 Development: Glass Curtain Bays & Exterior Elevator Shaft */}
      {level >= 4 && (
        <group>
          {/* Glass Panoramic Elevator Shaft */}
          <mesh position={[1.45, totalHeight * 0.5, 0]}>
            <boxGeometry args={[0.35, totalHeight * 0.9, 0.6]} />
            <meshStandardMaterial color="#81ecec" transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* Level 5 Development (Apex Residential Wonder): Skybridge Pier & Infinity Pool Deck */}
      {level >= 5 && (
        <group position={[0, totalHeight + 0.4, 0]}>
          {/* Sky Deck */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[3.0, 0.2, 2.6]} />
            <meshStandardMaterial color="#c6a76a" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Rooftop Pool */}
          <mesh position={[0, 0.22, 0]}>
            <planeGeometry args={[1.8, 1.4]} />
            <meshStandardMaterial color="#00cec9" emissive="#00cec9" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 4. High-Rise Arcology Spire (Architectural Stepped Residential Tower)
export function HighRiseArcologyModel({ isSelected, level }: ModelProps) {
  const isNight = useIsNight();
  const heightBoost = (level - 1) * 1.1;

  return (
    <group>
      {/* 1. Ground Architectural Stone Podium & Grand Residential Lobby */}
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 1.3, 3.4]} />
        <meshStandardMaterial color={isSelected ? '#e0be70' : '#2b332d'} roughness={0.7} />
      </mesh>
      {/* Glazed Double-Height Entrance Portico */}
      <mesh position={[0, 0.6, 1.72]}>
        <boxGeometry args={[1.4, 0.9, 0.08]} />
        <meshStandardMaterial
          color={isNight ? '#ffeaa7' : '#2c3e50'}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      {/* Entrance Glass Canopy */}
      <mesh position={[0, 1.15, 1.95]} rotation={[0.1, 0, 0]} castShadow>
        <boxGeometry args={[1.8, 0.06, 0.8]} />
        <meshStandardMaterial color="#3d4941" roughness={0.4} />
      </mesh>

      {/* 2. Lower Residential Tower Tier (Tier 1: 3 Stories) */}
      <mesh position={[0, 2.3 + heightBoost * 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 2.0 + heightBoost * 0.6, 2.8]} />
        <meshStandardMaterial color="#414f44" roughness={0.45} />
      </mesh>
      {/* Recessed Window Grid on Front & Back Facades */}
      {[-0.9, 0, 0.9].map((wx, i) => (
        <group key={`win-col-${i}`}>
          <mesh position={[wx, 2.3 + heightBoost * 0.3, 1.42]}>
            <boxGeometry args={[0.5, 1.6 + heightBoost * 0.5, 0.04]} />
            <meshStandardMaterial
              color={isNight ? '#ffeaa7' : '#1c2833'}
              emissive={isNight ? '#ffbe44' : '#000000'}
              emissiveIntensity={isNight ? 1.6 : 0}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[wx, 2.3 + heightBoost * 0.3, -1.42]}>
            <boxGeometry args={[0.5, 1.6 + heightBoost * 0.5, 0.04]} />
            <meshStandardMaterial
              color={isNight ? '#ffeaa7' : '#1c2833'}
              emissive={isNight ? '#ffbe44' : '#000000'}
              emissiveIntensity={isNight ? 1.6 : 0}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* 3. Cantilevered Sky-Garden Terrace Promenade */}
      <mesh position={[0, 3.4 + heightBoost * 0.6, 0]} castShadow>
        <boxGeometry args={[3.2, 0.22, 3.2]} />
        <meshStandardMaterial color="#4f634b" roughness={0.6} />
      </mesh>
      {/* Foliage Greenery Planters on Sky-Garden */}
      {[-1.3, 1.3].map((px, i) => (
        <mesh key={`planter-${i}`} position={[px, 3.65 + heightBoost * 0.6, 0]} castShadow>
          <boxGeometry args={[0.35, 0.28, 2.6]} />
          <meshStandardMaterial color="#2c5e32" roughness={0.8} />
        </mesh>
      ))}

      {/* 4. Upper Penthouse Spire Tier (Tier 2: Stepped Setback) */}
      <mesh position={[0, 4.8 + heightBoost * 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 2.4 + heightBoost * 0.6, 1.9]} />
        <meshStandardMaterial color="#556658" roughness={0.4} />
      </mesh>
      {/* Penthouse High-Rise Window Ribbons */}
      {[-0.5, 0.5].map((px, i) => (
        <mesh key={`p-win-${i}`} position={[px, 4.8 + heightBoost * 0.9, 0.97]}>
          <boxGeometry args={[0.4, 2.0 + heightBoost * 0.5, 0.04]} />
          <meshStandardMaterial
            color={isNight ? '#ffeaa7' : '#1c2833'}
            emissive={isNight ? '#ffbe44' : '#000000'}
            emissiveIntensity={isNight ? 1.8 : 0}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* 5. Crowning Architectural Copper Mansard Cap & Zenith Antenna */}
      <mesh position={[0, 6.2 + heightBoost * 1.2, 0]} castShadow>
        <boxGeometry args={[1.4, 0.6, 1.4]} />
        <meshStandardMaterial color="#2d4d40" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 6.6 + heightBoost * 1.2, 0]}>
        <coneGeometry args={[0.3, 0.8, 4]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.8} />
      </mesh>
      <AntennaMast position={[0, 7.0 + heightBoost * 1.2, 0]} height={1.8} />

      {/* Level 4 Development: Lateral Sky-Bridges */}
      {level >= 4 && (
        <group position={[0, 3.8 + heightBoost * 0.6, 0]}>
          <mesh position={[-1.8, 0, 0]} castShadow>
            <boxGeometry args={[0.9, 0.4, 1.2]} />
            <meshStandardMaterial color="#3d4941" />
          </mesh>
          <mesh position={[1.8, 0, 0]} castShadow>
            <boxGeometry args={[0.9, 0.4, 1.2]} />
            <meshStandardMaterial color="#3d4941" />
          </mesh>
        </group>
      )}

      {/* Level 5 Development: Gilded Apex Rotunda & Beacon */}
      {level >= 5 && (
        <group position={[0, 7.4 + heightBoost * 1.2, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.05, 16, 24]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={isNight ? 2.5 : 1.0} />
          </mesh>
        </group>
      )}
    </group>
  );
}

