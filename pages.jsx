/* Rebirth Station — Sub-pages (full content) */

/* ============================================================
 * /program  — 프로그램 목록·로드맵
 * ============================================================ */
function ProgramListPage({ t }) {
  return (
    <>
      {/* Page Hero */}
      <section className="section" style={{ paddingTop: 120, paddingBottom: 64 }}>
        <div className="container">
          <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "프로그램" }]} />
          <div className="eyebrow">PROGRAMS · 프로그램</div>
          <h1 className="section-title" style={{ fontSize: "clamp(36px, 5vw, 56px)", marginBottom: 16 }}>
            잠든 디바이스를 깨우는<br/>프로그램을 차례로 공개합니다
          </h1>
          <p className="section-lede" style={{ maxWidth: 720 }}>
            Rebirth Station은 안 쓰는 폰·노트북·태블릿을 다시 활용 가능하게 만드는 프로그램과 어플리케이션을 개발합니다.
            큐브 리스트가 첫 시작이며, 디스플레이 활용·보조 화면·엣지 컴퓨팅 등 다양한 후속 프로그램이 준비 중입니다.
          </p>
        </div>
      </section>

      {/* Status legend */}
      <section className="section" style={{ paddingTop: 0, paddingBottom: 24 }}>
        <div className="container">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "20px 24px", background: "var(--surface-2)", borderRadius: "var(--r-4)", fontSize: 13, color: "var(--ink-3)" }}>
            <span><span className="status status-RELEASED" style={{ marginRight: 6 }}>출시</span>지금 사용 가능</span>
            <span><span className="status status-IN_DEV" style={{ marginRight: 6 }}>개발 중</span>오픈 베타 진행</span>
            <span><span className="status status-RESEARCH" style={{ marginRight: 6 }}>리서치</span>설계·실험 단계</span>
          </div>
        </div>
      </section>

      {/* Programs full grid */}
      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container">
          <div className="programs-grid">
            {/* Cube List - Released */}
            <a href="/program/cubelist/" className="program-card-link-wrap">
              <article className="program-card is-featured">
                <div className="program-card-head">
                  <span className="status status-RELEASED">출시</span>
                  <span className="program-card-tag">Macro Launcher</span>
                </div>
                <h3>큐브 리스트</h3>
                <div className="en">Cube List</div>
                <p>안 쓰는 폰을 PC 매크로 컨트롤러로. 단축키·매크로·URL을 큐브 한 번의 탭으로 실행. 첫 번째 출시 프로젝트.</p>
                <div className="program-card-cta">
                  <span className="program-card-link">상세 보기 →</span>
                </div>
              </article>
            </a>

            {/* Mirror Display - In Dev */}
            <article className="program-card">
              <div className="program-card-head">
                <span className="status status-IN_DEV">개발 중</span>
                <span className="program-card-tag">Always-on Display</span>
              </div>
              <h3>미러 디스플레이</h3>
              <div className="en">Mirror Display</div>
              <p>구형 태블릿·노트북을 항상 켜져 있는 보조 디스플레이로. 시계·날씨·캘린더·미세먼지·뉴스 헤드라인을 차분히 표시.</p>
            </article>

            {/* Edge Server - Research */}
            <article className="program-card">
              <div className="program-card-head">
                <span className="status status-RESEARCH">리서치</span>
                <span className="program-card-tag">Edge Compute</span>
              </div>
              <h3>엣지 허브</h3>
              <div className="en">Edge Hub</div>
              <p>안 쓰는 노트북을 가벼운 홈 서버·미디어 허브로. 로컬 LLM·파일 공유·홈 자동화 게이트웨이 실험 단계.</p>
            </article>

            {/* Security Cam - Research */}
            <article className="program-card">
              <div className="program-card-head">
                <span className="status status-RESEARCH">리서치</span>
                <span className="program-card-tag">Security</span>
              </div>
              <h3>홈 가드</h3>
              <div className="en">Home Guard</div>
              <p>구형 스마트폰 카메라를 가정용 보안 카메라로. 동작 감지·이벤트 알림·반려동물·아기 모니터링.</p>
            </article>

            {/* Frame - Research */}
            <article className="program-card">
              <div className="program-card-head">
                <span className="status status-RESEARCH">리서치</span>
                <span className="program-card-tag">Photo Frame</span>
              </div>
              <h3>디지털 프레임</h3>
              <div className="en">Digital Frame</div>
              <p>오래된 태블릿을 디지털 액자로. 클라우드 사진 자동 회전, 가족 공유 앨범, 발열 안전 거치 모드.</p>
            </article>

            {/* IoT Hub - Research */}
            <article className="program-card">
              <div className="program-card-head">
                <span className="status status-RESEARCH">리서치</span>
                <span className="program-card-tag">Smart Home</span>
              </div>
              <h3>스마트홈 패널</h3>
              <div className="en">Smart Panel</div>
              <p>거치된 폰을 스마트홈 컨트롤 패널로. 조명·온도·CCTV·도어락을 한 화면에서 제어. Matter·HomeKit 호환 검토.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">ROADMAP · 개발 로드맵</div>
            <h2 className="section-title">단계적 공개 계획</h2>
            <p className="section-lede">출시된 프로그램을 안정화하면서 다음 프로그램을 차례로 공개합니다.</p>
          </div>
          <div className="eco-stack">
            <div className="eco-layer" data-tier="1">
              <div className="num">STAGE 01</div>
              <div className="name">
                <span>큐브 리스트 출시</span>
                <span className="desc">PC 앱 + 모바일 PWA · Windows 1차 · 무료 100%</span>
              </div>
              <span className="tag">현재</span>
            </div>
            <div className="eco-layer" data-tier="2">
              <div className="num">STAGE 02</div>
              <div className="name">
                <span>마켓플레이스 + 미러 디스플레이</span>
                <span className="desc">큐브팩 거래·공유 마켓 오픈, 두 번째 프로그램 미러 디스플레이 베타</span>
              </div>
              <span className="tag">6개월</span>
            </div>
            <div className="eco-layer" data-tier="3">
              <div className="num">STAGE 03</div>
              <div className="name">
                <span>다중 프로그램 + 글로벌</span>
                <span className="desc">엣지 허브·홈 가드 베타, 다국어 확장 (日·中·英)</span>
              </div>
              <span className="tag">12~18개월</span>
            </div>
            <div className="eco-layer" data-tier="4">
              <div className="num">STAGE 04+</div>
              <div className="name">
                <span>플랫폼 · B2B · 하드웨어</span>
                <span className="desc">매장·학원 키오스크 라이선스, 전용 거치대 등 액세서리</span>
              </div>
              <span className="tag">18~36개월</span>
            </div>
          </div>
        </div>
      </section>

      {/* Developer/Creator CTA */}
      <section className="section">
        <div className="container">
          <div className="section-head" style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
            <div className="eyebrow">DEVELOPERS · 개발자</div>
            <h2 className="section-title">함께 만들고 싶으신가요?</h2>
            <p className="section-lede" style={{ margin: "0 auto" }}>
              큐브·큐브팩 크리에이터 프로그램과 외부 개발자 SDK는 Stage 2 이후 순차 공개됩니다.
              지금은 알림 신청만 받습니다.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
            <a href="/program/cubelist/" className="btn btn-primary">큐브 리스트 자세히 보기</a>
            <a href="/#faq" className="btn btn-secondary">FAQ 보기</a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
 * /program/cubelist  — 큐브 리스트 상세 페이지
 * ============================================================ */
function ProgramCubeListPage({ t }) {
  return (
    <>
      {/* Breadcrumb + Hero */}
      <section className="section" style={{ paddingTop: 120, paddingBottom: 32 }}>
        <div className="container">
          <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "프로그램", href: "/program/" }, { label: "큐브 리스트" }]} />
          <div className="eyebrow">PROGRAM 01 · RELEASED</div>
          <h1 className="section-title" style={{ fontSize: "clamp(36px, 5vw, 56px)", marginBottom: 16 }}>
            큐브 리스트<span style={{ color: "var(--muted)", fontWeight: 400 }}> — Cube List</span>
          </h1>
          <p className="section-lede" style={{ maxWidth: 760 }}>
            안 쓰는 폰을 PC 매크로 컨트롤러로 변신시키는 첫 번째 프로젝트.
            단축키·매크로·URL 어떤 동작이든 폰 화면의 큐브 한 번의 탭으로 즉시 실행하세요.
            하드웨어 비용 0원, 한국어 1차 출시, 무료 100% 기능.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            <a href="/#download" className="btn btn-primary">PC 앱 다운로드</a>
            <a href="/#download" className="btn btn-secondary">모바일 앱 설치</a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="section" style={{ background: "var(--surface-2)", paddingTop: 64, paddingBottom: 64 }}>
        <div className="container">
          <div className="eyebrow">PROBLEM · 해결하는 문제</div>
          <h2 className="section-title" style={{ marginTop: 12, marginBottom: 24 }}>
            Stream Deck은 비싸고, 자주 쓰는 단축키는 외우기 어렵습니다.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--ink-3)", maxWidth: 720 }}>
            물리 컨트롤러는 ₩140,000~₩340,000, 키보드 단축키는 매번 외워야 하고,
            여러 모니터·도구를 오가는 동안 클릭 한 번에 모든 게 해결되는 도구가 없습니다.
            큐브 리스트는 이미 가지고 있는 안 쓰는 폰을 그 컨트롤러로 만듭니다.
          </p>
        </div>
      </section>

      {/* 3-tier system */}
      <SystemTiers t={t} />

      {/* How it works */}
      <section className="section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">HOW IT WORKS · 작동 원리</div>
            <h2 className="section-title">5분이면 첫 큐브가 작동합니다</h2>
          </div>
          <div className="programs-grid">
            <article className="program-card">
              <div className="program-card-head">
                <span className="program-card-tag">STEP 01</span>
              </div>
              <h3>PC 앱 다운로드</h3>
              <p>Windows에서 약 8MB짜리 .msi 파일을 받고 설치. 트레이에 R:S 아이콘이 표시됩니다.</p>
            </article>
            <article className="program-card">
              <div className="program-card-head">
                <span className="program-card-tag">STEP 02</span>
              </div>
              <h3>모바일 PWA 설치</h3>
              <p>폰 브라우저에서 rebirthstation.com 접속 → "홈 화면에 추가"로 일반 앱처럼 설치.</p>
            </article>
            <article className="program-card">
              <div className="program-card-head">
                <span className="program-card-tag">STEP 03</span>
              </div>
              <h3>QR 페어링</h3>
              <p>PC 트레이 우클릭 → "페어링 시작" → 폰 카메라로 QR 스캔. 60초 안에 자동 연결.</p>
            </article>
            <article className="program-card">
              <div className="program-card-head">
                <span className="program-card-tag">STEP 04</span>
              </div>
              <h3>기본 리스트 자동 생성</h3>
              <p>페어링 직후 계산기·메모장·즐겨찾기 사이트 3 큐브가 자동으로 생성됩니다.</p>
            </article>
            <article className="program-card is-featured">
              <div className="program-card-head">
                <span className="status status-RELEASED">5분</span>
                <span className="program-card-tag">STEP 05</span>
              </div>
              <h3>첫 큐브 탭</h3>
              <p>폰 화면의 큐브를 손가락으로 탭하면 PC에서 즉시 실행. 응답 5~20ms.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">FEATURES · 핵심 기능</div>
            <h2 className="section-title">큐브 리스트가 제공하는 것</h2>
          </div>
          <div className="programs-grid">
            <article className="program-card">
              <h3>매크로 · 단축키 · URL</h3>
              <p>한 번의 탭으로 어떤 동작이든 PC에서 실행. 키보드 단축키, 매크로 시퀀스, 웹 링크 모두 한 곳에서 관리.</p>
            </article>
            <article className="program-card">
              <h3>드래그·드롭 커스텀</h3>
              <p>큐브 배치를 자유롭게. 아이콘·라벨·색상·크기 모두 커스터마이즈. 코딩 없이 누구나.</p>
            </article>
            <article className="program-card">
              <h3>리스트 무제한 전환</h3>
              <p>상황별로 리스트 여러 개 — 작업·게임·트레이딩·디자인 등 한 폰이 여러 컨트롤러로.</p>
            </article>
            <article className="program-card">
              <h3>큐브팩 원클릭 설치</h3>
              <p>마켓플레이스에서 직군별 큐브팩 다운로드 → 한 번에 수십 개 큐브가 폰에 추가.</p>
            </article>
            <article className="program-card">
              <h3>LAN 직접 통신</h3>
              <p>같은 와이파이라면 LAN WebSocket으로 5~20ms 응답. 클라우드 폴백은 50~150ms.</p>
            </article>
            <article className="program-card">
              <h3>다중 디바이스 페어링</h3>
              <p>한 폰으로 여러 PC, 한 PC에 여러 폰 모두 지원. 같은 계정 + QR 2-factor 인증.</p>
            </article>
            <article className="program-card">
              <h3>export · 공유 · 판매</h3>
              <p>.cubeone·.cubelist·.cubepack 포맷으로 export, 마켓플레이스에서 배포·판매까지.</p>
            </article>
            <article className="program-card">
              <h3>오프라인 동작</h3>
              <p>큐브 데이터는 폰·PC에 저장. 클라우드 동기화는 선택. 인터넷 없어도 LAN으로 작동.</p>
            </article>
            <article className="program-card">
              <h3>다국어</h3>
              <p>한국어 1차, 영어 동시 출시. 일본어·중국어는 글로벌 진출 단계에 추가 예정.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Use cases with cube preview */}
      <section className="section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">USE CASES · 사용 사례</div>
            <h2 className="section-title">누가 어떻게 쓰나요?</h2>
            <p className="section-lede">직군별 예시 큐브 구성. 각 큐브는 직접 만들거나 마켓에서 큐브팩으로 한 번에 설치.</p>
          </div>
          <div className="market-grid">
            {[
              {
                tag: "개발자", title: "코드 환경 통합", color: "#1A237E",
                desc: "GitHub·Stack Overflow·VS Code 단축키·Vercel 배포를 한 그리드에. 컨텍스트 스위치 마찰 0.",
                cubes: [{l:"GitHub",i:"🐙"},{l:"Stack",i:"📚"},{l:"VS Code",i:"💻"},{l:"npm",i:"📦"},{l:"Vercel",i:"▲"},{l:"MDN",i:"📖"}]
              },
              {
                tag: "트레이더", title: "차트·뉴스·매수매도", color: "#FF9800",
                desc: "KRX·업비트·TradingView·CoinMarketCap을 한 폰 화면에. 차트 보면서 큐브 탭 한 번에 사이트 전환.",
                cubes: [{l:"TradingView",i:"📈"},{l:"업비트",i:"🟡"},{l:"빗썸",i:"🟠"},{l:"KRX",i:"🇰🇷"},{l:"Binance",i:"🔶"},{l:"Bloomberg",i:"📰"}]
              },
              {
                tag: "스트리머", title: "OBS 컨트롤러", color: "#9C27B0",
                desc: "씬 전환·녹화 시작·디스코드 음소거·트위치 채팅을 큐브로. Stream Deck 살 돈 아끼고 동일 기능.",
                cubes: [{l:"씬 1",i:"🎬"},{l:"녹화",i:"🔴"},{l:"마이크",i:"🎙"},{l:"Twitch",i:"💜"},{l:"Discord",i:"💬"},{l:"BRB",i:"⏸"}]
              },
              {
                tag: "디자이너", title: "단축키 마스터", color: "#E91E63",
                desc: "Figma·Photoshop·Premiere 단축키를 폰 큐브로. 단축키 외우지 않아도 손가락 위치만 기억.",
                cubes: [{l:"Figma",i:"🎨"},{l:"Frame",i:"🖼"},{l:"컴포넌트",i:"🧩"},{l:"Dribbble",i:"🏀"},{l:"Coolors",i:"🌈"},{l:"Unsplash",i:"📷"}]
              },
              {
                tag: "재택근무", title: "회의 콘솔", color: "#795548",
                desc: "Zoom·Slack·Notion·Google Meet을 큐브로. 회의 시작·마이크·화면 공유 한 번에.",
                cubes: [{l:"Zoom",i:"📹"},{l:"Slack",i:"💬"},{l:"Notion",i:"📝"},{l:"Meet",i:"📺"},{l:"캘린더",i:"📅"},{l:"Gmail",i:"✉️"}]
              },
              {
                tag: "일반 가정", title: "거실 디스플레이", color: "#03A9F4",
                desc: "거치된 폰에 시계·날씨·미세먼지·뉴스 큐브. 향후 스마트홈 컨트롤(미러 디스플레이) 출시 예정.",
                cubes: [{l:"시계",i:"🕒"},{l:"날씨",i:"☀️"},{l:"미세먼지",i:"🌫"},{l:"뉴스",i:"📰"},{l:"캘린더",i:"📅"},{l:"음악",i:"🎵"}]
              },
            ].map((uc, i) => (
              <div key={i} className="market-card">
                <div className="market-cover" style={{ "--pack-color": uc.color }}>
                  {uc.cubes.map((c, j) => (
                    <div key={j} className="pack-cube" title={c.l}>
                      <div className="pack-cube-icon">{c.i}</div>
                      <div className="pack-cube-label">{c.l}</div>
                    </div>
                  ))}
                </div>
                <div className="market-body">
                  <span className="market-cat">{uc.tag}</span>
                  <div className="market-title">{uc.title}</div>
                  <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "8px 0 0", lineHeight: 1.5 }}>{uc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech / Security */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">TECH · 기술 스택</div>
            <h2 className="section-title">안심하고 쓸 수 있는 이유</h2>
          </div>
          <div className="programs-grid">
            <article className="program-card">
              <h3>키 입력 감시 0</h3>
              <p>PC 앱는 키 입력을 <strong>보내기만</strong> 합니다. 받지 않습니다. 키로거처럼 동작하지 않아요.</p>
            </article>
            <article className="program-card">
              <h3>매크로 권한 3-tier</h3>
              <p>기본 허용 / 1회 동의 / 영구 명시 토글. 셸 명령·레지스트리 등 위험 액션은 기본 비활성.</p>
            </article>
            <article className="program-card">
              <h3>페어링 2-factor</h3>
              <p>Supabase 계정 인증 + QR 스캔 + 60초 TTL. 같은 와이파이에 있어도 인증 없이는 접근 불가.</p>
            </article>
            <article className="program-card">
              <h3>HMAC + Origin 검증</h3>
              <p>모든 WebSocket 메시지에 HMAC-SHA256 서명. DNS Rebinding 공격 방어. 시크릿은 OS Keychain 위임.</p>
            </article>
            <article className="program-card">
              <h3>데이터는 내 기기</h3>
              <p>큐브·리스트 데이터는 폰·PC에 저장. 클라우드 동기화는 선택. 매크로 셸 명령은 클라우드 전송 X.</p>
            </article>
            <article className="program-card">
              <h3>Tauri · React 오픈 스택</h3>
              <p>PC 앱는 Rust + Tauri. 모바일은 React PWA. 보안 모델은 검증 가능한 표준 기술로 구현.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">COMPARISON · 비교</div>
            <h2 className="section-title">Stream Deck과 뭐가 다른가?</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--line)", textAlign: "left" }}>
                  <th style={{ padding: "16px 12px", fontWeight: 600 }}>항목</th>
                  <th style={{ padding: "16px 12px", fontWeight: 600 }}>Stream Deck MK.2</th>
                  <th style={{ padding: "16px 12px", fontWeight: 600, color: "var(--accent)" }}>큐브 리스트</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["가격", "₩220,000", "₩0 (안 쓰는 폰 사용)"],
                  ["버튼 수", "15개", "무제한 (탭 전환)"],
                  ["한국어", "영문 위주", "한국어 1차 우선"],
                  ["다중 디바이스", "본체 추가 구매", "폰 여러 대 페어링"],
                  ["휴대성", "본체 들고 다님", "여행 핸드폰 모드"],
                  ["응답 속도", "USB 직결", "LAN 5~20ms / 폴백 50~150ms"],
                  ["커뮤니티 마켓", "Elgato Marketplace", "Rebirth Marketplace + UGC"],
                ].map(([a, b, c], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 12px", color: "var(--ink-3)" }}>{a}</td>
                    <td style={{ padding: "14px 12px", color: "var(--ink-3)" }}>{b}</td>
                    <td style={{ padding: "14px 12px", fontWeight: 500 }}>{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">PRICING · 가격</div>
            <h2 className="section-title">무료 100% + 광고 제거 후원</h2>
            <p className="section-lede">모든 기능을 무료로 사용. 광고 1개 차이만. Pro는 후원 톤.</p>
          </div>
          <div className="programs-grid">
            <article className="program-card">
              <div className="program-card-head"><span className="status status-RELEASED">FREE</span></div>
              <h3>무료</h3>
              <div className="en">All features included</div>
              <p>큐브·리스트·큐브팩 무제한. 다중 디바이스 페어링. 마켓 다운로드·배포. 광고 배너 하단 1개.</p>
            </article>
            <article className="program-card is-featured">
              <div className="program-card-head"><span className="program-card-tag">Pro 후원</span></div>
              <h3>Pro</h3>
              <div className="en">광고 제거만</div>
              <p>기능 차이 0. 광고만 제거됩니다. Pro 출시는 시스템 안정화 후(Stage 4) 진행됩니다.</p>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: "var(--surface-2)" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">지금 시작하세요</h2>
          <p className="section-lede" style={{ margin: "0 auto 28px", maxWidth: 560 }}>
            5분이면 충분합니다. PC 앱 설치 → 모바일 앱 → 페어링 → 첫 큐브.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/#download" className="btn btn-primary">PC 앱 다운로드</a>
            <a href="/#download" className="btn btn-secondary">모바일 앱 설치</a>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
 * /marketplace  — 마켓플레이스 메인
 * ============================================================ */
function MarketplacePage({ t }) {
  return (
    <>
      <section className="section" style={{ paddingTop: 120, paddingBottom: 48 }}>
        <div className="container">
          <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "마켓플레이스" }]} />
          <div className="eyebrow">MARKETPLACE · 마켓플레이스</div>
          <h1 className="section-title" style={{ fontSize: "clamp(36px, 5vw, 56px)", marginBottom: 16 }}>
            크리에이터가 만든 큐브,<br/>한 번의 클릭으로 내 폰에
          </h1>
          <p className="section-lede" style={{ maxWidth: 720 }}>
            큐브 리스트 마켓에서 검증된 큐브·리스트·큐브팩을 다운로드하거나,
            내가 만든 것을 배포·공유·판매할 수 있습니다.
            플러그인 마켓은 Stage 2 진입 시 추가 공개됩니다.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="programs-grid">
            <a href="/marketplace/cubelist/" className="program-card-link-wrap">
              <article className="program-card is-featured">
                <div className="program-card-head">
                  <span className="status status-RELEASED">출시</span>
                  <span className="program-card-tag">Cube · List · Pack</span>
                </div>
                <h3>큐브 리스트 마켓</h3>
                <div className="en">Cube List Market</div>
                <p>.cubeone · .cubelist · .cubepack 카탈로그. 전체 / 큐브 / 리스트 / 팩 4 탭으로 탐색 가능.</p>
                <div className="program-card-cta"><span className="program-card-link">마켓 둘러보기 →</span></div>
              </article>
            </a>

            <article className="program-card">
              <div className="program-card-head">
                <span className="status status-IN_DEV">개발 중</span>
                <span className="program-card-tag">Plugins</span>
              </div>
              <h3>플러그인 마켓</h3>
              <div className="en">Plugin Market</div>
              <p>큐브 리스트를 확장하는 플러그인. 외부 서비스 연동·고급 매크로·API 후크. Stage 2 출시 예정.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Featured packs preview with cube grid */}
      <section className="section" style={{ background: "var(--surface-2)" }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">FEATURED · 추천 큐브팩</div>
            <h2 className="section-title">직군별 큐레이션 미리보기</h2>
            <p className="section-lede">검증된 크리에이터의 큐브팩을 설치하면 즉시 전문 컨트롤러로. 각 팩에 어떤 큐브가 들어있는지 미리 보세요.</p>
          </div>
          <div className="market-grid">
            {t.market.packs.slice(0, 6).map((p, i) => {
              const totalNum = parseInt(p.count, 10) || 0;
              const previewCount = (p.cubes || []).length;
              const remaining = Math.max(0, totalNum - previewCount);
              return (
                <a key={i} href="/marketplace/cubelist/" className="market-card-link">
                  <div className="market-card">
                    <div className="market-cover" style={{ "--pack-color": p.color || "#1A237E" }}>
                      {(p.cubes || []).map((cube, j) => (
                        <div key={j} className="pack-cube" title={cube.label}>
                          <div className="pack-cube-icon">{cube.icon}</div>
                          <div className="pack-cube-label">{cube.label}</div>
                        </div>
                      ))}
                      {remaining > 0 && (
                        <div className="pack-cube pack-cube-more">
                          <div className="pack-cube-icon">+{remaining}</div>
                          <div className="pack-cube-label">더보기</div>
                        </div>
                      )}
                    </div>
                    <div className="market-body">
                      <span className="market-cat">{p.cat}</span>
                      <div className="market-title">{p.title}</div>
                      <div className="market-author">{p.author}</div>
                      <div className="market-meta">
                        <span>{p.count}</span>
                        <span style={{ fontWeight: p.price === "FREE" ? 600 : 500, color: p.price === "FREE" ? "var(--accent)" : "var(--ink)" }}>{p.price}</span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <a href="/marketplace/cubelist/" className="btn btn-primary">전체 카탈로그 보기</a>
          </div>
        </div>
      </section>

      {/* For creators */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">CREATORS · 크리에이터</div>
            <h2 className="section-title">큐브팩 만들기 · 배포 · 판매</h2>
          </div>
          <div className="programs-grid">
            <article className="program-card">
              <div className="program-card-head"><span className="program-card-tag">STEP 01</span></div>
              <h3>큐브팩 제작</h3>
              <p>큐브 리스트 앱에서 큐브·리스트를 만들고 .cubepack으로 export. 코딩 없이 누구나.</p>
            </article>
            <article className="program-card">
              <div className="program-card-head"><span className="program-card-tag">STEP 02</span></div>
              <h3>심사 등록</h3>
              <p>마켓플레이스에 등록 → 큐레이션 팀이 보안·품질 검토. 1~3 영업일.</p>
            </article>
            <article className="program-card">
              <div className="program-card-head"><span className="program-card-tag">STEP 03</span></div>
              <h3>수익 정산</h3>
              <p>무료 큐브 0% 수수료. 유료 큐브 70:30 (개발자 70). 첫 1년 인디 85:15 할인.</p>
            </article>
          </div>
          <div style={{ marginTop: 24, padding: 20, background: "var(--surface-2)", borderRadius: "var(--r-4)", fontSize: 13, color: "var(--muted)" }}>
            ※ 크리에이터 등록은 Stage 2 진입 시점에 정식 오픈 예정. 지금은 알림 신청만 가능.
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
 * /marketplace/cubelist  — 큐브 리스트 마켓 (4 탭)
 * ============================================================ */
function MarketplaceCubeListPage({ t }) {
  const [tab, setTab] = React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "all";
  });
  const [sort, setSort] = React.useState("popular");
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");

  const tabs = [
    { id: "all", label: "전체", ext: "", count: 0 },
    { id: "cube", label: "큐브", ext: ".cubeone", count: 0 },
    { id: "list", label: "큐브 리스트", ext: ".cubelist", count: 0 },
    { id: "pack", label: "큐브 팩", ext: ".cubepack", count: 0 },
  ];

  // Demo data — 추후 Supabase 연동. cubes 미리보기 데이터 포함
  const items = [
    { type: "pack", cat: "Trading", title: "TradingView Pro Deck", author: "@tradehouse", price: "FREE", count: "32 큐브", rating: 4.8, downloads: "12k", color: "#FF9800",
      cubes: [{label:"TradingView",icon:"📈"},{label:"업비트",icon:"🟡"},{label:"빗썸",icon:"🟠"},{label:"Binance",icon:"🔶"},{label:"KRX",icon:"🇰🇷"},{label:"Coinbase",icon:"🔵"}] },
    { type: "pack", cat: "Streaming", title: "OBS 스트리머 팩", author: "Rebirth Studio", price: "₩9,900", count: "18 큐브", rating: 4.9, downloads: "8.2k", color: "#9C27B0",
      cubes: [{label:"씬 1",icon:"🎬"},{label:"녹화",icon:"🔴"},{label:"마이크",icon:"🎙"},{label:"Twitch",icon:"💜"},{label:"Discord",icon:"💬"},{label:"BRB",icon:"⏸"}] },
    { type: "pack", cat: "Design", title: "Figma 단축키 마스터", author: "uxlab.kr", price: "₩4,900", count: "24 큐브", rating: 4.7, downloads: "6.1k", color: "#E91E63",
      cubes: [{label:"Figma",icon:"🎨"},{label:"Frame",icon:"🖼"},{label:"Auto",icon:"📐"},{label:"컴포넌트",icon:"🧩"},{label:"Dribbble",icon:"🏀"},{label:"Coolors",icon:"🎨"}] },
    { type: "list", cat: "Productivity", title: "Notion · Slack 콤보", author: "Rebirth Studio", price: "FREE", count: "16 큐브", rating: 4.6, downloads: "15k", color: "#795548",
      cubes: [{label:"Notion",icon:"📝"},{label:"Slack",icon:"💬"},{label:"캘린더",icon:"📅"},{label:"검색",icon:"🔍"},{label:"Gmail",icon:"✉️"},{label:"Meet",icon:"📹"}] },
    { type: "list", cat: "Developer", title: "VS Code · Git 런처", author: "codepocket", price: "₩3,900", count: "28 큐브", rating: 4.8, downloads: "4.3k", color: "#1A237E",
      cubes: [{label:"VS Code",icon:"💻"},{label:"GitHub",icon:"🐙"},{label:"PR",icon:"🔀"},{label:"Stack",icon:"📚"},{label:"npm",icon:"📦"},{label:"Vercel",icon:"▲"}] },
    { type: "list", cat: "Smart Home", title: "스마트홈 패널", author: "홈오토", price: "FREE", count: "12 큐브", rating: 4.5, downloads: "9.8k", color: "#FFC107",
      cubes: [{label:"거실",icon:"💡"},{label:"침실",icon:"🛏"},{label:"에어컨",icon:"❄️"},{label:"TV",icon:"📺"},{label:"도어락",icon:"🔒"},{label:"CCTV",icon:"📹"}] },
    { type: "cube", cat: "AI Tools", title: "ChatGPT 빠른 실행", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.9, downloads: "32k", color: "#10A37F",
      cubes: [{label:"ChatGPT",icon:"🤖"}] },
    { type: "cube", cat: "Korean Life", title: "네이버 검색", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.7, downloads: "28k", color: "#03C75A",
      cubes: [{label:"네이버",icon:"N"}] },
    { type: "cube", cat: "Korean Life", title: "토스 빠른 송금", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.8, downloads: "21k", color: "#0064FF",
      cubes: [{label:"토스",icon:"💸"}] },
    { type: "cube", cat: "System", title: "스크린샷 (Win+Shift+S)", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.6, downloads: "18k", color: "#607D8B",
      cubes: [{label:"스크린샷",icon:"📸"}] },
    { type: "pack", cat: "Korean Life", title: "한국 생활 스타터", author: "Rebirth Studio", price: "FREE", count: "10 큐브", rating: 4.8, downloads: "11k", color: "#4CAF50",
      cubes: [{label:"네이버",icon:"N"},{label:"카카오맵",icon:"🗺"},{label:"배민",icon:"🛵"},{label:"쿠팡",icon:"📦"},{label:"토스",icon:"💸"},{label:"정부24",icon:"🏛"}] },
    { type: "list", cat: "Trading", title: "한국 코인 거래소", author: "@cryptoseoul", price: "FREE", count: "8 큐브", rating: 4.7, downloads: "7.4k", color: "#FF6B35",
      cubes: [{label:"업비트",icon:"🟡"},{label:"빗썸",icon:"🟠"},{label:"코빗",icon:"🔵"},{label:"Korbit",icon:"⚪"}] },

    // ─── 시드 카탈로그 확장 (사이클 #12: +18, 총 30) ───
    { type: "pack", cat: "AI Tools", title: "AI 트레이너 풀팩", author: "Rebirth Studio", price: "FREE", count: "14 큐브", rating: 4.9, downloads: "19k", color: "#10A37F",
      cubes: [{label:"ChatGPT",icon:"🤖"},{label:"Claude",icon:"🧡"},{label:"Gemini",icon:"✨"},{label:"Perplexity",icon:"🔎"},{label:"Midjourney",icon:"🎨"},{label:"Runway",icon:"🎬"}] },
    { type: "pack", cat: "Education", title: "온라인 강의 스튜디오", author: "@edutech", price: "₩4,900", count: "16 큐브", rating: 4.6, downloads: "5.3k", color: "#3949AB",
      cubes: [{label:"OBS",icon:"🎥"},{label:"자막",icon:"💬"},{label:"노트",icon:"📝"},{label:"슬라이드",icon:"📊"},{label:"음소거",icon:"🔇"},{label:"녹화",icon:"🔴"}] },
    { type: "pack", cat: "Sleep", title: "Sleep Corner", author: "Rebirth Studio", price: "FREE", count: "12 큐브", rating: 4.8, downloads: "13k", color: "#3F51B5",
      cubes: [{label:"비 소리",icon:"🌧"},{label:"파도",icon:"🌊"},{label:"카페",icon:"☕"},{label:"팬",icon:"🌀"},{label:"자장가",icon:"🎶"},{label:"타이머",icon:"⏱"}] },
    { type: "pack", cat: "Korean Life", title: "한국 직장인 콘솔", author: "@korea-office", price: "₩2,900", count: "20 큐브", rating: 4.7, downloads: "8.6k", color: "#5D4037",
      cubes: [{label:"한컴",icon:"📄"},{label:"엑셀",icon:"📊"},{label:"슬랙",icon:"💬"},{label:"잔디",icon:"🟢"},{label:"카카오워크",icon:"💛"},{label:"네이버웍스",icon:"🔵"}] },
    { type: "pack", cat: "Gaming", title: "스트리머 빠른 액세스", author: "@gamer-kr", price: "FREE", count: "16 큐브", rating: 4.7, downloads: "10k", color: "#673AB7",
      cubes: [{label:"Steam",icon:"🎮"},{label:"Discord",icon:"💬"},{label:"Twitch",icon:"💜"},{label:"녹화",icon:"🔴"},{label:"스크린샷",icon:"📸"},{label:"마이크",icon:"🎙"}] },
    { type: "list", cat: "Developer", title: "Docker · Kubernetes 콘솔", author: "@devops-seoul", price: "₩3,900", count: "18 큐브", rating: 4.8, downloads: "3.9k", color: "#0277BD",
      cubes: [{label:"Docker",icon:"🐳"},{label:"k8s",icon:"☸️"},{label:"Helm",icon:"⛵"},{label:"Vercel",icon:"▲"},{label:"GCP",icon:"☁️"},{label:"AWS",icon:"🟧"}] },
    { type: "list", cat: "Music", title: "Spotify · YouTube Music 콤보", author: "Rebirth Studio", price: "FREE", count: "14 큐브", rating: 4.6, downloads: "16k", color: "#1DB954",
      cubes: [{label:"재생",icon:"▶️"},{label:"다음",icon:"⏭"},{label:"이전",icon:"⏮"},{label:"볼륨+",icon:"🔊"},{label:"볼륨-",icon:"🔉"},{label:"좋아요",icon:"❤️"}] },
    { type: "list", cat: "Korean Life", title: "한국 부동산 빠른 검색", author: "@realestate-kr", price: "FREE", count: "12 큐브", rating: 4.5, downloads: "6.7k", color: "#FF7043",
      cubes: [{label:"네이버부동산",icon:"🏠"},{label:"직방",icon:"🟢"},{label:"다방",icon:"🟡"},{label:"호갱노노",icon:"🔍"},{label:"KB부동산",icon:"💛"},{label:"공시가격",icon:"📋"}] },
    { type: "list", cat: "Productivity", title: "Pomodoro 25-5", author: "Rebirth Studio", price: "FREE", count: "10 큐브", rating: 4.7, downloads: "12k", color: "#D32F2F",
      cubes: [{label:"25분",icon:"⏱"},{label:"5분 휴식",icon:"☕"},{label:"15분 휴식",icon:"🧘"},{label:"음악",icon:"🎵"},{label:"통계",icon:"📊"},{label:"리셋",icon:"🔄"}] },
    { type: "list", cat: "Streaming", title: "트위치 채팅 봇 큐브", author: "@streamer-kr", price: "₩1,900", count: "8 큐브", rating: 4.6, downloads: "4.1k", color: "#9146FF",
      cubes: [{label:"인사",icon:"👋"},{label:"감사",icon:"🙏"},{label:"구독축하",icon:"🎉"},{label:"규칙",icon:"📜"},{label:"링크",icon:"🔗"},{label:"이벤트",icon:"⭐"}] },
    { type: "cube", cat: "Korean Life", title: "다음 검색", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.6, downloads: "14k", color: "#0080FF",
      cubes: [{label:"다음",icon:"D"}] },
    { type: "cube", cat: "Korean Life", title: "쿠팡 빠른 실행", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.7, downloads: "23k", color: "#F1414C",
      cubes: [{label:"쿠팡",icon:"📦"}] },
    { type: "cube", cat: "Korean Life", title: "배민 빠른 실행", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.8, downloads: "26k", color: "#2AC1BC",
      cubes: [{label:"배민",icon:"🛵"}] },
    { type: "cube", cat: "Korean Life", title: "정부24", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.5, downloads: "8.9k", color: "#1F4E8C",
      cubes: [{label:"정부24",icon:"🏛"}] },
    { type: "cube", cat: "AI Tools", title: "Claude AI", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.9, downloads: "17k", color: "#D97757",
      cubes: [{label:"Claude",icon:"🧡"}] },
    { type: "cube", cat: "AI Tools", title: "Gemini", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.7, downloads: "13k", color: "#4285F4",
      cubes: [{label:"Gemini",icon:"✨"}] },
    { type: "cube", cat: "System", title: "PC 잠금 (Win+L)", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.6, downloads: "11k", color: "#455A64",
      cubes: [{label:"잠금",icon:"🔒"}] },
    { type: "cube", cat: "Music", title: "Spotify 재생/정지", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.6, downloads: "20k", color: "#1DB954",
      cubes: [{label:"재생/정지",icon:"⏯"}] },

    // ─── 시드 카탈로그 확장 (사이클 #13: +30, 총 60) ───
    // cube (10)
    { type: "cube", cat: "Productivity", title: "Notion 빠른 실행", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.7, downloads: "22k", color: "#000000",
      cubes: [{label:"Notion",icon:"📝"}] },
    { type: "cube", cat: "Design", title: "Figma 빠른 실행", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.7, downloads: "15k", color: "#F24E1E",
      cubes: [{label:"Figma",icon:"🎨"}] },
    { type: "cube", cat: "Productivity", title: "Discord", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.6, downloads: "18k", color: "#5865F2",
      cubes: [{label:"Discord",icon:"💬"}] },
    { type: "cube", cat: "Productivity", title: "Slack", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.5, downloads: "14k", color: "#4A154B",
      cubes: [{label:"Slack",icon:"💬"}] },
    { type: "cube", cat: "Music", title: "YouTube Music", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.6, downloads: "19k", color: "#FF0000",
      cubes: [{label:"YouTube",icon:"▶️"}] },
    { type: "cube", cat: "Korean Life", title: "네이버 지도", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.7, downloads: "16k", color: "#03C75A",
      cubes: [{label:"지도",icon:"🗺"}] },
    { type: "cube", cat: "Korean Life", title: "카카오맵", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.6, downloads: "12k", color: "#FAE100",
      cubes: [{label:"카카오맵",icon:"📍"}] },
    { type: "cube", cat: "Korean Life", title: "야놀자 빠른 실행", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.5, downloads: "8.4k", color: "#FF6F0F",
      cubes: [{label:"야놀자",icon:"🏨"}] },
    { type: "cube", cat: "System", title: "모니터 끄기", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.6, downloads: "7.8k", color: "#37474F",
      cubes: [{label:"모니터OFF",icon:"⬛"}] },
    { type: "cube", cat: "Korean Life", title: "한컴오피스", author: "Rebirth Studio", price: "FREE", count: "1 큐브", rating: 4.4, downloads: "5.9k", color: "#0F77E0",
      cubes: [{label:"한컴",icon:"📄"}] },

    // list (10)
    { type: "list", cat: "Design", title: "디자이너 데일리", author: "@design-seoul", price: "₩2,900", count: "12 큐브", rating: 4.7, downloads: "6.4k", color: "#E91E63",
      cubes: [{label:"Figma",icon:"🎨"},{label:"PS",icon:"🖼"},{label:"Illustrator",icon:"✏️"},{label:"Premiere",icon:"🎬"},{label:"Coolors",icon:"🌈"},{label:"Unsplash",icon:"📷"}] },
    { type: "list", cat: "Writing", title: "작가 워크스페이스", author: "@writer-kr", price: "₩1,900", count: "14 큐브", rating: 4.6, downloads: "3.2k", color: "#6D4C41",
      cubes: [{label:"Scrivener",icon:"📔"},{label:"Notion",icon:"📝"},{label:"맞춤법",icon:"✍️"},{label:"사전",icon:"📖"},{label:"Grammarly",icon:"🟢"},{label:"네이버사전",icon:"🟡"}] },
    { type: "list", cat: "Business", title: "카페 사장 콘솔", author: "@cafe-owner", price: "FREE", count: "12 큐브", rating: 4.5, downloads: "4.7k", color: "#8D6E63",
      cubes: [{label:"POS",icon:"🧾"},{label:"재고",icon:"📦"},{label:"매출",icon:"💰"},{label:"SNS",icon:"📱"},{label:"메뉴",icon:"☕"},{label:"예약",icon:"📅"}] },
    { type: "list", cat: "Education", title: "학생 공부 큐브", author: "@study-kr", price: "FREE", count: "16 큐브", rating: 4.8, downloads: "14k", color: "#1565C0",
      cubes: [{label:"Notion",icon:"📝"},{label:"강의",icon:"📚"},{label:"뽀모도로",icon:"⏱"},{label:"Anki",icon:"🧠"},{label:"QuickQ",icon:"❓"},{label:"칠판",icon:"📋"}] },
    { type: "list", cat: "Business", title: "회계사 콘솔", author: "@cpa-seoul", price: "₩3,900", count: "12 큐브", rating: 4.7, downloads: "2.8k", color: "#37474F",
      cubes: [{label:"엑셀",icon:"📊"},{label:"홈택스",icon:"🏛"},{label:"국세청",icon:"📋"},{label:"KOSIS",icon:"📈"},{label:"캐셔",icon:"💼"},{label:"전자세금",icon:"🧾"}] },
    { type: "list", cat: "Healthcare", title: "의료진 데일리", author: "@med-kr", price: "₩4,900", count: "10 큐브", rating: 4.8, downloads: "1.9k", color: "#00897B",
      cubes: [{label:"EMR",icon:"🏥"},{label:"약품DB",icon:"💊"},{label:"논문",icon:"📑"},{label:"차트",icon:"📋"},{label:"PubMed",icon:"🔬"},{label:"DailyMed",icon:"💉"}] },
    { type: "list", cat: "Legal", title: "변호사 콘솔", author: "@law-kr", price: "₩3,900", count: "8 큐브", rating: 4.6, downloads: "1.4k", color: "#3E2723",
      cubes: [{label:"법률신문",icon:"📰"},{label:"국가법령",icon:"⚖️"},{label:"로앤비",icon:"📚"},{label:"케이스서치",icon:"🔍"}] },
    { type: "list", cat: "Real Estate", title: "부동산 중개사 큐브", author: "@realtor-kr", price: "₩2,900", count: "10 큐브", rating: 4.5, downloads: "3.6k", color: "#FF6F00",
      cubes: [{label:"네이버부동산",icon:"🏠"},{label:"KB부동산",icon:"💛"},{label:"등기",icon:"📋"},{label:"세무",icon:"🧾"},{label:"실거래가",icon:"📊"},{label:"지도",icon:"🗺"}] },
    { type: "list", cat: "Streaming", title: "라이브 커머스 큐브", author: "@livecom-kr", price: "₩3,900", count: "12 큐브", rating: 4.7, downloads: "5.1k", color: "#EC407A",
      cubes: [{label:"스마트스토어",icon:"🛒"},{label:"쇼피",icon:"🛍"},{label:"라이브",icon:"🔴"},{label:"결제",icon:"💳"},{label:"채팅",icon:"💬"},{label:"통계",icon:"📈"}] },
    { type: "list", cat: "Sports", title: "헬스 트레이너 콘솔", author: "@fit-kr", price: "FREE", count: "8 큐브", rating: 4.6, downloads: "4.2k", color: "#43A047",
      cubes: [{label:"타이머",icon:"⏱"},{label:"캘린더",icon:"📅"},{label:"식단",icon:"🥗"},{label:"BPM",icon:"❤️"},{label:"BGM",icon:"🎵"},{label:"통계",icon:"📊"}] },

    // pack (10)
    { type: "pack", cat: "Business", title: "한국 자영업 마스터", author: "Rebirth Studio", price: "₩9,900", count: "32 큐브", rating: 4.8, downloads: "3.4k", color: "#5D4037",
      cubes: [{label:"POS",icon:"🧾"},{label:"CRM",icon:"👥"},{label:"SNS",icon:"📱"},{label:"세무",icon:"💼"},{label:"재고",icon:"📦"},{label:"매출",icon:"💰"}] },
    { type: "pack", cat: "Trading", title: "글로벌 트레이더 풀팩", author: "@global-trader", price: "₩7,900", count: "40 큐브", rating: 4.9, downloads: "5.8k", color: "#FF9800",
      cubes: [{label:"TradingView",icon:"📈"},{label:"Binance",icon:"🔶"},{label:"Coinbase",icon:"🔵"},{label:"Robinhood",icon:"🪶"},{label:"Bloomberg",icon:"📰"},{label:"WSJ",icon:"📑"}] },
    { type: "pack", cat: "Design", title: "AI 아티스트 풀팩", author: "@ai-art-kr", price: "₩5,900", count: "28 큐브", rating: 4.8, downloads: "7.6k", color: "#AB47BC",
      cubes: [{label:"Midjourney",icon:"🎨"},{label:"Runway",icon:"🎬"},{label:"SD",icon:"🖼"},{label:"DALL-E",icon:"🧠"},{label:"Krea",icon:"✨"},{label:"Leonardo",icon:"🦁"}] },
    { type: "pack", cat: "Design", title: "영상 편집자 콘솔", author: "@editor-kr", price: "₩6,900", count: "24 큐브", rating: 4.7, downloads: "4.1k", color: "#1A237E",
      cubes: [{label:"Premiere",icon:"🎬"},{label:"DaVinci",icon:"🎞"},{label:"After FX",icon:"✨"},{label:"자막",icon:"💬"},{label:"오디오",icon:"🎚"},{label:"색보정",icon:"🎨"}] },
    { type: "pack", cat: "Music", title: "K-Pop 팬 큐브", author: "Rebirth Studio", price: "FREE", count: "20 큐브", rating: 4.9, downloads: "24k", color: "#FF4081",
      cubes: [{label:"Spotify",icon:"🎵"},{label:"YouTube",icon:"▶️"},{label:"인스타",icon:"📷"},{label:"X",icon:"𝕏"},{label:"트위치",icon:"💜"},{label:"위버스",icon:"💜"}] },
    { type: "pack", cat: "Lifestyle", title: "부모님 콘솔", author: "Rebirth Studio", price: "FREE", count: "14 큐브", rating: 4.7, downloads: "9.3k", color: "#FFB300",
      cubes: [{label:"카카오톡",icon:"💛"},{label:"뉴스",icon:"📰"},{label:"날씨",icon:"☀️"},{label:"은행",icon:"🏦"},{label:"약속",icon:"📅"},{label:"가족사진",icon:"📷"}] },
    { type: "pack", cat: "Lifestyle", title: "1인 가구 콘솔", author: "Rebirth Studio", price: "FREE", count: "16 큐브", rating: 4.8, downloads: "18k", color: "#26A69A",
      cubes: [{label:"배민",icon:"🛵"},{label:"쿠팡",icon:"📦"},{label:"이마트",icon:"🛒"},{label:"로켓",icon:"🚀"},{label:"세탁",icon:"🧺"},{label:"가스",icon:"🔥"}] },
    { type: "pack", cat: "Lifestyle", title: "신혼부부 콘솔", author: "Rebirth Studio", price: "FREE", count: "14 큐브", rating: 4.7, downloads: "6.2k", color: "#7E57C2",
      cubes: [{label:"가계부",icon:"💰"},{label:"식단",icon:"🥗"},{label:"여행",icon:"✈️"},{label:"캘린더",icon:"📅"},{label:"부동산",icon:"🏠"},{label:"보험",icon:"🛡"}] },
    { type: "pack", cat: "Lifestyle", title: "K-드라마 팬 큐브", author: "Rebirth Studio", price: "FREE", count: "18 큐브", rating: 4.8, downloads: "13k", color: "#E91E63",
      cubes: [{label:"넷플릭스",icon:"🅽"},{label:"왓챠",icon:"🟠"},{label:"티빙",icon:"🅣"},{label:"쿠팡플레이",icon:"📺"},{label:"디즈니+",icon:"⭐"},{label:"웨이브",icon:"🌊"}] },
    { type: "pack", cat: "Travel", title: "일본 여행자 콘솔", author: "@japan-travel", price: "₩1,900", count: "16 큐브", rating: 4.6, downloads: "4.8k", color: "#D32F2F",
      cubes: [{label:"구글번역",icon:"🈂️"},{label:"환율",icon:"💱"},{label:"지하철",icon:"🚇"},{label:"맛집",icon:"🍣"},{label:"호텔",icon:"🏨"},{label:"날씨",icon:"☀️"}] },
  ];

  tabs.forEach((tb) => {
    tb.count = tb.id === "all" ? items.length : items.filter((it) => it.type === tb.id).length;
  });

  // 카테고리 목록 (자동 추출 + 카운트)
  const categoryCounts = items.reduce((acc, it) => {
    acc[it.cat] = (acc[it.cat] || 0) + 1;
    return acc;
  }, {});
  const allCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]); // 카운트 내림차순

  let filtered = tab === "all" ? items : items.filter((it) => it.type === tab);
  if (category !== "all") {
    filtered = filtered.filter((it) => it.cat === category);
  }
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter((it) => (it.title + it.cat + it.author).toLowerCase().includes(q));
  }
  if (sort === "popular") filtered = [...filtered].sort((a, b) => parseFloat(b.downloads) - parseFloat(a.downloads));
  else if (sort === "rating") filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  else if (sort === "free") filtered = [...filtered].sort((a, b) => (a.price === "FREE" ? -1 : 1));

  return (
    <section className="section" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "마켓플레이스", href: "/marketplace/" }, { label: "큐브 리스트" }]} />

        <div className="eyebrow">CUBE LIST MARKET</div>
        <h1 className="section-title" style={{ fontSize: "clamp(32px, 4vw, 44px)", marginBottom: 12 }}>
          큐브 · 큐브 리스트 · 큐브 팩
        </h1>
        <p className="section-lede" style={{ maxWidth: 640, marginBottom: 24 }}>
          단일 큐브부터 플랫폼별 팩까지. 4개 탭으로 원하는 형태를 찾으세요.
        </p>

        <div style={{
          padding: "12px 16px",
          background: "var(--surface-sunken)",
          border: "1px dashed var(--line)",
          borderRadius: 8,
          fontSize: 13,
          color: "var(--ink-3)",
          marginBottom: 32,
          maxWidth: 640
        }} role="status">
          <strong style={{ color: "var(--ink)" }}>⚠ 예시 (데모 데이터)</strong>
          <span style={{ marginLeft: 8 }}>아래 카탈로그는 시각화용 데모입니다. 실제 큐브팩은 PC 앱·모바일 앱 베타 출시 이후 셀러 등록·검증을 거쳐 게시됩니다.</span>
        </div>

        {/* Search + Sort */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="search"
            aria-label="큐브 검색"
            placeholder="제목·카테고리·작성자 검색…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: "1 1 280px",
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-3)",
              background: "var(--surface)",
              fontSize: 14,
            }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="카테고리 필터"
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-3)",
              background: "var(--surface)",
              fontSize: 14,
              minWidth: 160,
            }}
          >
            <option value="all">전체 카테고리 ({items.length})</option>
            {allCategories.map(([cat, count]) => (
              <option key={cat} value={cat}>{cat} ({count})</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="정렬"
            style={{
              padding: "10px 14px",
              border: "1px solid var(--line)",
              borderRadius: "var(--r-3)",
              background: "var(--surface)",
              fontSize: 14,
            }}
          >
            <option value="popular">인기순</option>
            <option value="rating">평점순</option>
            <option value="free">무료 우선</option>
          </select>
        </div>

        {/* 정렬 칩 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }} aria-label="정렬">
          <span style={{ fontSize: 13, color: "var(--ink-3)", marginRight: 4 }}>정렬:</span>
          {[
            { v: "popular", label: "인기순" },
            { v: "rating", label: "평점순" },
            { v: "free", label: "무료 우선" },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setSort(opt.v)}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                border: "1px solid var(--line)",
                background: sort === opt.v ? "var(--ink)" : "var(--surface)",
                color: sort === opt.v ? "var(--surface)" : "var(--ink-3)",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500
              }}
            >{opt.label}</button>
          ))}
        </div>

        {/* 인기 카테고리 칩 — Top 5 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }} aria-label="인기 카테고리">
          <button
            type="button"
            onClick={() => setCategory("all")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: category === "all" ? "var(--ink)" : "var(--surface)",
              color: category === "all" ? "var(--surface)" : "var(--ink-3)",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 500
            }}
          >전체 ({items.length})</button>
          {allCategories.slice(0, 6).map(([cat, count]) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(category === cat ? "all" : cat)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid var(--line)",
                background: category === cat ? "var(--ink)" : "var(--surface)",
                color: category === cat ? "var(--surface)" : "var(--ink-3)",
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 500
              }}
            >{cat} ({count})</button>
          ))}
        </div>

        {category !== "all" && (
          <div style={{ marginBottom: 16, padding: "8px 14px", background: "var(--surface-sunken)", borderRadius: 8, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span>카테고리: <strong style={{ color: "var(--ink)" }}>{category}</strong></span>
            <button
              type="button"
              onClick={() => setCategory("all")}
              style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 13, padding: 0 }}
              aria-label="카테고리 필터 해제"
            >×</button>
          </div>
        )}

        {/* Tabs */}
        <div role="tablist" style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid var(--line)", overflowX: "auto" }}>
          {tabs.map((tb) => (
            <button
              key={tb.id}
              role="tab"
              aria-selected={tab === tb.id}
              onClick={() => setTab(tb.id)}
              style={{
                padding: "12px 16px",
                background: "none",
                border: "none",
                borderBottom: tab === tb.id ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === tb.id ? "var(--ink)" : "var(--muted)",
                fontWeight: tab === tb.id ? 600 : 400,
                cursor: "pointer",
                fontSize: 14,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {tb.label}
              {tb.ext && (
                <code style={{ fontSize: 11, color: tab === tb.id ? "var(--accent)" : "var(--muted)", background: "var(--surface-sunken)", padding: "1px 6px", borderRadius: 999 }}>
                  {tb.ext}
                </code>
              )}
              <span style={{ fontSize: 12, color: "var(--muted)" }}>({tb.count})</span>
            </button>
          ))}
        </div>

        {/* Items with cube preview */}
        <div className="market-grid">
          {filtered.map((it, i) => {
            const ext = it.type === "cube" ? ".cubeone" : it.type === "list" ? ".cubelist" : ".cubepack";
            const totalNum = parseInt(it.count, 10) || 0;
            const previewCount = (it.cubes || []).length;
            const remaining = Math.max(0, totalNum - previewCount);
            return (
              <div key={i} className="market-card" style={{ position: "relative" }}>
                <span
                  aria-label="데모 데이터"
                  title="실제 큐브팩 아님 — 시각화용 예시"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 5,
                    padding: "2px 8px",
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    pointerEvents: "none"
                  }}
                >DEMO</span>
                <div className="market-cover" style={{ "--pack-color": it.color || "#1A237E" }}>
                  {(it.cubes || []).map((cube, j) => (
                    <div key={j} className="pack-cube" title={cube.label}>
                      <div className="pack-cube-icon">{cube.icon}</div>
                      <div className="pack-cube-label">{cube.label}</div>
                    </div>
                  ))}
                  {remaining > 0 && (
                    <div className="pack-cube pack-cube-more">
                      <div className="pack-cube-icon">+{remaining}</div>
                      <div className="pack-cube-label">더보기</div>
                    </div>
                  )}
                </div>
                <div className="market-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span className="market-cat">{it.cat}</span>
                    <code style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{ext}</code>
                  </div>
                  <div className="market-title">{it.title}</div>
                  <div className="market-author">by {it.author}</div>
                  <div className="market-meta">
                    <span>{it.count} · ★ {it.rating}</span>
                    <span style={{ color: "var(--muted)" }}>↓ {it.downloads}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                    <span style={{ fontWeight: 600, color: it.price === "FREE" ? "var(--accent)" : "var(--ink)" }}>{it.price}</span>
                    <button
                      style={{
                        marginLeft: "auto",
                        padding: "6px 14px",
                        background: "var(--primary)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "var(--r-2)",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      설치
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>
            검색 결과가 없습니다.
          </div>
        )}

        {/* Footer note */}
        <div style={{ marginTop: 48, padding: 24, background: "var(--surface-2)", borderRadius: "var(--r-4)", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
          ※ 위 항목은 출시 시점 카탈로그 미리보기입니다. 실제 마켓 데이터는 Stage 2 진입 시 Supabase 연동으로 실시간 표시됩니다.
        </div>

        {/* Action cards at bottom */}
        <div style={{ marginTop: 64 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>큐브 만들고 공유하기</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
            큐브를 직접 만들거나, 기존 Stream Deck 플러그인을 변환하거나, 마켓에 등록·관리하세요.
          </p>
          <div className="programs-grid">
            <a href="/marketplace/cubelist/create-cube/" className="program-card-link-wrap">
              <article className="program-card">
                <div className="program-card-head">
                  <span className="program-card-tag">CREATE</span>
                  <code style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>.cubeone</code>
                </div>
                <h3>큐브 제작</h3>
                <div className="en">Create Cube</div>
                <p>링크·단축키·매크로 중 하나를 선택해서 큐브 1개 만들기. 아이콘·색상 자유 커스텀.</p>
                <div className="program-card-cta"><span className="program-card-link">시작하기 →</span></div>
              </article>
            </a>

            <a href="/marketplace/cubelist/create-list/" className="program-card-link-wrap">
              <article className="program-card">
                <div className="program-card-head">
                  <span className="program-card-tag">BUILD</span>
                  <code style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>.cubelist · .cubepack</code>
                </div>
                <h3>리스트·팩 제작</h3>
                <div className="en">Create List / Pack</div>
                <p>큐브를 묶어 리스트로. 24개 초과 시 자동 큐브 팩 변환. 드래그앤드롭으로 순서 자유 변경.</p>
                <div className="program-card-cta"><span className="program-card-link">묶기 →</span></div>
              </article>
            </a>

            <a href="/marketplace/cubelist/convert/" className="program-card-link-wrap">
              <article className="program-card">
                <div className="program-card-head">
                  <span className="program-card-tag">CONVERT</span>
                  <code style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>.streamDeckPlugin → .cubelist</code>
                </div>
                <h3>파일 변환</h3>
                <div className="en">Convert</div>
                <p>가진 Stream Deck 플러그인 파일을 드롭하면 큐브 리스트 포맷으로 자동 변환. 메타·이미지·다국어 100% 자동.</p>
                <div className="program-card-cta"><span className="program-card-link">변환 →</span></div>
              </article>
            </a>

            <a href="/marketplace/cubelist/manage/" className="program-card-link-wrap">
              <article className="program-card">
                <div className="program-card-head">
                  <span className="program-card-tag">MANAGE</span>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>Dashboard</span>
                </div>
                <h3>마켓 관리</h3>
                <div className="en">Manage</div>
                <p>내가 만든 큐브·리스트·팩의 등록·갱신·통계·수익 정산. 셀러 대시보드.</p>
                <div className="program-card-cta"><span className="program-card-link">관리 →</span></div>
              </article>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * /marketplace/cubelist/create-cube  — 큐브 제작
 * ============================================================ */
function CreateCubePage({ t }) {
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("");
  const [actionType, setActionType] = React.useState("link");
  const [payloadUrl, setPayloadUrl] = React.useState("");
  const [payloadKeys, setPayloadKeys] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [color, setColor] = React.useState("#1A237E");

  return (
    <section className="section" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "마켓플레이스", href: "/marketplace/" }, { label: "큐브 리스트", href: "/marketplace/cubelist/" }, { label: "큐브 에디터", href: "/editor/" }, { label: "큐브 제작" }]} />

        <div className="eyebrow">CREATE CUBE · 큐브 제작</div>
        <h1 className="section-title" style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 12 }}>
          나만의 큐브 만들기 <code style={{ fontSize: 14, color: "var(--accent)", background: "var(--surface-sunken)", padding: "2px 8px", borderRadius: 999 }}>.cubeone</code>
        </h1>
        <p className="section-lede" style={{ maxWidth: 640, marginBottom: 32 }}>
          링크 · 단축키 · 매크로 중 하나를 선택해서 큐브를 만드세요. 저장된 큐브는 큐브 리스트에 추가하거나 마켓플레이스에 등록할 수 있습니다.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 40, alignItems: "start" }}>
          {/* Form */}
          <div>
            <div className="form-section">
              <label className="form-label" htmlFor="cube-name">큐브 이름</label>
              <input id="cube-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: ChatGPT 빠른 실행" />
            </div>

            <div className="form-section">
              <label className="form-label" htmlFor="cube-icon">아이콘 URL (선택)</label>
              <input id="cube-icon" className="form-input" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="비워두면 favicon 자동 fetch" />
              <p className="form-hint">사이트 URL의 favicon을 자동으로 추출합니다.</p>
            </div>

            <div className="form-section">
              <label className="form-label">액션 타입</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { id: "link", label: "링크", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></svg>), desc: "웹사이트 열기" },
                  { id: "shortcut", label: "단축키", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" /></svg>), desc: "OS 단축키 입력" },
                  { id: "macro", label: "매크로", icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>), desc: "여러 동작 시퀀스" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setActionType(opt.id)}
                    className={`action-type-btn ${actionType === opt.id ? "is-active" : ""}`}
                  >
                    <span style={{ fontSize: 20, marginRight: 8 }}>{opt.icon}</span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {actionType === "link" && (
              <div className="form-section">
                <label className="form-label" htmlFor="cube-url">URL</label>
                <input id="cube-url" className="form-input" value={payloadUrl} onChange={(e) => setPayloadUrl(e.target.value)} placeholder="https://chat.openai.com" />
              </div>
            )}

            {actionType === "shortcut" && (
              <div className="form-section">
                <label className="form-label" htmlFor="cube-keys">키 조합</label>
                <input id="cube-keys" className="form-input" value={payloadKeys} onChange={(e) => setPayloadKeys(e.target.value)} placeholder="예: Ctrl+Shift+S" />
                <p className="form-hint">키 사이를 + 로 연결. Win·Ctrl·Shift·Alt 조합 가능.</p>
              </div>
            )}

            {actionType === "macro" && (
              <div className="form-section">
                <label className="form-label">매크로 시퀀스</label>
                <div className="placeholder-box">
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    🛠 시퀀스 빌더는 시스템 개발 완료 후 활성화됩니다.
                    예정 기능: 단축키 + 딜레이 + 마우스 클릭 + 외부 앱 실행을 순서대로 추가.
                  </p>
                </div>
              </div>
            )}

            <div className="form-section">
              <label className="form-label" htmlFor="cube-category">카테고리 (선택)</label>
              <select id="cube-category" className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">자동 추정</option>
                <option value="korean-life">한국 생활</option>
                <option value="dev">개발</option>
                <option value="design">디자인</option>
                <option value="trading">트레이딩</option>
                <option value="k-content">K-콘텐츠</option>
                <option value="productivity">생산성</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div className="form-section">
              <label className="form-label" htmlFor="cube-color">큐브 색상</label>
              <input id="cube-color" type="color" className="form-input" value={color} onChange={(e) => setColor(e.target.value)} style={{ height: 44, padding: 4 }} />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
              <button className="btn btn-primary" disabled>큐브 저장 (.cubeone)</button>
              <button className="btn btn-secondary" disabled>큐브 리스트에 추가</button>
            </div>
            <div className="placeholder-box" style={{ marginTop: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                ⚙️ 저장·다운로드 기능은 Supabase 연동 + Tauri 기반 PC 앱 출시 후 활성화됩니다.
              </p>
            </div>
          </div>

          {/* Preview */}
          <aside style={{ position: "sticky", top: 100 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>PREVIEW · 미리보기</div>
            <div className="cube-preview-wrap">
              <div className="cube-preview-cell" style={{ background: color }}>
                <div className="cube-preview-icon">{icon ? "🖼" : (name ? name.charAt(0) : "?")}</div>
                <div className="cube-preview-label">{name || "큐브 이름"}</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
              액션: <strong>{actionType === "link" ? "링크" : actionType === "shortcut" ? "단축키" : "매크로"}</strong>
              {actionType === "link" && payloadUrl && <><br/>URL: {payloadUrl.slice(0, 30)}{payloadUrl.length > 30 ? "..." : ""}</>}
              {actionType === "shortcut" && payloadKeys && <><br/>키: {payloadKeys}</>}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * /marketplace/cubelist/create-list  — 큐브 리스트·팩 제작
 * ============================================================ */
function CreateListPage({ t }) {
  const LIMIT = 24;
  const [listName, setListName] = React.useState("");
  const [listDesc, setListDesc] = React.useState("");
  const [cubes, setCubes] = React.useState([
    { id: 1, name: "ChatGPT", color: "#9C27B0" },
    { id: 2, name: "GitHub", color: "#1A237E" },
    { id: 3, name: "Figma", color: "#E91E63" },
    { id: 4, name: "스크린샷", color: "#FF9800" },
  ]);

  const isOverLimit = cubes.length > LIMIT;
  const willBePack = cubes.length > LIMIT;

  return (
    <section className="section" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "마켓플레이스", href: "/marketplace/" }, { label: "큐브 리스트", href: "/marketplace/cubelist/" }, { label: "큐브 에디터", href: "/editor/" }, { label: "리스트·팩 제작" }]} />

        <div className="eyebrow">CREATE LIST · 리스트·팩 제작</div>
        <h1 className="section-title" style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 12 }}>
          큐브를 묶어 리스트로
          <code style={{ fontSize: 14, color: "var(--accent)", background: "var(--surface-sunken)", padding: "2px 8px", borderRadius: 999, marginLeft: 8 }}>.cubelist</code>
          <code style={{ fontSize: 14, color: "var(--accent)", background: "var(--surface-sunken)", padding: "2px 8px", borderRadius: 999, marginLeft: 4 }}>.cubepack</code>
        </h1>
        <p className="section-lede" style={{ maxWidth: 640, marginBottom: 32 }}>
          큐브 6~{LIMIT}개를 한 리스트에 묶어 저장하세요. {LIMIT}개를 초과하면 자동으로 큐브 팩(.cubepack)으로 변환됩니다.
        </p>

        <div className="form-section">
          <label className="form-label">리스트 이름</label>
          <input className="form-input" value={listName} onChange={(e) => setListName(e.target.value)} placeholder="예: 트레이더 데일리" />
        </div>

        <div className="form-section">
          <label className="form-label">설명</label>
          <input className="form-input" value={listDesc} onChange={(e) => setListDesc(e.target.value)} placeholder="한 줄 설명 (선택)" />
        </div>

        {/* Counter */}
        <div className="cube-counter" style={{ marginTop: 24, marginBottom: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            큐브 {cubes.length} / {LIMIT}
          </span>
          {willBePack ? (
            <span className="badge-warning">⚡ {LIMIT}개 초과 — 자동으로 .cubepack으로 저장됩니다</span>
          ) : (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{LIMIT - cubes.length}개 더 추가 가능</span>
          )}
        </div>

        {/* Cube grid (drag-drop placeholder) */}
        <div className="list-builder-grid">
          {cubes.map((c, i) => (
            <div key={c.id} className="builder-cube" style={{ background: c.color }}>
              <div className="builder-cube-pos">{i + 1}</div>
              <div className="builder-cube-name">{c.name}</div>
              <button
                className="builder-cube-remove"
                onClick={() => setCubes(cubes.filter((x) => x.id !== c.id))}
                aria-label="제거"
              >×</button>
            </div>
          ))}
          <a href="/marketplace/cubelist/create-cube/" className="builder-cube-add">
            <div style={{ fontSize: 32 }}>+</div>
            <div style={{ fontSize: 12 }}>큐브 추가</div>
          </a>
        </div>

        <div className="placeholder-box" style={{ marginTop: 24 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            🖱 <strong>드래그앤드롭 순서 변경</strong>은 시스템 개발 완료 후 활성화됩니다 (dnd-kit 적용 예정).
            현재는 큐브를 추가·제거만 가능합니다.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
          <button className="btn btn-primary" disabled>
            {willBePack ? "큐브 팩으로 저장 (.cubepack)" : "리스트 저장 (.cubelist)"}
          </button>
          <button className="btn btn-secondary" disabled>마켓플레이스에 등록</button>
        </div>

        <div style={{ marginTop: 40, padding: 20, background: "var(--surface-2)", borderRadius: "var(--r-4)" }}>
          <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>📦 자동 팩 전환 규칙</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--ink-3)", lineHeight: 1.7 }}>
            <li>큐브 1~{LIMIT}개 → <code>.cubelist</code> 단일 리스트로 저장</li>
            <li>큐브 {LIMIT + 1}개 이상 → 자동으로 여러 리스트로 분할 후 <code>.cubepack</code>으로 저장</li>
            <li>분할 기준: 첫 24개 = 리스트 1, 25~48 = 리스트 2 ... (사용자가 분할 기준 커스텀 가능 — 개발 후)</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * /marketplace/cubelist/convert  — .streamDeckPlugin → .cubelist 변환
 * ============================================================ */
function ConvertPage({ t }) {
  const [file, setFile] = React.useState(null);

  return (
    <section className="section" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "마켓플레이스", href: "/marketplace/" }, { label: "큐브 리스트", href: "/marketplace/cubelist/" }, { label: "큐브 에디터", href: "/editor/" }, { label: "파일 변환" }]} />

        <div className="eyebrow">CONVERT · 큐브 파일로 전환</div>
        <h1 className="section-title" style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 12 }}>
          Stream Deck 플러그인 → 큐브 리스트
        </h1>
        <p className="section-lede" style={{ maxWidth: 720, marginBottom: 32 }}>
          이미 사용 중인 <code>.streamDeckPlugin</code> 파일을 드롭하면 <code>.cubelist</code> 또는 <code>.cubepack</code>으로 자동 변환합니다.
          메타·이미지·다국어는 100% 자동, 코드·바이너리는 클린룸 재구현 필요.
        </p>

        {/* Dropzone */}
        <div
          className="dropzone"
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("is-hover"); }}
          onDragLeave={(e) => e.currentTarget.classList.remove("is-hover")}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("is-hover");
            if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📥</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {file ? file.name : "여기에 .streamDeckPlugin 파일을 드롭하세요"}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            {file ? `${(file.size / 1024).toFixed(1)} KB · 변환 준비됨` : "또는 클릭해서 파일 선택"}
          </div>
          <input
            type="file"
            accept=".streamDeckPlugin,.zip"
            onChange={(e) => e.target.files[0] && setFile(e.target.files[0])}
            style={{ display: "none" }}
            id="convert-file-input"
          />
          <label htmlFor="convert-file-input" className="btn btn-secondary" style={{ cursor: "pointer" }}>
            파일 선택
          </label>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button className="btn btn-primary" disabled={!file}>변환 시작</button>
          <button className="btn btn-secondary" onClick={() => setFile(null)} disabled={!file}>초기화</button>
        </div>

        <div className="placeholder-box" style={{ marginTop: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            ⚙️ <strong>변환 엔진은 트랙 B 변환기 개발 완료 후 활성화됩니다.</strong>
            현재 페이지는 UI 골격만 제공. 백엔드 파이프라인은 `jusomoa-list/docs/track-b-workflow.md` 참조.
          </p>
        </div>

        {/* Coverage matrix */}
        <h2 style={{ marginTop: 56, fontSize: 22 }}>변환 가능 범위</h2>
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px" }}>항목</th>
                <th style={{ padding: "12px 8px" }}>자동도</th>
                <th style={{ padding: "12px 8px" }}>비고</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["manifest.json 구조·UUID·메타", "✅ 100%", "namespace com.elgato.* → com.rebirth.*"],
                ["다국어 JSON (en/ko/ja/de)", "✅ 100%", "locales/ 디렉토리로 매핑"],
                ["이미지·아이콘 PNG", "✅ 100%", "라이선스는 사용자 책임"],
                ["액션 정의 (UUID·라벨·상태)", "✅ 100%", "큐브 메타로 매핑"],
                ["Property Inspector HTML", "✅ 80%", "우리 PI 컴포넌트로 자동 매핑"],
                ["Property Inspector JS 코드", "❌ 0%", "Elgato copyright — 클린룸 재구현"],
                ["네이티브 바이너리(.exe·.dll)", "❌ 0%", "외부 SDK로 직접 구현 필요"],
                ["액션 실행 로직(Discord API 등)", "❌ 0%", "공식 SDK 사용 클린룸 재구현"],
              ].map(([a, b, c], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 8px", color: "var(--ink-3)" }}>{a}</td>
                  <td style={{ padding: "12px 8px", fontWeight: 500 }}>{b}</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: 13 }}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 32, padding: 20, background: "var(--surface-2)", borderRadius: "var(--r-4)" }}>
          <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 8 }}>⚖️ 법적 안전 라인</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "var(--ink-3)", lineHeight: 1.7 }}>
            <li>인터페이스 호환(Stream Deck WS 이벤트 스키마·manifest 구조) = 합법</li>
            <li>Elgato 바이너리·Property Inspector JS 직접 사용 = 금지</li>
            <li>원본 .streamDeckPlugin 라이선스는 사용자 책임</li>
            <li>변환 결과를 마켓 공개 등록 시 추가 라이선스 검증 필요</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * /marketplace/cubelist/manage  — 마켓 업데이트·관리
 * ============================================================ */
function ManagePage({ t }) {
  const myItems = [
    { type: "list", name: "내 트레이딩 데일리", ext: ".cubelist", downloads: 0, status: "초안", updated: "방금" },
    { type: "cube", name: "ChatGPT 빠른 실행", ext: ".cubeone", downloads: 0, status: "초안", updated: "방금" },
  ];

  return (
    <section className="section" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "마켓플레이스", href: "/marketplace/" }, { label: "큐브 리스트", href: "/marketplace/cubelist/" }, { label: "관리" }]} />

        <div className="eyebrow">MANAGE · 마켓 등록·갱신</div>
        <h1 className="section-title" style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 12 }}>
          내 큐브·리스트·팩 관리
        </h1>
        <p className="section-lede" style={{ maxWidth: 720, marginBottom: 32 }}>
          내가 만든 큐브·리스트·팩의 마켓 등록·갱신·통계·수익 정산을 한 곳에서.
        </p>

        {/* 디바이스 연결 상태 */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <div style={{ padding: "8px 14px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 999, fontSize: 13, color: "var(--ink-3)", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, background: "#9CA3AF", borderRadius: "50%" }} aria-hidden /> PC 앱: 미연결
          </div>
          <div style={{ padding: "8px 14px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 999, fontSize: 13, color: "var(--ink-3)", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, background: "#9CA3AF", borderRadius: "50%" }} aria-hidden /> 모바일 앱: 미연결
          </div>
        </div>

        {/* 페어링 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 40, padding: 24, background: "var(--surface-sunken)", border: "1px dashed var(--line)", borderRadius: 12 }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>PC ↔ 폰 연결하기</h3>
            <p style={{ color: "var(--ink-3)", fontSize: 14, marginBottom: 16 }}>
              거치된 폰을 PC 앱과 페어링하면 큐브를 즉시 사용·편집할 수 있습니다.
            </p>
            <ol style={{ paddingLeft: 18, color: "var(--ink-3)", fontSize: 13, lineHeight: 1.8 }}>
              <li>PC 앱 설치 — <a href="/download/" style={{ color: "var(--primary)" }}>다운로드 →</a></li>
              <li>큐브 리스트 모바일 앱 설치 (Google Play / App Store)</li>
              <li>오른쪽 QR 코드를 모바일 앱으로 스캔</li>
              <li>자동 페어링 완료 (LAN 5~20ms / Realtime 50~150ms)</li>
            </ol>
            <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 12 }}>
              ℹ️ Stage 2 정식 출시 시 실제 QR이 활성화됩니다.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                width: 200,
                height: 200,
                background: "repeating-conic-gradient(#1A237E 0% 25%, #fff 0% 50%) 50% / 16px 16px",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              aria-label="페어링 QR placeholder"
            >
              <div style={{ background: "rgba(255,255,255,0.92)", padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#1A237E" }}>QR Placeholder</div>
            </div>
            <button
              type="button"
              disabled
              aria-disabled="true"
              style={{ marginTop: 12, padding: "6px 14px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 6, fontSize: 13, color: "var(--ink-3)", cursor: "not-allowed" }}
            >QR 재생성 (Stage 2)</button>
          </div>
        </div>

        {/* 셀러 등급 */}
        <div style={{ marginBottom: 32, padding: 20, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🌱</div>
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: 1.5 }}>현재 등급</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>General (일반 셀러)</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>무료 큐브팩 배포만 가능 · 5개+ 큐브팩·평점 4.0+·500+ 다운로드 시 Certified 신청</div>
            </div>
          </div>
          <button type="button" disabled aria-disabled="true" className="btn btn-secondary" style={{ fontSize: 13, opacity: 0.6, cursor: "not-allowed" }}>Certified 셀러 신청 (Stage 3)</button>
        </div>

        {/* Stats */}
        <div className="manage-stats">
          {[
            { label: "내 큐브", value: "2", sub: "초안" },
            { label: "공개 등록", value: "0", sub: "Stage 2 이후" },
            { label: "총 다운로드", value: "0", sub: "이번 달" },
            { label: "수익", value: "₩0", sub: "Stage 4 이후" },
          ].map((s, i) => (
            <div key={i} className="manage-stat-card">
              <div className="manage-stat-label">{s.label}</div>
              <div className="manage-stat-value">{s.value}</div>
              <div className="manage-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 32, marginBottom: 24, flexWrap: "wrap" }}>
          <a href="/marketplace/cubelist/create-cube/" className="btn btn-primary">+ 큐브 만들기</a>
          <a href="/marketplace/cubelist/create-list/" className="btn btn-secondary">+ 리스트·팩 만들기</a>
          <a href="/marketplace/cubelist/convert/" className="btn btn-secondary">파일 변환</a>
        </div>

        {/* 매출·정산 placeholder (Stage 4) */}
        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>매출·정산</h2>
        <div style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 32 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: 1.5 }}>이번 분기 매출</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>₩0</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: 1.5 }}>플랫폼 수수료</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-3)" }}>15~30%</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Apple/Google</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: 1.5 }}>운영비</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-3)" }}>10%</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Rebirth Station</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: 1.5 }}>셀러 실수령</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>~65%</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>분기별 정산</div>
            </div>
          </div>
          <div style={{ padding: 12, background: "var(--surface-sunken)", borderRadius: 8, fontSize: 12, color: "var(--ink-3)" }}>
            <strong style={{ color: "var(--ink)" }}>ℹ️ Stage 4 활성</strong>
            <p style={{ marginTop: 4, marginBottom: 0 }}>
              정산 = 분기별 (3·6·9·12월 말) · 최소 ₩30,000 누적 후 · 한국 KRW / 해외 USD · 환불률 30%+ 시 등급 강등 검토
            </p>
          </div>
        </div>

        {/* My items */}
        <h2 style={{ fontSize: 22, marginTop: 24, marginBottom: 12 }}>내 항목</h2>
        <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: "var(--r-3)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "var(--surface-2)" }}>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "12px" }}>이름</th>
                <th style={{ padding: "12px" }}>유형</th>
                <th style={{ padding: "12px" }}>다운로드</th>
                <th style={{ padding: "12px" }}>상태</th>
                <th style={{ padding: "12px" }}>최종 수정</th>
                <th style={{ padding: "12px" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {myItems.map((it, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px", fontWeight: 500 }}>{it.name}</td>
                  <td style={{ padding: "12px" }}><code style={{ fontSize: 12, color: "var(--accent)" }}>{it.ext}</code></td>
                  <td style={{ padding: "12px", color: "var(--ink-3)" }}>{it.downloads}</td>
                  <td style={{ padding: "12px" }}><span className="badge-status">{it.status}</span></td>
                  <td style={{ padding: "12px", color: "var(--muted)" }}>{it.updated}</td>
                  <td style={{ padding: "12px" }}>
                    <button className="btn-mini" disabled>편집</button>{" "}
                    <button className="btn-mini" disabled>공개 등록</button>
                  </td>
                </tr>
              ))}
              {myItems.length === 0 && (
                <tr><td colSpan="6" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>아직 만든 항목이 없습니다. 위 버튼으로 시작하세요.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Roadmap */}
        <div style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>관리 기능 단계 공개</h2>
          <div className="eco-stack">
            <div className="eco-layer" data-tier="1">
              <div className="num">현재</div>
              <div className="name">
                <span>로컬 저장 + 미리보기</span>
                <span className="desc">큐브 제작 UI · 리스트 빌더 · 파일 변환 골격</span>
              </div>
              <span className="tag">Stage 1</span>
            </div>
            <div className="eco-layer" data-tier="2">
              <div className="num">Stage 2</div>
              <div className="name">
                <span>마켓 공개 등록 + 다운로드 통계</span>
                <span className="desc">Supabase 연동 · 큐레이션 심사 · 검색·평점</span>
              </div>
              <span className="tag">~6개월</span>
            </div>
            <div className="eco-layer" data-tier="3">
              <div className="num">Stage 4</div>
              <div className="name">
                <span>수익 정산 · 셀러 대시보드</span>
                <span className="desc">유료 큐브팩 판매 · IAP 연동 · 셀러 70% 분배</span>
              </div>
              <span className="tag">~12개월</span>
            </div>
          </div>
        </div>

        <div className="placeholder-box" style={{ marginTop: 24 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            ⚙️ <strong>모든 액션 버튼은 시스템 개발 완료 후 활성화됩니다.</strong>
            현재 페이지는 UI·UX 검증용 골격.
          </p>
        </div>
      </div>
    </section>
  );
}

function Breadcrumb({ items }) {
  // BreadcrumbList JSON-LD (답변엔진 위계 인식 — AEO L02·L06).
  // 영구 정책 `feedback_breadcrumb_policy.md` 호환·외과수술적 (기존 시각 nav 유지).
  const siteUrl = "https://www.rebirthstation.com";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: it.href.startsWith("http") ? it.href : `${siteUrl}${it.href}` } : {}),
    })),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav className="breadcrumb" aria-label="페이지 경로" style={{ marginBottom: 20, fontSize: 13, color: "var(--muted)" }}>
        {items.map((it, i) => (
          <span key={i}>
            {i > 0 && <span style={{ margin: "0 8px" }}>/</span>}
            {it.href
              ? <a href={it.href} style={{ color: "var(--muted)" }}>{it.label}</a>
              : <span style={{ color: "var(--ink)" }}>{it.label}</span>}
          </span>
        ))}
      </nav>
    </>
  );
}

function DownloadPage({ t }) {
  const d = t.downloadPage;
  return (
    <section className="section" data-screen-label="Download" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "다운로드" }]} />
        <header className="section-head">
          <div className="eyebrow">{d.eyebrow}</div>
          <h1 className="section-title">{d.title}</h1>
          <p className="section-sub">{d.sub}</p>
        </header>

        <div className="download-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 32 }}>
          {d.cards.map((c, i) => (
            <article key={i} className="market-card">
              <div className="market-card-head">
                <div className="market-cat" style={{ background: c.catColor, color: "#fff" }}>{c.cat}</div>
                <h3 className="market-title" style={{ marginTop: 8 }}>{c.title}</h3>
                <p className="market-meta">{c.meta}</p>
              </div>
              <div className="market-card-foot">
                <a href="#" className={i < 2 ? "btn btn-primary" : "btn btn-secondary"} aria-disabled="true">{c.cta}</a>
                <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>{c.note}</p>
              </div>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 56, padding: 24, background: "var(--surface-sunken)", borderRadius: 12 }}>
          <h3 style={{ marginTop: 0 }}>{d.authBoxTitle}</h3>
          <p style={{ color: "var(--ink-3)" }}>{d.authBoxBody}</p>
        </div>

        <p style={{ marginTop: 32, fontSize: 13, color: "var(--ink-3)", textAlign: "center" }}>{d.bottomNote}</p>
      </div>
    </section>
  );
}

const BLOG_SEED_POSTS = [
  { n: 1, slug: "what-is-cube-list", title: "큐브 리스트가 뭔가요? 안 쓰는 폰이 컨트롤러가 되는 이유", cat: "소개 · 교육" },
  { n: 2, slug: "vs-stream-deck", title: "Stream Deck 살 돈 아끼고 똑같이 쓰는 방법", cat: "비교 · 리뷰" },
  { n: 3, slug: "cube-list-pack-3tier", title: "큐브·리스트·큐브팩 — 3단계 구조 한 번에 이해하기", cat: "교육 · 시스템 이해" },
  { n: 4, slug: "5min-quickstart", title: "5분 안에 첫 큐브 작동하기 — 단계별 가이드", cat: "온보딩 · 튜토리얼" },
  { n: 5, slug: "macro-permission-3tier", title: "매크로 권한 3-tier — 안전하게 자동화하는 법", cat: "안전 · 보안 · 교육" },
  { n: 6, slug: "developer-workflow", title: "개발자의 워크플로우 — GitHub·VS Code·Stack Overflow를 한 그리드에", cat: "사용 사례 · 개발자" },
  { n: 7, slug: "trader-monitoring", title: "트레이더의 모니터링 화면 — KRX·업비트·TradingView를 한 그리드에", cat: "사용 사례 · 트레이딩" },
  { n: 11, slug: "twitch-chat-bot-cube", title: "트위치 채팅 봇 + 큐브 — 알림·구독자 인사 자동화", cat: "사용 사례 · 스트리머" },
  { n: 12, slug: "galaxy-s10-second-display", title: "갤럭시 S10을 두 번째 디스플레이로 재활용하기", cat: "디바이스 · 안드로이드" },
  { n: 14, slug: "thermal-safety-guide", title: "발열 방지 가이드 — 폰 24시간 거치 안전 사용법", cat: "안전 · 디바이스" },
  { n: 15, slug: "lan-fallback", title: "와이파이가 자주 끊겨도 큐브가 작동하는 이유 (LAN + Realtime 폴백)", cat: "기술 · 신뢰 시그널" },
  { n: 16, slug: "jusomoa-collab", title: "주소모아 × 큐브 리스트 — 한국 사이트 1,431개를 폰 한 손에", cat: "콜라보 · 사용 사례" },
  { n: 17, slug: "import-cubepack", title: "다른 사람이 만든 큐브팩 가져오기 — 직군별 프리셋 사용법", cat: "사용 가이드 · 마켓플레이스" },
  { n: 19, slug: "korean-idle-phone-stats", title: "한국 가구당 안 쓰는 폰 1.5대 — 새로운 사이클을 시작하는 법", cat: "산업 · 환경 · 통계" },
];

function BlogIndexPage({ t }) {
  const B = t.blogPage;
  return (
    <section className="section" data-screen-label="Blog Index" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "블로그" }]} />
        <header className="section-head">
          <div className="eyebrow">{B.eyebrow}</div>
          <h1 className="section-title">{B.title}</h1>
          <p className="section-sub">{B.sub}</p>
        </header>

        <div className="blog-progress" style={{ marginTop: 24, padding: "12px 16px", background: "var(--surface-sunken)", borderRadius: 8, fontSize: 13, color: "var(--ink-3)" }}>
          {B.progress}
        </div>

        <div className="blog-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 32 }}>
          {BLOG_SEED_POSTS.map((p) => (
            <article key={p.n} className="market-card">
              <div className="market-card-head">
                <div className="market-cat" style={{ background: "#1A237E", color: "#fff" }}>#{String(p.n).padStart(2, "0")} · {p.cat}</div>
                <h3 className="market-title" style={{ marginTop: 8, fontSize: 16, lineHeight: 1.35 }}>{p.title}</h3>
              </div>
              <div className="market-card-foot">
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{B.cardStatus}</span>
              </div>
            </article>
          ))}
        </div>

        <p style={{ marginTop: 40, fontSize: 13, color: "var(--ink-3)", textAlign: "center" }}>{B.bottomNote}</p>
      </div>
    </section>
  );
}

function FaqPage({ t }) {
  const F = t.faqPage;
  const items = (t && t.faq && t.faq.items) || [];
  // FAQPage JSON-LD (답변엔진 Q&A 직접 인용 — AEO L02·L08).
  // 영구 정책 `feedback_content_four_prohibitions.md` 호환 — i18n.js FAQ 데이터만 사용 (날조 X).
  const faqSchema = items.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    })),
  } : null;
  return (
    <section className="section" data-screen-label="FAQ Full" style={{ paddingTop: 120 }}>
      <div className="container">
        {faqSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          />
        )}
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "고객센터" }]} />
        <header className="section-head">
          <div className="eyebrow">{F.eyebrow}</div>
          <h1 className="section-title">{F.title}</h1>
          <p className="section-sub">{F.sub}</p>
        </header>

        <div className="faq-list" style={{ marginTop: 32 }}>
          {items.map((q, i) => (
            <details key={i} className="faq-item" style={{ borderBottom: "1px solid var(--line)", padding: "20px 0" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 16 }}>{q.q}</summary>
              <p style={{ marginTop: 12, color: "var(--ink-3)", lineHeight: 1.6 }}>{q.a}</p>
            </details>
          ))}
          {items.length === 0 && (
            <p style={{ color: "var(--ink-3)" }}>{F.empty}</p>
          )}
        </div>

        <p style={{ marginTop: 40, fontSize: 13, color: "var(--ink-3)", textAlign: "center" }}>
          {F.bottomNote} <a href="/blog/" style={{ color: "var(--primary)", marginLeft: 4 }}>→</a>
        </p>
      </div>
    </section>
  );
}

window.ProgramListPage = ProgramListPage;
window.ProgramCubeListPage = ProgramCubeListPage;
window.MarketplacePage = MarketplacePage;
window.MarketplaceCubeListPage = MarketplaceCubeListPage;
window.CreateCubePage = CreateCubePage;
window.CreateListPage = CreateListPage;
window.ConvertPage = ConvertPage;
window.ManagePage = ManagePage;
function LoginPage({ t }) {
  const L = t.loginPage;
  return (
    <section className="section" data-screen-label="Login" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "로그인" }]} />
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <header className="section-head" style={{ textAlign: "center" }}>
          <div className="eyebrow">{L.eyebrow}</div>
          <h1 className="section-title">{L.title}</h1>
          <p className="section-sub">{L.sub}</p>
        </header>

        <div style={{ marginTop: 40, padding: 32, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>

          <button
            type="button"
            disabled
            aria-disabled="true"
            style={{
              width: "100%",
              padding: "14px 20px",
              background: "#fff",
              color: "#3c4043",
              border: "1px solid #dadce0",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 500,
              cursor: "not-allowed",
              opacity: 0.7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {L.btn}
          </button>

          <p style={{ marginTop: 16, fontSize: 13, color: "var(--ink-3)", textAlign: "center" }}>{L.btnNote}</p>
        </div>

        <div style={{ marginTop: 32, padding: 20, background: "var(--surface-sunken)", borderRadius: 8, fontSize: 13, color: "var(--ink-3)" }}>
          <p style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: "var(--ink)" }}>{L.whyTitle}</p>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {L.whyItems.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: "var(--ink-3)", textAlign: "center" }}>{L.consent}</p>
        </div>
      </div>
    </section>
  );
}

function NotFoundPage({ t }) {
  return (
    <section className="section" data-screen-label="404" style={{ paddingTop: 140, minHeight: "60vh", display: "flex", alignItems: "center" }}>
      <div className="container">
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <div className="eyebrow" style={{ color: "var(--primary)" }}>404 · Not Found</div>
        <h1 className="section-title" style={{ fontSize: "clamp(40px, 6vw, 64px)", marginBottom: 16, marginTop: 8 }}>
          페이지를 찾을 수 없습니다
        </h1>
        <p className="section-sub" style={{ maxWidth: 480, margin: "0 auto 32px" }}>
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
          홈으로 돌아가거나 아래 주요 페이지를 확인해 주세요.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 24 }}>
          <a href="/" className="btn btn-primary">홈으로 →</a>
          <a href="/program/" className="btn btn-secondary">프로그램</a>
          <a href="/marketplace/cubelist/" className="btn btn-secondary">큐브 리스트 마켓</a>
          <a href="/blog/" className="btn btn-secondary">블로그</a>
          <a href="/faq/" className="btn btn-secondary">고객센터</a>
        </div>

        <p style={{ marginTop: 40, fontSize: 13, color: "var(--ink-3)" }}>
          오류가 반복되면 <a href="/faq/" style={{ color: "var(--primary)" }}>고객센터</a>에 알려 주세요.
        </p>
        </div>
      </div>
    </section>
  );
}

const LEGAL_CONTENT = {
  terms: {
    title: "이용약관",
    eyebrow: "LEGAL · TERMS",
    sub: "Rebirth Station 및 큐브 리스트 서비스 이용약관 (잠정 안내).",
    sections: [
      { h: "1. 서비스 소개", p: "Rebirth Station(이하 \"회사\")은 안 쓰는 디바이스를 다용도 단말로 재활용하는 소프트웨어 서비스를 제공합니다. 본 약관은 큐브 리스트(PC 앱·모바일 앱·웹 콘솔) 및 관련 모든 서비스에 적용됩니다." },
      { h: "2. 계정", p: "모든 가입은 Google OAuth로만 가능합니다. 같은 Gmail로 가입한 모든 ver.(Rebirth Station 메인·ver. 주소모아·ver. 케이링크 등)는 자동 연동되며, 동일한 사용자로 취급됩니다." },
      { h: "3. 결제·환불", p: "Pro entitlement는 메인 앱의 IAP(Google Play / Apple App Store)로만 결제할 수 있으며, 환불은 각 스토어의 표준 정책을 따릅니다. 콜라보 ver. 앱에서는 별도 IAP를 제공하지 않습니다." },
      { h: "4. 큐브팩 마켓플레이스", p: "셀러가 등록한 큐브팩은 큐레이션 팀의 검증을 거쳐 배포됩니다. 매크로 권한은 Tier 1·2·3 모델로 분류되며, Tier 3 큐브는 사용자가 명시 동의한 후에만 실행됩니다." },
      { h: "5. 책임 제한", p: "회사는 큐브 리스트 서비스 자체의 안정성을 보장하나, 사용자가 등록한 외부 URL·API·매크로의 정확성 및 결과는 보장하지 않습니다. 의료·법률·세무·금융 등 전문 영역의 큐브팩은 정보 도구이며, 전문 판단을 대체하지 않습니다." },
      { h: "6. 변경", p: "본 약관은 회사 사정에 따라 변경될 수 있으며, 변경 시 사전 공지합니다. 정식 약관은 사업자 등록 후 법무 검토를 거쳐 확정됩니다." },
    ],
    note: "본 페이지는 잠정 안내이며, 정식 약관은 사업자 등록 후 법무 검토를 거쳐 별도 공지됩니다."
  },
  privacy: {
    title: "개인정보처리방침",
    eyebrow: "LEGAL · PRIVACY",
    sub: "Rebirth Station이 수집·처리하는 개인정보의 범위와 보호 정책 (잠정 안내).",
    sections: [
      { h: "1. 수집 항목", p: "Google OAuth 가입 시: Gmail 주소·프로필 이름·프로필 사진. 결제 시: Google/Apple 결제 토큰(영수증 검증용). 큐브 사용: 사용자가 등록한 큐브 메타데이터(URL·라벨·아이콘) — 외부 노출 X." },
      { h: "2. 수집 목적", p: "(a) 계정 식별·entitlement 동기화, (b) IAP 결제 검증·환불 처리, (c) 큐브 동기화(PC ↔ 모바일), (d) 서비스 개선 통계." },
      { h: "3. 보관 기간", p: "계정 활성: Gmail 식별자는 계정 삭제 시까지 보관. 결제: 5년(전자상거래법). 큐브 데이터: 사용자가 직접 삭제 가능, 계정 삭제 시 30일 후 완전 삭제." },
      { h: "4. 제3자 제공", p: "회사는 사용자의 명시적 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단 법령에 의한 요청 또는 사용자 본인 동의에 한해 예외." },
      { h: "5. 사용자 권리", p: "사용자는 언제든지 본인 정보 열람·정정·삭제·처리정지를 요청할 수 있습니다. 요청 채널: 출시 후 공식 채널 안내." },
      { h: "6. 변경", p: "본 방침은 회사 사정·법령 변경에 따라 갱신될 수 있으며, 변경 시 사전 공지합니다. 정식 방침은 사업자 등록 후 별도 공지됩니다." },
    ],
    note: "본 페이지는 잠정 안내이며, 정식 개인정보처리방침은 사업자 등록 후 법무 검토를 거쳐 별도 공지됩니다."
  },
  cookies: {
    title: "쿠키 정책",
    eyebrow: "LEGAL · COOKIES",
    sub: "Rebirth Station 웹사이트의 쿠키 사용 안내 (잠정).",
    sections: [
      { h: "1. 필수 쿠키", p: "로그인 세션 유지·CSRF 보호·Pro entitlement 캐시 등 서비스 동작에 필수. 비활성화 시 일부 기능이 제한됩니다." },
      { h: "2. 기능 쿠키", p: "언어 설정(KR/EN)·테마(라이트/다크) 등 사용자 환경 저장. 비활성화 가능." },
      { h: "3. 분석 쿠키", p: "익명 사용 통계 수집(페이지 뷰·체류 시간). 사용자 동의 후에만 활성화. (Stage 2 도입 예정)" },
      { h: "4. 광고 쿠키", p: "Sponsored 배너에 한해 비침투 광고 표시. 개인 식별 정보 X. (Stage 2 도입 예정)" },
      { h: "5. 관리", p: "브라우저 설정에서 쿠키를 삭제·차단할 수 있으며, 회사 사이트의 쿠키 동의 배너에서 개별 설정 가능합니다. (Stage 2 활성)" },
    ],
    note: "본 페이지는 잠정 안내이며, 정식 쿠키 정책은 Stage 2 분석·광고 활성화 시점에 별도 공지됩니다."
  },
};

function LegalPage({ t, slug }) {
  const data = LEGAL_CONTENT[slug];
  if (!data) return <window.NotFoundPage t={t} />;
  return (
    <section className="section" data-screen-label={"Legal " + slug} style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "법적 고지", href: "/legal/terms/" }, { label: data.title }]} />
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="eyebrow">{data.eyebrow}</div>
        <h1 className="section-title" style={{ fontSize: "clamp(32px, 4vw, 44px)", marginBottom: 12 }}>{data.title}</h1>
        <p className="section-sub" style={{ marginBottom: 32 }}>{data.sub}</p>

        <div style={{ padding: "12px 16px", background: "var(--surface-sunken)", borderRadius: 8, fontSize: 13, color: "var(--ink-3)", marginBottom: 32 }}>
          ⚠️ {data.note}
        </div>

        {data.sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>{s.h}</h3>
            <p style={{ color: "var(--ink-3)", lineHeight: 1.7 }}>{s.p}</p>
          </div>
        ))}

        <div style={{ marginTop: 48, padding: 20, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}>
          <strong style={{ color: "var(--ink)" }}>관련 페이지</strong>
          <div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href="/legal/terms/" style={{ color: slug === "terms" ? "var(--ink-3)" : "var(--primary)" }}>이용약관</a>
            <a href="/legal/privacy/" style={{ color: slug === "privacy" ? "var(--ink-3)" : "var(--primary)" }}>개인정보처리방침</a>
            <a href="/legal/cookies/" style={{ color: slug === "cookies" ? "var(--ink-3)" : "var(--primary)" }}>쿠키 정책</a>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

function OnboardingPage({ t }) {
  const [step, setStep] = React.useState(() => {
    const q = new URLSearchParams(window.location.search).get("step");
    return Math.min(5, Math.max(1, parseInt(q, 10) || 1));
  });
  const [device, setDevice] = React.useState(null);

  const goto = (n) => {
    const s = Math.min(5, Math.max(1, n));
    setStep(s);
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(s));
    window.history.pushState({}, "", url);
  };

  const detectOS = () => {
    if (typeof navigator === "undefined") return "Windows";
    const ua = navigator.userAgent;
    if (/Mac/i.test(ua)) return "macOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "Windows";
  };
  const userOS = detectOS();

  const stepConfig = [
    { n: 1, title: "디바이스 선택", short: "디바이스" },
    { n: 2, title: "Google 계정", short: "계정" },
    { n: 3, title: "PC 앱 설치", short: "PC 앱" },
    { n: 4, title: "폰 ↔ PC 페어링", short: "페어링" },
    { n: 5, title: "첫 큐브 만들기", short: "첫 큐브" },
  ];

  return (
    <section className="section" data-screen-label="Onboarding" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "온보딩" }]} />
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="eyebrow">ONBOARDING · 5단계</div>
        <h1 className="section-title" style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 12 }}>
          {stepConfig[step - 1].title}
        </h1>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 8, marginTop: 24, marginBottom: 32, alignItems: "center" }} aria-label="단계 진행">
          {stepConfig.map((s) => (
            <React.Fragment key={s.n}>
              <button
                type="button"
                onClick={() => goto(s.n)}
                aria-label={s.short + " 단계로 이동"}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: s.n === step ? "2px solid var(--primary)" : "1px solid var(--line)",
                  background: s.n < step ? "var(--primary)" : "var(--surface)",
                  color: s.n < step ? "#fff" : s.n === step ? "var(--primary)" : "var(--ink-3)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >{s.n < step ? "✓" : s.n}</button>
              {s.n < 5 && <div style={{ flex: 1, height: 1, background: s.n < step ? "var(--primary)" : "var(--line)" }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        {step === 1 && (
          <div>
            <p style={{ color: "var(--ink-3)", marginBottom: 24 }}>어떤 디바이스를 큐브 컨트롤러로 활용하시겠어요?</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {[
                { id: "android-phone", icon: "📱", label: "안드로이드 폰", note: "Android 9+" },
                { id: "iphone", icon: "📱", label: "iPhone", note: "iOS 13+" },
                { id: "android-tablet", icon: "📱", label: "안드로이드 태블릿", note: "Android 9+" },
                { id: "ipad", icon: "📱", label: "iPad", note: "iPadOS 13+" },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { setDevice(d.id); goto(2); }}
                  style={{
                    padding: 20,
                    background: device === d.id ? "var(--surface-sunken)" : "var(--surface)",
                    border: device === d.id ? "2px solid var(--primary)" : "1px solid var(--line)",
                    borderRadius: 12,
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{d.icon}</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{d.note}</div>
                </button>
              ))}
            </div>
            <p style={{ marginTop: 20, fontSize: 13, color: "var(--ink-3)" }}>
              이미 사용 중이신가요? <a href="/marketplace/cubelist/" style={{ color: "var(--primary)" }}>마켓플레이스로 →</a>
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ color: "var(--ink-3)", marginBottom: 24 }}>Google 계정 1개로 모든 ver. 자동 연동.</p>
            <button
              type="button"
              disabled
              aria-disabled="true"
              style={{
                width: "100%",
                padding: "14px 20px",
                background: "#fff",
                color: "#3c4043",
                border: "1px solid #dadce0",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500,
                cursor: "not-allowed",
                opacity: 0.7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Google로 계속하기 (출시 후 활성)
            </button>
            <p style={{ marginTop: 12, fontSize: 12, color: "var(--ink-3)", textAlign: "center" }}>같은 Gmail = 모든 ver. 자동 연동 · 1회 결제로 모든 ver. 광고 제거</p>
            <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "space-between" }}>
              <button onClick={() => goto(1)} className="btn btn-secondary">← 이전</button>
              <button onClick={() => goto(3)} className="btn btn-primary">다음 (스킵 후) →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p style={{ color: "var(--ink-3)", marginBottom: 24 }}>당신의 PC에 큐브 리스트 PC 앱을 설치하세요. 자동 감지: <strong>{userOS}</strong></p>
            <article className="market-card" style={{ marginBottom: 16 }}>
              <div className="market-card-head">
                <div className="market-cat" style={{ background: "#1A237E", color: "#fff" }}>PC 앱</div>
                <h3 className="market-title" style={{ marginTop: 8 }}>Rebirth Station — {userOS}</h3>
                <p className="market-meta">{userOS === "macOS" ? "macOS 12+ · Apple Silicon" : "Windows 10 / 11 · 64-bit"}</p>
              </div>
              <div className="market-card-foot">
                <a href="/download/" className="btn btn-primary" style={{ display: "inline-block" }}>다운로드 페이지로 →</a>
                <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>2026 Q3 오픈 베타 · 출시 알림 받기</p>
              </div>
            </article>
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>다른 OS를 사용 중이신가요? <a href="/download/" style={{ color: "var(--primary)" }}>전체 다운로드 옵션 →</a></p>
            <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "space-between" }}>
              <button onClick={() => goto(2)} className="btn btn-secondary">← 이전</button>
              <button onClick={() => goto(4)} className="btn btn-primary">다음 →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <p style={{ color: "var(--ink-3)", marginBottom: 24 }}>거치된 폰에서 모바일 앱으로 QR을 스캔하면 PC와 자동 페어링됩니다.</p>
            <div style={{ background: "var(--surface-sunken)", border: "1px solid var(--line)", borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 16 }}>
              <div style={{ width: 200, height: 200, margin: "0 auto", background: "repeating-conic-gradient(#1A237E 0% 25%, #fff 0% 50%) 50% / 16px 16px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="QR placeholder (Stage 2 실 활성)">
                <div style={{ background: "rgba(255,255,255,0.92)", padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, color: "#1A237E" }}>QR Placeholder</div>
              </div>
              <p style={{ marginTop: 16, fontSize: 13, color: "var(--ink-3)" }}>Stage 2 정식 출시 시 실제 QR이 표시됩니다.</p>
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "space-between" }}>
              <button onClick={() => goto(3)} className="btn btn-secondary">← 이전</button>
              <button onClick={() => goto(5)} className="btn btn-primary">다음 (스킵) →</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <p style={{ color: "var(--ink-3)", marginBottom: 24 }}>거의 다 왔습니다! 첫 큐브를 어떻게 시작하시겠어요?</p>
            <div style={{ display: "grid", gap: 12 }}>
              <a href="/marketplace/cubelist/" className="market-card" style={{ padding: 20, textDecoration: "none", color: "inherit" }}>
                <div className="market-cat" style={{ background: "#FF9800", color: "#fff", display: "inline-block" }}>추천</div>
                <h3 style={{ marginTop: 8, marginBottom: 4 }}>큐브팩 카탈로그 둘러보기</h3>
                <p style={{ fontSize: 13, color: "var(--ink-3)" }}>다른 사용자가 만든 큐브팩을 둘러보세요 (현재 DEMO 데이터)</p>
              </a>
              <a href="/marketplace/cubelist/create-cube/" className="market-card" style={{ padding: 20, textDecoration: "none", color: "inherit" }}>
                <div className="market-cat" style={{ background: "#1A237E", color: "#fff", display: "inline-block" }}>직접</div>
                <h3 style={{ marginTop: 8, marginBottom: 4 }}>직접 큐브 만들기</h3>
                <p style={{ fontSize: 13, color: "var(--ink-3)" }}>나만의 첫 큐브를 처음부터 만들어보세요 (PC 앱 연결 시 활성)</p>
              </a>
              <a href="/marketplace/cubelist/convert/" className="market-card" style={{ padding: 20, textDecoration: "none", color: "inherit" }}>
                <div className="market-cat" style={{ background: "#E91E63", color: "#fff", display: "inline-block" }}>변환</div>
                <h3 style={{ marginTop: 8, marginBottom: 4 }}>Stream Deck 플러그인 변환</h3>
                <p style={{ fontSize: 13, color: "var(--ink-3)" }}>기존 .streamDeckPlugin을 큐브로 변환</p>
              </a>
            </div>
            <div style={{ marginTop: 32, padding: 20, background: "var(--surface-sunken)", borderRadius: 12, textAlign: "center" }}>
              <strong style={{ color: "var(--primary)" }}>✓ 온보딩 완료!</strong>
              <p style={{ marginTop: 8, fontSize: 13, color: "var(--ink-3)" }}>
                더 자세한 안내는 <a href="/blog/" style={{ color: "var(--primary)" }}>블로그</a>와 <a href="/faq/" style={{ color: "var(--primary)" }}>고객센터</a>에서 확인하세요.
              </p>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "space-between" }}>
              <button onClick={() => goto(4)} className="btn btn-secondary">← 이전</button>
              <a href="/" className="btn btn-secondary">홈으로</a>
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}

function DashboardPage({ t }) {
  // Stage 2 활성 — 현재는 placeholder (Supabase 미연결)
  const isLoggedIn = false; // Supabase 연결 후 실제 session 검증
  const user = isLoggedIn ? { name: "사용자", ver: "main", pro: false } : null;

  if (!isLoggedIn) {
    return (
      <section className="section" data-screen-label="Dashboard Login Required" style={{ paddingTop: 120 }}>
        <div className="container">
          <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "대시보드" }]} />
          <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <div className="eyebrow">DASHBOARD</div>
          <h1 className="section-title" style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 16, marginTop: 8 }}>로그인이 필요합니다</h1>
          <p className="section-sub" style={{ marginBottom: 32 }}>대시보드는 Google 계정 로그인 후 이용 가능합니다.</p>
          <a href="/login/?redirect=/dashboard/" className="btn btn-primary">로그인하러 가기 →</a>
          <p style={{ marginTop: 24, fontSize: 13, color: "var(--ink-3)" }}>Stage 2 정식 출시 시점에 활성화됩니다.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section" data-screen-label="Dashboard" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "대시보드" }]} />

        {/* 사용자 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>
          <div style={{ flex: 1 }}>
            <h1 className="section-title" style={{ fontSize: 24, marginBottom: 4 }}>{user.name}님</h1>
            <div style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--ink-3)" }}>
              <span>ver. {user.ver}</span>
              {user.pro && <span style={{ background: "#1A237E", color: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>PRO</span>}
            </div>
          </div>
          <a href="/login/" className="btn btn-secondary">계정 설정</a>
        </div>

        {/* 빠른 통계 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
          {[
            { label: "보유 큐브", value: "—" },
            { label: "활성 리스트", value: "—" },
            { label: "설치 큐브팩", value: "—" },
            { label: "페어링 디바이스", value: "—" },
          ].map((s, i) => (
            <div key={i} style={{ padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: 1.5, marginBottom: 4 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* 빠른 링크 */}
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>빠른 작업</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 40 }}>
          {[
            { icon: "🆕", title: "새 큐브 만들기", href: "/marketplace/cubelist/create-cube/" },
            { icon: "🛒", title: "큐브팩 둘러보기", href: "/marketplace/cubelist/" },
            { icon: "📱", title: "PC 앱 다운로드", href: "/download/" },
            { icon: "🔧", title: "셀러 콘솔", href: "/marketplace/cubelist/manage/" },
            { icon: "❓", title: "도움말", href: "/faq/" },
            { icon: "📘", title: "블로그", href: "/blog/" },
          ].map((q, i) => (
            <a key={i} href={q.href} style={{ padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>{q.icon}</span>
              <span style={{ fontWeight: 600 }}>{q.title}</span>
            </a>
          ))}
        </div>

        <div style={{ padding: 20, background: "var(--surface-sunken)", borderRadius: 8, fontSize: 13, color: "var(--ink-3)" }}>
          <strong style={{ color: "var(--ink)" }}>ℹ️ Stage 2 활성 예정 섹션</strong>
          <p style={{ marginTop: 6 }}>연결된 디바이스 · 내 큐브팩 (셀러) · 설치한 큐브팩 · 활동 로그 — Supabase 연결 시 활성화됩니다.</p>
        </div>

        {/* 구독·결제 */}
        <h2 style={{ fontSize: 18, marginTop: 40, marginBottom: 12 }}>구독·결제</h2>
        <div style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ padding: "4px 10px", background: "var(--surface-sunken)", color: "var(--ink-3)", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>FREE</span>
              <div>
                <div style={{ fontWeight: 600 }}>현재 플랜: 무료</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Footer 비침투 광고 1개 · 큐브 만들기 무제한</div>
              </div>
            </div>
          </div>
          <div style={{ padding: 14, background: "var(--surface-sunken)", borderRadius: 8, fontSize: 13, color: "var(--ink-3)", marginBottom: 12 }}>
            <strong style={{ color: "var(--ink)" }}>Pro 안내</strong>
            <p style={{ marginTop: 6, marginBottom: 0 }}>이미 Pro인 사용자는 자동으로 광고가 제거됩니다. 모든 ver. (Rebirth Station 메인·ver. 주소모아·ver. 케이링크)에 자동 적용.</p>
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
            결제 내역·정산 ·환불 = Stage 4 활성 (Google Play / Apple App Store IAP 표준)
          </p>
        </div>

        {/* 데이터 보호·삭제 */}
        <h2 style={{ fontSize: 18, marginTop: 40, marginBottom: 12 }}>내 데이터 (개인정보보호)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          <div style={{ padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>📥 내 데이터 다운로드</div>
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 12 }}>계정·큐브·구독·활동 데이터 ZIP 파일 다운로드 (GDPR Article 20·PIPA·CCPA).</p>
            <button type="button" disabled aria-disabled="true" className="btn btn-secondary" style={{ fontSize: 13, opacity: 0.6, cursor: "not-allowed" }}>다운로드 요청 (Stage 2)</button>
          </div>
          <div style={{ padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>🗑 계정 삭제</div>
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 12 }}>30일 grace period 후 영구 삭제. 결제 영수증 5년 법적 보관 (전자상거래법).</p>
            <button type="button" disabled aria-disabled="true" className="btn btn-secondary" style={{ fontSize: 13, opacity: 0.6, cursor: "not-allowed", color: "#DC2626" }}>계정 삭제 신청 (Stage 2)</button>
          </div>
          <div style={{ padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>📧 알림 설정</div>
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 12 }}>마케팅 메일·푸시 동의 관리. 1-click unsubscribe.</p>
            <button type="button" disabled aria-disabled="true" className="btn btn-secondary" style={{ fontSize: 13, opacity: 0.6, cursor: "not-allowed" }}>알림 설정 (Stage 2)</button>
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: "var(--ink-3)" }}>
          개인정보 처리 방침: <a href="/legal/privacy/" style={{ color: "var(--primary)" }}>/legal/privacy/</a>
        </p>
      </div>
    </section>
  );
}

function EditorPage({ t }) {
  return (
    <section className="section" data-screen-label="Cube Editor" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "마켓플레이스", href: "/marketplace/" }, { label: "큐브 리스트", href: "/marketplace/cubelist/" }, { label: "큐브 에디터" }]} />
        <div style={{ maxWidth: 800 }}>
        <div className="eyebrow">CUBE EDITOR · 3환경 지원</div>
        <h1 className="section-title" style={{ fontSize: "clamp(28px, 4vw, 40px)", marginBottom: 12 }}>큐브 에디터</h1>
        <p className="section-sub" style={{ marginBottom: 32 }}>
          링크·단축키·매크로 큐브를 한 곳에서 만들고 편집하세요. 주소모아 대시보드·리버스 스테이션 대시보드·오프라인 PC 모두 지원.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { icon: "🔗", title: "링크 큐브", desc: "URL을 한 번의 탭으로 PC에서 열기", href: "/marketplace/cubelist/create-cube/", tier: "Tier 1" },
            { icon: "⌨️", title: "단축키 큐브", desc: "OS 단축키 시퀀스 (Ctrl+Shift+S 등)", href: "/marketplace/cubelist/create-cube/?type=shortcut", tier: "Tier 1~2" },
            { icon: "🤖", title: "매크로 큐브", desc: "여러 동작 시퀀스, 외부 API 호출", href: "/marketplace/cubelist/create-cube/?type=macro", tier: "Tier 2~3" },
          ].map((c, i) => (
            <a key={i} href={c.href} style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, textDecoration: "none", color: "inherit" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{c.icon}</div>
              <h3 style={{ fontSize: 18, marginTop: 0, marginBottom: 6 }}>{c.title}</h3>
              <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 8 }}>{c.desc}</p>
              <span style={{ display: "inline-block", padding: "2px 8px", background: "var(--surface-sunken)", borderRadius: 999, fontSize: 11, color: "var(--ink-3)" }}>{c.tier}</span>
            </a>
          ))}
        </div>

        <h2 style={{ fontSize: 20, marginTop: 32, marginBottom: 12 }}>리스트·팩 만들기</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 32 }}>
          <a href="/marketplace/cubelist/create-list/" className="market-card" style={{ padding: 16, textDecoration: "none", color: "inherit" }}>
            <h3 style={{ marginTop: 0, marginBottom: 4 }}>큐브 리스트 만들기</h3>
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>6~24 큐브 → 1 리스트 (.cubelist)</p>
          </a>
          <a href="/marketplace/cubelist/manage/" className="market-card" style={{ padding: 16, textDecoration: "none", color: "inherit" }}>
            <h3 style={{ marginTop: 0, marginBottom: 4 }}>내 콘솔 관리</h3>
            <p style={{ fontSize: 13, color: "var(--ink-3)" }}>페어링·통계·내 큐브팩 발행</p>
          </a>
        </div>

        {/* 큐브 만드는 흐름 안내 */}
        <h2 style={{ fontSize: 18, marginTop: 40, marginBottom: 12 }}>큐브 만드는 흐름</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 32 }}>
          {[
            { n: "1", title: "큐브 생성", desc: "URL·단축키·매크로 중 선택 → 라벨·아이콘 입력" },
            { n: "2", title: "리스트로 묶기", desc: "6~24 큐브를 한 화면(.cubelist)으로 묶기" },
            { n: "3", title: "팩으로 묶기", desc: "여러 리스트를 큐브팩(.cubepack)으로 패키징" },
            { n: "4", title: "발행·공유", desc: "마켓 발행 또는 친구에게 파일 전달" },
          ].map((s, i) => (
            <div key={i} style={{ padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{s.n}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* 이미지·URL 변경 안내 */}
        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>주요 편집 기능</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 32 }}>
          {[
            { icon: "🖼", title: "이미지 변경", desc: "이모지·이미지 업로드·자동 favicon·AI 생성 (Stage 3+)" },
            { icon: "🔗", title: "URL 변경", desc: "인라인 편집·일괄 변경·찾아 바꾸기" },
            { icon: "📋", title: "복제·이동", desc: "큐브 복제·다른 리스트로 이동·드래그 정렬" },
            { icon: "↻", title: "Import / Export", desc: ".cubeone · .cubelist · .cubepack 파일 + Stream Deck plugin" },
          ].map((f, i) => (
            <div key={i} style={{ padding: 16, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <details style={{ marginTop: 16, padding: 16, background: "var(--surface-sunken)", borderRadius: 8 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>외부 파일 가져오기</summary>
          <div style={{ marginTop: 12 }}>
            <a href="/marketplace/cubelist/convert/" style={{ color: "var(--primary)", fontSize: 14 }}>Stream Deck 플러그인 (.streamDeckPlugin) 가져오기 →</a>
            <p style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 8 }}>
              기존 Stream Deck 플러그인을 큐브로 변환하고, 큐브 에디터에서 직접 편집할 수 있습니다.
            </p>
          </div>
        </details>

        <div style={{ marginTop: 32, padding: 20, background: "var(--surface-sunken)", borderRadius: 8, fontSize: 13, color: "var(--ink-3)" }}>
          <strong style={{ color: "var(--ink)" }}>ℹ️ 3환경 지원</strong>
          <ul style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.7 }}>
            <li><strong>리버스 스테이션 대시보드</strong> (현재 페이지) — 풀 기능 (Tier 1·2·3)</li>
            <li><strong>주소모아 대시보드</strong> — 링크 큐브 중심 (1,431 사이트 자동 큐브화)</li>
            <li><strong>오프라인 PC</strong> — PC 앱 내장 (인터넷 없이 사용·페어링된 폰에 직접 push)</li>
          </ul>
        </div>
        </div>
      </div>
    </section>
  );
}

// 리버스 프로젝트 — 다음 프로젝트 의견 받기 (사용자 명시 2026-05-23)
function ProjectPage({ t }) {
  return (
    <section className="section" data-screen-label="Rebirth Project" style={{ paddingTop: 120 }}>
      <div className="container">
        <Breadcrumb items={[{ label: "홈", href: "/" }, { label: "리버스 프로젝트" }]} />
        <header className="section-head">
          <div className="eyebrow">REBIRTH PROJECT</div>
          <h1 className="section-title">여러분의 의견으로 제작됩니다.</h1>
          <p className="section-sub">
            유휴 디바이스를 이용한 프로그램·어플리케이션 개발 의견을 주시면 함께 반영하여 제작합니다.
          </p>
        </header>

        <div style={{ marginTop: 48, maxWidth: 720 }}>
          <p style={{ color: "var(--ink-3)", lineHeight: 1.7, marginBottom: 32 }}>
            리버스 스테이션의 다음 프로그램은 사용자 제안에서 시작됩니다.
            현재 큐브 리스트(첫 프로그램)에 이어 만들고 싶은 유휴 디바이스 활용 도구가 있다면 알려 주세요.
            우선순위·실현 가능성·커뮤니티 관심도를 바탕으로 함께 검토하고 제작 단계로 옮깁니다.
          </p>

          <form
            method="POST"
            action="https://formspree.io/f/placeholder"
            onSubmit={(e) => {
              // Stage 1: 폼 백엔드 미연결 — mailto fallback (사용자 직접 메일 발송).
              // Stage 2: Supabase / Formspree 등 백엔드 연결 시 본 핸들러 교체.
              e.preventDefault();
              const subject = encodeURIComponent("[Rebirth Project] 의견 제안");
              const idea = e.target.idea?.value?.trim() || "";
              const ctx = e.target.context?.value?.trim() || "";
              const body = encodeURIComponent(`아이디어:\n${idea}\n\n사용 맥락·필요성:\n${ctx}`);
              window.location.href = `mailto:rebirthstationproject@gmail.com?subject=${subject}&body=${body}`;
            }}
          >
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              어떤 프로그램·어플리케이션이 필요하신가요?
            </label>
            <textarea
              name="idea"
              required
              rows={4}
              placeholder="예: 유휴 태블릿으로 가족 캘린더·메모·할 일을 한 화면에 띄우는 도구"
              style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--line)", marginBottom: 20, fontFamily: "inherit", fontSize: 14, resize: "vertical" }}
            />

            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              어떤 상황·필요성에서 떠올린 아이디어인가요? (선택)
            </label>
            <textarea
              name="context"
              rows={3}
              placeholder="예: 안 쓰는 패드가 서랍에 있는데, 매번 사진·메모 정리하기 번거로워서…"
              style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--line)", marginBottom: 24, fontFamily: "inherit", fontSize: 14, resize: "vertical" }}
            />

            <button type="submit" className="btn btn-primary" style={{ minWidth: 200 }}>
              의견 보내기
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: "var(--ink-3)" }}>
            * 제출 시 기본 메일 클라이언트가 열립니다. 직접 메일이 어려우시면
            <a href="mailto:rebirthstationproject@gmail.com" style={{ color: "var(--primary)", marginLeft: 4 }}>rebirthstationproject@gmail.com</a>으로 보내 주세요.
          </p>
        </div>

        <div style={{ marginTop: 64, padding: 24, background: "var(--surface)", borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>현재까지 진행 중인 프로그램</h2>
          <ul style={{ listStyle: "disc", marginLeft: 20, color: "var(--ink-3)", lineHeight: 1.8 }}>
            <li><strong>큐브 리스트</strong> — 안 쓰는 폰을 PC 매크로 컨트롤러로 (Stage 1·MVP 진행 중)</li>
          </ul>
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--ink-3)" }}>
            다음 프로그램은 여러분의 의견 + 커뮤니티 우선순위 + 기술 실현 가능성을 함께 검토하여 결정됩니다.
          </p>
        </div>
      </div>
    </section>
  );
}

window.DownloadPage = DownloadPage;
window.BlogIndexPage = BlogIndexPage;
window.FaqPage = FaqPage;
window.LoginPage = LoginPage;
window.NotFoundPage = NotFoundPage;
window.LegalPage = LegalPage;
window.OnboardingPage = OnboardingPage;
window.DashboardPage = DashboardPage;
window.EditorPage = EditorPage;
window.ProjectPage = ProjectPage;
