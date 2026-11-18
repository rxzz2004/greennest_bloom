import pytest
from app import create_app
from models import db, User, Subscription

@pytest.fixture
def client():
    app, _ = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        db.create_all()
        # Seed an individual user
        user = User(
            email="subscriber@example.com",
            password_hash="testhash",
            full_name="Ananya Sharma",
            user_type="individual",
            address="124 Indiranagar, Bengaluru, 560038"
        )
        db.session.add(user)
        db.session.commit()

        yield app.test_client()
        db.session.remove()
        db.drop_all()

def test_get_subscription_tiers(client):
    res = client.get("/api/subscriptions/tiers")
    assert res.status_code == 200
    tiers = res.get_json()["tiers"]
    assert len(tiers) >= 3
    tier_keys = [t["tier"] for t in tiers]
    assert "basic" in tier_keys
    assert "premium" in tier_keys
    assert "luxury" in tier_keys

def test_unpaid_user_cannot_change_plan(client):
    # User has no active paid subscription yet
    res = client.post("/api/subscriptions/change-plan", json={
        "user_email": "subscriber@example.com",
        "tier": "luxury"
    })
    assert res.status_code == 400
    data = res.get_json()
    assert "No active subscription found" in data["error"]

def test_subscribe_and_change_plan_workflow(client):
    # 1. User pays for basic subscription
    res_sub = client.post("/api/subscriptions/create", json={
        "user_email": "subscriber@example.com",
        "tier": "basic",
        "delivery_address": "124 Indiranagar, Bengaluru"
    })
    assert res_sub.status_code == 201
    sub_data = res_sub.get_json()["subscription"]
    assert sub_data["tier"] == "basic"
    assert sub_data["status"] == "active"
    assert sub_data["monthly_price"] == 999.0

    # 2. Check active subscriptions endpoint returns only 1 active subscription
    res_list = client.get("/api/subscriptions?email=subscriber@example.com")
    assert res_list.status_code == 200
    subs = res_list.get_json()["subscriptions"]
    assert len(subs) == 1
    assert subs[0]["tier"] == "basic"

    # 3. Now that user has paid, they change plan to premium
    res_change = client.post("/api/subscriptions/change-plan", json={
        "user_email": "subscriber@example.com",
        "tier": "premium",
        "delivery_address": "124 Indiranagar, Bengaluru"
    })
    assert res_change.status_code == 200
    change_data = res_change.get_json()["subscription"]
    assert change_data["tier"] == "premium"
    assert change_data["status"] == "active"
    assert change_data["monthly_price"] == 1899.0

    # 4. Check active subscriptions: old basic plan is superseded, strictly 1 active subscription
    res_list_after = client.get("/api/subscriptions?email=subscriber@example.com")
    assert res_list_after.status_code == 200
    active_subs = res_list_after.get_json()["subscriptions"]
    assert len(active_subs) == 1
    assert active_subs[0]["tier"] == "premium"

def test_cancel_subscription(client):
    # Subscribe first
    client.post("/api/subscriptions/create", json={
        "user_email": "subscriber@example.com",
        "tier": "luxury"
    })
    # Verify active
    res_before = client.get("/api/subscriptions?email=subscriber@example.com")
    assert len(res_before.get_json()["subscriptions"]) == 1

    # Cancel
    res_cancel = client.post("/api/subscriptions/cancel", json={
        "user_email": "subscriber@example.com"
    })
    assert res_cancel.status_code == 200

    # Verify no active subscription
    res_after = client.get("/api/subscriptions?email=subscriber@example.com")
    assert len(res_after.get_json()["subscriptions"]) == 0
