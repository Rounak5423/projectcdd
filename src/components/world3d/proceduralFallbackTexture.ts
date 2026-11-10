import * as THREE from 'three';

let cachedFallbackTexture: THREE.CanvasTexture | null = null;

/**
 * Creates an embedded procedural checkerboard/grid texture.
 * Ensures that if any asset or texture is missing, it will never render
 * as pitch black or missing-shader pink.
 */
export function getProceduralFallbackTexture(): THREE.CanvasTexture {
  if (cachedFallbackTexture) {
    return cachedFallbackTexture;
  }

  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as any);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#223026';
    ctx.fillRect(0, 0, 64, 64);

    ctx.fillStyle = '#2d3d32';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillRect(32, 32, 32, 32);

    ctx.strokeStyle = '#435848';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 64, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  cachedFallbackTexture = texture;
  return texture;
}

export function createSafeMaterial(
  params?: THREE.MeshStandardMaterialParameters
): THREE.MeshStandardMaterial {
  const fallback = getProceduralFallbackTexture();
  return new THREE.MeshStandardMaterial({
    map: fallback,
    roughness: 0.8,
    metalness: 0.1,
    ...params,
  });
}

