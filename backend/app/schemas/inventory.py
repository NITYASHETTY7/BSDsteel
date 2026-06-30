from pydantic import BaseModel, validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date
from app.models.inventory import ProductTypeEnum, UOMEnum, TransactionTypeEnum

# Warehouse
class WarehouseBase(BaseModel):
    name: str
    location: str
    is_active: bool = True

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseResponse(WarehouseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# SKU
class SKUBase(BaseModel):
    sku_code: str
    product_type: ProductTypeEnum
    thickness_mm: Decimal
    width_mm: Decimal
    length_mm: Optional[Decimal] = None
    grade: str
    unit_of_measure: UOMEnum
    reorder_threshold: Decimal = Decimal("0")
    is_active: bool = True

    @validator('thickness_mm')
    def validate_thickness(cls, v, values):
        pt = values.get('product_type')
        if pt in (ProductTypeEnum.hr_coil, ProductTypeEnum.hr_sheet):
            if not (Decimal("1.6") <= v <= Decimal("25.0")):
                raise ValueError("HR coil/sheet thickness must be between 1.6 and 25mm")
        elif pt == ProductTypeEnum.chequered_sheet:
            if not (Decimal("2.0") <= v <= Decimal("10.0")):
                raise ValueError("Chequered sheet thickness must be between 2 and 10mm")
        return v

class SKUCreate(SKUBase):
    pass

class SKUUpdate(BaseModel):
    thickness_mm: Optional[Decimal] = None
    width_mm: Optional[Decimal] = None
    length_mm: Optional[Decimal] = None
    grade: Optional[str] = None
    unit_of_measure: Optional[UOMEnum] = None
    reorder_threshold: Optional[Decimal] = None
    is_active: Optional[bool] = None

class SKUResponse(SKUBase):
    id: int
    created_at: datetime
    updated_at: datetime
    total_stock: Optional[Decimal] = None

    class Config:
        from_attributes = True

# Stock Batch
class StockBatchResponse(BaseModel):
    id: int
    sku_id: int
    warehouse_id: int
    batch_number: str
    quantity_on_hand: Decimal
    unit_cost: Optional[Decimal] = None
    received_date: date

    class Config:
        from_attributes = True

class StockLedgerResponse(BaseModel):
    sku_id: int
    total_stock: Decimal
    batches: List[StockBatchResponse]

# Stock Transaction
class StockTransactionCreate(BaseModel):
    sku_id: int
    warehouse_id: int
    batch_id: Optional[int] = None
    batch_number: Optional[str] = None # Used for inward to create/find batch
    transaction_type: TransactionTypeEnum
    quantity: Decimal
    reference_note: Optional[str] = None
    unit_cost: Optional[Decimal] = None # Used for inward to set batch cost

class StockTransactionResponse(BaseModel):
    id: int
    sku_id: int
    warehouse_id: int
    batch_id: Optional[int] = None
    transaction_type: TransactionTypeEnum
    quantity: Decimal
    reference_note: Optional[str] = None
    performed_by_user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
