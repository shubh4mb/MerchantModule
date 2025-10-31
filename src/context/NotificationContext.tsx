import React, { createContext, useContext, useState, useEffect } from "react";
import { emitter } from "../utils/socket";
import { acceptOrRejectOrder, fetchPlacedOrders } from "../api/order";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [ordersQueue, setOrdersQueue] = useState([]);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [reason, setReason] = useState(""); // selected rejection reason
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const rejectionReasons = [
    "Out of stock",
    "Delivery not available in this area",
    "Technical issue",
    "High order volume",
    "Other"
  ];

  useEffect(() => {
    const handler = (order) => {
      console.log("👉 handler received:", order);

      setOrdersQueue((prev) => {
        // Prevent duplicates by ID
        if (prev.some((o) => o._id === order._id)) {
          console.log("⚠️ Duplicate order ignored:", order._id);
          return prev;
        }
        return [...prev, order];
      });

      setNewOrderCount((prev) => {
        // Only increment if it's a new order
        return ordersQueue.some((o) => o._id === order._id) ? prev : prev + 1;
      });
    };

    emitter.on("newOrder", handler);

    const loadPlacedOrders = async () => {
      try {
        const res = await fetchPlacedOrders();
        const placedOrders = res.orders || [];

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

    return () => emitter.off("newOrder", handler);
  }, []);

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
    }, 200); // Match animation duration
  };

  const acceptOrder = async () => {
    try {
      await acceptOrRejectOrder(currentOrder._id, "accept", "accepted");

      if (location.pathname === "/merchant/orders") {
        // Force re-mount by pushing with a unique key (timestamp or random)
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
    if (!reason.trim()) {
      alert("Please select a reason before rejecting.");
      return;
    }
    try {
      await acceptOrRejectOrder(currentOrder._id, "reject", reason); // pass reason
    } catch (error) {
      console.log(error);
    }
    console.log("❌ Reject order:", currentOrder, "Reason:", reason);
    closePopup();
  };

  return (
    <NotificationContext.Provider value={{ newOrderCount }}>
      {children}

      {/* Add keyframe styles */}
      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.7);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes scaleOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.7);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        
        .modal-backdrop {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .modal-backdrop.closing {
          animation: fadeOut 0.2s ease-out forwards;
        }
        
        .modal-content {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .modal-content.closing {
          animation: scaleOut 0.2s ease-out forwards;
        }
      `}</style>

      {currentOrder && (
        <div 
          className={`modal-backdrop fixed inset-0  bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4! ${isClosing ? 'closing' : ''}`}
          onClick={closePopup}
        >
          <div 
            className={`modal-content bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden ${isClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto max-h-[90vh] p-5! sm:p-6!">
              {/* Header with gradient accent */}
              <div className="flex items-center justify-center mb-5! relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-10 rounded-xl blur-xl"></div>
                <h2 className="text-xl sm:text-2xl font-bold text-center relative z-10 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  📩 New Order Received
                </h2>
              </div>

              {/* Order Details Card */}
              <div className="bg-white rounded-xl shadow-sm p-4! mb-4! border border-gray-100">
                <div className="flex flex-col gap-3!">
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="font-semibold text-gray-500 flex items-center gap-2!">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Order ID
                    </span>
                    <span className="font-mono text-xs sm:text-sm bg-gray-100 px-3! py-1! rounded-full text-gray-800 truncate ml-2! max-w-[60%]">
                      #{currentOrder._id.slice(-8)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm sm:text-base pt-2! border-t border-gray-100">
                    <span className="font-semibold text-gray-500 flex items-center gap-2!">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Total Amount
                    </span>
                    <span className="font-bold text-lg sm:text-xl text-green-600">
                      ₹{currentOrder.totalAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Details Section */}
              <div className="bg-white rounded-xl shadow-sm p-4! border border-gray-100">
                <h3 className="text-sm sm:text-base font-bold mb-3! text-gray-700 flex items-center gap-2!">
                  <span className="text-lg">🛍️</span>
                  Order Items
                </h3>
                <div className="space-y-3!">
                  {currentOrder.items.map((item, idx) => (
                    <div
                      key={item._id}
                      className={`flex items-center gap-3! p-2! rounded-lg transition-all hover:bg-gray-50 ${
                        idx !== currentOrder.items.length - 1 ? 'border-b border-gray-100 pb-3!' : ''
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shadow-sm"
                        />
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-gray-800 truncate">
                          {item.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          Size: <span className="font-medium text-gray-700">{item.size}</span>
                        </div>
                      </div>
                      <div className="font-bold text-sm sm:text-base text-gray-800 flex-shrink-0">
                        ₹{item.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3! mt-5!">
                <button
                  onClick={acceptOrder}
                  className="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3! px-5! rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex-1 flex items-center justify-center gap-2!"
                >
                  <span className="text-lg">✅</span>
                  Accept Order
                </button>

                {!showReasonBox ? (
                  <button
                    onClick={() => setShowReasonBox(true)}
                    className="bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white !py-3! !px-5! rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex-1 flex items-center justify-center gap-2!"
                  >
                    <span className="text-lg">❌</span>
                    Reject Order
                  </button>
                ) : (
                  <div className="flex-1 flex flex-col gap-2!">
                    <select
                      className="p-3! rounded-xl border-2 border-gray-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white shadow-sm transition-all"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      <option value="">-- Select Reason --</option>
                      {rejectionReasons.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={rejectOrder}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white !py-3! !px-5! rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                    >
                      Confirm Rejection
                    </button>
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

export const useNotifications = () => useContext(NotificationContext);