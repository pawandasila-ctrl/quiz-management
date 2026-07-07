"""add uppercase INSTRUCTOR to userrole enum

Revision ID: 51cba110da26
Revises: eb70263d4660
Create Date: 2026-07-07 11:24:10.546207

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '51cba110da26'
down_revision: Union[str, Sequence[str], None] = 'eb70263d4660'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        with op.get_context().autocommit_block():
            res = bind.execute(sa.text(
                "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'userrole'"
            ))
            existing_labels = [row[0] for row in res.fetchall()]
            if 'INSTRUCTOR' not in existing_labels:
                op.execute("ALTER TYPE userrole ADD VALUE 'INSTRUCTOR'")


def downgrade() -> None:
    """Downgrade schema."""
    pass
