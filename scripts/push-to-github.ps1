# Creates GitHub repo if missing, then git push. Needs a PAT with "repo" scope:
# https://github.com/settings/tokens
#
#   $env:GITHUB_TOKEN = "ghp_xxxx"
#   $env:GITHUB_OWNER = "your-login"
#   $env:GITHUB_REPO   = "servicedrive"
#   .\scripts\push-to-github.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$mingit = Join-Path $root ".tools\mingit\cmd\git.exe"
if (-not (Test-Path $mingit)) {
  Write-Host "Run first: .\scripts\ensure-git.ps1" -ForegroundColor Red
  exit 1
}

$token = $env:GITHUB_TOKEN
$owner = $env:GITHUB_OWNER
$repo = $env:GITHUB_REPO
if (-not $token -or -not $owner -or -not $repo) {
  Write-Host "Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO" -ForegroundColor Yellow
  exit 1
}

$headers = @{
  Authorization = "Bearer $token"
  Accept        = "application/vnd.github+json"
  "User-Agent"  = "ServiceDrive-push-script"
}

try {
  Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo" -Headers $headers -Method Get | Out-Null
  Write-Host "Repo $owner/$repo already exists."
} catch {
  Write-Host "Creating repo $owner/$repo ..."
  $body = @{ name = $repo; private = $false; auto_init = $false } | ConvertTo-Json
  Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body -ContentType "application/json" | Out-Null
}

& $mingit remote remove origin 2>$null
$remoteUrl = "https://x-access-token:$token@github.com/$owner/$repo.git"
& $mingit remote add origin $remoteUrl
& $mingit branch -M main
& $mingit push -u origin main

Write-Host "Done: https://github.com/$owner/$repo" -ForegroundColor Green
