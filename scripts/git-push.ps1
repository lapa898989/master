# Push в GitHub при ошибке Schannel CRYPT_E_NO_REVOCATION_CHECK на Windows.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

. (Join-Path $PSScriptRoot "ensure-git.ps1")

git config http.schannelCheckRevocation false
git config http.schannelCheckRevoke false

Write-Host "git push (обход проверки SSL для Schannel в этой сети)..." -ForegroundColor Cyan
git -c http.sslVerify=false push
Write-Host "Готово." -ForegroundColor Green
