import React from 'react';

interface HeaderProps {
  onShowRestore: () => void;
}

const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

export function Header({ onShowRestore }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white shadow-lg">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl">UIPathFinder</h1>
            <p className="text-xs text-slate-300">UIUC Smart Schedule Planner</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onShowRestore}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600/50 hover:bg-slate-600 rounded-lg transition-colors border border-slate-500"
          >
            <HistoryIcon />
            <span className="text-sm">History</span>
          </button>
          
          <button
            className="flex items-center gap-2 px-4 py-2 bg-slate-600/50 hover:bg-slate-600 rounded-lg transition-colors border border-slate-500"
          >
            <LogoutIcon />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}