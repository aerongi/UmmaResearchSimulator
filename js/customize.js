'use strict';

/* ══════════════════════════════════════════
   State
══════════════════════════════════════════ */
const state = {
  skinColor:  'skin_0',
  hairColor:  'hc_0',
  eyeColor:   'ec_0',
  eyeType:    'eye_round',
  noseType:   'nose_button',
  mouthType:  'mouth_smile',
  hairType:   'hair_short',
  personality: {},   // { q0: 1-6, q1: 1-6, ... }
};

/* ══════════════════════════════════════════
   Personality Questions  (8 questions, 4 MBTI dims)
   dims: E/I → q0,q1 | S/N → q2,q3 | T/F → q4,q5 | J/P → q6,q7
   scale 1-3 = left label, 4-6 = right label
══════════════════════════════════════════ */
const QUESTIONS = [
  { dim:'EI', left:'새로운 사람을 만나면 피곤하고 부담스럽다',    right:'새로운 사람을 만나면 신나고 활력이 된다',      rightSide:'E' },
  { dim:'EI', left:'혼자 있는 시간이 진정한 충전이다',           right:'사람들과 함께할 때 더 에너지가 생긴다',         rightSide:'E' },
  { dim:'SN', left:'지금 눈앞의 현실과 사실에 집중한다',          right:'앞으로의 가능성과 큰 그림을 상상한다',          rightSide:'N' },
  { dim:'SN', left:'계획할 때 구체적인 단계를 하나씩 정한다',     right:'계획할 때 방향만 잡고 흐름에 맡긴다',            rightSide:'N' },
  { dim:'TF', left:'중요한 결정은 논리와 효율로 내린다',          right:'중요한 결정은 감정과 관계를 먼저 생각한다',      rightSide:'F' },
  { dim:'TF', left:'친구가 힘들 때 해결책을 먼저 제시한다',       right:'친구가 힘들 때 감정부터 공감해준다',             rightSide:'F' },
  { dim:'JP', left:'내 일상은 계획적이고 규칙적이다',             right:'내 일상은 즉흥적이고 유연하다',                  rightSide:'P' },
  { dim:'JP', left:'마감이 있으면 미리 여유있게 준비한다',        right:'마감이 있으면 막판에 집중력이 폭발한다',          rightSide:'P' },
];

const MBTI_DATA = {
  INTJ:{ name:'전략가',      desc:'독립적이고 결단력 있는 사상가. 혼자서도 뚜렷한 목표를 향해 나아가며, 깊은 통찰력으로 세상을 바라봅니다.' },
  INTP:{ name:'논리술사',    desc:'논리와 분석을 사랑하는 지식 탐구자. 복잡한 시스템을 이해하는 데 탁월한 능력을 지닙니다.' },
  ENTJ:{ name:'통솔자',      desc:'타고난 리더십으로 목표를 향해 돌진하는 결단력 있는 인물. 큰 그림을 보며 조직을 이끕니다.' },
  ENTP:{ name:'변론가',      desc:'지적 호기심이 넘치는 혁신가. 새로운 아이디어를 탐색하고 토론을 즐기는 자유로운 영혼입니다.' },
  INFJ:{ name:'옹호자',      desc:'깊은 공감 능력과 이상주의를 가진 통찰력 있는 조언자. 조용히 세상에 좋은 영향을 주고 싶어합니다.' },
  INFP:{ name:'중재자',      desc:'가치관과 감수성이 풍부한 이상주의자. 진정성 있는 삶을 추구하며 타인을 깊이 이해합니다.' },
  ENFJ:{ name:'선도자',      desc:'카리스마와 공감 능력을 갖춘 천성적 리더. 사람들의 성장을 도우며 함께 빛나고 싶어합니다.' },
  ENFP:{ name:'활동가',      desc:'열정적이고 창의적인 자유로운 영혼. 새로운 가능성을 발견하고 사람들과 연결되는 것을 즐깁니다.' },
  ISTJ:{ name:'현실주의자',  desc:'책임감 있고 신뢰할 수 있는 실용주의자. 전통과 규칙을 중시하며 묵묵히 자기 역할을 완수합니다.' },
  ISFJ:{ name:'수호자',      desc:'헌신적이고 따뜻한 마음의 소유자. 소중한 사람들을 지키고 돌보는 데서 보람을 느낍니다.' },
  ESTJ:{ name:'경영자',      desc:'질서와 체계를 중시하는 현실적인 관리자. 효율적으로 목표를 달성하고 조직을 이끌어 나갑니다.' },
  ESFJ:{ name:'집정관',      desc:'친절하고 사교적인 공감자. 주변 사람들의 필요를 먼저 생각하며 조화로운 관계를 만들어 갑니다.' },
  ISTP:{ name:'장인',        desc:'호기심 많고 관찰력이 뛰어난 분석가. 손으로 직접 탐구하며 실용적인 문제 해결을 즐깁니다.' },
  ISFP:{ name:'모험가',      desc:'개방적이고 유연한 예술적 감성의 소유자. 아름다운 것을 발견하고 자유로운 삶을 즐깁니다.' },
  ESTP:{ name:'기업가',      desc:'대담하고 관찰력 있는 행동파. 현재 순간을 즐기며 위험도 즐겁게 받아들이는 모험가입니다.' },
  ESFP:{ name:'연예인',      desc:'자발적이고 활기 넘치는 엔터테이너. 사람들과 어울리고 즐거운 순간을 만드는 것을 사랑합니다.' },
};

/* ══════════════════════════════════════════
   Init
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  buildSkinRow();
  buildFaceGrids();
  buildHairGrid();
  buildPersonalityPanel();
  setupCategoryTabs();
  setupSubTabs();
  setupCompleteBtn();
  drawPreview();
});

/* ── Preview ── */
function drawPreview() {
  const canvas = document.getElementById('preview-canvas');
  const ctx = canvas.getContext('2d');
  FaceParts.drawFace(ctx, state);
}

/* ── Skin row (under preview) ── */
function buildSkinRow() {
  const row = document.querySelector('.skin-row');
  FaceParts.SKIN_COLORS.forEach(c => {
    const dot = document.createElement('div');
    dot.className = 'color-dot' + (c.id === state.skinColor ? ' selected' : '');
    dot.style.background = c.hex;
    dot.title = c.label;
    dot.addEventListener('click', () => {
      state.skinColor = c.id;
      row.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      drawPreview();
      refreshIcons();
    });
    row.appendChild(dot);
  });
}

/* ── Face Grids (eyes / nose / mouth) ── */
function buildFaceGrids() {
  buildGrid('eyes-grid',  'eyes',  FaceParts.EYE_TYPES,   'eyeType');
  buildGrid('nose-grid',  'nose',  FaceParts.NOSE_TYPES,   'noseType');
  buildGrid('mouth-grid', 'mouth', FaceParts.MOUTH_TYPES,  'mouthType');

  // Eye color picker
  const eyePanel = document.getElementById('sub-eyes');
  const eyeColorSec = makeColorSection('눈 색', 'eye-color-grid', FaceParts.EYE_COLORS, 'eyeColor');
  eyePanel.appendChild(eyeColorSec);
}

/* ── Hair Grid ── */
function buildHairGrid() {
  buildGrid('hair-grid', 'hair', FaceParts.HAIR_TYPES, 'hairType');

  const hairColorSec = makeColorSection('머리색', 'hair-color-grid', FaceParts.HAIR_COLORS, 'hairColor');
  document.getElementById('panel-hair').appendChild(hairColorSec);
}

/* ── Grid builder ── */
function buildGrid(containerId, partType, types, stateKey) {
  const container = document.getElementById(containerId);
  types.forEach(t => {
    const item = document.createElement('div');
    item.className = 'part-item' + (t.id === state[stateKey] ? ' selected' : '');
    item.dataset.id = t.id;

    const iconCanvas = document.createElement('canvas');
    iconCanvas.width = 90; iconCanvas.height = 90;
    FaceParts.drawIcon(iconCanvas, partType, t.id, state);
    item.appendChild(iconCanvas);

    item.addEventListener('click', () => {
      state[stateKey] = t.id;
      container.querySelectorAll('.part-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      drawPreview();
      refreshIcons();
    });
    container.appendChild(item);
  });
}

/* ── Color section builder ── */
function makeColorSection(label, id, colors, stateKey) {
  const sec = document.createElement('div');
  sec.className = 'color-section';
  const lbl = document.createElement('div');
  lbl.className = 'color-label';
  lbl.textContent = label;
  sec.appendChild(lbl);

  const grid = document.createElement('div');
  grid.className = 'color-grid';
  grid.id = id;

  colors.forEach(c => {
    const dot = document.createElement('div');
    dot.className = 'color-dot' + (c.id === state[stateKey] ? ' selected' : '');
    dot.style.background = c.hex;
    dot.addEventListener('click', () => {
      state[stateKey] = c.id;
      grid.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      drawPreview();
      refreshIcons();
    });
    grid.appendChild(dot);
  });
  sec.appendChild(grid);
  return sec;
}

/* ── Refresh icon canvases after skin/hair/eye color change ── */
function refreshIcons() {
  document.querySelectorAll('.part-item').forEach(item => {
    const canvas = item.querySelector('canvas');
    if (!canvas) return;
    const gridId = item.closest('.parts-grid').id;
    const partType = {
      'eyes-grid':'eyes','nose-grid':'nose','mouth-grid':'mouth','hair-grid':'hair'
    }[gridId];
    if (partType) FaceParts.drawIcon(canvas, partType, item.dataset.id, state);
  });
}

/* ── Personality Panel ── */
function buildPersonalityPanel() {
  const container = document.getElementById('personality-questions');

  const intro = document.createElement('div');
  intro.className = 'pers-intro';
  intro.textContent = '직관적으로 느껴지는 대로 선택하세요.';
  container.appendChild(intro);

  QUESTIONS.forEach((q, idx) => {
    const item = document.createElement('div');
    item.className = 'question-item';

    const qText = document.createElement('div');
    qText.className = 'question-text';
    qText.textContent = `Q${idx+1}. 나와 더 가까운 것은?`;
    item.appendChild(qText);

    const row = document.createElement('div');
    row.className = 'scale-row';

    const leftLbl = document.createElement('div');
    leftLbl.className = 'scale-label';
    leftLbl.textContent = q.left;

    const boxes = document.createElement('div');
    boxes.className = 'scale-boxes';

    const rightLbl = document.createElement('div');
    rightLbl.className = 'scale-label right';
    rightLbl.textContent = q.right;

    for (let i = 1; i <= 6; i++) {
      const box = document.createElement('div');
      box.className = 'scale-box';
      box.dataset.val = i;
      box.addEventListener('click', () => {
        state.personality[`q${idx}`] = i;
        boxes.querySelectorAll('.scale-box').forEach(b => b.classList.remove('selected'));
        box.classList.add('selected');
        checkComplete();
      });
      boxes.appendChild(box);
    }

    row.appendChild(leftLbl);
    row.appendChild(boxes);
    row.appendChild(rightLbl);
    item.appendChild(row);
    container.appendChild(item);
  });
}

/* ── Category Tabs ── */
function setupCategoryTabs() {
  const tabs = document.querySelectorAll('.cat-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.category-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`panel-${tab.dataset.cat}`).classList.remove('hidden');
    });
  });
}

/* ── Sub-tabs (Eyes / Nose / Mouth) ── */
function setupSubTabs() {
  const subTabs = document.querySelectorAll('.sub-tab');
  subTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      subTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.sub-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`sub-${tab.dataset.sub}`).classList.remove('hidden');
    });
  });
}

/* ── Complete Button ── */
function setupCompleteBtn() {
  const btn = document.getElementById('complete-btn');
  btn.addEventListener('click', () => {
    if (!btn.classList.contains('active')) return;
    showResult();
  });
}

function checkComplete() {
  const answered = Object.keys(state.personality).length;
  const btn = document.getElementById('complete-btn');
  if (answered >= QUESTIONS.length) {
    btn.classList.add('active');
    btn.disabled = false;
  }
}

/* ── Compute MBTI ── */
function computeMBTI() {
  const score = { EI: 0, SN: 0, TF: 0, JP: 0 };
  QUESTIONS.forEach((q, i) => {
    const val = (state.personality[`q${i}`] || 3.5) - 3.5; // -2.5 ~ +2.5
    score[q.dim] += val; // positive = right side
  });
  // dim → letter: positive right = E, N, F, P
  const e = score.EI >= 0 ? 'E' : 'I';
  const n = score.SN >= 0 ? 'N' : 'S';
  const f = score.TF >= 0 ? 'F' : 'T';
  const p = score.JP >= 0 ? 'P' : 'J';
  return e + (e==='E'?'':'') + n + f + p; // MBTI string
}

/* ── Show Result Screen ── */
function showResult() {
  const mbti = computeMBTI();
  const data = MBTI_DATA[mbti] || { name: '독특한 유형', desc: '세상에 하나뿐인 특별한 성격입니다.' };

  document.getElementById('mbti-type-display').textContent = mbti;
  const nameEl = document.getElementById('mbti-type-display').nextElementSibling ||
    (() => { const d = document.createElement('div'); d.className='mbti-name'; document.querySelector('.result-card').insertBefore(d, document.getElementById('mbti-desc-display')); return d; })();
  document.querySelector('.mbti-name') && (document.querySelector('.mbti-name').textContent = data.name);
  document.getElementById('mbti-desc-display').textContent = data.desc;

  document.getElementById('customize-screen').classList.add('hidden');
  document.getElementById('result-screen').classList.remove('hidden');

  document.getElementById('next-btn').addEventListener('click', () => {
    // Save to localStorage for game scene
    const save = { ...state, mbti, mbtiName: data.name };
    localStorage.setItem('charData', JSON.stringify(save));
    window.location.href = 'game.html';
  }, { once: true });
}
