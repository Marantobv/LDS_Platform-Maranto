/**
 * Lógica de agrupación y elección de padre.
 *
 * Regla de agrupación:
 *   - Clave = CS. + FASES(SUM) + MU + M3 + M6 + SOLO_CONEXION_NORMALIZADA
 *   - Si SOLO CONEXIÓN empieza con "SOLO CNX" → se trata como "" (mismo grupo)
 *
 * Regla de padre:
 *   - Menor puntaje de observaciones gana (OBS 1, OBS 2, DEUDA)
 *   - En empate, el primero en orden original
 */

function normalizeConexion(value) {
  const v = (value ?? "").trim().toUpperCase();
  if (v.startsWith("SOLO CNX")) return "__SOLO_CNX__";
  if (v === "ALERO" || v === "FACHADA") return "__ALERO_FACHADA__";
  return v;
}

function observationScore(row) {
  let score = 0;
  if ((row.data["OBS 1"] ?? "").trim() !== "") score += 1;
  if ((row.data["OBS 2"] ?? "").trim() !== "") score += 1;
  if ((row.data["DEUDA"] ?? "").trim().toUpperCase() === "SI") score += 1;
  return score;
}

function groupKey(row) {
  const d = row.data;
  return [
    (d["CS."] ?? "").trim(),
    (d["FASES (SUM)"] ?? "").trim(),
    (d["MU"] ?? "").trim(),
    (d["M3"] ?? "").trim(),
    (d["M6"] ?? "").trim(),
    normalizeConexion(d["SOLO CONEXIÓN"]),
  ].join("||");
}

export function groupAndSortRows(rows) {
  // 1. Agrupar manteniendo orden original
  const groupMap = new Map();
  rows.forEach((row) => {
    const key = groupKey(row);
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(row);
  });

  // 2. Por cada grupo, elegir padre y ordenar
  const result = [];
  groupMap.forEach((groupRows) => {
    // Padre = menor puntaje, en empate el primero
    const scored = groupRows.map((r, i) => ({ row: r, score: observationScore(r), idx: i }));
    scored.sort((a, b) => a.score - b.score || a.idx - b.idx);

    const parentId = scored[0].row._id;

    // Marcar padre/hijo y ordenar: padre primero, luego hijos en orden original
    const parent = { ...scored[0].row, isParent: true };
    const children = groupRows
      .filter((r) => r._id !== parentId)
      .map((r) => ({ ...r, isParent: false }));

    result.push(parent, ...children);
  });

  return result;
}