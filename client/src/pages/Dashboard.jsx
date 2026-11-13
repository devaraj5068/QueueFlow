import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Hash,
  Sparkles,
  ArrowRight,
  Layers,
  Plus,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import QueueSelector from '../components/QueueSelector';
import ServingBanner from '../components/ServingBanner';
import AddCustomer from '../components/AddCustomer';
import TokenList from '../components/TokenList';
import KpiCard from '../components/KpiCard';
import RenameQueueModal from '../components/RenameQueueModal';
import CreateQueueModal from '../components/CreateQueueModal';
import ConfirmModal from '../components/ConfirmModal';
import { queueApi, tokenApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../hooks/useSocket';

const Dashboard = () => {
  const { manager } = useAuth();
  const toast = useToast();

  const [queues, setQueues] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [currentServing, setCurrentServing] = useState(null);

  const [loadingQueues, setLoadingQueues] = useState(true);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentQueue = queues.find((q) => q._id === selectedQueueId) || null;

  // Fetch all queues
  const fetchQueues = useCallback(async (autoSelectFirst = false) => {
    try {
      const res = await queueApi.getQueues();
      if (res.data.success) {
        setQueues(res.data.queues);
        if (autoSelectFirst && res.data.queues.length > 0) {
          setSelectedQueueId((prev) => prev || res.data.queues[0]._id);
        }
      }
    } catch (err) {
      toast.error('Failed to load queues.');
    } finally {
      setLoadingQueues(false);
    }
  }, [toast]);

  // Fetch tokens for selected queue
  const fetchTokens = useCallback(async (showSpinner = false) => {
    if (!selectedQueueId) {
      setTokens([]);
      setCurrentServing(null);
      return;
    }

    if (showSpinner) setLoadingTokens(true);
    try {
      const res = await tokenApi.getTokens(selectedQueueId, 'waiting');
      if (res.data.success) {
        setTokens(res.data.tokens || []);
        setCurrentServing(res.data.currentServing || null);
      }
    } catch (err) {
      console.warn('Error fetching tokens:', err.message);
    } finally {
      if (showSpinner) setLoadingTokens(false);
    }
  }, [selectedQueueId]);

  // Initial load
  useEffect(() => {
    fetchQueues(true);
  }, [fetchQueues]);

  // Load tokens when queue selection changes
  useEffect(() => {
    if (selectedQueueId) {
      fetchTokens(true);
    }
  }, [selectedQueueId, fetchTokens]);

  // Real-time Socket.IO subscription + polling fallback
  const handleRealtimeUpdate = useCallback(() => {
    fetchTokens(false);
    fetchQueues(false);
  }, [fetchTokens, fetchQueues]);

  useSocket(selectedQueueId, manager?._id, handleRealtimeUpdate);

  // Refresh queue manually
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchQueues(false), fetchTokens(true)]);
    setIsRefreshing(false);
    toast.info('Queue status refreshed');
  };

  // Assign Next Customer
  const handleAssignNext = async () => {
    if (!selectedQueueId) return;

    if (tokens.length === 0) {
      toast.warning('No waiting customers in this queue.');
      return;
    }

    try {
      setIsAssigning(true);
      const res = await tokenApi.assignNextToken(selectedQueueId);
      if (res.data.success) {
        toast.success(res.data.message);
        setCurrentServing(res.data.token);
        fetchTokens(false);
        fetchQueues(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign next token.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Mark Completed
  const handleCompleteServing = async (tokenId) => {
    if (!selectedQueueId || !tokenId) return;

    try {
      setActionLoading(true);
      const res = await tokenApi.completeToken(selectedQueueId, tokenId);
      if (res.data.success) {
        toast.success(res.data.message);
        setCurrentServing(null);
        fetchTokens(false);
        fetchQueues(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete token.');
    } finally {
      setActionLoading(false);
    }
  };

  // Move token Up
  const handleMoveUp = async (tokenId) => {
    if (!selectedQueueId) return;
    try {
      setActionLoading(true);
      const res = await tokenApi.moveToken(selectedQueueId, tokenId, 'up');
      if (res.data.success) {
        fetchTokens(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move token.');
    } finally {
      setActionLoading(false);
    }
  };

  // Move token Down
  const handleMoveDown = async (tokenId) => {
    if (!selectedQueueId) return;
    try {
      setActionLoading(true);
      const res = await tokenApi.moveToken(selectedQueueId, tokenId, 'down');
      if (res.data.success) {
        fetchTokens(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to move token.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel token
  const handleCancelToken = async (tokenId) => {
    if (!selectedQueueId) return;
    try {
      setActionLoading(true);
      const res = await tokenApi.cancelToken(selectedQueueId, tokenId);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchTokens(false);
        fetchQueues(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel token.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Queue confirmation
  const handleDeleteQueue = async () => {
    if (!selectedQueueId) return;
    try {
      setActionLoading(true);
      const res = await queueApi.deleteQueue(selectedQueueId);
      if (res.data.success) {
        toast.success('Queue deleted successfully.');
        setIsDeleteModalOpen(false);
        // Reset selection
        const remaining = queues.filter((q) => q._id !== selectedQueueId);
        setQueues(remaining);
        setSelectedQueueId(remaining.length > 0 ? remaining[0]._id : null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete queue.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FB]">
      {/* Sidebar */}
      <Sidebar
        queues={queues}
        selectedQueueId={selectedQueueId}
        onSelectQueue={(qId) => setSelectedQueueId(qId)}
        onQueueCreated={(newQ) => {
          setQueues((prev) => [...prev, newQ]);
          setSelectedQueueId(newQ._id);
        }}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentQueue={currentQueue}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Operational Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:inline">
                Active Queue:
              </span>
              <QueueSelector
                queues={queues}
                selectedQueue={currentQueue}
                onSelectQueue={(qId) => setSelectedQueueId(qId)}
                onCreateClick={() => setIsCreateModalOpen(true)}
                onRenameClick={() => setIsRenameModalOpen(true)}
                onDeleteClick={() => setIsDeleteModalOpen(true)}
              />
            </div>

            {/* Prominent ASSIGN NEXT TOKEN Action Button */}
            <button
              onClick={handleAssignNext}
              disabled={isAssigning || tokens.length === 0}
              className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#635BFF] to-[#7B74FF] hover:from-[#5249e0] hover:to-[#6860f0] active:scale-[0.98] transition-all shadow-card disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAssigning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>ASSIGN NEXT TOKEN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Currently Serving Banner */}
          <ServingBanner
            servingToken={currentServing}
            onComplete={handleCompleteServing}
            onAssignNext={handleAssignNext}
            hasWaitingTokens={tokens.length > 0}
            isCompleting={actionLoading}
            isAssigning={isAssigning}
          />

          {/* KPI Summary Cards for Current Queue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Customers Waiting"
              value={tokens.length}
              subtitle="Currently in line"
              icon={Users}
              colorScheme="amber"
            />
            <KpiCard
              title="Currently Serving"
              value={currentServing ? currentServing.code : 'None'}
              subtitle={currentServing ? currentServing.personName : 'Counter Idle'}
              icon={UserCheck}
              colorScheme="emerald"
            />
            <KpiCard
              title="Next In Line"
              value={tokens.length > 0 ? tokens[0].code : '—'}
              subtitle={tokens.length > 0 ? tokens[0].personName : 'Queue Clear'}
              icon={Hash}
              colorScheme="indigo"
            />
          </div>

          {/* Add Customer Form */}
          <AddCustomer
            queueId={selectedQueueId}
            onTokenAdded={(newToken) => {
              setTokens((prev) => [...prev, newToken]);
              fetchQueues(false);
            }}
          />

          {/* Waiting Queue List Table */}
          <TokenList
            tokens={tokens}
            loading={loadingTokens}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onCancelToken={handleCancelToken}
            actionLoading={actionLoading}
          />
        </main>
      </div>

      {/* Modals */}
      <CreateQueueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onQueueCreated={(newQ) => {
          setQueues((prev) => [...prev, newQ]);
          setSelectedQueueId(newQ._id);
        }}
      />

      <RenameQueueModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        queue={currentQueue}
        onQueueUpdated={(updatedQ) => {
          setQueues((prev) =>
            prev.map((q) => (q._id === updatedQ._id ? updatedQ : q))
          );
        }}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteQueue}
        title={`Delete Queue "${currentQueue?.name}"?`}
        message="Deleting this queue will cancel all currently waiting customers in this queue. Historical completed token records will be retained in analytics."
        confirmText="Delete Queue"
        isDanger={true}
        loading={actionLoading}
      />
    </div>
  );
};

export default Dashboard;
