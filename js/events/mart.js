window.event_mart = {
  start() {
    const container = document.getElementById('event-container');
    container.innerHTML = `
      <div style="position:fixed;inset:0;background:#f4ead4;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:24px;">
        <h1 style="font-size:48px;color:#5a4a3a;letter-spacing:2px;">🛒 마트</h1>
        <p style="color:#7a6a5a;font-size:16px;">마트 이벤트 (개발 중)</p>
        <button onclick="exitEvent()" style="margin-top:12px;padding:13px 32px;border-radius:30px;border:4px solid #7A5C3A;background:#FFD700;color:#7A5C3A;font-size:17px;font-weight:900;cursor:pointer;">나가기</button>
      </div>
    `;
  }
};