import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getRiverPath } from './Terrain';
import { useDayNight } from './DayNightController';

// Analytical river derivative for exact downstream tangent vectors
function getRiverDerivative(x: number): { tangentX: number; tangentZ: number } {
  const dz_dx = Math.cos(x * 0.045) * 0.045 * 8.5 + 0.22;
  const len = Math.hypot(1.0, dz_dx);
  return { tangentX: 1.0 / len, tangentZ: dz_dx / len };
}

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
  // Central Citadel Arch Bridge: X in [-3.2, 3.2], Z in [-11.0, 5.0]
  if (Math.abs(x) < 3.2 && z >= -11.0 && z <= 5.0) {
    const edgeX = (3.2 - Math.abs(x)) / 1.0;
    return Math.min(1.0, Math.max(0.0, edgeX));
  }
  // West Suspension Bridge: X in [-27.5, -22.5], Z in [-24.2, -8.2]
  if (Math.abs(x - (-25)) < 2.8 && z >= -24.2 && z <= -8.2) {
    const edgeX = (2.8 - Math.abs(x - (-25))) / 1.0;
    return Math.min(1.0, Math.max(0.0, edgeX));
  }
  // East Industrial Truss Bridge: X in [22.5, 27.5], Z in [-0.2, 16.2]
  if (Math.abs(x - 25) < 2.8 && z >= -0.2 && z <= 16.2) {
    const edgeX = (2.8 - Math.abs(x - 25)) / 1.0;
    return Math.min(1.0, Math.max(0.0, edgeX));
  }
  return 0.0;
}

function getPierProximity(x: number, z: number): number {
  let maxProx = 0.0;
  for (const [px, pz] of BRIDGE_PIERS) {
    const d = Math.hypot(x - px, z - pz);
    if (d < 3.2) {
      const p = Math.max(0.0, 1.0 - d / 3.2);
      maxProx = Math.max(maxProx, p);
    }
  }
  return maxProx;
}

// ================= GLSL SHADERS FOR PHOTOREALISTIC WATER =================

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

    float speed = flowParams.x;
    float bank = flowParams.w;

    // Multi-frequency directional traveling wave progression
    float u1 = uv.x * 3.6 - uTime * 0.95 * speed;
    float v1 = uv.y * 3.14159;
    float wave1 = sin(u1) * 0.038 * sin(v1);

    float u2 = uv.x * 6.8 - uTime * 1.45 * speed + 0.6;
    float wave2 = cos(u2 + uv.y * 2.8) * 0.020 * sin(v1);

    float u3 = uv.x * 13.0 - uTime * 2.2 * speed;
    float wave3 = sin(u3) * 0.010 * sin(v1);

    // Pier wake bow disturbance
    float pierWake = 0.0;
    if (flowParams.z > 0.01) {
      pierWake = sin(uv.x * 16.0 - uTime * 3.6) * 0.026 * flowParams.z;
    }

    float totalDisplacement = (wave1 + wave2 + wave3) * bank + pierWake;

    vec3 pos = position;
    pos.y += totalDisplacement;

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

    // 1. Dual Flowing Normal Map Simulation in Curvilinear Tangent Space
    vec2 coord1 = vec2(vUv.x * 4.2 - uTime * 0.85 * speed, vUv.y * 3.2 + sin(vUv.x * 2.2 + uTime * 0.45) * 0.25);
    vec2 coord2 = vec2(vUv.x * 8.0 - uTime * 1.38 * speed + 0.5, vUv.y * 5.5 - uTime * 0.35);
    vec2 coord3 = vec2(vUv.x * 16.0 - uTime * 2.3 * speed, vUv.y * 9.5 + uTime * 0.6);

    float d1 = cos(coord1.x * 6.283) * 0.065;
    float d2 = sin(coord1.y * 6.283) * 0.055;
    float d3 = cos(coord2.x * 6.283) * 0.045;
    float d4 = sin(coord2.y * 6.283) * 0.038;
    float d5 = sin(coord3.x * 6.283) * 0.022;
    float d6 = cos(coord3.y * 6.283) * 0.018;

    float slopeU = d1 + d3 + d5;
    float slopeV = d2 + d4 + d6;

    // Bank damping: calmer water at edges
    slopeU *= (0.35 + 0.65 * bank);
    slopeV *= (0.35 + 0.65 * bank);

    // Pier turbulent wakes
    if (pierProx > 0.01) {
      float swirl = sin(vUv.x * 18.0 - uTime * 4.5) * cos(vUv.y * 22.0);
      slopeU += swirl * 0.075 * pierProx;
      slopeV += swirl * 0.075 * pierProx;
    }

    vec3 normalMap = normalize(vec3(-slopeU, 1.0, -slopeV));
    vec3 N = normalize(vNormal * normalMap.y + vTangent * normalMap.x + vBitangent * normalMap.z);

    // 2. View Vector & Fresnel Reflectance (Schlick approximation)
    vec3 V = normalize(uCameraPosition - vWorldPosition);
    float NdotV = max(0.0, dot(N, V));
    float F0 = 0.038;
    float fresnel = F0 + (1.0 - F0) * pow(clamp(1.0 - NdotV, 0.0, 1.0), 4.0);

    // 3. Depth-Dependent River Palette
    // Day palette: deep marine teal -> vibrant turquoise -> crystal emerald shallows
    vec3 cDeepThalweg = vec3(0.025, 0.165, 0.235);
    vec3 cMidChannel  = vec3(0.065, 0.365, 0.445);
    vec3 cShallows    = vec3(0.145, 0.585, 0.510);

    // Night palette: deep moonlit midnight navy
    vec3 cNightDeep   = vec3(0.012, 0.055, 0.105);
    vec3 cNightMid    = vec3(0.022, 0.105, 0.175);
    vec3 cNightShallow= vec3(0.042, 0.165, 0.235);

    vec3 waterDeep = mix(cDeepThalweg, cNightDeep, uIsNight);
    vec3 waterMid  = mix(cMidChannel, cNightMid, uIsNight);
    vec3 waterShallow = mix(cShallows, cNightShallow, uIsNight);

    float centerDist = abs(vUv.y - 0.5) * 2.0;
    vec3 waterColor = mix(waterDeep, waterMid, smoothstep(0.0, 0.55, centerDist));
    waterColor = mix(waterColor, waterShallow, smoothstep(0.55, 0.95, centerDist));

    // Under-Bridge Ambient Shadowing: water visibly deepens and darkens underneath bridge decks
    if (underBridge > 0.01) {
      vec3 bridgeShade = mix(vec3(0.012, 0.075, 0.115), vec3(0.007, 0.032, 0.055), uIsNight);
      waterColor = mix(waterColor, bridgeShade, underBridge * 0.72);
    }

    // 4. Sky Reflection & Environmental Ambient
    vec3 skyReflect = mix(uSkyColor, vec3(0.68, 0.84, 0.94), 0.45);
    if (uIsNight > 0.5) {
      skyReflect = vec3(0.05, 0.11, 0.20);
    }

    // 5. Specular Highlights from Sun & Moon (Physically-based GGX)
    vec3 L = normalize(uSunPosition - vWorldPosition);
    vec3 H = normalize(L + V);
    float NdotH = max(0.0, dot(N, H));

    float sharpSpec = pow(NdotH, 110.0) * (uIsNight > 0.5 ? 0.7 : 2.2) * uSunIntensity;
    float broadSpec = pow(NdotH, 22.0) * (uIsNight > 0.5 ? 0.18 : 0.42);
    vec3 specular = uSunColor * (sharpSpec + broadSpec);

    // Direct sun glint is shadowed by bridge deck overhead
    specular *= (1.0 - underBridge * 0.92);

    // 6. Foam Highlights along Shores & Pier Wakes
    float foamFactor = 0.0;
    if (bank < 0.22) {
      float shoreEdge = (0.22 - bank) / 0.22;
      float shorePulse = sin(vUv.x * 20.0 - uTime * 2.5) * 0.5 + 0.5;
      foamFactor += shoreEdge * shorePulse * 0.42;
    }
    if (pierProx > 0.05) {
      float wakeNoise = sin(vUv.x * 32.0 - uTime * 4.4) * cos(vUv.y * 36.0);
      float pierFoam = clamp((wakeNoise - 0.25) * 2.5, 0.0, 1.0);
      foamFactor += pierFoam * pierProx * 0.58;
    }

    vec3 foamColor = mix(vec3(0.92, 0.98, 1.0), vec3(0.45, 0.65, 0.80), uIsNight);

    // 7. Composite Color
    vec3 finalColor = mix(waterColor, skyReflect, fresnel * 0.78);
    finalColor += specular;
    finalColor = mix(finalColor, foamColor, clamp(foamFactor, 0.0, 0.82));

    // Opacity: high in center and deep shadowed gorges, subtle clarity in margins
    float alpha = mix(0.95, 0.86, smoothstep(0.4, 1.0, centerDist));
    alpha = mix(alpha, 0.98, underBridge * 0.5);

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

    // Concentric ripple propagation dampened to zero at shoreline
    float r = length(position.xz);
    float edgeDamp = max(0.0, 1.0 - r / 12.2);

    float ripple1 = sin(r * 1.8 - uTime * 1.6) * 0.024 * edgeDamp;
    float ripple2 = cos(r * 3.2 - uTime * 2.4 + position.x * 0.4) * 0.012 * edgeDamp;

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
    float rippleNormX = cos(r * 2.2 - uTime * 1.6) * 0.045 * (1.0 - rFrac);
    float rippleNormZ = sin(r * 2.2 - uTime * 1.6) * 0.045 * (1.0 - rFrac);
    vec3 N = normalize(vec3(-rippleNormX, 1.0, -rippleNormZ));

    vec3 V = normalize(uCameraPosition - vWorldPosition);
    float NdotV = max(0.0, dot(N, V));
    float fresnel = 0.038 + (1.0 - 0.038) * pow(clamp(1.0 - NdotV, 0.0, 1.0), 4.0);

    vec3 cDeep = mix(vec3(0.025, 0.145, 0.225), vec3(0.010, 0.045, 0.095), uIsNight);
    vec3 cEdge = mix(vec3(0.125, 0.525, 0.495), vec3(0.035, 0.145, 0.215), uIsNight);
    vec3 waterColor = mix(cDeep, cEdge, pow(rFrac, 1.2));

    vec3 skyReflect = mix(uSkyColor, vec3(0.68, 0.84, 0.94), 0.45);
    if (uIsNight > 0.5) {
      skyReflect = vec3(0.05, 0.11, 0.20);
    }

    vec3 L = normalize(uSunPosition - vWorldPosition);
    vec3 H = normalize(L + V);
    float NdotH = max(0.0, dot(N, H));
    float sharpSpec = pow(NdotH, 110.0) * (uIsNight > 0.5 ? 0.7 : 2.2) * uSunIntensity;
    vec3 specular = uSunColor * sharpSpec;

    vec3 finalColor = mix(waterColor, skyReflect, fresnel * 0.80) + specular;
    gl_FragColor = vec4(finalColor, 0.93);
  }
`;

export default React.memo(function WaterSystem() {
  const { isNight, sunPosition, sunIntensity, skyColor, directionalColor } = useDayNight();
  const { camera } = useThree();

  const riverMeshRef = useRef<THREE.Mesh>(null);
  const lakeMeshRef = useRef<THREE.Mesh>(null);

  // 1. Procedural High-Definition Curvilinear River Ribbon Geometry
  const { riverGeo, shoreGeo, lakeGeo, reedTransforms, stoneTransforms } = useMemo(() => {
    const SEGMENTS_X = 140; // 140 stations along the S-curve
    const minX = -66;
    const maxX = 66;
    const stepX = (maxX - minX) / SEGMENTS_X;
    const LATERAL_COLS = 9; // 9 lateral cross-section vertices

    const riverPositions: number[] = [];
    const riverNormals: number[] = [];
    const riverTangents: number[] = [];
    const riverUvs: number[] = [];
    const riverFlowParams: number[] = [];
    const riverIndices: number[] = [];

    // Wet Sand/Silt Shore Under-Ribbons
    const shorePositions: number[] = [];
    const shoreIndices: number[] = [];

    let accumulatedStreamDist = 0;
    let prevX = minX;
    let prevZ = getRiverPath(minX).z;

    for (let r = 0; r <= SEGMENTS_X; r++) {
      const x = minX + r * stepX;
      const { z: rz, width: baseWidth } = getRiverPath(x);

      // Organic shoreline variations
      const organicW = baseWidth + Math.sin(x * 0.25) * 0.55 + Math.cos(x * 0.65) * 0.35;
      const halfW = organicW * 0.52;

      // Accumulated streamwise flow distance
      const stepDist = Math.hypot(x - prevX, rz - prevZ);
      accumulatedStreamDist += stepDist;
      prevX = x;
      prevZ = rz;

      // Streamwise coordinate (u in 0..14)
      const u = accumulatedStreamDist / 9.0;

      // Local tangent vector
      const { tangentX, tangentZ } = getRiverDerivative(x);

      // Local flow velocity multiplier (Venturi conservation of mass: narrower = faster)
      const speedMult = Math.min(1.4, Math.max(0.7, 10.5 / organicW));

      // 9 Lateral vertices across river ribbon
      for (let c = 0; c < LATERAL_COLS; c++) {
        const lateralT = c / (LATERAL_COLS - 1); // 0.0 (left bank) to 1.0 (right bank)
        const z = rz - halfW + lateralT * (halfW * 2);
        const y = -0.17; // Base water elevation

        riverPositions.push(x, y, z);
        riverNormals.push(0, 1, 0);
        riverTangents.push(tangentX, 0, tangentZ);
        riverUvs.push(u, lateralT);

        // Environmental weights
        const underBridge = getUnderBridgeWeight(x, z);
        const pierProx = getPierProximity(x, z);
        const bankDamping = Math.sin(lateralT * Math.PI); // 0 at edges, 1 at center

        riverFlowParams.push(speedMult, underBridge, pierProx, bankDamping);
      }

      // Shore Wet Sand & Gravel Margins (Left & Right)
      const zL0 = rz - halfW;
      const zL1 = rz - halfW - 1.1;
      const zR0 = rz + halfW;
      const zR1 = rz + halfW + 1.1;

      shorePositions.push(x, -0.22, zL0, x, -0.14, zL1);
      shorePositions.push(x, -0.22, zR0, x, -0.14, zR1);

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

    lPos.push(0, 0, 0);
    lNorm.push(0, 1, 0);
    lUv.push(0.5, 0.5);

    for (let ring = 1; ring <= LAKE_RINGS; ring++) {
      const ringFrac = ring / LAKE_RINGS;
      const rDist = ringFrac * lakeRadius;
      for (let s = 0; s < LAKE_SLICES; s++) {
        const theta = (s / LAKE_SLICES) * Math.PI * 2;
        const lx = Math.cos(theta) * rDist;
        const lz = Math.sin(theta) * rDist;
        lPos.push(lx, 0, lz);
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

    // 3. Shoreline Flora (Reeds & Stones along calm river shallows)
    let seed = 77;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const reeds: THREE.Matrix4[] = [];
    const stones: THREE.Matrix4[] = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < 75; i++) {
      const rx = -55 + rnd() * 110;
      const { z: rz, width } = getRiverPath(rx);
      const halfW = width * 0.52;
      const side = rnd() > 0.5 ? 1 : -1;
      const rzPos = rz + side * (halfW + 0.3 + rnd() * 0.8);

      // Reeds prefer calmer shallow sections
      dummy.position.set(rx, -0.12, rzPos);
      dummy.rotation.set(0, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.15);
      const s = 0.7 + rnd() * 0.6;
      dummy.scale.set(s, s * (1.1 + rnd() * 0.4), s);
      dummy.updateMatrix();
      reeds.push(dummy.matrix.clone());
    }

    for (let i = 0; i < 55; i++) {
      const rx = -58 + rnd() * 116;
      const { z: rz, width } = getRiverPath(rx);
      const halfW = width * 0.52;
      const side = rnd() > 0.5 ? 1 : -1;
      const rzPos = rz + side * (halfW - 0.2 + rnd() * 0.9);

      dummy.position.set(rx, -0.16, rzPos);
      dummy.rotation.set(rnd() * 0.4, rnd() * Math.PI * 2, rnd() * 0.4);
      const sx = 0.35 + rnd() * 0.55;
      const sy = 0.25 + rnd() * 0.35;
      const sz = 0.35 + rnd() * 0.55;
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
        uSunColor: { value: new THREE.Color('#fff5df') },
        uSunIntensity: { value: 2.2 },
        uSkyColor: { value: new THREE.Color('#9ec4b0') },
        uCameraPosition: { value: new THREE.Vector3(38, 34, 46) },
        uIsNight: { value: 0 },
      },
      transparent: true,
      depthWrite: true,
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
        uSunColor: { value: new THREE.Color('#fff5df') },
        uSunIntensity: { value: 2.2 },
        uSkyColor: { value: new THREE.Color('#9ec4b0') },
        uCameraPosition: { value: new THREE.Vector3(38, 34, 46) },
        uIsNight: { value: 0 },
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
  }, []);

  useEffect(() => {
    return () => {
      riverMaterial.dispose();
      lakeMaterial.dispose();
    };
  }, [riverMaterial, lakeMaterial]);

  // Synchronize dynamic uniforms every frame with zero GC allocations
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
    const geo = new THREE.DodecahedronGeometry(0.6, 1);
    geo.scale(1.2, 0.65, 1.1);
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
          color={isNight ? '#26221c' : '#4d4233'}
          roughness={0.65}
          metalness={0.12}
        />
      </mesh>

      {/* 2. Main Photorealistic Directional Flowing River */}
      <mesh
        ref={riverMeshRef}
        geometry={riverGeo}
        material={riverMaterial}
        receiveShadow
      />

      {/* 3. Alpine Reservoir Lake with Photorealistic Concentric Waves */}
      <group position={[-38, -0.16, -22]}>
        <mesh
          ref={lakeMeshRef}
          geometry={lakeGeo}
          material={lakeMaterial}
          receiveShadow
        />

        {/* Lake shoreline wet sand inner ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
          <ringGeometry args={[11.2, 12.3, 48]} />
          <meshStandardMaterial
            color={isNight ? '#28231c' : '#524434'}
            roughness={0.68}
            metalness={0.15}
          />
        </mesh>

        {/* Lake shoreline pebble outer beach */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[12.1, 13.2, 48]} />
          <meshStandardMaterial
            color={isNight ? '#3a342a' : '#7a6c56'}
            roughness={0.92}
            metalness={0.05}
          />
        </mesh>
      </group>

      {/* 4. Secondary Mountain Tarn Pond (Highland scenic turquoise mirror) */}
      <group position={[-26, 1.46, -34]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[5.2, 32]} />
          <meshStandardMaterial
            color={isNight ? '#0b2633' : '#19788a'}
            roughness={0.04}
            metalness={0.42}
            transparent
            opacity={0.88}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
          <ringGeometry args={[4.9, 5.7, 32]} />
          <meshStandardMaterial
            color={isNight ? '#322d25' : '#6b5e4c'}
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
            color={isNight ? '#2d3826' : '#455938'}
            roughness={0.8}
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
            color={isNight ? '#3a403b' : '#565c56'}
            roughness={0.78}
          />
        </instancedMesh>
      )}
    </group>
  );
});
