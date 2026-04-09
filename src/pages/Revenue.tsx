import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, RotateCcw, CheckCircle, XCircle, DollarSign, ShoppingCart, Calendar, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const generateWeeklyData = (startDate: string, endDate: string) => {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  for (let i = 0; i <= days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 5000) + 2000,
      orders: Math.floor(Math.random() * 50) + 20,
      returns: Math.floor(Math.random() * 10) + 1,
      delivered: Math.floor(Math.random() * 45) + 15,
    });
  }
  return data;
};

const Revenue = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const weeklyData = useMemo(() => generateWeeklyData(startDate, endDate), [startDate, endDate]);

  const stats = useMemo(() => {
    const totalRevenue = weeklyData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = weeklyData.reduce((sum, day) => sum + day.orders, 0);
    const totalReturns = weeklyData.reduce((sum, day) => sum + day.returns, 0);
    const totalDelivered = weeklyData.reduce((sum, day) => sum + day.delivered, 0);
    return {
      totalRevenue, totalOrders, totalReturns, totalDelivered,
      avgOrderValue: totalRevenue / totalOrders,
      returnRate: (totalReturns / totalOrders) * 100,
      deliveryRate: (totalDelivered / totalOrders) * 100,
      pendingOrders: totalOrders - totalDelivered - totalReturns,
      canceledOrders: Math.floor(totalOrders * 0.05),
    };
  }, [weeklyData]);

  const orderStatusData = [
    { name: 'Delivered', value: stats.totalDelivered, color: 'var(--color-success)' },
    { name: 'Pending', value: stats.pendingOrders, color: 'var(--color-warning)' },
    { name: 'Returns', value: stats.totalReturns, color: 'var(--color-danger)' },
    { name: 'Canceled', value: stats.canceledOrders, color: 'var(--color-text-tertiary)' },
  ];

  interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: 'up' | 'down';
    trendValue?: string | number;
    prefix?: string;
    suffix?: string;
  }

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, prefix = '', suffix = '' }: StatCardProps) => (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          {trend && (
            <div className="flex items-center" style={{ marginTop: "var(--space-2)", fontSize: "var(--text-sm)", color: trend === 'up' ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {trend === 'up' ? <TrendingUp size={14} style={{ marginRight: "4px" }} /> : <TrendingDown size={14} style={{ marginRight: "4px" }} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="stat-icon" style={{ background: "var(--color-accent-subtle)", color: "var(--color-text)" }}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Revenue Analytics</h1>
        <p>Track your business performance and key metrics</p>
      </div>

      {/* Date Range */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", alignItems: "center" }}>
          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
            <Calendar size={16} style={{ color: "var(--color-text-secondary)" }} />
            <span style={{ fontWeight: 500, fontSize: "var(--text-sm)" }}>Date Range</span>
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <StatCard title="Total Revenue" value={stats.totalRevenue.toFixed(2)} icon={DollarSign} trend="up" trendValue="+12.5%" prefix="₹" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} trend="up" trendValue="+8.2%" />
        <StatCard title="Avg Order Value" value={stats.avgOrderValue.toFixed(2)} icon={DollarSign} trend="up" trendValue="+3.1%" prefix="₹" />
        <StatCard title="Return Rate" value={stats.returnRate.toFixed(1)} icon={RotateCcw} trend="down" trendValue="-2.3%" suffix="%" />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
            <h4 style={{ fontWeight: 600 }}>Delivered</h4>
            <CheckCircle size={18} style={{ color: "var(--color-success)" }} />
          </div>
          <p className="stat-value">{stats.totalDelivered}</p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>
            Delivery Rate: {stats.deliveryRate.toFixed(1)}%
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
            <h4 style={{ fontWeight: 600 }}>Pending</h4>
            <Package size={18} style={{ color: "var(--color-warning)" }} />
          </div>
          <p className="stat-value">{stats.pendingOrders}</p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>Awaiting fulfillment</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
            <h4 style={{ fontWeight: 600 }}>Canceled</h4>
            <XCircle size={18} style={{ color: "var(--color-text-tertiary)" }} />
          </div>
          <p className="stat-value">{stats.canceledOrders}</p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>Cancellation Rate: 5.0%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card">
          <div className="card-header"><h4 style={{ fontWeight: 600 }}>Revenue Trend</h4></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
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
                <Pie data={orderStatusData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                  outerRadius={90} fill="#8884d8" dataKey="value">
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

      {/* Bar Chart */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-header"><h4 style={{ fontWeight: 600 }}>Orders vs Returns vs Delivered</h4></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="var(--color-accent)" name="Total Orders" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delivered" fill="var(--color-success)" name="Delivered" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returns" fill="var(--color-danger)" name="Returns" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="table-wrapper">
        <div className="card-header"><h4 style={{ fontWeight: 600 }}>Daily Breakdown</h4></div>
        <div style={{ overflowX: "auto" }}>
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
              {weeklyData.map((day, idx) => (
                <tr key={idx}>
                  <td>{day.date}</td>
                  <td style={{ fontWeight: 600 }}>₹{day.revenue.toLocaleString()}</td>
                  <td>{day.orders}</td>
                  <td style={{ color: "var(--color-success)" }}>{day.delivered}</td>
                  <td style={{ color: "var(--color-danger)" }}>{day.returns}</td>
                  <td>₹{(day.revenue / day.orders).toFixed(2)}</td>
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