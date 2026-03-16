from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class SavedResult(Base):
    __tablename__ = "saved_results"

    __table_args__ = (
        UniqueConstraint("user_id", "permalink_id", name="uq_saved_results_user_permalink"),
    )

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    permalink_id: Mapped[str] = mapped_column(String(36), nullable=False)
    label: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    input: Mapped[str] = mapped_column(String(512), nullable=False)
    input_type: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
