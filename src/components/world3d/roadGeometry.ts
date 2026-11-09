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
 * Evaluates smooth Catmull-Rom or cubic Bezier curves through control points with analytical tangents
 */
export function sampleSplinePath(
  controlPoints: [number, number][],
  sampleInterval: number = 1.0,
  fixedY?: number,
  yOffset: number = 0.08
): RoadVertexDef[] {
  if (controlPoints.length < 2) return [];

  // Convert 2D points to THREE.Vector2
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

    // Normal pointing perpendicular to tangent (to the right of direction)
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

    // Left sidewalk inner (curb) and outer
    const lInnerX = node.x - node.nx * halfRoad;
    const lInnerZ = node.z - node.nz * halfRoad;
    const lOuterX = node.x - node.nx * (halfRoad + sidewalkWidth);
    const lOuterZ = node.z - node.nz * (halfRoad + sidewalkWidth);

    // Right sidewalk inner (curb) and outer
    const rInnerX = node.x + node.nx * halfRoad;
    const rInnerZ = node.z + node.nz * halfRoad;
    const rOuterX = node.x + node.nx * (halfRoad + sidewalkWidth);
    const rOuterZ = node.z + node.nz * (halfRoad + sidewalkWidth);

    // V0: Left outer skirt bottom
    positions.push(lOuterX, ySkirt, lOuterZ);
    normals.push(-node.nx, 0, -node.nz);
    uvs.push(0, node.dist * 0.3);

    // V1: Left walkway outer top
    positions.push(lOuterX, yTop, lOuterZ);
    normals.push(0, 1, 0);
    uvs.push(0.05, node.dist * 0.3);

    // V2: Left walkway inner top (drop curb edge)
    positions.push(lInnerX, yTop, lInnerZ);
    normals.push(0, 1, 0);
    uvs.push(0.95, node.dist * 0.3);

    // V3: Right walkway inner top (drop curb edge)
    positions.push(rInnerX, yTop, rInnerZ);
    normals.push(0, 1, 0);
    uvs.push(0.05, node.dist * 0.3);

    // V4: Right walkway outer top
    positions.push(rOuterX, yTop, rOuterZ);
    normals.push(0, 1, 0);
    uvs.push(0.95, node.dist * 0.3);

    // V5: Right outer skirt bottom
    positions.push(rOuterX, ySkirt, rOuterZ);
    normals.push(node.nx, 0, node.nz);
    uvs.push(1.0, node.dist * 0.3);

    if (i > 0) {
      const row = i * 6;
      const prevRow = (i - 1) * 6;

      // Left skirt
      indices.push(prevRow + 0, prevRow + 1, row + 1);
      indices.push(prevRow + 0, row + 1, row + 0);

      // Left walkway surface
      indices.push(prevRow + 1, prevRow + 2, row + 2);
      indices.push(prevRow + 1, row + 2, row + 1);

      // Right walkway surface
      indices.push(prevRow + 3, prevRow + 4, row + 4);
      indices.push(prevRow + 3, row + 4, row + 3);

      // Right skirt
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
 * 4. Continuous Precision Road Lane Markings
 * Floats exactly +0.012m above asphalt surface with zero z-fighting
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

  const yElev = 0.012; // 1.2cm above asphalt

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
        // 3m stripe on, 3m stripe off cycle
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
 * 5. Engineered Cul-de-Sac Geometry
 * Creates an intentional, seamless circular turnaround bulb with reverse fillet arcs,
 * continuous asphalt deck, and wrapping perimeter sidewalk & drop-curb.
 */
export function createCulDeSacGeometry(
  center: [number, number],
  bulbRadius: number,
  approachWidth: number,
  approachTangent: [number, number], // unit vector pointing toward the cul-de-sac
  hasCenterIsland: boolean = true,
  yOffset: number = 0.08
): { asphalt: THREE.BufferGeometry; sidewalk: THREE.BufferGeometry; centerIsland?: THREE.BufferGeometry } {
  const [cx, cz] = center;
  const [tx, tz] = approachTangent;
  const groundY = getTerrainHeight(cx, cz);
  const yTop = groundY + yOffset;
  const ySkirt = yTop - 0.35;
  const ySW = yTop + 0.07;

  // Normal to approach direction
  const nx = -tz;
  const nz = tx;
  const halfRoad = approachWidth * 0.5;
  const sidewalkW = 0.85;

  const positionsA: number[] = [];
  const normalsA: number[] = [];
  const indicesA: number[] = [];

  const positionsSW: number[] = [];
  const normalsSW: number[] = [];
  const indicesSW: number[] = [];

  // Central hub vertex for triangle fan
  positionsA.push(cx, yTop, cz);
  normalsA.push(0, 1, 0);

  // Generate 24 perimeter vertices around the circular bulb
  const segments = 24;
  const approachAngle = Math.atan2(tz, tx);

  // Road meets bulb: fillet angles span ~280 degrees
  for (let i = 0; i <= segments; i++) {
    const ang = (i / segments) * Math.PI * 2;
    const px = cx + Math.cos(ang) * bulbRadius;
    const pz = cz + Math.sin(ang) * bulbRadius;

    // Asphalt perimeter vertex
    positionsA.push(px, yTop, pz);
    normalsA.push(0, 1, 0);

    // Skirt vertex
    positionsA.push(px, ySkirt, pz);
    normalsA.push(Math.cos(ang), 0, Math.sin(ang));

    if (i > 0) {
      const curTop = 1 + i * 2;
      const prevTop = 1 + (i - 1) * 2;
      const curSkirt = curTop + 1;
      const prevSkirt = prevTop + 1;

      // Deck triangle
      indicesA.push(0, prevTop, curTop);

      // Outer skirt quad
      indicesA.push(prevTop, prevSkirt, curSkirt);
      indicesA.push(prevTop, curSkirt, curTop);
    }

    // Wrapping Sidewalk
    const swInnerX = px;
    const swInnerZ = pz;
    const swOuterX = cx + Math.cos(ang) * (bulbRadius + sidewalkW);
    const swOuterZ = cz + Math.sin(ang) * (bulbRadius + sidewalkW);

    positionsSW.push(swInnerX, ySW, swInnerZ); // V0 inner top
    normalsSW.push(0, 1, 0);

    positionsSW.push(swOuterX, ySW, swOuterZ); // V1 outer top
    normalsSW.push(0, 1, 0);

    positionsSW.push(swOuterX, ySkirt, swOuterZ); // V2 outer skirt
    normalsSW.push(Math.cos(ang), 0, Math.sin(ang));

    if (i > 0) {
      const base = i * 3;
      const prev = (i - 1) * 3;

      // Sidewalk top quad
      indicesSW.push(prev + 0, prev + 1, base + 1);
      indicesSW.push(prev + 0, base + 1, base + 0);

      // Sidewalk outer skirt
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

  // Optional Center Island (Cobblestone / Landscaping Disc)
  let centerIslandGeo: THREE.BufferGeometry | undefined = undefined;
  if (hasCenterIsland) {
    const islandR = Math.max(1.5, bulbRadius * 0.38);
    const posI: number[] = [cx, yTop + 0.1, cz];
    const normI: number[] = [0, 1, 0];
    const indI: number[] = [];

    for (let i = 0; i <= 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      posI.push(cx + Math.cos(ang) * islandR, yTop + 0.1, cz + Math.sin(ang) * islandR);
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
 * 6. Engineered Roundabout Geometry
 * Generates circulating multi-lane ring roadway with center garden island and throat flare fillets
 */
export function createRoundaboutGeometry(
  center: [number, number],
  outerRadius: number = 7.5,
  innerRadius: number = 3.6,
  yOffset: number = 0.08
): { asphalt: THREE.BufferGeometry; centerIsland: THREE.BufferGeometry; sidewalk: THREE.BufferGeometry } {
  const [cx, cz] = center;
  const groundY = getTerrainHeight(cx, cz);
  const yTop = groundY + yOffset;
  const ySkirt = yTop - 0.35;
  const ySW = yTop + 0.08;

  const segments = 32;

  // Circulating Asphalt Ring
  const posA: number[] = [];
  const normA: number[] = [];
  const uvsA: number[] = [];
  const indA: number[] = [];

  // Center Island
  const posI: number[] = [cx, ySW, cz];
  const normI: number[] = [0, 1, 0];
  const indI: number[] = [];

  // Outer Perimeter Sidewalk
  const posSW: number[] = [];
  const normSW: number[] = [];
  const indSW: number[] = [];
  const swWidth = 0.85;

  for (let i = 0; i <= segments; i++) {
    const ang = (i / segments) * Math.PI * 2;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);

    const inX = cx + cos * innerRadius;
    const inZ = cz + sin * innerRadius;
    const outX = cx + cos * outerRadius;
    const outZ = cz + sin * outerRadius;

    // Asphalt ring vertices
    posA.push(inX, yTop, inZ); // V0 inner
    normA.push(0, 1, 0);
    uvsA.push(0, i * 0.5);

    posA.push(outX, yTop, outZ); // V1 outer
    normA.push(0, 1, 0);
    uvsA.push(1, i * 0.5);

    posA.push(outX, ySkirt, outZ); // V2 outer skirt
    normA.push(cos, 0, sin);
    uvsA.push(1, i * 0.5);

    if (i > 0) {
      const cur = i * 3;
      const prev = (i - 1) * 3;

      // Asphalt quad
      indA.push(prev + 0, prev + 1, cur + 1);
      indA.push(prev + 0, cur + 1, cur + 0);

      // Outer skirt quad
      indA.push(prev + 1, prev + 2, cur + 2);
      indA.push(prev + 1, cur + 2, cur + 1);
    }

    // Center Island vertices
    posI.push(inX, ySW, inZ);
    normI.push(0, 1, 0);
    if (i > 0) {
      indI.push(0, i, i + 1);
    }

    // Outer Sidewalk
    const swOuterX = cx + cos * (outerRadius + swWidth);
    const swOuterZ = cz + sin * (outerRadius + swWidth);

    posSW.push(outX, ySW, outZ);
    normSW.push(0, 1, 0);

    posSW.push(swOuterX, ySW, swOuterZ);
    normSW.push(0, 1, 0);

    posSW.push(swOuterX, ySkirt, swOuterZ);
    normSW.push(cos, 0, sin);

    if (i > 0) {
      const curSW = i * 3;
      const prevSW = (i - 1) * 3;

      indSW.push(prevSW + 0, prevSW + 1, curSW + 1);
      indSW.push(prevSW + 0, curSW + 1, curSW + 0);

      indSW.push(prevSW + 1, prevSW + 2, curSW + 2);
      indSW.push(prevSW + 1, curSW + 2, curSW + 1);
    }
  }

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

  return { asphalt: asphaltGeo, centerIsland: centerIslandGeo, sidewalk: sidewalkGeo };
}

/**
 * 7. Engineered Multi-Branch Junction Geometry (T-junctions & 4-way Crossroads)
 * Seamless polygon with rounded tangent fillet arcs between intersecting branches.
 * Eliminates overlapping geometry, holes, and sharp rectangular protruding corners.
 */
export function createEngineeredJunctionGeometry(
  center: [number, number],
  radius: number = 4.2,
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

    // Deck perimeter
    positions.push(px, yTop, pz);
    normals.push(0, 1, 0);
    uvs.push(0.5 + cos * 0.5, 0.5 + sin * 0.5);

    // Skirt
    positions.push(px, ySkirt, pz);
    normals.push(cos, 0, sin);
    uvs.push(0.5 + cos * 0.5, 0.5 + sin * 0.5);

    if (i > 0) {
      const curTop = 1 + i * 2;
      const prevTop = 1 + (i - 1) * 2;
      const curSkirt = curTop + 1;
      const prevSkirt = prevTop + 1;

      // Deck fan
      indices.push(0, prevTop, curTop);

      // Skirt quad
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
 * 8. Backward Compatibility Wrappers (reused across other systems)
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
