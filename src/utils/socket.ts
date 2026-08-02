import { io, Socket } from "socket.io-client";
import mitt, { type Emitter } from "mitt";
import type { Order } from "../context/NotificationContext";

let socket: Socket | null = null;
let isConnected = false;

// Define the events
type Events = {
  newOrder: Order;
  orderUpdate: Order;
  newWarehouseOrder: Order;
  warehouseOrderUpdate: Order;
};

// Typed emitter
export const emitter: Emitter<Events> = mitt<Events>();

interface ConnectSocketOptions {
  id: string; // merchantId or warehouseId (depending on accountType)
  accountType?: 'merchant' | 'warehouse';
  warehouseId?: string;
}

export const connectSocket = (merchantId: string, options?: Omit<ConnectSocketOptions, 'id'>) => {
  const accountType = options?.accountType || 'merchant';
  const isWarehouse = accountType === 'warehouse';
  const role = isWarehouse ? 'warehouse' : 'merchant';

  // ✅ Prevent duplicate connection
  if (isConnected && socket) {
    console.log("⚡ Socket already connected:", socket.id);
    return socket;
  }

  socket = io(import.meta.env.VITE_BACKEND_URL, {
    transports: ["websocket"],
    query: { merchantId, role },
  });

  socket.removeAllListeners("connect");
  socket.on("connect", () => {
    isConnected = true;
    console.log("✅ Connected to socket:", socket?.id);

    if (isWarehouse && options?.warehouseId) {
      console.log("✅ Emitting registerWarehouse event", options.warehouseId);
      socket?.emit("registerWarehouse", options.warehouseId);
    } else {
      console.log("✅ Emitting registerMerchant event", merchantId);
      socket?.emit("registerMerchant", merchantId);
    }
  });

  socket.removeAllListeners("disconnect");
  socket.on("disconnect", () => {
    isConnected = false;
    console.log("❌ Disconnected from socket");
  });

  // 🔹 Clear old listeners before attaching new ones
  socket.removeAllListeners("orderUpdate");
  socket.removeAllListeners("newOrder");
  socket.removeAllListeners("newWarehouseOrder");
  socket.removeAllListeners("warehouseOrderUpdate");

  if (isWarehouse) {
    // Warehouse-specific socket events
    socket.on("newWarehouseOrder", (orderData: Order) => {
      console.log("📩 Received new warehouse order:", orderData);
      emitter.emit("newWarehouseOrder", orderData);
    });

    socket.on("warehouseOrderUpdate", (order: Order) => {
      console.log("📦 Warehouse order update received:", order);
      emitter.emit("warehouseOrderUpdate", order);
    });
  } else {
    // Merchant-specific socket events
    socket.on("orderUpdate", (order: Order) => {
      console.log("📦 Order update received:", order);
      emitter.emit("orderUpdate", order);
    });

    socket.on("newOrder", (orderData: Order) => {
      console.log("📩 Received new order:", orderData);
      emitter.emit("newOrder", orderData);
    });
  }

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

