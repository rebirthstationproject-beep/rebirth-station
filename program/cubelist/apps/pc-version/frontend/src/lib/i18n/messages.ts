/**
 * i18n 사전 (M8 cron #22) — 한국어 / 영어 / 일본어.
 *
 * 모바일 PWA `apps/mobile-pwa/lib/i18n/messages.ts` 와 키 일부 공유.
 * PC 편집기 전용 키는 별도 namespace 없이 단일 평면 (단순함).
 *
 * 새 키 추가: 1) Locale 3개 모두 채우기 2) MessageKey union 확장
 */

export type Locale = 'ko' | 'en' | 'ja';

export const LOCALES: ReadonlyArray<Locale> = ['ko', 'en', 'ja'];

const MESSAGES_KO = {
  // 공통
  'app.title': '큐브 리스트 — 편집기',
  'app.settings': '설정',
  'app.no_pack': '(큐브팩 없음)',

  // TopBar
  'topbar.import': '가져오기',
  'topbar.export': '내보내기',
  'topbar.add_plugin': '+ 플러그인',
  'topbar.add_list': '+ 리스트 추가',

  // Sidebar
  'sidebar.categories': '카테고리',
  'sidebar.all': '전체',
  'sidebar.builtin': '빌트인 액션',
  'sidebar.plugins': '플러그인',
  'sidebar.no_plugins': '상단 "+ 플러그인" 버튼으로 .cubeplugin 설치',
  'sidebar.no_category_match': '해당 카테고리에 빌트인 액션 없음',

  // Grid
  'grid.select_list': '리스트를 선택하세요',
  'grid.prev_page': '◀ 이전',
  'grid.next_page': '다음 ▶',
  'grid.exit_folder': '↩ 상위',
  'grid.add_cube': '새 큐브 추가',

  // Inspector
  'inspector.empty': '큐브를 선택하세요',
  'inspector.empty_hint': '또는 빈 슬롯 ＋ 클릭으로 추가',
  'inspector.label': '라벨',
  'inspector.action_type': '액션 타입',
  'inspector.test_run': '▶ 테스트 실행',
  'inspector.delete': '큐브 삭제',
  'inspector.delete_confirm': '큐브를 삭제할까요?',
  'inspector.preview': '미리보기',
  'inspector.current_state': '현재 상태',
  'inspector.states_edit': '상태 편집',
  'inspector.states_hint': '실행 시 현재 상태의 payload 사용 → 자동으로 다음 상태로 전환',
  'inspector.state_keys': '키 조합:',
  'inspector.state_add': '+ 상태 추가',
  'inspector.state_remove': '상태 삭제',

  // MainTab
  'maintab.cube_maker': '큐브 만들기',
  'maintab.list_maker': '큐브 리스트 만들기',
  'maintab.marketplace': '🏪 마켓플레이스',

  // Marketplace
  'mp.title': '🏪 큐브팩 마켓플레이스',
  'mp.subtitle': 'v0.1.4 진입 시 실 서버 활성 (현재 mock 데이터)',
  'mp.search_placeholder': '🔍 큐브팩·작성자·태그 검색',
  'mp.filter_platform': '플랫폼:',
  'mp.filter_price': '가격:',
  'mp.filter_sort': '정렬:',
  'mp.all': '전체',
  'mp.free_only': '무료만',
  'mp.paid_only': '유료만',
  'mp.sort_popular': '인기 (리뷰 수)',
  'mp.sort_rating': '평점 높은 순',
  'mp.sort_price_low': '가격 낮은 순',
  'mp.sort_price_high': '가격 높은 순',
  'mp.sort_newest': '최신',
  'mp.count_suffix': '큐브팩',
  'mp.empty': '검색 결과 없음',
  'mp.free': '무료',
  'mp.pack_info': '🏪 팩 정보',
  'mp.pack_info_title': '🏪 마켓플레이스 메타',
  'mp.back_to_catalog': '← 카탈로그로',
  'mp.device_preview': '📱 디바이스 미리보기',
  'mp.description': '📄 설명',
  'mp.changelog': '📋 변경 이력',
  'mp.notice_title': '⚠ v0.1.3 사전 안내',
  'mp.install': '⬇ 설치',
  'mp.buy': '💳 구매',
  'mp.cubes_suffix': '큐브',
  'mp.lists_suffix': '리스트',
  'mp.per_month': ' / 월',
  'mp.per_year': ' / 년',
  'mp.reviews_suffix': '리뷰',

  // Consent
  'consent.title': '권한 요청',
  'consent.tier2': '이 액션은 Tier 2 권한이 필요합니다.',
  'consent.tier3': '이 액션은 Tier 3 권한이 필요합니다 (영구 위험 액션).',
  'consent.once': '이번만 허용',
  'consent.always': '영구 허용',
  'consent.deny': '거부',
  'consent.action': '액션',

  // Global search
  'search.placeholder': '큐브·리스트·액션 검색 (Esc 닫기)',
  'search.hint': '팁: 라벨·액션 타입·태그·리스트명 모두 검색됩니다 (최대 200건)',
  'search.empty': '검색 결과 없음',
  'search.count_suffix': '건 발견',
} as const;

export type MessageKey = keyof typeof MESSAGES_KO;

const MESSAGES_EN: Record<MessageKey, string> = {
  'app.title': 'Cube List — Editor',
  'app.settings': 'Settings',
  'app.no_pack': '(No Cube Pack)',

  'topbar.import': 'Import',
  'topbar.export': 'Export',
  'topbar.add_plugin': '+ Plugin',
  'topbar.add_list': '+ Add List',

  'sidebar.categories': 'Categories',
  'sidebar.all': 'All',
  'sidebar.builtin': 'Built-in Actions',
  'sidebar.plugins': 'Plugins',
  'sidebar.no_plugins': 'Install a .cubeplugin via the "+ Plugin" button above',
  'sidebar.no_category_match': 'No built-in action in this category',

  'grid.select_list': 'Select a list',
  'grid.prev_page': '◀ Prev',
  'grid.next_page': 'Next ▶',
  'grid.exit_folder': '↩ Up',
  'grid.add_cube': 'Add new cube',

  'inspector.empty': 'Select a cube',
  'inspector.empty_hint': 'Or click an empty ＋ slot',
  'inspector.label': 'Label',
  'inspector.action_type': 'Action Type',
  'inspector.test_run': '▶ Test Run',
  'inspector.delete': 'Delete Cube',
  'inspector.delete_confirm': 'Delete this cube?',
  'inspector.preview': 'Preview',
  'inspector.current_state': 'Current State',
  'inspector.states_edit': 'Edit States',
  'inspector.states_hint': 'Active state’s payload is used; auto-advances to next on execute',
  'inspector.state_keys': 'Key combo:',
  'inspector.state_add': '+ Add State',
  'inspector.state_remove': 'Remove State',

  'maintab.cube_maker': 'Cube Maker',
  'maintab.list_maker': 'List Maker',
  'maintab.marketplace': '🏪 Marketplace',

  'mp.title': '🏪 Cube Pack Marketplace',
  'mp.subtitle': 'Live server activates at v0.1.4 (currently mock data)',
  'mp.search_placeholder': '🔍 Search packs, authors, tags',
  'mp.filter_platform': 'Platform:',
  'mp.filter_price': 'Price:',
  'mp.filter_sort': 'Sort:',
  'mp.all': 'All',
  'mp.free_only': 'Free only',
  'mp.paid_only': 'Paid only',
  'mp.sort_popular': 'Popular (reviews)',
  'mp.sort_rating': 'Top Rated',
  'mp.sort_price_low': 'Price Low to High',
  'mp.sort_price_high': 'Price High to Low',
  'mp.sort_newest': 'Newest',
  'mp.count_suffix': 'pack(s)',
  'mp.empty': 'No results',
  'mp.free': 'Free',
  'mp.pack_info': '🏪 Pack Info',
  'mp.pack_info_title': '🏪 Marketplace Meta',
  'mp.back_to_catalog': '← Back to Catalog',
  'mp.device_preview': '📱 Device Preview',
  'mp.description': '📄 Description',
  'mp.changelog': '📋 Changelog',
  'mp.notice_title': '⚠ v0.1.3 Preview Notice',
  'mp.install': '⬇ Install',
  'mp.buy': '💳 Buy',
  'mp.cubes_suffix': 'cubes',
  'mp.lists_suffix': 'lists',
  'mp.per_month': ' / mo',
  'mp.per_year': ' / yr',
  'mp.reviews_suffix': 'reviews',

  'consent.title': 'Permission Required',
  'consent.tier2': 'This action requires Tier 2 permission.',
  'consent.tier3': 'This action requires Tier 3 permission (permanent risk).',
  'consent.once': 'Allow Once',
  'consent.always': 'Always Allow',
  'consent.deny': 'Deny',
  'consent.action': 'Action',

  'search.placeholder': 'Search cubes, lists, actions (Esc to close)',
  'search.hint': 'Tip: labels, action types, tags, list names all searched (max 200)',
  'search.empty': 'No results',
  'search.count_suffix': 'found',
};

const MESSAGES_JA: Record<MessageKey, string> = {
  'app.title': 'キューブリスト — エディタ',
  'app.settings': '設定',
  'app.no_pack': '(キューブパックなし)',

  'topbar.import': 'インポート',
  'topbar.export': 'エクスポート',
  'topbar.add_plugin': '+ プラグイン',
  'topbar.add_list': '+ リスト追加',

  'sidebar.categories': 'カテゴリー',
  'sidebar.all': 'すべて',
  'sidebar.builtin': 'ビルトインアクション',
  'sidebar.plugins': 'プラグイン',
  'sidebar.no_plugins': '上の「+ プラグイン」ボタンから .cubeplugin をインストール',
  'sidebar.no_category_match': 'このカテゴリーにビルトインアクションなし',

  'grid.select_list': 'リストを選択してください',
  'grid.prev_page': '◀ 前へ',
  'grid.next_page': '次へ ▶',
  'grid.exit_folder': '↩ 上へ',
  'grid.add_cube': '新しいキューブ追加',

  'inspector.empty': 'キューブを選択',
  'inspector.empty_hint': 'または空きスロット ＋ をクリック',
  'inspector.label': 'ラベル',
  'inspector.action_type': 'アクションタイプ',
  'inspector.test_run': '▶ テスト実行',
  'inspector.delete': 'キューブ削除',
  'inspector.delete_confirm': 'このキューブを削除しますか？',
  'inspector.preview': 'プレビュー',
  'inspector.current_state': '現在の状態',
  'inspector.states_edit': '状態の編集',
  'inspector.states_hint': '実行時に現在状態のペイロード使用 → 自動的に次の状態へ',
  'inspector.state_keys': 'キー組合せ:',
  'inspector.state_add': '+ 状態追加',
  'inspector.state_remove': '状態削除',

  'maintab.cube_maker': 'キューブ作成',
  'maintab.list_maker': 'キューブリスト作成',
  'maintab.marketplace': '🏪 マーケットプレイス',

  'mp.title': '🏪 キューブパック・マーケットプレイス',
  'mp.subtitle': 'v0.1.4 でサーバー有効化（現在モックデータ）',
  'mp.search_placeholder': '🔍 パック・作者・タグ検索',
  'mp.filter_platform': 'プラットフォーム:',
  'mp.filter_price': '価格:',
  'mp.filter_sort': '並び替え:',
  'mp.all': 'すべて',
  'mp.free_only': '無料のみ',
  'mp.paid_only': '有料のみ',
  'mp.sort_popular': '人気（レビュー数）',
  'mp.sort_rating': '評価高い順',
  'mp.sort_price_low': '価格 低い順',
  'mp.sort_price_high': '価格 高い順',
  'mp.sort_newest': '最新',
  'mp.count_suffix': 'パック',
  'mp.empty': '検索結果なし',
  'mp.free': '無料',
  'mp.pack_info': '🏪 パック情報',
  'mp.pack_info_title': '🏪 マーケットプレイス・メタ',
  'mp.back_to_catalog': '← カタログへ',
  'mp.device_preview': '📱 デバイスプレビュー',
  'mp.description': '📄 説明',
  'mp.changelog': '📋 変更履歴',
  'mp.notice_title': '⚠ v0.1.3 プレビュー注意',
  'mp.install': '⬇ インストール',
  'mp.buy': '💳 購入',
  'mp.cubes_suffix': 'キューブ',
  'mp.lists_suffix': 'リスト',
  'mp.per_month': ' / 月',
  'mp.per_year': ' / 年',
  'mp.reviews_suffix': 'レビュー',

  'consent.title': '権限が必要',
  'consent.tier2': 'このアクションには Tier 2 権限が必要です。',
  'consent.tier3': 'このアクションには Tier 3 権限が必要（永続的リスク）。',
  'consent.once': '今回のみ許可',
  'consent.always': '常に許可',
  'consent.deny': '拒否',
  'consent.action': 'アクション',

  'search.placeholder': 'キューブ・リスト・アクション検索（Esc で閉じる）',
  'search.hint': 'ヒント：ラベル・アクションタイプ・タグ・リスト名すべて検索（最大 200 件）',
  'search.empty': '検索結果なし',
  'search.count_suffix': '件見つかりました',
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  ko: MESSAGES_KO,
  en: MESSAGES_EN,
  ja: MESSAGES_JA,
};

/** navigator.language 우선순위로 자동 감지 (ko 기본) */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'ko';
  const lang = (navigator.language ?? 'ko').toLowerCase();
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('ja')) return 'ja';
  return 'ko';
}
