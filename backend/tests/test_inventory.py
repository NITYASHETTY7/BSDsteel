import pytest
import pytest_asyncio
from httpx import AsyncClient
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.inventory import Warehouse, SKU, StockBatch, StockTransaction

@pytest.mark.asyncio
async def test_sku_creation_success(client: AsyncClient, db: AsyncSession):
    response = await client.post(
        "/api/skus",
        json={
            "sku_code": "HRC-2.0-1250",
            "product_type": "hr_coil",
            "thickness_mm": 2.0,
            "width_mm": 1250,
            "grade": "IS 2062",
            "unit_of_measure": "MT",
            "reorder_threshold": 10.0
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["sku_code"] == "HRC-2.0-1250"
    assert float(data["thickness_mm"]) == 2.0
    assert float(data["total_stock"]) == 0.0

@pytest.mark.asyncio
async def test_sku_creation_invalid_thickness(client: AsyncClient, db: AsyncSession):
    # Invalid thickness for hr_coil (must be 1.6 - 25.0)
    response = await client.post(
        "/api/skus",
        json={
            "sku_code": "HRC-1.0-1250",
            "product_type": "hr_coil",
            "thickness_mm": 1.0, # Too thin
            "width_mm": 1250,
            "grade": "IS 2062",
            "unit_of_measure": "MT",
            "reorder_threshold": 10.0
        }
    )
    assert response.status_code == 422 # Pydantic validation error

@pytest_asyncio.fixture
async def setup_inventory_data(client: AsyncClient, db: AsyncSession):
    # Create Warehouse
    wh_resp = await client.post(
        "/api/warehouses",
        json={"name": "Main WH", "location": "Sector 5"}
    )
    warehouse_id = wh_resp.json()["id"]

    # Create SKU
    sku_resp = await client.post(
        "/api/skus",
        json={
            "sku_code": "CS-3.0-1000",
            "product_type": "chequered_sheet",
            "thickness_mm": 3.0,
            "width_mm": 1000,
            "grade": "IS 2062",
            "unit_of_measure": "MT",
            "reorder_threshold": 50.0
        }
    )
    sku_id = sku_resp.json()["id"]

    return warehouse_id, sku_id

@pytest.mark.asyncio
async def test_inward_and_outward_stock_transaction(client: AsyncClient, db: AsyncSession, setup_inventory_data):
    warehouse_id, sku_id = setup_inventory_data

    # Inward transaction
    in_resp = await client.post(
        "/api/stock-transactions",
        json={
            "sku_id": sku_id,
            "warehouse_id": warehouse_id,
            "batch_number": "BATCH-001",
            "transaction_type": "inward",
            "quantity": 100.5,
            "unit_cost": 50000.0,
            "reference_note": "PO-999"
        }
    )
    assert in_resp.status_code == 200
    inward_data = in_resp.json()
    batch_id = inward_data["batch_id"]

    # Test total stock calculation
    ledger_resp = await client.get(f"/api/stock-ledger/{sku_id}")
    assert ledger_resp.status_code == 200
    assert float(ledger_resp.json()["total_stock"]) == 100.5

    # Outward transaction (Valid)
    out_resp = await client.post(
        "/api/stock-transactions",
        json={
            "sku_id": sku_id,
            "warehouse_id": warehouse_id,
            "batch_id": batch_id,
            "transaction_type": "outward",
            "quantity": -40.5,
            "reference_note": "DISPATCH-123"
        }
    )
    assert out_resp.status_code == 200

    # Total stock should now be 60.0
    ledger_resp = await client.get(f"/api/stock-ledger/{sku_id}")
    assert float(ledger_resp.json()["total_stock"]) == 60.0

@pytest.mark.asyncio
async def test_outward_transaction_exceeding_stock(client: AsyncClient, db: AsyncSession, setup_inventory_data):
    warehouse_id, sku_id = setup_inventory_data

    # Inward 50
    in_resp = await client.post(
        "/api/stock-transactions",
        json={
            "sku_id": sku_id,
            "warehouse_id": warehouse_id,
            "batch_number": "BATCH-002",
            "transaction_type": "inward",
            "quantity": 50.0,
            "unit_cost": 50000.0,
            "reference_note": "PO-1000"
        }
    )
    batch_id = in_resp.json()["batch_id"]

    # Try outward 60 (should fail)
    out_resp = await client.post(
        "/api/stock-transactions",
        json={
            "sku_id": sku_id,
            "warehouse_id": warehouse_id,
            "batch_id": batch_id,
            "transaction_type": "outward",
            "quantity": -60.0,
            "reference_note": "DISPATCH-999"
        }
    )
    assert out_resp.status_code == 400
    assert "Insufficient stock" in out_resp.json()["detail"]
