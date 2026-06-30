import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.db.session import DATABASE_URL, Base
from app.models.user import User, RoleEnum
from app.core.security import get_password_hash

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    password_hash = get_password_hash("demo1234")

    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        seed_users = [
            {"full_name": "Warehouse Staff",    "email": "warehouse@bsdsteel.in", "role": RoleEnum.warehouse_staff},
            {"full_name": "Accounts Team",       "email": "accounts@bsdsteel.in",  "role": RoleEnum.accounts_team},
            {"full_name": "Operations Manager",  "email": "ops@bsdsteel.in",       "role": RoleEnum.operations},
            {"full_name": "Admin Management",    "email": "admin@bsdsteel.in",     "role": RoleEnum.management},
        ]
        for u in seed_users:
            result = await session.execute(select(User).where(User.email == u["email"]))
            existing = result.scalar_one_or_none()
            if existing:
                existing.hashed_password = password_hash
                print(f"Updated password for {u['email']}")
            else:
                session.add(User(full_name=u["full_name"], email=u["email"], hashed_password=password_hash, role=u["role"]))
                print(f"Created user {u['email']}")
        try:
            await session.commit()
            print("Seed complete.")
        except Exception as e:
            print(f"Seed failed: {e}")
            await session.rollback()

    # Seed sample SKUs
    from app.models.inventory import SKU, Warehouse, StockBatch, StockTransaction
    
    # Get user 1 for transactions
    result = await session.execute(select(User).limit(1))
    admin_user = result.scalar_one_or_none()
    admin_id = admin_user.id if admin_user else 1

    # First, truncate SKUs and related to avoid duplicates on re-run
    await session.execute(StockTransaction.__table__.delete())
    await session.execute(StockBatch.__table__.delete())
    await session.execute(SKU.__table__.delete())
    await session.commit()
    
    sample_skus = [
        SKU(sku_code="HRCOIL001", product_type="hr_coil", thickness_mm=5.0, width_mm=1000.0, grade="IS 2062", unit_of_measure="MT", reorder_threshold=10),
        SKU(sku_code="HRCOIL002", product_type="hr_coil", thickness_mm=12.0, width_mm=1250.0, grade="IS 2062", unit_of_measure="MT", reorder_threshold=15),
        SKU(sku_code="HRCOIL003", product_type="hr_coil", thickness_mm=2.5, width_mm=1500.0, grade="E250A", unit_of_measure="MT", reorder_threshold=5),
        SKU(sku_code="HRSH001", product_type="hr_sheet", thickness_mm=2.5, width_mm=2000.0, length_mm=6000.0, grade="IS 2062", unit_of_measure="MT", reorder_threshold=20),
        SKU(sku_code="HRSH002", product_type="hr_sheet", thickness_mm=6.0, width_mm=1500.0, length_mm=3000.0, grade="E350C", unit_of_measure="MT", reorder_threshold=15),
        SKU(sku_code="CHS001", product_type="chequered_sheet", thickness_mm=3.0, width_mm=1500.0, length_mm=3000.0, grade="IS 3502", unit_of_measure="MT", reorder_threshold=30),
        SKU(sku_code="CHS002", product_type="chequered_sheet", thickness_mm=5.0, width_mm=1250.0, length_mm=2500.0, grade="IS 3502", unit_of_measure="MT", reorder_threshold=12),
        SKU(sku_code="HRCOIL004", product_type="hr_coil", thickness_mm=20.0, width_mm=2000.0, grade="S355JR", unit_of_measure="MT", reorder_threshold=8),
    ]
    
    for sku in sample_skus:
        session.add(sku)
    await session.commit()
    
    # Ensure warehouse
    result = await session.execute(select(Warehouse).where(Warehouse.name == "Main Yard"))
    wh = result.scalar_one_or_none()
    if not wh:
        wh = Warehouse(name="Main Yard", location="Bangalore")
        session.add(wh)
        await session.commit()
        await session.refresh(wh)

    # Add stock batches
    stocks = [
        # HRCOIL001 (10 threshold) -> Low Stock (5)
        {"sku": sample_skus[0], "qty": 5},
        # HRCOIL002 (15 threshold) -> Healthy (25)
        {"sku": sample_skus[1], "qty": 25},
        # HRCOIL003 (5 threshold) -> Marginal (6)
        {"sku": sample_skus[2], "qty": 6},
        # HRSH001 (20 threshold) -> Healthy (45)
        {"sku": sample_skus[3], "qty": 45},
        # HRSH002 (15 threshold) -> Zero / Low Stock (0)
        {"sku": sample_skus[4], "qty": 0},
        # CHS001 (30 threshold) -> Marginal (32)
        {"sku": sample_skus[5], "qty": 32},
        # CHS002 (12 threshold) -> Low Stock (10)
        {"sku": sample_skus[6], "qty": 10},
        # HRCOIL004 (8 threshold) -> Healthy (100)
        {"sku": sample_skus[7], "qty": 100},
    ]

    for i, stock in enumerate(stocks):
        if stock["qty"] > 0:
            batch = StockBatch(sku_id=stock["sku"].id, warehouse_id=wh.id, batch_number=f"BATCH-2026-{i}", quantity_on_hand=stock["qty"], unit_cost=45000.0)
            session.add(batch)
            tx = StockTransaction(sku_id=stock["sku"].id, warehouse_id=wh.id, transaction_type="opening_stock", quantity=stock["qty"], performed_by_user_id=admin_id)
            session.add(tx)
    
    # Add receivables data
    from app.models.receivables import Customer, Invoice, Payment, InvoiceStatus, PaymentMethod
    from datetime import datetime, timedelta
    
    # Truncate existing receivables
    await session.execute(Payment.__table__.delete())
    await session.execute(Invoice.__table__.delete())
    await session.execute(Customer.__table__.delete())
    await session.commit()
    
    customers = [
        Customer(business_name="Larsen & Toubro Ltd", contact_person="Ravi Kumar", phone="+91 9876543210", email="ravi@lt.com", billing_address="Mumbai", credit_limit=5000000),
        Customer(business_name="Acme Corp", contact_person="Aditi Sharma", phone="+91 8765432109", email="aditi@acme.com", billing_address="Delhi", credit_limit=2000000),
        Customer(business_name="BuildIt Steel", contact_person="John Doe", phone="+91 7654321098", email="john@buildit.com", billing_address="Bangalore", credit_limit=1000000),
    ]
    for c in customers: session.add(c)
    await session.commit()
    
    now = datetime.utcnow()
    invoices = [
        Invoice(customer_id=customers[0].id, invoice_number="INV-2026-001", due_date=now - timedelta(days=15), total_amount=240000, amount_paid=0, status=InvoiceStatus.overdue, created_by_user_id=admin_id),
        Invoice(customer_id=customers[0].id, invoice_number="INV-2026-002", due_date=now + timedelta(days=10), total_amount=150000, amount_paid=50000, status=InvoiceStatus.partially_paid, created_by_user_id=admin_id),
        Invoice(customer_id=customers[1].id, invoice_number="INV-2026-003", due_date=now - timedelta(days=40), total_amount=400000, amount_paid=100000, status=InvoiceStatus.overdue, created_by_user_id=admin_id),
        Invoice(customer_id=customers[2].id, invoice_number="INV-2026-004", due_date=now + timedelta(days=30), total_amount=500000, amount_paid=500000, status=InvoiceStatus.paid, created_by_user_id=admin_id),
        Invoice(customer_id=customers[1].id, invoice_number="INV-2026-005", due_date=now - timedelta(days=65), total_amount=250000, amount_paid=0, status=InvoiceStatus.overdue, created_by_user_id=admin_id),
    ]
    for i in invoices: session.add(i)
    await session.commit()

    payments = [
        Payment(invoice_id=invoices[1].id, amount=50000, payment_method=PaymentMethod.bank_transfer, recorded_by_user_id=admin_id),
        Payment(invoice_id=invoices[2].id, amount=100000, payment_method=PaymentMethod.cheque, recorded_by_user_id=admin_id),
        Payment(invoice_id=invoices[3].id, amount=500000, payment_method=PaymentMethod.upi, recorded_by_user_id=admin_id),
    ]
    for p in payments: session.add(p)

    try:
        await session.commit()
        print("Successfully seeded SKUs and Stock.")
    except Exception as e:
        print(f"Failed to seed SKUs. {e}")
        await session.rollback()

if __name__ == "__main__":
    asyncio.run(seed())
