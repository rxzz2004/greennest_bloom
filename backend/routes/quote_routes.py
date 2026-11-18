from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, EventQuotation, User
from services.logistics_service import LogisticsService
from services.floriography_service import FloriographyService
from services.venue_staging_service import VenueStagingService
from services.venue_classifier_service import VenueClassifierService
from services.alert_service import AlertService

quote_bp = Blueprint("quotes", __name__)

@quote_bp.route("/venues", methods=["GET"])
def get_venues():
    return jsonify({
        "templates": VenueStagingService.VENUE_TEMPLATES,
        "decor_pricing": VenueStagingService.DECOR_MODULE_PRICING
    }), 200

@quote_bp.route("/check-date", methods=["POST"])
def check_date():
    data = request.get_json() or {}
    date_str = data.get("event_date")
    if not date_str:
        return jsonify({"error": "Event date is required"}), 400

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format, use YYYY-MM-DD"}), 400

    result = LogisticsService.check_event_date_availability(target_date)
    return jsonify(result), 200

@quote_bp.route("/check-radius", methods=["POST"])
def check_radius():
    data = request.get_json() or {}
    lat = float(data.get("latitude", 12.9716))
    lng = float(data.get("longitude", 77.5946))

    result = LogisticsService.validate_venue_radius(lat, lng)
    return jsonify(result), 200

@quote_bp.route("/floriography-recommend", methods=["POST"])
def recommend_floriography():
    data = request.get_json() or {}
    prompt = data.get("prompt", "")
    result = FloriographyService.analyze_sentiment_and_recommend(prompt)
    return jsonify(result), 200

@quote_bp.route("/validate-venue-image", methods=["POST"])
def validate_venue_image():
    data = request.get_json() or {}
    image_data = data.get("image_data")
    if not image_data:
        return jsonify({"error": "image_data is required"}), 400

    result = VenueClassifierService.classify_venue_image(image_data)
    return jsonify(result), 200

@quote_bp.route("/stage-preview", methods=["POST"])
def generate_staging_preview():
    data = request.get_json() or {}
    template_id = data.get("template_id", "grand_stage")
    prompt = data.get("prompt", "")
    mask = data.get("mask_area", "stage")
    custom_image = data.get("custom_image")

    result = VenueStagingService.run_diffusion_inpainting(template_id, prompt, mask, custom_image)
    return jsonify(result), 200

@quote_bp.route("/gemini-key-status", methods=["GET"])
def get_gemini_key_status():
    import os
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
    has_key = bool(len(key) > 25 and not key.startswith("your_") and "here" not in key)
    return jsonify({"has_key": has_key}), 200

@quote_bp.route("/save-gemini-key", methods=["POST"])
def save_gemini_key():
    import os
    data = request.get_json() or {}
    key = (data.get("api_key") or "").strip()
    if not key or len(key) < 10:
        return jsonify({"error": "Invalid API key format"}), 400

    env_path = os.path.join(os.path.dirname(__file__), "../.env")
    try:
        with open(env_path, "a") as f:
            f.write(f"\nGEMINI_API_KEY={key}\n")
    except Exception as e:
        print("Error saving to .env:", e)

    os.environ["GEMINI_API_KEY"] = key
    return jsonify({"success": True, "message": "Gemini API key configured successfully"}), 200

@quote_bp.route("/calculate-estimate", methods=["POST"])
def calculate_estimate():
    data = request.get_json() or {}
    guest_tier = data.get("guest_tier", "medium_200")
    modules = data.get("modules", ["entrance_arch", "stage_backdrop"])
    estimate = VenueStagingService.calculate_event_estimate(guest_tier, modules)
    return jsonify(estimate), 200

@quote_bp.route("/floral-briefing", methods=["POST"])
def get_floral_briefing():
    data = request.get_json() or {}
    venue_id = data.get("venue_id", "grand_stage")
    guest_tier = data.get("guest_tier", "medium_200")
    modules = data.get("modules", ["entrance_arch", "stage_backdrop"])
    prompt = data.get("prompt", "")
    briefing = VenueStagingService.generate_floral_procurement_briefing(venue_id, guest_tier, modules, prompt)
    return jsonify(briefing), 200

@quote_bp.route("/submit", methods=["POST"])
def submit_quote():
    data = request.get_json() or {}
    user_email = data.get("user_email")
    user = User.query.filter_by(email=user_email).first() if user_email else None
    if not user:
        user = User.query.first()

    event_date_str = data.get("event_date")
    if not event_date_str:
        return jsonify({"error": "Event date is mandatory"}), 400

    target_date = datetime.strptime(event_date_str, "%Y-%m-%d").date()

    # Verify single-event-per-day guard
    availability = LogisticsService.check_event_date_availability(target_date)
    if not availability["is_available"]:
        return jsonify({"error": availability["reason"]}), 409

    # Verify venue radius
    venue_lat = float(data.get("venue_latitude", 12.9716))
    venue_lng = float(data.get("venue_longitude", 77.5946))
    radius_check = LogisticsService.validate_venue_radius(venue_lat, venue_lng)
    if not radius_check["is_valid"]:
        return jsonify({"error": radius_check["message"]}), 422

    # Calculate itemized estimate
    guest_tier = data.get("guest_tier", "medium_200")
    modules = data.get("modules", ["entrance_arch", "stage_backdrop"])
    estimate = VenueStagingService.calculate_event_estimate(guest_tier, modules)
    total_with_surcharge = estimate["grand_total"] + radius_check["surcharge"]

    quote = EventQuotation(
        user_id=user.id,
        company_name=data.get("company_name", user.company_name or "Corporate Client"),
        event_type=data.get("event_type", "wedding"),
        event_date=target_date,
        guest_tier=guest_tier,
        venue_address=data.get("venue_address", "Bangalore Palace Grounds"),
        venue_latitude=venue_lat,
        venue_longitude=venue_lng,
        distance_km=radius_check["distance_km"],
        modules_json=",".join(modules),
        staged_image_url=data.get("staged_image_url"),
        sentiment_prompt=data.get("sentiment_prompt"),
        estimated_amount=total_with_surcharge,
        status="pending"
    )
    db.session.add(quote)
    db.session.commit()

    # Trigger Automated SMTP Email Alert to Nursery Super-Admin
    AlertService.trigger_event_quote_alert(
        quote_id=quote.id,
        company_name=quote.company_name,
        event_type=quote.event_type,
        event_date=quote.event_date.isoformat(),
        estimated_amount=quote.estimated_amount
    )

    return jsonify({
        "message": "Commercial event quotation registered. Our master florist will review your staging specifications.",
        "quote": quote.to_dict()
    }), 201

@quote_bp.route("", methods=["GET"])
def get_quotations():
    quotes = EventQuotation.query.order_by(EventQuotation.created_at.desc()).all()
    return jsonify({"quotations": [q.to_dict() for q in quotes]}), 200

@quote_bp.route("/<int:quote_id>/action", methods=["POST"])
def update_quote_status(quote_id):
    quote = EventQuotation.query.get(quote_id)
    if not quote:
        return jsonify({"error": "Quotation not found"}), 404

    data = request.get_json() or {}
    new_status = data.get("status", "approved")
    approved_amount = data.get("approved_amount")

    quote.status = new_status
    if approved_amount:
        quote.admin_approved_amount = float(approved_amount)

    db.session.commit()
    return jsonify({"message": f"Quotation status updated to {new_status}.", "quote": quote.to_dict()}), 200
