from PIL import Image, ImageDraw, ImageFont

def render_academic_diagram(output_path):
    # Dimensions: 1800 x 1350 for crisp high-resolution print quality
    width, height = 1800, 1350
    img = Image.new("RGB", (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Fonts
    font_bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    font_reg = "/System/Library/Fonts/Supplemental/Arial.ttf"

    f_layer_hdr = ImageFont.truetype(font_bold, 24)
    f_box_hdr = ImageFont.truetype(font_bold, 20)
    f_box_sub = ImageFont.truetype(font_reg, 16)
    f_bullet = ImageFont.truetype(font_reg, 15)
    f_edge = ImageFont.truetype(font_bold, 14)
    f_db_hdr = ImageFont.truetype(font_bold, 20)
    f_db_sub = ImageFont.truetype(font_reg, 16)

    # Helper function: draw rounded box with centered text or bullets
    def draw_box(box, title, bullets=[], sub_text=""):
        x0, y0, x1, y1 = box
        draw.rounded_rectangle([x0, y0, x1, y1], radius=16, fill=(255, 255, 255), outline=(0, 0, 0), width=3)
        if sub_text:
            # Centered title and sub_text
            draw.text(((x0 + x1)/2, y0 + 30), title, fill=(0, 0, 0), font=f_box_hdr, anchor="mm")
            # Wrap or draw sub_text lines
            lines = sub_text.split("\n")
            cur_y = y0 + 60
            for l in lines:
                draw.text(((x0 + x1)/2, cur_y), l, fill=(0, 0, 0), font=f_box_sub, anchor="mm")
                cur_y += 24
        elif bullets:
            # Title on top, bullet points below
            draw.text((x0 + 20, y0 + 30), title, fill=(0, 0, 0), font=f_box_hdr)
            cur_y = y0 + 64
            for b in bullets:
                draw.text((x0 + 20, cur_y), f"• {b}", fill=(0, 0, 0), font=f_bullet)
                cur_y += 26

    # Helper function: draw layer container
    def draw_layer(box, title):
        x0, y0, x1, y1 = box
        draw.rectangle([x0, y0, x1, y1], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
        # Header banner line
        draw.line([(x0, y0 + 44), (x1, y0 + 44)], fill=(0, 0, 0), width=2)
        draw.text((x0 + 20, y0 + 22), title, fill=(0, 0, 0), font=f_layer_hdr, anchor="lm")

    # =========================================================================
    # LAYER 1: PRESENTATION LAYER
    # =========================================================================
    draw_layer([60, 50, 1400, 270], "Presentation Layer: User Interface")
    
    # Box 1.1: Customer Portal
    draw_box([95, 115, 490, 240], "Customer & Retail Portal", sub_text="Browse Botanicals, 7-Step Studio,\nCart & Order Checkout")
    
    # Box 1.2: Corporate Portal
    draw_box([535, 115, 930, 240], "Corporate & B2B Portal", sub_text="Bulk Inquiries, Verified GSTIN,\nSingle-Event Date Booking")

    # Box 1.3: Admin Portal
    draw_box([975, 115, 1370, 240], "Admin & Logistics Console", sub_text="Manage Perishables, Decay Sliders,\nLive Fleet Telemetry HUD")

    # =========================================================================
    # LAYER 2: APPLICATION LAYER
    # =========================================================================
    draw_layer([60, 420, 1400, 720], "Application Layer: Flask Backend")

    # Box 2.1: User Auth
    draw_box([95, 490, 395, 680], "User Login & Security", 
             bullets=["Login & Registration", "Role Based Access (RBAC)", "Email OTP Verification", "Singleton Admin Guard"])

    # Box 2.2: Order & GST Engine
    draw_box([425, 490, 725, 680], "Orders & GST Engine", 
             bullets=["Retail Cart Caps (<= 5)", "Wholesale MOQs (>= 20)", "Multi-Tier GST Tax Split", "Coupon Code Verification"])

    # Box 2.3: FEFO Perishable Spoilage
    draw_box([755, 490, 1055, 680], "Perishable Spoilage (FEFO)", 
             bullets=["Batch Age Tracking", "Dynamic Price Markdowns", "Clearance Discount Curves", "Automated Senescence"])

    # Box 2.4: Logistics & Telemetry
    draw_box([1085, 490, 1375, 680], "Logistics & Telemetry", 
             bullets=["Haversine Distance (Kalmane)", "Single-Event Clash Guard", "Real-Time GPS WebSocket", "Driver Fleet HUD Relay"])

    # Box 2.5: Email Service (Outside right)
    draw_box([1460, 530, 1750, 640], "Email & Alert Service", sub_text="Send OTP to Customer\nAdmin Security Alerts")

    # =========================================================================
    # LAYER 3: DATABASE LAYER
    # =========================================================================
    draw_layer([60, 890, 1400, 1140], "Database Layer: Storage")

    # Database Cylinder
    cx0, cy0, cx1, cy1 = 280, 960, 1180, 1100
    # Top ellipse
    draw.ellipse([cx0, cy0, cx1, cy0 + 40], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
    # Side lines
    draw.line([(cx0, cy0 + 20), (cx0, cy1 - 20)], fill=(0, 0, 0), width=3)
    draw.line([(cx1, cy0 + 20), (cx1, cy1 - 20)], fill=(0, 0, 0), width=3)
    # Bottom ellipse
    draw.arc([cx0, cy1 - 40, cx1, cy1], start=0, end=180, fill=(0, 0, 0), width=3)
    
    # Cylinder Text
    draw.text(((cx0 + cx1)/2, cy0 + 55), "SQLite / Relational Database: greennest_bloom.db", fill=(0, 0, 0), font=f_db_hdr, anchor="mm")
    draw.text(((cx0 + cx1)/2, cy0 + 95), "Tables: users, email_otps, products, perishable_batches, orders, order_items, event_quotations, telemetry", fill=(0, 0, 0), font=f_db_sub, anchor="mm")

    # =========================================================================
    # CONNECTING ARROWS (Crisp, labeled black arrows with white label tags)
    # =========================================================================
    def draw_solid_arrow(points, label="", lbl_pos=None):
        draw.line(points, fill=(0, 0, 0), width=2)
        # Arrowhead at end
        x_end, y_end = points[-1]
        x_prev, y_prev = points[-2]
        if y_end > y_prev: # Downward
            draw.polygon([(x_end, y_end), (x_end - 6, y_end - 12), (x_end + 6, y_end - 12)], fill=(0, 0, 0))
        elif x_end > x_prev: # Rightward
            draw.polygon([(x_end, y_end), (x_end - 12, y_end - 6), (x_end - 12, y_end + 6)], fill=(0, 0, 0))
        
        if label and lbl_pos:
            lx, ly = lbl_pos
            bbox = draw.textbbox((lx, ly), label, font=f_edge, anchor="mm")
            # Clear background for label
            draw.rectangle([bbox[0] - 6, bbox[1] - 4, bbox[2] + 6, bbox[3] + 4], fill=(255, 255, 255))
            draw.text((lx, ly), label, fill=(0, 0, 0), font=f_edge, anchor="mm")

    # 1. Retail Portal -> User Auth (Login and OTP)
    draw_solid_arrow([(245, 240), (245, 490)], "Login and OTP", (245, 345))

    # 2. Retail Portal -> Orders Engine (Submit Order)
    draw_solid_arrow([(450, 240), (450, 310), (520, 310), (520, 490)], "Submit Order", (490, 310))

    # 3. B2B Portal -> Orders Engine (Corporate Inquiry / Quotation)
    draw_solid_arrow([(730, 240), (730, 490)], "Submit B2B Quote", (730, 345))

    # 4. Admin Portal -> Perishable Spoilage (Manage Batches & Decay)
    draw_solid_arrow([(1070, 240), (1070, 370), (950, 370), (950, 490)], "Manage Batches", (1010, 370))

    # 5. Admin Portal -> Logistics & Telemetry (Track Fleet & Slots)
    draw_solid_arrow([(1270, 240), (1270, 490)], "Track Fleet GPS", (1270, 345))

    # 6. Auth -> Email Service (Dashed line)
    dash_pts = [(245, 680), (245, 760), (1605, 760), (1605, 640)]
    for i in range(len(dash_pts) - 1):
        x1, y1 = dash_pts[i]
        x2, y2 = dash_pts[i+1]
        dist = int(((x2 - x1)**2 + (y2 - y1)**2)**0.5)
        steps = dist // 12
        for s in range(0, steps, 2):
            t1 = s / steps
            t2 = min((s + 1) / steps, 1.0)
            draw.line([(x1 + (x2 - x1)*t1, y1 + (y2 - y1)*t1), (x1 + (x2 - x1)*t2, y1 + (y2 - y1)*t2)], fill=(0, 0, 0), width=2)
    # Arrow head for dashed
    draw.polygon([(1605, 640), (1599, 652), (1611, 652)], fill=(0, 0, 0))
    # Dashed label
    lx, ly = 925, 760
    bbox = draw.textbbox((lx, ly), "Send Verification Code / Alerts", font=f_edge, anchor="mm")
    draw.rectangle([bbox[0] - 6, bbox[1] - 4, bbox[2] + 6, bbox[3] + 4], fill=(255, 255, 255))
    draw.text((lx, ly), "Send Verification Code / Alerts", fill=(0, 0, 0), font=f_edge, anchor="mm")

    # 7. Application Layer -> Database Layer (Queries)
    draw_solid_arrow([(730, 720), (730, 960)], "Database Queries: Fetch and Save Records", (730, 805))

    # Save PNG
    img.save(output_path, "PNG", dpi=(300, 300))
    print(f"✅ Academic PNG successfully rendered at: {output_path}")

if __name__ == "__main__":
    out = "/Users/rizal/GreenNest_Bloom/docs/GreenNest_Bloom_Academic_Architecture.png"
    render_academic_diagram(out)
