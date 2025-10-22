import { Socket } from "socket.io-client";
// import {useNot}

export const registerOrderListeners = (socket: Socket) => {
  socket.on("newOrder", (orderData) => {
    console.log("📩 Received new order:", orderData);
    // You can dispatch redux action or show notification here
  });

  socket.on("orderUpdated", (order) => {
    console.log("📦 Order status updated:", order);
  });
};
