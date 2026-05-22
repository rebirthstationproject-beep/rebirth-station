#!/usr/bin/env node
/**
 * og/*.svg → og/*.png (1200×630, OG 표준 사이즈)
 * 영구 정책: 메인 디자인 SVG 기반 PNG 변환 (fal.ai X)
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const SRC = path.resolve(__dirname, '../og')
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.svg'))

async function main() {
  for (const f of files) {
    const svg = fs.readFileSync(path.join(SRC, f))
    const out = path.join(SRC, f.replace(/\.svg$/, '.png'))
    await sharp(svg).resize(1200, 630, { fit: 'contain', background: { r: 26, g: 35, b: 126, alpha: 1 } }).png().toFile(out)
    console.log(`  ✅ og/${f.replace(/\.svg$/, '.png')}`)
  }
  console.log(`\n총 ${files.length} OG PNG 생성`)
}

main().catch((e) => { console.error('오류:', e); process.exit(1) })
