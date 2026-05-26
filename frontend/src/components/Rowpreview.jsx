export default function RowPreview({ row, columns }) {
  return (
    <div className="bg-white border border-blue-300 rounded-lg shadow-xl px-4 py-2 text-xs text-gray-700 flex gap-4 max-w-sm rotate-1 scale-105">
      {columns.slice(0, 4).map((col) => (
        <span key={col} className="truncate max-w-[100px]">
          <span className="text-gray-400 mr-1">{col}:</span>
          {row?.data[col] ?? ""}
        </span>
      ))}
      {columns.length > 4 && <span className="text-gray-300">···</span>}
    </div>
  );
}