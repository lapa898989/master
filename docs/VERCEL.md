# Деплой на Vercel

## 1. Репозиторий

Залейте проект в **GitHub** (или GitLab / Bitbucket — Vercel их тоже поддерживает).

## 2. Проект в Vercel

1. Войдите на [vercel.com](https://vercel.com) и нажмите **Add New… → Project**.
2. Импортируйте репозиторий.
3. **Framework Preset**: Next.js (определится сам).
4. **Root Directory**: оставьте **пустым** (точка / корень репозитория). Не указывайте `src` — иначе Next не найдёт `src/app` и вы получите **404** на всех страницах.
5. **Environment Variables** (обязательно):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase (Settings → API → Project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key из того же раздела |

Опционально (удобно для SEO и канонических ссылок после привязки домена):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://ваш-проект.vercel.app` или кастомный домен с `https://` |

Без `NEXT_PUBLIC_SITE_URL` на Vercel используется автоматический `VERCEL_URL` (уже с `https://` в коде).

6. Нажмите **Deploy**.

Подробнее про переменные и скрипт: [VERCEL-ENV.md](./VERCEL-ENV.md).

## 3. Настройка Supabase Auth

В панели Supabase: **Authentication → URL Configuration**:

- **Site URL**: `https://ваш-проект.vercel.app` (или кастомный домен).
- **Redirect URLs**: добавьте:
  - `https://ваш-проект.vercel.app/**`
  - при кастомном домене — `https://ваш-домен.ru/**`

Иначе вход и восстановление пароля могут редиректить не туда.

## 4. Дальнейшие правки

Код правится локально (или в Cursor), коммит и push в ветку, с которой связан деплой — Vercel **пересоберёт сайт сам**. Отдельно «заливать файлы на Vercel» не нужно.

## 5. Ограничения free tier

Уточняйте актуальные лимиты на [vercel.com/pricing](https://vercel.com/pricing). Для MVP обычно достаточно.
