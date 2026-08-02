import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  Phone,
  ChevronDown,
  ChevronUp,
  Loader2,
  Upload,
  X,
  Trash2
} from "lucide-react";
import { 
  fetchAllWarehouseOrders,
  acceptWarehouseOrder,
  rejectWarehouseOrder,
  markWarehouseOrderPacked,
  uploadWarehousePackingPhoto,
} from "../../api/warehouseOrder";
import { emitter } from "../../utils/socket";
import { useLocation } from "react-router-dom";

interface OrderItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
}

interface Order {
  _id: string;
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  orderStatus: string;
  deliveryRiderStatus?: string | null;
  customerDeliveryStatus?: string | null;
  deliveryRiderId?: string | null;
  deliveryRiderDetails?: {
    name: string | null;
    phone: string | null;
  } | null;
  items: OrderItem[];
  otp?: string | null;
  acceptedAt?: number | null;
  packingPhotos?: { url: string; public_id: string; _id: string }[];
}

const WarehouseOrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const location = useLocation();

  // Socket
  useEffect(() => {
    const handleOrderUpdate = (updatedOrder: Partial<Order> & { _id: string }) => {
      setOrders((prev) => {
        const exists = prev.some((order) => order._id === updatedOrder._id);
        if (exists) {
          return prev.map((order) =>
            order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
          );
        } else {
          return [updatedOrder as Order, ...prev];
        }
      });
    };

    emitter.on("warehouseOrderUpdate", handleOrderUpdate);
    emitter.on("newWarehouseOrder", handleOrderUpdate);
    
    return () => {
      emitter.off("warehouseOrderUpdate", handleOrderUpdate);
      emitter.off("newWarehouseOrder", handleOrderUpdate);
    };
  }, []);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await fetchAllWarehouseOrders();
        setOrders(data.orders || []);
      } catch (err) {
        setError("Failed to load warehouse orders");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [location.state?.refresh]);

  const handleAction = async (orderId: string, action: 'accept' | 'reject' | 'pack') => {
    try {
      if (action === 'accept') {
        await acceptWarehouseOrder(orderId);
      } else if (action === 'reject') {
        const reason = window.prompt("Reason for rejection:");
        if (reason === null) return;
        await rejectWarehouseOrder(orderId, reason);
      } else if (action === 'pack') {
        await markWarehouseOrderPacked(orderId);
      }
      
      // Update UI optimistically or let socket handle it
      // Socket will handle it, but we can do a quick visual update if needed
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} order`);
    }
  };

  const [uploadingOrder, setUploadingOrder] = useState<string | null>(null);

  const handlePhotoUpload = async (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploadingOrder(orderId);
    try {
      const formData = new FormData();
      formData.append("photo", e.target.files[0]);
      await uploadWarehousePackingPhoto(orderId, formData);
      alert("Photo uploaded successfully");
      // Trigger a refresh or rely on socket
    } catch (err) {
      alert("Failed to upload photo");
    } finally {
      setUploadingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Warehouse Orders
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Manage Try & Buy warehouse operations</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-secondary)" }}>
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border rounded-xl overflow-hidden shadow-sm"
              style={{
                background: "var(--color-card)",
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              {/* Header */}
              <div
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                onClick={() => toggleExpand(order._id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-full ${
                      order.orderStatus === "placed"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : order.orderStatus === "accepted"
                        ? "bg-blue-500/20 text-blue-500"
                        : order.orderStatus === "packed"
                        ? "bg-purple-500/20 text-purple-500"
                        : order.orderStatus === "completed"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {order.orderStatus === "placed" ? <Clock /> : <Package />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: "var(--color-text-primary)" }}>
                      Order #{order._id.slice(-6).toUpperCase()}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm uppercase font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                      Status
                    </p>
                    <p className="font-bold capitalize" style={{ color: "var(--color-text-primary)" }}>
                      {order.orderStatus.replace(/_/g, " ")}
                    </p>
                  </div>
                  {expandedOrders[order._id] ? (
                    <ChevronUp className="text-gray-400" />
                  ) : (
                    <ChevronDown className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedOrders[order._id] && (
                <div
                  className="p-4 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.1)" }}
                >
                  {/* Items List */}
                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Items</h4>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {item.name}
                          </p>
                          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            Size: {item.size} | Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Rider Info */}
                  {order.deliveryRiderId && order.deliveryRiderDetails?.name && (
                    <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-3">
                        <Truck className="text-blue-500" />
                        <div>
                          <p className="font-semibold text-blue-500">Rider Assigned</p>
                          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            {order.deliveryRiderDetails.name} • {order.deliveryRiderDetails.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    {order.orderStatus === "placed" && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(order._id, 'accept'); }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Accept Order
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(order._id, 'reject'); }}
                          className="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg font-medium transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {order.orderStatus === "accepted" && (
                      <>
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                            <Upload size={16} />
                            {uploadingOrder === order._id ? "Uploading..." : "Upload Packing Photo"}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(order._id, e)} disabled={uploadingOrder === order._id} />
                          </label>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(order._id, 'pack'); }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Mark as Packed
                        </button>
                      </>
                    )}

                    {order.orderStatus === "packed" && order.otp && (
                      <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <span style={{ color: "var(--color-text-secondary)" }}>Rider OTP:</span>
                        <span className="text-xl font-mono font-bold tracking-widest text-green-500">
                          {order.otp}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WarehouseOrderManagement;
