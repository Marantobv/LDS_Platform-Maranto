import { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import RowPreview from "./RowPreview";
import Table from "./Table";

export default function ExcelTable({ columns: initialColumns, rows: initialRows }) {
  const [sections, setSections] = useState(() => {
    const allRows = initialRows.map((r, i) => ({ ...r, _id: `row-${i}` }));
    const main = [];
    const nofise = [];
    allRows.forEach((r) => {
      const fases = (r.data["FASES (SUM)"] ?? "").trim().toUpperCase();
      if (fases.startsWith("3")) nofise.push(r);
      else main.push(r);
    });
    return { main, fise: [], nofise };
  });

  const [activeRow, setActiveRow] = useState(null);
  const mainRef   = useRef();
  const fiseRef   = useRef();
  const nofiseRef = useRef();
  const [downloading, setDownloading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findSection = (id) =>
    Object.keys(sections).find((key) => sections[key].some((r) => r._id === id));

  // Edición universal
  const handleEdit = (rowId, col, newValue, commit) => {
    const sectionKey = findSection(rowId);
    if (!sectionKey) return;
    setSections((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((r) => {
        if (r._id !== rowId) return r;
        if (commit === "cancel") { const { editing, ...rest } = r; return rest; }
        if (commit === true) {
          const finalValue = r.editing?.value ?? r.data[col];
          const { editing, ...rest } = r;
          return { ...rest, data: { ...rest.data, [col]: finalValue } };
        }
        return { ...r, editing: { col, value: newValue !== undefined ? newValue : r.data[col] ?? "" } };
      }),
    }));
  };

  // Drag start
  const handleDragStart = ({ active }) => {
    const sectionKey = findSection(active.id);
    if (!sectionKey) return;
    setActiveRow(sections[sectionKey].find((r) => r._id === active.id) ?? null);
  };

  // Drag end
  const handleDragEnd = ({ active, over }) => {
    setActiveRow(null);
    if (!over) return;

    const SECTION_IDS = ["main", "fise", "nofise"];
    const fromSection = findSection(active.id);
    const toSection = SECTION_IDS.includes(over.id) ? over.id : null;

    if (!fromSection || !toSection || fromSection === toSection) return;

    const draggedRow = sections[fromSection].find((r) => r._id === active.id);
    if (!draggedRow) return;

    const { editing, ...cleanRow } = draggedRow;  // isParent se preserva

    setSections((prev) => ({
      ...prev,
      [fromSection]: prev[fromSection].filter((r) => r._id !== active.id),
      [toSection]: [...prev[toSection], cleanRow],
    }));
  };

  const handleDescargar = async () => {
    setDownloading(true);
    try {
      const snapshot = {
        main:   mainRef.current?.getRows()   ?? sections.main,
        fise:   fiseRef.current?.getRows()   ?? sections.fise,
        nofise: nofiseRef.current?.getRows() ?? sections.nofise,
      };
      const res = await fetch("/api/descargar-clasificacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns: initialColumns, sections: snapshot }),
      });
      if (!res.ok) throw new Error("Error al generar el archivo");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clasificacion.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-6">
        <div className="flex justify-end">
          <button
            onClick={handleDescargar}
            disabled={downloading}
            className="text-xs px-4 py-1.5 rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
          >
            {downloading ? "Generando..." : "↓ Descargar clasificación"}
          </button>
        </div>
        <Table
          ref={mainRef}
          droppableId="main"
          label="Solicitudes"
          color="gray"
          rows={sections.main}
          initialColumns={initialColumns}
          onEdit={handleEdit}
          emptyText="Todas las filas han sido clasificadas"
        />
        <Table
          ref={fiseRef}
          droppableId="fise"
          label="FISE"
          color="green"
          rows={sections.fise}
          initialColumns={initialColumns}
          onEdit={handleEdit}
        />
        <Table
          ref={nofiseRef}
          droppableId="nofise"
          label="NO FISE"
          color="blue"
          rows={sections.nofise}
          initialColumns={initialColumns}
          onEdit={handleEdit}
        />
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeRow ? <RowPreview row={activeRow} columns={initialColumns} /> : null}
      </DragOverlay>
    </DndContext>
  );
}