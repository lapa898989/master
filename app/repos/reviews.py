from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Review


class ReviewsRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, *, order_id: int, from_user_id: int, to_user_id: int, rating: int, comment: str | None) -> Review:
        r = Review(order_id=order_id, from_user_id=from_user_id, to_user_id=to_user_id, rating=rating, comment=comment)
        self.session.add(r)
        await self.session.flush()
        return r

    async def avg_rating_for_user(self, user_id: int) -> float:
        res = await self.session.execute(select(func.avg(Review.rating)).where(Review.to_user_id == user_id))
        val = res.scalar_one()
        return float(val) if val is not None else 0.0

    async def list_latest_for_user(self, user_id: int, limit: int = 10) -> list[Review]:
        res = await self.session.execute(
            select(Review).where(Review.to_user_id == user_id).order_by(Review.created_at.desc()).limit(limit)
        )
        return list(res.scalars().all())

