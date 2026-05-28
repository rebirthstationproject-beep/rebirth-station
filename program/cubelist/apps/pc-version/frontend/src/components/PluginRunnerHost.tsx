/**
 * Plugin Runner Host — M4
 *
 * 활성 큐브 (action_type === 'plugin_action') 에 대해 PluginRuntime 마운트.
 * - 큐브 셀이 보이는 동안 plugin index.html 백그라운드 실행 (setInterval 등 작동)
 * - setImage 수신 시 cube.icon_url 실시간 갱신 (zustand)
 * - 큐브 클릭 시 keyDown / keyUp 호출
 *
 * Inspector 안 PropertyInspector iframe 도 별도 인스턴스로 마운트.
 */

import { useEffect, useRef } from 'react';
import { PluginRuntime, generateContextUuid } from '../lib/plugin-runtime';
import { useEditor } from '../store/editor';
import type { Cube } from '../types/cube';

interface PluginActionPayload {
  plugin_uuid?: string;
  plugin_id?: string;
  plugin_dir?: string;
  settings?: Record<string, unknown>;
}

function extractPluginMeta(cube: Cube): {
  pluginId: string;
  pluginDir: string;
  actionUuid: string;
  settings: Record<string, unknown>;
} | null {
  if (cube.action_type !== 'plugin_action') return null;
  const p = cube.action_payload as PluginActionPayload;
  if (!p?.plugin_id || !p?.plugin_dir || !p?.plugin_uuid) return null;
  return {
    pluginId: p.plugin_id,
    pluginDir: p.plugin_dir,
    actionUuid: p.plugin_uuid,
    settings: p.settings ?? {},
  };
}

const HIDDEN_HOST_ID = 'cubelist-plugin-hidden-host';

/**
 * 보이지 않는 host container — body 에 fixed 위치 0×0, plugin iframe 들 마운트.
 * 화면에 안 보이지만 JS 실행은 살아 있음 (setInterval, requestAnimationFrame).
 */
export function PluginActionRunner({ cube }: { cube: Cube }) {
  const libraryDir = typeof window !== 'undefined'
    ? window.localStorage.getItem('cubelist:library_dir') ?? ''
    : '';
  const updateCubeIcon = useEditor((s) => s.updateCubeIconUrl);
  const runtimeRef = useRef<PluginRuntime | null>(null);
  const contextRef = useRef<string>(generateContextUuid());

  useEffect(() => {
    const meta = extractPluginMeta(cube);
    if (!meta || !libraryDir) return;

    let hostContainer = document.getElementById(HIDDEN_HOST_ID);
    if (!hostContainer) {
      hostContainer = document.createElement('div');
      hostContainer.id = HIDDEN_HOST_ID;
      hostContainer.style.cssText =
        'position:fixed;left:-9999px;top:-9999px;width:144px;height:144px;overflow:hidden;pointer-events:none;';
      document.body.appendChild(hostContainer);
    }

    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:144px;height:144px;';
    hostContainer.appendChild(wrap);

    const runtime = new PluginRuntime({
      pluginId: meta.pluginId,
      pluginDir: meta.pluginDir,
      actionUuid: meta.actionUuid,
      contextUuid: contextRef.current,
      libraryDir,
      settings: meta.settings,
      kind: 'action',
      onSetImage: (base64) => updateCubeIcon(cube.id, base64),
      onSetTitle: () => {
        /* 큐브 라벨은 사용자 수정 우선 — plugin setTitle 무시 */
      },
      onOpenUrl: async (url) => {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('open_external_url', { url });
        } catch (e) {
          console.warn('[PluginRunner] openUrl 실패', e);
        }
      },
      onLog: (msg, level) => {
        const prefix = `[plugin ${meta.actionUuid}]`;
        if (level === 'error') console.error(prefix, msg);
        else if (level === 'warn') console.warn(prefix, msg);
        else console.log(prefix, msg);
      },
    });
    runtimeRef.current = runtime;

    void runtime.mount(wrap, 'index.html');
    cubeRuntimeMap.set(cube.id, runtime);

    return () => {
      cubeRuntimeMap.delete(cube.id);
      runtime.unmount();
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cube.id, libraryDir]);

  return null;
}

/** 큐브 ID → PluginRuntime 매핑 (큐브 클릭 시 fireKey 호출용) */
const cubeRuntimeMap = new Map<string, PluginRuntime>();

export function fireCubeKey(cubeId: string): boolean {
  const r = cubeRuntimeMap.get(cubeId);
  if (!r) return false;
  r.fireKey();
  return true;
}

/** 진단용 — 큐브의 plugin runtime 상태 반환 */
export function getCubeRuntimeStatus(cubeId: string): {
  mounted: boolean;
  connected: boolean;
  lastError: string | null;
  imageCallCount: number;
  lastImageAgeMs: number;
} | null {
  const r = cubeRuntimeMap.get(cubeId);
  if (!r) return null;
  return {
    mounted: true,
    connected: r.connected,
    lastError: r.lastError,
    imageCallCount: r.imageCallCount,
    lastImageAgeMs: r.lastImageAt > 0 ? Date.now() - r.lastImageAt : -1,
  };
}

/**
 * 활성 plugin_action 큐브들을 화면 밖 host 에서 모두 마운트.
 * - pack.lists 안 모든 cubes 중 plugin_action 만 필터링
 * - draft list 도 포함
 */
export function PluginActionsBackground() {
  const pack = useEditor((s) => s.pack);
  const draftList = useEditor((s) => s.draft_list);
  const cubes: Cube[] = [];
  if (pack) {
    for (const list of pack.lists) {
      for (const c of list.cubes) {
        if (c.action_type === 'plugin_action' && extractPluginMeta(c)) cubes.push(c);
      }
    }
    if (pack.cubes) {
      for (const c of pack.cubes) {
        if (c.action_type === 'plugin_action' && extractPluginMeta(c)) cubes.push(c);
      }
    }
  }
  if (draftList) {
    for (const c of draftList.cubes) {
      if (c.action_type === 'plugin_action' && extractPluginMeta(c)) cubes.push(c);
    }
  }
  // 중복 제거 (같은 cube.id)
  const seen = new Set<string>();
  const unique = cubes.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  return (
    <>
      {unique.map((c) => (
        <PluginActionRunner key={c.id} cube={c} />
      ))}
    </>
  );
}

/**
 * Inspector 안 PropertyInspector iframe.
 * 선택된 큐브가 plugin_action 일 때만 표시.
 */
export function PluginPropertyInspector({ cube }: { cube: Cube }) {
  const libraryDir = typeof window !== 'undefined'
    ? window.localStorage.getItem('cubelist:library_dir') ?? ''
    : '';
  const updateCubeSettings = useEditor((s) => s.updateCubeSettings);
  const containerRef = useRef<HTMLDivElement>(null);
  const piRuntimeRef = useRef<PluginRuntime | null>(null);

  useEffect(() => {
    const meta = extractPluginMeta(cube);
    if (!meta || !libraryDir || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const piRuntime = new PluginRuntime({
      pluginId: meta.pluginId,
      pluginDir: meta.pluginDir,
      actionUuid: meta.actionUuid,
      contextUuid: generateContextUuid(),
      libraryDir,
      settings: meta.settings,
      kind: 'pi',
      onSetSettings: (next) => {
        updateCubeSettings(cube.id, next);
        // action runtime 에게도 didReceiveSettings 발송
        const actionRuntime = cubeRuntimeMap.get(cube.id);
        if (actionRuntime) actionRuntime.applySettings(next);
      },
      onSendToPropertyInspector: (payload) => {
        // PI 에서 action 으로 sendToPlugin 시 — 우리는 둘 다 동일 host 라 forward
        const actionRuntime = cubeRuntimeMap.get(cube.id);
        if (actionRuntime) actionRuntime.forwardToPlugin(payload);
      },
      onLog: (msg, level) => {
        const prefix = `[PI ${meta.actionUuid}]`;
        if (level === 'error') console.error(prefix, msg);
        else if (level === 'warn') console.warn(prefix, msg);
        else console.log(prefix, msg);
      },
    });
    piRuntimeRef.current = piRuntime;

    // PropertyInspector 경로 = manifest.Actions[].PropertyInspectorPath 또는 default
    // 일단 propertyinspector/index.html 시도
    const piPath = `propertyinspector/index.html`;
    void piRuntime.mount(container, piPath);

    return () => {
      piRuntime.unmount();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cube.id, libraryDir]);

  return <div ref={containerRef} className="plugin-pi-container" />;
}
