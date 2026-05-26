import { useState } from "react";
import DropZone from "./DropZone";
import LoadingBar from "./LoadingBar";

export default function AvancePEM() {
  const [state, setState] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [tableData, setTableData] = useState(null);

  const handleFile = async (file) => {
    setFilename(file.name);
    setState("loading");
    setProgress(0);

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
      setState("done");
    } catch (err) {
      setErrorMsg(err.message);
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setProgress(0);
    setTableData(null);
    setFilename("");
    setErrorMsg("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header del módulo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-800">Avance PEM</h1>
          <p className="text-xs text-gray-400 mt-0.5">Carga tu archivo Excel para comenzar</p>
        </div>
        {state === "done" && (
          <button
            onClick={reset}
            className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            ← Cargar otro archivo
          </button>
        )}
      </div>

      {/* Contenido */}
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

      {state === "done" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8">
              <path d="M9 12l2 2 4-4M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">
            {filename} cargado — {tableData.total} filas
          </p>
          <p className="text-xs text-gray-400">
            La lógica de este módulo está en construcción.
          </p>
        </div>
      )}
    </div>
  );
}