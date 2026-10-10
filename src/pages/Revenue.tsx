import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Package,
  RotateCcw,
  CheckCircle,
  XCircle,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Wallet,
  ExternalLink,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getMerchantAnalytics,
  getMerchantCurrentWeek,
  getMerchantWallet,
  getMerchantPayoutHistory,
} from '../api/analytics';
import {
  getDatesFromWeekString,
  getPastWeeks,
} from '../utils/dateUtils';

interface PayoutLog {
  _id: string;
  amount?: number;
  finalAmount?: number;
  netPayout?: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'paid' | 'failed' | 'finalized' | 'accumulating' | 'completed';
  createdAt: string;
  weekStart?: string;
  weekEnd?: string;
  transactionId?: string;
  referenceNumber?: string;
  paymentMethod?: string;
  totalEarnings?: number;
  totalGrossSales?: number;
  totalCommission?: number;
  totalDeductions?: number;
  adminDeduction?: {
    amount: number;
    reason: string;
  };
  receipt?: {
    url?: string;
    public_id?: string;
  };
  paidAt?: string;
}

interface WeekDailyItem {
  day: string;
  amount: number;
  date?: string;
}

const Revenue = () => {
  const pastWeeks = useMemo(() => getPastWeeks(12), []);
  const [selectedWeekVal, setSelectedWeekVal] = useState(() => pastWeeks[0].value);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [expandedPayoutId, setExpandedPayoutId] = useState<string | null>(null);

  const selectedWeekOption = useMemo(() => {
    return pastWeeks.find((w) => w.value === selectedWeekVal) || pastWeeks[0];
  }, [pastWeeks, selectedWeekVal]);

  const dates = useMemo(() => {
    return getDatesFromWeekString(selectedWeekVal);
  }, [selectedWeekVal]);

  // Loading & Data States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [currentWeekData, setCurrentWeekData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [payouts, setPayouts] = useState<PayoutLog[]>([]);

  // Fetch Base Data (Wallet + Current Week Payout + History)
  const fetchBaseFinancials = async () => {
    try {
      const [walletRes, currentWeekRes, historyRes] = await Promise.all([
        getMerchantWallet().catch(() => ({ balance: 0 })),
        getMerchantCurrentWeek().catch(() => null),
        getMerchantPayoutHistory(1, 20).catch(() => ({ payouts: [] })),
      ]);

      if (walletRes?.balance !== undefined) {
        setWalletBalance(walletRes.balance);
      }
      if (currentWeekRes?.success) {
        setCurrentWeekData(currentWeekRes);
      }
      const historyList = historyRes?.history || historyRes?.payouts || [];
      setPayouts(historyList);
    } catch (err) {
      console.error('Failed to fetch base financials:', err);
    }
  };

  // Fetch Analytics for the selected week
  const fetchWeekAnalytics = async (start: string, end: string) => {
    try {
      const analyticsRes = await getMerchantAnalytics(start, end);
      if (analyticsRes?.success) {
        setAnalyticsData(analyticsRes);
      }
    } catch (err) {
      console.error('Failed to fetch analytics for week:', err);
    }
  };

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchBaseFinancials(),
      fetchWeekAnalytics(dates.start, dates.end),
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // When week selector changes
  useEffect(() => {
    fetchWeekAnalytics(dates.start, dates.end);
  }, [dates.start, dates.end]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchBaseFinancials(),
      fetchWeekAnalytics(dates.start, dates.end),
    ]);
    setIsRefreshing(false);
  };

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2500);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    if (!analyticsData?.stats) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalDelivered: 0,
        pendingOrders: 0,
        canceledOrders: 0,
        avgOrderValue: 0,
        deliveryRate: 0,
        returnRate: 0,
      };
    }
    return {
      ...analyticsData.stats,
      totalDelivered: analyticsData.stats.deliveredOrders || 0,
      canceledOrders: analyticsData.stats.cancelledOrders || 0,
    };
  }, [analyticsData]);

  // Daily Breakdown for the Bar Chart
  const dailyBreakdown = useMemo((): WeekDailyItem[] => {
    if (selectedWeekOption.isCurrent && currentWeekData?.dailyBreakdown) {
      return currentWeekData.dailyBreakdown;
    }

    const dayMap: Record<string, number> = {
      Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
    };

    const dailyTrend = analyticsData?.dailyTrend || [];
    dailyTrend.forEach((item: any) => {
      if (item.date) {
        const d = new Date(item.date);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[d.getDay()];
        if (dayMap[dayName] !== undefined) {
          dayMap[dayName] += item.revenue || item.amount || 0;
        }
      }
    });

    return [
      { day: 'Mon', amount: dayMap.Mon },
      { day: 'Tue', amount: dayMap.Tue },
      { day: 'Wed', amount: dayMap.Wed },
      { day: 'Thu', amount: dayMap.Thu },
      { day: 'Fri', amount: dayMap.Fri },
      { day: 'Sat', amount: dayMap.Sat },
      { day: 'Sun', amount: dayMap.Sun },
    ];
  }, [selectedWeekOption.isCurrent, currentWeekData, analyticsData]);

  // Find linked historical payout for the selected week if it's a past week
  const matchedPastPayout = useMemo(() => {
    if (selectedWeekOption.isCurrent) return null;
    return payouts.find((p) => {
      if (!p.weekStart) return false;
      const pStart = p.weekStart.split('T')[0];
      return pStart === dates.start;
    });
  }, [selectedWeekOption.isCurrent, payouts, dates.start]);

  const weeklyTrendData = useMemo(() => analyticsData?.dailyTrend || [], [analyticsData]);

  const orderStatusData = [
    { name: 'Delivered', value: stats.totalDelivered, color: 'var(--color-success)' },
    { name: 'Pending', value: stats.pendingOrders, color: 'var(--color-warning)' },
    { name: 'Canceled', value: stats.canceledOrders, color: 'var(--color-text-tertiary)' },
  ];

  const getPayoutStatusBadge = (status: string) => {
    const st = (status || '').toLowerCase();
    if (st === 'paid' || st === 'success' || st === 'completed') {
      return { label: 'PAID', bg: '#DCFCE7', text: '#15803D', icon: CheckCircle };
    }
    if (st === 'accumulating' || st === 'pending') {
      return { label: 'ACCUMULATING', bg: '#FEF3C7', text: '#B45309', icon: Clock };
    }
    if (st === 'finalized') {
      return { label: 'FINALIZED', bg: '#E0E7FF', text: '#4338CA', icon: ShieldCheck };
    }
    return { label: 'FAILED', bg: '#FEE2E2', text: '#B91C1C', icon: AlertCircle };
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    prefix = '',
    suffix = '',
  }: {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: 'up' | 'down';
    trendValue?: string;
    prefix?: string;
    suffix?: string;
  }) => (
    <div className="stat-card">
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
        <p className="stat-label">{title}</p>
        <div
          className="stat-icon"
          style={{
            background: 'var(--color-accent-subtle)',
            color: 'var(--color-text)',
          }}
        >
          <Icon size={18} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="stat-value" style={{ fontSize: '1.5rem' }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
        </p>
        {trend && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: trend === 'up' ? 'var(--color-success)' : 'var(--color-danger)',
              background: trend === 'up' ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
              padding: '2px 8px',
              borderRadius: '12px',
            }}
          >
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );

  if (isLoading && !analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1240px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ── TOP HEADER & REFRESH ── */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Revenue & Payouts</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Live wallet balance, weekly Tuesday direct settlements, and financial audit.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn btn-secondary w-full sm:w-auto justify-center"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Updating...' : 'Refresh Records'}
        </button>
      </div>

      {/* ── TOP HERO CARD: LIVE WALLET & SETTLEMENT SCHEDULE ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          color: '#FFFFFF',
          marginBottom: 'var(--space-6)',
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.85, fontSize: '0.875rem' }}>
              <Wallet size={16} color="#34D399" />
              <span>Current Live Wallet Balance</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '6px', letterSpacing: '-0.03em' }}>
              ₹{walletBalance.toLocaleString('en-IN')}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '9999px',
              padding: '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#34D399',
            }}
          >
            <Clock size={14} />
            <span>Weekly Tuesday Auto-Payout</span>
          </div>
        </div>

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.12)', margin: '20px 0 16px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Week's Pending</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
              ₹{(currentWeekData?.payout?.netPayout ?? currentWeekData?.payout?.totalEarnings ?? 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next Direct Settlement</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px', color: '#93C5FD' }}>
              Upcoming Tuesday
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Cycle Status</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px', color: '#34D399' }}>
              {currentWeekData?.payout?.status ? currentWeekData.payout.status.toUpperCase() : 'ACCUMULATING'}
            </p>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE WEEK SELECTOR CONTROLS ── */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginRight: '4px' }}>
            Quick Select:
          </span>
          <button
            onClick={() => setSelectedWeekVal(pastWeeks[0].value)}
            className={`btn ${selectedWeekVal === pastWeeks[0].value ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8125rem', height: '34px' }}
          >
            This Week (Live)
          </button>
          <button
            onClick={() => setSelectedWeekVal(pastWeeks[1].value)}
            className={`btn ${selectedWeekVal === pastWeeks[1].value ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8125rem', height: '34px' }}
          >
            Last Week
          </button>
          <button
            onClick={() => setSelectedWeekVal(pastWeeks[2].value)}
            className={`btn ${selectedWeekVal === pastWeeks[2].value ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8125rem', height: '34px' }}
          >
            2 Wks Ago
          </button>
        </div>

        {/* Custom Week Dropdown */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <select
            value={selectedWeekVal}
            onChange={(e) => setSelectedWeekVal(e.target.value)}
            className="input"
            style={{
              paddingRight: '36px',
              appearance: 'none',
              background: 'white',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              width: '100%',
              height: '38px',
            }}
          >
            {pastWeeks.map((w, idx) => (
              <option key={w.value} value={w.value}>
                {w.isCurrent ? '⚡ This Week (Live Active)' : `Week ${12 - idx} (${w.label})`}
              </option>
            ))}
          </select>
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-secondary)' }}>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* ── SELECTED WEEK SUMMARY & DAILY BAR CHART ── */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {selectedWeekOption.isCurrent ? "This Week's Projected Payout" : `Finalized Payout for ${selectedWeekOption.label}`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)' }}>
                ₹
                {selectedWeekOption.isCurrent
                  ? (currentWeekData?.payout?.netPayout ?? stats.totalRevenue).toLocaleString('en-IN')
                  : (matchedPastPayout?.finalAmount ?? matchedPastPayout?.netPayout ?? stats.totalRevenue).toLocaleString('en-IN')}
              </span>

              {/* Status Badge */}
              {(() => {
                const statusKey = selectedWeekOption.isCurrent
                  ? (currentWeekData?.payout?.status || 'accumulating')
                  : (matchedPastPayout?.status || (stats.totalRevenue > 0 ? 'finalized' : 'accumulating'));
                const badge = getPayoutStatusBadge(statusKey);
                const BadgeIcon = badge.icon;
                return (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: badge.bg,
                      color: badge.text,
                    }}
                  >
                    <BadgeIcon size={12} />
                    {badge.label}
                  </span>
                );
              })()}
            </div>

            {/* Platform 4% Commission Split Breakdown */}
            {(() => {
              const netVal = selectedWeekOption.isCurrent
                ? (currentWeekData?.payout?.netPayout ?? stats.totalRevenue ?? 0)
                : (matchedPastPayout?.finalAmount ?? matchedPastPayout?.netPayout ?? stats.totalRevenue ?? 0);
              const grossVal = selectedWeekOption.isCurrent
                ? (currentWeekData?.payout?.totalGrossSales || (netVal > 0 ? Math.round(netVal / 0.96) : 0))
                : (matchedPastPayout?.totalGrossSales || (netVal > 0 ? Math.round(netVal / 0.96) : 0));
              const commVal = selectedWeekOption.isCurrent
                ? (currentWeekData?.payout?.totalCommission || Math.max(0, grossVal - netVal))
                : (matchedPastPayout?.totalCommission || Math.max(0, grossVal - netVal));

              if (grossVal <= 0) return null;

              return (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '8px',
                    fontSize: '0.78125rem',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    width: 'fit-content',
                  }}
                >
                  <span>Gross Sales: <strong style={{ color: 'var(--color-text)' }}>₹{grossVal.toLocaleString('en-IN')}</strong></span>
                  <span>•</span>
                  <span>Flashfits 4% Cut: <strong style={{ color: '#EF4444' }}>-₹{commVal.toLocaleString('en-IN')}</strong></span>
                  <span>•</span>
                  <span>Net Payout: <strong style={{ color: '#10B981' }}>₹{netVal.toLocaleString('en-IN')}</strong></span>
                </div>
              );
            })()}
          </div>

          {/* Paid Notice with UTR & Receipt */}
          {!selectedWeekOption.isCurrent && matchedPastPayout?.paidAt && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              <CheckCircle size={15} />
              <span>
                Transferred on{' '}
                {new Date(matchedPastPayout.paidAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {matchedPastPayout.referenceNumber && (
                <button
                  onClick={() => handleCopyUtr(matchedPastPayout.referenceNumber!)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '8px',
                    padding: '2px 8px',
                    background: '#FFFFFF',
                    borderRadius: '4px',
                    border: '1px solid #86EFAC',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                  title="Copy UTR Reference"
                >
                  <CreditCard size={12} />
                  <span>UTR: {matchedPastPayout.referenceNumber}</span>
                  {copiedUtr === matchedPastPayout.referenceNumber ? <Check size={12} color="#15803D" /> : <Copy size={12} />}
                </button>
              )}
              {matchedPastPayout.receipt?.url && (
                <a
                  href={matchedPastPayout.receipt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '6px',
                    padding: '2px 8px',
                    background: '#FFFFFF',
                    color: '#2563EB',
                    borderRadius: '4px',
                    border: '1px solid #BFDBFE',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <span>View Receipt</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}

          {/* Finalized Cycle Notice */}
          {!selectedWeekOption.isCurrent && (matchedPastPayout?.status === 'finalized' || (!matchedPastPayout && stats.totalRevenue > 0)) && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#EEF2FF',
                color: '#4338CA',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '1px solid #C7D2FE',
              }}
            >
              <ShieldCheck size={16} />
              <span>Weekly Cycle Finalized: Bank transfer is currently being executed by FlashFits team.</span>
            </div>
          )}
        </div>

        <div className="card-body">
          <h4 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>
            Daily Earnings Breakdown (Mon - Sun)
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
              <Tooltip
                cursor={{ fill: 'var(--color-background-alt)' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, 'Earnings']}
              />
              <Bar dataKey="amount" fill="var(--color-success)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── METRICS GRID FOR SELECTED WEEK ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4" style={{ marginBottom: 'var(--space-4)' }}>
        <StatCard title="Gross Revenue" value={stats.totalRevenue.toFixed(2)} icon={DollarSign} trend="up" trendValue="+12.5%" prefix="₹" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} trend="up" trendValue="+8.2%" />
        <StatCard title="Avg Order Value" value={stats.avgOrderValue.toFixed(2)} icon={TrendingUp} trend="up" trendValue="+3.1%" prefix="₹" />
        <StatCard title="Return Rate" value={stats.returnRate.toFixed(1)} icon={RotateCcw} trend="down" trendValue="-2.3%" suffix="%" />
      </div>

      {/* ── SECONDARY METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
            <h4 style={{ fontWeight: 600 }}>Delivered</h4>
            <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <p className="stat-value">{stats.totalDelivered}</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
            Delivery Rate: {stats.deliveryRate.toFixed(1)}%
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
            <h4 style={{ fontWeight: 600 }}>Pending Fulfillment</h4>
            <Package size={18} style={{ color: 'var(--color-warning)' }} />
          </div>
          <p className="stat-value">{stats.pendingOrders}</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>Awaiting pickup or delivery</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
            <h4 style={{ fontWeight: 600 }}>Canceled Orders</h4>
            <XCircle size={18} style={{ color: 'var(--color-text-tertiary)' }} />
          </div>
          <p className="stat-value">{stats.canceledOrders}</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>Cancellation Rate: 5.0%</p>
        </div>
      </div>

      {/* ── ITEMIZED PAYOUT LOG HISTORY (BANK DIRECT TRANSFERS) ── */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '1.0625rem' }}>Itemized Payout Log History</h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Complete record of automated Tuesday bank deposits and platform settlements
            </p>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {payouts.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <CreditCard size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>No Historical Payouts Yet</p>
              <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                Completed orders accumulate each week and settle automatically every Tuesday.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Settlement Period</th>
                    <th>Gross Sales</th>
                    <th>Commission Deductions</th>
                    <th>Penalties/Damages</th>
                    <th>Net Amount Transferred</th>
                    <th>Bank UTR / Ref</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((item) => {
                    const badge = getPayoutStatusBadge(item.status);
                    const BadgeIcon = badge.icon;
                    const displayAmount = item.finalAmount ?? item.netPayout ?? item.amount ?? 0;
                    const grossAmount = item.totalEarnings ?? displayAmount;
                    const commissionDeduction = item.totalDeductions ?? 0;
                    const penaltyDeduction = item.adminDeduction?.amount ?? 0;
                    const isExpanded = expandedPayoutId === item._id;

                    let periodLabel = new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                    if (item.weekStart && item.weekEnd) {
                      const s = new Date(item.weekStart).toLocaleDateString([], { month: 'short', day: 'numeric' });
                      const e = new Date(item.weekEnd).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                      periodLabel = `${s} - ${e}`;
                    }

                    return (
                      <React.Fragment key={item._id}>
                        <tr style={{ background: isExpanded ? 'var(--color-surface-hover)' : 'transparent' }}>
                          <td style={{ fontWeight: 600 }}>{periodLabel}</td>
                          <td>₹{grossAmount.toLocaleString('en-IN')}</td>
                          <td style={{ color: commissionDeduction > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                            {commissionDeduction > 0 ? `-₹${commissionDeduction.toLocaleString('en-IN')}` : '₹0'}
                          </td>
                          <td style={{ color: penaltyDeduction > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                            {penaltyDeduction > 0 ? `-₹${penaltyDeduction.toLocaleString('en-IN')}` : '₹0'}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.9375rem' }}>
                            ₹{displayAmount.toLocaleString('en-IN')}
                          </td>
                          <td>
                            {item.referenceNumber ? (
                              <button
                                onClick={() => handleCopyUtr(item.referenceNumber!)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  background: 'var(--color-surface-hover)',
                                  borderRadius: '4px',
                                  border: '1px solid var(--color-border)',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                }}
                              >
                                <span>{item.referenceNumber}</span>
                                {copiedUtr === item.referenceNumber ? <Check size={12} color="#15803D" /> : <Copy size={12} />}
                              </button>
                            ) : (
                              <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8125rem' }}>Pending</span>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                backgroundColor: badge.bg,
                                color: badge.text,
                              }}
                            >
                              <BadgeIcon size={10} />
                              {badge.label}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setExpandedPayoutId(isExpanded ? null : item._id)}
                              className="btn btn-ghost"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable Breakdown Drawer */}
                        {isExpanded && (
                          <tr style={{ background: 'var(--color-surface-hover)' }}>
                            <td colSpan={8} style={{ padding: '16px 24px', borderTop: 'none' }}>
                              <div
                                style={{
                                  background: '#FFFFFF',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: '16px 20px',
                                  maxWidth: '640px',
                                }}
                              >
                                <h5 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.875rem' }}>
                                  Itemized Settlement Breakdown
                                </h5>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
                                  <span style={{ color: 'var(--color-text-secondary)' }}>Gross Product Earnings:</span>
                                  <span style={{ fontWeight: 600 }}>₹{grossAmount.toLocaleString('en-IN')}</span>
                                </div>

                                {commissionDeduction > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem', color: 'var(--color-danger)' }}>
                                    <span>Platform Commission Deductions:</span>
                                    <span>-₹{commissionDeduction.toLocaleString('en-IN')}</span>
                                  </div>
                                )}

                                {penaltyDeduction > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem', color: 'var(--color-danger)' }}>
                                    <span>Damage Adjustment ({item.adminDeduction?.reason || 'Penalty'}):</span>
                                    <span>-₹{penaltyDeduction.toLocaleString('en-IN')}</span>
                                  </div>
                                )}

                                <div style={{ height: '1px', background: 'var(--color-border)', margin: '8px 0' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700 }}>
                                  <span>Final Bank Transfer Net:</span>
                                  <span style={{ color: 'var(--color-success)', fontSize: '1rem' }}>₹{displayAmount.toLocaleString('en-IN')}</span>
                                </div>

                                {item.paidAt && (
                                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
                                    Disbursed to merchant bank account on {new Date(item.paidAt).toLocaleString()}
                                  </p>
                                )}

                                {item.receipt?.url && (
                                  <div style={{ marginTop: '10px' }}>
                                    <a
                                      href={item.receipt.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '5px 12px',
                                        background: '#EFF6FF',
                                        color: '#2563EB',
                                        borderRadius: '6px',
                                        border: '1px solid #BFDBFE',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                      }}
                                    >
                                      <span>View Official Transfer Receipt</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── CHARTS (REVENUE TREND & STATUS DISTRIBUTION) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="card">
          <div className="card-header"><h4 style={{ fontWeight: 600 }}>Revenue Trend</h4></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2} name="Revenue (₹)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h4 style={{ fontWeight: 600 }}>Status Distribution</h4></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── DAILY BREAKDOWN TABLE ── */}
      <div className="table-wrapper">
        <div className="card-header"><h4 style={{ fontWeight: 600 }}>Daily Performance Breakdown</h4></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue</th>
                <th>Orders</th>
                <th>Delivered</th>
                <th>Returns</th>
                <th>Avg Value</th>
              </tr>
            </thead>
            <tbody>
              {weeklyTrendData.map((day: any, idx: number) => (
                <tr key={idx}>
                  <td>{day.date}</td>
                  <td style={{ fontWeight: 600 }}>₹{day.revenue.toLocaleString('en-IN')}</td>
                  <td>{day.orders}</td>
                  <td style={{ color: 'var(--color-success)' }}>{day.delivered}</td>
                  <td style={{ color: 'var(--color-danger)' }}>{day.returns}</td>
                  <td>₹{(day.orders > 0 ? day.revenue / day.orders : 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Revenue;