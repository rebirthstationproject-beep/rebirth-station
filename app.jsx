/* Rebirth Station — Main App */
const { useState: useState_, useEffect: useEffect_ } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroLayout": "split",
  "language": "ko",
  "pro": false
}/*EDITMODE-END*/;

/* ver 분기 — URL 쿼리 ?ver=jusomoa | keilink 로 시뮬레이션 */
const VER_CONFIG = {
  main: { id: "main", name: "Rebirth Station", badge: null, accent: "#1A237E" },
  jusomoa: { id: "jusomoa", name: "큐브 리스트 (ver. 주소모아)", badge: "ver. 주소모아", accent: "#E91E63" },
  keilink: { id: "keilink", name: "큐브 리스트 (ver. 케이링크)", badge: "ver. 케이링크", accent: "#0AB39C" },
};
function detectVer() {
  if (typeof window === "undefined") return VER_CONFIG.main;
  const q = new URLSearchParams(window.location.search).get("ver");
  return VER_CONFIG[q] || VER_CONFIG.main;
}

function ToastContainer() {
  const [toasts, setToasts] = useState_([]);

  // Stage 2: Supabase Realtime 채널 구독으로 실시간 알림
  // 현재는 placeholder — 데모용 알림 1회 (URL ?demo=toast)
  useEffect_(() => {
    if (typeof window === "undefined") return;
    if (!new URLSearchParams(window.location.search).has("demo")) return;
    const demos = [
      { id: 1, type: "info", title: "데모 알림", body: "Stage 2에서 Supabase Realtime으로 실시간 알림이 활성됩니다.", color: "#1A237E" },
    ];
    setToasts(demos);
    const timer = setTimeout(() => setToasts([]), 5000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = (id) => setToasts((arr) => arr.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="알림"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 320
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderLeft: `4px solid ${t.color}`,
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: 14,
            display: "flex",
            gap: 12,
            alignItems: "flex-start"
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.title}</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.5 }}>{t.body}</div>
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="닫기"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", fontSize: 16, padding: 0, lineHeight: 1 }}
          >×</button>
        </div>
      ))}
    </div>
  );
}

function SiteSearch() {
  const [open, setOpen] = useState_(false);
  const [q, setQ] = useState_("");

  const items = [
    { label: "홈", href: "/", kw: "home main 홈 hero" },
    { label: "프로그램", href: "/program/", kw: "program 프로그램" },
    { label: "큐브 리스트 (프로그램)", href: "/program/cubelist/", kw: "cubelist 큐브 리스트 cube" },
    { label: "마켓플레이스", href: "/marketplace/", kw: "marketplace 마켓플레이스 market" },
    { label: "큐브 리스트 마켓", href: "/marketplace/cubelist/", kw: "cubelist 큐브 리스트 카탈로그 catalog" },
    { label: "큐브 만들기", href: "/marketplace/cubelist/create-cube/", kw: "create cube 큐브 만들기 cubeone" },
    { label: "리스트·팩 만들기", href: "/marketplace/cubelist/create-list/", kw: "create list 리스트 팩 cubelist cubepack" },
    { label: "파일 변환 (Stream Deck)", href: "/marketplace/cubelist/convert/", kw: "convert streamdeck stream deck 변환" },
    { label: "마켓 관리 (셀러)", href: "/marketplace/cubelist/manage/", kw: "manage seller 셀러 관리" },
    { label: "큐브 에디터", href: "/editor/", kw: "editor 에디터 큐브" },
    { label: "다운로드", href: "/download/", kw: "download 다운로드 install pc app" },
    { label: "블로그", href: "/blog/", kw: "blog 블로그 시드 본문" },
    { label: "고객센터·FAQ", href: "/faq/", kw: "faq support 고객센터 자주 묻는 질문" },
    { label: "로그인", href: "/login/", kw: "login google oauth 로그인" },
    { label: "대시보드", href: "/dashboard/", kw: "dashboard 대시보드" },
    { label: "온보딩", href: "/onboarding/", kw: "onboarding 온보딩" },
    { label: "이용약관", href: "/legal/terms/", kw: "terms 이용약관 약관" },
    { label: "개인정보처리방침", href: "/legal/privacy/", kw: "privacy 개인정보 처리방침" },
    { label: "쿠키 정책", href: "/legal/cookies/", kw: "cookies 쿠키 정책" },
  ];

  const filtered = q.trim() ? items.filter((it) => (it.label + " " + it.kw).toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];

  useEffect_(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="사이트 검색 (Ctrl+K)"
        title="사이트 검색 (Ctrl+K)"
        className="site-search-btn"
        style={{
          background: "var(--surface-sunken)",
          border: "1px solid var(--line)",
          padding: "6px 12px",
          borderRadius: 999,
          cursor: "pointer",
          fontSize: 13,
          color: "var(--ink-3)",
          alignItems: "center",
          gap: 8
        }}
      ><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ verticalAlign: "-2px" }}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> <span className="site-search-text">검색</span> <kbd style={{ fontSize: 11, padding: "1px 6px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 4 }}>⌘K</kbd></button>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="사이트 검색" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 100 }} onClick={() => setOpen(false)} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
      <div style={{ background: "var(--surface)", borderRadius: 12, padding: 16, width: "90%", maxWidth: 560, boxShadow: "0 10px 40px rgba(0,0,0,0.3)", overscrollBehavior: "contain" }} onClick={(e) => e.stopPropagation()}>
        <input
          type="search"
          autoFocus
          placeholder="페이지 검색… (예: 다운로드, 에디터, 블로그)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 15, background: "var(--surface-sunken)" }}
        />
        <div style={{ marginTop: 12, maxHeight: 320, overflowY: "auto" }}>
          {filtered.length === 0 && q.trim() && (
            <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 13 }}>결과 없음</div>
          )}
          {filtered.map((it, i) => {
            const query = q.trim();
            const renderHighlight = (text) => {
              if (!query) return text;
              const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi"));
              return parts.map((p, idx) => p.toLowerCase() === query.toLowerCase()
                ? <mark key={idx} style={{ background: "rgba(233,30,99,0.25)", color: "inherit", padding: 0 }}>{p}</mark>
                : p);
            };
            return (
              <a key={i} href={it.href} style={{ display: "block", padding: "10px 14px", borderRadius: 6, color: "var(--ink)", textDecoration: "none", fontSize: 14 }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-sunken)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontWeight: 600 }}>{renderHighlight(it.label)}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{renderHighlight(it.href)}</div>
              </a>
            );
          })}
          {!q.trim() && (
            <div style={{ padding: 16, fontSize: 13, color: "var(--ink-3)" }}>페이지명·키워드로 검색하세요. <kbd>ESC</kbd>로 닫기.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function VerBadge({ ver }) {
  if (!ver || !ver.badge) return null;
  return (
    <span
      className="ver-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        background: ver.accent,
        color: "#fff",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.3,
        marginLeft: 8,
        whiteSpace: "nowrap"
      }}
      aria-label={`현재 버전: ${ver.name}`}
    >
      {ver.badge}
    </span>
  );
}

function AdSlotPlaceholder({ ver, pro }) {
  if (pro) return null;
  return (
    <div
      className="ad-slot-placeholder"
      role="complementary"
      aria-label="광고 영역 (비침투 하단 배너 1개)"
      style={{
        margin: "32px auto 0",
        maxWidth: 1100,
        padding: "16px 20px",
        background: "var(--surface-sunken)",
        border: "1px dashed var(--line)",
        borderRadius: 12,
        textAlign: "center",
        color: "var(--ink-3)",
        fontSize: 12,
        lineHeight: 1.5
      }}
    >
      <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
        Sponsored {ver && ver.badge ? `· ${ver.badge}` : ""}
      </div>
      <div>
        무료 사용자는 페이지당 비침투 하단 광고 1개가 노출됩니다. Pro 가입 시 자동 제거.
        <a href="/login/" style={{ color: "var(--primary)", marginLeft: 6 }}>Pro 안내 →</a>
      </div>
    </div>
  );
}

function Nav({ t, lang, setLang, scrolled, ver, pro }) {
  const [openDropdown, setOpenDropdown] = useState_(null);
  const [mobileOpen, setMobileOpen] = useState_(false);
  const toggle = (id) => setOpenDropdown(openDropdown === id ? null : id);
  const closeMobile = () => setMobileOpen(false);
  return (
    <nav className={`nav ${scrolled ? "is-scrolled" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}>
      <div className="container nav-inner">
        <window.Logo />
        <VerBadge ver={ver} />
        {pro && (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            background: "#1A237E",
            color: "#fff",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.3,
            marginLeft: 6
          }}>PRO</span>
        )}
        <button
          type="button"
          className="nav-hamburger"
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span></span><span></span><span></span>
        </button>
        <div className="nav-section-label">Menu</div>
        <div className="nav-links" onClick={(e) => { if (e.target.tagName === "A") closeMobile(); }}>
          <a href="/#philosophy">{t.nav.about}</a>

          <div className={`nav-item-dropdown ${openDropdown === "programs" ? "is-open" : ""}`}>
            <a href="/program/" className="nav-toggle">
              {t.nav.programs}
            </a>
            <button type="button" className="nav-caret" aria-label="프로그램 하위 메뉴" aria-expanded={openDropdown === "programs"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle("programs"); }}>
              <span className="caret" aria-hidden>▾</span>
            </button>
            <div className="nav-submenu" role="menu">
              <a href="/program/" role="menuitem">{t.nav.programs} 홈</a>
              <a href="/program/cubelist/" role="menuitem">{t.nav.cube}</a>
            </div>
          </div>

          <div className={`nav-item-dropdown ${openDropdown === "market" ? "is-open" : ""}`}>
            <a href="/marketplace/" className="nav-toggle">
              {t.nav.market}
            </a>
            <button type="button" className="nav-caret" aria-label="마켓플레이스 하위 메뉴" aria-expanded={openDropdown === "market"} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle("market"); }}>
              <span className="caret" aria-hidden>▾</span>
            </button>
            <div className="nav-submenu" role="menu">
              <a href="/marketplace/" role="menuitem">{t.nav.market} 홈</a>
              <a href="/marketplace/cubelist/" role="menuitem">{t.nav.marketCube}</a>
              <a href="/marketplace/cubelist/?tab=plugin" role="menuitem">{t.nav.marketPlugin}</a>
              <a href="/editor/" role="menuitem">에디터</a>
            </div>
          </div>

          <a href="/project/">{t.nav.project}</a>
          <a href="/faq/">{t.nav.faq}</a>
        </div>
        <div className="nav-cta">
          <div className="lang-toggle" role="tablist" aria-label="Language">
            <button
              className={lang === "ko" ? "active" : ""}
              onClick={() => setLang("ko")}
            >KR</button>
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
            >EN</button>
          </div>
          <SiteSearch />
          <a href="/login/" className="btn btn-ghost" style={{ padding: "9px 14px", fontSize: 14 }}>
            로그인
          </a>
          <a href="/download/" className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 14 }}>
            {t.nav.cta}
          </a>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [tw, setTweak] = window.useTweaks
    ? window.useTweaks(TWEAK_DEFAULTS)
    : [TWEAK_DEFAULTS, () => {}];

  const lang = tw.language || "ko";
  const setLang = (l) => setTweak("language", l);

  const t = I18N[lang];

  // Update <html lang>
  useEffect_(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Update page title based on path
  useEffect_(() => {
    const p = window.location.pathname;
    let title = "큐브 리스트 — 안 쓰는 폰을 PC 컨트롤러로 · Rebirth Station";
    if (/^\/marketplace\/cubelist\/create-cube\/?$/.test(p)) title = "큐브 제작 — 링크·단축키·매크로 · Rebirth Station";
    else if (/^\/marketplace\/cubelist\/create-list\/?$/.test(p)) title = "리스트·팩 제작 — 6~24 큐브 · Rebirth Station";
    else if (/^\/marketplace\/cubelist\/convert\/?$/.test(p)) title = "파일 변환 — Stream Deck → 큐브 · Rebirth Station";
    else if (/^\/marketplace\/cubelist\/manage\/?$/.test(p)) title = "마켓 관리 — 셀러 콘솔 · Rebirth Station";
    else if (/^\/program\/cubelist\/?$/.test(p)) title = "큐브 리스트 — Stream Deck 대안 PC 매크로 컨트롤러 · Rebirth Station";
    else if (/^\/program\/?$/.test(p)) title = "리버스 스테이션 프로그램 — 큐브 리스트·디스플레이·홈서버 · Rebirth Station";
    else if (/^\/marketplace\/cubelist\/?$/.test(p)) title = "큐브팩 마켓 — Figma·OBS·트레이딩 60+ 큐브 · Rebirth Station";
    else if (/^\/marketplace\/?$/.test(p)) title = "마켓플레이스 — 직군별 큐브팩 한 번의 클릭 · Rebirth Station";
    else if (/^\/download\/?$/.test(p)) title = "큐브 리스트 다운로드 — PC(Windows·Mac)·모바일(Android·iOS) 무료 · Rebirth Station";
    else if (/^\/blog\/?$/.test(p)) title = "큐브 리스트 블로그 — 사용법·사례·기술 가이드 20편 · Rebirth Station";
    else if (/^\/faq\/?$/.test(p)) title = "FAQ — 큐브 리스트·Rebirth Station 자주 묻는 질문";
    else if (/^\/login\/?$/.test(p)) title = "Google 계정으로 시작 · Rebirth Station";
    else if (/^\/legal\/terms\/?$/.test(p)) title = "이용약관 · Rebirth Station";
    else if (/^\/legal\/privacy\/?$/.test(p)) title = "개인정보처리방침 · Rebirth Station";
    else if (/^\/legal\/cookies\/?$/.test(p)) title = "쿠키 정책 · Rebirth Station";
    else if (/^\/onboarding\/?$/.test(p)) title = "온보딩 5단계 — 큐브 리스트 첫 사용 · Rebirth Station";
    else if (/^\/dashboard\/?$/.test(p)) title = "대시보드 · Rebirth Station";
    else if (/^\/editor\/?$/.test(p)) title = "큐브 에디터 — 링크·단축키·매크로 통합 · Rebirth Station";
    else if (p !== "/" && p !== "") title = "404 · 페이지를 찾을 수 없습니다 · Rebirth Station";
    document.title = title;
  }, []);

  // ver 감지 (URL 쿼리)
  const ver = detectVer();
  const pro = !!tw.pro;

  // Scroll detection for nav
  const [scrolled, setScrolled] = useState_(false);
  useEffect_(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Path-based routing
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const isProgramCubelist = /^\/program\/cubelist\/?$/.test(path);
  const isProgramList = /^\/program\/?$/.test(path);
  const isMarketCubelist = /^\/marketplace\/cubelist\/?$/.test(path);
  const isMarketList = /^\/marketplace\/?$/.test(path);
  const isCreateCube = /^\/marketplace\/cubelist\/create-cube\/?$/.test(path);
  const isCreateList = /^\/marketplace\/cubelist\/create-list\/?$/.test(path);
  const isConvert = /^\/marketplace\/cubelist\/convert\/?$/.test(path);
  const isManage = /^\/marketplace\/cubelist\/manage\/?$/.test(path);
  const isDownload = /^\/download\/?$/.test(path);
  const isBlogIndex = /^\/blog\/?$/.test(path);
  const isFaq = /^\/faq\/?$/.test(path);
  const isProject = /^\/project\/?$/.test(path);
  const isLogin = /^\/login\/?$/.test(path);
  const legalMatch = path.match(/^\/legal\/(terms|privacy|cookies)\/?$/);
  const isOnboarding = /^\/onboarding\/?$/.test(path);
  const isDashboard = /^\/dashboard\/?$/.test(path);
  const isEditor = /^\/editor\/?$/.test(path);

  let body;
  if (isEditor) {
    body = <window.EditorPage t={t} />;
  } else if (isDashboard) {
    body = <window.DashboardPage t={t} />;
  } else if (isOnboarding) {
    body = <window.OnboardingPage t={t} />;
  } else if (legalMatch) {
    body = <window.LegalPage t={t} slug={legalMatch[1]} />;
  } else if (isDownload) {
    body = <window.DownloadPage t={t} />;
  } else if (isBlogIndex) {
    body = <window.BlogIndexPage t={t} />;
  } else if (isFaq) {
    body = <window.FaqPage t={t} />;
  } else if (isProject) {
    body = <window.ProjectPage t={t} />;
  } else if (isLogin) {
    body = <window.LoginPage t={t} />;
  } else if (isCreateCube) {
    body = <window.CreateCubePage t={t} />;
  } else if (isCreateList) {
    body = <window.CreateListPage t={t} />;
  } else if (isConvert) {
    body = <window.ConvertPage t={t} />;
  } else if (isManage) {
    body = <window.ManagePage t={t} />;
  } else if (isProgramCubelist) {
    body = <window.ProgramCubeListPage t={t} />;
  } else if (isProgramList) {
    body = <window.ProgramListPage t={t} />;
  } else if (isMarketCubelist) {
    body = <window.MarketplaceCubeListPage t={t} />;
  } else if (isMarketList) {
    body = <window.MarketplacePage t={t} />;
  } else if (path === "/" || path === "") {
    body = (
      <>
        <Hero t={t} layout={tw.heroLayout || "split"} />
        <Philosophy t={t} />
        <Programs t={t} />
        <SystemTiers t={t} />
        <Ecosystem t={t} />
        <Partners t={t} />
        <Marketplace t={t} />
        <HowItWorks t={t} />
        <Download t={t} />
        <Faq t={t} />
      </>
    );
  } else {
    body = <window.NotFoundPage t={t} />;
  }

  return (
    <>
      <a href="#main" className="skip-link">메인 콘텐츠로 건너뛰기</a>
      <Nav t={t} lang={lang} setLang={setLang} scrolled={scrolled} ver={ver} pro={pro} />
      <main id="main" tabIndex="-1">{body}</main>
      <AdSlotPlaceholder ver={ver} pro={pro} />
      <Footer t={t} />
      <ToastContainer />

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Hero">
            <window.TweakRadio
              label="Layout"
              value={tw.heroLayout || "split"}
              onChange={(v) => setTweak("heroLayout", v)}
              options={[
                { value: "split", label: "Split" },
                { value: "centered", label: "Center" },
                { value: "fullbleed", label: "Full" },
              ]}
            />
          </window.TweakSection>
          <window.TweakSection title="Language">
            <window.TweakRadio
              label="Site language"
              value={lang}
              onChange={(v) => setLang(v)}
              options={[
                { value: "ko", label: "한국어" },
                { value: "en", label: "English" },
              ]}
            />
          </window.TweakSection>
          <window.TweakSection title="Pro entitlement (IAP)">
            <window.TweakRadio
              label="Pro 상태"
              value={tw.pro ? "on" : "off"}
              onChange={(v) => setTweak("pro", v === "on")}
              options={[
                { value: "off", label: "무료 (광고 노출)" },
                { value: "on", label: "Pro (광고 제거)" },
              ]}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
