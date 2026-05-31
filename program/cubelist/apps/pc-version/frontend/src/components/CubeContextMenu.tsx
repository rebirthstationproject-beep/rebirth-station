/**
 * 큐브 우클릭 컨텍스트 메뉴 (v0.1.2 신규).
 *
 * 4 액션:
 *   - 편집 (인스펙터로 큐브 선택)
 *   - 복제 (같은 리스트에 sort_order +0.5 로 삽입)
 *   - 이미지 변경 (file picker → data URL → cube.icon_url 갱신)
 *   - 삭제 (확인 후 store 에서 제거)
 *
 * 사용:
 *   const [menuPos, setMenuPos] = useState<{x,y,cubeId} | null>(null);
 *   onContextMenu={(e) => { e.preventDefault(); setMenuPos({x: e.clientX, y: e.clientY, cubeId: cube.id}); }}
 *   {menuPos && <CubeContextMenu {...menuPos} onClose={() => setMenuPos(null)} listId={list.id} />}
 */

import { useEffect, useRef } from 'react';
import { useEditor } from '../store/editor';

interface CubeContextMenuProps {
  readonly x: number;
  readonly y: number;
  readonly cubeId: string;
  readonly listId: string | null;
  readonly onClose: () => void;
}

const MENU_WIDTH = 180;
const MENU_HEIGHT_PER_ITEM = 32;
const MENU_ITEMS = 5;

export function CubeContextMenu({ x, y, cubeId, listId, onClose }: CubeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const selectCube = useEditor((s) => s.selectCube);
  const removeCube = useEditor((s) => s.removeCube);
  const upsertCube = useEditor((s) => s.upsertCube);
  const pack = useEditor((s) => s.pack);

  // 화면 밖 침범 방지
  const adjustedX = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const adjustedY = Math.min(y, window.innerHeight - MENU_HEIGHT_PER_ITEM * MENU_ITEMS - 8);

  // 외부 클릭 / Esc 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  function findCube() {
    if (!pack) return null;
    for (const list of pack.lists) {
      const found = list.cubes.find((c) => c.id === cubeId);
      if (found) return { cube: found, listId: list.id };
    }
    const libCube = pack.cubes?.find((c) => c.id === cubeId);
    if (libCube) return { cube: libCube, listId: null };
    return null;
  }

  function handleEdit(): void {
    selectCube(cubeId);
    onClose();
  }

  function handleDuplicate(): void {
    const found = findCube();
    if (!found || !listId) {
      onClose();
      return;
    }
    const newId = crypto.randomUUID();
    upsertCube(listId, {
      ...found.cube,
      id: newId,
      label: `${found.cube.label} (복제)`,
      sort_order: found.cube.sort_order + 0.5,
    });
    selectCube(newId);
    onClose();
  }

  function handleImageChange(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/gif,image/svg+xml,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 1024 * 1024) {
        window.alert('이미지는 1MB 이하만 가능합니다.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== 'string') return;
        const found = findCube();
        if (!found || !listId) return;
        upsertCube(listId, { ...found.cube, icon_url: dataUrl });
      };
      reader.readAsDataURL(file);
    };
    input.click();
    onClose();
  }

  function handleDelete(): void {
    if (!listId) {
      onClose();
      return;
    }
    if (!window.confirm('이 큐브를 삭제할까요?')) {
      onClose();
      return;
    }
    removeCube(listId, cubeId);
    onClose();
  }

  function handleUseAsCover(): void {
    const found = findCube();
    if (!found || !pack) {
      onClose();
      return;
    }
    if (!found.cube.icon_url) {
      window.alert('이 큐브에 이미지가 없습니다.');
      onClose();
      return;
    }
    // CubePack.extensions.marketplace.cover_url 갱신
    const ext = (pack.extensions ?? {}) as { marketplace?: Record<string, unknown> };
    const marketplace = (ext.marketplace ?? {}) as Record<string, unknown>;
    const next = {
      ...pack,
      extensions: {
        ...(pack.extensions ?? {}),
        marketplace: { ...marketplace, cover_url: found.cube.icon_url },
      },
    };
    void import('../store/editor').then(({ useEditor }) => {
      useEditor.getState().loadPack(next);
    });
    window.alert('큐브 이미지가 큐브팩 cover 로 설정되었습니다.');
    onClose();
  }

  return (
    <div
      ref={ref}
      className="cube-context-menu"
      style={{
        position: 'fixed',
        top: adjustedY,
        left: adjustedX,
        width: MENU_WIDTH,
        zIndex: 1000,
      }}
      role="menu"
    >
      <button type="button" className="cube-context-item" onClick={handleEdit} role="menuitem">
        ✏️ 편집
      </button>
      <button type="button" className="cube-context-item" onClick={handleDuplicate} role="menuitem">
        📋 복제
      </button>
      <button
        type="button"
        className="cube-context-item"
        onClick={handleImageChange}
        role="menuitem"
      >
        🖼 이미지 변경
      </button>
      <button
        type="button"
        className="cube-context-item"
        onClick={handleUseAsCover}
        role="menuitem"
      >
        🏪 큐브팩 cover로 사용
      </button>
      <button
        type="button"
        className="cube-context-item cube-context-item-danger"
        onClick={handleDelete}
        role="menuitem"
      >
        🗑 삭제
      </button>
    </div>
  );
}
