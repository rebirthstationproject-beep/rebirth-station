# v4 Bold Outline

**키워드**: 굵은 라인 · 강한 콘트라스트 · Lucide/Tabler 스타일

## 차별점
- stroke 3~4px 굵은 outline
- fill 없는 라인 위주, 가독성 최우선
- 접근성 (저시력 사용자) 친화
- 채색 1~2색 한정

## 기술 사양

| 항목 | 값 |
|---|---|
| viewBox | `0 0 64 64` |
| 배경 | 단색 (브랜드 컬러 또는 다크) |
| 액션 그래픽 영역 | 안쪽 48×48 (8px 여백) |
| stroke | 3.5px, round cap-join |
| stroke 컬러 | 흰색 (다크 배경) 또는 브랜드 컬러 (라이트) |
| fill | 거의 없음 |
| 그림자/효과 | 없음 |
| 평균 SVG 길이 | 250~400 byte |

## 예시 패턴

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="14" fill="#31A8FF"/>
  <g transform="translate(8 8)" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="6" width="40" height="36" rx="4"/>
    <path d="M4 14 H44"/>
    <circle cx="10" cy="10" r="1.5"/>
  </g>
</svg>
```

## 메인 큐브리스트 아이콘 (00-)
- 브랜드 컬러 배경 + 흰색 굵은 outline 로고
- 단순화된 실루엣

## 적합 사용처
- 가독성 최우선
- 작은 셀에서도 명확
- 접근성 필요
- Lucide / Tabler / Heroicons 좋아하는 사용자
