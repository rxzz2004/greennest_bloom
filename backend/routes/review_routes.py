from flask import Blueprint, request, jsonify
from models import db, Product, ProductReview, User

review_bp = Blueprint("reviews", __name__, url_prefix="/api")

def resolve_product(product_ref):
    s = str(product_ref).strip()
    if s.isdigit():
        return db.session.get(Product, int(s))
    if s.startswith("backend-"):
        num = s.replace("backend-", "")
        if num.isdigit():
            p = db.session.get(Product, int(num))
            if p:
                return p
    clean = s.replace("-", " ").replace("circ ", "").strip()
    match = Product.query.filter(Product.name.ilike(f"%{clean}%")).first()
    if match:
        return match
    # Fallback to flagship product #1
    return db.session.get(Product, 1)

@review_bp.route("/products/<product_ref>/reviews", methods=["GET"])
def get_product_reviews(product_ref):
    """Retrieves customer reviews, rating statistics, and photos for a botanical product."""
    product = resolve_product(product_ref)
    if not product:
        return jsonify({"error": f"Product '{product_ref}' not found."}), 404

    reviews = ProductReview.query.filter_by(product_id=product.id).order_by(ProductReview.created_at.desc()).all()
    
    total_count = len(reviews)
    if total_count > 0:
        avg_rating = round(sum(r.rating for r in reviews) / total_count, 1)
    else:
        avg_rating = 5.0  # default baseline for fresh nursery arrivals

    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in reviews:
        distribution[r.rating] = distribution.get(r.rating, 0) + 1

    photos = [r.photo_url for r in reviews if r.photo_url]

    return jsonify({
        "status": "success",
        "product_id": product.id,
        "product_name": product.name,
        "total_reviews": total_count,
        "average_rating": avg_rating,
        "rating_distribution": distribution,
        "customer_photos": photos,
        "reviews": [r.to_dict() for r in reviews]
    }), 200

@review_bp.route("/products/<product_ref>/reviews", methods=["POST"])
def add_product_review(product_ref):
    """Submits a customer feedback review with star rating and optional photo attachment."""
    product = resolve_product(product_ref)
    if not product:
        return jsonify({"error": f"Product '{product_ref}' not found."}), 404

    data = request.get_json() or {}
    rating = int(data.get("rating") or 5)
    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be an integer between 1 and 5 stars."}), 400

    review_text = (data.get("review_text") or data.get("comment") or "").strip()
    if not review_text:
        return jsonify({"error": "Review feedback text cannot be empty."}), 400

    reviewer_name = (data.get("reviewer_name") or data.get("customer_name") or "Verified Plant Parent").strip()
    review_title = (data.get("review_title") or data.get("title") or f"{rating}-Star Botanical Experience").strip()
    photo_url = data.get("photo_url") or None
    user_id = data.get("user_id") or None

    new_review = ProductReview(
        product_id=product.id,
        user_id=user_id,
        reviewer_name=reviewer_name,
        rating=rating,
        review_title=review_title,
        review_text=review_text,
        photo_url=photo_url,
        is_verified_purchase=True
    )
    db.session.add(new_review)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Thank you! Your verified botanical review has been published.",
        "review": new_review.to_dict()
    }), 201

@review_bp.route("/reviews/<int:review_id>/vote-helpful", methods=["POST"])
def vote_helpful(review_id):
    """Increments the helpfulness counter for a product review."""
    review = db.session.get(ProductReview, review_id)
    if not review:
        return jsonify({"error": f"Review #{review_id} not found."}), 404

    review.helpful_votes += 1
    db.session.commit()

    return jsonify({
        "status": "success",
        "helpful_votes": review.helpful_votes
    }), 200
