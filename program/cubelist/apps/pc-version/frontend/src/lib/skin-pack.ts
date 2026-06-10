/**
 * skin-pack — 리스트 스킨 (아이콘팩 일괄 적용/해제) (W2, 2026-06-10).
 *
 * .cubeiconpack / .streamDeckIconPack ZIP 파싱:
 *   - manifest.json (optional)
 *   - icons/  ← svg / png
 *   - icons.json (optional, name/tags 활용)
 *
 * 매칭(보수적): 큐브 라벨 + metadata.sd_uuid 마지막 토큰을
 *   정규화(소문자/공백·하이픈·언더스코어 제거) → 아이콘 파일명 정규화 값과
 *   정확 일치 또는 포함 관계만. 미매칭 큐브는 변경 없음.
 */

import JSZip from 'jszip';
import type { Cube } from '../types/cube';

// ── 타입 ─────────────────────────────────────────────────────────────────

export interface SkinIcon {
  readonly key: string;       // 파일명 정규화 키
  readonly rawName: string;   // 원본 파일명 (확장자 제외)
  readonly dataUrl: string;   // data:image/...;base64,...
  readonly tags?: string[];   // icons.json 에서 취득한 태그 (optional)
}

export interface SkinPack {
  readonly name: string;
  readonly icons: SkinIcon[];
}

export interface SkinMatch {
  readonly cubeId: string;
  readonly iconDataUrl: string;
  readonly packName: string;
}

// ── 정규화 헬퍼 ────────────────────────────────────────────────────────────

/** 소문자 + 공백·하이픈·언더스코어 제거 */
function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, '');
}

/** sd_uuid 마지막 토큰 추출: "com.elgato.discord.mute" → "mute" */
function sdUuidToken(sdUuid: string | undefined): string {
  if (!sdUuid) return '';
  const parts = sdUuid.split('.');
  return parts[parts.length - 1] ?? '';
}

// ── 파싱 ─────────────────────────────────────────────────────────────────

async function bufToDataUrl(buf: Uint8Array, filename: string): Promise<string> {
  const lower = filename.toLowerCase();
  const mime = lower.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(buf.subarray(i, i + chunk)) as unknown as number[],
    );
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

/**
 * .cubeiconpack / .streamDeckIconPack ZIP 버퍼를 파싱하여 SkinPack 반환.
 */
export async function parseSkinPack(buffer: ArrayBuffer, filename: string): Promise<SkinPack> {
  const zip = await JSZip.loadAsync(buffer);

  // pack 이름: manifest.json > 파일명 스템
  let packName = filename.replace(/\.(cubeiconpack|streamDeckIconPack|zip)$/i, '').trim();
  const manifestEntry = zip.file('manifest.json');
  if (manifestEntry) {
    try {
      const text = await manifestEntry.async('text');
      const manifest = JSON.parse(text) as { name?: string };
      if (manifest.name && typeof manifest.name === 'string') {
        packName = manifest.name.trim() || packName;
      }
    } catch {
      // 파싱 실패 — 파일명 스템 사용
    }
  }

  // icons.json (optional) — key: 파일명(확장자 없음), value: { name?, tags? }
  const iconsJsonEntry = zip.file('icons.json');
  const iconsMeta: Record<string, { name?: string; tags?: string[] }> = {};
  if (iconsJsonEntry) {
    try {
      const text = await iconsJsonEntry.async('text');
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        Object.assign(iconsMeta, parsed);
      }
    } catch {
      // 무시
    }
  }

  // icons/ 안 svg / png 수집
  const icons: SkinIcon[] = [];
  const iconFiles = Object.values(zip.files).filter((f) => {
    if (f.dir) return false;
    const p = f.name.toLowerCase();
    return (p.startsWith('icons/') || p.startsWith('icons\\')) && (p.endsWith('.svg') || p.endsWith('.png'));
  });

  for (const f of iconFiles) {
    try {
      const buf = await f.async('uint8array');
      if (buf.byteLength === 0) continue;
      const basename = f.name.split('/').pop() ?? f.name.split('\\').pop() ?? f.name;
      const rawName = basename.replace(/\.(svg|png)$/i, '');
      const key = normalizeKey(rawName);
      const dataUrl = await bufToDataUrl(buf, basename);
      const meta = iconsMeta[rawName] ?? iconsMeta[basename] ?? {};
      icons.push({
        key,
        rawName,
        dataUrl,
        tags: meta.tags,
      });
    } catch {
      // 개별 파일 실패는 건너뜀
    }
  }

  return { name: packName, icons };
}

// ── 매칭 ─────────────────────────────────────────────────────────────────

/**
 * 큐브 배열에 대해 SkinPack 매칭 결과를 반환.
 *
 * 매칭 기준(보수적):
 *   1. 큐브 라벨 정규화 == 아이콘 key (정확 일치)
 *   2. sd_uuid 마지막 토큰 정규화 == 아이콘 key (정확 일치)
 *   3. 아이콘 key.includes(라벨 정규화) 또는 라벨 정규화.includes(아이콘 key)
 *      (단, key 길이 >= 3 이어야 false positive 방지)
 *
 * 미매칭 큐브는 결과에서 제외.
 */
export function matchSkinPack(cubes: readonly Cube[], pack: SkinPack): SkinMatch[] {
  const matches: SkinMatch[] = [];

  for (const cube of cubes) {
    const labelKey = normalizeKey(cube.label ?? '');
    const meta = (cube.metadata ?? {}) as Record<string, unknown>;
    const sdUuid = sdUuidToken(meta.sd_uuid as string | undefined);
    const sdKey = normalizeKey(sdUuid);

    let bestIcon: SkinIcon | null = null;

    for (const icon of pack.icons) {
      // 정확 일치 우선
      if (icon.key === labelKey || (sdKey.length > 0 && icon.key === sdKey)) {
        bestIcon = icon;
        break;
      }
    }

    if (!bestIcon) {
      // 포함 관계 (key 길이 >= 3)
      for (const icon of pack.icons) {
        if (icon.key.length < 3) continue;
        if (
          (labelKey.length >= 3 && (icon.key.includes(labelKey) || labelKey.includes(icon.key))) ||
          (sdKey.length >= 3 && (icon.key.includes(sdKey) || sdKey.includes(icon.key)))
        ) {
          bestIcon = icon;
          break;
        }
      }
    }

    if (bestIcon) {
      matches.push({
        cubeId: cube.id,
        iconDataUrl: bestIcon.dataUrl,
        packName: pack.name,
      });
    }
  }

  return matches;
}

// ── store 액션 헬퍼 타입 (editor.ts 액션에 전달하는 형태) ─────────────────

export type SkinReplacement = SkinMatch;
