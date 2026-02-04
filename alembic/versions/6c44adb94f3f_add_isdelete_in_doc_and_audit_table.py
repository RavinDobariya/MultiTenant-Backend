"""add isdelete in doc and audit table

Revision ID: 6c44adb94f3f
Revises: 59354bd814ce
Create Date: 2026-02-02 16:04:24.981921

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c44adb94f3f'
down_revision: Union[str, Sequence[str], None] = '59354bd814ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("document", sa.Column("is_delete", sa.Boolean(), nullable=False, server_default=sa.text("0")))
    op.add_column("audit_log", sa.Column("is_delete", sa.Boolean(), nullable=False, server_default=sa.text("0")))

def downgrade() -> None:
    op.drop_column("document", "is_delete")
    op.drop_column("audit_log", "is_delete")