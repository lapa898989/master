from __future__ import annotations

from datetime import datetime, timezone

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Contact, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.callbacks import BidCb, CategoryCb, OrderCb, ReviewCb, RoleCb
from app.bot.keyboards import (
    bid_action_kb,
    categories_kb,
    confirm_order_kb,
    main_menu_kb,
    order_card_kb,
    order_status_kb,
    rating_kb,
    remove_reply_kb,
    request_contact_kb,
    request_location_kb,
    role_kb,
    worker_categories_kb,
)
from app.bot.states import BidSG, ChatSG, NewOrderSG, RegistrationSG, ReviewSG, WorkerCatsSG
from app.config import settings
from app.models.enums import OrderStatus, UserRole
from app.repos.bids import BidAlreadyExists, BidsRepo
from app.repos.categories import CategoriesRepo
from app.repos.messages import MessagesRepo
from app.repos.orders import OrdersRepo
from app.repos.reviews import ReviewsRepo
from app.repos.users import UsersRepo
from app.utils.datetime_parse import parse_dt_ru
from app.utils.text import order_status_label, role_label


router = Router()


async def _get_me(session: AsyncSession, tg_user_id: int, full_name: str):
    users = UsersRepo(session)
    user = await users.create_if_missing(tg_user_id, full_name)
    return user


async def _show_menu(message: Message, user_role: UserRole | None):
    await message.answer(
        "Главное меню.",
        reply_markup=main_menu_kb(is_customer=user_role == UserRole.customer, is_worker=user_role == UserRole.worker),
    )


@router.message(Command("start"))
async def start_cmd(message: Message, state: FSMContext, session: AsyncSession):
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    if user.is_banned:
        await message.answer("Ваш аккаунт заблокирован. /support")
        return
    if not user.role:
        await state.set_state(RegistrationSG.choose_role)
        await message.answer("Выберите роль.", reply_markup=role_kb())
        return
    await state.clear()
    await _show_menu(message, user.role)


@router.message(Command("menu"))
async def menu_cmd(message: Message, session: AsyncSession):
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    await _show_menu(message, user.role)


@router.callback_query(F.data.startswith("cmd:"))
async def cmd_from_menu(cb: CallbackQuery):
    cmd = cb.data.split(":", 1)[1]
    await cb.answer()
    await cb.message.answer(f"/{cmd}")


@router.callback_query(F.data == "nav:back")
async def nav_back(cb: CallbackQuery, state: FSMContext, session: AsyncSession):
    s = await state.get_state()
    await cb.answer()
    # MVP: simple "previous step" navigation for order creation and bid flow.
    if s == NewOrderSG.enter_description.state:
        cats = await CategoriesRepo(session).list_active()
        await state.set_state(NewOrderSG.choose_category)
        await cb.message.answer("Выберите категорию.", reply_markup=categories_kb(cats))
        return
    if s == NewOrderSG.upload_photo.state:
        await state.set_state(NewOrderSG.enter_description)
        await cb.message.answer("Опишите задачу (текстом).")
        return
    if s == NewOrderSG.enter_address.state:
        await state.set_state(NewOrderSG.upload_photo)
        await cb.message.answer("Пришлите фото (опционально) или /skip.")
        return
    if s == NewOrderSG.enter_datetime.state:
        await state.set_state(NewOrderSG.enter_address)
        await cb.message.answer("Введите адрес (текстом) или отправьте геолокацию.", reply_markup=request_location_kb())
        return
    if s == NewOrderSG.enter_price.state:
        await state.set_state(NewOrderSG.enter_datetime)
        await cb.message.answer("Введите дату и время: DD.MM.YYYY HH:MM")
        return
    if s == NewOrderSG.confirm.state:
        await state.set_state(NewOrderSG.enter_price)
        await cb.message.answer("Введите цену (число).")
        return
    if s == BidSG.enter_price.state:
        await state.clear()
        await cb.message.answer("Отмена отклика. /feed")
        return
    await state.clear()
    await cb.message.answer("Назад. /menu")

@router.callback_query(RoleCb.filter())
async def choose_role(cb: CallbackQuery, callback_data: RoleCb, state: FSMContext, session: AsyncSession):
    user = await _get_me(session, cb.from_user.id, cb.from_user.full_name)
    role = UserRole.customer if callback_data.role == "customer" else UserRole.worker
    await UsersRepo(session).set_role(user.id, role)
    await state.update_data(role=role.value)
    await state.set_state(RegistrationSG.enter_phone)
    await cb.message.answer(
        "Отправьте номер телефона (кнопка ниже).",
        reply_markup=request_contact_kb(),
    )
    await cb.answer()


@router.message(RegistrationSG.enter_phone, F.contact)
async def reg_phone(message: Message, state: FSMContext, session: AsyncSession):
    c: Contact = message.contact
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    await UsersRepo(session).update_profile(user.id, phone=c.phone_number)
    await state.set_state(RegistrationSG.enter_city)
    await message.answer("Введите ваш город/район (текстом).", reply_markup=remove_reply_kb())


@router.message(RegistrationSG.enter_phone)
async def reg_phone_wrong(message: Message):
    await message.answer("Нужно отправить контакт через кнопку «Отправить номер телефона».")


@router.message(RegistrationSG.enter_city, F.text)
async def reg_city(message: Message, state: FSMContext, session: AsyncSession):
    city = message.text.strip()
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    await UsersRepo(session).update_profile(user.id, city=city)
    await state.clear()
    await _show_menu(message, user.role)


@router.message(Command("profile"))
async def profile_cmd(message: Message, session: AsyncSession):
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    if user.is_banned:
        await message.answer("Ваш аккаунт заблокирован. /support")
        return
    txt = (
        f"Профиль\n"
        f"Роль: {role_label(user.role)}\n"
        f"Имя: {user.name}\n"
        f"Телефон: {user.phone or 'не указан'}\n"
        f"Город/район: {user.city or 'не указан'}\n"
        f"Рейтинг: {user.rating:.2f} (выполнено: {user.completed_tasks})\n\n"
        f"Сменить роль можно через /start (повторный выбор)."
    )
    await message.answer(txt)


@router.message(Command("set_categories"))
async def set_categories_cmd(message: Message, state: FSMContext, session: AsyncSession):
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    if user.role != UserRole.worker:
        await message.answer("Команда доступна исполнителю. /start для смены роли.")
        return
    cats = await CategoriesRepo(session).list_active()
    selected: set[int] = set()
    if user.worker_categories:
        try:
            selected = {int(x) for x in user.worker_categories.strip(",").split(",") if x}
        except Exception:
            selected = set()
    await state.set_state(WorkerCatsSG.choose)
    await state.update_data(selected=list(selected))
    await message.answer("Выберите категории услуг (можно несколько).", reply_markup=worker_categories_kb(cats, selected))


@router.callback_query(WorkerCatsSG.choose, F.data.startswith("wcat:"))
async def worker_cat_toggle(cb: CallbackQuery, state: FSMContext, session: AsyncSession):
    action = cb.data.split(":", 1)[1]
    data = await state.get_data()
    selected = set(data.get("selected", []))
    if action == "save":
        user = await _get_me(session, cb.from_user.id, cb.from_user.full_name)
        csv = "," + ",".join(str(x) for x in sorted(selected)) + "," if selected else None
        await UsersRepo(session).set_worker_profile(user.id, categories_csv=csv)
        await state.clear()
        await cb.message.answer("Категории сохранены. /menu")
        await cb.answer()
        return
    if action == "cancel":
        await state.clear()
        await cb.message.answer("Отменено. /menu")
        await cb.answer()
        return
    try:
        cid = int(action)
    except ValueError:
        await cb.answer()
        return
    if cid in selected:
        selected.remove(cid)
    else:
        selected.add(cid)
    await state.update_data(selected=list(selected))
    cats = await CategoriesRepo(session).list_active()
    await cb.message.edit_reply_markup(reply_markup=worker_categories_kb(cats, selected))
    await cb.answer()


@router.message(Command("support"))
async def support_cmd(message: Message):
    await message.answer("Поддержка: опишите проблему одним сообщением. (MVP: канал поддержки не подключён)")


# -------- New order (customer) --------


@router.message(Command("new_order"))
async def new_order_cmd(message: Message, state: FSMContext, session: AsyncSession):
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    if user.role != UserRole.customer:
        await message.answer("Создавать заказ может только заказчик. /start для смены роли.")
        return
    count_today = await OrdersRepo(session).count_created_today(user.id)
    if count_today >= settings.limit_customer_orders_per_day:
        await message.answer(f"Лимит заказов на сегодня: {settings.limit_customer_orders_per_day}.")
        return
    cats = await CategoriesRepo(session).list_active()
    await state.clear()
    await state.set_state(NewOrderSG.choose_category)
    await message.answer("Выберите категорию.", reply_markup=categories_kb(cats))


@router.callback_query(NewOrderSG.choose_category, CategoryCb.filter())
async def new_order_category(cb: CallbackQuery, callback_data: CategoryCb, state: FSMContext, session: AsyncSession):
    cat = await CategoriesRepo(session).get(callback_data.category_id)
    if not cat:
        await cb.answer("Категория не найдена", show_alert=True)
        return
    await state.update_data(category_id=cat.id)
    await state.set_state(NewOrderSG.enter_description)
    await cb.message.answer("Опишите задачу (текстом).", reply_markup=remove_reply_kb())
    await cb.answer()


@router.message(NewOrderSG.enter_description, F.text)
async def new_order_description(message: Message, state: FSMContext):
    await state.update_data(description=message.text.strip())
    await state.set_state(NewOrderSG.upload_photo)
    await message.answer("Пришлите фото (опционально) или отправьте /skip.")


@router.message(NewOrderSG.upload_photo, Command("skip"))
async def new_order_skip_photo(message: Message, state: FSMContext):
    await state.update_data(photo_file_id=None)
    await state.set_state(NewOrderSG.enter_address)
    await message.answer("Введите адрес (текстом) или отправьте геолокацию.", reply_markup=request_location_kb())


@router.message(NewOrderSG.upload_photo, F.photo)
async def new_order_photo(message: Message, state: FSMContext):
    file_id = message.photo[-1].file_id
    await state.update_data(photo_file_id=file_id)
    await state.set_state(NewOrderSG.enter_address)
    await message.answer("Введите адрес (текстом) или отправьте геолокацию.", reply_markup=request_location_kb())


@router.message(NewOrderSG.upload_photo)
async def new_order_photo_wrong(message: Message):
    await message.answer("Пришлите фото или /skip.")


@router.message(NewOrderSG.enter_address, F.location)
async def new_order_address_location(message: Message, state: FSMContext):
    loc = message.location
    await state.update_data(address=f"{loc.latitude},{loc.longitude}", lat=loc.latitude, lon=loc.longitude)
    await state.set_state(NewOrderSG.enter_datetime)
    await message.answer("Введите дату и время: DD.MM.YYYY HH:MM", reply_markup=remove_reply_kb())


@router.message(NewOrderSG.enter_address, F.text)
async def new_order_address_text(message: Message, state: FSMContext):
    await state.update_data(address=message.text.strip(), lat=None, lon=None)
    await state.set_state(NewOrderSG.enter_datetime)
    await message.answer("Введите дату и время: DD.MM.YYYY HH:MM")


@router.message(NewOrderSG.enter_datetime, F.text)
async def new_order_datetime(message: Message, state: FSMContext):
    dt = parse_dt_ru(message.text)
    if not dt:
        await message.answer("Неверный формат. Нужно: DD.MM.YYYY HH:MM")
        return
    await state.update_data(scheduled_at=dt.isoformat())
    await state.set_state(NewOrderSG.enter_price)
    await message.answer(f"Введите цену (число), от {settings.min_price} до {settings.max_price}.")


@router.message(NewOrderSG.enter_price, F.text)
async def new_order_price(message: Message, state: FSMContext):
    try:
        price = int(message.text.strip())
    except ValueError:
        await message.answer("Цена должна быть числом.")
        return
    if price < settings.min_price or price > settings.max_price:
        await message.answer(f"Цена должна быть в диапазоне {settings.min_price}..{settings.max_price}.")
        return
    await state.update_data(price=price)
    data = await state.get_data()
    await state.set_state(NewOrderSG.confirm)
    preview = (
        "Проверьте заказ:\n"
        f"- Категория: #{data.get('category_id')}\n"
        f"- Описание: {data.get('description')}\n"
        f"- Адрес: {data.get('address')}\n"
        f"- Время: {data.get('scheduled_at')}\n"
        f"- Цена: {price} {settings.default_currency}\n"
    )
    await message.answer(preview, reply_markup=confirm_order_kb())


@router.callback_query(NewOrderSG.confirm, F.data == "order:cancel")
async def new_order_cancel(cb: CallbackQuery, state: FSMContext):
    await state.clear()
    await cb.message.answer("Создание заказа отменено. /menu")
    await cb.answer()


@router.callback_query(NewOrderSG.confirm, F.data == "order:confirm")
async def new_order_confirm(cb: CallbackQuery, state: FSMContext, session: AsyncSession):
    user = await _get_me(session, cb.from_user.id, cb.from_user.full_name)
    data = await state.get_data()
    scheduled_at = datetime.fromisoformat(data["scheduled_at"]) if data.get("scheduled_at") else None
    order = await OrdersRepo(session).create(
        customer_id=user.id,
        category_id=int(data["category_id"]),
        description=str(data["description"]),
        photo_file_id=data.get("photo_file_id"),
        address=str(data["address"]),
        lat=data.get("lat"),
        lon=data.get("lon"),
        scheduled_at=scheduled_at,
        price=int(data["price"]),
        currency=settings.default_currency,
    )
    await state.clear()
    await cb.message.answer(f"Заказ опубликован. ID: {order.id}", reply_markup=remove_reply_kb())
    await cb.answer()

    # notify workers (MVP: same city + same category)
    city = user.city if settings.same_city_only else None
    workers = await UsersRepo(session).list_workers_for_city_and_category(city=city, category_id=order.category_id)
    for w in workers:
        try:
            await cb.bot.send_message(
                w.tg_id,
                f"Новый заказ #{order.id}\nЦена: {order.price} {order.currency}\nАдрес: {order.address}\nОписание: {order.description[:500]}",
                reply_markup=order_card_kb(order.id, for_worker=True, for_customer=False),
            )
        except Exception:
            # ignore send errors for MVP
            pass


# -------- Customer orders --------


@router.message(Command("my_orders"))
async def my_orders_cmd(message: Message, session: AsyncSession):
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    if user.role != UserRole.customer:
        await message.answer("Команда доступна заказчику. /start для смены роли.")
        return
    orders = await OrdersRepo(session).list_by_customer(user.id)
    if not orders:
        await message.answer("У вас пока нет заказов. /new_order")
        return
    for o in orders[:10]:
        await message.answer(
            f"Заказ #{o.id}\nСтатус: {order_status_label(o.status)}\nЦена: {o.price} {o.currency}\nАдрес: {o.address}\nОписание: {o.description[:500]}",
            reply_markup=order_card_kb(o.id, for_worker=False, for_customer=True),
        )


@router.callback_query(OrderCb.filter(F.action == "bids"))
async def view_bids(cb: CallbackQuery, callback_data: OrderCb, session: AsyncSession):
    order = await OrdersRepo(session).get(callback_data.order_id)
    if not order:
        await cb.answer("Заказ не найден", show_alert=True)
        return
    bids = await BidsRepo(session).list_for_order(order.id)
    if not bids:
        await cb.message.answer("Откликов пока нет.")
        await cb.answer()
        return
    # For MVP show as messages with choose buttons
    for b in bids[:20]:
        await cb.message.answer(
            f"Отклик\nИсполнитель ID: {b.worker_id}\nЦена: {b.proposed_price} {b.currency}\nКомментарий: {b.message or '-'}\nСтатус: {b.status.value}",
            reply_markup=None,
        )
        await cb.message.answer(f"Выбрать исполнителя {b.worker_id} для заказа #{order.id}: /choose_{order.id}_{b.worker_id}")
    await cb.answer()


@router.callback_query(OrderCb.filter(F.action == "status"))
async def show_status_menu(cb: CallbackQuery, callback_data: OrderCb, session: AsyncSession):
    user = await _get_me(session, cb.from_user.id, cb.from_user.full_name)
    order = await OrdersRepo(session).get(callback_data.order_id)
    if not order:
        await cb.answer("Заказ не найден", show_alert=True)
        return
    is_customer = user.id == order.customer_id
    is_worker = user.id == order.selected_worker_id
    can_start = is_worker and order.status == OrderStatus.worker_selected
    can_finish = (is_worker or is_customer) and order.status in [OrderStatus.worker_selected, OrderStatus.in_progress]
    can_confirm = (is_worker or is_customer) and order.status in [OrderStatus.finished, OrderStatus.paid, OrderStatus.in_progress]
    await cb.message.answer(
        f"Заказ #{order.id}\nТекущий статус: {order_status_label(order.status)}",
        reply_markup=order_status_kb(order.id, can_start=can_start, can_finish=can_finish, can_confirm=can_confirm),
    )
    await cb.answer()

@router.message(F.text.regexp(r"^/choose_(\d+)_(\d+)$"))
async def choose_worker_cmd(message: Message, session: AsyncSession):
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    if user.role != UserRole.customer:
        return
    parts = message.text.split("_")
    order_id = int(parts[1])
    worker_id = int(parts[2])
    order = await OrdersRepo(session).get(order_id)
    if not order or order.customer_id != user.id:
        await message.answer("Заказ не найден.")
        return
    if order.status != OrderStatus.active:
        await message.answer(f"Нельзя выбрать исполнителя в статусе {order_status_label(order.status)}.")
        return
    await OrdersRepo(session).set_selected_worker(order_id, worker_id)
    await BidsRepo(session).accept_for_order(order_id, worker_id)

    # send contacts + chat access
    from app.models.user import User as UserModel

    worker = await session.get(UserModel, worker_id)
    if worker:
        await message.answer(
            f"Исполнитель выбран.\nТелефон исполнителя: {worker.phone or 'не указан'}\n"
            f"Чат доступен в кнопке «Чат» у заказа."
        )
        try:
            await message.bot.send_message(
                worker.tg_id,
                f"Вас выбрали исполнителем по заказу #{order_id}.\nТелефон заказчика: {user.phone or 'не указан'}\n"
                f"Перейдите в чат через /feed → заказ #{order_id} → «Чат».",
            )
        except Exception:
            pass
    else:
        await message.answer("Исполнитель не найден (в БД).")


# -------- Worker feed & bids --------


@router.message(Command("feed"))
async def feed_cmd(message: Message, session: AsyncSession):
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    if user.role != UserRole.worker:
        await message.answer("Команда доступна исполнителю. /start для смены роли.")
        return
    # MVP: if categories set - filter, else show all
    category_ids: list[int] | None = None
    if user.worker_categories:
        try:
            category_ids = [int(x) for x in user.worker_categories.strip(",").split(",") if x]
        except Exception:
            category_ids = None
    orders = await OrdersRepo(session).list_active_for_feed(category_ids=category_ids)
    if not orders:
        await message.answer("Пока нет доступных заказов.")
        return
    for o in orders[:10]:
        await message.answer(
            f"Заказ #{o.id}\nЦена: {o.price} {o.currency}\nАдрес: {o.address}\nОписание: {o.description[:500]}",
            reply_markup=order_card_kb(o.id, for_worker=True, for_customer=False),
        )


@router.callback_query(BidCb.filter(F.action == "start"))
async def bid_start(cb: CallbackQuery, callback_data: BidCb, session: AsyncSession):
    order = await OrdersRepo(session).get(callback_data.order_id)
    if not order or order.status != OrderStatus.active:
        await cb.answer("Заказ недоступен", show_alert=True)
        return
    await cb.message.answer("Как откликаемся?", reply_markup=bid_action_kb(order.id, order.price, order.currency))
    await cb.answer()


@router.callback_query(BidCb.filter(F.action == "accept"))
async def bid_accept(cb: CallbackQuery, callback_data: BidCb, session: AsyncSession):
    user = await _get_me(session, cb.from_user.id, cb.from_user.full_name)
    if user.role != UserRole.worker:
        await cb.answer("Только для исполнителя", show_alert=True)
        return
    count_today = await BidsRepo(session).count_created_today(user.id)
    if count_today >= settings.limit_worker_bids_per_day:
        await cb.message.answer(f"Лимит откликов на сегодня: {settings.limit_worker_bids_per_day}.")
        await cb.answer()
        return
    order = await OrdersRepo(session).get(callback_data.order_id)
    if not order or order.status != OrderStatus.active:
        await cb.answer("Заказ недоступен", show_alert=True)
        return
    try:
        await BidsRepo(session).create(
            order_id=order.id,
            worker_id=user.id,
            proposed_price=order.price,
            currency=order.currency,
            message=None,
        )
    except BidAlreadyExists:
        await cb.message.answer("Вы уже откликались на этот заказ.")
        await cb.answer()
        return
    await cb.message.answer("Отклик отправлен.")
    await cb.answer()
    # notify customer
    try:
        from app.models.user import User as UserModel

        customer = await session.get(UserModel, order.customer_id)
        if customer:
            await cb.bot.send_message(
                customer.tg_id,
                f"Новый отклик на заказ #{order.id}\nИсполнитель: {user.name}\nРейтинг: {user.rating:.2f}\nЦена: {order.price} {order.currency}",
            )
    except Exception:
        pass


@router.callback_query(BidCb.filter(F.action == "propose"))
async def bid_propose(cb: CallbackQuery, callback_data: BidCb, state: FSMContext, session: AsyncSession):
    user = await _get_me(session, cb.from_user.id, cb.from_user.full_name)
    if user.role != UserRole.worker:
        await cb.answer("Только для исполнителя", show_alert=True)
        return
    order = await OrdersRepo(session).get(callback_data.order_id)
    if not order or order.status != OrderStatus.active:
        await cb.answer("Заказ недоступен", show_alert=True)
        return
    await state.clear()
    await state.update_data(order_id=order.id)
    await state.set_state(BidSG.enter_price)
    await cb.message.answer("Введите вашу цену (число).")
    await cb.answer()


@router.message(BidSG.enter_price, F.text)
async def bid_enter_price(message: Message, state: FSMContext):
    try:
        price = int(message.text.strip())
    except ValueError:
        await message.answer("Цена должна быть числом.")
        return
    if price < settings.min_price or price > settings.max_price:
        await message.answer(f"Цена должна быть в диапазоне {settings.min_price}..{settings.max_price}.")
        return
    await state.update_data(proposed_price=price)
    await state.set_state(BidSG.enter_message)
    await message.answer("Комментарий (опционально). Отправьте /skip чтобы пропустить.")


@router.message(BidSG.enter_message, Command("skip"))
async def bid_skip_message(message: Message, state: FSMContext, session: AsyncSession):
    await _finalize_bid(message, state, session, message_text=None)


@router.message(BidSG.enter_message, F.text)
async def bid_enter_message(message: Message, state: FSMContext, session: AsyncSession):
    await _finalize_bid(message, state, session, message_text=message.text.strip())


async def _finalize_bid(message: Message, state: FSMContext, session: AsyncSession, message_text: str | None):
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    data = await state.get_data()
    order_id = int(data["order_id"])
    proposed_price = int(data["proposed_price"])
    count_today = await BidsRepo(session).count_created_today(user.id)
    if count_today >= settings.limit_worker_bids_per_day:
        await message.answer(f"Лимит откликов на сегодня: {settings.limit_worker_bids_per_day}.")
        await state.clear()
        return
    order = await OrdersRepo(session).get(order_id)
    if not order or order.status != OrderStatus.active:
        await message.answer("Заказ недоступен.")
        await state.clear()
        return
    try:
        await BidsRepo(session).create(
            order_id=order.id,
            worker_id=user.id,
            proposed_price=proposed_price,
            currency=order.currency,
            message=message_text,
        )
    except BidAlreadyExists:
        await message.answer("Вы уже откликались на этот заказ.")
        await state.clear()
        return
    await message.answer("Отклик отправлен.")
    await state.clear()
    try:
        from app.models.user import User as UserModel

        customer = await session.get(UserModel, order.customer_id)
        if customer:
            await message.bot.send_message(
                customer.tg_id,
                f"Новый отклик на заказ #{order.id}\nИсполнитель: {user.name}\nРейтинг: {user.rating:.2f}\nЦена: {proposed_price} {order.currency}\nКомментарий: {message_text or '-'}",
            )
    except Exception:
        pass


# -------- Chat relay (MVP) --------


@router.callback_query(OrderCb.filter(F.action == "chat"))
async def open_chat(cb: CallbackQuery, callback_data: OrderCb, state: FSMContext, session: AsyncSession):
    user = await _get_me(session, cb.from_user.id, cb.from_user.full_name)
    order = await OrdersRepo(session).get(callback_data.order_id)
    if not order:
        await cb.answer("Заказ не найден", show_alert=True)
        return
    if user.id not in [order.customer_id, order.selected_worker_id]:
        await cb.answer("Чат недоступен", show_alert=True)
        return
    if order.status not in [OrderStatus.worker_selected, OrderStatus.in_progress, OrderStatus.finished, OrderStatus.paid, OrderStatus.completed]:
        await cb.answer("Чат пока недоступен", show_alert=True)
        return
    await state.set_state(ChatSG.active)
    await state.update_data(order_id=order.id)
    await cb.message.answer(f"Чат по заказу #{order.id}. Пишите сообщения (текст/фото). Для выхода: /menu")
    await cb.answer()


@router.message(ChatSG.active, F.text)
async def chat_text(message: Message, state: FSMContext, session: AsyncSession):
    await _relay_chat(message, state, session, text=message.text, photo_file_id=None)


@router.message(ChatSG.active, F.photo)
async def chat_photo(message: Message, state: FSMContext, session: AsyncSession):
    await _relay_chat(message, state, session, text=message.caption, photo_file_id=message.photo[-1].file_id)


async def _relay_chat(message: Message, state: FSMContext, session: AsyncSession, *, text: str | None, photo_file_id: str | None):
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    data = await state.get_data()
    order_id = int(data["order_id"])
    order = await OrdersRepo(session).get(order_id)
    if not order:
        await message.answer("Заказ не найден.")
        await state.clear()
        return
    if user.id == order.customer_id:
        other_id = order.selected_worker_id
    else:
        other_id = order.customer_id
    if not other_id:
        await message.answer("Вторая сторона ещё не выбрана.")
        return
    from app.models.user import User as UserModel

    other = await session.get(UserModel, other_id)
    if not other:
        await message.answer("Пользователь не найден.")
        return
    await MessagesRepo(session).create(order_id=order_id, sender_id=user.id, text=text, photo_file_id=photo_file_id)
    try:
        if photo_file_id:
            await message.bot.send_photo(other.tg_id, photo=photo_file_id, caption=text or f"Сообщение по заказу #{order_id}")
        else:
            await message.bot.send_message(other.tg_id, f"[Заказ #{order_id}] {text}")
    except Exception:
        await message.answer("Не удалось доставить сообщение.")


# -------- Status / completion / reviews --------


@router.callback_query(OrderCb.filter(F.action.in_({"start_work", "finish_work", "confirm_done", "paid"})))
async def order_status_actions(cb: CallbackQuery, callback_data: OrderCb, session: AsyncSession):
    user = await _get_me(session, cb.from_user.id, cb.from_user.full_name)
    order = await OrdersRepo(session).get(callback_data.order_id)
    if not order:
        await cb.answer("Заказ не найден", show_alert=True)
        return
    is_customer = user.id == order.customer_id
    is_worker = user.id == order.selected_worker_id
    if not (is_customer or is_worker):
        await cb.answer("Недоступно", show_alert=True)
        return

    orders = OrdersRepo(session)
    if callback_data.action == "start_work" and is_worker and order.status == OrderStatus.worker_selected:
        await orders.set_status(order.id, OrderStatus.in_progress)
        await cb.message.answer("Статус: работа начата.")
    elif callback_data.action == "finish_work":
        if is_worker:
            await orders.mark_finished_by_worker(order.id)
        if is_customer:
            await orders.mark_finished_by_customer(order.id)
        # first finish -> FINISHED
        if order.status in [OrderStatus.worker_selected, OrderStatus.in_progress]:
            await orders.set_status(order.id, OrderStatus.finished)
        await cb.message.answer("Отметка о завершении принята. Дождитесь подтверждения второй стороны.")
    elif callback_data.action == "paid" and is_customer:
        if order.status in [OrderStatus.finished, OrderStatus.in_progress, OrderStatus.worker_selected]:
            await orders.set_status(order.id, OrderStatus.paid)
            await cb.message.answer("Отмечено как оплачено.")
    elif callback_data.action == "confirm_done":
        if is_worker:
            await orders.mark_finished_by_worker(order.id)
        if is_customer:
            await orders.mark_finished_by_customer(order.id)
        # if both confirmed -> completed now
        updated = await orders.get(order.id)
        if updated and updated.customer_finished_at and updated.worker_finished_at:
            await orders.set_status(order.id, OrderStatus.completed)
            await cb.message.answer("Заказ завершён. Сейчас запросим отзывы у обеих сторон.")
            await _ask_reviews(cb, session, updated)
        else:
            await cb.message.answer("Подтверждение принято. Ждём вторую сторону (или авто-завершение через 24ч).")
    else:
        await cb.answer("Действие недоступно в текущем статусе", show_alert=True)
        return
    await cb.answer()


async def _ask_reviews(cb: CallbackQuery, session: AsyncSession, order):
    from app.models.user import User as UserModel

    customer = await session.get(UserModel, order.customer_id)
    worker = await session.get(UserModel, order.selected_worker_id) if order.selected_worker_id else None
    if not (customer and worker):
        return
    try:
        await cb.bot.send_message(
            customer.tg_id,
            f"Оцените исполнителя по заказу #{order.id} (1-5).",
            reply_markup=rating_kb(order.id, worker.id),
        )
    except Exception:
        pass
    try:
        await cb.bot.send_message(
            worker.tg_id,
            f"Оцените заказчика по заказу #{order.id} (1-5).",
            reply_markup=rating_kb(order.id, customer.id),
        )
    except Exception:
        pass


@router.callback_query(ReviewCb.filter())
async def review_rating(cb: CallbackQuery, callback_data: ReviewCb, state: FSMContext):
    await state.set_state(ReviewSG.enter_comment)
    await state.update_data(
        order_id=callback_data.order_id,
        to_user_id=callback_data.to_user_id,
        rating=callback_data.rating,
    )
    await cb.message.answer("Комментарий (опционально). Отправьте /skip чтобы пропустить.")
    await cb.answer()


@router.message(ReviewSG.enter_comment, Command("skip"))
async def review_skip(message: Message, state: FSMContext, session: AsyncSession):
    await _finalize_review(message, state, session, comment=None)


@router.message(ReviewSG.enter_comment, F.text)
async def review_comment(message: Message, state: FSMContext, session: AsyncSession):
    await _finalize_review(message, state, session, comment=message.text.strip())


async def _finalize_review(message: Message, state: FSMContext, session: AsyncSession, comment: str | None):
    user = await _get_me(session, message.from_user.id, message.from_user.full_name)
    data = await state.get_data()
    order_id = int(data["order_id"])
    to_user_id = int(data["to_user_id"])
    rating = int(data["rating"])
    await ReviewsRepo(session).create(order_id=order_id, from_user_id=user.id, to_user_id=to_user_id, rating=rating, comment=comment)
    avg = await ReviewsRepo(session).avg_rating_for_user(to_user_id)
    from app.models.user import User as UserModel

    to_user = await session.get(UserModel, to_user_id)
    add_completed = 1 if (to_user and to_user.role == UserRole.worker) else 0
    await UsersRepo(session).update_rating_and_completed(to_user_id, rating=avg, add_completed=add_completed)
    await message.answer("Спасибо! Отзыв сохранён. /menu")
    await state.clear()

