"""update fk for cascade delete to docs table

Revision ID: 0086b4bd5bd0
Revises: 418a2a54883c
Create Date: 2026-01-30 12:16:58.746292

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0086b4bd5bd0'
down_revision: Union[str, Sequence[str], None] = '418a2a54883c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # 1. Drop old foreign key (if exists)
    op.drop_constraint(
        "fk_doc_unit",
        "document",
        type_="foreignkey"
    )

    # 2. Create new foreign key
    op.create_foreign_key(
        "fk_doc_unit",
        "document",
        "unit",
        ["unit_id"],
        ["id"],
        ondelete="CASCADE",
        onupdate="CASCADE"
    )

    op.alter_column("document", "created_by", nullable=True,existing_type=sa.CHAR(36))
    op.drop_constraint(
        "fk_doc_created_by",
        "document",
        type_="foreignkey"
    )

    op.create_foreign_key(
        "fk_doc_created_by",
        "document",
        "user",
        ["created_by"],
        ["id"],
        ondelete="set null",
        onupdate="CASCADE"
    )


def downgrade() -> None:
    # 3. Drop CASCADE FK
    op.drop_constraint(
        "fk_doc_unit",
        "document",
        type_="foreignkey"
    )

    # 4. Restore old FK (RESTRICT example)
    op.create_foreign_key(
        "fk_doc_unit",
        "document",
        "unit",
        ["unit_id"],
        ["id"],
        ondelete="RESTRICT",
        onupdate="CASCADE"
    )

    op.drop_constraint(
        "fk_doc_created_by",
        "document",
        type_="foreignkey"
    )

    op.create_foreign_key(
        "fk_doc_created_by",
        "document",
        "user",
        ["created_by"],
        ["id"],
        ondelete="RESTRICT",
        onupdate="CASCADE"
    )