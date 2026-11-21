from datetime import datetime, date, timedelta
import json
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    company_name = db.Column(db.String(120), nullable=True)
    gstin = db.Column(db.String(15), nullable=True)  # Required for verified B2B
    user_type = db.Column(db.String(20), nullable=False, default="individual")  # individual, corporate, admin
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    custom_bouquets = db.relationship("CustomBouquet", backref="user", lazy=True)
    subscriptions = db.relationship("Subscription", backref="user", lazy=True)
    event_quotes = db.relationship("EventQuotation", backref="user", lazy=True)
    orders = db.relationship("Order", backref="user", lazy=True)
    reminders = db.relationship("OccasionReminder", backref="user", lazy=True)
    wishlist_items = db.relationship("WishlistItem", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "company_name": self.company_name,
            "gstin": self.gstin,
            "user_type": self.user_type,
            "phone": self.phone,
            "address": self.address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AdminSession(db.Model):
    """Enforces Singleton Super-Admin Governance (Rejects / Invalidates concurrent logins)"""
    __tablename__ = "admin_sessions"

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    session_token = db.Column(db.String(255), unique=True, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "admin_id": self.admin_id,
            "session_token": self.session_token,
            "ip_address": self.ip_address,
            "is_active": self.is_active,
            "last_active": self.last_active.isoformat() if self.last_active else None,
        }


class EmailOTP(db.Model):
    """Stores temporary 6-digit verification codes for user registration & authentication"""
    __tablename__ = "email_otps"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, index=True)
    otp_code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_used = db.Column(db.Boolean, default=False)

    def is_valid(self, code):
        return not self.is_used and self.otp_code == str(code).strip() and datetime.utcnow() <= self.expires_at

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "otp_code": self.otp_code,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_used": self.is_used,
        }


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # cut_flower, potted_plant, planter, accessory
    is_perishable = db.Column(db.Boolean, default=False)
    base_price = db.Column(db.Float, nullable=False)
    b2b_min_quantity = db.Column(db.Integer, default=1)  # MOQ for corporate
    b2b_discount_percent = db.Column(db.Float, default=0.0)
    hsn_code = db.Column(db.String(10), default="0603")  # 0603: Cut Flowers, 0602: Live Plants
    botanical_name = db.Column(db.String(120), nullable=True)
    sunlight_requirement = db.Column(db.String(50), nullable=True)
    watering_frequency = db.Column(db.String(50), nullable=True)
    vase_life_days = db.Column(db.Integer, default=5)
    floriography_meaning = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.Text, nullable=True)
    stock_quantity = db.Column(db.Integer, default=0)

    # Relationships
    batches = db.relationship("PerishableBatch", backref="product", lazy=True)

    def to_dict(self):
        decay_discount = 0.0
        decay_status = None
        decay_batch_code = None
        current_age_days = None

        if self.is_perishable and self.batches:
            active_batches = [
                b for b in self.batches 
                if b.remaining_quantity > 0 and b.status != "expired"
            ]
            if active_batches:
                # Sort by harvest date ascending (FEFO rule)
                active_batches.sort(key=lambda b: (b.harvest_date or date.min))
                fefo_batch = active_batches[0]
                decay_discount = float(fefo_batch.discount_percent or 0.0)
                decay_status = fefo_batch.status
                decay_batch_code = fefo_batch.batch_code
                current_age_days = fefo_batch.current_age_days

        effective_price = round(self.base_price * (1.0 - (decay_discount / 100.0)), 2)

        images = []
        if self.image_url:
            try:
                stripped = self.image_url.strip()
                if stripped.startswith("["):
                    parsed = json.loads(stripped)
                    if isinstance(parsed, list):
                        images = [str(item) for item in parsed if item]
                elif "," in stripped and not stripped.startswith("data:"):
                    images = [img.strip() for img in stripped.split(",") if img.strip()]
                else:
                    images = [stripped]
            except Exception:
                images = [self.image_url]

        primary_image = images[0] if images else (self.image_url or "/pink_lily_bloom.jpg")

        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "is_perishable": self.is_perishable,
            "base_price": round(self.base_price, 2),
            "effective_price": effective_price,
            "decay_discount_percent": decay_discount,
            "decay_status": decay_status,
            "decay_batch_code": decay_batch_code,
            "current_age_days": current_age_days,
            "b2b_min_quantity": self.b2b_min_quantity,
            "b2b_discount_percent": self.b2b_discount_percent,
            "hsn_code": self.hsn_code,
            "botanical_name": self.botanical_name,
            "sunlight_requirement": self.sunlight_requirement,
            "watering_frequency": self.watering_frequency,
            "vase_life_days": self.vase_life_days,
            "floriography_meaning": self.floriography_meaning,
            "image_url": primary_image,
            "images": images,
            "stock_quantity": self.stock_quantity,
        }


class PerishableBatch(db.Model):
    """FIFO / FEFO batch tracking for cut flowers and perishable greenery"""
    __tablename__ = "perishable_batches"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    batch_code = db.Column(db.String(50), unique=True, nullable=False)
    harvest_date = db.Column(db.Date, nullable=False)
    initial_quantity = db.Column(db.Integer, nullable=False)
    remaining_quantity = db.Column(db.Integer, nullable=False)
    current_age_days = db.Column(db.Integer, default=0)
    vase_life_days = db.Column(db.Integer, default=5)
    discount_percent = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default="fresh")  # fresh, prime, clearance, expired

    def compute_decay_and_price(self, base_price):
        """
        Calculates dynamic markdown price based on biological age curve:
        Day 0-2: 0% off (fresh)
        Day 3:   20% off (prime)
        Day 4:   45% off (clearance)
        Day 5+:  75% off (flash sale before disposal)
        """
        discount = self.discount_percent
        discounted_price = base_price * (1 - (discount / 100.0))
        return max(round(discounted_price, 2), 0.0)

    def to_dict(self):
        product_name = self.product.name if self.product else "Unknown"
        base_price = self.product.base_price if self.product else 0.0
        effective_price = self.compute_decay_and_price(base_price)

        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": product_name,
            "batch_code": self.batch_code,
            "harvest_date": self.harvest_date.isoformat() if self.harvest_date else None,
            "initial_quantity": self.initial_quantity,
            "remaining_quantity": self.remaining_quantity,
            "current_age_days": self.current_age_days,
            "vase_life_days": self.vase_life_days,
            "discount_percent": self.discount_percent,
            "status": self.status,
            "base_price": base_price,
            "effective_price": effective_price,
        }


class CustomBouquet(db.Model):
    """Outputs from the 7-Step HTML5 Canvas / Fabric.js Customizer"""
    __tablename__ = "custom_bouquets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    bouquet_name = db.Column(db.String(100), default="Bespoke Floral Creation")
    wrapping_type = db.Column(db.String(50), default="kraft_paper")
    focal_flower_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    focal_count = db.Column(db.Integer, default=5)
    filler_flower_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    filler_count = db.Column(db.Integer, default=3)
    foliage_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    foliage_count = db.Column(db.Integer, default=2)
    arrangement_style = db.Column(db.String(50), default="dome_round")
    fragrance_type = db.Column(db.String(50), default="rose_petal_mist")
    greeting_card_text = db.Column(db.Text, nullable=True)
    canvas_json = db.Column(db.Text, nullable=True)
    total_price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    focal_product = db.relationship("Product", foreign_keys=[focal_flower_id])
    filler_product = db.relationship("Product", foreign_keys=[filler_flower_id])
    foliage_product = db.relationship("Product", foreign_keys=[foliage_id])

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "bouquet_name": self.bouquet_name,
            "wrapping_type": self.wrapping_type,
            "focal_flower": self.focal_product.name if self.focal_product else None,
            "focal_count": self.focal_count,
            "filler_flower": self.filler_product.name if self.filler_product else None,
            "filler_count": self.filler_count,
            "foliage": self.foliage_product.name if self.foliage_product else None,
            "foliage_count": self.foliage_count,
            "arrangement_style": self.arrangement_style,
            "fragrance_type": self.fragrance_type,
            "greeting_card_text": self.greeting_card_text,
            "canvas_json": self.canvas_json,
            "total_price": round(self.total_price, 2),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Subscription(db.Model):
    """Monthly Surprise Flower Box Subscription for Individual Users"""
    __tablename__ = "subscriptions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    tier = db.Column(db.String(20), nullable=False)  # basic (₹999), premium (₹1899), luxury (₹2999)
    monthly_price = db.Column(db.Float, nullable=False)
    delivery_address = db.Column(db.Text, nullable=False)
    delivery_frequency = db.Column(db.String(20), default="monthly")
    status = db.Column(db.String(20), default="active")  # active, paused, cancelled
    start_date = db.Column(db.Date, default=date.today)
    next_delivery_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    feedbacks = db.relationship("SubscriptionFeedback", backref="subscription", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else "Customer",
            "tier": self.tier,
            "monthly_price": round(self.monthly_price, 2),
            "delivery_address": self.delivery_address,
            "delivery_frequency": self.delivery_frequency,
            "status": self.status,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "next_delivery_date": self.next_delivery_date.isoformat() if self.next_delivery_date else None,
            "feedback_count": len(self.feedbacks),
        }


class SubscriptionFeedback(db.Model):
    """Subscriber feedback loop guiding Admin seasonal curation"""
    __tablename__ = "subscription_feedbacks"

    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey("subscriptions.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    delivery_cycle_month = db.Column(db.String(20), nullable=False)  # e.g. "October 2026"
    overall_rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    freshness_rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    variety_rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    favorite_flowers = db.Column(db.Text, nullable=True)
    disliked_flowers = db.Column(db.Text, nullable=True)
    comments = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "subscription_id": self.subscription_id,
            "user_id": self.user_id,
            "delivery_cycle_month": self.delivery_cycle_month,
            "overall_rating": self.overall_rating,
            "freshness_rating": self.freshness_rating,
            "variety_rating": self.variety_rating,
            "favorite_flowers": self.favorite_flowers,
            "disliked_flowers": self.disliked_flowers,
            "comments": self.comments,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class EventQuotation(db.Model):
    """B2B Multi-tier Event Quotations with Single-Event-per-Day Clash Guard & Haversine Radius"""
    __tablename__ = "event_quotations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    company_name = db.Column(db.String(120), nullable=True)
    event_type = db.Column(db.String(50), nullable=False)  # wedding, gala, corporate_banquet, anniversary
    event_date = db.Column(db.Date, nullable=False)
    guest_tier = db.Column(db.String(50), nullable=False)  # intimate_50, medium_200, grand_500
    venue_address = db.Column(db.Text, nullable=False)
    venue_latitude = db.Column(db.Float, nullable=True)
    venue_longitude = db.Column(db.Float, nullable=True)
    distance_km = db.Column(db.Float, nullable=True)
    modules_json = db.Column(db.Text, nullable=True)  # Arch, Stage backdrop, Centerpieces, Aisle
    staged_image_url = db.Column(db.Text, nullable=True)  # Inpainted venue preview
    sentiment_prompt = db.Column(db.Text, nullable=True)  # Theme / Floriography emotion text
    estimated_amount = db.Column(db.Float, nullable=False)
    admin_approved_amount = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(30), default="pending")  # pending, approved, declined, booked
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "company_name": self.company_name or (self.user.company_name if self.user else ""),
            "contact_name": self.user.full_name if self.user else "Client",
            "contact_email": self.user.email if self.user else "",
            "event_type": self.event_type,
            "event_date": self.event_date.isoformat() if self.event_date else None,
            "guest_tier": self.guest_tier,
            "venue_address": self.venue_address,
            "venue_latitude": self.venue_latitude,
            "venue_longitude": self.venue_longitude,
            "distance_km": round(self.distance_km, 2) if self.distance_km else None,
            "modules_json": self.modules_json,
            "staged_image_url": self.staged_image_url,
            "sentiment_prompt": self.sentiment_prompt,
            "estimated_amount": round(self.estimated_amount, 2),
            "admin_approved_amount": round(self.admin_approved_amount, 2) if self.admin_approved_amount else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    order_type = db.Column(db.String(20), nullable=False)  # b2c_retail, b2b_wholesale, custom_bouquet, event_booking
    subtotal = db.Column(db.Float, nullable=False)
    tax_cgst = db.Column(db.Float, default=0.0)
    tax_sgst = db.Column(db.Float, default=0.0)
    tax_igst = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default="Cash on Delivery (COD)")
    payment_status = db.Column(db.String(50), default="Pending (COD)")
    order_status = db.Column(db.String(20), default="processing")  # processing, dispatched, in_transit, delivered
    shipping_address = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    items = db.relationship("OrderItem", backref="order", cascade="all, delete-orphan", lazy=True)
    telemetry = db.relationship("DeliveryTelemetry", backref="order", uselist=False, lazy=True)

    def to_dict(self):
        courier_data = None
        if hasattr(self, 'assigned_courier') and self.assigned_courier:
            courier_obj = self.assigned_courier[0] if isinstance(self.assigned_courier, list) and len(self.assigned_courier) > 0 else (self.assigned_courier if not isinstance(self.assigned_courier, list) else None)
            if courier_obj:
                courier_data = {
                    "id": courier_obj.id,
                    "full_name": courier_obj.full_name,
                    "phone": courier_obj.phone,
                    "vehicle_type": courier_obj.vehicle_type,
                    "vehicle_number": courier_obj.vehicle_number,
                    "status": courier_obj.status,
                    "battery_level": courier_obj.battery_level,
                    "rating": courier_obj.rating,
                    "current_lat": courier_obj.current_lat,
                    "current_lng": courier_obj.current_lng,
                }
        if not courier_data and self.telemetry:
            courier_data = {
                "id": 1,
                "full_name": self.telemetry.driver_name,
                "phone": self.telemetry.driver_phone,
                "vehicle_type": "Refrigerated EV Van (ThermoKing Micro-Mist)",
                "vehicle_number": self.telemetry.vehicle_number,
                "status": self.telemetry.status,
                "battery_level": 88,
                "rating": 4.95,
                "current_lat": self.telemetry.current_lat,
                "current_lng": self.telemetry.current_lng,
            }

        return {
            "id": self.id,
            "order_number": self.order_number,
            "order_type": self.order_type,
            "customer_name": self.user.full_name if self.user else "Customer",
            "customer_email": self.user.email if self.user else "",
            "customer_phone": self.user.phone if (self.user and self.user.phone) else "+91 98451 22334",
            "company_name": self.user.company_name if self.user else None,
            "gstin": self.user.gstin if self.user else None,
            "subtotal": round(self.subtotal, 2),
            "tax_cgst": round(self.tax_cgst, 2),
            "tax_sgst": round(self.tax_sgst, 2),
            "tax_igst": round(self.tax_igst, 2),
            "total_amount": round(self.total_amount, 2),
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "order_status": self.order_status,
            "shipping_address": self.shipping_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "items": [item.to_dict() for item in self.items],
            "has_live_tracking": bool(self.telemetry),
            "courier": courier_data,
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=True)
    batch_id = db.Column(db.Integer, db.ForeignKey("perishable_batches.id"), nullable=True)
    item_name = db.Column(db.String(120), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    discount_percent = db.Column(db.Float, default=0.0)
    total_price = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "item_name": self.item_name,
            "quantity": self.quantity,
            "unit_price": round(self.unit_price, 2),
            "discount_percent": self.discount_percent,
            "total_price": round(self.total_price, 2),
        }


class DeliveryPartner(db.Model):
    """Delivery Personnel and cold-chain courier fleet data"""
    __tablename__ = "delivery_partners"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    vehicle_type = db.Column(db.String(60), default="Refrigerated EV Van")
    vehicle_number = db.Column(db.String(30), nullable=False)
    status = db.Column(db.String(30), default="available")  # available, en_route, on_break, offline
    current_lat = db.Column(db.Float, nullable=False)
    current_lng = db.Column(db.Float, nullable=False)
    speed_kmh = db.Column(db.Float, default=0.0)
    battery_level = db.Column(db.Integer, default=90)  # 0 - 100%
    rating = db.Column(db.Float, default=4.9)
    completed_deliveries = db.Column(db.Integer, default=0)
    active_order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=True)
    shift_start = db.Column(db.String(20), default="08:00 AM")
    shift_end = db.Column(db.String(20), default="05:00 PM")
    zone = db.Column(db.String(80), default="Bengaluru Central Corridor")
    last_otp = db.Column(db.String(10), nullable=True)
    otp_expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    active_order = db.relationship("Order", foreign_keys=[active_order_id], backref="assigned_courier", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "phone": self.phone,
            "email": self.email,
            "vehicle_type": self.vehicle_type,
            "vehicle_number": self.vehicle_number,
            "status": self.status,
            "current_lat": self.current_lat,
            "current_lng": self.current_lng,
            "speed_kmh": round(self.speed_kmh, 1),
            "battery_level": self.battery_level,
            "rating": round(self.rating, 2),
            "completed_deliveries": self.completed_deliveries,
            "active_order_id": self.active_order_id,
            "active_order_number": self.active_order.order_number if self.active_order else None,
            "shift_start": self.shift_start,
            "shift_end": self.shift_end,
            "zone": self.zone,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DeliveryTelemetry(db.Model):
    """Live GPS coordinate telemetry streamed via WebSocket to Leaflet map"""
    __tablename__ = "delivery_telemetry"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, unique=True)
    driver_name = db.Column(db.String(100), default="Ramesh Kumar")
    driver_phone = db.Column(db.String(20), default="+91-9876543210")
    vehicle_number = db.Column(db.String(20), default="KA-19-FL-4402")
    current_lat = db.Column(db.Float, nullable=False)
    current_lng = db.Column(db.Float, nullable=False)
    speed_kmh = db.Column(db.Float, default=34.5)
    estimated_eta_minutes = db.Column(db.Integer, default=22)
    status = db.Column(db.String(30), default="en_route")  # dispatched, en_route, delayed, delivered
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "driver_name": self.driver_name,
            "driver_phone": self.driver_phone,
            "vehicle_number": self.vehicle_number,
            "current_lat": self.current_lat,
            "current_lng": self.current_lng,
            "speed_kmh": self.speed_kmh,
            "estimated_eta_minutes": self.estimated_eta_minutes,
            "status": self.status,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SystemAlert(db.Model):
    """SMTP Transactional Notifications & Security Audit Log"""
    __tablename__ = "system_alerts"

    id = db.Column(db.Integer, primary_key=True)
    alert_type = db.Column(db.String(50), nullable=False)  # admin_login, critical_decay, event_lead, transit_exception
    recipient_email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="sent")
    dispatched_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "alert_type": self.alert_type,
            "recipient_email": self.recipient_email,
            "subject": self.subject,
            "body": self.body,
            "status": self.status,
            "dispatched_at": self.dispatched_at.isoformat() if self.dispatched_at else None,
        }


class OccasionReminder(db.Model):
    """B2C Personal Occasion Reminders with 1-tap reorder"""
    __tablename__ = "occasion_reminders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    recipient_name = db.Column(db.String(100), nullable=False)
    occasion_type = db.Column(db.String(50), nullable=False)  # Birthday, Anniversary, Valentine, Mother's Day
    occasion_date = db.Column(db.Date, nullable=False)
    preferred_flower_type = db.Column(db.String(100), default="Dutch Red Roses")
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "recipient_name": self.recipient_name,
            "occasion_type": self.occasion_type,
            "occasion_date": self.occasion_date.isoformat() if self.occasion_date else None,
            "preferred_flower_type": self.preferred_flower_type,
            "notes": self.notes,
        }


class Coupon(db.Model):
    """Promotional Voucher & Marketing Discount Engine"""
    __tablename__ = "coupons"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(30), unique=True, nullable=False, index=True)
    description = db.Column(db.String(200), nullable=True)
    discount_type = db.Column(db.String(20), default="percent")  # 'percent' or 'flat'
    discount_value = db.Column(db.Float, nullable=False)  # e.g. 15.0 for 15% or 100.0 for ₹100 flat
    min_order_amount = db.Column(db.Float, default=0.0)
    max_discount_amount = db.Column(db.Float, nullable=True)  # cap for percentage discounts
    is_active = db.Column(db.Boolean, default=True)
    valid_from = db.Column(db.Date, default=date.today)
    valid_until = db.Column(db.Date, nullable=True)
    usage_limit = db.Column(db.Integer, default=1000)
    times_used = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def is_valid(self, order_subtotal: float):
        if not self.is_active:
            return False, "This promo code is currently inactive."
        if self.valid_until and date.today() > self.valid_until:
            return False, "This promo code has expired."
        if self.times_used >= self.usage_limit:
            return False, "This promo code has reached its maximum usage limit."
        if order_subtotal < (self.min_order_amount or 0.0):
            return False, f"Minimum order of ₹{self.min_order_amount:.0f} required for promo code {self.code}."
        return True, "Valid coupon"

    def calculate_discount(self, order_subtotal: float) -> float:
        if self.discount_type == "percent":
            discount = (self.discount_value / 100.0) * order_subtotal
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
            return round(discount, 2)
        elif self.discount_type == "flat":
            return round(min(self.discount_value, order_subtotal), 2)
        return 0.0

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "description": self.description,
            "discount_type": self.discount_type,
            "discount_value": self.discount_value,
            "min_order_amount": self.min_order_amount,
            "max_discount_amount": self.max_discount_amount,
            "is_active": self.is_active,
            "valid_from": self.valid_from.isoformat() if self.valid_from else None,
            "valid_until": self.valid_until.isoformat() if self.valid_until else None,
            "usage_limit": self.usage_limit,
            "times_used": self.times_used,
        }


class ProductReview(db.Model):
    """Verified Customer Botanical Reviews with Photo Uploads"""
    __tablename__ = "product_reviews"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    reviewer_name = db.Column(db.String(100), nullable=False, default="GreenNest Enthusiast")
    rating = db.Column(db.Integer, nullable=False)  # 1 to 5 stars
    review_title = db.Column(db.String(150), nullable=True)
    review_text = db.Column(db.Text, nullable=False)
    photo_url = db.Column(db.Text, nullable=True)  # uploaded customer review photo
    is_verified_purchase = db.Column(db.Boolean, default=True)
    helpful_votes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    product = db.relationship("Product", backref=db.backref("reviews", lazy=True, cascade="all, delete-orphan"))
    user = db.relationship("User", backref=db.backref("reviews", lazy=True))

    def to_dict(self):
        photos = []
        if self.photo_url:
            try:
                stripped = self.photo_url.strip()
                if stripped.startswith("["):
                    parsed = json.loads(stripped)
                    if isinstance(parsed, list):
                        photos = [str(item) for item in parsed if item]
                elif "," in stripped and not stripped.startswith("data:"):
                    photos = [p.strip() for p in stripped.split(",") if p.strip()]
                else:
                    photos = [stripped]
            except Exception:
                photos = [self.photo_url]

        primary_photo = photos[0] if photos else self.photo_url

        return {
            "id": self.id,
            "product_id": self.product_id,
            "reviewer_name": self.reviewer_name,
            "rating": self.rating,
            "review_title": self.review_title,
            "review_text": self.review_text,
            "photo_url": primary_photo,
            "photos": photos,
            "is_verified_purchase": self.is_verified_purchase,
            "helpful_votes": self.helpful_votes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PushNotificationToken(db.Model):
    """Device Push Tokens for Real-time Dispatch & Delivery Notifications"""
    __tablename__ = "push_notification_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    token = db.Column(db.String(512), unique=True, nullable=False)
    platform = db.Column(db.String(30), default="web")  # 'web', 'android', 'ios'
    device_info = db.Column(db.String(150), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref=db.backref("push_tokens", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "token": self.token[:20] + "..." if self.token else None,
            "platform": self.platform,
            "device_info": self.device_info,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class WishlistItem(db.Model):
    """Wishlist items exclusively owned and managed per individual user"""
    __tablename__ = "wishlist_items"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    product_id = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "product_id", name="uq_user_product_wishlist"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "product_id": self.product_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

