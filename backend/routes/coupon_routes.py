from flask import Blueprint, request, jsonify
from models import db, Coupon

coupon_bp = Blueprint("coupons", __name__, url_prefix="/api/coupons")

@coupon_bp.route("/active", methods=["GET"])
def get_active_coupons():
    """Returns all currently active public discount vouchers."""
    coupons = Coupon.query.filter_by(is_active=True).all()
    return jsonify({
        "status": "success",
        "coupons": [c.to_dict() for c in coupons]
    }), 200

@coupon_bp.route("/validate", methods=["POST"])
def validate_coupon():
    """Validates a coupon code against the cart order subtotal and calculates discount."""
    data = request.get_json() or {}
    code = (data.get("code") or "").strip().upper()
    subtotal = float(data.get("subtotal") or data.get("order_amount") or 0.0)

    if not code:
        return jsonify({"valid": False, "error": "Please enter a promotional coupon code."}), 400

    coupon = Coupon.query.filter(db.func.upper(Coupon.code) == code).first()
    if not coupon:
        return jsonify({
            "valid": False,
            "error": f"Promo code '{code}' is invalid or does not exist."
        }), 404

    is_valid, msg = coupon.is_valid(subtotal)
    if not is_valid:
        return jsonify({
            "valid": False,
            "code": coupon.code,
            "error": msg
        }), 400

    discount = coupon.calculate_discount(subtotal)
    new_subtotal = max(0.0, round(subtotal - discount, 2))

    return jsonify({
        "valid": True,
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "discount_amount": discount,
        "original_subtotal": subtotal,
        "discounted_subtotal": new_subtotal,
        "message": f"Coupon {coupon.code} applied successfully! You saved ₹{discount:.2f}."
    }), 200
