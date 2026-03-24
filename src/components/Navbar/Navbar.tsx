import React from "react";
import { useNavigate } from "react-router-dom";
import OnlineToggle from "../utils/OnlineToggle";

interface NavbarProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, onSidebarToggle }) => {
  const navigate = useNavigate();
  const merchantId = localStorage.getItem("merchant_id");
  return (
    <header
      style={{
        height: "64px",
        background: "#000000",
        color: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem",
        boxShadow: "#000000",
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

      <div style={{ position: "relative" }}>
        <button
          onClick={() => navigate('/merchant/profile')}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          My Profile
        </button>
      </div>
    </header>
  );
};

export default Navbar;
