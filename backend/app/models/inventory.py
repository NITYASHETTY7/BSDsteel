import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, Numeric, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.db.session import Base

class ProductTypeEnum(str, enum.Enum):
    hr_coil = "hr_coil"
    hr_sheet = "hr_sheet"
    chequered_sheet = "chequered_sheet"

class UOMEnum(str, enum.Enum):
    MT = "MT"
    KG = "KG"
    PCS = "PCS"

class TransactionTypeEnum(str, enum.Enum):
    inward = "inward"
    outward = "outward"
    adjustment = "adjustment"
    opening_stock = "opening_stock"

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    location = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    batches = relationship("StockBatch", back_populates="warehouse")
    transactions = relationship("StockTransaction", back_populates="warehouse")

class SKU(Base):
    __tablename__ = "skus"

    id = Column(Integer, primary_key=True, index=True)
    sku_code = Column(String, unique=True, index=True, nullable=False)
    product_type = Column(Enum(ProductTypeEnum), nullable=False)
    thickness_mm = Column(Numeric(10, 2), nullable=False)
    width_mm = Column(Numeric(10, 2), nullable=False)
    length_mm = Column(Numeric(10, 2), nullable=True)
    grade = Column(String, nullable=False)
    unit_of_measure = Column(Enum(UOMEnum), nullable=False)
    reorder_threshold = Column(Numeric(15, 2), nullable=False, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    batches = relationship("StockBatch", back_populates="sku")
    transactions = relationship("StockTransaction", back_populates="sku")

class StockBatch(Base):
    __tablename__ = "stock_batches"

    id = Column(Integer, primary_key=True, index=True)
    sku_id = Column(Integer, ForeignKey("skus.id"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    batch_number = Column(String, nullable=False, index=True)
    quantity_on_hand = Column(Numeric(15, 4), nullable=False, default=0)
    unit_cost = Column(Numeric(15, 2), nullable=True)
    received_date = Column(Date, nullable=False, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sku = relationship("SKU", back_populates="batches")
    warehouse = relationship("Warehouse", back_populates="batches")
    transactions = relationship("StockTransaction", back_populates="batch")

class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)
    sku_id = Column(Integer, ForeignKey("skus.id"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("stock_batches.id"), nullable=True, index=True)
    transaction_type = Column(Enum(TransactionTypeEnum), nullable=False)
    quantity = Column(Numeric(15, 4), nullable=False)
    reference_note = Column(String, nullable=True)
    performed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sku = relationship("SKU", back_populates="transactions")
    warehouse = relationship("Warehouse", back_populates="transactions")
    batch = relationship("StockBatch", back_populates="transactions")
    performed_by = relationship("User")
