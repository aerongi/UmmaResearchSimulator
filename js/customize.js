'use strict';

/* ════════════ 인트로/아웃트로 ════════════ */
const introScript = [
  { text: "이 세계에는 '엄마' 라는 존재가 있단다." },
  { text: "그 존재는 세상에 태어난 생명체라면 모두 가지고 있는 존재였지." },
  { text: "사람들은 흔히 엄마를 강인한 존재라 말하지만, 사실 그 단어로 엄마를 설명하기엔 어려움이 있지." },
  { text: "'엄마' 라는 단어를 뛰어넘어, 그녀의 진정한 모습을 다시 세상 밖으로 꺼낼 시간이 왔어." },
  { text: "네 손끝에서 다시 태어날 그녀의 우아한 일대기를... 이 세계가 숨을 죽이고 기다리고 있단다." },
  { text: "그런데... 너는 딸인가 아들인가?" },
  { choice: [ {text:'딸', value:'daughter'}, {text:'아들', value:'son'} ], key: 'childType' },
  { text: "네 이름은 무엇이지?" },
  { textInput: { prompt: '네 이름은?', key: 'playerName' } },
  { text: "네 이름은 {playerName}이구나! 네 엄마의 이름은 무엇이지?" },
  { textInput: { prompt: '엄마의 이름은?', key: 'momName' } },
  { text: "그럼 너의 엄마는 어떤 사람인지 알려주렴!" },
  { action: 'goCustomize' },
];

const outroScript = [
  { text: "그럼 이제부터 너와 엄마의 일주일간의 연구가 시작된다. 준비는 됐나?" },
  { text: "자, 가자! 엄마와 너의 세계로!" },
  { action: 'goGame' },
];

let _curScript = null, _idx = 0;
let _typing = false, _full = '', _timer = null, _waiting = false;
let _inChoice = false, _inInput = false;

function introInterpolate(text) {
  return text.replace(/\{(\w+)\}/g, (m, k) => localStorage.getItem(k) || '');
}

function runScript(script) {
  _curScript = script; _idx = 0;
  nextIntroLine();
}
function nextIntroLine() {
  if (_idx >= _curScript.length) return;
  const line = _curScript[_idx++];
  if (line.action === 'goCustomize') { fadeToCustomize(); return; }
  if (line.action === 'goGame')      { fadeToGame(); return; }
  if (line.choice)    { showIntroChoice(line); return; }
  if (line.textInput) { showIntroInput(line.textInput); return; }
  document.getElementById('intro-dialog-arrow').style.display = 'none';
  typeIntro(introInterpolate(line.text), () => {
    _waiting = true;
    document.getElementById('intro-dialog-arrow').style.display = 'block';
  });
}
function typeIntro(text, onDone) {
  const el = document.getElementById('intro-dialog-text');
  _full = text; _typing = true; el.textContent = ''; let i = 0;
  _timer = setInterval(() => {
    if (i < text.length) el.textContent += text[i++];
    else { clearInterval(_timer); _typing = false; onDone(); }
  }, 45);
}
function finishIntroTyping() {
  clearInterval(_timer);
  document.getElementById('intro-dialog-text').textContent = _full;
  _typing = false; _waiting = true;
  document.getElementById('intro-dialog-arrow').style.display = 'block';
}
function advanceIntro() {
  if (_inChoice || _inInput) return;
  if (_typing) { finishIntroTyping(); return; }
  if (_waiting) {
    _waiting = false;
    document.getElementById('intro-dialog-arrow').style.display = 'none';
    nextIntroLine();
  }
}
function showIntroChoice(line) {
  _inChoice = true;
  const ov = document.createElement('div');
  ov.className = 'intro-choice-overlay';
  line.choice.forEach(opt => {
    const b = document.createElement('button');
    b.className = 'intro-choice-btn';
    b.textContent = opt.text;
    b.addEventListener('click', e => {
      e.stopPropagation();
      localStorage.setItem(line.key, opt.value);
      ov.remove(); _inChoice = false; nextIntroLine();
    });
    ov.appendChild(b);
  });
  document.getElementById('intro-screen').appendChild(ov);
}
function showIntroInput(cfg) {
  _inInput = true;
  const ov = document.createElement('div');
  ov.className = 'intro-input-overlay';
  ov.innerHTML = `
    <div class="intro-input-box">
      <input type="text" class="intro-input-field" maxlength="10" placeholder="${cfg.prompt}">
      <button class="intro-input-confirm">완료!</button>
    </div>`;
  document.getElementById('intro-screen').appendChild(ov);
  const input = ov.querySelector('.intro-input-field');
  input.focus();
  const done = (e) => {
    if (e) e.stopPropagation();
    const v = input.value.trim();
    if (!v) return;
    localStorage.setItem(cfg.key, v);
    ov.remove(); _inInput = false; nextIntroLine();
  };
  ov.querySelector('.intro-input-confirm').addEventListener('click', done);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); done(e); }
    e.stopPropagation();
  });
}

/* 인트로 끝 → 커마 화면으로 (오버레이 페이드아웃) */
function fadeToCustomize() {
  const intro = document.getElementById('intro-screen');
  intro.classList.add('fade-out');
  setTimeout(() => { intro.style.display = 'none'; }, 800);
}

/* 아웃트로 시작 (커마 완료 후 박사 재등장) */
function showOutro() {
  const intro = document.getElementById('intro-screen');
  intro.classList.remove('hidden', 'fade-out');
  intro.style.display = 'flex';
  intro.style.opacity = '0';
  requestAnimationFrame(() => {
    intro.style.transition = 'opacity 0.8s';
    intro.style.opacity = '1';
  });
  setTimeout(() => runScript(outroScript), 800);
}

/* 아웃트로 끝 → 게임으로 (하얗게 페이드) */
function fadeToGame() {
  document.body.style.transition = 'opacity 0.6s';
  document.body.style.opacity = '0';
  setTimeout(() => { location.href = 'game.html'; }, 600);
}

/* 시작 */
window.addEventListener('load', () => {
  const bg = document.getElementById('intro-bg');
  bg.style.background = '#ffe0ec';            // 흰색 → 연분홍 페이드
  setTimeout(() => bg.classList.add('cycling'), 2000);  // 이후 무지개 순환
  document.getElementById('intro-screen').addEventListener('click', advanceIntro);
  runScript(introScript);
});


const state = {
  hairColor:      'hc_0',
  faceType:       'face1',
  eyeType:        'eye1',
  eyebrowType:    'eyebrow1',
  noseType:       'nose1',
  mouthType:      'mouth1',
  frontHairType:  'hair1',
  backHairType:   'bhair1',
  clothingColor:  'cl_yellow',
  personality:    {},
};

const QUESTIONS = [
  { dim:'EI', left:'새로운 사람을 만나면 피곤하고 부담스럽다',   right:'새로운 사람을 만나면 신나고 활력이 된다'   },
  { dim:'SN', left:'지금 눈앞의 현실과 사실에 집중한다',          right:'앞으로의 가능성과 큰 그림을 상상한다'      },
  { dim:'TF', left:'친구가 힘들 때 해결책을 먼저 제시한다',       right:'친구가 힘들 때 감정부터 공감해준다'        },
  { dim:'JP', left:'마감이 있으면 미리 여유있게 준비한다',        right:'마감이 있으면 막판에 집중력이 폭발한다'    },
];

const MBTI_DATA = {
  INTJ:{ name:'전략가',     desc:'독립적이고 결단력 있는 사상가. 혼자서도 뚜렷한 목표를 향해 나아가며 깊은 통찰력으로 세상을 바라봅니다.' },
  INTP:{ name:'논리술사',   desc:'논리와 분석을 사랑하는 지식 탐구자. 복잡한 시스템을 이해하는 데 탁월한 능력을 지닙니다.' },
  ENTJ:{ name:'통솔자',     desc:'타고난 리더십으로 목표를 향해 돌진하는 결단력 있는 인물. 큰 그림을 보며 조직을 이끕니다.' },
  ENTP:{ name:'변론가',     desc:'지적 호기심이 넘치는 혁신가. 새로운 아이디어를 탐색하고 토론을 즐기는 자유로운 영혼입니다.' },
  INFJ:{ name:'옹호자',     desc:'깊은 공감 능력과 이상주의를 가진 통찰력 있는 조언자. 조용히 세상에 좋은 영향을 주고 싶어합니다.' },
  INFP:{ name:'중재자',     desc:'가치관과 감수성이 풍부한 이상주의자. 진정성 있는 삶을 추구하며 타인을 깊이 이해합니다.' },
  ENFJ:{ name:'선도자',     desc:'카리스마와 공감 능력을 갖춘 천성적 리더. 사람들의 성장을 도우며 함께 빛나고 싶어합니다.' },
  ENFP:{ name:'활동가',     desc:'열정적이고 창의적인 자유로운 영혼. 새로운 가능성을 발견하고 사람들과 연결되는 것을 즐깁니다.' },
  ISTJ:{ name:'현실주의자', desc:'책임감 있고 신뢰할 수 있는 실용주의자. 전통과 규칙을 중시하며 묵묵히 자기 역할을 완수합니다.' },
  ISFJ:{ name:'수호자',     desc:'헌신적이고 따뜻한 마음의 소유자. 소중한 사람들을 지키고 돌보는 데서 보람을 느낍니다.' },
  ESTJ:{ name:'경영자',     desc:'질서와 체계를 중시하는 현실적인 관리자. 효율적으로 목표를 달성하고 조직을 이끌어 나갑니다.' },
  ESFJ:{ name:'집정관',     desc:'친절하고 사교적인 공감자. 주변 사람들의 필요를 먼저 생각하며 조화로운 관계를 만들어 갑니다.' },
  ISTP:{ name:'장인',       desc:'호기심 많고 관찰력이 뛰어난 분석가. 손으로 직접 탐구하며 실용적인 문제 해결을 즐깁니다.' },
  ISFP:{ name:'모험가',     desc:'개방적이고 유연한 예술적 감성의 소유자. 아름다운 것을 발견하고 자유로운 삶을 즐깁니다.' },
  ESTP:{ name:'기업가',     desc:'대담하고 관찰력 있는 행동파. 현재 순간을 즐기며 위험도 즐겁게 받아들이는 모험가입니다.' },
  ESFP:{ name:'연예인',     desc:'자발적이고 활기 넘치는 엔터테이너. 사람들과 어울리고 즐거운 순간을 만드는 것을 사랑합니다.' },
};

document.addEventListener('DOMContentLoaded', () => {
  buildFaceGrids();
  buildHairPanel();
  buildClothingPanel();
  buildPersonalityPanel();
  setupCategoryTabs();
  setupSubTabs();
  setupCompleteBtn();
  drawPreview();
});

/* ── 미리보기 ───────────────────────────────────── */
let _previewPending = false;
async function drawPreview() {
  if (_previewPending) return;
  _previewPending = true;
  await FaceParts.drawPreview(
    document.getElementById('preview-canvas').getContext('2d'), state
  );
  _previewPending = false;
}

/* ── 얼굴 탭 ────────────────────────────────────── */
function buildFaceGrids() {
  buildGrid('face-grid', 'face', FaceParts.FACE_TYPES, 'faceType');

  const eyePanel = document.getElementById('sub-eyes');
  eyePanel.appendChild(_sectionTitle('눈'));
  eyePanel.insertAdjacentHTML('beforeend', '<div class="parts-grid" id="eyes-grid"></div>');
  buildGrid('eyes-grid', 'eyes', FaceParts.EYE_TYPES, 'eyeType');

  eyePanel.appendChild(_sectionTitle('눈썹'));
  eyePanel.insertAdjacentHTML('beforeend', '<div class="parts-grid" id="eyebrow-grid"></div>');
  buildGrid('eyebrow-grid', 'eyebrow', FaceParts.EYEBROW_TYPES, 'eyebrowType');

  buildGrid('nose-grid',  'nose',  FaceParts.NOSE_TYPES,  'noseType');
  buildGrid('mouth-grid', 'mouth', FaceParts.MOUTH_TYPES, 'mouthType');
}

/* ── 머리스타일 탭 ──────────────────────────────── */
function buildHairPanel() {
  const panel = document.getElementById('panel-hair');

  function makeSection(label, gridId, types, stateKey, partType) {
    panel.appendChild(_sectionTitle(label));
    const grid = document.createElement('div');
    grid.className = 'parts-grid';
    grid.id = gridId;
    panel.appendChild(grid);
    buildGrid(gridId, partType, types, stateKey);
  }

  makeSection('앞머리', 'front-hair-grid', FaceParts.FRONT_HAIR_TYPES, 'frontHairType', 'fronthair');
  makeSection('뒷머리', 'back-hair-grid',  FaceParts.BACK_HAIR_TYPES,  'backHairType',  'backhair');
  panel.appendChild(_colorSection('머리색', FaceParts.HAIR_COLORS, 'hairColor'));
}

/* ── 의상 탭 ────────────────────────────────────── */
function buildClothingPanel() {
  const panel = document.getElementById('panel-clothing');

  const intro = document.createElement('div');
  intro.className = 'intro-text';
  intro.textContent = '캐릭터 옷 색상을 선택하세요.';
  panel.appendChild(intro);

  const grid = document.createElement('div');
  grid.className = 'clothing-grid';

  FaceParts.CLOTHING_COLORS.forEach(c => {
    const item = document.createElement('div');
    item.className = 'clothing-item' + (c.id === state.clothingColor ? ' selected' : '');

    const circle = document.createElement('div');
    circle.className = 'clothing-circle';
    circle.style.background = c.hex;

    const lbl = document.createElement('div');
    lbl.className = 'clothing-label';
    lbl.textContent = c.label;

    item.append(circle, lbl);
    item.addEventListener('click', () => {
      state.clothingColor = c.id;
      grid.querySelectorAll('.clothing-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      drawPreview();
    });
    grid.appendChild(item);
  });
  panel.appendChild(grid);
}

/* ── 성격 탭 ────────────────────────────────────── */
function buildPersonalityPanel() {
  const container = document.getElementById('personality-questions');

  const intro = document.createElement('div');
  intro.className = 'pers-intro';
  intro.textContent = '직관적으로 느껴지는 대로 선택하세요.';
  container.appendChild(intro);

  QUESTIONS.forEach((q, idx) => {
    const item  = document.createElement('div'); item.className  = 'question-item';
    const qText = document.createElement('div'); qText.className = 'question-text';
    qText.textContent = `Q${idx+1}. 나와 더 가까운 것은?`;
    item.appendChild(qText);

    const row   = document.createElement('div'); row.className   = 'scale-row';
    const lL    = document.createElement('div'); lL.className    = 'scale-label';       lL.textContent = q.left;
    const lR    = document.createElement('div'); lR.className    = 'scale-label right'; lR.textContent = q.right;
    const boxes = document.createElement('div'); boxes.className = 'scale-boxes';

    for (let i = 1; i <= 6; i++) {
      const box = document.createElement('div');
      box.className = 'scale-box'; box.dataset.val = i;
      box.addEventListener('click', () => {
        state.personality[`q${idx}`] = i;
        boxes.querySelectorAll('.scale-box').forEach(b => b.classList.remove('selected'));
        box.classList.add('selected');
        checkComplete();
      });
      boxes.appendChild(box);
    }
    row.append(lL, boxes, lR);
    item.appendChild(row);
    container.appendChild(item);
  });
}

/* ── 공통 ───────────────────────────────────────── */
function buildGrid(containerId, partType, types, stateKey) {
  const container = document.getElementById(containerId);
  types.forEach(t => {
    const item = document.createElement('div');
    item.className = 'part-item' + (t.id === state[stateKey] ? ' selected' : '');
    item.dataset.id = t.id;
    const ic = document.createElement('canvas');
    ic.width = 90; ic.height = 90;
    FaceParts.drawIcon(ic, partType, t.id, state);
    item.appendChild(ic);
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

function _colorSection(label, colors, stateKey) {
  const sec = document.createElement('div'); sec.className = 'color-section';
  const lbl = document.createElement('div'); lbl.className = 'color-label'; lbl.textContent = label;
  const grid = document.createElement('div'); grid.className = 'color-grid';
  colors.forEach(c => {
    const dot = _dot(c.hex, c.id === state[stateKey], () => {
      state[stateKey] = c.id;
      grid.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      drawPreview();
      refreshIcons();
    });
    grid.appendChild(dot);
  });
  sec.append(lbl, grid);
  return sec;
}

function _sectionTitle(text) {
  const el = document.createElement('div');
  el.className = 'section-title';
  el.textContent = text;
  return el;
}

function _dot(hex, selected, onClick) {
  const d = document.createElement('div');
  d.className = 'color-dot' + (selected ? ' selected' : '');
  d.style.background = hex;
  d.addEventListener('click', onClick);
  return d;
}

function refreshIcons() {
  document.querySelectorAll('.part-item').forEach(item => {
    const canvas = item.querySelector('canvas'); if (!canvas) return;
    const gridId = item.closest('.parts-grid')?.id;
    const map = {
      'face-grid':'face', 'eyes-grid':'eyes', 'eyebrow-grid':'eyebrow',
      'nose-grid':'nose', 'mouth-grid':'mouth',
      'front-hair-grid':'fronthair', 'back-hair-grid':'backhair',
    };
    const pt = map[gridId];
    if (pt) FaceParts.drawIcon(canvas, pt, item.dataset.id, state);
  });
}

function setupCategoryTabs() {
  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.category-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`panel-${tab.dataset.cat}`).classList.remove('hidden');
    });
  });
}

function setupSubTabs() {
  document.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tab.closest('.sub-tabs').querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.sub-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`sub-${tab.dataset.sub}`).classList.remove('hidden');
    });
  });
}

function setupCompleteBtn() {
  document.getElementById('complete-btn').addEventListener('click', e => {
    if (!e.currentTarget.classList.contains('active')) return;
    showResult();
  });
}

function checkComplete() {
  if (Object.keys(state.personality).length >= QUESTIONS.length) {
    const btn = document.getElementById('complete-btn');
    btn.classList.add('active'); btn.disabled = false;
  }
}

function computeMBTI() {
  const sc = { EI:0, SN:0, TF:0, JP:0 };
  QUESTIONS.forEach((q, i) => { sc[q.dim] += (state.personality[`q${i}`] || 3.5) - 3.5; });
  return (sc.EI>=0?'E':'I') + (sc.SN>=0?'N':'S') + (sc.TF>=0?'F':'T') + (sc.JP>=0?'P':'J');
}

function computeInitialStats() {
	const stats = {
		외향성: 0, 내향성: 0, 감각: 0, 직관: 0,
		논리성: 0, 감정성: 0, 계획성: 0, 융통성: 0, 애정: 0,
	};
	// 칸 1~6: 높을수록 오른쪽(E/N/F/P), 낮을수록 왼쪽(I/S/T/J)
	const map = [
		{ high: '외향성', low: '내향성' },  // Q1 (E/I)
		{ high: '직관',   low: '감각'   },  // Q2 (N/S)
		{ high: '감정성', low: '논리성' },  // Q3 (F/T)
		{ high: '융통성', low: '계획성' },  // Q4 (P/J)
	];
	map.forEach((m, i) => {
		const v = state.personality[`q${i}`] || 3;  // 선택한 칸 (1~6)
		if (v >= 4) stats[m.high] += v - 3;   // 4→1, 5→2, 6→3
		else        stats[m.low]  += 4 - v;   // 3→1, 2→2, 1→3
	});
	return stats;
}

function showResult() {
  const mbti = computeMBTI();
  const data = MBTI_DATA[mbti] || { name:'독특한 유형', desc:'세상에 하나뿐인 특별한 성격입니다.' };
  document.getElementById('mbti-type-display').textContent = mbti;
  document.querySelector('.mbti-name').textContent          = data.name;
  document.getElementById('mbti-desc-display').textContent  = data.desc;
  document.getElementById('customize-screen').classList.add('hidden');
  document.getElementById('result-screen').classList.remove('hidden');
document.getElementById('next-btn').addEventListener('click', () => {
		const initialStats = computeInitialStats();
		localStorage.setItem('charData', JSON.stringify({ ...state, mbti, mbtiName: data.name, initialStats }));

    // [테스트용] 캐릭터 생성 시 통계 기록 — 최종본에선 엔딩으로 옮길 것
    if (window.Stats) {
      Stats.recordCreation({
        childType:   localStorage.getItem('childType') || 'daughter',
        initialMbti: mbti,
      });
    }
		showOutro();
	}, { once: true });
}
