import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getAllOrders, packOrder } from "../api/order";
import { useLocation } from "react-router-dom";
import { emitter } from "../utils/socket";

// interface LayoutContext {
//   isSidebarOpen: boolean;
// }

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
    | "accepted"
    | "packed"
    | "out_for_delivery"
    | "delivered"
    | "returned"
    | "partially_returned"
    | "cancelled"
    | "complete"
    | "verified_return"
    | "return_accepted"
    | "try_phase";
  deliveryRiderStatus?: string | null;
  items: OrderItem[];
  otp?: string | null;
  acceptedAt?: number | null;
}

const OrderManagement: React.FC = () => {
  // const outletContext = useOutletContext<LayoutContext | null>();
  // const _isSidebarOpen = outletContext?.isSidebarOpen ?? false;

  const [orders, setOrders] = useState<Order[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);
  const [_error, setError] = useState<string>("");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [timers, setTimers] = useState<Record<string, number>>({});
  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const TIMER_DURATION = 5 * 60 * 1000;
  const location = useLocation();

  // SOCKET ─────────────────────────────────────
  useEffect(() => {
    const handleOrderUpdate = (updatedOrder: Order) => {
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
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: "packed", otp: res.order.otp } : o))
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
    (order) => !["cancelled", "complete", "partially_returned"].includes(order.orderStatus)
  );

  const getStatusColor = (status: Order["orderStatus"]): string => {
  switch (status) {
    case "accepted":
      return "#2563eb"; // blue
    case "packed":
      return "#7c3aed"; // purple
    case "out_for_delivery":
      return "#f59e0b"; // amber
    case "delivered":
      return "#16a34a"; // green
    case "returned":
      return "#dc2626"; // red
    case "verified_return":
      return "#fb923c"; // orange
    case "return_accepted":
      return "#0891b2"; // cyan
    case "try_phase":
      return "#6d28d9"; // violet
    default:
      return "#6b7280"; // gray
  }
};

const getStatusIcon = (status: Order["orderStatus"]) => {
  switch (status) {
    case "accepted":
      return <Clock size={14} />;
    case "packed":
      return <Package size={14} />;
    case "out_for_delivery":
      return <Truck size={14} />;
    case "delivered":
      return <CheckCircle size={14} />;
    case "returned":
      return <XCircle size={14} />;
    case "verified_return":
      return <AlertCircle size={14} />;
    case "return_accepted":
      return <CheckCircle size={14} />;
    case "try_phase":
      return <AlertCircle size={14} />;
    default:
      return <AlertCircle size={14} />;
  }
};


  return (
    <div
      className={`min-h-screen bg-gray-50 transition-all duration-300`}
    >
      {/* Header */}
      <div className="bg-gray-800 text-white !py-8">
        <div className="max-w-6xl mx-auto !px-4">
          <h1 className="text-3xl font-bold !mb-2 leading-9">
            Order Management System
          </h1>
          <p className="text-blue-100">Track and manage all your orders</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1300px] !ml-5 !mr-12 !p-4">
        <div className="grid grid-cols-1 !gap-6 items-start">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow-xl overflow-hidden"
            >
              {/* Card Header */}
              <div className="!p-4 border-b border-gray-200">
                <div className="flex justify-between items-start !mb-2 flex-wrap !gap-3">
                  {/* Left: Order Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 !mb-1">
                      Order #{order._id.slice(-6)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Right: Delivery Partner + Status Badge */}
                  <div className="flex items-center !gap-3 flex-wrap justify-end">
                    {/* Delivery Status */}
                    <div className="!px-3 !py-1.5 rounded-full text-white font-semibold text-xs flex items-center !gap-1.5 shadow-sm bg-gray-900">
                      🚚 Delivery Partner Status:{" "}
                      {order.deliveryRiderStatus
                        ? order.deliveryRiderStatus.charAt(0).toUpperCase() +
                          order.deliveryRiderStatus.slice(1).toLowerCase()
                        : "Not Available"}
                    </div>

                    {/* Status Badge */}
                    <div
                      className="flex items-center !gap-1.5 text-xs font-semibold !px-2.5 !py-1.5 rounded-md text-white"
                      style={{
                        backgroundColor: getStatusColor(order.orderStatus),
                      }}
                    >
                      {getStatusIcon(order.orderStatus)}
                      <span className="capitalize">
                        {order.orderStatus === "packed"
                          ? "Packed – Waiting for Delivery Partner"
                          : order.orderStatus === "try_phase"
                          ? "In Try Phase"
                          : order.orderStatus.replace("_", " ")}
                      </span>
                      <span className="!ml-2 text-[0.7rem] font-medium bg-white/20 !px-1.5 !py-0.5 rounded">
                        {(() => {
                          const delivered = order.items.filter(
                            (i) => !i.isReturned
                          ).length;
                          const returned = order.items.filter(
                            (i) => i.isReturned
                          ).length;
                          return `${delivered} Delivered / ${returned} Returned`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="!mt-3 flex justify-between items-center !gap-4 flex-wrap">
                  {/* Expand Toggle */}
                  <button
                    className="bg-transparent border-0 text-blue-600 text-sm font-semibold cursor-pointer transition-colors hover:text-blue-800"
                    onClick={() => toggleExpand(order._id)}
                  >
                    {expandedOrders[order._id]
                      ? "− Hide Items"
                      : "+ View Items"}
                  </button>

                  {/* Action Buttons */}
                  <div className="flex items-center !gap-2">
                    {!expandedOrders[order._id] && (
                      <>
                        {order.orderStatus === "accepted" && (
                          <button
                            className="!px-3 !py-1.5 text-xs font-medium uppercase tracking-wide cursor-pointer transition-all duration-200 border-0 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => handlePackOrder(order._id)}
                          >
                            ✅ Pack
                          </button>
                        )}

                        {order.orderStatus === "returned" && (
                          <button
                            className="!px-3 !py-1.5 text-xs font-medium uppercase tracking-wide cursor-pointer transition-all duration-200 border-0 rounded-md bg-orange-500 text-white hover:bg-orange-600"
                            onClick={() =>
                              handleReturnAction(order._id, order.orderStatus)
                            }
                          >
                            🔍 Verify
                          </button>
                        )}

                        {order.orderStatus === "verified_return" && (
                          <button
                            className="!px-3 !py-1.5 text-xs font-medium uppercase tracking-wide cursor-pointer transition-all duration-200 border-0 rounded-md bg-orange-500 text-white hover:bg-orange-600"
                            onClick={() =>
                              handleReturnAction(order._id, order.orderStatus)
                            }
                          >
                            ✅ Accept
                          </button>
                        )}

                        {order.otp !== null && (
                          <div className="flex items-center !gap-1.5 bg-blue-50 border border-blue-200 rounded-md !px-2.5 !py-1.5 text-xs font-semibold text-blue-700">
                            <span className="font-medium text-blue-600">
                              OTP:
                            </span>
                            <span className="bg-blue-100 !px-1.5 !py-0.5 rounded font-mono tracking-wider">
                              {order.otp}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Timer Display */}
                {order.orderStatus === "accepted" && (
                  <div className="flex items-center !gap-1.5 bg-amber-50 !px-2.5 !py-1.5 rounded-md text-sm font-semibold text-amber-900 !mt-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    {timers[order._id] > 0 ? (
                      <span className="tabular-nums">
                        {formatTimer(timers[order._id])}
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold !ml-1.5 inline-block animate-pulse">
                        Time's up! Pack now 🚨 | Delay will affect your store
                        rating & product reach ⚠️
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Expandable Items */}
              {expandedOrders[order._id] && (
                <div className="!p-4 animate-fadeIn">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className={`flex !gap-3 !mb-3 !pb-3 ${
                        index !== order.items.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      } ${
                        item.isReturned
                          ? "border-l-4 border-red-500 !pl-2 bg-red-50"
                          : "border-l-4 border-emerald-500 !pl-2"
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 !mb-1">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500 !mb-1">
                          Size: {item.size} | Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          ₹{item.price}
                        </p>
                        <p className="text-xs font-medium text-gray-500 !mt-1">
                          {item.isReturned ? "Returned" : "Delivered"}
                        </p>
                        {item.isReturned && (
                          <p className="text-xs text-red-600 !mt-1">
                            Reason: {item.returnReason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Total Section */}
                  <div className="!mt-4 !pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">
                        Total Amount:
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{order.totalAmount}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="!mt-4">
                    {order.orderStatus === "accepted" && (
                      <button
                        className="w-full !py-2.5 !px-4 rounded-lg font-medium transition-all duration-200 border-0 cursor-pointer flex items-center justify-center !gap-2 bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => handlePackOrder(order._id)}
                      >
                        ✅ Pack Order
                      </button>
                    )}

                    {order.orderStatus === "returned" && (
                      <button
                        className="w-full !py-2.5 !px-4 rounded-lg font-medium transition-all duration-200 border-0 cursor-pointer flex items-center justify-center !gap-2 bg-orange-500 text-white hover:bg-orange-600"
                        onClick={() =>
                          handleReturnAction(order._id, order.orderStatus)
                        }
                      >
                        🔍 Verify Return
                      </button>
                    )}

                    {order.orderStatus === "verified_return" && (
                      <button
                        className="w-full !py-2.5 !px-4 rounded-lg font-medium transition-all duration-200 border-0 cursor-pointer flex items-center justify-center !gap-2 bg-orange-500 text-white hover:bg-orange-600"
                        onClick={() =>
                          handleReturnAction(order._id, order.orderStatus)
                        }
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

      {/* CSS for fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-in;
        }
      `}</style>
    </div>
  );
};

export default OrderManagement;
