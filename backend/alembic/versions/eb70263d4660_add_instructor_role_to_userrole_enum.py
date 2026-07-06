"""add instructor role to UserRole enum

Revision ID: eb70263d4660
Revises: 0d9a3fdba8f8
Create Date: 2026-07-06 15:49:25.088831

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eb70263d4660'
down_revision: Union[str, Sequence[str], None] = '0d9a3fdba8f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        with op.get_context().autocommit_block():
            op.execute("ALTER TYPE userrole ADD VALUE 'instructor'")


def downgrade() -> None:
    """Downgrade schema."""
    pass
