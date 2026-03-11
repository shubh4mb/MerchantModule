import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";
import type { ReactNode } from "react";
import { emitter } from "../utils/socket";
import { acceptOrRejectOrder, fetchPlacedOrders } from "../api/order";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Package, Bell, X } from "lucide-react";

// ----------------- Types -----------------

interface OrderItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
}

export interface Order {
  _id: string;
  totalAmount: number;
  items: OrderItem[];
}

interface NotificationContextType {
  newOrderCount: number;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

// ------------------------------------------

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [ordersQueue, setOrdersQueue] = useState<Order[]>([]);
  const [newOrderCount, setNewOrderCount] = useState<number>(0);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState<string>("");
  const [showReasonBox, setShowReasonBox] = useState<boolean>(false);
  const [_isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();

  const rejectionReasons: string[] = [
    "Out of stock",
    "Delivery not available in this area",
    "Technical issue",
    "High order volume",
    "Other",
  ];

  // Handle incoming order events via socket
  useEffect(() => {
    const handler = (order: Order) => {
      setOrdersQueue((prev) => {
        if (prev.some((o) => o._id === order._id)) return prev; // Avoid duplicates
        return [...prev, order];
      });

      // Increase only when truly new
      setNewOrderCount((prev) =>
        ordersQueue.some((o) => o._id === order._id) ? prev : prev + 1
      );
    };

    emitter.on("newOrder", handler);

    const loadPlacedOrders = async () => {
      try {
        const res = await fetchPlacedOrders();
        const placedOrders: Order[] = res.orders || [];

        setOrdersQueue((prev) => {
          const merged = [...prev];
          placedOrders.forEach((p) => {
            if (!merged.some((o) => o._id === p._id)) {
              merged.push(p);
            }
          });
          return merged;
        });

        setNewOrderCount((prev) => prev + placedOrders.length);
      } catch (err) {
        console.error("❌ Failed to fetch placed orders:", err);
      }
    };

    loadPlacedOrders();

    return () => {
      emitter.off("newOrder", handler);
    };
  }, []);

  // Automatically show next order in queue
  useEffect(() => {
    if (!currentOrder && ordersQueue.length > 0) {
      setCurrentOrder(ordersQueue[0]);
      setOrdersQueue((prev) => prev.slice(1));
      setIsAnimating(true);
    }
  }, [ordersQueue, currentOrder]);

  const closePopup = () => {
    setIsClosing(true);
    setTimeout(() => {
      setCurrentOrder(null);
      setReason("");
      setShowReasonBox(false);
      setIsClosing(false);
      setIsAnimating(false);
    }, 200);
  };

  const acceptOrder = async () => {
    if (!currentOrder) return;
    try {
      await acceptOrRejectOrder(currentOrder._id, "accept", "accepted");

      if (location.pathname === "/merchant/orders") {
        navigate("/merchant/orders", { replace: true, state: { refresh: Date.now() } });
      } else {
        navigate("/merchant/orders");
      }
    } catch (error) {
      console.log(error);
    } finally {
      closePopup();
    }
  };

  const rejectOrder = async () => {
    if (!currentOrder) return;
    if (!reason.trim()) {
      alert("Please select a reason before rejecting.");
      return;
    }

    try {
      await acceptOrRejectOrder(currentOrder._id, "reject", reason);
    } catch (error) {
      console.log(error);
    }

    closePopup();
  };

  return (
    <NotificationContext.Provider value={{ newOrderCount }}>
      {children}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(20px) scale(0.95); }
        }
        .modal-animate-in { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .modal-animate-out { animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {currentOrder && (
        <div 
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
          onClick={closePopup}
        >
          <div 
            className={`bg-white rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] w-full max-w-lg overflow-hidden border border-gray-100 ${isClosing ? 'modal-animate-out' : 'modal-animate-in'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-black p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Bell className="w-5 h-5 text-white animate-bounce" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Ingoing Mission</span>
                </div>
                <button onClick={closePopup} className="text-white/50 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">
                Incoming Deployment
              </h2>
            </div>

            <div className="p-8 lg:p-10 space-y-8 max-h-[70vh] overflow-y-auto font-sans">
              {/* Core Mission Data */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mission ID</p>
                  <p className="text-sm font-black text-gray-900 font-mono tracking-wider">#{currentOrder._id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 shadow-xl shadow-black/10">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Contract Value</p>
                  <p className="text-sm font-black text-white">₹{currentOrder.totalAmount}</p>
                </div>
              </div>

              {/* Inventory Checklist */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Deployment Manifest
                </h3>
                <div className="space-y-3">
                  {currentOrder.items.map((item) => (
                    <div key={item._id} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 bg-gray-50/50 group transition-all hover:bg-white hover:shadow-xl hover:border-transparent">
                      <div className="relative">
                        <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover shadow-sm grayscale group-hover:grayscale-0 transition-all duration-700" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Size: {item.size}</p>
                      </div>
                      <p className="text-sm font-black text-gray-900 tracking-tighter">₹{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Vector */}
              <div className="pt-4 space-y-4">
                {!showReasonBox ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={acceptOrder}
                      className="flex-grow bg-black text-white p-6 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Accept Mission
                    </button>
                    <button
                      onClick={() => setShowReasonBox(true)}
                      className="sm:w-auto px-8 bg-gray-100 text-gray-900 p-6 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Abort
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <select
                      className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-[1.5rem] text-sm font-black uppercase tracking-widest focus:ring-0 focus:border-black outline-none transition-all"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      <option value="">Select Failure Vector</option>
                      {rejectionReasons.map((r) => (
                        <option key={r} value={r}>{r.toUpperCase()}</option>
                      ))}
                    </select>
                    <div className="flex gap-4">
                      <button
                        onClick={rejectOrder}
                        className="flex-grow bg-red-600 text-white p-6 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-red-700 transition-all"
                      >
                        Confirm Abort
                      </button>
                      <button
                        onClick={() => setShowReasonBox(false)}
                        className="px-8 bg-gray-100 text-gray-900 p-6 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
  return context;
};