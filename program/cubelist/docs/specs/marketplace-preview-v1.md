# 큐브팩 마켓플레이스 미리보기 spec v1 (2026-05-31)

> 사용자 정의 (`feedback_cubepack_policy_v2.md`):
> 큐브팩 = 플랫폼/프로그램 단위 (Figma·OBS·VS Code 등). 직군 묶음 폐기. 가상 카탈로그 금지. PC 앱 완성 후 작업 시작.

본 명세는 v0.1.3+ 마켓플레이스 진입을 위한 사전 작업 — 큐브팩 메타 + 미리보기 페이지 구조.

## 1. CubePack 메타 (영구 lock 활용)

기존 영구 lock 필드 + 마켓플레이스용 확장 (`extensions` 활용):

```typescript
interface CubePack {
  // 영구 lock 필드 (이미 v0.1.1 정의)
  id: string;
  name: string;
  description?: string;
  license: 'free' | 'paid' | 'restricted';
  device_hint?: DeviceHint;
  lists: CubeList[];
  cubes?: Cube[];

  // 마켓플레이스 확장 (extensions 영구 forward-compat)
  extensions?: {
    marketplace?: MarketplaceMeta;
  };
}

interface MarketplaceMeta {
  /** 큐브팩 카테고리 (플랫폼/프로그램) */
  platform: 'figma' | 'obs' | 'vscode' | 'photoshop' | 'illustrator' | 'premiere' |
            'after_effects' | 'davinci' | 'blender' | 'unity' | 'unreal' |
            'twitch' | 'discord' | 'spotify' | 'youtube' | 'other';
  /** 가격 (USD 센트 단위, 0 = 무료) */
  price_cents: number;
  /** 작성자 */
  author: {
    name: string;
    email?: string;
    website?: string;
    avatar_url?: string;
  };
  /** 커버 이미지 URL (data URL 또는 외부) */
  cover_url?: string;
  /** 큐브팩 설명 (Markdown 허용) */
  long_description?: string;
  /** 태그 (검색 키워드) */
  tags?: string[];
  /** 권장 디바이스 (사용 시 UI 추천) */
  recommended_device_hint?: DeviceHint;
  /** 버전 (semver) */
  version?: string;
  /** 변경 이력 */
  changelog?: string;
  /** 라이선스 (license 'paid' 시 표시) */
  license_terms?: string;
  /** 라이프타임 / 구독 */
  payment_type?: 'one_time' | 'subscription_monthly' | 'subscription_yearly';
  /** 스크린샷 (다중) */
  screenshots?: string[];
  /** 데모 영상 URL (YouTube/Vimeo) */
  demo_video_url?: string;
  /** 평점 (서버 측 집계, 클라이언트 입력 X) */
  rating?: { avg: number; count: number };
}
```

## 2. 미리보기 페이지 구조 (PC 앱 내장)

### 2.1 라우트
- `/marketplace` — 카탈로그 (큐브팩 목록)
- `/marketplace/pack/<pack_id>` — 큐브팩 상세 미리보기
- `/marketplace/author/<author_id>` — 작성자 페이지 (선택)

### 2.2 카탈로그 화면 (`/marketplace`)
- 카테고리 필터 (platform 별)
- 가격 필터 (무료 / 유료)
- 정렬 (인기 / 최신 / 평점)
- 큐브팩 카드 그리드
  - 커버 이미지
  - 이름 + 작성자
  - 가격 (또는 "무료")
  - 평점 (별 + 카운트)
  - 큐브 수 / 리스트 수

### 2.3 큐브팩 상세 (`/marketplace/pack/<id>`)
- 커버 + 갤러리 (스크린샷 + 영상)
- 이름 + 작성자 + 가격 + 평점
- "설치" 또는 "구매" 버튼 (라이센스에 따라)
- 큐브팩 안 큐브 리스트들 미리보기:
  - 각 리스트 = StreamDeck 디바이스 모양 mockup (device_hint 기반 그리드)
  - 모든 큐브 표시 (LCD 톤)
  - 큐브 hover 시 액션 정보 popup
- long_description (Markdown 렌더)
- changelog
- 평점 + 리뷰 (서버 측)
- 작성자 정보

### 2.4 인스펙터 통합
- 큐브팩 owner 인 사용자가 "마켓플레이스 게시" 버튼
- 게시 화면:
  - 가격 입력
  - 라이센스 선택
  - 커버 + 스크린샷 업로드
  - long_description 작성
  - 게시 → API 호출

## 3. 결제 사전 검토

**중요**: 사용자 결제 정책 (`feedback_payment_methods.md`):
> 영구 규칙 — PayPal + Binance Pay 두 가지만. Stripe/Toss/국내 PG 절대 금지.

큐브팩 마켓플레이스 결제:
- PayPal 표준 API (REST)
- Binance Pay API
- 양자 모두 OAuth + Webhook
- 결제 완료 → 큐브팩 라이센스 키 발급 → 사용자 PC 앱 라이센스 등록

## 4. 라이센스 키 검증 (PC 앱 측)

```typescript
interface PackLicense {
  pack_id: string;
  license_key: string;       // 결제 후 발급
  buyer_email: string;
  issued_at: string;
  expires_at?: string;       // subscription 시
}
```

PC 앱 라이센스 검증:
- 로컬 영속 (Tauri SQLite 또는 localStorage)
- 부팅 시 라이센스 키 → 서버 검증 (offline 그레이스 7일)
- 'paid' license 큐브팩은 검증 통과 시만 lists 로드
- 검증 실패 시 "라이센스 만료 / 무효" 안내 + 환불 안내

## 5. 큐브팩 게시 워크플로우

```
사용자 (PC 앱)
    ↓
큐브팩 작성 (인스펙터에서 게시 메타 입력)
    ↓
"마켓플레이스 게시" 버튼 클릭
    ↓
.cubepack export + 메타 + 커버/스크린샷 zip
    ↓
서버 API POST /api/marketplace/packs
    ↓
서버 검증 (악성 액션 / 위험 path / 사이즈 / DRM)
    ↓
승인 → 마켓플레이스 카탈로그 게시
    ↓
구매자 결제 → 라이센스 키 발급
    ↓
구매자 PC 앱에서 라이센스 등록 → .cubepack 다운로드 + 검증 통과 → 사용
```

## 6. 보안 정책

### 6.1 큐브팩 검증 (서버 측)
- 위험 path 차단 (cmd.exe / powershell / wscript 등) — 이미 audio_play guard 와 동일
- 의심 plugin_action sidecar .exe 격리 검사
- 큐브 수 제한 (1 pack ≤ 10,000 큐브)
- 사이즈 제한 (1 pack ≤ 50MB)

### 6.2 라이센스 키 보안
- Ed25519 서명 (서버 비밀키 → 클라이언트 공개키 검증)
- 만료 + revocation 지원
- offline 그레이스 (네트워크 끊겨도 7일 동작)

## 7. 진행 단계 (v0.1.3 ~ v0.2.0)

| 단계 | 작업 | 예상 |
|---|---|---|
| 1 | MarketplaceMeta TypeScript 타입 정의 (frontend) | 0.5일 |
| 2 | 인스펙터 "마켓플레이스 메타 입력" 폼 | 1일 |
| 3 | PC 앱 `/marketplace` 라우트 + 카탈로그 mockup | 1~2일 |
| 4 | 큐브팩 상세 페이지 (큐브 그리드 mockup + Markdown) | 1일 |
| 5 | 서버 API 백엔드 (Node/Express 또는 Rust/Axum) | 3~5일 |
| 6 | PayPal API 통합 | 1~2일 |
| 7 | Binance Pay API 통합 | 1~2일 |
| 8 | 라이센스 키 발급 + 서명 + 검증 | 1~2일 |
| 9 | 클라이언트 라이센스 등록 UI | 1일 |
| 10 | E2E 테스트 (게시 → 결제 → 라이센스 → 사용) | 2일 |

**합산**: 12~18일 (서버 인프라 별도)

## 8. 인접 메모리

- `feedback_cubepack_policy_v2.md` — 큐브팩 정책 v2 영구
- `feedback_payment_methods.md` — PayPal + Binance Pay 영구
- `project_cubelist_iap.md` — 모바일 IAP 모델 (Google Play / Apple)
- `project_rebirth_station.md` — 4-Layer 마스터 브랜드

## 9. 영구 lock 약속

본 v1 spec은 마켓플레이스 진입을 위한 사전 명세. v0.1.3+ 도입 시:
- MarketplaceMeta 는 CubePack.extensions.marketplace 로 보관 (영구 lock 자체는 변경 0)
- 미래 변경 시 extensions.marketplace.v2 등 버전 분기
- platform enum 은 추가만 가능 (삭제 금지)
- 결제 수단은 PayPal + Binance Pay 영구
