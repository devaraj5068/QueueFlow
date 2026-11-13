import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Clock,
  Sparkles,
  Users,
  AlertCircle,
} from 'lucide-react';
import TokenCard from './TokenCard';
import ConfirmModal from './ConfirmModal';

const TokenList = ({
  tokens = [],
  loading = false,
  onMoveUp,
  onMoveDown,
  onCancelToken,
  actionLoading = false,
}) => {
  const [tokenToCancel, setTokenToCancel] = useState(null);

  const formatJoinedTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleConfirmCancel = () => {
    if (tokenToCancel && onCancelToken) {
      onCancelToken(tokenToCancel._id);
      setTokenToCancel(null);
    }
  };

  if (loading && tokens.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80 space-y-4">
        <div className="h-6 bg-slate-100 rounded-lg w-1/4 animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-card border border-slate-200/80">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500 mx-auto mb-4">
          <Users className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          No Customers in Waiting Line
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The waiting queue is currently empty. Use the "Add Customer" form above to issue a new token.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
      {/* Table Header / Summary */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900">Waiting Customers</h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-600 border border-brand-200">
            {tokens.length} in line
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Tokens are prioritized by position order
        </span>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <th className="py-3 px-6">Queue Pos</th>
              <th className="py-3 px-6">Token</th>
              <th className="py-3 px-6">Customer Name</th>
              <th className="py-3 px-6">Joined Time</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {tokens.map((token, index) => {
              const isFirst = index === 0;
              const isLast = index === tokens.length - 1;
              const isUpNext = isFirst;

              return (
                <tr
                  key={token._id}
                  className={`transition-colors ${
                    isUpNext
                      ? 'bg-brand-50/30 hover:bg-brand-50/50'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Position */}
                  <td className="py-4 px-6 font-semibold">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold ${
                        isUpNext
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {token.position}
                    </span>
                  </td>

                  {/* Token Number */}
                  <td className="py-4 px-6">
                    <span className="font-mono-token text-base font-extrabold text-slate-900">
                      {token.code}
                    </span>
                  </td>

                  {/* Customer Name */}
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    {token.personName}
                  </td>

                  {/* Joined Time */}
                  <td className="py-4 px-6 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatJoinedTime(token.joinedAt)}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">
                    {isUpNext ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-500 text-white shadow-sm">
                        <Sparkles className="w-3 h-3" />
                        UP NEXT
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Waiting
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => onMoveUp(token._id)}
                        disabled={isFirst || actionLoading}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Move Up"
                        aria-label="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onMoveDown(token._id)}
                        disabled={isLast || actionLoading}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
                        title="Move Down"
                        aria-label="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setTokenToCancel(token)}
                        disabled={actionLoading}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Cancel Token"
                        aria-label="Cancel Token"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="p-4 md:hidden space-y-3">
        {tokens.map((token, index) => (
          <TokenCard
            key={token._id}
            token={token}
            isUpNext={index === 0}
            isFirst={index === 0}
            isLast={index === tokens.length - 1}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onCancel={(t) => setTokenToCancel(t)}
            actionLoading={actionLoading}
          />
        ))}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(tokenToCancel)}
        onClose={() => setTokenToCancel(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Waiting Customer?"
        message={`Are you sure you want to cancel token ${tokenToCancel?.code} (${tokenToCancel?.personName})? This will remove them from the queue and re-index following positions.`}
        confirmText="Cancel Token"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default TokenList;
