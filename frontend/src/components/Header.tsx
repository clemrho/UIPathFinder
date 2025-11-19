import React, { useState } from 'react';
import { Toast } from './Toast';

interface HeaderProps {
  onGeneratePaths: (userRequest: string, date: string) => void;
  onShowRestore: () => void;
  onLogout: () => void;
}

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
    <path d="M19 4v16" />
  </svg>
);

export function Header({ onGeneratePaths, onShowRestore, onLogout }: HeaderProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) {
      showToast('Please enter your requirements', 'error');
      return;
    }

    if (!selectedDate) {
      showToast('Please select a date', 'error');
      return;
    }

    onGeneratePaths(inputMessage, selectedDate);
    showToast('Generating schedule suggestions...', 'success');
  };

  return (
    <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white shadow-lg">
      {toast && <Toast message={toast.message} type={toast.type} />}
      
      <div className="container mx-auto px-6 py-4">
        {/* Top row - Logo and title */}
        <div className="flex items-center justify-between mb-4">
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
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/70 hover:bg-slate-700 rounded-lg transition-colors border border-slate-500 text-sm"
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Bottom row - Input form */}
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-slate-300 mb-1.5">
              💬 Describe Your Schedule Needs
            </label>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="e.g., I want to plan a productive study day with classes, library time, and workout..."
              className="w-full h-10 rounded-lg border border-slate-500 bg-slate-700/50 px-4 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="w-48">
            <label className="block text-xs text-slate-300 mb-1.5">
              📅 Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-500 bg-slate-700/50 px-3 py-2 text-sm text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <button
            type="submit"
            className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors inline-flex items-center justify-center gap-2 shadow-md"
          >
            <SendIcon />
            <span>Generate Paths</span>
          </button>
        </form>
      </div>
    </header>
  );
}
