import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Package,
  Truck,
  CheckCircle,

  AlertCircle,
  Phone,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  PackageCheck,
  Ship,
  ArrowRight,
  Calendar
} from "lucide-react";
import { getAllOrders, packOrder } from "../api/order";
import { useLocation } from "react-router-dom";
import { emitter } from "../utils/socket";

interface OrderItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
  isReturned?: boolean;
  returnReason?: string;
}

interface Order {
  _id: string;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  orderStatus:
  | "placed" | "accepted" | "packed" | "in_transit"
  | "try_phase" | "selection_made"
  | "return_in_progress" | "completed"
  | "cancelled" | "rejected";
  deliveryRiderStatus?: string | null;
  deliveryId?: string | null;
  deliveryRiderId?: string | null;
  deliveryRiderDetails?: {
    name: string | null;
    phone: string | null;
  } | null;
  items: OrderItem[];
  otp?: string | null;
  acceptedAt?: number | null;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);
  const [_error, setError] = useState<string>("");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [timers, setTimers] = useState<Record<string, number>>({});
  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const TIMER_DURATION = 5 * 60 * 1000;
  const location = useLocation();

  // Socket
  useEffect(() => {
    const handleOrderUpdate = (updatedOrder: Partial<Order> & { _id: string }) => {
      setOrders((prev) =>
        prev.map((order) => (order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order))
      );
    };
    emitter.on("orderUpdate", handleOrderUpdate);
    return () => emitter.off("orderUpdate", handleOrderUpdate);
  }, []);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Fetch
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data: Order[] = await getAllOrders();
        const mapped = data.map((order) => ({
          ...order,
          acceptedAt: order.orderStatus === "accepted" ? new Date(order.updatedAt).getTime() : null,
        }));
        setOrders(mapped);

        const initialTimers: Record<string, number> = {};
        mapped.forEach((order) => {
          if (order.orderStatus === "accepted" && order.acceptedAt) {
            const elapsed = Date.now() - order.acceptedAt;
            initialTimers[order._id] = Math.max(0, TIMER_DURATION - elapsed);
          }
        });
        setTimers(initialTimers);
      } catch (err) {
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [location.state?.refresh]);

  // Timer
  useEffect(() => {
    orders.forEach((order) => {
      if (order.orderStatus === "accepted" && order.acceptedAt) {
        const orderId = order._id;
        if (intervalRefs.current[orderId]) return;
        intervalRefs.current[orderId] = setInterval(() => {
          setTimers((prev) => {
            const newTime = Math.max(0, (prev[orderId] || 0) - 1000);
            if (newTime === 0) {
              clearInterval(intervalRefs.current[orderId]);
              delete intervalRefs.current[orderId];
            }
            return { ...prev, [orderId]: newTime };
          });
        }, 1000);
      }
    });
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, [orders]);

  const formatTimer = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePackOrder = async (orderId: string) => {
    try {
      const res = await packOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: "packed", otp: res.otp } : o))
      );
      clearInterval(intervalRefs.current[orderId]);
      delete intervalRefs.current[orderId];
      setTimers((prev) => {
        const p = { ...prev };
        delete p[orderId];
        return p;
      });
    } catch (err) {
      alert("Failed to pack order.");
    }
  };

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  const handleReturnAction = (orderId: string, currentStatus: Order["orderStatus"]) => {
    // Return verification is now handled via backend — no local-only state changes
    console.log('Return action for order:', orderId, 'status:', currentStatus);
  };

  const filteredOrders = orders.filter((order) => {
    const isCompleted = ["cancelled", "completed", "rejected"].includes(order.orderStatus);
    return activeTab === "active" ? !isCompleted : isCompleted;
  });

  const getStatusBadgeClass = (status: Order["orderStatus"]): string => {
    switch (status) {
      case "completed":
        return "badge-success";
      case "placed":
      case "accepted":
        return "badge-info";
      case "packed":
      case "in_transit":
      case "try_phase":
        return "badge-warning";
      case "selection_made":
      case "return_in_progress":
        return "badge-danger";
      default:
        return "badge-neutral";
    }
  };

  const getStatusIcon = (status: Order["orderStatus"]) => {
    switch (status) {
      case "placed":
      case "accepted":
        return <Clock size={12} />;
      case "packed":
        return <Package size={12} />;
      case "in_transit":
      case "return_in_progress":
        return <Truck size={12} />;
      case "completed":
      case "selection_made":
        return <CheckCircle size={12} />;
      default:
        return <AlertCircle size={12} />;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>Orders</h1>
        <p>Track and manage all your orders</p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
          <button
            className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Orders
          </button>
          <button
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {filteredOrders.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">📦</div>
            <h3>{activeTab === 'active' ? 'No active orders' : 'No order history'}</h3>
            <p>{activeTab === 'active' ? 'Orders will appear here when customers place them.' : 'Completed, cancelled, and rejected orders will appear here.'}</p>
          </div>
        ) : filteredOrders.map((order) => (
          <div key={order._id} className="card animate-fadeIn">
            {/* Card Header */}
            <div className="card-body" style={{ paddingBottom: expandedOrders[order._id] ? 0 : undefined }}>
              <div className="flex justify-between items-start flex-wrap" style={{ gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                {/* Left: Order Info */}
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>
                    Order #{order._id.slice(-6)}
                  </h4>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginTop: "2px" }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Right: Status */}
                <div className="flex items-center flex-wrap" style={{ gap: "var(--space-2)" }}>
                  {/* Delivery rider */}
                  {order.deliveryRiderId && (
                    <div className="badge badge-info" style={{ gap: "var(--space-2)" }}>
                      <span>🚚 {order.deliveryRiderDetails?.phone || "Assigned"}</span>
                      {order.deliveryRiderDetails?.phone && (
                        <a
                          href={`tel:${order.deliveryRiderDetails.phone}`}
                          style={{ color: "inherit", display: "flex" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={12} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Delivery status */}
                  <span className="badge badge-dark">
                    🚚 {order.deliveryRiderStatus
                      ? order.deliveryRiderStatus.charAt(0).toUpperCase() + order.deliveryRiderStatus.slice(1).toLowerCase()
                      : "N/A"}
                  </span>

                  {/* Order status */}
                  <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                    {getStatusIcon(order.orderStatus)}
                    <span style={{ textTransform: "capitalize" }}>
                      {order.orderStatus === "packed"
                        ? "Packed – Waiting"
                        : order.orderStatus === "try_phase"
                          ? "In Try Phase"
                          : order.orderStatus.replace(/_/g, " ")}
                    </span>
                  </span>
                </div>
              </div>
              ) : (
              <div className="grid grid-cols-1 gap-8">
                {filteredOrders.map((order) => {
                  const config = getStatusConfig(order.orderStatus);
                  const isExpanded = expandedOrders[order._id];

                  {/* Action Row */ }
                  <div className="flex justify-between items-center flex-wrap" style={{ gap: "var(--space-3)" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleExpand(order._id)}
                    >
                      {expandedOrders[order._id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {expandedOrders[order._id] ? "Hide Items" : "View Items"}
                    </button>

                    <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                      {!expandedOrders[order._id] && (
                        <>
                          {order.orderStatus === "accepted" && (
                            <button className="btn btn-primary btn-sm" onClick={() => handlePackOrder(order._id)}>
                              Pack Order
                            </button>
                          )}

                          {order.otp !== null && (
                            <span className="badge badge-info" style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}>
                              OTP: {order.otp}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Timer */ }
                  {
                    order.orderStatus === "accepted" && (
                      <div className="alert alert-warning" style={{ marginTop: "var(--space-3)" }}>
                        <Clock size={16} />
                        {timers[order._id] > 0 ? (
                          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                            {formatTimer(timers[order._id])}
                          </span>
                        ) : (
                          <span style={{ fontWeight: 600 }}>
                            Time's up! Pack now — delay affects your store rating
                          </span>
                        )}
                      </div>
                    )
                  }
            </div>

              {/* Expanded Items */}
              {expandedOrders[order._id] && (
                <div style={{ padding: "0 var(--space-6) var(--space-6)", borderTop: "1px solid var(--color-border)" }}>
                  <div style={{ paddingTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex"
                        style={{
                          gap: "var(--space-3)",
                          paddingBottom: index !== order.items.length - 1 ? "var(--space-3)" : 0,
                          borderBottom: index !== order.items.length - 1 ? "1px solid var(--color-border)" : "none",
                          borderLeft: `3px solid ${item.isReturned ? "var(--color-danger)" : "var(--color-success)"}`,
                          paddingLeft: "var(--space-3)",
                          background: item.isReturned ? "var(--color-danger-subtle)" : "transparent",
                          borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                        }}
                      >
                        <img src={item.image} alt={item.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "var(--radius-md)", flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontWeight: 500, fontSize: "var(--text-base)", marginBottom: "2px" }}>{item.name}</h4>
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                            Size: {item.size} · Qty: {item.quantity}
                          </p>
                          <p style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>₹{item.price}</p>
                          <span className={`badge ${item.isReturned ? "badge-danger" : "badge-success"}`} style={{ marginTop: "4px" }}>
                            {item.isReturned ? "Returned" : "Delivered"}
                          </span>
                          {item.isReturned && (
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: "4px" }}>
                              Reason: {item.returnReason}
                            </p>
                          )}
                        </div>

                        {/* Expandable Deployment Details */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 animate-in slide-in-from-top-4 duration-500">
                            <div className="p-8 lg:p-12 space-y-12">
                              {/* Items Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {order.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className={`flex items-center gap-6 p-6 rounded-[2rem] border transition-all hover:shadow-lg ${item.isReturned ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}
                                  >
                                    <div className="relative group">
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-24 h-24 object-cover rounded-2xl shadow-md transition-transform group-hover:scale-110"
                                      />
                                      {item.isReturned && (
                                        <div className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-lg ring-2 ring-white">
                                          <XCircle size={12} />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-grow">
                                      <h4 className="font-black text-gray-900 text-lg tracking-tight uppercase mb-1">
                                        {item.name}
                                      </h4>
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500">SIZE: {item.size}</span>
                                        <span className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500">QTY: {item.quantity}</span>
                                      </div>
                                      <p className="text-xl font-black text-gray-900">₹{item.price}</p>
                                      {item.isReturned && (
                                        <div className="mt-3 p-3 bg-white/50 rounded-xl border border-red-100">
                                          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Return Reason</p>
                                          <p className="text-xs font-bold text-red-900 italic">"{item.returnReason}"</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Action Control Panel */}
                              <div className="bg-gray-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none"></div>

                                <div className="relative space-y-4 text-center md:text-left">
                                  <h4 className="text-2xl font-black text-white tracking-tighter">Command Control</h4>
                                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                    {order.orderStatus === "accepted" && (
                                      <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-2xl border border-white/10">
                                        <Clock className={`w-5 h-5 ${timers[order._id] < 60000 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                                        <span className={`text-xl font-black font-mono tracking-widest ${timers[order._id] < 60000 ? 'text-red-500' : 'text-white'}`}>
                                          {timers[order._id] > 0 ? formatTimer(timers[order._id]) : "EXPIRED"}
                                        </span>
                                      </div>
                                    )}

                                    {order.otp && (
                                      <div className="flex items-center gap-3 bg-blue-600/20 px-6 py-3 rounded-2xl border border-blue-500/30">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Deployment Key:</span>
                                        <span className="text-xl font-black font-mono tracking-[0.3em] text-blue-500">{order.otp}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="relative flex flex-wrap gap-4 justify-center">
                                  {order.orderStatus === "accepted" && (
                                    <button
                                      className="bg-white text-black font-black uppercase tracking-widest py-6 px-12 rounded-2xl shadow-2xl hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center gap-3"
                                      onClick={() => handlePackOrder(order._id)}
                                    >
                                      <PackageCheck className="w-5 h-5" />
                                      Pack Mission
                                    </button>
                                  )}

                                  {order.orderStatus === "returned" && (
                                    <button
                                      className="bg-orange-500 text-white font-black uppercase tracking-widest py-6 px-12 rounded-2xl shadow-2xl hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center gap-3"
                                      onClick={() => handleReturnAction(order._id, order.orderStatus)}
                                    >
                                      <AlertTriangle className="w-5 h-5" />
                                      Verify Return
                                    </button>
                                  )}

                                  {(order.orderStatus === "verified_return") && (
                                    <button
                                      className="bg-green-600 text-white font-black uppercase tracking-widest py-6 px-12 rounded-2xl shadow-2xl hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center gap-3"
                                      onClick={() => handleReturnAction(order._id, order.orderStatus)}
                                    >
                                      <CheckCircle className="w-5 h-5" />
                                      Authorize Return
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 500 }}>Total Amount</span>
                    <span style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>₹{order.totalAmount}</span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ marginTop: "var(--space-4)" }}>
                    {order.orderStatus === "accepted" && (
                      <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => handlePackOrder(order._id)}>
                        Pack Order
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
        ))}
          </div>
    </div>
      );
};

      export default OrderManagement;
