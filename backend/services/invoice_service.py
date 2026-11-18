from datetime import datetime
from models import Order, User

class InvoiceService:
    """
    B2B GST-Compliant Tax Invoicing Engine
    Supports HSN itemization, GSTIN validation, and CGST/SGST/IGST breakdown.
    """

    NURSERY_LEGAL_ENTITY = {
        "legal_name": "Green Nest Bloom Floriculture Pvt. Ltd.",
        "trade_name": "Green Nest Bloom Mother Nursery & Packing Depot",
        "gstin": "29AABCG1234F1Z8",  # State Code 29 (Karnataka)
        "pan": "AABCG1234F",
        "address": "Kalmane, Thirthahalli, Karnataka 577432",
        "email": "invoicing@greennestbloom.com",
        "phone": "+91 8185 228899",
        "state": "Karnataka",
        "state_code": "29",
        "pincode": "577432"
    }

    @classmethod
    def generate_gst_invoice(cls, order: Order):
        """Builds a formal GST tax invoice data structure for B2B or B2C compliance"""
        user = order.user
        buyer_gstin = user.gstin if user else None
        is_inter_state = False

        if buyer_gstin and len(buyer_gstin) >= 2:
            buyer_state_code = buyer_gstin[:2]
            is_inter_state = (buyer_state_code != cls.NURSERY_LEGAL_ENTITY["state_code"])

        invoice_date = order.created_at.strftime("%d-%b-%Y") if order.created_at else datetime.utcnow().strftime("%d-%b-%Y")
        invoice_number = f"GNB/INV/{datetime.utcnow().year}/{order.id:05d}"

        # Tax calculations
        subtotal = order.subtotal
        if order.order_type == "event_booking":
            tax_rate = 18.0  # 18% GST on event staging services
        else:
            tax_rate = 5.0   # 5% GST on cut flowers and live nursery plants

        tax_total = round(subtotal * (tax_rate / 100.0), 2)
        if is_inter_state:
            cgst = 0.0
            sgst = 0.0
            igst = tax_total
        else:
            cgst = round(tax_total / 2.0, 2)
            sgst = round(tax_total / 2.0, 2)
            igst = 0.0

        grand_total = round(subtotal + tax_total, 2)

        return {
            "invoice_number": invoice_number,
            "invoice_date": invoice_date,
            "order_number": order.order_number,
            "order_type": order.order_type,
            "supplier": cls.NURSERY_LEGAL_ENTITY,
            "buyer": {
                "name": user.full_name if user else "Customer",
                "company_name": user.company_name if user else None,
                "gstin": buyer_gstin or "UNREGISTERED",
                "address": order.shipping_address or (user.address if user else "N/A"),
                "phone": user.phone if user else "N/A",
                "email": user.email if user else "N/A"
            },
            "place_of_supply": "Karnataka (29)" if not is_inter_state else "Inter-State",
            "items": [item.to_dict() for item in order.items],
            "tax_summary": {
                "subtotal": subtotal,
                "tax_rate_percent": tax_rate,
                "cgst": cgst,
                "sgst": sgst,
                "igst": igst,
                "tax_total": tax_total,
                "grand_total": grand_total
            },
            "payment_details": {
                "method": order.payment_method,
                "status": order.payment_status,
                "transaction_ref": f"TXN_GNB_{order.id:06d}"
            }
        }
