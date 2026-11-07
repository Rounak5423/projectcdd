import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';

export type CameraPreset = 'isometric' | 'topDown' | 'panoramic' | 'reset';

export function triggerCameraPreset(preset: CameraPreset) {
  window.dispatchEvent(
    new CustomEvent('civilization-camera-command', {
      detail: { type: 'preset', preset },
    })
  );
}

export function triggerCameraFocus(x: number, y: number, z: number, dist: number = 22) {
  window.dispatchEvent(
    new CustomEvent('civilization-camera-command', {
      detail: { type: 'focus', x, y, z, dist },
    })
  );
}

export default function CameraManager() {
  const controlsRef = useRef<any>(null);
  const { selectedBuilding, disasterState } = useGameState();

  const targetVec = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.8, 10.0));
  const camVec = useRef<THREE.Vector3>(new THREE.Vector3(32, 28, 38));
  const isTransitioning = useRef<boolean>(false);

  // Real-time camera tremor during earthquakes
  const activeDisaster = disasterState?.activeDisaster;
  const isEarthquake =
    activeDisaster?.type === 'earthquake' &&
    (activeDisaster.stage === 'warning' || activeDisaster.stage === 'active');
  const quakeIntensity =
    activeDisaster?.intensity === 'critical'
      ? 0.04
      : activeDisaster?.intensity === 'high'
      ? 0.025
      : activeDisaster?.intensity === 'medium'
      ? 0.015
      : 0.008;

  // Smoothly center camera when building is selected in game state
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

  // Listen for camera commands from HUD buttons
  useEffect(() => {
    const handleCommand = (e: Event) => {
      const custom = e as CustomEvent;
      if (!custom.detail || !controlsRef.current) return;

      if (custom.detail.type === 'preset') {
        const p = custom.detail.preset as CameraPreset;
        switch (p) {
          case 'isometric':
            targetVec.current.set(0, 1.8, 10.0);
            camVec.current.set(32, 28, 38);
            break;
          case 'topDown':
            // Orthogonal city-planning top-down overview centered on civilization core
            targetVec.current.set(0, 1.0, 10.0);
            camVec.current.set(0.01, 82, 10.05);
            break;
          case 'panoramic':
            targetVec.current.set(0, 2.5, 12.0);
            camVec.current.set(45, 14, 35);
            break;
          case 'reset':
          default:
            targetVec.current.set(0, 1.8, 10.0);
            camVec.current.set(32, 28, 38);
            break;
        }
        isTransitioning.current = true;
      } else if (custom.detail.type === 'focus') {
        const { x, y, z, dist } = custom.detail;
        targetVec.current.set(x, y, z);
        camVec.current.set(x + dist * 0.75, y + dist * 0.65, z + dist * 0.75);
        isTransitioning.current = true;
      }
    };

    window.addEventListener('civilization-camera-command', handleCommand);
    return () => window.removeEventListener('civilization-camera-command', handleCommand);
  }, []);

  // Smooth lerp during camera transition & seismic tremor during earthquakes
  useFrame(({ clock }, delta) => {
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
    } else if (isEarthquake && controlsRef.current) {
      // Subtle seismic tremor on camera position
      const t = clock.getElapsedTime() * 32;
      const cam = controlsRef.current.object as THREE.PerspectiveCamera;
      cam.position.x += Math.sin(t * 1.8) * quakeIntensity;
      cam.position.y += Math.cos(t * 2.3) * (quakeIntensity * 0.7);
      cam.position.z += Math.sin(t * 1.4 + 1.0) * quakeIntensity;
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      maxPolarAngle={Math.PI / 2.15}
      minPolarAngle={0.06}
      minDistance={12}
      maxDistance={115}
      dampingFactor={0.08}
      enableDamping
    />
  );
}
