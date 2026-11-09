import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { performanceMonitor } from '../../services/monitoring/performanceMonitor';

interface ThreeSceneSamplerProps {
  sceneId: 'world' | 'council';
}

/**
 * ThreeSceneSampler
 * In-Canvas sampler that non-intrusively extracts WebGLRenderer telemetry at 2Hz
 * without creating extra renderers or triggering per-frame React state updates.
 */
export function ThreeSceneSampler({ sceneId }: ThreeSceneSamplerProps) {
  const { gl, scene } = useThree();
  const frameCount = useRef(0);
  const lastSampleTime = useRef(performance.now());
  const lastFrameTime = useRef(performance.now());

  useFrame(() => {
    if (!performanceMonitor.isEnabled()) return;

    const now = performance.now();
    const frameDelta = now - lastFrameTime.current;
    lastFrameTime.current = now;
    frameCount.current++;

    // Sample telemetry every 500ms (2Hz) to keep CPU overhead at <0.01ms
    if (now - lastSampleTime.current >= 500) {
      const elapsed = (now - lastSampleTime.current) / 1000;
      const currentFps = Math.min(144, Math.round(frameCount.current / Math.max(elapsed, 0.001)));
      frameCount.current = 0;
      lastSampleTime.current = now;

      // Count active scene objects
      let objectCount = 0;
      try {
        scene.traverse(() => {
          objectCount++;
        });
      } catch {}

      const calls = gl.info?.render?.calls ?? 0;
      const triangles = gl.info?.render?.triangles ?? 0;
      const geometries = gl.info?.memory?.geometries ?? 0;
      const textures = gl.info?.memory?.textures ?? 0;

      performanceMonitor.recordThreeMetrics(sceneId, {
        fps: currentFps,
        drawCalls: calls,
        triangles,
        geometries,
        textures,
        sceneObjects: objectCount,
        frameRenderTimeMs: Math.round(frameDelta * 10) / 10,
        memoryUsage: {
          geometries,
          textures,
        },
      });
    }
  });

  return null;
}

