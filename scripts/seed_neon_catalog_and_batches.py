import os
import sys
import csv
from datetime import datetime, date
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

# Use unpooled connection for clean bulk script execution if available
from dotenv import load_dotenv
env_local = Path(__file__).resolve().parent.parent / ".env.local"
if env_local.exists():
    load_dotenv(env_local)
    unpooled = os.getenv("DATABASE_URL_UNPOOLED")
    if unpooled:
        os.environ["DATABASE_URL"] = unpooled

from app import app, db
from models import Product, PerishableBatch
import sqlalchemy as sa

def seed_neon_catalog():
    csv_path = Path(__file__).resolve().parent.parent / "data" / "botanical_species_and_care.csv"
    if not csv_path.exists():
        print(f"CSV not found at {csv_path}")
        return

    with app.app_context():
        print(f"Connecting to Neon: {app.config['SQLALCHEMY_DATABASE_URI'].split('@')[-1]}")
        
        # 1. Seed products
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            added_products = 0
            for row in reader:
                name = row["name"].strip()
                existing = Product.query.filter_by(name=name).first()
                if not existing:
                    p = Product(
                        name=name,
                        category=row.get("category", "cut_flower"),
                        is_perishable=(str(row.get("is_perishable", "")).strip().lower() in ("1", "true")),
                        base_price=float(row.get("base_price", 100.0)),
                        b2b_min_quantity=int(row.get("b2b_min_quantity", 10)),
                        b2b_discount_percent=float(row.get("b2b_discount_percent", 15.0)),
                        hsn_code=row.get("hsn_code", "0603"),
                        botanical_name=row.get("botanical_name", ""),
                        sunlight_requirement=row.get("sunlight_requirement", ""),
                        watering_frequency=row.get("watering_frequency", ""),
                        vase_life_days=int(row.get("vase_life_days", 5)),
                        floriography_meaning=row.get("floriography_meaning", ""),
                        image_url=row.get("image_url", ""),
                        stock_quantity=int(row.get("stock_quantity", 100))
                    )
                    db.session.add(p)
                    added_products += 1

            db.session.commit()
            print(f"Seeded {added_products} new botanical products into Neon.")

        # Update product sequence
        try:
            db.session.execute(sa.text("SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(MAX(id), 1)) FROM products"))
            db.session.commit()
        except Exception as e:
            db.session.rollback()

        # 2. Seed the 5 Perishable Batches from Admin Console
        batch_definitions = [
            {
                "batch_code": "BATCH-ORC-2026-0901",
                "species_name": "Imperial Purple Vanda Orchids",
                "harvest_date": "2026-09-16",
                "initial_qty": 90,
                "remaining_qty": 18,
                "current_age": 59,
                "vase_life": 7,
                "discount": 90.0,
                "status": "expired"
            },
            {
                "batch_code": "BATCH-LIL-2026-0902",
                "species_name": "Royal White Asiatic Lilies",
                "harvest_date": "2026-09-17",
                "initial_qty": 120,
                "remaining_qty": 32,
                "current_age": 58,
                "vase_life": 6,
                "discount": 90.0,
                "status": "expired"
            },
            {
                "batch_code": "BATCH-ROS-2026-0903",
                "species_name": "Dutch Red Velvet Roses",
                "harvest_date": "2026-09-18",
                "initial_qty": 150,
                "remaining_qty": 65,
                "current_age": 57,
                "vase_life": 5,
                "discount": 90.0,
                "status": "expired"
            },
            {
                "batch_code": "BATCH-ROS-2026-0905",
                "species_name": "Dutch Red Velvet Roses",
                "harvest_date": "2026-09-20",
                "initial_qty": 200,
                "remaining_qty": 180,
                "current_age": 55,
                "vase_life": 5,
                "discount": 90.0,
                "status": "expired"
            },
            {
                "batch_code": "BATCH-20261114-OOTY",
                "species_name": "Saffron Orange African Giant Marigold (Genda Phool)",
                "harvest_date": "2026-11-14",
                "initial_qty": 250,
                "remaining_qty": 250,
                "current_age": 0,
                "vase_life": 6,
                "discount": 0.0,
                "status": "fresh"
            }
        ]

        added_batches = 0
        for b_def in batch_definitions:
            existing_batch = PerishableBatch.query.filter_by(batch_code=b_def["batch_code"]).first()
            if not existing_batch:
                product = Product.query.filter(Product.name.ilike(f"%{b_def['species_name']}%")).first()
                if not product:
                    # Fallback to first perishable or any product
                    product = Product.query.filter_by(is_perishable=True).first() or Product.query.first()
                
                h_date = datetime.strptime(b_def["harvest_date"], "%Y-%m-%d").date()
                batch = PerishableBatch(
                    product_id=product.id,
                    batch_code=b_def["batch_code"],
                    harvest_date=h_date,
                    initial_quantity=b_def["initial_qty"],
                    remaining_quantity=b_def["remaining_qty"],
                    current_age_days=b_def["current_age"],
                    vase_life_days=b_def["vase_life"],
                    discount_percent=b_def["discount"],
                    status=b_def["status"]
                )
                db.session.add(batch)
                added_batches += 1

        db.session.commit()
        print(f"Seeded {added_batches} farm harvest batches into Neon.")

        try:
            db.session.execute(sa.text("SELECT setval(pg_get_serial_sequence('perishable_batches', 'id'), COALESCE(MAX(id), 1)) FROM perishable_batches"))
            db.session.commit()
        except Exception as e:
            db.session.rollback()

        total_p = Product.query.count()
        total_b = PerishableBatch.query.count()
        print(f"Total Products in Neon: {total_p}")
        print(f"Total Batches in Neon: {total_b}")

if __name__ == "__main__":
    seed_neon_catalog()
