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
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const isMobile = windowWidth <= MOBILE_BREAKPOINT;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

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
          className="flex-1 overflow-auto transition-all duration-200"
          style={{
            marginLeft: `${mainMargin}px`,
            background: "var(--color-bg)",
            paddingBottom: isMobile ? "70px" : "0",
          }}
        >
          <Outlet context={{ isSidebarOpen, isMobile }} />
        </main>
      </div>
    </div>
  );
}