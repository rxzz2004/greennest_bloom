import os
import csv
from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Product
from services.floriography_service import FloriographyService
from services.prophet_service import ProphetService

dataset_bp = Blueprint("datasets", __name__)

DATA_DIR_BACKEND = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DATA_DIR_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

def get_dataset_path(filename: str) -> str:
    """Finds the dataset file in backend/data or root data directory."""
    for folder in [DATA_DIR_BACKEND, DATA_DIR_ROOT]:
        path = os.path.join(folder, filename)
        if os.path.exists(path):
            return path
    return os.path.join(DATA_DIR_BACKEND, filename)

def sync_botanical_dataset_to_db():
    """Reads botanical_species_and_care.csv and synchronizes into the Product database table."""
    csv_path = get_dataset_path("botanical_species_and_care.csv")
    if not os.path.exists(csv_path):
        return 0, f"CSV file not found at {csv_path}"

    count = 0
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            p_id = int(row["id"]) if row.get("id") else None
            existing = db.session.get(Product, p_id) if p_id else Product.query.filter_by(name=row["name"]).first()

            is_perishable = str(row.get("is_perishable", "")).strip().lower() in ("1", "true")
            base_price = float(row["base_price"])
            b2b_min_quantity = int(row.get("b2b_min_quantity", 10))
            b2b_discount_percent = float(row.get("b2b_discount_percent", 15.0))
            vase_life_days = int(row.get("vase_life_days", 5))
            stock_quantity = int(row.get("stock_quantity", 100))

            if existing:
                existing.name = row["name"]
                existing.category = row["category"]
                existing.botanical_name = row["botanical_name"]
                existing.sunlight_requirement = row["sunlight_requirement"]
                existing.watering_frequency = row["watering_frequency"]
                existing.vase_life_days = vase_life_days
                existing.is_perishable = is_perishable
                existing.base_price = base_price
                existing.b2b_min_quantity = b2b_min_quantity
                existing.b2b_discount_percent = b2b_discount_percent
                existing.hsn_code = row["hsn_code"]
                existing.floriography_meaning = row["floriography_meaning"]
                existing.image_url = row["image_url"]
                existing.stock_quantity = stock_quantity
            else:
                new_prod = Product(
                    id=p_id,
                    name=row["name"],
                    category=row["category"],
                    botanical_name=row["botanical_name"],
                    sunlight_requirement=row["sunlight_requirement"],
                    watering_frequency=row["watering_frequency"],
                    vase_life_days=vase_life_days,
                    is_perishable=is_perishable,
                    base_price=base_price,
                    b2b_min_quantity=b2b_min_quantity,
                    b2b_discount_percent=b2b_discount_percent,
                    hsn_code=row["hsn_code"],
                    floriography_meaning=row["floriography_meaning"],
                    image_url=row["image_url"],
                    stock_quantity=stock_quantity
                )
                db.session.add(new_prod)
            count += 1
        db.session.commit()
    return count, "success"

@dataset_bp.route("", methods=["GET"])
def get_datasets_overview():
    """
    Returns high-level metadata, file stats, schema summaries, and integration
    details for all 3 primary datasets utilized by Green Nest Bloom.
    """
    datasets = []

    # 1. Botanical Species & Plant Care Dataset
    bot_path = get_dataset_path("botanical_species_and_care.csv")
    bot_exists = os.path.exists(bot_path)
    bot_rows = 0
    bot_categories = {}
    if bot_exists:
        with open(bot_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                bot_rows += 1
                cat = r.get("category", "unknown")
                bot_categories[cat] = bot_categories.get(cat, 0) + 1

    datasets.append({
        "id": "botanical_species_and_care",
        "name": "Botanical Species & Plant Care Dataset (Kaggle Extended)",
        "file_name": "botanical_species_and_care.csv",
        "file_exists": bot_exists,
        "record_count": bot_rows,
        "file_size_bytes": os.path.getsize(bot_path) if bot_exists else 0,
        "category_distribution": bot_categories,
        "key_attributes": [
            "name", "category", "botanical_name", "sunlight_requirement",
            "watering_frequency", "vase_life_days", "is_perishable",
            "base_price", "b2b_min_quantity", "b2b_discount_percent",
            "hsn_code", "floriography_meaning", "image_url", "stock_quantity"
        ],
        "backend_usage": [
            "Catalog seeding in SQLite & MySQL via seed.py",
            "FEFO Biological Decay curves in decay_service.py",
            "B2B wholesale dynamic tiered discounts in product_routes.py",
            "Storefront categorization (fruit_plant, vegetable_plant, herb, cut_flower, potted_plant, planter, accessory)"
        ]
    })

    # 2. Emotion Text Classification Dataset
    emo_path = get_dataset_path("emotion_floriography_classification.csv")
    emo_exists = os.path.exists(emo_path)
    emo_rows = 0
    emo_domains = []
    if emo_exists:
        with open(emo_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                emo_rows += 1
                emo_domains.append(r.get("emotion_category"))

    datasets.append({
        "id": "emotion_floriography_classification",
        "name": "Emotion Text Classification Dataset (DistilBERT / Kaggle)",
        "file_name": "emotion_floriography_classification.csv",
        "file_exists": emo_exists,
        "record_count": emo_rows,
        "file_size_bytes": os.path.getsize(emo_path) if emo_exists else 0,
        "emotion_domains": emo_domains,
        "key_attributes": [
            "emotion_category", "primary_emotion", "sample_trigger_keywords",
            "palette_name", "palette_hexes", "accent_greenery",
            "primary_botanical_recommendation", "recommended_wrapping", "curator_note"
        ],
        "backend_usage": [
            "Affective NLP Sentiment Recommender in floriography_service.py",
            "Custom Bouquet sentiment auto-tuning in bouquet_routes.py",
            "B2B Event Quotation Theme Generator in quote_routes.py"
        ]
    })

    # 3. Historical Daily Floral Sales & Festive Demand Dataset
    sales_path = get_dataset_path("historical_daily_sales_730days.csv")
    sales_exists = os.path.exists(sales_path)
    sales_rows = 0
    holidays_count = 0
    if sales_exists:
        with open(sales_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                sales_rows += 1
                if r.get("holiday_flag"):
                    holidays_count += 1

    datasets.append({
        "id": "historical_daily_sales_730days",
        "name": "Historical Daily Floral Sales & Festive Demand Dataset (Time-Series)",
        "file_name": "historical_daily_sales_730days.csv",
        "file_exists": sales_exists,
        "record_count": sales_rows,
        "file_size_bytes": os.path.getsize(sales_path) if sales_exists else 0,
        "festive_holiday_events_count": holidays_count,
        "key_attributes": [
            "ds", "y", "procured_stems", "holiday_flag", "trend", "seasonality"
        ],
        "backend_usage": [
            "Prophet time-series demand forecasting in prophet_service.py",
            "Safety-buffer procurement calculation in analytics_routes.py",
            "Festive spike and seasonality decomposition for 14-45 day horizons"
        ]
    })

    return jsonify({
        "status": "active",
        "total_datasets": len(datasets),
        "datasets": datasets,
        "last_inspected": datetime.utcnow().isoformat() + "Z"
    }), 200

@dataset_bp.route("/botanical", methods=["GET"])
def get_botanical_dataset():
    """
    Returns items from the Botanical Species & Plant Care Dataset with optional filtering
    by category, perishability, search keyword, and statistical distribution.
    """
    csv_path = get_dataset_path("botanical_species_and_care.csv")
    if not os.path.exists(csv_path):
        return jsonify({"error": "Botanical dataset CSV not found"}), 404

    category = request.args.get("category")
    is_perishable = request.args.get("is_perishable")
    search = request.args.get("search", "").strip().lower()

    items = []
    category_counts = {}
    total_price = 0.0

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cat = row.get("category", "")
            category_counts[cat] = category_counts.get(cat, 0) + 1

            # Filtering
            if category and cat != category:
                continue
            if is_perishable is not None:
                row_perish = str(row.get("is_perishable", "")).strip().lower() in ("1", "true")
                if row_perish != (is_perishable.lower() == "true"):
                    continue
            if search:
                name_match = search in row.get("name", "").lower()
                bot_match = search in row.get("botanical_name", "").lower()
                meaning_match = search in row.get("floriography_meaning", "").lower()
                if not (name_match or bot_match or meaning_match):
                    continue

            price = float(row.get("base_price", 0.0))
            total_price += price

            items.append({
                "id": int(row.get("id", 0)),
                "name": row.get("name"),
                "category": cat,
                "botanical_name": row.get("botanical_name"),
                "sunlight_requirement": row.get("sunlight_requirement"),
                "watering_frequency": row.get("watering_frequency"),
                "vase_life_days": int(row.get("vase_life_days", 0)),
                "is_perishable": str(row.get("is_perishable", "")).strip().lower() in ("1", "true"),
                "base_price": price,
                "b2b_min_quantity": int(row.get("b2b_min_quantity", 1)),
                "b2b_discount_percent": float(row.get("b2b_discount_percent", 0.0)),
                "hsn_code": row.get("hsn_code"),
                "floriography_meaning": row.get("floriography_meaning"),
                "image_url": row.get("image_url"),
                "stock_quantity": int(row.get("stock_quantity", 0))
            })

    return jsonify({
        "total_matched": len(items),
        "total_available_in_csv": sum(category_counts.values()),
        "category_distribution": category_counts,
        "average_base_price_inr": round(total_price / max(len(items), 1), 2),
        "items": items
    }), 200

@dataset_bp.route("/emotions", methods=["GET"])
def get_emotions_dataset():
    """
    Returns the Emotion Floriography Classification Dataset containing trigger keywords,
    hex color schemes, botanical flower recommendations, and curator styling advice.
    """
    csv_path = get_dataset_path("emotion_floriography_classification.csv")
    if not os.path.exists(csv_path):
        return jsonify({"error": "Emotion classification dataset CSV not found"}), 404

    records = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_kws = row.get("sample_trigger_keywords", "")
            raw_hex = row.get("palette_hexes", "")
            records.append({
                "emotion_category": row.get("emotion_category"),
                "primary_emotion": row.get("primary_emotion"),
                "trigger_keywords": [k.strip() for k in raw_kws.split(",") if k.strip()],
                "palette_name": row.get("palette_name"),
                "palette_hexes": [h.strip() for h in raw_hex.split(",") if h.strip()],
                "accent_greenery": row.get("accent_greenery"),
                "primary_botanical_recommendation": row.get("primary_botanical_recommendation"),
                "recommended_wrapping": row.get("recommended_wrapping"),
                "curator_note": row.get("curator_note")
            })

    return jsonify({
        "total_emotion_domains": len(records),
        "active_lexicons": list(FloriographyService.EMOTION_LEXICONS.keys()),
        "records": records
    }), 200

@dataset_bp.route("/historical-sales", methods=["GET"])
def get_historical_sales_dataset():
    """
    Returns the 730-day longitudinal sales and festive demand time-series
    with pagination and summary aggregates.
    """
    csv_path = get_dataset_path("historical_daily_sales_730days.csv")
    if not os.path.exists(csv_path):
        return jsonify({"error": "Historical sales dataset CSV not found"}), 404

    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 50)), 1), 730)
    holiday_only = request.args.get("holiday_only", "false").lower() == "true"

    all_rows = []
    total_sales = 0
    total_procured = 0
    holiday_events = 0

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            y = int(float(row.get("y", 0)))
            procured = int(float(row.get("procured_stems", 0)))
            h_flag = row.get("holiday_flag")

            total_sales += y
            total_procured += procured
            if h_flag:
                holiday_events += 1

            if holiday_only and not h_flag:
                continue

            all_rows.append({
                "ds": row.get("ds"),
                "y": y,
                "procured_stems": procured,
                "holiday_flag": h_flag if h_flag else None,
                "trend": round(float(row.get("trend", 0.0)), 2),
                "seasonality": round(float(row.get("seasonality", 0.0)), 2)
            })

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_rows = all_rows[start_idx:end_idx]

    return jsonify({
        "total_records": len(all_rows),
        "page": page,
        "per_page": per_page,
        "total_pages": (len(all_rows) + per_page - 1) // per_page,
        "aggregate_metrics": {
            "total_sold_stems": total_sales,
            "total_procured_stems": total_procured,
            "overall_sell_through_rate": round((total_sales / max(total_procured, 1)) * 100, 2),
            "festive_holiday_days": holiday_events
        },
        "records": paginated_rows
    }), 200

@dataset_bp.route("/sync", methods=["POST"])
def sync_all_datasets():
    """
    Re-synchronizes all three datasets into memory and database:
    1. Synchronizes botanical_species_and_care.csv with SQLite Product catalog.
    2. Reloads FloriographyService emotion lexicons and palette rules.
    3. Reloads ProphetService historical sales data.
    """
    # 1. Botanical Species
    count, msg = sync_botanical_dataset_to_db()

    # 2. Floriography Emotion Mappings
    floriography_reloaded = FloriographyService.load_from_csv()

    # 3. Prophet Time-Series
    history_records = ProphetService.load_historical_sales_from_csv(days=730)
    prophet_loaded = history_records is not None and len(history_records) > 0

    return jsonify({
        "status": "synchronized",
        "synced_at": datetime.utcnow().isoformat() + "Z",
        "results": {
            "botanical_species_count": count,
            "botanical_status": msg,
            "floriography_service_reloaded": floriography_reloaded,
            "floriography_lexicon_categories": len(FloriographyService.EMOTION_LEXICONS),
            "prophet_time_series_days_loaded": len(history_records) if history_records else 0,
            "prophet_status": "ready" if prophet_loaded else "failed"
        }
    }), 200
