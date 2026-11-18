import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from config import Config
from models import db, SystemAlert

class AlertService:
    @staticmethod
    def send_alert(alert_type: str, subject: str, html_body: str, recipient_email: str = None):
        """
        Dispatches critical alert via SMTP (or simulated SMTP in local dev)
        and persists record in the system_alerts table for admin audit.
        """
        target_email = recipient_email or Config.ADMIN_EMAIL
        
        # Save to database audit log
        try:
            alert = SystemAlert(
                alert_type=alert_type,
                recipient_email=target_email,
                subject=subject,
                body=html_body,
                status="sent",
                dispatched_at=datetime.utcnow()
            )
            db.session.add(alert)
            db.session.commit()
        except Exception as e:
            print(f"[AlertService] DB Logging error: {e}")
            db.session.rollback()

        # Attempt SMTP dispatch or simulated dispatch
        if Config.SIMULATE_SMTP or not Config.MAIL_PASSWORD or not Config.MAIL_USERNAME:
            print(f"\n=======================================================")
            print(f" [SIMULATED SMTP DISPATCH] TO: {target_email}")
            print(f" TYPE: {alert_type.upper()} | SUBJECT: {subject}")
            print(f" TIME: {datetime.utcnow().isoformat()}Z")
            print(f" BODY PREVIEW: {html_body[:160]}...")
            print(f"=======================================================\n")
            return True

        try:
            msg = MIMEMultipart("alternative")
            clean_subject = subject if "Green Nest Bloom" in subject else f"[Green Nest Bloom] {subject}"
            msg["Subject"] = clean_subject
            msg["From"] = f"Green Nest Bloom <{Config.MAIL_USERNAME}>"
            msg["To"] = target_email
            
            part = MIMEText(html_body, "html")
            msg.attach(part)

            if Config.MAIL_PORT == 465:
                with smtplib.SMTP_SSL(Config.MAIL_SERVER, Config.MAIL_PORT, timeout=15) as server:
                    server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
                    server.sendmail(Config.MAIL_USERNAME, target_email, msg.as_string())
            else:
                with smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT, timeout=15) as server:
                    if Config.MAIL_USE_TLS:
                        server.starttls()
                    server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
                    server.sendmail(Config.MAIL_USERNAME, target_email, msg.as_string())
            return True
        except Exception as err:
            print(f"[AlertService] SMTP Send error: {err}")
            return False

    @classmethod
    def trigger_otp_email(cls, recipient_email: str, otp_code: str, full_name: str = "Valued Customer"):
        subject = f"Your Verification Code: {otp_code} — Green Nest Bloom"
        body = f"""
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: auto; padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; color: #0f172a;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #064e3b; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Green Nest Bloom</h1>
                <p style="color: #0f766e; font-size: 13px; font-weight: 600; margin: 4px 0 0 0;">Botanical Commerce & Cold-Chain Floriculture</p>
            </div>
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #cbd5e1;">
                <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Email Verification Code</h2>
                <p style="font-size: 14px; color: #475569; line-height: 1.5;">Hello <strong>{full_name}</strong>,</p>
                <p style="font-size: 14px; color: #475569; line-height: 1.5;">Thank you for registering with Green Nest Bloom. Please use the one-time verification code (OTP) below to authenticate your email address and activate your account:</p>
                <div style="text-align: center; margin: 28px 0;">
                    <div style="display: inline-block; background: #064e3b; color: #6ee7b7; font-size: 34px; font-weight: 900; letter-spacing: 8px; padding: 14px 32px; border-radius: 12px; font-family: monospace; border: 2px solid #059669;">
                        {otp_code}
                    </div>
                </div>
                <p style="font-size: 12px; color: #64748b; margin: 0; text-align: center;">This code will expire in <strong>10 minutes</strong>. Never share this code with anyone.</p>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">If you did not request this registration, you can safely ignore this email.</p>
        </div>
        """
        return cls.send_alert("registration_otp", subject, body, recipient_email=recipient_email)

    @classmethod
    def trigger_new_user_alert(cls, user_id: int, full_name: str, email: str, user_type: str, company_name: str = None, phone: str = None, gstin: str = None):
        user_type_label = "Corporate Wholesale Partner" if user_type == "corporate" else "Individual B2C Client"
        subject = f"New Client Registered: {full_name} ({user_type_label})"
        body = f"""
        <div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
            <h2 style="color: #38bdf8; margin-top: 0;">New User Registration Notice</h2>
            <p>A new customer account has registered on the <strong>Green Nest Bloom</strong> platform:</p>
            <ul>
                <li><strong>Account ID:</strong> #{user_id}</li>
                <li><strong>Full Name:</strong> {full_name}</li>
                <li><strong>Email:</strong> {email}</li>
                <li><strong>Account Tier:</strong> {user_type.title()} ({user_type_label})</li>
                <li><strong>Contact Phone:</strong> {phone or 'Not provided'}</li>
                <li><strong>Company:</strong> {company_name or 'N/A (Retail)'}</li>
                <li><strong>GSTIN Verification:</strong> {gstin or 'N/A (Exempt)'}</li>
                <li><strong>Registration Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</li>
            </ul>
            <p style="font-size: 12px; color: #94a3b8;">You can manage accounts, wholesale tiers, and subscriptions in the Admin Console.</p>
        </div>
        """
        return cls.send_alert("new_user_registration", subject, body)

    @classmethod
    def trigger_admin_login_alert(cls, admin_email: str, ip_address: str, user_agent: str):
        subject = f"Security Notice: Administrative Access from {ip_address}"
        body = f"""
        <div style="font-family: sans-serif; padding: 20px; background: #064e3b; color: #ecfdf5; border-radius: 8px;">
            <h2 style="color: #6ee7b7; margin-top: 0;">Super-Admin Console Access Detected</h2>
            <p>An administrative login session was established on <strong>Green Nest Bloom</strong>:</p>
            <ul>
                <li><strong>Admin Account:</strong> {admin_email}</li>
                <li><strong>IP Address:</strong> {ip_address}</li>
                <li><strong>Browser User Agent:</strong> {user_agent}</li>
                <li><strong>Timestamp (UTC):</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}</li>
                <li><strong>Session Governance:</strong> Singleton enforcement active (all prior sessions invalidated).</li>
            </ul>
            <p style="font-size: 12px; color: #a7f3d0;">If this was not authorized, please revoke active sessions immediately.</p>
        </div>
        """
        return cls.send_alert("admin_login", subject, body)

    @classmethod
    def trigger_decay_threshold_alert(cls, batch_code: str, product_name: str, remaining_qty: int, age_days: int, discount: float):
        subject = f"Perishable Alert: Batch {batch_code} ({product_name}) Reached {int(discount)}% Decay Markdown"
        body = f"""
        <div style="font-family: sans-serif; padding: 20px; background: #78350f; color: #fef3c7; border-radius: 8px;">
            <h2 style="color: #fcd34d; margin-top: 0;">FEFO Perishable Senescence Warning</h2>
            <p>Cut flower stock is approaching critical biological vase life limit:</p>
            <ul>
                <li><strong>Batch:</strong> {batch_code}</li>
                <li><strong>Flower Variety:</strong> {product_name}</li>
                <li><strong>Current Age:</strong> {age_days} Days post-harvest</li>
                <li><strong>Remaining Volume:</strong> {remaining_qty} stems unallocated</li>
                <li><strong>Auto-Markdown Applied:</strong> {discount}% off regular wholesale/retail</li>
            </ul>
            <p>Action Recommended: Feature in Flash Clearance or route to subscription box arrangements to prevent complete spoilage write-off.</p>
        </div>
        """
        return cls.send_alert("critical_decay", subject, body)

    @classmethod
    def trigger_event_quote_alert(cls, quote_id: int, company_name: str, event_type: str, event_date: str, estimated_amount: float):
        subject = f"New Commercial Lead: {company_name or 'Corporate Client'} requested ₹{estimated_amount:,.2f} Event Quotation"
        body = f"""
        <div style="font-family: sans-serif; padding: 20px; background: #1e1b4b; color: #e0e7ff; border-radius: 8px;">
            <h2 style="color: #a5b4fc; margin-top: 0;">Incoming High-Ticket Event Quotation #{quote_id}</h2>
            <p>A corporate partner has submitted an event floral decor quotation:</p>
            <ul>
                <li><strong>Organization:</strong> {company_name or 'Independent Decorator'}</li>
                <li><strong>Event Category:</strong> {event_type.title()}</li>
                <li><strong>Scheduled Date:</strong> {event_date} (Single-event-per-day lock applied)</li>
                <li><strong>Preliminary Estimate:</strong> ₹{estimated_amount:,.2f}</li>
            </ul>
            <p>Review and confirm final logistics surcharge in the Admin Quotations Console.</p>
        </div>
        """
        return cls.send_alert("event_lead", subject, body)

    @classmethod
    def trigger_transit_exception_alert(cls, order_number: str, reason: str, driver_name: str, phone: str):
        subject = f"Logistics Exception: Order #{order_number} Transit Delay"
        body = f"""
        <div style="font-family: sans-serif; padding: 20px; background: #831843; color: #fce7f3; border-radius: 8px;">
            <h2 style="color: #f472b6; margin-top: 0;">Delivery Transit Delay Alert</h2>
            <p>A live delivery dispatch has reported an exception:</p>
            <ul>
                <li><strong>Order Number:</strong> {order_number}</li>
                <li><strong>Exception Cause:</strong> {reason}</li>
                <li><strong>Assigned Driver:</strong> {driver_name} ({phone})</li>
            </ul>
            <p>WebSocket live telemetry tracking has adjusted ETA accordingly.</p>
        </div>
        """
        return cls.send_alert("transit_exception", subject, body)

    @classmethod
    def trigger_courier_assigned_customer_alert(cls, customer_email: str, order_number: str, driver_name: str, driver_phone: str, vehicle_type: str, vehicle_number: str, eta_minutes: int = 28):
        subject = f"Your Botanical Order #{order_number} is Out for Delivery with {driver_name}"
        body = f"""
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: auto; padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; color: #0f172a;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #064e3b; font-size: 24px; font-weight: 800; margin: 0;">Green Nest Bloom</h1>
                <p style="color: #0f766e; font-size: 13px; font-weight: 600; margin: 4px 0 0 0;">Kalmane Mother Nursery & Cold-Chain Logistics</p>
            </div>
            <div style="background: #ecfdf5; border-radius: 12px; padding: 20px; border: 1px solid #a7f3d0; margin-bottom: 20px;">
                <h2 style="font-size: 16px; font-weight: 700; color: #065f46; margin: 0 0 8px 0;">Your Fresh Flowers Are En Route!</h2>
                <p style="font-size: 13px; color: #047857; margin: 0;">Your live botanical arrangement has been packaged at Kalmane Nursery in eco-friendly damp-root gel and is actively preserved at 4°C.</p>
            </div>
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0;">Assigned Courier Personnel:</h3>
                <table style="width: 100%; font-size: 13px; color: #334155; line-height: 1.8;">
                    <tr><td style="font-weight: 600; width: 150px;">Courier Partner:</td><td style="font-weight: bold; color: #064e3b;">{driver_name}</td></tr>
                    <tr><td style="font-weight: 600;">Contact Phone:</td><td><a href="tel:{driver_phone}" style="color: #059669; font-weight: bold; text-decoration: none;">{driver_phone}</a></td></tr>
                    <tr><td style="font-weight: 600;">EV Fleet Vehicle:</td><td>{vehicle_type} ({vehicle_number})</td></tr>
                    <tr><td style="font-weight: 600;">Cold-Chain Cargo:</td><td>Active Micro-Mist (3°C - 5°C)</td></tr>
                    <tr><td style="font-weight: 600;">Estimated Arrival:</td><td style="color: #0284c7; font-weight: bold;">~{eta_minutes} minutes</td></tr>
                </table>
            </div>
            <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">Track your courier vehicle live with GPS coordinates and temperature telemetry on the Green Nest Bloom platform.</p>
        </div>
        """
        return cls.send_alert("courier_assigned", subject, body, recipient_email=customer_email)

    @classmethod
    def trigger_order_delivered_alert(cls, customer_email: str, order_number: str, driver_name: str, delivery_address: str):
        subject = f"Delivered: Your Green Nest Bloom Arrangement for Order #{order_number} Has Arrived"
        body = f"""
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: auto; padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; color: #0f172a;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #064e3b; font-size: 24px; font-weight: 800; margin: 0;">Green Nest Bloom</h1>
                <p style="color: #0f766e; font-size: 13px; font-weight: 600; margin: 4px 0 0 0;">Kalmane Mother Nursery & Cold-Chain Logistics</p>
            </div>
            <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; border: 1px solid #86efac; margin-bottom: 20px; text-align: center;">
                <h2 style="font-size: 18px; font-weight: 800; color: #166534; margin: 0 0 6px 0;">Order Successfully Delivered</h2>
                <p style="font-size: 13px; color: #15803d; margin: 0;">Handed over safely by cold-chain courier <strong>{driver_name}</strong>.</p>
            </div>
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 13px; color: #334155;">
                <p style="margin: 0 0 8px 0;"><strong>Order Number:</strong> {order_number}</p>
                <p style="margin: 0 0 8px 0;"><strong>Delivery Destination:</strong> {delivery_address}</p>
                <p style="margin: 0;"><strong>Care Tip:</strong> Trim flower stems 1 cm diagonally under cool running water and place into a clean vase to ensure long vase life.</p>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">Thank you for cultivating botanical elegance with Green Nest Bloom.</p>
        </div>
        """
        return cls.send_alert("order_delivered", subject, body, recipient_email=customer_email)

    @classmethod
    def trigger_customer_unavailable_alert(cls, customer_email: str, order_number: str, driver_name: str, driver_phone: str, reason: str):
        subject = f"Delivery Notice: We Missed You for Order #{order_number}"
        body = f"""
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: auto; padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; color: #0f172a;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #064e3b; font-size: 24px; font-weight: 800; margin: 0;">Green Nest Bloom</h1>
                <p style="color: #0f766e; font-size: 13px; font-weight: 600; margin: 4px 0 0 0;">Kalmane Mother Nursery & Cold-Chain Logistics</p>
            </div>
            <div style="background: #fffbeb; border-radius: 12px; padding: 20px; border: 1px solid #fde68a; margin-bottom: 20px;">
                <h2 style="font-size: 16px; font-weight: 700; color: #92400e; margin: 0 0 6px 0;">Delivery Attempted — Customer Not Available</h2>
                <p style="font-size: 13px; color: #b45309; margin: 0;">Our cold-chain courier reached your delivery location, but was unable to complete the handover.</p>
            </div>
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 13px; color: #334155;">
                <p style="margin: 0 0 8px 0;"><strong>Order Number:</strong> {order_number}</p>
                <p style="margin: 0 0 8px 0;"><strong>Attempt Reason:</strong> {reason}</p>
                <p style="margin: 0 0 8px 0;"><strong>Courier:</strong> {driver_name} (<a href="tel:{driver_phone}" style="color: #059669; font-weight: bold;">{driver_phone}</a>)</p>
                <p style="margin: 0; color: #475569;">Your botanical stems are safely held in the vehicle's 4°C active micro-mist preservation compartment. We will coordinate a re-attempt shortly.</p>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">Please contact your courier directly or reach our store support at 1800-FLOWER-GNB.</p>
        </div>
        """
        # Audit alert to admin
        cls.send_alert("customer_unavailable", f"Logistics Exception: Delivery Attempted for #{order_number} ({reason})", body, recipient_email=Config.ADMIN_EMAIL)
        # Email to customer
        if customer_email:
            cls.send_alert("customer_unavailable", subject, body, recipient_email=customer_email)
        return True
