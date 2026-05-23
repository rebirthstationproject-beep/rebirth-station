import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NextResponse } from 'next/server';

const ALLOWED_FILE = /^[a-z0-9_-]+\.(cubeone|cubelist|cubepack)$/i;

type ApiLocale = 'ko' | 'en' | 'ja';

const API_MESSAGES: Record<ApiLocale, { invalid: string; notFound: string }> = {
  ko: { invalid: '잘못된 파일명입니다', notFound: '시드를 찾을 수 없습니다' },
  en: { invalid: 'invalid file name', notFound: 'not found' },
  ja: { invalid: '不正なファイル名です', notFound: 'シードが見つかりません' },
};

function detectLocaleFromHeader(req: Request): ApiLocale {
  const accept = req.headers.get('accept-language') ?? '';
  // RFC-7231 단순 파싱 — 우선순위(q)는 무시, 첫 매칭 사용
  const tags = accept.toLowerCase().split(',').map((t) => t.trim().split(';')[0]);
  for (const tag of tags) {
    if (tag.startsWith('ko')) return 'ko';
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('en')) return 'en';
  }
  return 'ko';
}

/**
 * 시드 파일 서빙 — `data/seeds/` 정적 파일을 클라이언트에 노출.
 *
 * 정착본
 * - 정적 카탈로그 자산만 (사용자 업로드 X)
 * - 파일명 화이트리스트로 path traversal 차단
 * - 시드 라이선스는 index.json에서 사전 명시
 *
 * Stage 2 vitest 단위 테스트 BLOCKED (OV) — 9개 케이스 + Vitest 패턴 예시는 `docs/api-test-guide.md` 정리됨.
 * VZ 동기화: 활성화 트리거는 apps/web `package.json` vitest 설치 + CI 워크플로 진입 시 (night-auto-log VU 표 참조).
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ file: string }> },
): Promise<NextResponse> {
  const { file } = await context.params;
  const locale = detectLocaleFromHeader(req);
  const m = API_MESSAGES[locale];
  if (!ALLOWED_FILE.test(file)) {
    return new NextResponse(m.invalid, {
      status: 400,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'content-language': locale,
        // 악성·오타 요청 — 캐시 금지
        'cache-control': 'no-store',
      },
    });
  }

  try {
    const seedsDir = resolve(process.cwd(), '..', '..', 'data', 'seeds');
    const path = resolve(seedsDir, file);
    // defense in depth — 정규식 + resolved path가 seeds 디렉토리 안인지 추가 검증
    if (!path.startsWith(seedsDir + (process.platform === 'win32' ? '\\' : '/'))) {
      return new NextResponse(m.invalid, {
        status: 400,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
    // v3 ZIP 컨테이너 바이너리 서빙 (file-format-spec v3)
    const buf = readFileSync(path);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'content-type': 'application/vnd.rebirthstation.cubelist+zip',
        'cache-control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse(m.notFound, {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'content-language': locale,
        // negative cache 5분 — 시드 추가/제거 반영 지연 한도
        'cache-control': 'public, max-age=300',
      },
    });
  }
}
