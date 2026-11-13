import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
} from 'recharts';
import {
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Loader2,
  Info,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import KpiCard from '../components/KpiCard';
import { analyticsApi, queueApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Analytics = () => {
  const { manager } = useAuth();
  const toast = useToast();

  const [queues, setQueues] = useState([]);
  const [filterType, setFilterType] = useState('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [kpis, setKpis] = useState(null);
  const [queueBreakdown, setQueueBreakdown] = useState([]);
  const [hourlyArrivals, setHourlyArrivals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch queues for the sidebar
  const fetchQueues = useCallback(async () => {
    try {
      const res = await queueApi.getQueues();
      if (res.data.success) {
        setQueues(res.data.queues);
      }
    } catch (err) {
      console.warn('Failed to load queues for sidebar');
    }
  }, []);

  // Fetch all analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = { filter: filterType };
      if (filterType === 'custom' && startDate) {
        params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const [kpiRes, breakdownRes, hourlyRes] = await Promise.all([
        analyticsApi.getKpiMetrics(params),
        analyticsApi.getQueueBreakdown(params),
        analyticsApi.getHourlyArrivals(params),
      ]);

      if (kpiRes.data.success) setKpis(kpiRes.data.data);
      if (breakdownRes.data.success) setQueueBreakdown(breakdownRes.data.data);
      if (hourlyRes.data.success) setHourlyArrivals(hourlyRes.data.data);
    } catch (err) {
      toast.error('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, [filterType, startDate, endDate, toast]);

  useEffect(() => {
    fetchQueues();
    fetchAnalytics();
  }, [fetchQueues, fetchAnalytics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalytics();
    setIsRefreshing(false);
    toast.info('Analytics updated');
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F7FB]">
      <Sidebar
        queues={queues}
        selectedQueueId={null}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentQueue={{ name: 'Performance Analytics', prefix: 'ALL' }}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Date Range Filter:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'Today', value: 'today' },
                { label: 'Last 7 Days', value: '7days' },
                { label: 'Last 30 Days', value: '30days' },
                { label: 'Custom Range', value: 'custom' },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleFilterChange(btn.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filterType === btn.value
                      ? 'bg-[#635BFF] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {btn.label}
                </button>
              ))}

              {filterType === 'custom' && (
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Average Wait Time"
              value={
                kpis
                  ? `${kpis.averageWaitTimeMinutes}m`
                  : '—'
              }
              subtitle="Until service assignment"
              tooltip="Sum of (servedAt - joinedAt) / Tokens assigned for service. Measures time until assignment, not completion."
              icon={Clock}
              colorScheme="indigo"
            />
            <KpiCard
              title="Total Waiting"
              value={kpis ? kpis.totalCurrentlyWaiting : '—'}
              subtitle="Live active queue"
              icon={Users}
              colorScheme="amber"
            />
            <KpiCard
              title="Total Served"
              value={kpis ? kpis.totalServed : '—'}
              subtitle="Assigned & completed"
              icon={CheckCircle2}
              colorScheme="emerald"
            />
            <KpiCard
              title="Total Cancelled"
              value={kpis ? kpis.totalCancelled : '—'}
              subtitle="Cancelled requests"
              icon={XCircle}
              colorScheme="rose"
            />
          </div>

          {/* Wait Time Metric Clarification Callout */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex items-start gap-3">
            <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900 leading-relaxed">
              <span className="font-bold">Metric Definition:</span> Average Wait Time is calculated as{' '}
              <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded text-indigo-700 font-semibold">
                ∑(servedAt - joinedAt) / count(assigned tokens)
              </code>
              . This strictly measures customer wait duration prior to counter assignment, excluding in-service consultation time.
            </p>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Queue Breakdown Bar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Queue Breakdown Comparison
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tokens distributed across waiting, served, and cancelled
                  </p>
                </div>
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>

              <div className="h-72 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : queueBreakdown.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <BarChart3 className="w-8 h-8 mb-2 text-slate-300" />
                    <span>No queue activity recorded in this period</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={queueBreakdown}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                      <Bar dataKey="waiting" name="Waiting" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="served" name="Served" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cancelled" name="Cancelled" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Hourly Token Arrival Line Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Hourly Customer Arrivals
                  </h3>
                  <p className="text-xs text-slate-500">
                    Token creation (joinedAt) distribution over 24 hours
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-slate-400" />
              </div>

              <div className="h-72 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={hourlyArrivals}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="arrivalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#635BFF" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#635BFF" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        interval={3}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="arrivals"
                        name="Arrivals (Joined)"
                        stroke="#635BFF"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#arrivalGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Analytics;
