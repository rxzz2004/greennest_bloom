import pytest
from app import create_app
from models import db, User, Order, OrderItem, DeliveryPartner, DeliveryTelemetry, SystemAlert

@pytest.fixture
def client():
    app, _ = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        db.create_all()
        # Seed test user
        user = User(
            full_name="Niyam Shetty",
            email="niyam@example.com",
            password_hash="test",
            user_type="corporate"
        )
        db.session.add(user)
        db.session.commit()

        # Seed test courier
        driver = DeliveryPartner(
            full_name="Ramesh Kumar",
            phone="+91 98765 43210",
            email="ramesh@example.com",
            vehicle_type="Refrigerated EV Van",
            vehicle_number="KA-14-EV-4402",
            status="available",
            current_lat=13.6934,
            current_lng=75.2448,
            speed_kmh=0.0,
            battery_level=90
        )
        db.session.add(driver)
        db.session.commit()

        # Seed test order
        order = Order(
            user_id=user.id,
            order_number="GNB-TEST-001",
            order_type="b2c_retail",
            subtotal=1000.0,
            total_amount=1050.0,
            shipping_address="Indiranagar, Bengaluru, 560038"
        )
        db.session.add(order)
        db.session.commit()

        item = OrderItem(
            order_id=order.id,
            item_name="Oriental Pink Lilies",
            quantity=5,
            unit_price=200.0,
            total_price=1000.0
        )
        db.session.add(item)
        db.session.commit()

        yield app.test_client()
        db.session.remove()
        db.drop_all()

def test_assign_courier_and_notify_customer(client):
    res = client.post("/api/telemetry/orders/1/assign-courier", json={"driver_id": 1})
    assert res.status_code == 200
    data = res.get_json()
    assert data["order"]["order_status"] == "in_transit"
    assert data["driver"]["active_order_id"] == 1

    # Check alert was logged
    alert = SystemAlert.query.filter_by(alert_type="courier_assigned").first()
    assert alert is not None
    assert "Ramesh Kumar" in alert.body

def test_driver_orders_list(client):
    client.post("/api/telemetry/orders/1/assign-courier", json={"driver_id": 1})
    res = client.get("/api/telemetry/drivers/1/orders")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["orders"]) >= 1
    assert data["assigned_order_id"] == 1

def test_driver_mark_delivered(client):
    client.post("/api/telemetry/orders/1/assign-courier", json={"driver_id": 1})
    res = client.post("/api/telemetry/drivers/1/orders/1/deliver", json={"notes": "Handed at door"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["order"]["order_status"] == "delivered"
    assert data["driver"]["completed_deliveries"] == 1

    # Check delivery confirmation alert
    alert = SystemAlert.query.filter_by(alert_type="order_delivered").first()
    assert alert is not None
    assert "Successfully Delivered" in alert.body

def test_driver_customer_unavailable(client):
    client.post("/api/telemetry/orders/1/assign-courier", json={"driver_id": 1})
    res = client.post("/api/telemetry/drivers/1/orders/1/customer-unavailable", json={"reason": "Doorbell unanswered"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["order"]["order_status"] == "attempted_undelivered"

    # Check exception alert
    alert = SystemAlert.query.filter_by(alert_type="customer_unavailable").first()
    assert alert is not None
    assert "Doorbell unanswered" in alert.body
