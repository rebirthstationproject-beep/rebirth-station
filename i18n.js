/* Rebirth Station — i18n (KR + EN) */

const I18N = {
  ko: {
    brand: { name: "Rebirth Station", krName: "리버스 스테이션" },
    nav: {
      about: "리버스 스테이션",
      programs: "프로그램",
      cube: "큐브 리스트",
      market: "마켓플레이스",
      marketCube: "큐브 리스트",
      marketPlugin: "플러그인",
      how: "작동 원리",
      faq: "고객센터",
      project: "리버스 프로젝트",
      cta: "무료로 시작",
    },

    hero: {
      eyebrow: "리버스 스테이션 · 잠자는 디바이스를 다시 깨운다",
      titleA: "안 쓰는 폰을",
      titleB: "PC",
      titleAccent: "큐브 컨트롤러",
      titleC: "로 다시 깨우다.",
      sub: "거치된 안 쓰는 폰이 PC 매크로 컨트롤러가 됩니다. 큐브 리스트로 단축키·매크로·링크를 한 번의 탭으로 실행. Stream Deck 대안, 100% 무료, 추가 하드웨어 0원. 디자이너·트레이더·스트리머·자영업자 등 직군별 사용 사례 풍부.",
      primary: "큐브 리스트가 뭔가요?",
      secondary: "큐브 리스트 다운로드",
      meta1: "서울 · 도쿄 · 샌프란시스코",
      meta2: "글로벌 동시 출시",
      meta3: "2026 Q3 오픈 베타",
      tip: "큐브를 눌러보세요",
      ghostAction: "이 자리에 좋아하는 앱을 추가하세요",
      // Row labels above the phone visual
      rowLabels: ["앱 런처", "단축키", "매크로"],
    },

    philosophy: {
      eyebrow: "한국 가구당 안 쓰는 폰 1.5대 — 220만 톤 CO2 잠재 절감",
      title: "여전히 좋은 생산성을 가질 수 있는 디바이스들이 \n여러분의 집에 잠들어 있습니다.",
      lede: "환경부 폐자원 조사(2024) 기준 한국 가구당 평균 1.5대의 안 쓰는 폰이 서랍에 잠들어 있습니다. 전국 잠재 3,300만 대 = 약 220만 톤 CO2 (Apple Environmental Progress Report 2024 기준). 큐브 리스트는 폐기 대신 재활용하는 가장 단순한 SW 솔루션입니다.",
      stats: [
        { num: "1.5", unit: "대", label: "한국 가구당 안 쓰는 폰 (환경부 2024)" },
        { num: "220", unit: "만 t", label: "잠재 CO2 절감 (전국 환산)" },
        { num: "0", unit: "원", label: "추가 하드웨어 비용" },
      ],
    },

    programs: {
      eyebrow: "프로그램",
      title: "리버스 스테이션이 만들고 있는 것",
      lede: "잠든 디바이스를 깨우는 도구를 차례대로 공개합니다. 큐브 리스트가 첫 시작입니다.",
      cards: [
        {
          status: "RELEASED",
          statusLabel: "출시",
          name: "큐브 리스트",
          en: "Cube List",
          desc: "안 쓰는 폰을 책상 위 매크로 컨트롤러로. PC 단축키·매크로·링크 런처.",
          tag: "Macro Launcher",
          featured: true,
        },
        {
          status: "IN_DEV",
          statusLabel: "개발 중",
          name: "프로그램 02",
          en: "TBA",
          desc: "구형 태블릿을 항상 켜져 있는 대시보드로 전환하는 두 번째 프로그램.",
          tag: "Always-on Display",
        },
        {
          status: "RESEARCH",
          statusLabel: "리서치",
          name: "프로그램 03",
          en: "TBA",
          desc: "쓰지 않는 노트북을 가벼운 홈 서버·미디어 허브로 활용하는 실험.",
          tag: "Edge Compute",
        },
      ],
    },

    system: {
      eyebrow: "큐브 리스트 — 첫 번째 프로젝트",
      title: "큐브 · 리스트 · 큐브팩",
      lede: "하나의 매크로 버튼부터 한 직군 전체를 위한 큐브 모음까지. 3단계로 구성된 단일 명령 체계. 쉽고 편한 커스텀으로 나에게 맞는 리스트를 제작, 마켓플레이스를 통해 배포·공유·판매까지 가능합니다.",
      tiers: [
        {
          num: "01 / TIER 1",
          en: "Cube",
          kr: "큐브",
          ext: ".cubeone",
          desc: "PC에서 실행할 하나의 동작. 단축키, 매크로 스크립트, URL 어떤 것이든. 폰 화면의 버튼 하나가 하나의 큐브입니다.",
          meta: ["1 큐브 = 1 동작", "Hotkey · Macro · URL"],
        },
        {
          num: "02 / TIER 2",
          en: "Cube List",
          kr: "큐브 리스트",
          ext: ".cubelist",
          desc: "여러 큐브를 한 화면에 묶은 작업 페이지. 상황에 맞게 리스트를 전환하면 같은 폰이 다른 컨트롤러가 됩니다.",
          meta: ["6~24 큐브 / 리스트", "무제한 리스트"],
        },
        {
          num: "03 / TIER 3",
          en: "Cube Pack",
          kr: "큐브 팩",
          ext: ".cubepack",
          desc: "특정 직군·앱을 위해 큐레이션된 리스트 묶음. 트레이딩, 디자인, 스트리밍 등 마켓플레이스에서 한 번에 설치.",
          meta: ["3~12 리스트 / 팩", "원클릭 설치"],
        },
      ],
    },

    eco: {
      eyebrow: "4-Layer 사업 구조",
      title: "한 장에 정리한 회사 구조",
      lede: "플랫폼 — 엔진 — 마켓 — 콜라보. 네 계층이 서로를 키우는 구조로 설계되어 있습니다.",
      layers: [
        { tier: "1", num: "LAYER 01", name: "Rebirth Station", desc: "유휴 디바이스 재활용 마스터 브랜드", tag: "Platform" },
        { tier: "2", num: "LAYER 02", name: "프로그램 엔진", desc: "큐브 리스트 등 자체 개발 프로그램 코어", tag: "Engine" },
        { tier: "3", num: "LAYER 03", name: "마켓플레이스", desc: "큐브 · 리스트 · 큐브팩 배포와 거래", tag: "Marketplace" },
        { tier: "4", num: "LAYER 04", name: "콘텐츠 파트너 콜라보", desc: "자사 브랜드 포트폴리오와의 기술 콜라보", tag: "Partners" },
      ],
    },

    partners: {
      eyebrow: "파트너 콜라보",
      title: "파트너스 브랜드와 함께 만듭니다",
      lede: "AI K LINK, Placecite 등 파트너 브랜드와의 통합으로 시작합니다. 외부 파트너십은 순차적으로 공개됩니다.",
      brands: [
        { name: "AI K LINK", tag: "AI 워크플로우" },
        { name: "Placecite", tag: "장소 · 큐레이션" },
      ],
    },

    market: {
      eyebrow: "마켓플레이스",
      title: "직군별 큐브팩, 한 번의 클릭으로",
      lede: "검증된 크리에이터의 큐브팩을 설치하고, 즉시 내 폰을 그 직군의 컨트롤러로 전환하세요.",
      browse: "전체 카탈로그 보기",
      packs: [
        {
          cat: "Trading", title: "TradingView Pro Deck", author: "by @tradehouse", price: "FREE", count: "32 큐브",
          color: "#FF9800",
          cubes: [
            { label: "TradingView", icon: "📈" },
            { label: "업비트", icon: "🟡" },
            { label: "빗썸", icon: "🟠" },
            { label: "Binance", icon: "🔶" },
            { label: "KRX", icon: "🇰🇷" },
            { label: "Coinbase", icon: "🔵" },
            { label: "CoinMarketCap", icon: "📊" },
            { label: "Bloomberg", icon: "📰" },
          ],
        },
        {
          cat: "Streaming", title: "OBS 스트리머 팩", author: "by Rebirth Studio", price: "₩9,900", count: "18 큐브",
          color: "#9C27B0",
          cubes: [
            { label: "씬 1", icon: "🎬" },
            { label: "씬 2", icon: "🎥" },
            { label: "녹화", icon: "🔴" },
            { label: "마이크", icon: "🎙" },
            { label: "Twitch", icon: "💜" },
            { label: "Discord", icon: "💬" },
            { label: "스폰서", icon: "💎" },
            { label: "BRB", icon: "⏸" },
          ],
        },
        {
          cat: "Design", title: "Figma 단축키 마스터", author: "by uxlab.kr", price: "₩4,900", count: "24 큐브",
          color: "#E91E63",
          cubes: [
            { label: "Figma", icon: "🎨" },
            { label: "Frame", icon: "🖼" },
            { label: "Auto Layout", icon: "📐" },
            { label: "컴포넌트", icon: "🧩" },
            { label: "프로토타입", icon: "▶️" },
            { label: "Dribbble", icon: "🏀" },
            { label: "Coolors", icon: "🎨" },
            { label: "Unsplash", icon: "📷" },
          ],
        },
        {
          cat: "Productivity", title: "Notion · Slack 콤보", author: "by Rebirth Studio", price: "FREE", count: "16 큐브",
          color: "#795548",
          cubes: [
            { label: "Notion", icon: "📝" },
            { label: "Slack", icon: "💬" },
            { label: "캘린더", icon: "📅" },
            { label: "할 일", icon: "✅" },
            { label: "검색", icon: "🔍" },
            { label: "Gmail", icon: "✉️" },
            { label: "Meet", icon: "📹" },
            { label: "스크린샷", icon: "📸" },
          ],
        },
        {
          cat: "Developer", title: "VS Code · Git 런처", author: "by codepocket", price: "₩3,900", count: "28 큐브",
          color: "#1A237E",
          cubes: [
            { label: "VS Code", icon: "💻" },
            { label: "GitHub", icon: "🐙" },
            { label: "PR 목록", icon: "🔀" },
            { label: "Stack Overflow", icon: "📚" },
            { label: "npm", icon: "📦" },
            { label: "MDN", icon: "📖" },
            { label: "Vercel", icon: "▲" },
            { label: "Cloudflare", icon: "☁️" },
          ],
        },
        {
          cat: "Smart Home", title: "스마트홈 패널", author: "by 홈오토", price: "FREE", count: "12 큐브",
          color: "#FFC107",
          cubes: [
            { label: "거실 조명", icon: "💡" },
            { label: "침실 조명", icon: "🛏" },
            { label: "에어컨", icon: "❄️" },
            { label: "TV", icon: "📺" },
            { label: "도어락", icon: "🔒" },
            { label: "CCTV", icon: "📹" },
            { label: "보일러", icon: "🔥" },
            { label: "공기청정기", icon: "🌬" },
          ],
        },
      ],
    },

    how: {
      eyebrow: "큐브 리스트 작동 원리",
      title: "3단계로 끝나는 셋업",
      lede: "특별한 하드웨어가 필요 없습니다. 안 쓰는 폰과 PC 한 대만 있으면 됩니다.",
      steps: [
        { n: "STEP 01", title: "폰 거치", desc: "구형 스마트폰·태블릿을 책상 위에 거치합니다. 충전기는 옆에. 그게 전부입니다." },
        { n: "STEP 02", title: "PC 앱 설치", desc: "Windows · macOS용 PC 앱을 설치하고, 폰에서 브라우저로 코드를 스캔하면 페어링 완료." },
        { n: "STEP 03", title: "큐브 클릭", desc: "폰 화면의 큐브를 누르면 PC에서 단축키·매크로·링크가 즉시 실행됩니다." },
      ],
    },

    download: {
      eyebrow: "지금 다운로드",
      title: "당신의 책상을 다시 설계할 시간",
      sub: "PC 앱과 모바일 앱은 무료로 제공됩니다. 큐브 만들기는 처음부터 무제한.",
      pc: { small: "PC 앱", big: "Windows 10/11 · macOS 12+" },
      mob: { small: "모바일 PWA", big: "Android · iOS · 태블릿" },
      web: { small: "웹 콘솔", big: "rebirthstation.com/console" },
    },

    downloadPage: {
      eyebrow: "다운로드",
      title: "큐브 리스트 받기",
      sub: "PC 앱과 모바일 앱 모두 무료입니다. Google 계정 1개로 모든 ver. 연동. 큐브 만들기는 처음부터 무제한, 광고는 비침투 하단 1개만.",
      cards: [
        { cat: "PC 앱", catColor: "#1A237E", title: "Rebirth Station — Windows", meta: "Windows 10 / 11 · 64-bit · 약 80MB", cta: "베타 등록 (출시 예정)", note: "2026 Q3 오픈 베타 · 출시 알림 받기" },
        { cat: "PC 앱", catColor: "#1A237E", title: "Rebirth Station — macOS", meta: "macOS 12+ · Apple Silicon · 약 75MB", cta: "베타 등록 (출시 예정)", note: "2026 Q3 오픈 베타 · 출시 알림 받기" },
        { cat: "모바일", catColor: "#E91E63", title: "Google Play (Android)", meta: "Android 9+ · IAP entitlement", cta: "Google Play 등록 예정", note: "출시 후 자동 알림" },
        { cat: "모바일", catColor: "#E91E63", title: "App Store (iOS · iPadOS)", meta: "iOS 13+ · IAP entitlement", cta: "App Store 등록 예정", note: "출시 후 자동 알림" },
        { cat: "웹 PWA", catColor: "#444", title: "웹 콘솔 (브라우저)", meta: "설치 없이 즉시 사용 · 라이트 기능", cta: "베타 등록 (출시 예정)", note: "rebirthstation.com/console" },
      ],
      authBoxTitle: "가입은 Google 계정으로만",
      authBoxBody: "모든 앱은 Google OAuth 로그인만 지원합니다. 이메일/비밀번호 가입은 없습니다. 같은 Gmail로 가입한 모든 ver. (Rebirth Station · ver. 주소모아 · ver. 케이링크)는 자동 연동되며, 메인 앱에서 1회 결제하면 모든 ver. 광고가 자동으로 사라집니다.",
      bottomNote: "출시 전 상태입니다. 베타 등록·테스터 모집은 출시 30일 전 공지합니다.",
    },

    loginPage: {
      eyebrow: "계정",
      title: "Google 계정으로 시작하기",
      sub: "Rebirth Station은 Google 로그인만 지원합니다. 같은 Gmail로 가입한 모든 ver.(주소모아·케이링크 포함)는 자동 연동됩니다.",
      btn: "Google로 계속하기 (출시 후 활성)",
      btnNote: "Stage 2 정식 출시 시점에 활성화됩니다.",
      whyTitle: "왜 Google 로그인만 지원하나요?",
      whyItems: [
        "이메일/비밀번호 가입은 보안·계정 복구 부담이 큽니다.",
        "한국·아시아 사용자 99%+ 가 이미 Gmail 보유.",
        "같은 Gmail = 모든 ver.(주소모아·케이링크·메인) 자동 연동.",
        "메인 앱에서 1회 결제하면 모든 ver. 광고가 자동 제거됩니다.",
      ],
      consent: "로그인 시 이용약관과 개인정보처리방침에 동의하게 됩니다.",
    },

    blogPage: {
      eyebrow: "블로그 · 시드 본문",
      title: "큐브 리스트 블로그",
      sub: "큐브 리스트·리버스 스테이션 사용법·사용 사례·기술 가이드. 총 20편 시드 계획 중 16편 작성 완료. 정식 본문 게시는 Stage 2 공식 출시 시점에 동시 공개됩니다.",
      progress: "진척: 시드 본문 16 / 20 완성 · 미완 4편 (#9 주식·코인 티커 · #10 뉴스 헤드라인 · #13 한국어 키패드 · #18 큐브 마켓 등록)",
      cardStatus: "시드 본문 완성 · 정식 발행 대기",
      bottomNote: "정식 블로그 본문은 Stage 2(SSR 도입) 이후 공식 출시됩니다. 그 전에는 시드 본문 메타데이터만 노출됩니다.",
    },

    faqPage: {
      eyebrow: "자주 묻는 질문",
      title: "고객센터",
      sub: "큐브 리스트·리버스 스테이션 관련 자주 묻는 질문. 추가 문의는 출시 후 공식 채널을 통해 받습니다.",
      empty: "준비 중입니다.",
      bottomNote: "더 자세한 안내는 블로그에서 확인하세요.",
    },

    faq: {
      eyebrow: "자주 묻는 질문",
      title: "궁금했던 것들",
      items: [
        {
          q: "리버스 스테이션은 무엇인가요?",
          a: "잠들어 있는 유휴 디바이스에 새로운 가치를 더하는 프로그램과 앱을 개발하는 프로젝트입니다. 책상 서랍 속 구형 폰·태블릿·노트북을 다시 활용할 수 있도록 만드는 것이 우리의 목표입니다.",
        },
        {
          q: "큐브 리스트만 있는 건가요?",
          a: "큐브 리스트는 우리가 처음 공개하는 프로그램입니다. 디스플레이 활용, 보조 화면, 엣지 컴퓨팅 등 다양한 후속 프로그램이 이미 개발·연구 중에 있습니다.",
        },
        {
          q: "정말 하드웨어 추가 비용 없이 Stream Deck처럼 쓸 수 있나요?",
          a: "네. 책상 서랍에 잠자고 있는 구형 스마트폰·태블릿이면 충분합니다. 안드로이드 5.0 이상, iOS 13 이상이면 PWA로 작동하며, 별도의 케이블 연결도 필요하지 않습니다.",
        },
        {
          q: "마켓플레이스의 큐브팩은 안전한가요?",
          a: "모든 큐브팩은 사내 자동 검수를 거치고, 시스템 명령은 화이트리스트 안에서만 실행됩니다. 사용자 PC 권한 밖의 코드는 차단됩니다.",
        },
        {
          q: "한국 외 지역에서도 사용할 수 있나요?",
          a: "처음부터 글로벌 플랫폼으로 설계되었습니다. 한국어와 영어를 시작으로 일본어·중국어·스페인어가 순차적으로 추가됩니다.",
        },
        {
          q: "내가 만든 큐브팩을 판매할 수 있나요?",
          a: "오픈 베타 종료 후 크리에이터 프로그램이 시작됩니다. 신청한 크리에이터는 마켓플레이스에 큐브팩을 유료 등록할 수 있습니다.",
        },
      ],
    },

    footer: {
      tag: "잠들어 있는 디바이스에 새로운 가치를 더하는 글로벌 프로젝트. 서울 · 도쿄 · 샌프란시스코.",
      cols: [
        { title: "PROGRAMS", links: ["큐브 리스트", "마켓플레이스", "PC 앱 다운로드", "모바일 PWA"] },
        { title: "COMPANY", links: ["회사 소개", "파트너십", "보도자료", "채용"] },
        { title: "RESOURCES", links: ["개발자 문서", "큐브팩 가이드", "변경사항", "지원"] },
      ],
      copy: "© 2026 Rebirth Station. All rights reserved.",
      legal: ["이용약관", "개인정보처리방침", "쿠키 정책"],
    },
  },

  en: {
    brand: { name: "Rebirth Station", krName: "Rebirth Station" },
    nav: {
      about: "Rebirth Station",
      programs: "Programs",
      cube: "Cube List",
      market: "Marketplace",
      marketCube: "Cube List",
      marketPlugin: "Plugins",
      how: "How",
      faq: "Support",
      project: "Rebirth Project",
      cta: "Get started",
    },

    hero: {
      eyebrow: "Rebirth Station · Second life of devices",
      titleA: "A project that gives",
      titleB: "sleeping devices",
      titleAccent: "new value",
      titleC: ".",
      sub: "Rebirth Station develops programs and applications that bring idle phones, laptops and tablets sitting at home back to life as useful, daily-driver devices.",
      primary: "About the project",
      secondary: "Download Cube List",
      meta1: "Seoul · Tokyo · SF",
      meta2: "Global from day one",
      meta3: "2026 Open beta",
      tip: "Tap a cube",
      ghostAction: "Add your favorite app to this slot",
      rowLabels: ["App launchers", "Shortcuts", "Macros"],
    },

    philosophy: {
      eyebrow: "The problem we're solving",
      title: "Capable devices are still sitting idle \nin homes around you.",
      lede: "On average 3.4 smart devices sit unused in every household. We build the software that gives them a new purpose.",
      stats: [
        { num: "3.4", unit: "devices", label: "idle per household, on average" },
        { num: "67", unit: "%", label: "unused for over a year" },
        { num: "$0", unit: "", label: "extra hardware cost" },
      ],
    },

    programs: {
      eyebrow: "Programs",
      title: "What we're building at Rebirth Station",
      lede: "We're rolling out tools that wake sleeping devices, one program at a time. Cube List is where we begin.",
      cards: [
        {
          status: "RELEASED",
          statusLabel: "Released",
          name: "Cube List",
          en: "Cube List",
          desc: "Turns an idle phone into a desk-side macro controller — a launcher for PC shortcuts, macros and links.",
          tag: "Macro Launcher",
          featured: true,
        },
        {
          status: "IN_DEV",
          statusLabel: "In development",
          name: "Program 02",
          en: "TBA",
          desc: "Our second program turns retired tablets into always-on dashboards for the home.",
          tag: "Always-on Display",
        },
        {
          status: "RESEARCH",
          statusLabel: "In research",
          name: "Program 03",
          en: "TBA",
          desc: "Experiment turning unused laptops into a lightweight home server and media hub.",
          tag: "Edge Compute",
        },
      ],
    },

    system: {
      eyebrow: "Cube List — our first project",
      title: "Cube · List · Cube Pack",
      lede: "From a single macro button to an entire role-based bundle. One command language, three tiers. Build your own lists with easy customization, then distribute, share, and sell them through the Marketplace.",
      tiers: [
        {
          num: "01 / TIER 1",
          en: "Cube",
          kr: "큐브",
          ext: ".cubeone",
          desc: "A single action your PC can run — a hotkey, a macro script, a URL. Each button on your phone screen is one cube.",
          meta: ["1 cube = 1 action", "Hotkey · Macro · URL"],
        },
        {
          num: "02 / TIER 2",
          en: "Cube List",
          kr: "큐브 리스트",
          ext: ".cubelist",
          desc: "A page of cubes for one context. Swap lists and the same phone instantly becomes a different controller.",
          meta: ["6–24 cubes / list", "Unlimited lists"],
        },
        {
          num: "03 / TIER 3",
          en: "Cube Pack",
          kr: "큐브 팩",
          ext: ".cubepack",
          desc: "Curated bundles of lists for a role or app — trading, design, streaming. Install in one click from the marketplace.",
          meta: ["3–12 lists / pack", "One-click install"],
        },
      ],
    },

    eco: {
      eyebrow: "4-Layer business stack",
      title: "Our company structure, in one view",
      lede: "Platform, engine, market, collaboration — four layers designed to grow each other.",
      layers: [
        { tier: "1", num: "LAYER 01", name: "Rebirth Station", desc: "The master brand for idle-device reuse", tag: "Platform" },
        { tier: "2", num: "LAYER 02", name: "Program engines", desc: "Our in-house program cores, starting with Cube List", tag: "Engine" },
        { tier: "3", num: "LAYER 03", name: "Marketplace", desc: "Distribute and trade cubes · lists · packs", tag: "Marketplace" },
        { tier: "4", num: "LAYER 04", name: "Partner collaborations", desc: "Tech collaborations with our brand portfolio", tag: "Partners" },
      ],
    },

    partners: {
      eyebrow: "Partner brands",
      title: "Built with our partner brands",
      lede: "We launch with deep integration into partner brands — AI K LINK, Placecite. External partnerships will be announced in stages.",
      brands: [
        { name: "AI K LINK", tag: "AI workflows" },
        { name: "Placecite", tag: "Place curation" },
      ],
    },

    market: {
      eyebrow: "Marketplace",
      title: "Role-based packs, one click away",
      lede: "Install a vetted pack and your phone becomes the controller for that role — instantly.",
      browse: "Browse full catalog",
      packs: [
        { cat: "Trading", title: "TradingView Pro Deck", author: "by @tradehouse", price: "FREE", count: "32 cubes" },
        { cat: "Streaming", title: "OBS Streamer Pack", author: "by Rebirth Studio", price: "$7.99", count: "18 cubes" },
        { cat: "Design", title: "Figma Shortcut Master", author: "by uxlab.kr", price: "$3.99", count: "24 cubes" },
        { cat: "Productivity", title: "Notion · Slack Combo", author: "by Rebirth Studio", price: "FREE", count: "16 cubes" },
        { cat: "Developer", title: "VS Code · Git Launcher", author: "by codepocket", price: "$2.99", count: "28 cubes" },
        { cat: "Smart Home", title: "Smart Home Panel", author: "by Hauto", price: "FREE", count: "12 cubes" },
      ],
    },

    how: {
      eyebrow: "How Cube List works",
      title: "Three steps to set it up",
      lede: "No special hardware. Just an idle phone and your PC.",
      steps: [
        { n: "STEP 01", title: "Mount the phone", desc: "Place your old smartphone or tablet on a stand. Charger to the side. That's it." },
        { n: "STEP 02", title: "Install the PC App", desc: "Install the PC App for Windows or macOS, then pair by scanning a code from your phone's browser." },
        { n: "STEP 03", title: "Tap a Cube", desc: "Tap a cube on your phone — your PC runs the matching shortcut, macro or link, instantly." },
      ],
    },

    download: {
      eyebrow: "Download today",
      title: "Time to redesign your desk",
      sub: "The PC app and mobile app are free. Build unlimited cubes from day one.",
      pc: { small: "PC APP", big: "Windows 10/11 · macOS 12+" },
      mob: { small: "MOBILE PWA", big: "Android · iOS · Tablet" },
      web: { small: "WEB CONSOLE", big: "rebirthstation.com/console" },
    },

    downloadPage: {
      eyebrow: "Download",
      title: "Get Cube List",
      sub: "Both PC and mobile apps are free. One Google account links every ver. Build unlimited cubes — only one non-intrusive footer ad on free plan.",
      cards: [
        { cat: "PC App", catColor: "#1A237E", title: "Rebirth Station — Windows", meta: "Windows 10 / 11 · 64-bit · ~80MB", cta: "Beta signup (coming soon)", note: "2026 Q3 open beta · get notified" },
        { cat: "PC App", catColor: "#1A237E", title: "Rebirth Station — macOS", meta: "macOS 12+ · Apple Silicon · ~75MB", cta: "Beta signup (coming soon)", note: "2026 Q3 open beta · get notified" },
        { cat: "Mobile", catColor: "#E91E63", title: "Google Play (Android)", meta: "Android 9+ · IAP entitlement", cta: "Google Play (coming soon)", note: "Auto-notify on launch" },
        { cat: "Mobile", catColor: "#E91E63", title: "App Store (iOS · iPadOS)", meta: "iOS 13+ · IAP entitlement", cta: "App Store (coming soon)", note: "Auto-notify on launch" },
        { cat: "Web PWA", catColor: "#444", title: "Web Console (Browser)", meta: "No install · lite feature set", cta: "Beta signup (coming soon)", note: "rebirthstation.com/console" },
      ],
      authBoxTitle: "Sign in with Google only",
      authBoxBody: "All apps support Google OAuth sign-in only — no email/password. The same Gmail links every ver. (Rebirth Station · ver. Jusomoa · ver. K-Link) automatically. One IAP in the main app removes ads across all ver.",
      bottomNote: "Pre-launch. Beta signup and tester invites open 30 days before launch.",
    },

    loginPage: {
      eyebrow: "Account",
      title: "Sign in with Google",
      sub: "Rebirth Station supports Google sign-in only. The same Gmail links every ver. (including ver. Jusomoa · ver. K-Link) automatically.",
      btn: "Continue with Google (activates on launch)",
      btnNote: "Activated at Stage 2 official launch.",
      whyTitle: "Why Google sign-in only?",
      whyItems: [
        "Email/password is a heavy burden on security and account recovery.",
        "99%+ of Korean and Asian users already have a Gmail account.",
        "Same Gmail = automatic link across all ver. (Jusomoa · K-Link · main).",
        "One IAP in the main app removes ads across every ver.",
      ],
      consent: "By signing in, you agree to the Terms of Service and Privacy Policy.",
    },

    blogPage: {
      eyebrow: "Blog · Seed posts",
      title: "Cube List Blog",
      sub: "How-to, use cases, and technical guides for Cube List and Rebirth Station. 16 of 20 seed posts complete. Official publishing opens at Stage 2 launch.",
      progress: "Progress: 16 / 20 seed posts complete · 4 remaining (#9 stock/crypto ticker · #10 news headlines · #13 Korean keypad · #18 cube marketplace listing)",
      cardStatus: "Seed complete · pending official publish",
      bottomNote: "Official blog posts go live after Stage 2 (SSR rollout). Until then, only seed metadata is shown.",
    },

    faqPage: {
      eyebrow: "FAQ",
      title: "Support",
      sub: "Frequently asked questions about Cube List and Rebirth Station. Additional inquiries open through official channels after launch.",
      empty: "Coming soon.",
      bottomNote: "For more, see the Blog.",
    },

    faq: {
      eyebrow: "FAQ",
      title: "Common questions",
      items: [
        {
          q: "What is Rebirth Station?",
          a: "A project that builds software giving new value to dormant devices — old phones, tablets and laptops sitting unused in drawers. That mission, not any single product, is what defines us.",
        },
        {
          q: "Is Cube List your only program?",
          a: "Cube List is our first public program. A second program for always-on displays, and a third exploring edge compute on retired laptops, are already in development and research.",
        },
        {
          q: "Can it really replace a Stream Deck without extra hardware?",
          a: "Yes. An old phone or tablet sitting in your drawer is enough. Android 5+ and iOS 13+ run the PWA smoothly; no cables required.",
        },
        {
          q: "Are marketplace cube packs safe?",
          a: "Every pack passes our automated review, and system commands run only inside a whitelist. Anything outside your PC's existing permissions is blocked.",
        },
        {
          q: "Is it available outside Korea?",
          a: "Designed as a global platform from day one. English first, with Japanese, Chinese and Spanish following.",
        },
        {
          q: "Can I sell my own cube packs?",
          a: "The creator program opens after our public beta. Approved creators can publish paid packs on the marketplace.",
        },
      ],
    },

    footer: {
      tag: "The global project giving sleeping devices new value. Seoul · Tokyo · San Francisco.",
      cols: [
        { title: "PROGRAMS", links: ["Cube List", "Marketplace", "PC App", "Mobile PWA"] },
        { title: "COMPANY", links: ["About", "Partners", "Press", "Careers"] },
        { title: "RESOURCES", links: ["Developer docs", "Cube Pack guide", "Changelog", "Support"] },
      ],
      copy: "© 2026 Rebirth Station. All rights reserved.",
      legal: ["Terms", "Privacy", "Cookies"],
    },
  },
};

window.I18N = I18N;
