#!/usr/bin/env node
/**
 * favicon.svg → favicon PNG 다중 사이즈 + apple-touch-icon 생성
 * 영구 정책 (`feedback_fal_ai_external_info_only.md`): 파비콘·로고 = 메인 디자인 SVG만 사용
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const SVG = path.resolve(__dirname, '../favicon.svg')
const OUT = path.resolve(__dirname, '..')
const TARGETS = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-96x96.png', size: 96 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-precomposed.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
]

async function main() {
  const svgBuf = fs.readFileSync(SVG)
  for (const t of TARGETS) {
    const outPath = path.join(OUT, t.name)
    await sharp(svgBuf).resize(t.size, t.size).png().toFile(outPath)
    console.log(`  ✅ ${t.name} (${t.size}×${t.size})`)
  }
  console.log('\n총 7 파일 생성 완료')
}

main().catch((e) => {
  console.error('오류:', e)
  process.exit(1)
})
