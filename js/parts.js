'use strict';

const FaceParts = (() => {

  const SKIN_COLORS = [
    { id: 'skin_0', label: '밝은', hex: '#FDDBB4' },
    { id: 'skin_1', label: '보통', hex: '#F0A875' },
    { id: 'skin_2', label: '구릿빛', hex: '#C68642' },
    { id: 'skin_3', label: '어두운', hex: '#8D5524' },
  ];

  const HAIR_COLORS = [
    { id: 'hc_0', hex: '#1C1008' },
    { id: 'hc_1', hex: '#6B3A2A' },
    { id: 'hc_2', hex: '#C48B30' },
    { id: 'hc_3', hex: '#8B1A00' },
    { id: 'hc_4', hex: '#888888' },
    { id: 'hc_5', hex: '#E8E0D0' },
  ];

  const EYE_COLORS = [
    { id: 'ec_0', hex: '#1A1008' },
    { id: 'ec_1', hex: '#6B3A1A' },
    { id: 'ec_2', hex: '#1A4A8A' },
    { id: 'ec_3', hex: '#1A6040' },
  ];

  const EYE_TYPES = [
    { id: 'eye_round',  label: '동그란' },
    { id: 'eye_narrow', label: '가는' },
    { id: 'eye_large',  label: '큰' },
    { id: 'eye_gentle', label: '온화한' },
    { id: 'eye_sharp',  label: '날카로운' },
  ];

  const NOSE_TYPES = [
    { id: 'nose_none',   label: '없음' },
    { id: 'nose_dot',    label: '점' },
    { id: 'nose_button', label: '동글' },
    { id: 'nose_normal', label: '보통' },
  ];

  const MOUTH_TYPES = [
    { id: 'mouth_neutral', label: '무표정' },
    { id: 'mouth_smile',   label: '미소' },
    { id: 'mouth_grin',    label: '활짝' },
    { id: 'mouth_serious', label: '진지함' },
    { id: 'mouth_small',   label: '작은' },
  ];

  const HAIR_TYPES = [
    { id: 'hair_short',  label: '단발' },
    { id: 'hair_medium', label: '중간' },
    { id: 'hair_long',   label: '긴' },
    { id: 'hair_spiky',  label: '뾰족' },
    { id: 'hair_parted', label: '가르마' },
  ];

  // ─── Main face draw (full canvas, with head + hair) ──────────────────────────
  function drawFace(ctx, state) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);

    const skin = (SKIN_COLORS.find(c => c.id === state.skinColor) || SKIN_COLORS[0]).hex;
    const hair = (HAIR_COLORS.find(c => c.id === state.hairColor) || HAIR_COLORS[0]).hex;
    const eye  = (EYE_COLORS.find(c => c.id === state.eyeColor)  || EYE_COLORS[0]).hex;

    const cx = W * 0.5, cy = H * 0.56;
    const rx = W * 0.37, ry = H * 0.40;
    const s  = W / 280;

    // Hair (back layer)
    _drawHair(ctx, state.hairType, cx, cy, rx, ry, hair, s, false);

    // Ears
    ctx.fillStyle = skin;
    ctx.strokeStyle = _darken(skin, 0.15);
    ctx.lineWidth = 1.5;
    for (const ex of [cx - rx + 4*s, cx + rx - 4*s]) {
      ctx.beginPath();
      ctx.ellipse(ex, cy + 8*s, 11*s, 15*s, 0, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
    }

    // Head
    ctx.fillStyle = skin;
    ctx.strokeStyle = _darken(skin, 0.15);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // Hair (front layer — bangs)
    _drawHair(ctx, state.hairType, cx, cy, rx, ry, hair, s, true);

    // Eyebrows
    ctx.strokeStyle = _darken(hair, 0.1);
    ctx.lineWidth = 2.8*s; ctx.lineCap = 'round';
    const browY = cy - ry*0.32, browOffX = rx*0.38;
    ctx.beginPath(); ctx.moveTo(cx-browOffX, browY); ctx.lineTo(cx-browOffX*0.28, browY-3*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+browOffX*0.28, browY-3*s); ctx.lineTo(cx+browOffX, browY); ctx.stroke();

    // Eyes
    _drawEyes(ctx, state.eyeType, cx, cy - ry*0.12, rx, s, eye);

    // Nose
    _drawNose(ctx, state.noseType, cx, cy + ry*0.12, s);

    // Mouth
    _drawMouth(ctx, state.mouthType, cx, cy + ry*0.35, s);
  }

  // ─── Texture draw (only features on transparent bg, for 3D head) ─────────────
  function drawFaceTexture(ctx, state) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.clearRect(0, 0, W, H);

    const eye  = (EYE_COLORS.find(c => c.id === state.eyeColor)  || EYE_COLORS[0]).hex;
    const hair = (HAIR_COLORS.find(c => c.id === state.hairColor) || HAIR_COLORS[0]).hex;

    const cx = W*0.5, cy = H*0.48;
    const rx = W*0.38, ry = H*0.42;
    const s  = W/256;

    // Eyebrows
    ctx.strokeStyle = _darken(hair, 0.1);
    ctx.lineWidth = 3*s; ctx.lineCap = 'round';
    const browY = cy - ry*0.28, browOffX = rx*0.38;
    ctx.beginPath(); ctx.moveTo(cx-browOffX, browY); ctx.lineTo(cx-browOffX*0.3, browY-3*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+browOffX*0.3, browY-3*s); ctx.lineTo(cx+browOffX, browY); ctx.stroke();

    _drawEyes(ctx, state.eyeType, cx, cy - ry*0.08, rx, s, eye);
    _drawNose(ctx, state.noseType, cx, cy + ry*0.16, s);
    _drawMouth(ctx, state.mouthType, cx, cy + ry*0.42, s);
  }

  // ─── Icon draw (tiny preview for grid item) ──────────────────────────────────
  function drawIcon(canvas, partType, partId, state) {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.width; // clear
    const W = canvas.width, H = canvas.height;
    const tmpState = Object.assign({
      eyeType: 'eye_round', noseType: 'nose_button', mouthType: 'mouth_smile',
      hairType: 'hair_short', skinColor: 'skin_0', hairColor: 'hc_0', eyeColor: 'ec_0'
    }, state, { [_typeKey(partType)]: partId });
    drawFace(ctx, tmpState);
  }

  function _typeKey(t) {
    return { eyes:'eyeType', nose:'noseType', mouth:'mouthType', hair:'hairType' }[t] || t;
  }

  // ─── Hair ────────────────────────────────────────────────────────────────────
  function _drawHair(ctx, type, cx, cy, rx, ry, color, s, frontOnly) {
    ctx.fillStyle = color;

    if (type === 'hair_short') {
      if (!frontOnly) {
        ctx.beginPath();
        ctx.ellipse(cx, cy - ry*0.55, rx*1.05, ry*0.7, 0, Math.PI, 0);
        ctx.fill();
      }
    } else if (type === 'hair_medium') {
      if (!frontOnly) {
        ctx.beginPath();
        ctx.ellipse(cx, cy - ry*0.55, rx*1.05, ry*0.7, 0, Math.PI, 0);
        ctx.fill();
        // side hair
        for (const sx of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(cx + sx*(rx-5*s), cy + ry*0.3, rx*0.22, ry*0.55, sx*0.15, 0, Math.PI*2);
          ctx.fill();
        }
      }
    } else if (type === 'hair_long') {
      if (!frontOnly) {
        ctx.beginPath();
        ctx.ellipse(cx, cy - ry*0.55, rx*1.05, ry*0.7, 0, Math.PI, 0);
        ctx.fill();
        for (const sx of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(cx + sx*(rx-4*s), cy + ry*0.65, rx*0.24, ry*0.9, sx*0.1, 0, Math.PI*2);
          ctx.fill();
        }
      }
    } else if (type === 'hair_spiky') {
      if (!frontOnly) {
        ctx.beginPath();
        const pts = [
          [cx-rx*0.9, cy-ry*0.15],
          [cx-rx*0.7, cy-ry*0.85],
          [cx-rx*0.35, cy-ry*0.55],
          [cx-rx*0.1, cy-ry*1.1],
          [cx+rx*0.1, cy-ry*0.65],
          [cx+rx*0.4, cy-ry*0.9],
          [cx+rx*0.7, cy-ry*0.6],
          [cx+rx*0.9, cy-ry*0.15],
        ];
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (const p of pts) ctx.lineTo(p[0], p[1]);
        ctx.arc(cx, cy-ry*0.1, rx, 0, Math.PI, true);
        ctx.fill();
      }
    } else if (type === 'hair_parted') {
      if (!frontOnly) {
        ctx.beginPath();
        ctx.ellipse(cx, cy - ry*0.55, rx*1.05, ry*0.7, 0, Math.PI, 0);
        ctx.fill();
        for (const sx of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(cx + sx*(rx-5*s), cy + ry*0.3, rx*0.22, ry*0.5, sx*0.15, 0, Math.PI*2);
          ctx.fill();
        }
      }
      if (frontOnly) {
        // part line
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2.5*s;
        ctx.beginPath();
        ctx.moveTo(cx+3*s, cy-ry);
        ctx.lineTo(cx, cy-ry*0.35);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ─── Eyes ────────────────────────────────────────────────────────────────────
  function _drawEyes(ctx, type, cx, ey, rx, s, color) {
    const ox = rx * 0.36;

    if (type === 'eye_none') return;

    if (type === 'eye_round') {
      _eyeCircle(ctx, cx-ox, ey, 10*s, 7*s, 4*s, color);
      _eyeCircle(ctx, cx+ox, ey, 10*s, 7*s, 4*s, color);
    } else if (type === 'eye_narrow') {
      _eyeLine(ctx, cx-ox, ey, 13*s, color, false);
      _eyeLine(ctx, cx+ox, ey, 13*s, color, false);
    } else if (type === 'eye_large') {
      _eyeCircle(ctx, cx-ox, ey, 13*s, 10*s, 5*s, color);
      _eyeCircle(ctx, cx+ox, ey, 13*s, 10*s, 5*s, color);
    } else if (type === 'eye_gentle') {
      _eyeLine(ctx, cx-ox, ey, 13*s, color, true);
      _eyeLine(ctx, cx+ox, ey, 13*s, color, true);
    } else if (type === 'eye_sharp') {
      _eyeSharp(ctx, cx-ox, ey, 13*s, s, color);
      _eyeSharp(ctx, cx+ox, ey, 13*s, s, color);
    }
  }

  function _eyeCircle(ctx, x, y, rw, ri, rp, color) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x, y, rw, rw*0.85, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, ri, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x+1, y+0.5, rp, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x-ri*0.35, y-ri*0.35, rp*0.55, 0, Math.PI*2); ctx.fill();
  }

  function _eyeLine(ctx, x, y, hw, color, happy) {
    ctx.strokeStyle = color; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    const dy = happy ? -hw*0.45 : -hw*0.15;
    ctx.beginPath();
    ctx.moveTo(x-hw, y);
    ctx.bezierCurveTo(x-hw*0.4, y+dy, x+hw*0.4, y+dy, x+hw, y);
    ctx.stroke();
    ctx.strokeStyle = '#C8956C'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x-hw, y);
    ctx.bezierCurveTo(x-hw*0.4, y+hw*0.3, x+hw*0.4, y+hw*0.3, x+hw, y);
    ctx.stroke();
  }

  function _eyeSharp(ctx, x, y, hw, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x-hw, y+3*s);
    ctx.lineTo(x, y-5*s);
    ctx.lineTo(x+hw, y+3*s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x+1, y+1, hw*0.28, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x-hw*0.25, y-hw*0.1, hw*0.15, 0, Math.PI*2); ctx.fill();
  }

  // ─── Nose ────────────────────────────────────────────────────────────────────
  function _drawNose(ctx, type, cx, ny, s) {
    if (type === 'nose_none') return;
    if (type === 'nose_dot') {
      ctx.fillStyle = '#C8956C';
      ctx.beginPath(); ctx.arc(cx, ny, 3*s, 0, Math.PI*2); ctx.fill();
    } else if (type === 'nose_button') {
      ctx.strokeStyle = '#C8956C'; ctx.lineWidth = 2*s; ctx.lineCap = 'round';
      for (const ox of [-6*s, 6*s]) {
        ctx.beginPath(); ctx.arc(cx+ox, ny, 4*s, 0.2, Math.PI-0.2); ctx.stroke();
      }
    } else if (type === 'nose_normal') {
      ctx.strokeStyle = '#B07040'; ctx.lineWidth = 2*s; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx+2*s, ny-10*s);
      ctx.bezierCurveTo(cx+9*s, ny-4*s, cx+10*s, ny+4*s, cx+6*s, ny+2*s);
      ctx.bezierCurveTo(cx+1*s, ny+5*s, cx-1*s, ny+5*s, cx-6*s, ny+2*s);
      ctx.bezierCurveTo(cx-10*s, ny+4*s, cx-9*s, ny-4*s, cx-2*s, ny-10*s);
      ctx.stroke();
    }
  }

  // ─── Mouth ───────────────────────────────────────────────────────────────────
  function _drawMouth(ctx, type, cx, my, s) {
    ctx.strokeStyle = '#A0522D'; ctx.lineWidth = 3*s; ctx.lineCap = 'round';

    if (type === 'mouth_neutral') {
      ctx.beginPath(); ctx.moveTo(cx-18*s, my); ctx.lineTo(cx+18*s, my); ctx.stroke();
    } else if (type === 'mouth_smile') {
      ctx.beginPath();
      ctx.moveTo(cx-20*s, my-4*s);
      ctx.bezierCurveTo(cx-8*s, my+10*s, cx+8*s, my+10*s, cx+20*s, my-4*s);
      ctx.stroke();
    } else if (type === 'mouth_grin') {
      ctx.fillStyle = '#8B2020';
      ctx.beginPath();
      ctx.moveTo(cx-22*s, my-4*s);
      ctx.bezierCurveTo(cx-10*s, my+14*s, cx+10*s, my+14*s, cx+22*s, my-4*s);
      ctx.bezierCurveTo(cx+10*s, my+3*s, cx-10*s, my+3*s, cx-22*s, my-4*s);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx-16*s, my-2*s, 32*s, 8*s);
    } else if (type === 'mouth_serious') {
      ctx.beginPath();
      ctx.moveTo(cx-20*s, my+3*s);
      ctx.bezierCurveTo(cx-8*s, my-5*s, cx+8*s, my-5*s, cx+20*s, my+3*s);
      ctx.stroke();
    } else if (type === 'mouth_small') {
      ctx.lineWidth = 2.5*s;
      ctx.beginPath();
      ctx.moveTo(cx-11*s, my);
      ctx.bezierCurveTo(cx-5*s, my+6*s, cx+5*s, my+6*s, cx+11*s, my);
      ctx.stroke();
    }
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────
  function _darken(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (n>>16) - Math.round(255*amount));
    const g = Math.max(0, ((n>>8)&0xff) - Math.round(255*amount));
    const b = Math.max(0, (n&0xff) - Math.round(255*amount));
    return `#${((r<<16)|(g<<8)|b).toString(16).padStart(6,'0')}`;
  }

  return {
    SKIN_COLORS, HAIR_COLORS, EYE_COLORS,
    EYE_TYPES, NOSE_TYPES, MOUTH_TYPES, HAIR_TYPES,
    drawFace, drawFaceTexture, drawIcon
  };
})();
