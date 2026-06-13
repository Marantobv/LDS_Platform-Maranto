import { useState } from "react";
import Sidebar from "./components/Sidebar";
import AvancePEM from "./components/AvancePEM";
import DropZone from "./components/DropZone";
import LoadingBar from "./components/LoadingBar";
import ExcelTable from "./components/ExcelTable";
import DniValidator from "./components/DniValidator";
import ConsultaDNI from "./components/ConsultaDNI";

const PALETTE = [
  { btn: "bg-violet-100 text-violet-700 border-violet-300 hover:bg-violet-200", active: "bg-violet-600 text-white border-violet-600" },
  { btn: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200",     active: "bg-amber-500 text-white border-amber-500" },
  { btn: "bg-pink-100 text-pink-700 border-pink-300 hover:bg-pink-200",         active: "bg-pink-500 text-white border-pink-500" },
  { btn: "bg-teal-100 text-teal-700 border-teal-300 hover:bg-teal-200",         active: "bg-teal-600 text-white border-teal-600" },
  { btn: "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200", active: "bg-orange-500 text-white border-orange-500" },
];

const getColor = (name, index) => PALETTE[index % PALETTE.length];

export default function App() {
  const [state, setState] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [tableData, setTableData] = useState(null);
  const [filename, setFilename] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeModule, setActiveModule] = useState("presupuestos");
  const [selectedProyectista, setSelectedProyectista] = useState(null);
  const [proyectistaCol, setProyectistaCol] = useState(null);

  const handleFile = async (file) => {
    setFilename(file.name);
    setState("loading");
    setProgress(0);
    setSelectedProyectista(null);

    const start = Date.now();
    const animDuration = 2500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(90, (elapsed / animDuration) * 90);
      setProgress(p);
      if (p < 90) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-excel", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error del servidor");
      }

      const data = await res.json();
      setProgress(100);
      await new Promise((r) => setTimeout(r, 400));
      setTableData(data);
      setState("select");
    } catch (err) {
      setErrorMsg(err.message);
      setState("error");
    }
  };

  const handleSelectProyectista = (name) => {
    setSelectedProyectista(name);
    setState("done");
  };

  const reset = () => {
    setState("idle");
    setProgress(0);
    setTableData(null);
    setFilename("");
    setErrorMsg("");
    setSelectedProyectista(null);
  };

  // Columna proyectista = primera columna del Excel (columna A)
  const colProyectista = tableData?.columns?.[0] ?? null;

  // Detectar nombres únicos de proyectistas presentes en el Excel
  const availableProyectistas = tableData && colProyectista
    ? [...new Set(
        tableData.rows
          .map((r) => (r.data[colProyectista] ?? "").trim())
          .filter(Boolean)
      )]
    : [];

  // Filtrar filas del proyectista seleccionado
  const filteredRows = tableData && selectedProyectista && colProyectista
    ? tableData.rows.filter((r) => (r.data[colProyectista] ?? "").trim() === selectedProyectista)
    : [];

  const handleModuleSelect = (mod) => {
    setActiveModule(mod);
    // Reset presupuestos state when switching modules
    if (mod !== "presupuestos") {
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      <Sidebar activeModule={activeModule} onSelect={handleModuleSelect} />
      <div className="flex-1 flex flex-col min-w-0">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800 text-sm">
            {activeModule === "presupuestos" ? "Formato Presupuestos"
              : activeModule === "avance-pem" ? "Avance PEM"
              : "Consulta DNI"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Indicador de proyectista activo */}
          {selectedProyectista && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Proyectista:</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getColor(selectedProyectista, availableProyectistas.indexOf(selectedProyectista)).active}`}>
                {selectedProyectista}
              </span>
              <button
                onClick={() => setState("select")}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                cambiar
              </button>
            </div>
          )}
          {state === "done" && (
            <button
              onClick={reset}
              className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              ← Cargar otro archivo
            </button>
          )}
        </div>
      </header>

      <main className="w-full px-6 py-8 h-full">
        {activeModule === "avance-pem" ? (
          <AvancePEM />
        ) : activeModule === "consulta-dni" ? (
          <ConsultaDNI />
        ) : (
          <>
        {state === "idle" && <DropZone onFile={handleFile} />}
        {state === "loading" && <LoadingBar progress={progress} />}

        {state === "error" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p className="text-sm text-red-500">{errorMsg}</p>
            <button onClick={reset} className="text-xs text-blue-600 hover:underline">
              Intentar de nuevo
            </button>
          </div>
        )}

        {state === "select" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">¿Quién eres?</p>
              <p className="text-xs text-gray-400 mt-1">
                {filename} · {tableData?.total} solicitudes en total
              </p>
            </div>
            <div className="flex gap-4">
              {availableProyectistas.length > 0 ? (
                availableProyectistas.map((name, idx) => {
                  const count = tableData.rows.filter(
                    (r) => (r.data[colProyectista] ?? "").trim() === name
                  ).length;
                  const color = getColor(name, idx);
                  return (
                    <button
                      key={name}
                      onClick={() => handleSelectProyectista(name)}
                      className={`flex flex-col items-center gap-2 px-8 py-6 rounded-2xl border-2 transition-all duration-150 hover:scale-105 ${color.btn}`}
                    >
                      <span className="text-2xl font-bold">{name[0]}</span>
                      <span className="text-sm font-semibold">{name}</span>
                      <span className="text-xs opacity-70">{count} solicitudes</span>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400">
                  No se encontraron proyectistas conocidos en este archivo.
                </p>
              )}
            </div>
          </div>
        )}

        {state === "done" && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-400">
                <span className="text-gray-600 font-medium">{filename}</span> · {filteredRows.length} solicitudes
              </p>
              <ExcelTable columns={tableData.columns} rows={filteredRows} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <DniValidator rows={filteredRows} />
            </div>
          </div>
        )}
        </>
        )}
      </main>
      </div>
    </div>
  );
}