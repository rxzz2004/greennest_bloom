import xml.etree.ElementTree as ET

def build_drawio_academic_xml(output_path):
    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-10-30T10:30:00.000Z',
        'agent': 'Antigravity AI',
        'version': '21.0.0',
        'type': 'device'
    })
    
    diagram = ET.SubElement(mxfile, 'diagram', {
        'id': 'gnb-academic-architecture',
        'name': 'Green Nest Bloom Architecture'
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
        'pageWidth': '1100',
        'pageHeight': '780',
        'background': '#ffffff',
        'math': '0',
        'shadow': '0'
    })
    
    root = ET.SubElement(graph_model, 'root')
    ET.SubElement(root, 'mxCell', {'id': '0'})
    ET.SubElement(root, 'mxCell', {'id': '1', 'parent': '0'})

    # Styles matching user's uploaded academic image exactly:
    # Black borders, white background, clean font, rounded rectangles
    layer_style = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;align=left;verticalAlign=top;spacingLeft=15;spacingTop=8;fontColor=#000000;fontStyle=1;fontSize=13;fontFamily=Helvetica;"
    box_style = "rounded=1;whiteSpace=wrap;html=1;arcSize=12;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;fontSize=11;fontFamily=Helvetica;align=center;verticalAlign=middle;"
    box_left_style = "rounded=1;whiteSpace=wrap;html=1;arcSize=12;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;fontSize=11;fontFamily=Helvetica;align=left;verticalAlign=top;spacingLeft=12;spacingTop=10;"
    
    cylinder_style = "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1.5;fontColor=#000000;fontFamily=Helvetica;fontSize=11;align=center;"
    
    edge_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#000000;strokeWidth=1.2;fontColor=#000000;fontSize=10;fontFamily=Helvetica;labelBackgroundColor=#ffffff;"
    edge_dashed = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;strokeColor=#000000;strokeWidth=1.2;fontColor=#000000;fontSize=10;fontFamily=Helvetica;labelBackgroundColor=#ffffff;"

    def add_node(c_id, val, style, x, y, w, h):
        cell = ET.SubElement(root, 'mxCell', {
            'id': c_id, 'value': val, 'style': style, 'vertex': '1', 'parent': '1'
        })
        ET.SubElement(cell, 'mxGeometry', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h), 'as': 'geometry'})
        return cell

    def add_edge(e_id, src, trg, label, style, exit_x=None, exit_y=None, entry_x=None, entry_y=None):
        cell_style = style
        if exit_x is not None and exit_y is not None:
            cell_style += f"exitX={exit_x};exitY={exit_y};"
        if entry_x is not None and entry_y is not None:
            cell_style += f"entryX={entry_x};entryY={entry_y};"

        cell = ET.SubElement(root, 'mxCell', {
            'id': e_id, 'value': label, 'style': cell_style, 'edge': '1', 'parent': '1',
            'source': src, 'target': trg
        })
        ET.SubElement(cell, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
        return cell

    # =========================================================================
    # 1. PRESENTATION LAYER
    # =========================================================================
    add_node('layer_pres', 'Presentation Layer: User Interface', layer_style, 40, 30, 800, 130)

    add_node('p_retail', 
             '<b>Customer &amp; Retail Portal</b><br/><span style="font-size:10px;">Browse Botanicals, 7-Step Canvas Studio,<br/>Cart &amp; Order Checkout</span>', 
             box_style, 65, 65, 230, 75)

    add_node('p_b2b', 
             '<b>Corporate &amp; B2B Portal</b><br/><span style="font-size:10px;">Bulk Flower Inquiries, Verified GSTIN,<br/>Single-Event Date Booking</span>', 
             box_style, 325, 65, 230, 75)

    add_node('p_admin', 
             '<b>Admin &amp; Logistics Portal</b><br/><span style="font-size:10px;">Manage Perishables, Decay Sliders,<br/>Live Van Telemetry HUD</span>', 
             box_style, 585, 65, 230, 75)

    # =========================================================================
    # 2. APPLICATION LAYER: FLASK BACKEND
    # =========================================================================
    add_node('layer_app', 'Application Layer: Flask Backend', layer_style, 40, 240, 800, 160)

    add_node('a_auth', 
             '<b>User Login &amp; Security</b><br/>• Login &amp; Registration<br/>• Role Based Access (RBAC)<br/>• Email OTP Verification<br/>• Singleton Admin Guard', 
             box_left_style, 65, 280, 175, 100)

    add_node('a_order', 
             '<b>Orders &amp; GST Engine</b><br/>• Retail Cart Caps (&le; 5)<br/>• Wholesale MOQs (&ge; 20)<br/>• Multi-Tier GST Tax Split<br/>• Coupon Code Verification', 
             box_left_style, 255, 280, 180, 100)

    add_node('a_fefo', 
             '<b>Perishable Spoilage (FEFO)</b><br/>• Batch Harvest Age Tracking<br/>• Dynamic Price Markdowns<br/>• Spoilage Disposal Alerts<br/>• Automated Senescence', 
             box_left_style, 450, 280, 185, 100)

    add_node('a_logistics', 
             '<b>Logistics &amp; Telemetry</b><br/>• Haversine Distance (Kalmane)<br/>• Single-Event Clash Guard<br/>• Real-Time GPS WebSocket<br/>• Driver Telematics Relay', 
             box_left_style, 650, 280, 170, 100)

    # External Email Service to the Right
    add_node('s_email', 
             '<b>Email &amp; Alert Service</b><br/><span style="font-size:10px;">Send OTP to Customer<br/>Admin Security Alerts</span>', 
             box_style, 875, 300, 160, 60)

    # =========================================================================
    # 3. DATABASE LAYER: STORAGE
    # =========================================================================
    add_node('layer_db', 'Database Layer: Storage', layer_style, 40, 480, 800, 120)

    add_node('db_cylinder', 
             '<b>SQLite / MySQL Database: greennest_bloom.db</b><br/><span style="font-size:10px;">Tables: users, email_otps, products, perishable_batches, orders, order_items, event_quotations, delivery_telemetry, admin_sessions</span>', 
             cylinder_style, 180, 515, 520, 65)

    # =========================================================================
    # CONNECTING ARROWS (Matching user's reference diagram cleanly)
    # =========================================================================
    
    # Arrow 1: Retail Portal -> Auth (Login and OTP)
    add_edge('e_login', 'p_retail', 'a_auth', 'Login and OTP', edge_style, exit_x=0.25, exit_y=1.0, entry_x=0.45, entry_y=0.0)

    # Arrow 2: Retail Portal -> Orders (Submit Order)
    add_edge('e_order', 'p_retail', 'a_order', 'Submit Order', edge_style, exit_x=0.75, exit_y=1.0, entry_x=0.25, entry_y=0.0)

    # Arrow 3: B2B Portal -> Orders & Logistics (Book Event / Inquiries)
    add_edge('e_b2b', 'p_b2b', 'a_order', 'Corporate Booking', edge_style, exit_x=0.5, exit_y=1.0, entry_x=0.75, entry_y=0.0)

    # Arrow 4: Admin Portal -> FEFO (Manage Decay)
    add_edge('e_fefo', 'p_admin', 'a_fefo', 'Manage Batches', edge_style, exit_x=0.3, exit_y=1.0, entry_x=0.5, entry_y=0.0)

    # Arrow 5: Admin Portal -> Logistics (Track Telemetry)
    add_edge('e_telemetry', 'p_admin', 'a_logistics', 'Track Fleet &amp; Slots', edge_style, exit_x=0.7, exit_y=1.0, entry_x=0.5, entry_y=0.0)

    # Arrow 6: Dashed Line Auth -> Email Service (Send Verification Code)
    add_edge('e_send_otp', 'a_auth', 's_email', 'Send Verification Code', edge_dashed, exit_x=0.5, exit_y=1.0, entry_x=0.0, entry_y=0.5)

    # Arrow 7: Application Layer -> Database Layer (Database Queries)
    add_edge('e_db', 'layer_app', 'db_cylinder', 'Database Queries: Fetch, Update, and Save Records', edge_style, exit_x=0.5, exit_y=1.0, entry_x=0.5, entry_y=0.0)

    # Save to file
    tree = ET.ElementTree(mxfile)
    ET.indent(tree, space="  ", level=0)
    tree.write(output_path, encoding='utf-8', xml_declaration=True)
    print(f"✅ Exact academic layout Draw.io diagram generated at: {output_path}")

if __name__ == '__main__':
    target = '/Users/rizal/GreenNest_Bloom/docs/GreenNest_Bloom_Architecture.drawio'
    build_drawio_academic_xml(target)
