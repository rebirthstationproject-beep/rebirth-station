/**
 * 로딩 스피너.
 *
 * 정착본 §7 — 일관된 로딩 표시. prefers-reduced-motion 환경에서 dim circle로 대체.
 */

interface SpinnerProps {
  /** 크기 — sm(16px) / md(20px) / lg(32px) */
  size?: 'sm' | 'md' | 'lg';
  /** 접근성 라벨 (기본 "불러오는 중") */
  label?: string;
  /** 색상 — 기본 rbs-accent */
  tone?: 'pink' | 'muted';
  className?: string;
}

export function Spinner({ size = 'md', label = '불러오는 중', tone = 'pink', className }: SpinnerProps) {
  const px = size === 'sm' ? 16 : size === 'lg' ? 32 : 20;
  const stroke = size === 'sm' ? 2 : size === 'lg' ? 3 : 2;
  const color = tone === 'muted' ? 'text-ink-muted' : 'text-rbs-accent';

  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className ?? ''}`}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        className={`${color} cubelist-spinner-svg`}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth={stroke}
        />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
      <span className="cubelist-sr-only">{label}</span>
    </span>
  );
}
