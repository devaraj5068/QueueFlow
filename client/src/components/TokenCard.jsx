import React from 'react';
import { ArrowUp, ArrowDown, X, Clock, Sparkles } from 'lucide-react';

const TokenCard = ({
  token,
  isUpNext = false,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
  onCancel,
  actionLoading = false,
}) => {
  const formatJoinedTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isUpNext
          ? 'bg-brand-50/40 border-brand-300 ring-2 ring-brand-500/20 shadow-card'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-subtle'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
            #{token.position}
          </span>
          <span className="font-mono-token text-base font-extrabold text-slate-900">
            {token.code}
          </span>
          {isUpNext && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              UP NEXT
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveUp(token._id)}
            disabled={isFirst || actionLoading}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Move Up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMoveDown(token._id)}
            disabled={isLast || actionLoading}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Move Down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCancel(token)}
            disabled={actionLoading}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
            title="Cancel Token"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <span className="font-semibold text-slate-800 text-sm">{token.personName}</span>
        <div className="flex items-center gap-1 text-[11px]">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{formatJoinedTime(token.joinedAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default TokenCard;
