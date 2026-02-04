"""update fk for cascade delete to audits

Revision ID: ebb721341f53
Revises: 0086b4bd5bd0
Create Date: 2026-01-30 15:14:18.413034

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ebb721341f53'
down_revision: Union[str, Sequence[str], None] = '0086b4bd5bd0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.alter_column("audit_log", "user_id", nullable=True,existing_type=sa.CHAR(36))
    op.drop_constraint(
        "fk_audit_user",
        "audit_log",
        type_="foreignkey"
    )

    op.create_foreign_key(
        "fk_audit_user",
        "audit_log",
        "user",
        ["user_id"],
        ["id"],
        ondelete="set null",
        onupdate="CASCADE"
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_audit_user",
        "audit_log",
        type_="foreignkey"
    )

    op.create_foreign_key(
        "fk_audit_user",
        "audit_log",
        "user",
        ["user_id"],
        ["id"],
        ondelete="RESTRICT",
        onupdate="CASCADE"
    )