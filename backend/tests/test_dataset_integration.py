import os
import pytest
from app import create_app
from models import db, Product
from services.floriography_service import FloriographyService
from services.prophet_service import ProphetService

@pytest.fixture
def client():
    app, _ = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        yield app.test_client()
        db.session.remove()
        db.drop_all()

def test_botanical_species_csv_seeding(client):
    """Verifies that the botanical dataset CSV properly initializes product entities."""
    products = Product.query.all()
    assert len(products) >= 12, "Expected at least 12 botanical species seeded from CSV"
    
    # Check cut flower specific attributes
    rose = Product.query.filter_by(name="Dutch Red Velvet Roses").first()
    assert rose is not None
    assert rose.is_perishable is True
    assert rose.vase_life_days == 5
    assert rose.hsn_code == "0603"
    assert "Red Naomi" in rose.botanical_name

    # Check potted plant specific attributes
    monstera = Product.query.filter_by(name="Monstera Deliciosa (Swiss Cheese Plant)").first()
    assert monstera is not None
    assert monstera.is_perishable is False
    assert monstera.vase_life_days == 365
    assert monstera.hsn_code == "0602"

def test_emotion_floriography_csv_loading():
    """Verifies that the emotion classification CSV properly loads taxonomies and sentiment mappings."""
    success = FloriographyService.load_from_csv()
    assert success is True, "Failed to load emotion floriography CSV"
    assert len(FloriographyService.EMOTION_LEXICONS) == 6
    assert "love_passion" in FloriographyService.EMOTION_LEXICONS
    assert "joy_celebration" in FloriographyService.EMOTION_LEXICONS

    # Test sentiment categorization
    res = FloriographyService.analyze_sentiment_and_recommend("Sending heartfelt condolences and sympathy during this solemn time.")
    assert res["detected_category"] == "sympathy_remembrance"
    assert res["confidence_percentage"] > 70.0
    assert "Purity White & Serene Marble" in res["floriography_profile"]["palette_name"]

def test_prophet_sales_csv_forecasting():
    """Verifies that the 730-day historical time-series CSV loads and generates demand predictions."""
    history = ProphetService.load_historical_sales_from_csv(days=730)
    assert history is not None
    assert len(history) == 730, f"Expected 730 daily records, found {len(history)}"
    
    # Check fields
    first_record = history[0]
    assert "ds" in first_record
    assert "y" in first_record
    assert "procured_stems" in first_record
    assert "trend" in first_record

    # Run forecast over historical CSV data
    forecast_result = ProphetService.run_forecast(forecast_days=30)
    assert len(forecast_result["forecast_points"]) == 30
    assert forecast_result["metrics"]["forecast_horizon_days"] == 30
    assert forecast_result["metrics"]["safety_buffer_percentage"] == 15
    assert forecast_result["metrics"]["recommended_procurement_stems"] > forecast_result["metrics"]["total_projected_stems"]

def test_analytics_api_with_csv_data(client):
    """Verifies that the /api/analytics/prophet-forecast endpoint delivers projections generated from the CSV."""
    response = client.get("/api/analytics/prophet-forecast?horizon=21")
    assert response.status_code == 200
    data = response.get_json()
    assert "forecast_points" in data
    assert len(data["forecast_points"]) == 21
    assert "metrics" in data
    assert data["metrics"]["safety_buffer_percentage"] == 15

def test_dataset_overview_api(client):
    """Verifies that the /api/datasets overview returns all 3 datasets with metadata."""
    response = client.get("/api/datasets")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "active"
    assert data["total_datasets"] == 3
    dataset_ids = [d["id"] for d in data["datasets"]]
    assert "botanical_species_and_care" in dataset_ids
    assert "emotion_floriography_classification" in dataset_ids
    assert "historical_daily_sales_730days" in dataset_ids

def test_botanical_dataset_api_filtering(client):
    """Verifies /api/datasets/botanical filtering by fruit, vegetable, and herb categories."""
    # Test all items
    resp_all = client.get("/api/datasets/botanical")
    assert resp_all.status_code == 200
    data_all = resp_all.get_json()
    assert data_all["total_available_in_csv"] >= 45

    # Test fruit plants filter
    resp_fruit = client.get("/api/datasets/botanical?category=fruit_plant")
    assert resp_fruit.status_code == 200
    data_fruit = resp_fruit.get_json()
    assert data_fruit["total_matched"] >= 10
    fruit_names = [item["name"] for item in data_fruit["items"]]
    assert any("Mango" in name for name in fruit_names)
    assert any("Banana" in name for name in fruit_names)

    # Test vegetable plants filter
    resp_veg = client.get("/api/datasets/botanical?category=vegetable_plant")
    assert resp_veg.status_code == 200
    data_veg = resp_veg.get_json()
    assert data_veg["total_matched"] >= 7
    veg_names = [item["name"] for item in data_veg["items"]]
    assert any("Curry Leaf" in name for name in veg_names)
    assert any("Chilli" in name for name in veg_names)

    # Test herbs filter
    resp_herb = client.get("/api/datasets/botanical?category=herb")
    assert resp_herb.status_code == 200
    data_herb = resp_herb.get_json()
    assert data_herb["total_matched"] >= 5
    herb_names = [item["name"] for item in data_herb["items"]]
    assert any("Tulsi" in name for name in herb_names)
    assert any("Moonseed" in name or "Giloy" in name for name in herb_names)

def test_emotions_dataset_api(client):
    """Verifies /api/datasets/emotions endpoint structure."""
    resp = client.get("/api/datasets/emotions")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["total_emotion_domains"] == 6
    assert len(data["records"]) == 6
    categories = [r["emotion_category"] for r in data["records"]]
    assert "love_passion" in categories
    assert "joy_celebration" in categories
    assert "gratitude_appreciation" in categories

def test_historical_sales_dataset_api(client):
    """Verifies /api/datasets/historical-sales endpoint with pagination and aggregates."""
    resp = client.get("/api/datasets/historical-sales?page=1&per_page=20")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["total_records"] == 730
    assert len(data["records"]) == 20
    assert "aggregate_metrics" in data
    assert data["aggregate_metrics"]["total_sold_stems"] > 0
    assert data["aggregate_metrics"]["festive_holiday_days"] > 0

def test_dataset_sync_endpoint(client):
    """Verifies POST /api/datasets/sync triggers end-to-end dataset reloading."""
    resp = client.post("/api/datasets/sync")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "synchronized"
    assert data["results"]["botanical_species_count"] >= 45
    assert data["results"]["floriography_service_reloaded"] is True
    assert data["results"]["prophet_status"] == "ready"

def test_bouquet_floriography_recommendation(client):
    """Verifies POST /api/bouquet/recommend provides AI botanical arrangement suggestions."""
    payload = {
        "sentiment_text": "A romantic anniversary celebration with deep love and passion"
    }
    resp = client.post("/api/bouquet/recommend", json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "success"
    assert data["emotion_analysis"]["dominant_category"] == "love_passion"
    assert data["curated_styling"]["palette_name"] is not None
    assert len(data["recommended_botanicals"]) > 0

def test_subscription_flower_box_tiers(client):
    """Verifies /api/subscriptions/tiers offers the 3 core floral box tiers."""
    resp = client.get("/api/subscriptions/tiers")
    assert resp.status_code == 200
    tiers = resp.get_json()["tiers"]
    tier_keys = [t["tier"] for t in tiers]
    assert len(tiers) == 3
    assert "basic" in tier_keys
    assert "premium" in tier_keys
    assert "luxury" in tier_keys
    assert "kitchen_herbal" not in tier_keys
    assert "fruit_orchard" not in tier_keys

def test_all_77_botanical_species_and_categories(client):
    """Verifies all 77 botanical species from CSV dataset are loaded and categorized."""
    resp = client.get("/api/products")
    assert resp.status_code == 200
    products = resp.get_json()["products"]
    assert len(products) == 77

    categories = {}
    for p in products:
        cat = p["category"]
        categories[cat] = categories.get(cat, 0) + 1

    assert categories["fruit_plant"] == 25
    assert categories["vegetable_plant"] == 13
    assert categories["herb"] == 6
    assert categories["potted_plant"] == 6
    assert categories["cut_flower"] == 15
    assert categories["planter"] == 11
    assert categories["accessory"] == 1

    # Total living nursery plants = 25 + 13 + 6 + 6 = 50
    living_plants = [p for p in products if p["category"] in ("fruit_plant", "vegetable_plant", "herb", "potted_plant")]
    assert len(living_plants) == 50


