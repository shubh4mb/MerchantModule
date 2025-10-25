import { io, Socket } from "socket.io-client";
import mitt, { type Emitter } from "mitt";
import type { Order } from "../context/NotificationContext";

let socket: Socket | null = null;
let isConnected = false;

// Define the events
type Events = {
  newOrder: Order;
  orderUpdate: Order;
};

// Typed emitter
export const emitter: Emitter<Events> = mitt<Events>();

export const connectSocket = (merchantId: string) => {
  const role = "merchant";

  // ✅ Prevent duplicate connection
  if (isConnected && socket) {
    console.log("⚡ Socket already connected:", socket.id);
    return socket;
  }

  socket = io(import.meta.env.VITE_BACKEND_URL, {
    transports: ["websocket"],
    query: { merchantId, role },
  });

  socket.on("connect", () => {
    isConnected = true;
    console.log("✅ Connected to socket:", socket?.id);
    console.log("✅ Emitting registerMerchant event", merchantId);
    socket?.emit("registerMerchant", merchantId);
  });

  socket.on("disconnect", () => {
    isConnected = false;
    console.log("❌ Disconnected from socket");
  });

  // 🔹 Clear old listeners before attaching new ones
  socket.removeAllListeners("orderUpdate");
  socket.removeAllListeners("newOrder");

  socket.on("orderUpdate", (order: Order) => {
    console.log("📦 Order update received:", order);
    emitter.emit("orderUpdate", order);
  });

  socket.on("newOrder", (orderData: Order) => {
    console.log("📩 Received new order:", orderData);
    emitter.emit("newOrder", orderData);
  });

  // socket.on('joinOrderRoom')

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    console.log("🔌 Socket disconnected manually");
  }
};

