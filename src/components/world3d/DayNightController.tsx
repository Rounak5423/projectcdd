import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../../context/GameStateContext';

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'fog';

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
  fogNear: number;
  fogFar: number;
  weather: WeatherType;
  setWeather: (w: WeatherType) => void;
  isAutoWeather: boolean;
  setIsAutoWeather: (auto: boolean) => void;
  isTimePaused: boolean;
  setIsTimePaused: (p: boolean) => void;
  timeSpeedMultiplier: number;
  setTimeSpeedMultiplier: (mult: number) => void;
}

const DayNightContext = createContext<DayNightState | undefined>(undefined);
const IsNightContext = createContext<boolean>(false);

export function useIsNight(): boolean {
  return useContext(IsNightContext);
}

export function useDayNight(): DayNightState {
  const context = useContext(DayNightContext);
  if (!context) {
    return {
      timeOfDay: 14,
      setTimeOfDay: () => {},
      isAutoCycle: true,
      setIsAutoCycle: () => {},
      isNight: false,
      sunIntensity: 2.2,
      sunPosition: [40, 55, 30],
      moonPosition: [-40, -55, -30],
      skyColor: '#9ec4b0',
      fogColor: '#9ec4b0',
      ambientColor: '#ffffff',
      directionalColor: '#fff5df',
      fogNear: 90,
      fogFar: 195,
      weather: 'clear',
      setWeather: () => {},
      isAutoWeather: true,
      setIsAutoWeather: () => {},
      isTimePaused: false,
      setIsTimePaused: () => {},
      timeSpeedMultiplier: 1,
      setTimeSpeedMultiplier: () => {},
    };
  }
  return context;
}

// ================= STARS MESH =================
function Starfield({ isNight }: { isNight: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { starGeo, starMat } = useMemo(() => {
    const count = 450;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.15); // Upper hemisphere only
      const r = 95 + Math.random() * 10;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 1.4,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    });
    return { starGeo: geo, starMat: mat };
  }, []);

  useEffect(() => {
    return () => {
      starGeo.dispose();
      starMat.dispose();
    };
  }, [starGeo, starMat]);

  useFrame(() => {
    if (pointsRef.current) {
      const targetOpacity = isNight ? 0.95 : 0.0;
      starMat.opacity = THREE.MathUtils.lerp(starMat.opacity, targetOpacity, 0.08);
      starMat.visible = starMat.opacity > 0.01;
    }
  });

  return <points ref={pointsRef} geometry={starGeo} material={starMat} raycast={() => null} />;
}

// ================= ATMOSPHERIC SKY ENVIRONMENT =================
// Low-altitude geometric cylinder clouds have been removed: they generated large translucent
// polygonal and triangular artifacts across the world in top-down and high-angle camera views.
// Atmospheric mood is rendered through sky color, directional sunlight, and clean distant horizon fog.

// ================= RAIN PARTICLE SYSTEM =================
function RainParticles({ isRaining }: { isRaining: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 900;

  const [positions, geo, mat] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 45;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      color: '#9fc2d6',
      size: 0.35,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    return [pos, g, m];
  }, []);

  useEffect(() => {
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);

  useFrame((_, delta) => {
    if (!isRaining) return;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    const fallSpeed = 36 * delta;
    const windSpeed = 5 * delta;

    for (let i = 0; i < count; i++) {
      let y = array[i * 3 + 1] - fallSpeed;
      let x = array[i * 3] + windSpeed;
      if (y < 0) {
        y = 42 + Math.random() * 4;
        x = (Math.random() - 0.5) * 100;
      }
      array[i * 3] = x;
      array[i * 3 + 1] = y;
    }
    posAttr.needsUpdate = true;
  });

  if (!isRaining) return null;

  return <points ref={pointsRef} geometry={geo} material={mat} raycast={() => null} />;
}

// ================= CELESTIAL MOON MESH =================
function CelestialMoon({
  position,
  isNight,
}: {
  position: [number, number, number];
  isNight: boolean;
}) {
  if (!isNight) return null;

  return (
    <group position={position} raycast={() => null}>
      {/* Lunar Core */}
      <mesh>
        <sphereGeometry args={[2.8, 20, 20]} />
        <meshStandardMaterial
          color="#f0f5fc"
          emissive="#d0e2f4"
          emissiveIntensity={0.85}
          roughness={0.4}
        />
      </mesh>
      {/* Soft Lunar Atmosphere Glow Halo */}
      <mesh>
        <sphereGeometry args={[3.8, 16, 16]} />
        <meshBasicMaterial color="#7ba2cc" transparent opacity={0.22} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// ================= DAY NIGHT & WEATHER PROVIDER =================
export function DayNightProvider({ children }: { children: React.ReactNode }) {
  const { isPlaying, speed, civilization } = useGameState();
  const [timeOfDay, setTimeOfDay] = useState<number>(14.0); // Start at 2:00 PM (bright daylight)
  const [isAutoCycle, setIsAutoCycle] = useState<boolean>(true);
  const [isTimePaused, setIsTimePaused] = useState<boolean>(false);
  const [timeSpeedMultiplier, setTimeSpeedMultiplier] = useState<number>(1);

  // Weather States
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [isAutoWeather, setIsAutoWeather] = useState<boolean>(true);

  // Auto weather cycle (changes condition naturally every ~90s)
  useEffect(() => {
    if (!isAutoWeather || isTimePaused) return;

    const weatherProgression: WeatherType[] = ['clear', 'cloudy', 'rain', 'clear', 'fog'];
    let idx = 0;

    const weatherTimer = setInterval(() => {
      idx = (idx + 1) % weatherProgression.length;
      setWeather(weatherProgression[idx]);
    }, 95000);

    return () => clearInterval(weatherTimer);
  }, [isAutoWeather, isTimePaused]);

  // Time advancement when auto cycle is on and not paused
  useEffect(() => {
    if (!isAutoCycle || !isPlaying || isTimePaused) return;

    const multMap = { '1x': 1, '2x': 2, '5x': 5, '10x': 10 };
    const mult = (multMap[speed] || 1) * timeSpeedMultiplier;
    const intervalMs = 200;
    const hourPerTick = (0.25 * mult * intervalMs) / 1000;

    const timer = setInterval(() => {
      setTimeOfDay((prev) => (prev + hourPerTick) % 24);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoCycle, isPlaying, isTimePaused, speed, timeSpeedMultiplier]);

  // Derived diurnal state
  const isNight = timeOfDay < 5.5 || timeOfDay > 19.5;

  // Continuous Sun and Moon calculation
  const sunAngle = ((timeOfDay - 6) / 24) * Math.PI * 2;
  const sunDist = 75;
  const sunX = Math.cos(sunAngle) * sunDist;
  const sunY = Math.sin(sunAngle) * sunDist;
  const sunZ = Math.sin(sunAngle * 0.5) * 35;

  const moonX = -sunX;
  const moonY = -sunY;
  const moonZ = -sunZ;

  // Base diurnal color palette
  let sunIntensity = 2.4;
  let directionalColor = '#fff6e5';
  let ambientColor = '#ffffff';
  let skyColor = '#9ec4b0';
  let fogColor = '#a8cbb8';
  let fogNear = 160;
  let fogFar = 360;

  if (timeOfDay >= 5.0 && timeOfDay < 7.5) {
    // Dawn / Sunrise
    const t = (timeOfDay - 5.0) / 2.5;
    sunIntensity = THREE.MathUtils.lerp(0.2, 1.8, t);
    directionalColor = '#ffb36b';
    ambientColor = '#e8b98d';
    skyColor = '#c49a79';
    fogColor = '#d9b493';
    fogNear = 150;
    fogFar = 340;
  } else if (timeOfDay >= 7.5 && timeOfDay <= 17.0) {
    // Full Daylight
    sunIntensity = 2.4;
    directionalColor = '#fff6e5';
    ambientColor = '#ffffff';
    skyColor = '#9ec4b0';
    fogColor = '#a8cbb8';
    fogNear = 160;
    fogFar = 360;

    // Biome-adaptive atmospheric tint
    if (civilization?.terrainType === 'Archipelago') {
      skyColor = '#7cb8d0';
      fogColor = '#92cde2';
      directionalColor = '#fffaf0';
    } else if (civilization?.terrainType === 'Crimson Canyon') {
      skyColor = '#a88574';
      fogColor = '#ba9582';
      directionalColor = '#ffeed6';
      ambientColor = '#f5e4d3';
    } else if (civilization?.terrainType === 'Frostpeak Taiga') {
      skyColor = '#8fa6b8';
      fogColor = '#a1b8c9';
      directionalColor = '#eef6fc';
    } else if (civilization?.terrainType === 'Obsidian Caldera') {
      skyColor = '#70606b';
      fogColor = '#82707c';
      directionalColor = '#ffe2d4';
    } else if (civilization?.terrainType === 'Arid Oasis') {
      skyColor = '#94b8ba';
      fogColor = '#a8cbcc';
      directionalColor = '#fff6db';
    }
  } else if (timeOfDay > 17.0 && timeOfDay <= 20.0) {
    // Golden Hour / Sunset
    const t = (timeOfDay - 17.0) / 3.0;
    sunIntensity = THREE.MathUtils.lerp(2.2, 0.4, t);
    directionalColor = '#ff884d';
    ambientColor = '#c97d65';
    skyColor = '#5e4359';
    fogColor = '#735269';
    fogNear = 150;
    fogFar = 340;
  } else {
    // Night
    sunIntensity = 0.5;
    directionalColor = '#80a8d6';
    ambientColor = '#18242f';
    skyColor = '#0b1319';
    fogColor = '#0d1820';
    fogNear = 140;
    fogFar = 320;
  }

  // Weather modifiers
  if (weather === 'cloudy') {
    sunIntensity *= 0.72;
    directionalColor = '#d0d8df';
    ambientColor = isNight ? '#141d24' : '#8fa1af';
    skyColor = isNight ? '#080d12' : '#6f838f';
    fogColor = isNight ? '#0b1218' : '#7d909c';
    fogNear = 120;
    fogFar = 280;
  } else if (weather === 'rain') {
    sunIntensity *= 0.45;
    directionalColor = '#95a8b8';
    ambientColor = isNight ? '#101720' : '#6b7d8c';
    skyColor = isNight ? '#060a0e' : '#455663';
    fogColor = isNight ? '#080d12' : '#526473';
    fogNear = 90;
    fogFar = 220;
  } else if (weather === 'fog') {
    sunIntensity *= 0.55;
    directionalColor = '#c5d0d8';
    ambientColor = isNight ? '#121922' : '#7c8e99';
    skyColor = isNight ? '#090e13' : '#667985';
    fogColor = isNight ? '#0c131a' : '#758894';
    fogNear = 70;
    fogFar = 180;
  }

  const value = useMemo<DayNightState>(
    () => ({
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
      fogNear,
      fogFar,
      weather,
      setWeather,
      isAutoWeather,
      setIsAutoWeather,
      isTimePaused,
      setIsTimePaused,
      timeSpeedMultiplier,
      setTimeSpeedMultiplier,
    }),
    [
      timeOfDay,
      isAutoCycle,
      isNight,
      sunIntensity,
      sunX,
      sunY,
      sunZ,
      moonX,
      moonY,
      moonZ,
      skyColor,
      fogColor,
      ambientColor,
      directionalColor,
      fogNear,
      fogFar,
      weather,
      isAutoWeather,
      isTimePaused,
      timeSpeedMultiplier,
    ]
  );

  return (
    <IsNightContext.Provider value={isNight}>
      <DayNightContext.Provider value={value}>{children}</DayNightContext.Provider>
    </IsNightContext.Provider>
  );
}

// ================= 3D SCENE LIGHTING & ENVIRONMENT COMPONENT =================
interface WorldLightingProps {
  shadowMapSize?: number;
}

export const WorldLighting = React.memo(function WorldLighting({
  shadowMapSize = 2048,
}: WorldLightingProps = {}) {
  const {
    isNight,
    sunIntensity,
    sunPosition,
    moonPosition,
    directionalColor,
    ambientColor,
    skyColor,
    fogColor,
    fogNear,
    fogFar,
    weather,
  } = useDayNight();

  const sunRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      {/* Global Ambient Light */}
      <ambientLight intensity={isNight ? 0.35 : 0.95} color={ambientColor} />

      {/* Hemisphere Light for natural bounce */}
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
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={15}
        shadow-camera-far={200}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-bias={-0.0003}
      />

      {/* Secondary Fill Light */}
      <directionalLight
        position={[-35, 30, -35]}
        intensity={isNight ? 0.2 : 0.55}
        color={isNight ? '#486380' : '#b0dbff'}
      />

      {/* Celestial Moon with Soft Lunar Atmosphere */}
      <CelestialMoon position={moonPosition} isNight={isNight} />

      {/* Starfield in Nighttime Sky */}
      <Starfield isNight={isNight} />

      {/* Dynamic Rain Particles */}
      <RainParticles isRaining={weather === 'rain'} />
    </>
  );
});
