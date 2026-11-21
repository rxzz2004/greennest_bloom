import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Order, OrderItem, Product, DeliveryTelemetry, OccasionReminder, User, DeliveryPartner
from services.decay_service import DecayService
from services.invoice_service import InvoiceService
from services.alert_service import AlertService
from config import Config

order_bp = Blueprint("orders", __name__)

@order_bp.route("/checkout", methods=["POST"])
def checkout():
    data = request.get_json() or {}
    user_email = data.get("user_email")
    user = User.query.filter_by(email=user_email).first() if user_email else None
    if not user:
        user = User.query.first()

    order_type = data.get("order_type", "b2c_retail")  # b2c_retail, b2b_wholesale, custom_bouquet
    cart_items = data.get("items", [])

    if not cart_items:
        return jsonify({"error": "Cart is empty"}), 400

    # Rule enforcement: B2C retail cap vs B2B wholesale MOQ
    if user.user_type == "individual":
        total_qty = sum(item.get("quantity", 1) for item in cart_items)
        if total_qty > Config.MAX_RETAIL_PLANTS_PER_ORDER:
            return jsonify({
                "error": f"Individual accounts are restricted to retail purchases (maximum {Config.MAX_RETAIL_PLANTS_PER_ORDER} items per order). Please register as a verified Business account for wholesale trays."
            }), 403

    subtotal = 0.0
    processed_items = []

    for item in cart_items:
        product_id = item.get("product_id")
        qty = int(item.get("quantity", 1))
        product = Product.query.get(product_id) if product_id else None

        if product:
            # Enforce B2B MOQ for corporate accounts
            if user.user_type == "corporate" and qty < product.b2b_min_quantity:
                return jsonify({
                    "error": f"Wholesale Minimum Order Quantity (MOQ) for '{product.name}' is {product.b2b_min_quantity} units. Your cart has {qty}."
                }), 422

            # Calculate price and discount
            unit_price = product.base_price
            discount = product.b2b_discount_percent if user.user_type == "corporate" else 0.0
            
            # If perishable, attempt FEFO allocation
            batch_id = None
            if product.is_perishable:
                alloc, msg = DecayService.get_fefo_allocation(product.id, qty)
                if alloc:
                    batch_id = alloc[0]["batch_id"]
                    discount = max(discount, alloc[0]["discount_percent"])

            item_total = round(unit_price * qty * (1.0 - (discount / 100.0)), 2)
            subtotal += item_total
            processed_items.append({
                "product_id": product.id,
                "batch_id": batch_id,
                "name": product.name,
                "qty": qty,
                "unit_price": unit_price,
                "discount": discount,
                "total": item_total
            })
        else:
            # Custom bouquet or direct item
            item_name = item.get("name", "Custom Floral Creation")
            price = float(item.get("price", 850.0))
            item_total = round(price * qty, 2)
            subtotal += item_total
            processed_items.append({
                "product_id": None,
                "batch_id": None,
                "name": item_name,
                "qty": qty,
                "unit_price": price,
                "discount": 0.0,
                "total": item_total
            })

    # Tax calculation (5% GST on floriculture)
    tax_total = round(subtotal * 0.05, 2)
    cgst = round(tax_total / 2.0, 2)
    sgst = round(tax_total / 2.0, 2)
    grand_total = round(subtotal + tax_total, 2)

    order_num = f"GNB-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    order = Order(
        user_id=user.id,
        order_number=order_num,
        order_type=order_type,
        subtotal=subtotal,
        tax_cgst=cgst,
        tax_sgst=sgst,
        tax_igst=0.0,
        total_amount=grand_total,
        payment_method="Cash on Delivery (COD)",
        payment_status="Pending Payment on Delivery",
        order_status="dispatched",
        shipping_address=data.get("shipping_address", user.address or "Bangalore Residency Road")
    )
    db.session.add(order)
    db.session.flush()

    for pi in processed_items:
        db_item = OrderItem(
            order_id=order.id,
            product_id=pi["product_id"],
            batch_id=pi["batch_id"],
            item_name=pi["name"],
            quantity=pi["qty"],
            unit_price=pi["unit_price"],
            discount_percent=pi["discount"],
            total_price=pi["total"]
        )
        db.session.add(db_item)

    # Select and assign active courier partner from cold-chain fleet
    courier = DeliveryPartner.query.filter_by(status="available").first()
    if not courier:
        courier = DeliveryPartner.query.first()

    driver_name = courier.full_name if courier else "Ramesh Kumar"
    driver_phone = courier.phone if courier else "+91 98765 43210"
    vehicle_num = courier.vehicle_number if courier else "KA-14-EV-4402"
    vehicle_type = courier.vehicle_type if courier else "Refrigerated EV Van"

    if courier:
        courier.active_order_id = order.id
        courier.status = "en_route"
        courier.speed_kmh = 38.0

    # Initialize live delivery telemetry starting at the Nursery Depot
    telemetry = DeliveryTelemetry(
        order_id=order.id,
        driver_name=f"{driver_name} (GNB Fleet)",
        driver_phone=driver_phone,
        vehicle_number=vehicle_num,
        current_lat=Config.DEPOT_LATITUDE,
        current_lng=Config.DEPOT_LONGITUDE,
        speed_kmh=38.0,
        estimated_eta_minutes=25,
        status="en_route"
    )
    db.session.add(telemetry)
    db.session.commit()

    # Automatically notify customer which courier is delivering their arrangement
    try:
        customer_email = user.email if user and user.email else "customer@greennestbloom.com"
        AlertService.trigger_courier_assigned_customer_alert(
            customer_email=customer_email,
            order_number=order.order_number,
            driver_name=driver_name,
            driver_phone=driver_phone,
            vehicle_type=vehicle_type,
            vehicle_number=vehicle_num,
            eta_minutes=25
        )
    except Exception as ex:
        print(f"[OrderRoutes] Courier notification error: {ex}")

    return jsonify({
        "message": "Order confirmed via Cash on Delivery. Dispatched with official GST Tax Invoice.",
        "order": order.to_dict()
    }), 201

@order_bp.route("", methods=["GET"])
def get_orders():
    user_email = request.headers.get("X-User-Email") or request.args.get("email")
    if not user_email:
        orders = Order.query.order_by(Order.created_at.desc()).all()
    else:
        user = User.query.filter_by(email=user_email.strip().lower()).first()
        orders = Order.query.filter_by(user_id=user.id).order_by(Order.created_at.desc()).all() if user else []

    return jsonify({"orders": [o.to_dict() for o in orders]}), 200

@order_bp.route("/<int:order_id>", methods=["GET"])
def get_order_details(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify({"order": order.to_dict()}), 200

@order_bp.route("/<int:order_id>/invoice", methods=["GET"])
def get_invoice(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    invoice_data = InvoiceService.generate_gst_invoice(order)
    return jsonify({"invoice": invoice_data}), 200

@order_bp.route("/reminders", methods=["GET", "POST"])
def manage_reminders():
    if request.method == "GET":
        reminders = OccasionReminder.query.all()
        return jsonify({"reminders": [r.to_dict() for r in reminders]}), 200

    data = request.get_json() or {}
    user = User.query.first()
    reminder = OccasionReminder(
        user_id=user.id,
        recipient_name=data.get("recipient_name", "Beloved"),
        occasion_type=data.get("occasion_type", "Birthday"),
        occasion_date=datetime.strptime(data.get("occasion_date"), "%Y-%m-%d").date(),
        preferred_flower_type=data.get("preferred_flower_type", "Dutch Red Roses"),
        notes=data.get("notes", "")
    )
    db.session.add(reminder)
    db.session.commit()
    return jsonify({"message": "Occasion reminder saved with 1-tap reorder enabled.", "reminder": reminder.to_dict()}), 201
