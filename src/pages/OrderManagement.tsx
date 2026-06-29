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
  QrCode,
  Upload,
  Trash2,
  Loader2,
  X
} from "lucide-react";
import { 
  getAllOrders, 
  packOrder, 
  acceptOrRejectOrder, 
  getPackingPhotos, 
  uploadPackingPhoto, 
  deletePackingPhoto 
} from "../api/order";
import axiosInstance from "../utils/axiosInstance";
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
  cancellationRequest?: string;
}

interface PackingPhoto {
  _id: string;
  url: string;
  itemId: string;
  uploadedAt: string;
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

  // Packing proof states
  const [packingOrderId, setPackingOrderId] = useState<string | null>(null);
  const [showPackingModal, setShowPackingModal] = useState<boolean>(false);
  const [packingPhotos, setPackingPhotos] = useState<PackingPhoto[]>([]);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [expandedItemQr, setExpandedItemQr] = useState<string | null>(null);

  // Socket
  useEffect(() => {
    const handleOrderUpdate = (updatedOrder: Partial<Order> & { _id: string }) => {
      setOrders((prev) => {
        const exists = prev.some((order) => order._id === updatedOrder._id);
        if (exists) {
          return prev.map((order) =>
            order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
          );
        } else {
          if ((updatedOrder.orderStatus as string) === "pending") return prev;
          const mappedNewOrder: Order = {
            ...updatedOrder,
            acceptedAt: updatedOrder.orderStatus === "accepted" ? Date.now() : null,
          } as Order;
          return [mappedNewOrder, ...prev];
        }
      });
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

  // Polling packing photos when packing modal is open
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    if (showPackingModal && packingOrderId) {
      const fetchPhotos = async () => {
        try {
          const res = await getPackingPhotos(packingOrderId);
          setPackingPhotos(res.packingPhotos || []);
        } catch (err) {
          console.error("Error polling packing photos:", err);
        }
      };
      
      fetchPhotos();
      intervalId = setInterval(fetchPhotos, 2000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showPackingModal, packingOrderId]);

  const handleStartPacking = async (orderId: string) => {
    setPackingOrderId(orderId);
    setShowPackingModal(true);
    setExpandedItemQr(null);
    setPackingPhotos([]);
    setModalLoading(true);
    try {
      const res = await getPackingPhotos(orderId);
      setPackingPhotos(res.packingPhotos || []);
    } catch (err) {
      console.error("Failed to load initial packing photos", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handlePcUpload = async (itemId: string, file: File) => {
    if (!packingOrderId) return;
    setModalLoading(true);
    try {
      await uploadPackingPhoto(packingOrderId, itemId, file);
      const res = await getPackingPhotos(packingOrderId);
      setPackingPhotos(res.packingPhotos || []);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to upload photo.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!packingOrderId) return;
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    setModalLoading(true);
    try {
      await deletePackingPhoto(packingOrderId, photoId);
      const res = await getPackingPhotos(packingOrderId);
      setPackingPhotos(res.packingPhotos || []);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete photo.");
    } finally {
      setModalLoading(false);
    }
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
      setShowPackingModal(false);
      setPackingOrderId(null);
    } catch (err: any) {
      alert(err.message || "Failed to pack order.");
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrRejectOrder(orderId, "accept", "accepted");
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: "accepted", acceptedAt: Date.now() } : o))
      );
      setTimers((prev) => ({ ...prev, [orderId]: TIMER_DURATION }));
    } catch (err) {
      alert("Failed to accept order.");
    }
  };

  const submitRejection = async () => {
    if (!rejectOrderId || !rejectReason) return;
    try {
      await acceptOrRejectOrder(rejectOrderId, "reject", rejectReason);
      setOrders((prev) =>
        prev.map((o) => (o._id === rejectOrderId ? { ...o, orderStatus: "rejected" } : o))
      );
      setRejectOrderId(null);
      setRejectReason("");
    } catch (err) {
      alert("Failed to reject order.");
    }
  };

  const handleRequestCancellation = async (orderId: string) => {
    const reason = window.prompt("Enter reason for requesting cancellation:");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Cancellation reason is required.");
      return;
    }
    try {
      await axiosInstance.put(`/merchant/order/${orderId}/request-cancellation`, { reason });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, cancellationRequest: "pending" } : o))
      );
      alert("Cancellation request submitted successfully.");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit cancellation request.");
    }
  };

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

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
                        <button className="btn btn-primary btn-sm" onClick={() => handleStartPacking(order._id)}>
                          Pack Order
                        </button>
                      )}

                      {order.orderStatus === "placed" && (
                        <div className="flex" style={{ gap: "6px" }}>
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ backgroundColor: "var(--color-success)", borderColor: "var(--color-success)" }}
                            onClick={() => handleAcceptOrder(order._id)}
                          >
                            Accept
                          </button>
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                            onClick={() => {
                              setRejectOrderId(order._id);
                              setRejectReason("");
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {order.otp !== null && (
                        <span className="badge badge-info" style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}>
                          OTP: {order.otp}
                        </span>
                      )}

                      {!["placed", "rejected", "cancelled", "completed"].includes(order.orderStatus) && (
                        order.cancellationRequest === "pending" ? (
                          <span className="badge badge-warning" style={{ fontSize: "var(--text-xs)" }}>
                            Cancellation Pending
                          </span>
                        ) : (
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ borderColor: "var(--color-danger)", color: "var(--color-danger)" }} 
                            onClick={() => handleRequestCancellation(order._id)}
                          >
                            Request Cancel
                          </button>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Timer */}
              {order.orderStatus === "accepted" && (
                <div className="alert alert-warning" style={{ marginTop: "var(--space-3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
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
                  <button
                    onClick={() => setShowGuidelines(true)}
                    style={{ textDecoration: "underline", color: "inherit", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: "0.9em", padding: 0 }}
                  >
                    Packing Guidelines
                  </button>
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
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => handleStartPacking(order._id)}>
                      Pack Order
                    </button>
                  )}

                  {order.orderStatus === "placed" && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, backgroundColor: "var(--color-success)", borderColor: "var(--color-success)" }} 
                        onClick={() => handleAcceptOrder(order._id)}
                      >
                        Accept Order
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ flex: 1, color: "var(--color-danger)", borderColor: "var(--color-danger)" }} 
                        onClick={() => {
                          setRejectOrderId(order._id);
                          setRejectReason("");
                        }}
                      >
                        Reject Order
                      </button>
                    </div>
                  )}

                  {!["placed", "rejected", "cancelled", "completed"].includes(order.orderStatus) && (
                    order.cancellationRequest === "pending" ? (
                      <div className="alert alert-warning" style={{ textAlign: "center", width: "100%", justifyContent: "center", marginTop: "8px" }}>
                        Cancellation Request Pending Approval
                      </div>
                    ) : (
                      <button 
                        className="btn btn-outline" 
                        style={{ width: "100%", borderColor: "var(--color-danger)", color: "var(--color-danger)", marginTop: "8px" }} 
                        onClick={() => handleRequestCancellation(order._id)}
                      >
                        Request Order Cancellation
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Guidelines Modal */}
      {showGuidelines && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowGuidelines(false)}>
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", maxWidth: "450px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
              <Package size={20} /> Packing Guidelines
            </h3>
            <ol style={{ paddingLeft: "20px", marginBottom: "24px", lineHeight: "1.6", color: "#333", fontSize: "14px", listStyleType: "decimal" }}>
              <li style={{ marginBottom: "10px" }}>Each clothing item must be packed inside the <strong>FlashFits provided zip cover</strong> before dispatch.</li>
              <li style={{ marginBottom: "10px" }}>Ensure the garment is <strong>neatly folded</strong> to avoid wrinkles.</li>
              <li style={{ marginBottom: "10px" }}>
                Zip cover should be:
                <ul style={{ paddingLeft: "20px", marginTop: "6px", listStyleType: "circle" }}>
                  <li>Clean and dust-free</li>
                  <li>Properly sealed</li>
                  <li>Free from tears or damage</li>
                </ul>
              </li>
              <li>Fill the <strong>order id</strong> on the zip cover using a marker (on the space provided on it).</li>
            </ol>
            <div style={{ textAlign: "right" }}>
              <button className="btn btn-primary" onClick={() => setShowGuidelines(false)}>Understood</button>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Modal */}
      {rejectOrderId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setRejectOrderId(null)}>
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", maxWidth: "450px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-danger)" }}>
              Reject Order
            </h3>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
              Please select a reason for rejecting this order. This helps us inform the customer.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {[
                "Out of stock / Variant unavailable",
                "Store closing / Operating hours ended",
                "Item damaged / Quality check failed",
                "Pricing error",
                "Other"
              ].map((reason) => (
                <label key={reason} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "8px", borderRadius: "6px", border: "1px solid var(--color-border)", background: rejectReason === reason ? "#f0f7ff" : "none" }}>
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={rejectReason === reason || (reason === "Other" && !["Out of stock / Variant unavailable", "Store closing / Operating hours ended", "Item damaged / Quality check failed", "Pricing error"].includes(rejectReason))}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <span style={{ fontSize: "14px" }}>{reason}</span>
                </label>
              ))}
              {(rejectReason === "Other" || !["Out of stock / Variant unavailable", "Store closing / Operating hours ended", "Item damaged / Quality check failed", "Pricing error", ""].includes(rejectReason)) && (
                <textarea
                  placeholder="Please specify custom reason..."
                  rows={2}
                  value={["Out of stock / Variant unavailable", "Store closing / Operating hours ended", "Item damaged / Quality check failed", "Pricing error", "Other"].includes(rejectReason) ? "" : rejectReason}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "14px", marginTop: "4px" }}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="btn btn-ghost" onClick={() => setRejectOrderId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ backgroundColor: "var(--color-danger)", borderColor: "var(--color-danger)" }} onClick={submitRejection} disabled={!rejectReason.trim()}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Packing Verification Modal */}
      {showPackingModal && packingOrderId && (() => {
        const packingOrder = orders.find(o => o._id === packingOrderId);
        if (!packingOrder) return null;
        

        return (
          <div style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: "rgba(0,0,0,0.5)", 
            zIndex: 1000, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            backdropFilter: "blur(4px)"
          }} onClick={() => {
            setShowPackingModal(false);
            setPackingOrderId(null);
          }}>
            <div style={{ 
              background: "white", 
              borderRadius: "16px", 
              maxWidth: "640px", 
              width: "92%", 
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              overflow: "hidden"
            }} onClick={(e) => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div style={{ 
                padding: "20px 24px", 
                borderBottom: "1px solid var(--color-border)", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center" 
              }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Package size={18} /> Pack Verification
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                    Order #{packingOrder._id.slice(-6)} · Provide at least 1 proof photo per item
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowPackingModal(false);
                    setPackingOrderId(null);
                  }}
                  style={{ 
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    color: "var(--color-text-secondary)",
                    padding: "4px"
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ 
                padding: "24px", 
                overflowY: "auto", 
                flex: 1, 
                display: "flex", 
                flexDirection: "column", 
                gap: "24px" 
              }}>
                {packingOrder.items.map((item) => {
                  const itemPhotos = packingPhotos.filter(p => p.itemId === item._id);
                  const hasProof = itemPhotos.length > 0;
                  
                  return (
                    <div 
                      key={item._id} 
                      style={{ 
                        border: "1px solid var(--color-border)", 
                        borderRadius: "12px", 
                        padding: "16px",
                        background: hasProof ? "var(--color-success-subtle)" : "transparent",
                        borderColor: hasProof ? "rgba(22, 163, 74, 0.2)" : "var(--color-border)",
                        transition: "all var(--transition-base)"
                      }}
                    >
                      {/* Item Info Header */}
                      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          style={{ 
                            width: "56px", 
                            height: "56px", 
                            objectFit: "cover", 
                            borderRadius: "8px",
                            border: "1px solid var(--color-border)"
                          }} 
                        />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <h4 style={{ fontWeight: 600, fontSize: "14px", color: "var(--color-text)", marginBottom: "2px" }}>
                            {item.name}
                          </h4>
                          <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                            <span>Size: <strong>{item.size}</strong></span>
                            <span>•</span>
                            <span>Qty: <strong>{item.quantity}</strong></span>
                          </div>
                        </div>
                        <div style={{ alignSelf: "center" }}>
                          <span className={`badge ${hasProof ? "badge-success" : "badge-neutral"}`}>
                            {hasProof ? `${itemPhotos.length} Photo(s)` : "Missing Photo"}
                          </span>
                        </div>
                      </div>

                      {/* Uploaded Photos Grid */}
                      {itemPhotos.length > 0 && (
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(4, 1fr)", 
                          gap: "8px", 
                          marginBottom: "16px" 
                        }}>
                          {itemPhotos.map((photo) => (
                            <div 
                              key={photo._id} 
                              style={{ 
                                position: "relative", 
                                paddingBottom: "100%", 
                                borderRadius: "8px", 
                                overflow: "hidden",
                                border: "1px solid var(--color-border)"
                              }}
                            >
                              <img 
                                src={photo.url} 
                                alt="Proof" 
                                style={{ 
                                  position: "absolute", 
                                  top: 0, 
                                  left: 0, 
                                  width: "100%", 
                                  height: "100%", 
                                  objectFit: "cover" 
                                }} 
                              />
                              <button
                                onClick={() => handleDeletePhoto(photo._id)}
                                style={{
                                  position: "absolute",
                                  top: "4px",
                                  right: "4px",
                                  background: "rgba(220, 38, 38, 0.85)",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: "20px",
                                  height: "20px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                                }}
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: "8px" }}>
                        {/* PC Upload */}
                        <label className="btn btn-secondary btn-sm" style={{ flex: 1, cursor: "pointer", padding: "8px 12px" }}>
                          <Upload size={14} /> Upload from PC
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: "none" }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handlePcUpload(item._id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        {/* Scan QR */}
                        <button 
                          className={`btn btn-sm ${expandedItemQr === item._id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1, padding: "8px 12px" }}
                          onClick={() => setExpandedItemQr(expandedItemQr === item._id ? null : item._id)}
                        >
                          <QrCode size={14} /> {expandedItemQr === item._id ? "Hide QR" : "Scan QR"}
                        </button>
                      </div>

                      {/* QR Display */}
                      {expandedItemQr === item._id && (() => {
                        const baseUrl = window.location.origin;
                        const uploadUrl = `${baseUrl}/merchant/order/upload-proof?orderId=${packingOrder._id}&itemId=${item._id}`;
                        const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(uploadUrl)}`;
                        
                        return (
                          <div style={{ 
                            marginTop: "12px", 
                            padding: "12px", 
                            background: "var(--color-bg)", 
                            border: "1px dashed var(--color-border-strong)", 
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px"
                          }}>
                            <img 
                              src={qrImgUrl} 
                              alt="Scan to upload" 
                              style={{ width: "130px", height: "130px", background: "white", padding: "6px", borderRadius: "6px", border: "1px solid var(--color-border)" }}
                            />
                            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", textAlign: "center", maxWidth: "240px" }}>
                              Scan with your mobile camera to take and upload packing photos instantly.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div style={{ 
                padding: "16px 24px", 
                borderTop: "1px solid var(--color-border)", 
                display: "flex", 
                justifyContent: "flex-end", 
                gap: "12px",
                background: "var(--color-bg)"
              }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowPackingModal(false);
                    setPackingOrderId(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  disabled={modalLoading}
                  onClick={() => handlePackOrder(packingOrder._id)}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {modalLoading && <Loader2 className="spinner spinner-sm" style={{ borderTopColor: '#FFFFFF' }} />}
                  Confirm Packing & Generate OTP
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default OrderManagement;