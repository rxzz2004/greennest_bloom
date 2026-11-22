import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:5001"

def test_endpoint(method, path, body=None, expected_status=200):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status = response.getcode()
            raw = response.read().decode("utf-8")
            try:
                res_data = json.loads(raw)
            except Exception:
                res_data = raw
            return {"path": path, "status": status, "success": status == expected_status, "data": res_data, "error": None}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            err_data = json.loads(raw)
        except Exception:
            err_data = raw
        return {"path": path, "status": e.code, "success": e.code == expected_status, "data": err_data, "error": str(e)}
    except Exception as e:
        return {"path": path, "status": 0, "success": False, "data": None, "error": str(e)}

def run_all_checks():
    results = []

    # 1. Health & Meta
    results.append(("Health & Diagnostics", test_endpoint("GET", "/api/health")))

    # 2. Authentication & Admin Governance
    results.append(("Auth Registered Users", test_endpoint("GET", "/api/auth/users")))
    results.append(("Auth Send OTP", test_endpoint("POST", "/api/auth/send-otp", {
        "email": "audit_test@greennestbloom.com",
        "full_name": "Audit Verification"
    })))

    # 3. Products & Plant Catalog
    results.append(("Products Catalog List", test_endpoint("GET", "/api/products")))
    results.append(("Product Categories Filter", test_endpoint("GET", "/api/products/categories")))

    # 4. Decay Batches & FEFO Engine
    results.append(("Perishable Batches List", test_endpoint("GET", "/api/batches")))
    results.append(("FEFO Batch Evaluation", test_endpoint("POST", "/api/batches/evaluate", {})))

    # 5. Bouquet Builder
    results.append(("Bouquet Catalog Elements", test_endpoint("GET", "/api/bouquet/catalog-elements")))
    results.append(("Bouquet Presets", test_endpoint("GET", "/api/bouquet/presets")))
    results.append(("Calculate Bouquet BOM", test_endpoint("POST", "/api/bouquet/calculate-bom", {
        "focal_flower_id": 1,
        "focal_count": 10
    })))
    results.append(("Bouquet AI Recommendation", test_endpoint("POST", "/api/bouquet/recommend", {
        "sentiment_text": "Romantic anniversary surprise for spouse"
    })))

    # 6. Subscriptions Management
    results.append(("Subscription Tiers", test_endpoint("GET", "/api/subscriptions/tiers")))
    results.append(("User Subscriptions List", test_endpoint("GET", "/api/subscriptions")))
    results.append(("Admin Curation Metrics", test_endpoint("GET", "/api/subscriptions/admin/curation-metrics")))

    # 7. Quotes & Event Staging
    results.append(("Event Venues Preset List", test_endpoint("GET", "/api/quotes/venues")))
    results.append(("Quote Single-Event Date Check", test_endpoint("POST", "/api/quotes/check-date", {
        "event_date": "2026-12-25"
    })))
    results.append(("Quote Haversine Radius Check", test_endpoint("POST", "/api/quotes/check-radius", {
        "lat": 13.6934,
        "lng": 75.2448
    })))
    results.append(("Quote Floriography NLP Recommender", test_endpoint("POST", "/api/quotes/floriography-recommend", {
        "event_type": "Wedding",
        "client_theme": "Royal Pastel Elegance"
    })))
    results.append(("Quote Gemini Key Status", test_endpoint("GET", "/api/quotes/gemini-key-status")))
    results.append(("Event Quotes Overview", test_endpoint("GET", "/api/quotes")))

    # 8. Orders & Cash On Delivery Checkout
    results.append(("Store Orders List", test_endpoint("GET", "/api/orders")))
    results.append(("Occasion Reminders", test_endpoint("GET", "/api/orders/reminders")))

    # 9. Telemetry & Cold-Chain Logistics Fleet
    results.append(("Delivery Drivers Fleet", test_endpoint("GET", "/api/telemetry/drivers")))
    results.append(("Fleet Telemetry Tick Simulation", test_endpoint("POST", "/api/telemetry/drivers/simulate-tick", {})))

    # 10. Analytics & Prophet Time-Series Forecasting
    results.append(("Prophet Seasonal Sales Forecast", test_endpoint("GET", "/api/analytics/prophet-forecast")))
    results.append(("System Alerts Audit Log", test_endpoint("GET", "/api/analytics/system-alerts")))
    results.append(("Inventory Health Metrics", test_endpoint("GET", "/api/analytics/inventory-health")))

    # 11. Datasets & Floriography Engine
    results.append(("Datasets Meta Overview", test_endpoint("GET", "/api/datasets")))
    results.append(("Botanical Species Dataset", test_endpoint("GET", "/api/datasets/botanical?category=cut_flower")))
    results.append(("Emotion Floriography Dataset", test_endpoint("GET", "/api/datasets/emotions")))
    results.append(("730-Day Historical Sales Dataset", test_endpoint("GET", "/api/datasets/historical-sales?page=1&per_page=10")))

    # 12. Promotional Coupons
    results.append(("Active Coupons List", test_endpoint("GET", "/api/coupons/active")))
    results.append(("Validate Coupon Code", test_endpoint("POST", "/api/coupons/validate", {
        "code": "BLOOM15",
        "subtotal": 2000
    })))

    # 13. Product Reviews & Ratings
    results.append(("Product Reviews Feed", test_endpoint("GET", "/api/products/1/reviews")))

    # 14. Real-Time Push Notifications
    results.append(("Active Device Push Tokens", test_endpoint("GET", "/api/notifications/active-tokens")))

    # 15. Database Admin Management
    results.append(("Database Schema Tables List", test_endpoint("GET", "/api/admin/db/tables")))
    results.append(("Database Table View (products)", test_endpoint("GET", "/api/admin/db/table/products")))

    # 16. Customer Wishlist
    results.append(("User Wishlist Items", test_endpoint("GET", "/api/wishlist?email=venishadsouza1322@gmail.com")))

    # Summary
    print("\n" + "=" * 78)
    print(" GREEN NEST BLOOM - FULL API HEALTH & MODULE AUDIT")
    print("=" * 78)
    all_passed = True
    for module_name, res in results:
        status_code = res["status"]
        success = res["success"]
        indicator = "PASS" if success else "FAIL"
        if not success:
            all_passed = False
        print(f"[{indicator}] {module_name:36} | Path: {res['path']:36} | Status: {status_code}")
        if not success:
            print(f"       Error: {res['error']} | Payload: {res['data']}")

    print("=" * 78)
    total = len(results)
    passed = sum(1 for _, r in results if r["success"])
    print(f"Results: {passed}/{total} API endpoints PASSED ({'100% HEALTHY' if all_passed else 'ISSUES DETECTED'})")
    print("=" * 78)
    return all_passed

if __name__ == "__main__":
    run_all_checks()
