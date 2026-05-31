# Cube Pack 게시 워크플로우 Specification (v0.1.4)

> 작성: 2026-06-01 Phase 15. v0.1.4 마일스톤 활성 예정.

## 1. 목적

큐브팩 작성자가 PC 앱에서 자작 큐브팩을 마켓플레이스에 게시.

원칙:
- **자체 셀러 시스템 X** — 우리가 직접 데이터 관리 (`feedback_aiklink_seller_policy` 적용)
- **검토 통과 후 노출** (저작권 / 악성 코드 / 부적절 콘텐츠 필터)
- **게시 도구 무료** (게시 수수료 X, 결제 발생 시 수수료 15% 적용)
- **삭제 / 비공개 토글 가능** (작성자 권한)

## 2. 워크플로우 (사용자 시점)

```
1. PC 앱: 큐브팩 작성 (큐브 추가 + 메타 편집)
2. PC 앱: TopBar 🏪 팩 정보 → MarketplaceMetaEditor → 저장 (로컬)
3. PC 앱: TopBar 🚀 게시 (v0.1.4 신규 버튼)
4. PC 앱: 게시 토큰 발급 (이메일 인증)
5. PC 앱: 검증 → 자동 cover 캡처 (없으면) → 업로드
6. 서버: 자동 스캔 (악성코드 / 저작권) → 검토 대기
7. 서버: 검토 (1~3일) → 승인 / 반려
8. 승인: 카탈로그 노출
9. 반려: 사유 이메일 + PC 앱 알림
```

## 3. 게시 토큰 발급

### 사용자 흐름

```
PC 앱: TopBar 🚀 게시 클릭
PC 앱: PublishTokenDialog 표시
  - 이메일 입력
  - "인증 메일 보내기" 클릭
서버: POST /v1/auth/publisher/request
  Body: {email: "..."}
  → 6자리 인증 코드 + 24h 유효 magic link 이메일 발송
PC 앱: 인증 코드 입력 (또는 magic link 클릭)
서버: POST /v1/auth/publisher/verify
  Body: {email, code}
  → publish_token (JWT, 90일 유효) 발급
PC 앱: localStorage에 publish_token 저장
```

### Publisher 등록

처음 인증 시 자동:
```sql
INSERT INTO publishers (email, display_name, created_at, status)
VALUES (?, ?, ?, 'active');
```

작성자 메타:
- `email` (PK, 비공개)
- `display_name` (공개, 카탈로그 author.name 으로 표시)
- `payout_method` (paypal_email / binance_id, 결제 활성화 시)
- `tax_country` (수익 발생 시 세금 처리)

## 4. PC 앱 검증 (업로드 전)

`apps/pc-version/frontend/src/lib/publish-validate.ts`:

```typescript
interface PublishValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validatePackForPublish(pack: CubePack): PublishValidationError[] {
  const errors: PublishValidationError[] = [];
  const meta = pack.extensions?.marketplace as MarketplaceMeta | undefined;

  // 1. 메타 필수 필드
  if (!meta) {
    errors.push({ field: 'extensions.marketplace', message: '마켓플레이스 메타가 없습니다', severity: 'error' });
    return errors;
  }
  if (!meta.author?.name) {
    errors.push({ field: 'author.name', message: '작성자 이름 필수', severity: 'error' });
  }
  if (meta.price_cents > 0 && !meta.author?.email) {
    errors.push({ field: 'author.email', message: '유료 큐브팩은 작성자 이메일 필수', severity: 'error' });
  }
  if (!meta.platform || meta.platform === 'other') {
    errors.push({ field: 'platform', message: '플랫폼 카테고리 선택 권장', severity: 'warning' });
  }
  if (!meta.long_description || meta.long_description.length < 50) {
    errors.push({ field: 'long_description', message: '설명 50자 이상 권장', severity: 'warning' });
  }
  if (!meta.cover_url) {
    errors.push({ field: 'cover_url', message: '커버 이미지 없음 (자동 캡처 권장)', severity: 'warning' });
  }
  if (!meta.tags || meta.tags.length === 0) {
    errors.push({ field: 'tags', message: '태그 1개 이상 권장 (검색성 ↑)', severity: 'warning' });
  }

  // 2. 큐브 검증
  if (pack.lists.length === 0) {
    errors.push({ field: 'lists', message: '큐브 리스트 1개 이상 필요', severity: 'error' });
  }
  for (const list of pack.lists) {
    for (const cube of list.cubes) {
      if (!cube.label.trim()) {
        errors.push({
          field: `lists[${list.id}].cubes[${cube.id}].label`,
          message: `큐브 라벨 빈 값 (${cube.id})`,
          severity: 'error',
        });
      }
    }
  }

  // 3. plugin_action 큐브 → vendor SDK 의존성 명시
  const pluginCubes = pack.lists
    .flatMap((l) => l.cubes)
    .filter((c) => c.action_type === 'plugin_action');
  if (pluginCubes.length > 0 && !meta.long_description?.includes('plugin')) {
    errors.push({
      field: 'long_description',
      message: `plugin_action 큐브 ${pluginCubes.length}개 — 설명에 의존성 명시 권장`,
      severity: 'warning',
    });
  }

  // 4. .cubepack 크기 (서버 한도 10MB)
  // (실제 크기 측정은 exportCubepack 후)

  return errors;
}
```

## 5. 업로드

### PC 앱 측

```typescript
async function handlePublish(pack: CubePack, publishToken: string): Promise<void> {
  // 1. 검증
  const errors = validatePackForPublish(pack);
  const fatal = errors.filter((e) => e.severity === 'error');
  if (fatal.length > 0) {
    window.alert(`게시 불가:\n${fatal.map((e) => `· ${e.message}`).join('\n')}`);
    return;
  }
  const warnings = errors.filter((e) => e.severity === 'warning');
  if (warnings.length > 0) {
    const proceed = window.confirm(
      `다음 권고 미준수 — 계속 진행할까요?\n\n${warnings.map((e) => `· ${e.message}`).join('\n')}`,
    );
    if (!proceed) return;
  }

  // 2. cover 자동 캡처 (없으면)
  const meta = pack.extensions?.marketplace as MarketplaceMeta;
  if (!meta.cover_url && pack.lists.length > 0) {
    const dataUrl = await captureCubeListThumbnail(pack.lists[0], {
      packName: pack.name,
      subtitle: meta.author.name,
    });
    if (dataUrl) meta.cover_url = dataUrl;
  }

  // 3. .cubepack 직렬화
  const blob = await exportCubepack(pack);
  if (blob.size > 10 * 1024 * 1024) {
    window.alert(`크기 초과: ${(blob.size / 1024 / 1024).toFixed(1)}MB > 10MB 한도`);
    return;
  }

  // 4. multipart 업로드
  const formData = new FormData();
  formData.append('pack_file', blob, `${pack.name}.cubepack`);
  formData.append('metadata', JSON.stringify(meta));

  const resp = await fetch('https://api.rebirthstation.com/v1/publish/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${publishToken}` },
    body: formData,
  });
  if (!resp.ok) {
    window.alert(`업로드 실패: ${await resp.text()}`);
    return;
  }
  const { pack_id, status } = await resp.json();
  window.alert(`✅ 업로드 완료\n팩 ID: ${pack_id}\n상태: ${status} (검토 대기)`);
}
```

### 서버 측

```
POST /v1/publish/upload (Bearer Token)

1. publish_token 검증 (JWT)
2. publisher 조회 (email)
3. .cubepack 압축 해제 → manifest.json + extensions/marketplace 검증
4. 서버 사이드 validateMarketplaceMeta (PC 앱 검증 재실행)
5. 악성 코드 자동 스캔 (Phase 7):
   - 모든 cube.action_payload 의 url / app_path 패턴 화이트리스트 매칭
   - macro steps 의 keys 분석 (Ctrl+Alt+Del 같은 위험 조합 flag)
   - plugin_action 큐브의 plugin_uuid → 알려진 plugin DB 조회
6. R2 업로드 (.cubepack 원본 + cover 이미지 분리)
7. D1 INSERT packs (status = 'pending_review')
8. 검토 알림 (관리자 Slack)
9. 응답: {pack_id, status: 'pending_review'}
```

## 6. 검토 (관리자)

### 검토 도구 (별도 dashboard, agent-dashboard 활용)

```
agent-dashboard/cubelist-publish-review/
  - pending packs list
  - pack detail viewer (cover + meta + 큐브 미리보기)
  - 자동 스캔 결과 + 위험 도 (low / mid / high)
  - approve / reject / request-changes 버튼
  - reject 사유 입력 (이메일 발송)
```

### 검토 기준

- **저작권**: 타사 로고 / 상표 사용 금지 (단, 무료 사용 허가 명시 시 OK)
- **부적절 콘텐츠**: 성인 / 폭력 / 차별 (성인 카테고리 정책: `project_adult_category` 메모리 참조)
- **악성 코드**: 자동 스캔 high 위험 큐브
- **품질**: 큐브 라벨 / 설명 의미 있음 (1글자 라벨 다수 = 반려)
- **중복**: 동일 작성자의 유사 큐브팩 (재게시 spam) — 자동 매칭 후 검토

### 처리

```
승인:
  D1 UPDATE packs SET status = 'live', reviewed_at = NOW(), reviewer_id = ?
  카탈로그 즉시 노출 (Cloudflare cache 무효화)
  작성자 이메일 알림

반려:
  D1 UPDATE packs SET status = 'rejected', review_notes = ?, reviewed_at = NOW()
  작성자 이메일 알림 (사유 포함)
  작성자 PC 앱 알림 (Notice 메시지 push)

수정 요청:
  D1 UPDATE packs SET status = 'changes_requested', review_notes = ?
  작성자 이메일 + PC 앱 알림
  재업로드 시 같은 pack_id 유지 (버전 증가)
```

## 7. 작성자 대시보드 (PC 앱)

`apps/pc-version/frontend/src/components/PublisherDashboard.tsx` (v0.1.4 신규):

- 내 큐브팩 리스트 (live / pending / rejected / changes_requested)
- 각 큐브팩 통계 (install / revenue / rating)
- 게시 새 버전 업로드
- 비공개 / 삭제 토글

```
GET /v1/publisher/packs (Bearer Token)
→ [{pack_id, name, status, install_count, revenue_cents, rating}]

POST /v1/publisher/packs/{id}/unpublish
→ 카탈로그에서 즉시 제거 (기존 install 사용자는 영향 X)

DELETE /v1/publisher/packs/{id}
→ confirm 후 영구 삭제 (라이센스 발급된 사용자는 다운로드 불가)
```

## 8. 수수료

```
무료 큐브팩: 게시 수수료 0
유료 큐브팩:
  결제 발생 시:
    - PayPal/Binance Pay 수수료 (각 사이트 정책)
    - 우리 수수료 15% (호스팅 + 검토 + 인프라)
    - 작성자 수령: 결제 금액 - PayPal/Binance 수수료 - 15%
  예시: $9.99 결제
    PayPal fee (3.49% + $0.49) = $0.84
    우리 수수료 (15% of $9.99) = $1.50
    작성자: $7.65
```

작성자 정산:
- 월말 누적 수익 $50 초과 시 다음 달 5일 송금
- $50 미만은 이월
- payout_method: PayPal email 또는 Binance Pay ID

## 9. 정책 / 약관

게시 시 동의 필수:
- 저작권 본인 보유 확인
- 악성 코드 미포함 확인
- 우리 검토 권한 위임
- 수익 분배 동의 (15%)
- 게시 후 30일 환불 정책 동의

## 10. v0.1.4 활성화 순서

```
T+30일: PC 앱 PublishTokenDialog + 검증 로직
T+45일: 서버 /v1/publish/upload + 자동 스캔
T+60일: agent-dashboard 검토 도구
T+75일: 작성자 대시보드 + 통계
T+90일: 정식 활성화
```

## 11. 참고

- 마켓플레이스 API: `marketplace-api.yaml` (Phase 12)
- 라이센스 키: `license-key.md` (Phase 13)
- 결제 콜백: `payment-callback.md` (Phase 14)
- 서버 인프라: `server-infra.md` (Phase 19)
- 자체 셀러 시스템 X 정책: `feedback_aiklink_seller_policy.md` (영구)
