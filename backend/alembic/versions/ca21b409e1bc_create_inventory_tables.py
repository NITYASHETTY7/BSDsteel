"""create inventory tables

Revision ID: ca21b409e1bc
Revises: ef10ae2f2fec
Create Date: 2026-06-24 12:23:38.317121

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ca21b409e1bc'
down_revision: Union[str, Sequence[str], None] = 'ef10ae2f2fec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enums are created automatically by sa.Enum in create_table

    op.create_table(
        'warehouses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('location', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_warehouses_name'), 'warehouses', ['name'], unique=False)
    op.create_index(op.f('ix_warehouses_id'), 'warehouses', ['id'], unique=False)

    op.create_table(
        'skus',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sku_code', sa.String(), nullable=False),
        sa.Column('product_type', sa.Enum('hr_coil', 'hr_sheet', 'chequered_sheet', name='producttypeenum'), nullable=False),
        sa.Column('thickness_mm', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('width_mm', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('length_mm', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('grade', sa.String(), nullable=False),
        sa.Column('unit_of_measure', sa.Enum('MT', 'KG', 'PCS', name='uomenum'), nullable=False),
        sa.Column('reorder_threshold', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_skus_sku_code'), 'skus', ['sku_code'], unique=True)
    op.create_index(op.f('ix_skus_id'), 'skus', ['id'], unique=False)

    op.create_table(
        'stock_batches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sku_id', sa.Integer(), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('batch_number', sa.String(), nullable=False),
        sa.Column('quantity_on_hand', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('unit_cost', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('received_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['sku_id'], ['skus.id'], ),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stock_batches_batch_number'), 'stock_batches', ['batch_number'], unique=False)
    op.create_index(op.f('ix_stock_batches_warehouse_id'), 'stock_batches', ['warehouse_id'], unique=False)
    op.create_index(op.f('ix_stock_batches_sku_id'), 'stock_batches', ['sku_id'], unique=False)
    op.create_index(op.f('ix_stock_batches_id'), 'stock_batches', ['id'], unique=False)

    op.create_table(
        'stock_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sku_id', sa.Integer(), nullable=False),
        sa.Column('warehouse_id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.Integer(), nullable=True),
        sa.Column('transaction_type', sa.Enum('inward', 'outward', 'adjustment', 'opening_stock', name='transactiontypeenum'), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('reference_note', sa.String(), nullable=True),
        sa.Column('performed_by_user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['batch_id'], ['stock_batches.id'], ),
        sa.ForeignKeyConstraint(['performed_by_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['sku_id'], ['skus.id'], ),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_stock_transactions_performed_by_user_id'), 'stock_transactions', ['performed_by_user_id'], unique=False)
    op.create_index(op.f('ix_stock_transactions_batch_id'), 'stock_transactions', ['batch_id'], unique=False)
    op.create_index(op.f('ix_stock_transactions_warehouse_id'), 'stock_transactions', ['warehouse_id'], unique=False)
    op.create_index(op.f('ix_stock_transactions_sku_id'), 'stock_transactions', ['sku_id'], unique=False)
    op.create_index(op.f('ix_stock_transactions_id'), 'stock_transactions', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('stock_transactions')
    op.drop_table('stock_batches')
    op.drop_table('skus')
    op.drop_table('warehouses')
    op.execute("DROP TYPE transactiontypeenum;")
    op.execute("DROP TYPE uomenum;")
    op.execute("DROP TYPE producttypeenum;")
