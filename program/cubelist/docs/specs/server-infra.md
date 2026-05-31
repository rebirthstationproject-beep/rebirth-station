# Cube List Server Infrastructure Specification (v0.1.4)

> 작성: 2026-06-01 Phase 19. v0.1.4 마일스톤 활성 예정.

## 1. 아키텍처 개요

```
                    [PC 앱 / 모바일 PWA]
                            |
                            | HTTPS
                            v
        ┌──────────────────────────────────────┐
        │  Cloudflare Workers (api.rebirth...)  │
        │  - /v1/catalog (public)               │
        │  - /v1/pack/{id} (public)             │
        │  - /v1/pack/{id}/download (license)   │
        │  - /v1/install (telemetry)            │
        │  - /v1/payment/init (PayPal/Binance)  │
        │  - /v1/payment/webhook/* (signed)     │
        │  - /v1/license/issue (internal)       │
        │  - /v1/license/verify (public)        │
        │  - /v1/publish/upload (bearer)        │
        │  - /v1/publisher/* (bearer)           │
        │  - /v1/auth/publisher/* (email magic) │
        └──────────────────────────────────────┘
                |          |           |
                v          v           v
            [R2 Bucket] [D1 SQLite] [KV Cache]
            - .cubepack files   - 카탈로그 캐시
            - cover images      - 카탈로그 ETags
            - screenshots
            - 세션 데이터
```

## 2. Cloudflare 자원

### Workers

- **이름**: `cubelist-api`
- **트리거**: `api.rebirthstation.com/v1/*`
- **런타임**: Workers (V8 isolate)
- **언어**: TypeScript + Hono framework
- **CPU 한도**: 50ms (free tier 가능) / 무제한 (paid)
- **요청 한도**: 100,000 / day (free) → paid plan (v0.1.4 진입 시)

### R2 Bucket

- **이름**: `cubelist-assets`
- **저장 객체**:
  - `packs/{pack_id}/v{version}.cubepack` — 큐브팩 원본
  - `packs/{pack_id}/cover.webp` — 카탈로그 cover
  - `packs/{pack_id}/screenshots/{n}.webp` — 스크린샷
  - `previews/{pack_id}.gif` — 디바이스 미리보기 (옵션)
- **수명**: 영구 (삭제 정책: 작성자 명시 삭제만)
- **공개 액세스**: cover/screenshots만 (signed URL 24h)
- **CDN**: Cloudflare 자동 캐시 (Cache-Control: max-age=86400)

### D1 (SQLite)

- **DB 이름**: `cubelist-metadata`
- **테이블**: §3 참고
- **위치**: Cloudflare global (강한 일관성 X — eventual)
- **백업**: 매일 자동 + R2 export

### KV

- **네임스페이스**: `cubelist-cache`
- **용도**:
  - 카탈로그 JSON 캐시 (5분 TTL)
  - 카테고리별 카운트 (1시간 TTL)
  - publish_token 단기 캐시 (24h)
  - PayPal OAuth 토큰 (9h, 토큰 자체 수명 - 1h)

### Secrets

- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_WEBHOOK_ID` / `PAYPAL_MODE`
- `BINANCE_PAY_MERCHANT_ID` / `BINANCE_PAY_API_KEY` / `BINANCE_PAY_API_SECRET` / `BINANCE_WEBHOOK_SECRET`
- `SENDGRID_API_KEY`
- `SERVER_SECRET` (내부 endpoint 보호)
- `LICENSE_PRIVATE_KEY_HEX` (Ed25519 64-byte)
- `JWT_SECRET` (publish_token 서명)

## 3. D1 Schema

```sql
-- 큐브팩 메타
CREATE TABLE packs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    publisher_email TEXT NOT NULL,
    platform TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    payment_type TEXT NOT NULL,
    version TEXT NOT NULL,
    cover_url TEXT,
    long_description TEXT,
    changelog TEXT,
    demo_video_url TEXT,
    cube_count INTEGER NOT NULL,
    list_count INTEGER NOT NULL,
    tags_csv TEXT,
    status TEXT NOT NULL,         -- pending_review / live / rejected / unpublished / changes_requested
    reviewer_email TEXT,
    reviewed_at TEXT,
    review_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (publisher_email) REFERENCES publishers(email)
);
CREATE INDEX idx_packs_status_platform ON packs(status, platform);
CREATE INDEX idx_packs_publisher ON packs(publisher_email);

-- 평점 / 리뷰
CREATE TABLE pack_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id TEXT NOT NULL,
    rater_hash TEXT NOT NULL,     -- sha256(buyer_email)[:16]
    rating INTEGER NOT NULL,      -- 1~5
    review TEXT,
    created_at TEXT NOT NULL,
    UNIQUE (pack_id, rater_hash),
    FOREIGN KEY (pack_id) REFERENCES packs(id)
);

-- 작성자
CREATE TABLE publishers (
    email TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    payout_method TEXT,
    payout_destination TEXT,
    tax_country TEXT,
    status TEXT NOT NULL,         -- active / suspended / closed
    total_revenue_cents INTEGER NOT NULL DEFAULT 0,
    pending_payout_cents INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

-- 결제 트랜잭션 (Phase 14)
CREATE TABLE payment_transactions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    pack_id TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    license_key TEXT,
    created_at TEXT NOT NULL,
    processed_at TEXT
);
CREATE INDEX idx_tx_session ON payment_transactions(session_id);
CREATE INDEX idx_tx_buyer ON payment_transactions(buyer_email);

-- 라이센스 블랙리스트 (Phase 14)
CREATE TABLE license_blacklist (
    license_key TEXT PRIMARY KEY,
    reason TEXT NOT NULL,
    blacklisted_at TEXT NOT NULL
);

-- 결제 세션 (Phase 14)
CREATE TABLE payment_sessions (
    id TEXT PRIMARY KEY,
    pack_id TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    redirect_url TEXT NOT NULL,
    buyer_email TEXT,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

-- 설치 telemetry
CREATE TABLE installs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id TEXT NOT NULL,
    client_id TEXT,
    version TEXT,
    installed_at TEXT NOT NULL,
    FOREIGN KEY (pack_id) REFERENCES packs(id)
);
CREATE INDEX idx_installs_pack ON installs(pack_id);

-- publish_token (단기, KV가 아닌 D1 — 감사용)
CREATE TABLE publish_tokens (
    token_hash TEXT PRIMARY KEY,  -- sha256(token)
    email TEXT NOT NULL,
    issued_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked_at TEXT
);
```

## 4. Workers 구현 (TypeScript + Hono)

### 디렉토리 구조 (v0.1.4)

```
apps/server/
  ├── wrangler.toml
  ├── package.json
  ├── src/
  │   ├── index.ts                # Hono entry
  │   ├── routes/
  │   │   ├── catalog.ts
  │   │   ├── pack.ts
  │   │   ├── install.ts
  │   │   ├── payment.ts
  │   │   ├── license.ts
  │   │   ├── publish.ts
  │   │   └── publisher.ts
  │   ├── lib/
  │   │   ├── d1.ts
  │   │   ├── r2.ts
  │   │   ├── kv.ts
  │   │   ├── paypal.ts
  │   │   ├── binance.ts
  │   │   ├── license-sign.ts     # Ed25519 발급
  │   │   ├── license-verify.ts   # Ed25519 검증
  │   │   ├── jwt.ts              # publish_token
  │   │   ├── email.ts            # SendGrid
  │   │   └── scan.ts             # 큐브팩 자동 스캔
  │   └── types.ts
  ├── migrations/
  │   └── 0001_initial.sql
  └── README.md
```

### wrangler.toml 예시

```toml
name = "cubelist-api"
main = "src/index.ts"
compatibility_date = "2026-06-01"
node_compat = false

[vars]
PAYPAL_MODE = "live"

[[d1_databases]]
binding = "DB"
database_name = "cubelist-metadata"
database_id = "<from wrangler d1 create>"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "cubelist-assets"

[[kv_namespaces]]
binding = "CACHE"
id = "<from wrangler kv:namespace create>"

[env.staging]
name = "cubelist-api-staging"
routes = [{ pattern = "api-staging.rebirthstation.com/v1/*", zone_id = "<zone>" }]

[env.production]
name = "cubelist-api"
routes = [{ pattern = "api.rebirthstation.com/v1/*", zone_id = "<zone>" }]
```

### index.ts 예시

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { catalog } from './routes/catalog';
import { pack } from './routes/pack';
import { install } from './routes/install';
import { payment } from './routes/payment';
import { license } from './routes/license';
import { publish } from './routes/publish';
import { publisher } from './routes/publisher';
import { authPublisher } from './routes/auth-publisher';

export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  CACHE: KVNamespace;
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
  PAYPAL_WEBHOOK_ID: string;
  BINANCE_PAY_API_KEY: string;
  BINANCE_PAY_API_SECRET: string;
  BINANCE_WEBHOOK_SECRET: string;
  SENDGRID_API_KEY: string;
  SERVER_SECRET: string;
  LICENSE_PRIVATE_KEY_HEX: string;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: ['http://127.0.0.1:3002', 'tauri://localhost', 'https://cubelist.rebirthstation.com'],
  credentials: true,
}));

app.route('/v1/catalog', catalog);
app.route('/v1/pack', pack);
app.route('/v1/install', install);
app.route('/v1/payment', payment);
app.route('/v1/license', license);
app.route('/v1/publish', publish);
app.route('/v1/publisher', publisher);
app.route('/v1/auth/publisher', authPublisher);

app.get('/health', (c) => c.json({ ok: true }));

export default app;
```

## 5. 인증 / 보안

### CORS

- 허용 origin: PC 앱 (tauri://localhost) + 모바일 PWA (PROD URL) + 로컬 dev
- credentials: true (publish_token 쿠키 또는 Authorization 헤더)

### Rate Limiting

Cloudflare Workers Rate Limiting binding:
- `/v1/payment/init`: 10 req/min/IP
- `/v1/license/verify`: 60 req/min/IP
- `/v1/publish/upload`: 5 req/min/publisher
- 익명 endpoint (`/catalog`, `/pack/{id}`): 100 req/min/IP

### Webhook 서명 검증

- PayPal: `/v1/payment/webhook/paypal` → PayPal Verify API
- Binance: `/v1/payment/webhook/binance` → HMAC-SHA512

### 내부 endpoint

- `/v1/license/issue` 는 `X-Server-Secret` 헤더 필수
- Webhook 처리 핸들러에서만 호출 (외부 차단)

## 6. CDN / 캐싱

### 카탈로그 캐시 (KV)

```typescript
// routes/catalog.ts
const cacheKey = `catalog:${platform}:${price}:${sort}:${q}:${page}`;
const cached = await env.CACHE.get(cacheKey, 'json');
if (cached) return c.json(cached);

const result = await queryD1(env.DB, ...);
await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
return c.json(result);
```

### 큐브팩 다운로드 (R2)

- R2 객체 GET → 자동 Cloudflare cache
- Cache-Control: `private, max-age=86400` (라이센스 인증 필요)
- 라이센스 만료 시 다음 요청에서 거부

### Stale-while-revalidate

```typescript
const cachedETag = await env.CACHE.get('catalog:etag');
const ifNoneMatch = c.req.header('If-None-Match');
if (ifNoneMatch && ifNoneMatch === cachedETag) {
  return new Response(null, { status: 304 });
}
```

## 7. 모니터링

### Cloudflare Analytics

- Workers 요청 수 / 에러율 / 응답 시간
- R2 대역폭 / 객체 수
- D1 쿼리 횟수 / 평균 소요 시간

### 외부 모니터링

- Better Uptime ping (1분 주기, `/health`)
- Sentry (에러 추적, Workers SDK)
- Slack alert (Critical 이벤트)

## 8. 배포 / CI

### GitHub Actions

```yaml
# .github/workflows/cubelist-server-deploy.yml
on:
  push:
    branches: [main]
    paths: ['apps/server/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd apps/server && npm ci
      - run: cd apps/server && npx wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 마이그레이션

```bash
# 로컬
cd apps/server
npx wrangler d1 execute cubelist-metadata --file migrations/0001_initial.sql --local

# Staging
npx wrangler d1 execute cubelist-metadata --file migrations/0001_initial.sql --env staging

# Production (수동 승인 후)
npx wrangler d1 execute cubelist-metadata --file migrations/0001_initial.sql --env production
```

## 9. 비용 추정 (v0.1.4 초기)

| 항목 | 가격 | 가정 | 월 비용 |
|---|---|---|---|
| Workers | $5/월 (Paid) + $0.50/MM 추가 | 5M requests/월 | $7.50 |
| R2 | $0.015/GB-월 + $0.36/MM Class A | 50GB + 10MM Class A | $4.35 |
| D1 | $5/월 (Paid) + $0.001/1k rows write | 100k writes | $5.10 |
| KV | $0.50/MM reads + $5/MM writes | 1MM reads + 100k writes | $1.00 |
| **합계** | | | **~$18/월** |

> v0.1.4 초기 1000 사용자 가정. 10000+ 사용자 시 별도 분석.

## 10. v0.1.4 활성화 순서

```
T+0~7일: Cloudflare 계정 + 도메인 (api.rebirthstation.com 서브도메인)
T+7~10일: wrangler init + D1 마이그레이션 + R2 + KV 생성
T+10~14일: Hono 라우트 골격 + DB 헬퍼
T+14~21일: PayPal/Binance 통합 + Webhook 처리
T+21~28일: 라이센스 발급/검증 + SendGrid 이메일
T+28~35일: publish/upload + 자동 스캔
T+35~42일: 카탈로그 캐시 + Stale-while-revalidate
T+42~49일: 모니터링 + Sentry + Better Uptime
T+49~56일: Staging 통합 테스트
T+56~63일: Production 배포 + Smoke
T+63~90일: v0.1.4 정식 진입
```

## 11. 참고

- 마켓플레이스 API: `marketplace-api.yaml` (Phase 12)
- 라이센스 키: `license-key.md` (Phase 13)
- 결제 콜백: `payment-callback.md` (Phase 14)
- 큐브팩 게시: `pack-publish-flow.md` (Phase 15)
- LiveSync RequestExecute: `livesync-request-execute.md` (Phase 16)
- aiklink Supabase 사례 (대안 인프라): `reference_aiklink_supabase.md`
