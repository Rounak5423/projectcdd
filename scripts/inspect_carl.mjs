import fs from 'fs';

function inspectGLB(filePath) {
  const buf = fs.readFileSync(filePath);
  const chunkLength = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);

  console.log(`\n=== ${filePath} ===`);
  console.log(`Total: ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
  if (gltf.images) {
    console.log(`Images: ${gltf.images.length}`);
    gltf.images.forEach((img, i) => {
      const bv = gltf.bufferViews[img.bufferView];
      console.log(`  Img #${i}: ${img.name || 'unnamed'} (${img.mimeType}), size: ${(bv.byteLength / 1024).toFixed(1)} KB`);
    });
  }
}

inspectGLB('public/models/council/real_carl_manfred.glb');
inspectGLB('public/models/council/real_fullbody_male.glb');
