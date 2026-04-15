# 🏠 관찰 시뮬레이션 게임 — 프로토타입

캐릭터를 직접 커스터마이징하고, 3D 방 안에서 관찰하는 시뮬레이션 게임입니다.

## 📁 파일 구조

```
/
├── index.html          # 커스터마이징 화면
├── game.html           # 3D 방 씬
├── css/
│   └── style.css       # 전체 스타일
└── js/
    ├── parts.js        # 얼굴 파츠 정의 & 드로잉 함수
    ├── customize.js    # 커스터마이징 UI 로직
    └── game.js         # Three.js 3D 씬 & 애니메이션
```

## 🚀 실행 방법

### 로컬
```bash
# Python 간이 서버 (권장 — localStorage 작동)
python3 -m http.server 8000
# → http://localhost:8000
```
> `file://` 프로토콜로 직접 열면 localStorage가 일부 브라우저에서 제한될 수 있습니다.

### GitHub Pages
1. 저장소를 `main` 브랜치에 push
2. Settings → Pages → Source: `main / root`
3. 배포 후 `https://<user>.github.io/<repo>/` 접속

## 🎮 커스터마이징 항목

| 카테고리 | 세부 항목 |
|---|---|
| 얼굴 | 눈 (5종) · 코 (4종) · 입 (5종) · 눈 색 (4종) |
| 머리스타일 | 스타일 (5종) · 머리색 (6종) |
| 성격 | MBTI 성격 질문 8개 (E/I · S/N · T/F · J/P) → 16종 결과 |
| 피부 | 4종 (미리보기 패널 하단) |

## 🔮 향후 추가 예정 (TODO)

- [ ] 실제 3D 모델 교체 (`GLTFLoader` 연동)
- [ ] 성격 타입별 구체적인 행동 패턴 (앉기, 요리, 독서 등)
- [ ] 카메라 줌 / 시점 이동 고급 제어
- [ ] 더 다양한 파츠 및 색상 옵션
- [ ] 방 내 오브젝트 배치 커스터마이징

## 🛠️ 기술 스택

- **Three.js r128** — 3D 렌더링
- **Canvas 2D API** — 얼굴 드로잉 & 텍스처 생성
- **localStorage** — 커스터마이징 → 게임 씬 데이터 전달
- 외부 라이브러리 없음 (Three.js CDN 제외)
