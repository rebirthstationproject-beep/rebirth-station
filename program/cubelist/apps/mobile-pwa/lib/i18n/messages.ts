/**
 * 다국어 메시지 — ko (1차), en, ja
 *
 * 회사: 리버스 스테이션 (Rebirth Station)
 * 정착본 §7: 외래어 금지(ko), Stream/Bind/Sync 금지
 *
 * 키 네이밍: `<scope>.<element>` (예: home.title, list.editButton)
 * 한국어가 기준 — 영문/일본어는 한국어 의미에 맞춰 번역.
 */

export type Locale = 'ko' | 'en' | 'ja';

export type MessageKey =
  | 'brand.company'
  | 'brand.product'
  | 'brand.tagline'
  | 'brand.sub_tagline'
  | 'brand.layer1'
  | 'brand.layer2'
  | 'brand.layer3'
  | 'brand.layer4'
  | 'home.openList'
  | 'home.pair'
  | 'home.plugins'
  | 'home.account'
  | 'home.trustSignal'
  | 'list.edit'
  | 'list.done'
  | 'list.mountModeOn'
  | 'list.mountModeOff'
  | 'list.helperConnected'
  | 'list.helperConnecting'
  | 'list.helperDisconnected'
  | 'list.empty.title'
  | 'list.empty.body'
  | 'list.empty.create'
  | 'list.manage.newList'
  | 'list.manage.settings'
  | 'cube.edit.title'
  | 'cube.edit.name'
  | 'cube.edit.icon'
  | 'cube.edit.action'
  | 'cube.action.link'
  | 'cube.action.shortcut'
  | 'cube.action.macro'
  | 'common.cancel'
  | 'common.save'
  | 'common.delete'
  | 'common.close'
  | 'common.required'
  | 'pair.title'
  | 'pair.subtitle'
  | 'pair.start'
  | 'pair.success'
  | 'pair.openList'
  | 'pair.retry'
  | 'plugin.list.title'
  | 'plugin.list.searchPlaceholder'
  | 'plugin.list.sortPopular'
  | 'plugin.list.sortRecent'
  | 'plugin.list.sortName'
  | 'plugin.install'
  | 'plugin.installing'
  | 'plugin.installed'
  | 'ads.upgradeCta'
  | 'ads.upgradeAvailableElsewhere'
  | 'account.signOut'
  | 'account.plan'
  | 'account.free'
  | 'account.pro';

type Catalog = Record<MessageKey, string>;

const ko: Catalog = {
  'brand.company': '리버스 스테이션 (Rebirth Station)',
  'brand.product': '큐브 리스트 (Cube List)',
  'brand.tagline': '잠자는 디바이스를 다시 깨운다',
  'brand.sub_tagline': '버려진 기기의 재발견 — 리버스 스테이션',
  'brand.layer1': 'Layer 1 · 리버스 스테이션 — 마스터 플랫폼',
  'brand.layer2': 'Layer 2 · 큐브 리스트 — 코어 엔진',
  'brand.layer3': 'Layer 3 · 마켓플레이스',
  'brand.layer4': 'Layer 4 · 콘텐츠 파트너 콜라보',

  'home.openList': '큐브 리스트 열기',
  'home.pair': '기기 페어링',
  'home.plugins': '플러그인 둘러보기',
  'home.account': '로그인 / 계정',
  'home.trustSignal': '리스트 데이터는 내 기기에만 저장됩니다 · 클라우드 동기화는 선택',

  'list.edit': '편집',
  'list.done': '완료',
  'list.mountModeOn': '거치 해제',
  'list.mountModeOff': '거치 모드',
  'list.helperConnected': 'PC 연결됨',
  'list.helperConnecting': '연결 중',
  'list.helperDisconnected': 'PC 없음',
  'list.empty.title': '첫 리스트를 만들어보세요',
  'list.empty.body': '디렉토리 페이지에서 ★ 옆 "내 큐브에"를 눌러 사이트를 큐브로 추가할 수 있습니다.',
  'list.empty.create': '기본 리스트 만들기',
  'list.manage.newList': '+ 새 리스트',
  'list.manage.settings': '리스트 설정',

  'cube.edit.title': '큐브 편집',
  'cube.edit.name': '이름',
  'cube.edit.icon': '아이콘 URL',
  'cube.edit.action': '동작',
  'cube.action.link': '링크',
  'cube.action.shortcut': '단축키',
  'cube.action.macro': '매크로',

  'common.cancel': '취소',
  'common.save': '저장',
  'common.delete': '지우기',
  'common.close': '닫기',
  'common.required': '필수',

  'pair.title': '기기 페어링',
  'pair.subtitle': 'PC 앱 화면에 표시된 QR 코드를 스캔해주세요',
  'pair.start': 'QR 스캔 시작',
  'pair.success': '페어링 완료',
  'pair.openList': '큐브 리스트 열기',
  'pair.retry': '다시 시도',

  'plugin.list.title': '플러그인',
  'plugin.list.searchPlaceholder': '플러그인 검색',
  'plugin.list.sortPopular': '인기순',
  'plugin.list.sortRecent': '최신순',
  'plugin.list.sortName': '이름순',
  'plugin.install': '큐브 리스트에 추가',
  'plugin.installing': '설치 중…',
  'plugin.installed': '큐브 리스트 라이브러리에 추가되었습니다',

  'ads.upgradeCta': '큐브 리스트 후원하고 광고 제거하기',
  'ads.upgradeAvailableElsewhere': '거치 모드 무료 이용 중',

  'account.signOut': '로그아웃',
  'account.plan': '플랜',
  'account.free': '무료',
  'account.pro': '큐브 리스트 Pro',
};

const en: Catalog = {
  'brand.company': 'Rebirth Station',
  'brand.product': 'Cube List',
  'brand.tagline': 'Wake the sleeping devices, again.',
  'brand.sub_tagline': 'A second life for forgotten devices — Rebirth Station',
  'brand.layer1': 'Layer 1 · Rebirth Station — Master Platform',
  'brand.layer2': 'Layer 2 · Cube List — Core Engine',
  'brand.layer3': 'Layer 3 · Marketplace',
  'brand.layer4': 'Layer 4 · Content Partner Collabs',

  'home.openList': 'Open Cube List',
  'home.pair': 'Pair device',
  'home.plugins': 'Browse plugins',
  'home.account': 'Sign in / Account',
  'home.trustSignal': 'Your list data stays on your device · cloud sync is optional',

  'list.edit': 'Edit',
  'list.done': 'Done',
  'list.mountModeOn': 'Exit mount mode',
  'list.mountModeOff': 'Mount mode',
  'list.helperConnected': 'PC connected',
  'list.helperConnecting': 'Connecting',
  'list.helperDisconnected': 'No PC',
  'list.empty.title': 'Create your first list',
  'list.empty.body': 'Tap "Add to Cube" next to ★ on directory pages to add a site as a cube.',
  'list.empty.create': 'Create default list',
  'list.manage.newList': '+ New list',
  'list.manage.settings': 'List settings',

  'cube.edit.title': 'Edit cube',
  'cube.edit.name': 'Name',
  'cube.edit.icon': 'Icon URL',
  'cube.edit.action': 'Action',
  'cube.action.link': 'Link',
  'cube.action.shortcut': 'Shortcut',
  'cube.action.macro': 'Macro',

  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.close': 'Close',
  'common.required': 'Required',

  'pair.title': 'Pair device',
  'pair.subtitle': 'Scan the QR code on your PC app',
  'pair.start': 'Start QR scan',
  'pair.success': 'Paired',
  'pair.openList': 'Open Cube List',
  'pair.retry': 'Try again',

  'plugin.list.title': 'Plugins',
  'plugin.list.searchPlaceholder': 'Search plugins',
  'plugin.list.sortPopular': 'Popular',
  'plugin.list.sortRecent': 'Recent',
  'plugin.list.sortName': 'Name',
  'plugin.install': 'Add to Cube List',
  'plugin.installing': 'Installing…',
  'plugin.installed': 'Added to your library',

  'ads.upgradeCta': 'Support Cube List · remove ads',
  'ads.upgradeAvailableElsewhere': 'Free mount mode in use',

  'account.signOut': 'Sign out',
  'account.plan': 'Plan',
  'account.free': 'Free',
  'account.pro': 'Cube List Pro',
};

const ja: Catalog = {
  'brand.company': 'リバース・ステーション (Rebirth Station)',
  'brand.product': 'キューブ・リスト (Cube List)',
  'brand.tagline': '眠っているデバイスを、もう一度起こす',
  'brand.sub_tagline': '忘れられた機器の再発見 — リバース・ステーション',
  'brand.layer1': 'Layer 1 · リバース・ステーション — マスタープラットフォーム',
  'brand.layer2': 'Layer 2 · キューブ・リスト — コアエンジン',
  'brand.layer3': 'Layer 3 · マーケットプレイス',
  'brand.layer4': 'Layer 4 · コンテンツパートナーコラボ',

  'home.openList': 'キューブ・リストを開く',
  'home.pair': 'デバイスを連携',
  'home.plugins': 'プラグインを見る',
  'home.account': 'ログイン / アカウント',
  'home.trustSignal': 'リストのデータはあなたの端末にだけ保存されます · クラウド同期は任意',

  'list.edit': '編集',
  'list.done': '完了',
  'list.mountModeOn': '据え置き解除',
  'list.mountModeOff': '据え置きモード',
  'list.helperConnected': 'PC 接続中',
  'list.helperConnecting': '接続中',
  'list.helperDisconnected': 'PC なし',
  'list.empty.title': '最初のリストを作りましょう',
  'list.empty.body': 'ディレクトリページの ★ の横にある「キューブに追加」をタップして、サイトをキューブにできます。',
  'list.empty.create': 'デフォルトリストを作成',
  'list.manage.newList': '+ 新規リスト',
  'list.manage.settings': 'リスト設定',

  'cube.edit.title': 'キューブを編集',
  'cube.edit.name': '名前',
  'cube.edit.icon': 'アイコン URL',
  'cube.edit.action': '動作',
  'cube.action.link': 'リンク',
  'cube.action.shortcut': 'ショートカット',
  'cube.action.macro': 'マクロ',

  'common.cancel': 'キャンセル',
  'common.save': '保存',
  'common.delete': '削除',
  'common.close': '閉じる',
  'common.required': '必須',

  'pair.title': 'デバイスを連携',
  'pair.subtitle': 'PC アプリに表示されている QR コードをスキャンしてください',
  'pair.start': 'QR スキャンを開始',
  'pair.success': '連携完了',
  'pair.openList': 'キューブ・リストを開く',
  'pair.retry': '再試行',

  'plugin.list.title': 'プラグイン',
  'plugin.list.searchPlaceholder': 'プラグインを検索',
  'plugin.list.sortPopular': '人気順',
  'plugin.list.sortRecent': '新着順',
  'plugin.list.sortName': '名前順',
  'plugin.install': 'キューブ・リストに追加',
  'plugin.installing': 'インストール中…',
  'plugin.installed': 'ライブラリに追加しました',

  'ads.upgradeCta': 'キューブ・リストを応援して広告を消す',
  'ads.upgradeAvailableElsewhere': '据え置きモードを無料で利用中',

  'account.signOut': 'ログアウト',
  'account.plan': 'プラン',
  'account.free': '無料',
  'account.pro': 'キューブ・リスト Pro',
};

export const MESSAGES: Record<Locale, Catalog> = { ko, en, ja };

/**
 * 브라우저 언어를 우선순위 순으로 검사해 첫 일치를 반환.
 *
 * - `navigator.languages` 목록을 순서대로 검사 (사용자 우선순위 보존)
 * - `ko-KR`, `en-US`, `ja-JP` 등 region tag 정상 처리
 * - 어느 것도 매칭 안되면 ko 기본
 */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'ko';
  const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language];
  for (const raw of candidates) {
    const lang = (raw ?? '').toLowerCase();
    if (lang.startsWith('ko')) return 'ko';
    if (lang.startsWith('ja')) return 'ja';
    if (lang.startsWith('en')) return 'en';
  }
  return 'ko';
}
