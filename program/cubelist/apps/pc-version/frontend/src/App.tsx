/**
 * 큐브 리스트 PC 편집기 — 셸 (M2: store 연결 + 데모 시드)
 *
 * StreamDeck 동등 3-패널 레이아웃:
 * - 좌: 카테고리 + 큐브 시드 카탈로그 (M6 채움)
 * - 중: 큐브 그리드 (활성 리스트, M2 후반 = @dnd-kit reorder)
 * - 우: 큐브 인스펙터 (M3 = 액션 스키마 동적 폼)
 *
 * 상단: 큐브팩 탭 (다중 리스트) + 디바이스/설정
 * 하단: 플러그인 라이브러리 (M4 채움)
 */

import { useEffect } from 'react';
import { useEditor } from './store/editor';
import { buildDemoPack } from './lib/demo-pack';
import type { Cube, CubeList } from './types/cube';

export function App() {
  const pack = useEditor((s) => s.pack);
  const loadPack = useEditor((s) => s.loadPack);

  // M2 셸 검증용 데모 시드 — M2 후반 실 파일 I/O 도입 시 제거 또는 "샘플 큐브팩" 버튼으로 격하
  useEffect(() => {
    if (!pack) loadPack(buildDemoPack());
  }, [pack, loadPack]);

  return (
    <div className="app">
      <TopBar />
      <div className="workspace">
        <Sidebar />
        <GridArea />
        <Inspector />
      </div>
      <footer className="library">
        <span className="library-title">플러그인 라이브러리</span>
        <span className="library-hint">(M4 단계에서 채워집니다)</span>
      </footer>
    </div>
  );
}

function TopBar() {
  const pack = useEditor((s) => s.pack);
  const activeListId = useEditor((s) => s.list_id);
  const selectList = useEditor((s) => s.selectList);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="brand">큐브 리스트 — 편집기</span>
        <nav className="pack-tabs" aria-label="리스트">
          {pack?.lists.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`pack-tab ${activeListId === l.id ? 'is-active' : ''}`}
              onClick={() => selectList(l.id)}
              aria-pressed={activeListId === l.id}
            >
              {l.name}
            </button>
          ))}
          <button className="pack-tab is-add" type="button" title="리스트 추가 (M2 후반)">
            +
          </button>
        </nav>
      </div>
      <div className="topbar-right">
        <span className="pack-meta">{pack?.name ?? '(큐브팩 없음)'}</span>
        <button className="icon-btn" title="설정" aria-label="설정">⚙</button>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="카테고리">
      <div className="sidebar-section">
        <h3 className="sidebar-title">카테고리</h3>
        <ul className="category-list">
          {['생산성', '미디어', '개발', '디자인', '게이밍', '시스템'].map((c) => (
            <li key={c} className="category-item">
              <button className="category-btn" type="button">{c}</button>
            </li>
          ))}
        </ul>
        <div className="sidebar-hint">(M6 단계에서 시드 카탈로그 연결)</div>
      </div>
    </aside>
  );
}

function GridArea() {
  const pack = useEditor((s) => s.pack);
  const listId = useEditor((s) => s.list_id);
  const list = pack?.lists.find((l) => l.id === listId) ?? null;

  if (!list) {
    return (
      <main className="grid-area">
        <div className="grid-empty">리스트를 선택하세요</div>
      </main>
    );
  }

  return (
    <main className="grid-area">
      <div className="grid-meta">
        <span>{list.name} · 큐브 {list.cubes.length}개</span>
        <div className="grid-meta-actions">
          <button className="btn-ghost" type="button">이전 페이지</button>
          <button className="btn-ghost" type="button">다음 페이지</button>
        </div>
      </div>
      <CubeGrid list={list} />
      <div className="grid-hint">M2 후반: @dnd-kit 드래그&드롭 reorder · .cubepack 로드/저장 · 페이지(서브덱) 분기</div>
    </main>
  );
}

function CubeGrid({ list }: { list: CubeList }) {
  const cube_id = useEditor((s) => s.cube_id);
  const selectCube = useEditor((s) => s.selectCube);
  const cols = list.cols ?? 5;
  const sorted = [...list.cubes].sort((a, b) => a.sort_order - b.sort_order);

  // 빈 슬롯도 표시 — cols × 3 줄을 기본으로
  const minSlots = cols * 3;
  const emptySlots = Math.max(0, minSlots - sorted.length);

  return (
    <div
      className="cube-grid"
      role="grid"
      aria-label="큐브 그리드"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {sorted.map((cube) => (
        <CubeCell
          key={cube.id}
          cube={cube}
          selected={cube_id === cube.id}
          onSelect={() => selectCube(cube_id === cube.id ? null : cube.id)}
        />
      ))}
      {Array.from({ length: emptySlots }, (_, i) => (
        <button
          key={`empty-${i}`}
          type="button"
          role="gridcell"
          className="cube-cell is-empty"
          aria-label="빈 슬롯"
        >
          <span className="cube-empty">＋</span>
        </button>
      ))}
    </div>
  );
}

interface CubeCellProps {
  cube: Cube;
  selected: boolean;
  onSelect: () => void;
}

function CubeCell({ cube, selected, onSelect }: CubeCellProps) {
  return (
    <button
      type="button"
      role="gridcell"
      className={`cube-cell ${selected ? 'is-selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
      title={`${cube.label} (${cube.action_type})`}
    >
      <span className="cube-label">{cube.label}</span>
      <span className="cube-action-badge">{cube.action_type}</span>
    </button>
  );
}

function Inspector() {
  const cube_id = useEditor((s) => s.cube_id);
  const pack = useEditor((s) => s.pack);
  const list_id = useEditor((s) => s.list_id);

  const cube =
    pack?.lists.find((l) => l.id === list_id)?.cubes.find((c) => c.id === cube_id) ?? null;

  if (!cube) {
    return (
      <aside className="inspector" aria-label="큐브 인스펙터">
        <div className="inspector-empty">큐브를 선택하세요</div>
      </aside>
    );
  }

  return (
    <aside className="inspector" aria-label="큐브 인스펙터">
      <h3 className="inspector-title">큐브 속성</h3>
      <dl className="inspector-fields">
        <dt>ID</dt>
        <dd className="muted">{cube.id}</dd>
        <dt>라벨</dt>
        <dd><input type="text" defaultValue={cube.label} placeholder="(라벨)" /></dd>
        <dt>액션 타입</dt>
        <dd>
          <select defaultValue={cube.action_type}>
            <option value="link">link · 링크 열기</option>
            <option value="shortcut">shortcut · 단축키</option>
            <option value="macro">macro · 매크로</option>
            <option value="folder">folder · 폴더(서브덱)</option>
            <option value="text_insert">text_insert · 텍스트 삽입</option>
            <option value="clipboard_copy">clipboard_copy · 클립보드 복사</option>
            <option value="app_launch">app_launch · 앱 실행</option>
            <option value="focus_window">focus_window · 창 포커스</option>
            <option value="mouse_click">mouse_click · 마우스 클릭</option>
            <option value="plugin_action">plugin_action · 플러그인</option>
          </select>
        </dd>
        <dt>payload</dt>
        <dd className="muted">
          <code>{JSON.stringify(cube.action_payload)}</code>
        </dd>
      </dl>
      <div className="inspector-hint">M3 단계: 액션 트레이트 + JSON Schema 동적 폼</div>
    </aside>
  );
}
