# Cube List 결제 콜백 Specification (v0.1.4)

> 작성: 2026-06-01 Phase 14. v0.1.4 마일스톤 활성 예정.

## 1. 목적

PayPal + Binance Pay 결제 완료 시 Webhook/IPN을 수신하여 라이센스 키 발급 트리거.

원칙:
- **결제 수단 = PayPal + Binance Pay만** (영구 정책: feedback_payment_methods)
  - Stripe / Toss / 국내 PG 절대 금지
- **서명 검증 필수** (위변조 / 재전송 공격 방지)
- **멱등성 보장** (동일 transaction_id 재처리 → 중복 발급 X)
- **신속 응답** (Webhook은 3초 내 200 응답 필수, 라이센스 발급은 비동기)

## 2. PayPal 결제 흐름

### 결제 세션 생성

```
PC 앱: POST /v1/payment/init
Body: {pack_id, payment_method: "paypal", buyer_email, return_url, cancel_url}

서버: PayPal Orders API 호출
  POST https://api-m.paypal.com/v2/checkout/orders
  Headers:
    Authorization: Bearer <paypal_oauth_token>
    Content-Type: application/json
  Body:
    {
      "intent": "CAPTURE",
      "purchase_units": [{
        "reference_id": "<session_id>",
        "amount": {"currency_code": "USD", "value": "4.99"},
        "description": "Cube Pack: <pack_name>",
        "custom_id": "<pack_id>"
      }],
      "application_context": {
        "return_url": "<return_url>",
        "cancel_url": "<cancel_url>",
        "user_action": "PAY_NOW"
      }
    }

PayPal 응답: {id: "ORDER-...", links: [{href: "https://www.paypal.com/checkoutnow?token=..."}]}

서버: redirect_url = links[0].href, session_id 저장 (D1)
서버 → PC 앱: {session_id, redirect_url, expires_at}

PC 앱: window.open(redirect_url) 또는 tauri::shell::open
```

### Webhook 수신

```
PayPal: 결제 완료 후 자동 호출
  POST https://api.rebirthstation.com/v1/payment/webhook/paypal
  Headers:
    PAYPAL-AUTH-ALGO: SHA256withRSA
    PAYPAL-CERT-URL: https://api.paypal.com/v1/notifications/certs/CERT-...
    PAYPAL-TRANSMISSION-ID: <uuid>
    PAYPAL-TRANSMISSION-SIG: <base64-rsa-sig>
    PAYPAL-TRANSMISSION-TIME: <iso8601>
  Body (event_type: PAYMENT.CAPTURE.COMPLETED):
    {
      "event_type": "PAYMENT.CAPTURE.COMPLETED",
      "resource": {
        "id": "CAPTURE-...",
        "amount": {"currency_code": "USD", "value": "4.99"},
        "custom_id": "<pack_id>",
        "supplementary_data": {
          "related_ids": {"order_id": "ORDER-..."}
        }
      }
    }
```

### Webhook 검증 (서버)

```rust
// 1. PayPal Verify Webhook Signature API 호출
let verify_payload = json!({
    "transmission_id": headers["PAYPAL-TRANSMISSION-ID"],
    "transmission_time": headers["PAYPAL-TRANSMISSION-TIME"],
    "cert_url": headers["PAYPAL-CERT-URL"],
    "auth_algo": headers["PAYPAL-AUTH-ALGO"],
    "transmission_sig": headers["PAYPAL-TRANSMISSION-SIG"],
    "webhook_id": env::var("PAYPAL_WEBHOOK_ID")?,
    "webhook_event": serde_json::from_slice(&body)?,
});

let resp: VerifyResponse = client
    .post("https://api-m.paypal.com/v1/notifications/verify-webhook-signature")
    .bearer_auth(&paypal_oauth_token)
    .json(&verify_payload)
    .send()
    .await?
    .json()
    .await?;

if resp.verification_status != "SUCCESS" {
    return Err(400, "signature verification failed");
}
```

### 라이센스 발급 트리거

```
1. 멱등성 체크: D1 SELECT WHERE transaction_id = resource.id
   이미 존재 → 200 OK 즉시 응답 (이전 발급 결과 재사용)

2. 세션 조회: D1 SELECT WHERE session_id = resource.supplementary_data.related_ids.order_id

3. POST /v1/license/issue (서버 내부, X-Server-Secret)
   Body: {pack_id, buyer_email, payment_session_id, scope}

4. 이메일 발송: SendGrid/Resend
   To: buyer_email
   Subject: "[Cube List] 라이센스 키 발급 — <pack_name>"
   Body: 라이센스 키 + 적용 가이드 링크

5. D1 INSERT transaction (멱등성 보장)

6. 200 OK 응답 (3초 내)
```

## 3. Binance Pay 결제 흐름

### 결제 세션 생성

```
PC 앱: POST /v1/payment/init
Body: {pack_id, payment_method: "binance_pay", buyer_email, return_url, cancel_url}

서버: Binance Pay Order API 호출
  POST https://bpay.binanceapi.com/binancepay/openapi/v3/order
  Headers:
    BinancePay-Timestamp: <unix_ms>
    BinancePay-Nonce: <32-char-random>
    BinancePay-Certificate-SN: <merchant_cert_sn>
    BinancePay-Signature: <hmac_sha512(timestamp + nonce + body, api_secret)>
  Body:
    {
      "env": {"terminalType": "WEB"},
      "merchantTradeNo": "<session_id>",
      "orderAmount": "4.99",
      "currency": "USDT",
      "goods": {
        "goodsType": "02",
        "goodsCategory": "Z000",
        "referenceGoodsId": "<pack_id>",
        "goodsName": "<pack_name>"
      },
      "returnUrl": "<return_url>",
      "cancelUrl": "<cancel_url>"
    }

Binance 응답:
  {
    "status": "SUCCESS",
    "code": "000000",
    "data": {
      "prepayId": "...",
      "checkoutUrl": "https://pay.binance.com/checkout/?prepayId=..."
    }
  }
```

### Webhook 수신

```
Binance: 결제 완료 후 자동 호출
  POST https://api.rebirthstation.com/v1/payment/webhook/binance
  Headers:
    BinancePay-Timestamp: <unix_ms>
    BinancePay-Nonce: <32-char-random>
    BinancePay-Signature: <hmac_sha512(timestamp + nonce + body, webhook_secret)>
  Body:
    {
      "bizType": "PAY",
      "bizStatus": "PAY_SUCCESS",
      "bizIdStr": "<order_id>",
      "data": "{\"merchantTradeNo\":\"<session_id>\",\"transactTime\":1717225200000,\"transactionId\":\"...\"}"
    }
```

### Webhook 검증

```rust
let expected_sig = hmac_sha512(
    format!("{timestamp}\n{nonce}\n{body}\n"),
    env::var("BINANCE_WEBHOOK_SECRET")?,
);

if !constant_time_eq(&expected_sig, &headers["BinancePay-Signature"]) {
    return Err(400, "signature verification failed");
}
```

### 응답 형식

```json
{
  "returnCode": "SUCCESS",
  "returnMessage": null
}
```

## 4. 멱등성

D1 스키마:
```sql
CREATE TABLE payment_transactions (
    id TEXT PRIMARY KEY,                -- transaction_id (Binance bizIdStr / PayPal capture id)
    session_id TEXT NOT NULL,           -- our session_id
    pack_id TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    payment_method TEXT NOT NULL,       -- paypal / binance_pay
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,             -- USD / USDT
    status TEXT NOT NULL,               -- pending / success / failed / refunded
    license_key TEXT,                   -- 발급된 라이센스 키
    created_at TEXT NOT NULL,
    processed_at TEXT
);

CREATE INDEX idx_session_id ON payment_transactions(session_id);
CREATE INDEX idx_buyer_email ON payment_transactions(buyer_email);
```

Webhook 진입 시:
```rust
let existing: Option<Transaction> = db
    .query_one("SELECT * FROM payment_transactions WHERE id = ?", [&tx_id])
    .await?;

if let Some(tx) = existing {
    // 이미 처리됨 → 이전 결과 재사용
    return Ok(json!({"status": "already_processed", "license_key_sent": tx.license_key.is_some()}));
}
```

## 5. 환불 처리

```
PayPal: PAYMENT.CAPTURE.REFUNDED event
Binance: REFUND_SUCCESS bizStatus

1. D1 UPDATE payment_transactions SET status = 'refunded' WHERE id = ?
2. license_blacklist 테이블에 license_key 추가
3. 다음 license/verify 호출 시 blacklist 체크 → invalid 응답
```

D1 추가 스키마:
```sql
CREATE TABLE license_blacklist (
    license_key TEXT PRIMARY KEY,
    reason TEXT NOT NULL,       -- refunded / chargeback / abuse
    blacklisted_at TEXT NOT NULL
);
```

## 6. 환경 변수 (Cloudflare Workers Secrets)

```
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID
PAYPAL_MODE                # live / sandbox

BINANCE_PAY_MERCHANT_ID
BINANCE_PAY_API_KEY
BINANCE_PAY_API_SECRET
BINANCE_WEBHOOK_SECRET

SENDGRID_API_KEY           # 이메일 발송
SERVER_SECRET              # 내부 endpoint 보호 (X-Server-Secret)
LICENSE_PRIVATE_KEY_HEX    # Ed25519 64-byte private key (hex)
```

## 7. 실패 시나리오

| 시나리오 | 처리 |
|---|---|
| Webhook 서명 무효 | 400 응답, 로그 + Slack alert |
| Webhook 3초 초과 | PayPal/Binance 자동 재시도 (멱등성으로 안전) |
| 이메일 발송 실패 | 재시도 큐 + 사용자 별도 endpoint `/license/resend` 제공 |
| 라이센스 발급 실패 | transaction status = pending 유지, 수동 재처리 |
| 결제 완료 + Webhook 미수신 | 사용자 문의 시 PayPal/Binance Pay 대시보드 확인 + 수동 발급 |

## 8. 모니터링 / Alert

- Webhook 처리 시간 > 2초 → warning
- Webhook 검증 실패 5건/분 → critical alert (Slack)
- 라이센스 발급 실패율 > 1% → critical
- 환불율 > 10% → review

## 9. v0.1.4 활성화 순서

```
T+7일: Cloudflare Workers + D1 + R2 셋업
T+10일: PayPal sandbox 통합 + Webhook 검증
T+14일: Binance Pay sandbox 통합
T+21일: 라이센스 발급 + 이메일 발송 (SendGrid)
T+28일: Smoke 테스트 (sandbox)
T+45일: PayPal Live mode 전환 + 실 결제 테스트 ($0.01)
T+60일: Binance Pay Live mode 전환
T+75일: 환불 / 블랙리스트 워크플로우 검증
T+90일: v0.1.4 정식 릴리스
```

## 10. 참고

- 마켓플레이스 API: `marketplace-api.yaml` (Phase 12)
- 라이센스 키: `license-key.md` (Phase 13)
- 서버 인프라: `server-infra.md` (Phase 19)
- aiklink PayPal Live: `reference_aiklink_paypal_live.md` (메모리)
- 결제 정책: `feedback_payment_methods.md` (영구)
