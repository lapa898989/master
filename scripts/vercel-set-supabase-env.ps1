# Uploads NEXT_PUBLIC_SUPABASE_* to Vercel via REST API (Production + Preview + Development).
#
# 1) Create token: https://vercel.com/account/tokens
# 2) Supabase: Dashboard -> Settings -> API -> Project URL + anon public key
#
# PowerShell:
#   $env:VERCEL_TOKEN = "xxxxxxxx"
#   $env:VERCEL_PROJECT = "master"          # project name as in Vercel (see Project Settings)
#   $env:VERCEL_TEAM_ID = ""                # optional: Team ID from team URL if project is under a team
#   $env:NEXT_PUBLIC_SUPABASE_URL = "https://xxxx.supabase.co"
#   $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ..."
#   powershell -ExecutionPolicy Bypass -File .\scripts\vercel-set-supabase-env.ps1

$ErrorActionPreference = "Stop"

$token = $env:VERCEL_TOKEN
$project = $env:VERCEL_PROJECT
if (-not $token -or -not $project) {
  Write-Host "Set VERCEL_TOKEN and VERCEL_PROJECT (Vercel project name)." -ForegroundColor Yellow
  exit 1
}

$url = $env:NEXT_PUBLIC_SUPABASE_URL
$key = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
if (-not $url -or -not $key) {
  Write-Host "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." -ForegroundColor Yellow
  exit 1
}

$teamId = $env:VERCEL_TEAM_ID
$qs = "upsert=true"
if ($teamId) { $qs += "&teamId=$teamId" }

$base = "https://api.vercel.com/v10/projects/$([uri]::EscapeDataString($project))/env?$qs"
$headers = @{
  Authorization = "Bearer $token"
  Accept        = "application/json"
}

function Send-Env($name, $value) {
  $body = @{
    key    = $name
    value  = $value
    type   = "plain"
    target = @("production", "preview", "development")
  } | ConvertTo-Json -Depth 5

  $r = Invoke-RestMethod -Uri $base -Method Post -Headers $headers -Body $body -ContentType "application/json"
  if ($r.failed -and $r.failed.Count -gt 0) {
    throw ($r.failed | ConvertTo-Json -Compress)
  }
  Write-Host "OK: $name" -ForegroundColor Green
}

Send-Env "NEXT_PUBLIC_SUPABASE_URL" $url
Send-Env "NEXT_PUBLIC_SUPABASE_ANON_KEY" $key

Write-Host "Done. Redeploy the latest deployment in Vercel (Deployments -> ... -> Redeploy)." -ForegroundColor Cyan
