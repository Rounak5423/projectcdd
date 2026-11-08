import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Advisor } from '../types/advisor';
import { AdvisorSeatConfig } from './Council3DTypes';
import { soundFx } from '../../../services/soundFx';

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

  // Animation refs
  const rootGroupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const selectionRingRef = useRef<THREE.Mesh>(null);

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

  // Materials tailored for this advisor
  const materials = useMemo(() => {
    return {
      primaryRobe: new THREE.MeshStandardMaterial({
        color: seat.primaryColor,
        roughness: 0.8,
        metalness: 0.15,
      }),
      secondaryRobe: new THREE.MeshStandardMaterial({
        color: seat.secondaryColor,
        roughness: 0.75,
        metalness: 0.1,
      }),
      goldAccent: new THREE.MeshStandardMaterial({
        color: seat.accentColor,
        roughness: 0.35,
        metalness: 0.75,
      }),
      skin: new THREE.MeshStandardMaterial({
        color: seat.skinTone,
        roughness: 0.6,
        metalness: 0.05,
      }),
      hair: new THREE.MeshStandardMaterial({
        color: seat.hairColor,
        roughness: 0.85,
        metalness: 0.05,
      }),
      leatherBelt: new THREE.MeshStandardMaterial({
        color: '#26180F',
        roughness: 0.7,
        metalness: 0.2,
      }),
      selectionGlow: new THREE.MeshBasicMaterial({
        color: '#C5A66A',
        transparent: true,
        opacity: 0.65,
      }),
      speakingGlow: new THREE.MeshBasicMaterial({
        color: '#8FA879',
        transparent: true,
        opacity: 0.8,
      }),
      warningAmber: new THREE.MeshBasicMaterial({
        color: '#E09F3E',
      }),
      criticalRed: new THREE.MeshBasicMaterial({
        color: '#C84C4C',
      }),
    };
  }, [seat]);

  // Subtle breathing and expressive animation
  useFrame((state) => {
    if (prefersReducedMotion) return;

    const t = state.clock.getElapsedTime();
    const seed = seat.id.length * 1.7; // unique phase per advisor

    // 1. Natural idle breathing
    if (torsoRef.current) {
      const breath = Math.sin(t * 1.8 + seed) * 0.005;
      torsoRef.current.position.y = 0.52 + breath;
      torsoRef.current.scale.set(
        1 + breath * 0.5,
        1 + breath,
        1 + breath * 0.5
      );
    }

    // 2. Head micro-movements or speaking nodding
    if (headRef.current) {
      if (isSpeaking) {
        headRef.current.rotation.x = Math.sin(t * 4.5) * 0.05;
        headRef.current.rotation.y = Math.sin(t * 2.2) * 0.08;
      } else {
        headRef.current.rotation.y = Math.sin(t * 0.6 + seed) * 0.04;
        headRef.current.rotation.x = Math.cos(t * 0.9 + seed) * 0.015;
      }
    }

    // 3. Speaking gesture on right arm
    if (rightArmRef.current) {
      if (isSpeaking) {
        rightArmRef.current.rotation.x = -0.3 + Math.sin(t * 3.8) * 0.08;
      } else {
        rightArmRef.current.rotation.x = -0.28 + Math.sin(t * 0.5 + seed) * 0.01;
      }
    }

    // 4. Selection ring rotation
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
          <mesh ref={selectionRingRef} material={materials.selectionGlow}>
            <ringGeometry args={[0.72, 0.78, 32]} />
          </mesh>
          {/* Inner radial fill */}
          <mesh>
            <circleGeometry args={[0.7, 32]} />
            <meshBasicMaterial color="#C5A66A" transparent opacity={0.12} />
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
          <primitive object={materials.speakingGlow} attach="material" />
        </mesh>
      )}

      {/* 2. Procedural Seated Advisor Character Model */}
      {/* Lower Body & Draped Robes over chair */}
      <group position={[0, 0, 0]}>
        {/* Robes falling down to feet */}
        <mesh position={[0, 0.28, 0.1]} castShadow material={materials.primaryRobe}>
          <boxGeometry args={[0.44, 0.44, 0.46]} />
        </mesh>
        {/* Lower robe skirt */}
        <mesh position={[0, 0.12, 0.2]} castShadow material={materials.secondaryRobe}>
          <boxGeometry args={[0.42, 0.24, 0.32]} />
        </mesh>
        {/* Leather boots resting on stone */}
        <mesh position={[-0.14, 0.04, 0.32]} material={materials.leatherBelt}>
          <boxGeometry args={[0.1, 0.08, 0.18]} />
        </mesh>
        <mesh position={[0.14, 0.04, 0.32]} material={materials.leatherBelt}>
          <boxGeometry args={[0.1, 0.08, 0.18]} />
        </mesh>
      </group>

      {/* Upper Body (Animated Torso & Breathing) */}
      <group ref={torsoRef} position={[0, 0.52, 0]}>
        {/* Robed Torso */}
        <mesh position={[0, 0.34, -0.05]} castShadow material={materials.primaryRobe}>
          <boxGeometry args={[0.46, 0.46, 0.28]} />
        </mesh>

        {/* Advisor Signature Gold/Accent Embroidered Sash / Stole */}
        <mesh position={[0, 0.34, 0.1]} material={materials.goldAccent}>
          <boxGeometry args={[0.16, 0.44, 0.02]} />
        </mesh>

        {/* Broad Robe Collar / Shoulder Mantle */}
        <mesh position={[0, 0.52, -0.04]} castShadow material={materials.secondaryRobe}>
          <boxGeometry args={[0.54, 0.12, 0.34]} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.62, -0.04]} material={materials.skin}>
          <cylinderGeometry args={[0.07, 0.08, 0.12, 12]} />
        </mesh>

        {/* Head & Facial Styling */}
        <group ref={headRef} position={[0, 0.74, -0.04]}>
          {/* Head Base */}
          <mesh castShadow material={materials.skin}>
            <sphereGeometry args={[0.13, 16, 16]} />
          </mesh>

          {/* Advisor Hair / Headdress */}
          <mesh position={[0, 0.05, -0.03]} material={materials.hair}>
            <sphereGeometry args={[0.135, 16, 16]} />
          </mesh>

          {/* Forehead Brow / Crown Fillet in Gold */}
          <mesh position={[0, 0.05, 0.05]} material={materials.goldAccent}>
            <torusGeometry args={[0.125, 0.012, 8, 20]} />
          </mesh>

          {/* Left and Right Eyes (subtle depth) */}
          <mesh position={[-0.045, 0.01, 0.11]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial color="#1C1814" />
          </mesh>
          <mesh position={[0.045, 0.01, 0.11]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial color="#1C1814" />
          </mesh>

          {/* Warning / Critical Indicator Gem on Head / Fillet */}
          {hasCritical && (
            <mesh position={[0, 0.11, 0.13]} material={materials.criticalRed}>
              <sphereGeometry args={[0.025, 8, 8]} />
            </mesh>
          )}
          {!hasCritical && hasWarning && (
            <mesh position={[0, 0.11, 0.13]} material={materials.warningAmber}>
              <sphereGeometry args={[0.022, 8, 8]} />
            </mesh>
          )}
        </group>

        {/* Left Arm (Resting on Left Armrest) */}
        <group position={[-0.26, 0.45, -0.04]}>
          {/* Upper Arm */}
          <mesh position={[0, -0.16, 0.04]} rotation={[0.2, 0, 0.1]} material={materials.primaryRobe}>
            <cylinderGeometry args={[0.07, 0.065, 0.32, 8]} />
          </mesh>
          {/* Forearm angled forward */}
          <mesh position={[-0.02, -0.28, 0.18]} rotation={[-0.4, 0, 0]} material={materials.secondaryRobe}>
            <cylinderGeometry args={[0.06, 0.055, 0.3, 8]} />
          </mesh>
          {/* Left Hand */}
          <mesh position={[-0.02, -0.32, 0.34]} material={materials.skin}>
            <boxGeometry args={[0.08, 0.04, 0.1]} />
          </mesh>
        </group>

        {/* Right Arm (Resting or Gesturing) */}
        <group ref={rightArmRef} position={[0.26, 0.45, -0.04]}>
          {/* Upper Arm */}
          <mesh position={[0, -0.16, 0.04]} rotation={[0.2, 0, -0.1]} material={materials.primaryRobe}>
            <cylinderGeometry args={[0.07, 0.065, 0.32, 8]} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0.02, -0.28, 0.18]} rotation={[-0.4, 0, 0]} material={materials.secondaryRobe}>
            <cylinderGeometry args={[0.06, 0.055, 0.3, 8]} />
          </mesh>
          {/* Right Hand */}
          <mesh position={[0.02, -0.32, 0.34]} material={materials.skin}>
            <boxGeometry args={[0.08, 0.04, 0.1]} />
          </mesh>
        </group>
      </group>

      {/* 3. Floating 2D Nameplate Overlay on Hover / Select / Speaking */}
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
