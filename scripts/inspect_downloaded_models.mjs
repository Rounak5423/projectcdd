import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'fs';

global.self = global;
global.window = global;

class FileReaderPolyfill {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
}
global.FileReader = FileReaderPolyfill;

// Mock image loading for node
class ImagePolyfill {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
  }
}
global.Image = ImagePolyfill;

const models = [
  { name: 'Carl Manfred (Detroit)', path: 'public/models/council/downloaded/carl_manfred.glb' },
  { name: 'Freefire Character', path: 'public/models/council/downloaded/freefire_pace.glb' },
  { name: 'Undead Wizard Magus', path: 'public/models/council/downloaded/undead_wizard.glb' },
  { name: 'Sci-Fi Full Body Male', path: 'public/models/council/downloaded/male_character/source/f5d0c392-bf4b-4897-b00f-b369dfcb0274.glb' },
];

// Instead of parsing entire textures which need browser DOM, let's parse the JSON chunk from the GLB!
function inspectGLBJson(filePath) {
  const buf = fs.readFileSync(filePath);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) {
    console.log('Not a valid GLB binary');
    return;
  }
  const version = buf.readUInt32LE(4);
  const length = buf.readUInt32LE(8);
  const chunkLength = buf.readUInt32LE(12);
  const chunkType = buf.readUInt32LE(16);

  const jsonStr = buf.toString('utf8', 20, 20 + chunkLength);
  const json = JSON.parse(jsonStr);

  console.log(`Version: ${version}, Total length: ${(length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Nodes: ${json.nodes ? json.nodes.length : 0}`);
  console.log(`Meshes: ${json.meshes ? json.meshes.length : 0}`);
  console.log(`Materials: ${json.materials ? json.materials.length : 0}`);
  console.log(`Animations: ${json.animations ? json.animations.length : 0}`);
  if (json.animations) {
    json.animations.forEach((a, i) => console.log(`  - Anim #${i}: "${a.name}"`));
  }
  if (json.nodes) {
    const nodeNames = json.nodes.map(n => n.name).filter(Boolean);
    console.log(`Sample node names (first 15):`, nodeNames.slice(0, 15));
  }
  if (json.meshes) {
    const meshNames = json.meshes.map(m => m.name).filter(Boolean);
    console.log(`Sample mesh names:`, meshNames.slice(0, 10));
  }
}

for (const m of models) {
  console.log(`\n========================================`);
  console.log(`Model: ${m.name} (${m.path})`);
  inspectGLBJson(m.path);
}
