import pytest
import json
from app import create_app

@pytest.fixture
def client():
    app, _ = create_app({"TESTING": True})
    with app.test_client() as client:
        yield client

def test_db_admin_list_tables(client):
    res = client.get("/api/admin/db/tables")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    table_names = [t["name"] for t in data["tables"]]
    assert "users" in table_names
    assert "products" in table_names
    assert "coupons" in table_names
    assert "product_reviews" in table_names

def test_db_admin_get_table_data(client):
    res = client.get("/api/admin/db/table/coupons")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    assert data["table_name"] == "coupons"
    assert data["total_rows"] >= 4
    assert len(data["rows"]) >= 4

def test_db_admin_update_row(client):
    # Fetch first coupon
    res = client.get("/api/admin/db/table/coupons")
    data = res.get_json()
    first_coupon = data["rows"][0]
    c_id = first_coupon["id"]
    original_desc = first_coupon["description"]

    # Update description
    update_res = client.put(
        f"/api/admin/db/table/coupons/{c_id}",
        json={"description": "Updated Test Discount"}
    )
    assert update_res.status_code == 200
    up_data = update_res.get_json()
    assert up_data["status"] == "success"
    assert up_data["updated_row"]["description"] == "Updated Test Discount"

    # Restore description
    client.put(
        f"/api/admin/db/table/coupons/{c_id}",
        json={"description": original_desc}
    )

def test_db_admin_invalid_table(client):
    res = client.get("/api/admin/db/table/non_existent_table")
    assert res.status_code == 404
