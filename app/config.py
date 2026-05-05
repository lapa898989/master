from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    bot_token: str
    database_url: str
    redis_url: str

    admin_username: str = "admin"
    admin_password: str = "admin123"

    sentry_dsn: str | None = None
    bot_long_polling: bool = True

    limit_customer_orders_per_day: int = 10
    limit_worker_bids_per_day: int = 30

    default_currency: str = "RUB"
    min_price: int = 100
    max_price: int = 500_000

    same_city_only: bool = True


settings = Settings()

