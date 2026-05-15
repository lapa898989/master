from __future__ import annotations

from datetime import date, timedelta

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
)

from .utils import WEEKDAY_RU


def main_menu_kb(is_admin: bool) -> ReplyKeyboardMarkup:
    rows = [
        [KeyboardButton(text="📅 Записаться"), KeyboardButton(text="🗓️ Мои записи")],
        [KeyboardButton(text="❌ Отменить запись")],
    ]
    if is_admin:
        rows.append([KeyboardButton(text="⚙️ Админ")])
    return ReplyKeyboardMarkup(keyboard=rows, resize_keyboard=True, selective=True)


def dates_kb(*, today: date, days_ahead: int) -> InlineKeyboardMarkup:
    buttons: list[list[InlineKeyboardButton]] = []
    for i in range(days_ahead + 1):
        d = today + timedelta(days=i)
        wd = WEEKDAY_RU[d.weekday()]
        label = f"{wd} {d.strftime('%d.%m')}"
        buttons.append([InlineKeyboardButton(text=label, callback_data=f"date:{d.isoformat()}")])
    buttons.append([InlineKeyboardButton(text="⬅️ Назад", callback_data="back:menu")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def times_kb(*, times: list[str]) -> InlineKeyboardMarkup:
    grid: list[list[InlineKeyboardButton]] = []
    row: list[InlineKeyboardButton] = []
    for i, t in enumerate(times, start=1):
        row.append(InlineKeyboardButton(text=t, callback_data=f"time:{t}"))
        if i % 3 == 0:
            grid.append(row)
            row = []
    if row:
        grid.append(row)
    grid.append([InlineKeyboardButton(text="⬅️ Назад", callback_data="back:dates")])
    return InlineKeyboardMarkup(inline_keyboard=grid)


def confirm_kb(*, require_payment: bool) -> InlineKeyboardMarkup:
    if require_payment:
        return InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="💳 Оплатить депозит", callback_data="confirm:pay")],
                [InlineKeyboardButton(text="⬅️ Назад", callback_data="back:times")],
            ]
        )
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="✅ Подтвердить", callback_data="confirm:ok")],
            [InlineKeyboardButton(text="⬅️ Назад", callback_data="back:times")],
        ]
    )


def cancel_list_kb(items: list[tuple[int, str]]) -> InlineKeyboardMarkup:
    buttons: list[list[InlineKeyboardButton]] = []
    for booking_id, label in items:
        buttons.append([InlineKeyboardButton(text=f"❌ {label}", callback_data=f"cancel:{booking_id}")])
    buttons.append([InlineKeyboardButton(text="⬅️ Назад", callback_data="back:menu")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def admin_menu_kb() -> ReplyKeyboardMarkup:
    rows = [
        [KeyboardButton(text="🕒 Рабочие часы"), KeyboardButton(text="⏱️ Длительность")],
        [KeyboardButton(text="🔁 Шаг слота"), KeyboardButton(text="📋 Записи")],
        [KeyboardButton(text="⬅️ В меню")],
    ]
    return ReplyKeyboardMarkup(keyboard=rows, resize_keyboard=True, selective=True)


def weekdays_kb() -> InlineKeyboardMarkup:
    names = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    grid: list[list[InlineKeyboardButton]] = []
    row: list[InlineKeyboardButton] = []
    for i, n in enumerate(names, start=1):
        row.append(InlineKeyboardButton(text=n, callback_data=f"wd:{i-1}"))
        if i % 4 == 0:
            grid.append(row)
            row = []
    if row:
        grid.append(row)
    grid.append([InlineKeyboardButton(text="⬅️ Назад", callback_data="back:admin")])
    return InlineKeyboardMarkup(inline_keyboard=grid)

