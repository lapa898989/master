from __future__ import annotations

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder

from app.bot.callbacks import BidCb, CategoryCb, OrderCb, RoleCb, ReviewCb
from app.models.category import Category


def role_kb() -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    b.button(text="Я нуждаюсь в услуге", callback_data=RoleCb(role="customer").pack())
    b.button(text="Я исполнитель", callback_data=RoleCb(role="worker").pack())
    b.adjust(1)
    return b.as_markup()


def main_menu_kb(is_customer: bool, is_worker: bool) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    if is_customer:
        b.button(text="Создать заказ", callback_data="cmd:new_order")
        b.button(text="Мои заказы", callback_data="cmd:my_orders")
    if is_worker:
        b.button(text="Лента заказов", callback_data="cmd:feed")
    b.button(text="Профиль", callback_data="cmd:profile")
    b.button(text="Поддержка", callback_data="cmd:support")
    b.adjust(2, 2)
    return b.as_markup()


def categories_kb(categories: list[Category]) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    for c in categories:
        label = f"{c.icon + ' ' if c.icon else ''}{c.name}"
        b.button(text=label, callback_data=CategoryCb(category_id=c.id).pack())
    b.button(text="Назад", callback_data="nav:back")
    b.adjust(2)
    return b.as_markup()


def worker_categories_kb(categories: list[Category], selected: set[int]) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    for c in categories:
        mark = "✅ " if c.id in selected else ""
        label = f"{mark}{c.icon + ' ' if c.icon else ''}{c.name}"
        b.button(text=label, callback_data=f"wcat:{c.id}")
    b.button(text="Сохранить", callback_data="wcat:save")
    b.button(text="Отмена", callback_data="wcat:cancel")
    b.adjust(2)
    return b.as_markup()

def back_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="Назад", callback_data="nav:back")]])


def confirm_order_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Опубликовать", callback_data="order:confirm"),
                InlineKeyboardButton(text="Отмена", callback_data="order:cancel"),
            ],
            [InlineKeyboardButton(text="Назад", callback_data="nav:back")],
        ]
    )


def request_contact_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="Отправить номер телефона", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def request_location_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="Отправить геолокацию", request_location=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def remove_reply_kb() -> ReplyKeyboardRemove:
    return ReplyKeyboardRemove()


def order_card_kb(order_id: int, *, for_worker: bool, for_customer: bool) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    if for_worker:
        b.button(text="Откликнуться", callback_data=BidCb(order_id=order_id, action="start").pack())
    if for_customer:
        b.button(text="Отклики", callback_data=OrderCb(order_id=order_id, action="bids").pack())
    b.button(text="Статус", callback_data=OrderCb(order_id=order_id, action="status").pack())
    b.button(text="Чат", callback_data=OrderCb(order_id=order_id, action="chat").pack())
    b.adjust(2)
    return b.as_markup()


def bid_action_kb(order_id: int, price: int, currency: str) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    b.button(text=f"Принять цену {price} {currency}", callback_data=BidCb(order_id=order_id, action="accept").pack())
    b.button(text="Предложить свою цену", callback_data=BidCb(order_id=order_id, action="propose").pack())
    b.button(text="Назад", callback_data="nav:back")
    b.adjust(1)
    return b.as_markup()


def bids_list_kb(order_id: int, bid_items: list[tuple[int, str]]) -> InlineKeyboardMarkup:
    """
    bid_items: [(worker_id, label)]
    """
    b = InlineKeyboardBuilder()
    for worker_id, label in bid_items:
        b.button(text=label, callback_data=f"choose:{order_id}:{worker_id}")
    b.button(text="Назад", callback_data="nav:back")
    b.adjust(1)
    return b.as_markup()


def order_status_kb(order_id: int, *, can_start: bool, can_finish: bool, can_confirm: bool) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    if can_start:
        b.button(text="Работа начата", callback_data=OrderCb(order_id=order_id, action="start_work").pack())
    if can_finish:
        b.button(text="Работа завершена", callback_data=OrderCb(order_id=order_id, action="finish_work").pack())
    if can_confirm:
        b.button(text="Подтвердить завершение", callback_data=OrderCb(order_id=order_id, action="confirm_done").pack())
        b.button(text="Отметить как оплачено", callback_data=OrderCb(order_id=order_id, action="paid").pack())
    b.button(text="Назад", callback_data="nav:back")
    b.adjust(1)
    return b.as_markup()


def rating_kb(order_id: int, to_user_id: int) -> InlineKeyboardMarkup:
    b = InlineKeyboardBuilder()
    for r in range(1, 6):
        b.button(text=str(r), callback_data=ReviewCb(order_id=order_id, to_user_id=to_user_id, rating=r).pack())
    b.adjust(5)
    return b.as_markup()

