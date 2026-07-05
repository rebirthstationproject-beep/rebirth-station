# v3 Neumorphism

**키워드**: 부드러운 3D · 촉각적 · soft shadow

## 차별점
- soft shadow (밝은 highlight + 어두운 shadow) 조합으로 살짝 튀어나온 느낌
- 단색 배경 + 같은 톤 그래픽 (저채도)
- 촉각적 / 햅틱 / 데스크톱 위젯 분위기

## 기술 사양

| 항목 | 값 |
|---|---|
| viewBox | `0 0 64 64` |
| 배경 | 브랜드 컬러 채도 70% (살짝 어두움) |
| 하이라이트 | 좌상단 안쪽으로 흰색 inset shadow (filter feGaussianBlur) |
| 다크 그림자 | 우하단 안쪽으로 검정 inset shadow |
| 액션 그래픽 영역 | 안쪽 46×46 (9px 여백) |
| stroke | 1.5px, 동일 톤 |
| fill | 그라데이션 (밝은 → 어두운) |
| 평균 SVG 길이 | 500~700 byte |

## 예시 패턴

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="neu" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4FB8FF"/>
      <stop offset="1" stop-color="#2090E6"/>
    </linearGradient>
    <linearGradient id="hl" x1="0" y1="0" x2="0.3" y2="0.3">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="sh" x1="0.7" y1="0.7" x2="1" y2="1">
      <stop offset="0" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.3"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#neu)"/>
  <rect width="64" height="64" rx="14" fill="url(#hl)"/>
  <rect width="64" height="64" rx="14" fill="url(#sh)"/>
  <g transform="translate(9 9)" fill="#FFFFFF" fill-opacity="0.85">
    <rect x="4" y="6" width="38" height="34" rx="3"/>
  </g>
</svg>
```

## 메인 큐브리스트 아이콘 (00-)
- 브랜드 로고 + neumorphic 입체감
- 살짝 튀어나온 느낌

## 적합 사용처
- 데스크톱 위젯
- macOS 사용자
- 촉각적 UI 선호
