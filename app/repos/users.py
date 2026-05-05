from __future__ import annotations

from sqlalchemy import and_, func
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole
from app.models.user import User


class UsersRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_tg_id(self, tg_id: int) -> User | None:
        res = await self.session.execute(select(User).where(User.tg_id == tg_id))
        return res.scalar_one_or_none()

    async def create_if_missing(self, tg_id: int, name: str) -> User:
        u = await self.get_by_tg_id(tg_id)
        if u:
            if u.name != name:
                u.name = name
            return u
        u = User(tg_id=tg_id, name=name)
        self.session.add(u)
        await self.session.flush()
        return u

    async def set_role(self, user_id: int, role: UserRole) -> None:
        await self.session.execute(update(User).where(User.id == user_id).values(role=role))

    async def update_profile(self, user_id: int, *, phone: str | None = None, city: str | None = None) -> None:
        values = {}
        if phone is not None:
            values["phone"] = phone
        if city is not None:
            values["city"] = city
        if values:
            await self.session.execute(update(User).where(User.id == user_id).values(**values))

    async def set_worker_profile(
        self,
        user_id: int,
        *,
        categories_csv: str | None = None,
        experience_years: int | None = None,
        about: str | None = None,
        doc_photo_file_id: str | None = None,
    ) -> None:
        values = {
            "worker_categories": categories_csv,
            "worker_experience_years": experience_years,
            "worker_about": about,
            "worker_doc_photo_file_id": doc_photo_file_id,
        }
        await self.session.execute(update(User).where(User.id == user_id).values(**values))

    async def ban(self, user_id: int, is_banned: bool) -> None:
        await self.session.execute(update(User).where(User.id == user_id).values(is_banned=is_banned))

    async def list_workers_for_city_and_category(self, *, city: str | None, category_id: int | None) -> list[User]:
        conds = [User.role == UserRole.worker, User.is_banned.is_(False)]
        if city:
            conds.append(User.city == city)
        if category_id is not None:
            # MVP: categories stored as comma-separated string with leading/trailing commas: ",1,2,"
            conds.append(User.worker_categories.ilike(f"%,{category_id},%"))
        res = await self.session.execute(select(User).where(and_(*conds)))
        return list(res.scalars().all())

    async def update_rating_and_completed(self, user_id: int, *, rating: float | None = None, add_completed: int = 0) -> None:
        values = {}
        if rating is not None:
            values["rating"] = rating
        if add_completed:
            values["completed_tasks"] = User.completed_tasks + add_completed
        if values:
            await self.session.execute(update(User).where(User.id == user_id).values(**values))

    async def count_by_role_city(self, *, role: UserRole, city: str | None) -> int:
        conds = [User.role == role]
        if city:
            conds.append(User.city == city)
        res = await self.session.execute(select(func.count(User.id)).where(and_(*conds)))
        return int(res.scalar_one())

