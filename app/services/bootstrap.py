from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category


DEFAULT_CATEGORIES: list[tuple[str, str]] = [
    ("Уборка", "🧹"),
    ("Электрик", "💡"),
    ("Сантехник", "🚰"),
    ("Сборка мебели", "🪑"),
    ("Мастер на час", "🛠"),
    ("Вывоз мусора", "🗑"),
    ("Снегоуборка", "❄️"),
    ("Другое", "🧩"),
]


async def ensure_categories(session: AsyncSession) -> None:
    existing = await session.execute(select(Category.name))
    existing_names = {n for (n,) in existing.all()}
    sort = 10
    for name, icon in DEFAULT_CATEGORIES:
        if name in existing_names:
            continue
        session.add(Category(name=name, icon=icon, sort_order=sort, is_active=True))
        sort += 10
    await session.flush()

