import React, { useState, useEffect } from 'react';
import { ShoppingBag, History, AlertCircle } from 'lucide-react';
import { createZipCoverOrder, getMyZipCoverOrders } from '../api/zipCovers';
import type { ZipCoverOrder } from '../api/zipCovers';

const ZipCovers: React.FC = () => {
  const [orders, setOrders] = useState<ZipCoverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [small, setSmall] = useState(0);
  const [medium, setMedium] = useState(0);
  const [large, setLarge] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getMyZipCoverOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load zip cover orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (small === 0 && medium === 0 && large === 0) {
      setError('Please select at least one zip cover.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const newOrder = await createZipCoverOrder(small, medium, large);
      setOrders([newOrder, ...orders]);
      // Reset form
      setSmall(0);
      setMedium(0);
      setLarge(0);
      alert('Zip covers ordered successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending": return "badge-warning";
      case "shipped": return "badge-info";
      case "delivered": return "badge-success";
      case "cancelled": return "badge-danger";
      default: return "badge-neutral";
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Order Zip Covers</h1>
        <p>Request FlashFits zip covers for packing your orders</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        
        {/* Order Form */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} /> Request New Covers
            </h3>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
            
            <p style={{ marginBottom: '20px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Maximum 30 covers per size per order.
            </p>

            <form onSubmit={handleOrderSubmit}>
              <div className="form-group">
                <label className="form-label">Small Zip Covers</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="0" max="30" 
                  value={small} 
                  onChange={(e) => setSmall(parseInt(e.target.value) || 0)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Medium Zip Covers</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="0" max="30" 
                  value={medium} 
                  onChange={(e) => setMedium(parseInt(e.target.value) || 0)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Large Zip Covers</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="0" max="30" 
                  value={large} 
                  onChange={(e) => setLarge(parseInt(e.target.value) || 0)} 
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '16px' }}
                disabled={submitting || (small === 0 && medium === 0 && large === 0)}
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>

        {/* Order History */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={20} /> Order History
            </h3>
          </div>
          <div className="card-body">
            {loading ? (
              <p>Loading your past requests...</p>
            ) : orders.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>You haven't requested any zip covers yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map((order) => (
                  <div key={order._id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`} style={{ textTransform: 'capitalize' }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                      {order.quantities.small > 0 && <div><strong>S:</strong> {order.quantities.small}</div>}
                      {order.quantities.medium > 0 && <div><strong>M:</strong> {order.quantities.medium}</div>}
                      {order.quantities.large > 0 && <div><strong>L:</strong> {order.quantities.large}</div>}
                    </div>
                    {order.remarks && (
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                        Note: {order.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ZipCovers;
