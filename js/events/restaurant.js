'use strict';

window.event_restaurant = EventEngine.create({
  id: 'restaurant',
  title: '외식하러 가기',
  bg: 'assets/bg/restaurant.png',
  dialogues: {
    main: [
      { narration: '식당은 따스한 분위기의 패밀리 레스토랑이다.' },
	{ narration: '조금씩 들려오는 옆 테이블의 대화 소리와 주방의 달그락 거리는 소리가 마음을 편안하게 만들어준다.' },
	{ speaker: 'me', text: '(엄마와 나는 각자 먹고싶은 메뉴를 시켰다.)' },
	{ speaker: 'me', text: '(직원이 좀 불친절 한 것 같지만.. 뭐 괜찮겠지.)' },
	{ npcEnter: { name: '직원', img: 'assets/npc/waiter.png' } },
	{ speaker: 'npc', text: '손님 주문하신 메뉴 나왔습니다~' },
	 { propShow: 'cubefood' },
	{ speaker: 'me', text: '(엄마가 엄청나게 당황하는 것이 보인다...)' },
	{ speaker: 'mom', text: '어머, 이...이게 뭐지?' },
	{ speaker: 'mom', text: '우린 이런거 시킨 적이 없는데...' },
	{ branch: 'momEI', cases: {
  E: [
    { choice: [
      { text: '나도 같이 발을 동동 구른다',   route: 'eatE' },
      { text: '주방으로 성큼성큼 걸어간다',     route: 'chef' },
    ]}],

  I: [
    { choice: [
      { text: '내가 직원에게 따진다',  route: 'eatI' },
      { text: '주방으로 성큼성큼 걸어간다', route: 'chef' },
    ]}],
}},
    ],

eatE: [
	{ propExit: true },
	{ speaker: 'me', text: '(엄마가 쩔쩔매는 나를 본다...)' },
	{ speaker: 'me', text: '(당황하던 엄마의 눈에 곧 생기가 돌기 시작한다.)' },
	{ speaker: 'mom', text: '저기~ 요거 요거 저희가 시킨 게 아니어서 ㅎㅎ 확인 좀 해주실래요~?' },
	{ speaker: 'npc', text: '네? 아 죄송합니다. 30번 테이블에서 주문하신 걸 잘못 갖다드렸네요. 빠르게 다시 갖다드리겠습니다.' }
	{ npcExit: true },
	{ speaker: 'me', text: '(안도의 한숨을 내쉬었다.)' },
	{ speaker: 'me', text: '(엄마가 나를 보며 귀엽다는 듯 웃는다...)' },
	{ speaker: 'mom', text: '{playerName}은/는 아직도 애 같네! 귀여워~', expression: 'smile' },
	{ npcEnter: { name: '직원', img: 'assets/npc/waiter.png' } },
	{ narration: '다시 음식이 나왔다.' },
	{ speaker: 'npc', text: '아까 전에 실수해서 죄송합니다. 사죄의 의미로 햄버거 패티 50장 추가해 드렸습니다.' },
	 { propShow: 'burger' },
	{ speaker: 'me', text: '우와아아앗...! 감사합니다!' },
	{ narration: '엄마와 함께 즐거운 식사를 끝마쳤다...' },
	{ end: true }],

eatI: [
	{ propExit: true },
	{ speaker: 'me', text: '(직원에게 정중하게 항의하기로 했다...)' },
	{ textInput: { prompt: '뭐라고 말할까?', suffix: '', key: 'protest' } },
	{ speaker: 'me', text: '{protest}' },
	{ speaker: 'npc', text: '네? 아 죄송합니다. 30번 테이블에서 주문하신 걸 잘못 갖다드렸네요. 빠르게 다시 갖다드리겠습니다.' },
	{ npcExit: true },
	{ narration: '엄마가 나를 엄청나게 자랑스럽다는 눈빛으로 바라보기 시작했다.' },
	{ speaker: 'mom', text: '우리 {playerName}... 언제 이렇게 컸는지 몰라~' },
	{ npcEnter: { name: '직원', img: 'assets/npc/waiter.png' } },
	{ narration: '다시 음식이 나왔다.' },
	{ speaker: 'npc', text: '아까 전에 실수해서 죄송합니다. 사죄의 의미로 햄버거 패티 50장 추가해 드렸습니다.' },
	 { propShow: 'burger' },
	{ speaker: 'me', text: '우와아아앗...! 감사합니다!' },
	{ narration: '엄마와 함께 즐거운 식사를 끝마쳤다...' },
	{ end: true }],

chef: [
	{ propExit: true },
	{ npcExit: true },
	{ npcEnter: { name: '주방장', img: 'assets/npc/chef.png' } },
	{ narration: '주방에 들어왔다. 주방장의 모습이 보인다. 음식이 잘못나왔다고 말해야한다.' },
	{ textInput: { prompt: '뭐라고 말할까?', suffix: '', key: 'protest' } },
	{ speaker: 'me', text: '{protest}' },
	{ speaker: 'npc', text: '네??' },
	{ speaker: 'npc', text: '아...' },
	{ speaker: 'npc', text: '죄송합니다. 다시 가져다드릴게요.' },
	{ npcExit: true },
	{ narration: '다시 자리에 돌아왔다.' },
	{ speaker: 'me', text: '(왜 주문을 헷갈려했는지 알 것 같다...)' },
	{ narration: '엄마가 나를 조금 신기하다는 듯 쳐다본다.' },
	{ speaker: 'mom', text: '뭔가 {playerName}은/는 가끔씩 특이하게 문제를 해결한단 말이야? 그게 매력이지~', expression: 'smile' },
	{ npcEnter: { name: '직원', img: 'assets/npc/waiter.png' } },
	{ narration: '다시 음식이 나왔다.' },
	{ speaker: 'npc', text: '아까 전에 실수해서 죄송합니다. 사죄의 의미로 햄버거 패티 50장 추가해 드렸습니다.' },
	 { propShow: 'burger' },
	{ speaker: 'me', text: '우와아아앗...! 감사합니다!' },
	{ narration: '엄마와 함께 즐거운 식사를 끝마쳤다...' },
	{ end: true }]
	
  },
});