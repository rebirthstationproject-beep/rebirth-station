/**
 * 큐브팩 자동 썸네일 생성 (v0.1.3 사전, 2026-05-31).
 *
 * 활성 큐브팩의 첫 리스트 또는 사용자 지정 리스트를 4×4 그리드로 캡처해
 * data URL (PNG) 로 반환. cover_url 없을 때 자동 생성용.
 *
 * 동작:
 *  1. canvas 1280×720 (16:9)
 *  2. 검은 LCD 톤 배경 + inset shadow 시뮬레이션
 *  3. 큐브 16개 → 4×4 그리드 (각 88×88 + gap 14)
 *  4. 각 큐브: 아이콘 (data URL 또는 단색 + 첫 글자 letter)
 *  5. 하단 패딩에 큐브팩 이름 (큰 흰색 텍스트)
 */

import type { Cube, CubeList } from '../types/cube';

const DEFAULT_W = 1280;
const DEFAULT_H = 720;
const COLS = 4;
const ROWS = 4;
const CELL = 110;
const GAP = 14;
const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface CaptureOptions {
  readonly width?: number;
  readonly height?: number;
  readonly packName?: string;
  readonly subtitle?: string;
}

/**
 * CubeList 의 큐브 최대 16개를 그리드로 캡처해 PNG data URL 반환.
 */
export async function captureCubeListThumbnail(
  list: CubeList,
  options: CaptureOptions = {},
): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const width = options.width ?? DEFAULT_W;
  const height = options.height ?? DEFAULT_H;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 배경 (LCD 톤 + 그라데이션)
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a0a0a');
  gradient.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 그리드 영역 중앙 정렬
  const gridWidth = COLS * CELL + (COLS - 1) * GAP;
  const gridHeight = ROWS * CELL + (ROWS - 1) * GAP;
  const startX = (width - gridWidth) / 2;
  const startY = 50;

  // 큐브 배치
  const cubes = list.cubes.slice(0, COLS * ROWS);
  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = startX + col * (CELL + GAP);
    const y = startY + row * (CELL + GAP);
    const cube = cubes[i];
    if (cube) {
      await drawCube(ctx, x, y, CELL, cube, i);
    } else {
      drawEmptySlot(ctx, x, y, CELL);
    }
  }

  // 하단 큐브팩 이름
  if (options.packName) {
    const titleY = startY + gridHeight + 50;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(options.packName, width / 2, titleY);
    if (options.subtitle) {
      ctx.fillStyle = '#9a9a9a';
      ctx.font = '18px sans-serif';
      ctx.fillText(options.subtitle, width / 2, titleY + 30);
    }
  }

  return canvas.toDataURL('image/png');
}

async function drawCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  cube: Cube,
  index: number,
): Promise<void> {
  // 둥근 사각형 배경
  ctx.save();
  roundRect(ctx, x, y, size, size, 14);
  ctx.fillStyle = '#000000';
  ctx.fill();
  // inset white outline
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // 아이콘 (data URL 또는 단색 + 라벨 첫 글자)
  const iconLoaded = await tryLoadImage(cube.icon_url);
  if (iconLoaded) {
    // contain 모드
    const aspect = iconLoaded.width / iconLoaded.height;
    let iw = size - 24;
    let ih = size - 24;
    if (aspect > 1) ih = iw / aspect;
    else iw = ih * aspect;
    const ix = x + (size - iw) / 2;
    const iy = y + (size - ih) / 2;
    ctx.drawImage(iconLoaded, ix, iy, iw, ih);
  } else {
    // 단색 fallback + 첫 글자
    const color = PALETTE[index % PALETTE.length];
    const margin = 18;
    ctx.save();
    roundRect(ctx, x + margin, y + margin, size - margin * 2, size - margin * 2, 12);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    const letter = (cube.label || '?').trim().charAt(0).toUpperCase();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, x + size / 2, y + size / 2);
  }

  // 큐브 셀 하단 라벨
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const truncated = truncate(cube.label, 14);
  ctx.fillText(truncated, x + size / 2, y + size - 6);
}

function drawEmptySlot(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save();
  roundRect(ctx, x, y, size, size, 14);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

async function tryLoadImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.crossOrigin = 'anonymous';
    img.src = url;
    // 5초 타임아웃
    setTimeout(() => resolve(null), 5000);
  });
}
