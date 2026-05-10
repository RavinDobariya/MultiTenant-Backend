"""expand user role enum for editor

Revision ID: e4a1c7d9b2f1
Revises: d83b0f8f4d2a
Create Date: 2026-05-10 23:28:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "e4a1c7d9b2f1"
down_revision: Union[str, Sequence[str], None] = "d83b0f8f4d2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE `user`
        MODIFY COLUMN `role` ENUM('admin', 'editor', 'user') NOT NULL
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE `user`
        MODIFY COLUMN `role` ENUM('admin', 'user') NOT NULL
        """
    )
