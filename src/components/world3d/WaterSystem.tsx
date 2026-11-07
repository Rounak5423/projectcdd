import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getRiverPath, getRiverDerivative, getRiverZ } from './Terrain';
import { useDayNight } from './DayNightController';

// Exact pier coordinates matching RoadNetwork.tsx bridges
const BRIDGE_PIERS: [number, number][] = [
  // Central Arch Bridge piers
  [0, -7.2],
  [0, 1.2],
  // West Suspension Bridge piers
  [-25, -20.4],
  [-25, -12.0],
  // East Truss Bridge piers
  [25, 3.6],
  [25, 12.4],
];

function getUnderBridgeWeight(x: number, z: number): number {
  // Central Citadel Arch Bridge: X in [-3.2, 3.2], Z in [-10.5, 4.5]
  if (Math.abs(x) < 3.2 && z >= -10.5 && z <= 4.5) {
    const edgeX = (3.2 - Math.abs(x)) / 1.0;
    return Math.min(1.0, Math.max(0.0, edgeX));
  }
  // West Suspension Bridge: X in [-27.6, -22.4], Z in [-23.7, -8.7]
  if (Math.abs(x - (-25)) < 2.6 && z >= -23.7 && z <= -8.7) {
    const edgeX = (2.6 - Math.abs(x - (-25))) / 1.0;
    return Math.min(1.0, Math.max(0.0, edgeX));
  }
  // East Industrial Truss Bridge: X in [22.4, 27.6], Z in [0.25, 15.75]
  if (Math.abs(x - 25) < 2.6 && z >= 0.25 && z <= 15.75) {
    const edgeX = (2.6 - Math.abs(x - 25)) / 1.0;
    return Math.min(1.0, Math.max(0.0, edgeX));
  }
  return 0.0;
}

function getPierProximity(x: number, z: number): number {
  let maxProx = 0.0;
  for (const [px, pz] of BRIDGE_PIERS) {
    const d = Math.hypot(x - px, z - pz);
    if (d < 3.0) {
      const p = Math.max(0.0, 1.0 - d / 3.0);
      maxProx = Math.max(maxProx, p);
    }
  }
  return maxProx;
}

// ================= GLSL SHADERS FOR NATURAL FRESHWATER RIVER =================

const RiverVertexShader = /* glsl */ `
  attribute vec4 flowParams; // x: speedMult, y: underBridge, z: pierProx, w: bankDamping
  attribute vec3 tangent;

  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec4 vFlowParams;
  varying vec3 vTangent;
  varying vec3 vBitangent;

  void main() {
    vUv = uv;
    vFlowParams = flowParams;
    vTangent = normalize(normalMatrix * tangent);
    vNormal = normalize(normalMatrix * normal);
    vBitangent = normalize(cross(vNormal, vTangent));

    // Natural river: Calm level surface without large unnatural vertical waves.
    // Extremely subtle capillary micro-ripple (<= 2mm) preserving level water elevation.
    float speed = flowParams.x;
    float bank = flowParams.w;
    float microRipple = sin(uv.x * 12.0 - uTime * 0.8 * speed) * 0.002 * bank;

    vec3 pos = position;
    pos.y += microRipple;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const RiverFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunPosition;
  uniform vec3 uSunColor;
  uniform float uSunIntensity;
  uniform vec3 uSkyColor;
  uniform vec3 uCameraPosition;
  uniform float uIsNight;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec4 vFlowParams;
  varying vec3 vTangent;
  varying vec3 vBitangent;

  void main() {
    float speed = vFlowParams.x;
    float underBridge = vFlowParams.y;
    float pierProx = vFlowParams.z;
    float bank = vFlowParams.w;

    // 1. Dual-Octave Directional Flow in Curvilinear Tangent Space
    // Downstream advection along streamwise coordinate (vUv.x)
    vec2 coord1 = vec2(vUv.x * 3.8 - uTime * 0.38 * speed, vUv.y * 3.2 + sin(vUv.x * 1.8 + uTime * 0.18) * 0.12);
    vec2 coord2 = vec2(vUv.x * 7.5 - uTime * 0.58 * speed + 0.35, vUv.y * 5.4 - uTime * 0.12);
    vec2 coord3 = vec2(vUv.x * 15.0 - uTime * 0.92 * speed, vUv.y * 9.2 + sin(uTime * 0.25) * 0.08);

    // Subtle gentle slope perturbations (calm flowing streamlets without violent churning)
    float d1 = cos(coord1.x * 6.283) * 0.032;
    float d2 = sin(coord1.y * 6.283) * 0.026;
    float d3 = cos(coord2.x * 6.283) * 0.022;
    float d4 = sin(coord2.y * 6.283) * 0.018;
    float d5 = sin(coord3.x * 6.283) * 0.012;
    float d6 = cos(coord3.y * 6.283) * 0.009;

    float slopeU = d1 + d3 + d5;
    float slopeV = d2 + d4 + d6;

    // Bank damping: water is naturally calmer near shoreline
    slopeU *= (0.4 + 0.6 * bank);
    slopeV *= (0.4 + 0.6 * bank);

    // Subtle pier wake deflection
    if (pierProx > 0.01) {
      float swirl = sin(vUv.x * 14.0 - uTime * 2.8) * cos(vUv.y * 18.0);
      slopeU += swirl * 0.038 * pierProx;
      slopeV += swirl * 0.038 * pierProx;
    }

    vec3 normalMap = normalize(vec3(-slopeU, 1.0, -slopeV));
    vec3 N = normalize(vNormal * normalMap.y + vTangent * normalMap.x + vBitangent * normalMap.z);

    // 2. View Vector & Real Freshwater Fresnel Reflectance
    vec3 V = normalize(uCameraPosition - vWorldPosition);
    float NdotV = max(0.0, dot(N, V));
    float F0 = 0.025; // Physical freshwater refractive index ~1.33
    float fresnel = F0 + (1.0 - F0) * pow(clamp(1.0 - NdotV, 0.0, 1.0), 4.2);

    // 3. Clear, Vibrant Natural Blue River Color Palette
    // Day palette: Rich deep sapphire thalweg -> vibrant natural river azure -> sunlit sky-blue crystal shallows
    vec3 cDeepThalweg = vec3(0.025, 0.130, 0.360); // Deep sapphire blue channel
    vec3 cMidChannel  = vec3(0.055, 0.260, 0.540); // Radiant natural river azure blue
    vec3 cShallows    = vec3(0.120, 0.420, 0.720); // Crystal clear sky-blue shallows

    // Night palette: calm moonlit dark navy river
    vec3 cNightDeep   = vec3(0.010, 0.038, 0.120);
    vec3 cNightMid    = vec3(0.018, 0.075, 0.190);
    vec3 cNightShallow= vec3(0.038, 0.125, 0.280);

    vec3 waterDeep = mix(cDeepThalweg, cNightDeep, uIsNight);
    vec3 waterMid  = mix(cMidChannel, cNightMid, uIsNight);
    vec3 waterShallow = mix(cShallows, cNightShallow, uIsNight);

    float centerDist = abs(vUv.y - 0.5) * 2.0;
    vec3 waterColor = mix(waterDeep, waterMid, smoothstep(0.0, 0.55, centerDist));
    waterColor = mix(waterColor, waterShallow, smoothstep(0.55, 0.98, centerDist));

    // Under-Bridge Ambient Shadowing: water darkens naturally under bridge decks
    if (underBridge > 0.01) {
      vec3 bridgeShade = mix(vec3(0.015, 0.055, 0.140), vec3(0.005, 0.018, 0.060), uIsNight);
      waterColor = mix(waterColor, bridgeShade, underBridge * 0.52);
    }

    // 4. Soft Environmental Sky Reflection
    vec3 skyReflect = mix(uSkyColor * 0.90, vec3(0.58, 0.78, 0.96), 0.42);
    if (uIsNight > 0.5) {
      skyReflect = vec3(0.05, 0.10, 0.22);
    }

    // 5. Soft Sunlight Sheen (No blinding plastic glare)
    vec3 L = normalize(uSunPosition - vWorldPosition);
    vec3 H = normalize(L + V);
    float NdotH = max(0.0, dot(N, H));

    float glintSpec = pow(NdotH, 64.0) * (uIsNight > 0.5 ? 0.35 : 0.70) * uSunIntensity;
    float broadSheen = pow(NdotH, 16.0) * (uIsNight > 0.5 ? 0.08 : 0.16);
    vec3 specular = uSunColor * (glintSpec + broadSheen);

    // Bridge decks block direct overhead sunlight
    specular *= (1.0 - underBridge * 0.95);

    // 6. Subtle Pier Micro-Wake (No excessive white foam)
    float wakeFactor = 0.0;
    if (pierProx > 0.08) {
      float wakeNoise = sin(vUv.x * 24.0 - uTime * 3.2) * cos(vUv.y * 28.0);
      wakeFactor = clamp((wakeNoise - 0.5) * 1.8, 0.0, 0.28) * pierProx;
    }
    vec3 wakeColor = mix(vec3(0.86, 0.93, 0.99), vec3(0.35, 0.48, 0.65), uIsNight);

    // 7. Composite Natural Water Color
    vec3 finalColor = mix(waterColor, skyReflect, fresnel * 0.62);
    finalColor += specular;
    finalColor = mix(finalColor, wakeColor, wakeFactor);

    // Natural Optical Depth Opacity:
    // Deep center has high absorption (0.92), clear shallows reveal submerged pebbles (0.76)
    float alpha = mix(0.92, 0.76, smoothstep(0.35, 0.98, centerDist));
    alpha = mix(alpha, 0.96, underBridge * 0.45);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const LakeVertexShader = /* glsl */ `
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    // Concentric micro-ripples dampened to zero at shoreline
    float r = length(position.xz);
    float edgeDamp = max(0.0, 1.0 - r / 12.2);

    float ripple1 = sin(r * 1.6 - uTime * 1.2) * 0.003 * edgeDamp;
    float ripple2 = cos(r * 2.8 - uTime * 1.8 + position.x * 0.3) * 0.002 * edgeDamp;

    vec3 pos = position;
    pos.y += ripple1 + ripple2;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const LakeFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSunPosition;
  uniform vec3 uSunColor;
  uniform float uSunIntensity;
  uniform vec3 uSkyColor;
  uniform vec3 uCameraPosition;
  uniform float uIsNight;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    float r = length(vWorldPosition.xz - vec2(-38.0, -22.0));
    float rFrac = clamp(r / 12.2, 0.0, 1.0);

    // Concentric wave normal ripples
    float rippleNormX = cos(r * 2.2 - uTime * 1.2) * 0.025 * (1.0 - rFrac);
    float rippleNormZ = sin(r * 2.2 - uTime * 1.2) * 0.025 * (1.0 - rFrac);
    vec3 N = normalize(vec3(-rippleNormX, 1.0, -rippleNormZ));

    vec3 V = normalize(uCameraPosition - vWorldPosition);
    float NdotV = max(0.0, dot(N, V));
    float fresnel = 0.025 + (1.0 - 0.025) * pow(clamp(1.0 - NdotV, 0.0, 1.0), 4.2);

    vec3 cDeep = mix(vec3(0.025, 0.140, 0.360), vec3(0.010, 0.045, 0.130), uIsNight);
    vec3 cEdge = mix(vec3(0.120, 0.420, 0.680), vec3(0.035, 0.120, 0.260), uIsNight);
    vec3 waterColor = mix(cDeep, cEdge, pow(rFrac, 1.2));

    vec3 skyReflect = mix(uSkyColor * 0.90, vec3(0.58, 0.78, 0.96), 0.42);
    if (uIsNight > 0.5) {
      skyReflect = vec3(0.05, 0.10, 0.22);
    }

    vec3 L = normalize(uSunPosition - vWorldPosition);
    vec3 H = normalize(L + V);
    float NdotH = max(0.0, dot(N, H));
    float sheen = pow(NdotH, 48.0) * (uIsNight > 0.5 ? 0.3 : 0.65) * uSunIntensity;
    vec3 specular = uSunColor * sheen;

    vec3 finalColor = mix(waterColor, skyReflect, fresnel * 0.65) + specular;
    gl_FragColor = vec4(finalColor, 0.92);
  }
`;

export default React.memo(function WaterSystem() {
  const { isNight, sunPosition, sunIntensity, skyColor, directionalColor } = useDayNight();
  const { camera } = useThree();

  const riverMeshRef = useRef<THREE.Mesh>(null);
  const lakeMeshRef = useRef<THREE.Mesh>(null);

  // 1. Procedural High-Definition Curvilinear Frenet-Frame River Geometry
  const { riverGeo, shoreGeo, lakeGeo, reedTransforms, stoneTransforms } = useMemo(() => {
    const SEGMENTS_X = 180; // High longitudinal resolution along the meanders
    const minX = -64;
    const maxX = 64;
    const stepX = (maxX - minX) / SEGMENTS_X;
    const LATERAL_COLS = 15; // Smooth lateral subdivision across stream channel

    const riverPositions: number[] = [];
    const riverNormals: number[] = [];
    const riverTangents: number[] = [];
    const riverUvs: number[] = [];
    const riverFlowParams: number[] = [];
    const riverIndices: number[] = [];

    // Wet Sand/Silt Shore Under-Ribbons (Seamless Land-Water Transition)
    const shorePositions: number[] = [];
    const shoreIndices: number[] = [];

    let accumulatedStreamDist = 0;
    let prevX = minX;
    let prevZ = getRiverZ(minX);

    for (let r = 0; r <= SEGMENTS_X; r++) {
      const frac = r / SEGMENTS_X;
      const x = minX + frac * (maxX - minX);
      const { z: rz, width: baseWidth } = getRiverPath(x);
      const { tangentX, tangentZ } = getRiverDerivative(x);

      // Perpendicular normal in horizontal plane (cross-stream direction)
      const normX = -tangentZ;
      const normZ = tangentX;

      // Accumulated streamwise distance for seamless UV flow coordinate
      const stepDist = Math.hypot(x - prevX, rz - prevZ);
      accumulatedStreamDist += stepDist;
      prevX = x;
      prevZ = rz;
      const u = accumulatedStreamDist / 8.0;

      // Local flow velocity multiplier (Venturi effect: narrower = faster, wider = calmer)
      const speedMult = Math.min(1.35, Math.max(0.68, 11.2 / baseWidth));

      // Natural organic bank edge variation (dampened to 0 near bridges for clean abutment fit)
      const bridgeProx = Math.max(
        Math.exp(-Math.pow((x - (-25)) / 4.5, 2)),
        Math.exp(-Math.pow(x / 4.5, 2)),
        Math.exp(-Math.pow((x - 25) / 4.5, 2))
      );
      const bankDamp = 1.0 - bridgeProx;

      const bankWiggleL = (Math.sin(x * 0.38) * 0.38 + Math.cos(x * 0.75) * 0.18) * bankDamp;
      const bankWiggleR = (Math.cos(x * 0.42 + 1.2) * 0.38 + Math.sin(x * 0.71) * 0.18) * bankDamp;

      // Generate lateral cross-section vertices along the true perpendicular normal
      for (let c = 0; c < LATERAL_COLS; c++) {
        const lateralT = c / (LATERAL_COLS - 1); // 0.0 (left bank) to 1.0 (right bank)
        const centeredT = lateralT - 0.5; // -0.5 to +0.5

        // Offset along perpendicular normal
        const edgeWiggle = (1.0 - lateralT) * bankWiggleL + lateralT * bankWiggleR;
        const offset = centeredT * baseWidth + edgeWiggle;

        const vx = x + normX * offset;
        const vz = rz + normZ * offset;
        const vy = -0.14; // Calm, level river surface elevation

        riverPositions.push(vx, vy, vz);
        riverNormals.push(0, 1, 0);
        riverTangents.push(tangentX, 0, tangentZ);
        riverUvs.push(u, lateralT);

        const underBridge = getUnderBridgeWeight(vx, vz);
        const pierProx = getPierProximity(vx, vz);
        const bankDamping = Math.sin(lateralT * Math.PI); // 0 at banks, 1 in center channel

        riverFlowParams.push(speedMult, underBridge, pierProx, bankDamping);
      }

      // Shore Wet Sand & Gravel Under-Ribbons along Left & Right Banks
      // Follows the exact organic bank edges with a 1.2m gravel border
      const offsetL = -0.5 * baseWidth + bankWiggleL;
      const offsetR = 0.5 * baseWidth + bankWiggleR;

      const xL0 = x + normX * offsetL;
      const zL0 = rz + normZ * offsetL;
      const xL1 = x + normX * (offsetL - 1.2);
      const zL1 = rz + normZ * (offsetL - 1.2);

      const xR0 = x + normX * offsetR;
      const zR0 = rz + normZ * offsetR;
      const xR1 = x + normX * (offsetR + 1.2);
      const zR1 = rz + normZ * (offsetR + 1.2);

      // Heights: slightly submerged at water's edge (-0.18), rising to moist shore (-0.08)
      shorePositions.push(xL0, -0.18, zL0, xL1, -0.08, zL1);
      shorePositions.push(xR0, -0.18, zR0, xR1, -0.08, zR1);

      // Generate Quads
      if (r < SEGMENTS_X) {
        // River quads
        for (let c = 0; c < LATERAL_COLS - 1; c++) {
          const p0 = r * LATERAL_COLS + c;
          const p1 = r * LATERAL_COLS + (c + 1);
          const p2 = (r + 1) * LATERAL_COLS + c;
          const p3 = (r + 1) * LATERAL_COLS + (c + 1);

          riverIndices.push(p0, p2, p1);
          riverIndices.push(p1, p2, p3);
        }

        // Shore quads
        const sBase = r * 4;
        shoreIndices.push(sBase, sBase + 4, sBase + 1);
        shoreIndices.push(sBase + 1, sBase + 4, sBase + 5);
        shoreIndices.push(sBase + 2, sBase + 3, sBase + 6);
        shoreIndices.push(sBase + 3, sBase + 7, sBase + 6);
      }
    }

    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.Float32BufferAttribute(riverPositions, 3));
    rGeo.setAttribute('normal', new THREE.Float32BufferAttribute(riverNormals, 3));
    rGeo.setAttribute('tangent', new THREE.Float32BufferAttribute(riverTangents, 3));
    rGeo.setAttribute('uv', new THREE.Float32BufferAttribute(riverUvs, 2));
    rGeo.setAttribute('flowParams', new THREE.Float32BufferAttribute(riverFlowParams, 4));
    rGeo.setIndex(riverIndices);

    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.Float32BufferAttribute(shorePositions, 3));
    sGeo.setIndex(shoreIndices);
    sGeo.computeVertexNormals();

    // 2. Alpine Reservoir Lake Subdivided Mesh
    const LAKE_RINGS = 16;
    const LAKE_SLICES = 54;
    const lakeRadius = 12.2;
    const lPos: number[] = [];
    const lNorm: number[] = [];
    const lUv: number[] = [];
    const lIdx: number[] = [];

    lPos.push(0, -0.14, 0);
    lNorm.push(0, 1, 0);
    lUv.push(0.5, 0.5);

    for (let ring = 1; ring <= LAKE_RINGS; ring++) {
      const ringFrac = ring / LAKE_RINGS;
      const rDist = ringFrac * lakeRadius;
      for (let s = 0; s < LAKE_SLICES; s++) {
        const theta = (s / LAKE_SLICES) * Math.PI * 2;
        const lx = Math.cos(theta) * rDist;
        const lz = Math.sin(theta) * rDist;
        lPos.push(lx, -0.14, lz);
        lNorm.push(0, 1, 0);
        lUv.push(0.5 + Math.cos(theta) * 0.5 * ringFrac, 0.5 + Math.sin(theta) * 0.5 * ringFrac);
      }
    }

    for (let s = 0; s < LAKE_SLICES; s++) {
      const nextS = (s + 1) % LAKE_SLICES;
      lIdx.push(0, s + 1, nextS + 1);
    }

    for (let ring = 1; ring < LAKE_RINGS; ring++) {
      const ringStart = 1 + (ring - 1) * LAKE_SLICES;
      const nextRingStart = 1 + ring * LAKE_SLICES;
      for (let s = 0; s < LAKE_SLICES; s++) {
        const nextS = (s + 1) % LAKE_SLICES;
        const p0 = ringStart + s;
        const p1 = ringStart + nextS;
        const p2 = nextRingStart + s;
        const p3 = nextRingStart + nextS;
        lIdx.push(p0, p2, p1);
        lIdx.push(p1, p2, p3);
      }
    }

    const lkGeo = new THREE.BufferGeometry();
    lkGeo.setAttribute('position', new THREE.Float32BufferAttribute(lPos, 3));
    lkGeo.setAttribute('normal', new THREE.Float32BufferAttribute(lNorm, 3));
    lkGeo.setAttribute('uv', new THREE.Float32BufferAttribute(lUv, 2));
    lkGeo.setIndex(lIdx);

    // 3. Shoreline Flora (Reeds & River Stones along shallow inner river bends)
    let seed = 89;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const reeds: THREE.Matrix4[] = [];
    const stones: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < 70; i++) {
      const rx = -55 + rnd() * 110;
      // Skip bridge zones
      if (Math.abs(rx - (-25)) < 4.0 || Math.abs(rx) < 4.0 || Math.abs(rx - 25) < 4.0) continue;

      const { z: rz, width } = getRiverPath(rx);
      const { tangentX, tangentZ } = getRiverDerivative(rx);
      const normX = -tangentZ;
      const normZ = tangentX;
      const halfW = width * 0.5;
      const side = rnd() > 0.5 ? 1 : -1;
      const dist = halfW + 0.3 + rnd() * 0.9;

      const px = rx + normX * side * dist;
      const pz = rz + normZ * side * dist;

      dummy.position.set(px, -0.10, pz);
      dummy.rotation.set(0, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.12);
      const s = 0.65 + rnd() * 0.55;
      dummy.scale.set(s, s * (1.0 + rnd() * 0.35), s);
      dummy.updateMatrix();
      reeds.push(dummy.matrix.clone());
    }

    for (let i = 0; i < 50; i++) {
      const rx = -56 + rnd() * 112;
      if (Math.abs(rx - (-25)) < 4.0 || Math.abs(rx) < 4.0 || Math.abs(rx - 25) < 4.0) continue;

      const { z: rz, width } = getRiverPath(rx);
      const { tangentX, tangentZ } = getRiverDerivative(rx);
      const normX = -tangentZ;
      const normZ = tangentX;
      const halfW = width * 0.5;
      const side = rnd() > 0.5 ? 1 : -1;
      const dist = halfW - 0.3 + rnd() * 0.8;

      const px = rx + normX * side * dist;
      const pz = rz + normZ * side * dist;

      dummy.position.set(px, -0.15, pz);
      dummy.rotation.set(rnd() * 0.3, rnd() * Math.PI * 2, rnd() * 0.3);
      const sx = 0.35 + rnd() * 0.5;
      const sy = 0.20 + rnd() * 0.3;
      const sz = 0.35 + rnd() * 0.5;
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      stones.push(dummy.matrix.clone());
    }

    return {
      riverGeo: rGeo,
      shoreGeo: sGeo,
      lakeGeo: lkGeo,
      reedTransforms: reeds,
      stoneTransforms: stones,
    };
  }, []);

  // Geometry cleanup on unmount
  useEffect(() => {
    return () => {
      riverGeo.dispose();
      shoreGeo.dispose();
      lakeGeo.dispose();
    };
  }, [riverGeo, shoreGeo, lakeGeo]);

  // Dedicated River Shader Material
  const riverMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: RiverVertexShader,
      fragmentShader: RiverFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSunPosition: { value: new THREE.Vector3(40, 55, 30) },
        uSunColor: { value: new THREE.Color('#ffffff') },
        uSunIntensity: { value: 1.0 },
        uSkyColor: { value: new THREE.Color('#d4e6f1') },
        uCameraPosition: { value: new THREE.Vector3(0, 30, 40) },
        uIsNight: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);

  // Dedicated Lake Shader Material
  const lakeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: LakeVertexShader,
      fragmentShader: LakeFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSunPosition: { value: new THREE.Vector3(40, 55, 30) },
        uSunColor: { value: new THREE.Color('#ffffff') },
        uSunIntensity: { value: 1.0 },
        uSkyColor: { value: new THREE.Color('#d4e6f1') },
        uCameraPosition: { value: new THREE.Vector3(0, 30, 40) },
        uIsNight: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, []);

  useEffect(() => {
    return () => {
      riverMaterial.dispose();
      lakeMaterial.dispose();
    };
  }, [riverMaterial, lakeMaterial]);

  // Per-frame uniform updates
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    // 1. Update River Shader Uniforms
    riverMaterial.uniforms.uTime.value = elapsed;
    riverMaterial.uniforms.uCameraPosition.value.copy(camera.position);
    riverMaterial.uniforms.uSunPosition.value.set(sunPosition[0], sunPosition[1], sunPosition[2]);
    riverMaterial.uniforms.uSunColor.value.set(directionalColor);
    riverMaterial.uniforms.uSunIntensity.value = sunIntensity;
    riverMaterial.uniforms.uSkyColor.value.set(skyColor);
    riverMaterial.uniforms.uIsNight.value = isNight ? 1.0 : 0.0;

    // 2. Update Lake Shader Uniforms
    lakeMaterial.uniforms.uTime.value = elapsed;
    lakeMaterial.uniforms.uCameraPosition.value.copy(camera.position);
    lakeMaterial.uniforms.uSunPosition.value.set(sunPosition[0], sunPosition[1], sunPosition[2]);
    lakeMaterial.uniforms.uSunColor.value.set(directionalColor);
    lakeMaterial.uniforms.uSunIntensity.value = sunIntensity;
    lakeMaterial.uniforms.uSkyColor.value.set(skyColor);
    lakeMaterial.uniforms.uIsNight.value = isNight ? 1.0 : 0.0;
  });

  // Reed and Stone Meshes
  const reedMeshRef = useRef<THREE.InstancedMesh>(null);
  const stoneMeshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (reedMeshRef.current) {
      reedTransforms.forEach((m, i) => reedMeshRef.current?.setMatrixAt(i, m));
      reedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (stoneMeshRef.current) {
      stoneTransforms.forEach((m, i) => stoneMeshRef.current?.setMatrixAt(i, m));
      stoneMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [reedTransforms, stoneTransforms]);

  // Reed compound geometry (stalk + cattail head)
  const reedGeo = useMemo(() => {
    const stalk = new THREE.CylinderGeometry(0.02, 0.03, 1.2, 5);
    stalk.translate(0, 0.6, 0);
    const head = new THREE.CylinderGeometry(0.045, 0.045, 0.35, 6);
    head.translate(0, 1.05, 0);

    const merged = new THREE.BufferGeometry();
    const pos = new Float32Array([...stalk.attributes.position.array, ...head.attributes.position.array]);
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    merged.computeVertexNormals();
    stalk.dispose();
    head.dispose();
    return merged;
  }, []);

  const stoneGeo = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(0.55, 1);
    geo.scale(1.2, 0.55, 1.1);
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      reedGeo.dispose();
      stoneGeo.dispose();
    };
  }, [reedGeo, stoneGeo]);

  return (
    <group raycast={() => null}>
      {/* 1. Wet Sand & Gravel Silt Shore Under-Ribbon (Seamless Land-Water Transition) */}
      <mesh geometry={shoreGeo} receiveShadow>
        <meshStandardMaterial
          color={isNight ? '#24201a' : '#453c30'}
          roughness={0.75}
          metalness={0.08}
        />
      </mesh>

      {/* 2. Main Photorealistic Directional Flowing River */}
      <mesh
        ref={riverMeshRef}
        geometry={riverGeo}
        material={riverMaterial}
        receiveShadow
      />

      {/* 3. Alpine Reservoir Lake with Serene Concentric Water */}
      <group position={[-38, -0.14, -22]}>
        <mesh
          ref={lakeMeshRef}
          geometry={lakeGeo}
          material={lakeMaterial}
          receiveShadow
        />

        {/* Lake shoreline wet sand inner ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
          <ringGeometry args={[11.4, 12.3, 48]} />
          <meshStandardMaterial
            color={isNight ? '#26211a' : '#4a3e30'}
            roughness={0.72}
            metalness={0.1}
          />
        </mesh>

        {/* Lake shoreline pebble outer beach */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[12.2, 13.1, 48]} />
          <meshStandardMaterial
            color={isNight ? '#353026' : '#6e624e'}
            roughness={0.92}
            metalness={0.04}
          />
        </mesh>
      </group>

      {/* 4. Secondary Mountain Tarn Pond (Highland scenic mirror) */}
      <group position={[-26, 1.46, -34]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[5.2, 32]} />
          <meshStandardMaterial
            color={isNight ? '#0b284c' : '#1b75bb'}
            roughness={0.12}
            metalness={0.25}
            transparent
            opacity={0.88}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
          <ringGeometry args={[4.9, 5.6, 32]} />
          <meshStandardMaterial
            color={isNight ? '#2c2720' : '#5c5242'}
            roughness={0.94}
          />
        </mesh>
      </group>

      {/* 5. Shoreline Flora: Natural Wetland Reeds in Shallow River Bends */}
      {reedTransforms.length > 0 && (
        <instancedMesh
          ref={reedMeshRef}
          args={[reedGeo, undefined, reedTransforms.length]}
          receiveShadow
        >
          <meshStandardMaterial
            color={isNight ? '#263020' : '#3d4d32'}
            roughness={0.85}
          />
        </instancedMesh>
      )}

      {/* 6. Shoreline Flora: River Stones & Boulders along Banks */}
      {stoneTransforms.length > 0 && (
        <instancedMesh
          ref={stoneMeshRef}
          args={[stoneGeo, undefined, stoneTransforms.length]}
          receiveShadow
        >
          <meshStandardMaterial
            color={isNight ? '#323832' : '#4d544c'}
            roughness={0.82}
          />
        </instancedMesh>
      )}
    </group>
  );
});
