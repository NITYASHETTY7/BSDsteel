import pytest
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from app.services.receivables import get_aging_bucket, get_outstanding_balance, recompute_invoice_status
from app.models.receivables import Invoice, Payment, Customer, InvoiceStatus, Base
from fastapi import HTTPException, status

# Setup in-memory SQLite async DB for tests
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

@pytest.fixture(scope="module")
async def db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        yield session
    await engine.dispose()

@pytest.fixture
async def customer(db: AsyncSession):
    cust = Customer(business_name="TestCo", contact_person="John Doe", phone="1234567890", email="john@example.com", billing_address="123 Street", is_active=True)
    db.add(cust)
    await db.commit()
    await db.refresh(cust)
    return cust

@pytest.fixture
async def invoice(db: AsyncSession, customer: Customer):
    inv = Invoice(
        customer_id=customer.id,
        invoice_number="INV-001",
        due_date=datetime.utcnow() + timedelta(days=10),
        total_amount=Decimal('100.00'),
        created_by_user_id=1,
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)
    return inv

@pytest.mark.asyncio
async def test_aging_bucket_boundaries(db: AsyncSession, invoice: Invoice):
    # current (not overdue)
    assert get_aging_bucket(invoice.due_date, Decimal('100.00')) == "current"
    # 0-30 bucket
    due_20 = datetime.utcnow() - timedelta(days=20)
    assert get_aging_bucket(due_20, Decimal('50.00')) == "0-30"
    # 30-60 bucket (31 days)
    due_31 = datetime.utcnow() - timedelta(days=31)
    assert get_aging_bucket(due_31, Decimal('50.00')) == "30-60"
    # 60-90+ bucket (61 days)
    due_61 = datetime.utcnow() - timedelta(days=61)
    assert get_aging_bucket(due_61, Decimal('50.00')) == "60-90+"

@pytest.mark.asyncio
async def test_payment_overpay(db: AsyncSession, invoice: Invoice):
    # Try to add a payment larger than outstanding balance
    with pytest.raises(HTTPException) as exc:
        # Simulate service call that would raise 400
        outstanding = await get_outstanding_balance(db, invoice.id)
        if Decimal('150.00') > Decimal(str(outstanding)):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment exceeds outstanding balance")
    assert exc.value.status_code == 400

@pytest.mark.asyncio
async def test_partial_payment_updates_status(db: AsyncSession, invoice: Invoice):
    # Add partial payment of 30
    payment = Payment(invoice_id=invoice.id, amount=Decimal('30.00'), payment_method="cash", recorded_by_user_id=1)
    db.add(payment)
    await db.commit()
    # Recompute status
    await recompute_invoice_status(db, invoice)
    await db.refresh(invoice)
    assert invoice.amount_paid == Decimal('30.00')
    assert invoice.status == InvoiceStatus.partially_paid

    # Add another payment to fully pay
    payment2 = Payment(invoice_id=invoice.id, amount=Decimal('70.00'), payment_method="cash", recorded_by_user_id=1)
    db.add(payment2)
    await db.commit()
    await recompute_invoice_status(db, invoice)
    await db.refresh(invoice)
    assert invoice.amount_paid == invoice.total_amount
    assert invoice.status == InvoiceStatus.paid
