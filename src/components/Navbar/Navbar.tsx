import React, { useState } from "react";
import OnlineToggle from "../utils/OnlineToggle";

interface NavbarProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, onSidebarToggle, onLogout }) => {
  const merchantId = localStorage.getItem("merchant_id");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header
      style={{
        height: "64px",
        background: "#1e1e2e",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        position: "sticky",
        top: 0,
        zIndex: 1100,
      }}
    >
      {/* Sidebar toggle button */}
      <button
        onClick={onSidebarToggle}
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "1.4rem",
          cursor: "pointer",
        }}
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Online/Offline Toggle */}
      <div>
        {typeof merchantId === "string" ? <OnlineToggle merchantId={merchantId} /> : null}
      </div>

      {/* Profile dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Profile ⏷
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              marginTop: "0.5rem",
              background: "#2a2d47",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            <button
              style={{
                display: "block",
                width: "100%",
                padding: "0.75rem 1rem",
                textAlign: "left",
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Settings
            </button>
            <button
              onClick={onLogout}
              style={{
                display: "block",
                width: "100%",
                padding: "0.75rem 1rem",
                textAlign: "left",
                background: "transparent",
                border: "none",
                color: "#e74c3c",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
