from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from aiogram import Bot, Dispatcher, F, Router
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.dispatcher.middlewares.base import BaseMiddleware
from aiogram.types import (
    LabeledPrice,
    Message,
    PreCheckoutQuery,
    CallbackQuery,
    KeyboardButton,
    ReplyKeyboardMarkup,
)

from .config import Config, load_config
from .db import Db
from .keyboards import (
    admin_menu_kb,
    cancel_list_kb,
    confirm_kb,
    dates_kb,
    main_menu_kb,
    times_kb,
    weekdays_kb,
)
from .utils import format_dt_local, local_now_iso, local_today, make_slots_for_day


logging.basicConfig(level=logging.INFO)


class BookingFlow(StatesGroup):
    picking_date = State()
    picking_time = State()
    asking_contact = State()
    confirming = State()


class AdminFlow(StatesGroup):
    picking_weekday = State()
    setting_hours = State()
    setting_duration = State()
    setting_step = State()


@dataclass(frozen=True)
class App:
    cfg: Config
    db: Db


router = Router()


class AppMiddleware(BaseMiddleware):
    def __init__(self, app: "App") -> None:
        super().__init__()
        self._app = app

    async def __call__(self, handler, event, data):
        data["app"] = self._app
        return await handler(event, data)


def is_admin(app: App, user_id: int) -> bool:
    return user_id in app.cfg.admin_ids


def _get_duration(app: App) -> int:
    return app.db.get_setting_int("service_duration_min", app.cfg.service_duration_min)


def _get_step(app: App) -> int:
    return app.db.get_setting_int("slot_step_min", app.cfg.slot_step_min)


def _get_days_ahead(app: App) -> int:
    return app.db.get_setting_int("days_ahead", app.cfg.days_ahead)


async def _send_menu(message: Message, app: App) -> None:
    await message.answer(
        f"🏷️ {app.cfg.business_name}\nВыбери действие:",
        reply_markup=main_menu_kb(is_admin(app, message.from_user.id)),
    )


@router.message(CommandStart())
async def start(message: Message, state: FSMContext, app: App) -> None:
    await state.clear()
    await _send_menu(message, app)


@router.message(F.text == "⬅️ В меню")
async def back_to_menu(message: Message, state: FSMContext, app: App) -> None:
    await state.clear()
    await _send_menu(message, app)


@router.message(F.text == "📅 Записаться")
async def booking_start(message: Message, state: FSMContext, app: App) -> None:
    await state.clear()
    today = local_today(app.cfg.tz)
    await state.set_state(BookingFlow.picking_date)
    await message.answer(
        f"Выбери дату для записи на: <b>{app.cfg.service_name}</b>",
        reply_markup=dates_kb(today=today, days_ahead=_get_days_ahead(app)),
        parse_mode=ParseMode.HTML,
    )


@router.callback_query(F.data == "back:menu")
async def cb_back_menu(call: CallbackQuery, state: FSMContext, app: App) -> None:
    await call.answer()
    await state.clear()
    if call.message:
        await call.message.answer(
            f"🏷️ {app.cfg.business_name}\nВыбери действие:",
            reply_markup=main_menu_kb(is_admin(app, call.from_user.id)),
        )


@router.callback_query(F.data == "back:dates")
async def cb_back_dates(call: CallbackQuery, state: FSMContext, app: App) -> None:
    await call.answer()
    today = local_today(app.cfg.tz)
    await state.set_state(BookingFlow.picking_date)
    if call.message:
        await call.message.edit_text(
            f"Выбери дату для записи на: <b>{app.cfg.service_name}</b>",
            reply_markup=dates_kb(today=today, days_ahead=_get_days_ahead(app)),
            parse_mode=ParseMode.HTML,
        )


@router.callback_query(F.data == "back:times")
async def cb_back_times(call: CallbackQuery, state: FSMContext, app: App) -> None:
    await call.answer()
    data = await state.get_data()
    picked_date_iso = data.get("picked_date")
    if not picked_date_iso:
        return await cb_back_dates(call, state, app)
    picked_date = date.fromisoformat(picked_date_iso)
    await _show_times(call, state, app, picked_date)


async def _show_times(call: CallbackQuery, state: FSMContext, app: App, picked_date: date) -> None:
    tz = app.cfg.tz
    wh = app.db.get_working_hours(picked_date.weekday())
    if not wh.start_hhmm or not wh.end_hhmm:
        await state.set_state(BookingFlow.picking_date)
        if call.message:
            await call.message.edit_text(
                "В этот день мы не работаем. Выбери другую дату.",
                reply_markup=dates_kb(today=local_today(tz), days_ahead=_get_days_ahead(app)),
            )
        return

    duration = _get_duration(app)
    step = _get_step(app)
    slots = make_slots_for_day(
        tz=tz,
        day=picked_date,
        start_hhmm=wh.start_hhmm,
        end_hhmm=wh.end_hhmm,
        duration_min=duration,
        step_min=step,
    )

    times: list[str] = []
    z = ZoneInfo(tz)
    now = datetime.now(z)
    for s, e in slots:
        if s < now:
            continue
        if app.db.has_conflict(s.isoformat(timespec="minutes"), e.isoformat(timespec="minutes")):
            continue
        times.append(s.strftime("%H:%M"))

    await state.update_data(picked_date=picked_date.isoformat(), wh_start=wh.start_hhmm, wh_end=wh.end_hhmm)
    await state.set_state(BookingFlow.picking_time)

    if not times:
        if call.message:
            await call.message.edit_text(
                "Свободных слотов на эту дату нет. Выбери другую дату.",
                reply_markup=dates_kb(today=local_today(tz), days_ahead=_get_days_ahead(app)),
            )
        await state.set_state(BookingFlow.picking_date)
        return

    if call.message:
        await call.message.edit_text(
            f"Дата: <b>{picked_date.strftime('%d.%m')}</b>\nВыбери время:",
            reply_markup=times_kb(times=times),
            parse_mode=ParseMode.HTML,
        )


@router.callback_query(F.data.startswith("date:"))
async def pick_date(call: CallbackQuery, state: FSMContext, app: App) -> None:
    await call.answer()
    iso = call.data.split(":", 1)[1]
    picked_date = date.fromisoformat(iso)
    await _show_times(call, state, app, picked_date)


@router.callback_query(F.data.startswith("time:"))
async def pick_time(call: CallbackQuery, state: FSMContext, app: App) -> None:
    await call.answer()
    t = call.data.split(":", 1)[1]
    data = await state.get_data()
    picked_date_iso = data.get("picked_date")
    if not picked_date_iso:
        return await cb_back_dates(call, state, app)

    picked_date = date.fromisoformat(picked_date_iso)
    wh_start = data.get("wh_start")
    wh_end = data.get("wh_end")
    if not wh_start or not wh_end:
        return await cb_back_dates(call, state, app)

    # build datetime from picked date + time
    tz = app.cfg.tz
    z = ZoneInfo(tz)
    hh, mm = t.split(":")
    start_at = datetime(
        year=picked_date.year,
        month=picked_date.month,
        day=picked_date.day,
        hour=int(hh),
        minute=int(mm),
        tzinfo=z,
    )
    end_at = start_at + timedelta(minutes=_get_duration(app))

    # validate: still inside working hours and free
    if app.db.has_conflict(start_at.isoformat(timespec="minutes"), end_at.isoformat(timespec="minutes")):
        if call.message:
            await call.message.answer("Этот слот уже заняли. Выбери другое время.")
        return await _show_times(call, state, app, picked_date)

    await state.update_data(start_at=start_at.isoformat(timespec="minutes"), end_at=end_at.isoformat(timespec="minutes"))
    await state.set_state(BookingFlow.asking_contact)
    if call.message:
        await call.message.answer(
            "Отправь номер телефона (можно текстом) или поделись контактом.",
            reply_markup=ReplyKeyboardMarkup(
                keyboard=[[KeyboardButton(text="📱 Поделиться контактом", request_contact=True)], [KeyboardButton(text="⬅️ В меню")]],
                resize_keyboard=True,
                selective=True,
            ),
        )


@router.message(BookingFlow.asking_contact, F.contact)
async def got_contact(message: Message, state: FSMContext, app: App) -> None:
    phone = message.contact.phone_number
    await state.update_data(phone=phone)
    await _ask_confirm(message, state, app)


@router.message(BookingFlow.asking_contact, F.text)
async def got_phone_text(message: Message, state: FSMContext, app: App) -> None:
    text = (message.text or "").strip()
    if text.lower() in {"⬅️ в меню", "/start"}:
        await state.clear()
        return await _send_menu(message, app)
    if len(text) < 7:
        return await message.answer("Похоже на слишком короткий номер. Пришли телефон ещё раз.")
    await state.update_data(phone=text)
    await _ask_confirm(message, state, app)


async def _ask_confirm(message: Message, state: FSMContext, app: App) -> None:
    data = await state.get_data()
    start_at = data.get("start_at")
    end_at = data.get("end_at")
    phone = data.get("phone")
    if not start_at or not end_at:
        await state.clear()
        return await _send_menu(message, app)

    tz = app.cfg.tz
    z = ZoneInfo(tz)
    sdt = datetime.fromisoformat(start_at).astimezone(z)
    edt = datetime.fromisoformat(end_at).astimezone(z)

    require_payment = bool(app.cfg.payment_provider_token) and app.cfg.deposit_amount_rub > 0
    pay_line = f"\n\nДепозит: <b>{app.cfg.deposit_amount_rub} ₽</b>" if require_payment else ""
    await state.set_state(BookingFlow.confirming)

    await message.answer(
        "Проверь данные:\n"
        f"- Услуга: <b>{app.cfg.service_name}</b>\n"
        f"- Время: <b>{format_dt_local(sdt)}–{edt.strftime('%H:%M')}</b>\n"
        f"- Телефон: <b>{phone}</b>"
        f"{pay_line}",
        reply_markup=confirm_kb(require_payment=require_payment),
        parse_mode=ParseMode.HTML,
    )


@router.callback_query(F.data.startswith("confirm:"))
async def confirm(call: CallbackQuery, state: FSMContext, app: App, bot: Bot) -> None:
    await call.answer()
    action = call.data.split(":", 1)[1]
    data = await state.get_data()
    start_at = data.get("start_at")
    end_at = data.get("end_at")
    phone = data.get("phone")
    if not start_at or not end_at:
        await state.clear()
        if call.message:
            return await call.message.answer("Сессия устарела. Начни заново: 📅 Записаться")
        return

    # Re-check conflict
    if app.db.has_conflict(start_at, end_at):
        await state.clear()
        if call.message:
            await call.message.answer("Слот уже заняли. Давай выберем заново.")
        return

    require_payment = bool(app.cfg.payment_provider_token) and app.cfg.deposit_amount_rub > 0
    if require_payment and action == "pay":
        prices = [LabeledPrice(label=f"Депозит {app.cfg.service_name}", amount=app.cfg.deposit_amount_rub * 100)]
        payload = f"deposit:{call.from_user.id}:{start_at}"
        await state.update_data(invoice_payload=payload)
        await bot.send_invoice(
            chat_id=call.from_user.id,
            title=f"{app.cfg.business_name} — депозит",
            description=f"Депозит за запись на {app.cfg.service_name}",
            payload=payload,
            provider_token=app.cfg.payment_provider_token,
            currency="RUB",
            prices=prices,
        )
        if call.message:
            await call.message.answer("Отправил счёт на оплату. После оплаты запись подтвердится автоматически.")
        return

    # no payment required -> create booking now
    booking_id = _finalize_booking(app=app, call=call, data=data, paid=False)
    await state.clear()
    if call.message:
        await call.message.answer(f"✅ Запись создана. Номер: #{booking_id}", reply_markup=main_menu_kb(is_admin(app, call.from_user.id)))


def _finalize_booking(*, app: App, call: CallbackQuery, data: dict, paid: bool) -> int:
    start_at = datetime.fromisoformat(data["start_at"])
    end_at = datetime.fromisoformat(data["end_at"])
    phone = data.get("phone")
    full_name = call.from_user.full_name
    username = call.from_user.username
    return app.db.create_booking(
        user_id=call.from_user.id,
        username=username,
        full_name=full_name,
        phone=phone,
        start_at=start_at,
        end_at=end_at,
        paid=paid,
    )


@router.pre_checkout_query()
async def pre_checkout(pre: PreCheckoutQuery) -> None:
    await pre.answer(ok=True)


@router.message(F.successful_payment)
async def on_successful_payment(message: Message, state: FSMContext, app: App) -> None:
    data = await state.get_data()
    payload = (data.get("invoice_payload") or message.successful_payment.invoice_payload or "").strip()

    # payload format: deposit:userId:startAtIso
    parts = payload.split(":", 2)
    if len(parts) != 3:
        await message.answer("Оплата получена ✅")
        await state.clear()
        return await _send_menu(message, app)

    _, user_id_s, start_at_iso = parts
    if str(message.from_user.id) != user_id_s:
        await message.answer("Оплата получена ✅")
        await state.clear()
        return await _send_menu(message, app)

    # create booking (paid)
    start_at = data.get("start_at") or start_at_iso
    end_at = data.get("end_at")
    if not end_at:
        # reconstruct end_at from config duration
        from datetime import timedelta

        end_at = (datetime.fromisoformat(start_at) + timedelta(minutes=_get_duration(app))).isoformat(timespec="minutes")

    if app.db.has_conflict(start_at, end_at):
        await message.answer("Оплата получена ✅ но слот уже занят. Напиши администратору — вернём деньги/перенесём.")
        await state.clear()
        return await _send_menu(message, app)

    booking_id = app.db.create_booking(
        user_id=message.from_user.id,
        username=message.from_user.username,
        full_name=message.from_user.full_name,
        phone=data.get("phone"),
        start_at=datetime.fromisoformat(start_at),
        end_at=datetime.fromisoformat(end_at),
        paid=True,
    )
    await state.clear()
    await message.answer(f"✅ Оплата прошла. Запись подтверждена. Номер: #{booking_id}", reply_markup=main_menu_kb(is_admin(app, message.from_user.id)))


@router.message(F.text == "🗓️ Мои записи")
async def my_bookings(message: Message, state: FSMContext, app: App) -> None:
    await state.clear()
    rows = app.db.get_user_upcoming_bookings(message.from_user.id, local_now_iso(app.cfg.tz))
    if not rows:
        return await message.answer("Пока нет будущих записей.", reply_markup=main_menu_kb(is_admin(app, message.from_user.id)))

    tz = ZoneInfo(app.cfg.tz)
    lines: list[str] = ["Ваши записи:"]
    for r in rows:
        sdt = datetime.fromisoformat(r["start_at"]).astimezone(tz)
        edt = datetime.fromisoformat(r["end_at"]).astimezone(tz)
        paid = "💳" if r["paid"] else "—"
        lines.append(f"- #{r['id']}: {format_dt_local(sdt)}–{edt.strftime('%H:%M')} {paid}")
    await message.answer("\n".join(lines), reply_markup=main_menu_kb(is_admin(app, message.from_user.id)))


@router.message(F.text == "❌ Отменить запись")
async def cancel_start(message: Message, state: FSMContext, app: App) -> None:
    await state.clear()
    rows = app.db.get_user_upcoming_bookings(message.from_user.id, local_now_iso(app.cfg.tz))
    if not rows:
        return await message.answer("Нечего отменять: будущих записей нет.", reply_markup=main_menu_kb(is_admin(app, message.from_user.id)))

    tz = ZoneInfo(app.cfg.tz)
    items: list[tuple[int, str]] = []
    for r in rows:
        sdt = datetime.fromisoformat(r["start_at"]).astimezone(tz)
        edt = datetime.fromisoformat(r["end_at"]).astimezone(tz)
        items.append((int(r["id"]), f"#{r['id']} {format_dt_local(sdt)}–{edt.strftime('%H:%M')}"))

    await message.answer("Выбери запись для отмены:", reply_markup=cancel_list_kb(items))


@router.callback_query(F.data.startswith("cancel:"))
async def cancel_pick(call: CallbackQuery, state: FSMContext, app: App) -> None:
    await call.answer()
    booking_id = int(call.data.split(":", 1)[1])
    ok = app.db.cancel_booking(booking_id, user_id=call.from_user.id)
    await state.clear()
    if call.message:
        await call.message.answer(
            "✅ Отменено." if ok else "Не удалось отменить (возможно уже отменено).",
            reply_markup=main_menu_kb(is_admin(app, call.from_user.id)),
        )


# -------- Admin --------


@router.message(F.text == "⚙️ Админ")
async def admin_enter(message: Message, state: FSMContext, app: App) -> None:
    if not is_admin(app, message.from_user.id):
        return await message.answer("Доступ запрещён.")
    await state.clear()
    await message.answer("Админ-меню:", reply_markup=admin_menu_kb())


@router.message(F.text == "🕒 Рабочие часы")
async def admin_hours(message: Message, state: FSMContext, app: App) -> None:
    if not is_admin(app, message.from_user.id):
        return
    await state.set_state(AdminFlow.picking_weekday)
    await message.answer("Выбери день недели:", reply_markup=weekdays_kb())


@router.callback_query(F.data.startswith("wd:"))
async def admin_pick_weekday(call: CallbackQuery, state: FSMContext, app: App) -> None:
    await call.answer()
    wd = int(call.data.split(":", 1)[1])
    await state.update_data(admin_weekday=wd)
    await state.set_state(AdminFlow.setting_hours)
    wh = app.db.get_working_hours(wd)
    cur = "выходной" if not wh.start_hhmm else f"{wh.start_hhmm}-{wh.end_hhmm}"
    text = (
        f"Текущие часы: <b>{cur}</b>\n"
        "Отправь новый график в формате <b>HH:MM-HH:MM</b> или <b>off</b>."
    )
    if call.message:
        await call.message.answer(text, parse_mode=ParseMode.HTML)


@router.message(AdminFlow.setting_hours, F.text)
async def admin_set_hours_text(message: Message, state: FSMContext, app: App) -> None:
    if not is_admin(app, message.from_user.id):
        return
    txt = (message.text or "").strip().lower()
    data = await state.get_data()
    wd = int(data.get("admin_weekday", 0))

    if txt in {"off", "выходной", "нет"}:
        app.db.set_working_hours(wd, None, None)
        await state.clear()
        return await message.answer("✅ Сохранено (выходной).", reply_markup=admin_menu_kb())

    if "-" not in txt:
        return await message.answer("Формат неверный. Пример: 10:00-19:00 или off")

    start_s, end_s = [p.strip() for p in txt.split("-", 1)]
    # minimal validation
    if ":" not in start_s or ":" not in end_s:
        return await message.answer("Формат неверный. Пример: 10:00-19:00")
    app.db.set_working_hours(wd, start_s, end_s)
    await state.clear()
    await message.answer("✅ Сохранено.", reply_markup=admin_menu_kb())


@router.message(F.text == "⏱️ Длительность")
async def admin_duration(message: Message, state: FSMContext, app: App) -> None:
    if not is_admin(app, message.from_user.id):
        return
    await state.set_state(AdminFlow.setting_duration)
    cur = _get_duration(app)
    await message.answer(f"Текущая длительность: {cur} мин.\nОтправь новое число (например 60).")


@router.message(AdminFlow.setting_duration, F.text)
async def admin_set_duration(message: Message, state: FSMContext, app: App) -> None:
    if not is_admin(app, message.from_user.id):
        return
    try:
        v = int((message.text or "").strip())
        if v < 10 or v > 480:
            raise ValueError
    except ValueError:
        return await message.answer("Нужно число минут (10..480).")
    app.db.set_setting_int("service_duration_min", v)
    await state.clear()
    await message.answer("✅ Сохранено.", reply_markup=admin_menu_kb())


@router.message(F.text == "🔁 Шаг слота")
async def admin_step(message: Message, state: FSMContext, app: App) -> None:
    if not is_admin(app, message.from_user.id):
        return
    await state.set_state(AdminFlow.setting_step)
    cur = _get_step(app)
    await message.answer(f"Текущий шаг слота: {cur} мин.\nОтправь новое число (например 30).")


@router.message(AdminFlow.setting_step, F.text)
async def admin_set_step(message: Message, state: FSMContext, app: App) -> None:
    if not is_admin(app, message.from_user.id):
        return
    try:
        v = int((message.text or "").strip())
        if v < 5 or v > 180:
            raise ValueError
    except ValueError:
        return await message.answer("Нужно число минут (5..180).")
    app.db.set_setting_int("slot_step_min", v)
    await state.clear()
    await message.answer("✅ Сохранено.", reply_markup=admin_menu_kb())


@router.message(F.text == "📋 Записи")
async def admin_bookings(message: Message, state: FSMContext, app: App) -> None:
    if not is_admin(app, message.from_user.id):
        return
    await state.clear()
    rows = app.db.get_all_upcoming_bookings(local_now_iso(app.cfg.tz))
    if not rows:
        return await message.answer("Будущих записей нет.", reply_markup=admin_menu_kb())
    tz = ZoneInfo(app.cfg.tz)
    lines = ["Будущие записи:"]
    for r in rows[:50]:
        sdt = datetime.fromisoformat(r["start_at"]).astimezone(tz)
        edt = datetime.fromisoformat(r["end_at"]).astimezone(tz)
        paid = "💳" if r["paid"] else "—"
        who = r["full_name"] or r["username"] or str(r["user_id"])
        phone = r["phone"] or ""
        lines.append(f"- #{r['id']}: {format_dt_local(sdt)}–{edt.strftime('%H:%M')} {paid} | {who} {phone}")
    await message.answer("\n".join(lines), reply_markup=admin_menu_kb())


@router.callback_query(F.data == "back:admin")
async def cb_back_admin(call: CallbackQuery, state: FSMContext, app: App) -> None:
    await call.answer()
    await state.clear()
    if call.message:
        await call.message.answer("Админ-меню:", reply_markup=admin_menu_kb())


async def main() -> None:
    cfg = load_config()
    db = Db("data.sqlite3")
    app = App(cfg=cfg, db=db)

    bot = Bot(token=cfg.bot_token, parse_mode=ParseMode.HTML)
    dp = Dispatcher()
    dp.include_router(router)

    dp.update.outer_middleware(AppMiddleware(app))

    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())


if __name__ == "__main__":
    asyncio.run(main())

