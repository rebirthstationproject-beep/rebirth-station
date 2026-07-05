# v5 Gradient Glow

**키워드**: 그라데이션 · 발광 · 사이버펑크

## 차별점
- linear / radial gradient 활용
- soft glow (filter feGaussianBlur) 표현
- 다크 배경 + 네온 컬러 그라데이션
- 게임 / 스트리밍 / 사이버펑크 느낌

## 기술 사양

| 항목 | 값 |
|---|---|
| viewBox | `0 0 64 64` |
| 배경 | 다크 그라데이션 (브랜드 어두운 톤) + radial glow |
| 액션 그래픽 영역 | 안쪽 48×48 (8px 여백) |
| stroke | 2px, 브랜드 그라데이션 |
| fill | linearGradient (밝은 → 어두운) |
| glow | filter feGaussianBlur stdDeviation 1.5 |
| 평균 SVG 길이 | 500~800 byte |

## 예시 패턴

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0" stop-color="#31A8FF" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#001E36" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="ic" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7FD0FF"/>
      <stop offset="1" stop-color="#1E88E5"/>
    </linearGradient>
    <filter id="bl">
      <feGaussianBlur stdDeviation="1.5"/>
    </filter>
  </defs>
  <rect width="64" height="64" rx="14" fill="#001E36"/>
  <rect width="64" height="64" rx="14" fill="url(#glow)"/>
  <g transform="translate(8 8)" filter="url(#bl)" fill="url(#ic)" opacity="0.6">
    <rect x="4" y="6" width="40" height="36" rx="3"/>
  </g>
  <g transform="translate(8 8)" fill="none" stroke="url(#ic)" stroke-width="2">
    <rect x="4" y="6" width="40" height="36" rx="3"/>
  </g>
</svg>
```

## 메인 큐브리스트 아이콘 (00-)
- 브랜드 컬러 radial glow
- 로고 자체에 그라데이션 + soft glow

## 적합 사용처
- 다크모드 강조
- 스트리밍 / 게임 (OBS, Discord, Spotify)
- 사이버펑크 / 네온 좋아하는 사용자
