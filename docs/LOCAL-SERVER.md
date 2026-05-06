# Локальный сервер (ServiceDrive)

Веб-приложение использует **Supabase** (Postgres, Auth, Realtime). Полностью локально это поднимается через **Supabase CLI + Docker**.

## Требования

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) или Docker Engine + Compose (Linux)
- [Node.js](https://nodejs.org/) 18+ (`node`, `npm`, `npx` в PATH)

## Быстрый старт

Из корня репозитория:

```powershell
.\scripts\start-local.ps1
```

Или вручную:

```powershell
npm install
copy .env.local.example .env.local
npx supabase start
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

После первого `supabase start` миграции из `supabase/migrations/` применятся автоматически. Если меняли SQL и нужно пересоздать БД:

```powershell
npx supabase db reset
```

### Ускорение запросов (индексы)

Для облачного Supabase: если проект создан до появления файла `supabase/migrations/20250506183000_performance_indexes.sql`, откройте **SQL Editor**, вставьте содержимое этого файла и выполните один раз — добавятся индексы под ленту заявок мастера, фильтры по городу/категории и списки в админке. Локально те же индексы подтянутся при следующем `supabase db reset` или при применении миграций.

### Обновления без перезагрузки (Realtime)

Чтобы списки заявок, отклики, чат и уведомления обновлялись сами, в публикации `supabase_realtime` должны быть таблицы `requests`, `offers`, `assignments`, `request_messages` (и `notifications`, если включали уведомления). Выполните в **SQL Editor** содержимое `supabase/migrations/20250508120000_realtime_core_tables.sql` один раз (или примените все миграции по порядку).

## Полезные команды

| Команда | Назначение |
|--------|------------|
| `npx supabase status` | URL API, anon key, порты Studio |
| `npx supabase stop` | Остановить контейнеры Supabase |
| `npx supabase studio` | Открыть Studio (или порт из `status`) |

Studio по умолчанию: [http://127.0.0.1:54323](http://127.0.0.1:54323).

## Переменные окружения

Файл `.env.local` создаётся из `.env.local.example`. Стандартный локальный **anon key** совпадает с [документацией Supabase CLI](https://supabase.com/docs/guides/cli/getting-started); если `supabase status` показывает другие значения — подставьте их в `.env.local`.

## Telegram-бот (Python, опционально)

Отдельный стек из README: Postgres + Redis в `docker-compose.yml`, приложение на порту **8000**. Не смешивайте порт **5432** с базой Supabase: для бота используйте свой `DATABASE_URL` или поднимайте только сервисы `db`/`redis` и не запускайте второй Postgres на том же порту одновременно с Supabase.

## Если `supabase start` ругается на `config.toml`

Обновите CLI: `npm i -g supabase` или `npx supabase@latest start`. При необходимости выполните `npx supabase init` в другой папке, сравните сгенерированный `config.toml` с нашим и перенесите недостающие секции.
