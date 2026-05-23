# 아이콘 placeholder

큐브 리스트 PC 헬퍼 빌드용 아이콘 자리.

## 필요 파일

| 파일 | 용도 | 크기 |
|---|---|---|
| `32x32.png` | 작은 윈도우 아이콘 | 32×32 |
| `128x128.png` | 일반 윈도우 아이콘 | 128×128 |
| `128x128@2x.png` | HiDPI | 256×256 |
| `icon.ico` | Windows 실행 파일 | 멀티 사이즈 |
| `icon.icns` | macOS (Phase 2) | 멀티 사이즈 |
| `tray.png` | 시스템 트레이 | 32×32 (어두운/밝은 배경 호환) |

## 디자인 가이드

- 회사: 리버스 스테이션 (Rebirth Station)
- 컬러: 주소모아 핑크 `#E91E63` + 리:폰 미드나이트 블루 `#1A237E` *(브랜드 세션 확정값 대기)*
- 모티프: "Re:" 콜론 + 큐브(정사각 버튼) 격자
- 트레이 아이콘: 단색 흑백 (Windows 트레이 표준)

## 생성

브랜드 세션이 최종 로고 확정 후 fal.ai로 일괄 생성 + ImageMagick으로 .ico 패키징:

```bash
# 예시 (확정 후)
magick convert tray-source.svg -resize 32x32 tray.png
magick convert icon-source.png -define icon:auto-resize=16,32,48,64,128,256 icon.ico
```

## 현재 상태

**placeholder만 존재 — 실제 빌드 시 위 파일 모두 채워야 함.**
`cargo build --features gui --release` 시 누락 시 tauri-build가 실패.
