import React from 'react';
import { Menu, Wifi, WifiOff } from 'lucide-react';
import { useSync } from '../hooks/useSync.js';

export default function TopBar({ title, onMenuClick }) {
  const { isOnline, pendingCount } = useSync();

  return (
    <header className="bg-white/60 backdrop-blur-md border-b border-white/40 p-5 flex justify-between items-center flex-shrink-0 shadow-[0_4px_24px_rgba(0,0,0,0.02)] sticky top-0 z-20">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-white/80 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>

      <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/50 border border-white/60 shadow-sm backdrop-blur-sm cursor-pointer hover:bg-white/80 transition">
        {isOnline ? (
          <>
            <Wifi className="text-green-500 w-4 h-4" />
            <span className="text-green-600">Online {pendingCount > 0 ? `(${pendingCount} pending)` : ''}</span>
          </>
        ) : (
          <>
            <WifiOff className="text-red-500 w-4 h-4" />
            <span className="text-red-600">Offline {pendingCount > 0 ? `(${pendingCount} queued)` : ''}</span>
          </>
        )}
      </div>
    </header>
  );
}
