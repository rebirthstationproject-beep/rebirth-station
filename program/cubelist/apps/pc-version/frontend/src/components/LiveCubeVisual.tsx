/**
 * 큐브 셀 라이브 비주얼 (R3 실데이터, 2026-06-10) — 순수 렌더러.
 *
 * 내부 setInterval 전면 제거 (R1-3 유지).
 * nowMs props 를 그리드 컨테이너에서 받아 렌더. 없으면 Date.now() 1회 폴백.
 *
 * R3-1: live_monitor / live_gauge / live_network → useSystemMetrics 실데이터 소비.
 *         sin 파동·난수 코드 제거.
 *         브라우저 dev (metrics=null) 시 "DEV" 표기 (가짜 움직임 금지).
 * R3-2: live_weather → Open-Meteo 실데이터 (fetchWeather).
 *         좌표 미설정 시 "위치 설정 필요" 표기.
 * R3-4: live_stock / live_calendar / live_news → "설정 필요" 정직 상태 표기.
 *         payload 에 수동 입력값이 있는 live_stock 은 입력값 그대로 표시.
 */

import { useEffect, useState } from 'react';
import type { Cube } from '../types/cube';
import { useSystemMetrics } from '../lib/system-metrics';
import { fetchWeather, type WeatherData } from '../lib/weather';

export interface LiveCubeVisualProps {
  readonly cube: Cube;
  /** 중앙 tick ms (useDynamicCubes 에서 전달). 없으면 Date.now() 폴백. */
  readonly nowMs?: number;
}

export function LiveCubeVisual({ cube, nowMs }: LiveCubeVisualProps) {
  const now = nowMs ?? Date.now();
  switch (cube.action_type) {
    case 'live_clock':
      return <LiveClock cube={cube} nowMs={now} />;
    case 'live_timer':
      return <LiveTimer cube={cube} nowMs={now} />;
    case 'live_battery':
      return <LiveBattery cube={cube} />;
    case 'live_gauge':
      return <LiveGauge cube={cube} />;
    case 'live_weather':
      return <LiveWeather cube={cube} />;
    case 'live_monitor':
      return <LiveMonitor cube={cube} />;
    case 'live_alarm':
      return <LiveAlarm cube={cube} nowMs={now} />;
    case 'live_stock':
      return <LiveStock cube={cube} />;
    case 'live_calendar':
      return <LiveCalendarPlaceholder />;
    case 'live_news':
      return <LiveNewsPlaceholder />;
    case 'live_network':
      return <LiveNetwork cube={cube} />;
    default:
      return null;
  }
}

// ============================================================================
// live_clock
// ============================================================================

/** live_clock — analog 시계 SVG 또는 디지털 큰 글씨 */
function LiveClock({ cube, nowMs }: { cube: Cube; nowMs: number }) {
  const now = new Date(nowMs);
  // 'HH:MM' 형식(구 저장값) → 'HH:mm' 로 정규화해 처리
  const rawFmt = (cube.action_payload?.format as string | undefined) ?? 'HH:mm';
  const format = rawFmt === 'HH:MM' ? 'HH:mm' : rawFmt === 'HH:MM:SS' ? 'HH:mm:ss' : rawFmt;
  if (format === 'analog') return <AnalogClock now={now} />;
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const pad = (n: number) => String(n).padStart(2, '0');
  let txt: string;
  if (format === 'HH:mm:ss') txt = `${pad(h)}:${pad(m)}:${pad(s)}`;
  else if (format === 'h:mm AM/PM' || format === 'h:MM AM/PM') {
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

// ============================================================================
// live_timer
// ============================================================================

/** live_timer — 카운트다운 MM:SS 또는 progress ring */
function LiveTimer({ cube, nowMs }: { cube: Cube; nowMs: number }) {
  const duration = (cube.action_payload?.duration_seconds as number | undefined) ?? 1500;
  const targetMs = (cube.action_payload?.target_ms as number | undefined) ?? null;
  const remaining = targetMs ? Math.max(0, Math.floor((targetMs - nowMs) / 1000)) : duration;
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

// ============================================================================
// live_battery
// ============================================================================

/** live_battery — 배터리 사각형 + % (navigator.getBattery 직접 읽기 유지) */
function LiveBattery({ cube }: { cube: Cube }) {
  // 배터리는 비동기 system 값 → useDynamicCubes 가 payload._cached_level 에 캐싱한 값 사용
  const payload = cube.action_payload as Record<string, unknown>;
  const cachedLevel = typeof payload._cached_level === 'number' ? payload._cached_level : null;
  const manualLevel = typeof payload.manual_level === 'number' ? payload.manual_level : null;
  const level = cachedLevel ?? manualLevel ?? 0.85;
  const p = Math.round(Math.max(0, Math.min(1, level)) * 100);
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

// ============================================================================
// live_gauge — R3-1 실데이터 (source=cpu|ram|disk)
// ============================================================================

/** live_gauge — 원형 게이지 + 수치 (R3-1 실데이터) */
function LiveGauge({ cube }: { cube: Cube }) {
  const metrics = useSystemMetrics((s) => s.metrics);
  const source = (cube.action_payload?.source as string | undefined) ?? 'cpu';

  let value: number | null = null;
  if (metrics) {
    if (source === 'cpu') value = Math.round(metrics.cpu_percent);
    else if (source === 'ram')
      value = metrics.ram_total_mb > 0
        ? Math.round((metrics.ram_used_mb / metrics.ram_total_mb) * 100)
        : null;
    else if (source === 'disk')
      value = metrics.disk_total_gb > 0
        ? Math.round((metrics.disk_used_gb / metrics.disk_total_gb) * 100)
        : null;
    // 다른 source 는 수동 payload 값 사용
    if (value === null) {
      const payloadVal = cube.action_payload?.value;
      value = typeof payloadVal === 'number' ? payloadVal : 0;
    }
  }

  if (value === null) {
    return <DevPlaceholder label={source.toUpperCase()} />;
  }

  const ratio = value / 100;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-label="게이지">
      <circle cx="50" cy="55" r="38" fill="transparent" stroke="#333" strokeWidth="8"
        strokeDasharray={`${Math.PI * 38} ${Math.PI * 38 * 2}`}
        transform="rotate(-180 50 55)" strokeLinecap="round" />
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

// ============================================================================
// live_weather — R3-2 Open-Meteo 실데이터
// ============================================================================

const WEATHER_ICON: Record<string, string> = {
  sunny: '☀', cloudy: '☁', rainy: '🌧', snowy: '❄', stormy: '⛈', foggy: '🌫',
};

/** live_weather — Open-Meteo 실데이터 (R3-2) */
function LiveWeather({ cube }: { cube: Cube }) {
  const lat = cube.action_payload?.latitude as number | undefined;
  const lon = cube.action_payload?.longitude as number | undefined;
  const locationLabel = cube.action_payload?.location_label as string | undefined;

  const [data, setData] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (lat === undefined || lon === undefined) return;
    let cancelled = false;
    fetchWeather(lat, lon, locationLabel).then((w) => {
      if (!cancelled) setData(w);
    });
    return () => { cancelled = true; };
  }, [lat, lon, locationLabel]);

  if (lat === undefined || lon === undefined) {
    return <NeedsSetup label="위치 설정 필요" />;
  }

  if (!data) {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <text x="50" y="55" textAnchor="middle" fontSize="11" fill="#888">불러오는 중…</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <text x="50" y="52" textAnchor="middle" fontSize="38">{WEATHER_ICON[data.condition] ?? '☀'}</text>
      <text x="50" y="75" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">
        {data.temp_c.toFixed(1)}°C
      </text>
      {(data.location_label || locationLabel) && (
        <text x="50" y="90" textAnchor="middle" fontSize="9" fill="#aaa">
          {data.location_label ?? locationLabel}
        </text>
      )}
    </svg>
  );
}

// ============================================================================
// live_monitor — R3-1 실데이터 (cpu/ram/disk/network)
// ============================================================================

/** live_monitor — CPU/RAM/Disk/Network (R3-1 실데이터) */
function LiveMonitor({ cube }: { cube: Cube }) {
  const metrics = useSystemMetrics((s) => s.metrics);
  const source = (cube.action_payload?.source as string) ?? 'cpu';

  if (!metrics) {
    return <DevPlaceholder label={source === 'cpu' ? 'CPU' : source === 'ram' ? 'RAM' : source === 'disk' ? 'DSK' : 'NET'} />;
  }

  let val: number;
  let subLabel: string;

  if (source === 'cpu') {
    val = Math.round(metrics.cpu_percent);
    subLabel = 'CPU';
  } else if (source === 'ram') {
    val = metrics.ram_total_mb > 0 ? Math.round((metrics.ram_used_mb / metrics.ram_total_mb) * 100) : 0;
    subLabel = 'RAM';
  } else if (source === 'disk') {
    val = metrics.disk_total_gb > 0 ? Math.round((metrics.disk_used_gb / metrics.disk_total_gb) * 100) : 0;
    subLabel = 'DSK';
  } else {
    // network → 수신 kbps 표시
    val = Math.min(100, Math.round((metrics.network_rx_kbps / 1024) * 100)); // 1 Mbps = 100%
    subLabel = 'NET';
  }

  const color = val > 80 ? '#ef4444' : val > 50 ? '#f59e0b' : '#22c55e';
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <text x="50" y="30" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff" opacity="0.7">{subLabel}</text>
      <rect x="15" y="40" width="70" height="20" rx="3" fill="transparent" stroke="#444" strokeWidth="2" />
      <rect x="17" y="42" width={Math.max(0, (val / 100) * 66)} height="16" rx="2" fill={color} />
      <text x="50" y="80" textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">{val}%</text>
    </svg>
  );
}

// ============================================================================
// live_alarm
// ============================================================================

/** live_alarm — 카운트다운 (목표 시각 도달 시 색깔 변경) */
function LiveAlarm({ cube, nowMs }: { cube: Cube; nowMs: number }) {
  const target = (cube.action_payload?.target_ms as number) ?? (nowMs + 300_000);
  const remaining = Math.max(0, Math.floor((target - nowMs) / 1000));
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

// ============================================================================
// live_stock — R3-4: payload 수동값 표시 (데이터소스 미정 정직 상태)
// ============================================================================

/** live_stock — R3-4: payload 에 값이 있으면 표시 (수동), 없으면 "설정 필요" */
function LiveStock({ cube }: { cube: Cube }) {
  const symbol = cube.action_payload?.symbol as string | undefined;
  const price = cube.action_payload?.price as number | undefined;
  const changePct = cube.action_payload?.change_pct as number | undefined;

  // symbol이 없으면 "설정 필요"
  if (!symbol) {
    return <NeedsSetup label="설정 필요" />;
  }

  // 수동 입력값 표시 (수동 뉘앙스 유지)
  const p = price ?? 0;
  const chg = changePct ?? 0;
  const up = chg >= 0;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <text x="50" y="25" textAnchor="middle" fontSize="8" fill="#888" opacity="0.8">수동</text>
      <text x="50" y="38" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">{symbol}</text>
      <text x="50" y="58" textAnchor="middle" fontSize="14" fontFamily="monospace" fontWeight="600" fill="#fff">{p.toLocaleString()}</text>
      <text x="50" y="78" textAnchor="middle" fontSize="12" fontWeight="700" fill={up ? '#22c55e' : '#ef4444'}>
        {up ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
      </text>
    </svg>
  );
}

// ============================================================================
// live_calendar, live_news — R3-4 정직 상태 표기
// ============================================================================

/** live_calendar — R3-4: 데이터 소스 미정 → 설정 필요 */
function LiveCalendarPlaceholder() {
  return <NeedsSetup label="설정 필요" />;
}

/** live_news — R3-4: 데이터 소스 미정 → 설정 필요 */
function LiveNewsPlaceholder() {
  return <NeedsSetup label="설정 필요" />;
}

// ============================================================================
// live_network — R3-1 실데이터
// ============================================================================

/** live_network — Wi-Fi 신호 강도 (R3-1 실데이터: network_rx_kbps) */
function LiveNetwork({ cube: _cube }: { cube: Cube }) {
  const metrics = useSystemMetrics((s) => s.metrics);

  if (!metrics) {
    return <DevPlaceholder label="NET" />;
  }

  // rx_kbps → 0~4 강도 (0~64=1, 64~512=2, 512~2048=3, 2048+=4)
  const rx = metrics.network_rx_kbps;
  const strength = rx >= 2048 ? 4 : rx >= 512 ? 3 : rx >= 64 ? 2 : rx > 0 ? 1 : 0;

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
      <text x="50" y="85" textAnchor="middle" fontSize="9" fill="#fff" opacity="0.7">
        {rx >= 1024 ? `${(rx / 1024).toFixed(1)}M` : `${Math.round(rx)}K`} ↓
      </text>
    </svg>
  );
}

// ============================================================================
// 공통 헬퍼 컴포넌트
// ============================================================================

/** DEV 표기 — 브라우저 dev 환경에서 metrics=null 시 표시 (가짜 값 금지) */
function DevPlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <text x="50" y="38" textAnchor="middle" fontSize="12" fontWeight="700" fill="#666">{label}</text>
      <text x="50" y="58" textAnchor="middle" fontSize="10" fill="#555">dev</text>
    </svg>
  );
}

/** 설정 필요 — 데이터 소스 미설정 시 표시 (R3-4) */
function NeedsSetup({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <text x="50" y="48" textAnchor="middle" fontSize="9" fill="#888">{label}</text>
      <text x="50" y="62" textAnchor="middle" fontSize="8" fill="#555">인스펙터에서 설정</text>
    </svg>
  );
}
