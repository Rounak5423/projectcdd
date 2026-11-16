/* GENESIS 3D world (Three.js). It only DRAWS the state sent by the backend; it never invents simulation data. */
const World3D = (() => {
  const TILE = 2;
  let scene, camera, renderer, controls, ray, mouse, S = 36, handlers = {}, el;
  const bMeshes = {}, bKeys = {};
  let roadMesh, waterMesh, mapKey = '', cBody, cHead, cIds = [], cCur = [], cTgt = [], cMeta = [];
  let ghost, ring, placing = null, valid = () => true, hover = null, clock = 0, citizenMap = [];
  const PROF = { farmer: 0x8bc34a, doctor: 0xffffff, nurse: 0xf48fb1, teacher: 0xffc107, student: 0x4fc3f7, engineer: 0xff9800,
    scientist: 0xab47bc, researcher: 0x7e57c2, factory_worker: 0x90a4ae, business_owner: 0x212121, construction_worker: 0xffeb3b,
    government_employee: 0x3949ab, service_worker: 0x26a69a, unemployed: 0xbdbdbd, child: 0xffab91, retired: 0xa1887f };
  const wx = x => (x - S / 2) * TILE, wz = z => (z - S / 2) * TILE;
  const mat = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));

  function box(w, h, d, c, x, y, z, parent, o) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)); m.position.set(x, y + h / 2, z); parent.add(m); return m;
  }
  function cyl(rt, rb, h, c, x, y, z, parent, seg = 14) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c)); m.position.set(x, y + h / 2, z); parent.add(m); return m;
  }
  function cone(r, h, c, x, y, z, parent, seg = 4, rot = 0) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(c)); m.position.set(x, y + h / 2, z); m.rotation.y = rot; parent.add(m); return m;
  }
  function sph(r, c, x, y, z, parent, o) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat(c, o)); m.position.set(x, y, z); parent.add(m); return m;
  }
  function tree(g, x, z, s = 1) { cyl(.05 * s, .07 * s, .3 * s, 0x6d4c41, x, 0, z, g, 6); cone(.22 * s, .55 * s, 0x2e7d32, x, .3 * s, z, g, 7); }

  const BUILD = {
    residential(g, L) {
      for (let i = 0; i < 1 + (L > 1) + (L > 2); i++) box(1.2, .55, 1.2, i % 2 ? 0xffe0b2 : 0xffcc80, 0, i * .55, 0, g);
      const top = (1 + (L > 1) + (L > 2)) * .55;
      cone(.95, .5, 0xc0392b, 0, top, 0, g, 4, Math.PI / 4);
      for (let i = 0; i < 4; i++) box(.2, .2, .02, 0x90caf9, -.4 + (i % 2) * .8, .2 + Math.floor(i / 2) * .5, .61, g);
    },
    farm(g, L) {
      box(1.8, .04, 1.8, 0x7cb342, 0, 0, 0, g);
      for (let i = 0; i < 5; i++) box(1.5, .06, .12, 0xc0ca33, 0, .04, -.7 + i * .35, g);
      box(.6, .45 + L * .08, .5, 0xc62828, -.5, 0, -.55, g); cone(.5, .3, 0x8d6e63, -.5, .45 + L * .08, -.55, g, 4, Math.PI / 4);
      cyl(.17, .17, .7 + L * .1, 0xcfd8dc, .6, 0, -.6, g); sph(.17, 0x90a4ae, .6, .7 + L * .1, -.6, g);
    },
    hospital(g, L) {
      const h = .8 + .3 * L; box(1.5, h, 1.1, 0xfafafa, 0, 0, 0, g); box(.5, h + .25, .6, 0xeceff1, .5, 0, 0, g);
      box(.5, .12, .14, 0xe53935, 0, h + .02, .56, g); box(.14, .5, .14, 0xe53935, 0, h - .17, .57, g);
      box(.5, .06, .16, 0xe53935, -.5, h + .06, 0, g); box(.16, .06, .5, 0xe53935, -.5, h + .06, 0, g);
    },
    school(g, L) {
      box(1.6, .5 + .15 * L, .9, 0xffd54f, 0, 0, 0, g); box(.4, 1, .4, 0xf9a825, .6, 0, 0, g); cone(.35, .3, 0x6d4c41, .6, 1, 0, g, 4, Math.PI / 4);
      box(.5, .5, .05, 0x8d6e63, -.3, 0, .48, g); cyl(.02, .02, .8, 0xcccccc, -.7, 0, .7, g, 5); box(.25, .15, .02, 0x1e88e5, -.58, .65, .7, g);
    },
    university(g, L) {
      const h = .8 + .2 * L; box(1.9, h, 1.2, 0xe0d6c3, 0, 0, 0, g);
      for (let i = 0; i < 5; i++) cyl(.07, .07, h, 0xfff8e1, -.76 + i * .38, 0, .66, g, 8);
      box(2, .1, .3, 0xd7ccc8, 0, h, .62, g); sph(.5, 0x5c6bc0, 0, h + .1, 0, g); cone(.55, .3, 0x3949ab, 0, h + .1, 0, g, 16);
    },
    factory(g, L) {
      box(1.8, .6 + .15 * L, 1.1, 0x78909c, 0, 0, 0, g);
      for (let i = 0; i < 3; i++) cone(.3, .25, 0x546e7a, -.6 + i * .6, .6 + .15 * L, 0, g, 3, 0);
      for (let i = 0; i < 1 + L; i++) cyl(.1, .13, 1 + L * .1, 0x8d6e63, .85 - i * .3, 0, -.4, g, 8);
    },
    power_plant(g, L, st) {
      cyl(.35, .6, 1.1 + L * .1, 0xb0bec5, -.45, 0, 0, g, 18); box(.9, .5, .9, 0x607d8b, .6, 0, 0, g);
      sph(.2, 0xeceff1, -.45, 1.2 + L * .1, 0, g, { transparent: true, opacity: .7 });
      if (st && st.renewable) { for (let i = 0; i < 3; i++) box(.45, .05, .3, 0x1a237e, .4 + i * .25 - .2, .52, .5 - i * .0, g).rotation.x = -.5;
        cyl(.03, .03, .9, 0xffffff, .85, .5, -.55, g, 5); box(.5, .04, .04, 0xffffff, .85, 1.35, -.55, g); }
    },
    research_centre(g, L) {
      box(1.4, .6 + .15 * L, 1.2, 0x4dd0e1, 0, 0, 0, g, { transparent: true, opacity: .85 }); sph(.45, 0x80deea, 0, .6 + .15 * L, 0, g, { transparent: true, opacity: .8 });
      cyl(.02, .02, .8, 0xffffff, .5, .6, .3, g, 5); sph(.06, 0xff1744, .5, 1.45, .3, g);
    },
    park(g, L) {
      box(1.8, .04, 1.8, 0x66bb6a, 0, 0, 0, g); const p = cyl(.5, .5, .03, 0x4fc3f7, .3, .04, .3, g, 20);
      [[-.6, -.6, 1], [-.6, .5, .8], [.6, -.6, .9], [-.1, -.7, 1.1]].forEach(t => tree(g, t[0], t[1], t[2] + L * .1));
      box(.3, .08, .1, 0x8d6e63, -.4, .04, .2, g);
    },
  };

  function makeBuilding(b, st) {
    const g = new THREE.Group(); g.userData = { bid: b.id };
    if (b.status === 'building') {
      const total = { residential: 3, farm: 3, hospital: 5, school: 4, university: 7, factory: 5, power_plant: 6, research_centre: 6, park: 2 }[b.type] || 4;
      const p = 1 - b.remaining / total;
      box(1.6, .2 + p * 1.0, 1.6, 0xfff59d, 0, 0, 0, g, { transparent: true, opacity: .55 });
      const w = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.8), new THREE.MeshBasicMaterial({ color: 0xff8f00, wireframe: true }));
      w.position.y = .7; g.add(w);
    } else {
      BUILD[b.type](g, b.level, st);
      if (b.condition < 40) box(.15, .15, .15, 0xe53935, .8, 1.8, .8, g);
    }
    g.position.set(wx(b.x + .5), 0, wz(b.z + .5)); g.scale.setScalar(1.05);
    g.traverse(o => { if (o.isMesh) o.userData.bid = b.id; });
    return g;
  }

  function buildTerrain(map) {
    const key = JSON.stringify(map.water) + map.size; if (key === mapKey) return; mapKey = key; S = map.size;
    ['terrain'].forEach(n => { const o = scene.getObjectByName(n); if (o) scene.remove(o); });
    const t = new THREE.Group(); t.name = 'terrain';
    const base = new THREE.Mesh(new THREE.PlaneGeometry(S * TILE, S * TILE), mat(0x8bc779)); base.rotation.x = -Math.PI / 2; base.name = 'ground'; t.add(base);
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(S * TILE * 3, S * TILE * 3), mat(0x5f8f4e)); outer.rotation.x = -Math.PI / 2; outer.position.y = -.05; t.add(outer);
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, r = S * TILE * (.62 + (i % 5) * .05);
      cone(2 + (i % 4), 3 + (i * 7 % 5), i % 3 ? 0x6d8f5c : 0x7a9a6a, Math.cos(a) * r, 0, Math.sin(a) * r, t, 7); }
    const rs = map.road_step, roads = [];
    for (let x = 0; x < S; x++) for (let z = 0; z < S; z++) if ((x % rs === 0 || z % rs === 0) && !map.water.some(w => w[0] === x && w[1] === z)) roads.push([x, z]);
    roadMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(TILE, .04, TILE), mat(0x6b6b6b), roads.length); const m = new THREE.Matrix4();
    roads.forEach((r, i) => { m.setPosition(wx(r[0] + .5), .02, wz(r[1] + .5)); roadMesh.setMatrixAt(i, m); }); t.add(roadMesh);
    waterMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(TILE, .08, TILE), new THREE.MeshLambertMaterial({ color: 0x29b6f6, transparent: true, opacity: .8 }), Math.max(1, map.water.length));
    map.water.forEach((r, i) => { m.setPosition(wx(r[0] + .5), .03, wz(r[1] + .5)); waterMesh.setMatrixAt(i, m); }); t.add(waterMesh);
    scene.add(t);
    // faint tile grid so players can see where buildings go
    const grid = new THREE.GridHelper(S * TILE, S, 0x000000, 0x000000); grid.material.opacity = .08; grid.material.transparent = true; grid.position.y = .03; grid.name = 'terrain'; scene.add(grid);
  }

  function init(container, h) {
    el = container; handlers = h; scene = new THREE.Scene(); scene.background = new THREE.Color(0xbfe3f5); scene.fog = new THREE.Fog(0xbfe3f5, 80, 200);
    camera = new THREE.PerspectiveCamera(50, 1, .1, 500); camera.position.set(34, 38, 40);
    renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); el.appendChild(renderer.domElement);
    controls = new THREE.OrbitControls(camera, renderer.domElement); controls.maxPolarAngle = Math.PI / 2.1; controls.minDistance = 8; controls.maxDistance = 120; controls.target.set(0, 0, 0); controls.enableDamping = true;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a8f5a, .75)); const sun = new THREE.DirectionalLight(0xfff2d0, .7); sun.position.set(30, 50, 20); scene.add(sun);
    ray = new THREE.Raycaster(); mouse = new THREE.Vector2();
    ghost = new THREE.Mesh(new THREE.BoxGeometry(TILE, .3, TILE), new THREE.MeshBasicMaterial({ color: 0x00e676, transparent: true, opacity: .55 })); ghost.visible = false; scene.add(ghost);
    ring = new THREE.Mesh(new THREE.RingGeometry(.5, .65, 24), new THREE.MeshBasicMaterial({ color: 0xff1744, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
    const dom = renderer.domElement; let down = null;
    dom.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    dom.addEventListener('pointerup', e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 5) click(e); down = null; });
    dom.addEventListener('pointermove', e => { if (placing) moveGhost(e); });
    new ResizeObserver(resize).observe(el); resize(); loop();
  }
  function resize() { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  function setMouse(e) { const r = renderer.domElement.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(mouse, camera); }
  function groundTile(e) { setMouse(e); const g = scene.getObjectByName('terrain')?.getObjectByName('ground'); if (!g) return null; const h = ray.intersectObject(g)[0]; if (!h) return null;
    const x = Math.floor(h.point.x / TILE + S / 2), z = Math.floor(h.point.z / TILE + S / 2); return x >= 0 && z >= 0 && x < S && z < S ? [x, z] : null; }
  function moveGhost(e) { const t = groundTile(e); hover = t; if (!t) { ghost.visible = false; return; } ghost.visible = true; ghost.position.set(wx(t[0] + .5), .15, wz(t[1] + .5)); ghost.material.color.set(valid(t[0], t[1]) ? 0x00e676 : 0xff1744); }
  function click(e) {
    if (placing) { const t = groundTile(e); if (t) handlers.onTile(t[0], t[1]); return; }
    setMouse(e);
    if (cBody) { let h = ray.intersectObject(cBody)[0] || ray.intersectObject(cHead)[0]; if (h && h.instanceId != null && cIds[h.instanceId]) { handlers.onCitizen(cIds[h.instanceId]); return; } }
    const hit = ray.intersectObjects(Object.values(bMeshes), true)[0]; if (hit && hit.object.userData.bid) handlers.onBuilding(hit.object.userData.bid);
  }
  function setPlacement(type, validFn) { placing = type; valid = validFn || (() => true); ghost.visible = false; renderer.domElement.style.cursor = type ? 'crosshair' : 'grab'; }

  function update(st) {
    buildTerrain(st.map);
    const renewable = st.research.unlocked.some(t => t.id === 'renewable_energy'), seen = {};
    st.buildings.forEach(b => { seen[b.id] = 1; const k = [b.type, b.level, b.status, b.remaining, b.condition < 40, renewable].join();
      if (bKeys[b.id] !== k) { if (bMeshes[b.id]) scene.remove(bMeshes[b.id]); bMeshes[b.id] = makeBuilding(b, { renewable }); scene.add(bMeshes[b.id]); bKeys[b.id] = k; } });
    Object.keys(bMeshes).forEach(id => { if (!seen[id]) { scene.remove(bMeshes[id]); delete bMeshes[id]; delete bKeys[id]; } });
    const n = st.citizens.length;
    if (!cBody || cBody.instanceMatrix.count < n) {
      if (cBody) { scene.remove(cBody); scene.remove(cHead); }
      const cap = Math.max(400, Math.ceil(n * 1.6));
      cBody = new THREE.InstancedMesh(new THREE.CylinderGeometry(.09, .12, .34, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }), cap);
      cHead = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 8, 8), new THREE.MeshLambertMaterial({ color: 0xffdcb0 }), cap);
      cBody.frustumCulled = cHead.frustumCulled = false; scene.add(cBody); scene.add(cHead); cCur = []; cTgt = [];
    }
    const old = {}; cIds.forEach((id, i) => old[id] = cCur[i]);
    cIds = st.citizens.map(c => c.id); cMeta = st.citizens; cTgt = st.citizens.map(c => [wx(c.x), wz(c.z)]);
    cCur = cIds.map((id, i) => old[id] || cTgt[i].slice());
    const col = new THREE.Color();
    st.citizens.forEach((c, i) => { col.set(c.sick ? 0xe53935 : (PROF[c.profession] || 0xcccccc)); cBody.setColorAt(i, col); });
    cBody.count = cHead.count = n; if (cBody.instanceColor) cBody.instanceColor.needsUpdate = true;
  }
  function loop() {
    requestAnimationFrame(loop); clock += .03; controls.update();
    if (cBody) { const m = new THREE.Matrix4(), s = new THREE.Vector3(1, 1, 1);
      for (let i = 0; i < cIds.length; i++) { const c = cCur[i], t = cTgt[i]; c[0] += (t[0] - c[0]) * .06; c[1] += (t[1] - c[1]) * .06;
        const k = cMeta[i].age < 12 ? .7 : 1, bob = cMeta[i].sick ? Math.sin(clock * 6 + i) * .04 : 0; s.set(k, k, k);
        m.compose(new THREE.Vector3(c[0], .17 * k + .02 + bob, c[1]), new THREE.Quaternion(), s); cBody.setMatrixAt(i, m);
        m.compose(new THREE.Vector3(c[0], .4 * k + .05 + bob, c[1]), new THREE.Quaternion(), s); cHead.setMatrixAt(i, m); }
      cBody.instanceMatrix.needsUpdate = cHead.instanceMatrix.needsUpdate = true; }
    if (ring.visible && ring.userData.cid) { const i = cIds.indexOf(ring.userData.cid); if (i >= 0) ring.position.set(cCur[i][0], .06, cCur[i][1]); else ring.visible = false; }
    renderer.render(scene, camera);
  }
  function highlightCitizen(id) { ring.userData = { cid: id }; ring.scale.setScalar(1); ring.visible = !!id; }
  function highlightBuilding(b) { if (!b) { ring.visible = false; return; } ring.userData = {}; ring.scale.setScalar(2.6); ring.position.set(wx(b.x + .5), .06, wz(b.z + .5)); ring.visible = true; }
  function focus(x, z) { controls.target.set(wx(x), 0, wz(z)); }
  return { init, update, setPlacement, highlightCitizen, highlightBuilding, focus, PROF };
})();
