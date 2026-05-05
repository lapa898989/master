from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category


class CategoriesRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_active(self) -> list[Category]:
        res = await self.session.execute(
            select(Category).where(Category.is_active.is_(True)).order_by(Category.sort_order.asc(), Category.id.asc())
        )
        return list(res.scalars().all())

    async def get(self, category_id: int) -> Category | None:
        res = await self.session.execute(select(Category).where(Category.id == category_id))
        return res.scalar_one_or_none()

