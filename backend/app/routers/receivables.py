from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, require_role, RoleEnum
from app.schemas.receivables import (
    CustomerCreate,
    CustomerUpdate,
    CustomerOut,
    InvoiceCreate,
    InvoiceOut,
    PaymentCreate,
    PaymentOut,
    CollectionNoteCreate,
    CollectionNoteOut,
    ReminderLogCreate,
    ReminderLogOut,
)
from app.models.receivables import Customer, Invoice, Payment, CollectionNote, ReminderLog
from app.services import receivables as receivable_service

router = APIRouter()

# Customers
@router.post("/customers", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
async def create_customer(payload: CustomerCreate, db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value))):
    new_customer = Customer(**payload.dict())
    db.add(new_customer)
    await db.commit()
    await db.refresh(new_customer)
    return new_customer

@router.get("/customers", response_model=list[CustomerOut])
async def list_customers(search: str = None, db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value, RoleEnum.operations.value)):
    query = db.query(Customer)
    if search:
        query = query.filter(Customer.business_name.ilike(f"%{search}%"))
    result = await query.order_by(Customer.id).all()
    return result

@router.get("/customers/{customer_id}", response_model=CustomerOut)
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value, RoleEnum.operations.value)):
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.patch("/customers/{customer_id}", response_model=CustomerOut)
async def update_customer(customer_id: int, payload: CustomerUpdate, db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value)):
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(customer, attr, value)
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer

# Invoices
@router.post("/invoices", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
async def create_invoice(payload: InvoiceCreate, db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value)):
    new_invoice = Invoice(**payload.dict())
    db.add(new_invoice)
    await db.commit()
    await db.refresh(new_invoice)
    return new_invoice

@router.get("/invoices", response_model=list[InvoiceOut])
async def list_invoices(
    customer_id: int = None,
    status: str = None,
    aging_bucket: str = None,
    overdue_only: bool = False,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value, RoleEnum.operations.value),
):
    query = db.query(Invoice)
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    if status:
        query = query.filter(Invoice.status == status)
    invoices = await query.all()
    # Apply aging filter in Python because bucket depends on due_date and payments
    filtered = []
    for inv in invoices:
        balance = await receivable_service.get_outstanding_balance(db, inv.id)
        bucket = receivable_service.get_aging_bucket(inv.due_date, balance)
        if aging_bucket and bucket != aging_bucket:
            continue
        if overdue_only and bucket == "current":
            continue
        filtered.append(inv)
    return filtered

@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(invoice_id: int, db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value, RoleEnum.operations.value)):
    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/invoices/{invoice_id}/payments", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
async def add_payment(invoice_id: int, payload: PaymentCreate, db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value)):
    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    # Check overpayment
    outstanding = await receivable_service.get_outstanding_balance(db, invoice_id)
    if payload.amount > outstanding:
        raise HTTPException(status_code=400, detail="Payment exceeds outstanding balance")
    payment = Payment(invoice_id=invoice_id, **payload.dict())
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    # Recompute status
    await receivable_service.recompute_invoice_status(db, invoice)
    return payment

# Customer ledger
@router.get("/customers/{customer_id}/ledger")
async def customer_ledger(customer_id: int, db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value, RoleEnum.operations.value)):
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    invoices = await db.execute(db.query(Invoice).filter(Invoice.customer_id == customer_id))
    invoices = invoices.scalars().all()
    payments = await db.execute(db.query(Payment).join(Invoice).filter(Invoice.customer_id == customer_id))
    payments = payments.scalars().all()
    return {"invoices": invoices, "payments": payments}

# Collection notes
@router.post("/collection-notes", response_model=CollectionNoteOut, status_code=status.HTTP_201_CREATED)
async def create_collection_note(payload: CollectionNoteCreate, db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value)):
    note = CollectionNote(**payload.dict())
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note

@router.get("/collection-notes", response_model=list[CollectionNoteOut])
async def list_collection_notes(customer_id: int, db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value, RoleEnum.operations.value)):
    notes = await db.execute(db.query(CollectionNote).filter(CollectionNote.customer_id == customer_id))
    notes = notes.scalars().all()
    return notes

# Aging summary
@router.get("/receivables/aging-summary")
async def aging_summary(db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value, RoleEnum.operations.value)):
    return await receivable_service.aging_summary(db)

# Mock reminder
@router.post("/receivables/{invoice_id}/mock-reminder", response_model=ReminderLogOut)
async def mock_reminder(invoice_id: int, payload: ReminderLogCreate, db: AsyncSession = Depends(get_db), user = Depends(require_role(RoleEnum.accounts_team.value, RoleEnum.management.value)):
    # Stub: just create log entry
    log = ReminderLog(invoice_id=invoice_id, **payload.dict())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log
