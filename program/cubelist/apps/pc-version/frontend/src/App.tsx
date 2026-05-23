/**
 * 큐브 리스트 PC 편집기 — 셸 (M1)
 *
 * StreamDeck 동등 3-패널 레이아웃:
 * - 좌: 카테고리 + 큐브 시드 카탈로그 (M6 채움)
 * - 중: 큐브 그리드 (현재 큐브팩의 활성 리스트, M2~M3 채움)
 * - 우: 큐브 인스펙터 (선택 큐브 속성 편집, M3 채움)
 *
 * 상단: 큐브팩 탭 + 디바이스/페이지 선택 + 설정
 * 하단: 플러그인 라이브러리 (M4 채움)
 */

import { useState } from 'react';

type Panel = 'categories' | 'grid' | 'inspector';

export function App() {
  const [selectedCube, setSelectedCube] = useState<string | null>(null);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <span className="brand">큐브 리스트 — 편집기</span>
          <nav className="pack-tabs" aria-label="큐브팩">
            <button className="pack-tab is-active">기본 큐브팩</button>
            <button className="pack-tab is-add">+</button>
          </nav>
        </div>
        <div className="topbar-right">
          <button className="icon-btn" title="설정" aria-label="설정">⚙</button>
        </div>
      </header>

      <div className="workspace">
        <Sidebar panel="categories" />
        <CubeGrid onSelectCube={setSelectedCube} selectedCubeId={selectedCube} />
        <Inspector selectedCubeId={selectedCube} />
      </div>

      <footer className="library">
        <span className="library-title">플러그인 라이브러리</span>
        <span className="library-hint">(M4 단계에서 채워집니다)</span>
      </footer>
    </div>
  );
}

interface SidebarProps {
  panel: Panel;
}

function Sidebar({ panel: _panel }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="카테고리">
      <div className="sidebar-section">
        <h3 className="sidebar-title">카테고리</h3>
        <ul className="category-list">
          {['생산성', '미디어', '개발', '디자인', '게이밍', '시스템'].map((c) => (
            <li key={c} className="category-item">
              <button className="category-btn">{c}</button>
            </li>
          ))}
        </ul>
        <div className="sidebar-hint">(M6 단계에서 시드 카탈로그 연결)</div>
      </div>
    </aside>
  );
}

interface CubeGridProps {
  onSelectCube: (id: string | null) => void;
  selectedCubeId: string | null;
}

function CubeGrid({ onSelectCube, selectedCubeId }: CubeGridProps) {
  const cells = Array.from({ length: 15 }, (_, i) => `slot-${i}`);

  return (
    <main className="grid-area">
      <div className="grid-meta">
        <span>리스트 1 · 페이지 1 / 1</span>
        <div className="grid-meta-actions">
          <button className="btn-ghost">이전</button>
          <button className="btn-ghost">다음</button>
        </div>
      </div>
      <div
        className="cube-grid"
        role="grid"
        aria-label="큐브 그리드"
        style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
      >
        {cells.map((id) => (
          <button
            key={id}
            type="button"
            role="gridcell"
            className={`cube-cell ${selectedCubeId === id ? 'is-selected' : ''}`}
            onClick={() => onSelectCube(selectedCubeId === id ? null : id)}
            aria-pressed={selectedCubeId === id}
          >
            <span className="cube-empty">빈 슬롯</span>
          </button>
        ))}
      </div>
      <div className="grid-hint">M2 단계: .cubepack 로드 + 드래그 배치 + 페이지 이동 구현</div>
    </main>
  );
}

interface InspectorProps {
  selectedCubeId: string | null;
}

function Inspector({ selectedCubeId }: InspectorProps) {
  if (selectedCubeId === null) {
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
        <dt>슬롯 ID</dt>
        <dd>{selectedCubeId}</dd>
        <dt>라벨</dt>
        <dd><input type="text" placeholder="(라벨 입력)" /></dd>
        <dt>액션 타입</dt>
        <dd>
          <select>
            <option value="">(선택)</option>
            <option value="open-url">링크 열기</option>
            <option value="open-app">앱 실행</option>
            <option value="run-shortcut">단축키</option>
            <option value="run-macro">매크로</option>
          </select>
        </dd>
      </dl>
      <div className="inspector-hint">M3 단계: 액션 트레이트 표준화 + 스키마 기반 동적 폼</div>
    </aside>
  );
}
