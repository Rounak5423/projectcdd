import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';

export interface DayNightState {
  timeOfDay: number; // 0 to 24 (hours)
  setTimeOfDay: (time: number) => void;
  isAutoCycle: boolean;
  setIsAutoCycle: (auto: boolean) => void;
  isNight: boolean;
  sunIntensity: number;
  sunPosition: [number, number, number];
  moonPosition: [number, number, number];
  skyColor: string;
  fogColor: string;
  ambientColor: string;
  directionalColor: string;
}

const DayNightContext = createContext<DayNightState | undefined>(undefined);
const IsNightContext = createContext<boolean>(false);

export function useIsNight(): boolean {
  return useContext(IsNightContext);
}

export function useDayNight(): DayNightState {
  const context = useContext(DayNightContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      timeOfDay: 14,
      setTimeOfDay: () => {},
      isAutoCycle: true,
      setIsAutoCycle: () => {},
      isNight: false,
      sunIntensity: 2.2,
      sunPosition: [40, 55, 30] as [number, number, number],
      moonPosition: [-40, -55, -30] as [number, number, number],
      skyColor: '#9ec4b0',
      fogColor: '#9ec4b0',
      ambientColor: '#ffffff',
      directionalColor: '#fff5df',
    };
  }
  return context;
}

export function DayNightProvider({ children }: { children: React.ReactNode }) {
  const { isPlaying, speed } = useGameState();
  const [timeOfDay, setTimeOfDay] = useState<number>(14.0); // Start at 2:00 PM (bright daylight)
  const [isAutoCycle, setIsAutoCycle] = useState<boolean>(true);

  // Time advancement when auto cycle is on
  useEffect(() => {
    if (!isAutoCycle || !isPlaying) return;

    const multMap = { '1x': 1, '2x': 2, '5x': 5, '10x': 10 };
    const mult = multMap[speed] || 1;
    // Advance 1 hour every 4 seconds at 1x
    const intervalMs = 200; // 5Hz is plenty smooth for simulation clocks while cutting React ticks by 50%
    const hourPerTick = (0.25 * mult * intervalMs) / 1000;

    const timer = setInterval(() => {
      setTimeOfDay((prev) => (prev + hourPerTick) % 24);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoCycle, isPlaying, speed]);

  // Derived celestial properties based on time of day (0-24)
  const isNight = timeOfDay < 5.5 || timeOfDay > 19.5;

  // Calculate sun angle: rises at 6 (0 rad), zenith at 12 (pi/2), sets at 18 (pi)
  const sunAngle = ((timeOfDay - 6) / 24) * Math.PI * 2;
  const sunDist = 75;
  const sunX = Math.cos(sunAngle) * sunDist;
  const sunY = Math.sin(sunAngle) * sunDist;
  const sunZ = Math.sin(sunAngle * 0.5) * 35;

  // Moon is opposite to the sun
  const moonX = -sunX;
  const moonY = -sunY;
  const moonZ = -sunZ;

  // Smooth color and intensity interpolation
  let sunIntensity = 0;
  let directionalColor = '#fff5df';
  let ambientColor = '#ffffff';
  let skyColor = '#9ec4b0';
  let fogColor = '#9ec4b0';

  if (timeOfDay >= 5.0 && timeOfDay < 7.5) {
    // Dawn / Sunrise
    const t = (timeOfDay - 5.0) / 2.5;
    sunIntensity = THREE.MathUtils.lerp(0.2, 1.8, t);
    directionalColor = '#ffb36b';
    ambientColor = '#e8b98d';
    skyColor = '#c49a79';
    fogColor = '#d9b493';
  } else if (timeOfDay >= 7.5 && timeOfDay <= 17.0) {
    // Full Daylight
    sunIntensity = 2.4;
    directionalColor = '#fff6e5';
    ambientColor = '#ffffff';
    skyColor = '#9ec4b0';
    fogColor = '#a8cbb8';
  } else if (timeOfDay > 17.0 && timeOfDay <= 20.0) {
    // Golden Hour / Sunset
    const t = (timeOfDay - 17.0) / 3.0;
    sunIntensity = THREE.MathUtils.lerp(2.2, 0.4, t);
    directionalColor = '#ff884d';
    ambientColor = '#c97d65';
    skyColor = '#5e4359';
    fogColor = '#735269';
  } else {
    // Night (20:00 to 5:00)
    sunIntensity = 0.5; // Cool moon light
    directionalColor = '#80a8d6';
    ambientColor = '#18242f';
    skyColor = '#0b1319';
    fogColor = '#0d1820';
  }

  const value = useMemo<DayNightState>(() => ({
    timeOfDay,
    setTimeOfDay,
    isAutoCycle,
    setIsAutoCycle,
    isNight,
    sunIntensity,
    sunPosition: [sunX, Math.max(sunY, -10), sunZ],
    moonPosition: [moonX, Math.max(moonY, -10), moonZ],
    skyColor,
    fogColor,
    ambientColor,
    directionalColor,
  }), [timeOfDay, isAutoCycle, isNight, sunIntensity, sunX, sunY, sunZ, moonX, moonY, moonZ, skyColor, fogColor, ambientColor, directionalColor]);

  return (
    <IsNightContext.Provider value={isNight}>
      <DayNightContext.Provider value={value}>
        {children}
      </DayNightContext.Provider>
    </IsNightContext.Provider>
  );
}

// 3D Scene Lighting component driven by DayNightContext
export const WorldLighting = React.memo(function WorldLighting() {
  const {
    isNight,
    sunIntensity,
    sunPosition,
    moonPosition,
    directionalColor,
    ambientColor,
    skyColor,
    fogColor,
  } = useDayNight();

  const sunRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[fogColor, 90, 195]} />

      {/* Global Ambient Light */}
      <ambientLight
        intensity={isNight ? 0.35 : 0.95}
        color={ambientColor}
      />

      {/* Hemisphere Light for natural ground bounce */}
      <hemisphereLight
        color={isNight ? '#384d6b' : '#daf0ff'}
        groundColor={isNight ? '#0b1610' : '#45663d'}
        intensity={isNight ? 0.4 : 0.85}
      />

      {/* Primary Directional Light (Sun or Moon) */}
      <directionalLight
        ref={sunRef}
        position={isNight ? moonPosition : sunPosition}
        intensity={isNight ? 0.85 : sunIntensity}
        color={directionalColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={15}
        shadow-camera-far={200}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-bias={-0.0003}
      />

      {/* Secondary fill light for soft shadows without shadow casting pass */}
      <directionalLight
        position={[-35, 30, -35]}
        intensity={isNight ? 0.2 : 0.55}
        color={isNight ? '#486380' : '#b0dbff'}
      />
    </>
  );
});
