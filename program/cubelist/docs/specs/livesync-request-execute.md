# LiveSync RequestExecute 강화 Specification (v0.1.4)

> 작성: 2026-06-01 Phase 16. v0.1.4 마일스톤 활성 예정.

## 1. 목적

모바일 PWA → PC 헬퍼 양방향 통신 강화. 모바일에서 큐브 누르면 PC 액션 실행.

v0.1.3 현재: PC → 모바일 단방향 (CubeUpdate / SelectionChange broadcast).
v0.1.4 추가: 모바일 → PC RequestExecute + ack/nack + 타임아웃 + 재시도.

## 2. 메시지 흐름

```
모바일                        PC 헬퍼
  |                              |
  |--- press_item (cube_id) --->|  (1) ClientEvent::PressItem
  |                              |     wire spec: live-sync-wire-v1
  |                              |
  |                              |--- 액션 실행 (actions::execute)
  |                              |    (소요 시간 0~3000ms)
  |                              |
  |<-- item_executed ----------- |  (2) ServerEvent::ItemExecuted
  |     status: ok               |     status: ExecutionStatus
  |     elapsed_ms: 1234         |
  |                              |
  |                              |--- broadcast (모든 구독자에)
  |                              |    cube_update (state 변경 시)
  |                              |
  |<-- cube_update -------------- |  (3) ServerEvent::CubeUpdate
  |     cube_id, label, ...       |     (옵션, hotkey_toggle 등)
```

## 3. 메시지 정의 (보강)

### ClientEvent::PressItem (이미 존재, v0.1.3 사용 가능)

```rust
// apps/pc-version/src/protocol/messages.rs
PressItem {
    item_id: ItemId,
    timestamp_ms: u64,
    // v0.1.4 신규
    request_id: Option<String>,   // 클라이언트 발급, ack 매칭용
    nonce: Option<String>,         // 재전송 방지 (auth nonce_cache 활용)
}
```

### ServerEvent::ItemExecuted (Phase 7 보강)

```rust
ItemExecuted {
    item_id: ItemId,
    status: ExecutionStatus,
    elapsed_ms: u32,
    // v0.1.4 신규
    request_id: Option<String>,   // PressItem 의 request_id 에코
}

ExecutionStatus {
    Ok,
    Failed { reason: String },
    PermissionRequired { tier: u8 },
    ActionNotFound { action_type: String },   // Phase 7
    InvalidPayload { errors: Vec<String> },   // Phase 7
    Timeout { elapsed_ms: u32 },               // Phase 7
}
```

## 4. 모바일 측 구현 (apps/mobile-pwa)

### useHelperPress hook (신규)

```typescript
// apps/mobile-pwa/lib/hooks/useHelperPress.ts
import { useHelperConnection } from './useHelperConnection';
import type { ItemId } from '@/types/wire';

interface PressOptions {
  timeoutMs?: number;        // 기본 5000ms
  retryCount?: number;        // 기본 1회 (네트워크 일시 단절)
  retryDelayMs?: number;      // 기본 500ms
}

interface PressResult {
  success: boolean;
  elapsedMs?: number;
  reason?: string;
  status?: string;            // ExecutionStatus.kind
}

export function useHelperPress() {
  const { client } = useHelperConnection();

  return async function press(itemId: ItemId, opts: PressOptions = {}): Promise<PressResult> {
    const timeoutMs = opts.timeoutMs ?? 5000;
    const retryCount = opts.retryCount ?? 1;
    const retryDelayMs = opts.retryDelayMs ?? 500;

    if (!client || !client.isConnected) {
      return { success: false, reason: 'helper not connected' };
    }

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      const requestId = crypto.randomUUID();
      const nonce = crypto.randomUUID();
      const sendTime = Date.now();

      try {
        const result = await new Promise<PressResult>((resolve, reject) => {
          const timer = setTimeout(() => {
            client.off('message', listener);
            reject(new Error('timeout'));
          }, timeoutMs);

          const listener = (raw: unknown) => {
            const event = raw as { event?: string; request_id?: string };
            if (event.event !== 'item_executed') return;
            if (event.request_id !== requestId) return;
            clearTimeout(timer);
            client.off('message', listener);
            const ev = raw as { status: { kind: string; reason?: string }; elapsed_ms: number };
            resolve({
              success: ev.status.kind === 'ok',
              elapsedMs: ev.elapsed_ms,
              reason: ev.status.reason,
              status: ev.status.kind,
            });
          };

          client.on('message', listener);
          client.send({
            event: 'press_item',
            item_id: itemId,
            timestamp_ms: sendTime,
            request_id: requestId,
            nonce,
          });
        });

        return result;
      } catch (e) {
        // timeout — retry
        if (attempt < retryCount) {
          await new Promise((r) => setTimeout(r, retryDelayMs));
          continue;
        }
        return { success: false, reason: 'timeout after retries' };
      }
    }

    return { success: false, reason: 'unreachable' };
  };
}
```

### 호출 시점

```typescript
// 모바일 CubeListView 큐브 onPress
const press = useHelperPress();

async function handleCubePress(item: CubeItem) {
  showToast({ level: 'info', message: '⏳ 실행 중...' });
  const result = await press(item.id, { timeoutMs: 5000 });
  if (result.success) {
    showToast({ level: 'success', message: `✓ ${result.elapsedMs}ms`, duration: 1200 });
  } else {
    showToast({
      level: 'error',
      message: result.reason ?? '실행 실패',
      duration: 3000,
    });
  }
}
```

## 5. PC 측 구현 (apps/pc-version/src)

### ws_server.rs 갱신

```rust
Ok(ClientEvent::PressItem { item_id, timestamp_ms, request_id, nonce }) => {
    // 1. nonce 재전송 방지 (v0.1.4)
    if let Some(n) = &nonce {
        if !auth::nonce_cache::insert_if_new(n, timestamp_ms) {
            let _ = send_event(&mut socket, ServerEvent::Notice {
                level: NoticeLevel::Warning,
                message: format!("Duplicate request: {n}"),
            }).await;
            continue;
        }
    }

    // 2. action 조회 + 실행
    let start = std::time::Instant::now();
    let action_lookup = library::find_action_by_item_id(&item_id).await;

    let status = match action_lookup {
        None => ExecutionStatus::ActionNotFound { action_type: "unknown".into() },
        Some(action) => match actions::execute(&action).await {
            Ok(_) => ExecutionStatus::Ok,
            Err(ActionError::PermissionRequired(tier)) => ExecutionStatus::PermissionRequired { tier },
            Err(ActionError::InvalidPayload(errors)) => ExecutionStatus::InvalidPayload { errors },
            Err(ActionError::Timeout(elapsed)) => ExecutionStatus::Timeout { elapsed_ms: elapsed },
            Err(e) => ExecutionStatus::Failed { reason: e.to_string() },
        },
    };

    let elapsed_ms = start.elapsed().as_millis() as u32;

    // 3. ack 응답
    let response = ServerEvent::ItemExecuted {
        item_id: item_id.clone(),
        status,
        elapsed_ms,
        request_id,
    };
    let _ = send_event(&mut socket, response).await;
}
```

## 6. 타임아웃 정책

PC 측 액션별 타임아웃:

| 액션 타입 | 타임아웃 |
|---|---|
| link | 2초 (브라우저 spawn) |
| hotkey | 1초 (enigo simulate) |
| hotkey_toggle | 1초 |
| app_launch | 5초 (Process::spawn) |
| clipboard_copy | 1초 |
| text_insert | 2초 |
| macro | 30초 (스텝 수에 비례) |
| folder | 즉시 |
| plugin_action | 5초 (vendor SDK) |

타임아웃 초과 시:
```rust
let result = tokio::time::timeout(
    action_timeout(&action.action_type),
    actions::execute(&action),
).await;

match result {
    Ok(Ok(_)) => ExecutionStatus::Ok,
    Ok(Err(e)) => ExecutionStatus::Failed { reason: e.to_string() },
    Err(_) => ExecutionStatus::Timeout { elapsed_ms: action_timeout_ms(&action.action_type) },
}
```

## 7. 재시도 정책

### 모바일 측

- 네트워크 타임아웃 → 1회 재시도 (500ms 후)
- ExecutionStatus::PermissionRequired → 재시도 X (사용자 prompt 필요)
- ExecutionStatus::ActionNotFound → 재시도 X (영구 실패)
- ExecutionStatus::InvalidPayload → 재시도 X (코드 수정 필요)
- ExecutionStatus::Timeout → 1회 재시도 (긴 타임아웃 10초)
- ExecutionStatus::Failed → 재시도 X (사용자에게 사유 표시)

### PC 측

- broadcast Lagged → warn + skip (v0.1.3 이미 구현)
- 0 구독자 SendError → 무시 (v0.1.3 이미 구현)

## 8. 보안

### nonce 재전송 방지

- 인증 단계 nonce_cache 활용 (auth/nonce_cache.rs)
- TTL 5분 (메모리 LRU)
- 동일 nonce 재수신 시 Notice warning + skip

### request_id 매칭

- 모바일이 발급한 UUID v4
- PC가 ItemExecuted 응답 시 echo
- 모바일은 request_id 매칭으로 자기 응답만 처리

### HMAC + tier

- 모든 액션은 HMAC 인증된 connection 에서만 실행 (v0.1.3 기존)
- Tier 2/3 액션은 별도 사용자 동의 (v0.1.3 기존)

## 9. 모니터링

PC 측 telemetry:
```rust
metrics::record("press_item", labels![
    "action_type" => action.action_type.as_str(),
    "status" => status_kind(&status),
]);
metrics::record_duration("press_item_elapsed_ms", elapsed_ms, labels![
    "action_type" => action.action_type.as_str(),
]);
```

## 10. v0.1.4 활성화 순서

```
T+7일: messages.rs PressItem 에 request_id/nonce 필드 추가
T+10일: ws_server.rs PressItem 처리 강화 (타임아웃 + request_id echo)
T+14일: 모바일 useHelperPress hook + retry 로직
T+21일: 모바일 CubeListView 통합 + toast UI
T+28일: e2e 시나리오 (모바일 누름 → PC 실행 → ack)
```

## 11. 참고

- LiveSync wire spec v1: `live-sync-wire-v1.md` (v0.1.3)
- Phase 7 ExecutionStatus 보강: 메시지 보강의 기반
- 모바일 useLiveSync hook (PC → 모바일): `apps/mobile-pwa/lib/hooks/useLiveSync.ts`
- nonce_cache 구현: `apps/pc-version/src/auth/nonce_cache.rs`
