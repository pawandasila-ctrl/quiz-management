"""add answer status tracking

Revision ID: 0d9a3fdba8f8
Revises: b93a18bf726d
Create Date: 2026-07-04 14:15:38.718045

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0d9a3fdba8f8'
down_revision: Union[str, Sequence[str], None] = 'b93a18bf726d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

answerstatus_enum = postgresql.ENUM(
    'NOT_VISITED', 'NOT_ANSWERED', 'ANSWERED', 'MARKED_FOR_REVIEW', 'ANSWERED_MARKED_FOR_REVIEW',
    name='answerstatus',
)


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    answerstatus_enum.create(bind, checkfirst=True)
    # server_default backfills existing rows (required since the column is NOT NULL);
    # the ORM only relies on its own Python-side default for new inserts going forward.
    op.add_column(
        'answers',
        sa.Column('status', answerstatus_enum, nullable=False, server_default='NOT_VISITED'),
    )
    op.alter_column('answers', 'selected_option_id',
               existing_type=sa.INTEGER(),
               nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('answers', 'selected_option_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.drop_column('answers', 'status')
    answerstatus_enum.drop(op.get_bind(), checkfirst=True)
