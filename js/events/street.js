'use strict';

/* ── 거리 이벤트 (street.png) ──────────────────────────────
   호감도 다운 선택지가 있는 이벤트. 지역변수 streetBad로
   다운 여부를 체크 → 엔딩 분기. 이벤트 시작 시 초기화.
   잔액(돈)은 실제 시스템이 없으므로 연출용 텍스트로만 표시.
──────────────────────────────────────────────────────────── */
window.event_street = EventEngine.create({
  id: 'street',
  title: '엄마와의 거리 데이트',
  bg: 'assets/bg/street.png',
  // 설문조사원은 이미지 등장 없이 '???'로만 말함.
  // (npcEnter를 부르지 않으면 currentNPC=null → speaker:'npc'가 '???'로 표시됨)
  dialogues: {
    main: [
      { clearVars: ['streetBad'] },

      { narration: '오늘은 날씨도 좋으니 엄마에게 거리 데이트를 요청해볼까?' },
      { narration: '저녁엔 쌀쌀할 수도 있으니 여분의 옷을 챙겨서, 엄마와 함께 거리로 나섰다.' },

      { narration: '거리의 풍경은 평소와 같다. 가지런히 늘어선 가로수, 글자가 하나 정도 나간 가게의 간판, 수다를 떨며 지나가는 중고등학생들…' },
      { narration: '걷던 와중 누군가 우리에게 다가오는 기척이 느껴졌다.' },

      { speaker: 'npc', text: '안녕하세요~ 저기 혹시 두분 무슨 사이시죠~?' },
      { narration: '뭐지, 뭐라고 답해야 할까?' },
      { textInput: { prompt: '우리가 어떤 관계냐면...', key: 'relation' } },

      { speaker: 'npc', text: '아~ {relation}이시구나~ 다름이 아니고 저희가 설문조사를 하고 있어서요~ 혹시 두 분 시간 되실까요? 정말 2분 내로 끝나요~' },

      // 엄마 E/I 분기 (속마음만 다름, 결과 동일)
      { branch: 'momEI', cases: {
        E: [ { speaker: 'me', text: '(엄마는 2분 정도면 괜찮을 것 같다고, 내가 먼저 답하기도 전에 고개를 끄덕였다…)' } ],
        I: [ { speaker: 'me', text: '(엄마가 내 쪽을 바라본다. 음, 뭐 2분 정도면 괜찮지 않을까?)' } ],
      } },

      { speaker: 'npc', text: '네네 저희가 하고 있는 프로젝트가 있는데..' },

      { speaker: 'me', text: '(이상하다. 분명 2분 내로 끝난다고 했는데 5분 넘게 거리 한복판에 서 있다.)' },
      { speaker: 'me', text: '(흔쾌히 수락한 엄마도 얼굴에 피곤한 기색이 묻어나기 시작했다..)' },
      { speaker: 'me', text: '(말하는 내용을 들어보면 좋은 프로젝트인 건 확실한데, 어떻게 할까?)' },

      { choice: [
        { id: 'street_leave',  text: '죄송한데 저희가 가야 할 곳이 있어서요.', route: 'survey' },
        { id: 'street_help',   text: '좋은 일 하고 계시네요. 그래서 저희가 뭘 도와드리면 될까요?', route: 'fund' },
        { id: 'street_angry',  text: '화낸다.', route: 'angry', set: { streetBad: '1' } },
      ] },
    ],

    /* ═══ A: 설문 스티커 루트 ═══ */
    survey: [
      { speaker: 'npc', text: '아~ 네.. 죄송해요~ 제가 정말 간절해서 말을 조절을 못했네요.' },
      { speaker: 'npc', text: '사실 그냥 설문스티커만 붙여주시면 됩니다.' },

      { speaker: 'me', text: '(설문 내용은.. 나에게 가장 중요한 것은? 이다.)' },
      { speaker: 'me', text: '(네 가지 선택지가 있다. 돈, 사랑, 명예, 자유.. 어디에 붙일까?)' },

      { choice: [
        { id: 'survey_money',  text: '돈',         route: 'survey_normal', set: { surveyPick: '돈' } },
        { id: 'survey_love',   text: '사랑',       route: 'survey_normal', set: { surveyPick: '사랑' } },
        { id: 'survey_honor',  text: '명예',       route: 'survey_normal', set: { surveyPick: '명예' } },
        { id: 'survey_free',   text: '자유',       route: 'survey_normal', set: { surveyPick: '자유' } },
        { id: 'survey_forehead', text: '엄마의 이마', route: 'survey_forehead' },
      ] },
    ],

    survey_normal: [
      { speaker: '엄마', text: '{playerName}이는 {surveyPick}이 제일 중요하다고 생각하는구나!', expression: 'smile' },
      { speaker: 'me', text: '(어찌저찌 잘 넘긴 것 같다…)' },
      { stats: { 논리성: 1, 애정: 1 } },
      { goto: 'survey_common' },
    ],

    survey_forehead: [
      { speaker: 'npc', text: '꺅!' },
      { speaker: '엄마', text: '꺅!', expression: 'default' },
      { speaker: 'me', text: '...' },
      { speaker: 'me', text: '꺅!!!!!' },
      { goto: 'survey_common' },
    ],

    survey_common: [
      { speaker: 'me', text: '(설문을 마치고 귀여운 스티커를 받았다…)' },
      { speaker: 'me', text: '(뭔가 부끄럽기도 하고 재미있기도 하다…)' },
      { stats: { 외향성: 1, 애정: 1 } },
      { goto: 'ending' },
    ],

    /* ═══ B: 자금 요청 루트 ═══ */
    fund: [
      { speaker: 'npc', text: '어머 맞아요~ 저희 진짜 좋은 일 하고 있거든요~^^' },
      { speaker: 'npc', text: '그런 의미에서 저희가 활동 자금이 좀 부족한데 좀 베풀어주실 수 있으신지..?' },
      { speaker: 'me', text: '(아니 이럴 줄 알았다. 뭔가 불안하더니.. 사이비 같은 계열인 것 같은데.. 어떻게 할까?)' },
      { speaker: 'me', text: '(참고로 현재 잔액은 18,200원이다.)' },

      { choice: [
        { id: 'fund_big',    text: '통 크게 베푼다.',  route: 'fund_big',    set: { streetBad: '1' } },
        { id: 'fund_little', text: '조금 베푼다.',     route: 'fund_little', set: { streetBad: '1' } },
        { id: 'fund_none',   text: '베풀지 않는다.',   route: 'fund_none' },
      ] },
    ],

    fund_big: [
      { speaker: 'me', text: '(통 크게 베풀어서 잔액이 8,200원이 되었다.)' },
      { speaker: 'me', text: '(커피 한 잔 정도는 살 수 있겠군..)' },
      { speaker: 'npc', text: '감사합니다~ 지나가세요^^' },
      { goto: 'fund_bad_common' },
    ],

    fund_little: [
      { speaker: 'me', text: '(조금 베풀어서 잔액이 13,200원이 되었다.)' },
      { speaker: 'me', text: '(이 정도면 그래도 조용히 넘어갈 만 한 것 같다.)' },
      { speaker: 'npc', text: '감사합니다~ 지나가세요^^' },
      { goto: 'fund_bad_common' },
    ],

    // 통크게/조금 공통: 엄마 기분 안좋음 (호감 하락)
    fund_bad_common: [
      { speaker: 'me', text: '(엄마는 조금 기분이 안 좋아 보인다..)' },
      { speaker: 'me', text: '(역시 자식이 돈을 뜯기는 모습을 바로 눈앞에서 봐버려서 그런 걸까?)' },
      { stats: { 애정: -2, 감정성: 2 } },
      { goto: 'ending' },
    ],

    fund_none: [
      { speaker: 'me', text: '(역시 돈을 줄 순 없어. 이건 쉽게쉽게 넘어갈 일이 아니지.)' },
      { speaker: 'me', text: '어렵습니다. 저도 지금 돈이 없어서 어머니랑 구걸하러 가는 중이었거든요.' },
      { speaker: 'npc', text: '아~ 그래요? 그럼.. 저도 같이 가도 될까요?' },
      { speaker: 'me', text: '아니 저희는 가족인데 그쪽은 전혀 관련이 없으셔서 어려울 것 같네요.' },
      { speaker: 'npc', text: '아 그렇네요, 그럼 그냥 가세요..' },
      { speaker: 'me', text: '(엄마와 자리를 피했다. 그래도 삥뜯기지 않고 잘 도망와서 다행인걸!)' },
      { speaker: '엄마', text: '어휴 이상한 사람들이 많네, 그래도 우리 {playerName}이/가 잘 대처해서 다행이야~', expression: 'smile' },
      { stats: { 애정: 1, 논리성: 1 } },
      { goto: 'ending' },
    ],

    /* ═══ C: 화낸다 루트 (호감 하락) ═══ */
    angry: [
      { speaker: 'me', text: '(나는 침을 튀기며 화를 내기 시작했다.)' },
      { speaker: 'me', text: '(얼굴이 벌개지고 언성이 올라가고.. 주변의 사람들이 나와 엄마를 쳐다보기 시작했다.)' },
      { speaker: 'me', text: '(화를 불같이 내던 도중, 엄마가 내 팔을 잡아끌고 그곳에서 도망쳐 나왔다.)' },
      { speaker: '엄마', text: '왜 그렇게 도로 한복판에서 화를 내고 그러니? 참..', expression: 'default' },
      { speaker: 'me', text: '(엄마의 표정이 좋지 않다.)' },
      { speaker: 'me', text: '(내가 너무 과민 반응해서 대처를 한 걸까..?)' },
      { stats: { 애정: -3, 감정성: 1 } },
      { goto: 'ending' },
    ],

    /* ═══ 공통 엔딩 (streetBad 분기) ═══ */
    ending: [
      { branch: 'var:streetBad', cases: {
        '1': [ { narration: '중간에 이상한 사람한테 잡혀서 오늘 데이트가 조금 다운된 것 같다…' } ],
        '':  [ { narration: '중간에 이상한 사람한테 잡혔지만, 그래도 엄마랑 함께 거리를 걸으니 기분이 좋았다.' } ],
      } },
      { end: true },
    ],
  },
});
