from __future__ import annotations

from datetime import datetime, timezone


def parse_dt_ru(text: str) -> datetime | None:
    """
    MVP parser: expects 'DD.MM.YYYY HH:MM' in local time; stored as UTC naive-ish.
    For MVP we treat input as UTC to avoid tz complexity.
    """
    text = text.strip()
    try:
        dt = datetime.strptime(text, "%d.%m.%Y %H:%M")
    except ValueError:
        return None
    return dt.replace(tzinfo=timezone.utc)

