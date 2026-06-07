import React from "react";
import { useNavigate } from "react-router-dom";
import OnlineToggle from "../../utils/OnlineToggle";
import { Menu, X, User } from "lucide-react";
import FlashFitsLogo from "../../../assets/fevicon.png";
import { useAuth } from "../../../context/AuthContext";

interface NavbarProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, onSidebarToggle }) => {
  const navigate = useNavigate();
  const { merchant } = useAuth();
  const merchantId = merchant?.id || localStorage.getItem("merchant_id");

  return (
    <header
      className="flex items-center justify-between"
      style={{
        height: "56px",
        background: "var(--color-sidebar)",
        padding: "0 var(--space-4)",
        position: "sticky",
        top: 0,
        zIndex: 1100,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Left: Sidebar toggle & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSidebarToggle}
          className="flex items-center justify-center"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-sidebar-text)",
            cursor: "pointer",
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-md)",
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-sidebar-hover)";
            e.currentTarget.style.color = "var(--color-sidebar-active)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-sidebar-text)";
          }}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Logo */}
        <div 
          className="flex items-center justify-center select-none pointer-events-none"
          style={{
            background: "white",
            padding: "4px 10px",
            borderRadius: "6px"
          }}
        >
          <img 
            src={FlashFitsLogo} 
            alt="FlashFits" 
            style={{ maxHeight: "20px", objectFit: "contain" }} 
          />
        </div>
      </div>

      {/* Center: Online Toggle (Only for Try & Buy merchants) */}
      <div>
        {merchant?.zoneId && typeof merchantId === "string" ? (
          <OnlineToggle merchantId={merchantId} />
        ) : null}
      </div>

      {/* Right: Profile */}
      <button
        onClick={() => navigate("/merchant/profile")}
        className="flex items-center gap-2"
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "var(--color-sidebar-text)",
          cursor: "pointer",
          padding: "6px 14px",
          borderRadius: "var(--radius-full)",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          fontFamily: "var(--font-family)",
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
      >
        <User size={14} />
        <span>Profile</span>
      </button>
    </header>
  );
};

export default Navbar;
