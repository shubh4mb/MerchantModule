import { useState, useEffect } from 'react';
import { Package, RotateCcw, CheckCircle, XCircle, DollarSign, Wallet, Calendar, ListOrdered, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getMerchantAnalytics, getMerchantWallet, getMerchantCurrentWeek } from '../api/analytics';

const Dashboard = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [weeklyEarnings, setWeeklyEarnings] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [analyticsRes, walletRes, weeklyRes] = await Promise.all([
          getMerchantAnalytics(startDate, endDate),
          getMerchantWallet(),
          getMerchantCurrentWeek()
        ]);
        if (analyticsRes.success) setAnalyticsData(analyticsRes);
        if (walletRes.success) setWalletData(walletRes);
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

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening today.</p>
      </div>

      {/* Date Range Selector */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", alignItems: "center" }}>
          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
            <Calendar size={16} style={{ color: "var(--color-text-secondary)" }} />
            <span style={{ fontWeight: 500, fontSize: "var(--text-sm)", color: "var(--color-text)" }}>Date Range</span>
          </div>
          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" style={{ width: "auto" }} />
          </div>
          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
            <label style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" style={{ width: "auto" }} />
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      {/* Weekly Payout Banner */}
      {weeklyEarnings?.payout && (
        <div className="card" style={{ marginBottom: "var(--space-4)", background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))", color: "white", border: "none" }}>
          <div className="card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-4)" }}>
            <div>
              <p style={{ fontSize: "var(--text-sm)", opacity: 0.85 }}>This Week's Pending Payout</p>
              <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>₹{(weeklyEarnings.payout.netPayout || 0).toLocaleString()}</p>
              <p style={{ fontSize: "var(--text-xs)", opacity: 0.7, marginTop: 4 }}>
                {(weeklyEarnings.payout.orders?.length || 0)} orders settled
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, opacity: 0.85 }}>
                <Clock size={14} />
                <span style={{ fontSize: "var(--text-xs)" }}>Payout on Tuesday</span>
              </div>
              <p style={{ fontSize: "var(--text-sm)", marginTop: 4, fontWeight: 600 }}>
                {weeklyEarnings.payout.status === 'accumulating' ? '⏳ Accumulating' : '✅ ' + weeklyEarnings.payout.status}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <StatCard title="Total Revenue" value={(stats.totalRevenue || 0).toFixed(2)} icon={DollarSign} prefix="₹" />
        <StatCard title="Wallet Balance" value={(walletData?.balance || 0).toFixed(2)} icon={Wallet} prefix="₹" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ListOrdered} />
        <StatCard title="Return Rate" value={(stats.returnRate || 0).toFixed(1)} icon={RotateCcw} suffix="%" />
      </div>

      {/* Extended Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
            <h4 style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>Delivered</h4>
            <CheckCircle size={18} style={{ color: "var(--color-success)" }} />
          </div>
          <p className="stat-value">{stats.deliveredOrders}</p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>
            Delivery Rate: {(stats.deliveryRate || 0).toFixed(1)}%
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
            <h4 style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>Pending</h4>
            <Package size={18} style={{ color: "var(--color-warning)" }} />
          </div>
          <p className="stat-value">{stats.pendingOrders}</p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>
            Awaiting fulfillment
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
            <h4 style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>Canceled</h4>
            <XCircle size={18} style={{ color: "var(--color-text-tertiary)" }} />
          </div>
          <p className="stat-value">{stats.cancelledOrders}</p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>
            Orders canceled
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
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
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
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => (percent ?? 0) > 0 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                  outerRadius={75}
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
          <table className="table">
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

        {/* Wallet Transactions */}
        <div className="table-wrapper" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ fontWeight: 600 }}>Recent Transactions</h4>
            <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-success)" }}>₹{(walletData?.balance || 0).toFixed(2)}</span>
          </div>
          <div style={{ overflowY: "auto", maxHeight: "300px" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {!walletData || walletData.transactions?.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--color-text-tertiary)", padding: "var(--space-8)" }}>No recent transactions</td></tr>
                ) : walletData.transactions.slice().reverse().slice(0, 10).map((tx: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td>{tx.description || tx.type.toUpperCase()}</td>
                    <td style={{
                      textAlign: "right",
                      fontWeight: 600,
                      color: tx.type === 'credit' ? 'var(--color-success)' : 'var(--color-danger)'
                    }}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
