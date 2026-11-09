import fs from 'fs';

const buf = fs.readFileSync('public/models/council/real_undead_wizard.glb');
const chunkLength = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonStr);

console.log('Total file size:', (buf.length / 1024 / 1024).toFixed(2), 'MB');
console.log('BufferViews count:', gltf.bufferViews?.length);
let maxBv = { len: 0, idx: -1 };
gltf.bufferViews?.forEach((bv, idx) => {
  if (bv.byteLength > maxBv.len) maxBv = { len: bv.byteLength, idx };
});
console.log(`Largest bufferView: #${maxBv.idx} (${(maxBv.len / 1024 / 1024).toFixed(2)} MB)`);
const img = gltf.images?.find(i => i.bufferView === maxBv.idx);
console.log('Is largest BV an image?', img ? img.name || img.mimeType : 'No (geometry data)');
let totalGeom = 0;
gltf.accessors?.forEach(acc => {
  // calculate approx bytes
  totalGeom += (acc.count || 0) * 12;
});
console.log('Approx geometry uncompressed size:', (totalGeom / 1024 / 1024).toFixed(2), 'MB');

