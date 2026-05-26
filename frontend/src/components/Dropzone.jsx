import { useDropzone } from "react-dropzone";

export default function DropZone({ onFile }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    multiple: false,
    onDrop: (accepted) => { if (accepted.length > 0) onFile(accepted[0]); },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div
        {...getRootProps()}
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-blue-400 bg-blue-50 scale-[1.02]"
            : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isDragActive ? "bg-blue-100" : "bg-gray-100"}`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isDragActive ? "#2563eb" : "#9ca3af"} strokeWidth="1.5">
            <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-center">
          <p className={`font-medium text-sm ${isDragActive ? "text-blue-600" : "text-gray-700"}`}>
            {isDragActive ? "Suelta el archivo aquí" : "Arrastra tu Excel aquí"}
          </p>
          <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar · Solo .xlsx</p>
        </div>
      </div>
    </div>
  );
}