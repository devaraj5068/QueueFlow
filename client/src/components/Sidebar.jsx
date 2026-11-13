import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Layers,
  Plus,
  LogOut,
  ChevronRight,
  Sparkles,
  X,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CreateQueueModal from './CreateQueueModal';

const Sidebar = ({
  queues = [],
  selectedQueueId,
  onSelectQueue,
  onQueueCreated,
  isOpen = false,
  onClose,
}) => {
  const { manager, logout } = useAuth();
  const location = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleQueueClick = (qId) => {
    if (onSelectQueue) {
      onSelectQueue(qId);
    }
    if (onClose) {
      onClose();
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 md:w-72 border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#635BFF] to-[#8E87FF] flex items-center justify-center text-white shadow-glow">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">QueueFlow</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded border border-brand-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">Queue Management Suite</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="px-4 py-4 space-y-1">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        <NavLink
          to="/dashboard"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive
                ? 'bg-[#635BFF] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Queue Dashboard</span>
        </NavLink>

        <NavLink
          to="/analytics"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive
                ? 'bg-[#635BFF] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`
          }
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span>Analytics & Reports</span>
        </NavLink>
      </div>

      {/* Active Queues Section */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Your Queues ({queues.length})
          </span>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 p-1 hover:bg-slate-800 rounded transition-colors"
            title="Create New Queue"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {queues.length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-slate-800/40 border border-slate-800">
            <Layers className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No queues created yet</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 text-xs font-semibold text-brand-400 hover:underline"
            >
              + Create first queue
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {queues.map((q) => {
              const isSelected = selectedQueueId === q._id;
              return (
                <button
                  key={q._id}
                  onClick={() => handleQueueClick(q._id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group text-left ${
                    isSelected
                      ? 'bg-slate-800 text-white font-semibold border-l-4 border-l-brand-500 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono-token text-[11px] font-bold bg-slate-700/60 text-brand-300 px-1.5 py-0.5 rounded border border-slate-600/40 shrink-0">
                      {q.prefix}
                    </span>
                    <span className="truncate">{q.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {q.waitingCount > 0 ? (
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-500/30">
                        {q.waitingCount}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600">0</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Manager Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-300 flex items-center justify-center font-bold text-sm shrink-0">
              {manager?.name ? manager.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{manager?.name || 'Manager'}</p>
              <p className="text-[11px] text-slate-400 truncate">{manager?.email || ''}</p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Create Queue Modal */}
      <CreateQueueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onQueueCreated={(newQueue) => {
          if (onQueueCreated) onQueueCreated(newQueue);
          if (onSelectQueue) onSelectQueue(newQueue._id);
        }}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Mobile Offcanvas Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
};

export default Sidebar;
