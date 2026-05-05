# Качает портативный MinGit в .tools/mingit (игнорируется git) и добавляет в PATH на сессию.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$tools = Join-Path $root ".tools\mingit"
$gitExe = Join-Path $tools "cmd\git.exe"

if (-not (Test-Path $gitExe)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $tools) | Out-Null
  $url = "https://github.com/git-for-windows/git/releases/download/v2.54.0.windows.1/MinGit-2.54.0-64-bit.zip"
  $zip = Join-Path $env:TEMP "MinGit-2.54.0-64-bit.zip"
  Write-Host "Downloading MinGit..."
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
  Expand-Archive -Path $zip -DestinationPath $tools -Force
  Remove-Item $zip -Force -ErrorAction SilentlyContinue
}

$env:PATH = "$(Join-Path $tools 'cmd');$(Join-Path $tools 'usr\bin');$env:PATH"
& $gitExe --version
Write-Host "Git: $gitExe" -ForegroundColor Green
