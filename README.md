# ServiceInDriver — Telegram bot (MVP)

Telegram-бот срочных услуг по модели InDriver: заказчик публикует задачу со своей ценой, исполнители откликаются (могут предложить свою цену), заказчик выбирает исполнителя, далее чат в боте, статусы выполнения и взаимные отзывы.

## Стек

- Python 3.11+
- `aiogram 3.x` (long polling для MVP)
- PostgreSQL + SQLAlchemy (async) + Alembic
- Redis (FSM storage + кеш)
- FastAPI (минимальная web-админка)

## Быстрый старт (Docker)

1) Создайте `.env` по примеру:

```bash
copy .env.example .env
```

2) Запустите инфраструктуру и приложение:

```bash
docker compose up --build
```

Бот стартует в long polling и начнёт отвечать на `/start`.

## Локальный запуск без Docker (опционально)

1) Установите зависимости:

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

2) Поднимите Postgres+Redis (например, через `docker compose up db redis -d`).

3) Примените миграции:

```bash
alembic upgrade head
```

4) Запустите бот:

```bash
python -m app
```

## Команды (MVP)

- `/start` — регистрация/выбор роли
- `/menu` — главное меню
- `/new_order` — создать заказ (заказчик)
- `/my_orders` — мои заказы (заказчик)
- `/feed` — лента заказов (исполнитель)
- `/profile` — профиль
- `/set_categories` — категории исполнителя
- `/support` — поддержка

## Админка

Админка доступна на `http://localhost:8000/admin` (логин/пароль из `.env`).

# ServiceDrive MVP

MVP маркетплейса услуг (электрик, сантехник, ремонт и т.д.) по модели inDrive:

- клиент публикует заявку;
- мастера отправляют предложения с ценой;
- клиент выбирает исполнителя.

## Стек

- Next.js (App Router)
- Supabase (PostgreSQL, Auth, Realtime, RLS)
- Tailwind CSS

## Быстрый старт

### Вариант A — всё локально (Docker + Supabase CLI)

1. Установите [Docker Desktop](https://www.docker.com/) и Node.js 18+.
2. `npm install`
3. `copy .env.local.example .env.local` (Windows) или `cp .env.local.example .env.local`
4. `npx supabase start` — поднимет Postgres, Auth, Realtime; миграции из `supabase/migrations/` применятся сами.
5. `npm run dev` → [http://localhost:3000](http://localhost:3000)

Подробности: [docs/LOCAL-SERVER.md](docs/LOCAL-SERVER.md). На Windows можно выполнить `.\scripts\start-local.ps1`.

### Вариант B — облачный Supabase

1. Установите зависимости: `npm install`
2. Создайте `.env.local` с `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` из проекта Supabase.
3. В Supabase SQL Editor выполните:
   - `supabase/schema.sql`
   - `supabase/policies.sql`
4. Запустите проект: `npm run dev`

### Деплой на Vercel

Краткая инструкция: [docs/VERCEL.md](docs/VERCEL.md) — импорт из Git, переменные окружения, настройка redirect URL в Supabase Auth.

### GitHub

Локальный репозиторий и скрипты выгрузки: [docs/GITHUB.md](docs/GITHUB.md) (`scripts/init-git-repo.ps1`, `scripts/push-to-github.ps1`).

## Роли

- `client`: создает заявки, выбирает мастера из откликов.
- `master`: просматривает открытые заявки и отправляет цену.
- `admin`: модерация пользователей и заявок.

## Основные маршруты

- `/auth/register`, `/auth/login`
- `/client/requests`, `/client/requests/new`, `/client/requests/[id]`
- `/master/requests`, `/master/offers`
- `/chat/[requestId]`
- `/admin`

## Realtime

На странице заявки клиента используется подписка Supabase Realtime на таблицу `offers` — новые/обновленные отклики подтягиваются без ручного обновления страницы.
Для чата используется подписка на таблицу `request_messages`.

## Важно по регистрации

`schema.sql` создает триггер `on_auth_user_created`, который автоматически создает запись в `profiles` из `auth.users`. Это нужно для стабильной работы ролей и guards сразу после регистрации.

## Что добавлено в v1.1

- Фото в заявке: можно добавить до 5 URL на изображение при создании заявки.
- Фильтрация для мастера: список заявок фильтруется по категории.
- Чат клиент-мастер: доступен после назначения исполнителя.

