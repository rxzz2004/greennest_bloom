from datetime import date, timedelta
import pytest
from app import create_app
from models import db, User, EventQuotation
from services.logistics_service import LogisticsService
from services.floriography_service import FloriographyService

@pytest.fixture
def client():
    app, _ = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()

def test_haversine_distance():
    # Nursery Depot coordinates: 13.6934, 75.2448 (Kalmane, Thirthahalli, Karnataka 577432)
    # Regional destination: Shimoga Gateway (approx 44 km)
    dist = LogisticsService.haversine_distance(13.6934, 75.2448, 13.9299, 75.5681)
    assert 40.0 <= dist <= 55.0

    # Nationwide destination: Bengaluru Indiranagar (approx 270 km)
    radius_check_blr = LogisticsService.validate_venue_radius(12.9784, 77.6408)
    assert 240.0 <= radius_check_blr["distance_km"] <= 320.0
    assert radius_check_blr["is_valid"] is True
    assert "Kalmane Mother Nursery" in radius_check_blr["message"]

    # Outside nationwide delivery radius (e.g. 5000+ km away)
    radius_check_far = LogisticsService.validate_venue_radius(50.0, 10.0)
    assert radius_check_far["distance_km"] > 2500.0
    assert radius_check_far["is_valid"] is False

def test_single_event_per_day_guard(client):
    user = User(email="test@corp.com", full_name="Corp", password_hash="pass", user_type="corporate")
    db.session.add(user)
    db.session.commit()

    target_date = date.today() + timedelta(days=20)
    # Book first event
    quote = EventQuotation(
        user_id=user.id,
        event_type="wedding",
        event_date=target_date,
        guest_tier="medium_200",
        venue_address="Test Venue",
        estimated_amount=50000.0,
        status="booked"
    )
    db.session.add(quote)
    db.session.commit()

    # Second check for same date
    availability = LogisticsService.check_event_date_availability(target_date)
    assert availability["is_available"] is False
    assert "already confirmed" in availability["reason"]

def test_floriography_nlp_recommender():
    res = FloriographyService.analyze_sentiment_and_recommend("We are celebrating our romantic anniversary with heartfelt love and passion")
    assert res["detected_category"] == "love_passion"
    assert "Dutch Red Roses" in [f["name"] for f in res["floriography_profile"]["primary_flowers"]]

def test_venue_classifier_service():
    from services.venue_classifier_service import VenueClassifierService
    import io
    import base64
    from PIL import Image, ImageDraw

    # 1. Create a synthetic architectural venue image (16:10 landscape, ceiling, stage, floor)
    venue_img = Image.new("RGB", (800, 500), color=(220, 210, 190))
    draw = ImageDraw.Draw(venue_img)
    # Draw ceiling & ambient lights
    draw.rectangle([0, 0, 800, 120], fill=(245, 235, 210))
    for x in range(50, 750, 100):
        draw.ellipse([x, 40, x + 40, 80], fill=(255, 250, 200))
    # Draw stage backdrop & pillars
    draw.rectangle([100, 120, 700, 380], fill=(160, 120, 90))
    draw.line([150, 120, 150, 380], fill=(80, 50, 30), width=6)
    draw.line([650, 120, 650, 380], fill=(80, 50, 30), width=6)
    # Draw patterned floor
    draw.rectangle([0, 380, 800, 500], fill=(90, 70, 50))
    for x in range(0, 800, 80):
        draw.line([x, 380, x + 40, 500], fill=(140, 110, 80), width=2)

    buf = io.BytesIO()
    venue_img.save(buf, format="JPEG")
    venue_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    result_venue = VenueClassifierService.classify_venue_image(venue_b64)
    assert result_venue["is_venue"] is True
    assert result_venue["confidence"] >= 0.60
    assert "Venue" in result_venue["detected_type"] or "Ballroom" in result_venue["detected_type"] or "Hall" in result_venue["detected_type"]

    # 2. Create a non-venue image (flat solid blank document)
    blank_img = Image.new("RGB", (400, 600), color=(255, 255, 255))
    buf_blank = io.BytesIO()
    blank_img.save(buf_blank, format="PNG")
    blank_b64 = "data:image/png;base64," + base64.b64encode(buf_blank.getvalue()).decode()

    result_blank = VenueClassifierService.classify_venue_image(blank_b64)
    assert result_blank["is_venue"] is False
    assert result_blank["confidence"] < 0.50

def test_validate_venue_image_endpoint(client):
    import io
    import base64
    from PIL import Image

    test_img = Image.new("RGB", (640, 400), color=(180, 150, 120))
    buf = io.BytesIO()
    test_img.save(buf, format="JPEG")
    img_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    res = client.post("/api/quotes/validate-venue-image", json={"image_data": img_b64})
    assert res.status_code == 200
    data = res.get_json()
    assert "is_venue" in data
    assert "confidence" in data
    assert "detected_type" in data

    # Error handling for missing payload
    bad_res = client.post("/api/quotes/validate-venue-image", json={})
    assert bad_res.status_code == 400

def test_stage_preview_inpainting_endpoint(client):
    import io
    import base64
    from PIL import Image

    # 1. Test template inpainting
    res = client.post("/api/quotes/stage-preview", json={
        "template_id": "grand_stage",
        "prompt": "romantic blush roses with living potted monsteras and ambient fairy lighting",
        "mask_area": "entrance_arch"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["pipeline_status"] == "success"
    assert "/venues/" in data["staged_result_image"] or "data:image/" in data["staged_result_image"]
    assert data["mask_target"] == "entrance_arch"

    # 2. Test custom venue image inpainting
    custom_img = Image.new("RGB", (600, 400), color=(210, 195, 180))
    buf = io.BytesIO()
    custom_img.save(buf, format="JPEG")
    custom_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    res_custom = client.post("/api/quotes/stage-preview", json={
        "template_id": "grand_stage",
        "prompt": "crimson velvet roses with potted fiddle fig trees",
        "mask_area": "aisle_runners",
        "custom_image": custom_b64
    })
    assert res_custom.status_code == 200
    data_custom = res_custom.get_json()
    assert data_custom["pipeline_status"] in ["success", "api_key_required"]
    assert "data:image/jpeg;base64," in data_custom["staged_result_image"]
    assert data_custom["template_name"] == "Client Custom Architecture"

    # 3. Test gemini key status endpoint
    res_status = client.get("/api/quotes/gemini-key-status")
    assert res_status.status_code == 200
    assert "has_key" in res_status.get_json()

def test_floral_briefing_endpoint(client):
    res = client.post("/api/quotes/floral-briefing", json={
        "venue_id": "grand_stage",
        "guest_tier": "grand_500",
        "modules": ["entrance_arch", "stage_backdrop", "table_centerpieces"],
        "prompt": "Dutch Velvet Crimson Roses & Imperial Orchids"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["venue_id"] == "grand_stage"
    assert data["total_estimated_stems"] > 500
    assert len(data["procurement_breakdown"]) >= 5
    assert "Dutch Velvet Crimson Roses" in [item["botanical_name"] for item in data["procurement_breakdown"]]

def test_potted_plant_products(client):
    from models import Product
    # Add a potted plant and a cut flower
    potted = Product(
        name="Monstera Deliciosa",
        category="potted_plant",
        is_perishable=False,
        base_price=890.0,
        stock_quantity=25,
        image_url="/monstera_plant_pot.jpg"
    )
    flower = Product(
        name="Dutch Red Roses",
        category="cut_flower",
        is_perishable=True,
        base_price=55.0,
        stock_quantity=100,
        image_url="/rose_flower_bouquet.jpg"
    )
    db.session.add_all([potted, flower])
    db.session.commit()

    res = client.get("/api/products")
    assert res.status_code == 200
    products = res.get_json()["products"]
    categories = [p["category"] for p in products]
    assert "potted_plant" in categories
    assert "cut_flower" in categories

