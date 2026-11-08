import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type GraphicsPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface GraphicsSettings {
  preset: GraphicsPreset;
  setPreset: (preset: GraphicsPreset) => void;
  shadows: boolean;
  shadowMapSize: number;
  weatherEffects: boolean;
  pedestriansEnabled: boolean;
  dpr: number;
  autoDetectFps: boolean;
  setAutoDetectFps: (enabled: boolean) => void;
  fps: number;
  recordFpsSample: (currentFps: number) => void;
}

const presetConfigs: Record<GraphicsPreset, {
  shadows: boolean;
  shadowMapSize: number;
  weatherEffects: boolean;
  pedestriansEnabled: boolean;
  dpr: number;
}> = {
  low: {
    shadows: false,
    shadowMapSize: 512,
    weatherEffects: false,
    pedestriansEnabled: false,
    dpr: 1.0,
  },
  medium: {
    shadows: true,
    shadowMapSize: 1024,
    weatherEffects: true,
    pedestriansEnabled: true,
    dpr: 1.0,
  },
  high: {
    shadows: true,
    shadowMapSize: 2048,
    weatherEffects: true,
    pedestriansEnabled: true,
    dpr: 1.5,
  },
  ultra: {
    shadows: true,
    shadowMapSize: 4096,
    weatherEffects: true,
    pedestriansEnabled: true,
    dpr: 2.0,
  },
};

const GraphicsContext = createContext<GraphicsSettings | undefined>(undefined);

export function useGraphics(): GraphicsSettings {
  const context = useContext(GraphicsContext);
  if (!context) {
    throw new Error('useGraphics must be used within a GraphicsProvider');
  }
  return context;
}

export function GraphicsProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPresetState] = useState<GraphicsPreset>('high');
  const [autoDetectFps, setAutoDetectFps] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(60);
  const lowFpsCount = useRef<number>(0);

  const setPreset = (p: GraphicsPreset) => {
    setPresetState(p);
  };

  const recordFpsSample = (currentFps: number) => {
    setFps(currentFps);
    if (!autoDetectFps) return;

    if (currentFps < 28) {
      lowFpsCount.current += 1;
      if (lowFpsCount.current >= 4) {
        // Auto-downscale to preserve smooth 60 FPS target
        if (preset === 'ultra') setPresetState('high');
        else if (preset === 'high') setPresetState('medium');
        else if (preset === 'medium') setPresetState('low');
        lowFpsCount.current = 0;
      }
    } else {
      lowFpsCount.current = Math.max(0, lowFpsCount.current - 1);
    }
  };

  const config = presetConfigs[preset];

  return (
    <GraphicsContext.Provider
      value={{
        preset,
        setPreset,
        shadows: config.shadows,
        shadowMapSize: config.shadowMapSize,
        weatherEffects: config.weatherEffects,
        pedestriansEnabled: config.pedestriansEnabled,
        dpr: config.dpr,
        autoDetectFps,
        setAutoDetectFps,
        fps,
        recordFpsSample,
      }}
    >
      {children}
    </GraphicsContext.Provider>
  );
}
