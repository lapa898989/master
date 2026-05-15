from __future__ import annotations

from dataclasses import dataclass
from os import getenv

from dotenv import load_dotenv


def _getenv_required(name: str) -> str:
    v = getenv(name)
    if not v:
        raise RuntimeError(f"Missing required env var: {name}")
    return v


def _getenv_int(name: str, default: int) -> int:
    v = getenv(name)
    if v is None or v == "":
        return default
    return int(v)


def _getenv_str(name: str, default: str) -> str:
    v = getenv(name)
    if v is None or v == "":
        return default
    return v


def _getenv_int_list(name: str) -> list[int]:
    v = getenv(name, "")
    parts = [p.strip() for p in v.split(",") if p.strip()]
    out: list[int] = []
    for p in parts:
        out.append(int(p))
    return out


@dataclass(frozen=True)
class Config:
    bot_token: str
    admin_ids: set[int]
    tz: str
    business_name: str
    service_name: str

    service_duration_min: int
    slot_step_min: int
    days_ahead: int

    payment_provider_token: str | None
    deposit_amount_rub: int


def load_config() -> Config:
    load_dotenv()

    token = _getenv_required("BOT_TOKEN")
    admin_ids = set(_getenv_int_list("ADMIN_IDS"))
    tz = _getenv_str("TZ", "Europe/Moscow")

    business_name = _getenv_str("BUSINESS_NAME", "My Studio")
    service_name = _getenv_str("SERVICE_NAME", "Услуга")

    service_duration_min = _getenv_int("SERVICE_DURATION_MIN", 60)
    slot_step_min = _getenv_int("SLOT_STEP_MIN", 30)
    days_ahead = _getenv_int("DAYS_AHEAD", 14)

    payment_provider_token = getenv("PAYMENT_PROVIDER_TOKEN") or None
    deposit_amount_rub = _getenv_int("DEPOSIT_AMOUNT_RUB", 0)

    return Config(
        bot_token=token,
        admin_ids=admin_ids,
        tz=tz,
        business_name=business_name,
        service_name=service_name,
        service_duration_min=service_duration_min,
        slot_step_min=slot_step_min,
        days_ahead=days_ahead,
        payment_provider_token=payment_provider_token,
        deposit_amount_rub=deposit_amount_rub,
    )

