from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List

from app.api.deps import get_db, get_current_user, require_role
from app.models.user import User, RoleEnum
from app.models.receivables import Customer, Invoice, InvoiceItem, Payment, InvoiceStatus, ReminderLog, ReminderChannel
from app.schemas.receivables import CustomerCreate, CustomerResponse, InvoiceCreate, InvoiceResponse, PaymentCreate, PaymentResponse

router = APIRouter()

# --- Customers ---
@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.accounts_team, RoleEnum.operations, RoleEnum.management))
):
    result = await db.execute(select(Customer).where(Customer.is_active == True))
    customers = result.scalars().all()
    return customers

@router.post("/customers", response_model=CustomerResponse)
async def create_customer(
    customer_data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.accounts_team, RoleEnum.operations, RoleEnum.management))
):
    new_customer = Customer(**customer_data.model_dump())
    db.add(new_customer)
    await db.commit()
    await db.refresh(new_customer)
    return new_customer

# --- Invoices ---
@router.get("/invoices", response_model=List[InvoiceResponse])
async def list_invoices(
    status_filter: InvoiceStatus = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.accounts_team, RoleEnum.operations, RoleEnum.management))
):
    query = select(Invoice).options(selectinload(Invoice.customer), selectinload(Invoice.items))
    if status_filter:
        query = query.where(Invoice.status == status_filter)
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    return invoices

@router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(
    invoice_data: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.accounts_team, RoleEnum.management))
):
    invoice_dict = invoice_data.model_dump()
    items_data = invoice_dict.pop("items", [])
    
    new_invoice = Invoice(
        **invoice_dict,
        created_by_user_id=current_user.id
    )
    db.add(new_invoice)
    await db.commit()
    await db.refresh(new_invoice)
    
    for item_data in items_data:
        new_item = InvoiceItem(
            **item_data,
            invoice_id=new_invoice.id
        )
        db.add(new_item)
    
    if items_data:
        await db.commit()
    
    # Reload with customer and items
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.customer), selectinload(Invoice.items))
        .where(Invoice.id == new_invoice.id)
    )
    return result.scalar_one()

# --- Payments ---
@router.post("/invoices/{invoice_id}/payments", response_model=PaymentResponse)
async def record_payment(
    invoice_id: int,
    payment_data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.accounts_team, RoleEnum.management))
):
    if invoice_id != payment_data.invoice_id:
        raise HTTPException(status_code=400, detail="Invoice ID mismatch")

    # Fetch invoice
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    new_payment = Payment(
        **payment_data.model_dump(),
        recorded_by_user_id=current_user.id
    )
    db.add(new_payment)
    
    # Update Invoice
    invoice.amount_paid += payment_data.amount
    if invoice.amount_paid >= invoice.total_amount:
        invoice.status = InvoiceStatus.paid
    else:
        invoice.status = InvoiceStatus.partially_paid

    await db.commit()
    await db.refresh(new_payment)
    return new_payment

# --- Reminders ---
@router.post("/invoices/{invoice_id}/remind")
async def send_reminder(
    invoice_id: int,
    channel: ReminderChannel,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.accounts_team, RoleEnum.management))
):
    # Mock sending a reminder
    log = ReminderLog(
        invoice_id=invoice_id,
        channel=channel,
        triggered_by_user_id=current_user.id,
        status="mock_sent"
    )
    db.add(log)
    await db.commit()
    return {"status": "success", "message": f"Reminder mock sent via {channel.value}"}
