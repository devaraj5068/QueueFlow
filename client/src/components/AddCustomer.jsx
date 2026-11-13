import React, { useState } from 'react';
import { UserPlus, Sparkles, Loader2, User } from 'lucide-react';
import { tokenApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const AddCustomer = ({ queueId, onTokenAdded }) => {
  const [personName, setPersonName] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personName.trim()) {
      toast.warning('Please enter customer name');
      return;
    }

    if (!queueId) {
      toast.warning('Please select a queue first');
      return;
    }

    try {
      setLoading(true);
      const res = await tokenApi.createToken(queueId, {
        personName: personName.trim(),
      });

      if (res.data.success) {
        toast.success(
          `Token ${res.data.token.code} generated for ${res.data.token.personName}! Position #${res.data.token.position}`
        );
        setPersonName('');
        if (onTokenAdded) {
          onTokenAdded(res.data.token);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-card border border-slate-200/80">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Add Customer to Queue</h3>
          <p className="text-xs text-slate-500">Generate the next sequential token number</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Enter customer name (e.g., Rahul Sharma)"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !personName.trim()}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#635BFF] hover:bg-[#5249e0] active:scale-95 transition-all shadow-sm disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Generate Token</span>
        </button>
      </form>
    </div>
  );
};

export default AddCustomer;
