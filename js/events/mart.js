'use strict';

window.event_mart = (() => {

  /* ── 대화 스크립트 ── */
  const dialogues = {
    title: '장 보러 나오기',
    main: [
      { narration: '마트에는 사람이 정말 많다...' },
      { branch: 'momEI', cases: {
        I: [
          { speaker: 'mom', text: '어머, 원래는 이렇게 많지 않은데' },
          { narration: '엄마는 조금 피곤해 보인다...' },
        ],
        E: [
          { speaker: 'mom', text: '어머, 저거 맛있겠다!' },
          { narration: '엄마는 어느새 시식코너의 직원과 대화를 나누고 있다...' },
        ],
      }},
      { narration: '얼추 장을 보고, 과자 코너를 지나치다...' },
      { speaker: 'mom', text: '우리 딸, 과자 먹고 싶은 거 있어? 하나 사서 엄마랑 나눠 먹자.' },
      { choice: [
        { text: '복각칩을 사자',          route: 'route1' },
        { text: '백배로를 사자',          route: 'route2' },
        { text: '엄마가 좋아하는 걸 사자', route: 'route3' },
      ]},
    ],
    route1: [
      { itemReveal: 'mart1', description: '복각칩: 사면 좋아하는 캐릭터가 복각할 확률이 높아진다는 감자칩. 생감자로 만들어졌다.' },
      { speaker: 'mom', text: '복각칩 살 거야? 그래~ 너무 많이 먹진 말고~', expression: 'smile' },
      { narration: '엄마와 장 보기를 마쳤다. 산 과자는 집에서 먹도록 하자.' },
      { end: true, item: 'mart1' },
    ],
    route2: [
      { itemReveal: 'mart2', description: '백배로 갚아야 하는 과자. 11월 11일은 이 과자를 좋아하는 사람에게 선물하고 백배로 갚아오라 협박하는 날인 "백배로데이" 다.' },
      { speaker: 'mom', text: '백배로 살 거야? 우리 딸, 누구한테 선물하려고? 오호호.', expression: 'smile' },
      { narration: '엄마와 장 보기를 마쳤다. 산 과자는 집에서 먹도록 하자.' },
      { end: true, item: 'mart2' },
    ],
    route3: [
      { textInput: { prompt: '내가 살 과자는 어떤 맛?', suffix: '맛', key: 'snack_flavor' } },
      { itemReveal: 'mart3', description: '{snack_flavor}맛 과자.' },
      { speaker: 'mom', text: '{snack_flavor}맛 과자네? 엄마가 좋아하는걸로 골라준거야?' },
      { speaker: 'mom', text: '어머, 너 좋아하는 걸로 사도 되는데~', expression: 'smile' },
      { narration: '엄마는 기분이 좋아 보인다.' },
      { narration: '엄마와 장 보기를 마쳤다. 산 과자는 집에서 먹도록 하자.' },
      { end: true, item: 'mart3' },
    ],
  };

  /* ── 상태 ── */
  let D = {}, clothingHex = '#F5C842';
  let mouthAnimTimer = null;
  let dialogQueue = [], dialogIdx = 0;
  let typingTimer = null, isTyping = false, waitingNext = false;
  let fullText = '';
  let inChoice = false, inReveal = false, inTextInput = false, inTitle = false;
  let currentExpression = 'default';
  let titleDismissCallback = null;
  let mart3D = null;
  let walkState = null;
  let rafId = null;

  function getClothingHex() {
    const item = FaceParts.CLOTHING_COLORS.find(c => c.id === D.clothingColor);
    return item ? item.hex : '#F5C842';
  }
  function incrementCount() {
    const counts = JSON.parse(localStorage.getItem('eventCounts') || '{}');
    counts.mart = (counts.mart || 0) + 1;
    localStorage.setItem('eventCounts', JSON.stringify(counts));
  }
  function interpolate(text) {
    return text.replace(/\{(\w+)\}/g, (m, key) =>
      localStorage.getItem('var_' + key) || '');
  }
  function applyExpression(exp) { if (exp) currentExpression = exp; }
  function getCurrentEyeOverride() {
    return currentExpression === 'smile' ? 'eye_smile' : (D.eyeType || 'eye1');
  }

  /* ── 3D 캐릭터 셋업 ── */
  function setup3D() {
    const canvas = document.getElementById('mart-char-3d');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 1.4, 4);
    camera.lookAt(0, 1.0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 0.4);
    sun.position.set(2, 5, 3);
    scene.add(sun);

    const charGroup = new THREE.Group();
    scene.add(charGroup);

    // 얼굴/뒷머리 텍스처
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 512; faceCanvas.height = 512;
    const faceTex = new THREE.CanvasTexture(faceCanvas);
    faceTex.premultiplyAlpha = false;

    const backHairCanvas = document.createElement('canvas');
    backHairCanvas.width = 512; backHairCanvas.height = 512;
    const backHairTex = new THREE.CanvasTexture(backHairCanvas);
    backHairTex.premultiplyAlpha = false;

    // 얼굴 plane
    const headMat = new THREE.MeshBasicMaterial({
      map: faceTex, transparent: true, alphaTest: 0.01,
      side: THREE.FrontSide, depthWrite: true,
    });
    const headPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.84), headMat);
    headPlane.position.set(0, 1.65, 0.04);
    charGroup.add(headPlane);

    // 뒷머리 plane
    const backHairMat = new THREE.MeshBasicMaterial({
      map: backHairTex, transparent: true, alphaTest: 0.01,
      side: THREE.FrontSide, depthWrite: false,
    });
    const backHairPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.90, 0.90), backHairMat);
    backHairPlane.position.set(0, 1.65, -0.04);
    backHairPlane.rotation.y = Math.PI;
    charGroup.add(backHairPlane);

    // 몸통 + 손
    const clothingMat = new THREE.MeshStandardMaterial({ color: clothingHex, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFDDBB4, roughness: 0.65 });
    function addPart(geo, mat, x, y, z) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      charGroup.add(m);
      return m;
    }
    addPart(new THREE.CylinderGeometry(0.16, 0.19, 0.62, 16), clothingMat, 0, 0.94, 0);
    addPart(new THREE.SphereGeometry(0.19, 16, 8),            clothingMat, 0, 0.63, 0);
    addPart(new THREE.SphereGeometry(0.11, 14, 10), skinMat, -0.42, 0.65, 0);
    addPart(new THREE.SphereGeometry(0.11, 14, 10), skinMat,  0.42, 0.65, 0);

    // 초기 얼굴 그리기
    FaceParts.drawFace(faceCanvas.getContext('2d'), D).then(() => faceTex.needsUpdate = true);
    FaceParts.drawBackHairTexture(backHairCanvas.getContext('2d'), D).then(() => backHairTex.needsUpdate = true);

    function onResize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    onResize();
    window.addEventListener('resize', onResize);

    return { renderer, scene, camera, charGroup, faceCanvas, faceTex, onResize };
  }

  /* ── 얼굴 다시 그리기 (말하기/표정용) ── */
  async function redrawFace(mouthOverride) {
    if (!mart3D) return;
    const ctx = mart3D.faceCanvas.getContext('2d');
    await FaceParts.drawFaceWithOverrides(ctx, D, {
      mouthType: mouthOverride || (D.mouthType || 'mouth1'),
      eyeType:   getCurrentEyeOverride(),
    });
    mart3D.faceTex.needsUpdate = true;
  }

  /* ── 입 움직임 ── */
  function startMouthAnim() {
    stopMouthAnim();
    let open = false;
    mouthAnimTimer = setInterval(() => {
      open = !open;
      redrawFace(open ? 'mouth_open' : (D.mouthType || 'mouth1'));
    }, 150);
  }
  function stopMouthAnim() {
    if (mouthAnimTimer) clearInterval(mouthAnimTimer);
    mouthAnimTimer = null;
    redrawFace(D.mouthType || 'mouth1');
  }

  /* ── 걷기 (왼쪽 → 중앙, 뽀용뽀용) ── */
  function startWalk(onDone) {
    if (!mart3D) { onDone?.(); return; }
    mart3D.charGroup.position.x = -4;
    walkState = {
      startTime: performance.now(),
      duration: 2200,
      fromX: -4,
      toX: 0,
      onDone,
    };
  }
  function updateWalk(now) {
    if (!walkState || !mart3D) return;
    const elapsed = now - walkState.startTime;
    const t = Math.min(1, elapsed / walkState.duration);
    mart3D.charGroup.position.x = walkState.fromX + (walkState.toX - walkState.fromX) * t;
    // 걷는동안 위아래 바운스
    mart3D.charGroup.position.y = (t < 1) ? Math.abs(Math.sin(t * 22)) * 0.09 : 0;
    if (t >= 1) {
      const cb = walkState.onDone;
      walkState = null;
      cb?.();
    }
  }

  /* ── 애니메이션 루프 ── */
  function animate() {
    rafId = requestAnimationFrame(animate);
    updateWalk(performance.now());
    if (mart3D) mart3D.renderer.render(mart3D.scene, mart3D.camera);
  }

  /* ── 타이핑 ── */
  function typeText(text, onDone) {
    const el = document.getElementById('dialog-text');
    fullText = text;
    isTyping = true;
    el.textContent = '';
    let i = 0;
    typingTimer = setInterval(() => {
      if (i < text.length) { el.textContent += text[i++]; }
      else {
        clearInterval(typingTimer);
        isTyping = false;
        onDone();
      }
    }, 35);
  }
  function finishTyping() {
    if (typingTimer) clearInterval(typingTimer);
    document.getElementById('dialog-text').textContent = fullText;
    isTyping = false;
    stopMouthAnim();
    waitingNext = true;
    document.getElementById('dialog-arrow').style.display = 'block';
  }

  /* ── 화자 박스 ── */
  function setupSpeaker(speaker) {
    const box = document.getElementById('speaker-name');
    box.style.display = 'inline-block';
    if (speaker === 'mom') {
      box.style.borderColor = clothingHex;
      box.style.background  = 'rgba(255,255,255,0.95)';
      box.style.color       = '#444';
      box.textContent = '엄마';
    } else {
      box.style.borderColor = '#7a6a58';
      box.style.background  = 'rgba(255,255,255,0.7)';
      box.style.color       = '#7a6a58';
      box.textContent = '나';
    }
  }
  function hideSpeaker() { document.getElementById('speaker-name').style.display = 'none'; }

  /* ── 다음 라인 ── */
  function nextLine() {
    if (dialogIdx >= dialogQueue.length) { endEvent(null); return; }
    const line = dialogQueue[dialogIdx++];
    applyExpression(line.expression);

    if (line.end)        { endEvent(line.item || null); return; }
    if (line.choice)     { showChoices(line.choice); return; }
    if (line.itemReveal) { showItemReveal(line.itemReveal, line.description); return; }
    if (line.textInput)  { showTextInput(line.textInput); return; }
    if (line.branch)     { handleBranch(line); return; }
    if (line.narration)  { showNarration(line.narration); return; }

    setupSpeaker(line.speaker);
    document.getElementById('dialog-arrow').style.display = 'none';
    redrawFace(D.mouthType || 'mouth1');
    if (line.speaker === 'mom') startMouthAnim();

    typeText(interpolate(line.text), () => {
      stopMouthAnim();
      waitingNext = true;
      document.getElementById('dialog-arrow').style.display = 'block';
    });
  }

  function showNarration(text) {
    hideSpeaker();
    stopMouthAnim();
    document.getElementById('dialog-arrow').style.display = 'none';
    redrawFace(D.mouthType || 'mouth1');
    typeText(interpolate(text), () => {
      waitingNext = true;
      document.getElementById('dialog-arrow').style.display = 'block';
    });
  }

  function handleBranch(line) {
    const momMBTI = D.mbti || 'ENFP';
    let key;
    if (line.branch === 'momEI') key = momMBTI[0];
    const sub = (line.cases && line.cases[key]) || [];
    dialogQueue.splice(dialogIdx, 0, ...sub);
    nextLine();
  }

  /* ── 이벤트 타이틀 ── */
  function showTitle(text, onDismiss) {
    inTitle = true;
    titleDismissCallback = onDismiss || (() => nextLine());
    const overlay = document.createElement('div');
    overlay.id = 'title-overlay';
    overlay.innerHTML = `<div class="title-text">${text}</div>`;
    document.getElementById('mart-scene').appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
  }
  function hideTitle() {
    inTitle = false;
    const el = document.getElementById('title-overlay');
    if (el) el.remove();
    const cb = titleDismissCallback;
    titleDismissCallback = null;
    if (cb) cb();
  }

  /* ── 선택지 ── */
  function showChoices(options) {
    inChoice = true;
    const list = document.getElementById('choice-list');
    list.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        inChoice = false;
        document.getElementById('choice-overlay').style.display = 'none';
        dialogQueue = [...dialogues[opt.route]];
        dialogIdx = 0;
        nextLine();
      });
      list.appendChild(btn);
    });
    document.getElementById('choice-overlay').style.display = 'flex';
  }

  /* ── 획득! 아이템 ── */
function showItemReveal(itemName, description) {
  inReveal = true;
  const owned = JSON.parse(localStorage.getItem('ownedItems') || '[]');
  // 새 형식: { name, source } — 어느 이벤트에서 왔는지 같이 기록
  if (!owned.find(it => it && it.name === itemName)) {
    owned.push({ name: itemName, source: 'mart' });
    localStorage.setItem('ownedItems', JSON.stringify(owned));
  }
    const overlay = document.createElement('div');
    overlay.id = 'item-reveal';
    overlay.innerHTML = `
      <div class="reveal-inner">
        <div class="reveal-title">획득!</div>
        <img src="assets/items/${itemName}.png" class="reveal-img">
        ${description ? `<div class="reveal-desc">${interpolate(description)}</div>` : ''}
        <div class="reveal-hint">클릭하거나 키를 눌러 계속</div>
      </div>`;
    document.getElementById('mart-scene').appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
  }
  function hideReveal() {
    const el = document.getElementById('item-reveal');
    if (el) el.remove();
    inReveal = false;
    nextLine();
  }

  /* ── 텍스트 입력 ── */
  function showTextInput(cfg) {
    inTextInput = true;
    const overlay = document.createElement('div');
    overlay.id = 'text-input-overlay';
    overlay.innerHTML = `
      <div class="input-prompt-box">
        <div class="input-prompt">${cfg.prompt}</div>
        <div class="input-row">
          <input type="text" id="text-input-field" maxlength="8" placeholder="">
          <span class="input-suffix">${cfg.suffix}</span>
          <button class="confirm-btn" id="confirm-input">완료!</button>
        </div>
      </div>`;
    document.getElementById('mart-scene').appendChild(overlay);
    const input = document.getElementById('text-input-field');
    input.focus();
    const done = (e) => {
      if (e) e.stopPropagation();
      const v = input.value.trim();
      if (!v) return;
      localStorage.setItem('var_' + cfg.key, v);
      overlay.remove();
      inTextInput = false;
      nextLine();
    };
    document.getElementById('confirm-input').addEventListener('click', done);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); done(e); }
      e.stopPropagation();
    });
  }

  /* ── 입력 처리 ── */
  function advance() {
    if (inChoice || inTextInput) return;
    if (inTitle)  { hideTitle(); return; }
    if (inReveal) { hideReveal(); return; }
    if (isTyping) { finishTyping(); return; }
    if (waitingNext) {
      waitingNext = false;
      document.getElementById('dialog-arrow').style.display = 'none';
      nextLine();
    }
  }
  function handleKey(e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
  }

  /* ── 종료 ── */
  function endEvent(item) {
    if (item) localStorage.setItem('currentItem', item);
    else      localStorage.removeItem('currentItem');

    const dt = JSON.parse(localStorage.getItem('dayTime') || '{"day":1,"time":"morning"}');
    if (dt.time === 'morning') dt.time = 'afternoon';
    else { dt.time = 'morning'; dt.day++; }
    localStorage.setItem('dayTime', JSON.stringify(dt));

    stopMouthAnim();
    document.removeEventListener('keydown', handleKey);

    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (mart3D) {
      window.removeEventListener('resize', mart3D.onResize);
      mart3D.renderer.dispose();
      mart3D = null;
    }
    const style = document.getElementById('mart-style'); if (style) style.remove();
    window.exitEvent();

    if (window.refreshDayTime)  window.refreshDayTime();
    if (window.refreshHeldItem) window.refreshHeldItem();
  }

  /* ── 스타일 ── */
  function injectStyle() {
    if (document.getElementById('mart-style')) return;
    const s = document.createElement('style'); s.id = 'mart-style';
    s.textContent = `
#mart-scene { position: fixed; inset: 0; overflow: hidden; cursor: pointer; font-family: inherit; }

      #mart-bg, #mart-char-3d {
        opacity: 0;
        transition: opacity 0.4s;
      }
      #mart-scene.scene-shown #mart-bg,
      #mart-scene.scene-shown #mart-char-3d {
        opacity: 1;
      }

      #mart-bg {
        position: absolute; inset: 0;
        background: linear-gradient(180deg,#f0e8d4 0%,#d8c8a0 100%);
        background-image: url('assets/bg/mart.png');
        background-size: cover; background-position: center;
      }
      #mart-char-3d {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        z-index: 5;
        pointer-events: none;
      }

      #dialog-box {
        position: absolute; bottom: 28px; left: 50%;
        transform: translateX(-50%);
        width: 88%; max-width: 920px; min-height: 130px;
        background: rgba(255,255,255,0.94);
        border-radius: 38px;
        padding: 28px 40px 24px;
        box-shadow: 0 10px 28px rgba(0,0,0,0.2);
        z-index: 10;
        display: none;
        flex-direction: column; justify-content: center;
      }
      #speaker-name {
        position: absolute; top: -18px; left: 36px;
        padding: 7px 24px; border-radius: 22px;
        border: 3px solid #7a6a58; background: white;
        font-size: 16px; font-weight: 800;
        color: #444; letter-spacing: 0.5px;
      }
      #dialog-text {
        font-size: 19px; font-weight: 500;
        color: #333; line-height: 1.7;
        min-height: 60px;
      }
      #dialog-arrow {
        position: absolute; bottom: 14px; right: 28px;
        font-size: 22px; color: #888;
        animation: arrow-blink 0.9s infinite;
        display: none;
      }
      @keyframes arrow-blink {
        0%,50% { opacity: 1; transform: translateY(0); }
        51%,100% { opacity: 0.2; transform: translateY(3px); }
      }

      #choice-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.4);
        z-index: 15;
        display: none;
        align-items: center; justify-content: center;
        padding-bottom: 220px;
      }
      #choice-list { display: flex; flex-direction: column; gap: 14px; }
      .choice-btn {
        padding: 16px 40px;
        border-radius: 28px;
        border: 3px solid #7a6a58;
        background: rgba(255,255,255,0.96);
        font-size: 18px; font-weight: 700;
        font-family: inherit; color: #444;
        cursor: pointer; min-width: 340px;
        transition: transform 0.12s, background 0.15s;
      }
      .choice-btn:hover  { background: white; }
      .choice-btn:active { transform: scale(0.96); }

      /* 이벤트 타이틀 */
      #title-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 40;
        opacity: 0; transition: opacity 0.25s;
        cursor: pointer;
      }
      #title-overlay.show { opacity: 1; }
      .title-text {
        font-size: 52px; font-weight: 900;
        color: white; letter-spacing: 8px;
        opacity: 0;
        animation: title-fadein 0.5s 0.2s forwards ease-out;
        text-shadow: 0 4px 20px rgba(0,0,0,0.5);
      }
      @keyframes title-fadein {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* 획득 아이템 */
      #item-reveal {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        z-index: 30;
        opacity: 0; transition: opacity 0.3s;
        cursor: pointer;
      }
      #item-reveal.show { opacity: 1; }
      .reveal-inner {
        background: rgba(255,255,255,0.97);
        border-radius: 32px;
        padding: 36px 48px;
        text-align: center;
        box-shadow: 0 14px 40px rgba(0,0,0,0.3);
        animation: reveal-pop 0.5s cubic-bezier(0.36,0.07,0.19,0.97);
        max-width: 540px;
      }
      @keyframes reveal-pop {
        0%   { transform: scale(0.3) rotate(-6deg); opacity: 0; }
        60%  { transform: scale(1.12) rotate(3deg); opacity: 1; }
        100% { transform: scale(1) rotate(0); }
      }
      .reveal-title {
        font-size: 40px; font-weight: 900;
        color: #FFB400; margin-bottom: 12px;
        letter-spacing: 4px;
        text-shadow: 2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff;
      }
      .reveal-img { width: 200px; height: 200px; object-fit: contain; margin: 8px 0; }
      .reveal-desc {
        margin-top: 14px; padding: 14px 22px;
        border: 2.5px solid #7a6a58;
        border-radius: 18px;
        background: rgba(255,255,255,0.7);
        font-size: 14px; color: #444;
        line-height: 1.55; text-align: left;
      }
      .reveal-hint { font-size: 13px; color: #888; margin-top: 14px; }

      /* 텍스트 입력 */
      #text-input-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        z-index: 30; cursor: default;
      }
      .input-prompt-box {
        background: rgba(255,255,255,0.97);
        border-radius: 30px;
        padding: 32px 40px;
        box-shadow: 0 14px 40px rgba(0,0,0,0.3);
        min-width: 480px;
      }
      .input-prompt {
        font-size: 20px; font-weight: 700;
        color: #444; text-align: center;
        margin-bottom: 22px;
      }
      .input-row {
        display: flex; align-items: center; gap: 10px;
        background: white;
        border: 3px solid #ddd;
        border-radius: 22px;
        padding: 8px 8px 8px 16px;
      }
      .input-row input {
        flex: 1; border: none; outline: none;
        font-size: 18px; font-weight: 600;
        color: #333; font-family: inherit;
        min-width: 0;
      }
      .input-suffix { font-size: 18px; font-weight: 700; color: #888; }
      .confirm-btn {
        padding: 11px 22px;
        border-radius: 18px;
        border: none;
        background: #FFD700; color: white;
        font-size: 15px; font-weight: 800;
        font-family: inherit; cursor: pointer;
        letter-spacing: 1px;
        box-shadow: 0 3px 0 #B8960A;
        transition: transform 0.1s, box-shadow 0.1s;
      }
      .confirm-btn:hover  { background: #FFC400; }
      .confirm-btn:active { transform: translateY(3px); box-shadow: 0 0 0 #B8960A; }
    `;
    document.head.appendChild(s);
  }

  return {
    start() {
      incrementCount();
      D = JSON.parse(localStorage.getItem('charData') || '{}');
      clothingHex = getClothingHex();
      currentExpression = 'default';

      const container = document.getElementById('event-container');
      container.innerHTML = `
        <div id="mart-scene">
          <div id="mart-bg"></div>
          <canvas id="mart-char-3d"></canvas>
          <div id="dialog-box">
            <div id="speaker-name">엄마</div>
            <div id="dialog-text"></div>
            <div id="dialog-arrow">▼</div>
          </div>
          <div id="choice-overlay">
            <div id="choice-list"></div>
          </div>
        </div>
      `;
      injectStyle();

      mart3D = setup3D();
      animate();

      // 타이틀 → 걸어오기 → 대화 시작
showTitle(dialogues.title, () => {
  document.getElementById('mart-scene').classList.add('scene-shown');  // ← 추가
  startWalk(() => {
    document.getElementById('dialog-box').style.display = 'flex';
    dialogQueue = [...dialogues.main];
    dialogIdx = 0;
    nextLine();
  });
});

      document.addEventListener('keydown', handleKey);
      document.getElementById('mart-scene').addEventListener('click', advance);
    }
  };
})();