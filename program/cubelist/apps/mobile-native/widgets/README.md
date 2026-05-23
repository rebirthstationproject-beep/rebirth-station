# 모바일 위젯 (Stage 2+)

회사: 리버스 스테이션 (Rebirth Station)
명세: [`docs/widget-spec.md`](../../../docs/widget-spec.md) v1

본 디렉토리는 Capacitor가 추가하는 네이티브 코드(`apps/mobile/android/`, `apps/mobile/ios/`)에 들어갈 위젯 모듈의 **스캐폴딩 자리**입니다. Stage 1에서는 명세만 작성하며, 실제 코드는 모바일 앱 빌드 트랙(Stage 2) 진입 시 작성합니다.

---

## 디렉토리 예정 구조

```
apps/mobile/
├── android/                              ← `npx cap add android` 후 생성
│   └── app/src/main/kotlin/com/rebirthstation/cubelist/widgets/
│       ├── CubeListGlanceWidget.kt       ← AppWidgetReceiver + Glance Composable
│       ├── WidgetRepository.kt           ← Supabase fetch + 캐시
│       └── WidgetActionRunner.kt         ← 딥링크 cubelist://press/<id> 발동
└── ios/                                  ← `npx cap add ios` 후 생성
    └── App/CubeListWidget/
        ├── CubeListWidget.swift          ← @main Widget + TimelineProvider
        ├── WidgetEntryView.swift         ← SwiftUI 큐브 그리드
        └── WidgetData.swift              ← Supabase + Keychain 캐시
```

## 진입 조건 (Stage 2)

- [ ] `npx cap add android` / `npx cap add ios` 실행 (사용자 환경)
- [ ] Google Play / App Store 개발자 계정 등록 (사업 결정)
- [ ] `user_widget_cubes` Supabase view 추가 (위젯 데이터 인터페이스 §향후 작업)
- [ ] `widget-spec.md` 디자인 토큰 확정 (브랜드 세션)

위 4개 모두 충족 시 본 디렉토리에 네이티브 코드 작성 시작.

## 데이터 인터페이스

위젯은 `apps/web/lib/widget-export.ts`의 `WidgetCubePayload` v1 형식을 받아 렌더링합니다. 네이티브 측에서 자체 fetch하든 web에서 Capacitor Bridge로 받든 같은 형식 사용.

```typescript
import { fetchWidgetPayload } from '@/lib/widget-export';
const payload = await fetchWidgetPayload();
```

## 빌드 후 체크리스트

- [ ] Android: `widget_info.xml` 최소 크기 2×2, 업데이트 주기 30분
- [ ] iOS: `IntentTimelineProvider` (사용자가 보드 선택 가능)
- [ ] 딥링크 `cubelist://` URL scheme 등록 (AndroidManifest.xml / Info.plist)
- [ ] 위젯 미리보기 이미지 (Android `previewImage` / iOS `accessoryRectangular` 등)
- [ ] 다크 모드 대응 (Glance: `GlanceTheme` / WidgetKit: `colorScheme` 환경)
- [ ] 접근성: VoiceOver/TalkBack 라벨 = 큐브 `label`

## 라이선스·심사

- 위젯에 광고 표시 0 (Stage 4 이전 광고 자체 비활성)
- 위젯에서 외부 결제 안내 0 (정착본 결제 모델 — IAP 외 금지)
- 위젯 동작 = 앱 열림 + 큐브 발동 (백그라운드 결제·과금 0)
