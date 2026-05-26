import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { useDroppable, DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useSortable, SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SortableHeader from "./SortableHeader";
import { groupAndSortRows } from "../hooks/Usegrouprows";

// ── Fila ─────────────────────────────────────────────────────────────────────
function Row({ id, row, columns, colWidths, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const isParent = row.isParent === true;

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className={`border-b border-gray-50 transition-colors ${isParent ? "bg-green-100 hover:bg-green-200" : "hover:bg-gray-50"}`}
    >
      <td className="px-2 py-2 text-gray-300 cursor-grab" {...attributes} {...listeners}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="4" cy="3" r="1"/><circle cx="8" cy="3" r="1"/>
          <circle cx="4" cy="6" r="1"/><circle cx="8" cy="6" r="1"/>
          <circle cx="4" cy="9" r="1"/><circle cx="8" cy="9" r="1"/>
        </svg>
      </td>
      {columns.map((col) => (
        <td
          key={col}
          style={{ width: colWidths[col] ?? 120, minWidth: colWidths[col] ?? 120, maxWidth: colWidths[col] ?? 120 }}
          className={`px-3 py-2 whitespace-nowrap text-xs truncate ${
            row.redCells?.includes(col)
              ? "text-red-600 font-semibold"
              : isParent
              ? "text-green-900 font-medium"
              : "text-gray-700"
          }`}
          onDoubleClick={() => onEdit(id, col)}
        >
          {row.editing?.col === col ? (
            <input
              autoFocus
              value={row.editing.value}
              onChange={(e) => onEdit(id, col, e.target.value)}
              onBlur={() => onEdit(id, col, null, true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onEdit(id, col, null, true);
                if (e.key === "Escape") onEdit(id, col, null, "cancel");
              }}
              className="w-full min-w-[80px] border border-blue-400 rounded px-1 py-0.5 outline-none text-gray-800 bg-white"
            />
          ) : (
            row.data[col] ?? ""
          )}
        </td>
      ))}
    </tr>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
const Table = forwardRef(function Table({ droppableId, label, color, rows, initialColumns, onEdit, emptyText }, ref) {
  const [columns, setColumns] = useState(initialColumns);
  const [colWidths, setColWidths] = useState(() =>
    Object.fromEntries(initialColumns.map((col) => [col, 120]))
  );
  const [localRows, setLocalRows] = useState(rows);

  // Exponer estado local al padre para la descarga
  useImperativeHandle(ref, () => ({
    getRows: () => localRows,
  }));

  // Sync rows from parent when they change (drag in/out)
  // We use a ref to track previous rows prop
  const prevRowsRef = useRef(rows);
  if (prevRowsRef.current !== rows) {
    prevRowsRef.current = rows;
    setLocalRows(rows);
  }

  const columnSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: droppableId });

  const handleResize = (col, width) =>
    setColWidths((prev) => ({ ...prev, [col]: width }));

  const handleColumnDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = columns.indexOf(active.id);
    const newIndex = columns.indexOf(over.id);
    if (oldIndex !== -1 && newIndex !== -1)
      setColumns(arrayMove(columns, oldIndex, newIndex));
  };

  const handleGroup = () =>
    setLocalRows(groupAndSortRows(localRows));

  const COLORS = {
    gray: {
      border: isOver ? "border-gray-400 bg-gray-50" : "border-gray-100",
      dropZone: isOver ? "border-gray-400 bg-gray-100 text-gray-500" : "border-gray-200 text-gray-300",
    },
    green: {
      border: isOver ? "border-green-400 bg-green-50" : "border-green-200 bg-white",
      dropZone: isOver ? "border-green-400 bg-green-50 text-green-500" : "border-green-200 text-green-300",
    },
    blue: {
      border: isOver ? "border-blue-400 bg-blue-50" : "border-blue-200 bg-white",
      dropZone: isOver ? "border-blue-400 bg-blue-50 text-blue-500" : "border-blue-200 text-blue-300",
    },
  }[color];

  const isSection = color !== "gray";

  return (
    <div className={`rounded-xl border-2 ${isSection ? "border-dashed" : ""} transition-all duration-200 overflow-hidden ${COLORS.border}`}>
      {/* Header */}
      {isSection && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <span className={`font-semibold text-sm ${color === "green" ? "text-green-700" : "text-blue-700"}`}>
              {label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color === "green" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
              {localRows.length} filas
            </span>
          </div>
          {localRows.length > 0 && (
            <button
              onClick={handleGroup}
              className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors font-medium"
            >
              Ordenar y agrupar
            </button>
          )}
        </div>
      )}

      {/* Tabla */}
      {localRows.length > 0 && (
        <div className={`overflow-auto ${isSection ? "max-h-64" : "max-h-[50vh]"} w-full`}>
          <table className="text-xs border-collapse" style={{ width: "max-content", minWidth: "100%" }}>
            <thead>
              <DndContext
                sensors={columnSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleColumnDragEnd}
              >
                <SortableContext items={columns} strategy={horizontalListSortingStrategy}>
                  <tr className="bg-gray-50 sticky top-0 z-10">
                    <th className="w-6 border-b border-gray-100" />
                    {columns.map((col) => (
                      <SortableHeader
                        key={col}
                        id={col}
                        label={col}
                        width={colWidths[col] ?? 120}
                        onResize={handleResize}
                      />
                    ))}
                  </tr>
                </SortableContext>
              </DndContext>
            </thead>
            <tbody>
              {localRows.map((row) => (
                <Row
                  key={row._id}
                  id={row._id}
                  row={row}
                  columns={columns}
                  colWidths={colWidths}
                  onEdit={onEdit}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state / drop zone */}
      <div
        ref={setDropRef}
        className={`mx-3 my-2 rounded-lg border border-dashed py-4 flex items-center justify-center text-xs transition-all duration-200 ${COLORS.dropZone}`}
      >
        {isOver ? "↓ Suelta aquí" : (emptyText ?? "Arrastra filas aquí")}
      </div>
    </div>
  );
});

export default Table;