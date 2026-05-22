/* Rebirth Station — Logo (PULSE concept)
   Pulse mark — a rounded square containing a 270° loop arrow with a small
   center square, representing the 'Reverse + Rebirth' cycle.
*/

function LogoMark({ size = 28, invert = false }) {
  const gradFrom = invert ? "#ffffff" : "#3b6df0";
  const gradTo   = invert ? "#cbd5e1" : "#1d3a8a";
  const stroke   = invert ? "#0b1220" : "#ffffff";
  const uid = `rs-pulse-${invert ? "i" : "n"}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gradFrom} />
          <stop offset="100%" stopColor={gradTo} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="7" fill={`url(#${uid})`} />
      <path
        d="M 10 16 A 6 6 0 1 1 16 22"
        stroke={stroke}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M 15.6 20 L 15.6 24 L 11 22 Z" fill={stroke} stroke={stroke} strokeWidth="0.4" strokeLinejoin="round" />
      <rect x="14.6" y="14.6" width="3" height="3" rx="0.8" fill={stroke} opacity="0.95" />
    </svg>
  );
}

function Logo({ invert = false, withWordmark = true, small = false }) {
  const wordmarkSize = small ? 15 : 16;
  const markSize = small ? 26 : 28;
  return (
    <a href="#" className={`logo ${invert ? "logo-invert" : ""}`} aria-label="Rebirth Station home">
      <LogoMark size={markSize} invert={invert} />
      {withWordmark && (
        <span className="logo-wordmark" style={{ fontSize: wordmarkSize }}>
          Rebirth Station
        </span>
      )}
    </a>
  );
}

window.Logo = Logo;
window.LogoMark = LogoMark;
