import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  ChevronDown,
  ChevronUp,
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
    | "placed" | "accepted" | "packed" | "out_for_delivery"
    | "arrived at delivery" | "try phase" | "completed try phase"
    | "otp-verified-return" | "reached return merchant"
    | "confirmed_purchase" | "returned" | "partially_returned"
    | "delivered" | "cancelled" | "completed" | "rejected"
    | "verified_return" | "return_accepted";
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

  const handleReturnAction = (orderId: string, currentStatus: Order["orderStatus"]) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order._id !== orderId) return order;
        if (currentStatus === "returned") return { ...order, orderStatus: "verified_return" };
        if (currentStatus === "verified_return") return { ...order, orderStatus: "return_accepted" };
        return order;
      })
    );
  };

  const filteredOrders = orders.filter(
    (order) => !["cancelled", "completed", "rejected"].includes(order.orderStatus)
  );

  const getStatusBadgeClass = (status: Order["orderStatus"]): string => {
    switch (status) {
      case "delivered":
      case "confirmed_purchase":
      case "completed":
        return "badge-success";
      case "placed":
      case "accepted":
        return "badge-info";
      case "packed":
      case "out_for_delivery":
      case "arrived at delivery":
        return "badge-warning";
      case "returned":
      case "partially_returned":
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
      case "out_for_delivery":
      case "arrived at delivery":
      case "reached return merchant":
        return <Truck size={12} />;
      case "delivered":
      case "completed":
      case "confirmed_purchase":
      case "completed try phase":
      case "otp-verified-return":
        return <CheckCircle size={12} />;
      case "returned":
        return <XCircle size={12} />;
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
      </div>

      {/* Orders List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {filteredOrders.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">📦</div>
            <h3>No active orders</h3>
            <p>Orders will appear here when customers place them.</p>
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
                        : order.orderStatus === "try phase"
                          ? "In Try Phase"
                          : order.orderStatus.replace(/_/g, " ")}
                    </span>
                  </span>
                </div>
              </div>

              {/* Action Row */}
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
                      {order.orderStatus === "returned" && (
                        <button className="btn btn-sm" style={{ background: "var(--color-warning)", color: "white", border: "none" }} onClick={() => handleReturnAction(order._id, order.orderStatus)}>
                          Verify Return
                        </button>
                      )}
                      {order.orderStatus === "verified_return" && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleReturnAction(order._id, order.orderStatus)}>
                          Accept Return
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

              {/* Timer */}
              {order.orderStatus === "accepted" && (
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
              )}
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
                  {order.orderStatus === "returned" && (
                    <button className="btn" style={{ width: "100%", background: "var(--color-warning)", color: "white", border: "none" }} onClick={() => handleReturnAction(order._id, order.orderStatus)}>
                      Verify Return
                    </button>
                  )}
                  {order.orderStatus === "verified_return" && (
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => handleReturnAction(order._id, order.orderStatus)}>
                      Accept Return
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
