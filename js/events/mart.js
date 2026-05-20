'use strict';

window.event_mart = EventEngine.create({
  id: 'mart',
  title: '장 보러 나오기',
  bg: 'assets/bg/mart.png',
  dialogues: {
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
      { speaker: 'mom', text: '우리 {child}, 과자 먹고 싶은 거 있어? 하나 사서 엄마랑 나눠 먹자.' },
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
      { speaker: 'mom', text: '백배로 살 거야? 우리 {child}, 누구한테 선물하려고? 오호호.', expression: 'smile' },
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
  },
});