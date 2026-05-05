from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.enums import OrderStatus
from backend.models.order import Order


class OrdersRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        *,
        customer_id: int,
        category_id: int,
        description: str,
        photo_file_id: str | None,
        address: str,
        lat: float | None,
        lon: float | None,
        scheduled_at: datetime | None,
        price: int,
        currency: str,
    ) -> Order:
        o = Order(
            customer_id=customer_id,
            category_id=category_id,
            description=description,
            photo_file_id=photo_file_id,
            address=address,
            lat=lat,
            lon=lon,
            scheduled_at=scheduled_at,
            price=price,
            currency=currency,
            status=OrderStatus.active,
        )
        self.session.add(o)
        await self.session.flush()
        return o

    async def get(self, order_id: int) -> Order | None:
        res = await self.session.execute(select(Order).where(Order.id == order_id))
        return res.scalar_one_or_none()

    async def list_by_customer(self, customer_id: int) -> list[Order]:
        res = await self.session.execute(
            select(Order).where(Order.customer_id == customer_id).order_by(Order.created_at.desc())
        )
        return list(res.scalars().all())

    async def list_active_for_feed(self, *, category_ids: list[int] | None = None) -> list[Order]:
        conds = [Order.status == OrderStatus.active]
        if category_ids:
            conds.append(Order.category_id.in_(category_ids))
        res = await self.session.execute(select(Order).where(and_(*conds)).order_by(Order.created_at.desc()).limit(20))
        return list(res.scalars().all())

    async def count_created_today(self, customer_id: int) -> int:
        now = datetime.now(timezone.utc)
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        res = await self.session.execute(
            select(func.count(Order.id)).where(and_(Order.customer_id == customer_id, Order.created_at >= start, Order.created_at < end))
        )
        return int(res.scalar_one())

    async def set_selected_worker(self, order_id: int, worker_id: int) -> None:
        await self.session.execute(
            update(Order)
            .where(Order.id == order_id)
            .values(status=OrderStatus.worker_selected, selected_worker_id=worker_id)
        )

    async def set_status(self, order_id: int, status: OrderStatus) -> None:
        await self.session.execute(update(Order).where(Order.id == order_id).values(status=status))

    async def mark_finished_by_customer(self, order_id: int) -> None:
        await self.session.execute(
            update(Order).where(Order.id == order_id).values(customer_finished_at=datetime.now(timezone.utc))
        )

    async def mark_finished_by_worker(self, order_id: int) -> None:
        await self.session.execute(
            update(Order).where(Order.id == order_id).values(worker_finished_at=datetime.now(timezone.utc))
        )

    async def list_pending_autocomplete(self) -> list[Order]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        res = await self.session.execute(
            select(Order).where(
                and_(
                    Order.status.in_([OrderStatus.finished, OrderStatus.paid]),
                    (
                        and_(Order.customer_finished_at.isnot(None), Order.worker_finished_at.is_(None), Order.customer_finished_at < cutoff)
                        | and_(Order.worker_finished_at.isnot(None), Order.customer_finished_at.is_(None), Order.worker_finished_at < cutoff)
                    ),
                )
            )
        )
        return list(res.scalars().all())

