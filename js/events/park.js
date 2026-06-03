'use strict';

window.event_park = EventEngine.create({
  id: 'park',
  title: '엄마와의 공원 피크닉',
  bg: 'assets/bg/home.png',          // 시작은 실내(집). 공원 배경은 도중 setBg로 전환
  dialogues: {
    main: [
      // 이전 플레이의 변수 잔재 초기화
      { clearVars: ['hasUmbrella', 'hasLunch', 'hasMat'] },

      { narration: '오늘은 엄마와 공원으로 피크닉을 가는 날이다!' },
      { speaker: 'me', text: '(나가기 전에 준비를 해보자.)' },

      { branch: 'momJP', cases: {
        J: [
          { speaker: 'mom', text: '{child}~ 엄마가 준비 다 해놨으니까 도시락 싸놓은 것만 챙겨와~', expression: 'smile' },
          { speaker: 'me', text: '(엄마는 참 믿음직하다! 도시락을 잘 챙기자.)' },
          { choice: [
            // J루트: 엄마가 다 챙겨놨으니 우산도 있음(hasUmbrella) + 도시락(hasLunch)
            { id: 'pack_lunch_J', text: '도시락 챙기기', set: { hasLunch: 'true', hasUmbrella: 'true' } },
          ] },
          { itemReveal: 'park1', description: '{playerName}의 점심: 1.7키로 짜리 감자탕. 엄마의 사랑만큼 무겁고 맛있다. 우리 {playerName}의 점심~' },
          { speaker: 'me', text: '(이제 밖에 나가보자!)' },
          { goto: 'Park' },
        ],
        P: [
          { speaker: 'mom', text: '어머! 엄마가 짐 싸는 걸 깜빡했네. {child}, 조금만 도와줄래?' },
          { speaker: 'me', text: '(엄마는 참 덜렁이라니까. 엄마를 위해 소풍 짐을 싸자.)' },
          { speaker: 'me', text: '(가방이 작아서, 이 중 2개만 챙길 수 있을 것 같다.)' },
          { multiChoice: { pick: 2, options: [
            { id: 'pack_lunch',    text: '도시락', set: { hasLunch: 'true' } },
            { id: 'pack_mat',      text: '돗자리', set: { hasMat: 'true' } },
            { id: 'pack_umbrella', text: '우산',   set: { hasUmbrella: 'true' } },
          ] } },
          { goto: 'PItems' },
        ],
      } },
    ],

    // P루트: 고른 짐 아이템 지급 (고른 것만)
    PItems: [
      { branch: 'var:hasLunch', cases: {
        'true': [ { itemReveal: 'park1', description: '{playerName}의 점심: 1.7키로 짜리 감자탕. 엄마의 사랑만큼 무겁고 맛있다. 우리 {playerName}의 점심~' } ],
      } },
      { branch: 'var:hasMat', cases: {
        'true': [ { itemReveal: 'park3', description: '돗자리: 한강공원에선 5천원을 내고 빌려야 하는 부르주아의 상징. 쯔쯔가무시 조심!' } ],
      } },
      { branch: 'var:hasUmbrella', cases: {
        'true': [ { itemReveal: 'park2', description: '우산: 피크닉의 적인 비를 막아주는 멋진 도구. 날씨가 맑아 필요 없을지도…' } ],
      } },
      { speaker: 'me', text: '(이제 밖에 나가보자!)' },
      { goto: 'Park' },
    ],

    Park: [
      { setBg: 'park1' },
      { narration: '엄마와 함께 공원에 나왔다. 날도 맑고 풍경도 예쁘다!' },
      { speaker: 'mom', text: '우리 {child}이랑 밖에도 나오고 너무 좋네~', expression: 'smile' },
      { branch: 'momEI', cases: {
        E: [ { speaker: 'mom', text: '나온 김에 자전거 타고 한 바퀴 돌까?' } ],
        I: [ { speaker: 'mom', text: '자리 깔고 앉아서 책이나 읽을까?' } ],
      } },
      { speaker: 'me', text: '(엄마랑 같이 시간을 보내려는데…)' },

      { setBg: 'park2' },          // 빗소리와 동시에 흐린 배경으로
      { narration: '(빗소리)' },
      { speaker: 'mom', text: '어머나? 아까까진 그렇게 맑았는데…', expression: 'default' },
      { narration: '갑자기 날씨가 흐려지더니 비가 오기 시작했다.' },

      { branch: 'var:hasUmbrella', cases: {
        'true': [
          { speaker: 'mom', text: '우산을 챙겨와서 다행이네~', expression: 'smile' },
          { stats: { 애정: 2 } },
        ],
        '': [
          { speaker: 'mom', text: '나무 아래에서 피하자!' },
        ],
      } },

      { speaker: 'mom', text: '집에 갈까? 소풍은 집에서 해야겠네…', expression: 'default' },
      { narration: '그렇게 무사히 비를 피하고 있었을 때…' },

      { narration: '"먉, 먀옥. 므약."' },
      { speaker: 'mom', text: '응? 이게 무슨 소리지?' },
      { narration: '소리 나는 곳을 보니… 발치에 아기 고양이가 있었다!' },

      { branch: 'var:hasUmbrella', cases: {
        'true': [ { narration: '비를 피하려고 우리 우산으로 들어온 모양이다.' } ],
        '':     [ { narration: '비를 피하려고 나무 아래로 들어온 모양이다.' } ],
      } },

      { speaker: 'mom', text: '어머… 이렇게 어린 애가 왜 혼자 있을까?' },
      { speaker: 'mom', text: '어미를 잃었나 봐, 불쌍해라…' },
      { npcEnter: { name: '아기고양이', img: 'assets/npc/kitten.png' } },   // 정체 공개 시점에 이미지 등장
      { speaker: 'npc', text: '멻, 먓. 얏옹.' },
      { narration: '엄마는 아기고양이를 안타깝다는 듯이 바라보고 있다.' },

      { choice: [
        { id: 'cat_adopt', text: '우리가 기를까?',          route: 'Adopt' },
        { id: 'cat_care',  text: '비가 그칠 때까지 돌봐주자', route: 'CareUntilRain' },
      ] },
    ],

    Adopt: [
      { speaker: 'mom', text: '아유, 아무리 그래도… 그치만 가엽기도 하고… 하지만 그렇게 덜컥 데려가면은…' },
      { narration: '그렇게 말하면서 엄마는 기다렸다는 듯이 아기고양이를 집어들고 있었다.' },
      { speaker: 'mom', text: '다 클 때까지만 우리 집에서 기르고! 다 크면 독립시킬 거야.' },
      { speaker: 'me', text: '(절대 독립시키지 못할 것 같다. 집에 새 식구가 생긴 것 같다.)' },
      // 고양이는 펫으로 ownedItems에 추가(손에 X, 방을 돌아다님)
      { itemReveal: 'cat', description: '아기고양이: 비 오는 날 공원에서 만난 새 식구. 우리 집 막내가 되었다.' },
      { narration: '슬슬 비가 그쳐간다. 엄마와 나, 그리고 아기고양이는 집으로 가서 남은 소풍을 즐겼다.' },
      // 손에는 도시락(park1)을 들고 귀가
      { end: true, item: 'park1', stats: { 애정: 2 } },
    ],

    CareUntilRain: [
      { speaker: 'mom', text: '아유, 그래야겠다. 애기가 혼자 돌아다녀서 춥고 배고프겠네~' },
      { branch: 'var:hasLunch', cases: {
        'true': [
          { narration: '엄마는 그렇게 말하더니, 감자탕을 꺼내서 아기고양이한테 주기 시작했다…' },
          { narration: '아기고양이가 당황했다.' },
        ],
        '': [
          { narration: '엄마는 그렇게 말하더니 아기고양이를 쓰다듬었다.' },
          { narration: '아기고양이는 만족한 것 같다.' },
        ],
      } },
      { narration: '비가 그치자…' },
      { speaker: 'npc', text: '왓옹. 먀오오. 먊.' },
	{ npcExit: true },
      { narration: '어디선가 어미 고양이가 나타나 아기 고양이를 데려갔다. 다행이야!' },
      { narration: '엄마와 나는 집으로 가서 남은 소풍을 즐겼다.' },
      // 손에는 도시락(park1)을 들고 귀가
      { end: true, item: 'park1', stats: { 애정: 1 } },
    ],
  },
});
