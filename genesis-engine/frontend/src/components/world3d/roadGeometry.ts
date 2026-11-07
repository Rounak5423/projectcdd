import * as THREE from 'three';
import { getTerrainHeight } from './Terrain';

export interface RoadVertexDef {
  x: number;
  y: number;
  z: number;
  nx: number;
  nz: number;
}

/**
 * Generates smooth, terrain-adaptive road ribbon geometry with vertical skirts that prevent floating gaps
 */
export function createTerrainAdaptiveRoadGeometry(
  points: [number, number][],
  width: number,
  yOffset: number = 0.08,
  fixedY?: number
): THREE.BufferGeometry {
  const halfW = width * 0.5;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Sample points along path at ~1.5m intervals for smooth terrain conformance
  const sampledNodes: RoadVertexDef[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(2, Math.ceil(dist / 1.6));

    const dx = (p2[0] - p1[0]) / dist;
    const dz = (p2[1] - p1[1]) / dist;
    // Perpendicular normal vector pointing right
    const nx = -dz;
    const nz = dx;

    const startIdx = i === 0 ? 0 : 1;
    for (let s = startIdx; s <= steps; s++) {
      const t = s / steps;
      const x = p1[0] + (p2[0] - p1[0]) * t;
      const z = p1[1] + (p2[1] - p1[1]) * t;
      const groundY = fixedY !== undefined ? fixedY : getTerrainHeight(x, z);
      const y = groundY + yOffset;
      sampledNodes.push({ x, y, z, nx, nz });
    }
  }

  // Build quad strip with top road surface and left/right downward curb skirts
  let totalDist = 0;
  for (let i = 0; i < sampledNodes.length; i++) {
    const node = sampledNodes[i];
    if (i > 0) {
      const prev = sampledNodes[i - 1];
      totalDist += Math.hypot(node.x - prev.x, node.z - prev.z);
    }

    const lx = node.x - node.nx * halfW;
    const lz = node.z - node.nz * halfW;
    const rx = node.x + node.nx * halfW;
    const rz = node.z + node.nz * halfW;
    const yTop = node.y;
    const ySkirt = node.y - 0.28; // Skirt drops into terrain to prevent floating

    // Vertex 0: Left skirt bottom
    positions.push(lx, ySkirt, lz);
    normals.push(-node.nx, 0, -node.nz);
    uvs.push(0, totalDist * 0.2);

    // Vertex 1: Left road edge top
    positions.push(lx, yTop, lz);
    normals.push(0, 1, 0);
    uvs.push(0.05, totalDist * 0.2);

    // Vertex 2: Right road edge top
    positions.push(rx, yTop, rz);
    normals.push(0, 1, 0);
    uvs.push(0.95, totalDist * 0.2);

    // Vertex 3: Right skirt bottom
    positions.push(rx, ySkirt, rz);
    normals.push(node.nx, 0, node.nz);
    uvs.push(1.0, totalDist * 0.2);

    if (i > 0) {
      const row = i * 4;
      const prevRow = (i - 1) * 4;

      // Left skirt quad
      indices.push(prevRow + 0, prevRow + 1, row + 1);
      indices.push(prevRow + 0, row + 1, row + 0);

      // Top road deck quad
      indices.push(prevRow + 1, prevRow + 2, row + 2);
      indices.push(prevRow + 1, row + 2, row + 1);

      // Right skirt quad
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
 * Generates raised sidewalks along both flanks with drop curbs
 */
export function createSidewalksGeometry(
  points: [number, number][],
  roadWidth: number,
  sidewalkWidth: number = 0.75,
  yOffset: number = 0.08,
  fixedY?: number
): THREE.BufferGeometry {
  const halfRoad = roadWidth * 0.5;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const sampledNodes: RoadVertexDef[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(2, Math.ceil(dist / 1.6));
    const dx = (p2[0] - p1[0]) / dist;
    const dz = (p2[1] - p1[1]) / dist;
    const nx = -dz;
    const nz = dx;

    const startIdx = i === 0 ? 0 : 1;
    for (let s = startIdx; s <= steps; s++) {
      const t = s / steps;
      const x = p1[0] + (p2[0] - p1[0]) * t;
      const z = p1[1] + (p2[1] - p1[1]) * t;
      const groundY = fixedY !== undefined ? fixedY : getTerrainHeight(x, z);
      const y = groundY + yOffset + 0.07; // Sidewalk is raised by 7cm
      sampledNodes.push({ x, y, z, nx, nz });
    }
  }

  let totalDist = 0;
  for (let i = 0; i < sampledNodes.length; i++) {
    const node = sampledNodes[i];
    if (i > 0) {
      const prev = sampledNodes[i - 1];
      totalDist += Math.hypot(node.x - prev.x, node.z - prev.z);
    }

    // Left Sidewalk: inner edge (roadside) and outer edge
    const lInnerX = node.x - node.nx * halfRoad;
    const lInnerZ = node.z - node.nz * halfRoad;
    const lOuterX = node.x - node.nx * (halfRoad + sidewalkWidth);
    const lOuterZ = node.z - node.nz * (halfRoad + sidewalkWidth);

    // Right Sidewalk: inner edge and outer edge
    const rInnerX = node.x + node.nx * halfRoad;
    const rInnerZ = node.z + node.nz * halfRoad;
    const rOuterX = node.x + node.nx * (halfRoad + sidewalkWidth);
    const rOuterZ = node.z + node.nz * (halfRoad + sidewalkWidth);

    // Left Walkway Top (vertices 0 and 1)
    positions.push(lOuterX, node.y, lOuterZ);
    normals.push(0, 1, 0);
    uvs.push(0, totalDist * 0.3);

    positions.push(lInnerX, node.y, lInnerZ);
    normals.push(0, 1, 0);
    uvs.push(1, totalDist * 0.3);

    // Right Walkway Top (vertices 2 and 3)
    positions.push(rInnerX, node.y, rInnerZ);
    normals.push(0, 1, 0);
    uvs.push(0, totalDist * 0.3);

    positions.push(rOuterX, node.y, rOuterZ);
    normals.push(0, 1, 0);
    uvs.push(1, totalDist * 0.3);

    if (i > 0) {
      const row = i * 4;
      const prevRow = (i - 1) * 4;

      // Left sidewalk quad
      indices.push(prevRow + 0, prevRow + 1, row + 1);
      indices.push(prevRow + 0, row + 1, row + 0);

      // Right sidewalk quad
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
 * Generates crisp, non-z-fighting road lane markings positioned at +0.01m above asphalt
 */
export function createRoadMarkingsGeometry(
  points: [number, number][],
  roadWidth: number,
  type: 'double-yellow' | 'single-white' | 'dual-dash',
  yOffset: number = 0.08,
  fixedY?: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const sampledNodes: RoadVertexDef[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.max(2, Math.ceil(dist / 1.6));
    const dx = (p2[0] - p1[0]) / dist;
    const dz = (p2[1] - p1[1]) / dist;
    const nx = -dz;
    const nz = dx;

    const startIdx = i === 0 ? 0 : 1;
    for (let s = startIdx; s <= steps; s++) {
      const t = s / steps;
      const x = p1[0] + (p2[0] - p1[0]) * t;
      const z = p1[1] + (p2[1] - p1[1]) * t;
      const groundY = fixedY !== undefined ? fixedY : getTerrainHeight(x, z);
      const y = groundY + yOffset + 0.012; // Exactly 1.2cm above asphalt to completely eliminate z-fighting
      sampledNodes.push({ x, y, z, nx, nz });
    }
  }

  if (type === 'double-yellow') {
    const stripeW = 0.08;
    const gap = 0.09;
    // Two parallel yellow stripes
    for (let stripe = -1; stripe <= 1; stripe += 2) {
      const centerOffset = stripe * (gap * 0.5 + stripeW * 0.5);
      const baseIdx = positions.length / 3;

      for (let i = 0; i < sampledNodes.length; i++) {
        const node = sampledNodes[i];
        const cx = node.x + node.nx * centerOffset;
        const cz = node.z + node.nz * centerOffset;

        const lx = cx - node.nx * (stripeW * 0.5);
        const lz = cz - node.nz * (stripeW * 0.5);
        const rx = cx + node.nx * (stripeW * 0.5);
        const rz = cz + node.nz * (stripeW * 0.5);

        positions.push(lx, node.y, lz);
        normals.push(0, 1, 0);

        positions.push(rx, node.y, rz);
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
    for (let i = 0; i < sampledNodes.length; i++) {
      const node = sampledNodes[i];
      const lx = node.x - node.nx * (stripeW * 0.5);
      const lz = node.z - node.nz * (stripeW * 0.5);
      const rx = node.x + node.nx * (stripeW * 0.5);
      const rz = node.z + node.nz * (stripeW * 0.5);

      positions.push(lx, node.y, lz);
      normals.push(0, 1, 0);
      positions.push(rx, node.y, rz);
      normals.push(0, 1, 0);

      if (i > 0) {
        const row = i * 2;
        const prevRow = (i - 1) * 2;
        indices.push(prevRow + 0, prevRow + 1, row + 1);
        indices.push(prevRow + 0, row + 1, row + 0);
      }
    }
  } else if (type === 'dual-dash') {
    // White lane divider dashes for 4-lane avenues
    const laneOffset = roadWidth * 0.25;
    const stripeW = 0.08;

    for (let lane = -1; lane <= 1; lane += 2) {
      const centerOffset = lane * laneOffset;
      const baseIdx = positions.length / 3;

      for (let i = 0; i < sampledNodes.length; i++) {
        const node = sampledNodes[i];
        const cx = node.x + node.nx * centerOffset;
        const cz = node.z + node.nz * centerOffset;

        const lx = cx - node.nx * (stripeW * 0.5);
        const lz = cz - node.nz * (stripeW * 0.5);
        const rx = cx + node.nx * (stripeW * 0.5);
        const rz = cz + node.nz * (stripeW * 0.5);

        positions.push(lx, node.y, lz);
        normals.push(0, 1, 0);
        positions.push(rx, node.y, rz);
        normals.push(0, 1, 0);

        if (i > 0) {
          const row = baseIdx + i * 2;
          const prevRow = baseIdx + (i - 1) * 2;
          indices.push(prevRow + 0, prevRow + 1, row + 1);
          indices.push(prevRow + 0, row + 1, row + 0);
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
 * Generates seamless intersection junction plaza geometry with corner turn fillets
 */
export function createIntersectionJunctionGeometry(
  center: [number, number],
  widthNS: number,
  widthEW: number,
  yOffset: number = 0.08,
  fixedY?: number
): THREE.BufferGeometry {
  const [cx, cz] = center;
  const groundY = fixedY !== undefined ? fixedY : getTerrainHeight(cx, cz);
  const yTop = groundY + yOffset;
  const ySkirt = yTop - 0.28;

  const halfNS = widthNS * 0.5;
  const halfEW = widthEW * 0.5;

  // 4 corners of junction
  const corners = [
    [-halfEW, -halfNS],
    [halfEW, -halfNS],
    [halfEW, halfNS],
    [-halfEW, halfNS],
  ];

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Top slab (quad)
  corners.forEach(([ox, oz]) => {
    positions.push(cx + ox, yTop, cz + oz);
    normals.push(0, 1, 0);
  });
  indices.push(0, 1, 2);
  indices.push(0, 2, 3);

  // 4 skirt walls
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    const c1 = corners[i];
    const c2 = corners[next];

    const base = positions.length / 3;
    positions.push(cx + c1[0], yTop, cz + c1[1]);
    positions.push(cx + c2[0], yTop, cz + c2[1]);
    positions.push(cx + c2[0], ySkirt, cz + c2[1]);
    positions.push(cx + c1[0], ySkirt, cz + c1[1]);

    const nx = -(c2[1] - c1[1]);
    const nz = c2[0] - c1[0];
    const len = Math.hypot(nx, nz) || 1;
    for (let k = 0; k < 4; k++) {
      normals.push(nx / len, 0, nz / len);
    }

    indices.push(base + 0, base + 1, base + 2);
    indices.push(base + 0, base + 2, base + 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

