from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import BidStatus


class Bid(Base):
    __tablename__ = "bids"
    __table_args__ = (UniqueConstraint("order_id", "worker_id", name="uq_bids_order_worker"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    worker_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    proposed_price: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8))
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[BidStatus] = mapped_column(Enum(BidStatus), default=BidStatus.submitted, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

