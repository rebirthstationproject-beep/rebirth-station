# v1 Flat Minimal

**키워드**: 심플 · 단색 · 가장 가벼움

## 차별점
- 가장 단순하고 빠르게 읽히는 디자인
- stroke 2px 단일 컬러 outline, fill 거의 없음
- 추가 효과 (그라데이션·그림자·블러) 일체 없음
- 다크모드에서 가독성 최강

## 기술 사양

| 항목 | 값 |
|---|---|
| viewBox | `0 0 64 64` |
| 배경 | `<rect width="64" height="64" rx="14" fill="#0A0A0A"/>` (다크) |
| 액션 그래픽 영역 | `translate(10 10) scale(0.71875)` → 안쪽 46×46 |
| stroke | 2px, `linecap="round" linejoin="round"` |
| stroke 컬러 | 브랜드 메인 컬러 1색 |
| fill | 거의 없음 (점/플랫만 fill, 라인은 fill 없음) |
| 그림자/효과 | 없음 |
| 평균 SVG 길이 | 200~350 byte |

## 예시 패턴

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="14" fill="#0A0A0A"/>
  <g transform="translate(10 10)" fill="none" stroke="#31A8FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="6" width="36" height="32" rx="3"/>
    <path d="M4 14 H40"/>
  </g>
</svg>
```

## 메인 큐브리스트 아이콘 (00-)
- 브랜드 공식 로고 그대로 단색화 (배경 다크 + 로고 컬러)
- 여백 0, 꽉차게

## 적합 사용처
- 미니멀리스트 사용자
- 작은 셀 사이즈 (32×32 이하)
- 다크모드 강조
