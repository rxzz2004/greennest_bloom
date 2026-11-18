from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, PushNotificationToken

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")

@notification_bp.route("/register-token", methods=["POST"])
def register_token():
    """Registers or updates a client device push notification token."""
    data = request.get_json() or {}
    token = (data.get("token") or "").strip()
    platform = (data.get("platform") or "web").strip().lower()
    device_info = data.get("device_info") or "Browser Device"
    user_id = data.get("user_id") or None

    if not token:
        return jsonify({"error": "Device token is required."}), 400

    existing = PushNotificationToken.query.filter_by(token=token).first()
    if existing:
        existing.is_active = True
        existing.platform = platform
        existing.device_info = device_info
        if user_id:
            existing.user_id = user_id
        existing.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({
            "status": "success",
            "message": "Push notification token refreshed.",
            "token": existing.to_dict()
        }), 200

    new_token = PushNotificationToken(
        user_id=user_id,
        token=token,
        platform=platform,
        device_info=device_info,
        is_active=True
    )
    db.session.add(new_token)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Device successfully registered for live order & dispatch push alerts.",
        "token": new_token.to_dict()
    }), 201

@notification_bp.route("/active-tokens", methods=["GET"])
def list_active_tokens():
    """Lists registered active notification listener tokens."""
    tokens = PushNotificationToken.query.filter_by(is_active=True).all()
    return jsonify({
        "status": "success",
        "total_active_devices": len(tokens),
        "tokens": [t.to_dict() for t in tokens]
    }), 200

@notification_bp.route("/broadcast-alert", methods=["POST"])
def broadcast_alert():
    """Simulates broadcasting a live dispatch or order update push notification to active devices."""
    data = request.get_json() or {}
    title = data.get("title") or "GreenNest Bloom Dispatch"
    message = data.get("message") or "Your botanical arrangement is out for delivery with temperature-controlled protection!"
    
    active_tokens = PushNotificationToken.query.filter_by(is_active=True).all()
    
    return jsonify({
        "status": "success",
        "broadcast_title": title,
        "broadcast_message": message,
        "dispatched_devices_count": len(active_tokens),
        "dispatched_at": datetime.utcnow().isoformat()
    }), 200
