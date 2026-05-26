export default function LoadingBar({ progress }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke="#2563eb" strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-blue-600">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-64">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <p className="text-sm text-gray-500 tracking-wide">Procesando archivo...</p>
    </div>
  );
}