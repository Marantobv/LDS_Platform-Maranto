import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRef } from "react";

export default function SortableHeader({ id, label, width, onResize }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const startX = useRef(null);
  const startWidth = useRef(null);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    startX.current = e.clientX;
    startWidth.current = width;

    const onMouseMove = (e) => {
      const delta = e.clientX - startX.current;
      const newWidth = Math.max(60, startWidth.current + delta);
      onResize(id, newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <th
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        width: width,
        minWidth: width,
        maxWidth: width,
        position: "relative",
      }}
      className="px-3 py-2.5 text-left font-semibold text-gray-500 border-b border-gray-100 whitespace-nowrap select-none"
    >
      {/* Handle de arrastre para mover columna */}
      <span className="cursor-grab" {...attributes} {...listeners}>
        {label}
      </span>

      {/* Handle de redimensión */}
      <span
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-300 opacity-0 hover:opacity-100 transition-opacity"
        style={{ touchAction: "none" }}
      />
    </th>
  );
}