import pytest
from app import create_app
from models import db, User, AdminSession, SystemAlert

@pytest.fixture
def client():
    app, _ = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()

def test_user_registration(client):
    # Registration without OTP must be blocked
    res_no_otp = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User",
        "user_type": "individual"
    })
    assert res_no_otp.status_code == 400
    assert "Verification OTP is required" in res_no_otp.get_json()["error"]

    # Dispatch OTP
    otp_res = client.post("/api/auth/send-otp", json={
        "email": "test@example.com",
        "full_name": "Test User"
    })
    assert otp_res.status_code == 200
    otp_code = otp_res.get_json()["otp_preview"]

    # Complete registration with valid OTP
    res = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User",
        "user_type": "individual",
        "otp": otp_code
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["user_type"] == "individual"

    # Attempting to send OTP again for already registered user must be strictly rejected (409 Conflict)
    dup_otp = client.post("/api/auth/send-otp", json={
        "email": "test@example.com",
        "full_name": "Second User Impersonating"
    })
    assert dup_otp.status_code == 409
    assert "already registered" in dup_otp.get_json()["error"]

    # Attempting to register again with already registered email must be strictly rejected (409 Conflict)
    dup_reg = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "anotherpassword",
        "full_name": "Duplicate Registerer",
        "user_type": "individual",
        "otp": "123456"
    })
    assert dup_reg.status_code == 409
    assert "already registered" in dup_reg.get_json()["error"]

def test_b2b_registration_requires_gstin(client):
    otp_res = client.post("/api/auth/send-otp", json={
        "email": "hotel@example.com",
        "full_name": "Hotel Manager"
    })
    otp_code = otp_res.get_json()["otp_preview"]

    res = client.post("/api/auth/register", json={
        "email": "hotel@example.com",
        "password": "password123",
        "full_name": "Hotel Manager",
        "user_type": "corporate",
        "otp": otp_code
    })
    assert res.status_code == 400
    assert "GSTIN is mandatory" in res.get_json()["error"]

def test_singleton_admin_governance(client):
    # Dispatch OTP & Register admin
    otp_res = client.post("/api/auth/send-otp", json={
        "email": "admin@example.com",
        "full_name": "System Admin"
    })
    otp_code = otp_res.get_json()["otp_preview"]

    client.post("/api/auth/register", json={
        "email": "admin@example.com",
        "password": "adminpass123",
        "full_name": "System Admin",
        "user_type": "admin",
        "otp": otp_code
    })

    # First admin login
    res1 = client.post("/api/auth/login", json={
        "email": "admin@example.com",
        "password": "adminpass123"
    })
    assert res1.status_code == 200
    token1 = res1.get_json()["token"]

    # Second admin login (concurrent attempt)
    res2 = client.post("/api/auth/login", json={
        "email": "admin@example.com",
        "password": "adminpass123"
    })
    assert res2.status_code == 200
    token2 = res2.get_json()["token"]
    assert token1 != token2

    # Check that first session was deactivated (singleton enforcement)
    s1 = AdminSession.query.filter_by(session_token=token1).first()
    s2 = AdminSession.query.filter_by(session_token=token2).first()
    assert s1.is_active is False
    assert s2.is_active is True

    # Check alert was generated
    alerts = SystemAlert.query.filter_by(alert_type="admin_login").all()
    assert len(alerts) >= 1

def test_registration_triggers_admin_alert(client):
    otp_res = client.post("/api/auth/send-otp", json={
        "email": "freshclient@example.com",
        "full_name": "Anita Desai"
    })
    otp_code = otp_res.get_json()["otp_preview"]

    res = client.post("/api/auth/register", json={
        "email": "freshclient@example.com",
        "password": "clientpass123",
        "full_name": "Anita Desai",
        "user_type": "individual",
        "phone": "+91 98888 12345",
        "otp": otp_code
    })
    assert res.status_code == 201

    # Check alert was generated for super-admin
    alerts = SystemAlert.query.filter_by(alert_type="new_user_registration").all()
    assert len(alerts) == 1
    assert "Anita Desai" in alerts[0].subject
    assert alerts[0].recipient_email == "admin@greennestbloom.com"

def test_delivery_fleet_api(client):
    from models import DeliveryPartner
    driver = DeliveryPartner(
        full_name="Ramesh Kumar",
        phone="+91 98765 43210",
        email="ramesh@greennestbloom.com",
        vehicle_type="Refrigerated EV Van",
        vehicle_number="KA-01-EV-4402",
        status="available",
        current_lat=12.9716,
        current_lng=77.5946,
        speed_kmh=0.0,
        battery_level=95
    )
    db.session.add(driver)
    db.session.commit()

    # 1. Fetch fleet
    res = client.get("/api/telemetry/drivers")
    assert res.status_code == 200
    data = res.get_json()
    assert data["fleet_summary"]["total_couriers"] == 1
    assert len(data["drivers"]) == 1
    assert data["drivers"][0]["full_name"] == "Ramesh Kumar"

    # 2. Update status
    res2 = client.post(f"/api/telemetry/drivers/{driver.id}/status", json={"status": "en_route"})
    assert res2.status_code == 200
    assert res2.get_json()["driver"]["status"] == "en_route"

def test_otp_dispatch_and_verification(client):
    from models import EmailOTP, SystemAlert
    # 1. Send OTP to valid new email
    res = client.post("/api/auth/send-otp", json={
        "email": "sarah.connor@example.com",
        "full_name": "Sarah Connor"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    otp_code = data["otp_preview"]
    assert len(otp_code) == 6

    # Verify EmailOTP record in DB
    otp_rec = EmailOTP.query.filter_by(email="sarah.connor@example.com").first()
    assert otp_rec is not None
    assert otp_rec.otp_code == otp_code
    assert otp_rec.is_used is False

    # Verify SystemAlert logged email dispatch
    alert = SystemAlert.query.filter_by(recipient_email="sarah.connor@example.com").first()
    assert alert is not None
    assert otp_code in alert.body

    # 2. Verify invalid OTP fails
    res_bad = client.post("/api/auth/verify-otp", json={
        "email": "sarah.connor@example.com",
        "otp": "000000"
    })
    assert res_bad.status_code == 400

    # 3. Verify correct OTP succeeds
    res_good = client.post("/api/auth/verify-otp", json={
        "email": "sarah.connor@example.com",
        "otp": otp_code
    })
    assert res_good.status_code == 200
    assert res_good.get_json()["verified"] is True

    # 4. Complete Registration using the verified OTP
    res_reg = client.post("/api/auth/register", json={
        "email": "sarah.connor@example.com",
        "password": "terminatorpass123",
        "full_name": "Sarah Connor",
        "user_type": "individual",
        "otp": otp_code
    })
    assert res_reg.status_code == 201
    reg_data = res_reg.get_json()
    assert reg_data["user"]["email"] == "sarah.connor@example.com"
    assert "token" in reg_data

    # OTP should now be marked as used
    assert otp_rec.is_used is True

    # 5. Cannot request OTP for already registered email as individual
    res_dup = client.post("/api/auth/send-otp", json={
        "email": "sarah.connor@example.com",
        "user_type": "individual"
    })
    assert res_dup.status_code == 409

    # 6. Existing individual user can request OTP and register as verified corporate business partner
    res_corp_otp = client.post("/api/auth/send-otp", json={
        "email": "sarah.connor@example.com",
        "user_type": "corporate"
    })
    assert res_corp_otp.status_code == 200
    corp_otp_code = res_corp_otp.get_json()["otp_preview"]

    # Missing GSTIN fails
    res_no_gstin = client.post("/api/auth/register", json={
        "email": "sarah.connor@example.com",
        "password": "terminatorpass123",
        "full_name": "Sarah Connor",
        "user_type": "corporate",
        "otp": corp_otp_code
    })
    assert res_no_gstin.status_code == 400
    assert "GSTIN is mandatory" in res_no_gstin.get_json()["error"]

    # Valid corporate registration succeeds and upgrades user
    res_corp = client.post("/api/auth/register", json={
        "email": "sarah.connor@example.com",
        "password": "terminatorpass123",
        "full_name": "Sarah Connor",
        "user_type": "corporate",
        "company_name": "Cyberdyne Florals",
        "gstin": "29ABCDE1234F1Z5",
        "otp": corp_otp_code
    })
    assert res_corp.status_code == 200
    assert res_corp.get_json()["user"]["user_type"] == "corporate"
    assert res_corp.get_json()["user"]["company_name"] == "Cyberdyne Florals"
    assert res_corp.get_json()["user"]["gstin"] == "29ABCDE1234F1Z5"

