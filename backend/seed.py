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
    from app.models.inventory import SKU
    
    sample_skus = [
        SKU(sku_code="HRCOIL001", product_type="hr_coil", thickness_mm=5.0, width_mm=1000.0, grade="A", unit_of_measure="MT", reorder_threshold=10),
        SKU(sku_code="HRSH001", product_type="hr_sheet", thickness_mm=2.5, width_mm=2000.0, grade="B", unit_of_measure="MT", reorder_threshold=20),
        SKU(sku_code="CHS001", product_type="chequered_sheet", thickness_mm=3.0, width_mm=1500.0, grade="C", unit_of_measure="KG", reorder_threshold=30),
    ]
    
    for sku in sample_skus:
        session.add(sku)
    
    try:
        await session.commit()
        print("Successfully seeded SKUs.")
    except Exception as e:
        print(f"Failed to seed SKUs. {e}")
        await session.rollback()

if __name__ == "__main__":
    asyncio.run(seed())
