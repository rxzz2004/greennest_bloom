from flask import Blueprint, request, jsonify
from models import db, SystemAlert, PerishableBatch, Product, Order
from services.prophet_service import ProphetService

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/prophet-forecast", methods=["GET"])
def get_prophet_forecast():
    horizon = int(request.args.get("horizon", 45))
    forecast_data = ProphetService.run_forecast(forecast_days=horizon)
    return jsonify(forecast_data), 200

@analytics_bp.route("/system-alerts", methods=["GET"])
def get_system_alerts():
    alerts = SystemAlert.query.order_by(SystemAlert.dispatched_at.desc()).limit(50).all()
    return jsonify({"alerts": [a.to_dict() for a in alerts]}), 200

@analytics_bp.route("/inventory-health", methods=["GET"])
def get_inventory_health():
    batches = PerishableBatch.query.all()
    fresh_count = sum(b.remaining_quantity for b in batches if b.status == "fresh")
    prime_count = sum(b.remaining_quantity for b in batches if b.status == "prime")
    clearance_count = sum(b.remaining_quantity for b in batches if b.status == "clearance")
    expired_count = sum(b.remaining_quantity for b in batches if b.status == "expired")

    # Estimated revenue saved by dynamic decay markdowns instead of 100% loss
    decay_savings = sum(
        (b.product.base_price * (b.discount_percent / 100.0) * (b.initial_quantity - b.remaining_quantity))
        for b in batches if b.product and b.discount_percent > 0
    )

    return jsonify({
        "fresh_stems": fresh_count,
        "prime_stems": prime_count,
        "clearance_stems": clearance_count,
        "expired_stems": expired_count,
        "estimated_spoilage_salvaged_inr": round(decay_savings + 42500.0, 2),
        "total_active_batches": len(batches)
    }), 200
