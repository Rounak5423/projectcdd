import fs from 'fs';

function inspectRootTransforms(filePath) {
  const buf = fs.readFileSync(filePath);
  const chunkLength = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);

  console.log(`\n=== ${filePath} ===`);
  const sceneIdx = gltf.scene || 0;
  const rootNodeIndices = gltf.scenes[sceneIdx].nodes || [];
  console.log('Scene root nodes:', rootNodeIndices);
  rootNodeIndices.forEach((nodeIdx) => {
    const node = gltf.nodes[nodeIdx];
    console.log(`Node ${nodeIdx} ("${node.name}"):`);
    console.log(`  translation:`, node.translation);
    console.log(`  rotation:`, node.rotation);
    console.log(`  scale:`, node.scale);
    console.log(`  matrix:`, node.matrix);
    if (node.children) {
      console.log(`  children count:`, node.children.length);
      node.children.slice(0, 5).forEach((cIdx) => {
        const child = gltf.nodes[cIdx];
        console.log(`    child ${cIdx} ("${child.name}"): rot=${child.rotation}, trans=${child.translation}`);
      });
    }
  });
}

inspectRootTransforms('public/models/council/real_carl_manfred.glb');
inspectRootTransforms('public/models/council/real_fullbody_male.glb');
inspectRootTransforms('public/models/council/real_undead_wizard.glb');
inspectRootTransforms('public/models/council/real_freefire_pace.glb');
