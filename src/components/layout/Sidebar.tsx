import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  LogOut,
  Banknote,
  Truck,
  LayoutDashboard,
  Tag,
  Briefcase,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  onLogout: () => void;
}

const NAVBAR_HEIGHT = 56;
const MOBILE_BREAKPOINT = 768;
const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 220;

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onLogout }) => {
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= MOBILE_BREAKPOINT;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { path: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "inventory", label: "Inventory", icon: Package },
    { path: "orders", label: "Orders", icon: ShoppingBag },
    { path: "courier-orders", label: "Courier", icon: Truck },
    { path: "revenue", label: "Revenue", icon: Banknote },
    { path: "offers", label: "Offers", icon: Tag },
    { path: "zip-covers", label: "Zip Covers", icon: Briefcase },
  ];

  const DesktopSidebar = () => (
    <aside
      className="fixed left-0 flex flex-col transition-all duration-200 ease-in-out overflow-hidden"
      style={{
        top: `${NAVBAR_HEIGHT}px`,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        width: isOpen ? `${EXPANDED_WIDTH}px` : `${COLLAPSED_WIDTH}px`,
        background: "var(--color-sidebar)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        zIndex: 1000,
      }}
    >
      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "var(--space-3) var(--space-2)" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={`/merchant/${item.path}`}
                  className="group relative flex items-center transition-all duration-150"
                  style={{
                    height: "40px",
                    borderRadius: "var(--radius-md)",
                    textDecoration: "none",
                    padding: `0 ${isOpen ? "var(--space-3)" : "0"}`,
                    background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    color: isActive ? "var(--color-sidebar-active)" : "var(--color-sidebar-text)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "var(--color-sidebar-active)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--color-sidebar-text)";
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "8px",
                        bottom: "8px",
                        width: "3px",
                        borderRadius: "0 2px 2px 0",
                        background: "var(--color-sidebar-active)",
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className="flex items-center justify-center"
                    style={{ width: isOpen ? "32px" : "100%", height: "100%", flexShrink: 0 }}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </div>

                  {/* Label */}
                  {isOpen && (
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: isActive ? 600 : 400,
                        marginLeft: "var(--space-2)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip when collapsed */}
                  {!isOpen && (
                    <div
                      className="absolute opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150"
                      style={{
                        left: "calc(100% + 8px)",
                        top: "50%",
                        transform: "translateY(-50%)",
                        padding: "4px 10px",
                        background: "var(--color-text)",
                        color: "var(--color-text-inverse)",
                        fontSize: "var(--text-xs)",
                        fontWeight: 500,
                        borderRadius: "var(--radius-sm)",
                        whiteSpace: "nowrap",
                        zIndex: 50,
                        boxShadow: "var(--shadow-md)",
                      }}
                    >
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      {isOpen && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "var(--space-3) var(--space-2)",
          }}
        >
          <button
            onClick={onLogout}
            className="flex items-center w-full transition-all duration-150"
            style={{
              height: "40px",
              padding: "0 var(--space-3)",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              border: "none",
              color: "var(--color-danger)",
              cursor: "pointer",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              fontFamily: "var(--font-family)",
              gap: "var(--space-2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(220,38,38,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );

  const MobileTabBar = () => (
    <div
      className="fixed bottom-0 left-0 right-0"
      style={{
        height: "60px",
        background: "var(--color-sidebar)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        zIndex: 1000,
      }}
    >
      <div className="flex justify-around items-center h-full" style={{ padding: "0 var(--space-2)" }}>
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.includes(item.path);

          return (
            <Link
              key={item.path}
              to={`/merchant/${item.path}`}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              style={{
                textDecoration: "none",
                color: isActive ? "var(--color-sidebar-active)" : "var(--color-sidebar-text)",
                transition: "color var(--transition-fast)",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 400,
                  marginTop: "2px",
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    width: "24px",
                    height: "2px",
                    borderRadius: "0 0 2px 2px",
                    background: "white",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  const MobileDrawer = () => (
    <div
      className="fixed inset-0 transition-opacity duration-200"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1200,
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
      }}
      onClick={() => onToggle(false)}
    >
      <aside
        className="flex flex-col transition-transform duration-200 ease-in-out overflow-hidden"
        style={{
          width: `${EXPANDED_WIDTH}px`,
          height: "100%",
          background: "var(--color-sidebar)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{ height: `${NAVBAR_HEIGHT}px`, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 var(--space-4)" }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: "var(--text-base)" }}>Menu</span>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: "var(--space-3) var(--space-2)", overflowY: "auto" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.includes(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={`/merchant/${item.path}`}
                    onClick={() => onToggle(false)}
                    className="flex items-center transition-all duration-150"
                    style={{
                      height: "40px",
                      borderRadius: "var(--radius-md)",
                      textDecoration: "none",
                      padding: "0 var(--space-3)",
                      background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                      color: isActive ? "var(--color-sidebar-active)" : "var(--color-sidebar-text)",
                    }}
                  >
                    <div style={{ width: "32px", flexShrink: 0, display: "flex", alignItems: "center" }}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: isActive ? 600 : 400 }}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "var(--space-3) var(--space-2)" }}>
          <button
            onClick={onLogout}
            className="flex items-center w-full transition-all duration-150"
            style={{
              height: "40px",
              padding: "0 var(--space-3)",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              border: "none",
              color: "var(--color-danger)",
              cursor: "pointer",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              gap: "var(--space-2)",
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </div>
  );

  return (
    <>
      {!isMobile && <DesktopSidebar />}
      {isMobile && (
        <>
          <MobileTabBar />
          <MobileDrawer />
        </>
      )}
    </>
  );
};

export default Sidebar;