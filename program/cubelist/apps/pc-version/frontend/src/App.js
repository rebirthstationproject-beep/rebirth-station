import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function App() {
    const pack = useEditor((s) => s.pack);
    const loadPack = useEditor((s) => s.loadPack);
    // M2 셸 검증용 데모 시드 — M2 후반 실 파일 I/O 도입 시 제거 또는 "샘플 큐브팩" 버튼으로 격하
    useEffect(() => {
        if (!pack)
            loadPack(buildDemoPack());
    }, [pack, loadPack]);
    return (_jsxs("div", { className: "app", children: [_jsx(TopBar, {}), _jsxs("div", { className: "workspace", children: [_jsx(Sidebar, {}), _jsx(GridArea, {}), _jsx(Inspector, {})] }), _jsxs("footer", { className: "library", children: [_jsx("span", { className: "library-title", children: "\uD50C\uB7EC\uADF8\uC778 \uB77C\uC774\uBE0C\uB7EC\uB9AC" }), _jsx("span", { className: "library-hint", children: "(M4 \uB2E8\uACC4\uC5D0\uC11C \uCC44\uC6CC\uC9D1\uB2C8\uB2E4)" })] })] }));
}
function TopBar() {
    const pack = useEditor((s) => s.pack);
    const activeListId = useEditor((s) => s.list_id);
    const selectList = useEditor((s) => s.selectList);
    return (_jsxs("header", { className: "topbar", children: [_jsxs("div", { className: "topbar-left", children: [_jsx("span", { className: "brand", children: "\uD050\uBE0C \uB9AC\uC2A4\uD2B8 \u2014 \uD3B8\uC9D1\uAE30" }), _jsxs("nav", { className: "pack-tabs", "aria-label": "\uB9AC\uC2A4\uD2B8", children: [pack?.lists.map((l) => (_jsx("button", { type: "button", className: `pack-tab ${activeListId === l.id ? 'is-active' : ''}`, onClick: () => selectList(l.id), "aria-pressed": activeListId === l.id, children: l.name }, l.id))), _jsx("button", { className: "pack-tab is-add", type: "button", title: "\uB9AC\uC2A4\uD2B8 \uCD94\uAC00 (M2 \uD6C4\uBC18)", children: "+" })] })] }), _jsxs("div", { className: "topbar-right", children: [_jsx("span", { className: "pack-meta", children: pack?.name ?? '(큐브팩 없음)' }), _jsx("button", { className: "icon-btn", title: "\uC124\uC815", "aria-label": "\uC124\uC815", children: "\u2699" })] })] }));
}
function Sidebar() {
    return (_jsx("aside", { className: "sidebar", "aria-label": "\uCE74\uD14C\uACE0\uB9AC", children: _jsxs("div", { className: "sidebar-section", children: [_jsx("h3", { className: "sidebar-title", children: "\uCE74\uD14C\uACE0\uB9AC" }), _jsx("ul", { className: "category-list", children: ['생산성', '미디어', '개발', '디자인', '게이밍', '시스템'].map((c) => (_jsx("li", { className: "category-item", children: _jsx("button", { className: "category-btn", type: "button", children: c }) }, c))) }), _jsx("div", { className: "sidebar-hint", children: "(M6 \uB2E8\uACC4\uC5D0\uC11C \uC2DC\uB4DC \uCE74\uD0C8\uB85C\uADF8 \uC5F0\uACB0)" })] }) }));
}
function GridArea() {
    const pack = useEditor((s) => s.pack);
    const listId = useEditor((s) => s.list_id);
    const list = pack?.lists.find((l) => l.id === listId) ?? null;
    if (!list) {
        return (_jsx("main", { className: "grid-area", children: _jsx("div", { className: "grid-empty", children: "\uB9AC\uC2A4\uD2B8\uB97C \uC120\uD0DD\uD558\uC138\uC694" }) }));
    }
    return (_jsxs("main", { className: "grid-area", children: [_jsxs("div", { className: "grid-meta", children: [_jsxs("span", { children: [list.name, " \u00B7 \uD050\uBE0C ", list.cubes.length, "\uAC1C"] }), _jsxs("div", { className: "grid-meta-actions", children: [_jsx("button", { className: "btn-ghost", type: "button", children: "\uC774\uC804 \uD398\uC774\uC9C0" }), _jsx("button", { className: "btn-ghost", type: "button", children: "\uB2E4\uC74C \uD398\uC774\uC9C0" })] })] }), _jsx(CubeGrid, { list: list }), _jsx("div", { className: "grid-hint", children: "M2 \uD6C4\uBC18: @dnd-kit \uB4DC\uB798\uADF8&\uB4DC\uB86D reorder \u00B7 .cubepack \uB85C\uB4DC/\uC800\uC7A5 \u00B7 \uD398\uC774\uC9C0(\uC11C\uBE0C\uB371) \uBD84\uAE30" })] }));
}
function CubeGrid({ list }) {
    const cube_id = useEditor((s) => s.cube_id);
    const selectCube = useEditor((s) => s.selectCube);
    const cols = list.cols ?? 5;
    const sorted = [...list.cubes].sort((a, b) => a.sort_order - b.sort_order);
    // 빈 슬롯도 표시 — cols × 3 줄을 기본으로
    const minSlots = cols * 3;
    const emptySlots = Math.max(0, minSlots - sorted.length);
    return (_jsxs("div", { className: "cube-grid", role: "grid", "aria-label": "\uD050\uBE0C \uADF8\uB9AC\uB4DC", style: { gridTemplateColumns: `repeat(${cols}, 1fr)` }, children: [sorted.map((cube) => (_jsx(CubeCell, { cube: cube, selected: cube_id === cube.id, onSelect: () => selectCube(cube_id === cube.id ? null : cube.id) }, cube.id))), Array.from({ length: emptySlots }, (_, i) => (_jsx("button", { type: "button", role: "gridcell", className: "cube-cell is-empty", "aria-label": "\uBE48 \uC2AC\uB86F", children: _jsx("span", { className: "cube-empty", children: "\uFF0B" }) }, `empty-${i}`)))] }));
}
function CubeCell({ cube, selected, onSelect }) {
    return (_jsxs("button", { type: "button", role: "gridcell", className: `cube-cell ${selected ? 'is-selected' : ''}`, onClick: onSelect, "aria-pressed": selected, title: `${cube.label} (${cube.action_type})`, children: [_jsx("span", { className: "cube-label", children: cube.label }), _jsx("span", { className: "cube-action-badge", children: cube.action_type })] }));
}
function Inspector() {
    const cube_id = useEditor((s) => s.cube_id);
    const pack = useEditor((s) => s.pack);
    const list_id = useEditor((s) => s.list_id);
    const cube = pack?.lists.find((l) => l.id === list_id)?.cubes.find((c) => c.id === cube_id) ?? null;
    if (!cube) {
        return (_jsx("aside", { className: "inspector", "aria-label": "\uD050\uBE0C \uC778\uC2A4\uD399\uD130", children: _jsx("div", { className: "inspector-empty", children: "\uD050\uBE0C\uB97C \uC120\uD0DD\uD558\uC138\uC694" }) }));
    }
    return (_jsxs("aside", { className: "inspector", "aria-label": "\uD050\uBE0C \uC778\uC2A4\uD399\uD130", children: [_jsx("h3", { className: "inspector-title", children: "\uD050\uBE0C \uC18D\uC131" }), _jsxs("dl", { className: "inspector-fields", children: [_jsx("dt", { children: "ID" }), _jsx("dd", { className: "muted", children: cube.id }), _jsx("dt", { children: "\uB77C\uBCA8" }), _jsx("dd", { children: _jsx("input", { type: "text", defaultValue: cube.label, placeholder: "(\uB77C\uBCA8)" }) }), _jsx("dt", { children: "\uC561\uC158 \uD0C0\uC785" }), _jsx("dd", { children: _jsxs("select", { defaultValue: cube.action_type, children: [_jsx("option", { value: "link", children: "link \u00B7 \uB9C1\uD06C \uC5F4\uAE30" }), _jsx("option", { value: "shortcut", children: "shortcut \u00B7 \uB2E8\uCD95\uD0A4" }), _jsx("option", { value: "macro", children: "macro \u00B7 \uB9E4\uD06C\uB85C" }), _jsx("option", { value: "folder", children: "folder \u00B7 \uD3F4\uB354(\uC11C\uBE0C\uB371)" }), _jsx("option", { value: "text_insert", children: "text_insert \u00B7 \uD14D\uC2A4\uD2B8 \uC0BD\uC785" }), _jsx("option", { value: "clipboard_copy", children: "clipboard_copy \u00B7 \uD074\uB9BD\uBCF4\uB4DC \uBCF5\uC0AC" }), _jsx("option", { value: "app_launch", children: "app_launch \u00B7 \uC571 \uC2E4\uD589" }), _jsx("option", { value: "focus_window", children: "focus_window \u00B7 \uCC3D \uD3EC\uCEE4\uC2A4" }), _jsx("option", { value: "mouse_click", children: "mouse_click \u00B7 \uB9C8\uC6B0\uC2A4 \uD074\uB9AD" }), _jsx("option", { value: "plugin_action", children: "plugin_action \u00B7 \uD50C\uB7EC\uADF8\uC778" })] }) }), _jsx("dt", { children: "payload" }), _jsx("dd", { className: "muted", children: _jsx("code", { children: JSON.stringify(cube.action_payload) }) })] }), _jsx("div", { className: "inspector-hint", children: "M3 \uB2E8\uACC4: \uC561\uC158 \uD2B8\uB808\uC774\uD2B8 + JSON Schema \uB3D9\uC801 \uD3FC" })] }));
}
