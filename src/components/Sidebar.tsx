import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  onLogout: () => void;
}

const NAVBAR_HEIGHT = 64; // keep in sync with Navbar height

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onLogout }) => {
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sidebar aligned under Navbar
  const sidebarStyle: React.CSSProperties = {
    position: "fixed",
    top: `${NAVBAR_HEIGHT}px`,
    left: 0,
    height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
    width: isOpen ? (isMobile ? "100vw" : "280px") : "70px",
    background: "linear-gradient(135deg, #1e1e2e 0%, #2a2d47 50%, #1a1d35 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.3s ease",
    zIndex: 1000,
    overflow: "hidden",
    boxShadow: isOpen ? "8px 0 32px rgba(0,0,0,0.2)" : "4px 0 16px rgba(0,0,0,0.15)",
    backdropFilter: "blur(10px)",
  };

  const navStyle: React.CSSProperties = {
    flex: 1,
    padding: "1rem 0",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  };

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    padding: isOpen ? "0.875rem 1rem" : "0.875rem 0.5rem",
    color: active ? "#fff" : "rgba(255,255,255,0.85)",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: isMobile ? "0.85rem" : "0.9rem",
    borderRadius: "14px",
    marginBottom: "0.5rem",
    justifyContent: isOpen ? "flex-start" : "center",
    background: active
      ? "linear-gradient(135deg, rgba(255,107,107,0.2), rgba(78,205,196,0.2))"
      : "transparent",
    transition: "all 0.3s ease",
  });

  const navItems = [
    { path: "products", label: "Products", icon: "📦" },
    { path: "orders", label: "Orders", icon: "📋" },
    { path: "accounts", label: "Accounts", icon: "👥" },
  ];

  return (
    <>
      <div style={sidebarStyle}>
        <nav style={navStyle}>
          {navItems.map((item) => {
            const active = location.pathname.includes(item.path);
            return (
              <Link key={item.path} to={`/merchant/${item.path}`} style={navLinkStyle(active)}>
                <span style={{ marginRight: isOpen ? "0.75rem" : "0" }}>{item.icon}</span>
                {isOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile overlay (starts below Navbar) */}
      {isMobile && isOpen && (
        <div
          style={{
            position: "fixed",
            top: `${NAVBAR_HEIGHT}px`,
            left: 0,
            width: "100vw",
            height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
          onClick={() => onToggle(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
