import { useState, useEffect, useRef, useCallback } from "react";
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
  markItemOutOfStock,
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
  tryStatus?: 'pending' | 'accepted' | 'returned' | 'not-triable' | 'keep';
  isReturned?: boolean;
  returnReason?: string;
  status?: 'available' | 'out_of_stock' | 'cancelled';
  outOfStockReason?: string;
}

interface Order {
  _id: string;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  actualPurchasedAmount?: number;
  finalBilling?: any;
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
  reason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  hasUnavailableItems?: boolean;
  unavailableItemsCount?: number;
  customerCancellationAllowed?: boolean;
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

  // Return Issue Report states
  const [reportIssueOrderId, setReportIssueOrderId] = useState<string | null>(null);
  const [reportIssueItemId, setReportIssueItemId] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<"damage" | "missing" | "other">("damage");
  const [issueDescription, setIssueDescription] = useState<string>("");
  const [issueImages, setIssueImages] = useState<File[]>([]);
  const [submittingIssue, setSubmittingIssue] = useState<boolean>(false);

  // Socket
  useEffect(() => {
    const handleOrderUpdate = (updatedOrder: any) => {
      if (!updatedOrder) return;
      const orderId = updatedOrder._id || updatedOrder.orderId || updatedOrder.id;
      if (!orderId) return;

      const normalizedOrder = {
        ...updatedOrder,
        _id: String(orderId),
      };

      setOrders((prev) => {
        const exists = prev.some((order) => order?._id === normalizedOrder._id);
        if (exists) {
          return prev.map((order) =>
            order?._id === normalizedOrder._id ? { ...order, ...normalizedOrder } : order
          );
        } else {
          if ((normalizedOrder.orderStatus as string) === "pending") return prev;
          if (!normalizedOrder.orderStatus && !normalizedOrder.items) return prev;
          const mappedNewOrder: Order = {
            ...normalizedOrder,
            acceptedAt: normalizedOrder.orderStatus === "accepted" ? Date.now() : null,
          } as Order;
          return [mappedNewOrder, ...prev];
        }
      });
    };

    const handleOrderCancelled = (cancelledData: any) => {
      if (!cancelledData) return;
      const orderId = String(cancelledData._id || cancelledData.orderId || cancelledData.id || '');
      if (!orderId) return;

      setOrders((prev) =>
        prev.map((order) =>
          order?._id === orderId
            ? {
                ...order,
                ...(cancelledData.order || {}),
                orderStatus: "cancelled",
                reason: cancelledData.reason || order.reason,
                cancelledBy: cancelledData.cancelledBy || order.cancelledBy,
                cancelledAt: cancelledData.cancelledAt || new Date().toISOString(),
                hasUnavailableItems: cancelledData.hasUnavailableItems ?? order.hasUnavailableItems,
                items: cancelledData.order?.items || order.items,
              }
            : order
        )
      );

      // If merchant is packing this exact order, close packing modal and notify
      setPackingOrderId((currPackingId) => {
        if (currPackingId === orderId) {
          alert(`Order #${orderId.slice(-5).toUpperCase()} was cancelled by the customer${cancelledData.reason ? `: ${cancelledData.reason}` : ''}.`);
          setShowPackingModal(false);
          return null;
        }
        return currPackingId;
      });
    };

    emitter.on("orderUpdate", handleOrderUpdate);
    emitter.on("warehouseOrderUpdate", handleOrderUpdate);
    emitter.on("orderCancelled", handleOrderCancelled);
    return () => {
      emitter.off("orderUpdate", handleOrderUpdate);
      emitter.off("warehouseOrderUpdate", handleOrderUpdate);
      emitter.off("orderCancelled", handleOrderCancelled);
    };
  }, []);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Fetch
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const rawData = await getAllOrders();
      const data: Order[] = (Array.isArray(rawData) ? rawData : [])
        .filter((o: any) => o && (o._id || o.orderId || o.id))
        .map((order: any) => ({
          ...order,
          _id: String(order._id || order.orderId || order.id),
          acceptedAt: order.orderStatus === "accepted" ? new Date(order.updatedAt || Date.now()).getTime() : null,
        }));
      setOrders(data);

      const initialTimers: Record<string, number> = {};
      data.forEach((order) => {
        if (order.orderStatus === "accepted" && order.acceptedAt && order._id) {
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
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, location.state?.refresh]);

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
      intervalId = setInterval(fetchPhotos, 4000);
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

  const handleMarkOutOfStock = async (orderId: string, itemId: string, itemName: string) => {
    const confirm = window.confirm(
      `Mark "${itemName}" as Out of Stock?\n\nThis item will be excluded from the order. The customer will be notified immediately and given the option to cancel the order.`
    );
    if (!confirm) return;

    try {
      setModalLoading(true);
      const res = await markItemOutOfStock(orderId, itemId, "Item unavailable at store");

      if (res.allItemsOutOfStock) {
        alert("All items in this order were marked out of stock. The order has been automatically cancelled.");
        setShowPackingModal(false);
        setPackingOrderId(null);
        loadOrders();
      } else {
        alert(`"${itemName}" marked out of stock. Order updated with remaining items.`);
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId
              ? {
                  ...o,
                  items: (o.items || []).map((it) =>
                    it._id === itemId ? { ...it, status: "out_of_stock" } : it
                  ),
                  totalAmount: res.order?.totalAmount ?? o.totalAmount,
                }
              : o
          )
        );
        loadOrders();
      }
    } catch (err: any) {
      alert(err.message || "Failed to mark item out of stock.");
    } finally {
      setModalLoading(false);
    }
  };

  const handlePackOrder = async (orderId: string) => {
    try {
      const packingOrder = orders.find((o) => o._id === orderId);
      const availableItems = (packingOrder?.items || []).filter((i) => i.status !== "out_of_stock");
      if (availableItems.length === 0) {
        alert("Cannot pack: All items in this order are out of stock.");
        return;
      }

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

  const handleSubmitIssue = async () => {
    if (!reportIssueOrderId || !issueDescription.trim()) return;
    setSubmittingIssue(true);
    try {
      const formData = new FormData();
      formData.append("orderId", reportIssueOrderId);
      if (reportIssueItemId) formData.append("itemId", reportIssueItemId);
      formData.append("issueType", issueType);
      formData.append("damageCategory", issueType === "damage" ? "fabric_tear" : "item_missing");
      formData.append("description", issueDescription);
      
      issueImages.forEach((file) => {
        formData.append("images", file);
      });

      await axiosInstance.post(`/merchant/return-issues`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      alert("Issue reported successfully.");
      setReportIssueOrderId(null);
      setReportIssueItemId(null);
      setIssueDescription("");
      setIssueImages([]);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to report issue.");
    } finally {
      setSubmittingIssue(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const filteredOrders = orders.filter((order) => {
    if (!order || !order._id) return false;
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
      case "cancelled":
      case "rejected":
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
          <div key={order._id || Math.random()} className="card animate-fadeIn">
            {/* Card Header */}
            <div className="card-body" style={{ paddingBottom: order._id && expandedOrders[order._id] ? 0 : undefined }}>
              <div className="flex justify-between items-start flex-wrap" style={{ gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                {/* Left: Order Info */}
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>
                    Order #{order?._id ? String(order._id).slice(-6).toUpperCase() : '------'}
                  </h4>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginTop: "2px" }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                    {' • '}
                    {(() => {
                      const isDecisionMade = ['completed', 'delivered', 'return_in_progress', 'selection_made'].includes(order.orderStatus);
                      const acceptedItems = (order.items || []).filter(i => i.tryStatus === 'accepted' || i.tryStatus === 'keep' || i.tryStatus === 'not-triable');
                      const acceptedSum = acceptedItems.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0);
                      const purchasedAmount = isDecisionMade
                        ? (order.actualPurchasedAmount ?? order.finalBilling?.baseAmount ?? acceptedSum)
                        : order.totalAmount;
                      return isDecisionMade ? `Purchased: ₹${purchasedAmount}` : `Total: ₹${order.totalAmount}`;
                    })()}
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
                          : order.orderStatus === "cancelled"
                            ? (order.cancelledBy === "user" ? "Cancelled by Customer" : order.cancelledBy === "merchant" ? "Cancelled by Store" : "Cancelled")
                            : order.orderStatus.replace(/_/g, " ")}
                    </span>
                  </span>
                </div>
              </div>

              {/* Cancellation Notice Banner */}
              {order.orderStatus === "cancelled" && (
                <div
                  style={{
                    margin: "var(--space-3) 0",
                    padding: "12px 14px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <AlertCircle size={16} color="#DC2626" />
                      <strong style={{ color: "#DC2626", fontSize: "14px" }}>
                        {order.cancelledBy === "user"
                          ? "Order Cancelled by Customer"
                          : order.cancelledBy === "merchant"
                            ? "Order Cancelled by Store"
                            : order.cancelledBy === "admin"
                              ? "Order Cancelled by Support"
                              : "Order Cancelled"}
                      </strong>
                    </div>
                    {(order.hasUnavailableItems || (order.items || []).some(i => i.status === "out_of_stock")) && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#B91C1C",
                          backgroundColor: "#FEE2E2",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          border: "1px solid #FCA5A5",
                        }}
                      >
                        Item Out of Stock
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#991B1B" }}>
                    <strong>Reason:</strong> {order.reason || (order.hasUnavailableItems ? "Cancelled by customer due to out-of-stock item" : "Order cancelled upon request")}
                  </p>
                  {(order.hasUnavailableItems || (order.items || []).some(i => i.status === "out_of_stock")) && (
                    <p style={{ margin: 0, fontSize: "12px", color: "#B91C1C", fontStyle: "italic" }}>
                      ℹ️ The customer chose to cancel this entire order after an item was marked out of stock.
                    </p>
                  )}
                  {order.cancelledAt && (
                    <span style={{ fontSize: "11px", color: "#991B1B" }}>
                      Cancelled on: {new Date(order.cancelledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  )}
                </div>
              )}

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
              <div className="px-3 pb-3 sm:px-6 sm:pb-6" style={{ borderTop: "1px solid var(--color-border)" }}>
                <div style={{ paddingTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  {order.items.map((item, index) => {
                    const isReturned = item.tryStatus === 'returned' || item.isReturned;
                    const isPurchased = item.tryStatus === 'accepted' || item.tryStatus === 'keep' || item.tryStatus === 'not-triable';
                    const isDecisionMade = ['completed', 'delivered', 'return_in_progress', 'selection_made'].includes(order.orderStatus);
                    const isOutOfStock = item.status === 'out_of_stock';
                    const isOrderCancelled = order.orderStatus === 'cancelled';

                    const borderLeftColor = isOutOfStock
                      ? "var(--color-danger)"
                      : isOrderCancelled
                        ? "rgba(239, 68, 68, 0.4)"
                        : isReturned
                          ? "var(--color-danger)"
                          : isPurchased
                            ? "var(--color-success)"
                            : "var(--color-border)";

                    const background = isOutOfStock
                      ? "rgba(239, 68, 68, 0.06)"
                      : isReturned
                        ? "var(--color-danger-subtle)"
                        : "transparent";

                    return (
                      <div
                        key={index}
                        className="flex"
                        style={{
                          gap: "var(--space-3)",
                          paddingBottom: index !== order.items.length - 1 ? "var(--space-3)" : 0,
                          borderBottom: index !== order.items.length - 1 ? "1px solid var(--color-border)" : "none",
                          borderLeft: `3px solid ${borderLeftColor}`,
                          paddingLeft: "var(--space-3)",
                          background,
                          borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                        }}
                      >
                        <img src={item.image} alt={item.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "var(--radius-md)", flexShrink: 0, opacity: isOutOfStock ? 0.6 : 1 }} />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontWeight: 500, fontSize: "var(--text-base)", marginBottom: "2px", textDecoration: isOutOfStock ? "line-through" : "none", color: isOutOfStock ? "var(--color-text-tertiary)" : "inherit" }}>{item.name}</h4>
                          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                            Size: {item.size} · Qty: {item.quantity}
                          </p>
                          <p style={{ fontSize: "var(--text-base)", fontWeight: 600, textDecoration: (isReturned || isOutOfStock) ? "line-through" : "none", color: (isReturned || isOutOfStock) ? "var(--color-text-tertiary)" : "inherit" }}>
                            ₹{item.price}
                          </p>
                          {isOutOfStock ? (
                            <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span className="badge badge-danger" style={{ fontWeight: 600 }}>
                                Out of Stock
                              </span>
                              {item.outOfStockReason && (
                                <span style={{ fontSize: "11px", color: "var(--color-danger)" }}>
                                  ({item.outOfStockReason})
                                </span>
                              )}
                            </div>
                          ) : isOrderCancelled ? (
                            <span className="badge" style={{ marginTop: "4px", backgroundColor: "#FEE2E2", color: "#B91C1C", border: "1px solid #FCA5A5" }}>
                              Cancelled
                            </span>
                          ) : isDecisionMade ? (
                            <span className={`badge ${isReturned ? "badge-danger" : "badge-success"}`} style={{ marginTop: "4px" }}>
                              {isReturned ? "Returned" : "Purchased / Kept"}
                            </span>
                          ) : (
                            <span className="badge badge-info" style={{ marginTop: "4px" }}>
                              In Trial
                            </span>
                          )}
                          {isReturned && (
                            <>
                              {item.returnReason && (
                                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)", marginTop: "4px" }}>
                                  Reason: {item.returnReason}
                                </p>
                              )}
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ marginTop: "8px", borderColor: "var(--color-warning)", color: "var(--color-warning)" }}
                                onClick={() => {
                                  setReportIssueOrderId(order._id);
                                  setReportIssueItemId(item._id);
                                  setIssueType("damage");
                                  setIssueDescription("");
                                  setIssueImages([]);
                                }}
                              >
                                <AlertCircle size={14} style={{ marginRight: "4px" }} />
                                Report Issue
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                {(() => {
                  const isDecisionMade = ['completed', 'delivered', 'return_in_progress', 'selection_made'].includes(order.orderStatus);
                  const acceptedItems = (order.items || []).filter(i => i.tryStatus === 'accepted' || i.tryStatus === 'keep' || i.tryStatus === 'not-triable');
                  const acceptedSum = acceptedItems.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0);
                  const purchasedAmount = isDecisionMade 
                    ? (order.actualPurchasedAmount ?? order.finalBilling?.baseAmount ?? acceptedSum)
                    : order.totalAmount;
                  const hasReturns = (order.items || []).some(i => i.tryStatus === 'returned' || i.isReturned);

                  return (
                    <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>
                          {isDecisionMade ? "Customer Purchased Amount" : "Total Amount"}
                        </span>
                        {isDecisionMade && hasReturns && (
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginTop: "2px" }}>
                            Initial Try Order: ₹{order.totalAmount}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: isDecisionMade && purchasedAmount === 0 ? "var(--color-danger)" : "inherit" }}>
                        ₹{purchasedAmount}
                      </span>
                    </div>
                  );
                })()}

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

      {/* Report Issue Modal */}
      {reportIssueOrderId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setReportIssueOrderId(null)}>
          <div style={{ background: "white", padding: "24px", borderRadius: "12px", maxWidth: "450px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-warning)" }}>
              <AlertCircle size={20} /> Report Issue (Missing/Damage)
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px", display: "block" }}>Issue Type</label>
                <select 
                  value={issueType} 
                  onChange={(e) => setIssueType(e.target.value as any)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "14px", background: "white" }}
                >
                  <option value="damage">Damaged Item</option>
                  <option value="missing">Missing Item / Part</option>
                  <option value="other">Other Issue</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px", display: "block" }}>Description</label>
                <textarea
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px", display: "block" }}>Photos (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={(e) => {
                    if (e.target.files) {
                      setIssueImages(Array.from(e.target.files).slice(0, 5)); // Limit to 5
                    }
                  }}
                  style={{ width: "100%", fontSize: "14px" }}
                />
                {issueImages.length > 0 && (
                  <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                    {issueImages.length} image(s) selected
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="btn btn-ghost" onClick={() => setReportIssueOrderId(null)} disabled={submittingIssue}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ backgroundColor: "var(--color-warning)", borderColor: "var(--color-warning)", color: "white" }} 
                onClick={handleSubmitIssue} 
                disabled={!issueDescription.trim() || submittingIssue}
              >
                {submittingIssue ? "Submitting..." : "Submit Report"}
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
              <div className="px-4 py-3 sm:px-6 sm:py-5 border-b border-[var(--color-border)] flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <h3 style={{ fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Package size={18} /> Pack Verification
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                    Order #{packingOrder?._id ? String(packingOrder._id).slice(-6).toUpperCase() : '------'} · Provide at least 1 photo per item
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowPackingModal(false);
                    setPackingOrderId(null);
                  }}
                  className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 sm:gap-6">
                {packingOrder.orderStatus === "cancelled" && (
                  <div
                    style={{
                      padding: "14px 16px",
                      background: "#FEF2F2",
                      border: "1px solid #FECACA",
                      borderRadius: "10px",
                      color: "#991B1B",
                      fontSize: "13px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <strong style={{ fontSize: "14px", color: "#DC2626" }}>⚠️ Order Cancelled</strong>
                    <span>This order has been cancelled by the customer. Packing is no longer required.</span>
                    {packingOrder.reason && (
                      <span style={{ fontSize: "12px", color: "#7F1D1D" }}>Reason: {packingOrder.reason}</span>
                    )}
                  </div>
                )}
                {packingOrder.items.map((item) => {
                  const isOutOfStock = item.status === 'out_of_stock';
                  const itemPhotos = packingPhotos.filter(p => p.itemId === item._id);
                  const hasProof = itemPhotos.length > 0;
                  
                  return (
                    <div 
                      key={item._id} 
                      style={{ 
                        border: isOutOfStock ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid var(--color-border)", 
                        borderRadius: "12px", 
                        padding: "14px",
                        background: isOutOfStock 
                          ? "rgba(239, 68, 68, 0.05)" 
                          : hasProof ? "var(--color-success-subtle)" : "transparent",
                        borderColor: isOutOfStock 
                          ? "rgba(239, 68, 68, 0.3)" 
                          : hasProof ? "rgba(22, 163, 74, 0.2)" : "var(--color-border)",
                        opacity: isOutOfStock ? 0.85 : 1,
                        transition: "all var(--transition-base)"
                      }}
                    >
                      {/* Item Info Header */}
                      <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          style={{ 
                            width: "52px", 
                            height: "52px", 
                            objectFit: "cover", 
                            borderRadius: "8px",
                            border: "1px solid var(--color-border)",
                            opacity: isOutOfStock ? 0.6 : 1
                          }} 
                        />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <h4 style={{ 
                            fontWeight: 600, 
                            fontSize: "14px", 
                            color: isOutOfStock ? "#DC2626" : "var(--color-text)", 
                            textDecoration: isOutOfStock ? "line-through" : "none",
                            marginBottom: "2px" 
                          }}>
                            {item.name}
                          </h4>
                          <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                            <span>Size: <strong>{item.size}</strong></span>
                            <span>•</span>
                            <span>Qty: <strong>{item.quantity}</strong></span>
                            <span>•</span>
                            <span>₹<strong>{item.price}</strong></span>
                          </div>
                        </div>
                        <div style={{ alignSelf: "center" }}>
                          {isOutOfStock ? (
                            <span className="badge" style={{ background: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}>
                              OUT OF STOCK
                            </span>
                          ) : (
                            <span className={`badge ${hasProof ? "badge-success" : "badge-neutral"}`}>
                              {hasProof ? `${itemPhotos.length} Photo(s)` : "Missing Photo"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Uploaded Photos Grid */}
                      {!isOutOfStock && itemPhotos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
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
                      {isOutOfStock ? (
                        <div style={{ 
                          padding: "8px 12px", 
                          background: "#FEE2E2", 
                          borderRadius: "6px", 
                          fontSize: "12px", 
                          color: "#B91C1C", 
                          fontWeight: 500,
                          textAlign: "center" 
                        }}>
                          Item excluded from order • Customer notified
                        </div>
                      ) : (
                        <div className="flex flex-wrap sm:flex-nowrap gap-2">
                          {/* Photo Upload */}
                          <label className="btn btn-secondary btn-sm flex-1 min-w-[120px] justify-center cursor-pointer py-2">
                            <Upload size={14} /> Upload Photo
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
                            className={`btn btn-sm flex-1 min-w-[100px] justify-center py-2 ${expandedItemQr === item._id ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setExpandedItemQr(expandedItemQr === item._id ? null : item._id)}
                          >
                            <QrCode size={14} /> {expandedItemQr === item._id ? "Hide QR" : "Scan QR"}
                          </button>

                          {/* Out of Stock Button */}
                          <button
                            className="btn btn-sm w-full sm:w-auto justify-center py-2"
                            style={{ 
                              background: "rgba(239, 68, 68, 0.1)", 
                              color: "#DC2626", 
                              border: "1px solid #FECACA",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer"
                            }}
                            onClick={() => handleMarkOutOfStock(packingOrder._id, item._id, item.name)}
                          >
                            <AlertCircle size={14} /> Out of Stock
                          </button>
                        </div>
                      )}

                      {/* QR Display */}
                      {!isOutOfStock && expandedItemQr === item._id && (() => {
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
              <div className="p-3.5 sm:px-6 sm:py-4 border-t border-[var(--color-border)] flex flex-col-reverse sm:flex-row justify-end gap-2.5 bg-[var(--color-bg)]">
                {packingOrder.orderStatus === "cancelled" ? (
                  <button 
                    className="btn btn-primary w-full sm:w-auto justify-center" 
                    onClick={() => {
                      setShowPackingModal(false);
                      setPackingOrderId(null);
                    }}
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button 
                      className="btn btn-secondary w-full sm:w-auto justify-center" 
                      onClick={() => {
                        setShowPackingModal(false);
                        setPackingOrderId(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary w-full sm:w-auto justify-center flex items-center gap-2" 
                      disabled={modalLoading}
                      onClick={() => handlePackOrder(packingOrder._id)}
                    >
                      {modalLoading && <Loader2 className="spinner spinner-sm" style={{ borderTopColor: '#FFFFFF' }} />}
                      Confirm Packing & Generate OTP
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default OrderManagement;