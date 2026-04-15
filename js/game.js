'use strict';

const charData = JSON.parse(localStorage.getItem('charData') || '{}');
const D = Object.assign({
  skinColor:'skin_0', hairColor:'hc_0', eyeColor:'ec_0',
  eyeType:'eye_round', noseType:'nose_button', mouthType:'mouth_smile',
  hairType:'hair_short', clothingColor:'cl_white', mbti:'ENFP', mbtiName:'활동가'
}, charData);

function getHex(list, id, fb) { return (list.find(c=>c.id===id)||{hex:fb}).hex; }
const skinHex     = getHex(FaceParts.SKIN_COLORS,     D.skinColor,     '#FDDBB4');
const hairHex     = getHex(FaceParts.HAIR_COLORS,     D.hairColor,     '#1C1008');
const clothingHex = getHex(FaceParts.CLOTHING_COLORS, D.clothingColor, '#EEEEEE');

/* ── Renderer ─────────────────────────────────────── */
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x111111);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);

function onResize() {
  const w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
onResize(); window.addEventListener('resize', onResize);

/* ── Lighting ─────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const sun = new THREE.DirectionalLight(0xfff8f0, 1.1);
sun.position.set(4, 9, 5); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left=-14; sun.shadow.camera.right=14;
sun.shadow.camera.top=12;   sun.shadow.camera.bottom=-12;
sun.shadow.camera.near=0.1; sun.shadow.camera.far=40;
scene.add(sun);

const fill = new THREE.PointLight(0xc8e4ff, 0.7, 18);
fill.position.set(-5, 3, -3); scene.add(fill);

const lamp = new THREE.PointLight(0xffd080, 1.4, 9);
lamp.position.set(3.5, 2.5, 2); scene.add(lamp);

/* ── Room (bigger: 12w × 10d × 3.6h) ──────────────── */
const RW=12, RD=10, RH=3.6;
const WHITE     = new THREE.MeshStandardMaterial({ color:0xf4f4f4, roughness:0.88, side:THREE.DoubleSide });
const FLOOR_MAT = new THREE.MeshStandardMaterial({ color:0xe2d8c4, roughness:0.92, side:THREE.DoubleSide });
const WALL_L    = new THREE.MeshStandardMaterial({ color:0xeceae6, roughness:0.9,  side:THREE.DoubleSide });

function addPlane(w,h,rx,ry,rz,px,py,pz,mat) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat);
  m.rotation.set(rx,ry,rz); m.position.set(px,py,pz);
  m.receiveShadow=true; scene.add(m);
}
addPlane(RW,RD,  -Math.PI/2,0,0,  0,0,0,       FLOOR_MAT);
addPlane(RW,RH,   0,0,0,           0,RH/2,-RD/2,WHITE);
addPlane(RD,RH,   0,Math.PI/2,0,  -RW/2,RH/2,0,WALL_L);
addPlane(RD,RH,   0,-Math.PI/2,0,  RW/2,RH/2,0,WHITE);
addPlane(RW,RD,   Math.PI/2,0,0,   0,RH,0,     WHITE);

// Skirting
const sk = new THREE.Mesh(new THREE.BoxGeometry(RW,0.09,0.05),
  new THREE.MeshStandardMaterial({color:0xd0c8b8,roughness:0.8}));
sk.position.set(0,0.045,-RD/2+0.03); scene.add(sk);

/* ── Window ───────────────────────────────────────── */
(function makeWindow() {
  const fMat = new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.4});
  const gMat = new THREE.MeshStandardMaterial({color:0xb8dcff,roughness:0.05,transparent:true,opacity:0.38});
  const wx=-RW/2+0.04, wy=2.1, wz=0.2, ww=2.0, wh=1.8;
  const gls = new THREE.Mesh(new THREE.PlaneGeometry(ww,wh),gMat);
  gls.rotation.y=Math.PI/2; gls.position.set(wx+0.02,wy,wz); scene.add(gls);
  // Frame
  for(const [fw,fh,fz,fy] of [[ww+0.1,0.08,wz,wy+wh/2+0.04],[ww+0.1,0.08,wz,wy-wh/2-0.04]]) {
    const fm=new THREE.Mesh(new THREE.BoxGeometry(0.07,fh,fw),fMat);
    fm.position.set(wx+0.035,fy,fz); scene.add(fm);
  }
  for(const sz of [-ww/2-0.04,ww/2+0.04]) {
    const fm=new THREE.Mesh(new THREE.BoxGeometry(0.07,wh+0.18,0.07),fMat);
    fm.position.set(wx+0.035,wy,wz+sz); scene.add(fm);
  }
  // Light shaft
  const shaft=new THREE.PointLight(0xffeebb,0.6,6);
  shaft.position.set(wx+0.5,wy,wz); scene.add(shaft);
})();

/* ── Furniture helper ─────────────────────────────── */
function box3(w,h,d,color,rough=0.75) {
  const m=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0.04})
  );
  m.castShadow=true; m.receiveShadow=true; return m;
}
function place(mesh,x,y,z) { mesh.position.set(x,y,z); scene.add(mesh); return mesh; }

/* ── Desk ─────────────────────────────────────────── */
place(box3(2.2,0.07,1.0,0xc8a878), 3.5, 0.8, -2.5);
[[1.0,-0.42],[1.0,0.42],[-1.0,-0.42],[-1.0,0.42]].forEach(([dx,dz])=>{
  place(box3(0.07,0.75,0.07,0xa08060), 3.5+dx, 0.375, -2.5+dz);
});
// Laptop
place(box3(0.5,0.025,0.36,0x3a3a3a), 3.4, 0.843, -2.45);
const screen=box3(0.48,0.3,0.025,0x1a1a2e);
screen.rotation.x=-0.28; place(screen,3.4,0.99,-2.63);

/* ── Chair ────────────────────────────────────────── */
place(box3(0.72,0.06,0.65,0x6688aa), 3.5, 0.52, -1.6);
place(box3(0.72,0.72,0.07,0x6688aa), 3.5, 0.88, -1.93);
[[0.3,0.28],[0.3,-0.28],[-0.3,0.28],[-0.3,-0.28]].forEach(([dx,dz])=>{
  place(box3(0.06,0.5,0.06,0x557799), 3.5+dx, 0.25, -1.6+dz);
});

/* ── Sofa (bigger room → add sofa) ───────────────── */
place(box3(2.6,0.3,0.9,0x8a7060),   -3, 0.3, -3.5);   // seat
place(box3(2.6,0.6,0.2,0x7a6050),   -3, 0.6, -3.9);   // back
place(box3(0.2,0.6,0.9,0x7a6050),   -4.2,0.45,-3.5);  // arm L
place(box3(0.2,0.6,0.9,0x7a6050),   -1.8,0.45,-3.5);  // arm R
// Cushions
for(const cx of [-3.8,-3.0,-2.2]) {
  place(box3(0.55,0.22,0.6,0xb09888), cx, 0.46, -3.5);
}
// Coffee table
place(box3(1.2,0.05,0.7,0xd4b896),  -3, 0.62, -2.2);
[[0.5,0.3],[0.5,-0.3],[-0.5,0.3],[-0.5,-0.3]].forEach(([dx,dz])=>{
  place(box3(0.06,0.58,0.06,0xc0a070),-3+dx,0.29,-2.2+dz);
});

/* ── Bookshelf ────────────────────────────────────── */
place(box3(1.1,2.2,0.34,0xb8956a),  -5, 1.1, -4.85);
const bookColors=[0xcc4444,0x4488cc,0x44aa66,0xddaa22,0x8844cc,0xcc6633,0x44aacc,0xcc8844];
bookColors.forEach((c,i)=>{ place(box3(0.1+Math.random()*0.04,0.28+Math.random()*0.18,0.28,c), -5.38+i*0.14, 1.6+Math.random()*0.1, -4.85); });

/* ── Rug ──────────────────────────────────────────── */
const rug=new THREE.Mesh(new THREE.PlaneGeometry(3.5,2.6),
  new THREE.MeshStandardMaterial({color:0x8899bb,roughness:1}));
rug.rotation.x=-Math.PI/2; rug.position.set(0.5,0.003,0.5); rug.receiveShadow=true; scene.add(rug);

/* ── Lamp (standing) ──────────────────────────────── */
place(box3(0.08,1.6,0.08,0xc0b090),  -4.8,0.8,0.8);   // pole
place(box3(0.35,0.3,0.35,0xffe8b0),  -4.8,1.7,0.8);   // shade
const standLamp=new THREE.PointLight(0xffdd88,1.2,7);
standLamp.position.set(-4.8,1.75,0.8); scene.add(standLamp);

/* ── Potted plant ─────────────────────────────────── */
place(box3(0.24,0.22,0.24,0x7a5c38),  4.8,0.11,-3.8);  // pot
const plant=new THREE.Mesh(new THREE.SphereGeometry(0.28,8,6),
  new THREE.MeshStandardMaterial({color:0x3a8040,roughness:0.85}));
plant.position.set(4.8,0.5,-3.8); plant.castShadow=true; scene.add(plant);

/* ── Face texture (async) ─────────────────────────── */
const faceCanvas = document.createElement('canvas');
faceCanvas.width = 512; faceCanvas.height = 512;
const faceTex = new THREE.CanvasTexture(faceCanvas);

FaceParts.drawFaceTexture(faceCanvas.getContext('2d'), D).then(() => {
  faceTex.needsUpdate = true;
});

/* ── Character ────────────────────────────────────── */
const charGroup = new THREE.Group();
charGroup.position.set(0.4, 0, 0.5);
scene.add(charGroup);

const skinMat     = new THREE.MeshStandardMaterial({ color:skinHex,     roughness:0.65 });
const hairMat     = new THREE.MeshStandardMaterial({ color:hairHex,     roughness:0.8  });
const clothingMat = new THREE.MeshStandardMaterial({ color:clothingHex, roughness:0.7  });
const pantsMat    = new THREE.MeshStandardMaterial({ color:0x445566,    roughness:0.8  });
const shoesMat    = new THREE.MeshStandardMaterial({ color:0x222222,    roughness:0.6  });

// Head (front face = face texture)
const headMats = [skinMat, skinMat, hairMat, skinMat,
  new THREE.MeshStandardMaterial({ map: faceTex }), skinMat];
const head = new THREE.Mesh(new THREE.BoxGeometry(0.48,0.52,0.46), headMats);
head.position.set(0, 1.58, 0); head.castShadow=true; charGroup.add(head);

// Hair block
const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.52,0.15,0.5), hairMat);
hairTop.position.set(0, 1.88, -0.02); charGroup.add(hairTop);

// Neck
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.13,8), skinMat);
neck.position.set(0, 1.31, 0); charGroup.add(neck);

// Torso
const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.6,0.3), clothingMat);
torso.position.set(0, 0.96, 0); torso.castShadow=true; charGroup.add(torso);

// Upper arms
const uArmL = new THREE.Mesh(new THREE.BoxGeometry(0.19,0.4,0.19), clothingMat);
uArmL.position.set(-0.36, 0.99, 0); uArmL.castShadow=true; charGroup.add(uArmL);
const uArmR = uArmL.clone(); uArmR.position.x=0.36; charGroup.add(uArmR);

// Forearms
const fArmL = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.35,0.16), skinMat);
fArmL.position.set(-0.36, 0.67, 0); fArmL.castShadow=true; charGroup.add(fArmL);
const fArmR = fArmL.clone(); fArmR.position.x=0.36; charGroup.add(fArmR);

// Hips
const hips = new THREE.Mesh(new THREE.BoxGeometry(0.46,0.23,0.28), pantsMat);
hips.position.set(0, 0.59, 0); hips.castShadow=true; charGroup.add(hips);

// Legs
const uLegL = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.44,0.21), pantsMat);
uLegL.position.set(-0.13,0.28,0); uLegL.castShadow=true; charGroup.add(uLegL);
const uLegR = uLegL.clone(); uLegR.position.x=0.13; charGroup.add(uLegR);
const lLegL = new THREE.Mesh(new THREE.BoxGeometry(0.17,0.39,0.17), pantsMat);
lLegL.position.set(-0.13,-0.1,0); lLegL.castShadow=true; charGroup.add(lLegL);
const lLegR = lLegL.clone(); lLegR.position.x=0.13; charGroup.add(lLegR);
const footL = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.1,0.28), shoesMat);
footL.position.set(-0.13,-0.34,0.05); footL.castShadow=true; charGroup.add(footL);
const footR = footL.clone(); footR.position.x=0.13; charGroup.add(footR);

charGroup.traverse(c=>{ if(c.isMesh) c.receiveShadow=true; });

/* ── Personality → behavior ───────────────────────── */
const BEHAVIOR = {
  INTJ:{sway:0.4,armSwing:0.05,look:true},  INTP:{sway:0.3,armSwing:0.04,look:true},
  ENTJ:{sway:0.6,armSwing:0.10,look:true},  ENTP:{sway:0.7,armSwing:0.12,look:true},
  INFJ:{sway:0.35,armSwing:0.05,look:true}, INFP:{sway:0.45,armSwing:0.06,look:true},
  ENFJ:{sway:0.65,armSwing:0.10,look:true}, ENFP:{sway:0.75,armSwing:0.13,look:true},
  ISTJ:{sway:0.25,armSwing:0.03,look:false},ISFJ:{sway:0.3,armSwing:0.05,look:true},
  ISTP:{sway:0.2,armSwing:0.03,look:false}, ISFP:{sway:0.4,armSwing:0.06,look:true},
  ESTJ:{sway:0.5,armSwing:0.08,look:false}, ESFJ:{sway:0.6,armSwing:0.10,look:true},
  ESTP:{sway:0.7,armSwing:0.12,look:true},  ESFP:{sway:0.8,armSwing:0.14,look:true},
};
const beh = BEHAVIOR[D.mbti] || BEHAVIOR.ENFP;

/* ── Camera orbit ─────────────────────────────────── */
let azimuth=0.3, elevation=0.25;
const CAM_DIST=6.0;
const TARGET = new THREE.Vector3(0.4, 1.1, 0.3);

function updateCamera() {
  camera.position.set(
    TARGET.x + CAM_DIST * Math.sin(azimuth) * Math.cos(elevation),
    TARGET.y + CAM_DIST * Math.sin(elevation),
    TARGET.z + CAM_DIST * Math.cos(azimuth) * Math.cos(elevation)
  );
  camera.lookAt(TARGET);
}
updateCamera();

let dragging=false, lastX=0, lastY=0;
canvas.addEventListener('mousedown', e=>{ dragging=true; lastX=e.clientX; lastY=e.clientY; canvas.style.cursor='grabbing'; });
window.addEventListener('mousemove', e=>{
  if(!dragging) return;
  azimuth   -= (e.clientX-lastX)*0.007;
  elevation += (e.clientY-lastY)*0.005;
  elevation  = Math.max(-0.12, Math.min(0.68, elevation));
  lastX=e.clientX; lastY=e.clientY; updateCamera();
});
window.addEventListener('mouseup', ()=>{ dragging=false; canvas.style.cursor='grab'; });
canvas.style.cursor='grab';

// Touch
canvas.addEventListener('touchstart', e=>{ dragging=true; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; },{passive:true});
canvas.addEventListener('touchmove', e=>{
  if(!dragging) return;
  azimuth   -= (e.touches[0].clientX-lastX)*0.007;
  elevation += (e.touches[0].clientY-lastY)*0.005;
  elevation  = Math.max(-0.12, Math.min(0.68, elevation));
  lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; updateCamera();
},{passive:true});
canvas.addEventListener('touchend', ()=>dragging=false);

// Scroll to zoom
canvas.addEventListener('wheel', e=>{
  // placeholder for zoom
},{passive:true});

/* ── HUD ──────────────────────────────────────────── */
document.querySelector('.mbti-badge').textContent  = D.mbti     || '??';
document.querySelector('.mbti-name-sm').textContent= D.mbtiName || '';

/* ── Animation loop ───────────────────────────────── */
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Breathing
  const b = Math.sin(t*1.4)*0.013;
  torso.position.y    = 0.96+b;
  head.position.y     = 1.58+b*1.3;
  hairTop.position.y  = 1.88+b*1.3;
  neck.position.y     = 1.31+b*0.8;

  // Sway
  charGroup.rotation.y = Math.sin(t*0.65)*beh.sway*0.013;

  // Arm swing
  const sw = Math.sin(t*1.1)*beh.armSwing;
  uArmL.rotation.z= sw+0.08; uArmR.rotation.z=-sw-0.08;
  fArmL.rotation.z= sw*0.5+0.05; fArmR.rotation.z=-sw*0.5-0.05;

  // Look around
  if(beh.look) {
    head.rotation.y    = Math.sin(t*0.38)*0.28;
    head.rotation.x    = Math.sin(t*0.25)*0.11;
    hairTop.rotation.y = head.rotation.y;
    hairTop.rotation.x = head.rotation.x;
  }

  charGroup.rotation.x = Math.sin(t*0.21)*0.01;
  renderer.render(scene, camera);
}
animate();
