from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.receivables import InvoiceStatus, PaymentMethod

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    business_name: str
    contact_person: str
    phone: str
    email: EmailStr
    billing_address: str
    credit_limit: Optional[Decimal] = None
    is_active: bool = True

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    total_outstanding: Decimal = Decimal("0.0")

    class Config:
        from_attributes = True

# --- InvoiceItem Schemas ---
class InvoiceItemBase(BaseModel):
    t_l_w: str
    section_weight: Decimal
    si_no: str
    item_description: str
    weight: Decimal
    number_of_sheets: int
    weight_per_sheet: Decimal

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItemResponse(InvoiceItemBase):
    id: int
    invoice_id: int

    class Config:
        from_attributes = True

# --- Invoice Schemas ---
class InvoiceBase(BaseModel):
    customer_id: int
    invoice_number: str
    due_date: datetime
    total_amount: Decimal
    reference_note: Optional[str] = None
    branch: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate] = []

class InvoiceResponse(InvoiceBase):
    id: int
    amount_paid: Decimal
    status: InvoiceStatus
    created_by_user_id: int
    invoice_date: datetime
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    items: List[InvoiceItemResponse] = []

    class Config:
        from_attributes = True

# --- Payment Schemas ---
class PaymentBase(BaseModel):
    invoice_id: int
    amount: Decimal
    payment_method: PaymentMethod
    reference_note: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    payment_date: datetime
    recorded_by_user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
