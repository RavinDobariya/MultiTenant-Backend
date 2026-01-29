"""add columns to company table

Revision ID: 4e5a88235682
Revises: 
Create Date: 2026-01-29 14:21:13.395113

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
#from sqlalchemy import true

# revision identifiers, used by Alembic.
revision: str = '4e5a88235682'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

"""Upgrade schema."""
# 1. Add new columns (keep nullable first = safe)
def upgrade() -> None:
    op.add_column(
        "company",
        sa.Column("created_by", sa.String(36), nullable=True)
        )
    op.add_column(
        "company",
        sa.Column("updated_at", sa.DateTime(), nullable=True)
    )

    op.add_column(
        "company",
        sa.Column("updated_by", sa.String(36), nullable=True)
    )

    # 2. Fill old rows
    op.execute("""
        UPDATE COMPANY
        SET CREATED_BY = 'admin',
            UPDATED_AT = NOW(),
            UPDATED_BY = 'admin'
        WHERE CREATED_BY IS NULL;      
        """)

    # 3. On Change/Modify => MySQL needs existing_type
    op.alter_column("company", "created_by", nullable=False,existing_type=sa.String(36))
    op.alter_column("company", "updated_at", nullable=False,existing_type=sa.DateTime())
    op.alter_column("company", "updated_by", nullable=False,existing_type=sa.String(36))


"""Downgrade schema."""
def downgrade() -> None:
    op.drop_column("company", "created_by")
    op.drop_column("company", "updated_at")
    op.drop_column("company", "updated_by")
