# v2 Glass Modern

**키워드**: 글래스모피즘 · 반투명 · iOS 26 스타일

## 차별점
- 반투명 레이어 + 백드롭 블러 느낌 표현
- linearGradient + opacity 조합으로 유리 느낌
- 하이라이트 stripe (좌상단 → 우하단 대각선 빛 반사)
- 프리미엄 / 럭셔리 느낌

## 기술 사양

| 항목 | 값 |
|---|---|
| viewBox | `0 0 64 64` |
| 배경 | linearGradient (브랜드 컬러 톤 다운) + opacity 0.85 |
| 액션 그래픽 영역 | 안쪽 48×48 (8px 여백) |
| stroke | 1.5px white opacity 0.9 |
| fill | white opacity 0.15 (글래스 채우기) |
| 하이라이트 | 좌상단에서 우상단으로 흰색 그라데이션 |
| 그림자/효과 | 좌상단 빛 반사 stroke |
| 평균 SVG 길이 | 400~600 byte |

## 예시 패턴

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#31A8FF" stop-opacity="0.6"/>
      <stop offset="1" stop-color="#001E36" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="hl" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.4"/>
      <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <rect width="64" height="64" rx="14" fill="url(#hl)"/>
  <g transform="translate(8 8)" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" stroke-width="1.5">
    <rect x="4" y="6" width="40" height="36" rx="3"/>
  </g>
</svg>
```

## 메인 큐브리스트 아이콘 (00-)
- 브랜드 로고 위에 글래스 오버레이
- 좌상단 빛 반사로 입체감
- 여백 0, 꽉차게

## 적합 사용처
- 라이트모드
- 프리미엄 / 럭셔리 사용자
- iOS / macOS 사용자
