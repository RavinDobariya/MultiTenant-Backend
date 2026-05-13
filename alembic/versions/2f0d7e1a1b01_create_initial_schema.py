"""create initial schema

Revision ID: 2f0d7e1a1b01
Revises:
Create Date: 2026-05-11 13:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2f0d7e1a1b01"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "company",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.Enum("admin", "user", name="user_role"), nullable=False),
        sa.Column("company_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"], name="fk_user_company", ondelete="RESTRICT", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("index_user_company_id", "user", ["company_id"], unique=False)

    op.create_table(
        "unit",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("company_id", sa.CHAR(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["company_id"], ["company.id"], name="fk_unit_company", ondelete="RESTRICT", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "name", name="uq_unit_company_name"),
    )
    op.create_index("index_unit_company_id", "unit", ["company_id"], unique=False)

    op.create_table(
        "document",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("unit_id", sa.CHAR(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("type", sa.Enum("POLICY", "MANUAL", "REPORT", name="document_type"), nullable=False),
        sa.Column(
            "status",
            sa.Enum("DRAFT", "APPROVED", "ARCHIVED", name="document_status"),
            nullable=False,
            server_default="DRAFT",
        ),
        sa.Column("file_url", sa.String(length=1000), nullable=True),
        sa.Column("created_by", sa.CHAR(length=36), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("approved_by", sa.CHAR(length=36), nullable=True),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(),
            nullable=True,
            server_default=sa.text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(["approved_by"], ["user.id"], name="fk_doc_approved_by", ondelete="SET NULL", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"], name="fk_doc_created_by", ondelete="RESTRICT", onupdate="CASCADE"),
        sa.ForeignKeyConstraint(["unit_id"], ["unit.id"], name="fk_doc_unit", ondelete="RESTRICT", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("index_doc_unit_id", "document", ["unit_id"], unique=False)
    op.create_index("index_doc_created_by", "document", ["created_by"], unique=False)
    op.create_index("index_doc_approved_by", "document", ["approved_by"], unique=False)
    op.create_index("index_doc_status", "document", ["status"], unique=False)

    op.create_table(
        "audit_log",
        sa.Column("id", sa.CHAR(length=36), nullable=False),
        sa.Column("action", sa.String(length=255), nullable=False),
        sa.Column("entity_id", sa.CHAR(length=36), nullable=False),
        sa.Column("user_id", sa.CHAR(length=36), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], name="fk_audit_user", ondelete="RESTRICT", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("index_audit_entity_id", "audit_log", ["entity_id"], unique=False)
    op.create_index("index_audit_user_id", "audit_log", ["user_id"], unique=False)
    op.create_index("index_audit_action", "audit_log", ["action"], unique=False)

    op.create_table(
        "refresh_token",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("token", sa.String(length=500), nullable=False),
        sa.Column("user_id", sa.CHAR(length=36), nullable=False),
        sa.Column("is_revoked", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], name="fk_refresh_user", ondelete="RESTRICT", onupdate="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index("index_refresh_user_id", "refresh_token", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("index_refresh_user_id", table_name="refresh_token")
    op.drop_table("refresh_token")
    op.drop_index("index_audit_action", table_name="audit_log")
    op.drop_index("index_audit_user_id", table_name="audit_log")
    op.drop_index("index_audit_entity_id", table_name="audit_log")
    op.drop_table("audit_log")
    op.drop_index("index_doc_status", table_name="document")
    op.drop_index("index_doc_approved_by", table_name="document")
    op.drop_index("index_doc_created_by", table_name="document")
    op.drop_index("index_doc_unit_id", table_name="document")
    op.drop_table("document")
    op.drop_index("index_unit_company_id", table_name="unit")
    op.drop_table("unit")
    op.drop_index("index_user_company_id", table_name="user")
    op.drop_table("user")
    op.drop_table("company")
