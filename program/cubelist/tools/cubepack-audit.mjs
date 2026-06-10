#!/usr/bin/env node
/**
 * cubepack-audit — 큐브팩 자산화 QA 게이트 (2026-06-11 사용자 확정 4 검토사항)
 *
 *   1) 모든 큐브가 정상 작동하는가?        → 정적 검증 (실행 테스트는 PC 앱에서 별도)
 *   2) 라이선스/잔여 기록이 없는가?        → SD 흔적 전수 스캔
 *   3) 큐브 리스트 아이콘이 정확한가?      → 팩/리스트 아이콘 존재 검사
 *   4) 큐브 아이콘 통일감?                → 아이콘 임베드율 + placeholder 카운트 (디자인 판정은 수동)
 *
 * 사용: node tools/cubepack-audit.mjs <pack.cubepack> [--json out.json]
 * 종료코드: 0=PASS, 1=FAIL(게이트 미달), 2=오류
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const JSZip = require(path.join(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '..', 'apps', 'pc-version', 'frontend', 'node_modules', 'jszip',
));

// ── 잔여 기록 정의 (검토사항 2) ────────────────────────────────────────────
// 키 자체가 SD 흔적인 것 — 클린본에는 존재하면 안 됨
const RESIDUE_KEYS = [
  'streamdeck_source', 'streamdeck_meta',
  'sd_uuid', 'sd_action_id', 'sd_coord',
  'iconpack_source', 'iconpack_icon_name', // 외부(Elgato) 아이콘팩 출처 = 라이선스 잔여
];
// 값에 나타나면 안 되는 문자열 (대소문자 무시)
const RESIDUE_VALUES = ['elgato', 'streamdeck', 'stream deck', 'stream-deck', 'iconpack:'];
// metadata.source 의 SD 계열 값
const RESIDUE_SOURCE_PREFIX = 'streamdeck';

function scanResidue(obj, basePath, out) {
  if (obj === null || typeof obj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) {
    const p = basePath ? `${basePath}.${k}` : k;
    if (RESIDUE_KEYS.includes(k)) out.push({ path: p, kind: 'key', detail: k });
    if (k === 'source' && typeof v === 'string' && v.toLowerCase().startsWith(RESIDUE_SOURCE_PREFIX)) {
      out.push({ path: p, kind: 'value', detail: v });
    }
    if (typeof v === 'string') {
      const low = v.toLowerCase();
      for (const needle of RESIDUE_VALUES) {
        if (low.includes(needle)) { out.push({ path: p, kind: 'value', detail: v.slice(0, 80) }); break; }
      }
    } else if (typeof v === 'object') {
      scanResidue(v, p, out);
    }
  }
}

// ── 작동성 정적 검증 (검토사항 1의 정적 부분) ─────────────────────────────
function checkRunnable(cube, zipEntries, issues) {
  const t = cube.action_type;
  const pl = cube.action_payload ?? {};
  if (t === 'link') {
    if (!pl.url || !/^https?:\/\//.test(pl.url)) issues.push(`link url 무효: ${pl.url ?? '(없음)'}`);
  } else if (t === 'plugin_action') {
    if (!pl.plugin_dir && !pl.plugin_id) {
      issues.push('plugin_action 스텁 — plugin_dir/plugin_id 비어있음 (런타임 포팅 전, 작동 불가)');
    }
  } else if (t === 'macro') {
    if (!Array.isArray(pl.steps) || pl.steps.length === 0) issues.push('macro steps 비어있음');
  } else if (t === 'shortcut') {
    if (!pl.keys || (Array.isArray(pl.keys) && pl.keys.length === 0)) issues.push('shortcut keys 비어있음');
  } else if (t === 'app_launch') {
    if (!pl.path) issues.push('app_launch path 비어있음');
  }
  // states 이미지 참조가 실재하는지 (cube ZIP 내부 기준)
  for (const [i, st] of (cube.states ?? []).entries()) {
    if (st.image && !zipEntries.has(st.image.replace(/\\/g, '/'))) {
      issues.push(`states[${i}].image 깨진 참조: ${st.image}`);
    }
  }
}

// ── 아이콘 검사 (검토사항 3·4의 자동화 가능 부분) ─────────────────────────
function checkIcon(cube, stats) {
  const meta = cube.metadata ?? {};
  const hasIcon = typeof cube.icon_url === 'string' && cube.icon_url.length > 0;
  if (!hasIcon) stats.noIcon += 1;
  else if (meta.icon_is_placeholder === true) stats.placeholder += 1;
  else if (meta.icon_is_tiny === true) stats.tiny += 1;
  else stats.ok += 1;
}

async function loadZip(buf) {
  return JSZip.loadAsync(buf);
}

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('사용: node tools/cubepack-audit.mjs <pack.cubepack> [--json out.json]'); process.exit(2); }
  const jsonOutIdx = process.argv.indexOf('--json');
  const jsonOut = jsonOutIdx > 0 ? process.argv[jsonOutIdx + 1] : null;

  const packZip = await loadZip(fs.readFileSync(file));
  const report = {
    file: path.basename(file),
    audited_at: null, // 호출측에서 기록 (스크립트는 재현성 우선)
    pack_residue: [],
    lists: [],
    totals: { cubes: 0, runnable_issues: 0, residue_hits: 0, icon: { ok: 0, placeholder: 0, tiny: 0, noIcon: 0 } },
    verdict: { check1_runnable: false, check2_clean: false, check3_list_icon: false, check4_cube_icons: false },
  };

  const packManifest = JSON.parse(await packZip.file('manifest.json').async('text'));
  scanResidue(packManifest, 'pack', report.pack_residue);

  // 검토사항 3: 팩 자체 아이콘 (cover/icon 항목)
  const packIconEntry = Object.keys(packZip.files).find((n) => /^(icon|cover)\.(png|svg|webp)$/i.test(n));
  report.pack_icon = packIconEntry ?? null;

  for (const listRef of packManifest.pack?.lists ?? []) {
    const listEntry = packZip.file(listRef.ref);
    const listRep = { ref: listRef.ref, residue: [], cubes: [] };
    report.lists.push(listRep);
    if (!listEntry) { listRep.error = 'ref 누락'; continue; }
    const listZip = await loadZip(await listEntry.async('uint8array'));
    const listManifest = JSON.parse(await listZip.file('manifest.json').async('text'));
    scanResidue(listManifest, 'list', listRep.residue);

    for (const cubeRef of listManifest.list?.order ?? []) {
      const cubeEntry = listZip.file(cubeRef.ref);
      const cubeRep = { ref: cubeRef.ref, label: null, issues: [], residue: [] };
      listRep.cubes.push(cubeRep);
      report.totals.cubes += 1;
      if (!cubeEntry) { cubeRep.issues.push('ref 누락'); continue; }
      const cubeZip = await loadZip(await cubeEntry.async('uint8array'));
      const cubeManifest = JSON.parse(await cubeZip.file('manifest.json').async('text'));
      const cube = cubeManifest.cube ?? {};
      cubeRep.label = cube.label ?? '(무명)';
      const entries = new Set(Object.keys(cubeZip.files));
      checkRunnable(cube, entries, cubeRep.issues);
      scanResidue(cubeManifest, 'cube', cubeRep.residue);
      checkIcon(cube, report.totals.icon);
    }
  }

  // 집계
  for (const l of report.lists) {
    report.totals.residue_hits += l.residue.length;
    for (const c of l.cubes) {
      report.totals.residue_hits += c.residue.length;
      report.totals.runnable_issues += c.issues.length;
    }
  }
  report.totals.residue_hits += report.pack_residue.length;

  report.verdict.check1_runnable = report.totals.runnable_issues === 0;
  report.verdict.check2_clean = report.totals.residue_hits === 0;
  report.verdict.check3_list_icon = report.pack_icon !== null;
  report.verdict.check4_cube_icons =
    report.totals.icon.noIcon === 0 && report.totals.icon.placeholder === 0 && report.totals.icon.tiny === 0;
  const pass = Object.values(report.verdict).every(Boolean);

  // 콘솔 요약
  const v = report.verdict;
  console.log(`\n■ ${report.file} — 큐브 ${report.totals.cubes}개`);
  console.log(`  1) 작동(정적):  ${v.check1_runnable ? 'PASS' : `FAIL (${report.totals.runnable_issues}건)`}`);
  console.log(`  2) 클린(잔여):  ${v.check2_clean ? 'PASS' : `FAIL (${report.totals.residue_hits}건)`}`);
  console.log(`  3) 리스트 아이콘: ${v.check3_list_icon ? `PASS (${report.pack_icon})` : 'FAIL (팩 아이콘 없음)'}`);
  console.log(`  4) 큐브 아이콘:  ${v.check4_cube_icons ? 'PASS' : `FAIL (정상 ${report.totals.icon.ok} / placeholder ${report.totals.icon.placeholder} / tiny ${report.totals.icon.tiny} / 없음 ${report.totals.icon.noIcon})`}`);
  console.log(`  ⇒ ${pass ? '자산 등록 가능' : '자산화 게이트 미달'} (4) 디자인 통일감은 통과 후 수동 최종 판정)\n`);

  if (jsonOut) {
    fs.writeFileSync(jsonOut, JSON.stringify(report, null, 1), 'utf-8');
    console.log(`상세: ${jsonOut}`);
  }
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error('오류:', e.message); process.exit(2); });
