import React, { createContext, useContext, useState, useEffect } from "react";
import { emitter } from "../utils/socket";
import { acceptOrRejectOrder } from "../api/order";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [ordersQueue, setOrdersQueue] = useState([]);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [currentOrder, setCurrentOrder] = useState(null);
// console.log(currentOrder,'orderorderorder');

  

  useEffect(() => {
 const handler = (order) => {
  console.log("👉 handler received:", order); // should show the object
  setOrdersQueue((prev) => [...prev, order]);
  setNewOrderCount((prev) => prev + 1);
};



    emitter.on("newOrder", handler);

    return () => emitter.off("newOrder", handler);
  }, []);

  // Show the next order when currentOrder is null and queue has items
  useEffect(() => {
    if (!currentOrder && ordersQueue.length > 0) {
      setCurrentOrder(ordersQueue[0]);
      setOrdersQueue((prev) => prev.slice(1));
    }
  }, [ordersQueue, currentOrder]);

  const closePopup = () => {
    setCurrentOrder(null);
  };

  const acceptOrder = async() => {
    try {
      await acceptOrRejectOrder(currentOrder.id, 'accept');
    } catch (error) {
      console.log(error);
    }
    console.log("✅ Accept order:", currentOrder);
    closePopup();
    // call API or other logic here
  };

  const rejectOrder = async() => {
    try {
      await acceptOrRejectOrder(currentOrder.id , 'reject');
    } catch (error) {
      console.log(error);
    }
    console.log("❌ Reject order:", currentOrder);
    closePopup();
    // call API or other logic here
  };

  return (
    <NotificationContext.Provider value={{ newOrderCount }}>
      {children}

      {/* Popup overlay */}
{currentOrder && (
  <div style={styles.overlay}>
    <div style={styles.popup}>
      <h2 style={styles.title}>📩 New Order</h2>

      <div style={styles.detailsGrid}>
        <div style={styles.detailRow}>
          <span style={styles.label}>Order ID:</span>
          <span style={styles.value}>{currentOrder.id}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Receipt:</span>
          <span style={styles.value}>{currentOrder.receipt}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Amount:</span>
          <span style={styles.value}>
            {currentOrder.amount / 100} {currentOrder.currency}
          </span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Status:</span>
          <span style={styles.value}>{currentOrder.status}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Attempts:</span>
          <span style={styles.value}>{currentOrder.attempts}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.label}>Created At:</span>
          <span style={styles.value}>
            {new Date(currentOrder.created_at * 1000).toLocaleString()}
          </span>
        </div>
      </div>

      <div style={styles.actions}>
        <button onClick={acceptOrder} style={styles.acceptBtn}>
          ✅ Accept
        </button>
        <button onClick={rejectOrder} style={styles.rejectBtn}>
          ❌ Reject
        </button>
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
    zIndex: 9999,
  },
  popup: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "12px",
    textAlign: "left",
    width: "380px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
  },
  title: {
    marginBottom: "16px",
    fontSize: "20px",
    fontWeight: "600",
    textAlign: "center",
    color: "#000",
  },
  detailsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  },
  label: {
    fontWeight: "600",
    color: "#555",
  },
  value: {
    color: "#000",   // 👈 force black
    fontWeight: "500",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },
  acceptBtn: {
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    flex: 1,
    marginRight: "8px",
  },
  rejectBtn: {
    backgroundColor: "#f44336",
    color: "white",
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    flex: 1,
  },
};