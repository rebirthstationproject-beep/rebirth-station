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
