'use client';

import { useEffect, useRef } from 'react';
import type { CubeItem } from '@/lib/types/cube';
import { CUBE_BG_PRESETS, type CubeBgPreset } from '@/lib/types/cube';
import { useTranslation } from '@/lib/i18n/useTranslation';

/**
 * 큐브 컨텍스트 메뉴 (TUS, 2026-05-23) — 우클릭 시 표시.
 *
 * Stream Deck 톤: 큐브 위치에 인접한 floating 메뉴.
 * 빠른 액션: 편집 · 복제 · 색상 변경 · 삭제.
 *
 * 닫기 트리거:
 * - 외부 클릭
 * - Esc 키
 * - 액션 선택
 *
 * 키보드 네비 (TVB, 2026-05-23):
 * - 메뉴 열림 시 첫 menuitem 자동 focus
 * - ↑/↓ — menuitem 순환
 * - Enter/Space — 활성화 (브라우저 button 기본 동작)
 *
 * **모바일 fallback 영구 결정** (TVE, 2026-05-23):
 * - 데스크톱 우클릭(`onContextMenu`) 전용 진입.
 * - 모바일 long-press는 기존 jiggle 모드 + CubeEditSheet (BottomSheet)가 대체.
 * - 모바일 별도 컨텍스트 메뉴 도입은 사용자 결정 영역 (현재 미진입).
 * - 변경 시: `apps/web/components/cube/Cube.tsx` `onContextMenu` 분기 + 본 주석 동시 갱신.
 */

const MENU_COPY = {
  ko: {
    edit: '편집',
    duplicate: '복제',
    change_image: '이미지 변경',
    image_too_large: '이미지는 1MB 이하만 가능합니다.',
    color: '색상',
    delete: '삭제',
  },
  en: {
    edit: 'Edit',
    duplicate: 'Duplicate',
    change_image: 'Change Image',
    image_too_large: 'Image must be 1MB or less.',
    color: 'Color',
    delete: 'Delete',
  },
  ja: {
    edit: '編集',
    duplicate: '複製',
    change_image: '画像変更',
    image_too_large: '画像は 1MB 以下のみ可能です。',
    color: '色',
    delete: '削除',
  },
} as const;

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface CubeContextMenuProps {
  open: boolean;
  position: ContextMenuPosition;
  item: CubeItem | null;
  onClose: () => void;
  onEdit?: (item: CubeItem) => void;
  onDuplicate?: (item: CubeItem) => void;
  onChangeImage?: (item: CubeItem, dataUrl: string) => void;
  onColorChange?: (item: CubeItem, preset: CubeBgPreset) => void;
  onDelete?: (item: CubeItem) => void;
}

export function CubeContextMenu({
  open,
  position,
  item,
  onClose,
  onEdit,
  onDuplicate,
  onChangeImage,
  onColorChange,
  onDelete,
}: CubeContextMenuProps) {
  const { locale } = useTranslation();
  const t = MENU_COPY[locale] ?? MENU_COPY.ko;
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 외부 클릭 + Esc 닫기 + ↑/↓ 키보드 네비 (TVB, 2026-05-23)
  useEffect(() => {
    if (!open) return;
    function handlePointer(e: MouseEvent): void {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const root = menuRef.current;
        if (!root) return;
        const items = Array.from(
          root.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]'),
        );
        if (items.length === 0) return;
        const currentIdx = items.findIndex((b) => b === document.activeElement);
        const nextIdx =
          e.key === 'ArrowDown'
            ? currentIdx < 0
              ? 0
              : (currentIdx + 1) % items.length
            : currentIdx <= 0
              ? items.length - 1
              : currentIdx - 1;
        items[nextIdx]?.focus();
      }
    }
    // 첫 클릭(우클릭) 이벤트가 끝난 후 등록 + 첫 menuitem에 focus
    const id = window.setTimeout(() => {
      document.addEventListener('mousedown', handlePointer);
      document.addEventListener('keydown', handleKey, true);
      const firstItem = menuRef.current?.querySelector<HTMLButtonElement>(
        'button[role="menuitem"]',
      );
      firstItem?.focus();
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey, true);
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  // 화면 우/하단 클램프 (메뉴 폭 180, 높이 약 220 + 색상 행)
  const maxX = typeof window !== 'undefined' ? window.innerWidth - 200 : position.x;
  const maxY = typeof window !== 'undefined' ? window.innerHeight - 240 : position.y;
  const clampedX = Math.min(position.x, Math.max(0, maxX));
  const clampedY = Math.min(position.y, Math.max(0, maxY));

  function withClose<T extends (...args: never[]) => unknown>(fn?: T) {
    return ((...args: Parameters<T>) => {
      fn?.(...args);
      onClose();
    }) as T;
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={item.label}
      className="fixed z-50 w-[180px] rounded-xl border border-border bg-surface shadow-2xl py-1 cubelist-context-menu"
      style={{ left: `${clampedX}px`, top: `${clampedY}px` }}
    >
      {/* 헤더 — 큐브 미니 미리보기 (TVO 라벨 + TVR 아이콘/bg_color, 2026-05-23) */}
      <div className="px-3 py-2 border-b border-border mb-1 flex items-center gap-2">
        {(() => {
          const bg = (item.metadata?.bg_color as string | undefined) ?? 'default';
          const preset = CUBE_BG_PRESETS.find((p) => p.value === bg) ?? CUBE_BG_PRESETS[0];
          return (
            <div
              className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 ${preset.className}`}
              aria-hidden
            >
              {item.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.icon_url} alt="" className="w-5 h-5 object-contain" />
              ) : (
                <span className="w-3 h-3 rounded-sm bg-rbs-accent/40" />
              )}
            </div>
          );
        })()}
        <p className="text-[11px] font-semibold text-ink truncate flex-1" title={item.label}>
          {item.label}
        </p>
      </div>
      <MenuItem
        label={t.edit}
        icon="✎"
        shortcut="Enter"
        onClick={() => withClose(onEdit)(item)}
      />
      <MenuItem
        label={t.duplicate}
        icon="⎘"
        shortcut="Ctrl+D"
        onClick={() => withClose(onDuplicate)(item)}
      />
      <MenuItem
        label={t.change_image}
        icon="🖼"
        onClick={() => {
          if (!onChangeImage) {
            onClose();
            return;
          }
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/png,image/jpeg,image/gif,image/svg+xml,image/webp';
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            if (file.size > 1024 * 1024) {
              window.alert(t.image_too_large);
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result;
              if (typeof dataUrl !== 'string') return;
              onChangeImage(item, dataUrl);
            };
            reader.readAsDataURL(file);
          };
          input.click();
          onClose();
        }}
      />
      <div className="px-3 py-1.5 text-[10px] text-ink-muted">{t.color}</div>
      <div className="px-3 pb-1.5 grid grid-cols-5 gap-1">
        {CUBE_BG_PRESETS.map((preset) => {
          const currentBg = (item.metadata?.bg_color as string | undefined) ?? 'default';
          const isActive = currentBg === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => {
                onColorChange?.(item, preset.value);
                onClose();
              }}
              title={preset.label}
              aria-label={`${t.color}: ${preset.label}`}
              aria-pressed={isActive}
              className={`aspect-square rounded border-2 ${preset.className} ${
                isActive ? 'ring-2 ring-rbs-accent ring-offset-1 ring-offset-surface' : 'opacity-80 hover:opacity-100'
              } transition`}
            />
          );
        })}
      </div>
      <div className="h-px bg-border my-1" />
      <MenuItem
        label={t.delete}
        icon="🗑"
        shortcut="Delete"
        danger
        onClick={() => withClose(onDelete)(item)}
      />
    </div>
  );
}

interface MenuItemProps {
  label: string;
  icon: string;
  shortcut?: string;
  danger?: boolean;
  onClick: () => void;
}

function MenuItem({ label, icon, shortcut, danger, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full px-3 py-1.5 text-xs flex items-center justify-between gap-2 ${
        danger
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'text-ink hover:bg-surface-2'
      }`}
    >
      <span className="flex items-center gap-2">
        <span aria-hidden className="text-[12px] w-4 inline-block text-center">
          {icon}
        </span>
        {label}
      </span>
      {shortcut && (
        <kbd className="text-[9px] font-mono text-ink-muted">{shortcut}</kbd>
      )}
    </button>
  );
}
