/**
 * 주소모아 sites.json → 큐브 리스트 (.cubeone JSON) 일괄 변환
 *
 * 사양: docs/site/jusomoa-links-to-cubes-spec.md (영구 정책 v3)
 * 입력: E:/Claude-Workspace/jusomoa/data/sites.json
 * 출력:
 *   - E:/Claude-Workspace/rebirth-station/seed-data/jusomoa-cubes.json (모든 큐브)
 *   - E:/Claude-Workspace/rebirth-station/seed-data/jusomoa-cubelists.json (카테고리별 리스트)
 *   - E:/Claude-Workspace/rebirth-station/seed-data/jusomoa-stats.json (변환 통계)
 *
 * Stage 2 활성 시 Supabase bulk import 가능 형태.
 */

const fs = require("fs");
const path = require("path");

const SRC = "E:/Claude-Workspace/jusomoa/data/sites.json";
const OUT_DIR = "E:/Claude-Workspace/rebirth-station/seed-data";

// 카테고리별 디폴트 색상 (사이트 시드 카탈로그 일치)
const CATEGORY_COLORS = {
  "음식": "#FF5722",
  "쇼핑": "#E91E63",
  "금융": "#1A237E",
  "여행": "#03A9F4",
  "엔터테인먼트": "#9C27B0",
  "게임": "#673AB7",
  "교육": "#1565C0",
  "뉴스": "#37474F",
  "스포츠": "#43A047",
  "AI": "#10A37F",
  "유튜브": "#FF0000",
  "음악": "#1DB954",
  "코인": "#FF9800",
  "주식": "#FF6B35",
  "SNS": "#5865F2",
  "부동산": "#FF7043",
  "뷰티": "#EC407A",
  "스트리밍": "#9146FF",
};

// 카테고리별 디폴트 이모지
const CATEGORY_EMOJIS = {
  "음식": "🍽",
  "쇼핑": "🛒",
  "금융": "💰",
  "여행": "✈️",
  "엔터테인먼트": "🎬",
  "게임": "🎮",
  "교육": "📚",
  "뉴스": "📰",
  "스포츠": "⚽",
  "AI": "🤖",
  "유튜브": "▶️",
  "음악": "🎵",
  "코인": "🪙",
  "주식": "📈",
  "SNS": "💬",
  "부동산": "🏠",
  "뷰티": "💄",
  "스트리밍": "📺",
};

function toCube(site) {
  const cat = site.category || "기타";
  return {
    schema_version: "1.0",
    id: site.id,
    name: site.name,
    name_en: site.nameEn || null,
    icon: CATEGORY_EMOJIS[cat] || "🔗",
    color: CATEGORY_COLORS[cat] || "#1A237E",
    tier: 1,
    action: {
      type: "url",
      payload: { url: site.url },
    },
    category: cat,
    category_slug: site.categorySlug || null,
    tags: site.tags || [],
    metadata: {
      description: site.description || null,
      slug: site.slug,
      rank: site.rank ?? null,
      click_count: site.clickCount ?? 0,
      is_safe: site.isSafe ?? null,
      is_verified: site.isVerified ?? null,
      is_official: site.isOfficial ?? null,
    },
    source: "jusomoa-system",
    source_id: site.id,
    owner_user_id: "jusomoa-system",
    status: site.status || "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function main() {
  console.log("주소모아 sites.json 읽기...");
  const sites = JSON.parse(fs.readFileSync(SRC, "utf8"));
  console.log(`총 ${sites.length} 사이트`);

  // active 사이트만 변환
  const activeSites = sites.filter((s) => (s.status || "active") === "active");
  console.log(`active 사이트: ${activeSites.length}`);

  const cubes = activeSites.map(toCube);

  // 카테고리별 그룹
  const byCategory = {};
  for (const c of cubes) {
    const cat = c.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(c);
  }

  // 카테고리별 큐브 리스트 (24개 단위 자동 분할)
  const cubelists = [];
  for (const [cat, list] of Object.entries(byCategory)) {
    const chunks = [];
    for (let i = 0; i < list.length; i += 24) {
      chunks.push(list.slice(i, i + 24));
    }
    chunks.forEach((chunk, idx) => {
      cubelists.push({
        schema_version: "1.0",
        id: `jusomoa-system-${cat}-${idx + 1}`,
        name: chunks.length > 1 ? `주소모아 ${cat} ${idx + 1}` : `주소모아 ${cat}`,
        platform: "주소모아",
        cubes: chunk.map((c) => c.id),
        max_cubes: 24,
        owner_user_id: "jusomoa-system",
        is_published: false,
        is_for_sale: false,
        price_krw: 0,
        category: cat,
        source: "jusomoa-system",
        created_at: new Date().toISOString(),
      });
    });
  }

  // 통계
  const stats = {
    converted_at: new Date().toISOString(),
    source: SRC,
    total_sites: sites.length,
    active_sites: activeSites.length,
    cubes_created: cubes.length,
    cubelists_created: cubelists.length,
    categories: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, v.length])
    ),
    spec: "docs/site/jusomoa-links-to-cubes-spec.md",
    policy: "정책 v3 (project_cubepack_policy_v2.md)",
  };

  // 출력
  fs.writeFileSync(
    path.join(OUT_DIR, "jusomoa-cubes.json"),
    JSON.stringify(cubes, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "jusomoa-cubelists.json"),
    JSON.stringify(cubelists, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "jusomoa-stats.json"),
    JSON.stringify(stats, null, 2)
  );

  console.log("\n✅ 변환 완료");
  console.log(`  cubes: ${cubes.length}`);
  console.log(`  cubelists: ${cubelists.length}`);
  console.log(`  categories: ${Object.keys(byCategory).length}`);
  console.log("\n카테고리별 큐브 수:");
  for (const [k, v] of Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${k}: ${v.length}`);
  }
}

main();
