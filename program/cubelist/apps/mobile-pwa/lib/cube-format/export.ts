/**
 * 큐브 / 리스트 → 파일 export (v3 ZIP 컨테이너)
 *
 * 정착본: docs/file-format-spec.md
 *
 * Stage 1 — 마켓플레이스 업로드 X. 사용자 백업·공유 트랙용.
 * v3: 모든 export 함수가 ZIP Blob 반환.
 */

import JSZip from 'jszip';
import type { CubeBoard, CubeItem } from '@/lib/types/cube';
import {
  RBS_FORMAT_VERSION,
  RBS_MIN_VERSION,
  type CubeListFile,
  type CubeOneFile,
  type CubePackFile,
} from './spec';

interface ExportOptions {
  author?: string;
  license?: CubeListFile['license'];
}

/**
 * 단일 큐브 → .cubeone ZIP Blob
 * ZIP 구조: manifest.json [+ icon.webp (icon_url fetch 성공 시)]
 */
export async function exportCubeOne(item: CubeItem, options: ExportOptions = {}): Promise<Blob> {
  const zip = new JSZip();

  const manifest: CubeOneFile = {
    $schema: 'https://rebirthstation.com/schemas/cube/v3.json',
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubeone',
    id: item.id,
    author: options.author,
    license: options.license ?? 'personal',
    created_at: item.created_at,
    updated_at: new Date().toISOString(),
    rbs_min_version: RBS_MIN_VERSION,
    cube: {
      label: item.label,
      icon_ref: item.icon_url ? 'icon.webp' : undefined,
      icon_url: item.icon_url ?? null,
      action_type: item.action_type,
      action_payload: item.action_payload,
    },
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  if (item.icon_url) {
    try {
      const res = await fetch(item.icon_url);
      if (res.ok) {
        const blob = await res.blob();
        zip.file('icon.webp', blob);
      }
    } catch {
      // 아이콘 fetch 실패 시 manifest만 포함 (icon_ref 제거)
      manifest.cube.icon_ref = undefined;
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * 보드 → .cubelist ZIP Blob
 * ZIP 구조: manifest.json + cubes/{sort_order}-{id}.cubeone
 * manifest.list.order 배열로 참조, v3 정착본.
 */
export async function exportCubeList(board: CubeBoard, options: ExportOptions = {}): Promise<Blob> {
  const zip = new JSZip();
  const sorted = [...board.items].sort((a, b) => a.sort_order - b.sort_order);

  const order: Array<{ ref: string; sort_order: number }> = [];

  for (const item of sorted) {
    const slug = `${item.sort_order}-${item.id.slice(0, 8)}`;
    const ref = `cubes/${slug}.cubeone`;
    order.push({ ref, sort_order: item.sort_order });

    // 각 .cubeone도 ZIP — 내부에서 exportCubeOne 호출
    const cubeBlob = await exportCubeOne(item, options);
    zip.file(ref, cubeBlob);
  }

  const manifest: CubeListFile = {
    $schema: 'https://rebirthstation.com/schemas/cube/v3.json',
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubelist',
    id: board.id,
    author: options.author,
    license: options.license ?? 'personal',
    created_at: board.created_at,
    updated_at: new Date().toISOString(),
    rbs_min_version: RBS_MIN_VERSION,
    list: {
      name: board.name,
      description: (board.metadata?.description as string | undefined) ?? undefined,
      order,
    },
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  return zip.generateAsync({ type: 'blob' });
}

interface ExportCubePackOptions extends ExportOptions {
  name: string;
  description?: string;
  target_persona?: string[];
  /** 묶음 ID (없으면 board id 첫 8자 + timestamp 조합) */
  id?: string;
}

/**
 * 복수 보드 → .cubepack ZIP Blob
 * ZIP 구조: manifest.json + lists/{board-name}.cubelist
 */
export async function exportCubePack(
  boards: CubeBoard[],
  options: ExportCubePackOptions,
): Promise<Blob> {
  if (boards.length === 0) {
    throw new Error('exportCubePack: at least one board required');
  }

  const zip = new JSZip();
  const now = new Date().toISOString();
  const order: Array<{ ref: string; sort_order: number }> = [];

  for (let i = 0; i < boards.length; i++) {
    const board = boards[i];
    const slug = `${i}-${board.name.replace(/[^a-z0-9가-힣_-]+/gi, '_').slice(0, 20)}`;
    const ref = `lists/${slug}.cubelist`;
    order.push({ ref, sort_order: i });

    const listBlob = await exportCubeList(board, options);
    zip.file(ref, listBlob);
  }

  const manifest: CubePackFile = {
    $schema: 'https://rebirthstation.com/schemas/cube/v3.json',
    rbs_format_version: RBS_FORMAT_VERSION,
    kind: 'cubepack',
    id: options.id ?? `${boards[0].id.slice(0, 8)}-${Date.now()}`,
    author: options.author,
    license: options.license ?? 'personal',
    created_at: now,
    updated_at: now,
    rbs_min_version: RBS_MIN_VERSION,
    pack: {
      name: options.name,
      description: options.description,
      target_persona: options.target_persona,
      order,
    },
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  return zip.generateAsync({ type: 'blob' });
}

/**
 * 브라우저에서 파일 다운로드 트리거.
 * v3: Blob을 직접 받음 (mime은 Blob 내부에 포함되어 있으나 filename용으로만 사용).
 */
export function downloadAsFile(filename: string, content: Blob): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 약간 지연 후 revoke (Safari 호환)
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
