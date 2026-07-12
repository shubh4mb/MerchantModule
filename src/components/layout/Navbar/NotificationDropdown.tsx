import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Info, Box, Truck } from "lucide-react";
import axiosInstance from "../../../utils/axiosInstance";

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get("/merchant/notifications");
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axiosInstance.patch(`/merchant/notifications/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new_order_placed":
        return <Box size={16} className="text-blue-500" />;
      case "return_requested":
        return <Truck size={16} className="text-orange-500" />;
      case "admin_notification":
      default:
        return <Info size={16} className="text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center relative"
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "var(--color-sidebar-text)",
          cursor: "pointer",
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-full)",
          transition: "all var(--transition-fast)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--color-sidebar-hover)";
          e.currentTarget.style.color = "var(--color-sidebar-active)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--color-sidebar-text)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 flex items-center justify-center text-white"
            style={{
              background: "#ef4444",
              fontSize: "10px",
              fontWeight: "bold",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              transform: "translate(25%, -25%)",
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 rounded-lg shadow-lg overflow-hidden flex flex-col"
          style={{
            width: "320px",
            maxHeight: "400px",
            background: "var(--color-sidebar)",
            border: "1px solid rgba(255,255,255,0.1)",
            zIndex: 1200,
          }}
        >
          <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <h3 className="font-semibold" style={{ color: "var(--color-sidebar-text)" }}>Notifications</h3>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                No notifications found.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className="p-3 border-b flex gap-3 cursor-pointer hover:bg-opacity-5 hover:bg-white transition-colors"
                  style={{
                    borderColor: "rgba(255,255,255,0.05)",
                    background: notif.read ? "transparent" : "rgba(59, 130, 246, 0.05)",
                  }}
                  onClick={() => !notif.read && markAsRead(notif._id)}
                >
                  <div className="mt-1">{getIcon(notif.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4
                        className="text-sm font-medium"
                        style={{ color: notif.read ? "var(--color-sidebar-text)" : "#fff" }}
                      >
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {notif.body}
                    </p>
                    <span
                      className="text-xs mt-2 block"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
