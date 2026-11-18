import os
import csv
from datetime import date, timedelta, datetime
from app import create_app
from models import (
    db, User, Product, PerishableBatch, CustomBouquet,
    Subscription, SubscriptionFeedback, EventQuotation,
    Order, OrderItem, DeliveryTelemetry, SystemAlert, OccasionReminder,
    DeliveryPartner, Coupon, ProductReview, PushNotificationToken
)

app, _ = create_app()

def seed_database():
    with app.app_context():
        # Clear existing tables
        db.drop_all()
        db.create_all()

        print("Seeding Green Nest Bloom Database...")

        # 1. Single Personalized Super-Admin User
        admin = User(
            email="admin@greennestbloom.com",
            full_name="Venisha Rizal Dsouza (Admin)",
            user_type="admin",
            phone="+91 94812 34567",
            address="Mother Nursery & Dispatch Hub, Kalmane, Thirthahalli, Karnataka 577432"
        )
        admin.set_password("GreenNest@Admin2026")

        db.session.add(admin)
        db.session.commit()

        # 2. Products (Loaded from Botanical Species & Plant Care Dataset CSV)
        botanical_csv_paths = [
            os.path.join(os.path.dirname(__file__), "data", "botanical_species_and_care.csv"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "botanical_species_and_care.csv")
        ]
        botanical_csv = next((p for p in botanical_csv_paths if os.path.exists(p)), None)
        products = []

        if botanical_csv:
            import csv
            with open(botanical_csv, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    p = Product(
                        name=row["name"],
                        category=row["category"],
                        is_perishable=(str(row.get("is_perishable", "")).strip().lower() in ("1", "true")),
                        base_price=float(row["base_price"]),
                        b2b_min_quantity=int(row["b2b_min_quantity"]),
                        b2b_discount_percent=float(row["b2b_discount_percent"]),
                        hsn_code=row["hsn_code"],
                        botanical_name=row["botanical_name"],
                        sunlight_requirement=row["sunlight_requirement"],
                        watering_frequency=row["watering_frequency"],
                        vase_life_days=int(row["vase_life_days"]),
                        floriography_meaning=row["floriography_meaning"],
                        image_url=row["image_url"],
                        stock_quantity=int(row["stock_quantity"])
                    )
                    products.append(p)
            print(f"Loaded {len(products)} botanical products from CSV: {botanical_csv}")
        else:
            raise FileNotFoundError("Could not locate botanical_species_and_care.csv dataset!")

        db.session.add_all(products)
        db.session.commit()

        # 3. Perishable Batches (Simulating FIFO / FEFO Aging Curve)
        today = date.today()
        batches = [
            # Fresh Batch (Day 1 post-harvest, 0% discount)
            PerishableBatch(
                product_id=1,  # Dutch Roses
                batch_code="BATCH-ROS-2026-0905",
                harvest_date=today - timedelta(days=1),
                initial_quantity=200,
                remaining_quantity=180,
                current_age_days=1,
                vase_life_days=5,
                discount_percent=0.0,
                status="fresh"
            ),
            # Prime Batch (Day 3 post-harvest, 20% discount applied)
            PerishableBatch(
                product_id=1,
                batch_code="BATCH-ROS-2026-0903",
                harvest_date=today - timedelta(days=3),
                initial_quantity=150,
                remaining_quantity=65,
                current_age_days=3,
                vase_life_days=5,
                discount_percent=20.0,
                status="prime"
            ),
            # Critical Clearance Batch (Day 4 post-harvest, 45% discount applied)
            PerishableBatch(
                product_id=2,  # Asiatic Lilies
                batch_code="BATCH-LIL-2026-0902",
                harvest_date=today - timedelta(days=4),
                initial_quantity=120,
                remaining_quantity=32,
                current_age_days=4,
                vase_life_days=6,
                discount_percent=45.0,
                status="clearance"
            ),
            # Flash Clearance Batch (Day 5 post-harvest, 75% discount)
            PerishableBatch(
                product_id=3,  # Orchids
                batch_code="BATCH-ORC-2026-0901",
                harvest_date=today - timedelta(days=5),
                initial_quantity=90,
                remaining_quantity=18,
                current_age_days=5,
                vase_life_days=7,
                discount_percent=75.0,
                status="clearance"
            )
        ]

        db.session.add_all(batches)
        db.session.commit()

        # 4. Seed Delivery Personnel Fleet (Exactly 3 Couriers: EV Scooter, EV Van, Heavy Refrigerated Truck)
        driver1 = DeliveryPartner(
            full_name="Kavita Reddy",
            phone="+91 98450 11223",
            email="kavita.reddy@greennestbloom.com",
            vehicle_type="Rapid Nursery EV Scooter",
            vehicle_number="KA-14-ES-1029",
            status="available",
            current_lat=13.6934,
            current_lng=75.2448,
            speed_kmh=0.0,
            battery_level=96,
            rating=4.92,
            completed_deliveries=142,
            shift_start="07:30 AM",
            shift_end="04:30 PM",
            zone="Thirthahalli Central & Local Express Zone (577432)"
        )
        driver2 = DeliveryPartner(
            full_name="Ramesh Kumar",
            phone="+91 98765 43210",
            email="ramesh.kumar@greennestbloom.com",
            vehicle_type="Refrigerated Cold-Chain EV Van",
            vehicle_number="KA-14-EV-4402",
            status="en_route",
            current_lat=13.7850,
            current_lng=75.4200,
            speed_kmh=42.0,
            battery_level=82,
            rating=4.96,
            completed_deliveries=256,
            shift_start="08:00 AM",
            shift_end="05:00 PM",
            zone="Kalmane Mother Nursery & Malnad Highway Corridor (NH 169A)"
        )
        driver3 = DeliveryPartner(
            full_name="Vikram Rathore",
            phone="+91 99800 55441",
            email="vikram.rathore@greennestbloom.com",
            vehicle_type="Interstate Heavy Refrigerated Truck",
            vehicle_number="KA-14-TR-9901",
            status="charging",
            current_lat=14.2251,
            current_lng=76.3980,
            speed_kmh=0.0,
            battery_level=68,
            rating=4.89,
            completed_deliveries=318,
            shift_start="06:00 AM",
            shift_end="03:00 PM",
            zone="National Line-Haul Highway Corridor (NH 48 Bengaluru-Gateway)"
        )
        db.session.add_all([driver1, driver2, driver3])

        # 9. Seed Initial System Alerts Log
        alert1 = SystemAlert(
            alert_type="admin_login",
            recipient_email=admin.email,
            subject="Security Notice: Administrative Access from 127.0.0.1",
            body="Super-Admin Console Access Established with Singleton Lock.",
            status="sent",
            dispatched_at=datetime.utcnow() - timedelta(minutes=45)
        )
        alert2 = SystemAlert(
            alert_type="critical_decay",
            recipient_email=admin.email,
            subject="Perishable Alert: Batch BATCH-LIL-2026-0902 Reached 45% Decay Markdown",
            body="32 stems of Asiatic Lilies reached Day 4 senescence. Auto-markdown applied.",
            status="sent",
            dispatched_at=datetime.utcnow() - timedelta(hours=3)
        )
        alert3 = SystemAlert(
            alert_type="system_ready",
            recipient_email=admin.email,
            subject="Green Nest Bloom Platform Online: Mother Nursery Kalmane Initialized",
            body="All botanical species catalog, perishable batch management, and logistics ready.",
            status="sent",
            dispatched_at=datetime.utcnow() - timedelta(hours=1)
        )
        alert4 = SystemAlert(
            alert_type="admin_login",
            recipient_email=admin.email,
            subject="Super-Admin Account Provisioned for Venisha Rizal Dsouza",
            body="Mother Nursery & Dispatch Hub Super-Admin active for Kalmane, Thirthahalli.",
            status="sent",
            dispatched_at=datetime.utcnow() - timedelta(minutes=10)
        )
        db.session.add_all([alert1, alert2, alert3, alert4])

        # 10. Promotional Coupons & Discount Vouchers
        coupon1 = Coupon(
            code="BLOOM15",
            description="15% Off Your Artisanal Botanical Order",
            discount_type="percent",
            discount_value=15.0,
            min_order_amount=500.0,
            max_discount_amount=300.0,
            is_active=True,
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=90),
            usage_limit=1000,
            times_used=18
        )
        coupon2 = Coupon(
            code="EARTHPOT25",
            description="Flat ₹25 Off on Terracotta Mud Pots & Plant Combos",
            discount_type="flat",
            discount_value=25.0,
            min_order_amount=200.0,
            is_active=True,
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=180),
            usage_limit=500,
            times_used=42
        )
        coupon3 = Coupon(
            code="WELCOME100",
            description="Welcome Bonus: Flat ₹100 Off on First Order above ₹999",
            discount_type="flat",
            discount_value=100.0,
            min_order_amount=999.0,
            is_active=True,
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=365),
            usage_limit=2000,
            times_used=87
        )
        coupon4 = Coupon(
            code="GREENEST20",
            description="20% Wholesale / Festive Discount above ₹1,499",
            discount_type="percent",
            discount_value=20.0,
            min_order_amount=1499.0,
            max_discount_amount=500.0,
            is_active=True,
            valid_from=date.today(),
            valid_until=date.today() + timedelta(days=120),
            usage_limit=500,
            times_used=24
        )
        db.session.add_all([coupon1, coupon2, coupon3, coupon4])

        # 11. Verified Customer Product Reviews with Photos
        review1 = ProductReview(
            product_id=7,  # Monstera Deliciosa
            user_id=None,
            reviewer_name="Dr. Ananya Sharma",
            rating=5,
            review_title="Spectacular Swiss Cheese Fenestrations!",
            review_text="Arrived in pristine condition packed in organic compost. The leaves have gorgeous natural perforations and it unfurled a brand new leaf within two weeks on my windowsill.",
            photo_url="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80",
            is_verified_purchase=True,
            helpful_votes=14
        )
        review2 = ProductReview(
            product_id=68,  # Classic Terracotta Mud Pot 8" (Best Seller)
            user_id=None,
            reviewer_name="Karthik Varma",
            rating=5,
            review_title="#1 Best Value Mud Pot — Exceptional Soil Aeration",
            review_text="True earthenware terracotta. The clay walls breathe naturally and excess moisture wicks away cleanly. My hibiscus plant is thriving in it. Best quality mud pot in this price range.",
            photo_url="/terracotta_pot_12in.jpg",
            is_verified_purchase=True,
            helpful_votes=29
        )
        review3 = ProductReview(
            product_id=1,  # Dutch Red Velvet Roses
            user_id=None,
            reviewer_name="Pooja Hegde",
            rating=5,
            review_title="Velvety Crimson Stems with 7-Day Longevity",
            review_text="The hydration sponge conditioning kept these roses fresh for a full week. Deep red velvet color that filled the living room with a mild tea fragrance.",
            photo_url="/rose_bouquet_realistic.jpg",
            is_verified_purchase=True,
            helpful_votes=9
        )
        review4 = ProductReview(
            product_id=67,  # Organic Indian Ginger Rhizome
            user_id=None,
            reviewer_name="Subhash Rao",
            rating=5,
            review_title="Vigorous Ayurvedic Ginger Rhizomes!",
            review_text="Planted in an 8-inch mud pot and green shoots sprouted within 4 days. Fresh and organic root stock with great vitality.",
            photo_url="/ginger_plant.jpg",
            is_verified_purchase=True,
            helpful_votes=7
        )
        db.session.add_all([review1, review2, review3, review4])

        # 12. Push Notification Listener Tokens
        token1 = PushNotificationToken(
            user_id=None,
            token="gnb_web_push_token_desktop_chrome_88f921_mac",
            platform="web",
            device_info="Chrome 128 / macOS Sequoia",
            is_active=True
        )
        token2 = PushNotificationToken(
            user_id=None,
            token="gnb_mobile_push_token_android_pwa_44a102_pixel",
            platform="android",
            device_info="PWA / Pixel 8 Android 15",
            is_active=True
        )
        db.session.add_all([token1, token2])

        db.session.commit()
        print("Database seeded successfully with botanical species, batches, users, coupons, reviews, tokens, and telemetry!")

if __name__ == "__main__":
    seed_database()
