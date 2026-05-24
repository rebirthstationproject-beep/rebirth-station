#!/usr/bin/env pwsh
# 큐브 리스트 PC 자동 재빌드 + 실행
#
# 사용:
#   E:\Claude-Workspace\rebirth-station\program\cubelist\apps\pc-version\scripts\rebuild-and-launch.ps1
#
# 흐름:
#   1. 기존 cubelist-pc-helper.exe 프로세스 종료 (잠금 해제)
#   2. frontend 빌드 (npm run build)
#   3. Tauri release 빌드 (cargo tauri build --features keys)
#   4. 새 exe Start-Process (백그라운드)
#
# 첫 빌드 후 캐시 hit 으로 약 1~2분 소요.

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot   # apps/pc-version
$exe = Join-Path $root "target\release\cubelist-pc-helper.exe"
$frontend = Join-Path $root "frontend"

Write-Host "===[1/4] 기존 프로세스 종료===" -ForegroundColor Cyan
$running = Get-Process cubelist-pc-helper -ErrorAction SilentlyContinue
if ($running) {
    $running | Stop-Process -Force
    Write-Host "  ✓ $($running.Count) 개 프로세스 종료" -ForegroundColor Green
    Start-Sleep -Milliseconds 500  # 파일 잠금 해제 대기
} else {
    Write-Host "  · 실행 중인 프로세스 없음" -ForegroundColor Gray
}

Write-Host ""
Write-Host "===[2/4] frontend 빌드===" -ForegroundColor Cyan
Push-Location $frontend
try {
    & npm run build 2>&1 | Select-Object -Last 6
    if ($LASTEXITCODE -ne 0) {
        throw "frontend build 실패 (exit $LASTEXITCODE)"
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "===[3/4] Tauri release 빌드===" -ForegroundColor Cyan
Push-Location $root
try {
    & cargo tauri build --features keys 2>&1 | Select-Object -Last 8
    # tauri bundler 가 updater 미설정으로 마지막에 warn 낼 수 있음 — exe 자체는 빌드됨
    if (-not (Test-Path $exe)) {
        throw "exe 산출 실패: $exe 없음"
    }
} finally {
    Pop-Location
}

$exeInfo = Get-Item $exe
$sizeMB = [math]::Round($exeInfo.Length / 1MB, 2)
Write-Host "  ✓ exe 산출 $sizeMB MB · 갱신 $($exeInfo.LastWriteTime)" -ForegroundColor Green

Write-Host ""
Write-Host "===[4/4] exe 실행===" -ForegroundColor Cyan
Start-Process $exe
Start-Sleep -Seconds 2
$proc = Get-Process cubelist-pc-helper -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "  ✓ PID $($proc.Id) · WindowTitle: $($proc.MainWindowTitle)" -ForegroundColor Green
} else {
    Write-Host "  ✗ 프로세스 부팅 실패 (즉시 종료됨)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done. cubelist-pc-helper.exe 가 트레이/창에 표시됩니다." -ForegroundColor Green
