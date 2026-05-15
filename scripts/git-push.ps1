# Push to GitHub when Schannel fails with CRYPT_E_NO_REVOCATION_CHECK (corporate network / Windows).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

. (Join-Path $PSScriptRoot "ensure-git.ps1")

git config http.schannelCheckRevocation false
git config http.schannelCheckRevoke false

Write-Host "git push (sslVerify=false workaround for this network)..." -ForegroundColor Cyan
git -c http.sslVerify=false push
Write-Host "Done." -ForegroundColor Green
