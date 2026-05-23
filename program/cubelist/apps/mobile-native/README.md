# 큐브 리스트 모바일 앱 (Capacitor)

회사: 리버스 스테이션 (Rebirth Station)
프로그램: 큐브 리스트 (Cube List)
앱 ID: `com.rebirthstation.cubelist`

웹 코드(`apps/web/`)를 Capacitor로 wrap하여 Android / iOS 네이티브 앱으로 빌드합니다.

---

## 결제 모델 (영구)

**외부 결제 게이트웨이 사용 안 함.** Google Play Billing + Apple StoreKit IAP만.

참조: `memory/project_cubelist_iap.md`

---

## 디렉토리 구조

```
apps/mobile/
├── capacitor.config.ts       # Capacitor 설정 (webDir = ../web/out)
├── package.json              # Capacitor + IAP 플러그인 의존성
├── src/
│   └── iap-bridge.ts         # cordova-plugin-purchase wrapper (Google/Apple IAP)
├── android/                  # `cap add android` 후 생성
└── ios/                      # `cap add ios` 후 생성
```

---

## 빌드 절차

### 1. 의존성 설치

```bash
cd apps/mobile
npm install
```

### 2. Next.js static export (`apps/web/out` 생성)

```bash
cd ../web
NEXT_PUBLIC_RUNTIME=capacitor \
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx... \
npm run build
```

### 3. Android 프로젝트 추가 (최초 1회)

```bash
cd ../mobile
npx cap add android
```

### 4. 동기화 (빌드 → 네이티브로 복사)

```bash
npm run sync
```

### 5. Android Studio 또는 Xcode 열기

```bash
# Android
npm run android:open

# iOS (macOS만)
npm run ios:open
```

### 6. IAP product 등록

- **Google Play Console**: 앱 생성 → 모네타이제이션 → 구독 / 제품
  - `com.rebirthstation.cubelist.pro.monthly`
  - `com.rebirthstation.cubelist.pro.yearly`
  - `com.rebirthstation.cubelist.pro.lifetime`
- **App Store Connect**: 앱 생성 → 인앱 구매 → 동일 product ID 등록

### 7. 서버 환경변수 설정

```bash
supabase secrets set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON="$(cat google-play-sa.json)"
supabase secrets set GOOGLE_PLAY_PACKAGE_NAME=com.rebirthstation.cubelist
supabase secrets set APPLE_APP_STORE_SHARED_SECRET=...
supabase secrets set APPLE_BUNDLE_ID=com.rebirthstation.cubelist
```

---

## IAP 흐름

```
[모바일 앱 (Capacitor)]
        │
        │ 1. iap-bridge.purchaseProduct() 호출 (cordova-plugin-purchase)
        ▼
[Google Play Billing / Apple StoreKit]
        │
        │ 2. 사용자 결제 완료 → receipt 반환
        ▼
[모바일 앱]
        │
        │ 3. apps/web/lib/iap.ts::purchaseAndVerify() →
        │    POST /functions/v1/verify-iap-receipt (with JWT)
        ▼
[Supabase Edge Function]
        │
        │ 4. Google Play Developer API / Apple verifyReceipt 호출
        │    → 검증 + iap_receipts.insert + subscriptions.upsert(plan='pro')
        ▼
[Supabase user_entitlements view]
        │
        │ 5. PWA·Windows 헬퍼가 같은 계정 로그인 시
        │    useEntitlement() → is_pro_active = true
        ▼
[AdBanner] 자동 숨김 (광고 제거)
```

---

## 권한·정책 체크리스트

### Android

- [ ] `BILLING` permission (cordova-plugin-purchase가 자동 추가)
- [ ] `INTERNET` permission
- [ ] Network security config (Supabase HTTPS만)
- [ ] App Bundle 서명 (Google Play upload key)
- [ ] Target API level 34+ (2025년 요구)
- [ ] 데이터 안전 섹션 작성 (Play Console)

### iOS

- [ ] StoreKit 자격 (Xcode → Signing & Capabilities)
- [ ] Privacy manifest (`PrivacyInfo.xcprivacy`)
- [ ] App Tracking Transparency (광고 표시 시 — 본 앱은 외부 결제 X이므로 IDFA 사용 안 함)
- [ ] Restore Purchases 버튼 (Apple 가이드 필수)
- [ ] In-App Purchase Capability 활성화

---

## 거치 모드 네이티브 통합 (향후)

PWA에서 Wake Lock API로 화면 절전 차단했던 것이 네이티브에서는 더 안정적:

- Android: `WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON`
- iOS: `UIApplication.shared.isIdleTimerDisabled = true`

Capacitor 플러그인 `@capacitor-community/keep-awake` 또는 자체 native module로 통합 가능. W2 진입 시.

---

## 미완 / 후속

- [ ] `npx cap add android` / `npx cap add ios` 실제 실행 (사용자 환경)
- [ ] iap-bridge cordova-plugin-purchase 실 빌드 검증
- [ ] Pro 가격 결정 후 product ID 등록 (월/연/평생) — 사업 결정 영역
- [ ] Google Play / App Store Connect 개발자 계정 등록 — 사업 결정 영역
- [ ] 거치 모드 네이티브 wake lock 플러그인
- [ ] 위젯 (Android Glance / iOS WidgetKit) — Phase 2+
