import os
import sys
import sqlite3
from datetime import datetime, date
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app import app, db
import models

def parse_val(col_name, val):
    if val is None:
        return None
    # Handle boolean fields
    if col_name.startswith("is_") or col_name in ("is_active", "is_perishable", "is_verified", "is_default"):
        return bool(val)
    # Handle date / datetime strings
    if isinstance(val, str):
        if len(val) == 10 and val.count("-") == 2:
            try:
                return datetime.strptime(val, "%Y-%m-%d").date()
            except ValueError:
                pass
        elif len(val) >= 19 and val.count("-") == 2 and ":" in val:
            try:
                clean_dt = val.split(".")[0]
                return datetime.strptime(clean_dt, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                pass
    return val

def migrate():
    sqlite_path = Path(__file__).resolve().parent.parent / "backend" / "greennest_bloom.db"
    if not sqlite_path.exists():
        print(f"SQLite file not found at {sqlite_path}")
        return

    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sc = sqlite_conn.cursor()

    with app.app_context():
        print(f"Target Neon Database: {app.config['SQLALCHEMY_DATABASE_URI'].split('@')[-1]}")
        
        # 1. Ensure Admin User exists in Neon
        admin = models.User.query.filter_by(email="admin@greennestbloom.com").first()
        if not admin:
            admin_row = sc.execute("SELECT * FROM users WHERE email='admin@greennestbloom.com'").fetchone()
            if admin_row:
                admin_data = dict(admin_row)
                admin = models.User(
                    full_name=admin_data["full_name"],
                    email=admin_data["email"],
                    password_hash=admin_data["password_hash"],
                    user_type=admin_data["user_type"],
                    phone=admin_data.get("phone"),
                    address=admin_data.get("address"),
                    company_name=admin_data.get("company_name"),
                    gstin=admin_data.get("gstin")
                )
                db.session.add(admin)
                db.session.commit()
                print(f"Inserted Admin User: {admin.email} (ID: {admin.id})")

        # 2. Ordered migration to satisfy Foreign Key constraints
        model_mapping = [
            ("products", models.Product),
            ("coupons", models.Coupon),
            ("orders", models.Order),
            ("order_items", models.OrderItem),
            ("delivery_partners", models.DeliveryPartner),
            ("subscriptions", models.Subscription),
            ("product_reviews", models.ProductReview),
            ("wishlist_items", models.WishlistItem),
            ("occasion_reminders", models.OccasionReminder),
            ("event_quotations", models.EventQuotation),
        ]

        for table_name, model_cls in model_mapping:
            try:
                rows = sc.execute(f"SELECT * FROM {table_name}").fetchall()
            except Exception as e:
                print(f"Skipping {table_name}: {e}")
                continue

            migrated_count = 0
            for r in rows:
                row_dict = dict(r)
                pk_val = row_dict.get("id")
                
                # Check if record already exists in Neon
                existing = db.session.query(model_cls).filter_by(id=pk_val).first()
                if existing:
                    continue

                parsed_dict = {}
                col_names = [c.name for c in model_cls.__table__.columns]
                for k, v in row_dict.items():
                    if k in col_names:
                        parsed_dict[k] = parse_val(k, v)

                instance = model_cls(**parsed_dict)
                db.session.add(instance)
                migrated_count += 1

            try:
                db.session.commit()
                print(f"Table '{table_name}': migrated {migrated_count} new rows from SQLite.")
            except Exception as commit_err:
                db.session.rollback()
                print(f"Error migrating {table_name}: {commit_err}")

            # Update PostgreSQL sequence so future auto-increment IDs work smoothly
            try:
                import sqlalchemy as sa
                db.session.execute(sa.text(f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), COALESCE(MAX(id), 1)) FROM {table_name}"))
                db.session.commit()
            except Exception as seq_err:
                db.session.rollback()

        # Update users table sequence as well
        try:
            import sqlalchemy as sa
            db.session.execute(sa.text(f"SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users"))
            db.session.commit()
        except Exception as seq_err:
            db.session.rollback()

        print("\nSQLite to Neon migration successfully completed!")

if __name__ == "__main__":
    migrate()
