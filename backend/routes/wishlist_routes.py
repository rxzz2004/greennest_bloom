from flask import Blueprint, request, jsonify
from models import db, User, WishlistItem

wishlist_bp = Blueprint("wishlist", __name__)

@wishlist_bp.route("", methods=["GET"])
def get_wishlist():
    """Retrieve the personal wishlist belonging strictly to the requested user."""
    email = request.args.get("email")
    user_id = request.args.get("user_id")

    user = None
    if email:
        user = User.query.filter_by(email=email.strip().lower()).first()
    elif user_id:
        user = User.query.get(user_id)

    if not user:
        return jsonify({
            "wishlist": [],
            "count": 0,
            "message": "No user specified or user not found"
        }), 200

    items = [item.product_id for item in user.wishlist_items]
    return jsonify({
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "wishlist": items,
        "count": len(items)
    }), 200


@wishlist_bp.route("/toggle", methods=["POST"])
def toggle_wishlist_item():
    """Toggle a wishlist item specifically for an individual user."""
    data = request.get_json() or {}
    email = data.get("email")
    product_id = str(data.get("product_id", "")).strip()

    if not email or not product_id:
        return jsonify({"error": "Both email and product_id are required."}), 400

    user = User.query.filter_by(email=email.strip().lower()).first()
    if not user:
        return jsonify({"error": f"User with email '{email}' not found."}), 404

    existing = WishlistItem.query.filter_by(user_id=user.id, product_id=product_id).first()
    if existing:
        db.session.delete(existing)
        action = "removed"
    else:
        new_item = WishlistItem(user_id=user.id, product_id=product_id)
        db.session.add(new_item)
        action = "added"

    db.session.commit()

    current_items = [item.product_id for item in user.wishlist_items]
    return jsonify({
        "action": action,
        "product_id": product_id,
        "user_email": user.email,
        "wishlist": current_items,
        "count": len(current_items)
    }), 200


@wishlist_bp.route("/sync", methods=["POST"])
def sync_wishlist():
    """Sync an array of favorite items into the database for the given user."""
    data = request.get_json() or {}
    email = data.get("email")
    items = data.get("items", [])

    if not email:
        return jsonify({"error": "User email is required."}), 400

    user = User.query.filter_by(email=email.strip().lower()).first()
    if not user:
        return jsonify({"error": f"User with email '{email}' not found."}), 404

    # Keep track of existing items
    existing_items = {w.product_id: w for w in user.wishlist_items}
    
    # Add any missing items from items
    for item_id in items:
        pid = str(item_id).strip()
        if pid and pid not in existing_items:
            db.session.add(WishlistItem(user_id=user.id, product_id=pid))

    db.session.commit()

    current_items = [item.product_id for item in user.wishlist_items]
    return jsonify({
        "message": f"Wishlist synchronized for {user.email}",
        "user_email": user.email,
        "wishlist": current_items,
        "count": len(current_items)
    }), 200


@wishlist_bp.route("/clear", methods=["POST"])
def clear_wishlist():
    """Clear all wishlist items belonging exclusively to the specified user."""
    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        return jsonify({"error": "User email is required."}), 400

    user = User.query.filter_by(email=email.strip().lower()).first()
    if not user:
        return jsonify({"error": f"User with email '{email}' not found."}), 404

    WishlistItem.query.filter_by(user_id=user.id).delete()
    db.session.commit()

    return jsonify({
        "message": f"Wishlist cleared for {user.email}",
        "user_email": user.email,
        "wishlist": [],
        "count": 0
    }), 200
