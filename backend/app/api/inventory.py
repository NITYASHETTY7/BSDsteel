from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from typing import List, Optional

from app.api.deps import get_db, require_role, get_current_user
from app.models.user import User
from app.models.inventory import SKU, Warehouse, StockBatch, StockTransaction
from app.schemas.inventory import (
    SKUCreate, SKUUpdate, SKUResponse, 
    WarehouseCreate, WarehouseResponse,
    StockTransactionCreate, StockTransactionResponse,
    StockLedgerResponse, StockBatchResponse
)
from app.services.inventory import process_stock_transaction, get_total_stock_for_sku, check_low_stock

router = APIRouter()

# --- Warehouses ---
@router.post("/warehouses", response_model=WarehouseResponse, dependencies=[Depends(require_role('management'))])
async def create_warehouse(warehouse_in: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    warehouse = Warehouse(**warehouse_in.dict())
    db.add(warehouse)
    await db.commit()
    await db.refresh(warehouse)
    return warehouse

@router.get("/warehouses", response_model=List[WarehouseResponse])
async def list_warehouses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Warehouse))
    return result.scalars().all()

# --- SKUs ---
@router.post("/skus", response_model=SKUResponse, dependencies=[Depends(require_role('operations', 'management'))])
async def create_sku(sku_in: SKUCreate, db: AsyncSession = Depends(get_db)):
    try:
        sku = SKU(**sku_in.dict())
        db.add(sku)
        await db.commit()
        await db.refresh(sku)
        
        # Hydrate response
        setattr(sku, 'total_stock', 0)
        return sku
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        if "UniqueViolationError" in str(e) or "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="SKU code already exists.")
        raise HTTPException(status_code=400, detail="Failed to create SKU. Please check your inputs.")

@router.get("/skus", response_model=List[SKUResponse])
async def list_skus(
    product_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    low_stock_only: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(SKU)
    
    if product_type:
        query = query.where(SKU.product_type == product_type)
    if is_active is not None:
        query = query.where(SKU.is_active == is_active)
    if search:
        query = query.where(SKU.sku_code.ilike(f"%{search}%"))
        
    result = await db.execute(query)
    skus = result.scalars().all()
    
    response = []
    for sku in skus:
        total_stock = await get_total_stock_for_sku(db, sku.id)
        if low_stock_only and total_stock >= sku.reorder_threshold:
            continue
            
        sku_dict = sku.__dict__.copy()
        sku_dict['total_stock'] = total_stock
        response.append(sku_dict)
        
    return response

@router.patch("/skus/{sku_id}", response_model=SKUResponse, dependencies=[Depends(require_role('operations', 'management'))])
async def update_sku(sku_id: int, sku_in: SKUUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SKU).where(SKU.id == sku_id))
    sku = result.scalar_one_or_none()
    if not sku:
        raise HTTPException(status_code=404, detail="SKU not found")
        
    update_data = sku_in.dict(exclude_unset=True)
    
    # Validation if thickness is updated
    if 'thickness_mm' in update_data:
        pt = update_data.get('product_type', sku.product_type)
        val = update_data['thickness_mm']
        if pt in ('hr_coil', 'hr_sheet') and not (1.6 <= val <= 25.0):
             raise HTTPException(status_code=400, detail="HR coil/sheet thickness must be between 1.6 and 25mm")
        elif pt == 'chequered_sheet' and not (2.0 <= val <= 10.0):
             raise HTTPException(status_code=400, detail="Chequered sheet thickness must be between 2 and 10mm")

    for field, value in update_data.items():
        setattr(sku, field, value)
        
    await db.commit()
    await db.refresh(sku)
    
    sku_dict = sku.__dict__.copy()
    sku_dict['total_stock'] = await get_total_stock_for_sku(db, sku.id)
    return sku_dict

@router.get("/skus/{sku_id}", response_model=SKUResponse)
async def get_sku(sku_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SKU).where(SKU.id == sku_id))
    sku = result.scalar_one_or_none()
    if not sku:
        raise HTTPException(status_code=404, detail="SKU not found")
        
    sku_dict = sku.__dict__.copy()
    sku_dict['total_stock'] = await get_total_stock_for_sku(db, sku.id)
    return sku_dict

# --- Transactions & Ledger ---
@router.post("/stock-transactions", response_model=StockTransactionResponse, dependencies=[Depends(require_role('warehouse_staff', 'operations', 'management'))])
async def create_transaction(
    txn_in: StockTransactionCreate, 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify SKU and Warehouse exist
    sku_exists = await db.execute(select(SKU).where(SKU.id == txn_in.sku_id))
    if not sku_exists.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="SKU not found")
        
    wh_exists = await db.execute(select(Warehouse).where(Warehouse.id == txn_in.warehouse_id))
    if not wh_exists.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Warehouse not found")

    txn = await process_stock_transaction(db, txn_in, current_user.id)
    return txn

@router.get("/stock-transactions", response_model=List[StockTransactionResponse])
async def list_transactions(
    sku_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    performed_by_user_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(StockTransaction)
    
    if sku_id:
        query = query.where(StockTransaction.sku_id == sku_id)
    if warehouse_id:
        query = query.where(StockTransaction.warehouse_id == warehouse_id)
    if transaction_type:
        query = query.where(StockTransaction.transaction_type == transaction_type)
    if performed_by_user_id:
        query = query.where(StockTransaction.performed_by_user_id == performed_by_user_id)
        
    query = query.order_by(desc(StockTransaction.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/stock-ledger/{sku_id}", response_model=StockLedgerResponse)
async def get_stock_ledger(sku_id: int, db: AsyncSession = Depends(get_db)):
    sku_exists = await db.execute(select(SKU).where(SKU.id == sku_id))
    if not sku_exists.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="SKU not found")

    total_stock = await get_total_stock_for_sku(db, sku_id)
    
    result = await db.execute(
        select(StockBatch).where(StockBatch.sku_id == sku_id)
    )
    batches = result.scalars().all()
    
    return {
        "sku_id": sku_id,
        "total_stock": total_stock,
        "batches": batches
    }
