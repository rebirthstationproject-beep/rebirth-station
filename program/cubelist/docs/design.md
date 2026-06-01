# 큐브 리스트 디자인 시스템 — 10 Level 학습 가이드

> 본 문서는 큐브 리스트(Cube List) 아이콘 + UI 디자인의 점진적 학습 자산.
> 작성: 2026-06-01. 사용자 요청 "10레벨 수준 디자인 학습 → 아이콘 제작 가능 수준" 충족 목표.
>
> **fal.ai 없이 자체 SVG 디자인 시스템 구축**.

---

## 학습 로드맵 (10 레벨)

| Level | 주제 | 학습 깊이 | 산출물 |
|---|---|---|---|
| 1 | 캔버스 & 그리드 | 기초 | 24/32/64/144 px 시스템 |
| 2 | 컬러 시스템 | 토큰 | rbs-accent + neutral + brand |
| 3 | 라인 & 스트로크 | 일관성 | 2px / round cap / round join |
| 4 | 기하학 | 형태 | 원/사각/삼각/8각 + 황금비 |
| 5 | 메타포 | 의미 | 액션 카테고리 → 형상 |
| 6 | 컴포지션 | 구성 | 중심 + 시각 무게 + 여백 |
| 7 | 디테일 | 정밀 | 1px 정렬 + sub-pixel + 광학 |
| 8 | 상태 변형 | 인터랙션 | hover/active/disabled/states |
| 9 | 모션 & 라이브 | 동적 | 시계/타이머/게이지/배터리 |
| 10 | 시스템 | 자동화 | design token + 자동 생성기 |

---

# Level 1 — 캔버스 & 그리드

## 학습 내용

### 캔버스 사이즈

| 용도 | 픽셀 | 비율 |
|---|---|---|
| 큐브 셀 표시 | 112 × 112 | 1:1 |
| 큐브 아이콘 영역 (cube-icon-bg) | 84 × 84 | 1:1 |
| Inspector 미리보기 | 144 × 144 | 1:1 |
| 큐브 셀 라벨 영역 | 112 × 24 | 14:3 |
| 인스펙터 아이콘 업로드 | 144 × 144 (권장) | 1:1 |
| SVG viewBox 표준 | 0 0 24 24 | 1:1 |
| StreamDeck 호환 PNG | 144 × 144 | 1:1 |
| StreamDeck @2x PNG | 288 × 288 (high-DPI) | 1:1 |

### Safe Area

```
┌───────────────────────────┐
│  ┌─────────────────────┐  │  ← 외곽 패딩 2px (24 viewBox 기준)
│  │                     │  │
│  │   visual content    │  │  ← Safe Area = 20 × 20
│  │                     │  │
│  │                     │  │
│  └─────────────────────┘  │
└───────────────────────────┘
```

### 그리드

- **모듈러 그리드**: 24 viewBox에서 4 × 4 모듈 (셀 6 × 6)
- **베이스 라인**: y = 12 (수직 중심)
- **이등분선**: x = 12, y = 12

## 규칙

1. 모든 SVG는 `viewBox="0 0 24 24"`로 시작
2. 시각 콘텐츠는 (2, 2) ~ (22, 22) 안에
3. 핵심 메타포 중심은 (12, 12)
4. 광학 보정 필요 시 1px 까지 이동 허용

## 코드 (Level 1)

```typescript
// lib/icon-generator/level1-canvas.ts
export const CANVAS = {
  VIEWBOX: '0 0 24 24',
  CUBE_CELL: 112,
  CUBE_ICON_BG: 84,
  INSPECTOR_PREVIEW: 144,
  SD_PNG: 144,
  SD_PNG_2X: 288,
  SAFE_AREA_PADDING: 2,
} as const;

export interface CanvasSpec {
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  readonly safeArea: { top: number; right: number; bottom: number; left: number };
  readonly center: { x: number; y: number };
}

export const STANDARD_CANVAS: CanvasSpec = {
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
  safeArea: { top: 2, right: 2, bottom: 2, left: 2 },
  center: { x: 12, y: 12 },
};
```

---

# Level 2 — 컬러 시스템

## 학습 내용

### Cube List 코어 팔레트 (사용자 명시 — 무채색 톤)

```css
:root {
  /* 배경 — Stream Deck LCD 톤 */
  --color-bg: #0a0a0a;
  --color-surface: #141414;
  --color-surface-2: #1a1a1a;

  /* 보더 / 디바이더 */
  --color-border: #2a2a2a;
  --color-border-strong: #404040;

  /* 텍스트 */
  --color-ink: #f5f5f5;
  --color-ink-muted: #8a8a8a;
  --color-ink-dim: #5a5a5a;

  /* 강조 (브랜드 컨텍스트별 재구성 가능) */
  --rbs-accent: #6366f1; /* 코어 indigo */
  --rbs-accent-strong: #4f46e5;
  --rbs-accent-soft: rgba(99, 102, 241, 0.1);
}
```

### 콜라보 컬러 (사용자 명시 — 브랜드별 재구성)

- **ver.주소모아**: 핑크 (#EC4899 / #F472B6)
- **ver.케이링크**: 블루 (`klink` 전용)
- **코어 (Rebirth Station)**: indigo (#6366F1)

### 브랜드 컬러 매핑 (vendor 큐브 아이콘)

```typescript
export const BRAND_COLORS = {
  Adobe: { primary: '#31A8FF', secondary: '#001E36' }, // Photoshop blue
  AdobeRed: { primary: '#FF0000', secondary: '#990000' }, // Premiere
  Discord: { primary: '#5865F2', secondary: '#404EED' },
  Spotify: { primary: '#1DB954', secondary: '#1AA34A' },
  YouTube: { primary: '#FF0000', secondary: '#CC0000' },
  Twitch: { primary: '#9146FF', secondary: '#772CE8' },
  GitHub: { primary: '#24292F', secondary: '#0D1117' },
  OBS: { primary: '#302E31', secondary: '#1A1A1D' },
  Elgato: { primary: '#0093D0', secondary: '#005F8C' },
  PhilipsHue: { primary: '#4FC3F7', secondary: '#0277BD' },
  Streamlabs: { primary: '#80F5D2', secondary: '#31C9A9' },
  Voicemod: { primary: '#FF3D7F', secondary: '#D62E60' },
  Microsoft: { primary: '#0078D4', secondary: '#005A9E' },
  PowerPoint: { primary: '#D24726', secondary: '#B7411F' },
} as const;
```

### 카테고리 컬러 (액션 의미별)

```typescript
export const CATEGORY_COLORS = {
  navigation: { primary: '#3B82F6', secondary: '#1D4ED8' }, // blue
  edit: { primary: '#8B5CF6', secondary: '#6D28D9' }, // violet
  view: { primary: '#06B6D4', secondary: '#0E7490' }, // cyan
  layer: { primary: '#F59E0B', secondary: '#B45309' }, // amber
  selection: { primary: '#EC4899', secondary: '#BE185D' }, // pink
  filter: { primary: '#10B981', secondary: '#047857' }, // emerald
  text: { primary: '#6366F1', secondary: '#4338CA' }, // indigo
  shape: { primary: '#F43F5E', secondary: '#BE123C' }, // rose
  tool: { primary: '#84CC16', secondary: '#4D7C0F' }, // lime
  fill: { primary: '#EAB308', secondary: '#A16207' }, // yellow
  transform: { primary: '#A855F7', secondary: '#7E22CE' }, // purple
  color: { primary: '#FB923C', secondary: '#C2410C' }, // orange
  brush: { primary: '#22D3EE', secondary: '#0891B2' }, // sky
  time: { primary: '#FF9800', secondary: '#F57C00' }, // orange
  audio: { primary: '#7B1FA2', secondary: '#4A148C' }, // purple
  system: { primary: '#64748B', secondary: '#334155' }, // slate
} as const;
```

### 대비 규칙

- 검정 배경 (#0a0a0a) 위 텍스트 최소 대비 **4.5:1** (WCAG AA)
- 아이콘 stroke 색은 배경 대비 최소 **3:1**
- 강조 요소는 최소 **7:1** (WCAG AAA)

### 다크 모드 적응

큐브 리스트는 **다크 모드 단일**. 라이트 모드 미지원 (Stream Deck LCD 톤 유지).

## 규칙

1. 무채색 베이스 + 컨텍스트 강조 컬러
2. brand color는 vendor 아이콘에만 사용 (오리지널 유지)
3. 카테고리 컬러는 generated 아이콘에 사용
4. 한 아이콘에 색상 최대 2개 (primary + secondary)
5. 그라데이션은 placeholder 큐브에만

## 코드 (Level 2)

```typescript
// lib/icon-generator/level2-color.ts
export function categoryFromAction(action_type: string, label: string): keyof typeof CATEGORY_COLORS {
  const l = label.toLowerCase();
  const a = action_type;
  if (a === 'live_clock' || a === 'live_timer' || /clock|time|timer/i.test(l)) return 'time';
  if (a === 'media_key' || /volume|mute|audio|play|pause/i.test(l)) return 'audio';
  if (/layer/i.test(l)) return 'layer';
  if (/select|mask/i.test(l)) return 'selection';
  if (/brush|pen|eraser/i.test(l)) return 'brush';
  if (/color|hue|saturation|black|white|adj_/i.test(l)) return 'color';
  if (/transform|rotate|scale|flip/i.test(l)) return 'transform';
  if (/fill|stroke/i.test(l)) return 'fill';
  if (/text|type|font/i.test(l)) return 'text';
  if (/zoom|view|rulers|grid/i.test(l)) return 'view';
  if (/shape|line|rectangle|polygon/i.test(l)) return 'shape';
  if (/page|folder|back|forward|home/i.test(l)) return 'navigation';
  if (/file|save|open|export|new/i.test(l)) return 'system';
  if (/blur|filter/i.test(l)) return 'filter';
  return 'system';
}
```

---

# Level 3 — 라인 & 스트로크

## 학습 내용

### Stroke 두께 시스템

| 컨텍스트 | 두께 (24 viewBox) | 144 PNG 환산 |
|---|---|---|
| 메인 윤곽 | 2 | 12 |
| 보조 디테일 | 1.5 | 9 |
| 미세 디테일 | 1 | 6 |
| 강조 (selected, hover) | 2.5 | 15 |

### Line Cap & Join

- **stroke-linecap**: `round` (모든 경우 — 무딘 느낌)
- **stroke-linejoin**: `round` (각진 끝 회피)
- **fill-rule**: `evenodd` (복잡한 패스에 일관성)

### 광학 정렬

- 스트로크 중심 기준이 아닌 **outside aligned**
- viewBox 24 기준 1px 격자에 strict 정렬
- 0.5px 사용 시 anti-alias 결과 흐림 → 회피

## 규칙

1. 모든 stroke = `round`
2. 두께는 정수 또는 `.5` 단위
3. 동일 아이콘 안 stroke 두께 ≤ 2종
4. fill + stroke 동시 사용 시 stroke가 fill 위
5. 그림자 / glow는 SVG `<filter>` 가 아닌 외부 CSS `drop-shadow`로

## 코드 (Level 3)

```typescript
// lib/icon-generator/level3-stroke.ts
export const STROKE = {
  MAIN: 2,
  SECONDARY: 1.5,
  MICRO: 1,
  EMPHASIS: 2.5,
} as const;

export const STROKE_PROPS = {
  strokeWidth: STROKE.MAIN,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
};
```

---

# Level 4 — 기하학 & 형태

## 학습 내용

### 기본 도형 (24 viewBox)

```
원 (중심 12,12 반경 8):  <circle cx="12" cy="12" r="8" />
사각형 (8,8 → 16,16):    <rect x="8" y="8" width="8" height="8" />
삼각형 (위 정점):         <polygon points="12,4 20,20 4,20" />
8각형:                   <polygon points="9,4 15,4 20,9 20,15 15,20 9,20 4,15 4,9" />
다이아몬드:              <polygon points="12,4 20,12 12,20 4,12" />
```

### 황금비 적용

- 황금비 φ = 1.618
- 24 / φ = 14.83 → **15** (큐브 안 메인 영역)
- 큰 형태 : 작은 형태 = 14 : 8 (φ)

### 코너 라운딩

| 용도 | rx |
|---|---|
| 큐브 셀 외곽 | 14 |
| 아이콘 컨테이너 (cube-icon-bg) | 14 |
| 아이콘 내부 요소 | 2~3 (24 viewBox) |
| 마이크로 디테일 | 1 |

### 비율 가이드

```
1:1   → 정사각형, 원        (균형)
1:2   → 직사각형             (다이내믹)
1:√2  → A4 비율               (정중)
1:φ   → 황금비                 (조화)
3:4   → TV 비율                (안정)
```

## 코드 (Level 4)

```typescript
// lib/icon-generator/level4-geometry.ts
export const GEOM = {
  PHI: 1.618,
  CENTER: { x: 12, y: 12 },
  RADII: {
    LARGE: 8,
    MEDIUM: 5,
    SMALL: 3,
    MICRO: 1.5,
  },
  CORNERS: {
    OUTER: 3,
    INNER: 2,
    MICRO: 1,
  },
} as const;

export function svgCircle(cx: number, cy: number, r: number, props?: Record<string, string | number>) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}"${propsToStr(props)} />`;
}

export function svgRoundedRect(x: number, y: number, w: number, h: number, rx: number, props?: Record<string, string | number>) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}"${propsToStr(props)} />`;
}

function propsToStr(p?: Record<string, string | number>): string {
  if (!p) return '';
  return ' ' + Object.entries(p).map(([k, v]) => `${k}="${v}"`).join(' ');
}
```

---

# Level 5 — 메타포 (Semantic Mapping)

## 학습 내용

### 액션 → 메타포 매핑

```
edit / undo       → ↩ 화살표 휘는 형상
edit / redo       → ↪ 반대 방향 화살표
edit / copy       → 두 개 겹친 사각형 (앞 + 뒤)
edit / paste      → 클립보드 형상 + 화살표
edit / cut        → 가위 형상
edit / delete     → 휴지통 형상
edit / undo all   → ⏮ 여러 화살표 묶음

navigation / back     → ← 화살표
navigation / forward  → → 화살표
navigation / home     → 집 형상
navigation / page next → 페이지 + 화살표
navigation / folder   → 📁 폴더 윤곽

layer / new       → + 사각형 (스택 추가)
layer / delete    → - 사각형
layer / group     → 사각형 묶음 + 점선
layer / merge     → 두 사각형이 하나로
layer / duplicate → 스택 + +

selection / all   → 점선 사각형 (4 모서리 표시)
selection / inverse → 점선 사각형 + 반전 화살표

filter / blur     → 점들이 흐릿한 표현
filter / sharpen  → 점들이 명확
filter / noise    → 작은 점 격자

color / picker    → 스포이드 형상
color / hue       → 컬러 휠
color / contrast  → 반원 흰 + 반원 검정

brush / size      → 원 (큰 + 작은)
brush / opacity   → 반투명 원
brush / flow      → 점들이 흐르는 형상

tool / move       → 4방향 화살표 십자
tool / hand       → 손바닥 윤곽
tool / zoom       → 돋보기 (원 + 손잡이)

transform / rotate    → ↻ 곡선 화살표
transform / scale     → 모서리 화살표 4방향
transform / flip      → 거울 반사 형상
transform / perspective → 사다리꼴

text / horizontal → T 큰 글자
text / vertical   → T 회전된 글자
text / font       → A + 작은 a

shape / line      → / 선
shape / rectangle → 빈 사각
shape / ellipse   → 빈 원
shape / polygon   → 8각형

system / save     → 💾 디스크
system / open     → 📂 폴더 열림
system / new      → 📄 빈 페이지
system / export   → 화살표 페이지 밖으로
system / settings → ⚙ 톱니바퀴

time / clock      → 원 + 12,3,6,9 표시 + 바늘
time / timer      → 원 + 카운트 + 모래시계
time / battery    → 직사각형 + 채움

audio / play      → ▶ 삼각형
audio / pause     → ⏸ 두 직사각형
audio / stop      → ⏹ 사각형
audio / volume    → 스피커 + 곡선
audio / mute      → 스피커 + X
audio / next      → ⏭
audio / prev      → ⏮
```

### 추상화 단계

| Level | 정도 | 예시 |
|---|---|---|
| 1 | 사진/사실 | 실제 카메라 사진 (X — 큐브에 부적합) |
| 2 | 일러스트 | 입체 + 디테일 (X) |
| 3 | 평면 (flat) | Material Design 스타일 (△) |
| 4 | 라인 (outline) | 윤곽선만 (✓) |
| 5 | 픽토그램 | 최소 형태로 의미 전달 (✓ 권장) |
| 6 | 기호 | 완전 추상 (단축키 글자 같은) (✓) |

→ **큐브 리스트 표준 = Level 4~5 (outline + pictogram)**

## 규칙

1. 각 액션마다 명확한 메타포 1개
2. 동일 메타포는 카테고리 내 일관
3. 외래 문자/이모지는 fallback으로만
4. 추상화는 Level 4~5 우선
5. 사용자가 5초 안 인식 가능해야 함

---

# Level 6 — 컴포지션

## 학습 내용

### 시각 무게 (Visual Weight)

- 큰 형태 > 작은 형태
- 진한 색 > 옅은 색
- 채움 > 윤곽
- 중심 > 모서리
- 라운드 > 각진

### 균형

```
대칭 (symmetric):       좌우/상하 거울
비대칭 (asymmetric):    의도된 한쪽 강조
방사형 (radial):        중심에서 퍼짐
```

### 여백 (Negative Space)

- 아이콘 안 빈 공간은 메시지의 일부
- 24 viewBox에서 stroke 사이 최소 간격: 2px
- 그룹 분리: 4px 이상 여백

### 정렬

| 정렬 방식 | 사용 |
|---|---|
| 중심 정렬 | 단일 객체 (recommended) |
| 좌측 정렬 | 텍스트 + 아이콘 조합 |
| 격자 정렬 | 여러 객체 (2x2, 3x3) |

### 시각 보정

광학 보정 (눈에 보이는 균형):
- 원이 사각형보다 작게 보임 → 원을 +1px 크게
- 검정 사각형이 흰 사각형보다 무겁게 보임 → 검정 -1px

## 규칙

1. 가능하면 시각 중심 (visual center, 12, 11.5)에 메인 요소
2. 자유 균형 > 강제 대칭
3. 그룹은 여백 4px 이상 분리
4. 1px 광학 보정 허용

---

# Level 7 — 디테일 & 정밀

## 학습 내용

### Pixel-Perfect 정렬

- 모든 좌표는 0.5 또는 정수
- stroke 중심이 픽셀 격자에 정렬되도록 조정
- 1px stroke + 정수 좌표 = sharp
- 1.5px stroke + .5 좌표 = sharp

### Anti-Aliasing 제어

```svg
<svg shape-rendering="crispEdges">  <!-- 픽셀 -->
<svg shape-rendering="geometricPrecision">  <!-- 기하 -->
<svg shape-rendering="auto">  <!-- 기본 -->
```

큐브 리스트 표준: `auto` (브라우저 결정)

### Sub-Pixel 디테일

- 24 viewBox는 적당히 단순. 32+ 또는 144 PNG에서 디테일 표현 가능
- 미세 라인은 144 PNG로 export

## 규칙

1. 좌표 격자 정렬 (.0 또는 .5)
2. stroke-alignment: outside (CSS) 또는 path 직접
3. 144 PNG export 시 디테일 보완

---

# Level 8 — 상태 변형

## 학습 내용

### 큐브 셀 상태

| 상태 | 시각 변화 |
|---|---|
| default | base color |
| hover | brightness +10%, box-shadow ↑ |
| active (pressed) | scale 0.96, brightness +20% |
| selected | accent outline 2px |
| disabled | opacity 40%, no interaction |
| dragging | opacity 50%, rotate 1deg |
| drop-target | accent overlay 30% |

### 큐브 액션 상태 (hotkey_toggle 등)

```
states: [
  { label: 'On',  icon_url: 'green.svg',  payload: {keys: ['F1']} },
  { label: 'Off', icon_url: 'gray.svg',   payload: {keys: ['F1']} },
]
current_index: 0 / 1
```

→ 동일 아이콘 + 색상 변화만으로 상태 표현

### 변형 애니메이션

- transition: 0.15s ease (모든 상태)
- transform-origin: center

## 규칙

1. 상태 변화는 단계적 (점진)
2. 변화 폭은 ±20% 이내 (대조 너무 강하지 않게)
3. CSS variable + transition 사용

---

# Level 9 — 모션 & 라이브

## 학습 내용

### 라이브 큐브 4 종류

| 액션 | 표시 | 갱신 주기 |
|---|---|---|
| live_clock (analog) | SVG 시침/분침/초침 회전 | 1초 |
| live_clock (HH:MM:SS) | 디지털 큰 글씨 | 1초 |
| live_clock (HH:MM) | 디지털 큰 글씨 | 30초 |
| live_timer | 원형 카운트다운 + MM:SS | 1초 |
| live_battery | 사각 + % | 30초 |
| live_gauge | 반원 + 수치 | 1초 |

### SVG 애니메이션 — JS 갱신

```typescript
// 시침 각도: (시 + 분/60) * 30
const hourAngle = (h + m / 60) * 30;
// React state + setInterval
const [now, setNow] = useState(() => new Date());
useEffect(() => {
  const i = setInterval(() => setNow(new Date()), 1000);
  return () => clearInterval(i);
}, []);
```

### CSS 애니메이션 (덜 정확)

```css
@keyframes spin-once {
  to { transform: rotate(360deg); }
}
.second-hand {
  animation: spin-once 60s linear infinite;
}
```

→ JS 갱신 우선 (정확한 동기화)

### Performance

- 1초 tick = 1 큐브당 1회 React re-render → 큐브 30개여도 무리 없음
- useMemo로 SVG 메모이제이션
- requestAnimationFrame은 사용 X (필요 없음)

## 규칙

1. 동적 큐브는 React state + setInterval
2. tick 주기는 표시 단위와 일치 (HH:MM → 30초)
3. 시각화 디테일 (시계 마커, 게이지 라벨) 은 정적 SVG

---

# Level 10 — 시스템 & 자동화

## 학습 내용

### 디자인 토큰 (Single Source of Truth)

```typescript
// design-tokens.ts
export const TOKENS = {
  canvas: { viewBox: '0 0 24 24', center: [12, 12], safe: 2 },
  stroke: { main: 2, secondary: 1.5, micro: 1 },
  geometry: { radii: { L: 8, M: 5, S: 3 }, corners: { outer: 3 } },
  color: { /* Level 2 컬러 시스템 */ },
  category: { /* Level 2 카테고리 컬러 */ },
} as const;
```

### 자동 아이콘 생성기 (Generator)

```typescript
function generateIcon(spec: {
  label: string;
  action_type: string;
  // 자동 결정:
  // category → color
  // semantic → metaphor (Level 5)
  // 자체 SVG 컴포지션
}): string {
  const category = categoryFromAction(spec.action_type, spec.label);
  const colors = CATEGORY_COLORS[category];
  const metaphor = matchMetaphor(spec.label, spec.action_type);
  return composeSvg(metaphor, colors);
}
```

### 모듈러 아이콘 (Building Blocks)

```typescript
// 기본 블록 — 조합으로 새 아이콘 생성
const BLOCKS = {
  arrow: { up: '...', down: '...', left: '...', right: '...' },
  circle: { outline: '...', filled: '...' },
  rect: { outline: '...', filled: '...' },
  letter: { A: '...', B: '...', /* ... */ },
  plus: '...',
  minus: '...',
  cross: '...',
  // 60+ 블록
};
```

### 검증 자동화

```typescript
function validateIcon(svg: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!svg.includes('viewBox="0 0 24 24"')) errors.push('viewBox 불일치');
  if (!svg.includes('stroke-linecap="round"')) errors.push('stroke-linecap 표준 위반');
  // ... 30+ 검증
  return { ok: errors.length === 0, errors };
}
```

### 진행률 측정

- 동일 SVG가 동일 입력에서 항상 생성 → 결정론적
- 시각 일관성 점수 (color/stroke/composition) 자동 계산

---

# 아이콘 카탈로그 (액션별 자체 SVG)

본 카탈로그는 큐브 리스트 자체 디자인 시스템으로 생성한 표준 아이콘. 사용자가 정의한 액션 26종에 대해 1:1 매핑.

## link

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1" />
  <path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" />
</svg>
```

## shortcut

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#84CC16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="6" width="18" height="12" rx="2" />
  <line x1="7" y1="10" x2="7" y2="10" />
  <line x1="11" y1="10" x2="11" y2="10" />
  <line x1="15" y1="10" x2="15" y2="10" />
  <line x1="7" y1="14" x2="17" y2="14" />
</svg>
```

## macro

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="6" cy="6" r="2" />
  <circle cx="12" cy="6" r="2" />
  <circle cx="18" cy="6" r="2" />
  <path d="M6 8v8M12 8v8M18 8v8" />
  <path d="M4 18h16" />
</svg>
```

## folder

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 7v11a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-7l-2-2H5a2 2 0 00-2 2z" />
</svg>
```

## text_insert

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 6h16M12 6v14" />
  <path d="M8 20h8" />
</svg>
```

## clipboard_copy

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="3" width="6" height="3" rx="1" />
  <rect x="6" y="5" width="12" height="16" rx="2" />
</svg>
```

## app_launch

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 14l8-8 8 8" />
  <path d="M12 6v15" />
  <path d="M4 21h16" />
</svg>
```

## focus_window

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="2" />
  <rect x="7" y="7" width="10" height="10" rx="1" />
</svg>
```

## mouse_click

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2v6M12 18v4" />
  <path d="M4 12h6M14 12h6" />
  <circle cx="12" cy="12" r="2" fill="#64748B" />
</svg>
```

## plugin_action

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 5v4H5v6h4v4h6v-4h4V9h-4V5z" />
</svg>
```

## media_key

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#7B1FA2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 5L6 9H3v6h3l5 4z" />
  <path d="M15 9a5 5 0 010 6" />
  <path d="M18 6a9 9 0 010 12" />
</svg>
```

## page_navigate / page_jump / folder_up / folder_open / window_close

```svg
<!-- page_navigate -->
<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 12h14M13 5l7 7-7 7" />
</svg>

<!-- page_jump -->
<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 12h18M8 5L3 12l5 7M16 5l5 7-5 7" />
</svg>

<!-- folder_up -->
<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 7v11a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-7l-2-2H5a2 2 0 00-2 2z" />
  <path d="M12 14V10M9 13l3-3 3 3" />
</svg>

<!-- folder_open -->
<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 7v11a2 2 0 002 2h14a2 2 0 002-2V9h-9l-2-2H5a2 2 0 00-2 2z" />
  <path d="M3 11h18" />
</svg>

<!-- window_close -->
<svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="2" />
  <path d="M9 9l6 6M15 9l-6 6" />
</svg>
```

## system_sleep / system_actionbar_toggle

```svg
<!-- system_sleep -->
<svg viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
</svg>

<!-- system_actionbar_toggle -->
<svg viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="5" width="18" height="14" rx="2" />
  <path d="M3 9h18" />
</svg>
```

## hotkey_toggle

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#84CC16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="6" width="18" height="12" rx="2" />
  <path d="M7 12h4M13 12h4" />
  <circle cx="9" cy="12" r="1" fill="#84CC16" />
</svg>
```

## audio_play

```svg
<svg viewBox="0 0 24 24" fill="#7B1FA2" stroke="#7B1FA2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="6 4 20 12 6 20" />
</svg>
```

## profile_rotate

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12a9 9 0 11-3-6.7" />
  <path d="M21 4v6h-6" />
</svg>
```

## live_clock (analog)

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#FF9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" />
  <path d="M12 6v6l4 2" />
</svg>
```

## live_timer

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#FF9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2v3M9 5h6" />
  <circle cx="12" cy="14" r="8" />
  <path d="M12 11v3l2 2" />
</svg>
```

## live_gauge

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#F44336" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 18a8 8 0 0116 0" />
  <path d="M12 18v-5" />
  <circle cx="12" cy="18" r="1" fill="#F44336" />
</svg>
```

## live_battery

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="8" width="16" height="8" rx="1" />
  <rect x="20" y="10" width="2" height="4" rx="0.5" fill="#4CAF50" />
  <rect x="5" y="10" width="8" height="4" rx="0.5" fill="#4CAF50" stroke="none" />
</svg>
```

---

# 검증 체크리스트 (모든 아이콘 공통)

```
□ viewBox="0 0 24 24"
□ stroke-linecap="round"
□ stroke-linejoin="round"
□ stroke-width = 1.5 / 2 / 2.5 중 하나
□ 좌표 정수 또는 .5 단위
□ Safe area (2,2) ~ (22,22) 안 유지
□ 색상 ≤ 2개 (primary + secondary)
□ 중심 정렬 (12, 12)
□ 카테고리 컬러 정확
□ 의미 5초 안에 인식 가능
□ 144 PNG export 시 디테일 유지
```

---

# 자동 생성기 사용 (Level 10 통합)

```typescript
// lib/icon-generator/index.ts
import { generateIcon } from './generator';

// React 컴포넌트
function CubeIconAuto({ label, action_type }: { label: string; action_type: string }) {
  const svgString = useMemo(
    () => generateIcon({ label, action_type }),
    [label, action_type],
  );
  return <div dangerouslySetInnerHTML={{ __html: svgString }} />;
}

// 또는 base64 data URL
function asDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
```

---

# 적용 우선순위 (디자인 시스템 → 실제 적용)

| 우선순위 | 영역 | 작업 |
|---|---|---|
| 1 | placeholder 큐브 | hash 컬러 그라데이션 + 라벨 글자 |
| 2 | live_* 큐브 | LiveCubeVisual 컴포넌트 (이미 적용) |
| 3 | 액션 기본 아이콘 | icon-generator.ts (신규) |
| 4 | StreamDeck 변환 큐브 | metadata.sd_uuid + 라벨 → 자체 SVG fallback |
| 5 | 사용자 직접 아이콘 업로드 | 디자인 가이드라인 안내 |

---

# 참고 자료

- StreamDeck Icon Sampler 시리즈 (Photoshop / Premiere / Figma) — 시각 레퍼런스
- Heroicons / Lucide / Phosphor — 오픈소스 아이콘 라이브러리 패턴
- Material Design Iconography Spec — 픽셀 정렬 + 그리드 시스템
- WCAG 2.1 Color Contrast — 접근성

---

# 다음 단계

1. `lib/icon-generator/` 디렉토리 생성
2. design-tokens / category-colors / metaphor-blocks 분리
3. 26 액션 타입 표준 아이콘 카탈로그 작성
4. cube cell 통합 (icon_url 없거나 placeholder + 자체 SVG 가능 시 우선 적용)

본 design.md 는 v1. 사용 사례 발견 시 점진 보강.
