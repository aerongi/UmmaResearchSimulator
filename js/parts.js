'use strict';

const FaceParts = (() => {

  const SKIN_COLORS = [
    { id:'skin_0', label:'밝은',    hex:'#FDDBB4' },
    { id:'skin_1', label:'보통',    hex:'#F0A875' },
    { id:'skin_2', label:'구릿빛',  hex:'#C68642' },
    { id:'skin_3', label:'어두운',  hex:'#8D5524' },
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

  // PNG 경로: assets/faces/{folder}/{id}.png
  const EYE_TYPES = [
    { id:'eye_round',   label:'동그란'   },
    { id:'eye_narrow',  label:'가는'     },
    { id:'eye_large',   label:'큰'       },
    { id:'eye_gentle',  label:'온화한'   },
    { id:'eye_sharp',   label:'날카로운' },
  ];
  const NOSE_TYPES = [
    { id:'nose_none',   label:'없음' },
    { id:'nose_dot',    label:'점'   },
    { id:'nose_button', label:'동글' },
    { id:'nose_normal', label:'보통' },
  ];
  const MOUTH_TYPES = [
    { id:'mouth_neutral', label:'무표정' },
    { id:'mouth_smile',   label:'미소'   },
    { id:'mouth_grin',    label:'활짝'   },
    { id:'mouth_serious', label:'진지함' },
    { id:'mouth_small',   label:'작은'   },
  ];
  const HAIR_TYPES = [
    { id:'hair_short',  label:'단발'   },
    { id:'hair_medium', label:'중간'   },
    { id:'hair_long',   label:'긴'     },
    { id:'hair_spiky',  label:'뾰족'   },
    { id:'hair_parted', label:'가르마' },
  ];

  // ── PNG 로더 ────────────────────────────────────────────────
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
  async function _loadPart(folder, id) {
    if (!id || id === 'nose_none') return null;
    return loadImage(`assets/faces/${folder}/${id}.png`);
  }

  // ── 역계란형 얼굴 윤곽 ─────────────────────────────────────
  // 기준: 512×512 좌표계. 모든 PNG도 동일 기준으로 제작
  function drawFaceOval(ctx, skinHex) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const s  = W / 512;
    const cx = 256*s, top = 90*s, midY = 225*s, bot = 478*s;
    const rx = 156*s, cw = 36*s;

    ctx.fillStyle = skinHex;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.bezierCurveTo(cx+rx*1.05, top-8*s,   cx+rx, midY-40*s,  cx+rx, midY);
    ctx.bezierCurveTo(cx+rx, midY+(bot-midY)*0.52,  cx+cw*2, bot-55*s,  cx, bot);
    ctx.bezierCurveTo(cx-cw*2, bot-55*s,  cx-rx, midY+(bot-midY)*0.52,  cx-rx, midY);
    ctx.bezierCurveTo(cx-rx, midY-40*s,   cx-rx*1.05, top-8*s,  cx, top);
    ctx.closePath();
    ctx.fill();

    // 미세 입체감
    const g = ctx.createRadialGradient(cx-rx*0.22, midY-55*s, 8*s, cx, midY, rx*1.15);
    g.addColorStop(0,   'rgba(255,255,255,0.13)');
    g.addColorStop(0.6, 'rgba(0,0,0,0)');
    g.addColorStop(1,   'rgba(0,0,0,0.07)');
    ctx.fillStyle = g; ctx.fill();
  }

  // ── 머리카락 뒷면 (Canvas 직접 드로잉) ──────────────────────
  function _drawHairBack(ctx, type, colorHex, W, H) {
    ctx.fillStyle = colorHex;
    const s = W/512, cx = 256*s, top = 90*s, rx = 162*s;
    switch(type) {
      case 'hair_short':
        ctx.beginPath();
        ctx.ellipse(cx, top+22*s, rx, 82*s, 0, Math.PI, 0); ctx.fill(); break;
      case 'hair_medium':
        ctx.beginPath();
        ctx.ellipse(cx, top+22*s, rx, 82*s, 0, Math.PI, 0); ctx.fill();
        for (const d of [-1,1]) { ctx.beginPath(); ctx.ellipse(cx+d*(rx-12*s),290*s,34*s,128*s,d*0.1,0,Math.PI*2); ctx.fill(); } break;
      case 'hair_long':
        ctx.beginPath();
        ctx.ellipse(cx, top+22*s, rx, 86*s, 0, Math.PI, 0); ctx.fill();
        for (const d of [-1,1]) { ctx.beginPath(); ctx.ellipse(cx+d*(rx-10*s),340*s,37*s,185*s,d*0.08,0,Math.PI*2); ctx.fill(); } break;
      case 'hair_spiky': {
        const pts=[[cx-rx,top+32*s],[cx-rx*0.72,top-62*s],[cx-rx*0.37,top+12*s],[cx-rx*0.06,top-92*s],[cx+rx*0.08,top-22*s],[cx+rx*0.46,top-72*s],[cx+rx*0.72,top+2*s],[cx+rx,top+32*s]];
        ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); pts.forEach(p=>ctx.lineTo(p[0],p[1]));
        ctx.arc(cx,top+30*s,rx,0,Math.PI,true); ctx.fill(); break; }
      case 'hair_parted':
        ctx.beginPath();
        ctx.ellipse(cx, top+22*s, rx, 84*s, 0, Math.PI, 0); ctx.fill();
        for (const d of [-1,1]) { ctx.beginPath(); ctx.ellipse(cx+d*(rx-14*s),295*s,31*s,115*s,d*0.12,0,Math.PI*2); ctx.fill(); } break;
    }
  }

  // ── 틴트 헬퍼 ──────────────────────────────────────────────
  function _tintImage(img, hex, W, H) {
    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = H;
    const c = tmp.getContext('2d');
    c.drawImage(img, 0, 0, W, H);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = hex; c.globalAlpha = 0.72;
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    return tmp;
  }

  // ── 전체 얼굴 드로우 (미리보기, async) ───────────────────────
  async function drawFace(ctx, state) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);
    const skin = (SKIN_COLORS.find(c=>c.id===state.skinColor)||SKIN_COLORS[0]).hex;
    const hair = (HAIR_COLORS.find(c=>c.id===state.hairColor)||HAIR_COLORS[0]).hex;

    _drawHairBack(ctx, state.hairType, hair, W, H);
    drawFaceOval(ctx, skin);

    for (const [folder, id] of [['eyes',state.eyeType],['nose',state.noseType],['mouth',state.mouthType]]) {
      const img = await _loadPart(folder, id);
      if (img) ctx.drawImage(img, 0, 0, W, H);
    }
    // 앞머리 오버레이 PNG (있으면 틴트 적용)
    const front = await loadImage(`assets/faces/hair/${state.hairType}_front.png`);
    if (front) ctx.drawImage(_tintImage(front, hair, W, H), 0, 0, W, H);
  }

  // ── 3D 텍스처용 (얼굴 피처만) ────────────────────────────────
  async function drawFaceTexture(ctx, state) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);
    const skin = (SKIN_COLORS.find(c=>c.id===state.skinColor)||SKIN_COLORS[0]).hex;
    drawFaceOval(ctx, skin);
    for (const [folder, id] of [['eyes',state.eyeType],['nose',state.noseType],['mouth',state.mouthType]]) {
      const img = await _loadPart(folder, id); if (img) ctx.drawImage(img,0,0,W,H);
    }
  }

  // ── 그리드 아이콘 (썸네일) ────────────────────────────────────
  async function drawIcon(canvas, partType, partId, state) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const skin = (SKIN_COLORS.find(c=>c.id===state.skinColor)||SKIN_COLORS[0]).hex;
    const hair = (HAIR_COLORS.find(c=>c.id===state.hairColor)||HAIR_COLORS[0]).hex;
    if (partType==='hair') _drawHairBack(ctx, partId, hair, W, H);
    drawFaceOval(ctx, skin);
    if (partType!=='hair') { const img=await _loadPart(partType,partId); if(img) ctx.drawImage(img,0,0,W,H); }
  }

  return {
    SKIN_COLORS, HAIR_COLORS, EYE_COLORS, CLOTHING_COLORS,
    EYE_TYPES, NOSE_TYPES, MOUTH_TYPES, HAIR_TYPES,
    drawFace, drawFaceTexture, drawFaceOval, drawIcon, loadImage,
  };
})();
