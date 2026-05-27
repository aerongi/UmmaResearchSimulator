'use strict';

window.EventEngine = (() => {
  let cfg = null;
  let D = {}, clothingHex = '#F5C842';
  let mouthAnimTimer = null;
  let dialogQueue = [], dialogIdx = 0;
  let typingTimer = null, isTyping = false, waitingNext = false;
  let fullText = '';
  let inChoice = false, inReveal = false, inTextInput = false, inTitle = false;
  let currentExpression = 'default';
  let titleDismissCallback = null;
  let scene3D = null, walkState = null, rafId = null;
  let momTargetX = 0, currentNPC = null;

  function getClothingHex() {
    const it = FaceParts.CLOTHING_COLORS.find(c => c.id === D.clothingColor);
    return it ? it.hex : '#F5C842';
  }
  function incrementCount() {
    const c = JSON.parse(localStorage.getItem('eventCounts') || '{}');
    c[cfg.id] = (c[cfg.id] || 0) + 1;
    localStorage.setItem('eventCounts', JSON.stringify(c));
  }
function mbtiFromStats(s) {
	s = s || {};
	return ((s.외향성||0) >= (s.내향성||0) ? 'E' : 'I')
	     + ((s.직관  ||0) >= (s.감각  ||0) ? 'N' : 'S')
	     + ((s.감정성||0) >= (s.논리성||0) ? 'F' : 'T')
	     + ((s.융통성||0) >= (s.계획성||0) ? 'P' : 'J');
}
function recomputeMBTI() {
	const stats = JSON.parse(localStorage.getItem('stats') || '{}');
	const mbti = mbtiFromStats(stats);
	const cd = JSON.parse(localStorage.getItem('charData') || '{}');
	cd.mbti = mbti;
	localStorage.setItem('charData', JSON.stringify(cd));
	D.mbti = mbti;                                 // 진행 중인 이벤트에도 즉시 반영
	const el = document.getElementById('menu-mbti-value');
	if (el) el.textContent = mbti;                 // 메뉴 표시 갱신
	if (window.refreshMBTI) window.refreshMBTI();
}
function applyStats(delta) {
    const stats = JSON.parse(localStorage.getItem('stats') || '{}');
    for (const k in delta) stats[k] = (stats[k] || 0) + delta[k];
    localStorage.setItem('stats', JSON.stringify(stats));
    recomputeMBTI();
    nextLine();   // 바로 다음 줄로
  }
  function interpolate(text) {
    return text.replace(/\{(\w+)\}/g, (m, key) => {
      if (key === 'child')      return localStorage.getItem('childType') === 'son' ? '아들' : '딸';
      if (key === 'playerName') return localStorage.getItem('playerName') || '';
      if (key === 'momName')    return localStorage.getItem('momName') || '';
      return localStorage.getItem('var_' + key) || '';
    });
  }
  function applyExpression(exp) { if (exp) currentExpression = exp; }
  function getEyeOverride() {
    return currentExpression === 'smile' ? 'eye_smile' : (D.eyeType || 'eye1');
  }

  /* ── 3D 엄마 캐릭터 ── */
  function setup3D() {
    const canvas = document.getElementById('event-char-3d');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 1.4, 4);
    camera.lookAt(0, 1.0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 0.4);
    sun.position.set(2, 5, 3); scene.add(sun);

    const charGroup = new THREE.Group();
    scene.add(charGroup);

    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 512; faceCanvas.height = 512;
    const faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.premultiplyAlpha = false;
    const backHairCanvas = document.createElement('canvas');
    backHairCanvas.width = 512; backHairCanvas.height = 512;
    const backHairTex = new THREE.CanvasTexture(backHairCanvas); backHairTex.premultiplyAlpha = false;

    const headMat = new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, alphaTest: 0.01, side: THREE.FrontSide, depthWrite: true });
    const headPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.84), headMat);
    headPlane.position.set(0, 1.65, 0.04); charGroup.add(headPlane);

    const backHairMat = new THREE.MeshBasicMaterial({ map: backHairTex, transparent: true, alphaTest: 0.01, side: THREE.FrontSide, depthWrite: false });
    const backHairPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.90, 0.90), backHairMat);
    backHairPlane.position.set(0, 1.65, -0.04); backHairPlane.rotation.y = Math.PI; charGroup.add(backHairPlane);

    const clothingMat = new THREE.MeshStandardMaterial({ color: clothingHex, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFDDBB4, roughness: 0.65 });
    const addPart = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); charGroup.add(m); return m; };
    addPart(new THREE.CylinderGeometry(0.16, 0.19, 0.62, 16), clothingMat, 0, 0.94, 0);
    addPart(new THREE.SphereGeometry(0.19, 16, 8), clothingMat, 0, 0.63, 0);
    addPart(new THREE.SphereGeometry(0.11, 14, 10), skinMat, -0.42, 0.65, 0);
    addPart(new THREE.SphereGeometry(0.11, 14, 10), skinMat,  0.42, 0.65, 0);

    FaceParts.drawFace(faceCanvas.getContext('2d'), D).then(() => faceTex.needsUpdate = true);
    FaceParts.drawBackHairTexture(backHairCanvas.getContext('2d'), D).then(() => backHairTex.needsUpdate = true);

    function onResize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    onResize(); window.addEventListener('resize', onResize);
    return { renderer, scene, camera, charGroup, faceCanvas, faceTex, onResize };
  }

  async function redrawFace(mouthOverride) {
    if (!scene3D) return;
    await FaceParts.drawFaceWithOverrides(scene3D.faceCanvas.getContext('2d'), D, {
      mouthType: mouthOverride || (D.mouthType || 'mouth1'),
      eyeType: getEyeOverride(),
    });
    scene3D.faceTex.needsUpdate = true;
  }
  function startMouthAnim() {
    stopMouthAnim(); let open = false;
    mouthAnimTimer = setInterval(() => { open = !open; redrawFace(open ? 'mouth_open' : (D.mouthType || 'mouth1')); }, 150);
  }
  function stopMouthAnim() {
    if (mouthAnimTimer) clearInterval(mouthAnimTimer);
    mouthAnimTimer = null; redrawFace(D.mouthType || 'mouth1');
  }

  /* ── 걷기 ── */
  function startWalk(onDone) {
    if (!scene3D) { onDone?.(); return; }
    scene3D.charGroup.position.x = -4;
    walkState = { startTime: performance.now(), duration: 2200, fromX: -4, toX: 0, onDone };
  }
  function updateWalk(now) {
    if (!walkState || !scene3D) return;
    const t = Math.min(1, (now - walkState.startTime) / walkState.duration);
    scene3D.charGroup.position.x = walkState.fromX + (walkState.toX - walkState.fromX) * t;
    scene3D.charGroup.position.y = (t < 1) ? Math.abs(Math.sin(t * 22)) * 0.09 : 0;
    if (t >= 1) { const cb = walkState.onDone; walkState = null; momTargetX = 0; cb?.(); }
  }

  /* ── 애니메이션 루프 (엄마 좌우 이동 포함) ── */
  function animate() {
    rafId = requestAnimationFrame(animate);
    if (walkState) updateWalk(performance.now());
    else if (scene3D) scene3D.charGroup.position.x += (momTargetX - scene3D.charGroup.position.x) * 0.12;
    if (scene3D) scene3D.renderer.render(scene3D.scene, scene3D.camera);
  }

  /* ── NPC 등장/퇴장 ── */
  function npcEnter(info) {
    currentNPC = info;
    const npc = document.getElementById('event-npc');
    npc.src = info.img;
    npc.classList.add('shown');
    momTargetX = -1.3;            // 엄마 왼쪽으로 밀림
    setTimeout(() => nextLine(), 750);
  }
  function npcExit() {
    document.getElementById('event-npc').classList.remove('shown');
    currentNPC = null;
    momTargetX = 0;               // 엄마 중앙 복귀
    setTimeout(() => nextLine(), 750);
  }

/* ── 컷씬 소품 (획득X, 연출용) ── */
  function propShow(name) {
    const scene = document.getElementById('event-scene');
    scene.classList.add('cutscene');                 // 캐릭터/NPC 숨김
    let prop = document.getElementById('event-prop');
    if (!prop) {
      prop = document.createElement('img');
      prop.id = 'event-prop';
      prop.className = 'event-prop';
      scene.appendChild(prop);
    }
    prop.src = name.includes('/') ? name : `assets/props/${name}.png`;
    prop.classList.remove('shown');
    void prop.offsetWidth;                            // 애니메이션 리셋
    prop.classList.add('shown');
    setTimeout(() => nextLine(), 500);                // 페이드 끝나면 대화 계속
  }
  function propHide() {
    const scene = document.getElementById('event-scene');
    const prop = document.getElementById('event-prop');
    if (prop) prop.classList.remove('shown');
    scene.classList.remove('cutscene');               // 캐릭터 복귀
    setTimeout(() => nextLine(), 500);
  }
/* ── 이벤트 중 배경 교체 ── */
function setBg(name) {
	const url = name.includes('/') ? name : `assets/bg/${name}.png`;
	document.getElementById('event-bg').style.backgroundImage = `url('${url}')`;
	nextLine();   // 바로 다음 줄로
}

  /* ── 타이핑 ── */
  function typeText(text, onDone) {
    const el = document.getElementById('dialog-text');
    fullText = text; isTyping = true; el.textContent = ''; let i = 0;
    typingTimer = setInterval(() => {
      if (i < text.length) el.textContent += text[i++];
      else { clearInterval(typingTimer); isTyping = false; onDone(); }
    }, 35);
  }
  function finishTyping() {
    if (typingTimer) clearInterval(typingTimer);
    document.getElementById('dialog-text').textContent = fullText;
    isTyping = false; stopMouthAnim(); waitingNext = true;
    document.getElementById('dialog-arrow').style.display = 'block';
  }

  /* ── 화자 박스 (mom/me=왼쪽, npc=오른쪽) ── */
  function setupSpeaker(speaker) {
    const box = document.getElementById('speaker-name');
    box.style.display = 'inline-block';
    if (speaker === 'npc') {
      box.style.left = 'auto'; box.style.right = '40px';
      box.style.borderColor = '#9a86c4';
      box.style.background = 'rgba(255,255,255,0.95)';
      box.style.color = '#5a4a7a';
      box.textContent = currentNPC ? currentNPC.name : '???';
    } else if (speaker === 'mom') {
      box.style.right = 'auto'; box.style.left = '40px';
      box.style.borderColor = clothingHex;
      box.style.background = 'rgba(255,255,255,0.95)';
      box.style.color = '#444';
      box.textContent = localStorage.getItem('momName') || '엄마';
    } else {
      box.style.right = 'auto'; box.style.left = '40px';
      box.style.borderColor = '#7a6a58';
      box.style.background = 'rgba(255,255,255,0.7)';
      box.style.color = '#7a6a58';
      box.textContent = localStorage.getItem('playerName') || '나';
    }
  }
  function hideSpeaker() { document.getElementById('speaker-name').style.display = 'none'; }

  /* ── 진행 ── */
  function nextLine() {
    if (dialogIdx >= dialogQueue.length) { endEvent(); return; }
    const line = dialogQueue[dialogIdx++];
    applyExpression(line.expression);

    if (line.end)        { endEvent(line); return; }
    if (line.choice)     { showChoices(line.choice); return; }
    if (line.itemReveal) { showItemReveal(line.itemReveal, line.description); return; }
    if (line.textInput)  { showTextInput(line.textInput); return; }
    if (line.branch)     { handleBranch(line); return; }
    if (line.npcEnter)   { npcEnter(line.npcEnter); return; }
    if (line.npcExit)    { npcExit(); return; }
    if (line.propShow)   { propShow(line.propShow); return; }
    if (line.propExit)   { propHide(); return; }
	if (line.setBg)      { setBg(line.setBg); return; }
	if (line.stats)      { applyStats(line.stats); return; }
if (line.goto)       { dialogQueue = [...cfg.dialogues[line.goto]]; dialogIdx = 0; nextLine(); return; }
    if (line.narration)  { showNarration(line.narration); return; }

    setupSpeaker(line.speaker);
    document.getElementById('dialog-arrow').style.display = 'none';
    redrawFace(D.mouthType || 'mouth1');
    if (line.speaker === 'mom') startMouthAnim();   // 입 움직임은 엄마만

    typeText(interpolate(line.text), () => {
      stopMouthAnim(); waitingNext = true;
      document.getElementById('dialog-arrow').style.display = 'block';
    });
  }
  function showNarration(text) {
    hideSpeaker(); stopMouthAnim();
    document.getElementById('dialog-arrow').style.display = 'none';
    redrawFace(D.mouthType || 'mouth1');
    typeText(interpolate(text), () => {
      waitingNext = true;
      document.getElementById('dialog-arrow').style.display = 'block';
    });
  }
function handleBranch(line) {
    let key;
    if (line.branch.indexOf('var:') === 0) {
      key = localStorage.getItem('var_' + line.branch.slice(4)) || '';
    } else {
      const mbti = D.mbti || 'ENFP';
      if (line.branch === 'momEI') key = mbti[0];
      if (line.branch === 'momSN') key = mbti[1];
      if (line.branch === 'momTF') key = mbti[2];
      if (line.branch === 'momJP') key = mbti[3];
    }
    const sub = (line.cases && line.cases[key]) || [];
    dialogQueue.splice(dialogIdx, 0, ...sub);
    nextLine();
  }
  function showTitle(text, onDismiss) {
    inTitle = true;
    titleDismissCallback = onDismiss || (() => nextLine());
    const ov = document.createElement('div');
    ov.id = 'title-overlay';
    ov.innerHTML = `<div class="title-text">${text}</div>`;
    document.getElementById('event-scene').appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('show'));
  }
  function hideTitle() {
    inTitle = false;
    const el = document.getElementById('title-overlay'); if (el) el.remove();
    const cb = titleDismissCallback; titleDismissCallback = null; if (cb) cb();
  }
function showChoices(options) {
    inChoice = true;
    const list = document.getElementById('choice-list');
    list.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', e => {
        e.stopPropagation(); inChoice = false;
        const ch = JSON.parse(localStorage.getItem('eventChoices') || '{}');
        ch[cfg.id] = opt.route || opt.text;
        localStorage.setItem('eventChoices', JSON.stringify(ch));
        // 선택지로 변수 지정 (set: { 키: 값 })
        if (opt.set) {
          for (const k in opt.set) localStorage.setItem('var_' + k, opt.set[k]);
        }
	if (opt.stats) {
          const stats = JSON.parse(localStorage.getItem('stats') || '{}');
          for (const k in opt.stats) stats[k] = (stats[k] || 0) + opt.stats[k];
          localStorage.setItem('stats', JSON.stringify(stats));
          recomputeMBTI();
        }
        document.getElementById('choice-overlay').style.display = 'none';
        if (opt.route) { dialogQueue = [...cfg.dialogues[opt.route]]; dialogIdx = 0; }
        nextLine();   // route 있으면 점프, 없으면 그대로 이어서
      });
      list.appendChild(btn);
    });
    document.getElementById('choice-overlay').style.display = 'flex';
  }

  function showItemReveal(itemName, description) {
    inReveal = true;
    const owned = JSON.parse(localStorage.getItem('ownedItems') || '[]');
    if (!owned.find(it => it && it.name === itemName)) {
      owned.push({ name: itemName, source: cfg.id });
      localStorage.setItem('ownedItems', JSON.stringify(owned));
    }
    const ov = document.createElement('div');
    ov.id = 'item-reveal';
    ov.innerHTML = `
      <div class="reveal-inner">
        <div class="reveal-title">획득!</div>
        <img src="assets/items/${itemName}.png" class="reveal-img">
        ${description ? `<div class="reveal-desc">${interpolate(description)}</div>` : ''}
        <div class="reveal-hint">클릭하거나 키를 눌러 계속</div>
      </div>`;
    document.getElementById('event-scene').appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('show'));
  }
  function hideReveal() {
    const el = document.getElementById('item-reveal'); if (el) el.remove();
    inReveal = false; nextLine();
  }
function showTextInput(c) {
		inTextInput = true;
		const ov = document.createElement('div');
		ov.id = 'text-input-overlay';
		ov.innerHTML = `
			<div class="input-prompt-box">
				<div class="input-prompt">${c.prompt}</div>
				<div class="input-row">
					<input type="text" id="text-input-field" maxlength="30">
					<span class="input-suffix">${c.suffix || ''}</span>
					<button class="confirm-btn" id="confirm-input">완료!</button>
				</div>
			</div>`;
		document.getElementById('event-scene').appendChild(ov);
		const input = document.getElementById('text-input-field'); input.focus();
		const done = (e) => {
			if (e) e.stopPropagation();
			const v = input.value.trim(); if (!v) return;
			localStorage.setItem('var_' + c.key, v);
			ov.remove(); inTextInput = false;

			// 키워드 라우팅: 입력에 특정 단어가 포함되면 다른 루트로 점프
			if (c.routes) {
				const lower = v.toLowerCase();
				const hit = c.routes.find(r => r.keywords.some(kw => lower.includes(kw.toLowerCase())));
				const target = hit ? hit.route : c.default;
				if (target) {
					dialogQueue = [...cfg.dialogues[target]]; dialogIdx = 0; nextLine();
					return;
				}
			}
			nextLine();
		};
		document.getElementById('confirm-input').addEventListener('click', done);
		input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); done(e); } e.stopPropagation(); });
	}
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

 function endEvent(endLine) {
    endLine = endLine || {};
    const item = endLine.item || null;
    incrementCount();

    if (endLine.stats) {
      const stats = JSON.parse(localStorage.getItem('stats') || '{}');
      for (const k in endLine.stats) stats[k] = (stats[k] || 0) + endLine.stats[k];
      localStorage.setItem('stats', JSON.stringify(stats));
      recomputeMBTI();
    }

    if (item) localStorage.setItem('currentItem', JSON.stringify({ name: item, source: cfg.id }));
    else      localStorage.removeItem('currentItem');

    const dt = JSON.parse(localStorage.getItem('dayTime') || '{"day":1,"time":"morning"}');
    if (dt.time === 'morning') dt.time = 'afternoon';
    else { dt.time = 'morning'; dt.day++; }
    localStorage.setItem('dayTime', JSON.stringify(dt));

    stopMouthAnim();
    document.removeEventListener('keydown', handleKey);
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (scene3D) { window.removeEventListener('resize', scene3D.onResize); scene3D.renderer.dispose(); scene3D = null; }
    const st = document.getElementById('event-style'); if (st) st.remove();
    window.exitEvent();
    if (window.refreshDayTime)  window.refreshDayTime();
    if (window.refreshHeldItem) window.refreshHeldItem();
  }

  function injectStyle() {
    if (document.getElementById('event-style')) return;
    const s = document.createElement('style'); s.id = 'event-style';
    s.textContent = `
      #event-scene { position: fixed; inset: 0; overflow: hidden; cursor: pointer; font-family: inherit; }
      #event-bg {
        position: absolute; inset: 0;
        background: linear-gradient(180deg,#f0e8d4 0%,#d8c8a0 100%);
        background-size: cover; background-position: center;
      }
      #event-char-3d { opacity: 0; transition: opacity 0.4s; }
      #event-scene.scene-shown #event-char-3d { opacity: 1; }
      #event-char-3d { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 5; pointer-events: none; }

      .event-npc {
        position: absolute; bottom: 22vh; right: 6%;
        max-height: 50vh; z-index: 6;
        transform: translateX(160%); opacity: 0;
        transition: transform 0.7s ease-out, opacity 0.7s;
        pointer-events: none;
      }
      .event-npc.shown { transform: translateX(0); opacity: 1; }

      #dialog-box {
        position: absolute; bottom: 100px; left: 50%;
        transform: translateX(-50%);
        width: 88%; max-width: 1000px; min-height: 160px;
        background: rgba(255,255,255,0.94);
        border-radius: 42px; padding: 32px 48px 28px;
        box-shadow: 0 10px 28px rgba(0,0,0,0.2);
        z-index: 10; display: none;
        flex-direction: column; justify-content: center;
      }
      #speaker-name {
        position: absolute; top: -22px; left: 40px;
        padding: 9px 28px; border-radius: 24px;
        border: 3px solid #7a6a58; background: white;
        font-size: 18px; font-weight: 800; color: #444; letter-spacing: 0.5px;
      }
      #dialog-text { font-size: 23px; font-weight: 500; color: #333; line-height: 1.7; min-height: 70px; }
      #dialog-arrow {
        position: absolute; bottom: 16px; right: 32px;
        font-size: 26px; color: #888;
        animation: arrow-blink 0.9s infinite; display: none;
      }
      @keyframes arrow-blink { 0%,50%{opacity:1;transform:translateY(0);} 51%,100%{opacity:0.2;transform:translateY(3px);} }

      #choice-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.4);
        z-index: 15; display: none;
        align-items: center; justify-content: center; padding-bottom: 300px;
      }
      #choice-list { display: flex; flex-direction: column; gap: 18px; }
      .choice-btn {
        padding: 22px 56px; border-radius: 32px; border: 4px solid #7a6a58;
        background: rgba(255,255,255,0.96); font-size: 22px; font-weight: 700;
        font-family: inherit; color: #444; cursor: pointer; min-width: 440px;
        transition: transform 0.12s, background 0.15s;
      }
      .choice-btn:hover { background: white; }
      .choice-btn:active { transform: scale(0.96); }

      #title-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center;
        z-index: 40; opacity: 0; transition: opacity 0.25s; cursor: pointer;
      }
      #title-overlay.show { opacity: 1; }
      .title-text {
        font-size: 52px; font-weight: 900; color: white; letter-spacing: 8px;
        opacity: 0; animation: title-fadein 0.5s 0.2s forwards ease-out;
        text-shadow: 0 4px 20px rgba(0,0,0,0.5);
      }
      @keyframes title-fadein { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }

      #item-reveal {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        z-index: 30; opacity: 0; transition: opacity 0.3s; cursor: pointer;
      }
      #item-reveal.show { opacity: 1; }
      .reveal-inner {
        background: rgba(255,255,255,0.97); border-radius: 32px;
        padding: 36px 48px; text-align: center;
        box-shadow: 0 14px 40px rgba(0,0,0,0.3);
        animation: reveal-pop 0.5s cubic-bezier(0.36,0.07,0.19,0.97); max-width: 540px;
      }
      @keyframes reveal-pop { 0%{transform:scale(0.3) rotate(-6deg);opacity:0;} 60%{transform:scale(1.12) rotate(3deg);opacity:1;} 100%{transform:scale(1) rotate(0);} }
      .reveal-title {
        font-size: 40px; font-weight: 900; color: #FFB400; margin-bottom: 12px; letter-spacing: 4px;
        text-shadow: 2px 2px 0 #fff,-2px -2px 0 #fff,2px -2px 0 #fff,-2px 2px 0 #fff;
      }
      .reveal-img { width: 200px; height: 200px; object-fit: contain; margin: 8px 0; }
      .reveal-desc {
        margin-top: 14px; padding: 14px 22px; border: 2.5px solid #7a6a58;
        border-radius: 18px; background: rgba(255,255,255,0.7);
        font-size: 14px; color: #444; line-height: 1.55; text-align: left;
      }
      .reveal-hint { font-size: 13px; color: #888; margin-top: 14px; }

      #text-input-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center; z-index: 30; cursor: default;
      }
      .input-prompt-box { background: rgba(255,255,255,0.97); border-radius: 30px; padding: 32px 40px; box-shadow: 0 14px 40px rgba(0,0,0,0.3); min-width: 480px; }
      .input-prompt { font-size: 20px; font-weight: 700; color: #444; text-align: center; margin-bottom: 22px; }
      .input-row { display: flex; align-items: center; gap: 10px; background: white; border: 3px solid #ddd; border-radius: 22px; padding: 8px 8px 8px 16px; }
      .input-row input { flex: 1; border: none; outline: none; font-size: 18px; font-weight: 600; color: #333; font-family: inherit; min-width: 0; }
      .input-suffix { font-size: 18px; font-weight: 700; color: #888; }
      .confirm-btn { padding: 11px 22px; border-radius: 18px; border: none; background: #FFD700; color: white; font-size: 15px; font-weight: 800; font-family: inherit; cursor: pointer; letter-spacing: 1px; box-shadow: 0 3px 0 #B8960A; transition: transform 0.1s, box-shadow 0.1s; }
      .confirm-btn:hover { background: #FFC400; }
    .confirm-btn:active { transform: translateY(3px); box-shadow: 0 0 0 #B8960A; }

      .event-prop {
        position: absolute; top: 38%; left: 50%;
        transform: translate(-50%, -50%);
        max-width: 42vh; max-height: 42vh;
        opacity: 0; z-index: 8; pointer-events: none;
        transition: opacity 0.45s;
        filter: drop-shadow(0 10px 24px rgba(0,0,0,0.35));
      }
      .event-prop.shown { opacity: 1; animation: prop-float 3s ease-in-out infinite; }
      @keyframes prop-float { 0%,100% { top: 38%; } 50% { top: 34%; } }

      /* 컷씬 모드: 캐릭터/NPC 숨김 */
      #event-scene.cutscene #event-char-3d { opacity: 0 !important; }
      #event-scene.cutscene .event-npc      { opacity: 0 !important; transition: opacity 0.45s; }
    `;
    document.head.appendChild(s);
  }

  function create(config) {
    return {
      start() {
        cfg = config;
        D = JSON.parse(localStorage.getItem('charData') || '{}');
        clothingHex = getClothingHex();
        currentExpression = 'default';
        momTargetX = 0; currentNPC = null;

        document.getElementById('event-container').innerHTML = `
          <div id="event-scene">
            <div id="event-bg"></div>
            <canvas id="event-char-3d"></canvas>
            <img id="event-npc" class="event-npc" alt="">
            <div id="dialog-box">
              <div id="speaker-name">엄마</div>
              <div id="dialog-text"></div>
              <div id="dialog-arrow">▼</div>
            </div>
            <div id="choice-overlay"><div id="choice-list"></div></div>
          </div>`;
        injectStyle();

        if (config.bg) {
          document.getElementById('event-bg').style.backgroundImage = `url('${config.bg}')`;
        }

        scene3D = setup3D();
        animate();

        showTitle(config.title, () => {
          document.getElementById('event-scene').classList.add('scene-shown');
          startWalk(() => {
            document.getElementById('dialog-box').style.display = 'flex';
            dialogQueue = [...config.dialogues.main]; dialogIdx = 0; nextLine();
          });
        });

        document.addEventListener('keydown', handleKey);
        document.getElementById('event-scene').addEventListener('click', advance);
      }
    };
  }

  return { create };
})();