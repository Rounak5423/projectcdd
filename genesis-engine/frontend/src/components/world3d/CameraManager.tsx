import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';

export default function CameraManager() {
  const controlsRef = useRef<any>(null);
  const { selectedBuilding } = useGameState();

  const targetVec = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const camVec = useRef<THREE.Vector3>(new THREE.Vector3(38, 34, 46));
  const isTransitioning = useRef<boolean>(false);

  // Smoothly center camera when building is selected
  useEffect(() => {
    if (selectedBuilding && controlsRef.current) {
      targetVec.current.set(selectedBuilding.x, selectedBuilding.y, selectedBuilding.z);
      camVec.current.set(
        selectedBuilding.x + 18,
        selectedBuilding.y + 14,
        selectedBuilding.z + 18
      );
      isTransitioning.current = true;
    }
  }, [selectedBuilding]);

  // Smooth lerp during camera transition
  useFrame((_, delta) => {
    if (isTransitioning.current && controlsRef.current) {
      const controls = controlsRef.current;
      const cam = controls.object as THREE.PerspectiveCamera;

      controls.target.lerp(targetVec.current, delta * 3.8);
      cam.position.lerp(camVec.current, delta * 3.8);
      controls.update();

      if (
        controls.target.distanceTo(targetVec.current) < 0.25 &&
        cam.position.distanceTo(camVec.current) < 0.45
      ) {
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={0.08}
      minDistance={10}
      maxDistance={110}
      dampingFactor={0.07}
      enableDamping
    />
  );
}
