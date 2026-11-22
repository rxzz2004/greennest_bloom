import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env.local, backend/.env and project root .env
load_dotenv(BASE_DIR.parent / ".env.local")
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "green-nest-bloom-mca-secret-2026")
    
    _raw_db_url = os.getenv("DATABASE_URL")
    if _raw_db_url:
        if _raw_db_url.startswith("postgres://"):
            _raw_db_url = _raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif _raw_db_url.startswith("postgresql://") and not _raw_db_url.startswith("postgresql+"):
            _raw_db_url = _raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        SQLALCHEMY_DATABASE_URI = _raw_db_url
    else:
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{BASE_DIR / 'greennest_bloom.db'}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    
    # SMTP / Alert Settings
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@greennestbloom.com")
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    SIMULATE_SMTP = os.getenv("SIMULATE_SMTP", "True").lower() == "true"

    # Logistics Depot Coordinates (Main Nursery Hub: Kalmane, Thirthahalli, Karnataka 577432)
    DEPOT_NAME = "Green Nest Central Nursery & Cold-Chain Packing Hub"
    DEPOT_ADDRESS = "Kalmane, Thirthahalli, Karnataka 577432"
    DEPOT_PINCODE = "577432"
    DEPOT_LATITUDE = 13.6934
    DEPOT_LONGITUDE = 75.2448
    MAX_DELIVERY_RADIUS_KM = 2500.0  # Nationwide cold-chain delivery originating from Kalmane, Thirthahalli

    # Business Rules
    MAX_RETAIL_BOUQUETS_PER_ORDER = 5
    MAX_RETAIL_PLANTS_PER_ORDER = 10
    SINGLETON_ADMIN_MAX_SESSIONS = 1
