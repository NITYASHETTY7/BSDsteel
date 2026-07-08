import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.db.session import DATABASE_URL, Base
from app.models.user import User, RoleEnum
from app.models.inventory import SKU, Warehouse, StockBatch, StockTransaction
from app.models.receivables import Customer, Invoice, Payment, InvoiceStatus, PaymentMethod
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
        # HR Coils
        SKU(sku_code="HRCOIL001", product_type="hr_coil", thickness_mm=5.0,  width_mm=1000.0, grade="IS 2062",  unit_of_measure="MT", reorder_threshold=10),
        SKU(sku_code="HRCOIL002", product_type="hr_coil", thickness_mm=12.0, width_mm=1250.0, grade="IS 2062",  unit_of_measure="MT", reorder_threshold=15),
        SKU(sku_code="HRCOIL003", product_type="hr_coil", thickness_mm=2.5,  width_mm=1500.0, grade="E250A",   unit_of_measure="MT", reorder_threshold=20),
        SKU(sku_code="HRCOIL004", product_type="hr_coil", thickness_mm=20.0, width_mm=2000.0, grade="S355JR",  unit_of_measure="MT", reorder_threshold=8),
        SKU(sku_code="HRCOIL005", product_type="hr_coil", thickness_mm=3.15, width_mm=1250.0, grade="IS 2062",  unit_of_measure="MT", reorder_threshold=25),
        SKU(sku_code="HRCOIL006", product_type="hr_coil", thickness_mm=6.0,  width_mm=1500.0, grade="ASTM A36",unit_of_measure="MT", reorder_threshold=18),
        # HR Sheets
        SKU(sku_code="HRSH001",   product_type="hr_sheet", thickness_mm=2.5,  width_mm=2000.0, length_mm=6000.0, grade="IS 2062",  unit_of_measure="MT", reorder_threshold=20),
        SKU(sku_code="HRSH002",   product_type="hr_sheet", thickness_mm=6.0,  width_mm=1500.0, length_mm=3000.0, grade="E350C",   unit_of_measure="MT", reorder_threshold=15),
        SKU(sku_code="HRSH003",   product_type="hr_sheet", thickness_mm=8.0,  width_mm=1500.0, length_mm=6000.0, grade="IS 2062",  unit_of_measure="MT", reorder_threshold=12),
        SKU(sku_code="HRSH004",   product_type="hr_sheet", thickness_mm=16.0, width_mm=2000.0, length_mm=6000.0, grade="SAE 1010",unit_of_measure="MT", reorder_threshold=10),
        SKU(sku_code="HRSH005",   product_type="hr_sheet", thickness_mm=25.0, width_mm=2000.0, length_mm=6000.0, grade="IS 2062",  unit_of_measure="MT", reorder_threshold=8),
        # Chequered Sheets
        SKU(sku_code="CHS001",    product_type="chequered_sheet", thickness_mm=3.0, width_mm=1500.0, length_mm=3000.0, grade="IS 3502", unit_of_measure="MT", reorder_threshold=30),
        SKU(sku_code="CHS002",    product_type="chequered_sheet", thickness_mm=5.0, width_mm=1250.0, length_mm=2500.0, grade="IS 3502", unit_of_measure="MT", reorder_threshold=12),
        SKU(sku_code="CHS003",    product_type="chequered_sheet", thickness_mm=4.0, width_mm=1500.0, length_mm=3000.0, grade="IS 3502", unit_of_measure="MT", reorder_threshold=20),
        SKU(sku_code="CHS004",    product_type="chequered_sheet", thickness_mm=6.0, width_mm=1250.0, length_mm=2500.0, grade="IS 3502", unit_of_measure="MT", reorder_threshold=15),
    ]
    
    for sku in sample_skus:
        session.add(sku)
    await session.commit()
    
    # Clear and re-seed warehouses so IDs are predictable
    await session.execute(Warehouse.__table__.delete())
    await session.commit()

    warehouse_seeds = [
        {"name": "Main Warehouse", "location": "Bangalore HQ"},
        {"name": "Secondary Warehouse", "location": "Mumbai"},
    ]
    warehouses = []
    for ws in warehouse_seeds:
        wh = Warehouse(name=ws["name"], location=ws["location"])
        session.add(wh)
        await session.commit()
        await session.refresh(wh)
        warehouses.append(wh)
    wh = warehouses[0]  # Main Warehouse for batches

    # Add stock batches
    stocks = [
        # HRCOIL001 (threshold 10)  → LOW      4 MT
        {"sku": sample_skus[0],  "qty": 4,   "batch": "BATCH-2026-001"},
        # HRCOIL002 (threshold 15)  → Healthy  62 MT
        {"sku": sample_skus[1],  "qty": 62,  "batch": "BATCH-2026-002"},
        # HRCOIL003 (threshold 20)  → LOW      3 MT
        {"sku": sample_skus[2],  "qty": 3,   "batch": "BATCH-2026-003"},
        # HRCOIL004 (threshold 8)   → Healthy  95 MT
        {"sku": sample_skus[3],  "qty": 95,  "batch": "BATCH-2026-004"},
        # HRCOIL005 (threshold 25)  → Marginal 28 MT
        {"sku": sample_skus[4],  "qty": 28,  "batch": "BATCH-2026-005"},
        # HRCOIL006 (threshold 18)  → Healthy  74 MT
        {"sku": sample_skus[5],  "qty": 74,  "batch": "BATCH-2026-006"},
        # HRSH001   (threshold 20)  → Healthy  52 MT
        {"sku": sample_skus[6],  "qty": 52,  "batch": "BATCH-2026-007"},
        # HRSH002   (threshold 15)  → LOW      6 MT
        {"sku": sample_skus[7],  "qty": 6,   "batch": "BATCH-2026-008"},
        # HRSH003   (threshold 12)  → Healthy  38 MT
        {"sku": sample_skus[8],  "qty": 38,  "batch": "BATCH-2026-009"},
        # HRSH004   (threshold 10)  → Marginal 11 MT
        {"sku": sample_skus[9],  "qty": 11,  "batch": "BATCH-2026-010"},
        # HRSH005   (threshold 8)   → Healthy  45 MT
        {"sku": sample_skus[10], "qty": 45,  "batch": "BATCH-2026-011"},
        # CHS001    (threshold 30)  → Healthy  88 MT
        {"sku": sample_skus[11], "qty": 88,  "batch": "BATCH-2026-012"},
        # CHS002    (threshold 12)  → LOW      5 MT
        {"sku": sample_skus[12], "qty": 5,   "batch": "BATCH-2026-013"},
        # CHS003    (threshold 20)  → Marginal 22 MT
        {"sku": sample_skus[13], "qty": 22,  "batch": "BATCH-2026-014"},
        # CHS004    (threshold 15)  → Healthy  57 MT
        {"sku": sample_skus[14], "qty": 57,  "batch": "BATCH-2026-015"},
    ]

    for i, stock in enumerate(stocks):
        if stock["qty"] > 0:
            batch = StockBatch(sku_id=stock["sku"].id, warehouse_id=wh.id, batch_number=stock["batch"], quantity_on_hand=stock["qty"], unit_cost=45000.0)
            session.add(batch)
            tx = StockTransaction(sku_id=stock["sku"].id, warehouse_id=wh.id, transaction_type="opening_stock", quantity=stock["qty"], performed_by_user_id=admin_id)
            session.add(tx)
    
    # Add receivables data
    from app.models.receivables import Customer, Invoice, Payment, InvoiceStatus, PaymentMethod
    from app.models.receivables import CollectionNote, ReminderLog, InvoiceItem
    from datetime import datetime, timedelta
    
    # Truncate in FK-safe order (children first)
    await session.execute(ReminderLog.__table__.delete())
    await session.execute(CollectionNote.__table__.delete())
    await session.execute(Payment.__table__.delete())
    await session.execute(InvoiceItem.__table__.delete())
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
        Invoice(customer_id=customers[0].id, invoice_number="INV-2026-001", due_date=now - timedelta(days=15), total_amount=240000, amount_paid=0, status=InvoiceStatus.overdue, branch="Peenya", created_by_user_id=admin_id),
        Invoice(customer_id=customers[0].id, invoice_number="INV-2026-002", due_date=now + timedelta(days=10), total_amount=150000, amount_paid=50000, status=InvoiceStatus.partially_paid, branch="Peenya", created_by_user_id=admin_id),
        Invoice(customer_id=customers[1].id, invoice_number="INV-2026-003", due_date=now - timedelta(days=40), total_amount=400000, amount_paid=100000, status=InvoiceStatus.overdue, branch="New Bamboo Bazar", created_by_user_id=admin_id),
        Invoice(customer_id=customers[2].id, invoice_number="INV-2026-004", due_date=now + timedelta(days=30), total_amount=500000, amount_paid=500000, status=InvoiceStatus.paid, branch="Hosur", created_by_user_id=admin_id),
        Invoice(customer_id=customers[1].id, invoice_number="INV-2026-005", due_date=now - timedelta(days=65), total_amount=250000, amount_paid=0, status=InvoiceStatus.overdue, branch="New Bamboo Bazar", created_by_user_id=admin_id),
        Invoice(customer_id=customers[2].id, invoice_number="INV-2026-006", due_date=now - timedelta(days=5), total_amount=180000, amount_paid=0, status=InvoiceStatus.overdue, branch="Hosur", created_by_user_id=admin_id),
        Invoice(customer_id=customers[0].id, invoice_number="INV-2026-007", due_date=now + timedelta(days=20), total_amount=320000, amount_paid=0, status=InvoiceStatus.partially_paid, branch="Peenya", created_by_user_id=admin_id),
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
