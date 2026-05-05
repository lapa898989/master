# Creates GitHub repo if missing, then git push. PAT needs "repo" scope:
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

$me = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers -Method Get
if ($me.login -ne $owner) {
  Write-Host ("Warning: GITHUB_OWNER is " + $owner + " but token is for " + $me.login + ". Using " + $me.login + ".") -ForegroundColor Yellow
  $owner = $me.login
}

$repoMissing = $false
try {
  Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo" -Headers $headers -Method Get | Out-Null
  Write-Host ("Repo " + $owner + "/" + $repo + " exists.")
} catch {
  $repoMissing = $true
}

if ($repoMissing) {
  Write-Host ("Creating repo " + $owner + "/" + $repo + " ...")
  $body = @{ name = $repo; private = $false; auto_init = $false } | ConvertTo-Json
  try {
    Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body -ContentType "application/json" | Out-Null
  } catch {
    $details = $_.ErrorDetails.Message
    if ($details -match "already exists") {
      Write-Host "Repo name already exists on this account. Pushing to it."
    } else {
      throw
    }
  }
}

$remoteList = @(& $mingit remote 2>$null)
if ($remoteList -contains "origin") {
  & $mingit remote remove origin
}

$remoteUrl = "https://x-access-token:$token@github.com/$owner/$repo.git"
& $mingit remote add origin $remoteUrl
& $mingit branch -M main
& $mingit push -u origin main

$doneUrl = "https://github.com/" + $owner + "/" + $repo
Write-Host ("Done: " + $doneUrl) -ForegroundColor Green
