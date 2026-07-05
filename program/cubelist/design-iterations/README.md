# Cubelist Icon Design Iterations

**목적**: 10개 큐브 리스트 × 5개 디자인 버전 = 50개 아이콘 셋트
**진행 시작**: 2026-06-02 (야간 루프)
**평가**: 사용자가 아침에 어떤 버전이 잘되었는지 피드백

---

## 디자인 원칙 (전체 공통)

### 1. 여백 (Padding)
- **모든 액션 아이콘**: 캔버스의 10~20% 여백 확보 (cube cell 안에서 갑갑하지 않게)
- viewBox `0 0 64 64` 기준 → 안쪽 그래픽은 `48×48 ~ 52×52` 안에 위치
- 배경 라운드 사각형: `rect rx=14` (꽉찬 cube cell 느낌)

### 2. 큐브 리스트 메인 아이콘 (각 앱 폴더의 `00-cubelist-icon.svg`)
- **꽉차게** — 여백 없이 원본 브랜드 로고/아이콘 그대로 사용
- 배경색 = 브랜드 공식 컬러
- 사용자가 "이게 어느 브랜드의 큐브 리스트인지" 즉시 인지 가능해야 함

### 3. 액션 아이콘
- 브랜드 컬러 베이스 + 액션 메타포
- 일관성 있는 스타일 (한 폴더 안에서는 동일 stroke / fill / 디테일 룰)

---

## 폴더 구조

```
design-iterations/
├── README.md                         (본 파일)
├── style-guides/                     (5개 디자인 버전 가이드)
│   ├── v1-flat-minimal.md
│   ├── v2-glass-modern.md
│   ├── v3-neumorphism.md
│   ├── v4-bold-outline.md
│   └── v5-gradient-glow.md
└── apps/
    ├── 01-photoshop/
    │   ├── _brand-spec.md            (브랜드 컬러/로고/액션 리스트)
    │   ├── v1-flat-minimal/
    │   │   ├── _description.md
    │   │   ├── 00-cubelist-icon.svg  (꽉찬 Ps 로고)
    │   │   ├── 01-new-document.svg
    │   │   ├── ... (액션 아이콘들)
    │   ├── v2-glass-modern/
    │   ├── v3-neumorphism/
    │   ├── v4-bold-outline/
    │   └── v5-gradient-glow/
    ├── 02-premiere-pro/
    ├── 03-figma/
    ├── 04-discord/
    ├── 05-spotify/
    ├── 06-vscode/
    ├── 07-chrome/
    ├── 08-obs-studio/
    ├── 09-notion/
    └── 10-slack/
```

---

## 5개 디자인 버전 (차별점)

| 버전 | 키워드 | 특징 | 적합 사용처 |
|---|---|---|---|
| **v1 Flat Minimal** | 심플·단색 | 단일 컬러 outline + 채우기 없음, 가장 가벼움 | 미니멀리스트, 다크모드 강조 |
| **v2 Glass Modern** | 글래스모피즘 | 반투명 + blur + 그라데이션, iOS 26 스타일 | 프리미엄 느낌, 라이트모드 |
| **v3 Neumorphism** | 부드러운 3D | soft shadow + inset highlight, 촉각적 | 매크북/iPad UI, 데스크톱 위젯 |
| **v4 Bold Outline** | 굵은 라인 | stroke 3-4px + 강한 콘트라스트, Lucide 스타일 | 가독성 최우선, 접근성 |
| **v5 Gradient Glow** | 그라데이션 + 발광 | linear/radial gradient + soft glow, 사이버펑크 | 다크모드, 게임/스트리밍 |

---

## 10개 큐브 리스트 (앱/브랜드)

| # | 앱 | 브랜드 컬러 | 카테고리 |
|---|---|---|---|
| 01 | Photoshop | `#31A8FF` `#001E36` | 디자인 |
| 02 | Premiere Pro | `#EA77FF` `#2A0834` | 영상 |
| 03 | Figma | `#F24E1E` `#A259FF` `#1ABCFE` `#0ACF83` | 디자인 |
| 04 | Discord | `#5865F2` | 커뮤니티 |
| 05 | Spotify | `#1DB954` `#000000` | 음악 |
| 06 | VS Code | `#007ACC` `#0098FF` | 개발 |
| 07 | Chrome | `#4285F4` `#34A853` `#FBBC04` `#EA4335` | 브라우저 |
| 08 | OBS Studio | `#302E31` `#FFFFFF` | 스트리밍 |
| 09 | Notion | `#000000` `#FFFFFF` | 생산성 |
| 10 | Slack | `#4A154B` `#ECB22E` `#36C5F0` `#2EB67D` `#E01E5A` | 협업 |

---

## 평가 방법

각 앱 폴더에서 v1~v5 비교:
- `00-cubelist-icon.svg` (메인 로고) → 브랜드 인지도
- 액션 아이콘들 → 기능 이해도 + 디자인 일관성
- `_description.md` → 디자인 의도 + 차별점

사용자 피드백:
> "Photoshop은 v3이 좋고, Discord는 v5가 좋다"
→ 베스트 조합을 추출하여 큐브리스트 본체에 통합

---

## 진행 상태

- [x] 폴더 구조 50개 생성
- [x] 마스터 README
- [x] 5 스타일 가이드
- [x] 10 브랜드 spec
- [ ] Photoshop × 5 버전 (1차)
- [ ] Discord × 5 버전 (2차)
- [ ] 나머지 8개 앱 × 5 버전

야간 루프로 순차 진행. 아침에 결과 확인.
