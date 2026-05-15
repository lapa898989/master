$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

$portableNodeDir = Join-Path (Get-Location) ".tools\node-win"
if (Test-Path (Join-Path $portableNodeDir "node.exe")) {
  $env:PATH = "$portableNodeDir;$env:PATH"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "Docker не найден. Установите Docker Desktop и запустите его."
}

Write-Host "npx supabase db reset ..." -ForegroundColor Cyan
npx --yes supabase@latest db reset
Write-Host "Готово." -ForegroundColor Green
