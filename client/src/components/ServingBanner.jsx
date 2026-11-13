import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, Clock, Sparkles, Loader2, ArrowRight } from 'lucide-react';

const ServingBanner = ({
  servingToken,
  onComplete,
  onAssignNext,
  hasWaitingTokens = false,
  isCompleting = false,
  isAssigning = false,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!servingToken?.servedAt) {
      setElapsedSeconds(0);
      return;
    }

    const servedTime = new Date(servingToken.servedAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - servedTime) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [servingToken?.servedAt]);

  const formatElapsed = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${String(mins).padStart(2, '0')}m ${String(remainingSecs).padStart(2, '0')}s`;
  };

  if (!servingToken) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6 md:p-8 text-center shadow-subtle transition-all">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <UserCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-700 mb-1">
          Counter Currently Idle
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          No customer is currently being served at this counter.
        </p>
        {hasWaitingTokens ? (
          <button
            onClick={onAssignNext}
            disabled={isAssigning}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5249e0] active:scale-95 transition-all shadow-card disabled:opacity-50"
          >
            {isAssigning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            ASSIGN NEXT CUSTOMER
          </button>
        ) : (
          <span className="text-xs font-medium text-slate-400 italic">
            Add a customer to the queue below to begin service.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-[#151c38] to-[#1c183f] rounded-2xl p-6 md:p-8 text-white shadow-elevated border border-slate-800">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#635BFF]/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: Status & Token info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              CURRENTLY SERVING
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-mono">{formatElapsed(elapsedSeconds)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-4">
            <h2 className="text-4xl md:text-5xl font-extrabold font-mono-token tracking-tight text-white drop-shadow-sm">
              {servingToken.code}
            </h2>
            <div className="border-l-2 border-slate-700/80 pl-4 py-0.5">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Customer Name
              </p>
              <p className="text-xl md:text-2xl font-bold text-slate-100">
                {servingToken.personName}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onComplete(servingToken._id)}
            disabled={isCompleting}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all shadow-md disabled:opacity-50"
          >
            {isCompleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            MARK COMPLETED
          </button>

          {hasWaitingTokens && (
            <button
              onClick={onAssignNext}
              disabled={isAssigning}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5249e0] active:scale-95 transition-all shadow-card disabled:opacity-50"
              title="Complete this token and serve next customer in queue"
            >
              {isAssigning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              SERVE NEXT
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServingBanner;
