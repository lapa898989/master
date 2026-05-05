from __future__ import annotations

from aiogram.fsm.state import State, StatesGroup


class RegistrationSG(StatesGroup):
    choose_role = State()
    enter_phone = State()
    enter_city = State()


class NewOrderSG(StatesGroup):
    choose_category = State()
    enter_description = State()
    upload_photo = State()
    enter_address = State()
    enter_datetime = State()
    enter_price = State()
    confirm = State()


class BidSG(StatesGroup):
    enter_price = State()
    enter_message = State()


class ChatSG(StatesGroup):
    active = State()


class ReviewSG(StatesGroup):
    enter_comment = State()


class WorkerCatsSG(StatesGroup):
    choose = State()

