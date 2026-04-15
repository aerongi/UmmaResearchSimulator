'use strict';

const state = {
  hairColor:      'hc_0',
  faceType:       'face1',
  eyeType:        'eye1',
  eyebrowType:    'eyebrow1',
  noseType:       'nose1',
  mouthType:      'mouth1',
  frontHairType:  'hair1',
  backHairType:   'bhair1',
  clothingColor:  'cl_yellow',   // 기본 노란색
  personality:    {},
};

const QUESTIONS = [
  { dim:'EI', left:'새로운 사람을 만나면 피곤하고 부담스럽다',   right:'새로운 사람을 만나면 신나고 활력이 된다'   },
  { dim:'EI', left:'혼자 있는 시간이 진정한 충전이다',           right:'사람들과 함께할 때 더 에너지가 생긴다'     },
  { dim:'SN', left:'지금 눈앞의 현실과 사실에 집중한다',          right:'앞으로의 가능성과 큰 그림을 상상한다'      },
  { dim:'SN', left:'계획할 때 구체적인 단계를 하나씩 정한다',     right:'계획할 때 방향만 잡고 흐름에 맡긴다'       },
  { dim:'TF', left:'중요한 결정은 논리와 효율로 내린다',          right:'중요한 결정은 감정과 관계를 먼저 생각한다' },
  { dim:'TF', left:'친구가 힘들 때 해결책을 먼저 제시한다',       right:'친구가 힘들 때 감정부터 공감해준다'        },
  { dim:'JP', left:'내 일상은 계획적이고 규칙적이다',             right:'내 일상은 즉흥적이고 유연하다'            },
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

let _previewPending = false;
async function drawPreview() {
  if (_previewPending) return;
  _previewPending = true;
  await FaceParts.drawPreview(
    document.getElementById('preview-canvas').getContext('2d'), state
  );
  _previewPending = false;
}

function buildFaceGrids() {
  buildGrid('face-grid', 'face', FaceParts.FACE_TYPES, 'faceType');

  const eyePanel = document.getElementById('sub-eyes');
  eyePanel.appendChild(_sectionTitle('눈'));
  eyePanel.insertAdjacentHTML('beforeend','<div class="parts-grid" id="eyes-grid"></div>');
  buildGrid('eyes-grid', 'eyes', FaceParts.EYE_TYPES, 'eyeType');

  const browTitle = _sectionTitle('눈썹');
  browTitle.style.marginTop = '18px';
  eyePanel.appendChild(browTitle);
  eyePanel.insertAdjacentHTML('beforeend','<div class="parts-grid" id="eyebrow-grid"></div>');
  buildGrid('eyebrow-grid', 'eyebrow', FaceParts.EYEBROW_TYPES, 'eyebrowType');

  buildGrid('nose-grid',  'nose',  FaceParts.NOSE_TYPES,  'noseType');
  buildGrid('mouth-grid', 'mouth', FaceParts.MOUTH_TYPES, 'mouthType');
}

function buildHairPanel() {
  const panel = document.getElementById('panel-hair');
  function makeSection(label, gridId, types, stateKey, partType) {
    const wrap = document.createElement('div'); wrap.style.marginBottom='20px';
    wrap.appendChild(_sectionTitle(label));
    const grid = document.createElement('div'); grid.className='parts-grid'; grid.id=gridId;
    wrap.appendChild(grid); panel.appendChild(wrap);
    buildGrid(gridId, partType, types, stateKey);
  }
  makeSection('앞머리','front-hair-grid',FaceParts.FRONT_HAIR_TYPES,'frontHairType','fronthair');
  makeSection('뒷머리','back-hair-grid', FaceParts.BACK_HAIR_TYPES, 'backHairType', 'backhair');
  panel.appendChild(_colorSection('머리색', FaceParts.HAIR_COLORS, 'hairColor'));
}

function buildClothingPanel() {
  const panel = document.getElementById('panel-clothing');
  const intro = document.createElement('div');
  intro.style.cssText='font-size:12px;color:#999;margin-bottom:16px;';
  intro.textContent='캐릭터 옷 색상을 선택하세요.';
  panel.appendChild(intro);
  const grid = document.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:repeat(5,1fr);gap:12px;';
  FaceParts.CLOTHING_COLORS.forEach(c => {
    const wrap = document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;';
    const circle = document.createElement('div');
    circle.style.cssText=`width:40px;height:40px;border-radius:50%;background:${c.hex};
      border:3px solid ${c.id===state.clothingColor?'#007AFF':'transparent'};
      box-shadow:inset 0 0 0 1px rgba(0,0,0,0.1),0 1px 4px rgba(0,0,0,0.12);transition:border-color 0.15s;`;
    const lbl = document.createElement('div');
    lbl.style.cssText='font-size:10px;color:#888;'; lbl.textContent=c.label;
    wrap.append(circle,lbl);
    wrap.addEventListener('click',()=>{
      state.clothingColor=c.id;
      grid.querySelectorAll('div>div:first-child').forEach(d=>d.style.borderColor='transparent');
      circle.style.borderColor='#007AFF';
      drawPreview();
    });
    grid.appendChild(wrap);
  });
  panel.appendChild(grid);
}

function buildPersonalityPanel() {
  const container = document.getElementById('personality-questions');
  const intro = document.createElement('div'); intro.className='pers-intro';
  intro.textContent='직관적으로 느껴지는 대로 선택하세요.'; container.appendChild(intro);
  QUESTIONS.forEach((q,idx)=>{
    const item=document.createElement('div'); item.className='question-item';
    const qt=document.createElement('div'); qt.className='question-text';
    qt.textContent=`Q${idx+1}. 나와 더 가까운 것은?`; item.appendChild(qt);
    const row=document.createElement('div'); row.className='scale-row';
    const lL=document.createElement('div'); lL.className='scale-label';       lL.textContent=q.left;
    const lR=document.createElement('div'); lR.className='scale-label right'; lR.textContent=q.right;
    const boxes=document.createElement('div'); boxes.className='scale-boxes';
    for(let i=1;i<=6;i++){
      const box=document.createElement('div'); box.className='scale-box'; box.dataset.val=i;
      box.addEventListener('click',()=>{
        state.personality[`q${idx}`]=i;
        boxes.querySelectorAll('.scale-box').forEach(b=>b.classList.remove('selected'));
        box.classList.add('selected'); checkComplete();
      });
      boxes.appendChild(box);
    }
    row.append(lL,boxes,lR); item.appendChild(row); container.appendChild(item);
  });
}

function buildGrid(containerId, partType, types, stateKey) {
  const container = document.getElementById(containerId);
  types.forEach(t=>{
    const item=document.createElement('div');
    item.className='part-item'+(t.id===state[stateKey]?' selected':'');
    item.dataset.id=t.id;
    const ic=document.createElement('canvas'); ic.width=90; ic.height=90;
    FaceParts.drawIcon(ic,partType,t.id,state);
    item.appendChild(ic);
    item.addEventListener('click',()=>{
      state[stateKey]=t.id;
      container.querySelectorAll('.part-item').forEach(el=>el.classList.remove('selected'));
      item.classList.add('selected'); drawPreview(); refreshIcons();
    });
    container.appendChild(item);
  });
}

function _colorSection(label,colors,stateKey){
  const sec=document.createElement('div'); sec.className='color-section';
  const lbl=document.createElement('div'); lbl.className='color-label'; lbl.textContent=label;
  const grid=document.createElement('div'); grid.className='color-grid';
  colors.forEach(c=>{
    const dot=_dot(c.hex,c.id===state[stateKey],()=>{
      state[stateKey]=c.id;
      grid.querySelectorAll('.color-dot').forEach(d=>d.classList.remove('selected'));
      dot.classList.add('selected'); drawPreview(); refreshIcons();
    });
    grid.appendChild(dot);
  });
  sec.append(lbl,grid); return sec;
}

function _sectionTitle(text){
  const el=document.createElement('div');
  el.style.cssText='font-size:11px;font-weight:600;color:#999;margin-bottom:8px;letter-spacing:0.8px;text-transform:uppercase;';
  el.textContent=text; return el;
}
function _dot(hex,selected,onClick){
  const d=document.createElement('div');
  d.className='color-dot'+(selected?' selected':'');
  d.style.background=hex; d.addEventListener('click',onClick); return d;
}
function refreshIcons(){
  document.querySelectorAll('.part-item').forEach(item=>{
    const canvas=item.querySelector('canvas'); if(!canvas) return;
    const gridId=item.closest('.parts-grid')?.id;
    const map={'face-grid':'face','eyes-grid':'eyes','eyebrow-grid':'eyebrow',
               'nose-grid':'nose','mouth-grid':'mouth',
               'front-hair-grid':'fronthair','back-hair-grid':'backhair'};
    const pt=map[gridId]; if(pt) FaceParts.drawIcon(canvas,pt,item.dataset.id,state);
  });
}
function setupCategoryTabs(){
  document.querySelectorAll('.cat-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      document.querySelectorAll('.cat-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.category-panel').forEach(p=>p.classList.add('hidden'));
      document.getElementById(`panel-${tab.dataset.cat}`).classList.remove('hidden');
    });
  });
}
function setupSubTabs(){
  document.querySelectorAll('.sub-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      tab.closest('.sub-tabs').querySelectorAll('.sub-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.sub-panel').forEach(p=>p.classList.add('hidden'));
      document.getElementById(`sub-${tab.dataset.sub}`).classList.remove('hidden');
    });
  });
}
function setupCompleteBtn(){
  document.getElementById('complete-btn').addEventListener('click',e=>{
    if(!e.currentTarget.classList.contains('active')) return; showResult();
  });
}
function checkComplete(){
  if(Object.keys(state.personality).length>=QUESTIONS.length){
    const btn=document.getElementById('complete-btn');
    btn.classList.add('active'); btn.disabled=false;
  }
}
function computeMBTI(){
  const sc={EI:0,SN:0,TF:0,JP:0};
  QUESTIONS.forEach((q,i)=>{sc[q.dim]+=(state.personality[`q${i}`]||3.5)-3.5;});
  return (sc.EI>=0?'E':'I')+(sc.SN>=0?'N':'S')+(sc.TF>=0?'F':'T')+(sc.JP>=0?'P':'J');
}
function showResult(){
  const mbti=computeMBTI();
  const data=MBTI_DATA[mbti]||{name:'독특한 유형',desc:'세상에 하나뿐인 특별한 성격입니다.'};
  document.getElementById('mbti-type-display').textContent=mbti;
  document.querySelector('.mbti-name').textContent=data.name;
  document.getElementById('mbti-desc-display').textContent=data.desc;
  document.getElementById('customize-screen').classList.add('hidden');
  document.getElementById('result-screen').classList.remove('hidden');
  document.getElementById('next-btn').addEventListener('click',()=>{
    localStorage.setItem('charData',JSON.stringify({...state,mbti,mbtiName:data.name}));
    window.location.href='game.html';
  },{once:true});
}
