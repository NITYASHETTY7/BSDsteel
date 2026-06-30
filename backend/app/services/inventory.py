from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.inventory import SKU, StockBatch, StockTransaction, TransactionTypeEnum
from app.schemas.inventory import StockTransactionCreate

async def get_total_stock_for_sku(db: AsyncSession, sku_id: int) -> Decimal:
    """Returns the total quantity_on_hand across all active batches for a SKU."""
    result = await db.execute(
        select(func.sum(StockBatch.quantity_on_hand)).where(StockBatch.sku_id == sku_id)
    )
    total = result.scalar()
    return total if total is not None else Decimal('0')

async def check_low_stock(db: AsyncSession, sku_id: int) -> bool:
    """Returns True if total stock < reorder_threshold."""
    total_stock = await get_total_stock_for_sku(db, sku_id)
    result = await db.execute(select(SKU.reorder_threshold).where(SKU.id == sku_id))
    threshold = result.scalar()
    if threshold is None:
        return False
    return total_stock < threshold

async def process_stock_transaction(
    db: AsyncSession, 
    txn_data: StockTransactionCreate, 
    user_id: int
) -> StockTransaction:
    """Safely processes a stock transaction, updating batches and logging the transaction."""
    
    # 1. Handle batch retrieval or creation based on transaction type
    batch = None
    if txn_data.transaction_type in [TransactionTypeEnum.inward, TransactionTypeEnum.opening_stock]:
        if not txn_data.batch_number:
            raise HTTPException(status_code=400, detail="batch_number is required for inward/opening_stock transactions")
        
        # Ensure positive quantity
        if txn_data.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive for inward/opening_stock transactions")
            
        result = await db.execute(
            select(StockBatch).where(
                StockBatch.sku_id == txn_data.sku_id,
                StockBatch.warehouse_id == txn_data.warehouse_id,
                StockBatch.batch_number == txn_data.batch_number
            )
        )
        batch = result.scalar_one_or_none()
        
        if not batch:
            batch = StockBatch(
                sku_id=txn_data.sku_id,
                warehouse_id=txn_data.warehouse_id,
                batch_number=txn_data.batch_number,
                quantity_on_hand=Decimal('0'),
                unit_cost=txn_data.unit_cost
            )
            db.add(batch)
            await db.flush() # flush to get batch.id
            
        # Update batch quantity
        batch.quantity_on_hand += txn_data.quantity
        
    elif txn_data.transaction_type == TransactionTypeEnum.outward:
        if not txn_data.batch_id:
            raise HTTPException(status_code=400, detail="batch_id is required for outward transactions")
            
        # Ensure negative or positive passed? Usually outward is negative, but prompt says:
        # "quantity (decimal, signed — positive for inward/opening, negative for outward, +/- for adjustment)"
        # So outward quantity must be < 0
        if txn_data.quantity >= 0:
             raise HTTPException(status_code=400, detail="Quantity must be negative for outward transactions")
             
        result = await db.execute(select(StockBatch).where(StockBatch.id == txn_data.batch_id))
        batch = result.scalar_one_or_none()
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
            
        if batch.quantity_on_hand + txn_data.quantity < 0:
            raise HTTPException(status_code=400, detail=f"Insufficient stock in batch. Available: {batch.quantity_on_hand}")
            
        batch.quantity_on_hand += txn_data.quantity

    elif txn_data.transaction_type == TransactionTypeEnum.adjustment:
        if txn_data.batch_id:
            result = await db.execute(select(StockBatch).where(StockBatch.id == txn_data.batch_id))
            batch = result.scalar_one_or_none()
            if batch:
                if batch.quantity_on_hand + txn_data.quantity < 0:
                    raise HTTPException(status_code=400, detail=f"Adjustment would result in negative stock. Available: {batch.quantity_on_hand}")
                batch.quantity_on_hand += txn_data.quantity
    
    # 2. Log the transaction
    txn = StockTransaction(
        sku_id=txn_data.sku_id,
        warehouse_id=txn_data.warehouse_id,
        batch_id=batch.id if batch else txn_data.batch_id,
        transaction_type=txn_data.transaction_type,
        quantity=txn_data.quantity,
        reference_note=txn_data.reference_note,
        performed_by_user_id=user_id
    )
    db.add(txn)
    await db.commit()
    await db.refresh(txn)
    
    return txn
