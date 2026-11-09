import * as THREE from 'three';
import { getTerrainHeight } from './Terrain';

export interface RoadVertexDef {
  x: number;
  y: number;
  z: number;
  nx: number;
  nz: number;
  tx: number;
  tz: number;
  dist: number;
}

/**
 * 1. High-Precision Spline Evaluator
 * Evaluates smooth Catmull-Rom curves through control points with analytical tangents and slope-aware elevation
 */
export function sampleSplinePath(
  controlPoints: [number, number][],
  sampleInterval: number = 1.0,
  fixedY?: number,
  yOffset: number = 0.08
): RoadVertexDef[] {
  if (controlPoints.length < 2) return [];

  // When only 2 points are given, generate a direct linear corridor with intermediate samples
  if (controlPoints.length === 2) {
    const [p1, p2] = controlPoints;
    const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(2, Math.ceil(dist / sampleInterval));
    const dx = (p2[0] - p1[0]) / dist;
    const dz = (p2[1] - p1[1]) / dist;
    const nx = -dz;
    const nz = dx;

    const sampledNodes: RoadVertexDef[] = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = p1[0] + (p2[0] - p1[0]) * t;
      const z = p1[1] + (p2[1] - p1[1]) * t;
      const groundY = fixedY !== undefined ? fixedY : getTerrainHeight(x, z);
      const y = groundY + yOffset;
      sampledNodes.push({
        x,
        y,
        z,
        nx,
        nz,
        tx: dx,
        tz: dz,
        dist: dist * t,
      });
    }
    return sampledNodes;
  }

  // Multi-point smooth Catmull-Rom curve
  const v2Points = controlPoints.map(([x, z]) => new THREE.Vector2(x, z));
  const curve = new THREE.SplineCurve(v2Points);

  const totalLength = curve.getLength();
  const divisions = Math.max(3, Math.ceil(totalLength / sampleInterval));
  const sampledNodes: RoadVertexDef[] = [];

  let accumulatedDist = 0;
  let prevV2: THREE.Vector2 | null = null;

  for (let i = 0; i <= divisions; i++) {
    const t = i / divisions;
    const pt = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();

    const nx = -tangent.y;
    const nz = tangent.x;

    if (prevV2) {
      accumulatedDist += pt.distanceTo(prevV2);
    }
    prevV2 = pt.clone();

    const groundY = fixedY !== undefined ? fixedY : getTerrainHeight(pt.x, pt.y);
    const y = groundY + yOffset;

    sampledNodes.push({
      x: pt.x,
      y,
      z: pt.y,
      nx,
      nz,
      tx: tangent.x,
      tz: tangent.y,
      dist: accumulatedDist,
    });
  }

  return sampledNodes;
}

/**
 * 2. Continuous Road Mesh Generator
 * Generates continuous smooth asphalt ribbon with terrain-adaptive vertical retaining skirts
 */
export function createContinuousRoadMesh(
  nodes: RoadVertexDef[],
  roadWidth: number,
  skirtDepth: number = 0.35
): THREE.BufferGeometry {
  if (nodes.length < 2) return new THREE.BufferGeometry();

  const halfW = roadWidth * 0.5;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const lx = node.x - node.nx * halfW;
    const lz = node.z - node.nz * halfW;
    const rx = node.x + node.nx * halfW;
    const rz = node.z + node.nz * halfW;
    const yTop = node.y;
    const ySkirt = node.y - skirtDepth;

    // V0: Left skirt bottom
    positions.push(lx, ySkirt, lz);
    normals.push(-node.nx, 0, -node.nz);
    uvs.push(0, node.dist * 0.2);

    // V1: Left road edge top
    positions.push(lx, yTop, lz);
    normals.push(0, 1, 0);
    uvs.push(0.04, node.dist * 0.2);

    // V2: Right road edge top
    positions.push(rx, yTop, rz);
    normals.push(0, 1, 0);
    uvs.push(0.96, node.dist * 0.2);

    // V3: Right skirt bottom
    positions.push(rx, ySkirt, rz);
    normals.push(node.nx, 0, node.nz);
    uvs.push(1.0, node.dist * 0.2);

    if (i > 0) {
      const row = i * 4;
      const prevRow = (i - 1) * 4;

      // Left skirt
      indices.push(prevRow + 0, prevRow + 1, row + 1);
      indices.push(prevRow + 0, row + 1, row + 0);

      // Road deck surface
      indices.push(prevRow + 1, prevRow + 2, row + 2);
      indices.push(prevRow + 1, row + 2, row + 1);

      // Right skirt
      indices.push(prevRow + 2, prevRow + 3, row + 3);
      indices.push(prevRow + 2, row + 3, row + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/**
 * 3. Continuous Curved Sidewalks Generator
 * Raised +0.07m above asphalt with chamfered curbs and deep downward retaining skirts
 */
export function createContinuousSidewalkMesh(
  nodes: RoadVertexDef[],
  roadWidth: number,
  sidewalkWidth: number = 0.85,
  heightOffset: number = 0.07,
  skirtDepth: number = 0.42
): THREE.BufferGeometry {
  if (nodes.length < 2) return new THREE.BufferGeometry();

  const halfRoad = roadWidth * 0.5;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const yTop = node.y + heightOffset;
    const ySkirt = node.y - skirtDepth;

    // Left sidewalk
    const lInnerX = node.x - node.nx * halfRoad;
    const lInnerZ = node.z - node.nz * halfRoad;
    const lOuterX = node.x - node.nx * (halfRoad + sidewalkWidth);
    const lOuterZ = node.z - node.nz * (halfRoad + sidewalkWidth);

    // Right sidewalk
    const rInnerX = node.x + node.nx * halfRoad;
    const rInnerZ = node.z + node.nz * halfRoad;
    const rOuterX = node.x + node.nx * (halfRoad + sidewalkWidth);
    const rOuterZ = node.z + node.nz * (halfRoad + sidewalkWidth);

    positions.push(lOuterX, ySkirt, lOuterZ);
    normals.push(-node.nx, 0, -node.nz);
    uvs.push(0, node.dist * 0.3);

    positions.push(lOuterX, yTop, lOuterZ);
    normals.push(0, 1, 0);
    uvs.push(0.05, node.dist * 0.3);

    positions.push(lInnerX, yTop, lInnerZ);
    normals.push(0, 1, 0);
    uvs.push(0.95, node.dist * 0.3);

    positions.push(rInnerX, yTop, rInnerZ);
    normals.push(0, 1, 0);
    uvs.push(0.05, node.dist * 0.3);

    positions.push(rOuterX, yTop, rOuterZ);
    normals.push(0, 1, 0);
    uvs.push(0.95, node.dist * 0.3);

    positions.push(rOuterX, ySkirt, rOuterZ);
    normals.push(node.nx, 0, node.nz);
    uvs.push(1.0, node.dist * 0.3);

    if (i > 0) {
      const row = i * 6;
      const prevRow = (i - 1) * 6;

      indices.push(prevRow + 0, prevRow + 1, row + 1);
      indices.push(prevRow + 0, row + 1, row + 0);

      indices.push(prevRow + 1, prevRow + 2, row + 2);
      indices.push(prevRow + 1, row + 2, row + 1);

      indices.push(prevRow + 3, prevRow + 4, row + 4);
      indices.push(prevRow + 3, row + 4, row + 3);

      indices.push(prevRow + 4, prevRow + 5, row + 5);
      indices.push(prevRow + 4, row + 5, row + 4);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/**
 * 4. Continuous Road Markings
 * Floats +0.012m above asphalt surface with zero z-fighting
 */
export function createContinuousMarkingsMesh(
  nodes: RoadVertexDef[],
  roadWidth: number,
  type: 'double-yellow' | 'single-white' | 'dual-dash'
): THREE.BufferGeometry {
  if (nodes.length < 2) return new THREE.BufferGeometry();

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const yElev = 0.012;

  if (type === 'double-yellow') {
    const stripeW = 0.08;
    const gap = 0.1;
    for (let stripe = -1; stripe <= 1; stripe += 2) {
      const offset = stripe * (gap * 0.5 + stripeW * 0.5);
      const baseIdx = positions.length / 3;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const cx = node.x + node.nx * offset;
        const cz = node.z + node.nz * offset;
        const lx = cx - node.nx * (stripeW * 0.5);
        const lz = cz - node.nz * (stripeW * 0.5);
        const rx = cx + node.nx * (stripeW * 0.5);
        const rz = cz + node.nz * (stripeW * 0.5);

        positions.push(lx, node.y + yElev, lz);
        normals.push(0, 1, 0);
        positions.push(rx, node.y + yElev, rz);
        normals.push(0, 1, 0);

        if (i > 0) {
          const row = baseIdx + i * 2;
          const prevRow = baseIdx + (i - 1) * 2;
          indices.push(prevRow + 0, prevRow + 1, row + 1);
          indices.push(prevRow + 0, row + 1, row + 0);
        }
      }
    }
  } else if (type === 'single-white') {
    const stripeW = 0.09;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const lx = node.x - node.nx * (stripeW * 0.5);
      const lz = node.z - node.nz * (stripeW * 0.5);
      const rx = node.x + node.nx * (stripeW * 0.5);
      const rz = node.z + node.nz * (stripeW * 0.5);

      positions.push(lx, node.y + yElev, lz);
      normals.push(0, 1, 0);
      positions.push(rx, node.y + yElev, rz);
      normals.push(0, 1, 0);

      if (i > 0) {
        const row = i * 2;
        const prevRow = (i - 1) * 2;
        indices.push(prevRow + 0, prevRow + 1, row + 1);
        indices.push(prevRow + 0, row + 1, row + 0);
      }
    }
  } else if (type === 'dual-dash') {
    const laneOffset = roadWidth * 0.25;
    const stripeW = 0.08;

    for (let lane = -1; lane <= 1; lane += 2) {
      const offset = lane * laneOffset;
      const baseIdx = positions.length / 3;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const cycle = Math.floor(node.dist / 3.0) % 2;
        if (cycle === 0) {
          const cx = node.x + node.nx * offset;
          const cz = node.z + node.nz * offset;
          const lx = cx - node.nx * (stripeW * 0.5);
          const lz = cz - node.nz * (stripeW * 0.5);
          const rx = cx + node.nx * (stripeW * 0.5);
          const rz = cz + node.nz * (stripeW * 0.5);

          positions.push(lx, node.y + yElev, lz);
          normals.push(0, 1, 0);
          positions.push(rx, node.y + yElev, rz);
          normals.push(0, 1, 0);

          if (i > 0 && Math.floor(nodes[i - 1].dist / 3.0) % 2 === 0) {
            const curIdx = positions.length / 3 - 2;
            const prevIdx = curIdx - 2;
            indices.push(prevIdx + 0, prevIdx + 1, curIdx + 1);
            indices.push(prevIdx + 0, curIdx + 1, curIdx + 0);
          }
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

/**
 * 5. Seamless Integrated Cul-de-Sac Generator
 * Generates an intentional circular turnaround bulb matching incoming road tangent and width
 * with continuous wrapping curb, sidewalk, and center turning island. ZERO GAP.
 */
export function createCulDeSacGeometry(
  center: [number, number],
  bulbRadius: number,
  approachWidth: number,
  approachTangent: [number, number],
  hasCenterIsland: boolean = true,
  yOffset: number = 0.08
): { asphalt: THREE.BufferGeometry; sidewalk: THREE.BufferGeometry; centerIsland?: THREE.BufferGeometry } {
  const [cx, cz] = center;
  const [tx, tz] = approachTangent;
  const groundY = getTerrainHeight(cx, cz);
  const yTop = groundY + yOffset;
  const ySkirt = yTop - 0.35;
  const ySW = yTop + 0.07;
  const sidewalkW = 0.85;

  const positionsA: number[] = [];
  const normalsA: number[] = [];
  const indicesA: number[] = [];

  const positionsSW: number[] = [];
  const normalsSW: number[] = [];
  const indicesSW: number[] = [];

  // Center hub vertex for asphalt fan
  positionsA.push(cx, yTop, cz);
  normalsA.push(0, 1, 0);

  const segments = 24;

  for (let i = 0; i <= segments; i++) {
    const ang = (i / segments) * Math.PI * 2;
    const px = cx + Math.cos(ang) * bulbRadius;
    const pz = cz + Math.sin(ang) * bulbRadius;

    positionsA.push(px, yTop, pz);
    normalsA.push(0, 1, 0);

    positionsA.push(px, ySkirt, pz);
    normalsA.push(Math.cos(ang), 0, Math.sin(ang));

    if (i > 0) {
      const curTop = 1 + i * 2;
      const prevTop = 1 + (i - 1) * 2;
      const curSkirt = curTop + 1;
      const prevSkirt = prevTop + 1;

      indicesA.push(0, prevTop, curTop);
      indicesA.push(prevTop, prevSkirt, curSkirt);
      indicesA.push(prevTop, curSkirt, curTop);
    }
  }

  // 2. Open-Throat Wrapping Sidewalk
  // Leaves the incoming roadway throat open, wrapping around the rest of the bulb
  const enterAng = Math.atan2(-tz, -tx);
  const throatHalfAng = Math.asin(Math.min(0.85, (approachWidth * 0.5) / bulbRadius)) + 0.05;
  const startAng = enterAng + throatHalfAng;
  const angSpan = Math.PI * 2 - 2 * throatHalfAng;
  const swSegments = 24;

  for (let s = 0; s <= swSegments; s++) {
    const ang = startAng + (s / swSegments) * angSpan;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);

    const swInnerX = cx + cos * bulbRadius;
    const swInnerZ = cz + sin * bulbRadius;
    const swOuterX = cx + cos * (bulbRadius + sidewalkW);
    const swOuterZ = cz + sin * (bulbRadius + sidewalkW);

    positionsSW.push(swInnerX, ySW, swInnerZ);
    normalsSW.push(0, 1, 0);

    positionsSW.push(swOuterX, ySW, swOuterZ);
    normalsSW.push(0, 1, 0);

    positionsSW.push(swOuterX, ySkirt, swOuterZ);
    normalsSW.push(cos, 0, sin);

    if (s > 0) {
      const base = s * 3;
      const prev = (s - 1) * 3;

      indicesSW.push(prev + 0, prev + 1, base + 1);
      indicesSW.push(prev + 0, base + 1, base + 0);

      indicesSW.push(prev + 1, prev + 2, base + 2);
      indicesSW.push(prev + 1, base + 2, base + 1);
    }
  }

  const asphaltGeo = new THREE.BufferGeometry();
  asphaltGeo.setAttribute('position', new THREE.Float32BufferAttribute(positionsA, 3));
  asphaltGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normalsA, 3));
  asphaltGeo.setIndex(indicesA);

  const sidewalkGeo = new THREE.BufferGeometry();
  sidewalkGeo.setAttribute('position', new THREE.Float32BufferAttribute(positionsSW, 3));
  sidewalkGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normalsSW, 3));
  sidewalkGeo.setIndex(indicesSW);

  let centerIslandGeo: THREE.BufferGeometry | undefined = undefined;
  if (hasCenterIsland) {
    const islandR = Math.max(1.4, bulbRadius * 0.36);
    const posI: number[] = [cx, ySW, cz];
    const normI: number[] = [0, 1, 0];
    const indI: number[] = [];

    for (let i = 0; i <= 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      posI.push(cx + Math.cos(ang) * islandR, ySW, cz + Math.sin(ang) * islandR);
      normI.push(0, 1, 0);
      if (i > 0) {
        indI.push(0, i, i + 1);
      }
    }
    centerIslandGeo = new THREE.BufferGeometry();
    centerIslandGeo.setAttribute('position', new THREE.Float32BufferAttribute(posI, 3));
    centerIslandGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normI, 3));
    centerIslandGeo.setIndex(indI);
  }

  return { asphalt: asphaltGeo, sidewalk: sidewalkGeo, centerIsland: centerIslandGeo };
}

/**
 * 6. Engineered 4-Way Civic Roundabout Geometry
 * ONE clearly defined central island with raised stone curb, smooth circular pavement,
 * exactly 4 orthogonal approaches (North, South, East, West), continuous corner sidewalk fillets,
 * and zero overlapping road surfaces or cut-through segments.
 */
export function createFourWayCivicRoundaboutGeometry(
  center: [number, number],
  innerRadius: number = 4.2,
  outerRadius: number = 9.2,
  approachWidthNS: number = 5.4,
  approachWidthEW: number = 4.4,
  yOffset: number = 0.08
): {
  asphalt: THREE.BufferGeometry;
  centerIsland: THREE.BufferGeometry;
  sidewalks: THREE.BufferGeometry;
  circulatingMarkings: THREE.BufferGeometry;
} {
  const [cx, cz] = center;
  const groundY = getTerrainHeight(cx, cz);
  const yTop = groundY + yOffset;
  const ySkirt = yTop - 0.35;
  const ySW = yTop + 0.08;
  const segments = 36;
  const swWidth = 0.85;

  // 1. Circulating Asphalt Ring
  const posA: number[] = [];
  const normA: number[] = [];
  const uvsA: number[] = [];
  const indA: number[] = [];

  // 2. Center Island
  const posI: number[] = [cx, ySW, cz];
  const normI: number[] = [0, 1, 0];
  const indI: number[] = [];

  // 3. Circulating Dashed Lane Marking
  const midR = (innerRadius + outerRadius) * 0.5;
  const posM: number[] = [];
  const normM: number[] = [];
  const indM: number[] = [];
  const markW = 0.08;

  for (let i = 0; i <= segments; i++) {
    const ang = (i / segments) * Math.PI * 2;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);

    const inX = cx + cos * innerRadius;
    const inZ = cz + sin * innerRadius;
    const outX = cx + cos * outerRadius;
    const outZ = cz + sin * outerRadius;

    // Asphalt ring vertices
    posA.push(inX, yTop, inZ);
    normA.push(0, 1, 0);
    uvsA.push(0, i * 0.5);

    posA.push(outX, yTop, outZ);
    normA.push(0, 1, 0);
    uvsA.push(1, i * 0.5);

    posA.push(outX, ySkirt, outZ);
    normA.push(cos, 0, sin);
    uvsA.push(1, i * 0.5);

    if (i > 0) {
      const cur = i * 3;
      const prev = (i - 1) * 3;

      indA.push(prev + 0, prev + 1, cur + 1);
      indA.push(prev + 0, cur + 1, cur + 0);

      indA.push(prev + 1, prev + 2, cur + 2);
      indA.push(prev + 1, cur + 2, cur + 1);
    }

    // Center Island vertices
    posI.push(inX, ySW, inZ);
    normI.push(0, 1, 0);
    if (i > 0) {
      indI.push(0, i, i + 1);
    }

    // Circulating dashed lane marking (6 segments on, 6 segments off)
    if (i % 6 < 4) {
      const mInX = cx + cos * (midR - markW * 0.5);
      const mInZ = cz + sin * (midR - markW * 0.5);
      const mOutX = cx + cos * (midR + markW * 0.5);
      const mOutZ = cz + sin * (midR + markW * 0.5);

      const mIdx = posM.length / 3;
      posM.push(mInX, yTop + 0.012, mInZ);
      normM.push(0, 1, 0);
      posM.push(mOutX, yTop + 0.012, mOutZ);
      normM.push(0, 1, 0);

      if (i > 0 && (i - 1) % 6 < 4) {
        indM.push(mIdx - 2, mIdx - 1, mIdx + 1);
        indM.push(mIdx - 2, mIdx + 1, mIdx + 0);
      }
    }
  }

  // 4. Four Quadrant Outer Sidewalk Fillets (North-East, South-East, South-West, North-West)
  // Sidewalks are placed only in the 4 corner arcs between the orthogonal approaches!
  const posSW: number[] = [];
  const normSW: number[] = [];
  const indSW: number[] = [];

  const angEW = Math.asin(Math.min(0.85, (approachWidthEW * 0.5) / outerRadius)) + 0.05;
  const angNS = Math.asin(Math.min(0.85, (approachWidthNS * 0.5) / outerRadius)) + 0.05;

  const quadrants = [
    { startAng: angEW, endAng: Math.PI * 0.5 - angNS },              // South-East corner
    { startAng: Math.PI * 0.5 + angNS, endAng: Math.PI - angEW },       // South-West corner
    { startAng: Math.PI + angEW, endAng: Math.PI * 1.5 - angNS },       // North-West corner
    { startAng: Math.PI * 1.5 + angNS, endAng: Math.PI * 2 - angEW },   // North-East corner
  ];

  quadrants.forEach((q) => {
    const subSegs = 8;
    const baseSW = posSW.length / 3;

    for (let s = 0; s <= subSegs; s++) {
      const ang = q.startAng + (s / subSegs) * (q.endAng - q.startAng);
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);

      const inX = cx + cos * outerRadius;
      const inZ = cz + sin * outerRadius;
      const outX = cx + cos * (outerRadius + swWidth);
      const outZ = cz + sin * (outerRadius + swWidth);

      posSW.push(inX, ySW, inZ);
      normSW.push(0, 1, 0);

      posSW.push(outX, ySW, outZ);
      normSW.push(0, 1, 0);

      posSW.push(outX, ySkirt, outZ);
      normSW.push(cos, 0, sin);

      if (s > 0) {
        const cur = baseSW + s * 3;
        const prev = baseSW + (s - 1) * 3;

        indSW.push(prev + 0, prev + 1, cur + 1);
        indSW.push(prev + 0, cur + 1, cur + 0);

        indSW.push(prev + 1, prev + 2, cur + 2);
        indSW.push(prev + 1, cur + 2, cur + 1);
      }
    }
  });

  const asphaltGeo = new THREE.BufferGeometry();
  asphaltGeo.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3));
  asphaltGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normA, 3));
  asphaltGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvsA, 2));
  asphaltGeo.setIndex(indA);

  const centerIslandGeo = new THREE.BufferGeometry();
  centerIslandGeo.setAttribute('position', new THREE.Float32BufferAttribute(posI, 3));
  centerIslandGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normI, 3));
  centerIslandGeo.setIndex(indI);

  const sidewalkGeo = new THREE.BufferGeometry();
  sidewalkGeo.setAttribute('position', new THREE.Float32BufferAttribute(posSW, 3));
  sidewalkGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normSW, 3));
  sidewalkGeo.setIndex(indSW);

  const markingsGeo = new THREE.BufferGeometry();
  markingsGeo.setAttribute('position', new THREE.Float32BufferAttribute(posM, 3));
  markingsGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normM, 3));
  markingsGeo.setIndex(indM);

  return {
    asphalt: asphaltGeo,
    centerIsland: centerIslandGeo,
    sidewalks: sidewalkGeo,
    circulatingMarkings: markingsGeo,
  };
}

/**
 * 7. Unified Multi-Branch Junction Geometry (T-junctions & 4-way Crossroads)
 */
export function createEngineeredJunctionGeometry(
  center: [number, number],
  radius: number = 4.4,
  yOffset: number = 0.08,
  fixedY?: number
): THREE.BufferGeometry {
  const [cx, cz] = center;
  const groundY = fixedY !== undefined ? fixedY : getTerrainHeight(cx, cz);
  const yTop = groundY + yOffset;
  const ySkirt = yTop - 0.35;

  const segments = 24;
  const positions: number[] = [cx, yTop, cz];
  const normals: number[] = [0, 1, 0];
  const uvs: number[] = [0.5, 0.5];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const ang = (i / segments) * Math.PI * 2;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);

    const px = cx + cos * radius;
    const pz = cz + sin * radius;

    positions.push(px, yTop, pz);
    normals.push(0, 1, 0);
    uvs.push(0.5 + cos * 0.5, 0.5 + sin * 0.5);

    positions.push(px, ySkirt, pz);
    normals.push(cos, 0, sin);
    uvs.push(0.5 + cos * 0.5, 0.5 + sin * 0.5);

    if (i > 0) {
      const curTop = 1 + i * 2;
      const prevTop = 1 + (i - 1) * 2;
      const curSkirt = curTop + 1;
      const prevSkirt = prevTop + 1;

      indices.push(0, prevTop, curTop);
      indices.push(prevTop, prevSkirt, curSkirt);
      indices.push(prevTop, curSkirt, curTop);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/**
 * 8. Backward Compatibility Wrappers
 */
export function createTerrainAdaptiveRoadGeometry(
  points: [number, number][],
  width: number,
  yOffset: number = 0.08,
  fixedY?: number
): THREE.BufferGeometry {
  const nodes = sampleSplinePath(points, 1.2, fixedY, yOffset);
  return createContinuousRoadMesh(nodes, width);
}

export function createSidewalksGeometry(
  points: [number, number][],
  roadWidth: number,
  sidewalkWidth: number = 0.85,
  yOffset: number = 0.08,
  fixedY?: number
): THREE.BufferGeometry {
  const nodes = sampleSplinePath(points, 1.2, fixedY, yOffset);
  return createContinuousSidewalkMesh(nodes, roadWidth, sidewalkWidth);
}

export function createRoadMarkingsGeometry(
  points: [number, number][],
  roadWidth: number,
  type: 'double-yellow' | 'single-white' | 'dual-dash',
  yOffset: number = 0.08,
  fixedY?: number
): THREE.BufferGeometry {
  const nodes = sampleSplinePath(points, 1.2, fixedY, yOffset);
  return createContinuousMarkingsMesh(nodes, roadWidth, type);
}

export function createIntersectionJunctionGeometry(
  center: [number, number],
  widthNS: number,
  widthEW: number,
  yOffset: number = 0.08,
  fixedY?: number
): THREE.BufferGeometry {
  const avgRadius = (widthNS + widthEW) * 0.38;
  return createEngineeredJunctionGeometry(center, avgRadius, yOffset, fixedY);
}
export function createRoundaboutGeometry(
  center: [number, number],
  outerRadius: number = 7.5,
  innerRadius: number = 3.6,
  yOffset: number = 0.08
): { asphalt: THREE.BufferGeometry; centerIsland: THREE.BufferGeometry; sidewalk: THREE.BufferGeometry } {
  const rb = createFourWayCivicRoundaboutGeometry(center, innerRadius, outerRadius, 5.4, 4.4, yOffset);
  return { asphalt: rb.asphalt, centerIsland: rb.centerIsland, sidewalk: rb.sidewalks };
}
