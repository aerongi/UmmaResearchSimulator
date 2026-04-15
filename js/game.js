'use strict';

const charData = JSON.parse(localStorage.getItem('charData') || '{}');
const D = Object.assign({
  skinColor:'skin_0', hairColor:'hc_0', eyeColor:'ec_0',
  faceType:'face1', eyeType:'eye1', eyebrowType:'eyebrow1',
  noseType:'nose1', mouthType:'mouth1',
  frontHairType:'hair1', backHairType:'bhair1',
  clothingColor:'cl_white', mbti:'ENFP', mbtiName:'활동가'
}, charData);

function getHex(list,id,fb){ return (list.find(c=>c.id===id)||{hex:fb}).hex; }
const clothingHex = getHex(FaceParts.CLOTHING_COLORS, D.clothingColor, '#EEEEEE');
const skinHex = '#FDDBB4';

/* ── Renderer ──────────────────────────────────────── */
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x111111);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);

function onResize(){
  const w=canvas.parentElement.clientWidth, h=canvas.parentElement.clientHeight;
  renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
}
onResize(); window.addEventListener('resize', onResize);

/* ── Lighting ──────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun=new THREE.DirectionalLight(0xfff8f0,1.1);
sun.position.set(4,9,5); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-14; sun.shadow.camera.right=14;
sun.shadow.camera.top=12;   sun.shadow.camera.bottom=-12;
sun.shadow.camera.near=0.1; sun.shadow.camera.far=40;
scene.add(sun);
const fillL=new THREE.PointLight(0xc8e4ff,0.7,18); fillL.position.set(-5,3,-3); scene.add(fillL);
const lampL=new THREE.PointLight(0xffd080,1.4,9);  lampL.position.set(3.5,2.5,2); scene.add(lampL);

/* ── Room ──────────────────────────────────────────── */
const RW=12, RD=10, RH=3.6;
const WHITE    =new THREE.MeshStandardMaterial({color:0xf4f4f4,roughness:0.88,side:THREE.DoubleSide});
const FLOOR_MAT=new THREE.MeshStandardMaterial({color:0xe2d8c4,roughness:0.92,side:THREE.DoubleSide});
const WALL_L   =new THREE.MeshStandardMaterial({color:0xeceae6,roughness:0.9, side:THREE.DoubleSide});
function addPlane(w,h,rx,ry,rz,px,py,pz,mat){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  m.rotation.set(rx,ry,rz); m.position.set(px,py,pz); m.receiveShadow=true; scene.add(m);
}
addPlane(RW,RD,-Math.PI/2,0,0, 0,0,0,       FLOOR_MAT);
addPlane(RW,RH,0,0,0,           0,RH/2,-RD/2,WHITE);
addPlane(RD,RH,0,Math.PI/2,0,  -RW/2,RH/2,0,WALL_L);
addPlane(RD,RH,0,-Math.PI/2,0,  RW/2,RH/2,0,WHITE);
addPlane(RW,RD,Math.PI/2,0,0,   0,RH,0,     WHITE);
const sk=new THREE.Mesh(new THREE.BoxGeometry(RW,0.09,0.05),
  new THREE.MeshStandardMaterial({color:0xd0c8b8,roughness:0.8}));
sk.position.set(0,0.045,-RD/2+0.03); scene.add(sk);

/* ── Window ────────────────────────────────────────── */
(function(){
  const fM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.4});
  const gM=new THREE.MeshStandardMaterial({color:0xb8dcff,roughness:0.05,transparent:true,opacity:0.38});
  const wx=-RW/2+0.04,wy=2.1,wz=0.2,ww=2.0,wh=1.8;
  const gls=new THREE.Mesh(new THREE.PlaneGeometry(ww,wh),gM);
  gls.rotation.y=Math.PI/2; gls.position.set(wx+0.02,wy,wz); scene.add(gls);
  [[ww+0.1,wz,wy+wh/2+0.04],[ww+0.1,wz,wy-wh/2-0.04]].forEach(([fw,fz,fy])=>{
    const f=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.08,fw),fM); f.position.set(wx+0.035,fy,fz); scene.add(f);
  });
  for(const sz of[-ww/2-0.04,ww/2+0.04]){
    const f=new THREE.Mesh(new THREE.BoxGeometry(0.07,wh+0.18,0.07),fM); f.position.set(wx+0.035,wy,wz+sz); scene.add(f);
  }
  const sl=new THREE.PointLight(0xffeebb,0.6,6); sl.position.set(wx+0.5,wy,wz); scene.add(sl);
})();

/* ── Furniture ─────────────────────────────────────── */
function box3(w,h,d,color,rough=0.75){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0.04}));
  m.castShadow=true; m.receiveShadow=true; return m;
}
function place(mesh,x,y,z){ mesh.position.set(x,y,z); scene.add(mesh); return mesh; }
place(box3(2.2,0.07,1.0,0xc8a878),3.5,0.8,-2.5);
[[1.0,-0.42],[1.0,0.42],[-1.0,-0.42],[-1.0,0.42]].forEach(([dx,dz])=>place(box3(0.07,0.75,0.07,0xa08060),3.5+dx,0.375,-2.5+dz));
place(box3(0.5,0.025,0.36,0x3a3a3a),3.4,0.843,-2.45);
const scr=box3(0.48,0.3,0.025,0x1a1a2e); scr.rotation.x=-0.28; place(scr,3.4,0.99,-2.63);
place(box3(0.72,0.06,0.65,0x6688aa),3.5,0.52,-1.6);
place(box3(0.72,0.72,0.07,0x6688aa),3.5,0.88,-1.93);
[[0.3,0.28],[0.3,-0.28],[-0.3,0.28],[-0.3,-0.28]].forEach(([dx,dz])=>place(box3(0.06,0.5,0.06,0x557799),3.5+dx,0.25,-1.6+dz));
place(box3(2.6,0.3,0.9,0x8a7060),-3,0.3,-3.5);
place(box3(2.6,0.6,0.2,0x7a6050),-3,0.6,-3.9);
place(box3(0.2,0.6,0.9,0x7a6050),-4.2,0.45,-3.5);
place(box3(0.2,0.6,0.9,0x7a6050),-1.8,0.45,-3.5);
[-3.8,-3.0,-2.2].forEach(cx=>place(box3(0.55,0.22,0.6,0xb09888),cx,0.46,-3.5));
place(box3(1.2,0.05,0.7,0xd4b896),-3,0.62,-2.2);
[[0.5,0.3],[0.5,-0.3],[-0.5,0.3],[-0.5,-0.3]].forEach(([dx,dz])=>place(box3(0.06,0.58,0.06,0xc0a070),-3+dx,0.29,-2.2+dz));
place(box3(1.1,2.2,0.34,0xb8956a),-5,1.1,-4.85);
[0xcc4444,0x4488cc,0x44aa66,0xddaa22,0x8844cc,0xcc6633,0x44aacc,0xcc8844].forEach((c,i)=>
  place(box3(0.1+Math.random()*0.04,0.28+Math.random()*0.18,0.28,c),-5.38+i*0.14,1.6+Math.random()*0.1,-4.85));
const rug=new THREE.Mesh(new THREE.PlaneGeometry(3.5,2.6),
  new THREE.MeshStandardMaterial({color:0x8899bb,roughness:1}));
rug.rotation.x=-Math.PI/2; rug.position.set(0.5,0.003,0.5); rug.receiveShadow=true; scene.add(rug);
place(box3(0.08,1.6,0.08,0xc0b090),-4.8,0.8,0.8);
place(box3(0.35,0.3,0.35,0xffe8b0),-4.8,1.7,0.8);
const sl2=new THREE.PointLight(0xffdd88,1.2,7); sl2.position.set(-4.8,1.75,0.8); scene.add(sl2);
place(box3(0.24,0.22,0.24,0x7a5c38),4.8,0.11,-3.8);
const plant=new THREE.Mesh(new THREE.SphereGeometry(0.28,8,6),
  new THREE.MeshStandardMaterial({color:0x3a8040,roughness:0.85}));
plant.position.set(4.8,0.5,-3.8); plant.castShadow=true; scene.add(plant);

/* ══════════════════════════════════════════
   캐릭터
══════════════════════════════════════════ */
const charGroup = new THREE.Group();
charGroup.position.set(0.4, 0, 0.5);
scene.add(charGroup);

/* ── 얼굴 텍스처 ─────────────────────────────────── */
const faceCanvas = document.createElement('canvas');
faceCanvas.width = 512; faceCanvas.height = 512;
const faceTex = new THREE.CanvasTexture(faceCanvas);
faceTex.premultiplyAlpha = false;

/* ── 뒷머리 텍스처 ───────────────────────────────── */
const backHairCanvas = document.createElement('canvas');
backHairCanvas.width = 512; backHairCanvas.height = 512;
const backHairTex = new THREE.CanvasTexture(backHairCanvas);
backHairTex.premultiplyAlpha = false;

/* ── 현재 눈/입 상태 ─────────────────────────────── */
let activeEyeType   = D.eyeType;
let activeMouthType = D.mouthType;

async function redrawFace() {
  await FaceParts.drawFaceWithOverrides(
    faceCanvas.getContext('2d'), D,
    { eyeType: activeEyeType, mouthType: activeMouthType }
  );
  faceTex.needsUpdate = true;
}

// 초기 드로우
FaceParts.drawFace(faceCanvas.getContext('2d'), D).then(()=> faceTex.needsUpdate=true);
FaceParts.drawBackHairTexture(backHairCanvas.getContext('2d'), D).then(()=> backHairTex.needsUpdate=true);

/* ── 앞면 Head Plane (몸 방향, FrontSide) ────────── */
const headMat = new THREE.MeshBasicMaterial({
  map: faceTex, transparent:true, alphaTest:0.01,
  side: THREE.FrontSide, depthWrite:false,
});
const headPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.84), headMat);
headPlane.position.set(0, 1.60, 0.04);
charGroup.add(headPlane);

/* ── 뒷면 Back Hair Plane (뒤쪽, FrontSide) ─────── */
const backHairMat = new THREE.MeshBasicMaterial({
  map: backHairTex, transparent:true, alphaTest:0.01,
  side: THREE.FrontSide, depthWrite:false,
});
const backHairPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.90, 0.90), backHairMat);
backHairPlane.position.set(0, 1.60, -0.04);
backHairPlane.rotation.y = Math.PI; // 뒤를 향함
charGroup.add(backHairPlane);

/* ── 몸 ─────────────────────────────────────────── */
const clothingMat=new THREE.MeshStandardMaterial({color:clothingHex,roughness:0.7});
const pantsMat   =new THREE.MeshStandardMaterial({color:0x445566,roughness:0.8});
const shoesMat   =new THREE.MeshStandardMaterial({color:0x222222,roughness:0.6});
const skinMat    =new THREE.MeshStandardMaterial({color:skinHex,roughness:0.65});
function addPart(geo,mat,x,y,z){
  const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z);
  m.castShadow=true; m.receiveShadow=true; charGroup.add(m); return m;
}
const torso =addPart(new THREE.BoxGeometry(0.5,0.6,0.3),clothingMat,         0,0.94,0);
const uArmL =addPart(new THREE.BoxGeometry(0.19,0.4,0.19),clothingMat, -0.36,0.98,0);
const uArmR =addPart(new THREE.BoxGeometry(0.19,0.4,0.19),clothingMat,  0.36,0.98,0);
const fArmL =addPart(new THREE.BoxGeometry(0.16,0.34,0.16),skinMat,   -0.36,0.67,0);
const fArmR =addPart(new THREE.BoxGeometry(0.16,0.34,0.16),skinMat,    0.36,0.67,0);
const hips  =addPart(new THREE.BoxGeometry(0.46,0.23,0.28),pantsMat,    0,0.59,0);
const uLegL =addPart(new THREE.BoxGeometry(0.2,0.44,0.21),pantsMat,  -0.13,0.28,0);
const uLegR =addPart(new THREE.BoxGeometry(0.2,0.44,0.21),pantsMat,   0.13,0.28,0);
const lLegL =addPart(new THREE.BoxGeometry(0.17,0.39,0.17),pantsMat, -0.13,-0.10,0);
const lLegR =addPart(new THREE.BoxGeometry(0.17,0.39,0.17),pantsMat,  0.13,-0.10,0);
const footL =addPart(new THREE.BoxGeometry(0.18,0.1,0.28),shoesMat,  -0.13,-0.34,0.05);
const footR =addPart(new THREE.BoxGeometry(0.18,0.1,0.28),shoesMat,   0.13,-0.34,0.05);

/* ══════════════════════════════════════════
   말풍선 (Sprite → 항상 카메라를 향함)
══════════════════════════════════════════ */
const bubbleCanvas = document.createElement('canvas');
bubbleCanvas.width = 512; bubbleCanvas.height = 256;
const bubbleTex = new THREE.CanvasTexture(bubbleCanvas);
const bubbleMat = new THREE.SpriteMaterial({ map:bubbleTex, transparent:true, depthWrite:false });
const bubbleSprite = new THREE.Sprite(bubbleMat);
bubbleSprite.scale.set(1.7, 0.85, 1);
bubbleSprite.position.set(0.08, 2.55, 0);
bubbleSprite.visible = false;
charGroup.add(bubbleSprite);

function drawBubble(text) {
  const ctx = bubbleCanvas.getContext('2d');
  const W=512, H=256;
  ctx.clearRect(0,0,W,H);

  const pad=28, r=38;
  const bx=pad, by=14, bw=W-pad*2, bh=H-75;

  // 둥근 사각형 말풍선
  ctx.fillStyle='rgba(255,255,255,0.97)';
  ctx.strokeStyle='#3a3a3a';
  ctx.lineWidth=6;
  ctx.beginPath();
  ctx.roundRect(bx,by,bw,bh,r);
  ctx.fill(); ctx.stroke();

  // 꼬리 (아래 방향)
  const tx=W*0.42, ty=by+bh;
  ctx.fillStyle='rgba(255,255,255,0.97)';
  ctx.beginPath();
  ctx.moveTo(tx,ty-4); ctx.lineTo(tx-18,H-22); ctx.lineTo(tx+26,ty-4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#3a3a3a'; ctx.lineWidth=5;
  ctx.beginPath();
  ctx.moveTo(tx,ty-2); ctx.lineTo(tx-16,H-22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tx+24,ty-2); ctx.lineTo(tx-16,H-22);
  ctx.stroke();
  // 꼬리 이음새 덮기
  ctx.fillStyle='rgba(255,255,255,0.97)';
  ctx.fillRect(tx-2,ty-12,32,14);

  // 텍스트
  ctx.fillStyle='#222';
  ctx.font='bold 58px sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text, W/2, by+bh/2+2);

  bubbleTex.needsUpdate = true;
}

/* ══════════════════════════════════════════
   눈 깜빡임 (3~8초 랜덤)
══════════════════════════════════════════ */
let eyeAnimLock = false;

function scheduleBlink() {
  const delay = (3 + Math.random()*5)*1000;
  setTimeout(async ()=>{
    if (eyeAnimLock) { scheduleBlink(); return; }
    eyeAnimLock = true;
    activeEyeType = 'eye_blink';
    await redrawFace();
    setTimeout(async ()=>{
      activeEyeType = D.eyeType;
      await redrawFace();
      eyeAnimLock = false;
      scheduleBlink();
    }, 130);
  }, delay);
}
scheduleBlink();

/* ══════════════════════════════════════════
   웃음 버튼
══════════════════════════════════════════ */
document.getElementById('smile-btn').addEventListener('click', async ()=>{
  if (eyeAnimLock) return;
  eyeAnimLock = true;
  activeEyeType = 'eye_smile';
  await redrawFace();
  setTimeout(async ()=>{
    activeEyeType = D.eyeType;
    await redrawFace();
    eyeAnimLock = false;
  }, 3000);
});

/* ══════════════════════════════════════════
   말하기 버튼
   1글자당 1번 뻐끔 (입 벌림 150ms + 닫힘 150ms)
══════════════════════════════════════════ */
const SPEAK_TEXT = '안녕하세요';
let isSpeaking = false;
const sleep = ms => new Promise(r=>setTimeout(r,ms));

document.getElementById('speak-btn').addEventListener('click', async ()=>{
  if (isSpeaking) return;
  isSpeaking = true;

  drawBubble(SPEAK_TEXT);
  bubbleSprite.visible = true;

  // 글자 수만큼 뻐끔뻐끔
  for (let i=0; i<SPEAK_TEXT.length; i++) {
    activeMouthType = 'mouth_open';
    await redrawFace();
    await sleep(160);
    activeMouthType = D.mouthType;
    await redrawFace();
    await sleep(140);
  }

  await sleep(600); // 말풍선 잠깐 유지
  bubbleSprite.visible = false;
  isSpeaking = false;
});

/* ── Camera orbit ──────────────────────────────────── */
let azimuth=0.3, elevation=0.25;
const CAM_DIST=6.0;
const TARGET=new THREE.Vector3(0.4,1.1,0.3);

function updateCamera(){
  camera.position.set(
    TARGET.x+CAM_DIST*Math.sin(azimuth)*Math.cos(elevation),
    TARGET.y+CAM_DIST*Math.sin(elevation),
    TARGET.z+CAM_DIST*Math.cos(azimuth)*Math.cos(elevation)
  );
  camera.lookAt(TARGET);
}
updateCamera();

let dragging=false, lastX=0, lastY=0;
canvas.addEventListener('mousedown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.style.cursor='grabbing';});
window.addEventListener('mousemove',e=>{
  if(!dragging) return;
  azimuth-=(e.clientX-lastX)*0.007; elevation+=(e.clientY-lastY)*0.005;
  elevation=Math.max(-0.08,Math.min(0.38,elevation));
  lastX=e.clientX; lastY=e.clientY; updateCamera();
});
window.addEventListener('mouseup',()=>{dragging=false;canvas.style.cursor='grab';});
canvas.style.cursor='grab';
canvas.addEventListener('touchstart',e=>{dragging=true;lastX=e.touches[0].clientX;lastY=e.touches[0].clientY;},{passive:true});
canvas.addEventListener('touchmove',e=>{
  if(!dragging) return;
  azimuth-=(e.touches[0].clientX-lastX)*0.007; elevation+=(e.touches[0].clientY-lastY)*0.005;
  elevation=Math.max(-0.08,Math.min(0.38,elevation));
  lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; updateCamera();
},{passive:true});
canvas.addEventListener('touchend',()=>dragging=false);

/* ── HUD ────────────────────────────────────────────── */
document.querySelector('.mbti-badge').textContent  =D.mbti    ||'??';
document.querySelector('.mbti-name-sm').textContent=D.mbtiName||'';

/* ── 성격별 행동 ─────────────────────────────────────── */
const BEH={
  INTJ:{sway:0.4,arm:0.05},INTP:{sway:0.3,arm:0.04},ENTJ:{sway:0.6,arm:0.10},ENTP:{sway:0.7,arm:0.12},
  INFJ:{sway:0.35,arm:0.05},INFP:{sway:0.45,arm:0.06},ENFJ:{sway:0.65,arm:0.10},ENFP:{sway:0.75,arm:0.13},
  ISTJ:{sway:0.25,arm:0.03},ISFJ:{sway:0.3,arm:0.05},ISTP:{sway:0.2,arm:0.03},ISFP:{sway:0.4,arm:0.06},
  ESTJ:{sway:0.5,arm:0.08},ESFJ:{sway:0.6,arm:0.10},ESTP:{sway:0.7,arm:0.12},ESFP:{sway:0.8,arm:0.14},
};
const beh=BEH[D.mbti]||BEH.ENFP;

/* ── Animation ──────────────────────────────────────── */
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();
  const b=Math.sin(t*1.4)*0.013;
  torso.position.y=0.94+b;
  headPlane.position.y=1.60+b*1.3;
  backHairPlane.position.y=1.60+b*1.3;
  charGroup.rotation.y=Math.sin(t*0.65)*beh.sway*0.013;
  const sw=Math.sin(t*1.1)*beh.arm;
  uArmL.rotation.z=sw+0.08; uArmR.rotation.z=-sw-0.08;
  fArmL.rotation.z=sw*0.5+0.05; fArmR.rotation.z=-sw*0.5-0.05;
  charGroup.rotation.x=Math.sin(t*0.21)*0.01;
  renderer.render(scene,camera);
}
animate();
