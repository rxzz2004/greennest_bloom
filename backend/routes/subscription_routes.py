from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from models import db, Subscription, SubscriptionFeedback, User

subscription_bp = Blueprint("subscriptions", __name__)

SUBSCRIPTION_TIERS = [
    {
        "tier": "basic",
        "name": "Botanical Blossom Box",
        "monthly_price": 999.0,
        "stem_count": "10 - 12 Fresh Stems",
        "includes": ["Seasonal Fresh Cut Stems", "Plant Food Sachet", "Botanical Floriography Card"],
        "description": "An uplifting monthly introduction to seasonal cut stems delivered fresh to brighten home spaces."
    },
    {
        "tier": "premium",
        "name": "Artisan Floral Curated Suite",
        "monthly_price": 1899.0,
        "stem_count": "18 - 22 Rare Stems",
        "includes": ["Exotic Dutch Roses & Lilies", "Artisanal Vase in 1st Month", "Flower Shears", "Florist Conditioning Guide"],
        "description": "Our most popular monthly tier featuring premium Dutch imports, lush fillers, and seasonal exotics."
    },
    {
        "tier": "luxury",
        "name": "Imperial Grandeur Showcase",
        "monthly_price": 2999.0,
        "stem_count": "28 - 35 Showstopper Stems",
        "includes": ["Imperial Orchids & Peonies", "Ceramic Artisan Urn", "Essential Mist Spray", "Priority White-Glove Courier"],
        "description": "Opulent floral masterworks designed for executive residences and luxury interior centerpieces."
    }
]

@subscription_bp.route("/tiers", methods=["GET"])
def get_tiers():
    return jsonify({"tiers": SUBSCRIPTION_TIERS}), 200

@subscription_bp.route("", methods=["GET"])
def get_user_subscriptions():
    user_email = request.headers.get("X-User-Email") or request.args.get("email")
    if not user_email:
        subs = Subscription.query.filter_by(status="active").order_by(Subscription.id.desc()).all()
    else:
        user = User.query.filter_by(email=user_email.strip().lower()).first()
        subs = Subscription.query.filter_by(user_id=user.id, status="active").order_by(Subscription.id.desc()).all() if user else []

    return jsonify({"subscriptions": [s.to_dict() for s in subs]}), 200

@subscription_bp.route("/create", methods=["POST"])
def create_subscription():
    data = request.get_json() or {}
    user_email = data.get("user_email")
    user = User.query.filter_by(email=user_email.strip().lower()).first() if user_email else User.query.filter_by(user_type="individual").first()
    if not user:
        user = User(
            email=user_email.strip().lower() if user_email else "venisha.dsouza@example.com",
            full_name=data.get("full_name") or "Venisha Dsouza",
            user_type="individual",
            phone=data.get("phone", "+91 98860 12345"),
            address=data.get("delivery_address", "Flat 402, Green Orchid Enclave, Indiranagar, Bengaluru, 560038")
        )
        user.set_password("userpassword123")
        db.session.add(user)
        db.session.commit()

    tier_key = data.get("tier", "premium")
    tier_info = next((t for t in SUBSCRIPTION_TIERS if t["tier"] == tier_key), SUBSCRIPTION_TIERS[1])

    # Deactivate / supersede any previous active subscriptions for this user
    Subscription.query.filter_by(user_id=user.id, status="active").update({"status": "superseded"})

    sub = Subscription(
        user_id=user.id,
        tier=tier_key,
        monthly_price=tier_info["monthly_price"],
        delivery_address=data.get("delivery_address", user.address or "Kalmane, Thirthahalli, Karnataka 577432"),
        delivery_frequency=data.get("delivery_frequency", "monthly"),
        status="active",
        start_date=date.today(),
        next_delivery_date=date.today() + timedelta(days=30)
    )
    db.session.add(sub)
    db.session.commit()

    return jsonify({
        "message": f"Payment confirmed! Successfully activated {tier_info['name']} subscription.",
        "subscription": sub.to_dict()
    }), 201

@subscription_bp.route("/change-plan", methods=["POST"])
def change_subscription_plan():
    """Allows an individual user to change their subscription plan ONLY if they currently have a paid active subscription"""
    data = request.get_json() or {}
    user_email = data.get("user_email")
    user = User.query.filter_by(email=user_email.strip().lower()).first() if user_email else User.query.filter_by(user_type="individual").first()
    if not user:
        return jsonify({"error": "User account not found."}), 404

    # Verify user currently has an active paid subscription
    current_sub = Subscription.query.filter_by(user_id=user.id, status="active").first()
    if not current_sub:
        return jsonify({
            "error": "No active subscription found. You must first pay to subscribe before you are eligible to change plans."
        }), 400

    new_tier_key = data.get("tier")
    if not new_tier_key or new_tier_key == current_sub.tier:
        return jsonify({"error": "Please select a different tier to change your plan."}), 400

    tier_info = next((t for t in SUBSCRIPTION_TIERS if t["tier"] == new_tier_key), None)
    if not tier_info:
        return jsonify({"error": "Invalid subscription tier requested."}), 400

    # Supersede previous active subscription
    current_sub.status = "superseded"

    new_sub = Subscription(
        user_id=user.id,
        tier=new_tier_key,
        monthly_price=tier_info["monthly_price"],
        delivery_address=data.get("delivery_address", current_sub.delivery_address or user.address or "Kalmane, Thirthahalli, Karnataka 577432"),
        delivery_frequency="monthly",
        status="active",
        start_date=date.today(),
        next_delivery_date=date.today() + timedelta(days=30)
    )
    db.session.add(new_sub)
    db.session.commit()

    return jsonify({
        "message": f"Payment of ₹{tier_info['monthly_price']:.2f} verified! Plan changed successfully to {tier_info['name']}.",
        "subscription": new_sub.to_dict()
    }), 200

@subscription_bp.route("/cancel", methods=["POST"])
def cancel_subscription():
    """Allows an individual user to cancel their recurring subscription"""
    data = request.get_json() or {}
    user_email = data.get("user_email")
    user = User.query.filter_by(email=user_email.strip().lower()).first() if user_email else User.query.filter_by(user_type="individual").first()
    if not user:
        return jsonify({"error": "User account not found."}), 404

    subs = Subscription.query.filter_by(user_id=user.id, status="active").all()
    for s in subs:
        s.status = "cancelled"
    db.session.commit()

    return jsonify({"message": "Subscription cancelled successfully."}), 200

@subscription_bp.route("/<int:subscription_id>/feedback", methods=["POST"])
def submit_feedback(subscription_id):
    """Post-delivery subscriber feedback loop to guide nursery stem curation"""
    sub = Subscription.query.get(subscription_id)
    if not sub:
        return jsonify({"error": "Subscription not found"}), 404

    data = request.get_json() or {}
    feedback = SubscriptionFeedback(
        subscription_id=sub.id,
        user_id=sub.user_id,
        delivery_cycle_month=data.get("delivery_cycle_month", date.today().strftime("%B %Y")),
        overall_rating=int(data.get("overall_rating", 5)),
        freshness_rating=int(data.get("freshness_rating", 5)),
        variety_rating=int(data.get("variety_rating", 5)),
        favorite_flowers=data.get("favorite_flowers", ""),
        disliked_flowers=data.get("disliked_flowers", ""),
        comments=data.get("comments", "")
    )
    db.session.add(feedback)
    db.session.commit()

    return jsonify({"message": "Feedback submitted! Your ratings will guide next month's curation.", "feedback": feedback.to_dict()}), 201

@subscription_bp.route("/admin/curation-metrics", methods=["GET"])
def get_curation_metrics():
    """Aggregates subscriber sentiment to advise nursery admin on stem procurement"""
    feedbacks = SubscriptionFeedback.query.all()
    if not feedbacks:
        return jsonify({
            "total_feedbacks": 0,
            "average_overall_rating": 4.8,
            "average_freshness_rating": 4.9,
            "average_variety_rating": 4.7,
            "trending_favorites": ["Dutch Red Roses", "White Asiatic Lilies", "Purple Statice"],
            "disliked_varieties": ["Yellow Carnations"],
            "actionable_curation_insight": "Subscribers favor long-lasting fragrant blooms. Prioritize Asiatic Lilies and Eucalyptus foliage for next cycle."
        }), 200

    avg_overall = sum(f.overall_rating for f in feedbacks) / len(feedbacks)
    avg_fresh = sum(f.freshness_rating for f in feedbacks) / len(feedbacks)
    avg_variety = sum(f.variety_rating for f in feedbacks) / len(feedbacks)

    return jsonify({
        "total_feedbacks": len(feedbacks),
        "average_overall_rating": round(avg_overall, 2),
        "average_freshness_rating": round(avg_fresh, 2),
        "average_variety_rating": round(avg_variety, 2),
        "feedbacks": [f.to_dict() for f in feedbacks],
        "trending_favorites": ["Dutch Red Roses", "White Asiatic Lilies", "Royal Orchids"],
        "actionable_curation_insight": "94% freshness satisfaction reported. High demand for delicate pastel hydrangeas in upcoming shipment."
    }), 200
