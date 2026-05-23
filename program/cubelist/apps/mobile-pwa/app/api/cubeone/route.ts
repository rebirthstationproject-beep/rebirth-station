/**
 * /api/cubeone — 파일 시스템 기반 .cubeone (ZIP v3) 라이브러리 API
 *
 * 작업 디렉토리: <repo>/cubeone/jusomoa/{categorySlug}/{slug}.cubeone
 * .cubeone = ZIP { manifest.json, icon.webp }
 *
 * GET                       → 카테고리 목록 + 각 카테고리 파일 개수
 * GET ?category=            → 해당 카테고리 .cubeone 파일 목록 (manifest 메타 요약)
 * GET ?category=&slug=      → 단일 파일 manifest + icon base64
 * GET ?category=&slug=&icon → 단일 파일의 icon binary (image/webp)
 * PUT ?category=&slug=      → 단일 파일 manifest 수정 (body: {cube: {...}})
 *
 * Stage 1 운영: 사용자 PC 로컬 dev에서만 사용
 */

import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import JSZip from 'jszip';

const ROOT = resolve(process.cwd(), '..', '..', 'cubeone', 'jusomoa');
const ALLOWED_SLUG = /^[a-z0-9_-]+$/i;
const ALLOWED_CATEGORY = /^[a-z0-9_-]+$/i;

interface ManifestCube {
  label?: string;
  icon_ref?: string;
  icon_url?: string;
  action_type?: string;
  action_payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface Manifest {
  rbs_format_version?: number;
  kind?: string;
  id?: string;
  cube?: ManifestCube;
  [k: string]: unknown;
}

async function safePath(category: string, slug?: string): Promise<string | null> {
  if (!ALLOWED_CATEGORY.test(category)) return null;
  if (slug !== undefined && !ALLOWED_SLUG.test(slug)) return null;
  const path = slug === undefined ? join(ROOT, category) : join(ROOT, category, `${slug}.cubeone`);
  if (!path.startsWith(ROOT)) return null;
  return path;
}

async function readManifest(zipPath: string): Promise<{ manifest: Manifest; zip: JSZip }> {
  const buf = await readFile(zipPath);
  const zip = await JSZip.loadAsync(buf);
  const mFile = zip.file('manifest.json');
  if (!mFile) throw new Error('manifest.json missing');
  const text = await mFile.async('text');
  return { manifest: JSON.parse(text) as Manifest, zip };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const slug = searchParams.get('slug');
  const wantIcon = searchParams.get('icon') !== null;

  try {
    // 단일 icon binary
    if (category && slug && wantIcon) {
      const path = await safePath(category, slug);
      if (!path) return NextResponse.json({ error: 'invalid path' }, { status: 400 });
      const { manifest, zip } = await readManifest(path);
      const iconRef = manifest.cube?.icon_ref ?? 'icon.webp';
      const iconFile = zip.file(iconRef);
      if (!iconFile) {
        return NextResponse.json({ error: 'icon not in zip' }, { status: 404 });
      }
      const blob = await iconFile.async('nodebuffer');
      const ext = iconRef.endsWith('.png') ? 'png' : 'webp';
      return new NextResponse(new Uint8Array(blob), {
        status: 200,
        headers: {
          'content-type': `image/${ext}`,
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    // 단일 파일 manifest
    if (category && slug) {
      const path = await safePath(category, slug);
      if (!path) return NextResponse.json({ error: 'invalid path' }, { status: 400 });
      const { manifest } = await readManifest(path);
      return NextResponse.json({ category, slug, data: manifest });
    }

    // 카테고리 내 파일 목록
    if (category) {
      const path = await safePath(category);
      if (!path) return NextResponse.json({ error: 'invalid category' }, { status: 400 });
      const files = await readdir(path);
      const cubeones = files.filter((f) => f.endsWith('.cubeone'));
      const items = await Promise.all(
        cubeones.map(async (filename) => {
          const slugOnly = filename.replace(/\.cubeone$/, '');
          try {
            const { manifest } = await readManifest(join(path, filename));
            const cube = manifest.cube ?? {};
            const payload = cube.action_payload ?? {};
            const hasIconRef = typeof cube.icon_ref === 'string';
            return {
              slug: slugOnly,
              label: cube.label ?? slugOnly,
              // 이미지: ZIP 내부면 /api/cubeone?...&icon, 아니면 외부 URL
              icon_src: hasIconRef
                ? `/api/cubeone?category=${encodeURIComponent(category)}&slug=${encodeURIComponent(slugOnly)}&icon`
                : (cube.icon_url ?? null),
              has_icon_ref: hasIconRef,
              action_type: cube.action_type ?? 'link',
              url: typeof payload.url === 'string' ? payload.url : null,
              keys: Array.isArray(payload.keys) ? payload.keys : null,
              steps_count: Array.isArray(payload.steps) ? payload.steps.length : null,
              category,
            };
          } catch (e) {
            return {
              slug: slugOnly,
              label: slugOnly,
              icon_src: null,
              has_icon_ref: false,
              action_type: 'link',
              url: null,
              keys: null,
              steps_count: null,
              category,
              error: (e as Error).message,
            };
          }
        }),
      );
      return NextResponse.json({ category, count: items.length, items });
    }

    // 카테고리 전체 목록
    const entries = await readdir(ROOT, { withFileTypes: true });
    const categories = await Promise.all(
      entries
        .filter((e) => e.isDirectory())
        .map(async (e) => {
          const files = await readdir(join(ROOT, e.name));
          return { slug: e.name, count: files.filter((f) => f.endsWith('.cubeone')).length };
        }),
    );
    return NextResponse.json({
      root: 'cubeone/jusomoa',
      format: 'v3 (ZIP container)',
      total: categories.reduce((sum, c) => sum + c.count, 0),
      categories: categories.sort((a, b) => b.count - a.count),
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'not_found', detail: (err as Error).message },
      { status: 404 },
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const slug = searchParams.get('slug');
  if (!category || !slug) {
    return NextResponse.json({ error: 'category and slug required' }, { status: 400 });
  }
  const path = await safePath(category, slug);
  if (!path) return NextResponse.json({ error: 'invalid path' }, { status: 400 });

  try {
    const body = (await req.json()) as { cube?: ManifestCube };
    if (!body.cube) return NextResponse.json({ error: 'cube field required' }, { status: 400 });

    // ZIP 읽기 + manifest 갱신 + ZIP 쓰기 (icon은 보존)
    const { manifest, zip } = await readManifest(path);
    const next: Manifest = {
      ...manifest,
      updated_at: new Date().toISOString(),
      cube: { ...manifest.cube, ...body.cube },
    };
    zip.file('manifest.json', JSON.stringify(next, null, 2));
    const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    await writeFile(path, buf);
    return NextResponse.json({ ok: true, category, slug });
  } catch (err) {
    return NextResponse.json(
      { error: 'write_failed', detail: (err as Error).message },
      { status: 500 },
    );
  }
}
