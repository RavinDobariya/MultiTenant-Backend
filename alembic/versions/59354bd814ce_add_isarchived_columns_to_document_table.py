"""add isarchived columns to document table

Revision ID: 59354bd814ce
Revises: ebb721341f53
Create Date: 2026-02-02 12:27:23.955796

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '59354bd814ce'
down_revision: Union[str, Sequence[str], None] = 'ebb721341f53'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "document",
        sa.Column(
            "is_archived",
            sa.Boolean(),
            server_default=sa.text("0"),
            nullable=False
        )
    )

    op.add_column(
        "document",
        sa.Column(
            "archived_at",
            sa.DateTime(),
            nullable=True
        )
    )

    op.execute("""UPDATE document  SET archived_at = NOW() where is_archived=1 AND archived_at IS NULL """)


def downgrade() -> None:
    op.drop_column("document", "is_archived")
    op.drop_column("document", "archived_at")
