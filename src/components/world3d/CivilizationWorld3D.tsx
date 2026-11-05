import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Float, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameState, MapLayer } from '../../context/GameStateContext';
import { PlacedBuilding } from '../../types/game';

// Custom Animated Wind Turbine
function WindTurbineMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  const bladesRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += delta * 2.5;
    }
  });

  return (
    <group position={position}>
      {/* Tower Mast */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.08, 0.2, 3.2, 8]} />
        <meshStandardMaterial color={isSelected ? '#c6a76a' : '#d8ded3'} roughness={0.4} />
      </mesh>
      {/* Nacelle */}
      <mesh position={[0, 3.2, 0]}>
        <boxGeometry args={[0.3, 0.25, 0.6]} />
        <meshStandardMaterial color="#889882" roughness={0.5} />
      </mesh>
      {/* Rotor & Blades */}
      <group ref={bladesRef} position={[0, 3.2, 0.32]}>
        <mesh>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#c6a76a" />
        </mesh>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => (
          <group key={i} rotation={[0, 0, angle]}>
            <mesh position={[0, 0.9, 0]}>
              <boxGeometry args={[0.08, 1.8, 0.02]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// Custom Animated Quantum Observatory
function ObservatoryMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.8;
      ringRef.current.rotation.y += delta * 1.2;
    }
  });

  return (
    <group position={position}>
      {/* Base Foundation */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.6, 2.0, 1.0, 12]} />
        <meshStandardMaterial color={isSelected ? '#c6a76a' : '#2b362c'} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Dome */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[1.3, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#738c9c" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Telescope Aperture */}
      <mesh position={[0.4, 2.0, 0.5]} rotation={[0.6, 0.4, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 1.4, 12]} />
        <meshStandardMaterial color="#1a241b" roughness={0.3} />
      </mesh>
      {/* Quantum Particle Ring */}
      <mesh ref={ringRef} position={[0, 2.2, 0]}>
        <torusGeometry args={[1.8, 0.05, 8, 24]} />
        <meshStandardMaterial color="#a6bd82" emissive="#a6bd82" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// Custom Arcology Spire
function ArcologyTowerMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.2, 1.4, 2.2]} />
        <meshStandardMaterial color={isSelected ? '#c6a76a' : '#2d382e'} roughness={0.6} />
      </mesh>
      {/* Mid Tower */}
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[1.6, 2.0, 1.6]} />
        <meshStandardMaterial color="#3b4a3c" roughness={0.4} />
      </mesh>
      {/* Upper Spire */}
      <mesh position={[0, 4.2, 0]}>
        <boxGeometry args={[1.0, 1.6, 1.0]} />
        <meshStandardMaterial color="#4a5d4c" roughness={0.3} />
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 5.5, 0]}>
        <cylinderGeometry args={[0.03, 0.08, 1.2, 6]} />
        <meshStandardMaterial color="#c6a76a" emissive="#c6a76a" emissiveIntensity={0.6} />
      </mesh>
      {/* Glowing Window Strips */}
      <mesh position={[0, 2.4, 0.81]}>
        <planeGeometry args={[1.2, 1.6]} />
        <meshBasicMaterial color="#d4e8b8" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

// Custom Hydroponic Bio-Dome
function HydroponicMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      {/* Base ring */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.9, 2.1, 0.6, 12]} />
        <meshStandardMaterial color={isSelected ? '#c6a76a' : '#334034'} />
      </mesh>
      {/* Geodesic Dome */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[1.8, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#94b883" transparent opacity={0.65} roughness={0.1} />
      </mesh>
      {/* Internal crops / light column */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.6, 1.0, 0.8, 8]} />
        <meshStandardMaterial color="#4d733b" emissive="#5e8c47" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// Custom Nanofab Foundry
function FactoryMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      {/* Main Shed */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2.8, 1.6, 2.2]} />
        <meshStandardMaterial color={isSelected ? '#c6a76a' : '#38332e'} roughness={0.7} />
      </mesh>
      {/* Cooling Smokestack 1 */}
      <mesh position={[-0.8, 1.8, 0.6]}>
        <cylinderGeometry args={[0.3, 0.45, 1.6, 8]} />
        <meshStandardMaterial color="#473f37" roughness={0.6} />
      </mesh>
      {/* Cooling Smokestack 2 */}
      <mesh position={[-0.8, 1.8, -0.6]}>
        <cylinderGeometry args={[0.3, 0.45, 1.6, 8]} />
        <meshStandardMaterial color="#473f37" roughness={0.6} />
      </mesh>
      {/* Crane arm */}
      <mesh position={[0.7, 1.9, 0]}>
        <boxGeometry args={[1.4, 0.15, 0.2]} />
        <meshStandardMaterial color="#c6a76a" />
      </mesh>
    </group>
  );
}

// Custom Solar Array Field
function SolarArrayMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[2.6, 0.2, 2.0]} />
        <meshStandardMaterial color={isSelected ? '#c6a76a' : '#283329'} />
      </mesh>
      {[-0.6, 0.6].map((x, i) =>
        [-0.5, 0.5].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.5, z]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[1.0, 0.08, 0.7]} />
            <meshStandardMaterial color="#1f364d" metalness={0.9} roughness={0.1} />
          </mesh>
        ))
      )}
    </group>
  );
}

// Custom Planetary Citadel
function CitadelMesh({ position, isSelected }: { position: [number, number, number]; isSelected: boolean }) {
  return (
    <group position={position}>
      {/* Ground Bastion */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[2.4, 3.0, 1.2, 8]} />
        <meshStandardMaterial color={isSelected ? '#c6a76a' : '#232c24'} roughness={0.4} />
      </mesh>
      {/* Upper Keep */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[1.6, 2.0, 1.4, 8]} />
        <meshStandardMaterial color="#364337" roughness={0.4} />
      </mesh>
      {/* Crown Spire */}
      <mesh position={[0, 3.2, 0]}>
        <coneGeometry args={[1.0, 1.8, 8]} />
        <meshStandardMaterial color="#c6a76a" metalness={0.8} roughness={0.2} emissive="#c6a76a" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// Building Renderer Wrapper
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

  const renderMesh = () => {
    switch (building.modelType) {
      case 'turbine':
        return <WindTurbineMesh position={pos} isSelected={isSelected} />;
      case 'observatory':
        return <ObservatoryMesh position={pos} isSelected={isSelected} />;
      case 'tower':
        return <ArcologyTowerMesh position={pos} isSelected={isSelected} />;
      case 'hydroponic':
      case 'dome':
        return <HydroponicMesh position={pos} isSelected={isSelected} />;
      case 'factory':
        return <FactoryMesh position={pos} isSelected={isSelected} />;
      case 'solar':
        return <SolarArrayMesh position={pos} isSelected={isSelected} />;
      case 'citadel':
      default:
        return <CitadelMesh position={pos} isSelected={isSelected} />;
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
      <group scale={isDimmed ? 0.75 : hovered ? 1.05 : 1.0}>
        {renderMesh()}
      </group>

      {/* Selection Glow Ring */}
      {isSelected && (
        <mesh position={[building.x, 0.05, building.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.4, 2.7, 32]} />
          <meshBasicMaterial color="#c6a76a" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Floating Name Label on hover or selected */}
      {(hovered || isSelected) && (
        <Html position={[building.x, building.y + 4.2, building.z]} center distanceFactor={28}>
          <div className="pointer-events-none px-2.5 py-1 rounded bg-[#151916]/90 border border-[#c6a76a] text-xs font-semibold text-[#e8e9e3] whitespace-nowrap shadow-xl flex items-center gap-1.5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#a6bd82]" />
            <span>{building.name}</span>
            <span className="text-[10px] text-[#c6a76a]">Lvl {building.level}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

// Procedural Low-Poly Terrain & River
function WorldTerrain({ activeLayer }: { activeLayer: MapLayer }) {
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(110, 110, 48, 48);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      
      // River trench cutting along curved path
      const riverCenter = Math.sin(vx * 0.06) * 12;
      const distFromRiver = Math.abs(vy - riverCenter);

      let height = 0;
      if (distFromRiver < 6) {
        // River bed
        height = -1.2 + (distFromRiver / 6) * 0.8;
      } else {
        // Natural rolling hills & mountain ridges
        const hill1 = Math.sin(vx * 0.08) * Math.cos(vy * 0.08) * 2.2;
        const mountainRidge = Math.sin(vx * 0.03 + 2.0) * Math.cos(vy * 0.03) * 4.5;
        height = Math.max(0.1, hill1 + mountainRidge);
      }
      pos.setZ(i, height);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      {/* Land Surface */}
      <mesh geometry={terrainGeo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <meshStandardMaterial
          color={activeLayer === 'environment' ? '#2e4530' : '#222b23'}
          roughness={0.85}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* River Water Surface */}
      <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[110, 20]} />
        <meshStandardMaterial
          color="#385b63"
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Stone River Bridges */}
      {[-15, 12].map((bx, i) => (
        <mesh key={i} position={[bx, 0.4, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[4.2, 0.4, 14]} />
          <meshStandardMaterial color="#475449" roughness={0.7} />
        </mesh>
      ))}

      {/* Procedural Pine Forest Clusters */}
      {useMemo(() => {
        const trees = [
          [-40, 32], [-36, 36], [-44, 28], [-42, 38],
          [38, 30], [42, 34], [35, 26], [40, 22],
          [-12, -38], [-18, -34], [-10, -42],
        ];
        return trees.map(([tx, tz], i) => (
          <group key={i} position={[tx, 1.2, tz]}>
            {/* Trunk */}
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.1, 0.15, 0.8, 6]} />
              <meshStandardMaterial color="#2d2218" />
            </mesh>
            {/* Foliage Cone 1 */}
            <mesh position={[0, 1.2, 0]}>
              <coneGeometry args={[0.9, 1.4, 6]} />
              <meshStandardMaterial color="#1e3422" roughness={0.8} />
            </mesh>
            {/* Foliage Cone 2 */}
            <mesh position={[0, 2.0, 0]}>
              <coneGeometry args={[0.65, 1.1, 6]} />
              <meshStandardMaterial color="#28422c" roughness={0.8} />
            </mesh>
          </group>
        ));
      }, [])}
    </group>
  );
}

// District Boundary Projection Rings
function DistrictOverlays() {
  const { districts, activeLayer } = useGameState();

  if (activeLayer !== 'all' && activeLayer !== 'population' && activeLayer !== 'economy') {
    return null;
  }

  return (
    <group>
      {districts.map((dist) => (
        <group key={dist.id} position={[dist.x, 0.12, dist.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[dist.radius - 0.4, dist.radius, 48]} />
            <meshBasicMaterial color={dist.color} transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
          <Text
            position={[0, 0.2, -dist.radius + 1.8]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={1.4}
            color={dist.color}
            anchorX="center"
            anchorY="middle"
          >
            {dist.name.toUpperCase()}
          </Text>
        </group>
      ))}
    </group>
  );
}

// Construction Placement Plane
function ConstructionPlacementPlane() {
  const { isConstructionMode, selectedCatalogItem, placeBuilding } = useGameState();
  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(null);

  if (!isConstructionMode || !selectedCatalogItem) return null;

  return (
    <group>
      {/* Invisible raycast surface */}
      <mesh
        position={[0, 0.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={(e) => {
          e.stopPropagation();
          setGhostPos([e.point.x, 0.5, e.point.z]);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (ghostPos) {
            placeBuilding(selectedCatalogItem.id, ghostPos[0], ghostPos[2]);
          }
        }}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Holographic Ghost Building */}
      {ghostPos && (
        <group position={ghostPos}>
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[2.5, 2.5, 2.5]} />
            <meshBasicMaterial color="#a6bd82" transparent opacity={0.45} wireframe />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 2.2, 32]} />
            <meshBasicMaterial color="#a6bd82" side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, 3.2, 0]} center>
            <div className="pointer-events-none px-3 py-1 bg-[#1c231d] border border-[#a6bd82] text-xs font-bold text-[#dce9ca] rounded shadow-lg whitespace-nowrap">
              Click terrain to construct {selectedCatalogItem.name}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

// Camera Preset Controller
export function CameraHUD() {
  const controlsRef = useRef<any>(null);

  const setView = (x: number, y: number, z: number) => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(x, y, z);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={18}
        maxDistance={85}
        dampingFactor={0.06}
        enableDamping
      />
      {/* Presets are handled via HTML overlay in WorldExplorerPage */}
    </>
  );
}

export default function CivilizationWorld3D() {
  const { placedBuildings, selectedBuildingId, selectBuilding, activeLayer } = useGameState();

  return (
    <div className="w-full h-full relative bg-[#151916] select-none">
      <Canvas
        camera={{ position: [38, 34, 46], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        onPointerDown={(e) => {
          // Deselect if clicking on empty terrain background
          if ((e.target as any).tagName === 'CANVAS') {
            // allows background click
          }
        }}
      >
        <color attach="background" args={['#151916']} />
        <fog attach="fog" args={['#151916', 55, 110]} />

        {/* Cinematic Game Lighting */}
        <ambientLight intensity={0.7} color="#d4ded0" />
        <directionalLight
          position={[45, 60, 25]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          color="#fdfbee"
        />
        <directionalLight position={[-35, 25, -35]} intensity={0.4} color="#7ba085" />

        {/* Low-Poly Landscape & River */}
        <WorldTerrain activeLayer={activeLayer} />

        {/* District Ground Projection Rings */}
        <DistrictOverlays />

        {/* 3D Placed Buildings */}
        {placedBuildings.map((building) => (
          <BuildingObject
            key={building.id}
            building={building}
            isSelected={selectedBuildingId === building.id}
            onSelect={() => selectBuilding(building.id)}
            activeLayer={activeLayer}
          />
        ))}

        {/* Placement Raycast Cursor */}
        <ConstructionPlacementPlane />

        {/* Camera Orbit */}
        <CameraHUD />
      </Canvas>
    </div>
  );
}

