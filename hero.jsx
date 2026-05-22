/* Rebirth Station — Hero: 3D phone with full-bleed cube grid */
const { useState, useEffect, useRef } = React;

/* ─────────────────────────────────────────────────────────────
   App-icon SVG library — brand-accurate mini icons for the phone.
   Each icon fills its cube; the parent cube provides the bg color.
   ─────────────────────────────────────────────────────────────*/

const AppIcons = {
  // YouTube — red bg, white play triangle in rounded rect
  youtube:
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="28" width="72" height="44" rx="10" fill="#fff" />
      <polygon points="44,40 44,60 62,50" fill="#FF0000" />
    </svg>,

  // Spotify — green bg, 3 white sound-wave arcs
  spotify:
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fff" strokeLinecap="round">
      <path d="M28 36 Q 50 28 72 38" strokeWidth="7" />
      <path d="M30 50 Q 50 44 68 52" strokeWidth="6" />
      <path d="M32 62 Q 50 58 64 64" strokeWidth="5" />
    </svg>,

  // Netflix — red bg, bold N with gradient stroke feel
  netflix:
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="22" width="12" height="56" fill="#7a0006" />
      <rect x="58" y="22" width="12" height="56" fill="#7a0006" />
      <polygon points="30,22 42,22 70,78 58,78" fill="#fff" />
    </svg>,

  // Instagram — gradient bg, white camera ring + dot
  instagram:
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fff" strokeWidth="6">
      <rect x="18" y="18" width="64" height="64" rx="18" />
      <circle cx="50" cy="50" r="15" />
      <circle cx="70" cy="30" r="3.5" fill="#fff" stroke="none" />
    </svg>,

  // X / Twitter — black bg, white X
  x:
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M28 24 L 56 56 L 28 76 L 38 76 L 60 60 L 72 76 L 80 76 L 56 48 L 78 24 L 68 24 L 50 42 L 36 24 Z" fill="#fff" />
    </svg>,

  // Twitch — purple bg, white twitch logo silhouette (chat/pointer shape with two eyes)
  twitch:
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 24 L 30 16 L 80 16 L 80 56 L 64 72 L 54 72 L 46 80 L 46 72 L 30 72 L 30 24 Z" fill="#fff" />
      <rect x="54" y="34" width="6" height="22" fill="#9146FF" />
      <rect x="68" y="34" width="6" height="22" fill="#9146FF" />
    </svg>,

  // Apple Music / Music — gradient bg, white note
  music:
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 28 L 70 22 L 70 62 Q 70 70 62 70 Q 54 70 54 64 Q 54 58 62 58 Q 65 58 67 59 L 67 36 L 45 40 L 45 70 Q 45 78 37 78 Q 29 78 29 72 Q 29 66 37 66 Q 40 66 42 67 Z" fill="#fff" />
    </svg>,

  // Discord — indigo bg, white controller-ish shape
  discord:
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 32 Q 22 36 20 60 Q 24 70 36 72 L 40 66 Q 32 64 30 60 Q 50 70 70 60 Q 68 64 60 66 L 64 72 Q 76 70 80 60 Q 78 36 70 32 Q 62 28 56 30 L 54 34 Q 50 33 46 34 L 44 30 Q 38 28 30 32 Z" fill="#fff" />
      <circle cx="40" cy="52" r="4" fill="#5865F2" />
      <circle cx="60" cy="52" r="4" fill="#5865F2" />
    </svg>,

  // Threads — black bg, white @-like swirl
  threads:
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round">
      <path d="M30 36 Q 50 18 68 30 Q 80 40 70 52 Q 60 64 46 56 Q 36 50 44 42 Q 54 36 60 44 Q 64 54 56 64 Q 44 76 30 68" />
    </svg>,

  // Slack — 4 colored bars in hash arrangement
  slack:
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="42" y="20" width="14" height="42" rx="7" fill="#ECB22E" />
      <rect x="42" y="42" width="42" height="14" rx="7" fill="#36C5F0" />
      <rect x="16" y="42" width="42" height="14" rx="7" fill="#2EB67D" />
      <rect x="44" y="38" width="14" height="42" rx="7" fill="#E01E5A" />
    </svg>

};

/* Shortcut-cube SVG — keycap aesthetic */
const KeyIcon = ({ text }) =>
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
    <text x="50" y="58" textAnchor="middle" fill="#fff" fontFamily="ui-monospace, monospace" fontWeight="600" fontSize="34" letterSpacing="-1">{text}</text>
  </svg>;


/* Macro-cube generic icon */
const MacroIcon = ({ glyph }) =>
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <text x="50" y="62" textAnchor="middle" fill="#fff" fontFamily="system-ui, sans-serif" fontWeight="600" fontSize="44">{glyph}</text>
  </svg>;


/* ─────────────────────────────────────────────────────────────
   15 cubes, 3 × 5 grid:
     Rows 1-2 — App launchers (active)
     Row 3   — Shortcut keys (active)
     Row 4   — Macros (active)
     Row 5   — Greyed-out placeholders (look like apps, non-interactive)
   ─────────────────────────────────────────────────────────────*/
const HERO_CUBES = [
// Row 1 — Apps
{ id: "yt", kind: "app", bg: "#FF0000", icon: AppIcons.youtube, label: "YouTube", action: "Launch · YouTube" },
{ id: "sp", kind: "app", bg: "#1DB954", icon: AppIcons.spotify, label: "Spotify", action: "Launch · Spotify" },
{ id: "nf", kind: "app", bg: "#E50914", icon: AppIcons.netflix, label: "Netflix", action: "Launch · Netflix" },

// Row 2 — Apps
{ id: "ig", kind: "app", bg: "linear-gradient(135deg, #FEDA75 0%, #FA7E1E 25%, #D62976 50%, #962FBF 75%, #4F5BD5 100%)",
  icon: AppIcons.instagram, label: "Instagram", action: "Launch · Instagram" },
{ id: "xx", kind: "app", bg: "#000", icon: AppIcons.x, label: "X", action: "Launch · X" },
{ id: "tw", kind: "app", bg: "#9146FF", icon: AppIcons.twitch, label: "Twitch", action: "Launch · Twitch" },

// Row 3 — Shortcuts
{ id: "sv", kind: "key", bg: "#1d3a8a", icon: <KeyIcon text="⌘S" />, label: "Save", action: "Hotkey · ⌘ + S" },
{ id: "uz", kind: "key", bg: "#3b6df0", icon: <KeyIcon text="⌘Z" />, label: "Undo", action: "Hotkey · ⌘ + Z" },
{ id: "sc", kind: "key", bg: "#0ea5e9", icon: <KeyIcon text="⌘4" />, label: "Snap", action: "Hotkey · ⌘ + ⇧ + 4" },

// Row 4 — Macros
{ id: "ai", kind: "mac", bg: "#6366f1", icon: <MacroIcon glyph="✦" />, label: "AI", action: "Macro · AIKLINK summarise" },
{ id: "lg", kind: "mac", bg: "#0f766e", icon: <MacroIcon glyph="↑" />, label: "Long", action: "Macro · TradingView · Long" },
{ id: "sd", kind: "mac", bg: "#b45309", icon: <MacroIcon glyph="↗" />, label: "Send", action: "Macro · Slack · Send to #team" },

// Row 5 — Placeholders (greyed, dimmed icons of real apps — visually 'there' only)
{ id: "p1", kind: "ghost", bg: "#1a2030", icon: AppIcons.discord, label: "Discord", action: "" },
{ id: "p2", kind: "ghost", bg: "#1a2030", icon: AppIcons.music, label: "Music", action: "" },
{ id: "p3", kind: "ghost", bg: "#1a2030", icon: AppIcons.slack, label: "Slack", action: "" }];


const FLOATERS = [
{ id: "f1", cls: "fc-1", icon: AppIcons.spotify, bg: "#1DB954" },
{ id: "f2", cls: "fc-2", icon: <KeyIcon text="⌘S" />, bg: "#3b6df0" },
{ id: "f3", cls: "fc-3", icon: <MacroIcon glyph="✦" />, bg: "#6366f1" },
{ id: "f4", cls: "fc-4", icon: AppIcons.youtube, bg: "#FF0000" }];


function HeroStage({ t }) {
  const [pressedId, setPressedId] = useState(null);
  const [pcCube, setPcCube] = useState(HERO_CUBES[0]);
  const timerRef = useRef(null);
  const cycleRef = useRef(null);
  const [autoActive, setAutoActive] = useState(true);

  // Only real (non-ghost) cubes participate in the auto-demo cycle.
  const activeCubes = HERO_CUBES.filter((c) => c.kind !== "ghost");

  const triggerCube = (cube) => {
    setPressedId(cube.id);
    setPcCube(cube);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPressedId((cur) => cur === cube.id ? null : cur);
    }, 380);
  };

  useEffect(() => {
    if (!autoActive) return;
    let i = 0;
    cycleRef.current = setInterval(() => {
      const c = activeCubes[i % activeCubes.length];
      triggerCube(c);
      i++;
    }, 2400);
    return () => clearInterval(cycleRef.current);
  }, [autoActive]);

  const onUserTap = (c) => {
    setAutoActive(false);
    clearInterval(cycleRef.current);
    triggerCube(c);
  };

  return (
    <div className="stage-wrap">
      <div className="stage">
        {/* Floating cubes around the phone */}
        {FLOATERS.map((f) =>
        <div key={f.id} className={`float-cube ${f.cls}`} style={{ background: f.bg }}>
            <div className="float-cube-inner">{f.icon}</div>
          </div>
        )}

        {/* Row category labels (left of phone) */}
        <div className="row-labels" aria-hidden>
          {t.hero.rowLabels.map((label, i) =>
          <div key={i} className="row-label" data-row={i}>
              <span className="row-label-num">0{i + 1}</span>
              <span className="row-label-text">{label}</span>
            </div>
          )}
        </div>

        {/* The phone */}
        <div className="phone" aria-label="Rebirth Station phone controller mockup">
          <div className="phone-notch" />
          <div className="phone-screen" style={{ fontWeight: "700", height: "577px" }}>
            <div className="phone-status">
              <span>9:41</span>
              <span className="dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            </div>
            <div className="phone-cubes">
              {HERO_CUBES.map((c) =>
              <button
                key={c.id}
                className={`cube cube-${c.kind} ${pressedId === c.id ? "is-pressed" : ""}`}
                style={c.bg ? { background: c.bg } : undefined}
                onMouseDown={() => onUserTap(c)}
                onTouchStart={() => onUserTap(c)}
                aria-label={c.label || "App slot"}>
                
                  <div className="cube-icon-wrap">{c.icon}</div>
                  {c.label && <div className="cube-label">{c.label}</div>}
                </button>
              )}
            </div>
            <div className="phone-dock">
              <span className="dock-pill" />
            </div>
          </div>
        </div>
      </div>

      {/* PC effect popup — always rendered, content cycles with cubes */}
      <div className="pc-popup is-on">
        <div className="pc-popup-icon" style={{ background: pcCube.bg }}>
          <div className="pc-popup-icon-inner">{pcCube.icon}</div>
        </div>
        <div className="pc-popup-text">
          <span className="pc-popup-label">{pcCube.label}</span>
          <span className="pc-popup-action">
            {pcCube.kind === "ghost" ? t.hero.ghostAction : pcCube.action}
          </span>
        </div>
      </div>
    </div>);

}

function Hero({ t, layout }) {
  return (
    <section className="hero dot-grid" data-layout={layout} data-screen-label="01 Hero">
      <div className="hero-bg" />
      <div className="container">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="eyebrow">{t.hero.eyebrow}</div>
            <h1 className="hero-title">
              {t.hero.titleA}
              <br />
              {t.hero.titleB} <span className="accent">{t.hero.titleAccent}</span>
              {t.hero.titleC}
            </h1>
            <p className="hero-sub">{t.hero.sub}</p>
            <div className="hero-ctas">
              <a href="#programs" className="btn btn-primary">
                {t.hero.primary} <span aria-hidden>→</span>
              </a>
              <a href="/download/" className="btn btn-ghost">
                {t.hero.secondary}
              </a>
            </div>
            <div className="hero-meta">
              <span>{t.hero.meta1}</span>
              <span className="hero-meta-dot" />
              <span>{t.hero.meta2}</span>
              <span className="hero-meta-dot" />
              <span>{t.hero.meta3}</span>
            </div>
          </div>

          <div className="hero-visual">
            <HeroStage t={t} />
          </div>
        </div>
      </div>
    </section>);

}

window.Hero = Hero;