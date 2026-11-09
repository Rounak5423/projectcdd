import * as THREE from 'three';
import fs from 'fs';

function readGLBBounds(filePath) {
  const buf = fs.readFileSync(filePath);
  const chunkLength = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);

  console.log(`\n--- ${filePath} ---`);
  // Look at accessors for min/max
  let globalMin = [Infinity, Infinity, Infinity];
  let globalMax = [-Infinity, -Infinity, -Infinity];

  if (gltf.accessors) {
    gltf.accessors.forEach((acc) => {
      if (acc.min && acc.max && acc.type === 'VEC3') {
        for (let i = 0; i < 3; i++) {
          if (acc.min[i] < globalMin[i]) globalMin[i] = acc.min[i];
          if (acc.max[i] > globalMax[i]) globalMax[i] = acc.max[i];
        }
      }
    });
  }

  const size = [
    globalMax[0] - globalMin[0],
    globalMax[1] - globalMin[1],
    globalMax[2] - globalMin[2],
  ];

  console.log(`Global Accessor Bounds:`);
  console.log(`  Min: [${globalMin.map(v => v.toFixed(2)).join(', ')}]`);
  console.log(`  Max: [${globalMax.map(v => v.toFixed(2)).join(', ')}]`);
  console.log(`  Size: [${size.map(v => v.toFixed(2)).join(', ')}]`);
}

readGLBBounds('public/models/council/downloaded/carl_manfred.glb');
readGLBBounds('public/models/council/downloaded/freefire_pace.glb');
readGLBBounds('public/models/council/downloaded/undead_wizard.glb');
readGLBBounds('public/models/council/downloaded/male_character/source/f5d0c392-bf4b-4897-b00f-b369dfcb0274.glb');

