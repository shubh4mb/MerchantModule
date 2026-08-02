import { useState, useEffect, useMemo } from 'react';
import { Calendar, DollarSign, TrendingUp, Package, Clock, ShieldCheck, Download, RotateCcw, CheckCircle, XCircle, ShoppingCart, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getMerchantAnalytics, getMerchantCurrentWeek } from '../api/analytics';
import { getWeekString, getDatesFromWeekString, getPastWeeks } from '../utils/dateUtils';

const Revenue = () => {
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
  const [currentWeekData, setCurrentWeekData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [analyticsRes, currentWeekRes] = await Promise.all([
          getMerchantAnalytics(startDate, endDate),
          getMerchantCurrentWeek().catch(() => null)
        ]);
        if (analyticsRes.success) setAnalyticsData(analyticsRes);
        if (currentWeekRes?.success) setCurrentWeekData(currentWeekRes);
      } catch (error) {
        console.error("Failed to fetch revenue data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  const stats = useMemo(() => {
    if (!analyticsData?.stats) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalDelivered: 0,
        pendingOrders: 0,
        canceledOrders: 0,
        avgOrderValue: 0,
        deliveryRate: 0
      };
    }
    return {
      ...analyticsData.stats,
      totalDelivered: analyticsData.stats.deliveredOrders || 0,
      canceledOrders: analyticsData.stats.cancelledOrders || 0
    };
  }, [analyticsData]);

  const weeklyData = useMemo(() => analyticsData?.dailyTrend || [], [analyticsData]);

  const orderStatusData = [
    { name: 'Delivered', value: stats.totalDelivered, color: 'var(--color-success)' },
    { name: 'Pending', value: stats.pendingOrders, color: 'var(--color-warning)' },
    { name: 'Canceled', value: stats.canceledOrders, color: 'var(--color-text-tertiary)' },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, prefix = '', suffix = '' }: { title: string, value: string | number, icon: LucideIcon, trend?: 'up' | 'down', trendValue?: string, prefix?: string, suffix?: string }) => (
    <div className="stat-card">
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
        <p className="stat-label">{title}</p>
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
      <div className="flex items-end justify-between">
        <p className="stat-value" style={{ fontSize: "1.5rem" }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </p>
        {trend && (
          <span style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: trend === 'up' ? 'var(--color-success)' : 'var(--color-danger)',
            background: trend === 'up' ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)',
            padding: "2px 8px",
            borderRadius: "12px"
          }}>
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

  const pastWeeks = getPastWeeks(12);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Revenue & Payouts</h1>
          <p>Track your earnings, pending settlements, and financial metrics.</p>
        </div>
        
        {/* Week Dropdown UI */}
        <div style={{ position: 'relative' }}>
          <select 
            value={weekValue} 
            onChange={handleWeekChange}
            className="input"
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

      {/* Current Week Earnings */}
      {currentWeekData && currentWeekData.dailyBreakdown && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <div className="card-header flex items-center justify-between">
            <h4 style={{ fontWeight: 600 }}>This Week's Pending Payout</h4>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-success)" }}>
              ₹{currentWeekData.payout?.netPayout?.toLocaleString('en-IN') || 0}
            </span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={currentWeekData.dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-background-alt)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`₹${value}`, 'Earnings']}
                />
                <Bar dataKey="amount" fill="var(--color-success)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
              {weeklyData.map((day: any, idx: number) => (
                <tr key={idx}>
                  <td>{day.date}</td>
                  <td style={{ fontWeight: 600 }}>₹{day.revenue.toLocaleString()}</td>
                  <td>{day.orders}</td>
                  <td style={{ color: "var(--color-success)" }}>{day.delivered}</td>
                  <td style={{ color: "var(--color-danger)" }}>{day.returns}</td>
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