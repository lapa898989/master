# First local commit (no push). Run from repo root: powershell -File scripts/init-git-repo.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

. "$PSScriptRoot\ensure-git.ps1"

$git = Join-Path $root ".tools\mingit\cmd\git.exe"
if (-not (Test-Path $git)) { throw "MinGit not found" }

if (-not (Test-Path (Join-Path $root ".git"))) {
  & $git init
  & $git branch -M main
}

& $git config user.email "you@example.com"
& $git config user.name "Local Developer"

& $git add -A
$status = & $git status --porcelain
if (-not $status) {
  Write-Host "Nothing to commit."
  exit 0
}

& $git commit -m "Initial commit: ServiceDrive MVP"
Write-Host "Commit OK. Next: set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO then run scripts/push-to-github.ps1" -ForegroundColor Green
