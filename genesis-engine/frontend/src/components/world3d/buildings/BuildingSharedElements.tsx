import React from 'react';
import * as THREE from 'three';
import { useIsNight } from '../DayNightController';

// Shared Pre-Allocated Geometries for Maximum GPU Buffer Reuse
const doorFrameGeo = new THREE.BoxGeometry(0.7, 1.08, 0.06);
const doorPanelGeo = new THREE.PlaneGeometry(0.6, 1.0);
const doorAwningGeo = new THREE.BoxGeometry(0.85, 0.06, 0.35);

const windowFrameGeo = new THREE.BoxGeometry(0.76, 0.56, 0.04);
const windowGlassGeo = new THREE.PlaneGeometry(0.7, 0.5);

const balconyFloorGeo = new THREE.BoxGeometry(1.4, 0.08, 0.6);
const balconyFrontGlassGeo = new THREE.BoxGeometry(1.4, 0.45, 0.04);
const balconySideGlassGeo = new THREE.BoxGeometry(0.04, 0.45, 0.6);
const balconyRailGeo = new THREE.BoxGeometry(1.44, 0.04, 0.06);

const hvacBoxGeo = new THREE.BoxGeometry(0.7, 0.5, 0.9);
const hvacVentGeo = new THREE.CircleGeometry(0.26, 10);

const tankLegGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
const tankCylinderGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.65, 12);
const tankConeGeo = new THREE.ConeGeometry(0.42, 0.22, 12);

const solarPostGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.16, 6);
const solarPanelGeo = new THREE.BoxGeometry(0.9, 0.04, 0.65);

const antennaMastGeo = new THREE.CylinderGeometry(0.025, 0.06, 1.8, 6);
const antennaBeaconGeo = new THREE.SphereGeometry(0.07, 8, 8);

const redCrossHGeo = new THREE.BoxGeometry(0.6, 0.18, 0.05);
const redCrossVGeo = new THREE.BoxGeometry(0.18, 0.6, 0.05);

// Shared Pre-Allocated Materials for Maximum Shader / Draw Batching
const doorFrameMat = new THREE.MeshStandardMaterial({ color: '#2d332e', metalness: 0.5, roughness: 0.4 });
const doorPanelMat = new THREE.MeshStandardMaterial({ color: '#7a5538', roughness: 0.6 });
const doorAwningMat = new THREE.MeshStandardMaterial({ color: '#354037', metalness: 0.6 });

const windowFrameMat = new THREE.MeshStandardMaterial({ color: '#222b24', roughness: 0.5 });
const windowGlassDayMat = new THREE.MeshBasicMaterial({ color: '#d2e4ba', transparent: true, opacity: 0.6 });
const windowGlassNightMat = new THREE.MeshBasicMaterial({ color: '#ffeaa7', transparent: true, opacity: 0.95 });

const balconyFloorMat = new THREE.MeshStandardMaterial({ color: '#424c44', roughness: 0.6 });
const balconyGlassMat = new THREE.MeshStandardMaterial({ color: '#74b9ff', transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.7 });
const balconyRailMat = new THREE.MeshStandardMaterial({ color: '#dcdad5', metalness: 0.8 });

const hvacBoxMat = new THREE.MeshStandardMaterial({ color: '#4d5951', roughness: 0.6 });
const hvacVentMat = new THREE.MeshStandardMaterial({ color: '#2d3630', metalness: 0.7 });

const tankLegMat = new THREE.MeshStandardMaterial({ color: '#303831', metalness: 0.8 });
const tankBodyMat = new THREE.MeshStandardMaterial({ color: '#8a6142', roughness: 0.7 });
const tankCapMat = new THREE.MeshStandardMaterial({ color: '#473221' });

const solarPostMat = new THREE.MeshStandardMaterial({ color: '#2d352e' });
const solarPanelMat = new THREE.MeshStandardMaterial({ color: '#1b3652', metalness: 0.9, roughness: 0.08 });

const antennaMastMat = new THREE.MeshStandardMaterial({ color: '#dcdad5', metalness: 0.8 });
const antennaBeaconNightMat = new THREE.MeshStandardMaterial({ color: '#ff2222', emissive: '#ff1111', emissiveIntensity: 2.5 });
const antennaBeaconDayMat = new THREE.MeshStandardMaterial({ color: '#ff2222', emissive: '#ff1111', emissiveIntensity: 0.8 });

const redCrossMat = new THREE.MeshBasicMaterial({ color: '#e74c3c' });

// Shared Architectural Doorway Unit
export const ArchitecturalDoor = React.memo(function ArchitecturalDoor({
  width = 0.6,
  height = 1.0,
  position = [0, 0, 0],
}: {
  width?: number;
  height?: number;
  position?: [number, number, number];
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y + height * 0.5, z]} raycast={() => null}>
      <mesh geometry={doorFrameGeo} material={doorFrameMat} />
      <mesh position={[0, 0, 0.02]} geometry={doorPanelGeo} material={doorPanelMat} />
      <mesh position={[0, height * 0.5 + 0.08, 0.15]} rotation={[0.2, 0, 0]} geometry={doorAwningGeo} material={doorAwningMat} />
    </group>
  );
});

// Reusable Day/Night Window Unit with zero-allocation geometry & material
export const ArchitecturalWindow = React.memo(function ArchitecturalWindow({
  width = 0.7,
  height = 0.5,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isLit = true,
}: {
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  isLit?: boolean;
}) {
  const isNight = useIsNight();
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]} rotation={rotation} raycast={() => null}>
      <mesh geometry={windowFrameGeo} material={windowFrameMat} />
      <mesh position={[0, 0, 0.01]} geometry={windowGlassGeo} material={isNight && isLit ? windowGlassNightMat : windowGlassDayMat} />
    </group>
  );
});

// Modern Glass/Steel Balcony Unit
export const ArchitecturalBalcony = React.memo(function ArchitecturalBalcony({
  position = [0, 0, 0],
}: {
  width?: number;
  depth?: number;
  position?: [number, number, number];
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} raycast={() => null}>
      <mesh position={[0, 0, 0.3]} receiveShadow geometry={balconyFloorGeo} material={balconyFloorMat} />
      <mesh position={[0, 0.25, 0.6]} geometry={balconyFrontGlassGeo} material={balconyGlassMat} />
      <mesh position={[-0.7, 0.25, 0.3]} geometry={balconySideGlassGeo} material={balconyGlassMat} />
      <mesh position={[0.7, 0.25, 0.3]} geometry={balconySideGlassGeo} material={balconyGlassMat} />
      <mesh position={[0, 0.48, 0.6]} geometry={balconyRailGeo} material={balconyRailMat} />
    </group>
  );
});

// Rooftop HVAC Chiller Unit
export const RooftopHVAC = React.memo(function RooftopHVAC({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} raycast={() => null}>
      <mesh position={[0, 0.25, 0]} geometry={hvacBoxGeo} material={hvacBoxMat} />
      <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={hvacVentGeo} material={hvacVentMat} />
    </group>
  );
});

// Rooftop Municipal Water Tank
export const RooftopWaterTank = React.memo(function RooftopWaterTank({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} raycast={() => null}>
      <mesh position={[-0.25, 0.2, -0.25]} geometry={tankLegGeo} material={tankLegMat} />
      <mesh position={[-0.25, 0.2, 0.25]} geometry={tankLegGeo} material={tankLegMat} />
      <mesh position={[0.25, 0.2, -0.25]} geometry={tankLegGeo} material={tankLegMat} />
      <mesh position={[0.25, 0.2, 0.25]} geometry={tankLegGeo} material={tankLegMat} />
      <mesh position={[0, 0.65, 0]} geometry={tankCylinderGeo} material={tankBodyMat} />
      <mesh position={[0, 1.05, 0]} geometry={tankConeGeo} material={tankCapMat} />
    </group>
  );
});

// Rooftop Angled Solar Collector Panel
export const RooftopSolarPanel = React.memo(function RooftopSolarPanel({
  position = [0, 0, 0],
  rotationY = 0,
}: {
  position?: [number, number, number];
  rotationY?: number;
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]} raycast={() => null}>
      <mesh position={[0, 0.08, 0]} geometry={solarPostGeo} material={solarPostMat} />
      <mesh position={[0, 0.22, 0]} rotation={[0.38, 0, 0]} geometry={solarPanelGeo} material={solarPanelMat} />
    </group>
  );
});

// Rooftop Communication Antenna with Blinking Obstruction Beacon
export const AntennaMast = React.memo(function AntennaMast({
  position = [0, 0, 0],
  height = 1.8,
}: {
  position?: [number, number, number];
  height?: number;
}) {
  const isNight = useIsNight();
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]} raycast={() => null}>
      <mesh position={[0, height * 0.5, 0]} geometry={antennaMastGeo} material={antennaMastMat} />
      <mesh position={[0, height + 0.05, 0]} geometry={antennaBeaconGeo} material={isNight ? antennaBeaconNightMat : antennaBeaconDayMat} />
    </group>
  );
});

// 3D Red Cross Medical Emblem
export const RedCrossEmblem = React.memo(function RedCrossEmblem({
  position = [0, 0, 0],
  scale = 1.0,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} scale={scale} raycast={() => null}>
      <mesh geometry={redCrossHGeo} material={redCrossMat} />
      <mesh geometry={redCrossVGeo} material={redCrossMat} />
    </group>
  );
});
