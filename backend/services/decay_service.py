from datetime import date, datetime
from models import db, PerishableBatch, Product
from services.alert_service import AlertService

class DecayService:
    """
    Implements FEFO (First-Expired, First-Out) and biological decay curves
    inspired by Goyal & Giri (2001) and Chao et al. (2020).
    """

    @staticmethod
    def calculate_decay_tier(age_days: int, vase_life: int = 5):
        """
        Determines the dynamic markdown discount and status based on age vs vase life:
        - Day 0-2: Fresh (0% markdown)
        - Day 3: Prime (20% markdown)
        - Day 4: Clearance (45% markdown)
        - Day 5: Critical Flash Clearance (75% markdown)
        - Day 6+: Senescent / Expired
        """
        if age_days <= 2:
            return 0.0, "fresh"
        elif age_days == 3:
            return 20.0, "prime"
        elif age_days == 4:
            return 45.0, "clearance"
        elif age_days == 5:
            return 75.0, "clearance"
        else:
            return 90.0, "expired"

    @classmethod
    def evaluate_all_batches(cls):
        """
        Daily batch evaluation routine (executed on startup and via background scheduler).
        Recalculates current_age_days, updates discount_percent, and dispatches SMTP alerts
        for batches hitting Day 4 or Day 5.
        """
        today = date.today()
        batches = PerishableBatch.query.all()
        updated_count = 0
        critical_alerts_sent = 0

        for batch in batches:
            if batch.remaining_quantity <= 0:
                continue

            # Calculate days since harvest
            age_days = (today - batch.harvest_date).days
            batch.current_age_days = max(age_days, 0)
            
            discount, status = cls.calculate_decay_tier(batch.current_age_days, batch.vase_life_days)
            old_discount = batch.discount_percent
            batch.discount_percent = discount
            batch.status = status
            updated_count += 1

            # If newly entering critical clearance (Day 4/5) and discount changed
            if discount >= 45.0 and old_discount < discount:
                product_name = batch.product.name if batch.product else "Botanical Cut Stem"
                AlertService.trigger_decay_threshold_alert(
                    batch_code=batch.batch_code,
                    product_name=product_name,
                    remaining_qty=batch.remaining_quantity,
                    age_days=batch.current_age_days,
                    discount=batch.discount_percent
                )
                critical_alerts_sent += 1

        db.session.commit()
        return {
            "evaluated_batches": len(batches),
            "updated_count": updated_count,
            "critical_alerts_sent": critical_alerts_sent
        }

    @classmethod
    def manual_override(cls, batch_id: int, custom_discount: float, note: str = ""):
        """Allows nursery super-admin to manually force a custom markdown percentage"""
        batch = PerishableBatch.query.get(batch_id)
        if not batch:
            return None, "Batch not found"

        batch.discount_percent = max(0.0, min(custom_discount, 100.0))
        if batch.discount_percent >= 75:
            batch.status = "clearance"
        elif batch.discount_percent >= 20:
            batch.status = "prime"
        else:
            batch.status = "fresh"

        db.session.commit()
        return batch, "Discount override applied"

    @classmethod
    def get_fefo_allocation(cls, product_id: int, requested_qty: int):
        """
        Allocates items from the oldest unexpired batches first (FEFO rule),
        minimizing holding duration and spoilage write-offs.
        """
        available_batches = PerishableBatch.query.filter(
            PerishableBatch.product_id == product_id,
            PerishableBatch.remaining_quantity > 0,
            PerishableBatch.status != "expired"
        ).order_by(PerishableBatch.harvest_date.asc()).all()

        allocations = []
        needed = requested_qty

        for b in available_batches:
            if needed <= 0:
                break
            take = min(b.remaining_quantity, needed)
            b.remaining_quantity -= take
            needed -= take
            allocations.append({
                "batch_id": b.id,
                "batch_code": b.batch_code,
                "quantity": take,
                "discount_percent": b.discount_percent
            })

        if needed > 0:
            # Revert changes if not enough stock
            db.session.rollback()
            return None, f"Insufficient perishable stock. Short by {needed} units."

        db.session.commit()
        return allocations, "Successfully allocated via FEFO"
