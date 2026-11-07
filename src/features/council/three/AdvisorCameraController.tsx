import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CameraPreset } from './Council3DTypes';
import { COUNCIL_SEATS } from './CouncilSeats';

interface AdvisorCameraControllerProps {
  preset: CameraPreset;
  selectedAdvisorId: string | null;
  cinematicDrift: boolean;
  onUserInteracted?: () => void;
}

export const AdvisorCameraController: React.FC<AdvisorCameraControllerProps> = ({
  preset,
  selectedAdvisorId,
  cinematicDrift,
  onUserInteracted,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Target vectors for smooth interpolation
  const targetCamPos = useRef(new THREE.Vector3(0, 5.2, 8.8));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.2, 0));
  const isTransitioning = useRef(true);

  // Calculate target camera transform based on preset and selected advisor
  useEffect(() => {
    isTransitioning.current = true;

    if (preset === 'advisor-focus' && selectedAdvisorId) {
      const seat = COUNCIL_SEATS.find((s) => s.id === selectedAdvisorId);
      if (seat) {
        targetCamPos.current.set(...seat.cameraFocusPosition);
        targetLookAt.current.set(...seat.cameraFocusTarget);
        return;
      }
    }

    if (preset === 'table') {
      targetCamPos.current.set(0, 4.4, 4.0);
      targetLookAt.current.set(0, 1.0, 0);
      return;
    }

    if (preset === 'throne') {
      targetCamPos.current.set(0, 2.3, -3.8);
      targetLookAt.current.set(0, 1.1, 1.2);
      return;
    }

    // Default: 'overview'
    targetCamPos.current.set(0, 5.2, 8.8);
    targetLookAt.current.set(0, 1.2, 0);
  }, [preset, selectedAdvisorId]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isTransitioning.current) {
      // Lerp camera position
      const step = Math.min(delta * 3.5, 0.2);
      camera.position.lerp(targetCamPos.current, step);

      // Lerp OrbitControls target
      controlsRef.current.target.lerp(targetLookAt.current, step);
      controlsRef.current.update();

      // Check convergence
      if (
        camera.position.distanceTo(targetCamPos.current) < 0.05 &&
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.05
      ) {
        camera.position.copy(targetCamPos.current);
        controlsRef.current.target.copy(targetLookAt.current);
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2 - 0.05} // don't go below the stone floor
      minDistance={1.8}
      maxDistance={15.0}
      autoRotate={cinematicDrift && !isTransitioning.current}
      autoRotateSpeed={0.35}
      onStart={() => {
        isTransitioning.current = false;
        onUserInteracted?.();
      }}
    />
  );
};
