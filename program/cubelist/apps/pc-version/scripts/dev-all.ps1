# 큐브 리스트 PC — Vite + Tauri 동시 기동 (v0.1.3+, 2026-05-31)
#
# 실행:
#   .\scripts\dev-all.ps1
#
# 동작:
#   1. frontend Vite dev 서버 시작 (포트 3002)
#   2. Tauri dev 시작 (Vite 로드)
#   3. Ctrl+C 시 양쪽 정리
#
# 단축 실행:
#   Set-Alias -Name dev-cube -Value "$PSScriptRoot\dev-all.ps1"
#   dev-cube

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root 'frontend'

if (-not (Test-Path $frontend)) {
  Write-Error "frontend 폴더를 찾을 수 없습니다: $frontend"
  exit 1
}

Write-Host '== Vite dev 서버 시작 (포트 3002) ==' -ForegroundColor Cyan
$viteJob = Start-Job -Name 'vite-dev' -ScriptBlock {
  param($dir)
  Set-Location $dir
  npm run dev
} -ArgumentList $frontend

# Vite 서버 준비 대기 (최대 30초)
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $resp = Invoke-WebRequest -Uri 'http://127.0.0.1:3002' -TimeoutSec 1 -ErrorAction Stop -UseBasicParsing
    if ($resp.StatusCode -eq 200) { $ready = $true; break }
  } catch {
    Start-Sleep -Seconds 1
  }
}

if (-not $ready) {
  Write-Warning 'Vite 서버 준비 미확인 — 그대로 Tauri 진행 (수동 확인 필요)'
} else {
  Write-Host 'Vite 서버 OK (http://127.0.0.1:3002)' -ForegroundColor Green
}

Write-Host '== Tauri dev 시작 ==' -ForegroundColor Cyan
try {
  Set-Location $root
  cargo tauri dev --features keys
} finally {
  Write-Host '== 정리: Vite job 종료 ==' -ForegroundColor Yellow
  Stop-Job -Name 'vite-dev' -ErrorAction SilentlyContinue
  Remove-Job -Name 'vite-dev' -Force -ErrorAction SilentlyContinue
}
