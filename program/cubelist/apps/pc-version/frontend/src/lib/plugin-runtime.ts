/**
 * StreamDeck Plugin Runtime — M4 (큐브 리스트 PC 트랙)
 *
 * iframe 안 plugin index.html 을 로드하고, StreamDeck SDK WebSocket API 와
 * 호환되는 MockWebSocket 을 주입하여 plugin JS 가 그대로 작동하게 함.
 *
 * 지원 SDK 메시지 (plugin ↔ host):
 *   host → plugin (events):
 *     - willAppear / willDisappear
 *     - keyDown / keyUp
 *     - didReceiveSettings / didReceiveGlobalSettings
 *     - sendToPlugin (PropertyInspector 에서)
 *     - applicationDidLaunch / applicationDidTerminate (stub)
 *     - deviceDidConnect / deviceDidDisconnect (stub)
 *     - systemDidWakeUp (stub)
 *
 *   plugin → host (commands):
 *     - setSettings / getSettings
 *     - setGlobalSettings / getGlobalSettings
 *     - setImage (base64 → cube 아이콘 실시간 갱신)
 *     - setTitle (라벨 갱신)
 *     - setState (multi-state action)
 *     - showAlert / showOk (시각 피드백)
 *     - openUrl (외부 URL — Tauri open_external_url)
 *     - logMessage (콘솔 로그)
 *     - sendToPropertyInspector
 *     - switchToProfile (stub)
 *
 * 작동 흐름:
 *   1. mount(container) → iframe 생성 + plugin index.html src 설정
 *   2. iframe load 직후 MockWebSocket 주입 + connectElgatoStreamDeckSocket() 호출
 *   3. plugin 이 ws.send(JSON) → host 가 dispatch → onSetImage/onSetTitle 등 콜백
 *   4. host 가 sendEvent("keyDown", payload) → plugin 의 onmessage 호출
 *   5. unmount() → iframe 제거 + 리소스 정리
 */

// M4: asset:// 제거 (cubelist-plugin:// 만 사용). convertFileSrc 더 이상 필요 X.

/** M4 Step 2: custom URI scheme — cubelist-plugin://<plugin_id>/<rest>
 *  Rust register_uri_scheme_protocol 가 처리. HTTP response 헤더 우리가 제어.
 *  asset:// 가 WebView2 frame 차단 시 우회용. */
function buildPluginUrl(pluginId: string, pluginDir: string, htmlRelative: string): string {
  // pluginDir = "<vendor>.<name>.sdPlugin/" (trailing slash 포함)
  const path = `${pluginDir}${htmlRelative}`;
  return `cubelist-plugin://${pluginId}/${path}`;
}

/** unique context UUID — 각 cube instance 마다 다름 */
export function generateContextUuid(): string {
  return (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
    Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export interface PluginRuntimeOptions {
  /** _plugins/<plugin_id>/ 식별자 (예: com.gallowaylabs.tomato) */
  pluginId: string;
  /** ZIP 안 sdPlugin 경로 prefix (예: com.gallowaylabs.tomato.sdPlugin/) */
  pluginDir: string;
  /** 액션 UUID (예: com.gallowaylabs.tomato.clock) */
  actionUuid: string;
  /** unique per cube instance — 같은 plugin 의 N 개 큐브 = N 개 다른 context */
  contextUuid: string;
  /** 라이브러리 폴더 절대 경로 (Tauri 환경) */
  libraryDir: string;
  /** PropertyInspector 옵션 (사용자가 설정한 값) */
  settings: Record<string, unknown>;
  /** plugin entry path (HTML: "index.html", Native: "cpu.exe") */
  codePath?: string;
  /** 'html' = iframe runtime, 'native' = child process + WS 서버 */
  codeKind?: 'html' | 'native';
  /** plugin → host 콜백 */
  onSetImage?: (base64DataUrl: string, state?: number) => void;
  onSetTitle?: (title: string, state?: number) => void;
  onSetState?: (state: number) => void;
  onSetSettings?: (settings: Record<string, unknown>) => void;
  onSetGlobalSettings?: (settings: Record<string, unknown>) => void;
  onSendToPropertyInspector?: (payload: Record<string, unknown>) => void;
  onShowAlert?: () => void;
  onShowOk?: () => void;
  onOpenUrl?: (url: string) => void;
  onLog?: (message: string, level?: 'info' | 'warn' | 'error') => void;
  /** M4 Step 4.1: switchToProfile → host 가 list 전환 처리 */
  onSwitchProfile?: (profile: string) => void;
  /** M4 Step 4.5: setTriggerDescription (인코더 안내, 큐브 리스트 환경 = 표시만) */
  onTriggerDescription?: (desc: Record<string, unknown>) => void;
  /** 어떤 종류의 host iframe — 'action' = key 액션, 'pi' = PropertyInspector */
  kind?: 'action' | 'pi';
}

interface SdkMessage {
  event: string;
  action?: string;
  context?: string;
  device?: string;
  payload?: Record<string, unknown>;
}

const REGISTER_EVENT_ACTION = 'registerPlugin';
const REGISTER_EVENT_PI = 'registerPropertyInspector';

/**
 * StreamDeck SDK WebSocket 을 흉내내는 MockWebSocket.
 * - readyState, send, close, onopen/onmessage 인터페이스 호환
 * - host 쪽에서 plugin 의 send() 메시지를 직접 캡쳐
 * - host 가 plugin 에게 메시지 보낼 때 dispatchEvent('message', {data: JSON})
 */
class MockWebSocket extends EventTarget {
  // WebSocket constants
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState = 0;
  url = '';

  // host 가 plugin send 를 받는 callback
  private hostOnSend: (msg: string) => void;

  // plugin 의 onopen / onmessage / onclose 직접 핸들러
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  constructor(url: string, hostOnSend: (msg: string) => void) {
    super();
    this.url = url;
    this.hostOnSend = hostOnSend;
    // 다음 microtask 에 open
    setTimeout(() => this.simulateOpen(), 0);
  }

  send(data: string | ArrayBuffer | Blob): void {
    if (this.readyState !== this.OPEN) return;
    const str = typeof data === 'string' ? data : '(binary)';
    try {
      this.hostOnSend(str);
    } catch (e) {
      console.error('[MockWebSocket] hostOnSend 실패', e);
    }
  }

  close(): void {
    if (this.readyState === this.CLOSED) return;
    this.readyState = this.CLOSED;
    const ev = new CloseEvent('close', { wasClean: true, code: 1000, reason: 'unmount' });
    this.onclose?.(ev);
    this.dispatchEvent(ev);
  }

  /** host → plugin 메시지 주입 */
  deliverMessage(json: string): void {
    if (this.readyState !== this.OPEN) return;
    const ev = new MessageEvent('message', { data: json });
    this.onmessage?.(ev);
    this.dispatchEvent(ev);
  }

  private simulateOpen(): void {
    this.readyState = this.OPEN;
    const ev = new Event('open');
    this.onopen?.(ev);
    this.dispatchEvent(ev);
  }
}

export class PluginRuntime {
  private iframe: HTMLIFrameElement | null = null;
  private mockSocket: MockWebSocket | null = null;
  private mounted = false;
  private currentSettings: Record<string, unknown>;
  /** 진단용 — connectElgatoStreamDeckSocket 호출 성공 시 true */
  connected = false;
  /** 진단용 — 마지막 에러 메시지 */
  lastError: string | null = null;
  /** 진단용 — setImage 콜 카운트 (실시간 갱신 작동 검증) */
  imageCallCount = 0;
  /** 진단용 — 마지막 setImage 시각 (ms) */
  lastImageAt = 0;
  /** 자동 재시도 카운트 (최대 3회) */
  private retryCount = 0;
  private container: HTMLElement | null = null;
  private htmlRelativePath = '';
  private connectTimer: number | null = null;

  constructor(public readonly options: PluginRuntimeOptions) {
    this.currentSettings = { ...options.settings };
  }

  /** 마운트 — kind 에 따라 iframe(html) 또는 child process(native) */
  async mount(container: HTMLElement, htmlRelativePath: string): Promise<void> {
    if (this.mounted) return;
    this.mounted = true;
    this.container = container;
    this.htmlRelativePath = htmlRelativePath;
    if (this.options.codeKind === 'native') {
      void this.doMountNative();
    } else {
      this.doMount();
    }
  }

  /** M4 Step 3: Native (.exe) plugin runtime — Rust spawn + Tauri event listen */
  private async doMountNative(): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');
      const info = JSON.stringify({
        application: { language: 'en', platform: 'windows', platformVersion: '10', version: '6.5.0' },
        plugin: { uuid: this.options.pluginId, version: '1.0' },
        devicePixelRatio: window.devicePixelRatio || 1,
        devices: [
          {
            id: 'cubelist-virtual',
            name: '큐브 리스트 가상 키패드',
            size: { columns: 4, rows: 7 },
            type: 7,
          },
        ],
      });
      // 1) Tauri event 리스너 등록 (plugin → host)
      this.nativeUnlisten = await listen<[string, string]>('plugin_native_message', (event) => {
        const [ctx, msg] = event.payload;
        if (ctx !== this.options.contextUuid) return;
        this.handlePluginMessage(msg);
      });
      // 2) child process spawn
      const exeRelative = this.options.codePath ?? 'plugin.exe';
      const pid = await invoke<number>('spawn_plugin_process', {
        libraryDir: this.options.libraryDir,
        pluginId: this.options.pluginId,
        pluginDir: this.options.pluginDir,
        exeRelative,
        contextUuid: this.options.contextUuid,
        infoJson: info,
      });
      this.connected = true;
      this.options.onLog?.(`[PluginRuntime native] spawn OK pid=${pid} · ${this.options.actionUuid}`);
      // 3) registerPlugin 이후 willAppear / didReceiveSettings 발송
      setTimeout(() => this.dispatchNative('willAppear'), 100);
      setTimeout(() => this.sendDidReceiveSettingsNative(), 150);
    } catch (e) {
      this.lastError = `native spawn 실패: ${(e as Error).message ?? e}`;
      this.options.onLog?.(`[PluginRuntime native] ${this.lastError}`, 'error');
    }
  }

  /** native plugin 에 메시지 전송 */
  private async sendNative(json: string): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('send_to_plugin', {
        contextUuid: this.options.contextUuid,
        message: json,
      });
    } catch (e) {
      this.options.onLog?.(`[PluginRuntime native] send 실패: ${(e as Error).message}`, 'warn');
    }
  }

  private dispatchNative(event: string, extra?: Record<string, unknown>): void {
    const msg = {
      event,
      action: this.options.actionUuid,
      context: this.options.contextUuid,
      device: 'cubelist-virtual',
      payload: {
        settings: this.currentSettings,
        coordinates: { column: 0, row: 0 },
        state: 0,
        isInMultiAction: false,
        ...extra,
      },
    };
    void this.sendNative(JSON.stringify(msg));
  }

  private sendDidReceiveSettingsNative(): void {
    this.dispatchNative('didReceiveSettings', { settings: this.currentSettings });
  }

  private nativeUnlisten: (() => void) | null = null;

  private doMount(): void {
    const container = this.container;
    if (!container) return;
    const htmlRelativePath = this.htmlRelativePath;

    const iframe = document.createElement('iframe');
    iframe.className = 'plugin-iframe';
    iframe.style.cssText =
      'width:100%;height:100%;border:none;background:transparent;';
    // sandbox 제거 — WebView2 가 sandbox + asset:// 조합 차단함 ("이 콘텐츠는 차단되었습니다")
    iframe.allow = 'autoplay; clipboard-read; clipboard-write';
    iframe.referrerPolicy = 'no-referrer';

    // M4 Step 3.5+: cubelist-plugin:// 만 사용 (asset:// fallback 제거)
    // 이유: asset:// 는 상대 경로 base URL 추론 못 함 ("File does not exist at path: action/js/clock.js")
    // cubelist-plugin:// 는 Rust handler 가 HTML <base href> 자동 inject → 모든 상대 src resolve
    const customUrl = buildPluginUrl(
      this.options.pluginId,
      this.options.pluginDir,
      htmlRelativePath,
    );
    iframe.src = customUrl;
    this.options.onLog?.(
      `[PluginRuntime] iframe.src = ${iframe.src} (retry=${this.retryCount})`,
    );

    // iframe 안 plugin 의 send 받기 위해 MockWebSocket 주입
    const onPluginSend = (msg: string): void => this.handlePluginMessage(msg);
    const mock = new MockWebSocket('ws://mock.cubelist.local/', onPluginSend);
    this.mockSocket = mock;

    iframe.addEventListener('load', () => {
      try {
        const win = iframe.contentWindow as Window | null;
        if (!win) {
          this.options.onLog?.('[PluginRuntime] iframe.contentWindow 없음', 'error');
          this.lastError = 'iframe.contentWindow 없음';
          return;
        }
        this.options.onLog?.(`[PluginRuntime] iframe loaded · src=${iframe.src}`);

        // M4 Step 5.3: plugin JS 예외 자동 복구 — iframe.contentWindow 의 error 리스닝
        try {
          win.addEventListener('error', (ev) => {
            const ee = ev as ErrorEvent;
            this.options.onLog?.(
              `[plugin js error] ${ee.message ?? '?'} @ ${ee.filename ?? '?'}:${ee.lineno ?? 0}`,
              'error',
            );
          });
          win.addEventListener('unhandledrejection', (ev) => {
            const pe = ev as PromiseRejectionEvent;
            this.options.onLog?.(`[plugin promise rej] ${String(pe.reason)}`, 'error');
          });
        } catch {
          /* cross-origin 으로 listener add 실패 — 무시 */
        }

        // 1. plugin 안에 MockWebSocket 을 window.WebSocket 으로 주입
        // plugin 의 new WebSocket(...) 호출 = 우리 mock 인스턴스 반환
        // 이미 mock 만들었으므로 plugin 이 WebSocket() 부르면 그 mock 으로 갈 수 있게 patch
        const sharedMock = mock;
        const w = win as unknown as { WebSocket: unknown };
        w.WebSocket = function PatchedWebSocket() {
          return sharedMock;
        } as unknown as typeof WebSocket;

        // 2. connectElgatoStreamDeckSocket(port, uuid, registerEvent, info) 호출
        const registerEvent =
          this.options.kind === 'pi' ? REGISTER_EVENT_PI : REGISTER_EVENT_ACTION;
        const info = {
          application: {
            language: 'en',
            platform: 'windows',
            platformVersion: '10',
            version: '6.5.0',
          },
          plugin: {
            uuid: this.options.pluginId,
            version: '1.0',
          },
          devicePixelRatio: window.devicePixelRatio || 1,
          colors: {
            buttonPressedBackgroundColor: '#303030',
            buttonPressedBorderColor: '#646464',
            buttonPressedTextColor: '#969696',
            disabledColor: '#F7821B59',
            highlightColor: '#F7821B',
            mouseDownColor: '#CF6304',
          },
          devices: [
            {
              id: 'cubelist-virtual',
              name: '큐브 리스트 가상 키패드',
              size: { columns: 4, rows: 7 },
              type: 7, // virtual
            },
          ],
        };
        const connector = (win as Window & {
          connectElgatoStreamDeckSocket?: (
            port: number,
            uuid: string,
            event: string,
            info: string,
          ) => void;
        }).connectElgatoStreamDeckSocket;
        if (typeof connector === 'function') {
          // SDK 표준 시그니처 (4 인자 + info JSON string)
          connector.call(win, 0, this.options.contextUuid, registerEvent, JSON.stringify(info));
          this.connected = true;
          this.options.onLog?.(`[PluginRuntime] connectElgatoStreamDeckSocket 호출 OK · ${this.options.actionUuid}`);
        } else {
          this.lastError = 'connectElgatoStreamDeckSocket 미정의';
          this.options.onLog?.(
            '[PluginRuntime] connectElgatoStreamDeckSocket 함수 미정의 — SDK 미사용 plugin?',
            'warn',
          );
        }

        // 3. action runtime: registerPlugin 직후 willAppear 발송
        if (this.options.kind !== 'pi') {
          setTimeout(() => this.dispatch('willAppear'), 30);
          // didReceiveSettings 도 보내 — plugin 이 saved settings 받음
          setTimeout(() => this.sendDidReceiveSettings(), 50);
        }
      } catch (e) {
        this.options.onLog?.(
          `[PluginRuntime] iframe load 핸들러 실패: ${(e as Error).message}`,
          'error',
        );
      }
    });

    iframe.addEventListener('error', () => {
      this.lastError = 'iframe load 에러';
      this.options.onLog?.('[PluginRuntime] iframe load 에러', 'error');
      this.scheduleRetry();
    });

    container.appendChild(iframe);
    this.iframe = iframe;

    // 5초 안에 connected 안 되면 재시도 (asset:// 차단 또는 connectElgatoStreamDeckSocket 미정의)
    if (this.connectTimer) window.clearTimeout(this.connectTimer);
    this.connectTimer = window.setTimeout(() => {
      if (!this.connected) {
        this.lastError = this.lastError ?? 'SDK 초기화 타임아웃 (5s) — connectElgatoStreamDeckSocket 미호출';
        this.options.onLog?.(
          `[PluginRuntime] ${this.lastError} · retry ${this.retryCount}/3`,
          'warn',
        );
        this.scheduleRetry();
      }
    }, 5000);
  }

  /** 자동 재시도 — 최대 3회. iframe 제거 후 다시 마운트 */
  private scheduleRetry(): void {
    if (this.retryCount >= 3) {
      this.options.onLog?.('[PluginRuntime] 재시도 한계 도달 (3회)', 'error');
      return;
    }
    this.retryCount += 1;
    window.setTimeout(() => {
      if (!this.mounted) return; // unmount 됐으면 중단
      this.options.onLog?.(`[PluginRuntime] 재시도 #${this.retryCount}`, 'warn');
      if (this.iframe && this.iframe.parentNode) {
        this.iframe.parentNode.removeChild(this.iframe);
      }
      this.iframe = null;
      if (this.mockSocket) {
        this.mockSocket.close();
        this.mockSocket = null;
      }
      this.mounted = false;
      this.connected = false;
      this.lastError = null;
      this.mount(this.container!, this.htmlRelativePath);
    }, 1000 * this.retryCount);
  }

  /** 큐브 클릭 시 keyDown → 100ms 후 keyUp */
  fireKey(): void {
    if (this.options.codeKind === 'native') {
      this.dispatchNative('keyDown');
      setTimeout(() => this.dispatchNative('keyUp'), 80);
      return;
    }
    this.dispatch('keyDown');
    setTimeout(() => this.dispatch('keyUp'), 80);
  }

  /** PropertyInspector 에서 sendToPlugin 받았을 때 plugin 에게 전달 */
  forwardToPlugin(payload: Record<string, unknown>): void {
    this.dispatch('sendToPlugin', payload);
  }

  /** plugin 에게 didReceiveSettings 직접 발송 (외부 setting 변경 시) */
  applySettings(next: Record<string, unknown>): void {
    this.currentSettings = { ...next };
    this.sendDidReceiveSettings();
  }

  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;
    try {
      if (this.options.codeKind === 'native') {
        this.dispatchNative('willDisappear');
      } else {
        this.dispatch('willDisappear');
      }
    } catch {
      /* ignore */
    }
    if (this.mockSocket) {
      this.mockSocket.close();
      this.mockSocket = null;
    }
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
    this.iframe = null;
    // M4 Step 3.6: native runtime cleanup
    if (this.options.codeKind === 'native') {
      if (this.nativeUnlisten) {
        this.nativeUnlisten();
        this.nativeUnlisten = null;
      }
      void (async () => {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('drop_plugin_context', { contextUuid: this.options.contextUuid });
        } catch (e) {
          this.options.onLog?.(`[PluginRuntime native] drop 실패: ${(e as Error).message}`, 'warn');
        }
      })();
    }
  }

  /** plugin 의 send(JSON) 메시지 처리 */
  private handlePluginMessage(json: string): void {
    let msg: SdkMessage;
    try {
      msg = JSON.parse(json) as SdkMessage;
    } catch (e) {
      this.options.onLog?.(`[Plugin send] JSON 파싱 실패: ${(e as Error).message}`, 'warn');
      return;
    }

    switch (msg.event) {
      case 'setImage': {
        const image = msg.payload?.image as string | undefined;
        const state = msg.payload?.state as number | undefined;
        if (image) {
          this.imageCallCount += 1;
          this.lastImageAt = Date.now();
          this.options.onSetImage?.(image, state);
        }
        break;
      }
      case 'setTitle': {
        const title = msg.payload?.title as string | undefined;
        const state = msg.payload?.state as number | undefined;
        if (typeof title === 'string') this.options.onSetTitle?.(title, state);
        break;
      }
      case 'setState': {
        const state = msg.payload?.state as number | undefined;
        if (typeof state === 'number') this.options.onSetState?.(state);
        break;
      }
      case 'setSettings': {
        const settings = (msg.payload ?? {}) as Record<string, unknown>;
        this.currentSettings = settings;
        this.options.onSetSettings?.(settings);
        break;
      }
      case 'getSettings': {
        // didReceiveSettings 응답
        this.sendDidReceiveSettings();
        break;
      }
      case 'setGlobalSettings': {
        const settings = (msg.payload ?? {}) as Record<string, unknown>;
        this.options.onSetGlobalSettings?.(settings);
        break;
      }
      case 'getGlobalSettings': {
        this.dispatch('didReceiveGlobalSettings', { settings: {} });
        break;
      }
      case 'sendToPropertyInspector': {
        const payload = (msg.payload ?? {}) as Record<string, unknown>;
        this.options.onSendToPropertyInspector?.(payload);
        break;
      }
      case 'sendToPlugin': {
        // PI runtime 에서 발송된 경우 — host 가 action runtime 으로 forward
        const payload = (msg.payload ?? {}) as Record<string, unknown>;
        this.options.onSendToPropertyInspector?.(payload);
        break;
      }
      case 'showAlert':
        this.options.onShowAlert?.();
        break;
      case 'showOk':
        this.options.onShowOk?.();
        break;
      case 'openUrl': {
        const url = msg.payload?.url as string | undefined;
        if (url) this.options.onOpenUrl?.(url);
        break;
      }
      case 'logMessage': {
        const message = msg.payload?.message as string | undefined;
        if (message) this.options.onLog?.(message, 'info');
        break;
      }
      case 'switchToProfile': {
        // M4 Step 4.1: 큐브 list 전환에 매핑 (큐브 리스트의 list 와 StreamDeck profile 등가)
        const profile = msg.payload?.profile as string | undefined;
        this.options.onLog?.(`[plugin] switchToProfile → ${profile ?? '(empty)'}`, 'info');
        // store 의 selectList 호출 옵션 — host 가 직접 처리
        if (profile && this.options.onSwitchProfile) {
          this.options.onSwitchProfile(profile);
        }
        break;
      }
      case 'getDeviceList': {
        // M4 Step 4.2: 가상 device 응답
        this.dispatch('didReceiveDeviceList', {
          devices: [
            {
              id: 'cubelist-virtual',
              name: '큐브 리스트 가상 키패드',
              size: { columns: 4, rows: 7 },
              type: 7,
            },
          ],
        });
        break;
      }
      case 'setTriggerDescription': {
        // M4 Step 4.5: 인코더 안내 텍스트 (큐브 리스트 환경에선 표시만)
        const desc = msg.payload as Record<string, unknown>;
        this.options.onTriggerDescription?.(desc);
        break;
      }
      case 'setFeedback':
      case 'setFeedbackLayout': {
        // M4 Step 4.3: StreamDeck+ 인코더 layout — 큐브 리스트는 키 액션만 = 무시
        this.options.onLog?.(`[plugin] ${msg.event} (인코더 미지원 — 무시)`, 'info');
        break;
      }
      default:
        this.options.onLog?.(`[Plugin send] 알 수 없는 event: ${msg.event}`, 'warn');
    }
  }

  /** host → plugin 메시지 발송 */
  private dispatch(event: string, extraPayload?: Record<string, unknown>): void {
    if (!this.mockSocket) return;
    const fullMsg = {
      event,
      action: this.options.actionUuid,
      context: this.options.contextUuid,
      device: 'cubelist-virtual',
      payload: {
        settings: this.currentSettings,
        coordinates: { column: 0, row: 0 },
        state: 0,
        isInMultiAction: false,
        ...extraPayload,
      },
    };
    this.mockSocket.deliverMessage(JSON.stringify(fullMsg));
  }

  private sendDidReceiveSettings(): void {
    this.dispatch('didReceiveSettings', { settings: this.currentSettings });
  }
}
