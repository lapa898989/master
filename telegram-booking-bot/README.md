# Telegram Booking Bot (MVP)

MVP-бот для записи клиентов на услуги:

- выбор даты и времени
- подтверждение записи
- отмена записи
- админ-настройки графика (рабочие часы, шаг слота, длительность услуги)
- хранение в SQLite (`data.sqlite3`)
- опционально: предоплата через Telegram Payments (если задан `PAYMENT_PROVIDER_TOKEN`)

## Быстрый старт (Windows / PowerShell)

1) Установи Python 3.11+.

2) Создай виртуальное окружение и поставь зависимости:

```powershell
cd "telegram-booking-bot"
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

3) Создай `.env` из примера и заполни `BOT_TOKEN`:

```powershell
copy .env.example .env
notepad .env
```

4) Запусти:

```powershell
python -m bot
```

## Админ

- Назначь свой Telegram ID в `.env` как `ADMIN_IDS` (через запятую).
- Команды:
  - `/admin` — админ-меню
  - `/set_hours` — рабочие часы (по дням недели)
  - `/set_duration` — длительность услуги (мин)
  - `/set_step` — шаг слота (мин)
  - `/bookings` — список записей

## Оплата (опционально)

Если установить `PAYMENT_PROVIDER_TOKEN`, бот будет предлагать оплату депозита через инвойс.
Если токен не задан — запись подтверждается без оплаты.

