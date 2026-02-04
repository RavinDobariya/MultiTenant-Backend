"""update fk for cascade delete to unit table

Revision ID: 418a2a54883c
Revises: b4fcf7e5f35d
Create Date: 2026-01-30 12:10:16.618568

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '418a2a54883c'
down_revision: Union[str, Sequence[str], None] = 'b4fcf7e5f35d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:

    # 1. Drop old foreign key (if exists)
    op.drop_constraint(
        "fk_unit_company",
        "unit",
        type_="foreignkey"
    )

    # 2. Create new foreign key
    op.create_foreign_key(
        "fk_unit_company",
        "unit",
        "company",
        ["company_id"],
        ["id"],
        ondelete="CASCADE",
        onupdate="CASCADE"
    )


def downgrade() -> None:
    # 3. Drop CASCADE FK
    op.drop_constraint(
        "fk_unit_company",
        "unit",
        type_="foreignkey"
    )

    # 4. Restore old FK (RESTRICT example)
    op.create_foreign_key(
        "fk_unit_company",
        "unit",
        "company",
        ["company_id"],
        ["id"],
        ondelete="RESTRICT",
        onupdate="CASCADE"
    )