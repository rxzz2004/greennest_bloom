import pytest
from app import create_app
from models import db, Coupon, ProductReview, PushNotificationToken, Product

@pytest.fixture
def client():
    app, _ = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        # Seed test coupons
        c1 = Coupon(
            code="TEST15",
            description="15% Off",
            discount_type="percent",
            discount_value=15.0,
            min_order_amount=500.0,
            max_discount_amount=200.0,
            is_active=True
        )
        c2 = Coupon(
            code="FLAT50",
            description="Flat 50",
            discount_type="flat",
            discount_value=50.0,
            min_order_amount=200.0,
            is_active=True
        )
        db.session.add_all([c1, c2])
        db.session.commit()
        yield app.test_client()

def test_coupon_validation_success(client):
    res = client.post("/api/coupons/validate", json={"code": "TEST15", "subtotal": 1000.0})
    assert res.status_code == 200
    data = res.get_json()
    assert data["valid"] is True
    assert data["discount_amount"] == 150.0
    assert data["discounted_subtotal"] == 850.0

def test_coupon_validation_cap(client):
    # 15% of 2000 is 300, but cap is 200
    res = client.post("/api/coupons/validate", json={"code": "TEST15", "subtotal": 2000.0})
    assert res.status_code == 200
    data = res.get_json()
    assert data["discount_amount"] == 200.0

def test_coupon_minimum_order_failure(client):
    res = client.post("/api/coupons/validate", json={"code": "TEST15", "subtotal": 300.0})
    assert res.status_code == 400
    data = res.get_json()
    assert data["valid"] is False

def test_coupon_invalid_code(client):
    res = client.post("/api/coupons/validate", json={"code": "NONEXISTENT", "subtotal": 1000.0})
    assert res.status_code == 404
    data = res.get_json()
    assert data["valid"] is False

def test_product_review_flow(client):
    # Post a review for existing product 1
    post_res = client.post("/api/products/1/reviews", json={
        "reviewer_name": "Radha Krishna",
        "rating": 5,
        "review_title": "Exquisite blooms",
        "review_text": "Velvety petals and wonderful natural fragrance.",
        "photo_url": "https://example.com/flower_photo.jpg"
    })
    assert post_res.status_code == 201
    post_data = post_res.get_json()
    assert post_data["status"] == "success"

    # Get reviews
    get_res = client.get("/api/products/1/reviews")
    assert get_res.status_code == 200
    get_data = get_res.get_json()
    assert get_data["total_reviews"] >= 1
    assert get_data["average_rating"] == 5.0
    assert len(get_data["customer_photos"]) >= 1

def test_push_token_registration(client):
    res = client.post("/api/notifications/register-token", json={
        "token": "test_push_token_chrome_12345",
        "platform": "web",
        "device_info": "MacBook Pro Chrome"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["status"] == "success"

    # Verify duplicate token refresh
    res_refresh = client.post("/api/notifications/register-token", json={
        "token": "test_push_token_chrome_12345",
        "platform": "web",
        "device_info": "MacBook Pro Chrome Refreshed"
    })
    assert res_refresh.status_code == 200
