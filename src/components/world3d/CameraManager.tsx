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
  const { selectedBuilding } = useGameState();

  const targetVec = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.8, 10.0));
  const camVec = useRef<THREE.Vector3>(new THREE.Vector3(38, 34, 46));
  const isTransitioning = useRef<boolean>(false);
  const transitionTimer = useRef<number>(0);

  // Smoothly center camera when building is selected in game state
  useEffect(() => {
    if (selectedBuilding && controlsRef.current) {
      const bx = Number.isFinite(selectedBuilding.x) ? selectedBuilding.x : 0;
      const by = Number.isFinite(selectedBuilding.y) ? selectedBuilding.y : 1.2;
      const bz = Number.isFinite(selectedBuilding.z) ? selectedBuilding.z : 0;

      targetVec.current.set(bx, by, bz);
      camVec.current.set(bx + 18, by + 14, bz + 18);
      transitionTimer.current = 0;
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
            camVec.current.set(0.01, 120, 10.05);
            break;
          case 'panoramic':
            targetVec.current.set(0, 2.5, 12.0);
            camVec.current.set(58, 20, 42);
            break;
          case 'reset':
          default:
            targetVec.current.set(0, 1.8, 10.0);
            camVec.current.set(38, 34, 46);
            break;
        }
        transitionTimer.current = 0;
        isTransitioning.current = true;
      } else if (custom.detail.type === 'focus') {
        const { x, y, z, dist } = custom.detail;
        const fx = Number.isFinite(x) ? x : 0;
        const fy = Number.isFinite(y) ? y : 1.2;
        const fz = Number.isFinite(z) ? z : 10;
        const fd = Number.isFinite(dist) ? dist : 22;

        targetVec.current.set(fx, fy, fz);
        camVec.current.set(fx + fd * 0.75, fy + fd * 0.65, fz + fd * 0.75);
        transitionTimer.current = 0;
        isTransitioning.current = true;
      }
    };

    window.addEventListener('civilization-camera-command', handleCommand);
    return () => window.removeEventListener('civilization-camera-command', handleCommand);
  }, []);

  // Smooth lerp during camera transition
  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const cam = controls.object as THREE.PerspectiveCamera;

    // Sanity check: prevent NaN lockouts from poisoning controls
    if (!Number.isFinite(cam.position.x) || !Number.isFinite(cam.position.y) || !Number.isFinite(cam.position.z)) {
      cam.position.set(38, 34, 46);
    }
    if (!Number.isFinite(controls.target.x) || !Number.isFinite(controls.target.y) || !Number.isFinite(controls.target.z)) {
      controls.target.set(0, 1.8, 10.0);
    }

    if (isTransitioning.current) {
      transitionTimer.current += delta;
      if (transitionTimer.current > 1.2) {
        isTransitioning.current = false;
        return;
      }

      controls.target.lerp(targetVec.current, Math.min(1.0, delta * 4.5));
      cam.position.lerp(camVec.current, Math.min(1.0, delta * 4.5));
      controls.update();

      if (
        controls.target.distanceTo(targetVec.current) < 0.25 &&
        cam.position.distanceTo(camVec.current) < 0.45
      ) {
        isTransitioning.current = false;
      }
    } else {
      // Keep momentum damping fluid and responsive during manual user interaction
      controls.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      onStart={() => {
        // User interacted with mouse/touch: immediately release automatic camera lock
        isTransitioning.current = false;
      }}
      maxPolarAngle={Math.PI / 2.08}
      minPolarAngle={0.08}
      minDistance={6}
      maxDistance={240}
      dampingFactor={0.06}
      rotateSpeed={0.75}
      zoomSpeed={0.9}
      panSpeed={0.8}
      enableDamping
    />
  );
}
