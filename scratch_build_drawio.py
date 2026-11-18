import os
import xml.etree.ElementTree as ET

def create_full_drawio_erd(output_path):
    mxfile = ET.Element('mxfile', {
        'host': 'app.diagrams.net',
        'modified': '2026-10-26T10:45:00.000Z',
        'agent': 'GreenNest Bloom Architecture Team',
        'version': '21.0.0',
        'type': 'device'
    })

    # Styling definitions
    strong_style = "shape=rectangle;whiteSpace=wrap;html=1;fillColor=#1e293b;strokeColor=#38bdf8;strokeWidth=2;fontColor=#ffffff;fontStyle=1;fontSize=12;rounded=0;"
    weak_style = "shape=ext;margin=4;double=1;whiteSpace=wrap;html=1;fillColor=#0f172a;strokeColor=#f59e0b;strokeWidth=2;fontColor=#ffffff;fontStyle=1;fontSize=11;"
    rel_style = "shape=rhombus;whiteSpace=wrap;html=1;fillColor=#0f766e;strokeColor=#2dd4bf;strokeWidth=1.5;fontColor=#ffffff;fontStyle=1;fontSize=10;"
    id_rel_style = "shape=rhombus;double=1;whiteSpace=wrap;html=1;fillColor=#78350f;strokeColor=#fbbf24;strokeWidth=2;fontColor=#ffffff;fontStyle=1;fontSize=10;"
    edge_style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#64748b;strokeWidth=1.5;fontColor=#334155;fontSize=10;"
    attr_edge_style = "edgeStyle=straight;rounded=0;html=1;strokeColor=#94a3b8;strokeWidth=1;endArrow=none;"
    pk_style = "shape=ellipse;whiteSpace=wrap;html=1;fillColor=#fef08a;strokeColor=#ca8a04;strokeWidth=1.5;fontColor=#713f12;fontStyle=4;fontSize=10;"
    pkey_style = "shape=ellipse;whiteSpace=wrap;html=1;dashed=1;dashPattern=3 3;fillColor=#fef3c7;strokeColor=#d97706;strokeWidth=1.5;fontColor=#92400e;fontSize=10;"
    attr_style = "shape=ellipse;whiteSpace=wrap;html=1;fillColor=#f1f5f9;strokeColor=#64748b;fontColor=#0f172a;fontSize=10;"

    def add_node(parent, cell_id, val, style, x, y, w, h):
        cell = ET.SubElement(parent, 'mxCell', {
            'id': cell_id, 'value': val, 'style': style, 'vertex': '1', 'parent': '1'
        })
        ET.SubElement(cell, 'mxGeometry', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h), 'as': 'geometry'})
        return cell

    def add_edge(parent, edge_id, src, trg, label="", custom_style=None):
        cell = ET.SubElement(parent, 'mxCell', {
            'id': edge_id, 'value': label, 'style': custom_style or edge_style, 'edge': '1', 'parent': '1',
            'source': src, 'target': trg
        })
        ET.SubElement(cell, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
        return cell

    # Helper: Place entity with wings of attribute ovals (left & right)
    def place_entity_with_attributes(parent, prefix, ent_name, is_weak, cx, cy, attrs, ent_w=150, ent_h=50):
        style = weak_style if is_weak else strong_style
        ent_id = f"ent_{prefix}"
        add_node(parent, ent_id, ent_name, style, cx, cy, ent_w, ent_h)

        # Distribute attributes: half on left wing, half on right wing
        n = len(attrs)
        half = (n + 1) // 2
        left_attrs = attrs[:half]
        right_attrs = attrs[half:]

        slot_h = 32
        # Left Wing
        start_y_left = cy + (ent_h / 2) - ((len(left_attrs) * slot_h) / 2)
        for i, (name, a_type) in enumerate(left_attrs):
            aid = f"attr_{prefix}_{i}"
            sty = pk_style if a_type == 'pk' else (pkey_style if a_type == 'pkey' else attr_style)
            add_node(parent, aid, name, sty, cx - 145, start_y_left + (i * slot_h), 125, 26)
            add_edge(parent, f"e_a_{prefix}_{i}", aid, ent_id, "", attr_edge_style)

        # Right Wing
        start_y_right = cy + (ent_h / 2) - ((len(right_attrs) * slot_h) / 2)
        for j, (name, a_type) in enumerate(right_attrs):
            idx = half + j
            aid = f"attr_{prefix}_{idx}"
            sty = pk_style if a_type == 'pk' else (pkey_style if a_type == 'pkey' else attr_style)
            add_node(parent, aid, name, sty, cx + ent_w + 20, start_y_right + (j * slot_h), 125, 26)
            add_edge(parent, f"e_a_{prefix}_{idx}", aid, ent_id, "", attr_edge_style)

        return ent_id

    # Master Entity Definitions & Full Attribute Lists
    ENTITIES_DATA = {
        'user': {
            'label': 'USER<br/><i>(users)</i>', 'weak': False,
            'attrs': [
                ('<u>id</u> (PK)', 'pk'), ('email (UK)', 'attr'), ('password_hash', 'attr'), ('full_name', 'attr'), ('company_name', 'attr'),
                ('gstin', 'attr'), ('user_type', 'attr'), ('phone', 'attr'), ('address', 'attr'), ('created_at', 'attr')
            ]
        },
        'admin_session': {
            'label': 'ADMIN_SESSION<br/><i>(admin_sessions)</i>', 'weak': True,
            'attrs': [
                ('id (PK)', 'pk'), ('admin_id (FK)', 'attr'), ('- - session_token - -<br/>(Partial Key)', 'pkey'),
                ('ip_address', 'attr'), ('user_agent', 'attr'), ('is_active', 'attr'), ('last_active', 'attr')
            ]
        },
        'push_token': {
            'label': 'PUSH_NOTIFICATION_TOKEN<br/><i>(push_tokens)</i>', 'weak': True,
            'attrs': [
                ('id (PK)', 'pk'), ('user_id (FK)', 'attr'), ('- - token - -<br/>(Partial Key)', 'pkey'),
                ('platform', 'attr'), ('device_info', 'attr'), ('is_active', 'attr'), ('created_at', 'attr'), ('updated_at', 'attr')
            ]
        },
        'wishlist': {
            'label': 'WISHLIST_ITEM<br/><i>(wishlist_items)</i>', 'weak': True,
            'attrs': [
                ('id (PK)', 'pk'), ('user_id (FK)', 'attr'), ('- - product_id - -<br/>(Partial Key)', 'pkey'), ('created_at', 'attr')
            ]
        },
        'reminder': {
            'label': 'OCCASION_REMINDER<br/><i>(reminders)</i>', 'weak': True,
            'attrs': [
                ('id (PK)', 'pk'), ('user_id (FK)', 'attr'), ('recipient_name', 'attr'), ('occasion_type', 'attr'),
                ('occasion_date', 'attr'), ('preferred_flower_type', 'attr'), ('notes', 'attr'), ('created_at', 'attr')
            ]
        },
        'order': {
            'label': 'ORDER<br/><i>(orders)</i>', 'weak': False,
            'attrs': [
                ('<u>id</u> (PK)', 'pk'), ('user_id (FK)', 'attr'), ('order_number (UK)', 'attr'), ('order_type', 'attr'),
                ('subtotal', 'attr'), ('tax_cgst', 'attr'), ('tax_sgst', 'attr'), ('tax_igst', 'attr'), ('total_amount', 'attr'),
                ('payment_method', 'attr'), ('payment_status', 'attr'), ('order_status', 'attr'), ('shipping_address', 'attr'), ('created_at', 'attr')
            ]
        },
        'order_item': {
            'label': 'ORDER_ITEM<br/><i>(order_items)</i>', 'weak': True,
            'attrs': [
                ('id (PK)', 'pk'), ('order_id (FK)', 'attr'), ('product_id (FK)', 'attr'), ('batch_id (FK)', 'attr'),
                ('- - item_name - -<br/>(Partial Key)', 'pkey'), ('quantity', 'attr'), ('unit_price', 'attr'), ('discount_percent', 'attr'), ('total_price', 'attr')
            ]
        },
        'telemetry': {
            'label': 'DELIVERY_TELEMETRY<br/><i>(telemetry)</i>', 'weak': True,
            'attrs': [
                ('id (PK)', 'pk'), ('order_id (FK, UK)', 'attr'), ('driver_name', 'attr'), ('driver_phone', 'attr'),
                ('vehicle_number', 'attr'), ('current_lat', 'attr'), ('current_lng', 'attr'), ('speed_kmh', 'attr'),
                ('estimated_eta_minutes', 'attr'), ('status', 'attr'), ('updated_at', 'attr')
            ]
        },
        'courier': {
            'label': 'DELIVERY_PARTNER<br/><i>(couriers)</i>', 'weak': False,
            'attrs': [
                ('<u>id</u> (PK)', 'pk'), ('full_name', 'attr'), ('phone', 'attr'), ('email', 'attr'),
                ('vehicle_type', 'attr'), ('vehicle_number', 'attr'), ('status', 'attr'), ('current_lat', 'attr'),
                ('current_lng', 'attr'), ('speed_kmh', 'attr'), ('battery_level', 'attr'), ('rating', 'attr'),
                ('completed_deliveries', 'attr'), ('active_order_id (FK)', 'attr'), ('shift_start', 'attr'),
                ('shift_end', 'attr'), ('zone', 'attr'), ('created_at', 'attr'), ('updated_at', 'attr')
            ]
        },
        'product': {
            'label': 'PRODUCT<br/><i>(products)</i>', 'weak': False,
            'attrs': [
                ('<u>id</u> (PK)', 'pk'), ('name', 'attr'), ('category', 'attr'), ('is_perishable', 'attr'),
                ('base_price', 'attr'), ('b2b_min_quantity', 'attr'), ('b2b_discount_percent', 'attr'), ('hsn_code', 'attr'),
                ('botanical_name', 'attr'), ('sunlight_requirement', 'attr'), ('watering_frequency', 'attr'), ('vase_life_days', 'attr'),
                ('floriography_meaning', 'attr'), ('image_url', 'attr'), ('stock_quantity', 'attr')
            ]
        },
        'batch': {
            'label': 'PERISHABLE_BATCH<br/><i>(batches)</i>', 'weak': True,
            'attrs': [
                ('id (PK)', 'pk'), ('product_id (FK)', 'attr'), ('- - batch_code - -<br/>(Partial Key)', 'pkey'),
                ('harvest_date', 'attr'), ('initial_quantity', 'attr'), ('remaining_quantity', 'attr'), ('current_age_days', 'attr'),
                ('vase_life_days', 'attr'), ('discount_percent', 'attr'), ('status', 'attr')
            ]
        },
        'bouquet': {
            'label': 'CUSTOM_BOUQUET<br/><i>(bouquets)</i>', 'weak': False,
            'attrs': [
                ('<u>id</u> (PK)', 'pk'), ('user_id (FK)', 'attr'), ('bouquet_name', 'attr'), ('wrapping_type', 'attr'),
                ('focal_flower_id (FK)', 'attr'), ('focal_count', 'attr'), ('filler_flower_id (FK)', 'attr'), ('filler_count', 'attr'),
                ('foliage_id (FK)', 'attr'), ('foliage_count', 'attr'), ('arrangement_style', 'attr'), ('fragrance_type', 'attr'),
                ('greeting_card_text', 'attr'), ('canvas_json', 'attr'), ('total_price', 'attr'), ('created_at', 'attr')
            ]
        },
        'review': {
            'label': 'PRODUCT_REVIEW<br/><i>(reviews)</i>', 'weak': True,
            'attrs': [
                ('id (PK)', 'pk'), ('product_id (FK)', 'attr'), ('user_id (FK)', 'attr'), ('reviewer_name', 'attr'),
                ('rating', 'attr'), ('review_title', 'attr'), ('review_text', 'attr'), ('photo_url', 'attr'),
                ('is_verified_purchase', 'attr'), ('helpful_votes', 'attr'), ('created_at', 'attr')
            ]
        },
        'subscription': {
            'label': 'SUBSCRIPTION<br/><i>(subscriptions)</i>', 'weak': False,
            'attrs': [
                ('<u>id</u> (PK)', 'pk'), ('user_id (FK)', 'attr'), ('tier', 'attr'), ('monthly_price', 'attr'),
                ('delivery_address', 'attr'), ('delivery_frequency', 'attr'), ('status', 'attr'), ('start_date', 'attr'),
                ('next_delivery_date', 'attr'), ('created_at', 'attr')
            ]
        },
        'sub_feedback': {
            'label': 'SUBSCRIPTION_FEEDBACK<br/><i>(sub_feedbacks)</i>', 'weak': True,
            'attrs': [
                ('id (PK)', 'pk'), ('subscription_id (FK)', 'attr'), ('user_id (FK)', 'attr'), ('- - delivery_cycle_month - -<br/>(Partial Key)', 'pkey'),
                ('overall_rating', 'attr'), ('freshness_rating', 'attr'), ('variety_rating', 'attr'), ('favorite_flowers', 'attr'),
                ('disliked_flowers', 'attr'), ('comments', 'attr'), ('created_at', 'attr')
            ]
        },
        'quote': {
            'label': 'EVENT_QUOTATION<br/><i>(quotes)</i>', 'weak': False,
            'attrs': [
                ('<u>id</u> (PK)', 'pk'), ('user_id (FK)', 'attr'), ('company_name', 'attr'), ('event_type', 'attr'),
                ('event_date', 'attr'), ('guest_tier', 'attr'), ('venue_address', 'attr'), ('venue_latitude', 'attr'),
                ('venue_longitude', 'attr'), ('distance_km', 'attr'), ('modules_json', 'attr'), ('staged_image_url', 'attr'),
                ('sentiment_prompt', 'attr'), ('estimated_amount', 'attr'), ('admin_approved_amount', 'attr'), ('status', 'attr'), ('created_at', 'attr')
            ]
        },
        'coupon': {
            'label': 'COUPON<br/><i>(coupons)</i>', 'weak': False,
            'attrs': [
                ('<u>id</u> (PK)', 'pk'), ('code (UK)', 'attr'), ('description', 'attr'), ('discount_type', 'attr'),
                ('discount_value', 'attr'), ('min_order_amount', 'attr'), ('max_discount_amount', 'attr'), ('is_active', 'attr'),
                ('valid_from', 'attr'), ('valid_until', 'attr'), ('usage_limit', 'attr'), ('times_used', 'attr'), ('created_at', 'attr')
            ]
        },
        'alert': {
            'label': 'SYSTEM_ALERT<br/><i>(system_alerts)</i>', 'weak': False,
            'attrs': [
                ('<u>id</u> (PK)', 'pk'), ('alert_type', 'attr'), ('recipient_email', 'attr'), ('subject', 'attr'),
                ('body', 'attr'), ('status', 'attr'), ('dispatched_at', 'attr')
            ]
        }
    }

    # =========================================================================
    # TAB 1: MASTER ERD (ALL 18 ENTITIES WITH ALL 200 ATTRIBUTES)
    # 4 Vertical Columns, Perfect Spacing, Clean Orthogonal Connections
    # =========================================================================
    diag_master = ET.SubElement(mxfile, 'diagram', {'id': 'diag_master', 'name': '1. Master ERD (All Attributes)'})
    model_m = ET.SubElement(diag_master, 'mxGraphModel', {
        'dx': '1600', 'dy': '1000', 'grid': '1', 'gridSize': '10', 'guides': '1',
        'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
        'pageScale': '1', 'pageWidth': '2600', 'pageHeight': '2700', 'math': '0', 'shadow': '0'
    })
    root_m = ET.SubElement(model_m, 'root')
    ET.SubElement(root_m, 'mxCell', {'id': '0'})
    ET.SubElement(root_m, 'mxCell', {'id': '1', 'parent': '0'})

    # Master Header
    add_node(root_m, 'm_title', '<b>GREENNEST BLOOM — MASTER CHEN ER DIAGRAM (COMPLETE WITH ALL ATTRIBUTES)</b><br/>All 18 Entities, Relationships, Primary Keys (Underlined), Partial Keys (Dashed), and Attributes in Ovals',
             'text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;fontSize=18;fontColor=#0f172a;', 600, 20, 1400, 40)

    # COLUMN 1: USERS & AUTH DOMAIN (x = 220)
    col1_x = 220
    place_entity_with_attributes(root_m, 'm_user', ENTITIES_DATA['user']['label'], False, col1_x, 120, ENTITIES_DATA['user']['attrs'])

    add_node(root_m, 'm_rel_admin', 'Login Sessions<br/>(Identifying)', id_rel_style, col1_x + 25, 340, 100, 60)
    add_edge(root_m, 'e_m_u_admin', 'ent_m_user', 'm_rel_admin', '1')
    place_entity_with_attributes(root_m, 'm_admin_session', ENTITIES_DATA['admin_session']['label'], True, col1_x, 440, ENTITIES_DATA['admin_session']['attrs'])
    add_edge(root_m, 'e_m_admin_as', 'm_rel_admin', 'ent_m_admin_session', '0..N')

    add_node(root_m, 'm_rel_push', 'Registers<br/>(Identifying)', id_rel_style, col1_x + 25, 620, 100, 60)
    add_edge(root_m, 'e_m_u_push', 'ent_m_user', 'm_rel_push', '1')
    place_entity_with_attributes(root_m, 'm_push_token', ENTITIES_DATA['push_token']['label'], True, col1_x, 720, ENTITIES_DATA['push_token']['attrs'])
    add_edge(root_m, 'e_m_push_pt', 'm_rel_push', 'ent_m_push_token', '0..N')

    add_node(root_m, 'm_rel_wish', 'Saves<br/>(Identifying)', id_rel_style, col1_x + 25, 910, 100, 60)
    add_edge(root_m, 'e_m_u_wish', 'ent_m_user', 'm_rel_wish', '1')
    place_entity_with_attributes(root_m, 'm_wishlist', ENTITIES_DATA['wishlist']['label'], True, col1_x, 1000, ENTITIES_DATA['wishlist']['attrs'])
    add_edge(root_m, 'e_m_wish_wi', 'm_rel_wish', 'ent_m_wishlist', '0..N')

    add_node(root_m, 'm_rel_remind', 'Schedules<br/>(Identifying)', id_rel_style, col1_x + 25, 1140, 100, 60)
    add_edge(root_m, 'e_m_u_remind', 'ent_m_user', 'm_rel_remind', '1')
    place_entity_with_attributes(root_m, 'm_reminder', ENTITIES_DATA['reminder']['label'], True, col1_x, 1240, ENTITIES_DATA['reminder']['attrs'])
    add_edge(root_m, 'e_m_remind_or', 'm_rel_remind', 'ent_m_reminder', '0..N')

    # COLUMN 2: ORDERS & COLD-CHAIN LOGISTICS DOMAIN (x = 800)
    col2_x = 800
    place_entity_with_attributes(root_m, 'm_order', ENTITIES_DATA['order']['label'], False, col2_x, 120, ENTITIES_DATA['order']['attrs'])

    # Link from USER to ORDER
    add_node(root_m, 'm_rel_places', 'Places', rel_style, 500, 115, 90, 60)
    add_edge(root_m, 'e_m_u_places', 'ent_m_user', 'm_rel_places', '1')
    add_edge(root_m, 'e_m_places_ord', 'm_rel_places', 'ent_m_order', '0..N')

    add_node(root_m, 'm_rel_contains', 'Contains<br/>(Identifying)', id_rel_style, col2_x + 25, 420, 100, 60)
    add_edge(root_m, 'e_m_ord_cont', 'ent_m_order', 'm_rel_contains', '1')
    place_entity_with_attributes(root_m, 'm_order_item', ENTITIES_DATA['order_item']['label'], True, col2_x, 520, ENTITIES_DATA['order_item']['attrs'])
    add_edge(root_m, 'e_m_cont_item', 'm_rel_contains', 'ent_m_order_item', '1..N')

    add_node(root_m, 'm_rel_track', 'Streamed By GPS<br/>(Identifying)', id_rel_style, col2_x + 25, 750, 110, 60)
    add_edge(root_m, 'e_m_ord_track', 'ent_m_order', 'm_rel_track', '1')
    place_entity_with_attributes(root_m, 'm_telemetry', ENTITIES_DATA['telemetry']['label'], True, col2_x, 850, ENTITIES_DATA['telemetry']['attrs'])
    add_edge(root_m, 'e_m_track_tel', 'm_rel_track', 'ent_m_telemetry', '0..1')

    add_node(root_m, 'm_rel_dispatch', 'Assigned To', rel_style, col2_x + 25, 1120, 100, 60)
    add_edge(root_m, 'e_m_ord_disp', 'ent_m_order', 'm_rel_dispatch', '0..1')
    place_entity_with_attributes(root_m, 'm_courier', ENTITIES_DATA['courier']['label'], False, col2_x, 1220, ENTITIES_DATA['courier']['attrs'])
    add_edge(root_m, 'e_m_disp_cour', 'm_rel_dispatch', 'ent_m_courier', '0..1')

    # COLUMN 3: BOTANICAL CATALOG & CUSTOM BOUQUETS (x = 1400)
    col3_x = 1400
    place_entity_with_attributes(root_m, 'm_product', ENTITIES_DATA['product']['label'], False, col3_x, 120, ENTITIES_DATA['product']['attrs'])

    add_node(root_m, 'm_rel_fefo', 'Tracks Batches<br/>(Identifying)', id_rel_style, col3_x + 25, 430, 110, 60)
    add_edge(root_m, 'e_m_prod_fefo', 'ent_m_product', 'm_rel_fefo', '1')
    place_entity_with_attributes(root_m, 'm_batch', ENTITIES_DATA['batch']['label'], True, col3_x, 530, ENTITIES_DATA['batch']['attrs'])
    add_edge(root_m, 'e_m_fefo_bat', 'm_rel_fefo', 'ent_m_batch', '0..N')

    add_node(root_m, 'm_rel_stems', 'Supplies Stems', rel_style, col3_x + 25, 770, 110, 60)
    add_edge(root_m, 'e_m_prod_stems', 'ent_m_product', 'm_rel_stems', '1..N')
    place_entity_with_attributes(root_m, 'm_bouquet', ENTITIES_DATA['bouquet']['label'], False, col3_x, 880, ENTITIES_DATA['bouquet']['attrs'])
    add_edge(root_m, 'e_m_stems_bq', 'm_rel_stems', 'ent_m_bouquet', '0..N')

    # Link from USER to CUSTOM_BOUQUET
    add_node(root_m, 'm_rel_designs', 'Designs', rel_style, 1080, 875, 90, 60)
    add_edge(root_m, 'e_m_u_des', 'ent_m_user', 'm_rel_designs', '1')
    add_edge(root_m, 'e_m_des_bq', 'm_rel_designs', 'ent_m_bouquet', '0..N')

    add_node(root_m, 'm_rel_reviews', 'Reviewed In<br/>(Identifying)', id_rel_style, col3_x + 25, 1220, 100, 60)
    add_edge(root_m, 'e_m_prod_rev', 'ent_m_product', 'm_rel_reviews', '1')
    place_entity_with_attributes(root_m, 'm_review', ENTITIES_DATA['review']['label'], True, col3_x, 1320, ENTITIES_DATA['review']['attrs'])
    add_edge(root_m, 'e_m_rev_pr', 'm_rel_reviews', 'ent_m_review', '0..N')

    # Link Product & Batch to Order Item
    add_node(root_m, 'm_rel_ref', 'References', rel_style, 1080, 515, 90, 60)
    add_edge(root_m, 'e_m_p_ref', 'ent_m_product', 'm_rel_ref', '0..1')
    add_edge(root_m, 'e_m_ref_oi', 'm_rel_ref', 'ent_m_order_item', '0..N')

    add_node(root_m, 'm_rel_alloc', 'Allocates', rel_style, 1080, 580, 90, 60)
    add_edge(root_m, 'e_m_b_alloc', 'ent_m_batch', 'm_rel_alloc', '0..1')
    add_edge(root_m, 'e_m_alloc_oi', 'm_rel_alloc', 'ent_m_order_item', '0..N')

    # COLUMN 4: SUBSCRIPTIONS, EVENTS & MARKETING (x = 2000)
    col4_x = 2000
    place_entity_with_attributes(root_m, 'm_subscription', ENTITIES_DATA['subscription']['label'], False, col4_x, 120, ENTITIES_DATA['subscription']['attrs'])

    # Link from USER to SUBSCRIPTION
    add_node(root_m, 'm_rel_sub', 'Subscribes', rel_style, 1720, 115, 90, 60)
    add_edge(root_m, 'e_m_u_sub', 'ent_m_user', 'm_rel_sub', '1')
    add_edge(root_m, 'e_m_sub_s', 'm_rel_sub', 'ent_m_subscription', '0..N')

    add_node(root_m, 'm_rel_eval', 'Evaluates<br/>(Identifying)', id_rel_style, col4_x + 25, 360, 100, 60)
    add_edge(root_m, 'e_m_sub_eval', 'ent_m_subscription', 'm_rel_eval', '1')
    place_entity_with_attributes(root_m, 'm_sub_feedback', ENTITIES_DATA['sub_feedback']['label'], True, col4_x, 460, ENTITIES_DATA['sub_feedback']['attrs'])
    add_edge(root_m, 'e_m_eval_sf', 'm_rel_eval', 'ent_m_sub_feedback', '0..N')

    # EVENT QUOTATION
    place_entity_with_attributes(root_m, 'm_quote', ENTITIES_DATA['quote']['label'], False, col4_x, 780, ENTITIES_DATA['quote']['attrs'])
    add_node(root_m, 'm_rel_quote', 'Requests', rel_style, 1720, 775, 90, 60)
    add_edge(root_m, 'e_m_u_q', 'ent_m_user', 'm_rel_quote', '1')
    add_edge(root_m, 'e_m_q_eq', 'm_rel_quote', 'ent_m_quote', '0..N')

    # COUPON & SYSTEM_ALERT
    place_entity_with_attributes(root_m, 'm_coupon', ENTITIES_DATA['coupon']['label'], False, col4_x, 1180, ENTITIES_DATA['coupon']['attrs'])
    place_entity_with_attributes(root_m, 'm_alert', ENTITIES_DATA['alert']['label'], False, col4_x, 1460, ENTITIES_DATA['alert']['attrs'])

    # Write output to file
    tree = ET.ElementTree(mxfile)
    ET.indent(tree, space="  ", level=0)
    tree.write(output_path, encoding='utf-8', xml_declaration=True)
    print(f"Master Draw.io ERD with all 200 attributes written to: {output_path}")

if __name__ == '__main__':
    target = '/Users/rizal/GreenNest_Bloom/GreenNest_Bloom_ERD.drawio'
    create_full_drawio_erd(target)
