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
  socket.removeAllListeners("orderCancelled");
  socket.removeAllListeners("newOrder");
  socket.removeAllListeners("newWarehouseOrder");
  socket.removeAllListeners("warehouseOrderUpdate");

  // Handle incoming order updates
  const handleOrderUpdate = (data: any) => {
    const order = data?.order || data;
    console.log("📦 Order update received:", order);
    emitter.emit("orderUpdate", order);
    emitter.emit("warehouseOrderUpdate", order);
  };

  // Handle cancelled orders
  const handleOrderCancelled = (data: any) => {
    console.log("🛑 Order cancelled received:", data);
    const order = data?.order || data;
    emitter.emit("orderCancelled", data);
    emitter.emit("orderUpdate", {
      ...order,
      orderStatus: "cancelled",
      reason: data?.reason || order?.reason,
      cancelledBy: data?.cancelledBy || order?.cancelledBy,
    });
    emitter.emit("warehouseOrderUpdate", {
      ...order,
      orderStatus: "cancelled",
      reason: data?.reason || order?.reason,
      cancelledBy: data?.cancelledBy || order?.cancelledBy,
    });
  };

  // Handle incoming new orders
  const handleNewOrder = (data: any) => {
    const orderData = data?.order || data;
    console.log("📩 Received new order:", orderData);
    emitter.emit("newOrder", orderData);
    emitter.emit("newWarehouseOrder", orderData);
  };

  socket.on("orderUpdate", handleOrderUpdate);
  socket.on("orderCancelled", handleOrderCancelled);
  socket.on("warehouseOrderUpdate", handleOrderUpdate);
  socket.on("newOrder", handleNewOrder);
  socket.on("newWarehouseOrder", handleNewOrder);

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

