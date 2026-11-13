import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Edit2, Trash2, Check, Layers } from 'lucide-react';

const QueueSelector = ({
  queues = [],
  selectedQueue,
  onSelectQueue,
  onCreateClick,
  onRenameClick,
  onDeleteClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 hover:border-slate-300 shadow-subtle transition-all active:scale-95"
        >
          <Layers className="w-4 h-4 text-brand-500" />
          <span className="max-w-[180px] truncate">
            {selectedQueue ? selectedQueue.name : 'Choose Queue'}
          </span>
          {selectedQueue && (
            <span className="font-mono-token text-[11px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-200">
              {selectedQueue.prefix}
            </span>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {selectedQueue && (
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={onRenameClick}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Rename Current Queue"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDeleteClick}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Current Queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-elevated border border-slate-100 z-50 overflow-hidden animate-fade-in py-1.5">
          <div className="px-3.5 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            Available Queues ({queues.length})
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {queues.map((q) => {
              const isSelected = selectedQueue?._id === q._id;
              return (
                <button
                  key={q._id}
                  onClick={() => {
                    onSelectQueue(q._id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors ${
                    isSelected
                      ? 'bg-brand-50/70 text-brand-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono-token font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {q.prefix}
                    </span>
                    <span className="truncate">{q.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-200">
                      {q.waitingCount || 0} waiting
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-slate-100">
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateClick();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Queue</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueSelector;
