from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message


class MessagesRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, *, order_id: int, sender_id: int, text: str | None, photo_file_id: str | None) -> Message:
        m = Message(order_id=order_id, sender_id=sender_id, text=text, photo_file_id=photo_file_id)
        self.session.add(m)
        await self.session.flush()
        return m

    async def list_for_order(self, order_id: int, limit: int = 50) -> list[Message]:
        res = await self.session.execute(
            select(Message).where(Message.order_id == order_id).order_by(Message.created_at.desc()).limit(limit)
        )
        return list(res.scalars().all())

