import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar/Navbar";

const MOBILE_BREAKPOINT = 768;

export default function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const isMobile = windowWidth <= MOBILE_BREAKPOINT;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Optional: Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleLogout = () => {
    // your logout logic
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar
        sidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setSidebarOpen(!isSidebarOpen)}
        onLogout={handleLogout}
      />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar (handles desktop + mobile internally) */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={setSidebarOpen}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main
          className={`
            flex-1 overflow-auto bg-gray-50 transition-all duration-300
            ${!isMobile && isSidebarOpen ? "!ml-60" : isMobile ? "!p-0 !mb-20" : "!pl-20"}
          `}

        >
          <div className="!p-1 !pt-0">
            <Outlet context={{ isSidebarOpen, isMobile }} />
          </div>
        </main>
      </div>
    </div>
  );
}