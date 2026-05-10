"""add join request table

Revision ID: d83b0f8f4d2a
Revises: 6c44adb94f3f
Create Date: 2026-05-10 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d83b0f8f4d2a"
down_revision: Union[str, Sequence[str], None] = "6c44adb94f3f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "join_request",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("company_id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("requested_role", sa.Enum("admin", "editor", "user", name="join_request_role"), nullable=False),
        sa.Column(
            "status",
            sa.Enum("PENDING", "APPROVED", "REJECTED", name="join_request_status"),
            nullable=False,
            server_default="PENDING",
        ),
        sa.Column("reviewed_by", sa.String(length=36), nullable=True),
        sa.Column("approved_user_id", sa.String(length=36), nullable=True),
        sa.Column("rejection_reason", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["approved_user_id"], ["user.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"], ondelete="CASCADE", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by"], ["user.id"], ondelete="SET NULL", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "email", "status", name="uq_join_request_company_email_status"),
    )
    op.create_index("ix_join_request_company_id", "join_request", ["company_id"], unique=False)
    op.create_index("ix_join_request_status", "join_request", ["status"], unique=False)
    op.create_index("ix_join_request_created_at", "join_request", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_join_request_created_at", table_name="join_request")
    op.drop_index("ix_join_request_status", table_name="join_request")
    op.drop_index("ix_join_request_company_id", table_name="join_request")
    op.drop_table("join_request")
