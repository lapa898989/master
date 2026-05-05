from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, SmallInteger, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("order_id", "from_user_id", "to_user_id", name="uq_review_once"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    rating: Mapped[int] = mapped_column(SmallInteger)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

