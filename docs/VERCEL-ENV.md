# Переменные Supabase на Vercel

Я не могу зайти в ваш аккаунт Vercel без **вашего токена**. Сделать можно так.

## Вариант A — вручную в интерфейсе

1. [Vercel](https://vercel.com) → ваш проект → **Settings** → **Environment Variables**.
2. Добавьте (или отредактируйте):

| Name | Value | Environments |
|------|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | из Supabase → **Settings → API → Project URL** | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | из Supabase → **anon public** | Production, Preview, Development |

3. **Save**, затем **Deployments** → последний деплой → **⋯** → **Redeploy** (чтобы билд подхватил переменные).

## Вариант B — скрипт (один раз у себя на ПК)

1. Токен: [vercel.com/account/tokens](https://vercel.com/account/tokens).
2. В Supabase скопируйте **Project URL** и **anon key**.

```powershell
cd "путь\к\проекту"

$env:VERCEL_TOKEN = "ваш_токен_vercel"
$env:VERCEL_PROJECT = "master"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://xxxx.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ..."

powershell -ExecutionPolicy Bypass -File .\scripts\vercel-set-supabase-env.ps1
```

Если проект в **команде (team)**, в URL команды есть идентификатор — задайте:

```powershell
$env:VERCEL_TEAM_ID = "team_xxxxxxxx"
```

Имя проекта **`VERCEL_PROJECT`** смотрите в Vercel: **Project → Settings → General → Project Name**.

После скрипта сделайте **Redeploy**.
