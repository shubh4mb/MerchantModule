import { io, Socket } from "socket.io-client";
import mitt , {type Emitter} from "mitt";
import type {Order} from '../context/NotificationContext';

let socket: Socket | null = null;

// Define the events
type Events = {
  newOrder: Order;
  orderUpdate: Order;
};

// Typed emitter
export const emitter: Emitter<Events> = mitt<Events>();

export const connectSocket = (merchantId: string) => {
 
  const role ="merchant";
  // socket = io("http://192.168.0.106:5000", {
  //   transports: ["websocket"],
  //   query: { merchantId, role }, // pass merchantId for backend mapping
  // });
  socket = io("http://192.168.0.102:5000", {
    transports: ["websocket"],
    query: { merchantId, role }, // pass merchantId for backend mapping
  });

  socket.on("connect", () => {
    console.log("✅ Connected to socket:", socket?.id);
    console.log("✅ Emitting registerMerchant event", merchantId);
    socket?.emit("registerMerchant", merchantId);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from socket");
  });

    // 🔹 Listen for order updates globally
    socket.on("orderUpdate", (order) => {
      console.log("📦 Order update received:", order);
      emitter.emit("orderUpdate", order); // re-emit for components
    });

    socket.on("newOrder", (orderData) => {
      console.log("📩 Received new order:", orderData);
      emitter.emit("newOrder", orderData);
      // You can dispatch redux action or show notification here
    });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
