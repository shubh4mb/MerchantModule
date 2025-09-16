import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import './OrderManagement.css';

const OrderManagement = () => {
const [orders, setOrders] = useState([
  // 2️⃣ Accepted order with timer + try & buy
  {
    "_id": "ord2",
    "orderStatus": "accepted",
    "acceptedAt": new Date().getTime(),
    "tryAndBuy": true,
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

  // 3️⃣ Packed & waiting
  {
    "_id": "ord3",
    "orderStatus": "packed_waiting",
    "items": [
      {
        "name": "Running Shoes",
        "quantity": 1,
        "price": 2200,
        "size": "42",
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200"
      }
    ],
    "totalAmount": 2200,
    "createdAt": "2024-09-02T11:30:00Z"
  },

  // 4️⃣ Out for delivery
  {
    "_id": "ord4",
    "orderStatus": "out_for_delivery",
    "items": [
      {
        "name": "Black Sneakers",
        "quantity": 1,
        "price": 1800,
        "size": "44",
        "image": "https://images.unsplash.com/photo-1528701800489-20be9c1b7d6b?w=200"
      }
    ],
    "totalAmount": 1800,
    "createdAt": "2024-09-03T13:15:00Z"
  },

  // 5️⃣ Delivered
  {
    "_id": "ord5",
    "orderStatus": "delivered",
    "items": [
      {
        "name": "Formal Trousers",
        "quantity": 1,
        "price": 1200,
        "size": "32",
        "image": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=200"
      }
    ],
    "totalAmount": 1200,
    "createdAt": "2024-09-04T08:45:00Z"
  },

  // 6️⃣ Verified return (waiting approval)
  {
    "_id": "ord6",
    "orderStatus": "verified_return",
    "items": [
      {
        "name": "Denim Jacket",
        "quantity": 1,
        "price": 2000,
        "size": "M",
        "image": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=200",
        "returnReason": "Color mismatch",
        "isReturned": true
      }
    ],
    "totalAmount": 2000,
    "createdAt": "2024-08-29T16:00:00Z"
  },

  // 7️⃣ Return accepted
  {
    "_id": "ord7",
    "orderStatus": "return_accepted",
    "items": [
      {
        "name": "Leather Belt",
        "quantity": 1,
        "price": 600,
        "size": "One Size",
        "image": "https://images.unsplash.com/photo-1600181952617-7f5b06a6b2f4?w=200",
        "returnReason": "Defective buckle",
        "isReturned": true
      }
    ],
    "totalAmount": 600,
    "createdAt": "2024-08-30T12:00:00Z"
  },

  // 8️⃣ Partially returned
  {
    "_id": "ord8",
    "orderStatus": "partially_returned",
    "items": [
      {
        "name": "Blue Jeans",
        "quantity": 2,
        "price": 800,
        "size": "L",
        "image": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=200",
        "returnReason": "Size issue",
        "isReturned": true
      },
      {
        "name": "White T-Shirt",
        "quantity": 1,
        "price": 500,
        "size": "M",
        "image": "https://images.unsplash.com/photo-1520974735194-97b27c0f537b?w=200",
        "isReturned": false
      }
    ],
    "totalAmount": 2100,
    "createdAt": "2024-08-28T14:30:00Z"
  },

  // 9️⃣ Fully returned
  {
    "_id": "ord9",
    "orderStatus": "returned",
    "items": [
      {
        "name": "Red Hoodie",
        "quantity": 1,
        "price": 1000,
        "size": "XL",
        "image": "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=200",
        "returnReason": "Did not like fit",
        "isReturned": true
      }
    ],
    "totalAmount": 1000,
    "createdAt": "2024-08-25T10:20:00Z"
  },

  // 🔟 Cancelled order
  {
    "_id": "ord10",
    "orderStatus": "cancelled",
    "items": [
      {
        "name": "Sports Cap",
        "quantity": 1,
        "price": 400,
        "size": "Free Size",
        "image": "https://images.unsplash.com/photo-1583225205003-3fe9c8d3db8b?w=200"
      }
    ],
    "totalAmount": 400,
    "createdAt": "2024-08-27T09:45:00Z"
  },

  // 1️⃣1️⃣ Completed (successful order, no returns)
  {
    "_id": "ord11",
    "orderStatus": "complete",
    "items": [
      {
        "name": "Office Blazer",
        "quantity": 1,
        "price": 2500,
        "size": "40",
        "image": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=200"
      }
    ],
    "totalAmount": 2500,
    "createdAt": "2024-08-20T18:00:00Z"
  }
]);

  const [filter, setFilter] = useState('all');
  const [timers, setTimers] = useState({});
  const intervalRefs = useRef({});
  const TIMER_DURATION = 5 * 60 * 1000;

  const [expandedOrders, setExpandedOrders] = useState({});

const toggleExpand = (orderId) => {
  setExpandedOrders(prev => ({
    ...prev,
    [orderId]: !prev[orderId]
  }));
};

  // ⏲️ Timer logic
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

  // 🎨 Status colors
  const getStatusColor = (status) => {
    const colors = {
      'accepted': '#F59E0B',
      'packed_waiting': '#8B5CF6',
      'out_for_delivery': '#06B6D4',
      'delivered': '#10B981',
      'returned': '#EF4444',
      'partially_returned': '#F97316',
      'cancelled': '#6B7280',
      'complete': '#059669',
      'verified_return': '#D97706',
      'return_accepted': '#059669',
      'try_phase':'#06B6D4'
    };
    return colors[status] || '#6B7280';
  };

  // 📦 Status icons
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
      case 'return_accepted':
        return <CheckCircle className="icon" />;
      default:
        return <AlertCircle className="icon" />;
    }
  };

  // 🚚 Actions
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
  const unwanted = ['cancelled', 'complete', 'partially_returned'];
  return orders.filter(order => !unwanted.includes(order.orderStatus));
};

  const filteredOrders = getFilteredOrders();

  return (
    <div className="order-management">
      <div className="order-header">
        <div className="header-content">
          <h1 className="header-title">Order Management System</h1>
          <p className="header-subtitle">Track and manage all your orders</p>
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
                      {order.orderStatus === "packed_waiting"
                        ? "Packed – Waiting for Delivery Partner"
                        : order.orderStatus === "try_phase"
                        ? "In Try Phase"
                        : order.orderStatus.replace("_", " ")}
                    </span>
                    <span className="item-summary">
                      {(() => {
                        const delivered = order.items.filter(i => !i.isReturned).length;
                        const returned = order.items.filter(i => i.isReturned).length;
                        return `${delivered} Delivered / ${returned} Returned`;
                      })()}
                    </span>
                  </div>
                </div>

                <div className="header-actions">
                  {/* ✅ Show buttons only when collapsed */}
                  {!expandedOrders[order._id] && (
                    <>
                      {order.orderStatus === "accepted" && (
                        <button
                          className="action-button btn-pack small"
                          onClick={() => handlePackOrder(order._id)}
                        >
                          ✅ Pack
                        </button>
                      )}
                      {order.orderStatus === "returned" && (
                        <button
                          className="action-button btn-return small"
                          onClick={() => handleReturnAction(order._id, order.orderStatus)}
                        >
                          🔍 Verify
                        </button>
                      )}
                      {order.orderStatus === "verified_return" && (
                        <button
                          className="action-button btn-return small"
                          onClick={() => handleReturnAction(order._id, order.orderStatus)}
                        >
                          ✅ Accept
                        </button>
                      )}
                    </>
                  )}

                  {/* Expand / collapse toggle */}
                  <button
                    className="expand-toggle"
                    onClick={() => toggleExpand(order._id)}
                  >
                    {expandedOrders[order._id] ? "− Hide Items" : "+ View Items"}
                  </button>
                </div>
              </div>

            {/* Expandable Items */}

              {expandedOrders[order._id] && (
                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className={`item-row ${item.isReturned ? 'returned-item' : 'delivered-item'}`}
                    >
                      <img src={item.image} alt={item.name} className="item-image" />
                      <div className="item-details">
                        <h4 className="item-name">{item.name}</h4>
                        <p className="item-specs">
                          Size: {item.size} | Qty: {item.quantity}
                        </p>
                        <p className="item-price">₹{item.price}</p>
                        <p className="item-status-label">
                          {item.isReturned ? "Returned" : "Delivered"}
                        </p>
                        {item.isReturned && (
                          <p className="return-reason">Reason: {item.returnReason}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="total-section">
                    <div className="total-row">
                      <span className="total-label">Total Amount:</span>
                      <span className="total-amount">₹{order.totalAmount}</span>
                    </div>
                  </div>

                  {/* ✅ Action Buttons */}
                  <div className="action-section">
                    {order.orderStatus === "accepted" && (
                      <button
                        className="action-button btn-pack"
                        onClick={() => handlePackOrder(order._id)}
                      >
                        ✅ Pack Order
                      </button>
                    )}

                    {order.orderStatus === "returned" && (
                      <button
                        className="action-button btn-return"
                        onClick={() => handleReturnAction(order._id, order.orderStatus)}
                      >
                        🔍 Verify Return
                      </button>
                    )}

                    {order.orderStatus === "verified_return" && (
                      <button
                        className="action-button btn-return"
                        onClick={() => handleReturnAction(order._id, order.orderStatus)}
                      >
                        ✅ Accept Return
                      </button>
                    )}
                  </div>
                </div>
              )}
        </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
