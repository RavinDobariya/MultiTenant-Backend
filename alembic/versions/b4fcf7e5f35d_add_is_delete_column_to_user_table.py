"""add is_delete column to user table

Revision ID: b4fcf7e5f35d
Revises: 1973fda1caee
Create Date: 2026-01-30 10:02:55.572339

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4fcf7e5f35d'
down_revision: Union[str, Sequence[str], None] = '1973fda1caee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:

    # 1. Change company_id to CHAR(36) and make it nullable
    op.alter_column(
        "user",
        "company_id",
        type_=sa.CHAR(36),
        nullable=True,
        existing_type=sa.String(36),
    )

    # 2. Add is_delete column
    op.add_column(
        "user",
        sa.Column(
            "is_delete",
            sa.Boolean(),
            server_default=sa.text("0"),
            nullable=False
        )
    )

    # 3. Drop old foreign key (if exists)
    op.drop_constraint(
        "fk_user_company",
        "user",
        type_="foreignkey"
    )

    # 4. Create new foreign key
    op.create_foreign_key(
        "fk_user_company",
        "user",
        "company",
        ["company_id"],
        ["id"],
        ondelete="SET NULL",
        onupdate="CASCADE"
    )


def downgrade() -> None:

    # 1. Drop FK
    op.drop_constraint(
        "fk_user_company",
        "user",
        type_="foreignkey"
    )

    # 2. Remove is_delete
    op.drop_column("user", "is_delete")

    # 3. Revert company_id back to VARCHAR and NOT NULL
    op.alter_column(
        "user",
        "company_id",
        type_=sa.String(36),
        nullable=False,
        existing_type=sa.CHAR(36),
    )

    # 4. Restore old FK (RESTRICT example)
    op.create_foreign_key(
        "fk_user_company",
        "user",
        "company",
        ["company_id"],
        ["id"],
        ondelete="RESTRICT",
        onupdate="CASCADE"
    )
