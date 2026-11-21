from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from config import Config
from models import db
from routes.auth_routes import auth_bp
from routes.product_routes import product_bp
from routes.batch_routes import batch_bp
from routes.bouquet_routes import bouquet_bp
from routes.subscription_routes import subscription_bp
from routes.quote_routes import quote_bp
from routes.order_routes import order_bp
from routes.telemetry_routes import telemetry_bp
from routes.analytics_routes import analytics_bp
from routes.dataset_routes import dataset_bp, sync_botanical_dataset_to_db
from routes.coupon_routes import coupon_bp
from routes.review_routes import review_bp
from routes.notification_routes import notification_bp
from routes.db_admin_routes import db_admin_bp
from routes.wishlist_routes import wishlist_bp

def create_app(config_overrides=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)

    # Enable CORS for Vite frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Database
    db.init_app(app)

    # Initialize SocketIO for bi-directional live GPS telemetry
    socketio = SocketIO(app, cors_allowed_origins="*")

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(product_bp, url_prefix="/api/products")
    app.register_blueprint(batch_bp, url_prefix="/api/batches")
    app.register_blueprint(bouquet_bp, url_prefix="/api/bouquet")
    app.register_blueprint(subscription_bp, url_prefix="/api/subscriptions")
    app.register_blueprint(quote_bp, url_prefix="/api/quotes")
    app.register_blueprint(order_bp, url_prefix="/api/orders")
    app.register_blueprint(telemetry_bp, url_prefix="/api/telemetry")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(dataset_bp, url_prefix="/api/datasets")
    app.register_blueprint(coupon_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(db_admin_bp, url_prefix="/api/admin/db")
    app.register_blueprint(wishlist_bp, url_prefix="/api/wishlist")

    @app.route("/api/health")
    def health_check():
        return jsonify({
            "status": "healthy",
            "platform": "Green Nest Bloom",
            "version": "1.0.0",
            "singleton_admin": "enforced",
            "fefo_decay_engine": "active",
            "datasets_integrated": ["botanical_species_and_care", "emotion_floriography_classification", "historical_daily_sales_730days"]
        })

    # Serve Built Frontend React SPA & Static Assets
    import os
    from flask import send_from_directory
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api/"):
            return jsonify({"error": "API route not found"}), 404
        target_file = os.path.join(frontend_dist, path)
        if path != "" and os.path.exists(target_file) and not os.path.isdir(target_file):
            return send_from_directory(frontend_dist, path)
        elif os.path.exists(os.path.join(frontend_dist, "index.html")):
            return send_from_directory(frontend_dist, "index.html")
        return jsonify({"message": "Green Nest Bloom API is active. Build frontend with 'npm run build' to serve the web application."})

    # WebSocket Telemetry Events
    @socketio.on("connect")
    def handle_connect():
        emit("telemetry_status", {"status": "Connected to Green Nest Bloom Logistics Engine"})

    @socketio.on("track_order")
    def handle_track_order(data):
        order_id = data.get("order_id")
        emit("telemetry_update", {
            "order_id": order_id,
            "status": "in_transit",
            "driver": "Ramesh Kumar (GNB Fleet #4)",
            "message": "Tracking live GPS telemetry stream"
        })

    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"[DB Notice] Database table verification: {e}")

    return app, socketio

app, socketio = create_app()

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5001, debug=True, allow_unsafe_werkzeug=True)
