'use strict';

const DEFAULT_STATS = {
  외향성: 0, 내향성: 0,
  감각: 0, 직관: 0,
  논리성: 0, 감정성: 0,
  계획성: 0, 융통성: 0,
  애정: 0,
};

window.SaveSystem = {
  DEFAULT_STATS,

  /* 현재 게임 상태 전체 스냅샷 */
buildSaveData() {
  const vars = {};
  Object.keys(localStorage).filter(k => k.startsWith('var_')).forEach(k => {
    vars[k] = localStorage.getItem(k);
  });
  return {
    charData:     JSON.parse(localStorage.getItem('charData') || '{}'),
    playerName:   localStorage.getItem('playerName') || '',
    momName:      localStorage.getItem('momName') || '',
    childType:    localStorage.getItem('childType') || '',
    dayTime:      JSON.parse(localStorage.getItem('dayTime') || '{"day":1,"time":"morning"}'),
    ownedItems:   JSON.parse(localStorage.getItem('ownedItems') || '[]'),
    currentItem:  JSON.parse(localStorage.getItem('currentItem') || 'null'),
    eventCounts:  JSON.parse(localStorage.getItem('eventCounts') || '{}'),
    eventChoices: JSON.parse(localStorage.getItem('eventChoices') || '{}'),
    stats:        JSON.parse(localStorage.getItem('stats') || JSON.stringify(DEFAULT_STATS)),
    vars,
    savedAt: Date.now(),
  };
},

  saveToSlot(i) {
    localStorage.setItem('saveSlot' + i, JSON.stringify(this.buildSaveData()));
  },
  getSlot(i) {
    const raw = localStorage.getItem('saveSlot' + i);
    return raw ? JSON.parse(raw) : null;
  },
  hasSomeSave() {
    return [0, 1, 2].some(i => localStorage.getItem('saveSlot' + i));
  },
  slotLabel(d) {
    return `${d.dayTime.day}일차 (${d.dayTime.time === 'morning' ? '오전' : '오후'})`;
  },

  /* 다음 로드 예약 (페이지 이동/새로고침 전에 호출) */
  queueLoad(i) { sessionStorage.setItem('loadSlot', String(i)); },

  /* game.js 시작 시 호출: 예약된 로드 있으면 복원, 없으면 새 게임 초기화 */
  applyStartup() {
    const slot = sessionStorage.getItem('loadSlot');
    if (slot !== null) {
      const d = this.getSlot(Number(slot));
      sessionStorage.removeItem('loadSlot');
      if (d) {
        localStorage.setItem('charData',     JSON.stringify(d.charData || {}));
	localStorage.setItem('playerName', d.playerName || '');
  	localStorage.setItem('momName', d.momName || '');
        localStorage.setItem('dayTime',      JSON.stringify(d.dayTime || {day:1,time:'morning'}));
        localStorage.setItem('ownedItems',   JSON.stringify(d.ownedItems || []));
        localStorage.setItem('eventCounts',  JSON.stringify(d.eventCounts || {}));
        localStorage.setItem('eventChoices', JSON.stringify(d.eventChoices || {}));
        localStorage.setItem('stats',        JSON.stringify(d.stats || DEFAULT_STATS));
        if (d.currentItem) localStorage.setItem('currentItem', JSON.stringify(d.currentItem));
        else localStorage.removeItem('currentItem');
        Object.keys(d.vars || {}).forEach(k => localStorage.setItem(k, d.vars[k]));
        return;
      }
    }
// 새 게임 - 일시 상태 초기화
['dayTime','ownedItems','currentItem','eventCounts','eventChoices','stats','playerName','momName'].forEach(k => localStorage.removeItem(k));
Object.keys(localStorage).filter(k => k.startsWith('var_')).forEach(k => localStorage.removeItem(k));
  },

  /* 슬롯 썸네일에 엄마 얼굴 */
  async drawThumb(canvas, charData) {
    const tmp = document.createElement('canvas');
    tmp.width = 512; tmp.height = 512;
    await FaceParts.drawFace(tmp.getContext('2d'), charData);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
  },

  /* 토스트 */
  showToast(msg) {
    let t = document.getElementById('toast-msg');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast-msg';
      t.style.cssText = `
        position:fixed; left:50%; bottom:90px; transform:translateX(-50%);
        background:rgba(0,0,0,0.78); color:white;
        padding:14px 32px; border-radius:24px;
        font-size:16px; font-weight:700; font-family:inherit;
        z-index:500; pointer-events:none; opacity:0;
        transition:opacity 0.3s; backdrop-filter:blur(6px);
      `;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 1800);
  },

  /* 덮어쓰기 경고 */
  confirmOverwrite(onYes) {
    const m = document.createElement('div');
    m.id = 'confirm-modal';
    m.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-text">저장 내용을 덮어씌우나요?</div>
        <div class="confirm-btns">
          <button class="confirm-yes">예</button>
          <button class="confirm-no">아니요</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    m.querySelector('.confirm-yes').addEventListener('click', () => { m.remove(); onYes(); });
    m.querySelector('.confirm-no').addEventListener('click', () => m.remove());
  },

  /* 슬롯 렌더링 (공통). mode: 'save' | 'load' */
  renderSlots(container, mode, onAfter) {
    container.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const d = this.getSlot(i);
      const slot = document.createElement('div');
      slot.className = 'save-slot';
      if (d) {
	const childLabel = d.childType === 'son' ? '아들' : '딸';
        slot.innerHTML = `
          <canvas class="slot-thumb" width="56" height="56"></canvas>
          <div class="slot-info">
            <span class="slot-names">${d.momName || '엄마'} 엄마 · ${childLabel} ${d.playerName || '나'}</span>
            <span class="slot-day">${this.slotLabel(d)}</span>
          </div>
          <button class="slot-load">불러오기</button>`;
        this.drawThumb(slot.querySelector('.slot-thumb'), d.charData);
        slot.querySelector('.slot-load').addEventListener('click', (e) => {
          e.stopPropagation();
          this.queueLoad(i);
          location.href = 'game.html';
        });
        if (mode === 'save') {
          slot.addEventListener('click', () => {
            this.confirmOverwrite(() => {
              this.saveToSlot(i);
              this.showToast('저장되었습니다!');
              this.renderSlots(container, mode, onAfter);
            });
          });
        } else {
          // load 모드: 슬롯 본체 클릭도 불러오기
          slot.addEventListener('click', () => { this.queueLoad(i); location.href = 'game.html'; });
        }
      } else {
        slot.innerHTML = `
          <div class="slot-thumb empty"></div>
          <span class="slot-label empty">슬롯 비어있음</span>`;
        if (mode === 'save') {
          slot.addEventListener('click', () => {
            this.saveToSlot(i);
            this.showToast('저장되었습니다!');
            this.renderSlots(container, mode, onAfter);
          });
        }
      }
      container.appendChild(slot);
    }
    if (onAfter) onAfter();
  },

  injectStyles() {
    if (document.getElementById('save-styles')) return;
    const s = document.createElement('style');
    s.id = 'save-styles';
    s.textContent = `
      #save-panel, #load-panel {
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%) scale(0.92);
        width: 420px; padding: 26px;
        background: rgba(255,255,255,0.85);
        border-radius: 32px;
        box-shadow: 0 14px 44px rgba(0,0,0,0.28);
        z-index: 130; display: none;
        flex-direction: column; gap: 16px;
        backdrop-filter: blur(12px);
        opacity: 0; transition: opacity 0.2s, transform 0.2s;
      }
      #save-panel.visible, #load-panel.visible {
        display: flex; opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      .save-header {
        font-size: 18px; font-weight: 800;
        text-align: center; color: #333;
      }
      .save-slots { display: flex; flex-direction: column; gap: 12px; }
      .save-slot {
        position: relative;
        display: flex; align-items: center; gap: 16px;
        padding: 14px;
        background: rgba(255,255,255,0.7);
        border: 2px solid #e0e0e0;
        border-radius: 18px; cursor: pointer;
        transition: transform 0.1s, background 0.15s;
      }
      .save-slot:hover  { background: white; }
      .save-slot:active { transform: scale(0.98); }
      .slot-thumb {
        width: 56px; height: 56px;
        border-radius: 12px; background: white;
        flex-shrink: 0;
      }
      .slot-thumb.empty { background: #ccc; }
      .slot-label { font-size: 15px; font-weight: 700; color: #444; }
	.slot-info { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; padding-right: 70px; }
      .slot-names { font-size: 15px; font-weight: 800; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .slot-day { font-size: 12.5px; font-weight: 600; color: #999; }
      .slot-label.empty { color: #999; }
      .slot-load {
        position: absolute; top: 8px; right: 10px;
        padding: 5px 14px; border-radius: 12px;
        border: 2px solid #87CEEB;
        background: rgba(135,206,235,0.18);
        color: #2C6B8B; font-size: 12px; font-weight: 700;
        font-family: inherit; cursor: pointer;
      }
      .save-close {
        padding: 10px 22px; border-radius: 14px;
        border: 2px solid #ddd; background: white;
        color: #555; font-size: 14px; font-weight: 700;
        font-family: inherit; cursor: pointer;
      }
      #confirm-modal {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        z-index: 200;
      }
      .confirm-box {
        background: white; border-radius: 24px;
        padding: 28px 36px; text-align: center;
        box-shadow: 0 14px 40px rgba(0,0,0,0.3);
      }
      .confirm-text { font-size: 17px; font-weight: 700; color: #444; margin-bottom: 20px; }
      .confirm-btns { display: flex; gap: 12px; justify-content: center; }
      .confirm-yes, .confirm-no {
        padding: 10px 28px; border-radius: 16px;
        font-size: 15px; font-weight: 700; font-family: inherit;
        cursor: pointer; border: none;
      }
      .confirm-yes { background: #FFD700; color: #7a4800; }
      .confirm-no  { background: #eee; color: #666; }
    `;
    document.head.appendChild(s);
  },
};