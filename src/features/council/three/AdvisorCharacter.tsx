import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Advisor } from '../types/advisor';
import { AdvisorSeatConfig } from './Council3DTypes';
import { soundFx } from '../../../services/soundFx';

export const ADVISOR_MODEL_PATHS: Record<string, string> = {
  'adv-chancellor': '/models/council/adv_chancellor.glb',
  'adv-treasurer': '/models/council/adv_treasurer.glb',
  'adv-scholar': '/models/council/adv_scholar.glb',
  'adv-architect': '/models/council/adv_architect.glb',
  'adv-physician': '/models/council/adv_physician.glb',
  'adv-keeper': '/models/council/adv_keeper.glb',
};

interface AdvisorCharacterModelProps {
  modelPath: string;
  isSpeaking: boolean;
  prefersReducedMotion: boolean;
  seed: number;
}

const AdvisorCharacterModel: React.FC<AdvisorCharacterModelProps> = ({
  modelPath,
  isSpeaking,
  prefersReducedMotion,
  seed,
}) => {
  const { scene } = useGLTF(modelPath);

  // Deep clone so each advisor instance has independent transforms and material states
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // Target animation joints in the realistic GLTF hierarchy
  const torsoNode = useRef<THREE.Object3D | null>(null);
  const headNode = useRef<THREE.Object3D | null>(null);
  const rightArmNode = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    torsoNode.current = clonedScene.getObjectByName('TorsoAssembly') || null;
    headNode.current = clonedScene.getObjectByName('HeadAssembly') || null;
    rightArmNode.current = clonedScene.getObjectByName('RightArmAssembly') || null;
  }, [clonedScene]);

  // Subtle breathing and expressive speaking animation
  useFrame((state) => {
    if (prefersReducedMotion) return;

    const t = state.clock.getElapsedTime();

    // 1. Natural idle breathing on torso
    if (torsoNode.current) {
      const breath = Math.sin(t * 1.8 + seed) * 0.005;
      torsoNode.current.position.y = 0.52 + breath;
      torsoNode.current.scale.set(
        1 + breath * 0.5,
        1 + breath,
        1 + breath * 0.5
      );
    }

    // 2. Head micro-movements or speaking nodding
    if (headNode.current) {
      if (isSpeaking) {
        headNode.current.rotation.x = Math.sin(t * 4.5) * 0.05;
        headNode.current.rotation.y = Math.sin(t * 2.2) * 0.08;
      } else {
        headNode.current.rotation.y = Math.sin(t * 0.6 + seed) * 0.04;
        headNode.current.rotation.x = Math.cos(t * 0.9 + seed) * 0.015;
      }
    }

    // 3. Expressive gesture on right arm
    if (rightArmNode.current) {
      if (isSpeaking) {
        rightArmNode.current.rotation.x = Math.sin(t * 3.8) * 0.08;
        rightArmNode.current.rotation.z = Math.sin(t * 2.0) * 0.04;
      } else {
        rightArmNode.current.rotation.x = Math.sin(t * 0.5 + seed) * 0.01;
        rightArmNode.current.rotation.z = 0;
      }
    }
  });

  return <primitive object={clonedScene} />;
};

interface AdvisorCharacterProps {
  seat: AdvisorSeatConfig;
  advisor?: Advisor;
  isSelected: boolean;
  isSpeaking: boolean;
  onClick: () => void;
}

export const AdvisorCharacter: React.FC<AdvisorCharacterProps> = ({
  seat,
  advisor,
  isSelected,
  isSpeaking,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const rootGroupRef = useRef<THREE.Group>(null);
  const selectionRingRef = useRef<THREE.Mesh>(null);

  const modelPath = ADVISOR_MODEL_PATHS[seat.id] || ADVISOR_MODEL_PATHS['adv-chancellor'];
  const seed = useMemo(() => seat.id.length * 1.7, [seat.id]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const handler = () => setPrefersReducedMotion(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // Update cursor on hover
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  // Rotational animation on the selection ring
  useFrame((state) => {
    if (prefersReducedMotion) return;
    const t = state.clock.getElapsedTime();
    if (selectionRingRef.current && isSelected) {
      selectionRingRef.current.rotation.z = t * 0.8;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    soundFx.playClick();
    onClick();
  };

  const hasWarning = advisor?.hasActiveWarning;
  const hasCritical = advisor?.status === 'Critical';

  return (
    <group
      ref={rootGroupRef}
      position={seat.position}
      rotation={seat.rotation}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => {
        setHovered(false);
      }}
    >
      {/* 1. Selection & Hover Floor Indicators */}
      {isSelected && (
        <group position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Outer runic selection ring */}
          <mesh ref={selectionRingRef}>
            <ringGeometry args={[0.72, 0.78, 32]} />
            <meshBasicMaterial color="#C5A66A" transparent opacity={0.75} />
          </mesh>
          {/* Inner radial fill */}
          <mesh>
            <circleGeometry args={[0.7, 32]} />
            <meshBasicMaterial color="#C5A66A" transparent opacity={0.14} />
          </mesh>
        </group>
      )}

      {hovered && !isSelected && (
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.68, 0.73, 32]} />
          <meshBasicMaterial color="#EAE3D2" transparent opacity={0.4} />
        </mesh>
      )}

      {/* Speaking Active Wave Ring */}
      {isSpeaking && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.82, 0.86, 32]} />
          <meshBasicMaterial color="#8FA879" transparent opacity={0.85} />
        </mesh>
      )}

      {/* 2. Realistic 3D Advisor Character Model Loaded via GLTF */}
      <AdvisorCharacterModel
        modelPath={modelPath}
        isSpeaking={isSpeaking}
        prefersReducedMotion={prefersReducedMotion}
        seed={seed}
      />

      {/* 3. Floating Status Gem for Critical/Warning States */}
      {hasCritical && (
        <mesh position={[0, 1.48, 0]} castShadow>
          <octahedronGeometry args={[0.045, 0]} />
          <meshStandardMaterial
            color="#C84C4C"
            emissive="#C84C4C"
            emissiveIntensity={0.85}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      )}
      {!hasCritical && hasWarning && (
        <mesh position={[0, 1.48, 0]} castShadow>
          <octahedronGeometry args={[0.04, 0]} />
          <meshStandardMaterial
            color="#E09F3E"
            emissive="#E09F3E"
            emissiveIntensity={0.75}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      )}

      {/* 4. Floating 2D Nameplate Overlay on Hover / Select / Speaking */}
      {(hovered || isSelected || isSpeaking) && (
        <Html
          position={[0, 1.85, 0]}
          center
          distanceFactor={9}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`flex flex-col items-center px-3 py-1.5 rounded border shadow-xl backdrop-blur-md transition-all duration-200 select-none whitespace-nowrap ${
              isSelected
                ? 'bg-[#17231B]/95 border-[#C5A66A] text-[#EAE3D2] ring-1 ring-[#C5A66A]/60'
                : 'bg-[#151915]/90 border-[#3B4D3C] text-[#EAE3D2]'
            }`}
          >
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs">{advisor?.portraitSymbol || '👑'}</span>
              <span className="text-[9px] uppercase font-mono tracking-wider text-[#C5A66A] font-bold">
                {seat.title}
              </span>
              {isSpeaking && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#8FA879]/30 text-[#8FA879] text-[8px] font-mono uppercase font-bold animate-pulse">
                  Speaking
                </span>
              )}
              {hasCritical && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#C84C4C]/30 text-[#C84C4C] text-[8px] font-mono uppercase font-bold animate-ping">
                  Critical
                </span>
              )}
            </div>

            <span className="font-serif text-xs font-bold text-[#EAE3D2]">
              {advisor?.name || seat.name}
            </span>

            <span className="text-[9px] font-mono text-[#A5AD9D]">
              {advisor?.domain || 'Imperial Ministry'}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

// Preload all 6 realistic advisor models to eliminate runtime pop-in
Object.values(ADVISOR_MODEL_PATHS).forEach((path) => {
  useGLTF.preload(path);
});
