import React, { useState, useEffect } from 'react';
import { Menu, RefreshCw, Calendar, Clock, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({
  currentQueue,
  onRefresh,
  isRefreshing = false,
  onToggleMobileMenu,
}) => {
  const { manager } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 md:px-8 py-3.5 shadow-subtle flex items-center justify-between">
      {/* Left: Mobile trigger & Current Queue */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
              {currentQueue ? currentQueue.name : 'Select a Queue'}
            </h1>
            {currentQueue?.prefix && (
              <span className="font-mono-token text-xs font-bold px-2 py-0.5 rounded-lg bg-brand-50 text-brand-600 border border-brand-200">
                PREFIX: {currentQueue.prefix}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            Welcome back, <span className="font-semibold text-slate-700">{manager?.name}</span>
          </p>
        </div>
      </div>

      {/* Right: Date, Time & Refresh Action */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-500" />
            <span>{formattedDate}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-brand-500" />
            <span>{formattedTime}</span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 active:scale-95 transition-all disabled:opacity-50"
          title="Refresh Queue State"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-500' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
