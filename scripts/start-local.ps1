# Запуск ServiceDrive локально: Supabase в Docker + Next.js.
# Требования: Docker Desktop, Node.js 18+ (npm/npx в PATH).
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

$portableNodeDir = Join-Path (Get-Location) ".tools\node-win"
if (Test-Path (Join-Path $portableNodeDir "node.exe")) {
  $env:PATH = "$portableNodeDir;$env:PATH"
  Write-Host "Используется portable Node: $portableNodeDir" -ForegroundColor DarkGray
} elseif (Test-Path (Join-Path (Split-Path -Parent $PSScriptRoot) "scripts\bootstrap-node-tools.ps1")) {
  Write-Host "Portable Node не найден в .tools\node-win. Запустите один раз: .\scripts\bootstrap-node-tools.ps1" -ForegroundColor Yellow
}

function Test-Cmd($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-Cmd "docker")) {
  Write-Error "Docker не найден в PATH. Установите Docker Desktop, запустите его и повторите."
}
docker info | Out-Null

if (-not (Test-Cmd "npm")) {
  Write-Error "npm не найден. Установите Node.js LTS с https://nodejs.org/ или выполните .\scripts\bootstrap-node-tools.ps1"
}

Write-Host "npm install..." -ForegroundColor Cyan
npm install

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.local.example" ".env.local"
  Write-Host "Создан .env.local из примера. При необходимости сверьте ключи: npx supabase status" -ForegroundColor Yellow
}

Write-Host "Запуск Supabase (первый раз скачает образы)..." -ForegroundColor Cyan
npx --yes supabase@latest start

Write-Host "Проверка переменных (скопируйте в .env.local если отличаются):" -ForegroundColor Cyan
npx supabase status

Write-Host "Запуск Next.js: http://localhost:3000" -ForegroundColor Green
npm run dev
