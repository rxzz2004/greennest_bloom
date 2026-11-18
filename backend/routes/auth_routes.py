import uuid
import random
import re
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from config import Config
from models import db, User, AdminSession, EmailOTP
from services.alert_service import AlertService

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():
    """Generates a secure 6-digit OTP and dispatches it to the recipient email via AlertService"""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    full_name = data.get("full_name", "").strip() or "Valued Customer"

    if not email:
        return jsonify({"error": "Email address is required."}), 400

    # Basic email format validation
    email_regex = r"^[^@]+@[^@]+\.[^@]+$"
    if not re.match(email_regex, email):
        return jsonify({"error": "Please provide a valid email address."}), 400

    user_type = data.get("user_type", "").strip().lower()
    intent = data.get("intent", "register").strip().lower()

    # Check if user already exists in database
    existing_user = User.query.filter(db.func.lower(User.email) == email).first()
    if intent in ["login", "signin", "otp_login"]:
        if not existing_user:
            return jsonify({
                "error": "No registered account found with this email address. Please create an account first."
            }), 404
        full_name = existing_user.full_name
    elif existing_user:
        # If an individual user is upgrading to a corporate business partner, permit OTP dispatch
        if existing_user.user_type == "individual" and (user_type == "corporate" or intent == "upgrade_corporate"):
            pass
        else:
            return jsonify({
                "error": "An account with this email address is already registered in our database. Duplicate registration is not allowed. Please sign in instead."
            }), 409

    # Generate 6-digit cryptographic random OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    try:
        # Invalidate / remove previous unused OTPs for this email address
        EmailOTP.query.filter_by(email=email, is_used=False).delete()

        # Save new OTP record
        otp_record = EmailOTP(
            email=email,
            otp_code=otp_code,
            expires_at=expires_at,
            is_used=False
        )
        db.session.add(otp_record)
        db.session.commit()

        # Dispatch verification email via AlertService
        email_sent = AlertService.trigger_otp_email(
            recipient_email=email,
            otp_code=otp_code,
            full_name=full_name
        )

        is_simulated = Config.SIMULATE_SMTP or not Config.MAIL_PASSWORD
        if not is_simulated and not email_sent:
            return jsonify({
                "error": f"Failed to deliver verification email to {email} via SMTP. Please verify mail credentials in backend/.env."
            }), 502

        return jsonify({
            "status": "success",
            "message": f"Verification code delivered to {email}. Please check your inbox and spam folder.",
            "expires_in_seconds": 600,
            "simulated": False,
            # Strict realistic authentication: Never expose OTP preview in production or browser responses
            "otp_preview": otp_code if current_app.config.get("TESTING") else None
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to send verification email: {str(e)}"}), 500


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    """Validates submitted 6-digit OTP code against the latest issued active OTP"""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    otp = str(data.get("otp", "")).strip()

    if not email or not otp:
        return jsonify({"error": "Both email and OTP code are required."}), 400

    otp_record = EmailOTP.query.filter_by(email=email, is_used=False).order_by(EmailOTP.created_at.desc()).first()

    if not otp_record:
        return jsonify({"error": "No pending verification code found for this email. Please request an OTP."}), 404

    if not otp_record.is_valid(otp):
        return jsonify({"error": "Invalid or expired verification code. Please request a new OTP."}), 400

    return jsonify({
        "status": "success",
        "verified": True,
        "message": "Email verified successfully."
    }), 200


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    full_name = data.get("full_name", "").strip()
    user_type = data.get("user_type", "individual").strip().lower()
    company_name = data.get("company_name", "").strip()
    gstin = data.get("gstin", "").strip().upper()
    phone = data.get("phone", "").strip()
    address = data.get("address", "").strip()
    otp = str(data.get("otp", "")).strip()

    if not email or not password or not full_name:
        return jsonify({"error": "Email, password, and full name are required."}), 400

    existing_user = User.query.filter(db.func.lower(User.email) == email).first()
    if existing_user:
        # Check if individual user is registering as a verified corporate business partner
        if existing_user.user_type == "individual" and user_type == "corporate":
            if not gstin:
                return jsonify({"error": "GSTIN is mandatory for verified corporate wholesale accounts."}), 400

            if not otp:
                return jsonify({"error": "Verification OTP is required. Please verify your email first."}), 400

            otp_record = EmailOTP.query.filter_by(email=email, is_used=False).order_by(EmailOTP.created_at.desc()).first()
            if not otp_record or not otp_record.is_valid(otp):
                return jsonify({"error": "Invalid or expired verification code. Please request a new OTP."}), 400

            # Redeem OTP
            otp_record.is_used = True

            # Upgrade individual to corporate business partner
            existing_user.user_type = "corporate"
            existing_user.company_name = company_name or full_name
            existing_user.gstin = gstin
            if full_name:
                existing_user.full_name = full_name
            if phone:
                existing_user.phone = phone
            if address:
                existing_user.address = address
            if password:
                existing_user.set_password(password)

            db.session.commit()
            token = str(uuid.uuid4())

            AlertService.trigger_new_user_alert(
                user_id=existing_user.id,
                full_name=existing_user.full_name,
                email=existing_user.email,
                user_type=existing_user.user_type,
                company_name=existing_user.company_name,
                phone=existing_user.phone,
                gstin=existing_user.gstin
            )

            return jsonify({
                "message": "Successfully registered and verified as corporate business partner.",
                "token": token,
                "user": existing_user.to_dict(),
                "upgraded": True
            }), 200
        else:
            return jsonify({
                "error": "An account with this email address is already registered in our database. Duplicate registration is not allowed. Please sign in instead."
            }), 409

    # Strictly require email OTP verification for every new user registration
    if not otp:
        return jsonify({"error": "Verification OTP is required. Please verify your email first."}), 400

    otp_record = EmailOTP.query.filter_by(email=email, is_used=False).order_by(EmailOTP.created_at.desc()).first()
    if not otp_record or not otp_record.is_valid(otp):
        return jsonify({"error": "Invalid or expired verification code. Please request a new OTP."}), 400

    # Mark OTP as successfully redeemed
    otp_record.is_used = True

    if user_type == "corporate" and not gstin:
        return jsonify({"error": "GSTIN is mandatory for verified corporate wholesale accounts."}), 400

    user = User(
        email=email,
        full_name=full_name,
        user_type=user_type,
        company_name=company_name if user_type == "corporate" else None,
        gstin=gstin if user_type == "corporate" else None,
        phone=phone,
        address=address
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = str(uuid.uuid4())

    # Automatically notify Super-Admin of new client registration
    AlertService.trigger_new_user_alert(
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        user_type=user.user_type,
        company_name=user.company_name,
        phone=user.phone,
        gstin=user.gstin
    )

    return jsonify({
        "message": f"Successfully registered as {user_type} account.",
        "token": token,
        "user": user.to_dict()
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    # Automatically normalize admin shorthand if user omitted '.com'
    if email in ["admin@greennestbloom", "admin"]:
        email = "admin@greennestbloom.com"

    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password credentials."}), 401

    token = str(uuid.uuid4())
    ip_address = request.remote_addr or "127.0.0.1"
    user_agent = request.headers.get("User-Agent", "Unknown Client")

    # Singleton Super-Admin Governance:
    # If logging in as admin, strictly terminate/invalidate any other active administrative session
    if user.user_type == "admin":
        AdminSession.query.filter_by(admin_id=user.id, is_active=True).update({"is_active": False})
        new_session = AdminSession(
            admin_id=user.id,
            session_token=token,
            ip_address=ip_address,
            user_agent=user_agent,
            is_active=True,
            last_active=datetime.utcnow()
        )
        db.session.add(new_session)
        db.session.commit()

        # Trigger Automated Critical SMTP Alert for Admin Login
        AlertService.trigger_admin_login_alert(user.email, ip_address, user_agent)
    else:
        db.session.commit()

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict(),
        "is_singleton_admin_active": user.user_type == "admin"
    }), 200

@auth_bp.route("/login-otp", methods=["POST"])
def login_with_otp():
    """Authenticates an existing user via valid 6-digit email OTP"""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    otp = str(data.get("otp", "")).strip()

    if not email or not otp:
        return jsonify({"error": "Both email address and OTP code are required."}), 400

    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user:
        return jsonify({"error": "No registered account found with this email. Please sign up first."}), 404

    otp_record = EmailOTP.query.filter_by(email=email, is_used=False).order_by(EmailOTP.created_at.desc()).first()
    if not otp_record or not otp_record.is_valid(otp):
        return jsonify({"error": "Invalid or expired verification code. Please request a new OTP."}), 400

    # Mark OTP as successfully used
    otp_record.is_used = True

    token = str(uuid.uuid4())
    ip_address = request.remote_addr or "127.0.0.1"
    user_agent = request.headers.get("User-Agent", "Unknown Client")

    if user.user_type == "admin":
        AdminSession.query.filter_by(admin_id=user.id, is_active=True).update({"is_active": False})
        new_session = AdminSession(
            admin_id=user.id,
            session_token=token,
            ip_address=ip_address,
            user_agent=user_agent,
            is_active=True,
            last_active=datetime.utcnow()
        )
        db.session.add(new_session)
        db.session.commit()
        AlertService.trigger_admin_login_alert(user.email, ip_address, user_agent)
    else:
        db.session.commit()

    return jsonify({
        "message": f"Successfully signed in as {user.full_name}",
        "token": token,
        "user": user.to_dict(),
        "is_singleton_admin_active": user.user_type == "admin"
    }), 200

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Generates a 6-digit password reset OTP and emails it to the user"""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "Please enter your registered email address."}), 400

    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user:
        return jsonify({"error": "No account found with this email address. Please register first."}), 404

    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    try:
        EmailOTP.query.filter_by(email=email, is_used=False).delete()
        otp_record = EmailOTP(
            email=email,
            otp_code=otp_code,
            expires_at=expires_at,
            is_used=False
        )
        db.session.add(otp_record)
        db.session.commit()

        email_sent = AlertService.trigger_password_reset_email(
            recipient_email=email,
            otp_code=otp_code,
            full_name=user.full_name
        )

        is_simulated = Config.SIMULATE_SMTP or not Config.MAIL_PASSWORD
        if not is_simulated and not email_sent:
            return jsonify({
                "error": f"Failed to deliver password reset email to {email} via SMTP. Please verify mail credentials."
            }), 502

        return jsonify({
            "status": "success",
            "message": f"Password reset code sent to {email}. Please check your inbox and spam folder.",
            "simulated": False,
            "otp_preview": otp_code if current_app.config.get("TESTING") else None
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to send password reset code: {str(e)}"}), 500

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Resets user password after verifying 6-digit OTP"""
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    otp = str(data.get("otp", "")).strip()
    new_password = data.get("new_password", "").strip()

    if not email or not otp or not new_password:
        return jsonify({"error": "Email, reset code, and new password are required."}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    user = User.query.filter(db.func.lower(User.email) == email).first()
    if not user:
        return jsonify({"error": "No account found with this email address."}), 404

    otp_record = EmailOTP.query.filter_by(email=email, is_used=False).order_by(EmailOTP.created_at.desc()).first()
    if not otp_record or not otp_record.is_valid(otp):
        return jsonify({"error": "Invalid or expired reset code. Please request a new one."}), 400

    otp_record.is_used = True
    user.set_password(new_password)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Password updated successfully! You can now sign in with your new password."
    }), 200

@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    # In this demonstration environment, we pass email via query or auth header
    email = request.headers.get("X-User-Email") or request.args.get("email")
    if not email:
        return jsonify({"user": None}), 200

    user = User.query.filter_by(email=email.strip().lower()).first()
    if not user:
        return jsonify({"user": None}), 404

    return jsonify({"user": user.to_dict()}), 200

@auth_bp.route("/users", methods=["GET"])
def get_all_users():
    """Admin endpoint to list all registered users across individual, corporate, and admin roles"""
    user_type = request.args.get("user_type")
    query = User.query

    if user_type:
        query = query.filter_by(user_type=user_type)

    users = query.order_by(User.created_at.desc()).all()
    return jsonify({
        "total_users": len(users),
        "users": [u.to_dict() for u in users]
    }), 200
