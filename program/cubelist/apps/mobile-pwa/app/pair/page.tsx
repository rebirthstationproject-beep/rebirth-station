'use client';

import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { parsePairingQr, generateDeviceFingerprint, PairingError } from '@/lib/pairing';
import { getSupabase } from '@/lib/supabase';
import { saveHelperCredentials } from '@/lib/credentials';
import { useToast } from '@/lib/toast/useToast';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';

const PAIR_COPY = {
  ko: {
    brand: '리버스 스테이션',
    title: '기기 페어링',
    sub: 'PC 헬퍼 화면에 표시된 QR 코드를 스캔해주세요',
    startScan: 'QR 스캔 시작',
    verifying: '검증 중…',
    successTitle: '페어링 완료',
    successSub: '큐브 리스트로 돌아가서 큐브를 눌러보세요',
    openList: '큐브 리스트 열기',
    errorTitle: '페어링 실패',
    errorCode: '코드',
    retry: '다시 시도',
    cameraDenied:
      '카메라 권한이 차단되어 있습니다. 브라우저 설정에서 카메라 접근을 허용한 뒤 다시 시도하세요.',
    cameraDeniedToast: '카메라 권한이 차단되어 QR 스캔을 시작할 수 없습니다',
    helperTitle: 'PC 헬퍼가 아직 없나요?',
    helperBody: '페어링하려면 먼저 PC에 큐브 리스트 헬퍼를 설치해야 합니다.',
    helperWindows: '🪟 Windows 감지 — PC 헬퍼 (Tauri v2 + Rust)는 Stage 2 진입 시 EV 코드 사이닝과 함께 배포됩니다.',
    helperMac: '🍎 macOS — Windows 1차 배포 후 Phase 2에서 지원 예정입니다.',
    helperLinux: '🐧 Linux — 정식 빌드는 Phase 2 이후. 그동안 소스 빌드 가능합니다.',
    helperOther: '현재 디바이스에서 OS를 감지하지 못했습니다. PC(Windows·Mac)에서 다시 시도하세요.',
    helperDevNote: '공식 빌드 배포 전까지 페어링은 개발자 모드에서만 가능합니다.',
  },
  en: {
    brand: 'Rebirth Station',
    title: 'Device pairing',
    sub: 'Scan the QR code shown on the PC helper.',
    startScan: 'Start QR scan',
    verifying: 'Verifying…',
    successTitle: 'Pairing complete',
    successSub: 'Return to Cube List and tap a cube.',
    openList: 'Open Cube List',
    errorTitle: 'Pairing failed',
    errorCode: 'Code',
    retry: 'Try again',
    cameraDenied:
      'Camera access is blocked. Allow camera in your browser settings, then try again.',
    cameraDeniedToast: 'Cannot start QR scan — camera access is blocked.',
    helperTitle: 'No PC helper yet?',
    helperBody: 'You need the Cube List helper installed on your PC first.',
    helperWindows: '🪟 Windows detected — PC helper (Tauri v2 + Rust) ships with EV signing when Stage 2 lands.',
    helperMac: '🍎 macOS — supported after the Windows 1st rollout in Phase 2.',
    helperLinux: '🐧 Linux — official builds after Phase 2. Source builds available meanwhile.',
    helperOther: 'Could not detect the OS. Open this page on a PC (Windows / Mac).',
    helperDevNote: 'Until the official binary ships, pairing only works in dev mode.',
  },
  ja: {
    brand: 'リバース・ステーション',
    title: 'デバイス ペアリング',
    sub: 'PC ヘルパー画面に表示された QR コードをスキャンしてください',
    startScan: 'QR スキャン開始',
    verifying: '検証中…',
    successTitle: 'ペアリング完了',
    successSub: 'キューブ・リストに戻ってキューブを押してみてください',
    openList: 'キューブ・リストを開く',
    errorTitle: 'ペアリング失敗',
    errorCode: 'コード',
    retry: 'もう一度',
    cameraDenied:
      'カメラのアクセスがブロックされています。ブラウザ設定でカメラを許可してから再度お試しください。',
    cameraDeniedToast: 'カメラのアクセスがブロックされているため QR スキャンを開始できません',
    helperTitle: 'PC ヘルパーがまだ無いですか?',
    helperBody: 'ペアリングには先に PC にキューブ・リスト ヘルパーをインストールしてください。',
    helperWindows: '🪟 Windows を検出 — PC ヘルパー (Tauri v2 + Rust) は Stage 2 進入時に EV コード署名と共に配布されます。',
    helperMac: '🍎 macOS — Windows 1次リリース後、Phase 2 でサポート予定です。',
    helperLinux: '🐧 Linux — 正式ビルドは Phase 2 以降。それまではソースビルドが可能です。',
    helperOther: '現在のデバイスで OS を検出できませんでした。PC (Windows・Mac) で再度お試しください。',
    helperDevNote: '公式バイナリ配布まで、ペアリングは開発者モードでのみ動作します。',
  },
} as const;

type Step = 'idle' | 'scanning' | 'verifying' | 'success' | 'error';

interface ErrorState {
  code: string;
  message: string;
}

export default function PairPage() {
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<ErrorState | null>(null);
  const { showToast } = useToast();
  const { locale } = useTranslation();
  const t = PAIR_COPY[locale] ?? PAIR_COPY.ko;

  // FD — 성공 step 진입 시 1회 Toast 자동 안내
  useEffect(() => {
    if (step !== 'success') return;
    showToast({
      level: 'success',
      message:
        locale === 'en'
          ? 'Pairing complete · This device is now linked to your account.'
          : locale === 'ja'
            ? 'ペアリング完了 · このデバイスがアカウントに紐付けされました。'
            : '페어링 완료 · 이 기기가 계정에 연결되었습니다.',
      duration: 5_000,
    });
  }, [step, locale, showToast]);

  // 카메라 권한 사전 점검 — 스캔 시작 전 명시적 안내
  async function startScan(): Promise<void> {
    setError(null);
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      try {
        const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (status.state === 'denied') {
          setError({
            code: 'camera_denied',
            message: t.cameraDenied,
          });
          setStep('error');
          showToast({
            level: 'warning',
            message: t.cameraDeniedToast,
            duration: 5_000,
          });
          return;
        }
      } catch {
        // Permissions API 미지원 — 스캐너가 직접 요청
      }
    }
    setStep('scanning');
  }

  useEffect(() => {
    if (step !== 'scanning') return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 240, height: 240 }, rememberLastUsedCamera: true },
      false,
    );

    scanner.render(
      async (decoded) => {
        scanner.clear().catch(() => undefined);
        setStep('verifying');

        try {
          const payload = parsePairingQr(decoded);
          const fingerprint = await generateDeviceFingerprint();
          const supabase = getSupabase();
          const { data: session } = await supabase.auth.getSession();
          if (!session?.session) {
            throw new PairingError('edge_function_failed', '로그인이 필요합니다');
          }

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pair-device`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${session.session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                payload,
                client_fingerprint: fingerprint,
              }),
            },
          );

          if (!res.ok) {
            const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            throw new PairingError('edge_function_failed', body.error ?? 'unknown');
          }

          const { device_id, hmac_secret_hex } = await res.json();
          const secretBytes = hexToBytes(hmac_secret_hex);
          await saveHelperCredentials({
            deviceId: device_id,
            secret: secretBytes.buffer.slice(
              secretBytes.byteOffset,
              secretBytes.byteOffset + secretBytes.byteLength,
            ) as ArrayBuffer,
          });

          setStep('success');
        } catch (e) {
          const err = e as PairingError | Error;
          setError({
            code: (err as PairingError).code ?? 'unknown',
            message: err.message,
          });
          setStep('error');
        }
      },
      () => {
        /* QR 인식 중 — 무시 */
      },
    );

    return () => {
      scanner.clear().catch(() => undefined);
    };
  }, [step]);

  return (
    <main className="min-h-screen p-6 flex flex-col items-center">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher size="compact" />
      </div>
      <header className="mb-8 text-center">
        <p className="text-xs text-rbs-accent-strong mb-1">{t.brand}</p>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-sm text-ink-muted mt-2">{t.sub}</p>
      </header>

      {step === 'idle' && (
        <>
          <button
            type="button"
            onClick={() => void startScan()}
            className="bg-rbs-accent text-white px-6 py-3 rounded-xl font-medium"
          >
            {t.startScan}
          </button>
          <HelperDownloadHint locale={locale} />
        </>
      )}

      {step === 'scanning' && (
        <div className="w-full max-w-sm">
          <div id="qr-reader" />
        </div>
      )}

      {step === 'verifying' && (
        <p className="text-ink-muted animate-pulse">{t.verifying}</p>
      )}

      {step === 'success' && (
        <div className="text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-medium mb-1">{t.successTitle}</p>
          <p className="text-sm text-ink-muted">{t.successSub}</p>
          <a
            href="/list"
            className="mt-6 inline-block bg-rbs-accent text-white px-5 py-2 rounded-xl"
          >
            {t.openList}
          </a>
        </div>
      )}

      {step === 'error' && error && (
        <div className="text-center max-w-sm">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="font-medium mb-1">{t.errorTitle}</p>
          <p className="text-sm text-ink-muted mb-1">{error.message}</p>
          <p className="text-xs text-ink-muted mb-4">
            {t.errorCode}: {error.code}
          </p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep('idle');
            }}
            className="bg-gray-100 px-4 py-2 rounded-lg text-sm"
          >
            {t.retry}
          </button>
        </div>
      )}
    </main>
  );
}

/**
 * PC 헬퍼 다운로드 안내 — Stage 1에서는 배포 URL 미확정.
 * OS 감지하여 안내 텍스트만 노출. 실제 다운로드 URL은 운영팀이 결정 후 채움.
 */
function HelperDownloadHint({ locale }: { locale: 'ko' | 'en' | 'ja' }) {
  const [os, setOs] = useState<'windows' | 'mac' | 'linux' | 'other'>('other');
  const t = PAIR_COPY[locale] ?? PAIR_COPY.ko;
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('windows')) setOs('windows');
    else if (ua.includes('mac')) setOs('mac');
    else if (ua.includes('linux')) setOs('linux');
  }, []);

  return (
    <section className="mt-8 w-full max-w-sm border border-border rounded-xl p-4 bg-surface text-sm">
      <h2 className="font-semibold mb-2">{t.helperTitle}</h2>
      <p className="text-xs text-ink-muted mb-3">{t.helperBody}</p>
      <div className="flex flex-col gap-1.5 text-xs">
        {os === 'windows' && (
          <p className="px-2 py-1.5 rounded-md bg-rbs-accent-soft text-rbs-accent-strong dark:bg-rbs-accent/15 dark:text-rbs-accent">
            {t.helperWindows}
          </p>
        )}
        {os === 'mac' && (
          <p className="px-2 py-1.5 rounded-md bg-surface-2 text-ink-muted">{t.helperMac}</p>
        )}
        {os === 'linux' && (
          <p className="px-2 py-1.5 rounded-md bg-surface-2 text-ink-muted">{t.helperLinux}</p>
        )}
        {os === 'other' && (
          <p className="px-2 py-1.5 rounded-md bg-surface-2 text-ink-muted">{t.helperOther}</p>
        )}
        <p className="text-[10px] text-ink-muted mt-1">{t.helperDevNote}</p>
      </div>
    </section>
  );
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
