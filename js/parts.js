'use strict';

const FaceParts = (() => {

  const SKIN_COLORS = [
    { id:'skin_0', label:'밝은',   hex:'#FDDBB4' },
    { id:'skin_1', label:'보통',   hex:'#F0A875' },
    { id:'skin_2', label:'구릿빛', hex:'#C68642' },
    { id:'skin_3', label:'어두운', hex:'#8D5524' },
  ];
  const HAIR_COLORS = [
    { id:'hc_0', hex:'#1C1008' }, { id:'hc_1', hex:'#5C3317' },
    { id:'hc_2', hex:'#C48B30' }, { id:'hc_3', hex:'#8B1A00' },
    { id:'hc_4', hex:'#888888' }, { id:'hc_5', hex:'#E8E0D0' },
  ];
  const EYE_COLORS = [
    { id:'ec_0', hex:'#1A1008' }, { id:'ec_1', hex:'#6B3A1A' },
    { id:'ec_2', hex:'#1A4A8A' }, { id:'ec_3', hex:'#1A6040' },
  ];
  const CLOTHING_COLORS = [
    { id:'cl_white',    hex:'#EEEEEE', label:'화이트'  },
    { id:'cl_blue',     hex:'#5B9BD5', label:'블루'    },
    { id:'cl_navy',     hex:'#2C3E6B', label:'네이비'  },
    { id:'cl_coral',    hex:'#E8735A', label:'코랄'    },
    { id:'cl_mint',     hex:'#7EC8A4', label:'민트'    },
    { id:'cl_lavender', hex:'#9B89C4', label:'라벤더'  },
    { id:'cl_yellow',   hex:'#F5C842', label:'옐로우'  },
    { id:'cl_gray',     hex:'#78909C', label:'그레이'  },
    { id:'cl_pink',     hex:'#F48FB1', label:'핑크'    },
    { id:'cl_black',    hex:'#2C2C2C', label:'블랙'    },
  ];

  // 파츠 목록 (숫자 ID)
  const FACE_TYPES      = [1,2,3,4,5].map(n=>({ id:`face${n}`,    label:`얼굴형${n}` }));
  const EYE_TYPES       = [1,2,3,4,5].map(n=>({ id:`eye${n}`,     label:`눈${n}`     }));
  const EYEBROW_TYPES   = [1,2,3,4].map(n  =>({ id:`eyebrow${n}`, label:`눈썹${n}`   }));
  const NOSE_TYPES      = [1,2,3,4].map(n  =>({ id:`nose${n}`,    label:`코${n}`     }));
  const MOUTH_TYPES     = [1,2,3,4,5].map(n=>({ id:`mouth${n}`,   label:`입${n}`     }));
  const FRONT_HAIR_TYPES= [1,2,3,4,5].map(n=>({ id:`hair${n}`,    label:`앞머리${n}` }));
  const BACK_HAIR_TYPES = [1,2,3,4,5].map(n=>({ id:`bhair${n}`,   label:`뒷머리${n}` }));

  // ── PNG 로더 ────────────────────────────────────────
  const _cache = {};
  function loadImage(src) {
    return new Promise(resolve => {
      if (_cache[src]) { resolve(_cache[src]); return; }
      const img = new Image();
      img.onload  = () => { _cache[src] = img; resolve(img); };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }
  function _load(folder, id) {
    if (!id) return Promise.resolve(null);
    return loadImage(`assets/faces/${folder}/${id}.png`);
  }

  // ── 폴백: 얼굴 타원 (512×512 기준) ─────────────────
  function _drawOval(ctx, skinHex, W, H) {
    const s=W/512, cx=256*s, top=90*s, midY=225*s, bot=478*s, rx=156*s, cw=36*s;
    ctx.fillStyle=skinHex;
    ctx.beginPath();
    ctx.moveTo(cx,top);
    ctx.bezierCurveTo(cx+rx*1.05,top-8*s, cx+rx,midY-40*s, cx+rx,midY);
    ctx.bezierCurveTo(cx+rx,midY+(bot-midY)*0.52, cx+cw*2,bot-55*s, cx,bot);
    ctx.bezierCurveTo(cx-cw*2,bot-55*s, cx-rx,midY+(bot-midY)*0.52, cx-rx,midY);
    ctx.bezierCurveTo(cx-rx,midY-40*s, cx-rx*1.05,top-8*s, cx,top);
    ctx.closePath(); ctx.fill();
    const g=ctx.createRadialGradient(cx-rx*0.22,midY-55*s,8*s,cx,midY,rx*1.15);
    g.addColorStop(0,'rgba(255,255,255,0.13)');
    g.addColorStop(0.6,'rgba(0,0,0,0)');
    g.addColorStop(1,'rgba(0,0,0,0.07)');
    ctx.fillStyle=g; ctx.fill();
  }

  // ── 폴백: 앞머리 (뱅) ──────────────────────────────
  function _drawFrontHairFallback(ctx, type, color, W, H) {
    ctx.fillStyle = color;
    const s=W/512, cx=256*s, top=90*s, rx=162*s;
    // 앞머리 = 이마 위쪽 반원 형태
    ctx.beginPath();
    ctx.ellipse(cx, top+22*s, rx, 78*s, 0, Math.PI, 0);
    ctx.fill();
    // 타입별 뱅 변형
    if (type==='hair2'||type==='hair3') {
      ctx.fillRect(cx-rx, top, rx*2, 35*s); // straight bang
    }
    if (type==='hair4') { // spiky
      const pts=[[cx-rx,top+32*s],[cx-rx*0.7,top-55*s],[cx-rx*0.3,top+10*s],
        [cx,top-80*s],[cx+rx*0.3,top+10*s],[cx+rx*0.7,top-55*s],[cx+rx,top+32*s]];
      ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
      pts.forEach(p=>ctx.lineTo(p[0],p[1]));
      ctx.lineTo(cx+rx,top+32*s); ctx.fill();
    }
  }

  // ── 폴백: 뒷머리 ───────────────────────────────────
  function _drawBackHairFallback(ctx, type, color, W, H) {
    ctx.fillStyle = color;
    const s=W/512, cx=256*s, top=80*s, rx=165*s;
    switch(type) {
      case 'bhair1': // 단발
        ctx.beginPath(); ctx.ellipse(cx,top+30*s,rx,88*s,0,0,Math.PI*2); ctx.fill(); break;
      case 'bhair2': // 어깨
        ctx.beginPath(); ctx.ellipse(cx,top+30*s,rx,88*s,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx,290*s,rx*1.05,145*s,0,0,Math.PI*2); ctx.fill(); break;
      case 'bhair3': // 긴 생머리
        ctx.beginPath(); ctx.ellipse(cx,top+30*s,rx,88*s,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx,340*s,rx*1.05,200*s,0,0,Math.PI*2); ctx.fill(); break;
      case 'bhair4': // 볼륨
        ctx.beginPath(); ctx.ellipse(cx,top+30*s,rx*1.1,95*s,0,0,Math.PI*2); ctx.fill();
        for(const d of[-1,1]){ctx.beginPath();ctx.ellipse(cx+d*rx*0.72,250*s,rx*0.5,170*s,d*0.2,0,Math.PI*2);ctx.fill();} break;
      case 'bhair5': // 묶음/올림
        ctx.beginPath(); ctx.ellipse(cx,top+30*s,rx,88*s,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx,top-30*s,rx*0.35,rx*0.32,0,0,Math.PI*2); ctx.fill(); break;
    }
  }

  // ── 틴트 ───────────────────────────────────────────
  function _tint(img, hex, W, H) {
    const t=document.createElement('canvas'); t.width=W; t.height=H;
    const c=t.getContext('2d');
    c.drawImage(img,0,0,W,H);
    c.globalCompositeOperation='source-atop'; c.fillStyle=hex; c.globalAlpha=0.72; c.fillRect(0,0,W,H);
    c.globalCompositeOperation='source-over'; c.globalAlpha=1;
    return t;
  }

  // ── 얼굴 드로우 (레이어 순서) ───────────────────────
  // 뒷머리 → 얼굴형/타원 → 눈 → 눈썹 → 코 → 입 → 앞머리
  async function drawFace(ctx, state) {
    const W=ctx.canvas.width, H=ctx.canvas.height;
    ctx.clearRect(0,0,W,H);
    const skin=(SKIN_COLORS.find(c=>c.id===state.skinColor)||SKIN_COLORS[0]).hex;
    const hair=(HAIR_COLORS.find(c=>c.id===state.hairColor)||HAIR_COLORS[0]).hex;

    // 1. 뒷머리
    const bhImg=await _load('hair', state.backHairType);
    if(bhImg) ctx.drawImage(_tint(bhImg,hair,W,H),0,0,W,H);
    else _drawBackHairFallback(ctx,state.backHairType,hair,W,H);

    // 2. 얼굴형
    _drawOval(ctx,skin,W,H);
    const faceImg=await _load('face',state.faceType);
    if(faceImg) ctx.drawImage(faceImg,0,0,W,H);

    // 3. 눈
    const eyeImg=await _load('eyes',state.eyeType);
    if(eyeImg) ctx.drawImage(eyeImg,0,0,W,H);

    // 4. 눈썹
    const browImg=await _load('eyebrow',state.eyebrowType);
    if(browImg) ctx.drawImage(browImg,0,0,W,H);

    // 5. 코
    const noseImg=await _load('nose',state.noseType);
    if(noseImg) ctx.drawImage(noseImg,0,0,W,H);

    // 6. 입
    const mouthImg=await _load('mouth',state.mouthType);
    if(mouthImg) ctx.drawImage(mouthImg,0,0,W,H);

    // 7. 앞머리
    const fhImg=await _load('hair',state.frontHairType);
    if(fhImg) ctx.drawImage(_tint(fhImg,hair,W,H),0,0,W,H);
    else _drawFrontHairFallback(ctx,state.frontHairType,hair,W,H);
  }

  // ── 뒷머리 전용 텍스처 (3D 뒷면 plane용) ───────────
  async function drawBackHairTexture(ctx, state) {
    const W=ctx.canvas.width, H=ctx.canvas.height;
    ctx.clearRect(0,0,W,H);
    const hair=(HAIR_COLORS.find(c=>c.id===state.hairColor)||HAIR_COLORS[0]).hex;
    const bhImg=await _load('hair',state.backHairType);
    if(bhImg) ctx.drawImage(_tint(bhImg,hair,W,H),0,0,W,H);
    else _drawBackHairFallback(ctx,state.backHairType,hair,W,H);
  }

  // ── 오버라이드 지원 (깜빡임·말하기용) ──────────────
  async function drawFaceWithOverrides(ctx, state, overrides) {
    await drawFace(ctx, { ...state, ...overrides });
  }

  // ── 커스터마이징 프리뷰 (상체 포함) ─────────────────
  async function drawPreview(ctx, state) {
    const W=ctx.canvas.width, H=ctx.canvas.height;
    ctx.clearRect(0,0,W,H);
    const faceH=Math.floor(H*0.62);
    const tmp=document.createElement('canvas'); tmp.width=W; tmp.height=faceH;
    await drawFace(tmp.getContext('2d'),state);
    ctx.drawImage(tmp,0,0);

    const clothHex=(CLOTHING_COLORS.find(c=>c.id===state.clothingColor)||CLOTHING_COLORS[0]).hex;
    const skin=(SKIN_COLORS.find(c=>c.id===state.skinColor)||SKIN_COLORS[0]).hex;
    const cx=W/2, bodyTop=faceH-2;

    ctx.fillStyle=skin; ctx.fillRect(cx-W*0.07,bodyTop,W*0.14,H*0.07);

    const shoulderY=bodyTop+H*0.06, tw=W*0.72, th=H*0.30;
    ctx.fillStyle=clothHex;
    ctx.beginPath();
    ctx.moveTo(cx-tw*0.36,shoulderY); ctx.lineTo(cx+tw*0.36,shoulderY);
    ctx.lineTo(cx+tw*0.5,shoulderY+th); ctx.lineTo(cx-tw*0.5,shoulderY+th);
    ctx.closePath(); ctx.fill();

    for(const d of[-1,1]){
      const ax=cx+d*tw*0.38;
      ctx.fillStyle=clothHex;
      ctx.beginPath(); ctx.ellipse(ax,shoulderY+th*0.35,W*0.09,th*0.42,d*0.12,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=skin;
      ctx.beginPath(); ctx.ellipse(ax+d*W*0.04,shoulderY+th*0.82,W*0.07,W*0.07,0,0,Math.PI*2); ctx.fill();
    }

    ctx.fillStyle=_darken(clothHex,0.1);
    ctx.beginPath();
    ctx.moveTo(cx-W*0.07,shoulderY+2); ctx.lineTo(cx,shoulderY+H*0.1); ctx.lineTo(cx+W*0.07,shoulderY+2);
    ctx.closePath(); ctx.fill();
  }

  // ── 그리드 아이콘 ─────────────────────────────────
  async function drawIcon(canvas, partType, partId, state) {
    const ctx=canvas.getContext('2d');
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#f0f0f0'; ctx.fillRect(0,0,W,H);

    const hair=(HAIR_COLORS.find(c=>c.id===state.hairColor)||HAIR_COLORS[0]).hex;
    const skin=(SKIN_COLORS.find(c=>c.id===state.skinColor)||SKIN_COLORS[0]).hex;

    if (partType==='fronthair') {
      const img=await _load('hair',partId);
      _drawOval(ctx,skin,W,H); // 얼굴 배경
      if(img) ctx.drawImage(_tint(img,hair,W,H),0,0,W,H);
      else _drawFrontHairFallback(ctx,partId,hair,W,H);
    } else if (partType==='backhair') {
      const img=await _load('hair',partId);
      if(img) ctx.drawImage(_tint(img,hair,W,H),0,0,W,H);
      else _drawBackHairFallback(ctx,partId,hair,W,H);
    } else if (partType==='face') {
      _drawOval(ctx,skin,W,H);
      const img=await _load('face',partId); if(img) ctx.drawImage(img,0,0,W,H);
    } else {
      // eyes / eyebrow / nose / mouth → 해당 PNG만
      const img=await _load(partType,partId);
      if(img) { ctx.drawImage(img,0,0,W,H); }
      else {
        ctx.fillStyle='#ccc'; ctx.font=`${W*0.12}px sans-serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(partId,W/2,H/2);
      }
    }
  }

  function _darken(hex,amt){
    const n=parseInt(hex.replace('#',''),16);
    const r=Math.max(0,(n>>16)-Math.round(255*amt));
    const g=Math.max(0,((n>>8)&0xff)-Math.round(255*amt));
    const b=Math.max(0,(n&0xff)-Math.round(255*amt));
    return `#${((r<<16)|(g<<8)|b).toString(16).padStart(6,'0')}`;
  }

  return {
    SKIN_COLORS, HAIR_COLORS, EYE_COLORS, CLOTHING_COLORS,
    FACE_TYPES, EYE_TYPES, EYEBROW_TYPES, NOSE_TYPES, MOUTH_TYPES,
    FRONT_HAIR_TYPES, BACK_HAIR_TYPES,
    drawFace, drawFaceWithOverrides, drawBackHairTexture, drawPreview, drawIcon, loadImage,
  };
})();
