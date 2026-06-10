/**
 * 페어링 (모바일 PWA 측)
 *
 * 회사: 리버스 스테이션 (Rebirth Station)
 * 정착본: docs/tech-review.md §4, §6 (Rust auth / Security)
 *
 * 흐름
 * 1. 모바일 PWA가 Supabase Auth로 로그인 (같은 계정 보장)
 * 2. PC 앱 화면의 QR 스캔 → PairingPayload 획득
 * 3. PairingPayload.otp_secret을 Supabase Edge Function `/pair-device`로 전송
 * 4. Edge Function이 user_devices에 등록 + HMAC secret 안전 채널로 전달
 * 5. PWA는 HMAC secret을 IndexedDB에 보관, 매 WS 연결마다 HMAC nonce 생성
 *
 * **주의**: HMAC secret은 절대 localStorage에 저장 금지 (XSS 노출).
 * IndexedDB + SubtleCrypto 비추출 키 사용.
 */

export interface PairingPayload {
  session_token: string;
  otp_secret: string;
  /** UNIX timestamp seconds */
  expires_at: number;
  device_fingerprint: string;
}

export class PairingError extends Error {
  constructor(public readonly code: PairingErrorCode, message: string) {
    super(message);
    this.name = 'PairingError';
  }
}

export type PairingErrorCode =
  | 'qr_parse_failed'
  | 'expired'
  | 'future_timestamp'
  | 'edge_function_failed'
  | 'fingerprint_mismatch';

const QR_TTL_SECONDS = 60;
const CLOCK_SKEW_SECONDS = 5;

/**
 * QR 스캔 결과(JSON 문자열) → PairingPayload + TTL 검증
 */
export function parsePairingQr(raw: string): PairingPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new PairingError('qr_parse_failed', (e as Error).message);
  }
  if (!isPairingPayload(parsed)) {
    throw new PairingError('qr_parse_failed', 'invalid pairing payload shape');
  }
  checkTtl(parsed);
  return parsed;
}

function isPairingPayload(v: unknown): v is PairingPayload {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.session_token === 'string' &&
    typeof o.otp_secret === 'string' &&
    typeof o.expires_at === 'number' &&
    typeof o.device_fingerprint === 'string'
  );
}

function checkTtl(p: PairingPayload): void {
  const now = Math.floor(Date.now() / 1000);
  if (p.expires_at < now) {
    throw new PairingError('expired', `payload expired ${now - p.expires_at}s ago`);
  }
  if (p.expires_at > now + QR_TTL_SECONDS + CLOCK_SKEW_SECONDS) {
    throw new PairingError('future_timestamp', 'payload from too far future');
  }
}

// ===========================================================================
// 기기 fingerprint (PWA 측)
// ===========================================================================

/**
 * 기기 fingerprint 생성 — userAgent + canvas 해시
 * 한 번 생성 후 IndexedDB에 보관, 같은 기기에서 재사용
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const ua = navigator.userAgent;
  const canvas = renderFingerprintCanvas();
  const data = new TextEncoder().encode(ua + '|' + canvas);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return hexEncode(new Uint8Array(digest));
}

function renderFingerprintCanvas(): string {
  // 캔버스가 없는 환경(SSR 등) 안전 처리
  if (typeof document === 'undefined') return 'no-canvas';
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'no-ctx';
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('큐브 리스트 fingerprint v1', 2, 2);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillRect(125, 1, 62, 20);
  return canvas.toDataURL();
}

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ===========================================================================
// HMAC 생성 (WS 연결 시)
// ===========================================================================

/**
 * HMAC-SHA256(secret, nonce || timestamp_ms || device_id)
 *
 * Rust 측 verify_hmac()과 동일 입력 정의. 바이트 표현은 timestamp_ms를
 * **big-endian 8바이트** 로 인코딩 (Rust to_be_bytes()와 일치).
 */
export async function computeHmacHex(
  secret: ArrayBuffer,
  nonce: string,
  timestampMs: number,
  deviceId: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // timestamp_ms를 big-endian 8바이트로 변환
  const tsBuf = new ArrayBuffer(8);
  const tsView = new DataView(tsBuf);
  // JavaScript number는 53-bit 정수 한계 → BigInt 사용
  tsView.setBigUint64(0, BigInt(timestampMs), false /* big-endian */);

  const encoder = new TextEncoder();
  const nonceBytes = encoder.encode(nonce);
  const deviceBytes = encoder.encode(deviceId);

  // 단일 ArrayBuffer로 결합 (subtle.sign이 한 번에 받음)
  const total = new Uint8Array(nonceBytes.length + 8 + deviceBytes.length);
  total.set(nonceBytes, 0);
  total.set(new Uint8Array(tsBuf), nonceBytes.length);
  total.set(deviceBytes, nonceBytes.length + 8);

  const sig = await crypto.subtle.sign('HMAC', key, total);
  return hexEncode(new Uint8Array(sig));
}

/**
 * nonce 생성 — 충분히 임의여야 함 (재사용 방지 캐시 우회 X)
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return hexEncode(bytes);
}
