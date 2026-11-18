import os
from PIL import Image, ImageDraw, ImageFont

def generate_diagram(output_png_path, output_svg_path):
    # Canvas dimensions
    width = 2400
    height = 2000
    
    # Fonts
    font_path_regular = "/System/Library/Fonts/Supplemental/Arial.ttf"
    font_path_bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    
    font_title = ImageFont.truetype(font_path_bold, 36)
    font_tier_hdr = ImageFont.truetype(font_path_bold, 28)
    font_tier_sub = ImageFont.truetype(font_path_regular, 20)
    font_card_hdr = ImageFont.truetype(font_path_bold, 22)
    font_card_sub = ImageFont.truetype(font_path_regular, 17)
    font_badge = ImageFont.truetype(font_path_bold, 16)
    font_line_lbl = ImageFont.truetype(font_path_bold, 18)

    # Color Palette (Modern Slate/Cyber Dark theme matching user's image)
    bg_color = (15, 23, 42)          # #0f172a Slate 900
    grid_line = (30, 41, 59)         # #1e293b
    container_bg = (24, 34, 53)      # #182235
    container_border = (51, 65, 85)  # #334155
    
    card_bg = (30, 41, 59)           # #1e293b
    card_border = (71, 85, 105)      # #475569
    
    text_white = (248, 250, 252)
    text_muted = (148, 163, 184)
    text_cyan = (56, 189, 248)       # #38bdf8
    text_emerald = (52, 211, 153)    # #34d399
    text_amber = (251, 191, 36)      # #fbbf24
    text_purple = (192, 132, 252)    # #c084fc
    
    line_color = (94, 234, 212)      # #5eead4 Teal bright
    line_sec = (148, 163, 184)       # #94a3b8

    img = Image.new("RGBA", (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # 1. Subtle grid background
    grid_size = 40
    for x in range(0, width, grid_size):
        draw.line([(x, 0), (x, height)], fill=grid_line, width=1)
    for y in range(0, height, grid_size):
        draw.line([(0, y), (width, y)], fill=grid_line, width=1)

    # Title header banner
    draw.text((width // 2, 50), "GREEN NEST BLOOM — HIGH-LEVEL SYSTEM ARCHITECTURE", fill=text_white, font=font_title, anchor="mm")
    draw.text((width // 2, 95), "Decoupled Multi-Tier Floriculture Commerce, Perishable Spoilage Daemon & Cold-Chain Telemetry Platform", fill=text_muted, font=font_tier_sub, anchor="mm")

    # Helper function to draw rounded card
    def draw_card(box, title, subtitle="", badge="", badge_color=text_cyan):
        bx0, by0, bx1, by1 = box
        draw.rounded_rectangle([bx0, by0, bx1, by1], radius=14, fill=card_bg, outline=card_border, width=2)
        if badge:
            # Badge pill
            bbox = draw.textbbox((0, 0), badge, font=font_badge)
            bw = bbox[2] - bbox[0] + 16
            draw.rounded_rectangle([bx1 - bw - 12, by0 + 12, bx1 - 12, by0 + 36], radius=8, fill=(15, 23, 42), outline=badge_color, width=1)
            draw.text((bx1 - 12 - bw/2, by0 + 24), badge, fill=badge_color, font=font_badge, anchor="mm")
        
        draw.text((bx0 + 20, by0 + 32), title, fill=text_white, font=font_card_hdr)
        if subtitle:
            draw.text((bx0 + 20, by0 + 64), subtitle, fill=text_muted, font=font_card_sub)

    # Helper function for container box
    def draw_tier_container(box, header, sub=""):
        bx0, by0, bx1, by1 = box
        draw.rounded_rectangle([bx0, by0, bx1, by1], radius=20, fill=container_bg, outline=container_border, width=2)
        draw.text((bx0 + 30, by0 + 35), header, fill=text_cyan, font=font_tier_hdr)
        if sub:
            draw.text((bx0 + 30, by0 + 68), sub, fill=text_muted, font=font_tier_sub)

    # =========================================================================
    # TIER 1: PRESENTATION LAYER
    # =========================================================================
    t1_y0, t1_y1 = 150, 430
    draw_tier_container([100, t1_y0, 2300, t1_y1], "TIER 1: PRESENTATION LAYER (Client Browser & PWA)", "React.js 18 • Tailwind CSS • Fabric.js HTML5 Canvas • Leaflet GIS • Socket.IO Client")

    # 4 Cards in Tier 1
    c_w = 510
    gap = 25
    c_start_x = 135
    
    # Card 1: B2C Retail Portal
    draw_card([c_start_x, 240, c_start_x + c_w, 400], 
              "B2C Retail Portal", 
              "• 7-Step Fabric.js Studio\n• Dynamic FEFO Markdown Badges\n• Cart Caps (<= 5 units / item)", 
              "Shoppers", text_emerald)
    
    # Card 2: B2B Corporate Portal
    c2_x = c_start_x + c_w + gap
    draw_card([c2_x, 240, c2_x + c_w, 400], 
              "B2B Corporate Portal", 
              "• Verified GSTIN Registration\n• Wholesale MOQ Matrices (>= 20)\n• Multi-Tier GST Tax Invoicing", 
              "Enterprises", text_amber)
    
    # Card 3: Singleton Admin Console
    c3_x = c2_x + c_w + gap
    draw_card([c3_x, 240, c3_x + c_w, 400], 
              "Singleton Admin Console", 
              "• FEFO Decay Sliders & Overrides\n• Dispatch Telemetry HUD Monitor\n• Single-Session Enforced Lock", 
              "Super-Admin", text_purple)
    
    # Card 4: Driver Telemetry PWA
    c4_x = c3_x + c_w + gap
    draw_card([c4_x, 240, c4_x + c_w, 400], 
              "Driver Telemetry PWA", 
              "• HTML5 Geolocation WGS84\n• Real-Time GPS Tracking Beacon\n• Cold-Chain Van Dispatch Stream", 
              "Fleet Drivers", text_cyan)

    # =========================================================================
    # TIER 2: API GATEWAY & SECURITY LAYER
    # =========================================================================
    t2_y0, t2_y1 = 540, 780
    draw_tier_container([100, t2_y0, 2300, t2_y1], "TIER 2: API GATEWAY & SECURITY LAYER (Python Flask 3.x)", "Stateless HTTP REST Endpoints • Blueprint Routing Hub • RBAC Security & Singleton Admin Token Lock")

    g_w = 690
    g_gap = 35
    g_start_x = 135
    
    # Gateway Card 1: Flask REST API Gateway
    draw_card([g_start_x, 620, g_start_x + g_w, 750],
              "Flask REST API Gateway",
              "• WSGI HTTP Request Dispatcher & Blueprint Hub\n• Strict JSON Schema Validation\n• CORS Middleware & Compression Filter",
              "Port 5001", text_emerald)

    # Gateway Card 2: RBAC & Token Auth
    g2_x = g_start_x + g_w + g_gap
    draw_card([g2_x, 620, g2_x + g_w, 750],
              "RBAC & Token Security Guard",
              "• PBKDF2-SHA256 Password Hashing\n• Signed Bearer Token Authorization\n• Role Boundaries (Individual / Corporate / Admin)",
              "Middleware", text_amber)

    # Gateway Card 3: Singleton Session Guard
    g3_x = g2_x + g_w + g_gap
    draw_card([g3_x, 620, g3_x + g_w, 750],
              "Singleton Session Governance",
              "• Active Administrative Token Verifier\n• Invalidation of Stale Concurrent Sessions\n• Security Alert Dispatch on Intrusion",
              "Concurrency Guard", text_purple)

    # =========================================================================
    # TIER 3: CORE APPLICATION SERVICES
    # =========================================================================
    t3_y0, t3_y1 = 890, 1260
    draw_tier_container([100, t3_y0, 2300, t3_y1], "TIER 3: CORE APPLICATION SERVICES (Business Logic Engines)", "Asynchronous Tasks • Geospatial Routing • Perishable Senescence Models • Live Duplexing")

    s_w = 510
    s_gap = 25
    s_start_x = 135

    # Core Service 1: WebSocket Gateway
    draw_card([s_start_x, 970, s_start_x + s_w, 1220],
              "WebSocket Telemetry Hub",
              "• Flask-SocketIO Engine (WSS)\n• Full-Duplex Coordinate Streaming\n• Driver Location Channel Fan-Out\n• 1-Sec Telemetry Broadcast Heartbeat\n• ETA & Battery Level Updates",
              "Real-Time Event WSS", text_cyan)

    # Core Service 2: Cart & Order Manager
    s2_x = s_start_x + s_w + s_gap
    draw_card([s2_x, 970, s2_x + s_w, 1220],
              "Cart & Order Manager",
              "• Retail Purchase Cap Enforcer (<=5)\n• Wholesale MOQ Rule Validator (>=20)\n• Multi-Tier GST Tax Partitioning\n  - CGST 2.5% + SGST 2.5% (Intra-State)\n  - IGST 5.0% (Inter-State Supply)\n• Promotional Coupon Deductions",
              "Commerce Core", text_emerald)

    # Core Service 3: Haversine Logistics Engine
    s3_x = s2_x + s_w + s_gap
    draw_card([s3_x, 970, s3_x + s_w, 1220],
              "Haversine Logistics Engine",
              "• Great-Circle Road Distance Computation\n• Warehouse Origin: Kalmane, Thirthahalli\n  (13.6934° N, 75.2448° E)\n• 2,500 km Delivery Boundary Guard\n• Single-Event-per-Day Booking Clash Guard\n• Dynamic Distance Logistics Surcharge",
              "Geospatial Engine", text_amber)

    # Core Service 4: Celery Spoilage Daemon
    s4_x = s3_x + s_w + s_gap
    draw_card([s4_x, 970, s4_x + s_w, 1220],
              "Perishable Spoilage Daemon",
              "• Celery Asynchronous Task Engine\n• Midnight 00:00 UTC Scheduled Cron\n• FEFO Dynamic Markdown Curves:\n  - Fresh: 0% | Prime: 20%\n  - Clearance: 45% | Flash Sale: 75%\n• SMTP Alert Relay on Critical Senescence",
              "FEFO / Spoilage", text_purple)

    # =========================================================================
    # TIER 4: PERSISTENCE, BROKER & EXTERNAL SYSTEMS
    # =========================================================================
    t4_y0, t4_y1 = 1380, 1850
    draw_tier_container([100, t4_y0, 2300, t4_y1], "TIER 4: PERSISTENCE, BROKER & EXTERNAL INTEGRATIONS", "ACID Relational Storage • In-Memory Task Broker & Cache • Digital Payment Sandbox • Cartographic APIs")

    b_w = 510
    b_gap = 25
    b_start_x = 135

    # DB Card 1: MySQL 8.0 Relational Store
    draw_card([b_start_x, 1470, b_start_x + b_w, 1800],
              "MySQL 8.0 Relational Store",
              "• 18 ACID-Compliant Relational Tables\n• Perishable Inventory Batches (FEFO)\n• Orders, Order Items & Custom Bouquets\n• Event Quotations with Unique Date Locks\n• Foreign Key Cascade Integrity\n• Botanical Care & Daily Sales Datasets",
              "Relational DB", text_emerald)

    # DB Card 2: Redis 7.0 In-Memory Broker
    b2_x = b_start_x + b_w + b_gap
    draw_card([b2_x, 1470, b2_x + b_w, 1800],
              "Redis 7.0 In-Memory Store",
              "• Celery Task Queue Message Broker\n• Fast Key-Value Token Cache\n• Singleton Admin Session Lock Flag\n• Rate-Limiting & API Throttling\n• Low-Latency Pub/Sub Coordination",
              "Task Queue / Cache", text_purple)

    # DB Card 3: Razorpay Sandbox Gateway
    b3_x = b2_x + b_w + b_gap
    draw_card([b3_x, 1470, b3_x + b_w, 1800],
              "Razorpay Sandbox Gateway",
              "• Digital Payment Order Creation\n• UPI, Credit/Debit Cards, Net Banking\n• Webhook Signature Verification\n• Instant Payment Status Reconciliation\n• GST Tax Invoice Trigger",
              "Payment Gateway", text_amber)

    # DB Card 4: OpenStreetMap & Leaflet Tile API
    b4_x = b3_x + b_w + b_gap
    draw_card([b4_x, 1470, b4_x + b_w, 1800],
              "OpenStreetMap & Leaflet Tile",
              "• High-Resolution Vector Tile Cartography\n• Van Route Polyline Coordinates\n• Kalmane Packing Depot Marker Staging\n• Geocoding & Client Map Canvas Tiles\n• Zero-Cost Open Geographic Data",
              "GIS Mapping API", text_cyan)

    # =========================================================================
    # CONNECTING PROTOCOL ARROWS (Zero Crossing, Clean Orthogonal Lines)
    # =========================================================================
    def draw_down_arrow(x, y0, y1, label="", label_color=line_color, line_c=line_color):
        draw.line([(x, y0), (x, y1)], fill=line_c, width=3)
        # Arrowhead
        ah = 12
        draw.polygon([(x, y1), (x - 7, y1 - ah), (x + 7, y1 - ah)], fill=line_c)
        if label:
            draw.text((x + 12, (y0 + y1) // 2), label, fill=label_color, font=font_line_lbl, anchor="lm")

    def draw_up_down_arrow(x, y0, y1, label="", label_color=text_cyan):
        draw.line([(x, y0), (x, y1)], fill=(56, 189, 248), width=3)
        ah = 12
        draw.polygon([(x, y1), (x - 7, y1 - ah), (x + 7, y1 - ah)], fill=(56, 189, 248))
        draw.polygon([(x, y0), (x - 7, y0 + ah), (x + 7, y0 + ah)], fill=(56, 189, 248))
        if label:
            draw.text((x + 12, (y0 + y1) // 2), label, fill=label_color, font=font_line_lbl, anchor="lm")

    # Connector 1: Presentation Tier -> Gateway Tier (HTTPS REST)
    draw_down_arrow(650, t1_y1, t2_y0, "HTTPS / REST (Axios Requests - JSON Payloads)", text_emerald, (52, 211, 153))
    
    # Connector 2: Presentation Tier (Driver & Admin) <-> Tier 3 WebSocket directly (Bypassing REST for WSS)
    # Right-hand clean bypass line
    draw_up_down_arrow(2050, t1_y1, t3_y0, "WSS Socket (Bidirectional Socket.IO Telemetry Stream)", text_cyan)

    # Connector 3: Gateway Tier -> Core Application Services (Internal Invocation)
    draw_down_arrow(650, t2_y1, t3_y0, "Blueprint RPC & Service Routing", text_amber, (251, 191, 36))
    draw_down_arrow(1200, t2_y1, t3_y0, "Business Logic Execution", text_amber, (251, 191, 36))
    draw_down_arrow(1750, t2_y1, t3_y0, "Daemon Trigger & Invalidation", text_amber, (251, 191, 36))

    # Connector 4: Core Services -> Tier 4
    # Service 1 (WebSocket) -> Tile API & Telemetry records
    draw_up_down_arrow(390, t3_y1, t4_y0, "Batch DB Read/Write", text_emerald)
    
    # Service 2 (Cart & Order) -> MySQL & Razorpay
    draw_down_arrow(915, t3_y1, t4_y0, "Transactional Commit", text_emerald, (52, 211, 153))
    
    # Service 3 (Haversine & Clash) -> OpenStreetMap / MySQL
    draw_down_arrow(1440, t3_y1, t4_y0, "Payments / GIS Cartography", text_amber, (251, 191, 36))
    
    # Service 4 (Celery FEFO) -> Redis & MySQL
    draw_up_down_arrow(1975, t3_y1, t4_y0, "Celery Broker & Nightly Cron", text_purple)

    # Save PNG
    img.save(output_png_path, "PNG", dpi=(300, 300))
    print(f"✅ High-resolution PNG diagram generated at: {output_png_path}")

    # Generate equivalent scalable SVG
    generate_svg(output_svg_path, width, height)

def generate_svg(output_svg_path, width, height):
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" style="background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="1"/>
    </pattern>
    <marker id="arrow-emerald" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#34d399"/>
    </marker>
    <marker id="arrow-cyan" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#38bdf8"/>
    </marker>
    <marker id="arrow-amber" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#fbbf24"/>
    </marker>
    <marker id="arrow-purple" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#c084fc"/>
    </marker>
  </defs>

  <rect width="100%" height="100%" fill="url(#grid)" />

  <!-- Header -->
  <text x="{width/2}" y="55" text-anchor="middle" font-size="34" font-weight="bold" fill="#f8fafc">GREEN NEST BLOOM — HIGH-LEVEL SYSTEM ARCHITECTURE</text>
  <text x="{width/2}" y="95" text-anchor="middle" font-size="20" fill="#94a3b8">Decoupled Multi-Tier Floriculture Commerce, Perishable Spoilage Daemon &amp; Cold-Chain Telemetry Platform</text>

  <!-- ================= TIER 1 ================= -->
  <rect x="100" y="150" width="2200" height="280" rx="18" fill="#182235" stroke="#334155" stroke-width="2"/>
  <text x="135" y="195" font-size="26" font-weight="bold" fill="#38bdf8">TIER 1: PRESENTATION LAYER (Client Browser &amp; PWA)</text>
  <text x="135" y="225" font-size="16" fill="#94a3b8">React.js 18 • Tailwind CSS • Fabric.js HTML5 Canvas • Leaflet GIS • Socket.IO Client</text>

  <!-- Card 1.1 -->
  <rect x="135" y="245" width="510" height="155" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="155" y="280" font-size="22" font-weight="bold" fill="#ffffff">B2C Retail Portal</text>
  <text x="155" y="315" font-size="16" fill="#94a3b8">• 7-Step Fabric.js Bouquet Studio</text>
  <text x="155" y="340" font-size="16" fill="#94a3b8">• Dynamic FEFO Markdown Badges</text>
  <text x="155" y="365" font-size="16" fill="#94a3b8">• Cart Purchase Caps (&le; 5 units / item)</text>

  <!-- Card 1.2 -->
  <rect x="670" y="245" width="510" height="155" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="690" y="280" font-size="22" font-weight="bold" fill="#ffffff">B2B Corporate Portal</text>
  <text x="690" y="315" font-size="16" fill="#94a3b8">• Verified GSTIN Registration</text>
  <text x="690" y="340" font-size="16" fill="#94a3b8">• Wholesale MOQ Pricing (&ge; 20 units)</text>
  <text x="690" y="365" font-size="16" fill="#94a3b8">• Downloadable GST Tax Invoices (PDF)</text>

  <!-- Card 1.3 -->
  <rect x="1205" y="245" width="510" height="155" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="1225" y="280" font-size="22" font-weight="bold" fill="#ffffff">Singleton Admin Console</text>
  <text x="1225" y="315" font-size="16" fill="#94a3b8">• FEFO Decay Multipliers &amp; Overrides</text>
  <text x="1225" y="340" font-size="16" fill="#94a3b8">• Real-time Dispatch Fleet Telemetry HUD</text>
  <text x="1225" y="365" font-size="16" fill="#94a3b8">• Single-Session Protected Lock</text>

  <!-- Card 1.4 -->
  <rect x="1740" y="245" width="510" height="155" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="1760" y="280" font-size="22" font-weight="bold" fill="#ffffff">Driver Telemetry PWA</text>
  <text x="1760" y="315" font-size="16" fill="#94a3b8">• HTML5 Geolocation WGS84 Beacon</text>
  <text x="1760" y="340" font-size="16" fill="#94a3b8">• 1-Second GPS Coordinate Relays</text>
  <text x="1760" y="365" font-size="16" fill="#94a3b8">• Refrigerated EV Van Transit Stream</text>

  <!-- ================= TIER 2 ================= -->
  <rect x="100" y="520" width="2200" height="240" rx="18" fill="#182235" stroke="#334155" stroke-width="2"/>
  <text x="135" y="565" font-size="26" font-weight="bold" fill="#38bdf8">TIER 2: API GATEWAY &amp; SECURITY LAYER (Python Flask 3.x)</text>
  <text x="135" y="595" font-size="16" fill="#94a3b8">Stateless HTTP REST Endpoints • Blueprint Routing Hub • RBAC Security &amp; Singleton Admin Session Guard</text>

  <!-- Card 2.1 -->
  <rect x="135" y="615" width="690" height="120" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="155" y="650" font-size="22" font-weight="bold" fill="#ffffff">Flask REST API Gateway</text>
  <text x="155" y="685" font-size="16" fill="#94a3b8">• WSGI Request Dispatcher &amp; Blueprint Partitioning Hub</text>
  <text x="155" y="710" font-size="16" fill="#94a3b8">• Strict JSON Schema Validation &amp; CORS Middleware</text>

  <!-- Card 2.2 -->
  <rect x="855" y="615" width="690" height="120" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="875" y="650" font-size="22" font-weight="bold" fill="#ffffff">RBAC &amp; Token Auth Guard</text>
  <text x="875" y="685" font-size="16" fill="#94a3b8">• PBKDF2-SHA256 Password Cryptography</text>
  <text x="875" y="710" font-size="16" fill="#94a3b8">• Role Boundaries (Individual / Corporate / Admin)</text>

  <!-- Card 2.3 -->
  <rect x="1575" y="615" width="675" height="120" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="1595" y="650" font-size="22" font-weight="bold" fill="#ffffff">Singleton Session Governance</text>
  <text x="1595" y="685" font-size="16" fill="#94a3b8">• Active Administrative Token Verifier (Redis Lock)</text>
  <text x="1595" y="710" font-size="16" fill="#94a3b8">• Invalidation of Prior Concurrent Administrative Logins</text>

  <!-- ================= TIER 3 ================= -->
  <rect x="100" y="850" width="2200" height="380" rx="18" fill="#182235" stroke="#334155" stroke-width="2"/>
  <text x="135" y="895" font-size="26" font-weight="bold" fill="#38bdf8">TIER 3: CORE APPLICATION SERVICES (Business Logic Engines)</text>
  <text x="135" y="925" font-size="16" fill="#94a3b8">Asynchronous Task Processing • Geospatial Logistics • Perishable Senescence Models • Live Duplexing</text>

  <!-- Card 3.1 -->
  <rect x="135" y="945" width="510" height="255" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="155" y="980" font-size="22" font-weight="bold" fill="#ffffff">WebSocket Telemetry Hub</text>
  <text x="155" y="1015" font-size="15" fill="#94a3b8">• Flask-SocketIO Bidirectional Engine</text>
  <text x="155" y="1040" font-size="15" fill="#94a3b8">• Driver Location Channel Broadcasts</text>
  <text x="155" y="1065" font-size="15" fill="#94a3b8">• 1-Second GPS Telemetry Heartbeat</text>
  <text x="155" y="1090" font-size="15" fill="#94a3b8">• Speed, Battery &amp; ETA Computations</text>
  <text x="155" y="1115" font-size="15" fill="#94a3b8">• Sub-2-Second Live Map Refresh</text>

  <!-- Card 3.2 -->
  <rect x="670" y="945" width="510" height="255" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="690" y="980" font-size="22" font-weight="bold" fill="#ffffff">Cart &amp; Order Manager</text>
  <text x="690" y="1015" font-size="15" fill="#94a3b8">• Retail Purchase Caps (&le; 5 units)</text>
  <text x="690" y="1040" font-size="15" fill="#94a3b8">• Wholesale MOQs Validation (&ge; 20)</text>
  <text x="690" y="1065" font-size="15" fill="#94a3b8">• Multi-Tier GST Tax Computation</text>
  <text x="690" y="1090" font-size="15" fill="#94a3b8">  - CGST 2.5% + SGST 2.5% (Intra-State)</text>
  <text x="690" y="1115" font-size="15" fill="#94a3b8">  - IGST 5.0% (Inter-State Supply)</text>
  <text x="690" y="1140" font-size="15" fill="#94a3b8">• Dynamic Coupon Code Discounts</text>

  <!-- Card 3.3 -->
  <rect x="1205" y="945" width="510" height="255" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="1225" y="980" font-size="22" font-weight="bold" fill="#ffffff">Haversine Logistics Engine</text>
  <text x="1225" y="1015" font-size="15" fill="#94a3b8">• Great-Circle Spherical Distance</text>
  <text x="1225" y="1040" font-size="15" fill="#94a3b8">• Packing Depot: Kalmane, Thirthahalli</text>
  <text x="1225" y="1065" font-size="15" fill="#94a3b8">  (13.6934° N, 75.2448° E)</text>
  <text x="1225" y="1090" font-size="15" fill="#94a3b8">• 2,500 km Delivery Boundary Radius</text>
  <text x="1225" y="1115" font-size="15" fill="#94a3b8">• Single-Event-per-Day Date Lock</text>
  <text x="1225" y="1140" font-size="15" fill="#94a3b8">• Road Distance Logistics Surcharge</text>

  <!-- Card 3.4 -->
  <rect x="1740" y="945" width="510" height="255" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="1760" y="980" font-size="22" font-weight="bold" fill="#ffffff">Perishable Spoilage Daemon</text>
  <text x="1760" y="1015" font-size="15" fill="#94a3b8">• Celery Asynchronous Task Engine</text>
  <text x="1760" y="1040" font-size="15" fill="#94a3b8">• Scheduled Midnight 00:00 UTC Cron</text>
  <text x="1760" y="1065" font-size="15" fill="#94a3b8">• FEFO Markdown Curve Depreciation:</text>
  <text x="1760" y="1090" font-size="15" fill="#94a3b8">  - Fresh: 0% | Prime: 20%</text>
  <text x="1760" y="1115" font-size="15" fill="#94a3b8">  - Clearance: 45% | Flash: 75%</text>
  <text x="1760" y="1140" font-size="15" fill="#94a3b8">• Critical Spoilage SMTP Alert Relay</text>

  <!-- ================= TIER 4 ================= -->
  <rect x="100" y="1320" width="2200" height="480" rx="18" fill="#182235" stroke="#334155" stroke-width="2"/>
  <text x="135" y="1365" font-size="26" font-weight="bold" fill="#38bdf8">TIER 4: PERSISTENCE, BROKER &amp; EXTERNAL INTEGRATIONS</text>
  <text x="135" y="1395" font-size="16" fill="#94a3b8">ACID Relational Storage • In-Memory Task Broker &amp; Cache • Digital Payment Sandbox • Cartographic APIs</text>

  <!-- Card 4.1 -->
  <rect x="135" y="1420" width="510" height="340" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="155" y="1460" font-size="22" font-weight="bold" fill="#ffffff">MySQL 8.0 Relational Store</text>
  <text x="155" y="1500" font-size="15" fill="#94a3b8">• 18 ACID Relational Tables</text>
  <text x="155" y="1530" font-size="15" fill="#94a3b8">• Perishable Inventory Batches (FEFO)</text>
  <text x="155" y="1560" font-size="15" fill="#94a3b8">• Orders, Line Items &amp; Bouquets</text>
  <text x="155" y="1590" font-size="15" fill="#94a3b8">• Event Quotations with Unique Date Locks</text>
  <text x="155" y="1620" font-size="15" fill="#94a3b8">• Foreign Key Referencing &amp; Cascade</text>
  <text x="155" y="1650" font-size="15" fill="#94a3b8">• Botanical Datasets &amp; Care Library</text>
  <text x="155" y="1680" font-size="15" fill="#94a3b8">• 730-Day Historical Sales Records</text>

  <!-- Card 4.2 -->
  <rect x="670" y="1420" width="510" height="340" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="690" y="1460" font-size="22" font-weight="bold" fill="#ffffff">Redis 7.0 In-Memory Store</text>
  <text x="690" y="1500" font-size="15" fill="#94a3b8">• Celery Task Queue Message Broker</text>
  <text x="690" y="1530" font-size="15" fill="#94a3b8">• Fast Key-Value Token Blacklist Cache</text>
  <text x="690" y="1560" font-size="15" fill="#94a3b8">• Singleton Admin Session Lock Flag</text>
  <text x="690" y="1590" font-size="15" fill="#94a3b8">• High-Throughput Sub-Millisecond Reads</text>
  <text x="690" y="1620" font-size="15" fill="#94a3b8">• Distributed In-Flight State Pub/Sub</text>

  <!-- Card 4.3 -->
  <rect x="1205" y="1420" width="510" height="340" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="1225" y="1460" font-size="22" font-weight="bold" fill="#ffffff">Razorpay Sandbox Gateway</text>
  <text x="1225" y="1500" font-size="15" fill="#94a3b8">• Digital Payment Order Creation</text>
  <text x="1225" y="1530" font-size="15" fill="#94a3b8">• UPI, Cards, Net Banking Channels</text>
  <text x="1225" y="1560" font-size="15" fill="#94a3b8">• Webhook Cryptographic Verification</text>
  <text x="1225" y="1590" font-size="15" fill="#94a3b8">• Instant Payment Status Reconciliation</text>
  <text x="1225" y="1620" font-size="15" fill="#94a3b8">• Automated GST Tax Invoice Trigger</text>

  <!-- Card 4.4 -->
  <rect x="1740" y="1420" width="510" height="340" rx="12" fill="#1e293b" stroke="#475569" stroke-width="2"/>
  <text x="1760" y="1460" font-size="22" font-weight="bold" fill="#ffffff">OpenStreetMap &amp; Leaflet Tile</text>
  <text x="1760" y="1500" font-size="15" fill="#94a3b8">• Open Geographic Vector Cartography</text>
  <text x="1760" y="1530" font-size="15" fill="#94a3b8">• Van Route Polyline Coordinates</text>
  <text x="1760" y="1560" font-size="15" fill="#94a3b8">• Kalmane Central Depot Marker Staging</text>
  <text x="1760" y="1590" font-size="15" fill="#94a3b8">• Client-Side Dynamic Map Tile Caching</text>
  <text x="1760" y="1620" font-size="15" fill="#94a3b8">• High-Reliability Zero-Cost GIS Data</text>

  <!-- ================= ARROWS (TOP TO BOTTOM) ================= -->
  <!-- Tier 1 -> Tier 2 -->
  <line x1="600" y1="430" x2="600" y2="520" stroke="#34d399" stroke-width="4" marker-end="url(#arrow-emerald)"/>
  <rect x="615" y="465" width="460" height="30" rx="6" fill="#0f172a" stroke="#34d399" stroke-width="1"/>
  <text x="625" y="485" font-size="14" font-weight="bold" fill="#34d399">HTTPS / REST (JSON API Requests via Axios)</text>

  <!-- Tier 1 -> Tier 3 Direct WSS -->
  <line x1="1995" y1="430" x2="1995" y2="850" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow-cyan)"/>
  <rect x="1560" y="465" width="420" height="30" rx="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1"/>
  <text x="1570" y="485" font-size="14" font-weight="bold" fill="#38bdf8">WSS Socket (Bidirectional Socket.IO Telemetry)</text>

  <!-- Tier 2 -> Tier 3 -->
  <line x1="480" y1="760" x2="480" y2="850" stroke="#fbbf24" stroke-width="4" marker-end="url(#arrow-amber)"/>
  <line x1="1200" y1="760" x2="1200" y2="850" stroke="#fbbf24" stroke-width="4" marker-end="url(#arrow-amber)"/>
  <line x1="1920" y1="760" x2="1920" y2="850" stroke="#fbbf24" stroke-width="4" marker-end="url(#arrow-amber)"/>
  <rect x="1000" y="795" width="400" height="30" rx="6" fill="#0f172a" stroke="#fbbf24" stroke-width="1"/>
  <text x="1010" y="815" font-size="14" font-weight="bold" fill="#fbbf24">Internal Blueprint Invocation &amp; Business Rules</text>

  <!-- Tier 3 -> Tier 4 -->
  <line x1="390" y1="1230" x2="390" y2="1320" stroke="#34d399" stroke-width="4" marker-end="url(#arrow-emerald)"/>
  <line x1="925" y1="1230" x2="925" y2="1320" stroke="#34d399" stroke-width="4" marker-end="url(#arrow-emerald)"/>
  <line x1="1460" y1="1230" x2="1460" y2="1320" stroke="#fbbf24" stroke-width="4" marker-end="url(#arrow-amber)"/>
  <line x1="1995" y1="1230" x2="1995" y2="1320" stroke="#c084fc" stroke-width="4" marker-end="url(#arrow-purple)"/>

</svg>
"""
    with open(output_svg_path, "w") as f:
        f.write(svg_content)
    print(f"✅ Scalable SVG diagram generated at: {output_svg_path}")

if __name__ == "__main__":
    out_dir = "/Users/rizal/GreenNest_Bloom/docs"
    png_path = os.path.join(out_dir, "GreenNest_Bloom_Architecture_Diagram.png")
    svg_path = os.path.join(out_dir, "GreenNest_Bloom_Architecture_Diagram.svg")
    generate_diagram(png_path, svg_path)
