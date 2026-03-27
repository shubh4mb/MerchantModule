import { useState, useEffect } from 'react';
import { Package, RotateCcw, CheckCircle, XCircle, DollarSign, Wallet, Calendar, ListOrdered } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getMerchantAnalytics, getMerchantWallet } from '../api/analytics';

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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [analyticsRes, walletRes] = await Promise.all([
          getMerchantAnalytics(startDate, endDate),
          getMerchantWallet()
        ]);
        if (analyticsRes.success) setAnalyticsData(analyticsRes);
        if (walletRes.success) setWalletData(walletRes);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  const stats = analyticsData?.stats || {
    totalRevenue: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    returnedOrders: 0,
    cancelledOrders: 0,
    avgOrderValue: 0,
    returnRate: 0,
    deliveryRate: 0
  };

  const weeklyData = analyticsData?.dailyTrend || [];
  const topProducts = analyticsData?.topProducts || [];

  const orderStatusData = [
    { name: 'Delivered', value: stats.deliveredOrders, color: '#10b981' },
    { name: 'Pending', value: stats.pendingOrders, color: '#f59e0b' },
    { name: 'Returns', value: stats.returnedOrders, color: '#ef4444' },
    { name: 'Canceled', value: stats.cancelledOrders, color: '#6b7280' }
  ];

  const StatCard = ({ title, value, icon: Icon, prefix = '', suffix = '' }: { title: string, value: string | number, icon: LucideIcon, prefix?: string, suffix?: string }) => (
    <div className="bg-white rounded-lg shadow !p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 !mt-2">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
        </div>
        <div className={`!p-3 rounded-full ${Icon === DollarSign || Icon === Wallet ? 'bg-green-100' : Icon === ListOrdered ? 'bg-blue-100' : Icon === RotateCcw ? 'bg-red-100' : 'bg-purple-100'}`}>
          <Icon className={`w-6 h-6 ${Icon === DollarSign || Icon === Wallet ? 'text-green-600' : Icon === ListOrdered ? 'text-blue-600' : Icon === RotateCcw ? 'text-red-600' : 'text-purple-600'}`} />
        </div>
      </div>
    </div>
  );

  if (isLoading && !analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 !p-8">
      <div className="max-w-7xl !mx-auto">
        {/* Header */}
        <div className="!mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 !mt-2">Welcome back! Here's what's happening today.</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow !p-6 !mb-6 border border-gray-200 flex flex-wrap gap-4 items-center">
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
              className="border border-gray-300 rounded !px-3 !py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded !px-3 !py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 !mb-6">
          <StatCard
            title="Total Revenue"
            value={(stats.totalRevenue || 0).toFixed(2)}
            icon={DollarSign}
            prefix="₹"
          />
          <StatCard
            title="Available Wallet Balance"
            value={(walletData?.balance || 0).toFixed(2)}
            icon={Wallet}
            prefix="₹"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ListOrdered}
          />
          <StatCard
            title="Return Rate"
            value={(stats.returnRate || 0).toFixed(1)}
            icon={RotateCcw}
            suffix="%"
          />
        </div>

        {/* Extended Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 !mb-6">
          <div className="bg-white rounded-lg shadow !p-6 border border-gray-200">
            <div className="flex items-center justify-between !mb-4">
              <h3 className="font-semibold text-gray-900">Delivered</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.deliveredOrders}</p>
            <p className="text-sm text-gray-600 !mt-2">Delivery Rate: {(stats.deliveryRate || 0).toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-lg shadow !p-6 border border-gray-200">
            <div className="flex items-center justify-between !mb-4">
              <h3 className="font-semibold text-gray-900">Pending</h3>
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
            <p className="text-sm text-gray-600 !mt-2">Awaiting fulfillment or delivery</p>
          </div>
          <div className="bg-white rounded-lg shadow !p-6 border border-gray-200">
            <div className="flex items-center justify-between !mb-4">
              <h3 className="font-semibold text-gray-900">Canceled</h3>
              <XCircle className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.cancelledOrders}</p>
            <p className="text-sm text-gray-600 !mt-2">Orders canceled</p>
          </div>
        </div>

        {/* Charts & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 !mb-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow !p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 !mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue (₹)" />
                <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow !p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 !mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => (percent ?? 0) > 0 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                  outerRadius={80}
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

        {/* Two Tables Row: Top Products & Wallet Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 !mb-6">
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="!p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Top Selling Products</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                    <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                    <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topProducts.length === 0 ? (
                    <tr><td colSpan={3} className="!p-4 text-center text-gray-500">No data available for this range</td></tr>
                  ) : topProducts.map((prod: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="!px-6 !py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-[200px]">{prod.name}</td>
                      <td className="!px-6 !py-4 whitespace-nowrap text-sm text-gray-900">{prod.soldQuantity}</td>
                      <td className="!px-6 !py-4 whitespace-nowrap text-sm font-medium text-green-600">₹{prod.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 flex flex-col h-full">
            <div className="!p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Recent Wallet Transactions</h3>
              <span className="text-xl font-bold text-green-600">₹{(walletData?.balance || 0).toFixed(2)}</span>
            </div>
            <div className="overflow-y-auto max-h-[300px]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="!px-6 !py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="!px-6 !py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {!walletData || walletData.transactions?.length === 0 ? (
                    <tr><td colSpan={3} className="!p-4 text-center text-gray-500">No recent transactions</td></tr>
                  ) : walletData.transactions.slice().reverse().slice(0, 10).map((tx: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="!px-6 !py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="!px-6 !py-4 text-sm text-gray-900">
                        {tx.description || tx.type.toUpperCase()}
                      </td>
                      <td className={`!px-6 !py-4 whitespace-nowrap text-sm font-medium text-right ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
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
    </div>
  );
};

export default Dashboard;
