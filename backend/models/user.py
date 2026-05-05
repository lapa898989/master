from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base
from backend.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tg_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)

    role: Mapped[UserRole | None] = mapped_column(Enum(UserRole), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    city: Mapped[str | None] = mapped_column(String(255), nullable=True)

    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lon: Mapped[float | None] = mapped_column(Float, nullable=True)

    rating: Mapped[float] = mapped_column(Float, default=0.0)
    completed_tasks: Mapped[int] = mapped_column(Integer, default=0)

    worker_categories: Mapped[str | None] = mapped_column(Text, nullable=True)  # csv of category ids
    worker_experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    worker_about: Mapped[str | None] = mapped_column(Text, nullable=True)
    worker_doc_photo_file_id: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_banned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

