import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingCategory } from '../../../types/game';

interface ConstructionStageModelProps {
  progress: number; // 0 - 100
  category: BuildingCategory;
  modelType: string;
  isSelected?: boolean;
}

export default function ConstructionStageModel({
  progress = 0,
  category,
  modelType,
  isSelected = false,
}: ConstructionStageModelProps) {
  const craneArmRef = useRef<THREE.Group>(null);
  const hookCableRef = useRef<THREE.Group>(null);
  const sparkRef = useRef<THREE.PointLight>(null);
  const beaconRef = useRef<THREE.Mesh>(null);

  // Normalize progress
  const p = Math.max(0, Math.min(100, progress));

  // Determine active stage
  // Stage 1: 0 - 25% (Excavation & Footing)
  // Stage 2: 25 - 55% (Structural Steel Framing)
  // Stage 3: 55 - 85% (Wall Enclosure & Fitout)
  // Stage 4: 85 - 100% (Roofing & Commissioning)
  const stage = p < 25 ? 1 : p < 55 ? 2 : p < 85 ? 3 : 4;

  const stageTitles = [
    'Stage 1: Groundwork & Footing',
    'Stage 2: Structural Framing',
    'Stage 3: Enclosure & Glazing',
    'Stage 4: Commissioning & Detailing',
  ];

  // Animated elements (crane boom swiveling, hook cable swaying, welder sparking)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (craneArmRef.current) {
      craneArmRef.current.rotation.y = Math.sin(t * 0.7) * 1.2 + 0.3;
    }

    if (hookCableRef.current) {
      hookCableRef.current.position.y = -0.4 + Math.sin(t * 1.5) * 0.25;
    }

    if (sparkRef.current) {
      const flicker = Math.sin(t * 24) > 0.6 && Math.cos(t * 18) > 0.2;
      sparkRef.current.intensity = flicker ? 2.5 : 0.05;
    }

    if (beaconRef.current) {
      const flash = Math.sin(t * 6) > 0.3;
      (beaconRef.current.material as THREE.MeshBasicMaterial).opacity = flash ? 1.0 : 0.2;
    }
  });

  return (
    <group>
      {/* 1. EXCAVATED GROUND PIT & GRAVEL FOOTING */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.16, 3.2]} />
        <meshStandardMaterial color="#3e2723" roughness={0.95} />
      </mesh>

      {/* Concrete Base Slab */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.2, 2.8]} />
        <meshStandardMaterial color="#78909c" roughness={0.7} />
      </mesh>

      {/* Safety Hazard Perimeter Bollards with Striped Tape */}
      {[
        [-1.7, -1.5],
        [1.7, -1.5],
        [-1.7, 1.5],
        [1.7, 1.5],
        [0, -1.5],
        [0, 1.5],
      ].map(([bx, bz], i) => (
        <group key={`bollard-${i}`} position={[bx, 0.15, bz]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#e67e22' : '#f1c40f'} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Staged Construction Materials: Pallet of bricks & rebar coils */}
      <group position={[1.2, 0.35, 1.0]}>
        {/* Wooden pallet */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.7, 0.08, 0.7]} />
          <meshStandardMaterial color="#8d6e63" roughness={0.8} />
        </mesh>
        {/* Concrete block stack */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.55, 0.22, 0.55]} />
          <meshStandardMaterial color="#90a4ae" roughness={0.6} />
        </mesh>
      </group>

      {/* Rebar bundle on the left */}
      <group position={[-1.2, 0.35, 1.0]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.8, 0.06, 0.4]} />
          <meshStandardMaterial color="#8d6e63" />
        </mesh>
        <mesh position={[0, 0.16, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.7, 8]} />
          <meshStandardMaterial color="#546e7a" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* STAGE 1 (0-25%): Foundation Rebar Rods & Footing Columns */}
      {/* ======================================================== */}
      {stage === 1 && (
        <group>
          {/* Vertical rebar cages protruding from foundation slab */}
          {[-0.9, 0, 0.9].map((rx, xi) =>
            [-0.7, 0.7].map((rz, zi) => (
              <group key={`rebar-${xi}-${zi}`} position={[rx, 0.3, rz]}>
                <mesh position={[0, 0.45, 0]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.9, 6]} />
                  <meshStandardMaterial color="#455a64" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[0.04, 0.45, 0.04]}>
                  <cylinderGeometry args={[0.02, 0.02, 0.85, 6]} />
                  <meshStandardMaterial color="#455a64" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>
            ))
          )}
        </group>
      )}

      {/* ======================================================== */}
      {/* STAGE 2 (25-55%): Structural Steel Framing & First Floor */}
      {/* ======================================================== */}
      {stage >= 2 && (
        <group>
          {/* Main vertical steel I-beam columns */}
          {[-1.1, 1.1].map((cx, ci) =>
            [-0.9, 0.9].map((cz, czi) => (
              <mesh key={`col-${ci}-${czi}`} position={[cx, 1.1, cz]} castShadow>
                <boxGeometry args={[0.16, 1.8, 0.16]} />
                <meshStandardMaterial color="#37474f" metalness={0.7} roughness={0.3} />
              </mesh>
            ))
          )}

          {/* Horizontal cross-girders */}
          <mesh position={[0, 1.9, -0.9]} castShadow>
            <boxGeometry args={[2.36, 0.14, 0.14]} />
            <meshStandardMaterial color="#455a64" metalness={0.7} />
          </mesh>
          <mesh position={[0, 1.9, 0.9]} castShadow>
            <boxGeometry args={[2.36, 0.14, 0.14]} />
            <meshStandardMaterial color="#455a64" metalness={0.7} />
          </mesh>
          <mesh position={[-1.1, 1.9, 0]} castShadow>
            <boxGeometry args={[0.14, 0.14, 1.94]} />
            <meshStandardMaterial color="#455a64" metalness={0.7} />
          </mesh>
          <mesh position={[1.1, 1.9, 0]} castShadow>
            <boxGeometry args={[0.14, 0.14, 1.94]} />
            <meshStandardMaterial color="#455a64" metalness={0.7} />
          </mesh>

          {/* First Floor Concrete Slab */}
          <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 0.15, 2.0]} />
            <meshStandardMaterial color="#90a4ae" roughness={0.6} />
          </mesh>

          {/* Central Concrete Elevator / Utility Core */}
          <mesh position={[0, 1.3, 0]} castShadow>
            <boxGeometry args={[0.8, 2.2, 0.8]} />
            <meshStandardMaterial color="#78909c" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* ======================================================== */}
      {/* STAGE 3 (55-85%): Precast Wall Panels & Scaffolding Net */}
      {/* ======================================================== */}
      {stage >= 3 && (
        <group>
          {/* Ground floor exterior precast wall panels installed */}
          <mesh position={[-0.7, 0.6, 0.98]} castShadow>
            <boxGeometry args={[0.9, 0.8, 0.08]} />
            <meshStandardMaterial color="#cfd8dc" roughness={0.4} />
          </mesh>
          <mesh position={[0.7, 0.6, 0.98]} castShadow>
            <boxGeometry args={[0.9, 0.8, 0.08]} />
            <meshStandardMaterial color="#cfd8dc" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.6, -0.98]} castShadow>
            <boxGeometry args={[2.3, 0.8, 0.08]} />
            <meshStandardMaterial color="#cfd8dc" roughness={0.4} />
          </mesh>

          {/* Window Glazing in Progress */}
          <mesh position={[0, 0.65, 0.98]}>
            <planeGeometry args={[0.45, 0.6]} />
            <meshStandardMaterial
              color="#80deea"
              transparent
              opacity={0.65}
              roughness={0.1}
            />
          </mesh>

          {/* Upper Floor Structural Deck */}
          <mesh position={[0, 1.95, 0]} castShadow>
            <boxGeometry args={[2.3, 0.15, 1.9]} />
            <meshStandardMaterial color="#90a4ae" roughness={0.6} />
          </mesh>

          {/* Exterior Modular Scaffolding with Safety Railings */}
          <group position={[1.35, 1.0, 0]}>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.3, 2.0, 2.2]} />
              <meshBasicMaterial color="#e67e22" wireframe transparent opacity={0.5} />
            </mesh>
          </group>

          {/* Active Welder Spark Effect */}
          <group position={[-1.0, 1.88, 0.85]}>
            <pointLight ref={sparkRef} color="#74b9ff" distance={4.5} intensity={1.5} />
            <mesh>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        </group>
      )}

      {/* ======================================================== */}
      {/* STAGE 4 (85-100%): Roof Truss & Holographic Commissioning */}
      {/* ======================================================== */}
      {stage >= 4 && (
        <group>
          {/* Upper floor precast walls */}
          <mesh position={[0, 1.5, 0.95]} castShadow>
            <boxGeometry args={[2.2, 0.8, 0.08]} />
            <meshStandardMaterial color="#eceff1" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.5, -0.95]} castShadow>
            <boxGeometry args={[2.2, 0.8, 0.08]} />
            <meshStandardMaterial color="#eceff1" roughness={0.4} />
          </mesh>

          {/* Roof Cap Structure */}
          <mesh position={[0, 2.3, 0]} castShadow>
            <boxGeometry args={[2.4, 0.16, 2.0]} />
            <meshStandardMaterial color="#37474f" roughness={0.5} />
          </mesh>

          {/* Green Holographic Alignment Grid */}
          <mesh position={[0, 2.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.0, 1.6, 24]} />
            <meshBasicMaterial color="#2ecc71" wireframe side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* ======================================================== */}
      {/* TOWER CRANE (Stages 2, 3, 4)                            */}
      {/* ======================================================== */}
      {stage >= 2 && (
        <group position={[-1.3, 0.2, -1.1]}>
          {/* Crane Mast (Vertical Truss Column) */}
          <mesh position={[0, 1.8, 0]} castShadow>
            <boxGeometry args={[0.22, 3.6, 0.22]} />
            <meshStandardMaterial color="#f39c12" metalness={0.6} roughness={0.4} />
          </mesh>

          {/* Swiveling Crane Arm & Turntable */}
          <group ref={craneArmRef} position={[0, 3.6, 0]}>
            {/* Operator Cab */}
            <mesh position={[0.18, -0.15, 0]}>
              <boxGeometry args={[0.26, 0.35, 0.26]} />
              <meshStandardMaterial color="#2c3e50" roughness={0.3} />
            </mesh>

            {/* Main Forward Jib (Horizontal boom arm) */}
            <mesh position={[1.4, 0.12, 0]} castShadow>
              <boxGeometry args={[2.8, 0.18, 0.18]} />
              <meshStandardMaterial color="#f39c12" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Rear Counterweight Jib */}
            <mesh position={[-0.65, 0.12, 0]} castShadow>
              <boxGeometry args={[1.3, 0.18, 0.18]} />
              <meshStandardMaterial color="#f39c12" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Concrete Counterweight Blocks */}
            <mesh position={[-1.0, 0.05, 0]} castShadow>
              <boxGeometry args={[0.4, 0.35, 0.3]} />
              <meshStandardMaterial color="#546e7a" roughness={0.8} />
            </mesh>

            {/* Top Apex Mast & Guy Wires */}
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.03, 0.08, 0.7, 4]} />
              <meshStandardMaterial color="#f39c12" />
            </mesh>

            {/* Flashing Aircraft Warning Beacon */}
            <mesh ref={beaconRef} position={[0, 0.85, 0]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color="#e74c3c" transparent />
            </mesh>

            {/* Hoist Trolley & Cable with Cargo */}
            <group position={[1.8, 0, 0]}>
              {/* Trolley */}
              <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[0.25, 0.1, 0.22]} />
                <meshStandardMaterial color="#2c3e50" />
              </mesh>
              {/* Steel Cable */}
              <mesh position={[0, -0.6, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 1.1, 4]} />
                <meshStandardMaterial color="#b0bec5" metalness={0.9} />
              </mesh>
              {/* Hoist Hook and Suspended Steel I-Beam */}
              <group ref={hookCableRef} position={[0, -1.15, 0]}>
                <mesh>
                  <boxGeometry args={[0.1, 0.1, 0.1]} />
                  <meshStandardMaterial color="#f39c12" />
                </mesh>
                <mesh position={[0, -0.15, 0]} rotation={[0, 0.4, 0]}>
                  <boxGeometry args={[1.1, 0.1, 0.1]} />
                  <meshStandardMaterial color="#37474f" metalness={0.8} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      )}

      {/* ======================================================== */}
      {/* 3D FLOATING HOLOGRAPHIC PROGRESS HUD                     */}
      {/* ======================================================== */}
      <group position={[0, 3.8, 0]}>
        <Html
          position={[0, 0, 0]}
          center
          distanceFactor={18}
          zIndexRange={[100, 0]}
          transform={false}
        >
          <div
            className={`pointer-events-none select-none transition-all duration-200 flex flex-col items-center ${
              isSelected ? 'scale-110' : 'scale-95'
            }`}
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121814]/95 border-2 border-[#f39c12] shadow-xl backdrop-blur-md">
              {/* Spinning circular spinner */}
              <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-[#f39c12] animate-spin" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-black text-[#f1c40f] tracking-wider leading-none">
                  {p.toFixed(0)}%
                </span>
                <span className="text-[8px] font-sans font-bold text-[#e0e0e0] leading-none mt-0.5">
                  {stageTitles[stage - 1]}
                </span>
              </div>
            </div>

            {/* Little downward pointer pip */}
            <div className="w-1.5 h-1.5 bg-[#f39c12] rotate-45 -mt-1 shadow-md" />
          </div>
        </Html>
      </group>
    </group>
  );
}

