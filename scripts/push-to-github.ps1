# Создаёт репозиторий на GitHub (если его ещё нет) и делает git push.
# Нужен Personal Access Token с правами repo: https://github.com/settings/tokens
#
# PowerShell:
#   $env:GITHUB_TOKEN = "ghp_xxxxxxxx"
#   $env:GITHUB_OWNER = "ваш-логин"
#   $env:GITHUB_REPO   = "servicedrive"   # имя нового репозитория
#   .\scripts\push-to-github.ps1
#
# Или один раз: создайте пустой репозиторий на сайте GitHub и задайте только TOKEN + OWNER + REPO.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$mingit = Join-Path $root ".tools\mingit\cmd\git.exe"
if (-not (Test-Path $mingit)) {
  Write-Host "Сначала запустите: .\scripts\ensure-git.ps1" -ForegroundColor Red
  exit 1
}

$token = $env:GITHUB_TOKEN
$owner = $env:GITHUB_OWNER
$repo = $env:GITHUB_REPO
if (-not $token -or -not $owner -or -not $repo) {
  Write-Host "Задайте переменные: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO" -ForegroundColor Yellow
  exit 1
}

$headers = @{
  Authorization = "Bearer $token"
  Accept        = "application/vnd.github+json"
  "User-Agent"  = "ServiceDrive-push-script"
}

$exists = $false
try {
  $r = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo" -Headers $headers -Method Get
  $exists = $true
  Write-Host "Репозиторий $owner/$repo уже существует."
} catch {
  Write-Host "Создаю репозиторий $owner/$repo ..."
  $body = @{ name = $repo; private = $false; auto_init = $false } | ConvertTo-Json
  Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body -ContentType "application/json" | Out-Null
}

& $mingit remote remove origin 2>$null
# PAT как пароль: пользователь x-access-token (рекомендация GitHub)
$remoteUrl = "https://x-access-token:$token@github.com/$owner/$repo.git"
& $mingit remote add origin $remoteUrl
& $mingit branch -M main
& $mingit push -u origin main

Write-Host "Готово: https://github.com/$owner/$repo" -ForegroundColor Green
