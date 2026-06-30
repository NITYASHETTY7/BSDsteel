from sqlalchemy import Column, Integer, String, DateTime, Boolean, Numeric, ForeignKey, Enum, Text, func
from sqlalchemy.orm import relationship
import enum
from app.db.session import Base

class RoleEnum(str, enum.Enum):
    accounts_team = "accounts_team"
    management = "management"
    operations = "operations"
    warehouse_staff = "warehouse_staff"

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String, nullable=False)
    contact_person = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    billing_address = Column(Text, nullable=False)
    credit_limit = Column(Numeric(12, 2), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    invoices = relationship("Invoice", back_populates="customer")
    collection_notes = relationship("CollectionNote", back_populates="customer")

class InvoiceStatus(str, enum.Enum):
    unpaid = "unpaid"
    partially_paid = "partially_paid"
    paid = "paid"
    overdue = "overdue"

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    invoice_number = Column(String, unique=True, nullable=False)
    invoice_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    amount_paid = Column(Numeric(12, 2), default=0)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.unpaid)
    reference_note = Column(Text, nullable=True)
    branch = Column(String, nullable=True)
    created_by_user_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")
    collection_notes = relationship("CollectionNote", back_populates="invoice")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    t_l_w = Column(String, nullable=False)
    section_weight = Column(Numeric(10, 2), nullable=False)
    si_no = Column(String, nullable=False)
    item_description = Column(String, nullable=False)
    weight = Column(Numeric(12, 2), nullable=False)
    number_of_sheets = Column(Integer, nullable=False)
    weight_per_sheet = Column(Numeric(10, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="items")

class PaymentMethod(str, enum.Enum):
    cash = "cash"
    bank_transfer = "bank_transfer"
    cheque = "cheque"
    upi = "upi"
    other = "other"

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    reference_note = Column(Text, nullable=True)
    recorded_by_user_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    invoice = relationship("Invoice", back_populates="payments")

class CollectionNote(Base):
    __tablename__ = "collection_notes"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    note_text = Column(Text, nullable=False)
    created_by_user_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="collection_notes")
    invoice = relationship("Invoice", back_populates="collection_notes")

class ReminderChannel(str, enum.Enum):
    whatsapp = "whatsapp"
    email = "email"

class ReminderLog(Base):
    __tablename__ = "reminder_logs"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    channel = Column(Enum(ReminderChannel), nullable=False)
    triggered_by_user_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="mock_sent")

    invoice = relationship("Invoice")
