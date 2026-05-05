from __future__ import annotations

from aiogram.filters.callback_data import CallbackData


class RoleCb(CallbackData, prefix="role"):
    role: str


class CategoryCb(CallbackData, prefix="cat"):
    category_id: int


class OrderCb(CallbackData, prefix="order"):
    order_id: int
    action: str


class BidCb(CallbackData, prefix="bid"):
    order_id: int
    action: str


class ReviewCb(CallbackData, prefix="rev"):
    order_id: int
    to_user_id: int
    rating: int

