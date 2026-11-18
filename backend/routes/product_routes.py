from flask import Blueprint, request, jsonify
from models import db, Product

product_bp = Blueprint("products", __name__)

@product_bp.route("", methods=["GET"])
def get_products():
    category = request.args.get("category")
    is_perishable = request.args.get("is_perishable")
    search = request.args.get("search", "").strip().lower()

    query = Product.query

    if category:
        query = query.filter_by(category=category)
    if is_perishable is not None:
        query = query.filter_by(is_perishable=is_perishable.lower() == "true")

    products = query.all()

    if search:
        products = [
            p for p in products
            if search in p.name.lower() or 
               (p.botanical_name and search in p.botanical_name.lower()) or 
               (p.floriography_meaning and search in p.floriography_meaning.lower())
        ]

    return jsonify({"products": [p.to_dict() for p in products]}), 200

@product_bp.route("/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify({"product": product.to_dict()}), 200

@product_bp.route("", methods=["POST"])
def create_product():
    data = request.get_json() or {}
    product = Product(
        name=data.get("name"),
        category=data.get("category", "potted_plant"),
        is_perishable=bool(data.get("is_perishable", False)),
        base_price=float(data.get("base_price", 100.0)),
        b2b_min_quantity=int(data.get("b2b_min_quantity", 1)),
        b2b_discount_percent=float(data.get("b2b_discount_percent", 0.0)),
        hsn_code=data.get("hsn_code", "0602"),
        botanical_name=data.get("botanical_name"),
        sunlight_requirement=data.get("sunlight_requirement"),
        watering_frequency=data.get("watering_frequency"),
        vase_life_days=int(data.get("vase_life_days", 5)),
        floriography_meaning=data.get("floriography_meaning"),
        image_url=data.get("image_url"),
        stock_quantity=int(data.get("stock_quantity", 50))
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({"message": "Product created", "product": product.to_dict()}), 201
