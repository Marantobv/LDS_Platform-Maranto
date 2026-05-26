const MODULES = [
  {
    id: "presupuestos",
    label: "Formato Presupuestos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    id: "avance-pem",
    label: "Avance PEM",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
];

export default function Sidebar({ activeModule, onSelect }) {
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 3h12v2H2zM2 7h8v2H2zM2 11h10v2H2z" fill="white" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800 leading-tight">Plataforma</p>
          <p className="text-xs text-gray-400 leading-tight">Luz del Sur</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        <p className="text-xs text-gray-400 font-medium px-2 py-1 uppercase tracking-wider">Módulos</p>
        {MODULES.map((mod) => {
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => onSelect(mod.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 w-full ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              <span className={isActive ? "text-blue-600" : "text-gray-400"}>
                {mod.icon}
              </span>
              <span className="text-sm leading-tight">{mod.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-300">v1.0.0</p>
      </div>
    </aside>
  );
}