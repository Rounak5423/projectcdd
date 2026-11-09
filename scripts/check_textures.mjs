import fs from 'fs';

const filePath = 'public/models/council/downloaded/male_character/source/f5d0c392-bf4b-4897-b00f-b369dfcb0274.glb';
const buf = fs.readFileSync(filePath);
const chunkLength = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonStr);

console.log('Images in male GLB:', gltf.images);

