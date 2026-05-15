from __future__ import annotations

from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo


WEEKDAY_RU = {
    0: "Пн",
    1: "Вт",
    2: "Ср",
    3: "Чт",
    4: "Пт",
    5: "Сб",
    6: "Вс",
}


def parse_hhmm(s: str) -> time:
    hh, mm = s.strip().split(":")
    return time(hour=int(hh), minute=int(mm))


def format_dt_local(dt: datetime) -> str:
    return dt.strftime("%d.%m %H:%M")


def local_today(tz: str) -> date:
    z = ZoneInfo(tz)
    return datetime.now(z).date()


def local_now_iso(tz: str) -> str:
    z = ZoneInfo(tz)
    return datetime.now(z).isoformat(timespec="minutes")


def make_slots_for_day(
    *,
    tz: str,
    day: date,
    start_hhmm: str,
    end_hhmm: str,
    duration_min: int,
    step_min: int,
) -> list[tuple[datetime, datetime]]:
    z = ZoneInfo(tz)
    start_t = parse_hhmm(start_hhmm)
    end_t = parse_hhmm(end_hhmm)

    start_dt = datetime.combine(day, start_t, tzinfo=z)
    end_dt = datetime.combine(day, end_t, tzinfo=z)

    slots: list[tuple[datetime, datetime]] = []
    cursor = start_dt
    duration = timedelta(minutes=duration_min)
    step = timedelta(minutes=step_min)

    while cursor + duration <= end_dt:
        slots.append((cursor, cursor + duration))
        cursor = cursor + step

    return slots

