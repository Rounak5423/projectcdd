// =============================================================================
// CIVORA — Royal Council 3D Realistic Character Model Generator
// Generates 6 distinct, anatomically proportioned historical advisor GLB models:
// 1. adv_chancellor.glb — Chancellor Malor Drake (Imperial Statesman)
// 2. adv_treasurer.glb  — High Treasurer Varian Voss (Master of Coin)
// 3. adv_scholar.glb    — Grand Scholar Elyse Moran (Academic Sage)
// 4. adv_architect.glb  — Royal Architect Corin Sol (Master Builder)
// 5. adv_physician.glb  — High Physician Thalia Rowe (Healer of the Realm)
// 6. adv_keeper.glb     — Keeper of Nature Sarah Thorne (Ecological Warden)
// =============================================================================

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

// Polyfill FileReader for Node.js GLTFExporter binary mode
class FileReaderPolyfill {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
}
global.FileReader = FileReaderPolyfill;

const OUTPUT_DIRS = [
  path.resolve('public/models/council'),
  path.resolve('dist/models/council'),
];

for (const dir of OUTPUT_DIRS) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// -----------------------------------------------------------------------------
// Helper Geometry Generators
// -----------------------------------------------------------------------------

function createSculptedHead(advisor) {
  const headGroup = new THREE.Group();
  headGroup.name = 'HeadAssembly';

  // 1. Cranium / Skull (Egg-shaped ellipsoid, contoured for human head)
  const skullGeo = new THREE.SphereGeometry(0.12, 32, 28);
  skullGeo.scale(0.88, 1.08, 1.02);
  const skullMesh = new THREE.Mesh(skullGeo, advisor.materials.skin);
  skullMesh.castShadow = true;
  skullMesh.name = 'Cranium';
  headGroup.add(skullMesh);

  // 2. Zygomatic Arches / Cheekbones (Adds structured human facial form)
  const leftCheek = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 16, 16),
    advisor.materials.skin
  );
  leftCheek.position.set(-0.068, 0.015, 0.055);
  leftCheek.scale.set(0.65, 0.85, 0.8);
  headGroup.add(leftCheek);

  const rightCheek = leftCheek.clone();
  rightCheek.position.x = 0.068;
  headGroup.add(rightCheek);

  // 3. Brow Ridge (Supraorbital margin)
  const browRidge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.12, 16),
    advisor.materials.skin
  );
  browRidge.rotation.z = Math.PI / 2;
  browRidge.position.set(0, 0.045, 0.082);
  browRidge.scale.set(1, 0.5, 0.6);
  headGroup.add(browRidge);

  // 4. Anatomical Nose Structure (Bridge, Dorsum, Tip, Alar Wings)
  const noseGroup = new THREE.Group();
  noseGroup.position.set(0, 0.005, 0.095);

  // Nasal bridge and dorsum
  const bridgeGeo = new THREE.ConeGeometry(0.022, 0.065, 5);
  bridgeGeo.rotateX(Math.PI);
  const bridgeMesh = new THREE.Mesh(bridgeGeo, advisor.materials.skin);
  bridgeMesh.position.set(0, 0.01, 0.012);
  bridgeMesh.scale.set(0.7, 1.1, 0.75);
  noseGroup.add(bridgeMesh);

  // Nose tip
  const tipMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 12, 12),
    advisor.materials.skin
  );
  tipMesh.position.set(0, -0.018, 0.024);
  tipMesh.scale.set(0.9, 0.8, 1.0);
  noseGroup.add(tipMesh);

  // Nostril wings (alae)
  const leftWing = new THREE.Mesh(
    new THREE.SphereGeometry(0.009, 8, 8),
    advisor.materials.skin
  );
  leftWing.position.set(-0.016, -0.02, 0.016);
  noseGroup.add(leftWing);

  const rightWing = leftWing.clone();
  rightWing.position.x = 0.016;
  noseGroup.add(rightWing);

  headGroup.add(noseGroup);

  // 5. Anatomical Lips (Philtrum, Upper Cupid's Bow, Lower Lip Fullness)
  const lipsGroup = new THREE.Group();
  lipsGroup.position.set(0, -0.048, 0.092);

  const upperLip = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.006, 8, 16, Math.PI),
    advisor.materials.lips
  );
  upperLip.rotation.z = Math.PI;
  upperLip.scale.set(1.1, 0.7, 0.6);
  lipsGroup.add(upperLip);

  const lowerLip = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 12, 8),
    advisor.materials.lips
  );
  lowerLip.position.set(0, -0.012, 0.003);
  lowerLip.scale.set(1.7, 0.6, 0.8);
  lipsGroup.add(lowerLip);

  headGroup.add(lipsGroup);

  // 6. Chin / Mandible (Protruding mental protuberance and defined jawline)
  const chinMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 16, 14),
    advisor.materials.skin
  );
  chinMesh.position.set(0, -0.088, 0.075);
  chinMesh.scale.set(1.1, 0.9, 1.0);
  headGroup.add(chinMesh);

  // 7. Anatomical Eyes (Recessed sockets, sclera, iris with advisor color, pupil)
  const leftEyeGroup = new THREE.Group();
  leftEyeGroup.position.set(-0.042, 0.032, 0.088);

  const eyeSclera = new THREE.Mesh(
    new THREE.SphereGeometry(0.015, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xF4EFE6, roughness: 0.15 })
  );
  leftEyeGroup.add(eyeSclera);

  const eyeIris = new THREE.Mesh(
    new THREE.CircleGeometry(0.007, 16),
    new THREE.MeshStandardMaterial({ color: advisor.eyeColor, roughness: 0.2 })
  );
  eyeIris.position.set(0, 0, 0.014);
  leftEyeGroup.add(eyeIris);

  const eyePupil = new THREE.Mesh(
    new THREE.CircleGeometry(0.0035, 12),
    new THREE.MeshBasicMaterial({ color: 0x050505 })
  );
  eyePupil.position.set(0, 0, 0.0145);
  leftEyeGroup.add(eyePupil);

  // Upper eyelid fold
  const upperLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.03, 12, 1, false, 0, Math.PI),
    advisor.materials.skin
  );
  upperLid.rotation.z = Math.PI / 2;
  upperLid.position.set(0, 0.006, 0.002);
  leftEyeGroup.add(upperLid);

  headGroup.add(leftEyeGroup);

  const rightEyeGroup = leftEyeGroup.clone();
  rightEyeGroup.position.x = 0.042;
  headGroup.add(rightEyeGroup);

  // Eyebrows
  const leftBrow = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.008, 0.01),
    advisor.materials.hair
  );
  leftBrow.position.set(-0.044, 0.052, 0.098);
  leftBrow.rotation.z = 0.08;
  headGroup.add(leftBrow);

  const rightBrow = leftBrow.clone();
  rightBrow.position.x = 0.044;
  rightBrow.rotation.z = -0.08;
  headGroup.add(rightBrow);

  // 8. Anatomical Ears (Realistic curved concha and lobule at proper height)
  const leftEar = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.008, 8, 16, Math.PI * 1.3),
    advisor.materials.skin
  );
  leftEar.position.set(-0.11, 0.012, -0.015);
  leftEar.rotation.y = -Math.PI / 2;
  leftEar.rotation.z = 0.2;
  headGroup.add(leftEar);

  const rightEar = leftEar.clone();
  rightEar.position.x = 0.11;
  rightEar.rotation.y = Math.PI / 2;
  rightEar.rotation.z = -0.2;
  headGroup.add(rightEar);

  // 9. Advisor-Specific Hair & Facial Styling
  if (advisor.buildHair) {
    advisor.buildHair(headGroup);
  }

  return headGroup;
}

function createRealisticHand(isRight = false, advisor) {
  const handGroup = new THREE.Group();
  handGroup.name = isRight ? 'RightHand' : 'LeftHand';

  // 1. Palm (Carpus + Metacarpus with naturally curved flesh)
  const palmGeo = new THREE.BoxGeometry(0.062, 0.024, 0.075);
  const palmMesh = new THREE.Mesh(palmGeo, advisor.materials.skin);
  palmMesh.castShadow = true;
  handGroup.add(palmMesh);

  // Thenar eminence (thumb muscle pad)
  const thumbPad = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 12, 10),
    advisor.materials.skin
  );
  thumbPad.position.set(isRight ? -0.024 : 0.024, -0.006, -0.01);
  thumbPad.scale.set(0.9, 0.7, 1.2);
  handGroup.add(thumbPad);

  // 2. Articulated Thumb (2 curved segments)
  const thumbGroup = new THREE.Group();
  thumbGroup.position.set(isRight ? -0.032 : 0.032, -0.004, 0.01);
  thumbGroup.rotation.y = isRight ? -0.4 : 0.4;
  thumbGroup.rotation.z = isRight ? -0.3 : 0.3;

  const thumbP1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.009, 0.028, 8),
    advisor.materials.skin
  );
  thumbP1.rotation.x = Math.PI / 4;
  thumbP1.position.set(0, 0, 0.012);
  thumbGroup.add(thumbP1);

  const thumbP2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0065, 0.0075, 0.022, 8),
    advisor.materials.skin
  );
  thumbP2.rotation.x = Math.PI / 2.8;
  thumbP2.position.set(0, -0.006, 0.028);
  thumbGroup.add(thumbP2);

  handGroup.add(thumbGroup);

  // 3. Four Articulated Fingers (Index, Middle, Ring, Little)
  const fingerOffsets = [-0.021, -0.007, 0.007, 0.021];
  const fingerLengths = [0.036, 0.042, 0.039, 0.031];
  const fingerThickness = [0.0072, 0.0075, 0.007, 0.006];

  fingerOffsets.forEach((xPos, idx) => {
    const fLen = fingerLengths[idx];
    const fThick = fingerThickness[idx];

    const finger = new THREE.Group();
    finger.position.set(xPos, -0.002, 0.038);

    // Proximal phalanx (gently curved over chair arm)
    const p1 = new THREE.Mesh(
      new THREE.CylinderGeometry(fThick, fThick * 1.05, fLen * 0.55, 8),
      advisor.materials.skin
    );
    p1.rotation.x = 0.28;
    p1.position.set(0, -0.004, fLen * 0.24);
    finger.add(p1);

    // Intermediate + distal phalanx (draping down naturally)
    const p2 = new THREE.Mesh(
      new THREE.CylinderGeometry(fThick * 0.85, fThick, fLen * 0.48, 8),
      advisor.materials.skin
    );
    p2.rotation.x = 0.65;
    p2.position.set(0, -0.016, fLen * 0.58);
    finger.add(p2);

    handGroup.add(finger);
  });

  return handGroup;
}

function createSeatedLowerBody(advisor) {
  const lowerBody = new THREE.Group();
  lowerBody.name = 'LowerBodyRobes';

  // 1. Horizontal Seated Thighs draped in tailored fabric (from hip Y=0.52 to knees Y=0.50, Z=0.42)
  const thighsRobe = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.22, 0.48),
    advisor.materials.primary
  );
  thighsRobe.position.set(0, 0.46, 0.16);
  thighsRobe.castShadow = true;
  lowerBody.add(thighsRobe);

  // Central lap fold ridge
  const lapCrease = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.06, 0.42, 12),
    advisor.materials.secondary
  );
  lapCrease.rotation.x = Math.PI / 2;
  lapCrease.position.set(0, 0.54, 0.18);
  lowerBody.add(lapCrease);

  // 2. Heavy cascading front skirt (hanging vertically down from knees to floor)
  const skirtFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.42, 0.26),
    advisor.materials.primary
  );
  skirtFront.position.set(0, 0.23, 0.28);
  skirtFront.castShadow = true;
  lowerBody.add(skirtFront);

  // Lower hem embroidered border trim
  const hemTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.05, 0.28),
    advisor.materials.accent
  );
  hemTrim.position.set(0, 0.05, 0.28);
  lowerBody.add(hemTrim);

  // Side drapes overflowing chair seat
  const leftSideDrape = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.42, 0.44),
    advisor.materials.secondary
  );
  leftSideDrape.position.set(-0.25, 0.26, 0.14);
  lowerBody.add(leftSideDrape);

  const rightSideDrape = leftSideDrape.clone();
  rightSideDrape.position.x = 0.25;
  lowerBody.add(rightSideDrape);

  // 3. Realistic Historical Leather Footwear peeking out from beneath hem
  const leftBoot = new THREE.Group();
  leftBoot.position.set(-0.13, 0.04, 0.36);

  // Boot foot / vamp
  const bootFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.095, 0.07, 0.19),
    advisor.materials.leather
  );
  leftBoot.add(bootFoot);

  // Boot toe cap curve
  const toeCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.046, 0.046, 0.092, 12),
    advisor.materials.leather
  );
  toeCap.rotation.z = Math.PI / 2;
  toeCap.position.set(0, -0.01, 0.09);
  leftBoot.add(toeCap);

  lowerBody.add(leftBoot);

  const rightBoot = leftBoot.clone();
  rightBoot.position.x = 0.13;
  lowerBody.add(rightBoot);

  return lowerBody;
}

function createUpperTorso(advisor) {
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'TorsoAssembly';
  torsoGroup.position.set(0, 0.52, 0);

  // 1. Contoured Thoracic Core (Chest, Ribcage, Waist with natural seated posture)
  const chestMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.44, 0.28),
    advisor.materials.primary
  );
  chestMesh.position.set(0, 0.28, -0.04);
  chestMesh.castShadow = true;
  torsoGroup.add(chestMesh);

  // Under-tunic / Doublet inset at chest
  const doubletInset = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.36, 0.04),
    advisor.materials.secondary
  );
  doubletInset.position.set(0, 0.26, 0.095);
  torsoGroup.add(doubletInset);

  // 2. Ceremonial Embroidered Stole / Royal Sash
  const stole = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.42, 0.015),
    advisor.materials.accent
  );
  stole.position.set(0, 0.25, 0.115);
  torsoGroup.add(stole);

  // 3. Broad Sloping Shoulders & Collar Mantle (Anatomical slope, not boxy)
  const collarMantle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.27, 0.12, 16),
    advisor.materials.secondary
  );
  collarMantle.position.set(0, 0.46, -0.04);
  collarMantle.scale.set(1.15, 1.0, 0.75);
  torsoGroup.add(collarMantle);

  // 4. Anatomical Neck with Sternocleidomastoid Form
  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.076, 0.12, 16),
    advisor.materials.skin
  );
  neckMesh.position.set(0, 0.54, -0.035);
  torsoGroup.add(neckMesh);

  // 5. Left Arm (Draped sleeve + Forearm resting on armrest Y=0.72)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.25, 0.42, -0.04);

  // Shoulder deltoid curve
  const leftShoulder = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    advisor.materials.secondary
  );
  leftArmGroup.add(leftShoulder);

  // Upper arm sleeve
  const leftUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.068, 0.26, 12),
    advisor.materials.primary
  );
  leftUpperArm.position.set(-0.02, -0.14, 0.04);
  leftUpperArm.rotation.set(0.3, 0, 0.15);
  leftArmGroup.add(leftUpperArm);

  // Forearm extending forward along chair armrest
  const leftForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.052, 0.28, 12),
    advisor.materials.secondary
  );
  leftForearm.position.set(-0.04, -0.22, 0.19);
  leftForearm.rotation.set(-0.65, 0, 0);
  leftArmGroup.add(leftForearm);

  // Left articulated hand
  const leftHand = createRealisticHand(false, advisor);
  leftHand.position.set(-0.04, -0.25, 0.36);
  leftHand.rotation.set(-0.15, 0, 0);
  leftArmGroup.add(leftHand);

  torsoGroup.add(leftArmGroup);

  // 6. Right Arm (Draped sleeve + Hand in characteristic posture)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.name = 'RightArmAssembly';
  rightArmGroup.position.set(0.25, 0.42, -0.04);

  // Shoulder deltoid
  const rightShoulder = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    advisor.materials.secondary
  );
  rightArmGroup.add(rightShoulder);

  // Upper arm sleeve
  const rightUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.068, 0.26, 12),
    advisor.materials.primary
  );
  rightUpperArm.position.set(0.02, -0.14, 0.04);
  rightUpperArm.rotation.set(0.3, 0, -0.15);
  rightArmGroup.add(rightUpperArm);

  // Forearm
  const rightForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.052, 0.28, 12),
    advisor.materials.secondary
  );
  rightForearm.position.set(0.04, -0.22, 0.19);
  rightForearm.rotation.set(-0.65, 0, 0);
  rightArmGroup.add(rightForearm);

  // Right articulated hand
  const rightHand = createRealisticHand(true, advisor);
  rightHand.position.set(0.04, -0.25, 0.36);
  rightHand.rotation.set(-0.15, 0, 0);
  rightArmGroup.add(rightHand);

  // Advisor-Specific Handheld Attribute
  if (advisor.buildAttribute) {
    advisor.buildAttribute(rightArmGroup);
  }

  torsoGroup.add(rightArmGroup);

  // 7. Head Mount
  const head = createSculptedHead(advisor);
  head.position.set(0, 0.68, -0.035);
  torsoGroup.add(head);

  return torsoGroup;
}

// -----------------------------------------------------------------------------
// Advisor Definitions with Unique Identities, Accessories, and Styling
// -----------------------------------------------------------------------------

function buildCommonMaterials(pColor, sColor, aColor, skinColor, hairColor, lipColor) {
  return {
    primary: new THREE.MeshStandardMaterial({
      color: pColor,
      roughness: 0.82,
      metalness: 0.12,
    }),
    secondary: new THREE.MeshStandardMaterial({
      color: sColor,
      roughness: 0.78,
      metalness: 0.15,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: aColor,
      roughness: 0.32,
      metalness: 0.85,
    }),
    skin: new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.58,
      metalness: 0.03,
    }),
    lips: new THREE.MeshStandardMaterial({
      color: lipColor,
      roughness: 0.45,
      metalness: 0.02,
    }),
    hair: new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.88,
      metalness: 0.08,
    }),
    leather: new THREE.MeshStandardMaterial({
      color: 0x241810,
      roughness: 0.68,
      metalness: 0.22,
    }),
  };
}

const ADVISORS = [
  // 1. THE CHANCELLOR — Mature distinguished statesman in regal green & antique gold
  {
    fileName: 'adv_chancellor.glb',
    id: 'adv-chancellor',
    name: 'Chancellor Malor Drake',
    eyeColor: 0x4B6E4A, // Hazel Green
    materials: buildCommonMaterials(0x15291B, 0x1F3D29, 0xC5A66A, 0xD9B89C, 0x96908A, 0xA86B5A),
    buildHair: (head) => {
      // Wavy styled hair with aristocratic temple graying
      const hairCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.124, 24, 20),
        new THREE.MeshStandardMaterial({ color: 0x8A837C, roughness: 0.9 })
      );
      hairCap.position.set(0, 0.03, -0.015);
      hairCap.scale.set(1.02, 1.05, 1.05);
      head.add(hairCap);

      // Parted side locks
      const leftLock = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.018, 0.09, 8),
        new THREE.MeshStandardMaterial({ color: 0x8A837C, roughness: 0.9 })
      );
      leftLock.position.set(-0.105, -0.01, 0.01);
      leftLock.rotation.z = -0.15;
      head.add(leftLock);

      const rightLock = leftLock.clone();
      rightLock.position.x = 0.105;
      rightLock.rotation.z = 0.15;
      head.add(rightLock);

      // Distinguished neat goatee beard
      const goatee = new THREE.Mesh(
        new THREE.ConeGeometry(0.024, 0.055, 8),
        new THREE.MeshStandardMaterial({ color: 0x9E9790, roughness: 0.95 })
      );
      goatee.rotation.x = -0.3;
      goatee.position.set(0, -0.095, 0.082);
      head.add(goatee);

      // Gold Imperial Circlet / Crown Fillet
      const fillet = new THREE.Mesh(
        new THREE.TorusGeometry(0.122, 0.009, 8, 32),
        new THREE.MeshStandardMaterial({ color: 0xC5A66A, metalness: 0.88, roughness: 0.28 })
      );
      fillet.rotation.x = Math.PI / 2;
      fillet.position.set(0, 0.045, -0.005);
      head.add(fillet);
    },
    buildAttribute: (arm) => {
      // Golden Signet Ring on right hand index finger
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.009, 0.003, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0xC5A66A, metalness: 0.9, roughness: 0.2 })
      );
      ring.position.set(0.035, -0.252, 0.385);
      arm.add(ring);
    },
  },

  // 2. THE TREASURER — Sharp calculating financial administrator in dark brown & muted gold
  {
    fileName: 'adv_treasurer.glb',
    id: 'adv-treasurer',
    name: 'Treasurer Varian Voss',
    eyeColor: 0x3E2D1D, // Deep Amber
    materials: buildCommonMaterials(0x281B12, 0x3D2A1C, 0xD6A75E, 0xD4B094, 0x3D352E, 0x9B5F50),
    buildHair: (head) => {
      // Slicked back hair
      const slickHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.122, 24, 20),
        new THREE.MeshStandardMaterial({ color: 0x3A322C, roughness: 0.75 })
      );
      slickHair.position.set(0, 0.035, -0.02);
      slickHair.scale.set(1.0, 1.04, 1.1);
      head.add(slickHair);

      // Trimmed chin beard
      const chinBeard = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.025, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x3A322C, roughness: 0.85 })
      );
      chinBeard.position.set(0, -0.09, 0.08);
      head.add(chinBeard);
    },
    buildAttribute: (arm) => {
      // Leather-bound ledger resting beneath right hand
      const ledger = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.035, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x4A2511, roughness: 0.65, metalness: 0.1 })
      );
      ledger.position.set(0.04, -0.28, 0.38);
      arm.add(ledger);

      // Brass corner protectors on ledger
      const corner = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.038, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xD6A75E, metalness: 0.85, roughness: 0.3 })
      );
      corner.position.set(0.12, -0.28, 0.49);
      arm.add(corner);
    },
  },

  // 3. THE GRAND SCHOLAR — Wise elder philosopher in midnight navy with books & pince-nez
  {
    fileName: 'adv_scholar.glb',
    id: 'adv-scholar',
    name: 'Grand Scholar Elyse Moran',
    eyeColor: 0x4A6B82, // Slate Blue
    materials: buildCommonMaterials(0x16212E, 0x22354A, 0x93B4CE, 0xE2C2A6, 0xC4BDB5, 0xA2675C),
    buildHair: (head) => {
      // Flowing silver scholar locks
      const scholarHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.126, 24, 20),
        new THREE.MeshStandardMaterial({ color: 0xB8B2AA, roughness: 0.95 })
      );
      scholarHair.position.set(0, 0.03, -0.025);
      scholarHair.scale.set(1.05, 1.12, 1.15);
      head.add(scholarHair);

      // Full distinguished academic beard
      const beard = new THREE.Mesh(
        new THREE.ConeGeometry(0.052, 0.11, 12),
        new THREE.MeshStandardMaterial({ color: 0xB8B2AA, roughness: 0.95 })
      );
      beard.position.set(0, -0.11, 0.065);
      beard.rotation.x = -0.25;
      head.add(beard);

      // Delicate wire-rim Pince-Nez spectacles perched on nose bridge
      const spectacles = new THREE.Group();
      spectacles.position.set(0, 0.026, 0.108);

      const leftRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.014, 0.002, 6, 16),
        new THREE.MeshStandardMaterial({ color: 0xC5A66A, metalness: 0.9, roughness: 0.25 })
      );
      leftRim.position.x = -0.022;
      spectacles.add(leftRim);

      const rightRim = leftRim.clone();
      rightRim.position.x = 0.022;
      spectacles.add(rightRim);

      // Spectacle nose bridge connector
      const specBridge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0015, 0.0015, 0.015, 6),
        new THREE.MeshStandardMaterial({ color: 0xC5A66A, metalness: 0.9, roughness: 0.25 })
      );
      specBridge.rotation.z = Math.PI / 2;
      spectacles.add(specBridge);

      head.add(spectacles);
    },
    buildAttribute: (arm) => {
      // Rolled scholarly celestial scroll in hand
      const scroll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.22, 12),
        new THREE.MeshStandardMaterial({ color: 0xEAE2CF, roughness: 0.85 })
      );
      scroll.rotation.z = Math.PI / 2;
      scroll.position.set(0.04, -0.25, 0.40);
      arm.add(scroll);
    },
  },

  // 4. THE ROYAL ARCHITECT — Methodical engineer in terracotta, leather & drafting calipers
  {
    fileName: 'adv_architect.glb',
    id: 'adv-architect',
    name: 'Royal Architect Corin Sol',
    eyeColor: 0x362B1D, // Dark Walnut
    materials: buildCommonMaterials(0x301F15, 0x482F20, 0xC88242, 0xCBA485, 0x2A231F, 0x90584B),
    buildHair: (head) => {
      // Cropped curly dark hair
      const croppedHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.123, 24, 20),
        new THREE.MeshStandardMaterial({ color: 0x241E1A, roughness: 0.8 })
      );
      croppedHair.position.set(0, 0.038, -0.01);
      croppedHair.scale.set(1.02, 1.05, 1.04);
      head.add(croppedHair);

      // Rugged trimmed jawline stubble
      const stubble = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.075, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0x2A231F, roughness: 0.95 })
      );
      stubble.position.set(0, -0.065, 0.045);
      head.add(stubble);
    },
    buildAttribute: (arm) => {
      // Brass drafting divider / compass in right hand
      const compassGroup = new THREE.Group();
      compassGroup.position.set(0.04, -0.25, 0.38);

      const leg1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.0015, 0.12, 6),
        new THREE.MeshStandardMaterial({ color: 0xC5A66A, metalness: 0.88, roughness: 0.3 })
      );
      leg1.rotation.z = 0.2;
      compassGroup.add(leg1);

      const leg2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.0015, 0.12, 6),
        new THREE.MeshStandardMaterial({ color: 0xC5A66A, metalness: 0.88, roughness: 0.3 })
      );
      leg2.rotation.z = -0.2;
      compassGroup.add(leg2);

      arm.add(compassGroup);
    },
  },

  // 5. THE HIGH PHYSICIAN — Compassionate healer in ivory, sage green & silver phials
  {
    fileName: 'adv_physician.glb',
    id: 'adv-physician',
    name: 'High Physician Thalia Rowe',
    eyeColor: 0x2B4A3A, // Deep Sage
    materials: buildCommonMaterials(0x1F2E25, 0x32473A, 0xEAE3D2, 0xE5C4AB, 0x48362B, 0xB06E62),
    buildHair: (head) => {
      // Elegant historical coronal braid / braided crown
      const hairBase = new THREE.Mesh(
        new THREE.SphereGeometry(0.122, 24, 20),
        new THREE.MeshStandardMaterial({ color: 0x423226, roughness: 0.85 })
      );
      hairBase.position.set(0, 0.035, -0.015);
      head.add(hairBase);

      const braidedCrown = new THREE.Mesh(
        new THREE.TorusGeometry(0.118, 0.016, 8, 28),
        new THREE.MeshStandardMaterial({ color: 0x3E2F23, roughness: 0.9 })
      );
      braidedCrown.rotation.x = Math.PI / 2.3;
      braidedCrown.position.set(0, 0.045, -0.01);
      head.add(braidedCrown);

      // Silver hairpin pins
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.002, 0.002, 0.06, 6),
        new THREE.MeshStandardMaterial({ color: 0xDDDDDD, metalness: 0.95, roughness: 0.15 })
      );
      pin.rotation.z = Math.PI / 3;
      pin.position.set(0.06, 0.07, -0.04);
      head.add(pin);
    },
    buildAttribute: (arm) => {
      // Silver & glass herbal elixir phial in hand
      const phialGroup = new THREE.Group();
      phialGroup.position.set(0.04, -0.24, 0.38);

      const glassVial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.016, 0.065, 12),
        new THREE.MeshStandardMaterial({
          color: 0x558B6E,
          roughness: 0.15,
          metalness: 0.1,
        })
      );
      phialGroup.add(glassVial);

      const silverCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.015, 0.018, 10),
        new THREE.MeshStandardMaterial({ color: 0xE0E0E0, metalness: 0.9, roughness: 0.2 })
      );
      silverCap.position.y = 0.038;
      phialGroup.add(silverCap);

      arm.add(phialGroup);
    },
  },

  // 6. THE KEEPER OF NATURE — Forest guardian in olive linen with laurel circlet
  {
    fileName: 'adv_keeper.glb',
    id: 'adv-keeper',
    name: 'Keeper of Nature Sarah Thorne',
    eyeColor: 0x3A5C30, // Forest Green
    materials: buildCommonMaterials(0x182B1C, 0x27432D, 0x8FA879, 0xDAB89B, 0x613D22, 0x9C5B4E),
    buildHair: (head) => {
      // Flowing natural wavy auburn hair
      const auburnHair = new THREE.Mesh(
        new THREE.SphereGeometry(0.126, 24, 20),
        new THREE.MeshStandardMaterial({ color: 0x59371D, roughness: 0.9 })
      );
      auburnHair.position.set(0, 0.03, -0.02);
      auburnHair.scale.set(1.04, 1.1, 1.12);
      head.add(auburnHair);

      // Golden laurel / botanical circlet
      const circlet = new THREE.Mesh(
        new THREE.TorusGeometry(0.122, 0.008, 6, 28),
        new THREE.MeshStandardMaterial({ color: 0xC5A66A, metalness: 0.85, roughness: 0.3 })
      );
      circlet.rotation.x = Math.PI / 2.2;
      circlet.position.set(0, 0.045, -0.005);
      head.add(circlet);

      // Botanical ivy leaves attached to circlet
      for (let i = -2; i <= 2; i++) {
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.009, 0.022, 4),
          new THREE.MeshStandardMaterial({ color: 0x8FA879, roughness: 0.6 })
        );
        leaf.rotation.z = i * 0.4;
        leaf.position.set(i * 0.038, 0.052, 0.088);
        head.add(leaf);
      }
    },
    buildAttribute: (arm) => {
      // Botanical talisman / carved olive wood sprig in hand
      const talisman = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.005, 0.16, 8),
        new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.75 })
      );
      talisman.position.set(0.04, -0.24, 0.38);
      talisman.rotation.z = 0.3;
      arm.add(talisman);
    },
  },
];

// -----------------------------------------------------------------------------
// Generation Pipeline
// -----------------------------------------------------------------------------

async function generateAllAdvisors() {
  console.log('🏛️  CIVORA — Generating 6 High-Fidelity Historical Advisor 3D Models...');
  const exporter = new GLTFExporter();

  for (const advisor of ADVISORS) {
    const characterRoot = new THREE.Group();
    characterRoot.name = advisor.id;

    // Build anatomical seated body
    const lowerBody = createSeatedLowerBody(advisor);
    characterRoot.add(lowerBody);

    const torso = createUpperTorso(advisor);
    characterRoot.add(torso);

    await new Promise((resolve, reject) => {
      exporter.parse(
        characterRoot,
        (glbBuffer) => {
          const buffer = Buffer.from(glbBuffer);
          for (const outDir of OUTPUT_DIRS) {
            const outPath = path.join(outDir, advisor.fileName);
            fs.writeFileSync(outPath, buffer);
            console.log(`  ✓ Exported ${advisor.fileName} to ${path.relative('.', outPath)} (${(buffer.length / 1024).toFixed(1)} KB)`);
          }
          resolve();
        },
        (error) => {
          console.error(`  ✗ Error exporting ${advisor.fileName}:`, error);
          reject(error);
        },
        { binary: true }
      );
    });
  }

  console.log('🏛️  All 6 Royal Council Advisor models generated successfully!');
}

generateAllAdvisors().catch((err) => {
  console.error('Fatal generation error:', err);
  process.exit(1);
});

