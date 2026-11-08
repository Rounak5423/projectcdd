import fs from 'fs';

// Check if GLBs are valid by inspecting JSON chunk and binary chunk
const files = [
  'public/models/council/real_carl_manfred.glb',
  'public/models/council/real_fullbody_male.glb',
  'public/models/council/real_freefire_pace.glb',
  'public/models/council/real_undead_wizard.glb',
  'public/models/council/adv_chancellor.glb',
  'public/models/council/adv_scholar.glb',
  'public/models/council/adv_architect.glb',
  'public/models/council/adv_treasurer.glb',
  'public/models/council/adv_physician.glb',
  'public/models/council/adv_keeper.glb',
];

files.forEach(f => {
  try {
    const buf = fs.readFileSync(f);
    const magic = buf.readUInt32LE(0);
    const version = buf.readUInt32LE(4);
    const length = buf.readUInt32LE(8);
    const jsonLen = buf.readUInt32LE(12);
    const jsonType = buf.readUInt32LE(16);
    const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
    const json = JSON.parse(jsonStr);
    console.log(`✓ ${f}: valid GLB v${version}, size: ${(length/1024/1024).toFixed(2)}MB, meshes: ${json.meshes?.length}`);
  } catch (err) {
    console.error(`✗ ${f}: INVALID:`, err.message);
  }
});
