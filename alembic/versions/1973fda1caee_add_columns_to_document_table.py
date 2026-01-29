"""add columns to document table

Revision ID: 1973fda1caee
Revises: a0659d5a68ae
Create Date: 2026-01-29 15:12:39.561153

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1973fda1caee'
down_revision: Union[str, Sequence[str], None] = 'a0659d5a68ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("document", sa.Column("updated_by", sa.String(36), nullable=True))

    op.execute("""
        UPDATE document
        set updated_by = 'admin'
        where updated_by is null;
        """)

    op.alter_column("document", "updated_by", existing_type=sa.String(36),nullable=False)

def downgrade() -> None:
    op.drop_column("document", "updated_by")

