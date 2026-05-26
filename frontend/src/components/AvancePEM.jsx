import { useState, useRef } from "react";
import DropZone from "./DropZone";
import LoadingBar from "./LoadingBar";

// ── Icons ──────────────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconFile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

// ── Step indicator ─────────────────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ["Base maestra", "Avance PEM", "Preview", "Descarga"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-200
                ${done ? "bg-emerald-500 border-emerald-500 text-white" :
                  active ? "bg-blue-600 border-blue-600 text-white" :
                  "bg-white border-gray-200 text-gray-400"}`}>
                {done ? <IconCheck /> : num}
              </div>
              <span className={`text-xs whitespace-nowrap transition-colors duration-200
                ${active ? "text-blue-600 font-medium" : done ? "text-emerald-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-px w-16 mx-2 mb-4 transition-colors duration-300
                ${step > num ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── File confirmed card ────────────────────────────────────────────────────
function FileCard({ filename, subtitle, color = "emerald" }) {
  const colors = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors[color]}`}>
      <IconFile />
      <div>
        <p className="text-sm font-semibold">{filename}</p>
        {subtitle && <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Collapsible updated row ────────────────────────────────────────────────
function UpdatedCard({ item, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono text-gray-400 shrink-0">{item.expediente}</span>
          <span className="text-sm font-medium text-gray-700 truncate">{item.agrupacion}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
            {item.changes.length} campo{item.changes.length !== 1 ? "s" : ""}
          </span>
          <span className="text-gray-400"><IconChevron open={open} /></span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left font-medium pb-2 w-1/3">Campo</th>
                <th className="text-left font-medium pb-2 w-1/3">Antes</th>
                <th className="text-left font-medium pb-2 w-1/3">Después</th>
              </tr>
            </thead>
            <tbody>
              {item.changes.map((ch, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-1.5 pr-3 font-medium text-gray-600">{ch.field}</td>
                  <td className="py-1.5 pr-3 text-gray-400 line-through">{ch.before || "—"}</td>
                  <td className="py-1.5 text-emerald-700 font-medium">{ch.after || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Added row card ─────────────────────────────────────────────────────────
function AddedCard({ item }) {
  const [open, setOpen] = useState(false);
  const fields = Object.entries(item.fields).filter(([, v]) => v !== "");
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono text-gray-400 shrink-0">{item.expediente}</span>
          <span className="text-sm font-medium text-gray-700 truncate">{item.agrupacion || "—"}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
            Nueva
          </span>
          <span className="text-gray-400"><IconChevron open={open} /></span>
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {fields.map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs py-1">
                <span className="font-medium text-gray-500 w-36 shrink-0">{k}</span>
                <span className="text-gray-700">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section collapse wrapper ───────────────────────────────────────────────
function PreviewSection({ title, count, badge, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 text-left group"
      >
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{count}</span>
        <span className="text-gray-400 ml-auto"><IconChevron open={open} /></span>
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AvancePEM() {
  const [step, setStep] = useState(1);
  const [loadingBase, setLoadingBase] = useState(false);
  const [loadingAvance, setLoadingAvance] = useState(false);
  const [loadingDescarga, setLoadingDescarga] = useState(false);
  const [progressBase, setProgressBase] = useState(0);
  const [progressAvance, setProgressAvance] = useState(0);
  const [baseInfo, setBaseInfo] = useState(null);   // { filename, total }
  const [preview, setPreview] = useState(null);     // { updated, added, skippedParalizado }
  const [error, setError] = useState("");

  const animateProgress = (setter, duration = 2500) => {
    const start = Date.now();
    const tick = () => {
      const p = Math.min(90, ((Date.now() - start) / duration) * 90);
      setter(p);
      if (p < 90) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // ── Step 1: upload base ──────────────────────────────────────────────────
  const handleBase = async (file) => {
    setError("");
    setLoadingBase(true);
    setProgressBase(0);
    animateProgress(setProgressBase);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/pem/upload-base", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");

      setProgressBase(100);
      await new Promise((r) => setTimeout(r, 400));
      setBaseInfo({ filename: file.name, total: data.total, sheetNames: data.sheetNames });
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingBase(false);
    }
  };

  // ── Step 2: upload avance ────────────────────────────────────────────────
  const handleAvance = async (file) => {
    setError("");
    setLoadingAvance(true);
    setProgressAvance(0);
    animateProgress(setProgressAvance);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/pem/upload-avance", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");

      setProgressAvance(100);
      await new Promise((r) => setTimeout(r, 400));
      setPreview(data);
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingAvance(false);
    }
  };

  // ── Step 3: download ─────────────────────────────────────────────────────
  const handleDescargar = async () => {
    setLoadingDescarga(true);
    try {
      const res = await fetch("/api/pem/descargar", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al generar el archivo");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = baseInfo.filename.replace(".xlsx", "_actualizada.xlsx");
      a.click();
      URL.revokeObjectURL(url);
      setStep(4);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingDescarga(false);
    }
  };

  const reset = () => {
    setStep(1);
    setBaseInfo(null);
    setPreview(null);
    setError("");
    setProgressBase(0);
    setProgressAvance(0);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-800">Avance PEM</h1>
          <p className="text-xs text-gray-400 mt-0.5">Actualización semanal de la base de agrupaciones</p>
        </div>
        {step > 1 && (
          <button
            onClick={reset}
            className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            ← Reiniciar
          </button>
        )}
      </div>

      {/* Step bar */}
      <StepBar step={step} />

      {/* Error global */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* ── Step 1: Base maestra ── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700 font-medium">Paso 1 de 2</p>
            <p className="text-sm text-blue-800 mt-0.5">Sube la <strong>base maestra</strong> — el Excel principal con la hoja <code className="bg-blue-100 px-1 rounded text-xs">POBLACIONES 2021-2026</code></p>
          </div>
          {loadingBase
            ? <LoadingBar progress={progressBase} />
            : <DropZone onFile={handleBase} />}
        </div>
      )}

      {/* ── Step 2: Avance PEM ── */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <FileCard
            filename={baseInfo.filename}
            subtitle={`${baseInfo.total} agrupaciones · ${baseInfo.sheetNames?.length ?? "?"} hojas`}
            color="emerald"
          />
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700 font-medium">Paso 2 de 2</p>
            <p className="text-sm text-amber-800 mt-0.5">Ahora sube el <strong>avance PEM semanal</strong> — el Excel con la hoja <code className="bg-amber-100 px-1 rounded text-xs">Reporte APC 2026</code></p>
          </div>
          {loadingAvance
            ? <LoadingBar progress={progressAvance} />
            : <DropZone onFile={handleAvance} />}
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === 3 && preview && (
        <div className="flex flex-col gap-6">
          {/* Archivos cargados */}
          <div className="flex gap-3">
            <FileCard filename={baseInfo.filename} subtitle={`${baseInfo.total} agrupaciones`} color="emerald" />
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{preview.updated.length}</p>
              <p className="text-xs text-amber-700 mt-1 font-medium">Actualizadas</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{preview.added.length}</p>
              <p className="text-xs text-emerald-700 mt-1 font-medium">Nuevas</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-400">{preview.skippedParalizado}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Ignoradas (paralizado)</p>
            </div>
          </div>

          {/* Preview actualizada */}
          {preview.updated.length > 0 && (
            <PreviewSection
              title="Agrupaciones actualizadas"
              count={preview.updated.length}
              badge="bg-amber-100 text-amber-700"
            >
              {preview.updated.map((item, i) => (
                <UpdatedCard key={item.expediente} item={item} index={i} />
              ))}
            </PreviewSection>
          )}

          {/* Preview nuevas */}
          {preview.added.length > 0 && (
            <PreviewSection
              title="Agrupaciones nuevas"
              count={preview.added.length}
              badge="bg-emerald-100 text-emerald-700"
            >
              {preview.added.map((item) => (
                <AddedCard key={item.expediente} item={item} />
              ))}
            </PreviewSection>
          )}

          {preview.updated.length === 0 && preview.added.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500">No se detectaron cambios respecto a la base actual.</p>
            </div>
          )}

          {/* Botón descarga */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleDescargar}
              disabled={loadingDescarga}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <IconDownload />
              {loadingDescarga ? "Generando..." : "Confirmar y descargar"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Descarga completada ── */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Base actualizada descargada</p>
            <p className="text-xs text-gray-400 mt-1">
              {preview.updated.length} agrupaciones actualizadas · {preview.added.length} nuevas agregadas
            </p>
          </div>
          <button
            onClick={reset}
            className="text-xs text-blue-600 hover:underline mt-2"
          >
            Procesar otro avance
          </button>
        </div>
      )}
    </div>
  );
}