# Green Nest Bloom

**An Integrated B2C/B2B Floriculture Commerce, Perishable Spoilage Control, and Logistics Platform**

*Developed as an MCA Academic Project at A.J. Institute of Engineering & Technology, Mangaluru.*

---

## Academic Information

- **Institution:** A.J. Institute of Engineering & Technology, Mangaluru (Department of MCA)
- **Candidate Name:** Venisha Rizal Dsouza (USN: 4JK25MC117)
- **Internal Guide:** Ms. Ramya Prabhu
- **Academic Year:** 2026–2027
- **Document Identifier:** AJIET-MCA-2026-SDS-GNB-01

---

## Nursery Operations & Origin

- **Mother Nursery & Dispatch Hub:** Kalmane, Thirthahalli, Karnataka 577432 (Western Ghats)
- **Store Manager:** Venisha Dsouza
- **Customer Support & Orders:** Mr. Vikith Fernandes (+91 7349413826)
- **Payment Policy:** 100% Cash on Delivery (COD) exclusively with official GST Tax Invoice. No QR codes or credit cards accepted online.

---

## Core System Architecture

Green Nest Bloom is designed as a decoupled, multi-tier client-server application:

```
+=======================================================================================+
|                                    PRESENTATION TIER                                  |
|   React 18 SPA (Vite) | Fabric.js HTML5 Canvas | Leaflet GIS Maps | Socket.IO Client  |
+===========================================+===========================================+
                                            | HTTPS REST / WSS WebSocket Protocol
+===========================================v===========================================+
|                                   APPLICATION LOGIC TIER                              |
|   Flask 3.x WSGI Service (Port 5001) | Blueprint Routing Hub                           |
|   - Singleton Super-Admin Guard        - First-Expired, First-Out (FEFO) Decay Engine |
|   - Haversine Geospatial Radius Guard  - Multi-tier GST Tax Partitioning Engine        |
|   - Single-Event-per-Day Clash Guard   - Real-time Flask-SocketIO Fleet Dispatcher    |
|   - Prophet Festive Demand Forecasting - Floriography NLP Emotional Matching           |
+===========================================+===========================================+
                                            | SQLAlchemy ORM (Data Access Layer)
+===========================================v===========================================+
|                                      DATA TIER                                        |
|   Neon Cloud Serverless PostgreSQL (Production) / Local SQLite (Development)          |
+=======================================================================================+
```

---

## Key Modules & Features

### 1. Living Nursery & Cut Flower Catalog
- Over 77 botanical species categorized into cut flowers, fruit trees, kitchen vegetables, ayurvedic herbs, and artisanal planters.
- Dynamic watering care instructions with multi-select tags and custom requirement addition.
- Detailed botanical profiles including sunlight requirements, watering intervals, vase life, and floriography symbolism.

### 2. 7-Step Fabric.js 2D Bouquet Customizer
- Interactive drag-and-drop HTML5 Canvas arrangement engine.
- Step-by-step selection: focal flowers, secondary fillers, foliage, stems, wrapping materials, decorative ribbons, and custom greeting cards.
- Real-time Bill of Materials (BOM) calculation with transparent unit pricing in Indian Rupees (₹).

### 3. First-Expired-First-Out (FEFO) Perishable Decay Engine
- Dynamic markdown scheduling based on flower batch harvest timestamps and remaining shelf life.
- Progressive discounts: Fresh (0%), Mature 24h+ (15% off), Clear-Out 48h+ (35% off), Critical 72h+ (55% off).

### 4. Event Staging & Computer Vision Hall Classifier
- Single-event-per-day booking guard preventing double-booking of nursery floral resources.
- Haversine geospatial radius validation centered at Kalmane, Thirthahalli.
- Heuristic and visual classifier for event hall and wedding stage venue suitability.

### 5. Prophet Time-Series Demand Forecasting
- 730-day historical sales training dataset.
- System date awareness detecting upcoming Indian and cultural festivals (Diwali, Christmas, Ganesh Chaturthi, Navratri, Dussehra, Valentine's Day).
- 45-day projected stem procurement requirements with recommended safety stock buffers (+15%).

### 6. Cold-Chain Refrigerated Logistics & GPS Telemetry
- Real-time EV refrigerated delivery fleet tracking via bi-directional Socket.IO duplexing.
- Live temperature and GPS telemetry displayed on interactive Leaflet maps.
- Dedicated Courier Portal with automated customer delivery notifications.

### 7. Cash On Delivery (COD) Checkout & Tax Compliance
- Indian Goods and Services Tax (GST) compliant invoice generation: CGST (2.5%), SGST (2.5%), or IGST (5.0%).
- HSN code attribution: Cut flowers (`0603`), living nursery plants (`0602`), artisanal planters (`6912`).
- GPS location permission and interactive map pin picker for rapid address entry.

### 8. Curated Botanical Subscriptions
- 3 subscription tiers: Petal Delight (₹999/mo), Floral Elegance (₹1,999/mo), and Royal Bloom (₹2,999/mo).
- Complimentary artisanal ceramic vase included in the first month.
- Steerable weekly deliveries and subscription pause/cancel governance.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Fabric.js (Canvas 2D), Leaflet GIS, Socket.IO Client, Lucide Icons |
| **Backend** | Python 3.11, Flask 3.x, Flask-SQLAlchemy, Flask-SocketIO, Flask-CORS, Gunicorn |
| **Data Science / ML** | NumPy, Pandas, Scikit-Learn, SciPy, Pillow (PIL), Prophet Time-Series Modeling |
| **Database** | Neon Cloud Serverless PostgreSQL (Production) / SQLite (Local Development) |
| **Cloud Hosting** | Render (Web Service), Neon Cloud (PostgreSQL AWS ap-southeast-1) |

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Clone the Repository
```bash
git clone https://github.com/rxzz2004/greennest_bloom.git
cd greennest_bloom
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python3 -m venv backend/.venv
source backend/.venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask backend server
PYTHONPATH=backend python backend/app.py
```
*The backend API will run at `http://localhost:5001`.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The React storefront will run at `http://localhost:3000`.*

---

## Verification & Testing

To execute the complete 38-endpoint end-to-end module audit across all 16 platform modules:
```bash
./backend/.venv/bin/python scripts/verify_all_modules.py
```

---

## Cloud Deployment (Render)

This repository includes a production-ready Render specification:
- `render.yaml`: Configuration for Render Web Service.
- `build.sh`: Unified build script installing backend Python wheels and serving verified pre-compiled assets.
- `wsgi.py`: Production Gunicorn entry point (`gunicorn -w 1 --threads 4 -b 0.0.0.0:$PORT wsgi:app`).

---

## Project Documentation

Detailed academic documentation and system design specifications are maintained in the [`docs/`](docs/) directory:
- [Software Design Specification (Markdown)](docs/SOFTWARE_DESIGN_SPECIFICATION.md)
- Software Design Specification (Word `.docx` & PDF `.pdf`)
- High-Level Architecture & Entity Relationship Diagrams (`docs/*.drawio`, `docs/*.png`, `docs/*.svg`)
