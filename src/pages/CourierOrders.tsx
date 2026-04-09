import React, { useState, useEffect } from 'react';
import { getCourierOrders, updateCourierOrderStatus } from '../api/courierOrder';
import { RefreshCw } from 'lucide-react';

interface CourierOrderItem {
  productId: string;
  variantId: string;
  name: string;
  quantity: number;
  price: number;
  size: string;
  image: string;
}

interface CourierOrder {
  _id: string;
  userId: string;
  items: CourierOrderItem[];
  totalAmount: number;
  deliveryCharge: number;
  address: {
    name: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

const STATUS_FLOW = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'delivered': return 'badge-success';
    case 'shipped': return 'badge-info';
    case 'packed': return 'badge-warning';
    case 'confirmed': return 'badge-info';
    case 'placed': return 'badge-neutral';
    case 'cancelled': return 'badge-danger';
    default: return 'badge-neutral';
  }
};

const CourierOrders: React.FC = () => {
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getCourierOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch courier orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getNextStatus = (currentStatus: string): string | null => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      await updateCourierOrderStatus(orderId, newStatus);
      setOrders(prev =>
        prev.map(o => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (error) {
      console.error('Status update failed:', error);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.orderStatus === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "400px" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-6)" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Courier Orders</h1>
          <p>Manage orders shipped by you · {orders.length} total</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap" style={{ gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
        {['all', ...STATUS_FLOW, 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`filter-pill ${filter === status ? 'active' : ''}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span style={{ fontSize: "var(--text-xs)", opacity: 0.6, marginLeft: "4px" }}>
                ({orders.filter(o => o.orderStatus === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📦</div>
          <h3>No courier orders</h3>
          <p>
            {filter === 'all'
              ? 'You have no courier orders yet.'
              : `No orders with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {filteredOrders.map(order => {
            const nextStatus = getNextStatus(order.orderStatus);
            const isUpdating = updatingOrderId === order._id;

            return (
              <div key={order._id} className="card">
                <div className="card-body">
                  {/* Order Header */}
                  <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
                    <div>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginLeft: "var(--space-3)" }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                      {order.orderStatus.toUpperCase()}
                    </span>
                  </div>

                  {/* Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center" style={{ gap: "var(--space-3)" }}>
                        {item.image && (
                          <img src={item.image} alt={item.name} style={{ width: "40px", height: "40px", borderRadius: "var(--radius-md)", objectFit: "cover" }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "var(--text-base)", fontWeight: 500 }}>{item.name}</p>
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                            Size: {item.size} · Qty: {item.quantity}
                          </p>
                        </div>
                        <p style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>

                  {/* Address */}
                  <div style={{
                    background: "var(--color-bg)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-3)",
                    marginBottom: "var(--space-4)",
                  }}>
                    <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "var(--space-1)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Ship To
                    </p>
                    <p style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>
                      {order.deliveryLocation?.name} · {order.deliveryLocation?.phone}
                    </p>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      {order.deliveryLocation?.addressLine1}, {order.deliveryLocation?.city}, {order.deliveryLocation?.state} - {order.deliveryLocation?.pincode}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Total: </span>
                      <span style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>
                        ₹{order.totalAmount + order.deliveryCharge}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginLeft: "var(--space-1)" }}>
                        (incl. ₹{order.deliveryCharge} delivery)
                      </span>
                    </div>

                    {nextStatus && order.orderStatus !== 'cancelled' && (
                      <button
                        onClick={() => handleStatusUpdate(order._id, nextStatus)}
                        disabled={isUpdating}
                        className="btn btn-primary btn-sm"
                      >
                        {isUpdating
                          ? 'Updating...'
                          : `Mark as ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourierOrders;
