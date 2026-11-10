import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGameState } from '../../context/GameStateContext';
import { useIsNight } from './DayNightController';
import { getTerrainHeight } from './Terrain';
import { soundFx } from '../../services/soundFx';

export default function CivilizationEvolutionStageMonument() {
  const { evolutionReport, setActiveDrawer } = useGameState();
  const isNight = useIsNight();
  const [hovered, setHovered] = useState(false);

  const stage = evolutionReport.currentStage;
  const stageId = stage.id;

  // Placement in the Elysium Civic Forum (x: -7.0, z: 9.0)
  const monumentX = -7.0;
  const monumentZ = 9.0;
  const groundY = useMemo(() => getTerrainHeight(monumentX, monumentZ), []);

  // Animation references
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Floating quantum core bobbing & rotation for advanced stage
    if (coreRef.current) {
      coreRef.current.position.y = 4.2 + Math.sin(t * 1.8) * 0.25;
      coreRef.current.rotation.y = t * 0.7;
      coreRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    }

    // Holographic ring rotations for Metropolis & Advanced stages
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y = t * 1.2;
      ring1Ref.current.rotation.x = Math.sin(t * 0.8) * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.9;
      ring2Ref.current.rotation.z = Math.cos(t * 0.7) * 0.3;
    }

    // Pulsing beacon light
    if (beaconRef.current) {
      beaconRef.current.intensity = isNight ? 1.8 + Math.sin(t * 4) * 0.7 : 0.6;
    }
  });

  const handleClick = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    soundFx.playHeroicFanfare();
    setActiveDrawer('evolution');
  };

  return (
    <group
      position={[monumentX, groundY, monumentZ]}
      onClick={handleClick}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Universal Monument Dais Plinth (Skirts into terrain to prevent floating) */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[3.2, 3.6, 0.5, 8]} />
        <meshStandardMaterial
          color="#222823"
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.42, 0]} receiveShadow>
        <cylinderGeometry args={[2.7, 3.0, 0.25, 8]} />
        <meshStandardMaterial
          color="#333d35"
          roughness={0.5}
          metalness={0.4}
        />
      </mesh>

      {/* Interactive Selection Highlight Ring */}
      {hovered && (
        <mesh position={[0, 0.56, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.75, 2.95, 32]} />
          <meshBasicMaterial color="#c6a76a" transparent opacity={0.8} />
        </mesh>
      )}

      {/* ================= STAGE 1: SETTLEMENT — EXPEDITION BEACON & SURVEY MAST ================= */}
      {stageId === 'settlement' && (
        <group position={[0, 0.55, 0]}>
          {/* Central tripod hub */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.2, 0.3, 2.4, 6]} />
            <meshStandardMaterial color="#4a554d" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* 3 Angled support legs */}
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((ang, i) => (
            <mesh
              key={i}
              position={[Math.cos(ang) * 0.9, 0.9, Math.sin(ang) * 0.9]}
              rotation={[0, -ang, 0.4]}
            >
              <cylinderGeometry args={[0.08, 0.1, 2.1, 6]} />
              <meshStandardMaterial color="#37413a" metalness={0.7} />
            </mesh>
          ))}
          {/* Parabolic Solar Transceiver */}
          <mesh position={[0, 2.5, 0]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.2, 0.25, 12]} />
            <meshStandardMaterial color="#c6a76a" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Survey Antenna & Beacon Light */}
          <mesh position={[0, 3.2, 0]}>
            <cylinderGeometry args={[0.03, 0.05, 1.2, 6]} />
            <meshStandardMaterial color="#d4ded5" metalness={0.9} />
          </mesh>
          <mesh position={[0, 3.8, 0]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial
              color="#ffb732"
              emissive="#ff9900"
              emissiveIntensity={isNight ? 2.5 : 1.0}
            />
          </mesh>
          <pointLight
            ref={beaconRef}
            position={[0, 3.8, 0]}
            color="#ff9900"
            distance={16}
            intensity={isNight ? 2 : 0.8}
          />
        </group>
      )}

      {/* ================= STAGE 2: VILLAGE — COMMEMORATIVE OBELISK & BRAZIERS ================= */}
      {stageId === 'village' && (
        <group position={[0, 0.55, 0]}>
          {/* Stepped Granite Base */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1.8, 0.8, 1.8]} />
            <meshStandardMaterial color="#424c44" roughness={0.7} />
          </mesh>
          {/* Tapered Monolith Stele */}
          <mesh position={[0, 2.4, 0]} rotation={[0, Math.PI / 4, 0]}>
            <cylinderGeometry args={[0.5, 0.9, 3.2, 4]} />
            <meshStandardMaterial color="#505d53" roughness={0.6} metalness={0.2} />
          </mesh>
          {/* Pyramidion Capstone */}
          <mesh position={[0, 4.3, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.7, 0.8, 4]} />
            <meshStandardMaterial color="#c6a76a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* 4 Corner Ceremonial Braziers */}
          {[-1.2, 1.2].flatMap((bx) =>
            [-1.2, 1.2].map((bz) => (
              <group key={`${bx}-${bz}`} position={[bx, 0.3, bz]}>
                <mesh position={[0, 0.35, 0]}>
                  <cylinderGeometry args={[0.22, 0.28, 0.7, 8]} />
                  <meshStandardMaterial color="#303832" metalness={0.8} />
                </mesh>
                <mesh position={[0, 0.75, 0]}>
                  <sphereGeometry args={[0.15, 8, 8]} />
                  <meshStandardMaterial
                    color="#ff7722"
                    emissive="#ff5500"
                    emissiveIntensity={isNight ? 2.2 : 0.9}
                  />
                </mesh>
              </group>
            ))
          )}
        </group>
      )}

      {/* ================= STAGE 3: TOWN — CIVIC CLOCKWORK BELFRY & COLONNADE ================= */}
      {stageId === 'town' && (
        <group position={[0, 0.55, 0]}>
          {/* Circular stepped dais */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[2.4, 2.5, 0.4, 16]} />
            <meshStandardMaterial color="#4d5a50" roughness={0.5} />
          </mesh>
          {/* 4 Classical Columns */}
          {[
            [1.2, 1.2],
            [-1.2, 1.2],
            [1.2, -1.2],
            [-1.2, -1.2],
          ].map(([cx, cz], i) => (
            <mesh key={i} position={[cx, 1.6, cz]}>
              <cylinderGeometry args={[0.16, 0.2, 2.6, 12]} />
              <meshStandardMaterial color="#d1dcd3" roughness={0.4} />
            </mesh>
          ))}
          {/* Dome & Architrave */}
          <mesh position={[0, 3.0, 0]}>
            <cylinderGeometry args={[1.9, 1.9, 0.3, 16]} />
            <meshStandardMaterial color="#424d45" metalness={0.5} />
          </mesh>
          <mesh position={[0, 3.7, 0]}>
            <sphereGeometry args={[1.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#c6a76a" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Central Armillary Sphere */}
          <mesh position={[0, 1.5, 0]}>
            <torusGeometry args={[0.6, 0.05, 8, 24]} />
            <meshStandardMaterial color="#e0be70" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* ================= STAGE 4: CITY — TRIUMPHAL ARCH OF PROGRESS ================= */}
      {stageId === 'city' && (
        <group position={[0, 0.55, 0]}>
          {/* Left Pylon */}
          <mesh position={[-1.4, 2.2, 0]}>
            <boxGeometry args={[0.9, 4.2, 1.4]} />
            <meshStandardMaterial color="#3e4a41" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Right Pylon */}
          <mesh position={[1.4, 2.2, 0]}>
            <boxGeometry args={[0.9, 4.2, 1.4]} />
            <meshStandardMaterial color="#3e4a41" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Arch Span */}
          <mesh position={[0, 4.2, 0]}>
            <boxGeometry args={[3.8, 0.8, 1.5]} />
            <meshStandardMaterial color="#2c352f" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Glowing Vector Keystone */}
          <mesh position={[0, 3.6, 0]}>
            <octahedronGeometry args={[0.45]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00b4d8"
              emissiveIntensity={isNight ? 2.5 : 1.2}
            />
          </mesh>
          {/* Top Attic Cornice & Laurel Crest */}
          <mesh position={[0, 4.8, 0]}>
            <boxGeometry args={[3.4, 0.5, 1.2]} />
            <meshStandardMaterial color="#c6a76a" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* ================= STAGE 5: METROPOLIS — SKYWARD NEEDLE & HOLOGRAPHIC RINGS ================= */}
      {stageId === 'metropolis' && (
        <group position={[0, 0.55, 0]}>
          {/* High-tech Spire Base */}
          <mesh position={[0, 1.0, 0]}>
            <cylinderGeometry args={[0.8, 1.4, 1.8, 8]} />
            <meshStandardMaterial color="#1f2722" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Slender Titanium Spire Needle */}
          <mesh position={[0, 3.6, 0]}>
            <cylinderGeometry args={[0.1, 0.6, 3.8, 8]} />
            <meshStandardMaterial color="#2d3a31" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 5.8, 0]}>
            <cylinderGeometry args={[0.02, 0.1, 1.6, 6]} />
            <meshStandardMaterial color="#a6bd82" metalness={0.9} />
          </mesh>
          {/* Rotating Holographic Stage Rings */}
          <group ref={ring1Ref} position={[0, 3.5, 0]}>
            <mesh>
              <torusGeometry args={[1.5, 0.05, 8, 32]} />
              <meshStandardMaterial
                color="#00f5d4"
                emissive="#00f5d4"
                emissiveIntensity={isNight ? 2.0 : 1.0}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>
          <group ref={ring2Ref} position={[0, 4.3, 0]}>
            <mesh>
              <torusGeometry args={[1.1, 0.04, 8, 32]} />
              <meshStandardMaterial
                color="#c6a76a"
                emissive="#ffbe3b"
                emissiveIntensity={isNight ? 2.0 : 1.0}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* ================= STAGE 6: ADVANCED CIVILIZATION — PLANETARY QUANTUM NEXUS ================= */}
      {stageId === 'advanced_civilization' && (
        <group position={[0, 0.55, 0]}>
          {/* Magnetic Induction Ring Cradle */}
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[1.8, 2.2, 0.8, 12]} />
            <meshStandardMaterial color="#161e18" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* 3 Levitation Pylons */}
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((ang, i) => (
            <mesh
              key={i}
              position={[Math.cos(ang) * 1.5, 2.0, Math.sin(ang) * 1.5]}
              rotation={[0, -ang, 0.25]}
            >
              <boxGeometry args={[0.3, 2.6, 0.4]} />
              <meshStandardMaterial color="#2d3f32" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
          {/* Levitating Polyhedral Quantum Nexus Core */}
          <mesh ref={coreRef} position={[0, 4.2, 0]}>
            <octahedronGeometry args={[1.1]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00b4d8"
              emissiveIntensity={isNight ? 3.0 : 1.5}
              roughness={0.1}
              metalness={0.8}
            />
          </mesh>
          {/* Concentric Spinning Data Halo */}
          <group ref={ring1Ref} position={[0, 4.2, 0]}>
            <mesh>
              <torusGeometry args={[2.0, 0.06, 8, 36]} />
              <meshStandardMaterial
                color="#70e000"
                emissive="#70e000"
                emissiveIntensity={isNight ? 2.5 : 1.2}
                transparent
                opacity={0.9}
              />
            </mesh>
          </group>
          {/* Skyward Ascension Light Beam */}
          <mesh position={[0, 18, 0]}>
            <cylinderGeometry args={[0.2, 0.3, 26, 12]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={isNight ? 0.45 : 0.2} />
          </mesh>
        </group>
      )}

      {/* Floating Tactical 3D HUD Badge */}
      <Html
        position={[0, stageId === 'advanced_civilization' ? 6.2 : stageId === 'metropolis' ? 6.8 : 4.8, 0]}
        center
        distanceFactor={32}
        zIndexRange={[100, 0]}
      >
        <div
          onClick={handleClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all select-none cursor-pointer ${
            hovered
              ? 'bg-[#18231a]/95 border-[#c6a76a] scale-105 text-[#f5f7f2]'
              : 'bg-[#121914]/90 border-[#3d4f40] text-[#dce9ca]'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-[#c6a76a] animate-ping" />
          <div className="text-left font-mono">
            <span className="block text-[8px] uppercase tracking-wider text-[#a6bd82] font-bold">
              CIVILIZATION STAGE {stage.order} / 6
            </span>
            <span className="text-xs font-bold text-[#f5f7f2] whitespace-nowrap">
              {stage.name} Monument
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}
