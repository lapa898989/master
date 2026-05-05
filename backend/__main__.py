from __future__ import annotations

import asyncio

import sentry_sdk
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.redis import RedisStorage
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from backend.bot.handlers import router as bot_router
from backend.bot.middlewares import DbSessionMiddleware
from backend.config import settings
from backend.db import SessionLocal
from backend.logging import log, setup_logging
from backend.models.enums import OrderStatus
from backend.models.order import Order
from backend.services.bootstrap import ensure_categories
from backend.web.app import create_app


async def _bootstrap() -> None:
    async with SessionLocal() as session:
        await ensure_categories(session)
        await session.commit()


async def _autocomplete_finished_orders(bot: Bot) -> None:
    async with SessionLocal() as session:
        from backend.repos.orders import OrdersRepo
        from backend.models.user import User

        orders_repo = OrdersRepo(session)
        pending = await orders_repo.list_pending_autocomplete()
        if not pending:
            return
        for o in pending:
            await orders_repo.set_status(o.id, OrderStatus.completed)
            try:
                customer = await session.get(User, o.customer_id)
                if customer:
                    await bot.send_message(
                        customer.tg_id,
                        f"Заказ #{o.id} автоматически завершён (24ч). Оставьте отзыв через /menu.",
                    )
            except Exception:
                pass
        await session.commit()


async def run_bot_and_web() -> None:
    setup_logging()
    if settings.sentry_dsn:
        sentry_sdk.init(dsn=settings.sentry_dsn)

    await _bootstrap()

    bot = Bot(token=settings.bot_token)
    storage = RedisStorage.from_url(settings.redis_url)
    dp = Dispatcher(storage=storage)
    dp.update.middleware(DbSessionMiddleware())
    dp.include_router(bot_router)

    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(_autocomplete_finished_orders, "interval", minutes=5, args=[bot])
    scheduler.start()

    # start FastAPI admin (uvicorn server) alongside polling
    fastapi_app = create_app()

    import uvicorn

    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)

    async def serve_web():
        await server.serve()

    async def serve_bot():
        if settings.bot_long_polling:
            await dp.start_polling(bot)
        else:
            # MVP default is long polling; webhook setup is post-MVP
            await dp.start_polling(bot)

    await asyncio.gather(serve_web(), serve_bot())


def main() -> None:
    try:
        asyncio.run(run_bot_and_web())
    except (KeyboardInterrupt, SystemExit):
        log.info("shutdown")


if __name__ == "__main__":
    main()

