import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Advisor } from '../types/advisor';
import { AdvisorSeatConfig } from './Council3DTypes';
import { COUNCIL_MODELS, CouncilModelConfig } from './CouncilModelRegistry';
import { soundFx } from '../../../services/soundFx';

interface AdvisorCharacterModelProps {
  modelKey: string;
  isSpeaking: boolean;
  prefersReducedMotion: boolean;
  seed: number;
}

const AdvisorCharacterModel: React.FC<AdvisorCharacterModelProps> = ({
  modelKey,
  isSpeaking,
  prefersReducedMotion,
  seed,
}) => {
  const config: CouncilModelConfig =
    COUNCIL_MODELS[modelKey] || COUNCIL_MODELS['adv-chancellor'];
  const { scene } = useGLTF(config.modelPath);

  // Deep clone so each advisor instance has independent transforms and material states
  const { wrapper, torsoNode, headNode, rightArmNode } = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const container = new THREE.Group();
    container.name = `CouncilModel_${config.id}`;

    if (config.category === 'historical') {
      // Historical models were exported with exact seat geometry
      container.add(clone);
    } else {
      // Real downloaded models: normalize height, auto-center lateral bounds, ground feet to floor Y=0
      const targetHeight = config.targetHeight || 1.6;
      const rawHeight = size.y > 0.05 ? size.y : 1.0;
      const scale = targetHeight / rawHeight;

      clone.position.set(
        -center.x + (config.offsetX || 0),
        -box.min.y + (config.offsetY || 0),
        -center.z + (config.offsetZ || 0)
      );
      if (config.rotationY) {
        clone.rotation.y = config.rotationY;
      }
      container.scale.set(scale, scale, scale);
      container.add(clone);
    }

    // Identify animation joints
    const torso =
      clone.getObjectByName('TorsoAssembly') ||
      clone.getObjectByName('Spine1') ||
      clone.getObjectByName('Spine') ||
      clone.getObjectByName('U9M5FGRXTON58PON5RWIMVVJA') ||
      null;

    const head =
      clone.getObjectByName('HeadAssembly') ||
      clone.getObjectByName('Head') ||
      clone.getObjectByName('U9M5FGRXTON58PON5RWIMVVJA_Modelpart1_head_Material005_0') ||
      null;

    const rightArm =
      clone.getObjectByName('RightArmAssembly') ||
      clone.getObjectByName('RightArm') ||
      clone.getObjectByName('RightForeArm') ||
      clone.getObjectByName('U9M5FGRXTON58PON5RWIMVVJA_Modelpart1_armr_Material003_0') ||
      null;

    return {
      wrapper: container,
      torsoNode: torso,
      headNode: head,
      rightArmNode: rightArm,
    };
  }, [scene, config]);

  // Subtle breathing and expressive speaking animation
  useFrame((state) => {
    if (prefersReducedMotion) return;

    const t = state.clock.getElapsedTime();

    // 1. Natural idle breathing on torso
    if (torsoNode) {
      const breath = Math.sin(t * 1.8 + seed) * 0.003;
      torsoNode.position.y += breath * 0.15;
    }

    // 2. Head micro-movements or speaking nodding
    if (headNode) {
      if (isSpeaking) {
        headNode.rotation.x = Math.sin(t * 4.5) * 0.04;
        headNode.rotation.y = Math.sin(t * 2.2) * 0.06;
      } else {
        headNode.rotation.y = Math.sin(t * 0.6 + seed) * 0.02;
        headNode.rotation.x = Math.cos(t * 0.9 + seed) * 0.01;
      }
    }

    // 3. Expressive gesture on right arm
    if (rightArmNode) {
      if (isSpeaking) {
        rightArmNode.rotation.x = Math.sin(t * 3.8) * 0.05;
      }
    }
  });

  return <primitive object={wrapper} />;
};

const AdvisorLoadingPlaceholder: React.FC<{ seat: AdvisorSeatConfig }> = ({ seat }) => {
  return (
    <group position={[0, 0.52, 0]}>
      <mesh position={[0, 0.32, -0.04]}>
        <boxGeometry args={[0.42, 0.44, 0.26]} />
        <meshStandardMaterial
          color={seat.primaryColor || '#C5A66A'}
          transparent
          opacity={0.4}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.72, -0.04]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color={seat.accentColor || '#C5A66A'}
          transparent
          opacity={0.5}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
};

interface AdvisorCharacterProps {
  seat: AdvisorSeatConfig;
  advisor?: Advisor;
  isSelected: boolean;
  isSpeaking: boolean;
  modelKey?: string;
  onClick: () => void;
}

export const AdvisorCharacter: React.FC<AdvisorCharacterProps> = ({
  seat,
  advisor,
  isSelected,
  isSpeaking,
  modelKey,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const rootGroupRef = useRef<THREE.Group>(null);
  const selectionRingRef = useRef<THREE.Mesh>(null);

  const activeModelKey = modelKey || seat.id;
  const activeModelConfig = COUNCIL_MODELS[activeModelKey] || COUNCIL_MODELS['adv-chancellor'];
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
      <React.Suspense fallback={<AdvisorLoadingPlaceholder seat={seat} />}>
        <AdvisorCharacterModel
          modelKey={activeModelKey}
          isSpeaking={isSpeaking}
          prefersReducedMotion={prefersReducedMotion}
          seed={seed}
        />
      </React.Suspense>

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
              {activeModelConfig.category === 'real_downloaded' && (
                <span className="px-1.5 py-0.2 rounded bg-[#C5A66A]/20 text-[#C5A66A] border border-[#C5A66A]/40 text-[8px] font-mono font-bold flex items-center gap-0.5">
                  <span>⚡ 3D Real</span>
                </span>
              )}
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
              {advisor?.domain || 'Imperial Ministry'} · {activeModelConfig.shortName}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

// Preload models under 25MB to eliminate runtime pop-in without blocking memory
Object.values(COUNCIL_MODELS).forEach((cfg) => {
  if (cfg.id !== 'real-magus') {
    useGLTF.preload(cfg.modelPath);
  }
});
