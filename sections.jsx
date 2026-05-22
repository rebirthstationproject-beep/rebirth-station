/* Rebirth Station — content sections */
const { useState: useS } = React;

/* ---------- Section: Philosophy / Why ---------- */
function Philosophy({ t }) {
  return (
    <section className="section philosophy" id="philosophy" data-screen-label="02 Philosophy">
      <div className="container">
        <div className="philosophy-inner">
          <div>
            <div className="eyebrow">{t.philosophy.eyebrow}</div>
            <h2 className="philosophy-title">{t.philosophy.title}</h2>
            <p className="section-lede">{t.philosophy.lede}</p>
          </div>
          <div className="stats">
            {t.philosophy.stats.map((s, i) => (
              <div className="stat" key={i}>
                <div className="stat-num">
                  <span>{s.num}</span>
                  {s.unit && <span className="stat-unit">{s.unit}</span>}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Section: Programs roadmap ---------- */
function Programs({ t }) {
  return (
    <section className="section" id="programs" data-screen-label="03 Programs">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t.programs.eyebrow}</div>
          <h2 className="section-title">{t.programs.title}</h2>
          <p className="section-lede">{t.programs.lede}</p>
        </div>

        <div className="programs-grid">
          {t.programs.cards.map((card, i) => (
            <div key={i} className={`program-card ${card.featured ? "is-featured" : ""}`}>
              <div className="program-status" data-status={card.status}>
                <span className="status-dot" />
                <span className="program-status-label">{card.statusLabel}</span>
              </div>
              <h3 className="program-name">{card.name}</h3>
              <div className="program-name-en">{card.en}</div>
              <p className="program-desc">{card.desc}</p>
              <div className="program-footer">
                <span className="program-tag">{card.tag}</span>
                {card.featured ? (
                  <a href="#cube-list" className="program-cta">
                    더 보기 <span aria-hidden>→</span>
                  </a>
                ) : (
                  <span className="program-cta" style={{ opacity: 0.5 }}>
                    <span aria-hidden>—</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Section: Cube / List / Pack 3-tier ---------- */
function SystemTiers({ t }) {
  return (
    <section className="section" id="cube-list" data-screen-label="04 Cube List System">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t.system.eyebrow}</div>
          <h2 className="section-title">{t.system.title}</h2>
          <p className="section-lede">{t.system.lede}</p>
        </div>

        <div className="tier-grid">
          {t.system.tiers.map((tier, i) => (
            <div className="tier-card" key={i}>
              <div className="tier-num">{tier.num}</div>
              <div className="tier-card-visual">
                {i === 0 && <TierVizCube />}
                {i === 1 && <TierVizList />}
                {i === 2 && <TierVizPack />}
              </div>
              <div className="tier-name">
                <h3>{tier.en}</h3>
                <span className="kr">{tier.kr}</span>
                {tier.ext && <code className="ext">{tier.ext}</code>}
              </div>
              <p>{tier.desc}</p>
              <div className="meta">
                {tier.meta.map((m, j) => (
                  <span key={j}>{m}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TierVizCube() {
  return (
    <div className="viz-cube-single">
      <span>♪</span>
    </div>
  );
}
function TierVizList() {
  const palette = ["#3b6df0", "#0ea5e9", "#15275e", "#6366f1", "#0f766e", "#b45309", "#3b6df0", "#0ea5e9", "#be123c"];
  return (
    <div className="viz-list">
      {palette.map((c, i) => (
        <div key={i} className="vc" style={{ "--c": c }} />
      ))}
    </div>
  );
}
function TierVizPack() {
  return (
    <div className="viz-pack">
      {[0, 1, 2].map((n) => (
        <div className="vl" key={n}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="vc" style={{ "--c": ["#3b6df0", "#0ea5e9", "#15275e", "#6366f1"][i] }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- Section: 4-Layer ecosystem ---------- */
function Ecosystem({ t }) {
  return (
    <section className="section" id="ecosystem" data-screen-label="03 Ecosystem" style={{ background: "var(--surface-2)" }}>
      <div className="container">
        <div className="section-head" style={{ textAlign: "center", margin: "0 auto 64px", maxWidth: 720 }}>
          <div className="eyebrow">{t.eco.eyebrow}</div>
          <h2 className="section-title">{t.eco.title}</h2>
          <p className="section-lede" style={{ margin: "0 auto" }}>{t.eco.lede}</p>
        </div>

        <div className="eco-stack">
          {t.eco.layers.map((l, i) => (
            <div
              key={i}
              className="eco-layer"
              data-tier={l.tier}
              
            >
              <div className="num">{l.num}</div>
              <div className="name">
                <span>{l.name}</span>
                <span className="desc">{l.desc}</span>
              </div>
              <span className="tag">{l.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Section: Partner gallery ---------- */
function Partners({ t }) {
  return (
    <section className="section" id="partners" data-screen-label="04 Partners">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t.partners.eyebrow}</div>
          <h2 className="section-title">{t.partners.title}</h2>
          <p className="section-lede">{t.partners.lede}</p>
        </div>

        <div className="partner-grid">
          {t.partners.brands.map((b, i) => (
            <div className="partner-card" key={i} >
              <span className="partner-name">{b.name}</span>
              <span className="partner-tag">{b.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Section: Marketplace preview ---------- */
function Marketplace({ t }) {
  return (
    <section className="section" id="market" data-screen-label="05 Marketplace" style={{ background: "var(--surface-2)" }}>
      <div className="container">
        <div className="section-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div>
            <div className="eyebrow">{t.market.eyebrow}</div>
            <h2 className="section-title">{t.market.title}</h2>
            <p className="section-lede">{t.market.lede}</p>
          </div>
          <a href="/marketplace/cubelist/" className="btn-arrow" style={{ paddingBottom: 8 }}>
            {t.market.browse} <span aria-hidden>→</span>
          </a>
        </div>

        <div className="market-grid">
          {t.market.packs.map((p, i) => {
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
      </div>
    </section>
  );
}

/* ---------- Section: How it works ---------- */
function HowItWorks({ t }) {
  return (
    <section className="section" id="how" data-screen-label="06 How it works">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t.how.eyebrow}</div>
          <h2 className="section-title">{t.how.title}</h2>
          <p className="section-lede">{t.how.lede}</p>
        </div>

        <div className="steps">
          {t.how.steps.map((s, i) => (
            <div className="step" key={i} >
              <div className="step-visual">
                {i === 0 && <StepPhone />}
                {i === 1 && <StepHelper />}
                {i === 2 && <StepTap />}
              </div>
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepPhone() {
  return (
    <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <rect x="80" y="20" width="60" height="120" rx="10" fill="#0b1220" />
      <rect x="84" y="24" width="52" height="112" rx="7" fill="#1a2030" />
      <rect x="92" y="40" width="36" height="14" rx="3" fill="#3b6df0" />
      <g opacity="0.85">
        <rect x="92" y="60" width="16" height="16" rx="3" fill="#0ea5e9" />
        <rect x="112" y="60" width="16" height="16" rx="3" fill="#6366f1" />
        <rect x="92" y="80" width="16" height="16" rx="3" fill="#15275e" />
        <rect x="112" y="80" width="16" height="16" rx="3" fill="#3b6df0" />
        <rect x="92" y="100" width="16" height="16" rx="3" fill="#0f766e" />
        <rect x="112" y="100" width="16" height="16" rx="3" fill="#b45309" />
      </g>
      <rect x="40" y="135" width="140" height="6" rx="3" fill="#d5d9e3" />
      <rect x="60" y="141" width="100" height="3" rx="1.5" fill="#aab2c2" />
    </svg>
  );
}
function StepHelper() {
  return (
    <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <rect x="20" y="30" width="180" height="110" rx="6" fill="#0b1220" />
      <rect x="20" y="30" width="180" height="18" rx="6" fill="#1a2030" />
      <circle cx="32" cy="39" r="3" fill="#3b6df0" />
      <circle cx="42" cy="39" r="3" fill="#0ea5e9" />
      <circle cx="52" cy="39" r="3" fill="#6366f1" />
      <rect x="35" y="60" width="60" height="60" rx="4" fill="#fff" />
      <g fill="#0b1220">
        <rect x="40" y="65" width="50" height="50" />
        <rect x="42" y="67" width="6" height="6" fill="#fff" />
        <rect x="48" y="67" width="6" height="6" fill="#fff" />
        <rect x="54" y="67" width="6" height="6" fill="#fff" />
        <rect x="66" y="67" width="6" height="6" fill="#fff" />
        <rect x="42" y="73" width="6" height="6" fill="#fff" />
        <rect x="60" y="73" width="6" height="6" fill="#fff" />
        <rect x="72" y="73" width="6" height="6" fill="#fff" />
        <rect x="48" y="79" width="6" height="6" fill="#fff" />
        <rect x="54" y="79" width="6" height="6" fill="#fff" />
        <rect x="66" y="79" width="6" height="6" fill="#fff" />
        <rect x="42" y="85" width="6" height="6" fill="#fff" />
        <rect x="60" y="85" width="6" height="6" fill="#fff" />
        <rect x="72" y="85" width="6" height="6" fill="#fff" />
        <rect x="48" y="91" width="6" height="6" fill="#fff" />
        <rect x="54" y="91" width="6" height="6" fill="#fff" />
        <rect x="72" y="91" width="6" height="6" fill="#fff" />
        <rect x="42" y="97" width="6" height="6" fill="#fff" />
        <rect x="54" y="97" width="6" height="6" fill="#fff" />
        <rect x="66" y="97" width="6" height="6" fill="#fff" />
        <rect x="78" y="97" width="6" height="6" fill="#fff" />
        <rect x="42" y="103" width="6" height="6" fill="#fff" />
        <rect x="48" y="103" width="6" height="6" fill="#fff" />
        <rect x="60" y="103" width="6" height="6" fill="#fff" />
        <rect x="72" y="103" width="6" height="6" fill="#fff" />
        <rect x="42" y="109" width="6" height="6" fill="#fff" />
        <rect x="54" y="109" width="6" height="6" fill="#fff" />
        <rect x="78" y="109" width="6" height="6" fill="#fff" />
      </g>
      <g transform="translate(120,60)">
        <text x="0" y="10" fontFamily="ui-monospace, monospace" fontSize="9" fill="#aab2c2">$ rb-helper init</text>
        <text x="0" y="24" fontFamily="ui-monospace, monospace" fontSize="9" fill="#3b6df0">✓ scanning…</text>
        <text x="0" y="38" fontFamily="ui-monospace, monospace" fontSize="9" fill="#22c55e">✓ device paired</text>
        <rect x="0" y="48" width="50" height="6" rx="3" fill="#3b6df0" />
        <rect x="0" y="48" width="38" height="6" rx="3" fill="#0ea5e9" />
      </g>
    </svg>
  );
}
function StepTap() {
  return (
    <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <rect x="60" y="20" width="60" height="120" rx="10" fill="#0b1220" />
      <rect x="64" y="24" width="52" height="112" rx="7" fill="#1a2030" />
      <rect x="76" y="50" width="24" height="24" rx="5" fill="#3b6df0" />
      <rect x="76" y="78" width="24" height="24" rx="5" fill="#0ea5e9" stroke="#3b6df0" strokeWidth="2" />
      <circle cx="88" cy="90" r="14" fill="none" stroke="#3b6df0" strokeWidth="2" opacity="0.4">
        <animate attributeName="r" values="10;18;10" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
      </circle>
      {/* arrow + PC popup */}
      <path d="M 120 90 Q 145 70 165 70" fill="none" stroke="#3b6df0" strokeWidth="1.5" strokeDasharray="2 3" />
      <polygon points="165,68 170,70 165,72" fill="#3b6df0" />
      <rect x="138" y="50" width="68" height="38" rx="6" fill="#fff" stroke="#e6e8ee" />
      <rect x="146" y="58" width="8" height="8" rx="2" fill="#3b6df0" />
      <rect x="158" y="58" width="38" height="3" rx="1.5" fill="#0b1220" />
      <rect x="158" y="64" width="28" height="2" rx="1" fill="#aab2c2" />
      <rect x="146" y="72" width="50" height="2" rx="1" fill="#aab2c2" />
      <rect x="146" y="77" width="40" height="2" rx="1" fill="#aab2c2" />
    </svg>
  );
}

/* ---------- Section: Download CTA ---------- */
function Download({ t }) {
  return (
    <section className="section" id="download" data-screen-label="07 Download">
      <div className="container">
        <div className="download">
          <div>
            <div className="eyebrow" style={{ color: "#7da3ff" }}>{t.download.eyebrow}</div>
            <h2>{t.download.title}</h2>
            <p>{t.download.sub}</p>
          </div>
          <div className="download-buttons">
            <a className="dl-btn" href="/download/">
              <span className="dl-btn-icon">⌘</span>
              <span className="dl-btn-text">
                <span className="small">{t.download.pc.small}</span>
                <span className="big">{t.download.pc.big}</span>
              </span>
              <span className="dl-btn-arrow">↓</span>
            </a>
            <a className="dl-btn" href="/download/">
              <span className="dl-btn-icon">▢</span>
              <span className="dl-btn-text">
                <span className="small">{t.download.mob.small}</span>
                <span className="big">{t.download.mob.big}</span>
              </span>
              <span className="dl-btn-arrow">→</span>
            </a>
            <a className="dl-btn" href="/download/">
              <span className="dl-btn-icon">◐</span>
              <span className="dl-btn-text">
                <span className="small">{t.download.web.small}</span>
                <span className="big">{t.download.web.big}</span>
              </span>
              <span className="dl-btn-arrow">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Section: FAQ ---------- */
function Faq({ t }) {
  const [open, setOpen] = useS(0);
  return (
    <section className="section" id="faq" data-screen-label="08 FAQ" style={{ background: "var(--surface-2)" }}>
      <div className="container">
        <div className="section-head" style={{ textAlign: "center", margin: "0 auto 56px", maxWidth: 720 }}>
          <div className="eyebrow">{t.faq.eyebrow}</div>
          <h2 className="section-title">{t.faq.title}</h2>
        </div>
        <div className="faq-list">
          {t.faq.items.map((item, i) => (
            <div key={i} className={`faq-item ${open === i ? "is-open" : ""}`}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{item.q}</span>
                <span className="plus" aria-hidden />
              </button>
              <div className="faq-a"><div>{item.a}</div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer({ t }) {
  return (
    <footer className="footer" data-screen-label="09 Footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-col">
            {window.Logo ? <window.Logo /> : null}
            <p className="footer-tag">{t.footer.tag}</p>
          </div>
          {t.footer.cols.map((col, i) => {
            const linkMap = {
              "큐브 리스트": "/program/cubelist/",
              "마켓플레이스": "/marketplace/",
              "PC 앱 다운로드": "/download/",
              "모바일 PWA": "/download/",
              "회사 소개": "/#philosophy",
              "파트너십": "#",
              "보도자료": "#",
              "채용": "#",
              "개발자 문서": "#",
              "큐브팩 가이드": "/blog/",
              "변경사항": "#",
              "지원": "/faq/",
              "Cube List": "/program/cubelist/",
              "Marketplace": "/marketplace/",
              "PC App Download": "/download/",
              "Mobile PWA": "/download/",
              "About": "/#philosophy",
              "Partnership": "#",
              "Press": "#",
              "Careers": "#",
              "Developer Docs": "#",
              "Cubepack Guide": "/blog/",
              "Changelog": "#",
              "Support": "/faq/",
            };
            return (
              <div className="footer-col" key={i}>
                <h4>{col.title}</h4>
                <ul>
                  {col.links.map((l, j) => {
                    const href = linkMap[l] || "#";
                    return <li key={j}><a href={href}>{l}</a></li>;
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="footer-bottom">
          <span>{t.footer.copy.replace(/©\s*\d{4}/, `© ${new Date().getFullYear()}`)}</span>
          <span style={{ display: "flex", gap: 20 }}>
            {t.footer.legal.map((l, i) => {
              const href = i === 0 ? "/legal/terms/" : i === 1 ? "/legal/privacy/" : "/legal/cookies/";
              return <a key={i} href={href}>{l}</a>;
            })}
          </span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  Philosophy, Programs, SystemTiers, Ecosystem, Partners, Marketplace, HowItWorks, Download, Faq, Footer,
});
