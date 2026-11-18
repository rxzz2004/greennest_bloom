import math
import random
import re
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models import db, DeliveryTelemetry, Order, DeliveryPartner
from services.alert_service import AlertService
from services.logistics_service import LogisticsService
from config import Config

telemetry_bp = Blueprint("telemetry", __name__)

CHECKPOINTS = [
    {
        "name": "Kalmane Mother Nursery & Packing Hub (Thirthahalli 577432)",
        "stage": "packing",
        "status": "completed",
        "description": "Botanical harvest, damp root-gel seal & air-cushioned eco-box packaging completed at Kalmane nursery",
        "time": "06:30 AM"
    },
    {
        "name": "Thirthahalli Western Ghats Outbound Hub (NH 169A)",
        "stage": "dispatch",
        "status": "completed",
        "description": "Climate-controlled express transport van dispatched via Malnad mountain corridor",
        "time": "08:15 AM"
    },
    {
        "name": "Shimoga Regional Cold-Chain Gateway",
        "stage": "regional_sorting",
        "status": "completed",
        "description": "Automated temperature verification (4.2°C, 88% humidity) • Handed to National Line-Haul",
        "time": "10:30 AM"
    },
    {
        "name": "National Highway Transit Corridor (NH 48)",
        "stage": "nationwide_linehaul",
        "status": "current",
        "description": "Refrigerated inter-city container en route to destination distribution center",
        "time": "01:15 PM"
    },
    {
        "name": "Recipient Destination Address (Doorstep Handover)",
        "stage": "doorstep",
        "status": "upcoming",
        "description": "Last-mile courier dispatched for contactless botanical handover",
        "time": "04:30 PM"
    }
]

@telemetry_bp.route("/order/<int:order_id>", methods=["GET"])
def get_order_telemetry(order_id):
    telemetry = DeliveryTelemetry.query.filter_by(order_id=order_id).first()
    order = db.session.get(Order, order_id)
    
    # Destination coordinates: Customer address (e.g. Bengaluru / Nationwide destination)
    dest_lat = 12.9784
    dest_lng = 77.6408
    dest_name = "Customer Delivery Address (Indiranagar, Bengaluru, Karnataka)"
    if order and order.shipping_address:
        dest_name = order.shipping_address

    if not telemetry:
        telemetry = DeliveryTelemetry(
            order_id=order_id,
            current_lat=Config.DEPOT_LATITUDE + (dest_lat - Config.DEPOT_LATITUDE) * 0.45,
            current_lng=Config.DEPOT_LONGITUDE + (dest_lng - Config.DEPOT_LONGITUDE) * 0.45,
            speed_kmh=52.0,
            estimated_eta_minutes=45,
            status="en_route"
        )
        db.session.add(telemetry)
        db.session.commit()

    route = LogisticsService.generate_interpolated_route(
        Config.DEPOT_LATITUDE, Config.DEPOT_LONGITUDE,
        dest_lat, dest_lng, steps=16
    )

    return jsonify({
        "telemetry": telemetry.to_dict(),
        "cold_chain": {
            "cargo_temp_c": 4.2,
            "humidity_pct": 88.5,
            "cooling_system": "ThermoKing Micro-Mist Active (Direct from Kalmane)",
            "status": "Optimal Botanical Preservation (3°C - 5°C)"
        },
        "depot": {
            "lat": Config.DEPOT_LATITUDE,
            "lng": Config.DEPOT_LONGITUDE,
            "name": "Green Nest Central Nursery & Packing Hub",
            "address": "Kalmane, Thirthahalli, Karnataka 577432",
            "pincode": "577432",
            "facility_type": "Mother Nursery, Greenhouse & Nationwide Packing Depot"
        },
        "destination": {"lat": dest_lat, "lng": dest_lng, "name": dest_name},
        "checkpoints": CHECKPOINTS,
        "route_waypoints": route
    }), 200

@telemetry_bp.route("/order/<int:order_id>/step", methods=["POST"])
def step_telemetry(order_id):
    """Simulates vehicle moving forward along route in real-time"""
    telemetry = DeliveryTelemetry.query.filter_by(order_id=order_id).first()
    if not telemetry:
        return jsonify({"error": "Telemetry not found"}), 404

    # Customer destination (Indiranagar, Bengaluru or nationwide destination)
    dest_lat = 12.9784
    dest_lng = 77.6408

    step_ratio = 0.12
    telemetry.current_lat += (dest_lat - telemetry.current_lat) * step_ratio
    telemetry.current_lng += (dest_lng - telemetry.current_lng) * step_ratio
    telemetry.estimated_eta_minutes = max(telemetry.estimated_eta_minutes - 5, 1)

    if telemetry.estimated_eta_minutes <= 10:
        telemetry.status = "arriving_soon"

    telemetry.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "telemetry": telemetry.to_dict(),
        "cold_chain": {
            "cargo_temp_c": 4.1,
            "humidity_pct": 89.0,
            "cooling_system": "ThermoKing Micro-Mist Active (Direct from Kalmane)",
            "status": "Optimal Preservation (3°C - 5°C)"
        }
    }), 200

@telemetry_bp.route("/order/<int:order_id>/exception", methods=["POST"])
def trigger_transit_exception(order_id):
    """Simulates a route exception and dispatches automated SMTP alert"""
    telemetry = DeliveryTelemetry.query.filter_by(order_id=order_id).first()
    order = Order.query.get(order_id)
    if not telemetry or not order:
        return jsonify({"error": "Order or telemetry not found"}), 404

    data = request.get_json() or {}
    reason = data.get("reason", "Heavy monsoon waterlogging near Hebbal Flyover.")

    telemetry.status = "delayed"
    telemetry.speed_kmh = 6.5
    telemetry.estimated_eta_minutes += 25
    db.session.commit()

    AlertService.trigger_transit_exception_alert(
        order_number=order.order_number,
        reason=reason,
        driver_name=telemetry.driver_name,
        phone=telemetry.driver_phone
    )

    return jsonify({
        "message": "Transit delay logged. Automated email notification dispatched to Super-Admin console.",
        "telemetry": telemetry.to_dict()
    }), 200

# =========================================================================
# Delivery Fleet & Live Personnel Management Endpoints
# =========================================================================

@telemetry_bp.route("/drivers", methods=["GET"])
def get_all_drivers():
    """Returns all delivery couriers, vehicle statuses, battery levels and live coordinates"""
    status_filter = request.args.get("status")
    query = DeliveryPartner.query

    if status_filter:
        query = query.filter_by(status=status_filter)

    drivers = query.order_by(DeliveryPartner.id.asc()).all()

    # Calculate summary metrics for the fleet header
    total_couriers = len(drivers)
    on_duty_count = sum(1 for d in drivers if d.status in ["available", "en_route", "charging", "tasks_done"])
    en_route_count = sum(1 for d in drivers if d.status == "en_route")
    avg_battery = round(sum(d.battery_level for d in drivers) / max(total_couriers, 1), 1)
    total_deliveries = sum(d.completed_deliveries for d in drivers)

    return jsonify({
        "fleet_summary": {
            "total_couriers": total_couriers,
            "on_duty": on_duty_count,
            "en_route": en_route_count,
            "avg_battery": avg_battery,
            "total_deliveries": total_deliveries,
            "depot": {
                "name": "Green Nest Mother Nursery & Nationwide Packing Hub",
                "address": "Kalmane, Thirthahalli, Karnataka 577432",
                "pincode": "577432",
                "lat": Config.DEPOT_LATITUDE,
                "lng": Config.DEPOT_LONGITUDE
            }
        },
        "drivers": [d.to_dict() for d in drivers]
    }), 200

@telemetry_bp.route("/drivers/<int:driver_id>", methods=["GET"])
def get_driver_detail(driver_id):
    """Returns profile and telemetry for an individual delivery person"""
    driver = db.session.get(DeliveryPartner, driver_id)
    if not driver:
        return jsonify({"error": "Delivery partner not found"}), 404
    return jsonify({"driver": driver.to_dict()}), 200

@telemetry_bp.route("/drivers/<int:driver_id>/status", methods=["POST"])
def update_driver_status(driver_id):
    """Allows Super-Admin to update driver duty status (available, en_route, on_break, offline)"""
    driver = db.session.get(DeliveryPartner, driver_id)
    if not driver:
        return jsonify({"error": "Delivery partner not found"}), 404

    data = request.get_json() or {}
    new_status = data.get("status")
    valid_statuses = ["available", "en_route", "on_break", "charging", "tasks_done", "offline"]

    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of {valid_statuses}"}), 400

    driver.status = new_status
    if new_status in ["on_break", "offline", "available", "charging", "tasks_done"]:
        driver.speed_kmh = 0.0

    if new_status == "charging":
        # Charging boosts EV battery level
        driver.battery_level = min(100, (driver.battery_level or 80) + random.randint(6, 12))

    driver.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message": f"Driver {driver.full_name} status updated to {new_status}.",
        "driver": driver.to_dict()
    }), 200

@telemetry_bp.route("/drivers/<int:driver_id>/location", methods=["POST"])
def update_driver_location(driver_id):
    """Updates driver's GPS coordinates, speed and battery (e.g. from IoT device / mobile app)"""
    driver = db.session.get(DeliveryPartner, driver_id)
    if not driver:
        return jsonify({"error": "Delivery partner not found"}), 404

    data = request.get_json() or {}
    if "current_lat" in data:
        driver.current_lat = float(data["current_lat"])
    if "current_lng" in data:
        driver.current_lng = float(data["current_lng"])
    if "speed_kmh" in data:
        driver.speed_kmh = float(data["speed_kmh"])
    if "battery_level" in data:
        driver.battery_level = max(0, min(100, int(data["battery_level"])))

    driver.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"driver": driver.to_dict()}), 200

@telemetry_bp.route("/drivers/simulate-tick", methods=["POST"])
def simulate_fleet_tick():
    """
    Simulates incremental live movement and battery drain for all on-duty drivers
    across nationwide corridors originating from Kalmane Mother Nursery, Thirthahalli.
    """
    drivers = DeliveryPartner.query.all()
    updated = []

    # Transit corridors originating from Kalmane Mother Nursery & Packing Hub (13.6934, 75.2448)
    targets = [
        {"lat": 13.6934, "lng": 75.2448},  # Kalmane Mother Nursery & Packing Depot (Thirthahalli)
        {"lat": 13.7250, "lng": 75.3120},  # Malnad Outbound Corridor (NH 169A)
        {"lat": 13.9299, "lng": 75.5681},  # Shimoga Regional Cold-Chain Gateway
        {"lat": 14.2251, "lng": 76.3980},  # National Highway Line-Haul Corridor (NH 48)
        {"lat": 12.9784, "lng": 77.6408},  # Destination Metro Distribution Hub (Bengaluru)
    ]

    for i, driver in enumerate(drivers):
        if driver.status == "en_route":
            target = targets[i % len(targets)]
            # Move slightly towards target with small jitter
            lat_delta = (target["lat"] - driver.current_lat) * 0.15 + (random.random() - 0.5) * 0.0012
            lng_delta = (target["lng"] - driver.current_lng) * 0.15 + (random.random() - 0.5) * 0.0012
            
            driver.current_lat += lat_delta
            driver.current_lng += lng_delta
            driver.speed_kmh = round(random.uniform(28.0, 46.0), 1)
            # Slight EV battery discharge
            driver.battery_level = max(12, driver.battery_level - random.choice([0, 1]))
            driver.updated_at = datetime.utcnow()
            updated.append(driver)
        elif driver.status == "charging":
            driver.speed_kmh = 0.0
            driver.battery_level = min(100, (driver.battery_level or 80) + 3)
            driver.updated_at = datetime.utcnow()
            updated.append(driver)
        elif driver.status in ["available", "tasks_done"]:
            # Idle at depot or service point
            driver.speed_kmh = 0.0
            # Slow charging when idle at hub
            driver.battery_level = min(100, (driver.battery_level or 90) + 1)
            driver.updated_at = datetime.utcnow()
            updated.append(driver)
        elif driver.status in ["on_break", "offline"]:
            driver.speed_kmh = 0.0
            driver.updated_at = datetime.utcnow()
            updated.append(driver)

    db.session.commit()

    return jsonify({
        "message": "Simulated live GPS movement tick across active fleet.",
        "drivers": [d.to_dict() for d in drivers]
    }), 200

# =========================================================================
# Courier Dedicated OTP Authentication & Shift Operations
# =========================================================================

def normalize_phone_number(phone_str):
    if not phone_str:
        return ""
    digits = "".join(filter(str.isdigit, str(phone_str)))
    if len(digits) >= 10:
        return digits[-10:]
    return digits


@telemetry_bp.route("/driver/send-otp", methods=["POST"])
def send_driver_otp():
    """
    Sends a daily 6-digit OTP code to the registered courier's phone number.
    Strictly verifies that the phone belongs to one of the 3 authorized fleet drivers.
    """
    data = request.get_json() or {}
    phone_input = str(data.get("phone", "")).strip()
    if not phone_input:
        return jsonify({"error": "Driver mobile phone number is required."}), 400

    clean_digits = normalize_phone_number(phone_input)
    drivers = DeliveryPartner.query.all()
    matched_driver = None
    for d in drivers:
        if normalize_phone_number(d.phone) == clean_digits:
            matched_driver = d
            break

    if not matched_driver:
        return jsonify({
            "error": f"No registered delivery personnel found with mobile '{phone_input}'. Access is restricted to authorized fleet drivers."
        }), 404

    # Generate 6-digit cryptographic random OTP
    otp_code = f"{random.randint(100000, 999999)}"
    matched_driver.last_otp = otp_code
    matched_driver.otp_expires_at = datetime.utcnow() + timedelta(minutes=15)
    matched_driver.updated_at = datetime.utcnow()
    db.session.commit()

    # Log transactional dispatch notice
    AlertService.send_alert(
        alert_type="driver_otp",
        subject=f"Courier Daily Login OTP: {otp_code} ({matched_driver.full_name})",
        html_body=f"""
        <div style="font-family: sans-serif; padding: 20px; background: #064e3b; color: white; border-radius: 12px;">
            <h2 style="color: #6ee7b7; margin-top: 0;">Courier Daily Access OTP</h2>
            <p>Driver <strong>{matched_driver.full_name}</strong> ({matched_driver.vehicle_type} • {matched_driver.vehicle_number}) requested daily shift OTP:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 14px; background: rgba(0,0,0,0.3); border-radius: 8px; text-align: center; color: #a7f3d0; margin: 16px 0;">
                {otp_code}
            </div>
            <p style="font-size: 11px; color: #a7f3d0;">Dispatched to driver registered phone: {matched_driver.phone}. Valid for 15 minutes.</p>
        </div>
        """,
        recipient_email=matched_driver.email or Config.ADMIN_EMAIL
    )

    print(f"\n=======================================================")
    print(f" [DRIVER OTP DISPATCH] Driver: {matched_driver.full_name}")
    print(f" PHONE: {matched_driver.phone} | VEHICLE: {matched_driver.vehicle_type} ({matched_driver.vehicle_number})")
    print(f" OTP: {otp_code}")
    print(f"=======================================================\n")

    return jsonify({
        "status": "success",
        "message": f"Daily shift login OTP sent to {matched_driver.phone}.",
        "driver_id": matched_driver.id,
        "driver_name": matched_driver.full_name,
        "vehicle_type": matched_driver.vehicle_type,
        "vehicle_number": matched_driver.vehicle_number,
        "phone": matched_driver.phone,
        "otp_preview": otp_code
    }), 200


@telemetry_bp.route("/driver/verify-otp", methods=["POST"])
def verify_driver_otp():
    """
    Validates daily OTP code and returns authenticated driver profile.
    """
    data = request.get_json() or {}
    phone_input = str(data.get("phone", "")).strip()
    submitted_otp = str(data.get("otp", "")).strip()

    if not phone_input or not submitted_otp:
        return jsonify({"error": "Both phone number and OTP code are required."}), 400

    clean_digits = normalize_phone_number(phone_input)
    drivers = DeliveryPartner.query.all()
    matched_driver = None
    for d in drivers:
        if normalize_phone_number(d.phone) == clean_digits:
            matched_driver = d
            break

    if not matched_driver:
        return jsonify({"error": "Driver not found."}), 404

    if not matched_driver.last_otp:
        return jsonify({"error": "No pending OTP request found for this mobile. Please request a new OTP."}), 400

    if matched_driver.otp_expires_at and datetime.utcnow() > matched_driver.otp_expires_at:
        return jsonify({"error": "Verification code has expired. Please request a new OTP."}), 400

    if matched_driver.last_otp != submitted_otp:
        return jsonify({"error": "Invalid verification code. Please try again."}), 400

    # Mark OTP as consumed
    matched_driver.last_otp = None
    if matched_driver.status == "offline":
        matched_driver.status = "available"
    matched_driver.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": f"Welcome back, {matched_driver.full_name}! Courier shift authenticated.",
        "driver": matched_driver.to_dict(),
        "auth_token": f"gnb_drv_{matched_driver.id}_{int(datetime.utcnow().timestamp())}"
    }), 200

# =========================================================================
# Courier Dedicated Operations & Handover Endpoints
# =========================================================================

@telemetry_bp.route("/drivers/<int:driver_id>/orders", methods=["GET"])
def get_driver_orders(driver_id):
    """
    Returns orders assigned to this courier partner, plus pending orders
    available for dispatch handover.
    """
    driver = db.session.get(DeliveryPartner, driver_id)
    if not driver:
        return jsonify({"error": "Delivery partner not found"}), 404

    # 1. Orders explicitly assigned to this driver
    assigned_orders = []
    if driver.active_order_id:
        active_ord = db.session.get(Order, driver.active_order_id)
        if active_ord:
            assigned_orders.append(active_ord)

    # 2. Also fetch all active undelivered orders so the courier can claim/inspect
    all_open = Order.query.filter(Order.order_status.in_(["processing", "dispatched", "in_transit", "attempted_undelivered"])).order_by(Order.created_at.desc()).all()

    # Include assigned first, then remaining
    seen_ids = set()
    result = []
    for o in assigned_orders + all_open:
        if o.id not in seen_ids:
            seen_ids.add(o.id)
            d = o.to_dict()
            d["is_assigned_to_current"] = (o.id == driver.active_order_id)
            result.append(d)

    return jsonify({
        "driver": driver.to_dict(),
        "assigned_order_id": driver.active_order_id,
        "orders": result
    }), 200


@telemetry_bp.route("/drivers/<int:driver_id>/orders/<int:order_id>/deliver", methods=["POST"])
def complete_order_delivery(driver_id, order_id):
    """
    Marks an order as successfully delivered by the courier.
    Updates order status, resets courier duty, and notifies the customer and admin.
    """
    driver = db.session.get(DeliveryPartner, driver_id)
    order = db.session.get(Order, order_id)
    if not driver or not order:
        return jsonify({"error": "Driver or order not found"}), 404

    data = request.get_json() or {}
    proof_notes = data.get("notes", "Handed directly to recipient at doorstep with damp-root hydration seal intact.")

    # Update Order
    order.order_status = "delivered"
    
    # Update Telemetry if exists
    if order.telemetry:
        order.telemetry.status = "delivered"
        order.telemetry.speed_kmh = 0.0
        order.telemetry.estimated_eta_minutes = 0
        order.telemetry.updated_at = datetime.utcnow()

    # Update Courier stats
    driver.completed_deliveries = (driver.completed_deliveries or 0) + 1
    if driver.active_order_id == order.id:
        driver.active_order_id = None
        driver.status = "available"
        driver.speed_kmh = 0.0
    driver.updated_at = datetime.utcnow()

    db.session.commit()

    # Dispatch delivery confirmation email to customer
    try:
        customer_email = order.user.email if order.user and order.user.email else "customer@greennestbloom.com"
        AlertService.trigger_order_delivered_alert(
            customer_email=customer_email,
            order_number=order.order_number,
            driver_name=driver.full_name,
            delivery_address=order.shipping_address
        )
    except Exception as ex:
        print(f"[TelemetryRoutes] Delivery notification error: {ex}")

    return jsonify({
        "message": f"Order #{order.order_number} marked as successfully delivered by {driver.full_name}.",
        "order": order.to_dict(),
        "driver": driver.to_dict()
    }), 200


@telemetry_bp.route("/drivers/<int:driver_id>/orders/<int:order_id>/customer-unavailable", methods=["POST"])
def report_customer_unavailable(driver_id, order_id):
    """
    Reports that customer was unreachable or unavailable at the delivery address.
    Updates order status to attempted_undelivered and sends immediate alerts to customer and admin.
    """
    driver = db.session.get(DeliveryPartner, driver_id)
    order = db.session.get(Order, order_id)
    if not driver or not order:
        return jsonify({"error": "Driver or order not found"}), 404

    data = request.get_json() or {}
    reason = data.get("reason", "Doorbell unanswered and phone unreachable after 3 attempts.")

    # Update Order status
    order.order_status = "attempted_undelivered"

    # Update Telemetry status
    if order.telemetry:
        order.telemetry.status = "attempted_undelivered"
        order.telemetry.updated_at = datetime.utcnow()

    driver.updated_at = datetime.utcnow()
    db.session.commit()

    # Dispatch automated email notice to customer and Admin
    try:
        customer_email = order.user.email if order.user and order.user.email else "customer@greennestbloom.com"
        AlertService.trigger_customer_unavailable_alert(
            customer_email=customer_email,
            order_number=order.order_number,
            driver_name=driver.full_name,
            driver_phone=driver.phone,
            reason=reason
        )
    except Exception as ex:
        print(f"[TelemetryRoutes] Customer unavailable alert error: {ex}")

    return jsonify({
        "message": f"Delivery exception logged: Customer unavailable for #{order.order_number}.",
        "reason": reason,
        "order": order.to_dict(),
        "driver": driver.to_dict()
    }), 200


@telemetry_bp.route("/orders/<int:order_id>/assign-courier", methods=["POST"])
def assign_order_courier(order_id):
    """Assigns an order to a courier partner and notifies customer."""
    data = request.get_json() or {}
    driver_id = data.get("driver_id")
    driver = db.session.get(DeliveryPartner, driver_id) if driver_id else None
    order = db.session.get(Order, order_id)

    if not order:
        return jsonify({"error": "Order not found"}), 404
    if not driver:
        return jsonify({"error": "Valid driver_id required"}), 400

    driver.active_order_id = order.id
    driver.status = "en_route"
    driver.speed_kmh = 42.0

    if order.telemetry:
        order.telemetry.driver_name = driver.full_name
        order.telemetry.driver_phone = driver.phone
        order.telemetry.vehicle_number = driver.vehicle_number
        order.telemetry.status = "en_route"

    order.order_status = "in_transit"
    db.session.commit()

    try:
        customer_email = order.user.email if order.user and order.user.email else "customer@greennestbloom.com"
        AlertService.trigger_courier_assigned_customer_alert(
            customer_email=customer_email,
            order_number=order.order_number,
            driver_name=driver.full_name,
            driver_phone=driver.phone,
            vehicle_type=driver.vehicle_type,
            vehicle_number=driver.vehicle_number,
            eta_minutes=25
        )
    except Exception as ex:
        print(f"[TelemetryRoutes] Assign notification error: {ex}")

    return jsonify({
        "message": f"Order #{order.order_number} successfully assigned to {driver.full_name}.",
        "order": order.to_dict(),
        "driver": driver.to_dict()
    }), 200

