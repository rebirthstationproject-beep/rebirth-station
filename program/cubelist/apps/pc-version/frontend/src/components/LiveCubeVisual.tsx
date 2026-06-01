/**
 * 큐브 셀 라이브 비주얼 (2026-06-01) — 사용자 명시:
 * "미리보기에서가 아니라 가능하면 큐브리스트 페이지 자체에서 작동해서 보이면 좋겠어
 *  시계 뿐만 아니라 디스플레이 자체가 실시간으로 보이게"
 *
 * live_clock (analog / digital), live_timer, live_battery, live_gauge 각각 SVG 또는 인라인 표시.
 * 큐브 셀의 cube-icon-bg 영역에 그대로 inline 렌더링.
 */

import { useEffect, useState } from 'react';
import type { Cube } from '../types/cube';

interface LiveCubeVisualProps {
  readonly cube: Cube;
}

export function LiveCubeVisual({ cube }: LiveCubeVisualProps) {
  switch (cube.action_type) {
    case 'live_clock':
      return <LiveClock cube={cube} />;
    case 'live_timer':
      return <LiveTimer cube={cube} />;
    case 'live_battery':
      return <LiveBattery />;
    case 'live_gauge':
      return <LiveGauge cube={cube} />;
    default:
      return null;
  }
}

/** live_clock — analog 시계 SVG 또는 디지털 큰 글씨 */
function LiveClock({ cube }: { cube: Cube }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const format = (cube.action_payload?.format as string | undefined) ?? 'HH:mm';
  if (format === 'analog') return <AnalogClock now={now} />;
  // 디지털 — 큰 글씨로 시:분(:초)
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const pad = (n: number) => String(n).padStart(2, '0');
  let txt: string;
  if (format === 'HH:MM:SS' || format === 'HH:mm:ss') txt = `${pad(h)}:${pad(m)}:${pad(s)}`;
  else if (format === 'h:MM AM/PM') {
    const ap = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    txt = `${hh}:${pad(m)} ${ap}`;
  } else txt = `${pad(h)}:${pad(m)}`;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        fontSize: 18,
        fontWeight: 600,
        fontFamily: 'monospace',
        color: '#fff',
        letterSpacing: '-0.02em',
      }}
    >
      {txt}
    </div>
  );
}

function AnalogClock({ now }: { now: Date }) {
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const hourAngle = (h + m / 60) * 30;
  const minAngle = (m + s / 60) * 6;
  const secAngle = s * 6;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-label="아날로그 시계">
      <circle cx="50" cy="50" r="48" fill="transparent" stroke="#666" strokeWidth="1.5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x1 = 50 + Math.sin(a) * 44;
        const y1 = 50 - Math.cos(a) * 44;
        const x2 = 50 + Math.sin(a) * (i % 3 === 0 ? 38 : 41);
        const y2 = 50 - Math.cos(a) * (i % 3 === 0 ? 38 : 41);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={i % 3 === 0 ? '#ddd' : '#666'}
            strokeWidth={i % 3 === 0 ? 2 : 1}
          />
        );
      })}
      <line
        x1="50"
        y1="50"
        x2={50 + Math.sin((hourAngle * Math.PI) / 180) * 22}
        y2={50 - Math.cos((hourAngle * Math.PI) / 180) * 22}
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="50"
        x2={50 + Math.sin((minAngle * Math.PI) / 180) * 32}
        y2={50 - Math.cos((minAngle * Math.PI) / 180) * 32}
        stroke="#eee"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="50"
        x2={50 + Math.sin((secAngle * Math.PI) / 180) * 36}
        y2={50 - Math.cos((secAngle * Math.PI) / 180) * 36}
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="2.5" fill="#fff" />
    </svg>
  );
}

/** live_timer — 카운트다운 MM:SS 또는 progress ring */
function LiveTimer({ cube }: { cube: Cube }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);
  void tick;
  const duration = (cube.action_payload?.duration_seconds as number | undefined) ?? 1500;
  const targetMs = (cube.action_payload?.target_ms as number | undefined) ?? null;
  const remaining = targetMs ? Math.max(0, Math.floor((targetMs - Date.now()) / 1000)) : duration;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const ratio = duration > 0 ? remaining / duration : 0;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-label="타이머">
      <circle cx="50" cy="50" r="42" fill="transparent" stroke="#333" strokeWidth="6" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="transparent"
        stroke={ratio > 0.5 ? '#22c55e' : ratio > 0.2 ? '#f59e0b' : '#ef4444'}
        strokeWidth="6"
        strokeDasharray={`${2 * Math.PI * 42 * ratio} ${2 * Math.PI * 42}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.5s' }}
      />
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fontSize="18"
        fontFamily="monospace"
        fontWeight="600"
        fill="#fff"
      >
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </text>
    </svg>
  );
}

/** live_battery — 배터리 사각형 + % */
function LiveBattery() {
  const [pct, setPct] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    function update() {
      const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number }> };
      if (!nav.getBattery) {
        setPct(85); // fallback placeholder
        return;
      }
      void nav.getBattery().then((b) => {
        if (mounted) setPct(Math.round(b.level * 100));
      });
    }
    update();
    const i = setInterval(update, 30_000);
    return () => {
      mounted = false;
      clearInterval(i);
    };
  }, []);
  const p = pct ?? 0;
  const color = p > 50 ? '#22c55e' : p > 20 ? '#f59e0b' : '#ef4444';
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-label="배터리">
      <rect x="15" y="35" width="65" height="30" rx="4" fill="transparent" stroke="#888" strokeWidth="2.5" />
      <rect x="80" y="42" width="6" height="16" rx="1" fill="#888" />
      <rect x="18" y="38" width={Math.max(0, (p / 100) * 59)} height="24" rx="2" fill={color} />
      <text x="48" y="80" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">
        {p}%
      </text>
    </svg>
  );
}

/** live_gauge — 원형 게이지 + 수치 */
function LiveGauge({ cube }: { cube: Cube }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const source = (cube.action_payload?.source as string | undefined) ?? 'cpu';
    function update() {
      // 실제 CPU/Memory monitoring 은 Tauri command 필요 — placeholder 로 sin 파동 표시
      const t = Date.now() / 5000;
      const v = (Math.sin(t) + 1) * 50;
      void source;
      setValue(Math.round(v));
    }
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [cube.action_payload]);
  const ratio = value / 100;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-label="게이지">
      <circle cx="50" cy="55" r="38" fill="transparent" stroke="#333" strokeWidth="8" strokeDasharray={`${Math.PI * 38} ${Math.PI * 38 * 2}`} transform="rotate(-180 50 55)" strokeLinecap="round" />
      <circle
        cx="50"
        cy="55"
        r="38"
        fill="transparent"
        stroke={ratio > 0.8 ? '#ef4444' : ratio > 0.5 ? '#f59e0b' : '#22c55e'}
        strokeWidth="8"
        strokeDasharray={`${Math.PI * 38 * ratio} ${Math.PI * 38 * 2}`}
        transform="rotate(-180 50 55)"
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s' }}
      />
      <text x="50" y="60" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">
        {value}
      </text>
    </svg>
  );
}
