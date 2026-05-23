import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function App() {
    const [selectedCube, setSelectedCube] = useState(null);
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "topbar", children: [_jsxs("div", { className: "topbar-left", children: [_jsx("span", { className: "brand", children: "\uD050\uBE0C \uB9AC\uC2A4\uD2B8 \u2014 \uD3B8\uC9D1\uAE30" }), _jsxs("nav", { className: "pack-tabs", "aria-label": "\uD050\uBE0C\uD329", children: [_jsx("button", { className: "pack-tab is-active", children: "\uAE30\uBCF8 \uD050\uBE0C\uD329" }), _jsx("button", { className: "pack-tab is-add", children: "+" })] })] }), _jsx("div", { className: "topbar-right", children: _jsx("button", { className: "icon-btn", title: "\uC124\uC815", "aria-label": "\uC124\uC815", children: "\u2699" }) })] }), _jsxs("div", { className: "workspace", children: [_jsx(Sidebar, { panel: "categories" }), _jsx(CubeGrid, { onSelectCube: setSelectedCube, selectedCubeId: selectedCube }), _jsx(Inspector, { selectedCubeId: selectedCube })] }), _jsxs("footer", { className: "library", children: [_jsx("span", { className: "library-title", children: "\uD50C\uB7EC\uADF8\uC778 \uB77C\uC774\uBE0C\uB7EC\uB9AC" }), _jsx("span", { className: "library-hint", children: "(M4 \uB2E8\uACC4\uC5D0\uC11C \uCC44\uC6CC\uC9D1\uB2C8\uB2E4)" })] })] }));
}
function Sidebar({ panel: _panel }) {
    return (_jsx("aside", { className: "sidebar", "aria-label": "\uCE74\uD14C\uACE0\uB9AC", children: _jsxs("div", { className: "sidebar-section", children: [_jsx("h3", { className: "sidebar-title", children: "\uCE74\uD14C\uACE0\uB9AC" }), _jsx("ul", { className: "category-list", children: ['생산성', '미디어', '개발', '디자인', '게이밍', '시스템'].map((c) => (_jsx("li", { className: "category-item", children: _jsx("button", { className: "category-btn", children: c }) }, c))) }), _jsx("div", { className: "sidebar-hint", children: "(M6 \uB2E8\uACC4\uC5D0\uC11C \uC2DC\uB4DC \uCE74\uD0C8\uB85C\uADF8 \uC5F0\uACB0)" })] }) }));
}
function CubeGrid({ onSelectCube, selectedCubeId }) {
    const cells = Array.from({ length: 15 }, (_, i) => `slot-${i}`);
    return (_jsxs("main", { className: "grid-area", children: [_jsxs("div", { className: "grid-meta", children: [_jsx("span", { children: "\uB9AC\uC2A4\uD2B8 1 \u00B7 \uD398\uC774\uC9C0 1 / 1" }), _jsxs("div", { className: "grid-meta-actions", children: [_jsx("button", { className: "btn-ghost", children: "\uC774\uC804" }), _jsx("button", { className: "btn-ghost", children: "\uB2E4\uC74C" })] })] }), _jsx("div", { className: "cube-grid", role: "grid", "aria-label": "\uD050\uBE0C \uADF8\uB9AC\uB4DC", style: { gridTemplateColumns: 'repeat(5, 1fr)' }, children: cells.map((id) => (_jsx("button", { type: "button", role: "gridcell", className: `cube-cell ${selectedCubeId === id ? 'is-selected' : ''}`, onClick: () => onSelectCube(selectedCubeId === id ? null : id), "aria-pressed": selectedCubeId === id, children: _jsx("span", { className: "cube-empty", children: "\uBE48 \uC2AC\uB86F" }) }, id))) }), _jsx("div", { className: "grid-hint", children: "M2 \uB2E8\uACC4: .cubepack \uB85C\uB4DC + \uB4DC\uB798\uADF8 \uBC30\uCE58 + \uD398\uC774\uC9C0 \uC774\uB3D9 \uAD6C\uD604" })] }));
}
function Inspector({ selectedCubeId }) {
    if (selectedCubeId === null) {
        return (_jsx("aside", { className: "inspector", "aria-label": "\uD050\uBE0C \uC778\uC2A4\uD399\uD130", children: _jsx("div", { className: "inspector-empty", children: "\uD050\uBE0C\uB97C \uC120\uD0DD\uD558\uC138\uC694" }) }));
    }
    return (_jsxs("aside", { className: "inspector", "aria-label": "\uD050\uBE0C \uC778\uC2A4\uD399\uD130", children: [_jsx("h3", { className: "inspector-title", children: "\uD050\uBE0C \uC18D\uC131" }), _jsxs("dl", { className: "inspector-fields", children: [_jsx("dt", { children: "\uC2AC\uB86F ID" }), _jsx("dd", { children: selectedCubeId }), _jsx("dt", { children: "\uB77C\uBCA8" }), _jsx("dd", { children: _jsx("input", { type: "text", placeholder: "(\uB77C\uBCA8 \uC785\uB825)" }) }), _jsx("dt", { children: "\uC561\uC158 \uD0C0\uC785" }), _jsx("dd", { children: _jsxs("select", { children: [_jsx("option", { value: "", children: "(\uC120\uD0DD)" }), _jsx("option", { value: "open-url", children: "\uB9C1\uD06C \uC5F4\uAE30" }), _jsx("option", { value: "open-app", children: "\uC571 \uC2E4\uD589" }), _jsx("option", { value: "run-shortcut", children: "\uB2E8\uCD95\uD0A4" }), _jsx("option", { value: "run-macro", children: "\uB9E4\uD06C\uB85C" })] }) })] }), _jsx("div", { className: "inspector-hint", children: "M3 \uB2E8\uACC4: \uC561\uC158 \uD2B8\uB808\uC774\uD2B8 \uD45C\uC900\uD654 + \uC2A4\uD0A4\uB9C8 \uAE30\uBC18 \uB3D9\uC801 \uD3FC" })] }));
}
