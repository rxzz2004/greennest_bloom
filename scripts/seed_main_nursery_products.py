import os
import sys
import json
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from dotenv import load_dotenv
env_local = Path(__file__).resolve().parent.parent / ".env.local"
if env_local.exists():
    load_dotenv(env_local)
    unpooled = os.getenv("DATABASE_URL_UNPOOLED")
    if unpooled:
        os.environ["DATABASE_URL"] = unpooled

from app import app, db
from models import Product

MAIN_PRODUCTS = [
    # 1. Living Nursery Plants
    {
        "name": "Variegated Monstera Albo",
        "category": "Living Nursery Plants",
        "is_perishable": False,
        "base_price": 2499.0,
        "b2b_min_quantity": 5,
        "b2b_discount_percent": 15.0,
        "hsn_code": "0602",
        "botanical_name": "Monstera deliciosa 'Albo Borsigiana'",
        "sunlight_requirement": "Bright Indirect Light",
        "watering_frequency": "Water when top 2 inches dry",
        "vase_life_days": 0,
        "floriography_meaning": "Rare elegance, flourishing abundance, and enduring vitality.",
        "images": ["/monstera_plant_pot.jpg"],
        "stock_quantity": 25
    },
    {
        "name": "Sansevieria Trifasciata (Snake Plant)",
        "category": "Living Nursery Plants",
        "is_perishable": False,
        "base_price": 499.0,
        "b2b_min_quantity": 10,
        "b2b_discount_percent": 20.0,
        "hsn_code": "0602",
        "botanical_name": "Sansevieria trifasciata 'Laurentii'",
        "sunlight_requirement": "Low to Bright Indirect Light",
        "watering_frequency": "Water every 2-3 weeks",
        "vase_life_days": 0,
        "floriography_meaning": "Resilience, persistence, and continuous 24/7 air purification.",
        "images": ["/snake_plant_pot.jpg"],
        "stock_quantity": 60
    },
    {
        "name": "Ficus Lyrata (Fiddle Leaf Fig)",
        "category": "Living Nursery Plants",
        "is_perishable": False,
        "base_price": 1299.0,
        "b2b_min_quantity": 5,
        "b2b_discount_percent": 15.0,
        "hsn_code": "0602",
        "botanical_name": "Ficus lyrata",
        "sunlight_requirement": "Filtered Bright Sunlight",
        "watering_frequency": "Moderate weekly watering",
        "vase_life_days": 0,
        "floriography_meaning": "Abundance, good fortune, and architectural interior grandeur.",
        "images": ["/fiddle_fig_pot.jpg"],
        "stock_quantity": 30
    },
    {
        "name": "Zamioculcas Zamiifolia (ZZ Plant)",
        "category": "Living Nursery Plants",
        "is_perishable": False,
        "base_price": 549.0,
        "b2b_min_quantity": 10,
        "b2b_discount_percent": 18.0,
        "hsn_code": "0602",
        "botanical_name": "Zamioculcas zamiifolia",
        "sunlight_requirement": "Low Light Tolerant",
        "watering_frequency": "Drought resistant, water monthly",
        "vase_life_days": 0,
        "floriography_meaning": "Steadfast prosperity, patience, and everlasting green luck.",
        "images": ["/zz_plant.jpg"],
        "stock_quantity": 45
    },
    {
        "name": "Krishna Tulsi (Sacred Holy Basil)",
        "category": "Living Nursery Plants",
        "is_perishable": False,
        "base_price": 249.0,
        "b2b_min_quantity": 15,
        "b2b_discount_percent": 25.0,
        "hsn_code": "0602",
        "botanical_name": "Ocimum tenuiflorum",
        "sunlight_requirement": "Direct Sunshine (5+ hours daily)",
        "watering_frequency": "Daily morning watering",
        "vase_life_days": 0,
        "floriography_meaning": "Sacred devotion, spiritual purity, and traditional therapeutic vitality.",
        "images": ["/krishna_tulsi.jpg"],
        "stock_quantity": 100
    },
    {
        "name": "Areca Palm (Indoor Air-Purifying Palm)",
        "category": "Living Nursery Plants",
        "is_perishable": False,
        "base_price": 799.0,
        "b2b_min_quantity": 8,
        "b2b_discount_percent": 20.0,
        "hsn_code": "0602",
        "botanical_name": "Dypsis lutescens",
        "sunlight_requirement": "Bright Filtered Light",
        "watering_frequency": "Moist well-draining soil twice weekly",
        "vase_life_days": 0,
        "floriography_meaning": "Peace, tropical serenity, and positive living atmosphere.",
        "images": ["/arecanut_palm.jpg"],
        "stock_quantity": 40
    },

    # 2. Curated Bouquets
    {
        "name": "Bespoke Malnad Heritage Bridal Bouquet",
        "category": "Curated Bouquets",
        "is_perishable": True,
        "base_price": 1899.0,
        "b2b_min_quantity": 3,
        "b2b_discount_percent": 15.0,
        "hsn_code": "0603",
        "botanical_name": "Lilium candidum & Jasminum sambac with Eucalyptus",
        "sunlight_requirement": "Cool Room Temperature",
        "watering_frequency": "Trim stems at 45 deg angle, fresh cold water daily",
        "vase_life_days": 7,
        "floriography_meaning": "Majestic honor, pure devotion, and auspicious lifelong marital harmony.",
        "images": ["/lily_bouquet_realistic.jpg"],
        "stock_quantity": 20
    },
    {
        "name": "Thirthahalli Sunrise Rose Bouquet",
        "category": "Curated Bouquets",
        "is_perishable": True,
        "base_price": 999.0,
        "b2b_min_quantity": 5,
        "b2b_discount_percent": 20.0,
        "hsn_code": "0603",
        "botanical_name": "Rosa rubiginosa 'Red Naomi' & 'Golden Sun'",
        "sunlight_requirement": "Indirect Soft Lighting",
        "watering_frequency": "Change cold water daily with floral nourishment",
        "vase_life_days": 6,
        "floriography_meaning": "Joyous celebration, warmth of dawn, and eternal romantic affection.",
        "images": ["/rose_bouquet_realistic.jpg"],
        "stock_quantity": 35
    },
    {
        "name": "Western Ghats Wildflower Medley Bouquet",
        "category": "Curated Bouquets",
        "is_perishable": True,
        "base_price": 1299.0,
        "b2b_min_quantity": 4,
        "b2b_discount_percent": 18.0,
        "hsn_code": "0603",
        "botanical_name": "Vanda coerulea & Helianthus annuus & Gypsophila",
        "sunlight_requirement": "Keep in Cool Shade",
        "watering_frequency": "Keep stems submerged in clean water",
        "vase_life_days": 6,
        "floriography_meaning": "Untamed natural splendor, exuberance, and optimism.",
        "images": ["/sunflower_bouquet.jpg"],
        "stock_quantity": 25
    },
    {
        "name": "Royal Celebration Lily & Orchid Bouquet",
        "category": "Curated Bouquets",
        "is_perishable": True,
        "base_price": 1599.0,
        "b2b_min_quantity": 4,
        "b2b_discount_percent": 15.0,
        "hsn_code": "0603",
        "botanical_name": "Lilium orientalis & Vanda coerulea",
        "sunlight_requirement": "Keep Away From Direct Heat",
        "watering_frequency": "Cold water hydration every 2 days",
        "vase_life_days": 7,
        "floriography_meaning": "Regal dignity, refined luxury, and congratulatory triumph.",
        "images": ["/orchid_bouquet_realistic.jpg"],
        "stock_quantity": 20
    },
    {
        "name": "Blush Peony Elegance Bouquet",
        "category": "Curated Bouquets",
        "is_perishable": True,
        "base_price": 1499.0,
        "b2b_min_quantity": 4,
        "b2b_discount_percent": 15.0,
        "hsn_code": "0603",
        "botanical_name": "Paeonia lactiflora 'Duchesse de Nemours'",
        "sunlight_requirement": "Cool Room Ambience",
        "watering_frequency": "Change water every 2 days",
        "vase_life_days": 6,
        "floriography_meaning": "Prosperity, romantic bashfulness, and happy marriage.",
        "images": ["/peony_bouquet_realistic.jpg"],
        "stock_quantity": 15
    },

    # 3. Cut Flowers & Stems
    {
        "name": "Pink Oriental Stargazer Lily",
        "category": "Cut Flowers & Stems",
        "is_perishable": True,
        "base_price": 599.0,
        "b2b_min_quantity": 10,
        "b2b_discount_percent": 15.0,
        "hsn_code": "0603",
        "botanical_name": "Lilium orientalis 'Stargazer'",
        "sunlight_requirement": "Cool Filtered Light",
        "watering_frequency": "Trim stems diagonally at 45 deg, cold water",
        "vase_life_days": 6,
        "floriography_meaning": "Boundless ambition, prosperity, and celestial beauty.",
        "images": ["/pink_lily_bloom.jpg", "/pink_lily_bud.jpg"],
        "stock_quantity": 50
    },
    {
        "name": "Dutch Red Velvet Roses (Bundle of 10)",
        "category": "Cut Flowers & Stems",
        "is_perishable": True,
        "base_price": 550.0,
        "b2b_min_quantity": 10,
        "b2b_discount_percent": 20.0,
        "hsn_code": "0603",
        "botanical_name": "Rosa rubiginosa 'Red Naomi'",
        "sunlight_requirement": "Indirect Soft Sunshine",
        "watering_frequency": "Re-cut underwater every 2 days",
        "vase_life_days": 5,
        "floriography_meaning": "Immortal romantic devotion, deep respect, and timeless beauty.",
        "images": ["/rose_flower_bouquet.jpg"],
        "stock_quantity": 120
    },
    {
        "name": "Imperial Purple Vanda Orchids (Stem)",
        "category": "Cut Flowers & Stems",
        "is_perishable": True,
        "base_price": 120.0,
        "b2b_min_quantity": 20,
        "b2b_discount_percent": 18.0,
        "hsn_code": "0603",
        "botanical_name": "Vanda coerulea",
        "sunlight_requirement": "High Humidity, Warm Indirect Light",
        "watering_frequency": "Submerge stem bottom in chilled water",
        "vase_life_days": 7,
        "floriography_meaning": "Exotic refinement, rare magnificence, and enduring strength.",
        "images": ["/orchid_bouquet_realistic.jpg"],
        "stock_quantity": 80
    },
    {
        "name": "Saffron Orange African Giant Marigold",
        "category": "Cut Flowers & Stems",
        "is_perishable": True,
        "base_price": 350.0,
        "b2b_min_quantity": 25,
        "b2b_discount_percent": 20.0,
        "hsn_code": "0603",
        "botanical_name": "Tagetes erecta 'Saffron Giant'",
        "sunlight_requirement": "Full Sunshine",
        "watering_frequency": "Mist petals lightly before auspicious rituals",
        "vase_life_days": 6,
        "floriography_meaning": "Sacred auspiciousness, festival cheer, and positive divine aura.",
        "images": ["/saffron_marigold.jpg"],
        "stock_quantity": 150
    }
]

def seed_products():
    with app.app_context():
        print(f"Connecting to Neon: {app.config['SQLALCHEMY_DATABASE_URI'].split('@')[-1]}")
        added = 0
        updated = 0

        for item in MAIN_PRODUCTS:
            name = item["name"]
            existing = Product.query.filter_by(name=name).first()
            img_data = json.dumps(item["images"]) if len(item["images"]) > 1 else item["images"][0]

            if not existing:
                p = Product(
                    name=name,
                    category=item["category"],
                    is_perishable=item["is_perishable"],
                    base_price=item["base_price"],
                    b2b_min_quantity=item["b2b_min_quantity"],
                    b2b_discount_percent=item["b2b_discount_percent"],
                    hsn_code=item["hsn_code"],
                    botanical_name=item["botanical_name"],
                    sunlight_requirement=item["sunlight_requirement"],
                    watering_frequency=item["watering_frequency"],
                    vase_life_days=item["vase_life_days"],
                    floriography_meaning=item["floriography_meaning"],
                    image_url=img_data,
                    stock_quantity=item["stock_quantity"]
                )
                db.session.add(p)
                added += 1
            else:
                existing.category = item["category"]
                existing.base_price = item["base_price"]
                existing.is_perishable = item["is_perishable"]
                existing.botanical_name = item["botanical_name"]
                existing.sunlight_requirement = item["sunlight_requirement"]
                existing.watering_frequency = item["watering_frequency"]
                existing.vase_life_days = item["vase_life_days"]
                existing.floriography_meaning = item["floriography_meaning"]
                existing.image_url = img_data
                existing.stock_quantity = item["stock_quantity"]
                updated += 1

        db.session.commit()
        print(f"Seeded {added} new products and updated {updated} existing products in Neon.")

if __name__ == "__main__":
    seed_products()
