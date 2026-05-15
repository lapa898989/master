$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

$ver = "v22.14.0"
$zip = Join-Path (Get-Location) ".tools\node-win-x64.zip"
$dest = Join-Path (Get-Location) ".tools"
$folderName = "node-$ver-win-x64"
$extracted = Join-Path $dest $folderName
$final = Join-Path $dest "node-win"

New-Item -ItemType Directory -Force -Path $dest | Out-Null

if (Test-Path (Join-Path $final "node.exe")) {
  Write-Host "Portable Node already present: $final"
  exit 0
}

$url = "https://nodejs.org/dist/$ver/node-$ver-win-x64.zip"
Write-Host "Downloading $url ..."
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

Write-Host "Extracting..."
Expand-Archive -Path $zip -DestinationPath $dest -Force

if (-not (Test-Path $extracted)) {
  throw "Expected folder missing: $extracted"
}

if (Test-Path $final) {
  Remove-Item -Recurse -Force $final
}
Rename-Item -Path $extracted -NewName "node-win"

Remove-Item $zip -Force -ErrorAction SilentlyContinue

& (Join-Path $final "node.exe") -v
& (Join-Path $final "npm.cmd") -v
Write-Host "Done: $final"
