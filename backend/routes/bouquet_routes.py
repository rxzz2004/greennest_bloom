from flask import Blueprint, request, jsonify
from models import db, CustomBouquet, Product, User
from services.floriography_service import FloriographyService

bouquet_bp = Blueprint("bouquet", __name__)

BOUQUET_ELEMENTS = {
    "wrappings": [
        {"id": "matte_kraft", "name": "Matte Rustic Kraft Paper", "price": 120.0, "color": "#d7b48c", "description": "Eco-friendly fibrous pulp tied with natural jute twine."},
        {"id": "pastel_parisian", "name": "Pastel Parisian Waterproof Wrap", "price": 180.0, "color": "#fbcfe8", "description": "Translucent French chic waterproof wrapping with satin edges."},
        {"id": "burlap_vintage", "name": "Artisanal Hessian Burlap & Lace", "price": 220.0, "color": "#a88258", "description": "Coarse organic woven hessian with vintage cream lace accent."},
        {"id": "midnight_velvet", "name": "Midnight Emerald Velvet & Gold Trim", "price": 290.0, "color": "#064e3b", "description": "Lavish forest emerald textured wrap with metallic foil borders."}
    ],
    "focal_flowers": [
        {"id": 1, "name": "Dutch Red Velvet Roses", "unit_price": 55.0, "botanical": "Rosa rubiginosa", "color": "#e11d48"},
        {"id": 2, "name": "Royal White Asiatic Lilies", "unit_price": 95.0, "botanical": "Lilium candidum", "color": "#f8fafc"},
        {"id": 3, "name": "Imperial Purple Orchids", "unit_price": 120.0, "botanical": "Vanda coerulea", "color": "#9333ea"},
        {"id": 4, "name": "Blush Duchess Peonies", "unit_price": 140.0, "botanical": "Paeonia lactiflora", "color": "#f472b6"}
    ],
    "filler_flowers": [
        {"id": 5, "name": "Starry Baby's Breath", "unit_price": 25.0, "botanical": "Gypsophila paniculata", "color": "#ffffff"},
        {"id": 6, "name": "Lavender Sea Lavender / Statice", "unit_price": 30.0, "botanical": "Limonium sinuatum", "color": "#a855f7"},
        {"id": 7, "name": "Golden Meadow Solidago", "unit_price": 20.0, "botanical": "Solidago virgaurea", "color": "#eab308"}
    ],
    "foliage": [
        {"id": 8, "name": "Silver Dollar Eucalyptus", "unit_price": 35.0, "botanical": "Eucalyptus cinerea", "color": "#64748b"},
        {"id": 9, "name": "Glossy Italian Ruscus", "unit_price": 28.0, "botanical": "Ruscus hypoglossum", "color": "#15803d"},
        {"id": 10, "name": "Mini Monstera Leaves", "unit_price": 45.0, "botanical": "Monstera deliciosa", "color": "#047857"}
    ],
    "arrangement_styles": [
        {"id": "dome_round", "name": "Classic Dome (Biedermeier)", "surcharge": 0.0, "description": "Symmetrical, compact spherical structure with uniform flower distribution."},
        {"id": "cascading_waterfall", "name": "Romantic Cascading Waterfall", "surcharge": 250.0, "description": "Flowing downward drape ideal for dramatic gifting and luxury presentations."},
        {"id": "minimalist_ikebana", "name": "Sculptural Ikebana Zen", "surcharge": 180.0, "description": "Asymmetrical artistic lines emphasizing negative space and stem architecture."},
        {"id": "wildflower_meadow", "name": "Organic Hand-Tied Meadow", "surcharge": 120.0, "description": "Airy, natural bohemian sprawl resembling freshly gathered wildflowers."}
    ],
    "fragrances": [
        {"id": "rose_petal_mist", "name": "Damask Rose Floral Infusion", "price": 75.0, "description": "Pure hydro-distilled rosewater with notes of morning dew."},
        {"id": "citrus_neroli", "name": "Sweet Neroli & Orange Blossom", "price": 90.0, "description": "Bright uplifting zest with soft white blossom undertones."},
        {"id": "botanical_fresh", "name": "Eucalyptus & Forest Mint Dew", "price": 85.0, "description": "Cooling crisp herbal aroma that heightens botanical freshness."},
        {"id": "unscented", "name": "Hypoallergenic Unscented Mist", "price": 0.0, "description": "Pure plant preservation mist without added perfume."}
    ],
    "add_ons": [
        {"id": "calligraphy_wax_card", "name": "Hand-Lettered Parchment & Wax Seal", "price": 150.0},
        {"id": "artisan_truffles", "name": "Artisan Dark Chocolate Truffle Box (4 pcs)", "price": 320.0},
        {"id": "ceramic_vase", "name": "Ribbed Ceramic Display Vase", "price": 480.0}
    ]
}

BOUQUET_PRESETS = [
    {
        "id": "victorian_romance",
        "name": "The Victorian Romance",
        "description": "7 Dutch Crimson Roses anchored with starry baby's breath and silver eucalyptus in vintage Kraft.",
        "config": {
            "wrapping_id": "matte_kraft",
            "focal_flower_id": 1,
            "focal_count": 7,
            "filler_flower_id": 5,
            "filler_count": 4,
            "foliage_id": 8,
            "foliage_count": 3,
            "arrangement_style": "dome_round",
            "fragrance_id": "rose_petal_mist",
            "addons": ["calligraphy_wax_card"]
        }
    },
    {
        "id": "ikebana_solace",
        "name": "Zen Ikebana Solace",
        "description": "Royal Asiatic Lilies with deep purple statice and architectural mini monstera foliage.",
        "config": {
            "wrapping_id": "midnight_velvet",
            "focal_flower_id": 2,
            "focal_count": 4,
            "filler_flower_id": 6,
            "filler_count": 3,
            "foliage_id": 10,
            "foliage_count": 3,
            "arrangement_style": "minimalist_ikebana",
            "fragrance_id": "botanical_fresh",
            "addons": ["calligraphy_wax_card"]
        }
    },
    {
        "id": "regal_imperial",
        "name": "Imperial Majesty Waterfall",
        "description": "Cascading purple Vanda orchids with French chic Parisian waterproof wrap.",
        "config": {
            "wrapping_id": "pastel_parisian",
            "focal_flower_id": 3,
            "focal_count": 6,
            "filler_flower_id": 5,
            "filler_count": 4,
            "foliage_id": 9,
            "foliage_count": 2,
            "arrangement_style": "cascading_waterfall",
            "fragrance_id": "citrus_neroli",
            "addons": ["calligraphy_wax_card", "artisan_truffles"]
        }
    }
]

@bouquet_bp.route("/catalog-elements", methods=["GET"])
def get_bouquet_elements():
    return jsonify({"elements": BOUQUET_ELEMENTS}), 200

@bouquet_bp.route("/presets", methods=["GET"])
def get_presets():
    return jsonify({"presets": BOUQUET_PRESETS}), 200

@bouquet_bp.route("/calculate-bom", methods=["POST"])
def calculate_bom():
    data = request.get_json() or {}
    
    wrapping_id = data.get("wrapping_id", "matte_kraft")
    focal_id = data.get("focal_flower_id", 1)
    focal_count = max(int(data.get("focal_count", 5)), 1)
    filler_id = data.get("filler_flower_id", 5)
    filler_count = max(int(data.get("filler_count", 3)), 0)
    foliage_id = data.get("foliage_id", 8)
    foliage_count = max(int(data.get("foliage_count", 2)), 0)
    style_id = data.get("arrangement_style", "dome_round")
    fragrance_id = data.get("fragrance_id", "rose_petal_mist")
    addons = data.get("addons", [])

    # Price computations
    wrapping = next((w for w in BOUQUET_ELEMENTS["wrappings"] if w["id"] == wrapping_id), BOUQUET_ELEMENTS["wrappings"][0])
    focal = next((f for f in BOUQUET_ELEMENTS["focal_flowers"] if f["id"] == focal_id), BOUQUET_ELEMENTS["focal_flowers"][0])
    filler = next((f for f in BOUQUET_ELEMENTS["filler_flowers"] if f["id"] == filler_id), BOUQUET_ELEMENTS["filler_flowers"][0])
    foliage = next((f for f in BOUQUET_ELEMENTS["foliage"] if f["id"] == foliage_id), BOUQUET_ELEMENTS["foliage"][0])
    style = next((s for s in BOUQUET_ELEMENTS["arrangement_styles"] if s["id"] == style_id), BOUQUET_ELEMENTS["arrangement_styles"][0])
    fragrance = next((f for f in BOUQUET_ELEMENTS["fragrances"] if f["id"] == fragrance_id), BOUQUET_ELEMENTS["fragrances"][0])

    items_breakdown = [
        {"item": f"{wrapping['name']} (Wrapping)", "qty": 1, "cost": wrapping["price"]},
        {"item": f"{focal['name']} (Focal)", "qty": focal_count, "cost": round(focal["unit_price"] * focal_count, 2)},
        {"item": f"{filler['name']} (Filler)", "qty": filler_count, "cost": round(filler["unit_price"] * filler_count, 2)},
        {"item": f"{foliage['name']} (Greenery)", "qty": foliage_count, "cost": round(foliage["unit_price"] * foliage_count, 2)},
        {"item": f"{style['name']} (Artisan Styling)", "qty": 1, "cost": style["surcharge"]},
        {"item": f"{fragrance['name']} (Preservation Mist)", "qty": 1, "cost": fragrance["price"]}
    ]

    for addon_id in addons:
        addon = next((a for a in BOUQUET_ELEMENTS["add_ons"] if a["id"] == addon_id), None)
        if addon:
            items_breakdown.append({"item": addon["name"], "qty": 1, "cost": addon["price"]})

    subtotal = sum(i["cost"] for i in items_breakdown)
    tax = round(subtotal * 0.05, 2)  # 5% GST on floriculture
    total = round(subtotal + tax, 2)

    return jsonify({
        "items_breakdown": items_breakdown,
        "subtotal": round(subtotal, 2),
        "tax_gst_5": tax,
        "total_price": total,
        "total_stem_count": focal_count + filler_count + foliage_count
    }), 200

@bouquet_bp.route("/save", methods=["POST"])
def save_custom_bouquet():
    data = request.get_json() or {}
    user_email = data.get("user_email")
    user = User.query.filter_by(email=user_email).first() if user_email else None

    if not user:
        user = User.query.first()

    bouquet = CustomBouquet(
        user_id=user.id,
        bouquet_name=data.get("bouquet_name", "Bespoke Creation"),
        wrapping_type=data.get("wrapping_type", "matte_kraft"),
        focal_flower_id=data.get("focal_flower_id", 1),
        focal_count=int(data.get("focal_count", 5)),
        filler_flower_id=data.get("filler_flower_id", 5),
        filler_count=int(data.get("filler_count", 3)),
        foliage_id=data.get("foliage_id", 8),
        foliage_count=int(data.get("foliage_count", 2)),
        arrangement_style=data.get("arrangement_style", "dome_round"),
        fragrance_type=data.get("fragrance_type", "rose_petal_mist"),
        greeting_card_text=data.get("greeting_card_text"),
        canvas_json=data.get("canvas_json"),
        total_price=float(data.get("total_price", 950.0))
    )
    db.session.add(bouquet)
    db.session.commit()

    return jsonify({"message": "Bespoke bouquet saved successfully.", "bouquet": bouquet.to_dict()}), 201

@bouquet_bp.route("/recommend", methods=["POST"])
def recommend_bouquet_configuration():
    """
    NLP Floriography Recommender: Analyzes recipient sentiment, occasion,
    or greeting card text using the Emotion Text Classification Dataset
    and recommends the optimal botanical flower arrangement, palette, and wrap.
    """
    data = request.get_json() or {}
    text_input = data.get("sentiment_text") or data.get("prompt") or data.get("occasion", "")
    if not text_input:
        return jsonify({"error": "Please provide 'sentiment_text' or 'occasion'"}), 400

    floriography_result = FloriographyService.analyze_sentiment_and_recommend(text_input)
    profile = floriography_result["floriography_profile"]

    # Map recommended botanical flowers to actual catalog products if available
    recommended_flowers = profile.get("primary_flowers", [])
    matched_products = []
    for fl in recommended_flowers:
        fl_name = fl.get("name", "").strip()
        matched = Product.query.filter(
            Product.category == "cut_flower",
            Product.name.ilike(f"%{fl_name}%")
        ).first()
        if matched:
            matched_products.append(matched.to_dict())

    # If no exact match, provide default fresh cut flowers
    if not matched_products:
        matched_products = [p.to_dict() for p in Product.query.filter_by(category="cut_flower").limit(3).all()]

    # Suggest wrapping ID matching profile description
    wrapping_map = {
        "Rustic Kraft": "matte_kraft",
        "Parisian": "pastel_parisian",
        "Burlap": "burlap_vintage",
        "Emerald": "midnight_velvet",
        "Velvet": "midnight_velvet"
    }
    rec_wrap_text = profile.get("recommended_wrapping", "")
    suggested_wrap = next((v for k, v in wrapping_map.items() if k.lower() in rec_wrap_text.lower()), "matte_kraft")

    return jsonify({
        "status": "success",
        "input_analyzed": text_input,
        "emotion_analysis": {
            "dominant_category": floriography_result["detected_category"],
            "primary_emotion": profile.get("primary_emotion"),
            "confidence_percentage": floriography_result["confidence_percentage"],
            "emotion_scores": floriography_result["emotion_scores"]
        },
        "curated_styling": {
            "palette_name": profile.get("palette_name"),
            "palette_hexes": profile.get("palette"),
            "recommended_wrapping_id": suggested_wrap,
            "recommended_wrapping_note": rec_wrap_text,
            "accent_greenery": profile.get("accent_greenery"),
            "curator_note": profile.get("curator_note")
        },
        "recommended_botanicals": matched_products,
        "summary": floriography_result["recommendation_summary"]
    }), 200

