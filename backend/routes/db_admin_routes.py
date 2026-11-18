import sqlite3
from flask import Blueprint, request, jsonify
from pathlib import Path

db_admin_bp = Blueprint("db_admin_bp", __name__)
DB_PATH = Path(__file__).resolve().parent.parent / "greennest_bloom.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_allowed_tables():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [r[0] for r in c.fetchall()]
    conn.close()
    return tables

def get_table_schema(table_name):
    conn = get_db_connection()
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
    conn.close()
    return cols, pk_col

@db_admin_bp.route("/tables", methods=["GET"])
def list_tables():
    """List all database tables with column info and total row counts"""
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
        table_names = [r[0] for r in c.fetchall()]

        result = []
        for t in table_names:
            c.execute(f"SELECT COUNT(*) FROM {t};")
            row_count = c.fetchone()[0]
            cols, pk_col = get_table_schema(t)
            result.append({
                "name": t,
                "row_count": row_count,
                "columns": cols,
                "pk_column": pk_col
            })
        conn.close()
        return jsonify({"status": "success", "tables": result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@db_admin_bp.route("/table/<table_name>", methods=["GET"])
def get_table_data(table_name):
    """Fetch paginated records for a specific table with optional search"""
    allowed = get_allowed_tables()
    if table_name not in allowed:
        return jsonify({"status": "error", "message": f"Table '{table_name}' does not exist"}), 404

    try:
        limit = max(1, min(int(request.args.get("limit", 50)), 500))
        offset = max(0, int(request.args.get("offset", 0)))
        search = request.args.get("search", "").strip()

        cols, pk_col = get_table_schema(table_name)
        col_names = [c["name"] for c in cols]

        conn = get_db_connection()
        c = conn.cursor()

        where_clause = ""
        params = []
        if search:
            search_conditions = []
            for col in col_names:
                search_conditions.append(f"CAST({col} AS TEXT) LIKE ?")
                params.append(f"%{search}%")
            where_clause = " WHERE " + " OR ".join(search_conditions)

        c.execute(f"SELECT COUNT(*) FROM {table_name}{where_clause};", params)
        total_rows = c.fetchone()[0]

        query = f"SELECT * FROM {table_name}{where_clause} ORDER BY {pk_col} DESC LIMIT ? OFFSET ?;"
        c.execute(query, params + [limit, offset])
        rows = [dict(r) for r in c.fetchall()]
        conn.close()

        return jsonify({
            "status": "success",
            "table_name": table_name,
            "pk_column": pk_col,
            "columns": cols,
            "total_rows": total_rows,
            "limit": limit,
            "offset": offset,
            "rows": rows
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@db_admin_bp.route("/table/<table_name>/<row_id>", methods=["PUT"])
def update_table_row(table_name, row_id):
    """Update specific fields of an existing row in any table"""
    allowed = get_allowed_tables()
    if table_name not in allowed:
        return jsonify({"status": "error", "message": f"Table '{table_name}' does not exist"}), 404

    cols, pk_col = get_table_schema(table_name)
    valid_col_names = {c["name"] for c in cols}

    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"status": "error", "message": "Invalid JSON payload"}), 400

    update_fields = {}
    for k, v in data.items():
        if k in valid_col_names and k != pk_col:
            update_fields[k] = v

    if not update_fields:
        return jsonify({"status": "error", "message": "No editable fields provided"}), 400

    try:
        conn = get_db_connection()
        c = conn.cursor()

        set_clauses = [f"{col} = ?" for col in update_fields.keys()]
        values = list(update_fields.values()) + [row_id]

        sql = f"UPDATE {table_name} SET {', '.join(set_clauses)} WHERE {pk_col} = ?;"
        c.execute(sql, values)
        conn.commit()

        # Fetch the updated row
        c.execute(f"SELECT * FROM {table_name} WHERE {pk_col} = ?;", (row_id,))
        updated_row = c.fetchone()
        conn.close()

        if not updated_row:
            return jsonify({"status": "error", "message": f"Row with {pk_col}={row_id} not found"}), 404

        return jsonify({
            "status": "success",
            "message": f"Successfully updated row in '{table_name}'",
            "updated_row": dict(updated_row)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@db_admin_bp.route("/table/<table_name>", methods=["POST"])
def insert_table_row(table_name):
    """Insert a new record into any table"""
    allowed = get_allowed_tables()
    if table_name not in allowed:
        return jsonify({"status": "error", "message": f"Table '{table_name}' does not exist"}), 404

    cols, pk_col = get_table_schema(table_name)
    valid_col_names = {c["name"] for c in cols}

    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"status": "error", "message": "Invalid JSON payload"}), 400

    insert_fields = {}
    for k, v in data.items():
        if k in valid_col_names and (k != pk_col or v is not None):
            insert_fields[k] = v

    if not insert_fields:
        return jsonify({"status": "error", "message": "No valid fields provided for insertion"}), 400

    try:
        conn = get_db_connection()
        c = conn.cursor()

        col_names = list(insert_fields.keys())
        placeholders = ["?"] * len(col_names)
        values = list(insert_fields.values())

        sql = f"INSERT INTO {table_name} ({', '.join(col_names)}) VALUES ({', '.join(placeholders)});"
        c.execute(sql, values)
        conn.commit()
        new_id = c.lastrowid

        c.execute(f"SELECT * FROM {table_name} WHERE {pk_col} = ?;", (new_id,))
        new_row = c.fetchone()
        conn.close()

        return jsonify({
            "status": "success",
            "message": f"Successfully created record in '{table_name}'",
            "inserted_id": new_id,
            "row": dict(new_row) if new_row else None
        }), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@db_admin_bp.route("/table/<table_name>/<row_id>", methods=["DELETE"])
def delete_table_row(table_name, row_id):
    """Delete a record by primary key"""
    allowed = get_allowed_tables()
    if table_name not in allowed:
        return jsonify({"status": "error", "message": f"Table '{table_name}' does not exist"}), 404

    _, pk_col = get_table_schema(table_name)

    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute(f"DELETE FROM {table_name} WHERE {pk_col} = ?;", (row_id,))
        rows_affected = c.rowcount
        conn.commit()
        conn.close()

        if rows_affected == 0:
            return jsonify({"status": "error", "message": f"Row with {pk_col}={row_id} not found"}), 404

        return jsonify({
            "status": "success",
            "message": f"Deleted record {pk_col}={row_id} from '{table_name}'"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
