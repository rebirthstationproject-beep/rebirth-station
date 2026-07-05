# Cubelist 아이콘 디자인 평가 가이드

**작업 완료**: 2026-06-02 야간 루프
**평가 대상**: 10 앱 × 5 디자인 버전 = 50 디자인 셋트

---

## 한눈에 비교하기

브라우저에서 `preview.html`을 열면 50개 셋트를 그리드로 한 번에 비교 가능합니다.

```
E:\Claude-Workspace\rebirth-station\program\cubelist\design-iterations\preview.html
```

또는 PowerShell:
```powershell
ii E:\Claude-Workspace\rebirth-station\program\cubelist\design-iterations\preview.html
```

---

## 5개 디자인 버전 차별점

| 버전 | 특징 | 분위기 | 적합 사용처 |
|---|---|---|---|
| **v1 Flat Minimal** | 다크 BG + 브랜드 컬러 단색 outline 2px | 심플·가볍·정직 | 미니멀, 다크모드 |
| **v2 Glass Modern** | 브랜드 그라데이션 + 흰 빛 반사 + 글래스 | 프리미엄·럭셔리·iOS 톤 | 라이트모드, 럭셔리 |
| **v3 Neumorphism** | 인셋 그림자 + 부드러운 3D | 촉각적·매끈한·따뜻 | 위젯, 데스크톱 UI |
| **v4 Bold Outline** | 브랜드 단색 BG + 흰 굵은 stroke 3.5px | 강한·명확·가독성 | 작은 셀, 접근성 |
| **v5 Gradient Glow** | 다크 BG + radial glow + 그라데이션 + blur | 미래적·게이밍·네온 | 다크모드 강조, 스트리밍 |

---

## 10개 앱 작업 범위

### 풀 셋트 (메인 + 8 액션 모두 5 버전)
- **01 Photoshop** ✓ — 5 버전 풀 (9 파일 × 5 = 45 SVG)
- **04 Discord** ✓ — v1, v2 풀 (8 액션) + v3-v5 핵심 4 액션
- **05 Spotify** ✓ — v1-v2 핵심 4 (play, pause, next, like) + v3-v5 핵심 2-3

### 메인 로고 + 핵심 1 액션 (5 버전)
- **02 Premiere Pro** ✓ — 메인 Pr + play
- **03 Figma** ✓ — 메인 5색 + pen-tool
- **06 VS Code** ✓ — 메인 V + terminal
- **07 Chrome** ✓ — 메인 4색 + bookmark
- **08 OBS Studio** ✓ — 메인 원형 + start-stream
- **09 Notion** ✓ — 메인 N + todo
- **10 Slack** ✓ — 메인 # + channel

> 사용자가 어느 버전이 좋은지 결정하면, 결정된 버전으로 나머지 7 액션 풀 셋트 제작.

---

## 사용자 평가 피드백 작성 양식

`FEEDBACK.md` 파일에 다음과 같이 작성:

```markdown
# 사용자 평가 결과

## 베스트 버전
- 전체 베스트: v? (이유)
- 앱별 베스트:
  - Photoshop: v?
  - Premiere Pro: v?
  - Figma: v?
  - Discord: v?
  - Spotify: v?
  - VS Code: v?
  - Chrome: v?
  - OBS: v?
  - Notion: v?
  - Slack: v?

## 잘된 점
1. ...

## 못된 점 (수정 필요)
1. ...

## 추가 요청
1. ...
```

---

## 디자인 원칙 (전체 공통 확인사항)

- [x] 액션 아이콘은 10~20% 여백 확보 (안쪽 46~50px)
- [x] 메인 큐브리스트 아이콘은 꽉차게 (여백 0, 브랜드 로고 그대로)
- [x] 브랜드 컬러 정확 적용
- [x] 5 버전 차별점 명확
- [x] 일관성 (같은 버전끼리 동일 스타일 룰)
- [x] viewBox 0 0 64 64 통일
- [x] 배경 라운드 사각형 `rx="14"` 통일
