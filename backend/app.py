from flask import Flask, request, jsonify, send_file
import os
from flask_cors import CORS
import openpyxl
from openpyxl.styles import PatternFill, Font
import io
import requests
import unicodedata

app = Flask(__name__)
CORS(app)

RAILWAY_API = "https://web-production-ae47c.up.railway.app/dni"
RAILWAY_SECRET_KEY = "LDS_DNI"
# ── Helpers ───────────────────────────────────────────────────────────────────

def is_red_font(cell):
    try:
        font = cell.font
        if font is None:
            return False
        color = font.color
        if color is None:
            return False
        if color.type == "rgb" and color.rgb:
            rgb = color.rgb.upper()
            if rgb.startswith("FF") and len(rgb) == 8:
                r, g, b = int(rgb[2:4], 16), int(rgb[4:6], 16), int(rgb[6:8], 16)
                if r > 180 and g < 100 and b < 100:
                    return True
            if len(rgb) == 6:
                r, g, b = int(rgb[0:2], 16), int(rgb[2:4], 16), int(rgb[4:6], 16)
                if r > 180 and g < 100 and b < 100:
                    return True
        if color.type == "indexed" and color.indexed == 2:
            return True
    except Exception:
        pass
    return False


def cell_value(cell):
    val = cell.value
    if val is None:
        return ""
    return str(val).strip()


def normalize(text):
    """Quita tildes, espacios extra y pasa a mayúsculas para comparar."""
    text = text.strip().upper()
    text = " ".join(text.split())  # normaliza espacios múltiples
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )


def build_excel_format_name(resultado):
    """Construye el nombre en formato Excel: APELLIDO_PAT APELLIDO_MAT NOMBRES"""
    ap = resultado.get("apellido_paterno", "").strip()
    am = resultado.get("apellido_materno", "").strip()
    nombres = resultado.get("nombres", "").strip()
    return f"{ap} {am} {nombres}".strip()


def query_dni(dni):
    """Consulta la API de Railway para un DNI. Retorna (nombre_api, error)."""
    try:
        dni = str(dni).strip().zfill(8)  # Rellena con ceros hasta 8 dígitos
        res = requests.get(f"{RAILWAY_API}/{dni}",
                        headers={"Authorization": f"Bearer {RAILWAY_SECRET_KEY}"},
                        timeout=8)
        if res.status_code != 200:
            return None, f"HTTP {res.status_code}"
        data = res.json()
        if not data.get("estado"):
            return None, data.get("mensaje", "No encontrado")
        nombre = build_excel_format_name(data["resultado"])
        return nombre, None
    except requests.Timeout:
        return None, "Timeout"
    except Exception as e:
        return None, str(e)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.route("/api/upload-excel", methods=["POST"])
def upload_excel():
    if "file" not in request.files:
        return jsonify({"error": "No se recibió ningún archivo"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".xlsx"):
        return jsonify({"error": "Solo se aceptan archivos .xlsx"}), 400

    try:
        content = file.read()
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        ws = wb.active

        rows_data = []
        header_row = None

        for row in ws.iter_rows():
            if header_row is None:
                non_empty = [c for c in row if c.value is not None]
                if non_empty:
                    seen_headers = {}
                    header_row = []
                    for c in row:
                        name = cell_value(c)
                        if name in seen_headers:
                            seen_headers[name] += 1
                            name = f"{name}_{seen_headers[name]}"
                        else:
                            seen_headers[name] = 1
                        header_row.append(name)
                continue

            values = [cell_value(c) for c in row]
            if all(v == "" for v in values):
                continue

            row_dict = {}
            red_cells = []
            seen = {}

            for col_idx, cell in enumerate(row):
                col_name = header_row[col_idx] if col_idx < len(header_row) else f"col_{col_idx}"
                if col_name in seen:
                    seen[col_name] += 1
                    col_name = f"{col_name}_{seen[col_name]}"
                else:
                    seen[col_name] = 1
                row_dict[col_name] = cell_value(cell)
                if is_red_font(cell):
                    red_cells.append(col_name)

            rows_data.append({
                "data": row_dict,
                "redCells": red_cells,
                "hasRed": len(red_cells) > 0,
            })

        if not rows_data:
            return jsonify({"error": "El archivo no contiene datos"}), 400

        return jsonify({
            "rows": rows_data,
            "total": len(rows_data),
            "columns": header_row,
        })

    except Exception as e:
        return jsonify({"error": f"Error al procesar el archivo: {str(e)}"}), 500


@app.route("/api/validar-dni", methods=["POST"])
def validar_dni():
    """
    Recibe una lista de filas con DNI y CLIENTE, consulta la API
    y devuelve la comparativa.

    Body JSON: { "rows": [{ "solicitud": "...", "dni": "...", "cliente": "..." }] }
    """
    body = request.get_json()
    if not body or "rows" not in body:
        return jsonify({"error": "Body inválido"}), 400

    results = []
    for item in body["rows"]:
        solicitud = item.get("solicitud", "")
        dni = str(item.get("dni", "")).strip().zfill(8)  # Asegurar 8 dígitos
        cliente_excel = item.get("cliente", "").strip()

        if not dni:
            results.append({
                "solicitud": solicitud,
                "dni": dni,
                "cliente_excel": cliente_excel,
                "nombre_api": "",
                "coincide": False,
                "error": "DNI vacío",
            })
            continue

        nombre_api, error = query_dni(dni)

        if error:
            results.append({
                "solicitud": solicitud,
                "dni": dni,
                "cliente_excel": cliente_excel,
                "nombre_api": "",
                "coincide": False,
                "error": error,
            })
            continue

        coincide = normalize(cliente_excel) == normalize(nombre_api)
        results.append({
            "solicitud": solicitud,
            "dni": dni,
            "cliente_excel": cliente_excel,
            "nombre_api": nombre_api,
            "coincide": coincide,
            "error": None,
        })

    return jsonify({"results": results})


@app.route("/api/descargar-comparativa", methods=["POST"])
def descargar_comparativa():
    """
    Recibe los resultados de la comparativa y genera un Excel descargable.
    Body JSON: { "results": [...] }
    """
    body = request.get_json()
    if not body or "results" not in body:
        return jsonify({"error": "Body inválido"}), 400

    results = body["results"]

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Comparativa DNI"

    # Estilos
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="2563EB")
    green_fill = PatternFill("solid", fgColor="DCFCE7")
    red_fill = PatternFill("solid", fgColor="FEE2E2")
    yellow_fill = PatternFill("solid", fgColor="FEF9C3")

    headers = ["Solicitud", "DNI", "Nombre en Excel", "Nombre en API", "¿Coincide?", "Observación"]
    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx, value=h)
        cell.font = header_font
        cell.fill = header_fill

    for row_idx, item in enumerate(results, 2):
        ws.cell(row=row_idx, column=1, value=item.get("solicitud", ""))
        ws.cell(row=row_idx, column=2, value=item.get("dni", ""))
        ws.cell(row=row_idx, column=3, value=item.get("cliente_excel", ""))
        ws.cell(row=row_idx, column=4, value=item.get("nombre_api", ""))

        if item.get("error"):
            ws.cell(row=row_idx, column=5, value="ERROR")
            ws.cell(row=row_idx, column=6, value=item["error"])
            fill = yellow_fill
        elif item.get("coincide"):
            ws.cell(row=row_idx, column=5, value="SÍ")
            ws.cell(row=row_idx, column=6, value="")
            fill = green_fill
        else:
            ws.cell(row=row_idx, column=5, value="NO")
            ws.cell(row=row_idx, column=6, value="Nombre no coincide")
            fill = red_fill

        for col_idx in range(1, 7):
            ws.cell(row=row_idx, column=col_idx).fill = fill

    # Ajustar ancho de columnas
    for col in ws.columns:
        max_len = max((len(str(c.value or "")) for c in col), default=10)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="comparativa_dni.xlsx",
    )

@app.route("/api/descargar-clasificacion", methods=["POST"])
def descargar_clasificacion():
    """
    Recibe las 3 secciones y genera un Excel con un bloque por sección.
    Body JSON: { "columns": [...], "sections": { "main": [...], "fise": [...], "nofise": [...] } }
    """
    body = request.get_json()
    if not body:
        return jsonify({"error": "Body inválido"}), 400

    columns = body.get("columns", [])
    sections = body.get("sections", {})

    import json
    for key in ["main", "fise", "nofise"]:
        rows = sections.get(key, [])
        if rows:
            print(f"\n=== {key} - primera fila ===")
            print(json.dumps(rows[0], ensure_ascii=False, indent=2))

    SECTION_LABELS = {
        "main": "SIN CLASIFICAR",
        "fise": "FISE",
        "nofise": "NO FISE",
    }

    header_font   = Font(bold=True, color="FFFFFF")
    header_fill   = PatternFill("solid", fgColor="2563EB")
    section_font  = Font(bold=True, color="FFFFFF")
    section_fills = {
        "main":    PatternFill("solid", fgColor="6B7280"),
        "fise":    PatternFill("solid", fgColor="16A34A"),
        "nofise":  PatternFill("solid", fgColor="2563EB"),
    }

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Clasificación"

    current_row = 1

    for section_key in ["main", "fise", "nofise"]:
        rows = sections.get(section_key, [])
        if not rows:
            continue

        # Fila de título de sección
        label = SECTION_LABELS[section_key]
        title_cell = ws.cell(row=current_row, column=1, value=label)
        title_cell.font = section_font
        title_cell.fill = section_fills[section_key]
        ws.merge_cells(start_row=current_row, start_column=1,
                       end_row=current_row, end_column=len(columns))
        current_row += 1

        # Fila de encabezados
        for col_idx, col_name in enumerate(columns, 1):
            cell = ws.cell(row=current_row, column=col_idx, value=col_name)
            cell.font = header_font
            cell.fill = header_fill
        current_row += 1

        # Filas de datos
        parent_fill = PatternFill("solid", fgColor="BBFAD0")
        red_font    = Font(bold=True, color="FF0000")
        parent_font = Font(bold=True)
        for row in rows:
            is_parent = row.get("isParent", False)
            red_cells = row.get("redCells", [])
            for col_idx, col_name in enumerate(columns, 1):
                cell = ws.cell(row=current_row, column=col_idx,
                               value=row.get("data", {}).get(col_name, ""))
                if col_name in red_cells:
                    cell.font = red_font
                elif is_parent:
                    cell.fill = parent_fill
                    cell.font = parent_font
            current_row += 1

        # Fila vacía de separación
        current_row += 1

    # Ajustar ancho de columnas
    for col_idx, col in enumerate(ws.columns, 1):
        col_letter = openpyxl.utils.get_column_letter(col_idx)
        max_len = max((len(str(c.value or "")) for c in col if c.value is not None), default=8)
        ws.column_dimensions[col_letter].width = min(max_len + 4, 50)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="clasificacion.xlsx",
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)