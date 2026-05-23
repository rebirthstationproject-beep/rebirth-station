/**
 * Import 전 dry-run 미리보기.
 *
 * 정착본
 * - 사용자가 외부 .cubeone/.cubelist/.cubepack 파일을 받을 때 무엇이 추가될지
 *   미리 확인할 수 있어야 한다 (보안 + UX).
 * - DB insert 없이 파일을 파싱·검증한 결과만 반환.
 */

import { parseAndValidate, CubeFormatError } from './validate';
import type {
  AnyCubeFile,
  CubeBodyDto,
  CubeFileKind,
  CubeListFile,
  CubeOneFile,
  CubePackFile,
} from './spec';

export interface DryRunPreview {
  success: boolean;
  kind?: CubeFileKind;
  boardCount: number;
  cubeCount: number;
  boards: PreviewBoard[];
  warnings: PreviewWarning[];
  meta: {
    author?: string;
    license?: string;
    rbsFormatVersion?: number;
  };
  reason?: string;
}

export interface PreviewBoard {
  name: string;
  description?: string;
  cubes: PreviewCube[];
}

export interface PreviewCube {
  label: string;
  // SD-AQ~AV (2026-05-23): 10 enum 확장
  actionType:
    | 'link'
    | 'shortcut'
    | 'macro'
    | 'folder'
    | 'text_insert'
    | 'clipboard_copy'
    | 'app_launch'
    | 'focus_window'
    | 'mouse_click'
    | 'plugin_action';
  /** 한 줄 요약 (예: "https://example.com 열기", "Ctrl+C 입력", "4단계 매크로") */
  summary: string;
  /** 큐브 단위 경고 (외부 도메인 등) */
  warnings: string[];
}

export interface PreviewWarning {
  level: 'info' | 'warning' | 'error';
  message: string;
}

/**
 * raw text → 검증 + 미리보기 데이터 추출 (DB 접근 X).
 */
export function dryRunImport(raw: string): DryRunPreview {
  let file: AnyCubeFile;
  try {
    file = parseAndValidate(raw);
  } catch (e) {
    return {
      success: false,
      boardCount: 0,
      cubeCount: 0,
      boards: [],
      warnings: [],
      meta: {},
      reason:
        e instanceof CubeFormatError
          ? `${e.code}: ${e.message}`
          : (e as Error).message,
    };
  }

  switch (file.kind) {
    case 'cubeone':
      return previewCubeOne(file);
    case 'cubelist':
      return previewCubeList(file);
    case 'cubepack':
      return previewCubePack(file);
  }
}

function previewCubeOne(file: CubeOneFile): DryRunPreview {
  const cube = previewCube(file.cube);
  return {
    success: true,
    kind: 'cubeone',
    boardCount: 0,
    cubeCount: 1,
    boards: [
      {
        name: '(단일 큐브)',
        cubes: [cube],
      },
    ],
    warnings: collectFileWarnings(file),
    meta: {
      author: file.author,
      license: file.license,
      rbsFormatVersion: file.rbs_format_version,
    },
  };
}

function previewCubeList(file: CubeListFile): DryRunPreview {
  // v3: order 배열만 있는 경우 큐브 내용 미리보기 불가 (ZIP 내부 파일 필요)
  const cubes = (file.list.cubes ?? []).map(previewCube);
  const orderCount = file.list.order?.length ?? 0;
  const warnings = collectFileWarnings(file);
  if (orderCount > 0 && cubes.length === 0) {
    warnings.push({
      level: 'info',
      message: `v3 ZIP 형식 — ${orderCount}개 큐브 참조 포함 (파일 선택 후 확정 시 추출됩니다)`,
    });
  }
  return {
    success: true,
    kind: 'cubelist',
    boardCount: 1,
    cubeCount: cubes.length || orderCount,
    boards: [
      {
        name: file.list.name,
        description: file.list.description,
        cubes,
      },
    ],
    warnings,
    meta: {
      author: file.author,
      license: file.license,
      rbsFormatVersion: file.rbs_format_version,
    },
  };
}

function previewCubePack(file: CubePackFile): DryRunPreview {
  // v3: order 배열만 있는 경우 lists 내용 미리보기 불가
  const boards: PreviewBoard[] = (file.pack.lists ?? []).map((list) => ({
    name: list.name,
    description: list.description,
    cubes: (list.cubes ?? []).map(previewCube),
  }));
  const orderCount = file.pack.order?.length ?? 0;
  const packWarnings = collectFileWarnings(file);
  if (orderCount > 0 && boards.length === 0) {
    packWarnings.push({
      level: 'info',
      message: `v3 ZIP 형식 — ${orderCount}개 리스트 참조 포함 (파일 선택 후 확정 시 추출됩니다)`,
    });
  }
  return {
    success: true,
    kind: 'cubepack',
    boardCount: boards.length || orderCount,
    cubeCount: boards.reduce((acc, b) => acc + b.cubes.length, 0),
    boards,
    warnings: packWarnings,
    meta: {
      author: file.author,
      license: file.license,
      rbsFormatVersion: file.rbs_format_version,
    },
  };
}

function previewCube(c: CubeBodyDto): PreviewCube {
  const warnings: string[] = [];
  let summary = '';

  switch (c.action_type) {
    case 'link': {
      const url = String((c.action_payload as Record<string, unknown>).url ?? '');
      summary = url ? `→ ${url} 열기` : '→ (URL 없음)';
      try {
        const u = new URL(url);
        if (!isTrustedDomain(u.host)) {
          warnings.push(`외부 도메인: ${u.host}`);
        }
      } catch {
        warnings.push('URL 형식이 올바르지 않습니다');
      }
      break;
    }
    case 'shortcut': {
      const keys = Array.isArray((c.action_payload as Record<string, unknown>).keys)
        ? ((c.action_payload as Record<string, unknown>).keys as string[])
        : [];
      summary = keys.length > 0 ? `→ ${keys.join('+')} 입력` : '→ (키 없음)';
      break;
    }
    case 'macro': {
      const steps = Array.isArray((c.action_payload as Record<string, unknown>).steps)
        ? ((c.action_payload as Record<string, unknown>).steps as Array<Record<string, unknown>>)
        : [];
      const kinds = steps.map((s) => s.kind).filter(Boolean);
      summary = `→ ${steps.length}단계 매크로 (${kinds.join(', ') || '비어있음'})`;
      // Tier 2/3 step 안내
      const hasTier2 = steps.some((s) => s.kind === 'launch_app' || s.kind === 'focus_window');
      if (hasTier2) {
        warnings.push('Tier 2 권한 필요 (앱 실행·창 포커스) — 첫 실행 시 동의 요청');
      }
      break;
    }
    case 'folder': {
      const cubeIds = Array.isArray((c.action_payload as Record<string, unknown>).cube_ids)
        ? ((c.action_payload as Record<string, unknown>).cube_ids as string[])
        : [];
      summary = `→ 폴더 (${cubeIds.length}개 아이템)`;
      break;
    }
  }

  return {
    label: c.label,
    actionType: c.action_type,
    summary,
    warnings,
  };
}

function collectFileWarnings(file: AnyCubeFile): PreviewWarning[] {
  const out: PreviewWarning[] = [];
  if (!file.author) {
    out.push({ level: 'info', message: '제작자가 표기되지 않은 파일입니다' });
  }
  if (file.license === 'proprietary') {
    out.push({
      level: 'info',
      message: '비공개 라이선스 파일입니다 (자사 콜라보 등)',
    });
  }
  if (file.license === 'free') {
    out.push({ level: 'info', message: '무료 라이선스 — 자유 재배포 가능' });
  }
  return out;
}

const TRUSTED_DOMAINS = [
  '주소모아.com',
  'xn--v52b19jw9czye.com',
  '케이링크.com',
  'xn--9y2bn4wuzfxpb.com',
  'rebirthstation.com',
  'thaipl365.com',
  'aiklink.com',
  'supabase.co',
  'github.com',
  'naver.com',
  'daum.net',
  'kakao.com',
  'google.com',
  'youtube.com',
];

function isTrustedDomain(host: string): boolean {
  const h = host.toLowerCase();
  return TRUSTED_DOMAINS.some((t) => h === t || h.endsWith(`.${t}`));
}
