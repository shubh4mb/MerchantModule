import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Package, RotateCcw, CheckCircle, XCircle, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import type { LucideIcon } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// Mock data generator for weekly revenue
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
      delivered: Math.floor(Math.random() * 45) + 15
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

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const weeklyData = useMemo(() => generateWeeklyData(startDate, endDate), [startDate, endDate]);

  const stats = useMemo(() => {
    const totalRevenue = weeklyData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = weeklyData.reduce((sum, day) => sum + day.orders, 0);
    const totalReturns = weeklyData.reduce((sum, day) => sum + day.returns, 0);
    const totalDelivered = weeklyData.reduce((sum, day) => sum + day.delivered, 0);
    const avgOrderValue = totalRevenue / totalOrders;
    const returnRate = (totalReturns / totalOrders) * 100;
    const deliveryRate = (totalDelivered / totalOrders) * 100;

    return {
      totalRevenue,
      totalOrders,
      totalReturns,
      totalDelivered,
      avgOrderValue,
      returnRate,
      deliveryRate,
      pendingOrders: totalOrders - totalDelivered - totalReturns,
      canceledOrders: Math.floor(totalOrders * 0.05)
    };
  }, [weeklyData]);

  const orderStatusData = [
    { name: 'Delivered', value: stats.totalDelivered, color: '#10b981' },
    { name: 'Pending', value: stats.pendingOrders, color: '#f59e0b' },
    { name: 'Returns', value: stats.totalReturns, color: '#ef4444' },
    { name: 'Canceled', value: stats.canceledOrders, color: '#6b7280' }
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
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${Icon === DollarSign ? 'bg-green-100' : Icon === ShoppingCart ? 'bg-blue-100' : Icon === RotateCcw ? 'bg-red-100' : 'bg-purple-100'}`}>
          <Icon className={`w-6 h-6 ${Icon === DollarSign ? 'text-green-600' : Icon === ShoppingCart ? 'text-blue-600' : Icon === RotateCcw ? 'text-red-600' : 'text-purple-600'}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600 mt-2">Track your business performance and key metrics</p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue.toFixed(2)}
            icon={DollarSign}
            trend="up"
            trendValue="+12.5%"
            prefix="$"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingCart}
            trend="up"
            trendValue="+8.2%"
          />
          <StatCard
            title="Avg Order Value"
            value={stats.avgOrderValue.toFixed(2)}
            icon={DollarSign}
            trend="up"
            trendValue="+3.1%"
            prefix="$"
          />
          <StatCard
            title="Return Rate"
            value={stats.returnRate.toFixed(1)}
            icon={RotateCcw}
            trend="down"
            trendValue="-2.3%"
            suffix="%"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Delivered Orders</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalDelivered}</p>
            <p className="text-sm text-gray-600 mt-2">Delivery Rate: {stats.deliveryRate.toFixed(1)}%</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Pending Orders</h3>
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
            <p className="text-sm text-gray-600 mt-2">Awaiting fulfillment</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Canceled Orders</h3>
              <XCircle className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.canceledOrders}</p>
            <p className="text-sm text-gray-600 mt-2">Cancellation Rate: 5.0%</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                  outerRadius={100}
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

        {/* Orders and Returns Chart */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Orders vs Returns vs Delivered</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#3b82f6" name="Total Orders" />
              <Bar dataKey="delivered" fill="#10b981" name="Delivered" />
              <Bar dataKey="returns" fill="#ef4444" name="Returns" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Daily Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Returns</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weeklyData.map((day, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${day.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{day.delivered}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{day.returns}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(day.revenue / day.orders).toFixed(2)}</td>
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

export default Revenue;