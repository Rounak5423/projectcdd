import fs from 'fs';

function checkEmbedded(filePath) {
  const buf = fs.readFileSync(filePath);
  const chunkLength = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
  const gltf = JSON.parse(jsonStr);

  const images = gltf.images || [];
  const allEmbedded = images.every(img => img.bufferView !== undefined);
  console.log(`${filePath}: ${images.length} images, all embedded: ${allEmbedded}`);
}

checkEmbedded('public/models/council/downloaded/carl_manfred.glb');
checkEmbedded('public/models/council/downloaded/freefire_pace.glb');
checkEmbedded('public/models/council/downloaded/undead_wizard.glb');
