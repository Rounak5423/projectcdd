import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameState, MapLayer } from '../../context/GameStateContext';
import { PlacedBuilding } from '../../types/game';
import CivCityBanner from '../game/CivCityBanner';

// ================= REALISTIC ARCHITECTURAL MODELS =================

// 1. Traditional Timber Windmill with Rotating Canvas Sails
function WindmillMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  const sailsRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (sailsRef.current) {
      sailsRef.current.rotation.z += delta * 1.2;
    }
  });

  return (
    <group position={position}>
      {/* Stone Base */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.8, 8]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#69645c'} roughness={0.8} />
      </mesh>
      {/* Octagonal Timber Tower */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.5, 2.0, 8]} />
        <meshStandardMaterial color="#4d3b2c" roughness={0.7} />
      </mesh>
      {/* Conical Thatched / Shingle Cap */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[1.25, 1.1, 8]} />
        <meshStandardMaterial color="#2d2620" roughness={0.9} />
      </mesh>
      {/* Rotating Sails Hub */}
      <group position={[0, 3.0, 0.9]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.4, 8]} />
          <meshStandardMaterial color="#2b2018" />
        </mesh>
        <group ref={sailsRef}>
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
            <group key={i} rotation={[0, 0, angle]}>
              {/* Timber Spar */}
              <mesh position={[0, 1.3, 0]} castShadow>
                <boxGeometry args={[0.08, 2.4, 0.04]} />
                <meshStandardMaterial color="#36281e" />
              </mesh>
              {/* White Canvas Sail */}
              <mesh position={[0.24, 1.3, 0.02]}>
                <planeGeometry args={[0.42, 2.1]} />
                <meshStandardMaterial color="#ded8c8" roughness={0.6} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

// 2. Classical Stone Academy & Observatory (Copper Dome)
function ObservatoryMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  const domeRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (domeRef.current) {
      domeRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Sandstone Foundation */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.7, 3.2]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#8c8070'} roughness={0.8} />
      </mesh>
      {/* Main Classical University Hall */}
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.4, 2.8]} />
        <meshStandardMaterial color="#b3a592" roughness={0.7} />
      </mesh>
      {/* Corner Columns */}
      {[-1.2, 1.2].map((x, i) =>
        [-1.2, 1.2].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 1.4, z]} castShadow>
            <cylinderGeometry args={[0.14, 0.16, 1.4, 8]} />
            <meshStandardMaterial color="#d4c7b4" />
          </mesh>
        ))
      )}
      {/* Rotating Verdigris Copper Dome */}
      <group ref={domeRef} position={[0, 2.4, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[1.3, 1.3, 0.4, 16]} />
          <meshStandardMaterial color="#617a6a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <sphereGeometry args={[1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#4f7e6f" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Brass Telescope Tube */}
        <mesh position={[0.4, 1.1, 0.4]} rotation={[0.6, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 1.4, 10]} />
          <meshStandardMaterial color="#b89342" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// 3. Realistic Terracotta Gabled Townhouse Row (Residential)
function TownhouseRowMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      {/* Stone Foundation Base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.6, 2.4]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#635e57'} roughness={0.85} />
      </mesh>
      {/* House 1: Plaster & Timber Gable */}
      <group position={[-0.8, 1.2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.3, 2.2]} />
          <meshStandardMaterial color="#d9ccb6" roughness={0.7} />
        </mesh>
        {/* Pitched Terracotta Roof */}
        <mesh position={[0, 1.0, 0]} rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[1.2, 0.9, 4]} />
          <meshStandardMaterial color="#9c4632" roughness={0.65} />
        </mesh>
        {/* Brick Chimney */}
        <mesh position={[0.4, 1.3, 0.4]} castShadow>
          <boxGeometry args={[0.25, 0.7, 0.25]} />
          <meshStandardMaterial color="#6b3427" />
        </mesh>
      </group>
      {/* House 2: Dark Slate Gable */}
      <group position={[0.8, 1.4, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.6, 2.2]} />
          <meshStandardMaterial color="#bfb099" roughness={0.7} />
        </mesh>
        {/* Slate Roof */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <coneGeometry args={[1.3, 1.0, 4]} />
          <meshStandardMaterial color="#384047" roughness={0.6} />
        </mesh>
        <mesh position={[-0.4, 1.5, -0.4]} castShadow>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshStandardMaterial color="#6b3427" />
        </mesh>
      </group>
    </group>
  );
}

// 4. Farmland Barn, Silo & Tilled Crop Field (Agriculture)
function FarmlandMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      {/* Tilled Earth Base */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.16, 3.6]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#524332'} roughness={0.9} />
      </mesh>
      {/* Golden Wheat Strips */}
      {[-1.2, -0.8, -0.4, 0, 0.4].map((z, idx) => (
        <mesh key={idx} position={[-0.6, 0.22, z]}>
          <boxGeometry args={[2.2, 0.15, 0.25]} />
          <meshStandardMaterial color="#cfa84a" roughness={0.8} />
        </mesh>
      ))}
      {/* Wooden Barn with Gambrel Roof */}
      <group position={[1.1, 0.8, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.1, 2.0]} />
          <meshStandardMaterial color="#7a3e30" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow>
          <coneGeometry args={[1.1, 0.7, 4]} />
          <meshStandardMaterial color="#423429" roughness={0.7} />
        </mesh>
      </group>
      {/* Stone Grain Silo */}
      <mesh position={[1.3, 1.2, 1.2]} castShadow>
        <cylinderGeometry args={[0.4, 0.45, 1.8, 10]} />
        <meshStandardMaterial color="#787369" roughness={0.8} />
      </mesh>
      <mesh position={[1.3, 2.2, 1.2]} castShadow>
        <coneGeometry args={[0.45, 0.5, 10]} />
        <meshStandardMaterial color="#4d463e" />
      </mesh>
    </group>
  );
}

// 5. Red-Brick Factory, Smokestacks & Waterwheel (Industrial)
function IndustrialFactoryMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  const wheelRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.x += delta * 1.5;
    }
  });

  return (
    <group position={position}>
      {/* Cobblestone Factory Yard */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[3.8, 0.3, 3.0]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#4a4642'} roughness={0.9} />
      </mesh>
      {/* Red Brick Main Warehouse */}
      <mesh position={[-0.4, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.5, 2.2]} />
        <meshStandardMaterial color="#823c2d" roughness={0.75} />
      </mesh>
      {/* Industrial Pitched Roof */}
      <mesh position={[-0.4, 2.0, 0]} castShadow>
        <coneGeometry args={[1.8, 0.8, 4]} />
        <meshStandardMaterial color="#353b40" roughness={0.6} />
      </mesh>
      {/* Tall Brick Smokestack 1 */}
      <mesh position={[1.1, 1.8, 0.6]} castShadow>
        <cylinderGeometry args={[0.22, 0.35, 2.8, 8]} />
        <meshStandardMaterial color="#5c2c22" roughness={0.7} />
      </mesh>
      {/* Tall Brick Smokestack 2 */}
      <mesh position={[1.1, 1.6, -0.6]} castShadow>
        <cylinderGeometry args={[0.22, 0.35, 2.4, 8]} />
        <meshStandardMaterial color="#5c2c22" roughness={0.7} />
      </mesh>
      {/* Timber Waterwheel on side */}
      <mesh ref={wheelRef} position={[-1.7, 0.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.3, 12]} />
        <meshStandardMaterial color="#423122" roughness={0.8} />
      </mesh>
    </group>
  );
}

// 6. Grand Stone Citadel & Town Hall (Government)
function GrandCitadelMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      {/* Grand Stone Terrace */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.8, 3.8]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#69645d'} roughness={0.8} />
      </mesh>
      {/* Palatial Main Hall */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.8, 2.6]} />
        <meshStandardMaterial color="#a19787" roughness={0.7} />
      </mesh>
      {/* Slate Mansard Roof */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[2.2, 1.1, 4]} />
        <meshStandardMaterial color="#2d353b" roughness={0.6} />
      </mesh>
      {/* Central Stone Clock Spire */}
      <mesh position={[0, 3.6, 0.2]} castShadow>
        <boxGeometry args={[0.9, 1.8, 0.9]} />
        <meshStandardMaterial color="#8a7e6f" />
      </mesh>
      {/* Golden Spire Point */}
      <mesh position={[0, 4.8, 0.2]} castShadow>
        <coneGeometry args={[0.5, 1.4, 8]} />
        <meshStandardMaterial color="#c29b38" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Corner Turrets */}
      {[-1.5, 1.5].map((x, i) =>
        [-1.2, 1.2].map((z, j) => (
          <group key={`${i}-${j}`} position={[x, 2.0, z]}>
            <cylinderGeometry args={[0.3, 0.3, 1.6, 8]} />
            <meshStandardMaterial color="#7d7365" />
            <mesh position={[0, 1.1, 0]} castShadow>
              <coneGeometry args={[0.4, 0.7, 8]} />
              <meshStandardMaterial color="#2d353b" />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}

// 7. Photovoltaic Solar Concentrator
function ModernSolarMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[3.0, 0.2, 2.4]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#384039'} />
      </mesh>
      {[-0.8, 0, 0.8].map((x, i) =>
        [-0.6, 0.6].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.5, z]} rotation={[0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.7, 0.05, 0.7]} />
            <meshStandardMaterial color="#1a354d" metalness={0.9} roughness={0.15} />
          </mesh>
        ))
      )}
    </group>
  );
}

// 8. Modern Wind Turbine
function ModernTurbineMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  const rotorRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z += delta * 2.2;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.22, 3.6, 8]} />
        <meshStandardMaterial color={isSelected ? '#dfb74a' : '#d1d8dc'} roughness={0.4} />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <boxGeometry args={[0.3, 0.25, 0.6]} />
        <meshStandardMaterial color="#85939a" />
      </mesh>
      <group ref={rotorRef} position={[0, 3.6, 0.33]}>
        <mesh>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#a6852e" />
        </mesh>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => (
          <group key={i} rotation={[0, 0, angle]}>
            <mesh position={[0, 1.0, 0]}>
              <boxGeometry args={[0.07, 2.0, 0.02]} />
              <meshStandardMaterial color="#f0f3f5" roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// ================= COBBLESTONE ROADS & STONE BRIDGES =================

function RoadNetwork() {
  return (
    <group>
      {/* Main Cobblestone Avenue North-South */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.2, 85]} />
        <meshStandardMaterial color="#403c37" roughness={0.88} />
      </mesh>
      {/* East-West Avenues */}
      {[-18, 0, 20].map((z, idx) => (
        <mesh key={idx} position={[0, 0.06, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[80, 3.6]} />
          <meshStandardMaterial color="#403c37" roughness={0.88} />
        </mesh>
      ))}
      {/* Secondary Roads */}
      {[22, -22].map((x, idx) => (
        <mesh key={`sec-${idx}`} position={[x, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[3.2, 70]} />
          <meshStandardMaterial color="#47433e" roughness={0.9} />
        </mesh>
      ))}

      {/* Stone Arched Bridges across River */}
      {[-16, 14].map((bx, i) => (
        <group key={`bridge-${i}`} position={[bx, 0.45, 0]}>
          {/* Bridge Roadway */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4.4, 0.35, 14.5]} />
            <meshStandardMaterial color="#575149" roughness={0.8} />
          </mesh>
          {/* Stone Parapet Rails */}
          <mesh position={[-2.1, 0.45, 0]} castShadow>
            <boxGeometry args={[0.25, 0.55, 14.5]} />
            <meshStandardMaterial color="#423d37" />
          </mesh>
          <mesh position={[2.1, 0.45, 0]} castShadow>
            <boxGeometry args={[0.25, 0.55, 14.5]} />
            <meshStandardMaterial color="#423d37" />
          </mesh>
          {/* Underwater Stone Pier Supports */}
          <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.8, 1.2, 3.0]} />
            <meshStandardMaterial color="#36322d" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ================= REALISTIC NATURAL TERRAIN & RIVER =================

function WorldTerrain({ activeLayer }: { activeLayer: MapLayer }) {
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(120, 120, 56, 56);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);

      // Sinuous river channel curving through landscape
      const riverCenter = Math.sin(vx * 0.05) * 10;
      const distFromRiver = Math.abs(vy - riverCenter);

      let height = 0;
      if (distFromRiver < 6.5) {
        // Deep river bed
        height = -1.4 + (distFromRiver / 6.5) * 0.9;
      } else {
        // Natural rolling hills and slopes
        const hill1 = Math.sin(vx * 0.07) * Math.cos(vy * 0.07) * 2.2;
        const hill2 = Math.cos(vx * 0.035 + 1.2) * Math.sin(vy * 0.035) * 3.8;
        height = Math.max(0.12, hill1 + hill2);
      }
      pos.setZ(i, height);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      {/* Natural Grassy Ground Surface */}
      <mesh geometry={terrainGeo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <meshStandardMaterial
          color={activeLayer === 'environment' ? '#3c5c32' : '#456139'}
          roughness={0.88}
          metalness={0.08}
          flatShading
        />
      </mesh>

      {/* Realistic Flowing River Water */}
      <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 24]} />
        <meshStandardMaterial
          color="#356875"
          roughness={0.12}
          metalness={0.7}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* River Shore Sand & Gravel Banks */}
      <mesh position={[0, -0.15, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 2.5]} />
        <meshStandardMaterial color="#7a6c56" roughness={0.92} />
      </mesh>
      <mesh position={[0, -0.15, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 2.5]} />
        <meshStandardMaterial color="#7a6c56" roughness={0.92} />
      </mesh>

      {/* Cobblestone Roads & Bridges */}
      <RoadNetwork />

      {/* Natural Pine & Deciduous Forests */}
      {useMemo(() => {
        const forestTrees = [
          [-45, 34], [-40, 38], [-48, 28], [-44, 42], [-36, 46],
          [42, 32], [46, 36], [38, 28], [44, 24], [48, 18],
          [-16, -42], [-22, -38], [-12, -46], [-28, -34],
          [28, -38], [34, -42], [22, -45], [38, -32],
        ];

        return forestTrees.map(([tx, tz], i) => (
          <group key={`tree-${i}`} position={[tx, 0.9, tz]}>
            {/* Trunk */}
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.18, 0.9, 6]} />
              <meshStandardMaterial color="#3b2b1d" />
            </mesh>
            {/* Foliage Tier 1 */}
            <mesh position={[0, 1.3, 0]} castShadow>
              <coneGeometry args={[1.0, 1.4, 7]} />
              <meshStandardMaterial color="#244225" roughness={0.85} />
            </mesh>
            {/* Foliage Tier 2 */}
            <mesh position={[0, 2.1, 0]} castShadow>
              <coneGeometry args={[0.7, 1.2, 7]} />
              <meshStandardMaterial color="#2f5431" roughness={0.85} />
            </mesh>
          </group>
        ));
      }, [])}

      {/* River Docks & Timber Pier */}
      <group position={[-6, 0.2, 5.5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.25, 4.8]} />
          <meshStandardMaterial color="#473628" roughness={0.8} />
        </mesh>
        {/* Dock Pilings */}
        {[-1.3, 1.3].map((px, i) =>
          [-2.0, 0, 2.0].map((pz, j) => (
            <mesh key={`${i}-${j}`} position={[px, -0.6, pz]}>
              <cylinderGeometry args={[0.08, 0.1, 1.4, 6]} />
              <meshStandardMaterial color="#2d2218" />
            </mesh>
          ))
        )}
        {/* Small Moored Cargo Boat */}
        <group position={[2.4, -0.4, 0]} rotation={[0, 0.15, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.2, 0.5, 2.8]} />
            <meshStandardMaterial color="#543c2c" roughness={0.7} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ================= BUILDING WRAPPER =================

function BuildingObject({
  building,
  isSelected,
  onSelect,
  activeLayer,
}: {
  building: PlacedBuilding;
  isSelected: boolean;
  onSelect: () => void;
  activeLayer: MapLayer;
}) {
  const [hovered, setHovered] = useState(false);

  // Layer filter dimming
  const isDimmed = useMemo(() => {
    if (activeLayer === 'all') return false;
    if (activeLayer === 'infrastructure' && ['energy', 'industrial'].includes(building.category)) return false;
    if (activeLayer === 'population' && ['residential', 'healthcare', 'education'].includes(building.category)) return false;
    if (activeLayer === 'resources' && ['agriculture', 'industrial', 'energy'].includes(building.category)) return false;
    if (activeLayer === 'environment' && ['agriculture', 'energy'].includes(building.category)) return false;
    if (activeLayer === 'economy' && ['commercial', 'industrial', 'government'].includes(building.category)) return false;
    return true;
  }, [activeLayer, building.category]);

  const pos: [number, number, number] = [building.x, building.y, building.z];

  const renderRealisticMesh = () => {
    switch (building.modelType) {
      case 'turbine':
        return <ModernTurbineMesh position={pos} isSelected={isSelected} />;
      case 'observatory':
        return <ObservatoryMesh position={pos} isSelected={isSelected} />;
      case 'tower':
        return <TownhouseRowMesh position={pos} isSelected={isSelected} />;
      case 'hydroponic':
      case 'dome':
        return <FarmlandMesh position={pos} isSelected={isSelected} />;
      case 'factory':
        return <IndustrialFactoryMesh position={pos} isSelected={isSelected} />;
      case 'solar':
        return <ModernSolarMesh position={pos} isSelected={isSelected} />;
      case 'citadel':
        return <GrandCitadelMesh position={pos} isSelected={isSelected} />;
      default:
        // Agriculture / Farmlands fallback or townhouses
        if (building.category === 'agriculture') {
          return <WindmillMesh position={pos} isSelected={isSelected} />;
        }
        return <TownhouseRowMesh position={pos} isSelected={isSelected} />;
    }
  };

  return (
    <group
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group scale={isDimmed ? 0.75 : hovered ? 1.04 : 1.0}>
        {renderRealisticMesh()}
      </group>

      {/* Subtle Warm Stone Selection Perimeter */}
      {isSelected && (
        <mesh position={[building.x, 0.08, building.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.5, 32]} />
          <meshBasicMaterial color="#dfb74a" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Strategy Game Tooltip on Hover */}
      {(hovered || isSelected) && (
        <Html position={[building.x, building.y + 4.2, building.z]} center distanceFactor={30}>
          <div className="pointer-events-none px-2.5 py-1 rounded bg-[#161c1f]/95 border border-[#8f7742] text-xs font-semibold text-[#ede8dc] whitespace-nowrap shadow-xl flex items-center gap-1.5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#7ea376]" />
            <span>{building.name}</span>
            <span className="text-[10px] text-[#dfb74a] font-mono">L{building.level}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

// ================= CONSTRUCTION PLACEMENT CURSOR =================

function ConstructionPlacementPlane() {
  const { isConstructionMode, selectedCatalogItem, placeBuilding } = useGameState();
  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(null);

  if (!isConstructionMode || !selectedCatalogItem) return null;

  return (
    <group>
      {/* Raycast ground plane */}
      <mesh
        position={[0, 0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={(e) => {
          e.stopPropagation();
          setGhostPos([e.point.x, 0.4, e.point.z]);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (ghostPos) {
            placeBuilding(selectedCatalogItem.id, ghostPos[0], ghostPos[2]);
          }
        }}
      >
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Subtle Ghost Foundation Preview */}
      {ghostPos && (
        <group position={ghostPos}>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[2.8, 1.2, 2.8]} />
            <meshBasicMaterial color="#7ea376" transparent opacity={0.35} wireframe />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 2.1, 32]} />
            <meshBasicMaterial color="#7ea376" side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, 2.4, 0]} center>
            <div className="pointer-events-none px-2.5 py-1 bg-[#14181b]/95 border border-[#7ea376] text-xs font-bold text-[#ede8dc] rounded shadow-md whitespace-nowrap">
              Click terrain to construct {selectedCatalogItem.name}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

// ================= MAIN 3D CIVILIZATION CANVAS =================

export default function CivilizationWorld3D({ onSelectDistrict }: { onSelectDistrict?: (id: string) => void }) {
  const { placedBuildings, selectedBuildingId, selectBuilding, activeLayer } = useGameState();

  return (
    <div className="w-full h-full relative bg-[#1a2328] select-none">
      <Canvas
        camera={{ position: [36, 32, 44], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        {/* Soft Open Sky Daylight & Fog */}
        <color attach="background" args={['#8da6b5']} />
        <fog attach="fog" args={['#8da6b5', 65, 140]} />

        {/* Realistic Natural Hemisphere & Sun Lighting */}
        <hemisphereLight
          args={['#bcd9eb', '#475a3e', 1.2]}
        />
        <directionalLight
          position={[50, 68, 32]}
          intensity={2.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={10}
          shadow-camera-far={160}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          color="#fff6e3"
        />
        <directionalLight position={[-40, 25, -30]} intensity={0.4} color="#8fae98" />

        {/* Natural Ground, River, Roads & Forests */}
        <WorldTerrain activeLayer={activeLayer} />

        {/* Realistic Buildings */}
        {placedBuildings.map((building) => (
          <BuildingObject
            key={building.id}
            building={building}
            isSelected={selectedBuildingId === building.id}
            onSelect={() => selectBuilding(building.id)}
            activeLayer={activeLayer}
          />
        ))}

        {/* Building Placement Raycaster */}
        <ConstructionPlacementPlane />

        {/* Smooth Orbit Camera Controls */}
        <OrbitControls
          maxPolarAngle={Math.PI / 2.15}
          minDistance={16}
          maxDistance={90}
          dampingFactor={0.06}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
