import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar/Navbar";
import { useAuth } from "../../context/AuthContext";

const MOBILE_BREAKPOINT = 768;
const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 220;

export default function AppLayout() {
  const { logout } = useAuth();
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  const isMobile = windowWidth <= MOBILE_BREAKPOINT;
  const [isSidebarOpen, setSidebarOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth > MOBILE_BREAKPOINT : true));

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width <= MOBILE_BREAKPOINT) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const mainMargin = isMobile ? 0 : isSidebarOpen ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Navbar */}
      <Navbar
        sidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={setSidebarOpen}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden transition-all duration-200"
          style={{
            marginLeft: `${mainMargin}px`,
            background: "var(--color-bg)",
            paddingBottom: isMobile ? "76px" : "0",
          }}
        >
          <Outlet context={{ isSidebarOpen, isMobile }} />
        </main>
      </div>
    </div>
  );
}