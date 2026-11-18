import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_docx(output_path):
    doc = docx.Document()

    # Page Margins: 1 inch all around
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)

    # Helper styling functions
    def set_cell_background(cell, fill_hex):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{m}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    # =========================================================================
    # TITLE PAGE
    # =========================================================================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p_inst.add_run("A.J. INSTITUTE OF ENGINEERING & TECHNOLOGY, MANGALURU\n")
    r1.bold = True
    r1.font.size = Pt(16)
    r1.font.color.rgb = RGBColor(15, 23, 42)

    r2 = p_inst.add_run("DEPARTMENT OF MASTER OF COMPUTER APPLICATIONS (MCA)\n")
    r2.bold = True
    r2.font.size = Pt(13)
    r2.font.color.rgb = RGBColor(15, 118, 110)

    r3 = p_inst.add_run("(Affiliated to Visvesvaraya Technological University, Belagavi)\n\n")
    r3.font.size = Pt(9.5)
    r3.font.color.rgb = RGBColor(100, 116, 139)

    p_doc = doc.add_paragraph()
    p_doc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r4 = p_doc.add_run("SOFTWARE DESIGN SPECIFICATION (SDS)\n")
    r4.bold = True
    r4.font.size = Pt(15)
    r4.font.color.rgb = RGBColor(180, 83, 9)

    r5 = p_doc.add_run("Applicable for Non-ML Projects\n\n")
    r5.bold = True
    r5.font.size = Pt(11)
    r5.font.color.rgb = RGBColor(71, 85, 105)

    p_proj = doc.add_paragraph()
    p_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r6 = p_proj.add_run("GREEN NEST BLOOM\n")
    r6.bold = True
    r6.font.size = Pt(17)
    r6.font.color.rgb = RGBColor(15, 23, 42)

    r7 = p_proj.add_run("An Integrated B2C/B2B Floriculture Commerce, Perishable Spoilage Control, and Logistics Platform\n\n")
    r7.font.size = Pt(10.5)
    r7.font.color.rgb = RGBColor(100, 116, 139)

    # Metadata Table
    meta_data = [
        ("Candidate Name:", "Venisha Rizal Dsouza"),
        ("University Seat Number (USN):", "4JK25MC117"),
        ("Degree & Semester:", "Master of Computer Applications (MCA) — Semester 3"),
        ("Internal Guide:", "Ms. Ramya Prabhu"),
        ("Academic Year:", "2026 – 2027"),
        ("Institution:", "A.J. Institute of Engineering & Technology, Mangaluru"),
        ("Document Identifier:", "AJIET-MCA-2026-SDS-GNB-01"),
        ("Document Version:", "1.0 (Final Approved Specification)"),
        ("Central Packing Depot:", "Kalmane, Thirthahalli, Karnataka 577432 (13.6934° N, 75.2448° E)"),
        ("Technology Stack:", "React 18 (Vite), Fabric.js, Leaflet GIS, Flask 3.x, Flask-SocketIO, SQLite/PostgreSQL")
    ]
    table_meta = doc.add_table(rows=len(meta_data), cols=2)
    table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (k, v) in enumerate(meta_data):
        row = table_meta.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        c0.paragraphs[0].add_run(k).bold = True
        c1.paragraphs[0].add_run(v)
        set_cell_background(c0, "F8FAFC")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0)
        set_cell_margins(c1)

    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sig.paragraph_format.space_before = Pt(24)
    r_sig = p_sig.add_run("Institutional Review & Approval Signatures")
    r_sig.bold = True
    r_sig.font.size = Pt(11)

    table_sig = doc.add_table(rows=2, cols=3)
    table_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_headers = ["Candidate", "Internal Guide", "Head of Department (MCA)"]
    sig_names = ["Venisha Rizal Dsouza\nUSN: 4JK25MC117", "Ms. Ramya Prabhu\nAssistant Professor", "Dr. Antony P J\nProfessor & HOD"]
    for j in range(3):
        c_h = table_sig.rows[0].cells[j]
        c_h.paragraphs[0].add_run(sig_headers[j]).bold = True
        set_cell_background(c_h, "F1F5F9")
        set_cell_margins(c_h, top=80, bottom=80)
        c_b = table_sig.rows[1].cells[j]
        c_b.paragraphs[0].add_run(f"\n\n\n___________________\n{sig_names[j]}")
        set_cell_margins(c_b, top=100, bottom=120)

    doc.add_page_break()

    # =========================================================================
    # SECTION 1: SYSTEM DESIGN
    # =========================================================================
    doc.add_heading("1. System Design", level=1)
    doc.add_heading("1.1. Architectural Design", level=2)

    p_arch = doc.add_paragraph(
        "GreenNest Bloom is engineered following a decoupled, multi-tier Client-Server Architecture "
        "utilizing a Single-Page Application (SPA) front-end and a RESTful Micro-Modular Backend "
        "with real-time WebSocket Event Duplexing. The system cleanly separates presentation, business logic, "
        "and relational persistence across three well-defined tiers:\n"
    )
    doc.add_paragraph("1. Presentation Tier (Client Layer): Single-page application built on React 18, Vite, Fabric.js (HTML5 Canvas 2D engine), Leaflet GIS mapping, and Socket.IO client.", style='List Bullet')
    doc.add_paragraph("2. Application Logic Tier (Server Layer): Python Flask 3.x WSGI service partitioned into Flask Blueprints, executing business logic engines (First-Expired, First-Out decay curves, Haversine geospatial calculations, GST taxation partitioning, and Singleton Admin session governance).", style='List Bullet')
    doc.add_paragraph("3. Data Tier (Persistence Layer): Relational persistence managed through SQLAlchemy ORM, enforcing strict ACID transactions, foreign key constraints, and relational integrity.", style='List Bullet')

    doc.add_heading("1.1.1 & 1.1.2 High-level Architecture Diagram", level=3)
    
    img_arch = '/Users/rizal/GreenNest_Bloom/docs/GreenNest_Bloom_Academic_Architecture.png'
    if os.path.exists(img_arch):
        p_fig = doc.add_paragraph()
        p_fig.alignment = WD_ALIGN_PARAGRAPH.CENTER
        doc.add_picture(img_arch, width=Inches(6.5))
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_cap = p_cap.add_run("Figure 1.1: Green Nest Bloom High-Level Multi-Tier Architecture Diagram\n")
        r_cap.bold = True
        r_cap.font.size = Pt(9.5)
        r_cap.font.color.rgb = RGBColor(71, 85, 105)

    p_arch_desc = doc.add_paragraph(
        "The high-level architecture diagram illustrates the end-to-end communication pathways from client browsers "
        "through network boundaries into Flask services and database persistence layers:\n\n"
        "[Presentation Tier (Browser/PWA)]\n"
        "  ├── Customer Storefront & Catalog (IndividualUserHome.jsx)\n"
        "  ├── 7-Step 2D Bouquet Customizer (BouquetBuilder7Step.jsx / Fabric.js)\n"
        "  ├── Corporate Portal & Venue Simulator (CorporateDashboard / EventStagingEngine)\n"
        "  ├── Live Cold-Chain GPS Tracking Modal (LiveTrackingModal.jsx / Leaflet)\n"
        "  └── Super-Admin Control Console (AdminConsole.jsx / DatabaseInspector)\n"
        "         │\n"
        "         ├── HTTPS REST API (/api/* via Axios) ──────────────┐\n"
        "         └── WSS WebSocket Channel (/socket.io) ─────┐       │\n"
        "                                                      │       │\n"
        "[Application Logic Tier (Flask 3.x WSGI Service - Port 5001)] │\n"
        "  ├── Authentication & Singleton Admin Session Guard ────────┤\n"
        "  ├── FEFO Biological Decay & Dynamic Markdown Engine ───────┤\n"
        "  ├── Order Processing & GST Tax Engine (CGST/SGST/IGST) ────┤\n"
        "  ├── Haversine Geolocation Distance & Delivery Radius ──────┤\n"
        "  ├── Event Clash Guard (Single Booking per Date) ───────────┤\n"
        "  └── Real-Time Fleet Telemetry WebSocket Broadcaster ◄──────┘\n"
        "         │\n"
        "         └── SQLAlchemy ORM (Data Access Layer - ACID Transactions)\n"
        "               │\n"
        "[Data Tier (Relational Persistence & Datasets)]\n"
        "  ├── Relational Database Engine (SQLite / PostgreSQL) — 18 Relational Tables\n"
        "  └── Botanical Care, Daily Sales & Floriography Datasets (CSV)"
    )
    p_arch_desc.style = 'Normal'

    doc.add_heading("1.1.3 Subsystems / Components and Responsibilities", level=3)
    subsystems = [
        ("Storefront & Catalog", "IndividualUserHome.jsx", "Botanical care search, sunlight/watering filter chips, live stock meters, and cart mutations."),
        ("2D Customizer Studio", "BouquetBuilder7Step.jsx", "7-step HTML5 canvas customizer using Fabric.js for floral stems, layering, rotation transforms, and JSON export."),
        ("Corporate B2B Portal", "CorporateDashboard.jsx", "Wholesale procurement, Minimum Order Quantity (MOQ) validation, verified GSTIN entry, and bulk discounted billing."),
        ("Venue Staging Simulator", "EventStagingEngine.jsx", "Captures venue coordinates, evaluates Haversine delivery distance from Kalmane hub, and enforces Single-Event Clash Guard."),
        ("Cold-Chain Live GPS", "LiveTrackingModal.jsx", "Leaflet GIS map rendering of refrigerated EV van coordinates, telemetry HUD metrics, and animated route polylines."),
        ("Super-Admin Console", "AdminConsole.jsx", "FEFO decay overrides, singleton session inspection, table row mutations, and live database schema resets."),
        ("FEFO Decay Engine", "batch_routes.py", "First-Expired, First-Out harvest tracking and dynamic markdown pricing curves based on floral vase-life decay."),
        ("Commerce & GST Engine", "order_routes.py", "Order subtotal computation, coupon validation, stock reduction, and statutory GST splits (2.5% CGST + 2.5% SGST / 5% IGST)."),
        ("Geospatial Logistics", "quote_routes.py", "Executes Haversine spherical distance formula from central hub at Kalmane, Thirthahalli (13.6934 N, 75.2448 E)."),
        ("WebSocket Telemetry", "telemetry_routes.py", "Bi-directional Socket.IO broker streaming simulated real-time EV courier GPS coordinates to active client map modals.")
    ]
    t_sub = doc.add_table(rows=len(subsystems) + 1, cols=3)
    t_sub.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_sub.rows[0].cells[0].paragraphs[0].add_run("Subsystem").bold = True
    t_sub.rows[0].cells[1].paragraphs[0].add_run("Component").bold = True
    t_sub.rows[0].cells[2].paragraphs[0].add_run("Core Responsibilities").bold = True
    for c in t_sub.rows[0].cells:
        set_cell_background(c, "0F172A")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    for i, (name, comp, resp) in enumerate(subsystems):
        row = t_sub.rows[i + 1]
        row.cells[0].paragraphs[0].add_run(name).bold = True
        row.cells[1].paragraphs[0].add_run(comp)
        row.cells[2].paragraphs[0].add_run(resp)
        bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
        for c in row.cells:
            set_cell_background(c, bg)
            set_cell_margins(c)

    doc.add_page_break()

    # =========================================================================
    # SECTION 2: DETAILED DESIGN
    # =========================================================================
    doc.add_heading("2. Detailed Design", level=1)
    doc.add_heading("2.1 Database Design", level=2)
    doc.add_heading("2.1.1 Conceptual ER Diagram", level=3)

    doc.add_paragraph(
        "The conceptual database architecture strictly implements Peter Chen Entity-Relationship Criteria, "
        "differentiating between Strong Entities (standalone life-cycle with independent primary keys) and "
        "Weak Entities (existence-dependent child records relying on identifying relationships and partial keys):\n\n"
        "• Strong Entities (Single Rectangle): USER, PRODUCT, ORDER, SUBSCRIPTION, EVENT_QUOTATION, CUSTOM_BOUQUET, DELIVERY_PARTNER, COUPON, SYSTEM_ALERT.\n"
        "• Weak Entities (Double Rectangle): ADMIN_SESSION, PUSH_NOTIFICATION_TOKEN, WISHLIST_ITEM, OCCASION_REMINDER, PERISHABLE_BATCH, PRODUCT_REVIEW, ORDER_ITEM, DELIVERY_TELEMETRY, SUBSCRIPTION_FEEDBACK.\n"
        "• Identifying Relationships (Double Rhombus): Admin Sessions, Registers, Saves, Schedules, Tracks Batches, Reviews, Contains, Streamed By GPS, Evaluates.\n"
        "• Regular Relationships (Single Rhombus): Places, Designs, Supplies Stems, Subscribes, Requests, Authors, Assigned To, References, Allocates.\n"
        "• Attribute Notation in Ovals: Primary Keys underlined with solid line (id); Weak Entity Partial Keys with dashed underline; Foreign Keys labeled (FK); Unique keys labeled (UK).\n\n"
        "A complete, interactive multi-tab Draw.io diagram containing all 18 entities and 200 attribute ovals is generated and available at:\n"
        "GreenNest_Bloom_ERD.drawio (138 KB)"
    )

    doc.add_heading("2.1.2 Logical Schema and Relational Specifications", level=3)
    doc.add_paragraph("The relational schema consists of 18 tables defined via SQLAlchemy ORM with complete integrity rules:")

    tables = [
        ("users", "Strong Entity", "id (PK), email (UK), password_hash, full_name, company_name, gstin, user_type, phone, address, created_at"),
        ("admin_sessions", "Weak Entity (users)", "id (PK), admin_id (FK), session_token (Partial Key, UK), ip_address, user_agent, is_active, last_active"),
        ("products", "Strong Entity", "id (PK), name, category, is_perishable, base_price, b2b_min_quantity, b2b_discount_percent, hsn_code, botanical_name, sunlight_requirement, watering_frequency, vase_life_days, floriography_meaning, image_url, stock_quantity"),
        ("perishable_batches", "Weak Entity (products)", "id (PK), product_id (FK), batch_code (Partial Key, UK), harvest_date, initial_quantity, remaining_quantity, current_age_days, vase_life_days, discount_percent, status"),
        ("orders", "Strong Entity", "id (PK), user_id (FK), order_number (UK), order_type, subtotal, tax_cgst, tax_sgst, tax_igst, total_amount, payment_method, payment_status, order_status, shipping_address, created_at"),
        ("order_items", "Weak Entity (orders)", "id (PK), order_id (FK), product_id (FK), batch_id (FK), item_name (Partial Key), quantity, unit_price, discount_percent, total_price"),
        ("delivery_telemetry", "Weak Entity (orders)", "id (PK), order_id (FK, UK), driver_name, driver_phone, vehicle_number, current_lat, current_lng, speed_kmh, estimated_eta_minutes, status, updated_at"),
        ("delivery_partners", "Strong Entity", "id (PK), full_name, phone, email, vehicle_type, vehicle_number, status, current_lat, current_lng, speed_kmh, battery_level, rating, completed_deliveries, active_order_id (FK), shift_start, shift_end, zone"),
        ("custom_bouquets", "Strong Entity", "id (PK), user_id (FK), bouquet_name, wrapping_type, focal_flower_id (FK), focal_count, filler_flower_id (FK), filler_count, foliage_id (FK), foliage_count, arrangement_style, fragrance_type, greeting_card_text, canvas_json, total_price, created_at"),
        ("event_quotations", "Strong Entity", "id (PK), user_id (FK), company_name, event_type, event_date, guest_tier, venue_address, venue_latitude, venue_longitude, distance_km, modules_json, staged_image_url, sentiment_prompt, estimated_amount, admin_approved_amount, status, created_at"),
        ("subscriptions", "Strong Entity", "id (PK), user_id (FK), tier, monthly_price, delivery_address, delivery_frequency, status, start_date, next_delivery_date, created_at"),
        ("subscription_feedbacks", "Weak Entity (subscriptions)", "id (PK), subscription_id (FK), user_id (FK), delivery_cycle_month (Partial Key), overall_rating, freshness_rating, variety_rating, favorite_flowers, disliked_flowers, comments, created_at"),
        ("product_reviews", "Weak Entity (products)", "id (PK), product_id (FK), user_id (FK), reviewer_name, rating, review_title, review_text, photo_url, is_verified_purchase, helpful_votes, created_at"),
        ("wishlist_items", "Weak Entity (users)", "id (PK), user_id (FK), product_id (Partial Key), created_at (Unique constraint on user_id, product_id)"),
        ("occasion_reminders", "Weak Entity (users)", "id (PK), user_id (FK), recipient_name, occasion_type, occasion_date, preferred_flower_type, notes, created_at"),
        ("push_notification_tokens", "Weak Entity (users)", "id (PK), user_id (FK), token (Partial Key, UK), platform, device_info, is_active, created_at, updated_at"),
        ("coupons", "Strong Entity", "id (PK), code (UK), description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active, valid_from, valid_until, usage_limit, times_used, created_at"),
        ("system_alerts", "Strong Entity", "id (PK), alert_type, recipient_email, subject, body, status, dispatched_at")
    ]
    t_sch = doc.add_table(rows=len(tables) + 1, cols=3)
    t_sch.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_sch.rows[0].cells[0].paragraphs[0].add_run("Table Name").bold = True
    t_sch.rows[0].cells[1].paragraphs[0].add_run("Entity Category").bold = True
    t_sch.rows[0].cells[2].paragraphs[0].add_run("Attributes & Constraints").bold = True
    for c in t_sch.rows[0].cells:
        set_cell_background(c, "0F766E")
        c.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    for i, (tbl, cat, cols) in enumerate(tables):
        row = t_sch.rows[i + 1]
        row.cells[0].paragraphs[0].add_run(tbl).bold = True
        row.cells[1].paragraphs[0].add_run(cat)
        row.cells[2].paragraphs[0].add_run(cols)
        bg = "F8FAFC" if i % 2 == 1 else "FFFFFF"
        for c in row.cells:
            set_cell_background(c, bg)
            set_cell_margins(c)

    doc.add_page_break()

    # =========================================================================
    # SECTION 2.2: UML AND BEHAVIORAL DESIGN
    # =========================================================================
    doc.add_heading("2.2. UML and Behavioral Design", level=2)
    doc.add_heading("2.2.1 Use-Case Diagram and Descriptions", level=3)

    doc.add_paragraph(
        "The system identifies four primary human actors interacting across discrete behavioral boundaries:\n\n"
        "1. Retail Buyer: Browses botanical catalog, designs bespoke 7-step bouquets on HTML5 canvas, places retail orders with GST splits, and tracks refrigerated cold-chain transit on live GPS maps.\n"
        "2. Corporate Client: Submits bulk B2B procurement orders with verified GSTIN identification, accesses wholesale tiered discounting, and requests venue staging proposals.\n"
        "3. Super Administrator: Oversees FEFO biological markdown curves, governs singleton admin sessions, manages catalog stock, and inspects relational database schemas.\n"
        "4. Fleet Driver: Operates refrigerated EV delivery vans, transmitting real-time IoT/GPS telematics metrics over Socket.IO to connected client map HUDs.\n\n"
        "Key Use-Case Specifications:\n"
        "• UC-02: Design 7-Step Bespoke Bouquet (Fabric.js) — Retail buyer selects wrapping, focal stems, fillers, and foliage; engine calculates stem collisions and dynamic bundle pricing; serializes JSON canvas state for checkout.\n"
        "• UC-05: Request B2B Event Quotation with Clash Guard — Corporate client enters venue GPS coordinates; server calculates Haversine distance from Kalmane depot; checks calendar bookings to prevent double-booking; computes estimated venue budgets.\n"
        "• UC-06: Biological FEFO Price Decay Workflow — Automated daily routine updates batch status (fresh -> prime -> clearance -> flash sale) and applies dynamic markdowns based on floral vase-life decay curves."
    )

    doc.add_heading("2.2.3 Sequence Diagrams for Critical Flows", level=3)
    doc.add_paragraph(
        "Critical Flow 1: 7-Step Bouquet Customizer Checkout & GST Tax Invoice:\n"
        "1. Customer configures stems & wrapping on canvas studio (BouquetBuilder7Step.jsx).\n"
        "2. Fabric.js engine calculates layered transforms and live bundle price.\n"
        "3. Customer clicks 'Add to Cart'; client serializes canvas JSON.\n"
        "4. Customer confirms checkout; client sends POST /api/orders with address and GSTIN.\n"
        "5. Server evaluates shipping address: Intra-state applies 2.5% CGST + 2.5% SGST; Inter-state applies 5.0% IGST.\n"
        "6. Server commits ACID transaction inserting into orders and order_items, deducting batch stocks.\n"
        "7. Server returns 201 Created; client renders verified GST tax invoice modal.\n\n"
        "Critical Flow 2: Real-time Cold-chain GPS Telemetry Streaming:\n"
        "1. Customer opens LiveTrackingModal.jsx for active order #GNB-8841.\n"
        "2. Client establishes WebSocket WSS handshake over /socket.io and emits track_order.\n"
        "3. Every 1000ms, fleet EV van GPS transponder transmits current coordinates (Lat, Lng, Speed, Battery).\n"
        "4. Server updates delivery_telemetry and broadcasts telemetry_update event.\n"
        "5. Client Leaflet engine re-renders vehicle marker and redraws polyline travel route."
    )

    doc.add_heading("2.3. User Interface Design", level=2)
    doc.add_paragraph(
        "The application provides 6 primary user interface screens:\n\n"
        "1. Customer Storefront & Botanical Catalog (IndividualUserHome.jsx): Header hero banner, botanical search input, sunlight/watering filter chips, dynamic FEFO markdown badges, and stock level meters.\n"
        "2. 7-Step Bouquet Customizer Studio (BouquetBuilder7Step.jsx): Progressive workflow navigation bar, interactive Fabric.js canvas with drag/rotation transforms, and personalized gift greeting card modal.\n"
        "3. Corporate Procurement Portal (CorporateDashboard.jsx): Dedicated B2B wholesale ordering panel enforcing minimum order quantities, verified GSTIN entry, and multi-tier GST tax invoice drawer.\n"
        "4. Event Staging & Venue Simulator (EventStagingEngine.jsx): Venue specification form, Haversine road distance HUD originating from Kalmane depot, and single-event calendar clash guard.\n"
        "5. Cold-Chain Live GPS Tracking Modal (LiveTrackingModal.jsx): Interactive Leaflet GIS vector map with custom van pins, transit polylines, and real-time speed, battery, and ETA countdown metrics.\n"
        "6. Super-Admin Console & Database Inspector (AdminConsole.jsx): Perishable batch expiration table, FEFO decay override controls, raw database schema inspection, and test data reset tools."
    )

    doc.add_heading("3. References", level=1)
    refs = [
        ("[1]", "Pallets Projects. Flask Application Structure, Blueprints, and Application Factory Patterns (v3.0.x). 2024. Available: https://flask.palletsprojects.com/"),
        ("[2]", "Bayer, M. SQLAlchemy: Object Relational Tutorial and Declarative Mapping Architecture (v2.0.x). 2024. Available: https://docs.sqlalchemy.org/"),
        ("[3]", "Meta Platforms, Inc. React Core Documentation: Component Lifecycle, Hooks, and Single-Page Architecture (v18.x). 2024. Available: https://react.dev/"),
        ("[4]", "Kasyanov, J. Fabric.js: Object-Oriented HTML5 Canvas Programming and JSON Serialization. 2024. Available: http://fabricjs.com/"),
        ("[5]", "Raimondo, G. Socket.IO: Bi-directional Event-based Communication over WebSockets. 2024. Available: https://socket.io/"),
        ("[6]", "Agafonkin, V. Leaflet: Mobile-Friendly Interactive Maps and GeoJSON Projections. 2024. Available: https://leafletjs.com/"),
        ("[7]", "IEEE Computer Society. IEEE Standard for Information Technology — Systems Design — Software Design Descriptions (IEEE Std 1016-2009). IEEE, 2009."),
        ("[8]", "Central Board of Indirect Taxes and Customs (CBIC), Government of India. Goods and Services Tax (GST) Tariff Classification under HSN Chapters 0602 and 0603. New Delhi, 2023. Available: https://cbic.gov.in/"),
        ("[9]", "Sinnott, R. W. Virtues of the Haversine. Sky and Telescope, vol. 68, no. 2, p. 159, 1984.")
    ]
    t_ref = doc.add_table(rows=len(refs), cols=2)
    t_ref.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (num, text) in enumerate(refs):
        row = t_ref.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(0.6)
        c1.width = Inches(5.9)
        c0.paragraphs[0].add_run(num).bold = True
        c1.paragraphs[0].add_run(text)
        set_cell_margins(c0)
        set_cell_margins(c1)

    doc.save(output_path)
    print(f"Editable Word document successfully created at: {output_path}")

if __name__ == '__main__':
    target = '/Users/rizal/GreenNest_Bloom/docs/SOFTWARE_DESIGN_SPECIFICATION.docx'
    create_docx(target)
