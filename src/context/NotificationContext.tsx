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
    }
  }, [ordersQueue, currentOrder]);

  const closePopup = () => {
    setCurrentOrder(null);
    setReason("");
    setShowReasonBox(false);
  };

const acceptOrder = async () => {
  try {
    await acceptOrRejectOrder(currentOrder._id, "accept", "accepted");
    console.log("✅ Accept order:", currentOrder);

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

      {currentOrder && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h2 style={styles.title}>📩 New Order</h2>

<div style={styles.detailsGrid}>
  <div style={styles.detailRow}>
    <span style={styles.label}>Order ID:</span>
    <span style={styles.value}>{currentOrder._id}</span>
  </div>

  <div style={styles.detailRow}>
    <span style={styles.label}>Amount:</span>
    <span style={styles.value}>
      ₹{currentOrder.totalAmount}
    </span>
  </div>

  <div style={styles.detailRow}>
    <span style={styles.label}>Status:</span>
    <span style={styles.value}>{currentOrder.orderStatus}</span>
  </div>

  <div style={styles.detailRow}>
    <span style={styles.label}>Payment:</span>
    <span style={styles.value}>{currentOrder.paymentStatus}</span>
  </div>

  <div style={styles.detailRow}>
    <span style={styles.label}>Address:</span>
    <span style={styles.value}>
      {currentOrder.deliveryLocation?.address || "Not Provided"}
    </span>
  </div>

  <div style={styles.detailRow}>
    <span style={styles.label}>Created At:</span>
    <span style={styles.value}>
      {new Date(currentOrder.createdAt).toLocaleString()}
    </span>
  </div>
</div>

{/* Product Details Section */}
<div style={{ marginTop: "16px" }}>
  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
    Items
  </h3>
  {currentOrder.items.map((item) => (
    <div
      key={item._id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "10px",
        borderBottom: "1px solid #eee",
        paddingBottom: "8px",
      }}
    >
      <img
        src={item.image}
        alt={item.name}
        style={{ width: "50px", height: "50px", borderRadius: "6px" }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "500" }}>{item.name}</div>
        <div style={{ fontSize: "13px", color: "#555" }}>
          Size: {item.size} | Qty: {item.quantity}
        </div>
      </div>
      <div style={{ fontWeight: "600" }}>₹{item.price}</div>
    </div>
  ))}
</div>

            <div style={styles.actions}>
              <button onClick={acceptOrder} style={styles.acceptBtn}>
                ✅ Accept
              </button>

              {!showReasonBox ? (
                <button
                  onClick={() => setShowReasonBox(true)}
                  style={styles.rejectBtn}
                >
                  ❌ Reject
                </button>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}
                >
                  <select
                    style={styles.selectBox}
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
                  <button onClick={rejectOrder} style={styles.rejectBtn}>
                    Confirm Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },
  popup: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "12px",
    textAlign: "left",
    width: "380px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)"
  },
  title: {
    marginBottom: "16px",
    fontSize: "20px",
    fontWeight: "600",
    textAlign: "center",
    color: "#000"
  },
  detailsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px"
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px"
  },
  label: {
    fontWeight: "600",
    color: "#555"
  },
  value: {
    color: "#000",
    fontWeight: "500"
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px"
  },
  acceptBtn: {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    flex: 1,
    marginRight: "8px"
  },
  rejectBtn: {
    backgroundColor: "#f44336",
    color: "white",
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    flex: 1
  },
  selectBox: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px"
  }
};
