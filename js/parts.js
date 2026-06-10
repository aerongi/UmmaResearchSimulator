'use strict';

const FaceParts = (() => {

  const HAIR_COLORS = [
    { id:'hc_0', hex:'#1C1008' }, { id:'hc_1', hex:'#5C3317' },
    { id:'hc_2', hex:'#C48B30' }, { id:'hc_3', hex:'#8B1A00' },
    { id:'hc_4', hex:'#888888' }, { id:'hc_5', hex:'#E8E0D0' },
  ];
  const CLOTHING_COLORS = [
    { id:'cl_yellow',   hex:'#F5C842', label:'옐로우'  },
    { id:'cl_white',    hex:'#EEEEEE', label:'화이트'  },
    { id:'cl_blue',     hex:'#5B9BD5', label:'블루'    },
    { id:'cl_navy',     hex:'#2C3E6B', label:'네이비'  },
    { id:'cl_coral',    hex:'#E8735A', label:'코랄'    },
    { id:'cl_mint',     hex:'#7EC8A4', label:'민트'    },
    { id:'cl_lavender', hex:'#9B89C4', label:'라벤더'  },
    { id:'cl_gray',     hex:'#78909C', label:'그레이'  },
    { id:'cl_pink',     hex:'#F48FB1', label:'핑크'    },
    { id:'cl_black',    hex:'#2C2C2C', label:'블랙'    },
  ];

  const FACE_TYPES       = [1,2,3].map(n=>({ id:`face${n}`,    label:`얼굴형${n}` }));
  const EYE_TYPES        = [1,2,3,4,5,6,7,8].map(n=>({ id:`eye${n}`,     label:`눈${n}`     }));
  const EYEBROW_TYPES    = [1,2,3,4].map(n  =>({ id:`eyebrow${n}`, label:`눈썹${n}`   }));
  const NOSE_TYPES       = [1,2,3,4].map(n  =>({ id:`nose${n}`,    label:`코${n}`     }));
  const MOUTH_TYPES      = [1,2,3,4].map(n=>({ id:`mouth${n}`,   label:`입${n}`     }));
  const FRONT_HAIR_TYPES = [1,2,3,4,5].map(n=>({ id:`hair${n}`,    label:`앞머리${n}` }));
  const BACK_HAIR_TYPES  = [1,2,3].map(n=>({ id:`bhair${n}`,   label:`뒷머리${n}` }));

// 액세서리: 각 카테고리는 '없음'(빈 값) + 종류들. 복수 착용(카테고리별 1개씩)
  const WRINKLE_TYPES = [
    { id:'', label:'없음' },
    ...[1,2].map(n=>({ id:`wrinkle${n}`, label:`주름${n}` })),
  ];
  const GLASSES_TYPES = [
    { id:'', label:'없음' },
    ...[1,2,3].map(n=>({ id:`glasses${n}`, label:`안경${n}` })),
  ];

  /* ── PNG 로더 (로딩된 이미지는 _cache에 보관) ── */
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

  function _tint(img, hex, W, H) {
    const t = document.createElement('canvas'); t.width=W; t.height=H;
    const c = t.getContext('2d');
    c.drawImage(img, 0, 0, W, H);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = hex; c.globalAlpha = 0.72; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    return t;
  }

  /* ── 얼굴 PNG 전부 미리 로딩 (게임 진입 전 호출) ──
     한 번 받아두면 _cache 덕분에 이후 drawFace는 즉시 그려짐.
     시작 버튼 게이트에서 await 해서 "얼굴 없는 캐릭터" 방지.
  ── */
  async function preloadFace(state) {
    state = state || {};
    await Promise.all([
      _load('hair',    state.backHairType),
      _load('face',    state.faceType),
      _load('eyes',    state.eyeType),
      _load('eyebrow', state.eyebrowType),
      _load('nose',    state.noseType),
      _load('mouth',   state.mouthType),
      _load('hair',    state.frontHairType),
      _load('accessory', state.wrinkleType),
      _load('accessory', state.glassesType),
      _load('mouth',   'mouth_open'),   // 입 움직임용
      _load('eyes',    'eye_smile'),    // 웃는 눈용
    ]);
  }

  /* ── 얼굴 드로우 ─────────────────────────────────────
     뒷머리→얼굴형→눈→눈썹→코→입→앞머리 / PNG없으면 스킵
  ──────────────────────────────────────────────────── */
  async function drawFace(ctx, state) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);
    const hair = (HAIR_COLORS.find(c=>c.id===state.hairColor)||HAIR_COLORS[0]).hex;

    const bhImg  = await _load('hair',    state.backHairType);
    if (bhImg)  ctx.drawImage(_tint(bhImg, hair, W, H), 0, 0, W, H);

    const faceImg = await _load('face',    state.faceType);
    if (faceImg) ctx.drawImage(faceImg, 0, 0, W, H);

    const eyeImg  = await _load('eyes',    state.eyeType);
    if (eyeImg)  ctx.drawImage(eyeImg, 0, 0, W, H);

    const browImg = await _load('eyebrow', state.eyebrowType);
    if (browImg) ctx.drawImage(browImg, 0, 0, W, H);

    const noseImg = await _load('nose',    state.noseType);
    if (noseImg) ctx.drawImage(noseImg, 0, 0, W, H);

    const mouthImg= await _load('mouth',   state.mouthType);
    if (mouthImg) ctx.drawImage(mouthImg, 0, 0, W, H);

    const fhImg   = await _load('hair',    state.frontHairType);
    if (fhImg)   ctx.drawImage(_tint(fhImg, hair, W, H), 0, 0, W, H);

	    // 액세서리 (PNG 그대로, 색 변경 없음) — 주름 먼저, 안경 맨 위
    const wrkImg  = await _load('accessory', state.wrinkleType);
    if (wrkImg)  ctx.drawImage(wrkImg, 0, 0, W, H);

    const glsImg  = await _load('accessory', state.glassesType);
    if (glsImg)  ctx.drawImage(glsImg, 0, 0, W, H);
  }

  async function drawFaceWithOverrides(ctx, state, overrides) {
    await drawFace(ctx, { ...state, ...overrides });
  }

  async function drawBackHairTexture(ctx, state) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);
    const hair = (HAIR_COLORS.find(c=>c.id===state.hairColor)||HAIR_COLORS[0]).hex;
    const img = await _load('hair', state.backHairType);
    if (img) ctx.drawImage(_tint(img, hair, W, H), 0, 0, W, H);
  }

  /* ── 커스터마이징 미리보기: 얼굴 + 심플 몸통 막대 ── */
  async function drawPreview(ctx, state, overrides) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 얼굴 영역: 상단 60%
    const faceH = Math.floor(H * 0.60);
    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = faceH;
    await drawFace(tmp.getContext('2d'), overrides ? { ...state, ...overrides } : state);
    ctx.drawImage(tmp, 0, 0);

    // 몸통: 기다란 둥근 막대 하나 (팔 없음)
    const clothHex = (CLOTHING_COLORS.find(c=>c.id===state.clothingColor)||CLOTHING_COLORS[0]).hex;
    const cx  = W / 2;
    const bw  = W * 0.28;       // 막대 폭
    const bh  = H * 0.36;       // 막대 높이
    const br  = bw / 2;         // 끝 반원
    const bx  = cx - bw / 2;
    const by  = faceH + H * 0.01;

    ctx.fillStyle = clothHex;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, br);
    ctx.fill();
  }

  /* ── 그리드 아이콘 (PNG 없으면 빈 배경) ── */
  async function drawIcon(canvas, partType, partId, state) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, W, H);

    const hair = (HAIR_COLORS.find(c=>c.id===state.hairColor)||HAIR_COLORS[0]).hex;

    const folderMap = { fronthair:'hair', backhair:'hair', face:'face',
                        eyes:'eyes', eyebrow:'eyebrow', nose:'nose', mouth:'mouth',
                        wrinkle:'accessory', glasses:'accessory' };
    const folder = folderMap[partType];
    if (!folder) return;

    const img = await _load(folder, partId);
    if (!img) return;

    if (partType==='fronthair'||partType==='backhair') {
      ctx.drawImage(_tint(img, hair, W, H), 0, 0, W, H);
    } else {
      ctx.drawImage(img, 0, 0, W, H);
    }
  }

  return {
    HAIR_COLORS, CLOTHING_COLORS,
    FACE_TYPES, EYE_TYPES, EYEBROW_TYPES, NOSE_TYPES, MOUTH_TYPES,
    FRONT_HAIR_TYPES, BACK_HAIR_TYPES, WRINKLE_TYPES, GLASSES_TYPES,
    drawFace, drawFaceWithOverrides, drawBackHairTexture, drawPreview, drawIcon,
    loadImage, preloadFace,
  };
})();
