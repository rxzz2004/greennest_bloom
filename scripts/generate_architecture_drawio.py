import xml.etree.ElementTree as ET
import html

def build_drawio_xml(output_path):
    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-10-30T10:00:00.000Z',
        'agent': 'Antigravity AI',
        'version': '21.0.0',
        'type': 'device'
    })
    
    diagram = ET.SubElement(mxfile, 'diagram', {
        'id': 'gnb-architecture-diag',
        'name': 'High-Level Architecture'
    })
    
    graph_model = ET.SubElement(diagram, 'mxGraphModel', {
        'dx': '1422',
        'dy': '890',
        'grid': '1',
        'gridSize': '10',
        'guides': '1',
        'tooltips': '1',
        'connect': '1',
        'arrows': '1',
        'fold': '1',
        'page': '1',
        'pageScale': '1',
        'pageWidth': '1200',
        'pageHeight': '920',
        'background': '#0f172a',
        'math': '0',
        'shadow': '0'
    })
    
    root = ET.SubElement(graph_model, 'root')
    ET.SubElement(root, 'mxCell', {'id': '0'})
    ET.SubElement(root, 'mxCell', {'id': '1', 'parent': '0'})

    # Styling presets
    tier_style = "rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#182235;strokeColor=#334155;strokeWidth=2;align=left;verticalAlign=top;spacingLeft=20;spacingTop=12;fontColor=#38bdf8;fontStyle=1;fontSize=14;"
    
    card_t1 = "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#1e293b;strokeColor=#38bdf8;strokeWidth=1.5;fontColor=#ffffff;fontSize=12;align=center;"
    card_t2 = "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#1e293b;strokeColor=#34d399;strokeWidth=1.5;fontColor=#ffffff;fontSize=12;align=center;"
    card_t3 = "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#1e293b;strokeColor=#fbbf24;strokeWidth=1.5;fontColor=#ffffff;fontSize=12;align=center;"
    card_t4 = "rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#1e293b;strokeColor=#c084fc;strokeWidth=1.5;fontColor=#ffffff;fontSize=12;align=center;"
    
    edge_rest = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#34d399;strokeWidth=2.5;fontColor=#34d399;fontSize=11;labelBackgroundColor=#0f172a;"
    edge_wss = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#38bdf8;strokeWidth=2.5;fontColor=#38bdf8;fontSize=11;startArrow=classic;startFill=1;labelBackgroundColor=#0f172a;"
    edge_inter = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#fbbf24;strokeWidth=2;fontColor=#fbbf24;fontSize=11;labelBackgroundColor=#0f172a;"
    edge_db = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#c084fc;strokeWidth=2;fontColor=#c084fc;fontSize=11;labelBackgroundColor=#0f172a;"

    def add_node(c_id, val, style, x, y, w, h):
        cell = ET.SubElement(root, 'mxCell', {
            'id': c_id, 'value': val, 'style': style, 'vertex': '1', 'parent': '1'
        })
        ET.SubElement(cell, 'mxGeometry', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h), 'as': 'geometry'})
        return cell

    def add_edge(e_id, src, trg, label, style):
        cell = ET.SubElement(root, 'mxCell', {
            'id': e_id, 'value': label, 'style': style, 'edge': '1', 'parent': '1',
            'source': src, 'target': trg
        })
        ET.SubElement(cell, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
        return cell

    # Title Banner
    add_node('hdr_title', 
             '<b>GREEN NEST BLOOM — HIGH-LEVEL SYSTEM ARCHITECTURE</b><br/><span style="font-size:11px;color:#94a3b8;font-weight:normal;">Decoupled Multi-Tier Floriculture Commerce, Perishable Spoilage Daemon &amp; Cold-Chain Telemetry Platform</span>', 
             'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;fontColor=#ffffff;fontSize=16;', 
             100, 15, 1000, 45)

    # =========================================================================
    # TIER 1: PRESENTATION LAYER
    # =========================================================================
    add_node('tier1', 'TIER 1: PRESENTATION LAYER (React 18 SPA + Tailwind CSS)', tier_style, 60, 75, 1080, 145)
    
    add_node('p_b2c', '<b>B2C Retail Portal</b><br/><span style="font-size:10px;color:#94a3b8;">Fabric.js 7-Step Canvas<br/>Retail Cart Caps (&le;5)</span>', card_t1, 85, 120, 240, 75)
    add_node('p_b2b', '<b>B2B Corporate Portal</b><br/><span style="font-size:10px;color:#94a3b8;">GSTIN Verification<br/>Bulk Wholesale MOQs (&ge;20)</span>', card_t1, 350, 120, 240, 75)
    add_node('p_admin', '<b>Singleton Admin Console</b><br/><span style="font-size:10px;color:#94a3b8;">FEFO Decay Sliders<br/>Single Session Guard</span>', card_t1, 615, 120, 240, 75)
    add_node('p_driver', '<b>Driver Mobile PWA</b><br/><span style="font-size:10px;color:#94a3b8;">HTML5 Geolocation<br/>1-Sec GPS Transponder</span>', card_t1, 880, 120, 235, 75)

    # =========================================================================
    # TIER 2: GATEWAY & SECURITY LAYER
    # =========================================================================
    add_node('tier2', 'TIER 2: API GATEWAY &amp; SECURITY LAYER (Python Flask 3.x - Port 5001)', tier_style, 60, 275, 1080, 130)
    
    add_node('g_rest', '<b>Flask REST API Gateway</b><br/><span style="font-size:10px;color:#94a3b8;">WSGI Request Dispatcher &amp; Blueprint Hub</span>', card_t2, 90, 320, 310, 65)
    add_node('g_auth', '<b>RBAC &amp; Auth Middleware</b><br/><span style="font-size:10px;color:#94a3b8;">Email OTP &amp; PBKDF2 Password Security</span>', card_t2, 445, 320, 310, 65)
    add_node('g_lock', '<b>Singleton Session Guard</b><br/><span style="font-size:10px;color:#94a3b8;">Redis Active Admin Concurrency Lock</span>', card_t2, 800, 320, 315, 65)

    # =========================================================================
    # TIER 3: CORE APPLICATION SERVICES
    # =========================================================================
    add_node('tier3', 'TIER 3: CORE APPLICATION SERVICES (Business Logic Engines)', tier_style, 60, 460, 1080, 145)
    
    add_node('s_wss', '<b>WebSocket Telemetry Hub</b><br/><span style="font-size:10px;color:#94a3b8;">Flask-SocketIO (WSS)<br/>Real-Time GPS Broadcast</span>', card_t3, 85, 505, 240, 75)
    add_node('s_cart', '<b>Cart &amp; Order Manager</b><br/><span style="font-size:10px;color:#94a3b8;">Purchase Caps &amp; MOQs<br/>Multi-Tier GST Engine</span>', card_t3, 350, 505, 240, 75)
    add_node('s_geo', '<b>Haversine Logistics Engine</b><br/><span style="font-size:10px;color:#94a3b8;">Great-Circle Radius (2,500km)<br/>Single-Event Clash Guard</span>', card_t3, 615, 505, 240, 75)
    add_node('s_fefo', '<b>Perishable Spoilage Daemon</b><br/><span style="font-size:10px;color:#94a3b8;">Midnight Celery Cron<br/>FEFO Curves &amp; SMTP Alerts</span>', card_t3, 880, 505, 235, 75)

    # =========================================================================
    # TIER 4: PERSISTENCE, BROKER & EXTERNAL
    # =========================================================================
    add_node('tier4', 'TIER 4: PERSISTENCE, BROKER &amp; EXTERNAL INTEGRATIONS', tier_style, 60, 660, 1080, 145)
    
    add_node('d_mysql', '<b>MySQL 8.0 Server</b><br/><span style="font-size:10px;color:#94a3b8;">18 Relational Tables (ACID)<br/>Batches, Orders &amp; Datasets</span>', card_t4, 85, 705, 240, 75)
    add_node('d_redis', '<b>Redis 7.0 In-Memory</b><br/><span style="font-size:10px;color:#94a3b8;">Celery Task Queue Broker<br/>Singleton Admin Token Cache</span>', card_t4, 350, 705, 240, 75)
    add_node('d_razor', '<b>Razorpay Sandbox</b><br/><span style="font-size:10px;color:#94a3b8;">UPI, Cards &amp; Net Banking<br/>Digital Payment Webhooks</span>', card_t4, 615, 705, 240, 75)
    add_node('d_osm', '<b>OpenStreetMap / Leaflet</b><br/><span style="font-size:10px;color:#94a3b8;">GIS Tile Cartography<br/>Van Route Projection</span>', card_t4, 880, 705, 235, 75)

    # =========================================================================
    # CONNECTING EDGES (Straight, Zero Spaghetti Crossing)
    # =========================================================================
    # Tier 1 -> Tier 2 (REST)
    add_edge('e1', 'p_b2c', 'g_rest', 'HTTPS / REST', edge_rest)
    add_edge('e2', 'p_b2b', 'g_rest', '', edge_rest)
    
    # Tier 1 (Driver & Admin) <-> Tier 3 WebSocket (WSS)
    add_edge('e3', 'p_driver', 's_wss', 'WSS (Lat/Lng)', edge_wss)
    
    # Tier 2 -> Tier 3 (Service Dispatch)
    add_edge('e4', 'g_rest', 's_cart', 'Internal Dispatch', edge_inter)
    add_edge('e5', 'g_auth', 's_geo', '', edge_inter)
    add_edge('e6', 'g_lock', 's_fefo', 'Cron Trigger', edge_inter)
    
    # Tier 3 -> Tier 4 (Persistence & External)
    add_edge('e7', 's_cart', 'd_mysql', 'Orders / Batches', edge_db)
    add_edge('e8', 's_cart', 'd_razor', 'Payment API', edge_inter)
    add_edge('e9', 's_geo', 'd_osm', 'GIS Tiles', edge_inter)
    add_edge('e10', 's_fefo', 'd_redis', 'Celery Queue', edge_db)

    # Save to file
    tree = ET.ElementTree(mxfile)
    ET.indent(tree, space="  ", level=0)
    tree.write(output_path, encoding='utf-8', xml_declaration=True)
    print(f"✅ Clean Draw.io architecture diagram generated at: {output_path}")

if __name__ == '__main__':
    target = '/Users/rizal/GreenNest_Bloom/docs/GreenNest_Bloom_Architecture.drawio'
    build_drawio_xml(target)
