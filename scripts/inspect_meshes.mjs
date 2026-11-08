import fs from 'fs';

function inspectMeshes(filePath) {
  const buf = fs.readFileSync(filePath);
  const chunkLength = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);

  console.log(`\n--- Meshes in ${filePath} ---`);
  gltf.meshes.forEach((m, idx) => {
    console.log(`Mesh ${idx}: ${m.name}`);
  });
}

inspectMeshes('public/models/council/real_carl_manfred.glb');
inspectMeshes('public/models/council/real_undead_wizard.glb');
inspectMeshes('public/models/council/real_freefire_pace.glb');
