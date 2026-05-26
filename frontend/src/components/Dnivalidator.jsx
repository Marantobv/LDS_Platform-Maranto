import { useState } from "react";

const STATUS = {
  idle: null,
  loading: "Consultando API...",
};

function ResultRow({ item }) {
  const hasError = !!item.error;
  const coincide = item.coincide;

  const rowClass = hasError
    ? "bg-yellow-50"
    : coincide
    ? "bg-green-50"
    : "bg-red-50";

  const badge = hasError ? (
    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 font-medium">ERROR</span>
  ) : coincide ? (
    <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-medium">✓ Coincide</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium">✗ No coincide</span>
  );

  return (
    <tr className={`border-b border-gray-100 ${rowClass}`}>
      <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{item.solicitud}</td>
      <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{item.dni}</td>
      <td className="px-3 py-2 text-xs text-gray-700">{item.cliente_excel}</td>
      <td className="px-3 py-2 text-xs text-gray-700">{item.nombre_api || item.error}</td>
      <td className="px-3 py-2 text-xs">{badge}</td>
    </tr>
  );
}

export default function DniValidator({ rows }) {
  const [state, setState] = useState("idle");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Preparar filas: necesitamos solicitud, DNI y CLIENTE
  // DNI del cliente está en la columna "DNI_2" (segunda columna DNI)
  const buildPayload = () =>
    rows
      .filter((r) => r.data["DNI_2"] || r.data["DNI"])
      .map((r) => ({
        solicitud: r.data["Solicitud"] ?? "",
        dni: (r.data["DNI_2"] ?? r.data["DNI"] ?? "").trim(),
        cliente: (r.data["CLIENTE"] ?? "").trim(),
      }));

  const handleValidar = async () => {
    setState("loading");
    setError("");
    setResults(null);

    try {
      const payload = buildPayload();
      if (payload.length === 0) {
        setError("No se encontraron filas con DNI válido.");
        setState("idle");
        return;
      }

      const res = await fetch("/api/validar-dni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });

      if (!res.ok) throw new Error("Error del servidor");
      const data = await res.json();
      setResults(data.results);
      setState("done");
    } catch (err) {
      setError(err.message);
      setState("idle");
    }
  };

  const handleDescargar = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/descargar-comparativa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      if (!res.ok) throw new Error("Error al generar el archivo");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "comparativa_dni.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  // Stats
  const total = results?.length ?? 0;
  const coinciden = results?.filter((r) => r.coincide).length ?? 0;
  const noCoinciden = results?.filter((r) => !r.coincide && !r.error).length ?? 0;
  const errores = results?.filter((r) => r.error).length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">Validación de nombres</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Compara el nombre del cliente en el Excel contra el RENIEC
          </p>
        </div>
        <div className="flex gap-2">
          {results && (
            <button
              onClick={handleDescargar}
              disabled={downloading}
              className="text-xs px-3 py-1.5 rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
            >
              {downloading ? "Generando..." : "↓ Descargar Excel"}
            </button>
          )}
          <button
            onClick={handleValidar}
            disabled={state === "loading"}
            className="text-xs px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
          >
            {state === "loading" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10"/>
                </svg>
                Consultando...
              </span>
            ) : (
              "Consultar API"
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Stats */}
      {results && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: total, color: "text-gray-700" },
            { label: "Coinciden", value: coinciden, color: "text-green-700" },
            { label: "No coinciden", value: noCoinciden, color: "text-red-600" },
            { label: "Errores", value: errores, color: "text-yellow-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla de resultados */}
      {results && (
        <div className="overflow-auto rounded-xl border border-gray-100 shadow-sm max-h-96">
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 sticky top-0">
                {["Solicitud", "DNI", "Nombre en Excel", "Nombre en API", "Estado"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 border-b border-gray-100 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((item, i) => (
                <ResultRow key={i} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}