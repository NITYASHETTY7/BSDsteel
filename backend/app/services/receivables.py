from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from . import models
from .models.receivables import Invoice, Payment, Customer, InvoiceStatus
from fastapi import HTTPException, status

async def get_outstanding_balance(session: AsyncSession, invoice_id: int) -> float:
    result = await session.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    total_paid_result = await session.execute(select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.invoice_id == invoice_id))
    total_paid = total_paid_result.scalar_one()
    return float(invoice.total_amount) - float(total_paid)

def _days_overdue(due_date: datetime) -> int:
    return (datetime.utcnow() - due_date).days

def get_aging_bucket(due_date: datetime, outstanding_balance: float) -> str:
    if outstanding_balance <= 0:
        return "current"
    days = _days_overdue(due_date)
    if days <= 0:
        return "current"
    if 0 < days <= 30:
        return "0-30"
    if 30 < days <= 60:
        return "30-60"
    return "60-90+"

async def recompute_invoice_status(session: AsyncSession, invoice: Invoice):
    total_paid_result = await session.execute(select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.invoice_id == invoice.id))
    total_paid = total_paid_result.scalar_one()
    if total_paid >= invoice.total_amount:
        invoice.amount_paid = invoice.total_amount
        invoice.status = InvoiceStatus.paid
    elif total_paid == 0:
        invoice.amount_paid = 0
        invoice.status = InvoiceStatus.unpaid
    else:
        invoice.amount_paid = total_paid
        invoice.status = InvoiceStatus.partially_paid
    session.add(invoice)
    await session.commit()
    await session.refresh(invoice)
    return invoice

async def get_customer_total_outstanding(session: AsyncSession, customer_id: int) -> float:
    result = await session.execute(
        select(func.coalesce(func.sum(Invoice.total_amount - func.coalesce(func.sum(Payment.amount), 0)), 0))
        .select_from(Invoice)
        .join(Payment, Payment.invoice_id == Invoice.id, isouter=True)
        .where(Invoice.customer_id == customer_id, Invoice.status != InvoiceStatus.paid)
        .group_by(Invoice.id)
    )
    total = result.scalar_one_or_none() or 0
    return float(total)

async def aging_summary(session: AsyncSession):
    # Get all invoices with outstanding balance
    result = await session.execute(
        select(
            Invoice.id,
            Invoice.due_date,
            Invoice.total_amount,
            func.coalesce(func.sum(Payment.amount), 0).label("paid_amount"),
            Invoice.status,
        )
        .select_from(Invoice)
        .join(Payment, Payment.invoice_id == Invoice.id, isouter=True)
        .group_by(Invoice.id)
    )
    rows = result.fetchall()
    summary = {"0-30": {"count": 0, "total": 0.0}, "30-60": {"count": 0, "total": 0.0}, "60-90+": {"count": 0, "total": 0.0}, "current": {"count": 0, "total": 0.0}}
    for row in rows:
        outstanding = float(row.total_amount) - float(row.paid_amount)
        bucket = get_aging_bucket(row.due_date, outstanding)
        summary[bucket]["count"] += 1
        summary[bucket]["total"] += outstanding
    return summary
