'use strict';

window.event_movie = EventEngine.create({
  id: 'movie',
  title: '엄마와의 두근두근 영화관 데이트',
  bg: 'assets/bg/movie1.png',
  dialogues: {
    main: [
      { narration: '엄마의 손을 잡고 영화관에 왔다. ' },
	{ narration: '영화관은 새로 개봉한 블록버스터 영화의 홍보로 시끄럽다.' },
	{ speaker: 'mom', text: '영화관은 오랜만에 오는 것 같네~' },
	{ narration: '영화관에 와서 들뜬 엄마의 뒷모습이 엄청나게 귀엽다...' },
	{ narration: '이제 무슨 영화를 볼 지 정해야 하는데...' },
	{ narration: '엄마가 좋아하는 영화가 뭐였지...?' },
   	{ choice: [
    	 { text: '기억난다', route: 'Remember'},
    	 { text: '기억나지 않는다', route: 'Forget'}]},
	],

Remember: [
	{ speaker: 'me', text: '(그래, 엄마가 좋아하는 영화는...)' },
	{ textInput: { prompt: '엄마가 좋아하는 영화는?', key: 'movie_genre' } },
	{ propShow: 'MovieFree'},
	{ narration: '엄마가 좋아하는 영화.'},
	{ propExit: true },
	{ speaker: 'mom', text: '그래! 그걸로 보자~', expression: 'smile' },
	{ narration: '엄마와 함께 {movie_genre}을/를 보러 상영관으로 들어간다...'},
	{goto: 'WatchMovie' }],

Forget: [
	{ speaker: 'me', text: '(으음... 엄마가 뭘 좋아했더라?)' },
	{ speaker: 'me', text: '(일단 오늘은 엄마의 취향에 맞아보이는 영화로 선택해보자.)' },
	{ speaker: 'mom', text: '{child}~ 무슨 영화 볼까?'},
	{ choice: [
        { text: '공포영화를 보자', set: {movie_genre: '장마, 홍련'} },
        { text: '로맨스 영화를 보자', set: {movie_genre: '비누남 이야기'} },
        { text: '액션 영화를 보자', set: {movie_genre: '이터널 다크니스'} }]},
	{ branch: 'var:movie_genre', cases: {
	'장마, 홍련': [ { propShow: 'MovieHorror'},
	 { narration: '화제의 공포영화 장마, 홍련.' }],
	'비누남 이야기': [ { propShow: 'MovieRomance'},
	 { narration: '화제의 로맨스 영화 비누남 이야기.' }],
	'이터널 다크니스': [ { propShow: 'MovieAction'},
	 { narration: '화제의 액션 영화 이터널 다크니스.' }],
	} },
	{ propExit: true },
	{ speaker: 'mom', text: '그래! 그걸로 보자~', expression: 'smile' },
	{ narration: '엄마와 함께 {movie_genre}을/를 보러 상영관으로 들어간다...'},
	{goto: 'WatchMovie' }],

WatchMovie: [
	{ setBg: 'movie2' },
	{ narration: '영화관은 사람이 많지 않다. 영화 표값이 비싸서 그런가...' },
	{ narration: '길고 긴 광고가 끝나고 드디어 영화가 시작한다.' },
	{ branch: 'var:movie_genre', cases: {
	'장마, 홍련': [ { propShow: 'MovieHorror'},
	{ speaker: 'me', text: '영화 도중 무서운 장면이 나올 때마다 엄마를 힐끗힐끗 쳐다보게 된다.' }],
	'비누남 이야기': [ { propShow: 'MovieRomance'},
	{ speaker: 'me', text: '영화 도중 설레는 장면이 나올 때마다 엄마를 힐끗힐끗 쳐다보게 된다.' }],
	'이터널 다크니스': [ { propShow: 'MovieAction'},
	{ speaker: 'me', text: '영화 도중 스펙타클한 장면이 나올 때마다 엄마를 힐끗힐끗 쳐다보게 된다.' }],
	} },
	{ speaker: 'me', text: '(집중해서 영화를 보는 엄마의 모습이 사랑스럽다.)' },
	{ speaker: 'me', text: '(엄마에게 무언가 할까?)' },
	{ choice: [
        { text: '엄마에게 살짝 기댄다.', stats: { 애정: 1, 감정성: 1 } },
        { text: '엄마의 손을 잡는다.', stats: { 애정: 1, 감정성: 1 } },
        { text: '엄마에게 팝콘을 먹여준다.', stats: { 애정: 2, 감정성: 2 } },
        { text: '아무것도 안한다.'}]},
	{ narration: '엄마는 살짝 놀라서 나를 잠시 바라본 뒤, 작게 웃었다.' },
	{ narration: '...' },
	{ propExit: true },
	{ narration: '영화가 끝났다.' },
	{ narration: '엄마는 어떻게 영화를 봤을까?' },
	{ narration: '나는 설렘 때문에 제대로 집중하지 못한 것 같다...' },
	{ end: true }]
	
  },
});