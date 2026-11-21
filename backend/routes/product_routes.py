from flask import Blueprint, request, jsonify
from models import db, Product, PerishableBatch, ProductReview

product_bp = Blueprint("products", __name__)

@product_bp.route("", methods=["GET"])
def get_products():
    category = request.args.get("category")
    is_perishable = request.args.get("is_perishable")
    search = request.args.get("search", "").strip().lower()

    query = Product.query

    if category and category.lower() != "all" and category.lower() != "everything":
        query = query.filter_by(category=category)
    if is_perishable is not None:
        query = query.filter_by(is_perishable=is_perishable.lower() == "true")

    products = query.order_by(Product.id.desc()).all()

    if search:
        products = [
            p for p in products
            if search in p.name.lower() or 
               (p.botanical_name and search in p.botanical_name.lower()) or 
               (p.category and search in p.category.lower()) or
               (p.floriography_meaning and search in p.floriography_meaning.lower())
        ]

    return jsonify({"products": [p.to_dict() for p in products]}), 200

@product_bp.route("/categories", methods=["GET"])
def get_categories():
    products = Product.query.all()
    category_counts = {}
    for p in products:
        cat = p.category or "General"
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    categories = [{"name": cat, "count": count} for cat, count in sorted(category_counts.items())]
    return jsonify({"categories": categories}), 200

@product_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify({"product": product.to_dict()}), 200

@product_bp.route("", methods=["POST"])
def create_product():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Product name is required"}), 400

    description = data.get("description") or data.get("floriography_meaning") or ""
    category = (data.get("category") or "Living Nursery Plants").strip()
    is_perishable = bool(data.get("is_perishable", False))
    price = float(data.get("base_price") or data.get("price") or 100.0)
    stock = int(data.get("stock_quantity") or 50)
    image_url = data.get("image_url") or "/pink_lily_bloom.jpg"

    product = Product(
        name=name,
        category=category,
        is_perishable=is_perishable,
        base_price=price,
        b2b_min_quantity=int(data.get("b2b_min_quantity", 1)),
        b2b_discount_percent=float(data.get("b2b_discount_percent", 0.0)),
        hsn_code=data.get("hsn_code", "0603" if is_perishable else "0602"),
        botanical_name=data.get("botanical_name") or "",
        sunlight_requirement=data.get("sunlight_requirement") or ("Bright Indirect Light" if not is_perishable else None),
        watering_frequency=data.get("watering_frequency") or ("Water when topsoil is dry" if not is_perishable else None),
        vase_life_days=int(data.get("vase_life_days", 7 if is_perishable else 0)),
        floriography_meaning=description,
        image_url=image_url,
        stock_quantity=stock
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({"message": f"'{product.name}' added to database successfully", "product": product.to_dict()}), 201

@product_bp.route("/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    data = request.get_json() or {}
    if "name" in data and data["name"].strip():
        product.name = data["name"].strip()
    if "category" in data and data["category"].strip():
        product.category = data["category"].strip()
    if "is_perishable" in data:
        product.is_perishable = bool(data["is_perishable"])
    if "base_price" in data or "price" in data:
        product.base_price = float(data.get("base_price") or data.get("price") or product.base_price)
    if "stock_quantity" in data:
        product.stock_quantity = int(data["stock_quantity"])
    if "image_url" in data and data["image_url"]:
        product.image_url = data["image_url"]
    if "botanical_name" in data:
        product.botanical_name = data["botanical_name"]
    if "sunlight_requirement" in data:
        product.sunlight_requirement = data["sunlight_requirement"]
    if "watering_frequency" in data:
        product.watering_frequency = data["watering_frequency"]
    if "vase_life_days" in data:
        product.vase_life_days = int(data["vase_life_days"])
    if "description" in data or "floriography_meaning" in data:
        product.floriography_meaning = data.get("description") or data.get("floriography_meaning")

    db.session.commit()
    return jsonify({"message": f"'{product.name}' updated successfully", "product": product.to_dict()}), 200

@product_bp.route("/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    name = product.name
    # Delete dependent batches & reviews
    PerishableBatch.query.filter_by(product_id=product_id).delete()
    ProductReview.query.filter_by(product_id=product_id).delete()

    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": f"'{name}' deleted successfully"}), 200

@product_bp.route("/clear-all", methods=["POST"])
def clear_all_products():
    # Remove all batches and reviews first
    PerishableBatch.query.delete()
    ProductReview.query.delete()
    deleted_count = Product.query.delete()
    db.session.commit()
    return jsonify({
        "message": f"Successfully removed {deleted_count} products and cleared database for fresh admin entries",
        "deleted_count": deleted_count
    }), 200
