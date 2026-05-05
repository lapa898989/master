from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bid import Bid
from app.models.enums import BidStatus


class BidAlreadyExists(Exception):
    pass


class BidsRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        *,
        order_id: int,
        worker_id: int,
        proposed_price: int,
        currency: str,
        message: str | None,
    ) -> Bid:
        bid = Bid(
            order_id=order_id,
            worker_id=worker_id,
            proposed_price=proposed_price,
            currency=currency,
            message=message,
            status=BidStatus.submitted,
        )
        self.session.add(bid)
        try:
            await self.session.flush()
        except IntegrityError as e:
            raise BidAlreadyExists() from e
        return bid

    async def list_for_order(self, order_id: int) -> list[Bid]:
        res = await self.session.execute(select(Bid).where(Bid.order_id == order_id).order_by(Bid.created_at.asc()))
        return list(res.scalars().all())

    async def count_created_today(self, worker_id: int) -> int:
        now = datetime.now(timezone.utc)
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        res = await self.session.execute(
            select(func.count(Bid.id)).where(and_(Bid.worker_id == worker_id, Bid.created_at >= start, Bid.created_at < end))
        )
        return int(res.scalar_one())

    async def accept_for_order(self, order_id: int, worker_id: int) -> None:
        await self.session.execute(
            update(Bid)
            .where(and_(Bid.order_id == order_id, Bid.worker_id == worker_id))
            .values(status=BidStatus.accepted)
        )
        await self.session.execute(
            update(Bid)
            .where(and_(Bid.order_id == order_id, Bid.worker_id != worker_id))
            .values(status=BidStatus.rejected)
        )

