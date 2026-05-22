# Rebirth Station — 사이트 개발 환경

**출처**: Claude Design 출력물 (2026-05-21)
**구조**: React 18 UMD + Babel standalone (in-browser JSX 컴파일)
**빌드**: 불필요 (정적 HTML + JSX 직접 로드)

---

## 파일 구조

```
rebirth-station/
├── index.html           ← 엔트리. 모든 JSX·JS 로드
├── i18n.js              ← 다국어 (ko/en)
├── styles.css           ← 전체 스타일
├── app.jsx              ← 루트 컴포넌트
├── hero.jsx             ← 히어로 섹션
├── sections.jsx         ← 나머지 섹션
├── logo.jsx             ← 로고 컴포넌트
├── tweaks-panel.jsx     ← Claude Design 디자인 조정 패널
├── logos.html           ← 로고 후보 갤러리 (별도)
├── screenshots/         ← Claude Design 작업 스크린샷 (참고용)
└── uploads/             ← 사용된 이미지 자산
```

---

## 로컬 실행 방법

### 방법 1 — Python (권장, 의존성 0)

```powershell
cd E:\Claude-Workspace\rebirth-station
python -m http.server 5500
```

브라우저 → http://localhost:5500/

### 방법 2 — Node.js (npx serve)

```powershell
cd E:\Claude-Workspace\rebirth-station
npx serve -p 5500 .
```

### 방법 3 — VS Code Live Server

VS Code 확장 "Live Server" 설치 후 `index.html` 우클릭 → "Open with Live Server"

---

## 왜 file:// 직접 열기는 안 되나?

`<script src="i18n.js">` 같은 외부 스크립트 + `text/babel` JSX 로드가 file:// 프로토콜에서 CORS 차단됨. 반드시 HTTP 서버로 띄워야 함.

---

## 다음 개발 단계

본 코드는 **프로토타입** 단계. 프로덕션 배포 시 다음 작업 필요:

1. **빌드 도구 전환** — Babel in-browser 컴파일은 개발용. Vite 또는 Next.js로 전환해 사전 빌드
2. **컴포넌트 분리** — 각 .jsx 파일을 모듈화 (현재는 글로벌 스코프)
3. **TypeScript 변환** — 타입 안전성
4. **i18n 라이브러리** — `i18n.js` 수동 객체 → `react-i18next` 또는 `next-intl`
5. **이미지 최적화** — Next.js Image 컴포넌트 또는 vite-imagetools
6. **SEO 메타** — Open Graph, Twitter Card, JSON-LD 추가
7. **rebirthstation.com 도메인 연결** — Vercel 배포 + 도메인 매핑
8. **PWA 매니페스트** — 모바일 설치 가능

## 통합 vs 분리 결정 사항

이 사이트는 **랜딩·마케팅 사이트**이고, `jusomoa-list/`는 **큐브 리스트 시스템(앱)**입니다. 두 가지 옵션:

| 옵션 | 구조 |
|---|---|
| A) 통합 | `jusomoa-list/apps/web/` 안에 흡수, Next.js 단일 프로젝트 |
| B) 분리 | `rebirth-station/` 랜딩 + `jusomoa-list/` 앱, 도메인은 같음 (rebirthstation.com / app.rebirthstation.com) |

→ Stage 1 시스템 완성 시점에 사용자 결정 필요.
