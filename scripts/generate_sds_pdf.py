import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for dynamic total page counting and running headers/footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        # Cover page (page 1) has no running header/footer
        if self._pageNumber > 1:
            self.saveState()
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#475569"))

            # Running Header
            self.drawString(40, 805, "A.J. INSTITUTE OF ENGINEERING & TECHNOLOGY, MANGALURU — DEPARTMENT OF MCA")
            self.drawRightString(555, 805, "SDS (Non-ML)")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(40, 798, 555, 798)

            # Running Footer
            self.line(40, 42, 555, 42)
            self.drawString(40, 30, "GreenNest Bloom — Software Design Specification (SDS)")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(555, 30, page_text)
            self.restoreState()


def build_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    c_primary = colors.HexColor("#0f172a")     # Deep Slate
    c_brand = colors.HexColor("#0f766e")       # Deep Teal
    c_accent = colors.HexColor("#0284c7")      # Cyan Blue
    c_amber = colors.HexColor("#b45309")       # Amber
    c_text = colors.HexColor("#1e293b")        # Dark Slate
    c_muted = colors.HexColor("#64748b")       # Slate Muted
    c_bg_light = colors.HexColor("#f8fafc")    # Light Gray BG
    c_border = colors.HexColor("#e2e8f0")

    # Typography Styles
    title_univ = ParagraphStyle('UnivTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=15, leading=19, alignment=TA_CENTER, textColor=c_primary)
    sub_univ = ParagraphStyle('UnivSub', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, leading=16, alignment=TA_CENTER, textColor=c_brand)
    doc_type = ParagraphStyle('DocType', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14, leading=18, alignment=TA_CENTER, textColor=c_amber)
    project_title = ParagraphStyle('ProjTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=16, leading=22, alignment=TA_CENTER, textColor=c_primary)
    project_sub = ParagraphStyle('ProjSub', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=14, alignment=TA_CENTER, textColor=c_muted)

    h1 = ParagraphStyle('H1', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=13, leading=17, textColor=c_primary, spaceBefore=14, spaceAfter=6, keepWithNext=True)
    h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=11, leading=15, textColor=c_brand, spaceBefore=10, spaceAfter=4, keepWithNext=True)
    h3 = ParagraphStyle('H3', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=9.5, leading=13, textColor=c_primary, spaceBefore=6, spaceAfter=3, keepWithNext=True)

    body = ParagraphStyle('Body', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13, textColor=c_text, spaceAfter=5, alignment=TA_JUSTIFY)
    body_bold = ParagraphStyle('BodyBold', parent=body, fontName='Helvetica-Bold')
    body_center = ParagraphStyle('BodyCenter', parent=body, alignment=TA_CENTER)
    bullet = ParagraphStyle('Bullet', parent=body, leftIndent=15, firstLineIndent=-10, spaceAfter=3)

    code_block = ParagraphStyle('CodeBlock', parent=styles['Normal'], fontName='Courier', fontSize=7.5, leading=10, textColor=colors.HexColor("#0f172a"))
    tbl_cell = ParagraphStyle('TableCell', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11, textColor=c_text)
    tbl_cell_bold = ParagraphStyle('TableCellBold', parent=tbl_cell, fontName='Helvetica-Bold')
    tbl_header = ParagraphStyle('TableHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=11, textColor=colors.white, alignment=TA_CENTER)

    story = []

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 20))
    story.append(Paragraph("A.J. INSTITUTE OF ENGINEERING & TECHNOLOGY, MANGALURU", title_univ))
    story.append(Spacer(1, 4))
    story.append(Paragraph("DEPARTMENT OF MASTER OF COMPUTER APPLICATIONS (MCA)", sub_univ))
    story.append(Spacer(1, 4))
    story.append(Paragraph("(Affiliated to Visvesvaraya Technological University, Belagavi)", ParagraphStyle('Affil', parent=body, alignment=TA_CENTER, textColor=c_muted, fontSize=8)))
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_brand, spaceAfter=20))

    story.append(Paragraph("SOFTWARE DESIGN SPECIFICATION (SDS)", doc_type))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Applicable for Non-ML Projects</b>", ParagraphStyle('SubApp', parent=body, alignment=TA_CENTER, textColor=c_muted, fontSize=9.5)))
    story.append(Spacer(1, 25))

    story.append(Paragraph("GREEN NEST BLOOM", project_title))
    story.append(Spacer(1, 6))
    story.append(Paragraph("An Integrated B2C/B2B Floriculture Commerce, Perishable Spoilage Control, and Logistics Platform", project_sub))
    story.append(Spacer(1, 25))

    meta_data = [
        [Paragraph("<b>Candidate Name:</b>", tbl_cell_bold), Paragraph("Venisha Rizal Dsouza", tbl_cell)],
        [Paragraph("<b>University Seat No (USN):</b>", tbl_cell_bold), Paragraph("4JK25MC117", tbl_cell)],
        [Paragraph("<b>Degree & Semester:</b>", tbl_cell_bold), Paragraph("Master of Computer Applications (MCA) — Semester 3", tbl_cell)],
        [Paragraph("<b>Internal Guide:</b>", tbl_cell_bold), Paragraph("Ms. Ramya Prabhu", tbl_cell)],
        [Paragraph("<b>Academic Year:</b>", tbl_cell_bold), Paragraph("2026 – 2027", tbl_cell)],
        [Paragraph("<b>Institution:</b>", tbl_cell_bold), Paragraph("A.J. Institute of Engineering & Technology, Mangaluru", tbl_cell)],
        [Paragraph("<b>Document Identifier:</b>", tbl_cell_bold), Paragraph("AJIET-MCA-2026-SDS-GNB-01", tbl_cell)],
        [Paragraph("<b>Document Version:</b>", tbl_cell_bold), Paragraph("1.0 (Final Approved Release)", tbl_cell)],
        [Paragraph("<b>Central Nursery Depot:</b>", tbl_cell_bold), Paragraph("Kalmane, Thirthahalli, Karnataka 577432 (13.6934° N, 75.2448° E)", tbl_cell)],
        [Paragraph("<b>Technology Stack:</b>", tbl_cell_bold), Paragraph("React 18 (Vite), Fabric.js Canvas, Leaflet GIS, Flask 3.x, Flask-SocketIO, SQLite/PostgreSQL", tbl_cell)],
    ]
    t_meta = Table(meta_data, colWidths=[160, 355])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_meta)

    story.append(Spacer(1, 25))
    story.append(Paragraph("<b>Department Approval & Review Stamp</b>", ParagraphStyle('ApprH', parent=body, alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=9)))
    story.append(Spacer(1, 10))

    sign_data = [
        [Paragraph("<b>Candidate</b><br/><br/><br/>___________________<br/><b>Venisha Rizal Dsouza</b><br/>USN: 4JK25MC117", tbl_cell),
         Paragraph("<b>Internal Guide</b><br/><br/><br/>___________________<br/><b>Ms. Ramya Prabhu</b><br/>Assistant Professor", tbl_cell),
         Paragraph("<b>Head of Department</b><br/><br/><br/>___________________<br/><b>Dr. Antony P J</b><br/>Professor & HOD (MCA)", tbl_cell)]
    ]
    t_sign = Table(sign_data, colWidths=[170, 170, 175])
    t_sign.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 25),
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
    ]))
    story.append(t_sign)

    story.append(PageBreak())

    # =========================================================================
    # TABLE OF CONTENTS
    # =========================================================================
    story.append(Paragraph("Table of Contents", h1))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=10))

    toc_items = [
        ("1. System Design", "2"),
        ("    1.1. Architectural Design", "2"),
        ("        1.1.1 & 1.1.2 High-level Architecture Diagram", "2"),
        ("        1.1.3 Subsystems / Components and Responsibilities", "3"),
        ("        1.1.4 Data Flow and Component Communication", "4"),
        ("        1.1.5 Design Alternatives and Decisions", "5"),
        ("2. Detailed Design", "6"),
        ("    2.1 Database Design", "6"),
        ("        2.1.1 Conceptual ER Diagram", "6"),
        ("        2.1.2 Logical Schema and Relational Specifications", "7"),
        ("    2.2. UML and Behavioral Design", "11"),
        ("        2.2.1 Use-Case Diagram and Descriptions", "11"),
        ("        2.2.2 Class Diagram", "13"),
        ("        2.2.3 Sequence Diagrams for Critical Flows", "14"),
        ("        2.2.4 Activity Diagram", "16"),
        ("    2.3. User Interface Design", "17"),
        ("3. References", "19"),
    ]
    toc_table_data = []
    for item, pg in toc_items:
        toc_table_data.append([Paragraph(item, tbl_cell), Paragraph(f"<b>{pg}</b>", ParagraphStyle('TR', parent=tbl_cell, alignment=TA_RIGHT))])
    t_toc = Table(toc_table_data, colWidths=[465, 50])
    t_toc.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_toc)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 1: SYSTEM DESIGN
    # =========================================================================
    story.append(Paragraph("1. System Design", h1))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=8))

    story.append(Paragraph("1.1. Architectural Design", h2))
    story.append(Paragraph(
        "GreenNest Bloom is engineered following a decoupled, multi-tier <b>Client-Server Architecture</b> "
        "utilizing a <b>Single-Page Application (SPA)</b> front-end and a <b>RESTful Micro-Modular Backend</b> "
        "with real-time <b>WebSocket Event Duplexing</b>. The system cleanly separates presentation, business logic, "
        "and relational persistence across three well-defined tiers:", body
    ))
    story.append(Paragraph("<b>1. Presentation Tier (Client Layer):</b> Single-page application built on React 18, Vite, Fabric.js (HTML5 Canvas 2D engine), Leaflet GIS mapping, and Socket.IO client.", bullet))
    story.append(Paragraph("<b>2. Application Logic Tier (Server Layer):</b> Python Flask 3.x WSGI service partitioned into Flask Blueprints, executing business logic engines (First-Expired, First-Out decay curves, Haversine geospatial calculations, GST taxation partitioning, and Singleton Admin session governance).", bullet))
    story.append(Paragraph("<b>3. Data Tier (Persistence Layer):</b> Relational persistence managed through SQLAlchemy ORM, enforcing strict ACID transactions, foreign key constraints, and relational integrity.", bullet))

    story.append(Spacer(1, 8))
    story.append(Paragraph("1.1.1 & 1.1.2 High-level Architecture Diagram", h2))

    img_arch = "/Users/rizal/GreenNest_Bloom/docs/GreenNest_Bloom_Academic_Architecture.png"
    if os.path.exists(img_arch):
        story.append(Spacer(1, 4))
        story.append(RLImage(img_arch, width=7.0*inch, height=5.2*inch))
        story.append(Spacer(1, 4))
        story.append(Paragraph("<b>Figure 1.1:</b> Green Nest Bloom High-Level Multi-Tier Architecture Diagram", ParagraphStyle('FigCap', parent=body, alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=8, textColor=c_muted)))
        story.append(Spacer(1, 10))

    arch_box = [
        [Paragraph(
            "<b>PRESENTATION TIER (Browser / PWA)</b><br/>"
            "React 18 SPA (Vite) | Fabric.js Canvas Studio | Leaflet GIS Mapping | Socket.IO Client<br/>"
            "<i>(Storefront, 7-Step Customizer, Corporate Portal, Venue Staging Simulator, Live Fleet HUD, Admin Console)</i>", tbl_cell)],
        [Paragraph("<b>&darr; &uarr; Synchronous HTTP REST API (/api/*) &nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp; &darr; &uarr; Bi-directional WebSocket WSS Channel (/socket.io)</b>", ParagraphStyle('NetMid', parent=tbl_cell, alignment=TA_CENTER, fontName='Helvetica-Bold', textColor=c_brand))],
        [Paragraph(
            "<b>APPLICATION LOGIC TIER (Python Flask 3.x Micro-Modular Server - Port 5001)</b><br/>"
            "&bull; <b>Authentication Subsystem:</b> PBKDF2/SHA-256 Hashing &amp; Singleton Super-Admin Guard<br/>"
            "&bull; <b>FEFO Biological Decay Engine:</b> Mathematical Markdown Depreciation Curves (Fresh &rarr; Prime &rarr; Clearance &rarr; Flash Sale)<br/>"
            "&bull; <b>Commerce &amp; Billing Engine:</b> Multi-tier Indian GST Split (Intra-state: 2.5% CGST + 2.5% SGST; Inter-state: 5% IGST)<br/>"
            "&bull; <b>Geospatial Logistics Subsystem:</b> Haversine Formula (Origin: Kalmane, Thirthahalli 13.6934° N, 75.2448° E)<br/>"
            "&bull; <b>B2B Event Guard:</b> Single-Event-per-Day Clash Guard &amp; Venue Decorative Budget Estimator<br/>"
            "&bull; <b>Live Telemetry Broker:</b> Background Socket.IO GPS Coordinate Broadcaster for Cold-Chain Fleet", tbl_cell)],
        [Paragraph("<b>&darr; &uarr; SQLAlchemy Object-Relational Mapping (Data Access Layer - ACID Transactions)</b>", ParagraphStyle('DbMid', parent=tbl_cell, alignment=TA_CENTER, fontName='Helvetica-Bold', textColor=c_brand))],
        [Paragraph(
            "<b>DATA TIER (Relational Database &amp; Botanical Datasets)</b><br/>"
            "Relational Database Engine (SQLite / PostgreSQL) &mdash; 18 Relational Tables (ACID Integrity)<br/>"
            "Integrated Datasets: <i>botanical_species_and_care.csv</i>, <i>emotion_floriography_classification.csv</i>, <i>historical_daily_sales_730days.csv</i>", tbl_cell)]
    ]
    t_arch = Table(arch_box, colWidths=[515])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_bg_light),
        ('BACKGROUND', (0,2), (-1,2), c_bg_light),
        ('BACKGROUND', (0,4), (-1,4), c_bg_light),
        ('BOX', (0,0), (-1,-1), 1, c_brand),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_arch)

    story.append(Spacer(1, 10))
    story.append(Paragraph("1.1.3 Subsystems / Components and Responsibilities", h2))

    subsys_data = [
        [Paragraph("Subsystem", tbl_header), Paragraph("Component File", tbl_header), Paragraph("Core Responsibilities", tbl_header)],
        [Paragraph("<b>Storefront & Catalog</b>", tbl_cell), Paragraph("IndividualUserHome.jsx<br/>CatalogSection.jsx", tbl_cell), Paragraph("Botanical search, sunlight/watering filter chips, stock levels, floriography care guides, and cart mutations.", tbl_cell)],
        [Paragraph("<b>2D Customizer Studio</b>", tbl_cell), Paragraph("BouquetBuilder7Step.jsx<br/>(Fabric.js Engine)", tbl_cell), Paragraph("7-Step HTML5 canvas customization (wrappers, focal flowers, fillers, foliage, arrangement, scent mist, card inscription) and serialized JSON export.", tbl_cell)],
        [Paragraph("<b>B2B Wholesale Portal</b>", tbl_cell), Paragraph("CorporateDashboard.jsx", tbl_cell), Paragraph("Corporate wholesale procurement, Minimum Order Quantity (MOQ) validation, verified GSTIN entry, and bulk discounted billing.", tbl_cell)],
        [Paragraph("<b>Venue Staging Simulator</b>", tbl_cell), Paragraph("EventStagingEngine.jsx", tbl_cell), Paragraph("Captures venue coordinates, evaluates Haversine delivery distance from Kalmane hub, renders decor modules, and checks Single-Event Clash Guard.", tbl_cell)],
        [Paragraph("<b>Cold-Chain Live GPS</b>", tbl_cell), Paragraph("LiveTrackingModal.jsx<br/>(Leaflet GIS Engine)", tbl_cell), Paragraph("Real-time Leaflet map rendering of refrigerated EV van coordinates, telemetry HUD metrics (speed, battery, temperature), and animated route polylines.", tbl_cell)],
        [Paragraph("<b>Super-Admin Console</b>", tbl_cell), Paragraph("AdminConsole.jsx<br/>DatabaseInspectorView.jsx", tbl_cell), Paragraph("FEFO decay overrides, singleton session inspection, table row mutations, and live database schema resets.", tbl_cell)],
        [Paragraph("<b>Auth & Session Guard</b>", tbl_cell), Paragraph("auth_routes.py<br/>AdminSession Model", tbl_cell), Paragraph("PBKDF2/SHA-256 password hashing and Singleton Super-Admin governance by terminating previous tokens upon concurrent login.", tbl_cell)],
        [Paragraph("<b>FEFO Decay Engine</b>", tbl_cell), Paragraph("batch_routes.py<br/>PerishableBatch Model", tbl_cell), Paragraph("First-Expired, First-Out harvest tracking and dynamic pricing markdowns (Day 0-2: 0%, Day 3: 20%, Day 4: 45%, Day 5+: 75% flash sale).", tbl_cell)],
        [Paragraph("<b>Commerce & GST Engine</b>", tbl_cell), Paragraph("order_routes.py<br/>Order / OrderItem Models", tbl_cell), Paragraph("Order subtotal computation, coupon validation, stock reduction, and statutory GST splits (Intra-state: 2.5% CGST + 2.5% SGST; Inter-state: 5% IGST).", tbl_cell)],
        [Paragraph("<b>Geospatial Logistics</b>", tbl_cell), Paragraph("quote_routes.py", tbl_cell), Paragraph("Executes Haversine spherical distance formula from central hub at Kalmane, Thirthahalli (13.6934 N, 75.2448 E), capping deliveries at 2,500 km.", tbl_cell)],
        [Paragraph("<b>WebSocket Telemetry</b>", tbl_cell), Paragraph("telemetry_routes.py<br/>app.py (Flask-SocketIO)", tbl_cell), Paragraph("Bi-directional Socket.IO broker streaming simulated real-time EV courier GPS coordinates to active client map modals at 1000ms intervals.", tbl_cell)]
    ]
    t_subsys = Table(subsys_data, colWidths=[105, 110, 300])
    t_subsys.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_subsys)

    story.append(Spacer(1, 10))
    story.append(Paragraph("1.1.4 Data Flow and Component Communication", h2))
    story.append(Paragraph(
        "Communication between the presentation and application tiers utilizes two protocol patterns:", body
    ))
    story.append(Paragraph(
        "<b>1. Synchronous RESTful HTTP/JSON (Axios):</b> Standard transactional requests for user authentication, "
        "catalog queries, cart operations, quotation submissions, and database administration. Every endpoint utilizes "
        "structured JSON payloads, Bearer token authorization, and standardized HTTP response codes (200, 201, 400, 401, 404).", bullet
    ))
    story.append(Paragraph(
        "<b>2. Asynchronous Bi-directional WebSockets (Flask-SocketIO):</b> Dedicated full-duplex communication channel "
        "for cold-chain logistics telemetry. When a client opens the tracking modal, a socket handshake is established over "
        "<code>/socket.io</code>. The client emits <code>track_order</code>, and the server broadcasts real-time GPS coordinate packets "
        "every 1000ms without HTTP polling overhead.", bullet
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("1.1.5 Design Alternatives and Decisions", h2))

    alt_data = [
        [Paragraph("Decision Area", tbl_header), Paragraph("Selected Architecture", tbl_header), Paragraph("Evaluated Alternative", tbl_header), Paragraph("Technical Trade-off &amp; Rationale", tbl_header)],
        [Paragraph("<b>Backend Engine</b>", tbl_cell), Paragraph("Flask 3.x (Python)", tbl_cell), Paragraph("Django 5.x", tbl_cell), Paragraph("Flask provides a lightweight, modular blueprint design without monolithic admin overhead, seamlessly binding with Flask-SocketIO.", tbl_cell)],
        [Paragraph("<b>Customizer Studio</b>", tbl_cell), Paragraph("Fabric.js HTML5 Canvas", tbl_cell), Paragraph("Three.js / WebGL", tbl_cell), Paragraph("Fabric.js provides object-level manipulation, selection transforms, layer ordering, and JSON serialization with lower client memory overhead.", tbl_cell)],
        [Paragraph("<b>Persistence Layer</b>", tbl_cell), Paragraph("SQLAlchemy (Relational)", tbl_cell), Paragraph("MongoDB (NoSQL)", tbl_cell), Paragraph("Financial accounting, statutory GST splits, and inventory batches demand strict ACID transactional guarantees and foreign key constraints.", tbl_cell)],
        [Paragraph("<b>Live Telemetry</b>", tbl_cell), Paragraph("WebSockets (Socket.IO)", tbl_cell), Paragraph("HTTP Long-Polling", tbl_cell), Paragraph("WebSockets eliminate repetitive HTTP header transmission, drastically reducing network overhead and transport latency.", tbl_cell)],
        [Paragraph("<b>Frontend Framework</b>", tbl_cell), Paragraph("React 18 SPA (Vite)", tbl_cell), Paragraph("Server-Rendered Jinja2", tbl_cell), Paragraph("The 7-step canvas studio, live Leaflet map HUD, and dynamic cart calculation require instant client-side state responsiveness without full page reloads.", tbl_cell)]
    ]
    t_alt = Table(alt_data, colWidths=[85, 95, 90, 245])
    t_alt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_brand),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_alt)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 2: DETAILED DESIGN
    # =========================================================================
    story.append(Paragraph("2. Detailed Design", h1))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=8))

    story.append(Paragraph("2.1 Database Design", h2))
    story.append(Paragraph("2.1.1 Conceptual ER Diagram", h3))
    story.append(Paragraph(
        "The conceptual database architecture strictly implements <b>Peter Chen Entity-Relationship Criteria</b>, "
        "differentiating between <b>Strong Entities</b> (standalone life-cycle with independent primary keys) and "
        "<b>Weak Entities</b> (existence-dependent child records relying on identifying relationships and partial keys):", body
    ))
    story.append(Paragraph("<b>Strong Entities (Single Rectangle [ ]):</b> USER, PRODUCT, ORDER, SUBSCRIPTION, EVENT_QUOTATION, CUSTOM_BOUQUET, DELIVERY_PARTNER, COUPON, SYSTEM_ALERT.", bullet))
    story.append(Paragraph("<b>Weak Entities (Double Rectangle [[ ]]):</b> ADMIN_SESSION, PUSH_NOTIFICATION_TOKEN, WISHLIST_ITEM, OCCASION_REMINDER, PERISHABLE_BATCH, PRODUCT_REVIEW, ORDER_ITEM, DELIVERY_TELEMETRY, SUBSCRIPTION_FEEDBACK.", bullet))
    story.append(Paragraph("<b>Identifying Relationships (Double Rhombus {{ }}):</b> Admin Sessions, Registers, Saves, Schedules, Tracks Batches, Reviews, Contains, Streamed By GPS, Evaluates.", bullet))
    story.append(Paragraph("<b>Regular Relationships (Single Rhombus { }):</b> Places, Designs, Supplies Stems, Subscribes, Requests, Authors, Assigned To, References, Allocates.", bullet))
    story.append(Paragraph("<b>Attribute Notation in Ovals (( )):</b> Primary Keys underlined with solid line (<u>id</u>); Weak Entity Partial Keys with dashed underline (- - key - -); Foreign Keys labeled (FK); Unique keys labeled (UK).", bullet))

    story.append(Spacer(1, 6))
    erd_summary_box = [
        [Paragraph(
            "<b>NATIVE MULTI-TAB DRAW.IO ARTIFACT REFERENCE:</b><br/>"
            "The full pixel-perfect, editable Peter Chen ER Diagram featuring all 18 entities and 200 attribute ovals "
            "is generated and persisted directly in the workspace at:<br/>"
            "<code>/Users/rizal/GreenNest_Bloom/GreenNest_Bloom_ERD.drawio</code> (138 KB)<br/>"
            "Organized across 3 clean, dedicated tabs: <i>1. Master ERD (All Attributes)</i>, <i>2. User &amp; Access Detail</i>, <i>3. Orders &amp; Fleet Detail</i>.", tbl_cell)]
    ]
    t_erd_box = Table(erd_summary_box, colWidths=[515])
    t_erd_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 1, c_amber),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_erd_box)

    story.append(Spacer(1, 10))
    story.append(Paragraph("2.1.2 Logical Schema and Relational Specifications", h3))
    story.append(Paragraph(
        "The relational schema contains 18 tables defined via SQLAlchemy ORM with complete primary keys, foreign keys, "
        "unique constraints, and cascade delete rules:", body
    ))

    # Relational Tables Detailed Breakdown
    schema_definitions = [
        ("Table 1: users (Strong Entity)", "Stores individual buyers, verified B2B corporate accounts, and system administrators.", [
            ("id", "INTEGER", "PK, Auto Increment", "Unique system identifier"),
            ("email", "VARCHAR(120)", "Unique, Not Null, Index", "Account email address"),
            ("password_hash", "VARCHAR(255)", "Not Null", "PBKDF2/SHA-256 salted password hash"),
            ("full_name", "VARCHAR(100)", "Not Null", "Customer or contact person full name"),
            ("company_name", "VARCHAR(120)", "Nullable", "Registered corporate business entity name"),
            ("gstin", "VARCHAR(15)", "Nullable", "Goods & Services Tax ID for verified B2B tax credit"),
            ("user_type", "VARCHAR(20)", "Not Null, Default: 'individual'", "Enum: individual, corporate, admin"),
            ("phone", "VARCHAR(20)", "Nullable", "Primary phone contact"),
            ("address", "TEXT", "Nullable", "Default shipping address"),
            ("created_at", "DATETIME", "Default: datetime.utcnow", "Account registration timestamp")
        ]),
        ("Table 2: admin_sessions (Weak Entity - Owner: users)", "Governs Singleton Super-Admin access by invalidating concurrent logins.", [
            ("id", "INTEGER", "PK, Auto Increment", "Session primary key"),
            ("admin_id", "INTEGER", "FK references users(id), Not Null", "Target administrator identifier"),
            ("session_token", "VARCHAR(255)", "Unique, Not Null (Partial Key)", "Active cryptographic session token"),
            ("ip_address", "VARCHAR(45)", "Nullable", "Client IPv4 / IPv6 address"),
            ("user_agent", "TEXT", "Nullable", "Browser / device user agent string"),
            ("is_active", "BOOLEAN", "Default: True", "Flag indicating whether session is active"),
            ("last_active", "DATETIME", "Default: datetime.utcnow", "Heartbeat timestamp for session expiry")
        ]),
        ("Table 3: products (Strong Entity)", "Master catalog for cut flowers, potted plants, ceramic planters, and accessories.", [
            ("id", "INTEGER", "PK, Auto Increment", "Product master key"),
            ("name", "VARCHAR(120)", "Not Null", "Commercial botanical title"),
            ("category", "VARCHAR(50)", "Not Null", "Enum: cut_flower, potted_plant, planter, accessory"),
            ("is_perishable", "BOOLEAN", "Default: False", "Flag indicating biological decay vulnerability"),
            ("base_price", "FLOAT", "Not Null", "Retail price in Indian Rupees (INR)"),
            ("b2b_min_quantity", "INTEGER", "Default: 1", "Minimum Order Quantity (MOQ) for wholesale"),
            ("b2b_discount_percent", "FLOAT", "Default: 0.0", "Wholesale volume discount rate"),
            ("hsn_code", "VARCHAR(10)", "Default: '0603'", "Statutory HSN code (0603 flowers, 0602 live plants)"),
            ("botanical_name", "VARCHAR(120)", "Nullable", "Latin binomial taxonomic nomenclature"),
            ("sunlight_requirement", "VARCHAR(50)", "Nullable", "Sunlight care tier (Direct, Bright Indirect, Low)"),
            ("watering_frequency", "VARCHAR(50)", "Nullable", "Watering cycle requirement"),
            ("vase_life_days", "INTEGER", "Default: 5", "Maximum fresh vase life expectancy in days"),
            ("floriography_meaning", "TEXT", "Nullable", "Historical Victorian flower sentiment/symbolism"),
            ("image_url", "TEXT", "Nullable", "High-resolution botanical photograph asset URI"),
            ("stock_quantity", "INTEGER", "Default: 0", "Current available warehouse unit stock")
        ]),
        ("Table 4: perishable_batches (Weak Entity - Owner: products)", "First-Expired, First-Out (FEFO) batch tracking and dynamic markdown depreciation.", [
            ("id", "INTEGER", "PK, Auto Increment", "Batch unique key"),
            ("product_id", "INTEGER", "FK references products(id), Not Null", "Parent product identifier"),
            ("batch_code", "VARCHAR(50)", "Unique, Not Null (Partial Key)", "Warehouse lot barcode identifier"),
            ("harvest_date", "DATE", "Not Null", "Greenhouse harvest / arrival timestamp"),
            ("initial_quantity", "INTEGER", "Not Null", "Initial harvested intake quantity"),
            ("remaining_quantity", "INTEGER", "Not Null", "Current unallocated remaining stems"),
            ("current_age_days", "INTEGER", "Default: 0", "Elapsed days since harvest date"),
            ("vase_life_days", "INTEGER", "Default: 5", "Expected biological freshness window"),
            ("discount_percent", "FLOAT", "Default: 0.0", "Dynamic markdown discount rate"),
            ("status", "VARCHAR(20)", "Default: 'fresh'", "Enum: fresh, prime, clearance, expired")
        ]),
        ("Table 5: orders (Strong Entity)", "Master transaction records across retail B2C, wholesale B2B, bouquets, and events.", [
            ("id", "INTEGER", "PK, Auto Increment", "Order primary key"),
            ("user_id", "INTEGER", "FK references users(id), Not Null", "Purchasing account identifier"),
            ("order_number", "VARCHAR(50)", "Unique, Not Null, Index", "Unique human-readable invoice code (e.g., GNB-8841)"),
            ("order_type", "VARCHAR(20)", "Not Null", "Enum: b2c_retail, b2b_wholesale, custom_bouquet, event_booking"),
            ("subtotal", "FLOAT", "Not Null", "Pre-tax order line items subtotal"),
            ("tax_cgst", "FLOAT", "Default: 0.0", "Central GST 2.5% (Intra-state supply)"),
            ("tax_sgst", "FLOAT", "Default: 0.0", "State GST 2.5% (Intra-state supply)"),
            ("tax_igst", "FLOAT", "Default: 0.0", "Integrated GST 5.0% (Inter-state supply)"),
            ("total_amount", "FLOAT", "Not Null", "Final invoice amount including statutory tax"),
            ("payment_method", "VARCHAR(50)", "Default: 'razorpay_test'", "Payment gateway or method code"),
            ("payment_status", "VARCHAR(20)", "Default: 'paid'", "Enum: pending, paid, failed, refunded"),
            ("order_status", "VARCHAR(20)", "Default: 'processing'", "Enum: processing, dispatched, in_transit, delivered"),
            ("shipping_address", "TEXT", "Not Null", "Consignee delivery destination"),
            ("created_at", "DATETIME", "Default: datetime.utcnow", "Order placement timestamp")
        ]),
        ("Table 6: order_items (Weak Entity - Owner: orders)", "Line-item allocation referencing master products and FEFO harvested batches.", [
            ("id", "INTEGER", "PK, Auto Increment", "Order line item primary key"),
            ("order_id", "INTEGER", "FK references orders(id), Cascade Delete", "Parent order identifier"),
            ("product_id", "INTEGER", "FK references products(id), Nullable", "Referenced product master record"),
            ("batch_id", "INTEGER", "FK references perishable_batches(id), Nullable", "Allocated perishable inventory lot"),
            ("item_name", "VARCHAR(120)", "Not Null (Partial Key)", "Descriptive item line title"),
            ("quantity", "INTEGER", "Not Null", "Purchased unit count"),
            ("unit_price", "FLOAT", "Not Null", "Unit base sale price"),
            ("discount_percent", "FLOAT", "Default: 0.0", "Discount percentage applied"),
            ("total_price", "FLOAT", "Not Null", "Extended total line amount")
        ]),
        ("Table 7: delivery_telemetry (Weak Entity - Owner: orders)", "Real-time IoT/GPS telematics stream for dispatched cold-chain vehicles.", [
            ("id", "INTEGER", "PK, Auto Increment", "Telemetry unique key"),
            ("order_id", "INTEGER", "FK references orders(id), Unique, Not Null", "Monitored active order identifier"),
            ("driver_name", "VARCHAR(100)", "Default: 'Ramesh Kumar'", "Courier driver in transit"),
            ("driver_phone", "VARCHAR(20)", "Default: '+91-9876543210'", "Driver active contact number"),
            ("vehicle_number", "VARCHAR(20)", "Default: 'KA-19-FL-4402'", "Fleet refrigerated van registration code"),
            ("current_lat", "FLOAT", "Not Null", "Current WGS84 GPS latitude"),
            ("current_lng", "FLOAT", "Not Null", "Current WGS84 GPS longitude"),
            ("speed_kmh", "FLOAT", "Default: 34.5", "Current transit velocity in km/h"),
            ("estimated_eta_minutes", "INTEGER", "Default: 22", "Dynamic route arrival estimate in minutes"),
            ("status", "VARCHAR(30)", "Default: 'en_route'", "Enum: dispatched, en_route, delayed, delivered"),
            ("updated_at", "DATETIME", "Default: datetime.utcnow", "Last GPS ping timestamp")
        ]),
        ("Table 8: delivery_partners (Strong Entity)", "Fleet courier personnel operating refrigerated EV delivery vans.", [
            ("id", "INTEGER", "PK, Auto Increment", "Partner primary key"),
            ("full_name", "VARCHAR(100)", "Not Null", "Courier personnel full name"),
            ("phone", "VARCHAR(20)", "Not Null", "Primary contact mobile number"),
            ("email", "VARCHAR(120)", "Nullable", "Courier email account"),
            ("vehicle_type", "VARCHAR(60)", "Default: 'Refrigerated EV Van'", "Cold-chain transport vehicle type"),
            ("vehicle_number", "VARCHAR(30)", "Not Null", "Government vehicle registration code"),
            ("status", "VARCHAR(30)", "Default: 'available'", "Enum: available, en_route, on_break, offline"),
            ("current_lat", "FLOAT", "Not Null", "Courier idle/active latitude"),
            ("current_lng", "FLOAT", "Not Null", "Courier idle/active longitude"),
            ("speed_kmh", "FLOAT", "Default: 0.0", "Current travel speed"),
            ("battery_level", "INTEGER", "Default: 90", "EV van battery charge percentage (0-100%)"),
            ("rating", "FLOAT", "Default: 4.9", "Customer satisfaction star rating"),
            ("completed_deliveries", "INTEGER", "Default: 0", "Lifetime successful delivery counter"),
            ("active_order_id", "INTEGER", "FK references orders(id), Nullable", "Currently assigned order identifier"),
            ("shift_start", "VARCHAR(20)", "Default: '08:00 AM'", "Assigned shift start time"),
            ("shift_end", "VARCHAR(20)", "Default: '05:00 PM'", "Assigned shift end time"),
            ("zone", "VARCHAR(80)", "Default: 'Bengaluru Central Corridor'", "Operational delivery territory")
        ]),
        ("Table 9: custom_bouquets (Strong Entity)", "Custom studio creations serialized from Fabric.js canvas states.", [
            ("id", "INTEGER", "PK, Auto Increment", "Custom bouquet primary key"),
            ("user_id", "INTEGER", "FK references users(id), Not Null", "Creator account identifier"),
            ("bouquet_name", "VARCHAR(100)", "Default: 'Bespoke Creation'", "User assigned design title"),
            ("wrapping_type", "VARCHAR(50)", "Default: 'kraft_paper'", "Outer wrapping style selected"),
            ("focal_flower_id", "INTEGER", "FK references products(id), Nullable", "Primary focal flower stem"),
            ("focal_count", "INTEGER", "Default: 5", "Quantity of focal flowers"),
            ("filler_flower_id", "INTEGER", "FK references products(id), Nullable", "Filler flower stem"),
            ("filler_count", "INTEGER", "Default: 3", "Quantity of filler stems"),
            ("foliage_id", "INTEGER", "FK references products(id), Nullable", "Foliage greenery stem"),
            ("foliage_count", "INTEGER", "Default: 2", "Quantity of foliage stems"),
            ("arrangement_style", "VARCHAR(50)", "Default: 'dome_round'", "Structural arrangement aesthetic"),
            ("fragrance_type", "VARCHAR(50)", "Default: 'rose_petal_mist'", "Infused scent mist formula"),
            ("greeting_card_text", "TEXT", "Nullable", "Custom gift card inscription message"),
            ("canvas_json", "TEXT", "Nullable", "Serialized Fabric.js canvas state"),
            ("total_price", "FLOAT", "Not Null", "Dynamically calculated bundle cost in INR")
        ]),
        ("Table 10: event_quotations (Strong Entity)", "B2B event inquiries evaluated against Kalmane depot coordinates.", [
            ("id", "INTEGER", "PK, Auto Increment", "Quotation unique key"),
            ("user_id", "INTEGER", "FK references users(id), Not Null", "Inquiring corporate client"),
            ("company_name", "VARCHAR(120)", "Nullable", "Corporate entity organization title"),
            ("event_type", "VARCHAR(50)", "Not Null", "Enum: wedding, gala, corporate_banquet, anniversary"),
            ("event_date", "DATE", "Not Null", "Target event calendar date (Clash Guard checked)"),
            ("guest_tier", "VARCHAR(50)", "Not Null", "Enum: intimate_50, medium_200, grand_500"),
            ("venue_address", "TEXT", "Not Null", "Venue destination location address"),
            ("venue_latitude", "FLOAT", "Nullable", "Venue destination GPS latitude"),
            ("venue_longitude", "FLOAT", "Nullable", "Venue destination GPS longitude"),
            ("distance_km", "FLOAT", "Nullable", "Haversine distance from Kalmane central hub"),
            ("modules_json", "TEXT", "Nullable", "Selected decor modules (Arch, Centerpiece, Aisle)"),
            ("staged_image_url", "TEXT", "Nullable", "Inpainted visual venue simulation asset URI"),
            ("sentiment_prompt", "TEXT", "Nullable", "Floriography theme / emotional prompt"),
            ("estimated_amount", "FLOAT", "Not Null", "Automated budgetary estimate in INR"),
            ("admin_approved_amount", "FLOAT", "Nullable", "Final contracted administrative price"),
            ("status", "VARCHAR(30)", "Default: 'pending'", "Enum: pending, approved, declined, booked")
        ]),
        ("Table 11: subscriptions & Table 12: subscription_feedbacks", "Recurring surprise flower boxes and subscriber satisfaction metrics.", [
            ("subscriptions.id", "INTEGER", "PK, Auto Increment", "Subscription contract key"),
            ("subscriptions.user_id", "INTEGER", "FK references users(id)", "Subscriber identifier"),
            ("subscriptions.tier", "VARCHAR(20)", "Not Null", "Tier: basic (999), premium (1899), luxury (2999)"),
            ("subscriptions.monthly_price", "FLOAT", "Not Null", "Monthly recurring billing charge"),
            ("subscription_feedbacks.id", "INTEGER", "PK, Auto Increment", "Feedback unique key"),
            ("subscription_feedbacks.subscription_id", "INTEGER", "FK references subscriptions(id)", "Associated subscription contract"),
            ("subscription_feedbacks.overall_rating", "INTEGER", "Not Null", "Overall rating (1 to 5 stars)"),
            ("subscription_feedbacks.freshness_rating", "INTEGER", "Not Null", "Stem freshness evaluation (1 to 5 stars)"),
            ("subscription_feedbacks.favorite_flowers", "TEXT", "Nullable", "Favorite flower varieties preferred")
        ]),
        ("Peripheral Tables (Reviews, Reminders, Tokens, Coupons, Alerts)", "Engagement, marketing discounts, and audit logging.", [
            ("product_reviews.id", "INTEGER", "PK, Auto Increment", "Product review identifier"),
            ("product_reviews.product_id", "INTEGER", "FK references products(id)", "Target botanical catalog item"),
            ("wishlist_items.id", "INTEGER", "PK, Auto Increment", "User saved wishlist item (Unique: user_id, product_id)"),
            ("occasion_reminders.id", "INTEGER", "PK, Auto Increment", "Personal annual floral reminder event"),
            ("push_notification_tokens.id", "INTEGER", "PK, Auto Increment", "Web/iOS hardware push notification token"),
            ("coupons.id", "INTEGER", "PK, Auto Increment", "Marketing discount voucher code (Unique: code)"),
            ("coupons.discount_value", "FLOAT", "Not Null", "Percentage or flat Rupee deduction"),
            ("system_alerts.id", "INTEGER", "PK, Auto Increment", "Transactional audit notification trail log")
        ])
    ]

    for title, desc, cols in schema_definitions:
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<b>{title}</b>", ParagraphStyle('TblTitle', parent=body, fontName='Helvetica-Bold', textColor=c_primary)))
        story.append(Paragraph(desc, ParagraphStyle('TblDesc', parent=body, textColor=c_muted, fontSize=8)))

        rows = [[Paragraph("Column Name", tbl_header), Paragraph("Data Type", tbl_header), Paragraph("Constraints &amp; Default", tbl_header), Paragraph("Description", tbl_header)]]
        for col_name, col_type, col_const, col_desc in cols:
            rows.append([Paragraph(f"<b>{col_name}</b>", tbl_cell), Paragraph(col_type, tbl_cell), Paragraph(col_const, tbl_cell), Paragraph(col_desc, tbl_cell)])

        t_table = Table(rows, colWidths=[120, 85, 150, 160])
        t_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_primary),
            ('BOX', (0,0), (-1,-1), 0.5, c_border),
            ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        story.append(t_table)
        story.append(Spacer(1, 6))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 2.2: UML AND BEHAVIORAL DESIGN
    # =========================================================================
    story.append(Paragraph("2.2. UML and Behavioral Design", h2))
    story.append(Paragraph("2.2.1 Use-Case Diagram and Descriptions", h3))
    story.append(Paragraph(
        "The system identifies four primary human actors interacting across discrete behavioral boundaries:", body
    ))
    story.append(Paragraph("<b>1. Retail Buyer:</b> Browses botanical care catalog, designs bespoke 7-step bouquets on HTML5 canvas, places retail orders with GST splits, and tracks refrigerated cold-chain transit on live GPS maps.", bullet))
    story.append(Paragraph("<b>2. Corporate Client:</b> Submits bulk B2B procurement orders with verified GSTIN identification, accesses wholesale tiered discounting, and requests venue staging proposals.", bullet))
    story.append(Paragraph("<b>3. Super Administrator:</b> Oversees FEFO biological markdown curves, governs singleton admin sessions, manages catalog stock, and inspects relational database schemas.", bullet))
    story.append(Paragraph("<b>4. Fleet Driver:</b> Operates refrigerated EV delivery vans, transmitting real-time IoT/GPS telematics metrics over Socket.IO to connected client map HUDs.", bullet))

    story.append(Spacer(1, 6))

    # Detailed Use Case Specs
    uc_specs = [
        ("UC-02: Design 7-Step Bespoke Bouquet (Fabric.js)", "Retail Buyer",
         "User is browsing the storefront; floral stems and wrapping stocks are available in database.",
         "1. User navigates to the Bouquet Customizer Studio view.<br/>"
         "2. Step 1: User selects wrapping material (Kraft paper, Jute wrap, Frosted matte, Satin box).<br/>"
         "3. Steps 2-4: User selects focal flowers (Roses, Lilies, Orchids), filler stems (Baby's Breath), and foliage (Eucalyptus, Ruscus).<br/>"
         "4. Fabric.js engine calculates layered transforms, stem collision bounds, and dynamic bundle cost.<br/>"
         "5. Steps 5-7: User chooses arrangement styling (Dome, Cascading, Minimalist), scent mist formula, and enters greeting card text.<br/>"
         "6. User submits design; client packages serialized canvas JSON state with stem counts and appends to shopping cart.",
         "Custom bouquet record is persisted with serialized JSON and added to active checkout session."),

        ("UC-05: Request B2B Event Quotation with Clash Guard", "Corporate Client / Event Planner",
         "Client is authenticated with verified GSTIN identification for corporate procurement.",
         "1. Client accesses Event Staging Portal and enters event date, venue address, guest count tier, and decor theme.<br/>"
         "2. Client provides venue destination GPS coordinates (Latitude &amp; Longitude).<br/>"
         "3. Server executes <b>Haversine spherical distance formula</b> from central depot at Kalmane, Thirthahalli (13.6934 N, 75.2448 E) to determine transit distance and calculate logistics surcharges.<br/>"
         "4. System queries <code>event_quotations</code> to evaluate <b>Single-Event-per-Day Clash Guard</b>. If a booking exists on that calendar date, the date is locked and a conflict notification is returned.<br/>"
         "5. If available, quotation is registered with estimated budgetary breakdown.",
         "Event quotation is stored with 'pending' status awaiting administrative review.")
    ]

    for uc_title, uc_actor, uc_pre, uc_flow, uc_post in uc_specs:
        story.append(Spacer(1, 4))
        uc_rows = [
            [Paragraph(f"<b>Use-Case: {uc_title}</b>", tbl_header), Paragraph("", tbl_header)],
            [Paragraph("<b>Primary Actor</b>", tbl_cell_bold), Paragraph(uc_actor, tbl_cell)],
            [Paragraph("<b>Pre-Conditions</b>", tbl_cell_bold), Paragraph(uc_pre, tbl_cell)],
            [Paragraph("<b>Main Success Flow</b>", tbl_cell_bold), Paragraph(uc_flow, tbl_cell)],
            [Paragraph("<b>Post-Conditions</b>", tbl_cell_bold), Paragraph(uc_post, tbl_cell)]
        ]
        t_uc = Table(uc_rows, colWidths=[130, 385])
        t_uc.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_brand),
            ('SPAN', (0,0), (-1,0)),
            ('BOX', (0,0), (-1,-1), 1, c_border),
            ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('BACKGROUND', (0,1), (0,-1), c_bg_light),
        ]))
        story.append(t_uc)

    story.append(Spacer(1, 10))
    story.append(Paragraph("2.2.2 Class Diagram", h3))
    story.append(Paragraph(
        "The class structure reflects the underlying SQLAlchemy declarative models encapsulating entity properties, "
        "relational mapping cardinalities, and domain calculation methods:", body
    ))

    class_desc = [
        ("User", "id, email, password_hash, full_name, company_name, gstin, user_type", "set_password(pwd), check_password(pwd), to_dict()"),
        ("Product", "id, name, category, is_perishable, base_price, hsn_code, vase_life_days, stock_quantity", "to_dict()"),
        ("PerishableBatch", "id, product_id, batch_code, harvest_date, remaining_quantity, current_age_days, status", "compute_decay_and_price(base_price), to_dict()"),
        ("Order", "id, user_id, order_number, order_type, subtotal, tax_cgst, tax_sgst, total_amount, order_status", "to_dict()"),
        ("OrderItem", "id, order_id, product_id, batch_id, item_name, quantity, unit_price, total_price", "to_dict()"),
        ("CustomBouquet", "id, user_id, bouquet_name, wrapping_type, focal_count, canvas_json, total_price", "to_dict()"),
        ("DeliveryTelemetry", "id, order_id, driver_name, vehicle_number, current_lat, current_lng, speed_kmh, status", "to_dict()"),
        ("AdminSession", "id, admin_id, session_token, ip_address, is_active, last_active", "to_dict()"),
        ("EventQuotation", "id, user_id, company_name, event_type, event_date, distance_km, estimated_amount, status", "to_dict()")
    ]
    class_rows = [[Paragraph("Class Name", tbl_header), Paragraph("Key Attributes", tbl_header), Paragraph("Domain Methods", tbl_header)]]
    for c_name, c_attrs, c_meths in class_desc:
        class_rows.append([Paragraph(f"<b>{c_name}</b>", tbl_cell), Paragraph(c_attrs, tbl_cell), Paragraph(c_meths, tbl_cell)])
    t_class = Table(class_rows, colWidths=[115, 230, 170])
    t_class.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_class)

    story.append(PageBreak())

    story.append(Paragraph("2.2.3 Sequence Diagrams for Critical Flows", h3))
    story.append(Paragraph("<b>Critical Flow 1: 7-Step Bouquet Studio Checkout with GST Partitioning</b>", h3))

    seq1_box = [
        [Paragraph(
            "1. <b>Customer (Browser) &rarr; BouquetBuilder7Step.jsx:</b> Selects wrapping, focal flowers, fillers, and foliage greens.<br/>"
            "2. <b>BouquetBuilder7Step.jsx &rarr; Fabric.js Engine:</b> Renders layered stems, computes dynamic bundle cost.<br/>"
            "3. <b>Customer &rarr; BouquetBuilder7Step.jsx:</b> Inscribes gift greeting card and clicks 'Add to Cart'.<br/>"
            "4. <b>BouquetBuilder7Step.jsx &rarr; CartAndCheckoutModal.jsx:</b> Sends serialized canvas JSON + item parameters.<br/>"
            "5. <b>CartAndCheckoutModal.jsx &rarr; order_routes.py:</b> <code>POST /api/orders</code> (User ID, Address, Items, GSTIN).<br/>"
            "6. <b>order_routes.py &rarr; order_routes.py:</b> Verifies master stem prices against database records.<br/>"
            "7. <b>order_routes.py &rarr; order_routes.py:</b> Evaluates shipping address state:<br/>"
            "&nbsp;&nbsp;&nbsp;&nbsp;&bull; If Intra-State (Karnataka): Applies 2.5% CGST + 2.5% SGST (Total 5.0%).<br/>"
            "&nbsp;&nbsp;&nbsp;&nbsp;&bull; If Inter-State: Applies 5.0% Integrated GST (IGST).<br/>"
            "8. <b>order_routes.py &rarr; Database:</b> Commits ACID transaction inserting into <code>orders</code> and <code>order_items</code>.<br/>"
            "9. <b>order_routes.py &rarr; Database:</b> Decrements available stock in <code>products</code> and <code>perishable_batches</code>.<br/>"
            "10. <b>order_routes.py &rarr; CartAndCheckoutModal.jsx:</b> Returns <code>201 Created</code> with verified tax invoice ID.<br/>"
            "11. <b>CartAndCheckoutModal.jsx &rarr; Customer:</b> Renders verified GST Tax Invoice Modal with B2B input tax credits.", tbl_cell)]
    ]
    t_seq1 = Table(seq1_box, colWidths=[515])
    t_seq1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 1, c_brand),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_seq1)

    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Critical Flow 2: Live IoT GPS Cold-Chain Telemetry Streaming</b>", h3))

    seq2_box = [
        [Paragraph(
            "1. <b>Customer &rarr; LiveTrackingModal.jsx:</b> Clicks 'Track My Delivery' for active Order #GNB-8841.<br/>"
            "2. <b>LiveTrackingModal.jsx &rarr; Flask-SocketIO Server:</b> Establishes WSS handshake over <code>/socket.io</code>.<br/>"
            "3. <b>Flask-SocketIO Server &rarr; LiveTrackingModal.jsx:</b> Acknowledges connection with active session ID.<br/>"
            "4. <b>LiveTrackingModal.jsx &rarr; Flask-SocketIO Server:</b> Emits <code>track_order</code> with payload <code>{ order_id: 8841 }</code>.<br/>"
            "5. <b>[Daemon Loop Every 1000ms]:</b><br/>"
            "&nbsp;&nbsp;&nbsp;&nbsp;&bull; EV Van GPS telematics transponder transmits current location coordinates (Lat, Lng, Speed, Battery).<br/>"
            "&nbsp;&nbsp;&nbsp;&nbsp;&bull; <code>telemetry_routes.py</code> updates <code>delivery_telemetry</code> record.<br/>"
            "&nbsp;&nbsp;&nbsp;&nbsp;&bull; Flask-SocketIO broadcasts <code>telemetry_update</code> event with coordinate payload.<br/>"
            "6. <b>LiveTrackingModal.jsx (Leaflet Engine):</b> Re-renders EV van marker location and redraws route polyline.<br/>"
            "7. <b>LiveTrackingModal.jsx &rarr; Customer:</b> Updates dynamic speed indicator, battery level HUD, and arrival ETA.", tbl_cell)]
    ]
    t_seq2 = Table(seq2_box, colWidths=[515])
    t_seq2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 1, c_brand),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_seq2)

    story.append(Spacer(1, 10))
    story.append(Paragraph("2.2.4 Activity Diagram", h3))
    story.append(Paragraph("<b>Biological FEFO Inventory Aging &amp; Dynamic Price Decay Workflow</b>", h3))

    act_box = [
        [Paragraph(
            "<b>[START] Daily Automated FEFO Inventory Evaluation Routine</b><br/>"
            "&nbsp;&nbsp;&darr;<br/>"
            "Query all perishable batch records where <code>status != 'expired'</code><br/>"
            "&nbsp;&nbsp;&darr;<br/>"
            "<b>Iterate over each batch lot in database:</b><br/>"
            "Calculate elapsed biological age: <code>current_age_days = (today - harvest_date).days</code><br/>"
            "&nbsp;&nbsp;&darr;<br/>"
            "<b>Evaluate age against botanical vase life threshold:</b><br/>"
            "&nbsp;&nbsp;&bull; <b>Case 0 to 2 Days:</b> Set <code>status = 'fresh'</code> &rarr; Apply <b>0% Markdown</b> (Full Retail Price)<br/>"
            "&nbsp;&nbsp;&bull; <b>Case 3 Days:</b> Set <code>status = 'prime'</code> &rarr; Apply <b>20% Markdown Discount</b><br/>"
            "&nbsp;&nbsp;&bull; <b>Case 4 Days:</b> Set <code>status = 'clearance'</code> &rarr; Apply <b>45% Markdown Discount</b><br/>"
            "&nbsp;&nbsp;&bull; <b>Case 5+ Days &amp; Remaining &gt; 0:</b> Set <code>status = 'flash_sale'</code> &rarr; Apply <b>75% Flash Clearance</b><br/>"
            "&nbsp;&nbsp;&bull; <b>Case Age &gt; Vase Life + 2 Days:</b> Set <code>status = 'expired'</code> &rarr; Flag lot for organic bio-composting<br/>"
            "&nbsp;&nbsp;&darr;<br/>"
            "Persist updated status, remaining quantity, and effective prices to database<br/>"
            "&nbsp;&nbsp;&darr;<br/>"
            "Check if any batches reached critical clearance threshold &rarr; Dispatch SMTP System Alert to warehouse manager<br/>"
            "&nbsp;&nbsp;&darr;<br/>"
            "<b>[END] Evaluation Complete &mdash; Daily Audit Log Recorded</b>", tbl_cell)]
    ]
    t_act = Table(act_box, colWidths=[515])
    t_act.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 1, c_amber),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_act)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 2.3: USER INTERFACE DESIGN
    # =========================================================================
    story.append(Paragraph("2.3. User Interface Design", h2))
    story.append(Paragraph(
        "The user interface follows modern responsive design standards, featuring a curated color palette "
        "(forest green, warm amber, and clean slate neutral tones), fluid typography, and immediate client-side feedback. "
        "The application provides 6 primary user interface views:", body
    ))

    ui_screens = [
        ("Screen 1: Customer Storefront & Botanical Catalog (IndividualUserHome.jsx)",
         "<b>Header & Hero Banner:</b> Brand identity logo, seasonal promotions banner, search input, and filter chips (Cut Flowers, Potted Plants, Ceramic Planters, Care Tools).<br/>"
         "<b>Interactive Botanical Cards:</b> High-resolution photography, scientific Latin binomial names, HSN codes, sunlight/watering badges, live stock meters, and 'Add to Cart' / 'Wishlist' buttons.<br/>"
         "<b>Dynamic FEFO Badging:</b> Badges highlight automatic markdown reductions (e.g., 'Prime Batch: 20% Off' or 'Flash Clearance: 45% Off')."),

        ("Screen 2: 7-Step Bouquet Customizer Studio (BouquetBuilder7Step.jsx)",
         "<b>Step Pipeline Navigation:</b> Progressive workflow navigation bar (Wrapping &rarr; Focal Flowers &rarr; Fillers &rarr; Foliage &rarr; Styling &rarr; Fragrance Mist &rarr; Greeting Card).<br/>"
         "<b>HTML5 Canvas Workspace:</b> Interactive Fabric.js visual canvas displaying layered floral stems, rotation transforms, drag-and-drop repositioning, and dynamic bundle cost calculation.<br/>"
         "<b>Card Inscription Modal:</b> Text area allowing customized personalized message printing for gift deliveries."),

        ("Screen 3: Corporate Procurement & B2B Wholesale Portal (CorporateDashboard.jsx)",
         "<b>Wholesale Order Drawer:</b> Dedicated corporate interface enforcing wholesale Minimum Order Quantities (MOQ), tiered volume discounts, and verified GSTIN company input.<br/>"
         "<b>GST Tax Invoice Modal:</b> Statutory tax breakdown display showing subtotal, CGST (2.5%), SGST (2.5%), or IGST (5.0%), and tax invoice download action."),

        ("Screen 4: Event Staging & Venue Simulator (EventStagingEngine.jsx)",
         "<b>Venue Setup Form:</b> Captures venue specifications, seating tiers (Intimate: 50, Medium: 200, Grand: 500+ guests), and aesthetic floriography themes.<br/>"
         "<b>Haversine Distance HUD:</b> Real-time road distance calculation and logistics surcharges originating from the central depot at Kalmane, Thirthahalli.<br/>"
         "<b>Single-Event Clash Guard:</b> Calendar date picker disabling and flagging dates already booked for existing weddings or corporate banquets."),

        ("Screen 5: Cold-Chain Live GPS Tracking Modal (LiveTrackingModal.jsx)",
         "<b>Leaflet GIS Map:</b> Interactive vector map rendering custom refrigerated EV van marker location, destination pin, and animated polyline travel route.<br/>"
         "<b>Driver & Telemetry HUD:</b> Displays driver full name, contact phone, vehicle registration code, current speed (km/h), battery level (%), and arrival ETA countdown."),

        ("Screen 6: Super-Admin Console & Database Inspector (AdminConsole.jsx / DatabaseInspectorView.jsx)",
         "<b>Batch Expiration Table:</b> Table allowing warehouse managers to inspect harvest dates, biological age curves, and trigger FEFO markdown actions.<br/>"
         "<b>Live Schema Inspector:</b> Administrative developer console allowing staff to inspect raw relational database tables, view row counts, and execute test database resets.")
    ]

    for s_title, s_desc in ui_screens:
        story.append(Spacer(1, 4))
        s_box = [
            [Paragraph(f"<b>{s_title}</b>", tbl_header)],
            [Paragraph(s_desc, tbl_cell)]
        ]
        t_s = Table(s_box, colWidths=[515])
        t_s.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_brand),
            ('BOX', (0,0), (-1,-1), 1, c_border),
            ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
            ('PADDING', (0,0), (-1,-1), 6),
            ('BACKGROUND', (0,1), (-1,1), c_bg_light),
        ]))
        story.append(t_s)
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>Note for Final Academic Report Printing:</b>", ParagraphStyle('NoteH', parent=body, fontName='Helvetica-Bold', textColor=c_primary)))
    story.append(Paragraph(
        "To attach the physical user interface screenshots for Section 2.3 in your final printout, execute "
        "<code>npm run dev</code> in the <code>frontend</code> directory, access the running application at "
        "<code>http://localhost:5173</code> in your browser, and capture full-screen screenshots of the 6 views described above.", body
    ))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 3: REFERENCES
    # =========================================================================
    story.append(Paragraph("3. References", h1))
    story.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=10))

    references_list = [
        ("1", "Pallets Projects. <i>Flask Application Structure, Blueprints, and Application Factory Patterns (v3.0.x).</i> 2024. Available: https://flask.palletsprojects.com/"),
        ("2", "Bayer, M. <i>SQLAlchemy: Object Relational Tutorial and Declarative Mapping Architecture (v2.0.x).</i> 2024. Available: https://docs.sqlalchemy.org/"),
        ("3", "Meta Platforms, Inc. <i>React Core Documentation: Component Lifecycle, Hooks, and Single-Page Architecture (v18.x).</i> 2024. Available: https://react.dev/"),
        ("4", "Kasyanov, J. <i>Fabric.js: Object-Oriented HTML5 Canvas Programming and JSON Serialization.</i> 2024. Available: http://fabricjs.com/"),
        ("5", "Raimondo, G. <i>Socket.IO: Bi-directional Event-based Communication over WebSockets.</i> 2024. Available: https://socket.io/"),
        ("6", "Agafonkin, V. <i>Leaflet: Mobile-Friendly Interactive Maps and GeoJSON Projections.</i> 2024. Available: https://leafletjs.com/"),
        ("7", "IEEE Computer Society. <i>IEEE Standard for Information Technology &mdash; Systems Design &mdash; Software Design Descriptions (IEEE Std 1016-2009).</i> IEEE, 2009."),
        ("8", "Central Board of Indirect Taxes and Customs (CBIC), Government of India. <i>Goods and Services Tax (GST) Tariff Classification under HSN Chapters 0602 and 0603.</i> New Delhi, 2023. Available: https://cbic.gov.in/"),
        ("9", "Sinnott, R. W. <i>Virtues of the Haversine.</i> Sky and Telescope, vol. 68, no. 2, p. 159, 1984."),
        ("10", "Gamma, E., Helm, R., Johnson, R., and Vlissides, J. <i>Design Patterns: Elements of Reusable Object-Oriented Software.</i> Addison-Wesley, 1994.")
    ]

    ref_rows = []
    for num, cit in references_list:
        ref_rows.append([Paragraph(f"[{num}]", ParagraphStyle('RefNum', parent=tbl_cell, fontName='Helvetica-Bold', alignment=TA_CENTER)), Paragraph(cit, tbl_cell)])

    t_ref = Table(ref_rows, colWidths=[30, 485])
    t_ref.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
    ]))
    story.append(t_ref)

    # Build document with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Publication-grade PDF successfully created at: {output_path}")

if __name__ == '__main__':
    target = '/Users/rizal/GreenNest_Bloom/docs/SOFTWARE_DESIGN_SPECIFICATION.pdf'
    build_pdf(target)
