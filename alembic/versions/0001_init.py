"""init schema

Revision ID: 0001_init
Revises: 
Create Date: 2026-04-28

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tg_id", sa.BigInteger(), nullable=False),
        sa.Column("role", sa.Enum("customer", "worker", name="userrole"), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("city", sa.String(length=255), nullable=True),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lon", sa.Float(), nullable=True),
        sa.Column("rating", sa.Float(), nullable=False, server_default="0"),
        sa.Column("completed_tasks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("worker_categories", sa.Text(), nullable=True),
        sa.Column("worker_experience_years", sa.Integer(), nullable=True),
        sa.Column("worker_about", sa.Text(), nullable=True),
        sa.Column("worker_doc_photo_file_id", sa.Text(), nullable=True),
        sa.Column("is_banned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("tg_id", name="uq_users_tg_id"),
    )
    op.create_index("ix_users_tg_id", "users", ["tg_id"])

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("icon", sa.String(length=32), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.UniqueConstraint("name", name="uq_categories_name"),
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("photo_file_id", sa.Text(), nullable=True),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("lat", sa.Float(), nullable=True),
        sa.Column("lon", sa.Float(), nullable=True),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("status", sa.Enum(
            "NEW",
            "ACTIVE",
            "WORKER_SELECTED",
            "IN_PROGRESS",
            "FINISHED",
            "PAID",
            "COMPLETED",
            "CANCELLED",
            name="orderstatus",
        ), nullable=False, server_default="ACTIVE"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("selected_worker_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("customer_finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("worker_finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_orders_customer_id", "orders", ["customer_id"])
    op.create_index("ix_orders_category_id", "orders", ["category_id"])
    op.create_index("ix_orders_status", "orders", ["status"])

    op.create_table(
        "bids",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("worker_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("proposed_price", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("SUBMITTED", "ACCEPTED", "REJECTED", name="bidstatus"), nullable=False, server_default="SUBMITTED"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("order_id", "worker_id", name="uq_bids_order_worker"),
    )
    op.create_index("ix_bids_order_id", "bids", ["order_id"])
    op.create_index("ix_bids_worker_id", "bids", ["worker_id"])
    op.create_index("ix_bids_status", "bids", ["status"])

    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("text", sa.Text(), nullable=True),
        sa.Column("photo_file_id", sa.Text(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_messages_order_id", "messages", ["order_id"])
    op.create_index("ix_messages_sender_id", "messages", ["sender_id"])

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("from_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("to_user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("rating", sa.SmallInteger(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("order_id", "from_user_id", "to_user_id", name="uq_review_once"),
    )
    op.create_index("ix_reviews_order_id", "reviews", ["order_id"])
    op.create_index("ix_reviews_from_user_id", "reviews", ["from_user_id"])
    op.create_index("ix_reviews_to_user_id", "reviews", ["to_user_id"])


def downgrade() -> None:
    op.drop_table("reviews")
    op.drop_table("messages")
    op.drop_table("bids")
    op.drop_table("orders")
    op.drop_table("categories")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS bidstatus")
    op.execute("DROP TYPE IF EXISTS orderstatus")
    op.execute("DROP TYPE IF EXISTS userrole")

