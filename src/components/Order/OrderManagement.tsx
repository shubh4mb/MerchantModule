import React, { useState, useEffect, useRef } from 'react';
import { Clock, Package, Truck, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import './OrderManagement.css';

const OrderManagement = () => {
  const [orders, setOrders] = useState([
    {
      "_id": "64f1f4b9d9c4a5b3e9f1d1a1",
      "orderStatus": "accepted",
      "acceptedAt": new Date().getTime(),
      "items": [
        {
          "name": "Stylish Jacket",
          "quantity": 1,
          "price": 1500,
          "size": "M",
          "image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200"
        }
      ],
      "totalAmount": 1500,
      "createdAt": "2024-09-01T10:00:00Z"
    },
    {
      "_id": "64f1f4b9d9c4a5b3e9f1d1a2",
      "orderStatus": "returned",
      "items": [
        {
          "name": "Blue Jeans",
          "quantity": 2,
          "price": 800,
          "size": "L",
          "image": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=200",
          "returnReason": "Size issue"
        }
      ],
      "totalAmount": 1600,
      "createdAt": "2024-08-28T14:30:00Z"
    }
  ]);

  const [filter, setFilter] = useState('all');
  const [timers, setTimers] = useState({});
  const intervalRefs = useRef({});

  const TIMER_DURATION = 5 * 60 * 1000;

  useEffect(() => {
    orders.forEach(order => {
      if (order.orderStatus === 'accepted' && order.acceptedAt) {
        const orderId = order._id;
        const elapsedTime = Date.now() - order.acceptedAt;
        const remainingTime = Math.max(0, TIMER_DURATION - elapsedTime);

        if (remainingTime > 0) {
          setTimers(prev => ({ ...prev, [orderId]: remainingTime }));

          if (intervalRefs.current[orderId]) clearInterval(intervalRefs.current[orderId]);

          intervalRefs.current[orderId] = setInterval(() => {
            setTimers(prev => {
              const newTime = Math.max(0, (prev[orderId] || 0) - 1000);
              if (newTime === 0) {
                clearInterval(intervalRefs.current[orderId]);
                delete intervalRefs.current[orderId];
              }
              return { ...prev, [orderId]: newTime };
            });
          }, 1000);
        }
      }
    });

    return () => {
      Object.values(intervalRefs.current).forEach(interval => clearInterval(interval));
    };
  }, [orders]);

  const formatTimer = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': '#3B82F6',
      'accepted': '#F59E0B',
      'packed_waiting': '#8B5CF6',
      'out_for_delivery': '#06B6D4',
      'delivered': '#10B981',
      'returned': '#EF4444',
      'partially_returned': '#F97316',
      'cancelled': '#6B7280',
      'complete': '#059669',
      'verified_return': '#D97706',
      'return_accepted': '#059669'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <Clock className="icon" />;
      case 'packed_waiting':
        return <Package className="icon" />;
      case 'out_for_delivery':
        return <Truck className="icon" />;
      case 'delivered':
        return <CheckCircle className="icon" />;
      case 'returned':
      case 'partially_returned':
        return <ArrowRight className="icon" style={{ transform: 'rotate(180deg)' }} />;
      case 'cancelled':
        return <XCircle className="icon" />;
      case 'verified_return':
        return <CheckCircle className="icon" />;
      case 'return_accepted':
        return <CheckCircle className="icon" />;
      default:
        return <AlertCircle className="icon" />;
    }
  };

  const handlePackOrder = (orderId) => {
    setOrders(prev =>
      prev.map(order =>
        order._id === orderId
          ? { ...order, orderStatus: 'packed_waiting' }
          : order
      )
    );

    if (intervalRefs.current[orderId]) {
      clearInterval(intervalRefs.current[orderId]);
      delete intervalRefs.current[orderId];
    }
    setTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[orderId];
      return newTimers;
    });
  };

  // ✅ Handle Verify / Accept Return
  const handleReturnAction = (orderId, currentStatus) => {
    setOrders(prev =>
      prev.map(order => {
        if (order._id === orderId) {
          if (currentStatus === 'returned') {
            return { ...order, orderStatus: 'verified_return' };
          } else if (currentStatus === 'verified_return') {
            return { ...order, orderStatus: 'return_accepted' };
          }
        }
        return order;
      })
    );
  };

  const getFilteredOrders = () => {
    if (filter === 'all') return orders;
    return orders.filter(order => order.orderStatus === filter);
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="order-management">
      <div className="order-header">
        <div className="header-content">
          <h1 className="header-title">Order Management System</h1>
          <p className="header-subtitle">Track and manage all your orders in one place</p>
        </div>
      </div>
      <div className="main-content">
        <div className="orders-grid">
          {filteredOrders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div className="order-card-header-content">
                  <div className="order-info">
                    <h3>Order #{order._id.slice(-6)}</h3>
                    <p className="order-date">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                  >
                    {getStatusIcon(order.orderStatus)}
                    <span>
                      {order.orderStatus === 'packed_waiting'
                        ? 'Packed – Waiting for Delivery Partner'
                        : order.orderStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {order.orderStatus === 'accepted' && timers[order._id] > 0 && (
                  <div className="timer-display">
                    <Clock className="timer-icon" />
                    <span className="timer-text">
                      Pack within: {formatTimer(timers[order._id])}
                    </span>
                  </div>
                )}
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <img src={item.image} alt={item.name} className="item-image" />
                    <div className="item-details">
                      <h4 className="item-name">{item.name}</h4>
                      <p className="item-specs">
                        Size: {item.size} | Qty: {item.quantity}
                      </p>
                      <p className="item-price">₹{item.price}</p>
                    </div>
                  </div>
                ))}
                <div className="total-section">
                  <div className="total-row">
                    <span className="total-label">Total Amount:</span>
                    <span className="total-amount">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="action-section">
                {order.orderStatus === 'accepted' && (
                  <button
                    onClick={() => handlePackOrder(order._id)}
                    className="action-button btn-pack"
                  >
                    <Package className="icon-inline" />
                    Pack Order
                  </button>
                )}

                {/* ✅ One button for Verify / Accept Return */}
                {(order.orderStatus === 'returned' || order.orderStatus === 'verified_return') && (
                  <button
                    onClick={() => handleReturnAction(order._id, order.orderStatus)}
                    className="action-button btn-return"
                  >
                    {order.orderStatus === 'returned' ? 'Verify Return' : 'Accept Return'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
