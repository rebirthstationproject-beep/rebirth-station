/**
 * R3-2: Open-Meteo 날씨 클라이언트 — 무료·키 불필요.
 *
 * API: https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=temperature_2m,weather_code
 * 캐시: 좌표별 10분 메모리 캐시. 실패 시 마지막 값 유지.
 * WMO weather_code → 6종 상태 매핑.
 */

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'foggy';

export interface WeatherData {
  readonly temp_c: number;
  readonly condition: WeatherCondition;
  readonly location_label?: string;
  /** fetch 성공 시각 epoch ms */
  readonly fetched_at: number;
}

/** WMO weather_code → WeatherCondition */
function mapWeatherCode(code: number): WeatherCondition {
  if (code === 0 || code === 1) return 'sunny';
  if (code === 2 || code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'foggy';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snowy';
  if (code >= 95) return 'stormy';
  return 'cloudy';
}

interface CacheEntry {
  data: WeatherData;
  expires_at: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10분
const cache = new Map<string, CacheEntry>();
// 실패 시 유지할 마지막 값
const lastGood = new Map<string, WeatherData>();

function cacheKey(lat: number, lon: number): string {
  // 소수점 2자리로 정규화 (100m 내 동일 캐시)
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  location_label?: string,
): Promise<WeatherData | null> {
  const key = cacheKey(latitude, longitude);
  const now = Date.now();

  // 캐시 히트
  const cached = cache.get(key);
  if (cached && now < cached.expires_at) {
    return cached.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const temp_c = json.current?.temperature_2m ?? 0;
    const condition = mapWeatherCode(json.current?.weather_code ?? 0);
    const data: WeatherData = { temp_c, condition, location_label, fetched_at: now };
    cache.set(key, { data, expires_at: now + CACHE_TTL_MS });
    lastGood.set(key, data);
    return data;
  } catch {
    // 실패: 마지막 값 유지
    return lastGood.get(key) ?? null;
  }
}
