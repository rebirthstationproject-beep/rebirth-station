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
    // 2026-06-01 통합 모델 — 사용자 명시 "시계/모니터링/알람/날씨"
    case 'live_weather':
      return <LiveWeather cube={cube} />;
    case 'live_monitor':
      return <LiveMonitor cube={cube} />;
    case 'live_alarm':
      return <LiveAlarm cube={cube} />;
    case 'live_stock':
      return <LiveStock cube={cube} />;
    case 'live_calendar':
      return <LiveCalendar />;
    case 'live_news':
      return <LiveNews />;
    case 'live_network':
      return <LiveNetwork />;
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

// ============================================================
// 2026-06-01 P3 신규 라이브 큐브 (통합 모델)
// ============================================================

/** live_weather — 날씨 (placeholder API, 실제 API는 사용자 키 입력) */
function LiveWeather({ cube }: { cube: Cube }) {
  const [now, setNow] = useState(0);
  useEffect(() => { const i = setInterval(() => setNow((n) => n + 1), 60_000); return () => clearInterval(i); }, []);
  void now;
  const cond = (cube.action_payload?.condition as string) ?? 'sunny';
  const temp = (cube.action_payload?.temp_c as number) ?? 22;
  const icon: Record<string, string> = {
    sunny: '☀', cloudy: '☁', rainy: '🌧', snowy: '❄', stormy: '⛈', windy: '💨',
  };
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <text x="50" y="55" textAnchor="middle" fontSize="40">{icon[cond] ?? '☀'}</text>
      <text x="50" y="85" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">{temp}°C</text>
    </svg>
  );
}

/** live_monitor — CPU/RAM/Disk/Network (Tauri API 필요, placeholder sin) */
function LiveMonitor({ cube }: { cube: Cube }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    function tick() {
      const t = Date.now() / 3000;
      setVal(Math.round((Math.sin(t) + 1) * 50));
    }
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  const source = (cube.action_payload?.source as string) ?? 'cpu';
  const label: Record<string, string> = { cpu: 'CPU', ram: 'RAM', disk: 'DSK', network: 'NET' };
  const color = val > 80 ? '#ef4444' : val > 50 ? '#f59e0b' : '#22c55e';
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <text x="50" y="30" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff" opacity="0.7">{label[source] ?? 'MON'}</text>
      <rect x="15" y="40" width="70" height="20" rx="3" fill="transparent" stroke="#444" strokeWidth="2" />
      <rect x="17" y="42" width={Math.max(0, (val / 100) * 66)} height="16" rx="2" fill={color} />
      <text x="50" y="80" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">{val}%</text>
    </svg>
  );
}

/** live_alarm — 카운트다운 (목표 시각 도달 시 진동/색깔) */
function LiveAlarm({ cube }: { cube: Cube }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const target = (cube.action_payload?.target_ms as number) ?? (Date.now() + 300_000);
  const remaining = Math.max(0, Math.floor((target - now) / 1000));
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const ringing = remaining === 0;
  const pad = (n: number) => String(n).padStart(2, '0');
  const txt = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <circle cx="50" cy="55" r="35" fill={ringing ? '#ef4444' : 'transparent'} stroke={ringing ? '#fff' : '#9ca3af'} strokeWidth="3" opacity={ringing ? 0.7 : 1} />
      <path d="M35 25l-5-5M65 25l5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <text x="50" y="60" textAnchor="middle" fontSize="16" fontFamily="monospace" fontWeight="700" fill="#fff">{txt}</text>
      <text x="50" y="78" textAnchor="middle" fontSize="9" fill="#fff" opacity="0.7">{ringing ? '⏰ 알람!' : 'ALARM'}</text>
    </svg>
  );
}

/** live_stock — 주가/환율/코인 (placeholder API) */
function LiveStock({ cube }: { cube: Cube }) {
  const [_, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force((x) => x + 1), 30_000); return () => clearInterval(i); }, []);
  void _;
  const symbol = (cube.action_payload?.symbol as string) ?? 'BTC';
  const price = (cube.action_payload?.price as number) ?? 0;
  const changePct = (cube.action_payload?.change_pct as number) ?? 0;
  const up = changePct >= 0;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <text x="50" y="30" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">{symbol}</text>
      <text x="50" y="55" textAnchor="middle" fontSize="14" fontFamily="monospace" fontWeight="600" fill="#fff">{price.toLocaleString()}</text>
      <text x="50" y="78" textAnchor="middle" fontSize="12" fontWeight="700" fill={up ? '#22c55e' : '#ef4444'}>
        {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
      </text>
    </svg>
  );
}

/** live_calendar — 다음 일정 (placeholder, 사용자 ICS 연동) */
function LiveCalendar() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <rect x="20" y="20" width="60" height="60" rx="6" fill="transparent" stroke="#fff" strokeWidth="3" />
      <rect x="20" y="20" width="60" height="14" rx="6" fill="#3b82f6" />
      <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">15</text>
      <text x="50" y="72" textAnchor="middle" fontSize="9" fill="#fff" opacity="0.7">다음 일정</text>
    </svg>
  );
}

/** live_news — RSS 헤드라인 (placeholder) */
function LiveNews() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <rect x="15" y="25" width="70" height="50" rx="3" fill="transparent" stroke="#fff" strokeWidth="2" />
      <path d="M20 35h60M20 45h60M20 55h45M20 65h50" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <circle cx="78" cy="22" r="4" fill="#ef4444" />
      <text x="78" y="25" textAnchor="middle" fontSize="6" fontWeight="700" fill="#fff">!</text>
    </svg>
  );
}

/** live_network — Wi-Fi 신호 강도 (placeholder) */
function LiveNetwork() {
  const [strength, setStrength] = useState(3);
  useEffect(() => {
    const i = setInterval(() => setStrength(Math.floor(Math.random() * 4) + 1), 5000);
    return () => clearInterval(i);
  }, []);
  const arcs = [
    { r: 30, on: strength >= 4 },
    { r: 20, on: strength >= 3 },
    { r: 12, on: strength >= 2 },
  ];
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      {arcs.map((a, i) => (
        <path
          key={i}
          d={`M ${50 - a.r} 65 A ${a.r} ${a.r} 0 0 1 ${50 + a.r} 65`}
          stroke={a.on ? '#22c55e' : '#374151'}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <circle cx="50" cy="68" r="4" fill={strength >= 1 ? '#22c55e' : '#374151'} />
      <text x="50" y="85" textAnchor="middle" fontSize="9" fill="#fff" opacity="0.7">WIFI {strength}/4</text>
    </svg>
  );
}
