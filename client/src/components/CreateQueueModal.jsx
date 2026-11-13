import React, { useState } from 'react';
import { X, Layers, Hash, Loader2 } from 'lucide-react';
import { queueApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const CreateQueueModal = ({ isOpen, onClose, onQueueCreated }) => {
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Please enter a queue name.');
      return;
    }
    if (!prefix.trim()) {
      toast.warning('Please enter a token prefix (e.g., T, C, B).');
      return;
    }

    try {
      setLoading(true);
      const res = await queueApi.createQueue({
        name: name.trim(),
        prefix: prefix.trim().toUpperCase(),
      });
      if (res.data.success) {
        toast.success(`Queue "${res.data.queue.name}" created!`);
        setName('');
        setPrefix('');
        onClose();
        if (onQueueCreated) {
          onQueueCreated(res.data.queue);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create queue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-elevated border border-slate-100 w-full max-w-md overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Create New Queue</h3>
              <p className="text-xs text-slate-500">Set up a service counter with dedicated token numbering</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Queue Name
            </label>
            <input
              type="text"
              placeholder="e.g. Billing Counter, Medical Consultation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Token Prefix (1-4 Characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. T, C, BIL"
                maxLength={4}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm uppercase font-mono-token focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sample tokens will be formatted as: <span className="font-mono text-slate-600 font-semibold">{prefix || 'T'}-001, {prefix || 'T'}-002</span>
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#635BFF] hover:bg-[#5249e0] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQueueModal;
