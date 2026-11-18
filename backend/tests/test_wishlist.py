import pytest
from app import create_app
from models import db, User, WishlistItem

@pytest.fixture
def client():
    app, _ = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        db.create_all()
        # Seed two distinct users
        user1 = User(
            email="venisha.dsouza@example.com",
            full_name="Venisha Dsouza",
            user_type="individual"
        )
        user1.set_password("pass123")
        
        user2 = User(
            email="venishadsouza1322@gmail.com",
            full_name="Rizal",
            user_type="individual"
        )
        user2.set_password("pass456")

        db.session.add_all([user1, user2])
        db.session.commit()

        yield app.test_client()

        db.session.remove()
        db.drop_all()

def test_wishlist_isolation_between_users(client):
    # 1. Both start with empty wishlists
    res1 = client.get("/api/wishlist?email=venisha.dsouza@example.com")
    assert res1.status_code == 200
    assert res1.get_json()["wishlist"] == []

    res2 = client.get("/api/wishlist?email=venishadsouza1322@gmail.com")
    assert res2.status_code == 200
    assert res2.get_json()["wishlist"] == []

    # 2. Venisha adds an item to her wishlist
    toggle1 = client.post("/api/wishlist/toggle", json={
        "email": "venisha.dsouza@example.com",
        "product_id": "pink-peonies"
    })
    assert toggle1.status_code == 200
    assert "pink-peonies" in toggle1.get_json()["wishlist"]

    # 3. Rizal's wishlist MUST remain completely empty
    res2_after = client.get("/api/wishlist?email=venishadsouza1322@gmail.com")
    assert res2_after.status_code == 200
    assert res2_after.get_json()["wishlist"] == []

    # 4. Rizal adds a different item to his wishlist
    toggle2 = client.post("/api/wishlist/toggle", json={
        "email": "venishadsouza1322@gmail.com",
        "product_id": "cat-angel-roses"
    })
    assert toggle2.status_code == 200
    assert toggle2.get_json()["wishlist"] == ["cat-angel-roses"]

    # 5. Verify Venisha's wishlist still only contains her item
    res1_after = client.get("/api/wishlist?email=venisha.dsouza@example.com")
    assert res1_after.get_json()["wishlist"] == ["pink-peonies"]

    # 6. Toggle again removes item for that user
    toggle1_remove = client.post("/api/wishlist/toggle", json={
        "email": "venisha.dsouza@example.com",
        "product_id": "pink-peonies"
    })
    assert toggle1_remove.status_code == 200
    assert toggle1_remove.get_json()["wishlist"] == []
    assert toggle1_remove.get_json()["action"] == "removed"

    # 7. Rizal's item is untouched
    res2_final = client.get("/api/wishlist?email=venishadsouza1322@gmail.com")
    assert res2_final.get_json()["wishlist"] == ["cat-angel-roses"]
