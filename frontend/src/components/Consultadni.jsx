import { useState } from "react";

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconLoader = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: "spin 1s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// Valida que sea exactamente 8 dígitos numéricos
function validateDni(dni) {
  const clean = dni.trim().replace(/\s/g, "");
  if (!/^\d+$/.test(clean)) return { valid: false, error: "Solo se permiten números" };
  if (clean.length !== 8) return { valid: false, error: `${clean.length} dígitos (se requieren 8)` };
  return { valid: true, error: null };
}

// Parsea el textarea: una línea por DNI, filtra vacíos
function parseDniList(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// ── DNI tag chip ────────────────────────────────────────────────────────────
function DniChip({ dni, onRemove }) {
  const { valid, error } = validateDni(dni);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border
      ${valid
        ? "bg-blue-50 border-blue-200 text-blue-700"
        : "bg-red-50 border-red-200 text-red-600"}`}
      title={error || ""}
    >
      {dni}
      {!valid && <span className="text-red-400 text-[10px]">({error})</span>}
      <button onClick={() => onRemove(dni)} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity">
        <IconX />
      </button>
    </span>
  );
}

// ── Result row ──────────────────────────────────────────────────────────────
function ResultRow({ item, index }) {
  const isLoading = item.status === "loading";
  const isOk = item.status === "ok";
  const isError = item.status === "error";

  return (
    <tr className={`border-b border-gray-100 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
      <td className="px-4 py-3 text-xs text-gray-400 font-mono w-10">{index + 1}</td>
      <td className="px-4 py-3 text-sm font-mono text-gray-700 font-medium">{item.dni}</td>
      <td className="px-4 py-3 text-sm text-gray-800">
        {isLoading && (
          <span className="flex items-center gap-2 text-gray-400">
            <IconLoader /> Consultando...
          </span>
        )}
        {isOk && <span className="font-medium text-gray-800">{item.nombre}</span>}
        {isError && <span className="text-red-500 text-xs">{item.error}</span>}
      </td>
      <td className="px-4 py-3">
        {isLoading && <span className="inline-block w-4 h-4" />}
        {isOk && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <IconCheck /> Encontrado
          </span>
        )}
        {isError && (
          <span className="inline-flex items-center gap-1 text-xs text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
            <IconX /> Error
          </span>
        )}
      </td>
    </tr>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ConsultaDNI() {
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState([]); // [{ dni, status, nombre, error }]
  const [hasQueried, setHasQueried] = useState(false);

  const dniList = parseDniList(inputText);
  const validDnis = dniList.filter((d) => validateDni(d).valid);
  const invalidDnis = dniList.filter((d) => !validateDni(d).valid);
  const hasInput = dniList.length > 0;

  const handleRemoveDni = (dni) => {
    const newLines = inputText
      .split("\n")
      .filter((l) => l.trim() !== dni)
      .join("\n");
    setInputText(newLines);
  };

  // Consulta real al backend
  const handleConsultar = async () => {
    if (validDnis.length === 0) return;
    setHasQueried(true);

    // Iniciar todos en "loading"
    setResults(validDnis.map((dni) => ({ dni, status: "loading", nombre: "", error: "" })));

    try {
      const res = await fetch("/api/consultar-dni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dnis: validDnis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");

      setResults(
        data.results.map((r) => ({
          dni: r.dni,
          status: r.error ? "error" : "ok",
          nombre: r.nombre,
          error: r.error || "",
        }))
      );
    } catch (err) {
      setResults(validDnis.map((dni) => ({
        dni,
        status: "error",
        nombre: "",
        error: err.message,
      })));
    }
  };

  const handleLimpiar = () => {
    setInputText("");
    setResults([]);
    setHasQueried(false);
  };

  const isLoading = results.some((r) => r.status === "loading");
  const okCount = results.filter((r) => r.status === "ok").length;
  const errCount = results.filter((r) => r.status === "error").length;

  return (
    <div className="w-1/3 mx-auto">
        <div>
            <div className="flex flex-col gap-6 max-w-2xl w-250">
        </div>
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-gray-800">Consulta DNI</h1>
        <p className="text-xs text-gray-400 mt-0.5">Ingresa uno o varios DNIs para obtener los nombres registrados</p>
      </div>

      {/* Input area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">DNIs a consultar</label>
          {hasInput && (
            <span className="text-xs text-gray-400">
              {dniList.length} ingresado{dniList.length !== 1 ? "s" : ""}
              {invalidDnis.length > 0 && (
                <span className="text-red-400 ml-1">· {invalidDnis.length} inválido{invalidDnis.length !== 1 ? "s" : ""}</span>
              )}
            </span>
          )}
        </div>

        <textarea
          className="w-full px-4 py-2 text-sm font-mono text-gray-700 bg-transparent resize-none outline-none placeholder-gray-300"
          rows={6}
          placeholder={"12345678\n87654321\n11223344"}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setHasQueried(false);
            setResults([]);
          }}
          disabled={isLoading}
        />

        {/* Chips de validación */}
        {hasInput && (
          <div className="px-4 pb-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
            {dniList.map((dni) => (
              <DniChip key={dni} dni={dni} onRemove={handleRemoveDni} />
            ))}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleLimpiar}
            disabled={!hasInput || isLoading}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
          >
            <IconTrash /> Limpiar
          </button>
          <button
            onClick={handleConsultar}
            disabled={validDnis.length === 0 || isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <IconSearch />
            {isLoading ? "Consultando..." : `Consultar${validDnis.length > 0 ? ` (${validDnis.length})` : ""}`}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {hasQueried && results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header tabla */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resultados</span>
            <div className="flex items-center gap-3 text-xs">
              {okCount > 0 && (
                <span className="text-emerald-600 font-medium">{okCount} encontrado{okCount !== 1 ? "s" : ""}</span>
              )}
              {errCount > 0 && (
                <span className="text-red-500 font-medium">{errCount} con error</span>
              )}
              {isLoading && (
                <span className="text-gray-400 flex items-center gap-1"><IconLoader /> procesando...</span>
              )}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 w-10">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">DNI</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Nombre</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Estado</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, i) => (
                <ResultRow key={item.dni} item={item} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
    </div>
  );
}