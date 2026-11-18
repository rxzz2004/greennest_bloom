#!/usr/bin/env python3
"""
Green Nest Bloom - Interactive Database Inspector & Table Editor
View, inspect, search, edit, insert, and delete records across all 17 SQLite tables.

Usage:
  python3 scripts/view_database.py                              # Summary of all tables and row counts
  python3 scripts/view_database.py --table <name>               # View records of a specific table
  python3 scripts/view_database.py --edit <table> --id <id>     # Interactively edit a record in CLI
  python3 scripts/view_database.py --edit <table> --id <id> --set col=val  # Edit record directly via flags
  python3 scripts/view_database.py --serve                      # Launch interactive Web Editor (default: http://localhost:5005)
  python3 scripts/view_database.py --html                       # Generate static HTML view
"""

import sqlite3
import argparse
import sys
import os
import json
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / 'backend' / 'greennest_bloom.db'

def get_connection():
    if not DB_PATH.exists():
        print(f"❌ Error: Database not found at {DB_PATH}")
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_table_schema(conn, table_name):
    c = conn.cursor()
    c.execute(f"PRAGMA table_info({table_name});")
    cols = []
    pk_col = "id"
    for r in c.fetchall():
        col_name = r["name"]
        is_pk = bool(r["pk"])
        if is_pk:
            pk_col = col_name
        cols.append({
            "name": col_name,
            "type": r["type"],
            "notnull": bool(r["notnull"]),
            "dflt_value": r["dflt_value"],
            "pk": is_pk
        })
    return cols, pk_col

def list_tables_summary():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
    tables = [row[0] for row in c.fetchall()]
    
    print("\n" + "=" * 68)
    print(" 🌿 GREEN NEST BLOOM — DATABASE TABLES SUMMARY & INSPECTOR")
    print("=" * 68)
    print(f" {'#':<3} | {'Table Name':<28} | {'Rows':<6} | {'Columns':<8}")
    print("-" * 68)
    
    total_rows = 0
    for idx, table in enumerate(tables, 1):
        c.execute(f"PRAGMA table_info({table});")
        cols = len(c.fetchall())
        c.execute(f"SELECT COUNT(*) FROM {table};")
        count = c.fetchone()[0]
        total_rows += count
        badge = "⭐ (New Feature)" if table in ['coupons', 'product_reviews', 'push_notification_tokens'] else ""
        print(f" {idx:<3} | {table:<28} | {count:<6} | {cols:<8} {badge}")
        
    print("-" * 68)
    print(f" Total Tables: {len(tables)} | Total Records: {total_rows}")
    print("=" * 68)
    print("\n💡 Commands to inspect or edit data:")
    print("  • Launch Interactive Web Editor: python3 scripts/view_database.py --serve")
    print("  • Inspect specific table:        python3 scripts/view_database.py --table <name>")
    print("  • Edit record via CLI:           python3 scripts/view_database.py --edit <table> --id <id> [--set k=v]")
    print("  • Dump all tables:               python3 scripts/view_database.py --all\n")
    conn.close()

def view_table(table_name, limit=25):
    conn = get_connection()
    c = conn.cursor()
    
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table_name,))
    if not c.fetchone():
        print(f"❌ Table '{table_name}' does not exist.")
        conn.close()
        return

    cols, pk_col = get_table_schema(conn, table_name)
    col_names = [col['name'] for col in cols]
    
    c.execute(f"SELECT COUNT(*) FROM {table_name};")
    total_count = c.fetchone()[0]

    c.execute(f"SELECT * FROM {table_name} LIMIT {limit};")
    rows = c.fetchall()
    conn.close()

    print("\n" + "=" * 80)
    print(f" 📋 Table: {table_name} ({total_count} total rows, showing up to {limit})")
    print(f" Primary Key: '{pk_col}'")
    print("=" * 80)
    
    if not rows:
        print(f" (Table '{table_name}' is currently empty)")
        print("=" * 80 + "\n")
        return

    for idx, row in enumerate(rows, 1):
        pk_val = row[pk_col] if pk_col in row.keys() else idx
        print(f"\n--- [Row {idx} • {pk_col}={pk_val}] ---")
        for col in col_names:
            val = row[col]
            val_str = str(val) if val is not None else "NULL"
            if len(val_str) > 90:
                val_str = val_str[:87] + "..."
            print(f"  {col:<24}: {val_str}")
            
    print("\n" + "=" * 80)
    print(f"✏️  To edit any record above: python3 scripts/view_database.py --edit {table_name} --id <id>")
    print("=" * 80 + "\n")

def edit_record_cli(table_name, row_id, set_pairs=None):
    conn = get_connection()
    c = conn.cursor()
    
    cols, pk_col = get_table_schema(conn, table_name)
    valid_cols = [col['name'] for col in cols if not col['pk']]
    
    c.execute(f"SELECT * FROM {table_name} WHERE {pk_col} = ?;", (row_id,))
    existing = c.fetchone()
    if not existing:
        print(f"❌ Error: Record with {pk_col}={row_id} not found in table '{table_name}'.")
        conn.close()
        return

    updates = {}
    if set_pairs:
        for pair in set_pairs:
            if "=" in pair:
                k, v = pair.split("=", 1)
                k = k.strip()
                v = v.strip()
                if k in valid_cols:
                    updates[k] = v
                else:
                    print(f"⚠️  Warning: Column '{k}' is invalid or primary key. Skipping.")
    else:
        print(f"\n--- Current Values for {table_name} ({pk_col}={row_id}) ---")
        for col in cols:
            print(f"  {col['name']:<24}: {existing[col['name']]}")
        print("\n(Enter new values or press [Enter] to keep existing value):")
        for col in cols:
            col_name = col['name']
            if col['pk']:
                continue
            curr = existing[col_name]
            prompt = f"  {col_name} [{curr}]: "
            try:
                new_val = input(prompt)
                if new_val.strip() != "":
                    updates[col_name] = new_val.strip()
            except (KeyboardInterrupt, EOFError):
                print("\nEdit cancelled.")
                conn.close()
                return

    if not updates:
        print("No changes specified.")
        conn.close()
        return

    set_clauses = [f"{k} = ?" for k in updates.keys()]
    values = list(updates.values()) + [row_id]
    sql = f"UPDATE {table_name} SET {', '.join(set_clauses)} WHERE {pk_col} = ?;"
    
    try:
        c.execute(sql, values)
        conn.commit()
        print(f"\n✅ Successfully updated {len(updates)} field(s) in '{table_name}' ({pk_col}={row_id}):")
        for k, v in updates.items():
            print(f"   • {k} -> {v}")
    except Exception as e:
        print(f"❌ Error updating record: {e}")
    finally:
        conn.close()

# -------------------------------------------------------------------
# Standalone Interactive Web-Based Table Editor Server
# -------------------------------------------------------------------
class DatabaseEditorHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if path == "/" or path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(self._render_editor_ui().encode("utf-8"))
            return

        if path == "/api/tables":
            conn = get_connection()
            c = conn.cursor()
            c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
            tables = []
            for r in c.fetchall():
                t = r[0]
                c.execute(f"SELECT COUNT(*) FROM {t};")
                cnt = c.fetchone()[0]
                cols, pk = get_table_schema(conn, t)
                tables.append({"name": t, "row_count": cnt, "columns": cols, "pk_col": pk})
            conn.close()
            self._send_json({"status": "success", "tables": tables})
            return

        if path.startswith("/api/table/"):
            table_name = path.replace("/api/table/", "").split("/")[0]
            search = query.get("search", [""])[0].strip()
            conn = get_connection()
            c = conn.cursor()
            cols, pk_col = get_table_schema(conn, table_name)
            col_names = [col["name"] for col in cols]

            where = ""
            params = []
            if search:
                clauses = [f"CAST({col} AS TEXT) LIKE ?" for col in col_names]
                where = " WHERE " + " OR ".join(clauses)
                params = [f"%{search}%"] * len(col_names)

            c.execute(f"SELECT COUNT(*) FROM {table_name}{where};", params)
            total = c.fetchone()[0]

            c.execute(f"SELECT * FROM {table_name}{where} ORDER BY {pk_col} DESC LIMIT 100;", params)
            rows = [dict(r) for r in c.fetchall()]
            conn.close()
            self._send_json({
                "status": "success",
                "table": table_name,
                "pk_col": pk_col,
                "columns": cols,
                "total": total,
                "rows": rows
            })
            return

        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8')
        try:
            data = json.loads(body) if body else {}
        except Exception:
            self._send_json({"status": "error", "message": "Invalid JSON"}, 400)
            return

        # Update record: POST /api/update or PUT /api/update
        if path == "/api/update":
            table_name = data.get("table")
            row_id = data.get("id")
            updates = data.get("updates", {})

            if not table_name or row_id is None or not updates:
                self._send_json({"status": "error", "message": "Missing table, id, or updates"}, 400)
                return

            conn = get_connection()
            c = conn.cursor()
            cols, pk_col = get_table_schema(conn, table_name)
            valid_cols = {col["name"] for col in cols if not col["pk"]}

            filtered_updates = {k: v for k, v in updates.items() if k in valid_cols}
            if not filtered_updates:
                conn.close()
                self._send_json({"status": "error", "message": "No editable fields"}, 400)
                return

            set_clauses = [f"{k} = ?" for k in filtered_updates.keys()]
            values = list(filtered_updates.values()) + [row_id]
            sql = f"UPDATE {table_name} SET {', '.join(set_clauses)} WHERE {pk_col} = ?;"

            try:
                c.execute(sql, values)
                conn.commit()
                c.execute(f"SELECT * FROM {table_name} WHERE {pk_col} = ?;", (row_id,))
                updated = dict(c.fetchone())
                conn.close()
                self._send_json({"status": "success", "message": "Record updated successfully", "row": updated})
            except Exception as e:
                conn.close()
                self._send_json({"status": "error", "message": str(e)}, 500)
            return

        # Insert record: POST /api/insert
        if path == "/api/insert":
            table_name = data.get("table")
            record = data.get("record", {})
            if not table_name or not record:
                self._send_json({"status": "error", "message": "Missing table or record data"}, 400)
                return

            conn = get_connection()
            c = conn.cursor()
            cols, pk_col = get_table_schema(conn, table_name)
            valid_cols = {col["name"] for col in cols if not col["pk"]}

            filtered = {k: v for k, v in record.items() if k in valid_cols and v != ""}
            if not filtered:
                conn.close()
                self._send_json({"status": "error", "message": "No valid fields provided"}, 400)
                return

            col_names = list(filtered.keys())
            placeholders = ["?"] * len(col_names)
            sql = f"INSERT INTO {table_name} ({', '.join(col_names)}) VALUES ({', '.join(placeholders)});"

            try:
                c.execute(sql, list(filtered.values()))
                conn.commit()
                new_id = c.lastrowid
                conn.close()
                self._send_json({"status": "success", "message": "Record inserted", "id": new_id})
            except Exception as e:
                conn.close()
                self._send_json({"status": "error", "message": str(e)}, 500)
            return

        # Delete record: POST /api/delete
        if path == "/api/delete":
            table_name = data.get("table")
            row_id = data.get("id")
            if not table_name or row_id is None:
                self._send_json({"status": "error", "message": "Missing table or id"}, 400)
                return

            conn = get_connection()
            c = conn.cursor()
            _, pk_col = get_table_schema(conn, table_name)
            sql = f"DELETE FROM {table_name} WHERE {pk_col} = ?;"
            try:
                c.execute(sql, (row_id,))
                conn.commit()
                conn.close()
                self._send_json({"status": "success", "message": f"Deleted record {pk_col}={row_id}"})
            except Exception as e:
                conn.close()
                self._send_json({"status": "error", "message": str(e)}, 500)
            return

        self.send_response(404)
        self.end_headers()

    def _render_editor_ui(self):
        return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Green Nest Bloom — Database Table Editor</title>
<style>
  :root {
    --bg: #0b1120;
    --card: #1e293b;
    --card-header: #0f172a;
    --text: #f8fafc;
    --muted: #94a3b8;
    --border: #334155;
    --primary: #10b981;
    --primary-hover: #059669;
    --blue: #0284c7;
    --rose: #e11d48;
  }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 0; }
  header { background: #0f172a; border-bottom: 1px solid var(--border); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
  .logo { font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
  .layout { display: flex; min-height: calc(100vh - 65px); }
  aside { width: 280px; background: #0f172a; border-right: 1px solid var(--border); padding: 16px 12px; shrink: 0; overflow-y: auto; max-height: calc(100vh - 65px); }
  .table-item { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 14px; margin-bottom: 4px; border-radius: 10px; background: transparent; border: 1px solid transparent; color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.15s; }
  .table-item:hover { background: #1e293b; color: #fff; }
  .table-item.active { background: #064e3b; color: #6ee7b7; border-color: #047857; font-weight: 700; }
  .count-badge { background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-mono: true; }
  main { flex: 1; padding: 24px; overflow-x: auto; }
  .toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .search-input { background: #1e293b; border: 1px solid var(--border); color: #fff; padding: 8px 14px; border-radius: 8px; font-size: 13px; width: 280px; outline: none; }
  .search-input:focus { border-color: var(--primary); }
  .btn { padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: var(--primary); color: #fff; }
  .btn-primary:hover { background: var(--primary-hover); }
  .btn-blue { background: var(--blue); color: #fff; }
  .btn-rose { background: var(--rose); color: #fff; }
  .table-wrapper { background: var(--card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
  table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
  th { background: #0f172a; color: var(--muted); padding: 12px 16px; border-bottom: 1px solid var(--border); font-weight: 700; white-space: nowrap; }
  td { padding: 12px 16px; border-bottom: 1px solid #283548; vertical-align: top; max-width: 320px; word-break: break-word; }
  tr:hover td { background: rgba(255,255,255,0.03); }
  .actions-cell { white-space: nowrap; width: 120px; }
  .btn-sm { padding: 5px 10px; font-size: 11px; border-radius: 6px; }
  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
  .modal-overlay.open { display: flex; }
  .modal-card { background: #1e293b; border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
  .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 20px; }
  .modal-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: #38bdf8; }
  .form-group { margin-bottom: 14px; }
  .form-group label { display: block; font-size: 12px; font-weight: 700; color: var(--muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-control { width: 100%; background: #0f172a; border: 1px solid var(--border); color: #fff; padding: 9px 12px; border-radius: 8px; font-size: 13px; outline: none; }
  .form-control:focus { border-color: var(--primary); }
  textarea.form-control { min-height: 70px; resize: vertical; }
  .toast { position: fixed; bottom: 24px; right: 24px; background: #064e3b; color: #6ee7b7; border: 1px solid #047857; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; box-shadow: 0 10px 25px rgba(0,0,0,0.4); display: none; z-index: 100; animation: fadeIn 0.2s; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
</head>
<body>

<header>
  <div class="logo">🌿 Green Nest Bloom <span>Database Table Inspector & Editor</span></div>
  <div style="font-size: 12px; color: var(--muted);">SQLite DB: <code>backend/greennest_bloom.db</code></div>
</header>

<div class="layout">
  <aside>
    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 12px; padding-left: 6px;">
      17 Database Tables
    </div>
    <div id="table-list">Loading tables...</div>
  </aside>

  <main>
    <div class="toolbar">
      <div>
        <h2 id="current-table-title" style="margin: 0; font-size: 20px; font-weight: 800; color: #fff;">Select a table</h2>
        <span id="current-table-sub" style="font-size: 12px; color: var(--muted);"></span>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <input type="text" id="search-input" class="search-input" placeholder="🔍 Search records..." oninput="debounceSearch()">
        <button class="btn btn-primary" onclick="openAddModal()">➕ Insert Record</button>
      </div>
    </div>

    <div class="table-wrapper">
      <div id="table-data-container" style="overflow-x: auto;">
        <div style="padding: 60px; text-align: center; color: var(--muted);">Select any table from the sidebar to inspect and edit records.</div>
      </div>
    </div>
  </main>
</div>

<!-- Edit / Insert Modal -->
<div id="edit-modal" class="modal-overlay">
  <div class="modal-card">
    <div class="modal-header">
      <h3 id="modal-title">Edit Record</h3>
      <button onclick="closeModal()" style="background: none; border: none; color: var(--muted); font-size: 20px; cursor: pointer;">&times;</button>
    </div>
    <form id="record-form" onsubmit="saveRecord(event)">
      <div id="form-fields"></div>
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
        <button type="button" class="btn" style="background: #334155; color: #fff;" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary" id="save-btn">💾 Save Changes</button>
      </div>
    </form>
  </div>
</div>

<div id="toast" class="toast"></div>

<script>
let currentTable = null;
let currentPkCol = 'id';
let currentColumns = [];
let currentRows = [];
let editRowId = null;
let searchTimer = null;

async function loadTables() {
  try {
    const res = await fetch('/api/tables');
    const data = await res.json();
    const listEl = document.getElementById('table-list');
    listEl.innerHTML = '';
    
    data.tables.forEach((t, idx) => {
      const btn = document.createElement('button');
      btn.className = 'table-item' + (idx === 0 ? ' active' : '');
      btn.id = 'tab-' + t.name;
      btn.onclick = () => selectCategoryTable(t.name);
      btn.innerHTML = `<span>${t.name}</span><span class="count-badge">${t.row_count}</span>`;
      listEl.appendChild(btn);
    });

    if (data.tables.length > 0) {
      selectCategoryTable(data.tables[0].name);
    }
  } catch (err) {
    document.getElementById('table-list').innerHTML = '<div style="color:#f87171; padding:8px;">Failed to load tables</div>';
  }
}

async function selectCategoryTable(tableName, search = '') {
  currentTable = tableName;
  document.querySelectorAll('.table-item').forEach(el => el.classList.remove('active'));
  const activeBtn = document.getElementById('tab-' + tableName);
  if (activeBtn) activeBtn.classList.add('active');

  document.getElementById('current-table-title').innerText = tableName;
  document.getElementById('current-table-sub').innerText = 'Loading records...';

  try {
    const url = `/api/table/${tableName}?search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    const data = await res.json();

    currentPkCol = data.pk_col;
    currentColumns = data.columns;
    currentRows = data.rows;
    document.getElementById('current-table-sub').innerText = `${data.total} total rows (Showing up to 100)`;

    renderTableData(data.columns, data.rows, data.pk_col);
  } catch (err) {
    document.getElementById('table-data-container').innerHTML = '<div style="padding:40px; color:#f87171;">Failed to load table records</div>';
  }
}

function renderTableData(columns, rows, pkCol) {
  const container = document.getElementById('table-data-container');
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div style="padding:50px; text-align:center; color:var(--muted);">No matching records found.</div>';
    return;
  }

  let html = '<table><thead><tr>';
  html += '<th class="actions-cell">Actions</th>';
  columns.forEach(col => {
    html += `<th>${col.name}${col.pk ? ' 🔑' : ''}</th>`;
  });
  html += '</tr></thead><tbody>';

  rows.forEach(row => {
    const pkVal = row[pkCol];
    html += `<tr>`;
    html += `<td class="actions-cell">
      <button class="btn btn-blue btn-sm" onclick="openEditModal(${pkVal})">✏️ Edit</button>
      <button class="btn btn-rose btn-sm" onclick="deleteRow(${pkVal})">🗑️</button>
    </td>`;

    columns.forEach(col => {
      const val = row[col.name];
      if (val === null || val === undefined) {
        html += '<td style="color:#64748b; font-style:italic;">NULL</td>';
      } else if (col.name in {price:1, inrPrice:1, base_price:1, effective_price:1, total_amount:1, final_amount:1, discount_amount:1}) {
        html += `<td><strong style="color:#34d399;">₹${val}</strong></td>`;
      } else if (typeof val === 'string' && val.length > 70) {
        html += `<td title="${val.replace(/"/g, '&quot;')}">${val.substring(0, 67)}...</td>`;
      } else {
        html += `<td>${val}</td>`;
      }
    });
    html += `</tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const val = document.getElementById('search-input').value;
    selectCategoryTable(currentTable, val);
  }, 250);
}

function openEditModal(pkVal) {
  editRowId = pkVal;
  const row = currentRows.find(r => r[currentPkCol] === pkVal);
  if (!row) return;

  document.getElementById('modal-title').innerText = `Edit ${currentTable} (${currentPkCol}=${pkVal})`;
  const container = document.getElementById('form-fields');
  container.innerHTML = '';

  currentColumns.forEach(col => {
    const name = col.name;
    const isPk = col.pk;
    const val = row[name] !== null ? row[name] : '';

    const div = document.createElement('div');
    div.className = 'form-group';
    
    if (isPk) {
      div.innerHTML = `<label>${name} (Primary Key)</label><input type="text" class="form-control" value="${val}" disabled style="opacity:0.6;">`;
    } else if (name.includes('description') || name.includes('meaning') || name.includes('address')) {
      div.innerHTML = `<label>${name}</label><textarea name="${name}" class="form-control">${val}</textarea>`;
    } else {
      div.innerHTML = `<label>${name}</label><input type="text" name="${name}" class="form-control" value="${val}">`;
    }
    container.appendChild(div);
  });

  document.getElementById('edit-modal').classList.add('open');
}

function openAddModal() {
  editRowId = null;
  document.getElementById('modal-title').innerText = `Insert into ${currentTable}`;
  const container = document.getElementById('form-fields');
  container.innerHTML = '';

  currentColumns.forEach(col => {
    const name = col.name;
    if (col.pk) return;

    const div = document.createElement('div');
    div.className = 'form-group';
    if (name.includes('description') || name.includes('meaning') || name.includes('address')) {
      div.innerHTML = `<label>${name}</label><textarea name="${name}" class="form-control"></textarea>`;
    } else {
      div.innerHTML = `<label>${name}</label><input type="text" name="${name}" class="form-control">`;
    }
    container.appendChild(div);
  });

  document.getElementById('edit-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('open');
}

async function saveRecord(e) {
  e.preventDefault();
  const form = document.getElementById('record-form');
  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });

  try {
    let res;
    if (editRowId !== null) {
      // Update
      res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json = JSON.stringify({
          table: currentTable,
          id: editRowId,
          updates: data
        })
      });
    } else {
      // Insert
      res = await fetch('/api/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: currentTable,
          record: data
        })
      });
    }

    const result = await res.json();
    if (result.status === 'success') {
      showToast(result.message || 'Saved successfully!');
      closeModal();
      selectCategoryTable(currentTable);
      loadTables();
    } else {
      alert('Error: ' + result.message);
    }
  } catch (err) {
    alert('Failed to save changes: ' + err);
  }
}

async function deleteRow(pkVal) {
  if (!confirm(`Are you sure you want to delete row with ${currentPkCol}=${pkVal} from '${currentTable}'?`)) return;

  try {
    const res = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: currentTable,
        id: pkVal
      })
    });
    const result = await res.json();
    if (result.status === 'success') {
      showToast(result.message);
      selectCategoryTable(currentTable);
      loadTables();
    } else {
      alert('Error: ' + result.message);
    }
  } catch (err) {
    alert('Failed to delete row: ' + err);
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}

loadTables();
</script>
</body>
</html>
"""

def serve_web_editor(port=5005):
    server = HTTPServer(('127.0.0.1', port), DatabaseEditorHandler)
    url = f"http://127.0.0.1:{port}"
    print("\n" + "=" * 68)
    print(" 🌿 GREEN NEST BLOOM — INTERACTIVE DATABASE TABLE EDITOR")
    print("=" * 68)
    print(f" 🚀 Web Editor Server running at: {url}")
    print(" 📋 Features: Live Table Browsing, Search, Row Editing & Saving to SQLite")
    print(" Press Ctrl+C to stop the server.")
    print("=" * 68 + "\n")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping database editor server.")
        server.server_close()

def main():
    parser = argparse.ArgumentParser(description="Green Nest Bloom Database Inspector & Editor")
    parser.add_argument("--table", "-t", type=str, help="Name of table to inspect")
    parser.add_argument("--all", "-a", action="store_true", help="Dump sample records for all tables")
    parser.add_argument("--edit", "-e", type=str, help="Table name to edit a record in")
    parser.add_argument("--id", type=int, help="Record ID to edit (required with --edit)")
    parser.add_argument("--set", "-s", nargs="+", help="Column updates in format col=value")
    parser.add_argument("--serve", action="store_true", help="Launch interactive Web Editor at http://127.0.0.1:5005")
    parser.add_argument("--port", "-p", type=int, default=5005, help="Port for web editor (default: 5005)")
    parser.add_argument("--limit", "-l", type=int, default=25, help="Number of records to show (default: 25)")
    
    args = parser.parse_args()
    
    if args.serve:
        serve_web_editor(port=args.port)
    elif args.edit:
        if args.id is None:
            print("❌ Error: --id <record_id> is required when using --edit.")
            sys.exit(1)
        edit_record_cli(args.edit, args.id, set_pairs=args.set)
    elif args.table:
        view_table(args.table, limit=args.limit)
    elif args.all:
        conn = get_connection()
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
        tables = [row[0] for row in c.fetchall()]
        conn.close()
        for t in tables:
            view_table(t, limit=5)
    else:
        list_tables_summary()

if __name__ == '__main__':
    main()
