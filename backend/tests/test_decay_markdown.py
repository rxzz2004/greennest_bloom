from datetime import date, timedelta
import pytest
from app import create_app
from models import db, Product, PerishableBatch
from services.decay_service import DecayService

@pytest.fixture
def client():
    app, _ = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()

def test_decay_curve_tiers():
    # Day 1-2: fresh (0% markdown)
    d1, s1 = DecayService.calculate_decay_tier(1, vase_life=5)
    assert d1 == 0.0
    assert s1 == "fresh"

    # Day 3: prime (20% markdown)
    d3, s3 = DecayService.calculate_decay_tier(3, vase_life=5)
    assert d3 == 20.0
    assert s3 == "prime"

    # Day 4: clearance (45% markdown)
    d4, s4 = DecayService.calculate_decay_tier(4, vase_life=5)
    assert d4 == 45.0
    assert s4 == "clearance"

    # Day 5: flash clearance (75% markdown)
    d5, s5 = DecayService.calculate_decay_tier(5, vase_life=5)
    assert d5 == 75.0
    assert s5 == "clearance"

def test_fefo_allocation(client):
    product = Product(
        name="Test Rose",
        category="cut_flower",
        is_perishable=True,
        base_price=50.0
    )
    db.session.add(product)
    db.session.commit()

    today = date.today()
    # Older batch (harvested 3 days ago)
    b_older = PerishableBatch(
        product_id=product.id,
        batch_code="B-OLD",
        harvest_date=today - timedelta(days=3),
        initial_quantity=20,
        remaining_quantity=20,
        discount_percent=20.0
    )
    # Newer batch (harvested 1 day ago)
    b_newer = PerishableBatch(
        product_id=product.id,
        batch_code="B-NEW",
        harvest_date=today - timedelta(days=1),
        initial_quantity=50,
        remaining_quantity=50,
        discount_percent=0.0
    )
    db.session.add_all([b_older, b_newer])
    db.session.commit()

    # Request 25 units - should take all 20 from B-OLD first, and 5 from B-NEW
    alloc, msg = DecayService.get_fefo_allocation(product.id, 25)
    assert alloc is not None
    assert len(alloc) == 2
    assert alloc[0]["batch_code"] == "B-OLD"
    assert alloc[0]["quantity"] == 20
    assert alloc[1]["batch_code"] == "B-NEW"
    assert alloc[1]["quantity"] == 5
