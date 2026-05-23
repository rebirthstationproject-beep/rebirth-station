# `.cubeplugin` 파일 포맷 v1 (M4)

큐브 리스트 PC 트랙 플러그인 패키지 포맷. 외부 개발자가 새 액션·UI 를 등록할 수 있는
ZIP 컨테이너.

## 1. 컨테이너 구조

```
my-plugin.cubeplugin   (ZIP)
├── manifest.json      (필수, 루트)
├── manifest.sig       (Ed25519 서명, 마켓 검증용 — 선택)
├── icon.png           (플러그인 카탈로그용 대표 아이콘, 256×256)
├── icons/             (액션별 아이콘, manifest.actions[].icon_ref 가 참조)
│   ├── open.png
│   └── close.png
├── inspector/         (PropertyInspector — M5)
│   └── index.html
└── runtime/           (실행 코드 — M5)
    ├── plugin.js      (WebView Worker JS) 또는
    └── plugin.wasm    (WASM 모듈)
```

**v1 (현재) 범위**: manifest 만. inspector/runtime 은 M5 에서 사양 추가.

## 2. manifest.json 스키마

```jsonc
{
  "package_id":  "com.example.myplugin",        // 정규식 ^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$
  "name":        "My Plugin",                   // 표시명
  "version":     "1.0.0",                       // semver (major.minor.patch)
  "author":      "Author Name",                 // 선택
  "description": "짧은 설명",                    // 선택
  "license":     "free | personal | commercial | proprietary",  // 선택
  "homepage":    "https://example.com",         // 선택
  "actions": [
    {
      "id":              "open",                // package 내 유일
      "label":           "열기",                 // 표시명
      "description":     "예시 앱을 엽니다",      // 선택
      "action_type":     "link",                // 10 enum 중 1: link/shortcut/macro/folder/
                                                // text_insert/clipboard_copy/app_launch/
                                                // focus_window/mouse_click/plugin_action
      "default_payload": { "url": "https://example.com" },
      "schema":          [/* FieldSchema[] — M3 와 호환 */],
      "tier":            1,                     // 1·2·3 — 미지정 시 manifest.requested_permissions 최댓값
      "icon_ref":        "icons/open.png"       // ZIP 내부 경로
    }
  ],
  "requested_permissions": ["tier_1", "tier_2"] // 최대 권한 등급 선언
}
```

## 3. 검증 4중 방어 (기존 정착)

1. **Manifest 서명** (Ed25519) — 마켓플레이스 배포본 검증
2. **action_type 화이트리스트** — 10 enum 외 거부 (`unsupported action_type`)
3. **매크로 제한** — steps 최대 50, 30초 타임아웃 (`actions/macro_exec`)
4. **외부 URL/위험 키워드 정적 분석** (`plugins/static_scan`)

위 4 가지가 `cargo` 측 4 모듈 (`plugins/manifest.rs` + `signature.rs` + `static_scan.rs` +
`actions/guard.rs`) 로 자동 작동.

## 4. 호환성 매핑 (StreamDeck SDK)

| StreamDeck | 큐브 리스트 |
|---|---|
| `Plugin.json` | `manifest.json` |
| `Actions[].UUID` | `actions[].id` (package_id 와 결합하여 전역 유일) |
| `Actions[].Name` | `actions[].label` |
| `Actions[].PropertyInspectorPath` | `inspector/<path>` (M5) |
| `Actions[].Icon` | `actions[].icon_ref` |
| `Actions[].States[]` | (현재 미지원 — M7 에서 검토) |
| Plugin manifest 서명 | Ed25519 (`manifest.sig`) |

**부분 호환 채택 사유**: StreamDeck SDK 직접 호환은 라이센스/저작권 충돌 위험.
manifest 키만 1:1 매핑 가능하게 작성 → 변환 스크립트(M9 이후)로 SDK → .cubeplugin 자동 변환 가능.

## 5. 샘플

`apps/pc-version/plugins-examples/com.rebirthstation.system.openapp/manifest.json` 참조.
