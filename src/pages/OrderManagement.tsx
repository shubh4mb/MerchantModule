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
import { useAuth } from "../context/AuthContext";

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
  | "placed"
  | "accepted"
  | "packed"
  | "out_for_delivery"
  | "arrived at delivery"
  | "try phase"
  | "completed try phase"
  | "otp-verified-return"
  | "reached return merchant"
  | "confirmed_purchase"
  | "returned"
  | "partially_returned"
  | "delivered"
  | "cancelled"
  | "completed"
  | "rejected";
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
  const { isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [_error, setError] = useState<string>("");

  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [timers, setTimers] = useState<Record<string, number>>({});
  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const TIMER_DURATION = 5 * 60 * 1000;
  const location = useLocation();

  const [isOnline, setIsOnline] = useState<boolean>(() => localStorage.getItem("onlineStatus") === "true");

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(localStorage.getItem("onlineStatus") === "true");
    };
    window.addEventListener("onlineStatusChanged", handleStatusChange);
    return () => window.removeEventListener("onlineStatusChanged", handleStatusChange);
  }, []);

  const handleGoOnline = () => {
    localStorage.setItem("onlineStatus", "true");
    window.dispatchEvent(new Event("onlineStatusChanged"));
  };

  // SOCKET ─────────────────────────────────────
  useEffect(() => {
    const handleOrderUpdate = (updatedOrder: any) => {
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

  // FETCH ─────────────────────────────────────
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data: Order[] = await getAllOrders();

        const mapped = data.map((order) => ({
          ...order,
          acceptedAt:
            order.orderStatus === "accepted" ? new Date(order.updatedAt).getTime() : null,
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

  // TIMER ─────────────────────────────────────
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

  // HELPERS ─────────────────────────────────────
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

  const getStatusConfig = (status: Order["orderStatus"]) => {
    switch (status) {
      case "placed":
        return { color: "bg-blue-600", hex: "#3b82f6", icon: <Clock size={14} />, label: "Placed" };
      case "accepted":
        return { color: "bg-black", hex: "#000000", icon: <Clock size={14} />, label: "Accepted" };
      case "packed":
        return { color: "bg-gray-900", hex: "#111827", icon: <Package size={14} />, label: "Packed" };
      case "out_for_delivery":
        return { color: "bg-amber-500", hex: "#f59e0b", icon: <Truck size={14} />, label: "Out for Delivery" };
      case "arrived at delivery":
        return { color: "bg-orange-500", hex: "#f97316", icon: <Truck size={14} />, label: "Arrived at Delivery" };
      case "try phase":
        return { color: "bg-violet-700", hex: "#6d28d9", icon: <AlertCircle size={14} />, label: "In Try Phase" };
      case "completed try phase":
        return { color: "bg-violet-500", hex: "#8b5cf6", icon: <CheckCircle size={14} />, label: "Completed Try Phase" };
      case "otp-verified-return":
        return { color: "bg-cyan-600", hex: "#0891b2", icon: <CheckCircle size={14} />, label: "OTP Verified Return" };
      case "reached return merchant":
        return { color: "bg-teal-600", hex: "#14b8a6", icon: <Truck size={14} />, label: "Reached Merchant" };
      case "confirmed_purchase":
        return { color: "bg-green-600", hex: "#16a34a", icon: <CheckCircle size={14} />, label: "Confirmed Purchase" };
      case "returned":
        return { color: "bg-red-600", hex: "#dc2626", icon: <XCircle size={14} />, label: "Returned" };
      case "partially_returned":
        return { color: "bg-orange-400", hex: "#fb923c", icon: <AlertCircle size={14} />, label: "Partially Returned" };
      case "delivered":
        return { color: "bg-green-600", hex: "#16a34a", icon: <CheckCircle size={14} />, label: "Delivered" };
      case "completed":
        return { color: "bg-emerald-600", hex: "#059669", icon: <CheckCircle size={14} />, label: "Completed" };
      default:
        return { color: "bg-gray-500", hex: "#6b7280", icon: <AlertCircle size={14} />, label: status.replace(/_/g, " ") };
    }
  };

  const getStatusColor = (status: Order["orderStatus"]) => getStatusConfig(status).hex;
  const getStatusIcon = (status: Order["orderStatus"]) => getStatusConfig(status).icon;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Syncing Logistics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              <PackageCheck className="w-4 h-4" />
              <span>Logistics Engine</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">
              Order Command
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-sm border ${isOnline ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              {isOnline ? "Relay Active" : "Relay Offline"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1300px] !ml-5 !mr-12 !p-4">
        {!isOnline ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12">
            <h3 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">
              Awaiting Command
            </h3>
            <p className="text-gray-400 font-bold max-w-sm mb-12 leading-relaxed uppercase tracking-widest text-[10px]">
              Your deployment is currently offline. Customers cannot view your inventory or submit orders until relay is active.
            </p>
            <button
              onClick={handleGoOnline}
              className="bg-black text-white font-black uppercase tracking-[0.2em] py-6 px-12 rounded-[2rem] shadow-2xl hover:scale-[1.05] active:scale-[0.98] transition-all duration-300 flex items-center gap-4 group"
            >
              Initialize Relay
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                <Ship className="w-16 h-16 mb-6 text-gray-200" />
                <h4 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">No Active Missions</h4>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Waiting for customer deployment...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {filteredOrders.map((order) => {
                  const config = getStatusConfig(order.orderStatus);
                  const isExpanded = expandedOrders[order._id];

                  return (
                    <div
                      key={order._id}
                      className={`group bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border transition-all duration-500 overflow-hidden ${isExpanded ? 'border-gray-900 ring-1 ring-gray-900 translate-y-[-4px]' : 'border-gray-50 hover:border-gray-200'}`}
                    >
                      {/* Card Identity Bar */}
                      <div className="p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative">
                        {isExpanded && <div className="absolute top-0 left-0 w-2 h-full bg-black"></div>}
                        
                        <div className="flex items-start gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${config.color}`}>
                            {config.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-black text-gray-900 tracking-tighter">
                                MISSION #{order._id.slice(-6).toUpperCase()}
                              </h3>
                              <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white ${config.color}`}>
                                {config.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                              <div className="flex items-center gap-1.5 font-bold italic">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1.5 font-bold italic">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                          {order.deliveryRiderId && (
                            <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-2 pr-4 rounded-[1.25rem]">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Truck className="w-5 h-5 text-black" />
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Logistics Unit</p>
                                <p className="text-xs font-black text-gray-900 leading-none">
                                  {order.deliveryRiderDetails?.phone || "DISPATCHED"}
                                </p>
                              </div>
                              {order.deliveryRiderDetails?.phone && (
                                <a
                                  href={`tel:${order.deliveryRiderDetails.phone}`}
                                  className="w-8 h-8 bg-black text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
                                  title="Call Unit"
                                >
                                  <Phone size={12} fill="currentColor" />
                                </a>
                              )}
                            </div>
                          )}

                          <div className="bg-black text-white px-6 py-4 rounded-2xl flex flex-col items-center justify-center shadow-xl shadow-black/10">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1 text-center">Value</p>
                            <p className="text-lg font-black tracking-tighter">₹{order.totalAmount}</p>
                          </div>
                          
                          <button
                            onClick={() => toggleExpand(order._id)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-gray-100 text-gray-900' : 'bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white'}`}
                          >
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>
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
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
