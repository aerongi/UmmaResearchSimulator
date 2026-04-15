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

  const FACE_TYPES       = [1,2,3,4,5].map(n=>({ id:`face${n}`,    label:`얼굴형${n}` }));
  const EYE_TYPES        = [1,2,3,4,5].map(n=>({ id:`eye${n}`,     label:`눈${n}`     }));
  const EYEBROW_TYPES    = [1,2,3,4].map(n  =>({ id:`eyebrow${n}`, label:`눈썹${n}`   }));
  const NOSE_TYPES       = [1,2,3,4].map(n  =>({ id:`nose${n}`,    label:`코${n}`     }));
  const MOUTH_TYPES      = [1,2,3,4,5].map(n=>({ id:`mouth${n}`,   label:`입${n}`     }));
  const FRONT_HAIR_TYPES = [1,2,3,4,5].map(n=>({ id:`hair${n}`,    label:`앞머리${n}` }));
  const BACK_HAIR_TYPES  = [1,2,3,4,5].map(n=>({ id:`bhair${n}`,   label:`뒷머리${n}` }));

  /* ── PNG 로더 ──────────────────────────────────────── */
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

  /* ── 틴트 ──────────────────────────────────────────── */
  function _tint(img, hex, W, H) {
    const t = document.createElement('canvas'); t.width=W; t.height=H;
    const c = t.getContext('2d');
    c.drawImage(img, 0, 0, W, H);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = hex; c.globalAlpha = 0.72; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    return t;
  }

  /* ══════════════════════════════════════════
     얼굴 드로우 (레이어 순서)
     뒷머리 → 얼굴형 → 눈 → 눈썹 → 코 → 입 → 앞머리
     ※ PNG 없는 레이어는 스킵 (폴백 드로잉 없음)
  ══════════════════════════════════════════ */
  async function drawFace(ctx, state) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);
    const hair = (HAIR_COLORS.find(c=>c.id===state.hairColor)||HAIR_COLORS[0]).hex;

    // 1. 뒷머리
    const bhImg = await _load('hair', state.backHairType);
    if (bhImg) ctx.drawImage(_tint(bhImg, hair, W, H), 0, 0, W, H);

    // 2. 얼굴형 (PNG만, 폴백 없음)
    const faceImg = await _load('face', state.faceType);
    if (faceImg) ctx.drawImage(faceImg, 0, 0, W, H);

    // 3. 눈
    const eyeImg = await _load('eyes', state.eyeType);
    if (eyeImg) ctx.drawImage(eyeImg, 0, 0, W, H);

    // 4. 눈썹
    const browImg = await _load('eyebrow', state.eyebrowType);
    if (browImg) ctx.drawImage(browImg, 0, 0, W, H);

    // 5. 코
    const noseImg = await _load('nose', state.noseType);
    if (noseImg) ctx.drawImage(noseImg, 0, 0, W, H);

    // 6. 입
    const mouthImg = await _load('mouth', state.mouthType);
    if (mouthImg) ctx.drawImage(mouthImg, 0, 0, W, H);

    // 7. 앞머리
    const fhImg = await _load('hair', state.frontHairType);
    if (fhImg) ctx.drawImage(_tint(fhImg, hair, W, H), 0, 0, W, H);
  }

  /* ── 오버라이드 지원 (깜빡임·말하기용) ──────────────── */
  async function drawFaceWithOverrides(ctx, state, overrides) {
    await drawFace(ctx, { ...state, ...overrides });
  }

  /* ── 뒷머리 전용 텍스처 (3D 뒷면 plane용) ───────────── */
  async function drawBackHairTexture(ctx, state) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);
    const hair = (HAIR_COLORS.find(c=>c.id===state.hairColor)||HAIR_COLORS[0]).hex;
    const bhImg = await _load('hair', state.backHairType);
    if (bhImg) ctx.drawImage(_tint(bhImg, hair, W, H), 0, 0, W, H);
  }

  /* ══════════════════════════════════════════
     커스터마이징 프리뷰 (얼굴 + 심플 몸통)
  ══════════════════════════════════════════ */
  async function drawPreview(ctx, state) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 얼굴 영역: 상단 58%
    const faceH = Math.floor(H * 0.58);
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = faceH;
    await drawFace(tmp.getContext('2d'), state);
    ctx.drawImage(tmp, 0, 0);

    const clothHex = (CLOTHING_COLORS.find(c=>c.id===state.clothingColor)||CLOTHING_COLORS[0]).hex;
    const cx = W / 2;
    const bodyTop = faceH + H * 0.01;

    ctx.fillStyle = clothHex;

    // 몸통 (세로 둥근 막대)
    const bw = W * 0.38, bh = H * 0.28, br = bw / 2;
    const bx = cx - bw / 2;
    ctx.beginPath();
    ctx.roundRect(bx, bodyTop, bw, bh, br);
    ctx.fill();

    // 왼팔 (둥근 막대, 살짝 바깥쪽으로 기울임)
    ctx.save();
    ctx.translate(cx - bw * 0.62, bodyTop + bh * 0.08);
    ctx.rotate(-0.18);
    const aw = W * 0.13, ah = H * 0.22;
    ctx.beginPath();
    ctx.roundRect(-aw / 2, 0, aw, ah, aw / 2);
    ctx.fill();
    ctx.restore();

    // 오른팔
    ctx.save();
    ctx.translate(cx + bw * 0.62, bodyTop + bh * 0.08);
    ctx.rotate(0.18);
    ctx.beginPath();
    ctx.roundRect(-aw / 2, 0, aw, ah, aw / 2);
    ctx.fill();
    ctx.restore();
  }

  /* ══════════════════════════════════════════
     그리드 아이콘 (해당 파츠 PNG만 표시)
     PNG 없으면 빈 회색 배경만
  ══════════════════════════════════════════ */
  async function drawIcon(canvas, partType, partId, state) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 연한 배경
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, W, H);

    const hair = (HAIR_COLORS.find(c=>c.id===state.hairColor)||HAIR_COLORS[0]).hex;

    if (partType === 'fronthair') {
      const img = await _load('hair', partId);
      if (img) ctx.drawImage(_tint(img, hair, W, H), 0, 0, W, H);
    } else if (partType === 'backhair') {
      const img = await _load('hair', partId);
      if (img) ctx.drawImage(_tint(img, hair, W, H), 0, 0, W, H);
    } else if (partType === 'face') {
      const img = await _load('face', partId);
      if (img) ctx.drawImage(img, 0, 0, W, H);
    } else {
      // eyes / eyebrow / nose / mouth
      const img = await _load(partType, partId);
      if (img) ctx.drawImage(img, 0, 0, W, H);
    }
  }

  return {
    SKIN_COLORS, HAIR_COLORS, CLOTHING_COLORS,
    FACE_TYPES, EYE_TYPES, EYEBROW_TYPES, NOSE_TYPES, MOUTH_TYPES,
    FRONT_HAIR_TYPES, BACK_HAIR_TYPES,
    drawFace, drawFaceWithOverrides, drawBackHairTexture, drawPreview, drawIcon, loadImage,
  };
})();
