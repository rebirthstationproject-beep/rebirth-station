/**
 * Adobe Photoshop 자체 SVG 아이콘 카탈로그 (2026-06-01).
 *
 * StreamDeck IconPack 'Photoshop_Icon_Sampler-1.0.0' 72개 아이콘 디자인 학습 →
 * 큐브 리스트 디자인 시스템 (design.md Level 1~10) 으로 자체 최적화.
 *
 * 원칙:
 * - viewBox 0 0 24 24 (Level 1)
 * - Adobe Photoshop 브랜드 컬러 #31A8FF + #001E36 (Level 2)
 * - stroke 2 / round cap-join (Level 3)
 * - 황금비 + 격자 정렬 (Level 4)
 * - 액션 메타포 명확 (Level 5)
 * - 중심 정렬 + 시각 무게 (Level 6)
 * - pixel-perfect (Level 7)
 *
 * 사용: PHOTOSHOP_ICONS[normalizedLabel] → SVG body
 */

const PS_BLUE = '#31A8FF';
const PS_DARK = '#001E36';
const PS_WHITE = '#FFFFFF';

/**
 * SVG wrapper — 2026-06-11 사용자 디자인 지침 반영:
 * - 배경 = PS 로고 다크네이비(#001E36) 풀블리드 타일 (rx 20%)
 * - 여백 = 글리프(0..24)를 36 캔버스 중앙 배치 → 사방 약 17~20% 균일 여백
 * - 선 두께 = 2 → 1.6 (20% 감량)
 * - 투톤 = 흰색 스트로크 기본 + 블루(#31A8FF) 액센트(currentColor)
 * - color 속성 필수 — img 컨텍스트에서 currentColor 검정 해석 방지
 */
function svgOf(body: string, strokeColor: string = PS_WHITE, accentColor: string = PS_BLUE): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 36 36" width="144" height="144" ` +
    `color="${accentColor}" stroke="${strokeColor}" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">` +
    `<rect x="-6" y="-6" width="36" height="36" rx="7.2" fill="${PS_DARK}" stroke="none" />` +
    `${body}</svg>`
  );
}

/**
 * Photoshop 72 액션 자체 SVG 본문 매핑.
 * 키 = 라벨 normalized (lowercase, _ ↔ space, slash → _)
 * 값 = SVG paths (svg wrapper 제외)
 */
const PS_BODIES: Record<string, string> = {
  // === 1. Actual_Size — 사각형 + "100%" 표시 ===
  'actual size':
    '<rect x="3" y="5" width="18" height="14" rx="2" />' +
    '<text x="12" y="15" font-size="6" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">100%</text>',

  // === 2. Adj_Black_and_White — 반흑반백 원 ===
  'adj black and white':
    '<circle cx="12" cy="12" r="9" />' +
    '<path d="M12 3a9 9 0 010 18z" fill="currentColor" stroke="none" />',

  // === 3. Adj_Brightness_Contrast — 태양 + 부분 그림자 ===
  'adj brightness contrast':
    '<circle cx="12" cy="12" r="5" />' +
    '<path d="M12 12V3" /><path d="M12 12L19 5" /><path d="M12 12h9" /><path d="M12 12l7 7" /><path d="M12 12v9" /><path d="M12 12l-7 7" /><path d="M12 12H3" /><path d="M12 12L5 5" />',

  // === 4. Adj_Color_Balance — 컬러 휠 ===
  'adj color balance':
    '<circle cx="12" cy="12" r="9" />' +
    '<circle cx="9" cy="9" r="3" fill="currentColor" opacity="0.6" stroke="none" />' +
    '<circle cx="15" cy="15" r="3" fill="currentColor" opacity="0.4" stroke="none" />' +
    '<circle cx="15" cy="9" r="2" fill="currentColor" opacity="0.8" stroke="none" />',

  // === 5. Align_Horizontal_Centers — 가로 중심 정렬 ===
  'align horizontal centers':
    '<path d="M12 3v18" />' +
    '<rect x="5" y="6" width="14" height="3" rx="1" fill="currentColor" stroke="none" />' +
    '<rect x="3" y="14" width="18" height="3" rx="1" fill="currentColor" stroke="none" />',

  // === 6. Align_Vertical_Centers — 세로 중심 정렬 ===
  'align vertical centers':
    '<path d="M3 12h18" />' +
    '<rect x="6" y="5" width="3" height="14" rx="1" fill="currentColor" stroke="none" />' +
    '<rect x="14" y="3" width="3" height="18" rx="1" fill="currentColor" stroke="none" />',

  // === 7. Apply_Image — 사각형 + 체크 ===
  'apply image':
    '<rect x="3" y="3" width="18" height="18" rx="2" />' +
    '<path d="M8 12l3 3 6-6" />',

  // === 8. Auto_Color — 자동 컬러 (A + 원) ===
  'auto color':
    '<circle cx="12" cy="12" r="9" />' +
    '<text x="12" y="16" font-size="10" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">A</text>',

  // === 9. Background — 뒤 사각형 강조 ===
  'background':
    '<rect x="4" y="4" width="11" height="11" rx="1" />' +
    '<rect x="9" y="9" width="11" height="11" rx="1" fill="currentColor" stroke="none" />',

  // === 10. Black_and_White — 좌우 분할 ===
  'black and white':
    '<rect x="3" y="3" width="18" height="18" rx="2" />' +
    '<path d="M12 3v18" />' +
    '<path d="M12 3v18z M3 3h9v18H3z" fill="currentColor" stroke="none" />',

  // === 11. Blur — 흐릿한 원 ===
  'blur':
    '<circle cx="12" cy="12" r="9" opacity="0.3" />' +
    '<circle cx="12" cy="12" r="6" opacity="0.6" />' +
    '<circle cx="12" cy="12" r="3" />',

  // === 12. Brightness_Contrast — 태양 ===
  'brightness contrast':
    '<circle cx="12" cy="12" r="4" />' +
    '<path d="M12 2v3M12 19v3M5 12H2M22 12h-3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />',

  // === 13. Brush — 붓 ===
  // PS 브러시 툴 마크 — 가는 손잡이 + 다이아몬드 붓끝 (참조: PS 툴바 #5)
  'brush':
    '<path d="M21 3l-9.5 9.5" />' +
    '<path d="M11 12.5c-1.6-.4-3.6.5-4.7 2.3-1.2 1.9-.9 3.7-2.8 5.2 2.8 1.2 6.2.6 7.8-1.6 1.3-1.8 1.2-4.2-.3-5.9z" fill="currentColor" stroke="none" />',

  // === 14. Burn — 손 ===
  'burn':
    '<path d="M7 12V8a2 2 0 014 0v4" />' +
    '<path d="M11 12V6a2 2 0 014 0v6" />' +
    '<path d="M15 12V8a2 2 0 014 0v6a6 6 0 01-12 0v-2" />',

  // === 15. Clone_Stamp — 스탬프 ===
  // PS 도장(복제) 툴 마크 (참조: PS 툴바 #18)
  'clone stamp':
    '<path d="M12 3.5a3.2 3.2 0 00-3.2 3.2c0 1.7 1.2 2.7 1.2 4.3h4c0-1.6 1.2-2.6 1.2-4.3A3.2 3.2 0 0012 3.5z" fill="currentColor" stroke="none" />' +
    '<path d="M6.5 14.5a1.5 1.5 0 011.5-1.5h8a1.5 1.5 0 011.5 1.5V17h-11z" />' +
    '<path d="M4.5 20h15" />',

  // === 16. Content_Aware_Fill — 채움 + 별 ===
  'content aware fill':
    '<path d="M5 11l7-8 7 8a7 7 0 11-14 0z" />' +
    '<path d="M12 8l1 2 2 .3-1.5 1.4.4 2.1L12 13l-1.9 1 .4-2.1L9 10.3l2-.3z" fill="currentColor" stroke="none" />',

  // === 17. Convert_to_Shape — 사각 → 도형 ===
  'convert to shape':
    '<rect x="3" y="3" width="8" height="8" rx="1" />' +
    '<polygon points="17 13 21 21 13 21" fill="currentColor" stroke="none" />' +
    '<path d="M11 11l3 3" />',

  // === 18. Copy — 두 사각 ===
  'copy':
    '<rect x="9" y="9" width="11" height="11" rx="1" />' +
    '<path d="M5 15V5a1 1 0 011-1h10" />',

  // === 19. Crop — L 모양 ===
  'crop':
    '<path d="M6 2v14a2 2 0 002 2h14" />' +
    '<path d="M2 6h14a2 2 0 012 2v14" />',

  // === 20. Cut — 가위 ===
  'cut':
    '<circle cx="6" cy="6" r="3" />' +
    '<circle cx="6" cy="18" r="3" />' +
    '<path d="M9 6l12 12M21 6L9 18" />',

  // === 21. Decrease_Brush_Size — 원 + ↓ ===
  'decrease brush size':
    '<circle cx="12" cy="12" r="6" />' +
    '<path d="M9 12h6" />',

  // === 22. Direct_Selection — 화살표 ===
  // PS 패스/직접 선택 마크 — 흰 화살표 커서 (참조: PS 툴바 #22)
  'direct selection':
    '<path d="M9 2.5v15l3.6-3.2 2.2 5.6 2.6-1-2.2-5.5h4.8z" />',

  // === 23. Dodge — 막대 + 빛 ===
  // PS 닷지 툴 마크 — 막대사탕 (참조: PS 툴바 #8)
  'dodge':
    '<circle cx="10" cy="9" r="5.5" />' +
    '<circle cx="10" cy="9" r="2.4" fill="currentColor" stroke="none" />' +
    '<path d="M14.2 13.2L20 19" stroke-width="2" />',

  // === 24. Drop_Shadow — 그림자 ===
  'drop shadow':
    '<rect x="6" y="6" width="14" height="14" rx="2" fill="currentColor" opacity="0.3" stroke="none" />' +
    '<rect x="3" y="3" width="14" height="14" rx="2" />',

  // === 25. Duplicate_Layers — 스택 + + ===
  'duplicate layers':
    '<path d="M3 12l9-5 9 5-9 5z" />' +
    '<path d="M3 17l9 5 9-5" />' +
    '<circle cx="20" cy="6" r="3" fill="currentColor" stroke="none" />' +
    '<path d="M20 4v4M18 6h4" stroke="white" />',

  // === 26. Export_as — 화살표 외부 ===
  'export as':
    '<path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7" />' +
    '<path d="M16 7l-4-4-4 4M12 3v14" />',

  // === 27. Eyedropper — 스포이드 ===
  'eyedropper':
    '<path d="M11 11l-6 6v4h4l6-6" />' +
    '<path d="M14 8l4-4 3 3-4 4-3-3z" fill="currentColor" stroke="none" />' +
    '<path d="M13 9l3 3" />',

  // === 28. Fade — 그라데이션 막대 ===
  'fade':
    '<rect x="3" y="9" width="18" height="6" rx="1" />' +
    '<path d="M3 9l18 0M3 15l18 0" opacity="0.5" />' +
    '<path d="M3 12h6M9 12h3M12 12h2M14 12h2" stroke-width="3" />',

  // === 29. File_Info — i ===
  'file info':
    '<circle cx="12" cy="12" r="9" />' +
    '<line x1="12" y1="8" x2="12" y2="8" />' +
    '<path d="M12 11v6" />',

  // === 30. Fill — 페인트 통 (채움) ===
  // PS 칠(페인트 통) 마크 — 기울어진 버킷 + 물감 방울
  'fill':
    '<path d="M8 8.5L13.5 3l1.8 1.8" />' +
    '<path d="M3.5 13L11 5.5l6.5 6.5L10 19.5z" />' +
    '<path d="M19.8 13.5c1.1 1.7 1.9 2.9 1.9 3.9a1.9 1.9 0 11-3.8 0c0-1 .8-2.2 1.9-3.9z" fill="currentColor" stroke="none" />',

  // === 31. Fill_with_Background_Color — 뒤 색 ===
  'fill with background color':
    '<rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" stroke="none" opacity="0.4" />' +
    '<rect x="3" y="3" width="18" height="18" rx="2" />',

  // === 32. Fill_with_Foreground_Color — 앞 색 ===
  'fill with foreground color':
    '<rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" stroke="none" />',

  // === 33. Flatten_Image — 다층 → 한층 ===
  'flatten image':
    '<rect x="3" y="14" width="18" height="6" rx="1" fill="currentColor" stroke="none" />' +
    '<path d="M3 10h18M3 6h18M12 3v3" opacity="0.5" />',

  // === 34. Flip_Canvas_Horizontal — 캔버스 좌우 ===
  'flip canvas horizontal':
    '<rect x="3" y="6" width="18" height="12" rx="2" />' +
    '<path d="M12 6v12" />' +
    '<path d="M5 12l4-3v6zM19 12l-4-3v6z" fill="currentColor" stroke="none" />',

  // === 35. Flip_Canvas_Vertical — 캔버스 상하 ===
  'flip canvas vertical':
    '<rect x="6" y="3" width="12" height="18" rx="2" />' +
    '<path d="M6 12h12" />' +
    '<path d="M12 5l-3 4h6zM12 19l-3-4h6z" fill="currentColor" stroke="none" />',

  // === 36. Flip_Horizontal — 좌우 ===
  'flip horizontal':
    '<path d="M12 3v18" stroke-dasharray="2 2" />' +
    '<path d="M9 6L3 12l6 6z" />' +
    '<path d="M15 6l6 6-6 6z" fill="currentColor" stroke="none" />',

  // === 37. Flip_Vertical — 상하 ===
  'flip vertical':
    '<path d="M3 12h18" stroke-dasharray="2 2" />' +
    '<path d="M6 9l6-6 6 6z" />' +
    '<path d="M6 15l6 6 6-6z" fill="currentColor" stroke="none" />',

  // === 38. Foreground — 앞 사각 ===
  'foreground':
    '<rect x="9" y="9" width="11" height="11" rx="1" fill="currentColor" stroke="none" />' +
    '<rect x="4" y="4" width="11" height="11" rx="1" />',

  // === 39. Free_Transform — 사각 + 모서리 핸들 ===
  'free transform':
    '<rect x="4" y="4" width="16" height="16" rx="1" />' +
    '<circle cx="4" cy="4" r="1.5" fill="currentColor" stroke="none" />' +
    '<circle cx="20" cy="4" r="1.5" fill="currentColor" stroke="none" />' +
    '<circle cx="4" cy="20" r="1.5" fill="currentColor" stroke="none" />' +
    '<circle cx="20" cy="20" r="1.5" fill="currentColor" stroke="none" />' +
    '<circle cx="12" cy="4" r="1" fill="currentColor" stroke="none" />' +
    '<circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />' +
    '<circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />' +
    '<circle cx="20" cy="12" r="1" fill="currentColor" stroke="none" />',

  // === 40. Group_Layers — 그룹 ===
  'group layers':
    '<rect x="3" y="6" width="18" height="12" rx="2" />' +
    '<rect x="6" y="9" width="5" height="6" rx="1" fill="currentColor" stroke="none" />' +
    '<rect x="13" y="9" width="5" height="6" rx="1" fill="currentColor" stroke="none" />',

  // === 41. Healing_Brush — 십자가 ===
  // PS 복구 브러시 마크 — 반창고 (참조: PS 툴바 #15)
  'healing brush':
    '<rect x="2.5" y="8.8" width="19" height="6.4" rx="3.2" transform="rotate(-45 12 12)" />' +
    '<rect x="9.4" y="9.4" width="5.2" height="5.2" rx="1" transform="rotate(-45 12 12)" fill="currentColor" stroke="none" opacity="0.85" />',

  // === 42. Horizontal_Type — 가로 T ===
  'horizontal type':
    '<path d="M5 5h14" stroke-width="3" />' +
    '<path d="M12 5v14" />' +
    '<path d="M9 19h6" />',

  // === 43. Image_Size — 양화살표 사각 ===
  'image size':
    '<rect x="3" y="3" width="18" height="18" rx="2" />' +
    '<path d="M7 12h10M9 10l-2 2 2 2M15 10l2 2-2 2" />' +
    '<path d="M12 7v10M10 9l2-2 2 2M10 15l2 2 2-2" />',

  // === 44. Increase_Brush_Size — 원 + + ===
  'increase brush size':
    '<circle cx="12" cy="12" r="8" />' +
    '<path d="M9 12h6M12 9v6" />',

  // === 45. Invert — 반전 ===
  'invert':
    '<circle cx="12" cy="12" r="9" />' +
    '<path d="M12 3a9 9 0 010 18z" fill="currentColor" stroke="none" />' +
    '<path d="M12 3v18" />',

  // === 46. Lasso — 자유 곡선 ===
  // PS 올가미 툴 마크 — 비정형 루프 + 늘어진 줄 (참조: PS 툴바 #2)
  'lasso':
    '<path d="M20.5 10c0 3.6-3.8 6.2-8.5 6.2S3.5 13.6 3.5 10 7.3 3.8 12 3.8s8.5 2.6 8.5 6.2z" />' +
    '<path d="M8.5 15.7c-1.6.5-2.6 1.4-2.6 2.4 0 .8.6 1.5 1.6 1.9" />' +
    '<circle cx="8.6" cy="21" r="1.3" fill="currentColor" stroke="none" />',

  // === 47. Last_Filter — 필터 반복 ===
  'last filter':
    '<rect x="3" y="3" width="18" height="18" rx="2" />' +
    '<path d="M21 12a9 9 0 11-3-6.7" />' +
    '<path d="M21 4v6h-6" />',

  // === 48. Layer_Mask_Apply — 사각 + 마스크 ===
  'layer mask apply':
    '<rect x="3" y="3" width="18" height="18" rx="2" />' +
    '<rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" stroke="none" opacity="0.5" />' +
    '<path d="M9 12l2 2 4-4" />',

  // === 49. Levels — 막대 그래프 ===
  'levels':
    '<path d="M3 20V8M7 20V4M11 20v-6M15 20v-10M19 20v-4" />' +
    '<path d="M3 20h18" />',

  // === 50. Line — 선 ===
  'line':
    '<path d="M3 21L21 3" stroke-width="3" />',

  // === 51. Lock_Layers — 자물쇠 ===
  'lock layers':
    '<rect x="5" y="11" width="14" height="10" rx="2" />' +
    '<path d="M8 11V7a4 4 0 018 0v4" />',

  // === 52. Magic_Wand — 마법봉 ===
  'magic wand':
    '<path d="M3 21L14 10" stroke-width="2.5" />' +
    '<path d="M11 7l3 3M15 4l3 3M19 8l2 2" stroke-width="1.5" />' +
    '<circle cx="6" cy="6" r="1" fill="currentColor" stroke="none" />' +
    '<circle cx="20" cy="14" r="1" fill="currentColor" stroke="none" />',

  // === 53. Merge_Layers — 화살표 ↓ ===
  'merge layers':
    '<path d="M5 6l7-3 7 3-7 3z" />' +
    '<path d="M5 11l7 3 7-3" />' +
    '<path d="M12 14v7M9 18l3 3 3-3" />',

  // === 54. Move — 4방향 화살표 ===
  'move':
    '<path d="M12 2v20M2 12h20" />' +
    '<path d="M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3" />',

  // === 55. Neural_Filters — AI 망 ===
  'neural filters':
    '<circle cx="5" cy="5" r="2" />' +
    '<circle cx="19" cy="5" r="2" />' +
    '<circle cx="5" cy="19" r="2" />' +
    '<circle cx="19" cy="19" r="2" />' +
    '<circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />' +
    '<path d="M7 5h10M7 19h10M5 7v10M19 7v10M6.5 6.5l11 11M17.5 6.5l-11 11" stroke-width="1.5" opacity="0.6" />',

  // === 56. New — 빈 페이지 ===
  'new':
    '<path d="M14 3H5a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8z" />' +
    '<path d="M14 3v5h5" />',

  // === 57. New_Fill_Layer_Solid_Color — 색 채움 + + ===
  'new fill layer solid color':
    '<rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" stroke="none" />' +
    '<path d="M9 12h6M12 9v6" stroke="white" stroke-width="2" />',

  // === 58. New_Group — 그룹 + + ===
  'new group':
    '<rect x="3" y="6" width="18" height="12" rx="2" />' +
    '<path d="M9 12h6M12 9v6" />',

  // === 59. Open — 폴더 ===
  'open':
    '<path d="M3 7v11a2 2 0 002 2h14a2 2 0 002-2V9h-9l-2-2H5a2 2 0 00-2 2z" />' +
    '<path d="M3 11h18" />',

  // === 60. Paste — 클립보드 ===
  'paste':
    '<rect x="9" y="3" width="6" height="3" rx="1" />' +
    '<rect x="6" y="5" width="12" height="16" rx="2" />' +
    '<path d="M9 13h6M9 17h4" />',

  // === 61. Path_Selection — 펜 선택 ===
  'path selection':
    '<path d="M3 3l8 18 3-7 7-3z" fill="currentColor" stroke="none" opacity="0.6" />' +
    '<path d="M3 3l8 18" />',

  // === 62. Pen — 펜 ===
  // PS 펜 툴 마크 — 만년필 촉 (참조: PS 툴바 #21)
  'pen':
    '<path d="M12 2.5c-2.2 4.2-5.2 6-5.2 9.8L12 21l5.2-8.7c0-3.8-3-5.6-5.2-9.8z" />' +
    '<path d="M12 8.5v4" />' +
    '<circle cx="12" cy="14.6" r="1.5" fill="currentColor" stroke="none" />',

  // === 63. Perspective_Crop — 사다리꼴 ===
  'perspective crop':
    '<path d="M5 6l14-2v16l-14-2z" />',

  // === 64. Rulers — 자 ===
  'rulers':
    '<rect x="3" y="6" width="18" height="4" rx="1" />' +
    '<path d="M6 6v2M9 6v2M12 6v3M15 6v2M18 6v2" />' +
    '<rect x="6" y="14" width="4" height="6" rx="1" />' +
    '<path d="M6 17h2M6 19h2" />',

  // === 65. Save — 디스크 ===
  'save':
    '<path d="M5 3h11l3 3v15a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" />' +
    '<path d="M8 3v5h7V3" />' +
    '<rect x="8" y="14" width="8" height="7" />',

  // === 66. Select_All — 점선 사각 + 4 모서리 ===
  'select all':
    '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 2" />' +
    '<circle cx="3" cy="3" r="1.5" fill="currentColor" stroke="none" />' +
    '<circle cx="21" cy="3" r="1.5" fill="currentColor" stroke="none" />' +
    '<circle cx="3" cy="21" r="1.5" fill="currentColor" stroke="none" />' +
    '<circle cx="21" cy="21" r="1.5" fill="currentColor" stroke="none" />',

  // === 67. Snap_to_Grid — 격자 ===
  'snap to grid':
    '<rect x="3" y="3" width="6" height="6" rx="1" />' +
    '<rect x="15" y="3" width="6" height="6" rx="1" />' +
    '<rect x="3" y="15" width="6" height="6" rx="1" />' +
    '<rect x="15" y="15" width="6" height="6" rx="1" />' +
    '<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />',

  // === 68. Snap_to_Guides — 가이드 라인 ===
  'snap to guides':
    '<path d="M12 3v18M3 12h18" stroke-dasharray="3 2" />' +
    '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />',

  // === 69. Stroke — 사각 외곽 ===
  'stroke':
    '<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="3" />',

  // === 70. Transform_Selection — 변환 핸들 ===
  'transform selection':
    '<rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="3 2" />' +
    '<circle cx="4" cy="4" r="2" fill="currentColor" stroke="none" />' +
    '<circle cx="20" cy="4" r="2" fill="currentColor" stroke="none" />' +
    '<circle cx="4" cy="20" r="2" fill="currentColor" stroke="none" />' +
    '<circle cx="20" cy="20" r="2" fill="currentColor" stroke="none" />',

  // === 71. Undo — ↶ ===
  'undo':
    '<path d="M9 14l-4-4 4-4" />' +
    '<path d="M5 10h11a4 4 0 014 4v0a4 4 0 01-4 4h-5" />',

  // === 72. Vertical_Type — 세로 T ===
  'vertical type':
    '<path d="M5 5h6M8 5v14M5 19h6" stroke-width="2.5" />' +
    '<path d="M14 7l-2 2M16 7l-2 2M14 11l-2 2M16 11l-2 2M14 15l-2 2M16 15l-2 2" opacity="0.6" stroke-width="1.5" />',
};

/** 라벨 정규화 (lowercase + underscore/slash → space + 다중 공백 trim) */
function normalize(label: string): string {
  return label
    .toLowerCase()
    .replace(/[_/\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Photoshop 자체 SVG 카탈로그 매칭.
 * 매칭 실패 시 null 반환 → 호출자가 generic icon-generator 로 폴백.
 */
export function findPhotoshopIcon(label: string): string | null {
  const key = normalize(label);
  const body = PS_BODIES[key];
  if (!body) return null;
  return svgOf(body);
}

/** 카탈로그 모든 키 (디버그/테스트용) */
export function getPhotoshopCatalogKeys(): string[] {
  return Object.keys(PS_BODIES);
}
