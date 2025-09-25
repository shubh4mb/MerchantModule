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
import {getAllOrders, packOrder } from '../../api/order'
import { useLocation } from "react-router-dom";


const OrderManagement = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [timers, setTimers] = useState<Record<string, number>>({});
  const intervalRefs = useRef<Record<string, any>>({});
  const TIMER_DURATION = 5 * 60 * 1000;

    const location = useLocation();

  // useEffect(() => {
  //   // re-fetch orders here when refresh changes
  //   console.log("🔄 Refresh triggered", location.state?.refresh);
  //   fetchOrders();
  // }, []);
  

const toggleExpand = (orderId) => {
  setExpandedOrders(prev => ({
    ...prev,
    [orderId]: !prev[orderId]
  }));
};

  // 📡 Fetch orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await getAllOrders();
      const mapped = data.map((order: any) => {
        let acceptedAt = null;

        if (order.orderStatus === "accepted") {
          // Use backend's updatedAt as the acceptance time
          acceptedAt = new Date(order.updatedAt).getTime();
        }

        return {
          ...order,
          acceptedAt,
        };
      });
        setOrders(mapped);

        // initialize timers immediately
        const initialTimers: Record<string, number> = {};
        mapped.forEach(order => {
          if (order.orderStatus === "accepted" && order.acceptedAt) {
            const elapsedTime = Date.now() - order.acceptedAt;
            const remainingTime = Math.max(0, TIMER_DURATION - elapsedTime);
            initialTimers[order._id] = remainingTime;
          }
        });
        setTimers(initialTimers);

      } catch (err) {
        console.error(err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [location.state?.refresh]);

  // ⏲️ Timer logic
  useEffect(() => {
  orders.forEach(order => {
    if (order.orderStatus === "accepted" && order.acceptedAt) {
      const orderId = order._id;

      // ✅ Skip if this order is already in timers (avoid duplicates)
      if (timers[orderId] !== undefined) return;

      const elapsedTime = Date.now() - order.acceptedAt;
      const remainingTime = Math.max(0, TIMER_DURATION - elapsedTime);

      if (remainingTime > 0) {
        setTimers(prev => ({ ...prev, [orderId]: remainingTime }));

        if (intervalRefs.current[orderId]) {
          clearInterval(intervalRefs.current[orderId]);
        }

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
      'packed': '#8B5CF6',
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
      case 'packed':
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
const handlePackOrder = async (orderId) => {
  try {
    const res = await packOrder(orderId);
    console.log("✅ Order packed:", res);
    setOrders(prev =>
      prev.map(order =>
        order._id === orderId ? { ...order, orderStatus: "packed" } : order
      )
    );
 
    // 2. Stop timer for this order
    if (intervalRefs.current[orderId]) {
      clearInterval(intervalRefs.current[orderId]);
      delete intervalRefs.current[orderId];
    }

    setTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[orderId];
      return newTimers;
    });

  } catch (error) {
    console.error("❌ Failed to pack order:", error);
    alert("Failed to pack order. Please try again.");
  }
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
                      {order.orderStatus === "packed"
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
                {order.orderStatus === "accepted" && (
                  <div className="timer-display">
                    <Clock className="timer-icon" />
                    {timers[order._id] > 0 ? (
                      <span className="timer-text">{formatTimer(timers[order._id])}</span>
                    ) : (
                      <span className="timer-expired">Time’s up! Pack now 🚨 | Delay will affect your store rating & product reach ⚠️</span>
                    )}
                  </div>
                )}
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
