# Cube List License Key Specification (v0.1.4)

> 작성: 2026-06-01 Phase 13. v0.1.4 마일스톤 활성 예정.

## 1. 목적

유료 큐브팩 install 시 서명된 라이센스 키로 권한 검증.

원칙:
- **오프라인 검증 가능** (서버 호출 없이 Ed25519 공개 키만으로 검증)
- **만료 / 스코프 명시** (perpetual / monthly / yearly)
- **위변조 방지** (Ed25519 64-byte 서명)
- **이메일/사용자 ID 노출 X** (payload는 pack_id + scope 만 포함)

## 2. 키 포맷

```
CL-<base64url(payload_json)>-<base64url(ed25519_signature)>
```

- `CL-` prefix: CubeList 식별자
- `base64url` (RFC 4648 Section 5): URL-safe, padding 제거
- 구분자 `-`: 3개 세그먼트 (prefix / payload / signature)

### 예시

```
CL-eyJwYWNrX2lkIjoiYWJjMTIzIiwic2NvcGUiOiJwZXJwZXR1YWwiLCJpc3N1ZWRfYXQiOiIyMDI2LTA2LTAxVDAwOjAwOjAwWiJ9-MEUCIQDxYR9aV3lQ3l5...
```

## 3. Payload Schema

```json
{
  "v": 1,
  "pack_id": "string",
  "scope": "perpetual" | "monthly" | "yearly",
  "issued_at": "2026-06-01T00:00:00Z",
  "expires_at": "2027-06-01T00:00:00Z",
  "buyer_hash": "sha256(buyer_email)[:16]",
  "session_id": "string"
}
```

- `v`: 버전 (현재 1). 향후 변경 시 검증기 분기
- `pack_id`: 라이센스가 적용되는 큐브팩 ID
- `scope`:
  - `perpetual`: 1회 구매. `expires_at` null 또는 9999-12-31
  - `monthly`: 월간 구독. `expires_at` = `issued_at + 30 days`
  - `yearly`: 연간 구독. `expires_at` = `issued_at + 365 days`
- `issued_at`: 발급 시각 (RFC 3339 / ISO 8601 UTC)
- `expires_at`: 만료 시각. `null` = 영구
- `buyer_hash`: 구매자 식별 해시 (SHA-256 처음 16바이트, hex)
  - 환불/블랙리스트 시 검증
  - 원본 이메일 미노출
- `session_id`: 결제 세션 ID (감사용)

## 4. 서명 알고리즘

### 발급 (서버 측)

```
1. canonical_json = JSON.stringify(payload, sortedKeys)
2. payload_bytes = utf8(canonical_json)
3. signature_bytes = Ed25519.sign(server_private_key, payload_bytes)
4. license_key = "CL-" + base64url(payload_bytes) + "-" + base64url(signature_bytes)
```

### 검증 (클라이언트 = PC 앱)

```
1. parts = license_key.split("-")
2. assert parts[0] == "CL"
3. payload_bytes = base64url_decode(parts[1])
4. signature_bytes = base64url_decode(parts[2])
5. payload = JSON.parse(utf8(payload_bytes))
6. Ed25519.verify(SERVER_PUBLIC_KEY, payload_bytes, signature_bytes)
   → false 시 invalid
7. assert payload.v == 1
8. assert payload.pack_id == requested_pack_id
9. if payload.expires_at != null:
     assert now < payload.expires_at
```

### 공개 키 배포

- PC 앱 빌드 시 컴파일 타임 상수로 임베드 (`SERVER_PUBLIC_KEY: [u8; 32]`)
- 키 로테이션 시 앱 업데이트 필수 (이전 키도 한시적 검증 가능하도록 dual-key 지원)

## 5. 사용 흐름

### 구매 → 발급 → 적용

```
1. PC 앱: MarketplaceCatalog → 유료 큐브팩 클릭
2. PC 앱: PackDetail → "구매 $4.99" 클릭
3. 서버: POST /payment/init → PayPal/Binance Pay redirect_url
4. 사용자: 결제 페이지에서 결제 완료
5. 결제 사이트: Webhook → POST /payment/webhook/paypal
6. 서버: 라이센스 키 발급 (POST /license/issue 내부 호출)
7. 서버: 구매자 이메일로 라이센스 키 발송
8. 사용자: 이메일에서 라이센스 키 복사
9. PC 앱: PackDetail "구매" 재클릭 → license_prompt → 키 입력
10. PC 앱: Ed25519 검증 → valid → install 진행
11. PC 앱: GET /pack/{pack_id}/download (X-License-Key 헤더)
12. 서버: 라이센스 재검증 → .cubepack 응답
```

### 오프라인 검증

```
PC 앱: license_prompt 시 서버 호출 없이 검증
  → 인터넷 끊긴 환경에서도 보유한 라이센스 사용 가능
  → 단, 다운로드(/pack/{id}/download) 는 서버 필요
  → 큐브팩 로컬 보관 시 무제한 재사용 (라이센스 영구)
```

## 6. Rust 구현 가이드 (v0.1.4)

### 의존성

```toml
[dependencies]
ed25519-dalek = { version = "2.1", features = ["pem"] }
base64 = { version = "0.22", features = ["std"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
sha2 = "0.10"
```

### 검증 코드 (frontend → Tauri command 호출)

```rust
// apps/pc-version/src/license.rs
use ed25519_dalek::{Signature, VerifyingKey, Verifier};
use base64::Engine;
use chrono::{DateTime, Utc};

const SERVER_PUBLIC_KEY_BYTES: [u8; 32] = [
    // v0.1.4 진입 시 서버에서 발급된 공개 키 32바이트 임베드
    0; 32 // placeholder
];

#[derive(Debug, serde::Deserialize)]
pub struct LicensePayload {
    pub v: u32,
    pub pack_id: String,
    pub scope: String,
    pub issued_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub buyer_hash: String,
    pub session_id: String,
}

#[derive(Debug, thiserror::Error)]
pub enum LicenseError {
    #[error("invalid format: missing CL- prefix or sections")]
    InvalidFormat,
    #[error("base64 decode error: {0}")]
    Base64(#[from] base64::DecodeError),
    #[error("json parse error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Ed25519 signature verification failed")]
    SignatureFailed,
    #[error("license version mismatch: expected 1, got {0}")]
    VersionMismatch(u32),
    #[error("pack_id mismatch: license for {0}, requested {1}")]
    PackIdMismatch(String, String),
    #[error("license expired at {0}")]
    Expired(DateTime<Utc>),
}

pub fn verify_license(
    license_key: &str,
    requested_pack_id: &str,
) -> Result<LicensePayload, LicenseError> {
    let parts: Vec<&str> = license_key.splitn(3, '-').collect();
    if parts.len() != 3 || parts[0] != "CL" {
        return Err(LicenseError::InvalidFormat);
    }

    let b64 = base64::engine::general_purpose::URL_SAFE_NO_PAD;
    let payload_bytes = b64.decode(parts[1])?;
    let signature_bytes = b64.decode(parts[2])?;

    let public_key = VerifyingKey::from_bytes(&SERVER_PUBLIC_KEY_BYTES)
        .map_err(|_| LicenseError::SignatureFailed)?;
    let signature = Signature::from_slice(&signature_bytes)
        .map_err(|_| LicenseError::SignatureFailed)?;

    public_key
        .verify(&payload_bytes, &signature)
        .map_err(|_| LicenseError::SignatureFailed)?;

    let payload: LicensePayload = serde_json::from_slice(&payload_bytes)?;

    if payload.v != 1 {
        return Err(LicenseError::VersionMismatch(payload.v));
    }
    if payload.pack_id != requested_pack_id {
        return Err(LicenseError::PackIdMismatch(
            payload.pack_id.clone(),
            requested_pack_id.to_string(),
        ));
    }
    if let Some(expires) = payload.expires_at {
        if Utc::now() > expires {
            return Err(LicenseError::Expired(expires));
        }
    }

    Ok(payload)
}
```

### Tauri command 노출

```rust
// apps/pc-version/src/commands.rs
#[tauri::command]
pub fn verify_license_key(
    license_key: String,
    pack_id: String,
) -> Result<LicensePayload, String> {
    license::verify_license(&license_key, &pack_id).map_err(|e| e.to_string())
}
```

### TypeScript 호출

```typescript
// apps/pc-version/frontend/src/components/PackDetail.tsx (v0.1.4)
import { invoke } from '@tauri-apps/api/core';

async function handleInstall() {
  if (isFree) {
    // ... install_free 처리
    return;
  }
  const key = window.prompt(t('mp.license_prompt'), '');
  if (!key) return;
  try {
    const payload = await invoke<LicensePayload>('verify_license_key', {
      licenseKey: key,
      packId: pack.id,
    });
    // valid → 다운로드 진행
    await downloadPack(pack.id, key);
  } catch (e) {
    window.alert(`라이센스 무효: ${e}`);
  }
}
```

## 7. 보안 고려사항

### 키 분실 / 노출

- 사용자 라이센스 키 분실 → 이메일 재발송 워크플로우 (서버 측 보관)
- 키 도용 → 동일 키로 무제한 install 가능 (오프라인 검증 특성)
  - 완화: PC 앱 install 시 `client_id` 와 함께 telemetry 전송 (별도 endpoint)
  - 비정상 패턴 (단일 키 1000+ install) 발견 시 블랙리스트

### 서버 비밀 키 보호

- 서버 private_key는 Cloudflare Workers Secrets / Vault 저장
- 절대 git 커밋 금지
- 키 로테이션: 6개월~1년 주기 권장 (dual-key 지원 기간 1개월 이상)

### 시계 변조 공격

- 사용자가 OS 시계를 과거로 돌려 만료 회피 가능
- 완화: install 시점 timestamp를 서버에 저장 (telemetry)
- 정기 timestamp 동기 (NTP) 권장 — 강제는 X (UX 비용)

## 8. 테스트 벡터 (v0.1.4 작성 예정)

```
public_key (hex): TBD
private_key (hex, server only): TBD

payload_json: {"v":1,"pack_id":"test-pack","scope":"perpetual","issued_at":"2026-06-01T00:00:00Z","expires_at":null,"buyer_hash":"abc123def456","session_id":"sess_001"}

expected_license_key: CL-...
```

## 9. 참고

- 마켓플레이스 API: `marketplace-api.yaml`
- 결제 콜백: `payment-callback.md` (Phase 14)
- 큐브팩 게시 워크플로우: `pack-publish-flow.md` (Phase 15)
- v0.1.3 라이센스 prompt (mock): `apps/pc-version/frontend/src/components/PackDetail.tsx`
