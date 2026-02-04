"""add columns to unit table

Revision ID: a0659d5a68ae
Revises: 4e5a88235682
Create Date: 2026-01-29 15:05:03.011332

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0659d5a68ae'
down_revision: Union[str, Sequence[str], None] = '4e5a88235682'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "unit",
        sa.Column("created_by", sa.String(36), nullable=True)
        )
    op.add_column(
        "unit",
        sa.Column("updated_at", sa.DateTime(), nullable=True)
    )

    op.add_column(
        "unit",
        sa.Column("updated_by", sa.String(36), nullable=True)
    )

    # 2. Fill old rows
    op.execute("""
               UPDATE unit
               SET CREATED_BY = 'admin',
                   UPDATED_AT = NOW(),
                   UPDATED_BY = 'admin'
               WHERE updated_by IS NULL;
               """)

    # 3. On Change/Modify => MySQL needs existing_type
    op.alter_column("unit", "created_by", nullable=False, existing_type=sa.String(36))
    op.alter_column("unit", "updated_at", nullable=False, existing_type=sa.DateTime())
    op.alter_column("unit", "updated_by", nullable=False, existing_type=sa.String(36))


def downgrade() -> None:
    op.drop_column("unit", "created_by")
    op.drop_column("unit", "updated_at")
    op.drop_column("unit", "updated_by")
