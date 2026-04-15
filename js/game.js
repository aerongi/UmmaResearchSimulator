'use strict';

/* ══════════════════════════════════════════
   Load character data from localStorage
══════════════════════════════════════════ */
const charData = JSON.parse(localStorage.getItem('charData') || '{}');
const DEFAULT = {
  skinColor: 'skin_0', hairColor: 'hc_0', eyeColor: 'ec_0',
  eyeType: 'eye_round', noseType: 'nose_button', mouthType: 'mouth_smile',
  hairType: 'hair_short', mbti: 'ENFP', mbtiName: '활동가'
};
const D = Object.assign({}, DEFAULT, charData);

/* ══════════════════════════════════════════
   Helper – hex from palette
══════════════════════════════════════════ */
function getHex(list, id, fallback) {
  return (list.find(c => c.id === id) || { hex: fallback }).hex;
}
const skinHex = getHex(FaceParts.SKIN_COLORS, D.skinColor, '#FDDBB4');
const hairHex = getHex(FaceParts.HAIR_COLORS, D.hairColor, '#1C1008');

/* ══════════════════════════════════════════
   Three.js Setup
══════════════════════════════════════════ */
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x111111);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);

function onResize() {
  const w = canvas.parentElement.clientWidth;
  const h = canvas.parentElement.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
onResize();
window.addEventListener('resize', onResize);

/* ══════════════════════════════════════════
   Lighting
══════════════════════════════════════════ */
scene.add(new THREE.AmbientLight(0xffffff, 0.55));

const sun = new THREE.DirectionalLight(0xfff8f0, 1.2);
sun.position.set(3, 6, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 0.1; sun.shadow.camera.far = 30;
[-8,8].forEach(v => {
  sun.shadow.camera.left   = v < 0 ? v : sun.shadow.camera.left;
  sun.shadow.camera.right  = v > 0 ? v : sun.shadow.camera.right;
  sun.shadow.camera.top    = v > 0 ? v : sun.shadow.camera.top;
  sun.shadow.camera.bottom = v < 0 ? v : sun.shadow.camera.bottom;
});
sun.shadow.camera.left=-8; sun.shadow.camera.right=8;
sun.shadow.camera.top=8;   sun.shadow.camera.bottom=-8;
scene.add(sun);

// Window-style fill light
const fill = new THREE.PointLight(0xc8e0ff, 0.6, 12);
fill.position.set(-3, 2.2, -2.5);
scene.add(fill);

// Warm lamp
const lamp = new THREE.PointLight(0xffd080, 1.2, 6);
lamp.position.set(2.2, 1.8, 1.5);
lamp.castShadow = false;
scene.add(lamp);

/* ══════════════════════════════════════════
   Room (white walls, floor, ceiling)
══════════════════════════════════════════ */
const WHITE = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.85, metalness: 0 });
const FLOOR_MAT = new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.9, metalness: 0 });
const WALL_ACCENT = new THREE.MeshStandardMaterial({ color: 0xeeeae6, roughness: 0.9 });

// Room dimensions: 7 wide × 6 deep × 3 tall
const RW = 7, RD = 6, RH = 3;

function addPlane(w, h, rx, ry, rz, px, py, pz, mat) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.rotation.set(rx, ry, rz);
  m.position.set(px, py, pz);
  m.receiveShadow = true;
  scene.add(m);
}

addPlane(RW, RD,  -Math.PI/2, 0, 0,  0, 0,     0,      FLOOR_MAT);   // floor
addPlane(RW, RD,   Math.PI/2, 0, 0,  0, RH,    0,      WHITE);        // ceiling
addPlane(RW, RH,   0,         0, 0,  0, RH/2, -RD/2,   WHITE);        // back wall
addPlane(RD, RH,   0,  Math.PI/2, 0, -RW/2, RH/2, 0,   WALL_ACCENT);  // left wall
addPlane(RD, RH,   0, -Math.PI/2, 0,  RW/2, RH/2, 0,   WHITE);        // right wall
// Front wall has an opening (not drawn — we look through it)

// Skirting board (decorative strip at base of back wall)
const skirt = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.08, 0.05),
  new THREE.MeshStandardMaterial({ color: 0xd8d0c0, roughness: 0.8 }));
skirt.position.set(0, 0.04, -RD/2 + 0.026);
scene.add(skirt);

/* ── Window (left wall) ── */
function makeWindow() {
  const frame = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xc8e8ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35 });

  const ww = 1.4, wh = 1.6;
  const wx = -RW/2 + 0.03, wy = 1.6, wz = -0.5;

  // Glass pane
  const g = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), glass);
  g.rotation.y = Math.PI/2; g.position.set(wx+0.02, wy, wz);
  scene.add(g);

  // Frame parts (4 strips)
  const fMat = frame;
  [[ww+0.08, 0.07, wz, wy + wh/2 + 0.035],  // top
   [ww+0.08, 0.07, wz, wy - wh/2 - 0.035],  // bottom
   [0.07,    wh,   wz, wy]                    // sides handled below
  ].forEach(([fw, fh, fz, fy]) => {
    const fm = new THREE.Mesh(new THREE.BoxGeometry(0.06, fh < 0.1 ? 0.07 : fh, fw < 0.1 ? fw : 0.06), fMat);
    fm.position.set(wx + 0.03, fy, fz);
    scene.add(fm);
  });
  // Left & right frame strips
  for (const sz of [-ww/2-0.035, ww/2+0.035]) {
    const fm = new THREE.Mesh(new THREE.BoxGeometry(0.06, wh+0.14, 0.06), fMat);
    fm.position.set(wx+0.03, wy, wz+sz);
    scene.add(fm);
  }
}
makeWindow();

/* ══════════════════════════════════════════
   Furniture
══════════════════════════════════════════ */
function box(w, h, d, color, rx=0, ry=0, rz=0) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05 })
  );
  m.rotation.set(rx, ry, rz);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ── Desk ──
const deskTop = box(1.8, 0.06, 0.8, 0xc8a878);
deskTop.position.set(2.4, 0.77, -1.8);
scene.add(deskTop);
// Legs
[[0.8,-0.35],[0.8,0.35],[-0.8,-0.35],[-0.8,0.35]].forEach(([dx,dz]) => {
  const leg = box(0.06, 0.72, 0.06, 0xa08060);
  leg.position.set(2.4+dx, 0.36, -1.8+dz);
  scene.add(leg);
});
// Laptop on desk
const laptop = box(0.42, 0.02, 0.3, 0x444444);
laptop.position.set(2.3, 0.81, -1.75);
scene.add(laptop);
const screen = box(0.4, 0.27, 0.02, 0x1a1a2e);
screen.position.set(2.3, 0.955, -1.9);
screen.rotation.x = -0.28;
scene.add(screen);

// ── Chair ──
const chairSeat = box(0.6, 0.05, 0.58, 0x6688aa);
chairSeat.position.set(2.4, 0.48, -1.1);
scene.add(chairSeat);
const chairBack = box(0.6, 0.65, 0.06, 0x6688aa);
chairBack.position.set(2.4, 0.81, -1.38);
scene.add(chairBack);
[[0.25,0.24],[0.25,-0.24],[-0.25,0.24],[-0.25,-0.24]].forEach(([dx,dz]) => {
  const cl = box(0.05, 0.46, 0.05, 0x556677);
  cl.position.set(2.4+dx, 0.23, -1.1+dz);
  scene.add(cl);
});

// ── Bookshelf (back wall) ──
const shelf = box(0.9, 1.8, 0.3, 0xb8956a);
shelf.position.set(-2.5, 0.9, -RD/2+0.18);
scene.add(shelf);
// Books
const bookColors = [0xcc4444, 0x4488cc, 0x44aa66, 0xddaa22, 0x8844cc, 0xcc6633];
bookColors.forEach((c, i) => {
  const bk = box(0.09+Math.random()*0.04, 0.25+Math.random()*0.15, 0.24, c);
  bk.position.set(-2.5 - 0.32 + i*0.12, 1.5 + (Math.random()-0.5)*0.1, -RD/2+0.17);
  scene.add(bk);
});

// ── Small rug ──
const rug = new THREE.Mesh(
  new THREE.PlaneGeometry(2.5, 1.8),
  new THREE.MeshStandardMaterial({ color: 0x8899bb, roughness: 1 })
);
rug.rotation.x = -Math.PI/2;
rug.position.set(0.5, 0.002, 0.5);
rug.receiveShadow = true;
scene.add(rug);

/* ══════════════════════════════════════════
   Face Texture
══════════════════════════════════════════ */
function makeFaceTexture() {
  const fc = document.createElement('canvas');
  fc.width = 256; fc.height = 256;
  const ctx = fc.getContext('2d');

  // Skin base
  ctx.fillStyle = skinHex;
  ctx.fillRect(0, 0, 256, 256);

  // Face features
  FaceParts.drawFaceTexture(ctx, D);

  const tex = new THREE.CanvasTexture(fc);
  tex.needsUpdate = true;
  return tex;
}

/* ══════════════════════════════════════════
   Character
══════════════════════════════════════════ */
const charGroup = new THREE.Group();
scene.add(charGroup);
charGroup.position.set(0.4, 0, 0.6); // standing on rug

const skinMat  = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.65 });
const hairMat  = new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.8 });
const bodyMat  = new THREE.MeshStandardMaterial({ color: 0xddddee, roughness: 0.7 });
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.8 });
const shoesMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
const faceTex  = makeFaceTexture();

// Head: box with face texture on front (+z)
const headMats = [skinMat, skinMat, hairMat, skinMat,
  new THREE.MeshStandardMaterial({ map: faceTex }), skinMat];
const head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.44), headMats);
head.position.set(0, 1.56, 0);
head.castShadow = true;
charGroup.add(head);

// Hair block on top
const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.48), hairMat);
hairTop.position.set(0, 1.85, -0.02);
hairTop.castShadow = true;
charGroup.add(hairTop);

// Neck
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 8), skinMat);
neck.position.set(0, 1.29, 0);
charGroup.add(neck);

// Torso
const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.58, 0.28), bodyMat);
torso.position.set(0, 0.94, 0);
torso.castShadow = true;
charGroup.add(torso);

// Upper arms
const uArmL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.18), bodyMat);
uArmL.position.set(-0.34, 1.0, 0);
uArmL.castShadow = true; charGroup.add(uArmL);
const uArmR = uArmL.clone(); uArmR.position.x = 0.34; charGroup.add(uArmR);

// Forearms
const fArmL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.34, 0.15), skinMat);
fArmL.position.set(-0.34, 0.67, 0);
fArmL.castShadow = true; charGroup.add(fArmL);
const fArmR = fArmL.clone(); fArmR.position.x = 0.34; charGroup.add(fArmR);

// Hips
const hips = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.26), pantsMat);
hips.position.set(0, 0.57, 0);
hips.castShadow = true; charGroup.add(hips);

// Upper legs
const uLegL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.42, 0.2), pantsMat);
uLegL.position.set(-0.13, 0.27, 0);
uLegL.castShadow = true; charGroup.add(uLegL);
const uLegR = uLegL.clone(); uLegR.position.x = 0.13; charGroup.add(uLegR);

// Lower legs
const lLegL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.38, 0.17), pantsMat);
lLegL.position.set(-0.13, -0.1, 0);
lLegL.castShadow = true; charGroup.add(lLegL);
const lLegR = lLegL.clone(); lLegR.position.x = 0.13; charGroup.add(lLegR);

// Feet
const footL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.26), shoesMat);
footL.position.set(-0.13, -0.33, 0.04);
footL.castShadow = true; charGroup.add(footL);
const footR = footL.clone(); footR.position.x = 0.13; charGroup.add(footR);

// Shadow
charGroup.traverse(c => { if(c.isMesh) c.receiveShadow = true; });

/* ══════════════════════════════════════════
   Personality-based character behavior
   (16 MBTI types → idle behavior sets)
   TODO: expand each type with more behaviors
══════════════════════════════════════════ */
const MBTI_BEHAVIOR = {
  // Introvert types: character stays near desk / looks around slowly
  INTJ: { lookAround: true,  sway: 0.4, armSwing: 0.05 },
  INTP: { lookAround: true,  sway: 0.3, armSwing: 0.04 },
  INFJ: { lookAround: true,  sway: 0.35,armSwing: 0.05 },
  INFP: { lookAround: true,  sway: 0.45,armSwing: 0.06 },
  ISTJ: { lookAround: false, sway: 0.25,armSwing: 0.03 },
  ISFJ: { lookAround: true,  sway: 0.3, armSwing: 0.05 },
  ISTP: { lookAround: false, sway: 0.2, armSwing: 0.03 },
  ISFP: { lookAround: true,  sway: 0.4, armSwing: 0.06 },
  // Extrovert types: more lively
  ENTJ: { lookAround: true,  sway: 0.6, armSwing: 0.1  },
  ENTP: { lookAround: true,  sway: 0.7, armSwing: 0.12 },
  ENFJ: { lookAround: true,  sway: 0.65,armSwing: 0.1  },
  ENFP: { lookAround: true,  sway: 0.75,armSwing: 0.13 },
  ESTJ: { lookAround: false, sway: 0.5, armSwing: 0.08 },
  ESFJ: { lookAround: true,  sway: 0.6, armSwing: 0.1  },
  ESTP: { lookAround: true,  sway: 0.7, armSwing: 0.12 },
  ESFP: { lookAround: true,  sway: 0.8, armSwing: 0.14 },
};
const behavior = MBTI_BEHAVIOR[D.mbti] || MBTI_BEHAVIOR['ENFP'];

/* ══════════════════════════════════════════
   Camera Orbit
══════════════════════════════════════════ */
let azimuth  = 0.35;   // horizontal angle (radians)
let elevation = 0.28;  // vertical angle
const CAM_DIST = 4.2;
const CAM_TARGET = new THREE.Vector3(0.4, 1.1, 0.3);

function updateCamera() {
  camera.position.x = CAM_TARGET.x + CAM_DIST * Math.sin(azimuth) * Math.cos(elevation);
  camera.position.y = CAM_TARGET.y + CAM_DIST * Math.sin(elevation);
  camera.position.z = CAM_TARGET.z + CAM_DIST * Math.cos(azimuth) * Math.cos(elevation);
  camera.lookAt(CAM_TARGET);
}
updateCamera();

// Mouse / Touch drag
let dragging = false, lastX = 0, lastY = 0;

canvas.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mousemove', e => {
  if (!dragging) return;
  azimuth   -= (e.clientX - lastX) * 0.008;
  elevation += (e.clientY - lastY) * 0.006;
  elevation  = Math.max(-0.15, Math.min(0.72, elevation));
  lastX = e.clientX; lastY = e.clientY;
  updateCamera();
});
window.addEventListener('mouseup', () => dragging = false);

canvas.addEventListener('touchstart', e => { dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, { passive: true });
canvas.addEventListener('touchmove', e => {
  if (!dragging) return;
  azimuth   -= (e.touches[0].clientX - lastX) * 0.008;
  elevation += (e.touches[0].clientY - lastY) * 0.006;
  elevation  = Math.max(-0.15, Math.min(0.72, elevation));
  lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
  updateCamera();
}, { passive: true });
canvas.addEventListener('touchend', () => dragging = false);

// Scroll to zoom
canvas.addEventListener('wheel', e => {
  // (optional zoom — not implemented in v1)
}, { passive: true });

/* ══════════════════════════════════════════
   HUD
══════════════════════════════════════════ */
document.querySelector('.mbti-badge').textContent   = D.mbti   || '??';
document.querySelector('.mbti-name-sm').textContent = D.mbtiName || '';

/* ══════════════════════════════════════════
   Animation Loop
══════════════════════════════════════════ */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  /* ── Idle animations ── */
  // Breathing: gentle body bob + slight scale
  const breathe = Math.sin(t * 1.4) * 0.012;
  torso.position.y   = 0.94 + breathe;
  head.position.y    = 1.56 + breathe * 1.3;
  hairTop.position.y = 1.85 + breathe * 1.3;
  neck.position.y    = 1.29 + breathe * 0.8;

  // Sway (personality-driven)
  const sway = Math.sin(t * 0.7) * behavior.sway * 0.012;
  charGroup.rotation.y = sway;

  // Arm gentle swing
  const swing = Math.sin(t * 1.2) * behavior.armSwing;
  uArmL.rotation.z =  swing + 0.08;
  uArmR.rotation.z = -swing - 0.08;
  fArmL.rotation.z =  swing * 0.5 + 0.05;
  fArmR.rotation.z = -swing * 0.5 - 0.05;

  // Look around (introvert vs extrovert)
  if (behavior.lookAround) {
    const lookY = Math.sin(t * 0.4) * 0.3;
    const lookX = Math.sin(t * 0.27) * 0.12;
    head.rotation.y = lookY;
    head.rotation.x = lookX;
    hairTop.rotation.y = lookY;
    hairTop.rotation.x = lookX;
  }

  // Occasional subtle tilt
  charGroup.rotation.x = Math.sin(t * 0.23) * 0.01;

  renderer.render(scene, camera);
}

animate();
