import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  frameTimeMs: number;
}

let latestMetrics: PerformanceMetrics = {
  fps: 60,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  frameTimeMs: 16.6,
};

export function getLatestPerformanceMetrics(): PerformanceMetrics {
  return latestMetrics;
}

// In-Canvas sampler that samples WebGLRenderer info at 2Hz (zero GC overhead)
export function PerformanceSampler() {
  const { gl } = useThree();
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const lastFrameTime = useRef(performance.now());

  useFrame(() => {
    const now = performance.now();
    const frameDelta = now - lastFrameTime.current;
    lastFrameTime.current = now;
    frameCount.current++;

    if (now - lastTime.current >= 500) {
      const elapsed = (now - lastTime.current) / 1000;
      const currentFps = Math.round(frameCount.current / elapsed);
      frameCount.current = 0;
      lastTime.current = now;

      latestMetrics = {
        fps: currentFps,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        frameTimeMs: Math.round(frameDelta * 10) / 10,
      };

      window.dispatchEvent(
        new CustomEvent('civilization-telemetry-update', {
          detail: latestMetrics,
        })
      );
    }
  });

  return null;
}

// Hook to subscribe to telemetry updates in DOM HUD
export function usePerformanceTelemetry(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(latestMetrics);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<PerformanceMetrics>;
      if (custom.detail) {
        setMetrics(custom.detail);
      }
    };

    window.addEventListener('civilization-telemetry-update', handleUpdate);
    return () => window.removeEventListener('civilization-telemetry-update', handleUpdate);
  }, []);

  return metrics;
}

