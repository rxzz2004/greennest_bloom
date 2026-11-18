from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, PerishableBatch, Product
from services.decay_service import DecayService

batch_bp = Blueprint("batches", __name__)

@batch_bp.route("", methods=["GET"])
def get_batches():
    status = request.args.get("status")
    query = PerishableBatch.query.order_by(PerishableBatch.harvest_date.asc())

    if status:
        query = query.filter_by(status=status)

    batches = query.all()
    return jsonify({"batches": [b.to_dict() for b in batches]}), 200

@batch_bp.route("", methods=["POST"])
def create_batch():
    """Log an incoming fresh harvest batch into FEFO tracker"""
    data = request.get_json() or {}
    product_id = data.get("product_id")
    batch_code = data.get("batch_code") or f"BATCH-{datetime.utcnow().strftime('%Y%m%d%H%M')}"
    harvest_date_str = data.get("harvest_date") or datetime.utcnow().strftime("%Y-%m-%d")
    qty = int(data.get("quantity", 100))
    vase_life = int(data.get("vase_life_days", 5))

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    harvest_date = datetime.strptime(harvest_date_str, "%Y-%m-%d").date()
    batch = PerishableBatch(
        product_id=product.id,
        batch_code=batch_code,
        harvest_date=harvest_date,
        initial_quantity=qty,
        remaining_quantity=qty,
        current_age_days=0,
        vase_life_days=vase_life,
        discount_percent=0.0,
        status="fresh"
    )
    product.stock_quantity += qty
    db.session.add(batch)
    db.session.commit()

    return jsonify({"message": f"Harvest batch {batch_code} registered in FEFO system.", "batch": batch.to_dict()}), 201

@batch_bp.route("/evaluate", methods=["POST"])
def trigger_decay_evaluation():
    """Manual or cron trigger to evaluate biological senescence and dynamic markdowns"""
    results = DecayService.evaluate_all_batches()
    return jsonify({
        "message": "Dynamic decay markdown evaluation complete.",
        "results": results
    }), 200

@batch_bp.route("/<int:batch_id>/override", methods=["POST"])
def override_batch_discount(batch_id):
    """Admin manual override for batch discount percentage"""
    data = request.get_json() or {}
    custom_discount = float(data.get("discount_percent", 0.0))
    note = data.get("note", "")

    batch, msg = DecayService.manual_override(batch_id, custom_discount, note)
    if not batch:
        return jsonify({"error": msg}), 404

    return jsonify({"message": msg, "batch": batch.to_dict()}), 200
