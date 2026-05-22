-- 0001 — Rebirth Station 초기 스키마
-- 2026-05-23
-- 기준: jusomoa-list/CLAUDE.md tech-review (mylist_* prefix·RLS·인덱스 6종)
-- 사용자 명시 영구 정책: feedback_business_proposal_review_protocol.md (markdown 약속 = 실 코드 100% 실행)

------------------------------------------------------------
-- 1. mylist_boards (사용자 큐브 리스트·기존 jusomoa lists와 충돌 X prefix)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mylist_boards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  sort_order  REAL NOT NULL DEFAULT 0,           -- 드래그 리오더 충돌 회피 (real)
  ver         TEXT NOT NULL DEFAULT 'rebirth',   -- 콜라보 ver. 분기 (rebirth·jusomoa·keilink)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mylist_boards_user_id_sort ON mylist_boards(user_id, sort_order);

------------------------------------------------------------
-- 2. mylist_items (큐브 단일 단위·6~24/board)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mylist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id     UUID NOT NULL REFERENCES mylist_boards(id) ON DELETE CASCADE,
  grid_x       INT NOT NULL,
  grid_y       INT NOT NULL,
  action_type  TEXT NOT NULL CHECK (action_type IN ('url','shortcut','macro')),
  name         TEXT NOT NULL,
  icon         TEXT,                              -- 이모지·이미지 URL
  color        TEXT,                              -- hex
  payload      JSONB NOT NULL,                    -- url·keys·steps 등
  tier         INT NOT NULL DEFAULT 1 CHECK (tier IN (1,2,3)),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board_id, grid_x, grid_y)
);
CREATE INDEX IF NOT EXISTS idx_mylist_items_board_id ON mylist_items(board_id);
CREATE INDEX IF NOT EXISTS idx_mylist_items_board_grid ON mylist_items(board_id, grid_x, grid_y);

------------------------------------------------------------
-- 3. mylist_plugins (큐브팩·정책 v2 = 플랫폼/프로그램 단위, 가상 카탈로그 금지)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mylist_plugins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  platform        TEXT NOT NULL,                  -- Figma·OBS·VS Code 등 (정책 v2)
  description     TEXT,
  preview_url     TEXT,                           -- 미리보기 이미지
  price_krw       INT NOT NULL DEFAULT 0 CHECK (price_krw >= 0),
  is_published    BOOLEAN NOT NULL DEFAULT false,
  install_count   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mylist_plugins_install_count ON mylist_plugins(install_count DESC);
CREATE INDEX IF NOT EXISTS idx_mylist_plugins_seller_id ON mylist_plugins(seller_id);

------------------------------------------------------------
-- 4. mylist_plugin_installs (사용자 ↔ plugin 설치 기록)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mylist_plugin_installs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id   UUID NOT NULL REFERENCES mylist_plugins(id) ON DELETE CASCADE,
  board_id    UUID REFERENCES mylist_boards(id) ON DELETE SET NULL,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plugin_id, board_id)
);
CREATE INDEX IF NOT EXISTS idx_mylist_plugin_installs_user_plugin ON mylist_plugin_installs(user_id, plugin_id);
CREATE INDEX IF NOT EXISTS idx_mylist_plugin_installs_board_id ON mylist_plugin_installs(board_id);

------------------------------------------------------------
-- 5. subscriptions (Pro 진실원·IAP 옵션 A 영구)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status              TEXT NOT NULL CHECK (status IN ('active','expired','grace','refunded','revoked')),
  payment_provider    TEXT NOT NULL CHECK (payment_provider IN ('app_store','play_store','microsoft_store')),
  current_period_end  TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- 6. iap_receipts (append-only 영수증·멱등 검증)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS iap_receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL CHECK (provider IN ('app_store','play_store','microsoft_store')),
  transaction_id  TEXT NOT NULL,
  raw_receipt     TEXT NOT NULL,
  verified        BOOLEAN NOT NULL DEFAULT false,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, transaction_id)
);
CREATE INDEX IF NOT EXISTS idx_iap_receipts_user_id ON iap_receipts(user_id);

------------------------------------------------------------
-- 7. otp_consumed (페어링 OTP 1회 사용 마커)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_consumed (
  otp_secret  TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- 8. user_devices (페어링된 디바이스)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_devices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint    TEXT NOT NULL,
  device_name           TEXT,
  platform              TEXT,                       -- windows·macos·ios·android
  paired_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at          TIMESTAMPTZ,
  UNIQUE (user_id, device_fingerprint)
);

------------------------------------------------------------
-- 9. RLS 정책 (영구 정책 = (SELECT auth.uid()) = user_id 인라인 최적화)
------------------------------------------------------------
ALTER TABLE mylist_boards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mylist_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE mylist_plugins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mylist_plugin_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE iap_receipts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_consumed           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices           ENABLE ROW LEVEL SECURITY;

-- boards
CREATE POLICY boards_own_select ON mylist_boards FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY boards_own_insert ON mylist_boards FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY boards_own_update ON mylist_boards FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY boards_own_delete ON mylist_boards FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- items (부모 board 조회 = EXISTS 사용)
CREATE POLICY items_own_select ON mylist_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM mylist_boards WHERE mylist_boards.id = mylist_items.board_id AND mylist_boards.user_id = (SELECT auth.uid()))
);
CREATE POLICY items_own_modify ON mylist_items FOR ALL USING (
  EXISTS (SELECT 1 FROM mylist_boards WHERE mylist_boards.id = mylist_items.board_id AND mylist_boards.user_id = (SELECT auth.uid()))
);

-- plugins (셀러 본인 + 발행물은 공개)
CREATE POLICY plugins_published_select ON mylist_plugins FOR SELECT USING (is_published = true OR (SELECT auth.uid()) = seller_id);
CREATE POLICY plugins_seller_modify ON mylist_plugins FOR ALL USING ((SELECT auth.uid()) = seller_id);

-- plugin_installs
CREATE POLICY plugin_installs_own ON mylist_plugin_installs FOR ALL USING ((SELECT auth.uid()) = user_id);

-- subscriptions
CREATE POLICY subs_own_select ON subscriptions FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- iap_receipts (append-only, sucept 사용자 본인만 + service_role bypass)
CREATE POLICY iap_own_select ON iap_receipts FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- otp_consumed
CREATE POLICY otp_own ON otp_consumed FOR ALL USING ((SELECT auth.uid()) = user_id);

-- user_devices
CREATE POLICY devices_own ON user_devices FOR ALL USING ((SELECT auth.uid()) = user_id);

------------------------------------------------------------
-- 10. updated_at 자동 갱신 트리거
------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mylist_boards_updated_at         BEFORE UPDATE ON mylist_boards         FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER mylist_items_updated_at          BEFORE UPDATE ON mylist_items          FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER mylist_plugins_updated_at        BEFORE UPDATE ON mylist_plugins        FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER subscriptions_updated_at          BEFORE UPDATE ON subscriptions          FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

------------------------------------------------------------
-- 종료: 8 테이블 · 6 인덱스 · 12 RLS 정책 · 4 트리거
-- 다음 마이그레이션 = 0002_realtime_channels.sql, 0003_iap_edge_function.sql
------------------------------------------------------------
