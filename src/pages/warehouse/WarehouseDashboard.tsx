import React, { useState, useEffect, useCallback } from 'react';
import { Package, TrendingUp, Clock, CheckCircle, Warehouse as WarehouseIcon } from 'lucide-react';
import { fetchWarehouseStats } from '../../api/warehouseOrder';

interface Stats {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

const WarehouseDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchWarehouseStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load warehouse stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const statCards = [
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: '#6366f1',
      bgColor: 'rgba(99, 102, 241, 0.1)',
    },
    {
      label: 'Today\'s Orders',
      value: stats?.todayOrders || 0,
      icon: Clock,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      label: 'Pending Acceptance',
      value: stats?.pendingOrders || 0,
      icon: TrendingUp,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
    },
    {
      label: 'Completed',
      value: stats?.completedOrders || 0,
      icon: CheckCircle,
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WarehouseIcon size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Warehouse Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Real-time overview of your warehouse operations
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              style={{
                background: 'var(--color-card)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: card.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} color={card.color} />
                </div>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  {card.label}
                </span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {card.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '16px',
          padding: '24px',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: '14px', opacity: 0.85, marginBottom: '8px' }}>Total Revenue</div>
        <div style={{ fontSize: '36px', fontWeight: 700 }}>
          ₹{(stats?.totalRevenue || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
          From completed & delivered orders
        </div>
      </div>
    </div>
  );
};

export default WarehouseDashboard;
