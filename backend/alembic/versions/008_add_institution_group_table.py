"""Add InstitutionGroup table for hierarchical institutions

Revision ID: 008
Revises: 005
Create Date: 2026-02-12 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '008'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'InstitutionGroup',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('userid', sa.Integer(), nullable=False),
        sa.Column('parentinstitutionid', sa.Integer(), nullable=False),
        sa.Column('childinstitutionid', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['userid'], ['UserProfile.id'], ),
        sa.ForeignKeyConstraint(['parentinstitutionid'], ['Institution.id'], ),
        sa.ForeignKeyConstraint(['childinstitutionid'], ['Institution.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_InstitutionGroup_id'), 'InstitutionGroup', ['id'], unique=False)
    op.create_index(op.f('ix_InstitutionGroup_userid'), 'InstitutionGroup', ['userid'], unique=False)
    op.create_index(op.f('ix_InstitutionGroup_parentinstitutionid'), 'InstitutionGroup', ['parentinstitutionid'], unique=False)
    op.create_index(op.f('ix_InstitutionGroup_childinstitutionid'), 'InstitutionGroup', ['childinstitutionid'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_InstitutionGroup_childinstitutionid'), table_name='InstitutionGroup')
    op.drop_index(op.f('ix_InstitutionGroup_parentinstitutionid'), table_name='InstitutionGroup')
    op.drop_index(op.f('ix_InstitutionGroup_userid'), table_name='InstitutionGroup')
    op.drop_index(op.f('ix_InstitutionGroup_id'), table_name='InstitutionGroup')
    op.drop_table('InstitutionGroup')
