from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class WorkingHours:
    weekday: int  # 0=Mon .. 6=Sun
    start_hhmm: str | None  # None => off day
    end_hhmm: str | None


class Db:
    def __init__(self, path: str) -> None:
        self.path = path
        self._conn = sqlite3.connect(self.path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA foreign_keys = ON;")
        self._init_schema()

    def close(self) -> None:
        self._conn.close()

    def _init_schema(self) -> None:
        cur = self._conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS working_hours (
              weekday INTEGER PRIMARY KEY, -- 0..6
              start_hhmm TEXT,
              end_hhmm TEXT
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS bookings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              username TEXT,
              full_name TEXT,
              phone TEXT,
              start_at TEXT NOT NULL, -- ISO datetime
              end_at TEXT NOT NULL,   -- ISO datetime
              status TEXT NOT NULL,   -- confirmed|cancelled
              paid INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL
            );
            """
        )
        self._conn.commit()

        # defaults
        for wd in range(7):
            cur.execute("INSERT OR IGNORE INTO working_hours(weekday) VALUES (?)", (wd,))
        self._conn.commit()

        # default hours: Mon-Sat 10-19, Sun off
        for wd in range(6):
            row = cur.execute("SELECT start_hhmm, end_hhmm FROM working_hours WHERE weekday=?", (wd,)).fetchone()
            if (row["start_hhmm"], row["end_hhmm"]) == (None, None):
                cur.execute(
                    "UPDATE working_hours SET start_hhmm=?, end_hhmm=? WHERE weekday=?",
                    ("10:00", "19:00", wd),
                )
        # Sunday stays off by default
        self._conn.commit()

    def get_working_hours(self, weekday: int) -> WorkingHours:
        row = self._conn.execute(
            "SELECT weekday, start_hhmm, end_hhmm FROM working_hours WHERE weekday=?",
            (weekday,),
        ).fetchone()
        if not row:
            return WorkingHours(weekday=weekday, start_hhmm=None, end_hhmm=None)
        return WorkingHours(weekday=row["weekday"], start_hhmm=row["start_hhmm"], end_hhmm=row["end_hhmm"])

    def set_working_hours(self, weekday: int, start_hhmm: str | None, end_hhmm: str | None) -> None:
        self._conn.execute(
            "UPDATE working_hours SET start_hhmm=?, end_hhmm=? WHERE weekday=?",
            (start_hhmm, end_hhmm, weekday),
        )
        self._conn.commit()

    def get_setting_int(self, key: str, default: int) -> int:
        row = self._conn.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
        if not row:
            return default
        try:
            return int(row["value"])
        except ValueError:
            return default

    def set_setting_int(self, key: str, value: int) -> None:
        self._conn.execute(
            "INSERT INTO settings(key, value) VALUES(?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, str(value)),
        )
        self._conn.commit()

    def create_booking(
        self,
        *,
        user_id: int,
        username: str | None,
        full_name: str | None,
        phone: str | None,
        start_at: datetime,
        end_at: datetime,
        paid: bool,
    ) -> int:
        now = datetime.utcnow().isoformat(timespec="seconds")
        cur = self._conn.execute(
            """
            INSERT INTO bookings(user_id, username, full_name, phone, start_at, end_at, status, paid, created_at)
            VALUES(?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
            """,
            (
                user_id,
                username,
                full_name,
                phone,
                start_at.isoformat(timespec="minutes"),
                end_at.isoformat(timespec="minutes"),
                1 if paid else 0,
                now,
            ),
        )
        self._conn.commit()
        return int(cur.lastrowid)

    def set_booking_paid(self, booking_id: int, paid: bool) -> None:
        self._conn.execute("UPDATE bookings SET paid=? WHERE id=?", (1 if paid else 0, booking_id))
        self._conn.commit()

    def cancel_booking(self, booking_id: int, user_id: int | None = None) -> bool:
        if user_id is None:
            cur = self._conn.execute("UPDATE bookings SET status='cancelled' WHERE id=? AND status='confirmed'", (booking_id,))
        else:
            cur = self._conn.execute(
                "UPDATE bookings SET status='cancelled' WHERE id=? AND user_id=? AND status='confirmed'",
                (booking_id, user_id),
            )
        self._conn.commit()
        return cur.rowcount > 0

    def get_user_upcoming_bookings(self, user_id: int, now_iso: str) -> list[sqlite3.Row]:
        return list(
            self._conn.execute(
                """
                SELECT * FROM bookings
                WHERE user_id=? AND status='confirmed' AND start_at>=?
                ORDER BY start_at ASC
                """,
                (user_id, now_iso),
            ).fetchall()
        )

    def get_all_upcoming_bookings(self, now_iso: str) -> list[sqlite3.Row]:
        return list(
            self._conn.execute(
                """
                SELECT * FROM bookings
                WHERE status='confirmed' AND start_at>=?
                ORDER BY start_at ASC
                """,
                (now_iso,),
            ).fetchall()
        )

    def has_conflict(self, start_at_iso: str, end_at_iso: str) -> bool:
        row = self._conn.execute(
            """
            SELECT 1 FROM bookings
            WHERE status='confirmed'
              AND NOT (end_at<=? OR start_at>=?)
            LIMIT 1
            """,
            (start_at_iso, end_at_iso),
        ).fetchone()
        return row is not None

