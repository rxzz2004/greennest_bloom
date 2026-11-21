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

@batch_bp.route("/<int:batch_id>", methods=["PUT"])
def update_batch(batch_id):
    """Admin edit batch details (code, dates, quantities, vase life, status)"""
    batch = PerishableBatch.query.get(batch_id)
    if not batch:
        return jsonify({"error": "Batch not found"}), 404

    data = request.get_json() or {}

    if "batch_code" in data and data["batch_code"]:
        new_code = data["batch_code"].strip()
        existing = PerishableBatch.query.filter(PerishableBatch.batch_code == new_code, PerishableBatch.id != batch_id).first()
        if existing:
            return jsonify({"error": f"Batch code '{new_code}' is already assigned to another batch"}), 400
        batch.batch_code = new_code

    if "harvest_date" in data and data["harvest_date"]:
        try:
            if isinstance(data["harvest_date"], str):
                batch.harvest_date = datetime.strptime(data["harvest_date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid harvest date format. Please use YYYY-MM-DD"}), 400

    old_rem_qty = batch.remaining_quantity
    if "initial_quantity" in data:
        batch.initial_quantity = max(1, int(data["initial_quantity"]))

    if "remaining_quantity" in data:
        new_rem_qty = max(0, int(data["remaining_quantity"]))
        qty_diff = new_rem_qty - old_rem_qty
        batch.remaining_quantity = new_rem_qty
        if batch.product:
            batch.product.stock_quantity = max(0, batch.product.stock_quantity + qty_diff)

    if "vase_life_days" in data:
        batch.vase_life_days = max(1, int(data["vase_life_days"]))

    if "discount_percent" in data:
        batch.discount_percent = max(0.0, min(100.0, float(data["discount_percent"])))

    if "status" in data and data["status"]:
        batch.status = str(data["status"]).strip().lower()

    db.session.commit()
    return jsonify({
        "message": f"Batch {batch.batch_code} updated successfully.",
        "batch": batch.to_dict()
    }), 200

@batch_bp.route("/<int:batch_id>", methods=["DELETE"])
def delete_batch(batch_id):
    """Admin remove / delete batch from database"""
    batch = PerishableBatch.query.get(batch_id)
    if not batch:
        return jsonify({"error": "Batch not found"}), 404

    batch_code = batch.batch_code

    # Safe foreign-key unlink: if any order items reference this batch, unlink rather than break order history
    from models import OrderItem
    OrderItem.query.filter_by(batch_id=batch.id).update({"batch_id": None})

    # Adjust parent product stock quantity
    if batch.product and batch.remaining_quantity > 0:
        batch.product.stock_quantity = max(0, batch.product.stock_quantity - batch.remaining_quantity)

    db.session.delete(batch)
    db.session.commit()

    return jsonify({
        "message": f"Batch {batch_code} successfully removed from the database.",
        "deleted_batch_id": batch_id
    }), 200
