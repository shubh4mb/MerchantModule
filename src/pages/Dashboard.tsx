import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, RotateCcw, CheckCircle, XCircle, DollarSign, Calendar, ListOrdered, ChevronDown, Plus, ShoppingBag, Tag, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getMerchantAnalytics, getMerchantCurrentWeek } from '../api/analytics';
import { getWeekString, getDatesFromWeekString, getPastWeeks } from '../utils/dateUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const [weekValue, setWeekValue] = useState(() => getWeekString(new Date()));
  const [startDate, setStartDate] = useState(() => {
    return getDatesFromWeekString(getWeekString(new Date())).start;
  });

  const [endDate, setEndDate] = useState(() => {
    return getDatesFromWeekString(getWeekString(new Date())).end;
  });

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setWeekValue(val);
      const dates = getDatesFromWeekString(val);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  };

  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [weeklyEarnings, setWeeklyEarnings] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [analyticsRes, weeklyRes] = await Promise.all([
          getMerchantAnalytics(startDate, endDate),
          getMerchantCurrentWeek()
        ]);
        if (analyticsRes.success) setAnalyticsData(analyticsRes);
        if (weeklyRes.success) setWeeklyEarnings(weeklyRes);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  const stats = analyticsData?.stats || {
    totalRevenue: 0, totalOrders: 0, deliveredOrders: 0, pendingOrders: 0,
    returnedOrders: 0, cancelledOrders: 0, avgOrderValue: 0, returnRate: 0, deliveryRate: 0
  };

  const weeklyData = analyticsData?.dailyTrend || [];
  const topProducts = analyticsData?.topProducts || [];

  const orderStatusData = [
    { name: 'Delivered', value: stats.deliveredOrders, color: 'var(--color-success)' },
    { name: 'Pending', value: stats.pendingOrders, color: 'var(--color-warning)' },
    { name: 'Returns', value: stats.returnedOrders, color: 'var(--color-danger)' },
    { name: 'Canceled', value: stats.cancelledOrders, color: 'var(--color-text-tertiary)' }
  ];

  const StatCard = ({ title, value, icon: Icon, prefix = '', suffix = '' }: { title: string, value: string | number, icon: LucideIcon, prefix?: string, suffix?: string }) => (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
        </div>
        <div
          className="stat-icon"
          style={{
            background: "var(--color-accent-subtle)",
            color: "var(--color-text)",
          }}
        >
          <Icon size={18} />
        </div>
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

  const pastWeeks = getPastWeeks(12);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ marginBottom: "var(--space-4)" }}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening today.</p>
        </div>
        
        {/* Week Dropdown UI */}
        <div className="relative w-full sm:w-auto">
          <select 
            value={weekValue} 
            onChange={handleWeekChange}
            className="input w-full sm:w-auto"
            style={{ 
              paddingRight: '36px', 
              appearance: 'none',
              background: 'white',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {pastWeeks.map(w => (
              <option key={w.value} value={w.value}>
                {w.isCurrent ? 'This Week' : 'Past Week'} ({w.label})
              </option>
            ))}
          </select>
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-secondary)' }}>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      {/* Weekly Payout Banner */}
      {weeklyEarnings?.payout && (
        <div
          onClick={() => navigate('/merchant/revenue')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/merchant/revenue'); }}
          className="card cursor-pointer transition-transform active:scale-[0.99]"
          style={{ marginBottom: "var(--space-4)", background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))", color: "white", border: "none" }}
        >
          <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div>
              <p style={{ fontSize: "var(--text-xs)", opacity: 0.8, color: "white" }}>This Week's Earnings</p>
              <p style={{ fontSize: "1.625rem", fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>₹{(weeklyEarnings.payout.netPayout || 0).toLocaleString()}</p>
              <p style={{ fontSize: "var(--text-xs)", opacity: 0.75, marginTop: 4, color: "white" }}>
                {(weeklyEarnings.payout.orders?.length || 0)} orders settled · View payouts →
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, opacity: 0.85, justifyContent: 'flex-end' }}>
                <Calendar size={14} />
                <span style={{ fontSize: "var(--text-xs)" }}>
                  {weeklyEarnings.weekStart ? new Date(weeklyEarnings.weekStart).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Mon'} - {weeklyEarnings.weekEnd ? new Date(weeklyEarnings.weekEnd).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Sun'}
                </span>
              </div>
              <p style={{ fontSize: "var(--text-sm)", marginTop: 4, fontWeight: 600, color: "white" }}>
                {weeklyEarnings.payout.status === 'accumulating' ? '⏳ Pending' : '✅ ' + weeklyEarnings.payout.status.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3" style={{ marginBottom: "var(--space-4)" }}>
        {[
          { label: 'Orders', sub: `${stats.pendingOrders} pending`, icon: ShoppingBag, to: '/merchant/orders' },
          { label: 'Add Product', sub: 'New catalog item', icon: Plus, to: '/merchant/add-product' },
          { label: 'Inventory', sub: 'Manage stock', icon: Package, to: '/merchant/inventory' },
          { label: 'Offers', sub: 'Discounts & deals', icon: Tag, to: '/merchant/offers' },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.to}
              type="button"
              onClick={() => navigate(action.to)}
              className="card flex items-center justify-between p-3 text-left cursor-pointer active:scale-[0.98] transition-transform"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-accent-subtle)",
                    color: "var(--color-text)",
                  }}
                >
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: "var(--color-text)" }}>{action.label}</div>
                  <div className="text-[11px] truncate" style={{ color: "var(--color-text-secondary)" }}>{action.sub}</div>
                </div>
              </div>
              <ArrowRight size={14} className="shrink-0 hidden sm:block" style={{ color: "var(--color-text-tertiary)" }} />
            </button>
          );
        })}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4" style={{ marginBottom: "var(--space-4)" }}>
        <StatCard title="Total Revenue" value={(stats.totalRevenue || 0).toFixed(2)} icon={DollarSign} prefix="₹" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ListOrdered} />
        <div className="col-span-2 lg:col-span-1">
          <StatCard title="Return Rate" value={(stats.returnRate || 0).toFixed(1)} icon={RotateCcw} suffix="%" />
        </div>
      </div>

      {/* Extended Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4" style={{ marginBottom: "var(--space-5)" }}>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-2)" }}>
            <h4 className="text-xs sm:text-sm font-semibold">Delivered</h4>
            <CheckCircle size={16} style={{ color: "var(--color-success)" }} />
          </div>
          <p className="stat-value">{stats.deliveredOrders}</p>
          <p className="text-[11px] sm:text-xs mt-1 truncate" style={{ color: "var(--color-text-secondary)" }}>
            {(stats.deliveryRate || 0).toFixed(1)}% rate
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-2)" }}>
            <h4 className="text-xs sm:text-sm font-semibold">Pending</h4>
            <Package size={16} style={{ color: "var(--color-warning)" }} />
          </div>
          <p className="stat-value">{stats.pendingOrders}</p>
          <p className="text-[11px] sm:text-xs mt-1 truncate" style={{ color: "var(--color-text-secondary)" }}>
            In progress
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-2)" }}>
            <h4 className="text-xs sm:text-sm font-semibold">Canceled</h4>
            <XCircle size={16} style={{ color: "var(--color-text-tertiary)" }} />
          </div>
          <p className="stat-value">{stats.cancelledOrders}</p>
          <p className="text-[11px] sm:text-xs mt-1 truncate" style={{ color: "var(--color-text-secondary)" }}>
            Canceled
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h4 style={{ fontWeight: 600 }}>Revenue Trend</h4>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weeklyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2} name="Revenue (₹)" dot={false} />
                <Line type="monotone" dataKey="orders" stroke="var(--color-text-tertiary)" strokeWidth={2} name="Orders" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h4 style={{ fontWeight: 600 }}>Status Distribution</h4>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => (percent ?? 0) > 0 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                  outerRadius={70}
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

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        {/* Top Products */}
        <div className="table-wrapper">
          <div className="card-header">
            <h4 style={{ fontWeight: 600 }}>Top Selling Products</h4>
          </div>
          {/* Mobile list view */}
          <div className="sm:hidden divide-y divide-[var(--color-border)]">
            {topProducts.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                No data available
              </div>
            ) : topProducts.map((prod: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>{prod.name}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{prod.soldQuantity} sold</div>
                </div>
                <div className="text-sm font-semibold shrink-0" style={{ color: "var(--color-success)" }}>
                  ₹{prod.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table view */}
          <table className="table hidden sm:table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--color-text-tertiary)", padding: "var(--space-8)" }}>No data available</td></tr>
              ) : topProducts.map((prod: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ maxWidth: "200px" }} className="truncate">{prod.name}</td>
                  <td>{prod.soldQuantity}</td>
                  <td style={{ fontWeight: 600, color: "var(--color-success)" }}>₹{prod.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
