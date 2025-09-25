import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar/Navbar";

const AppLayout: React.FC = () => {
  const { token, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  // const sidebarWidth = sidebarOpen ? (isMobile ? 240 : 280) : 7

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={(isOpen) => setSidebarOpen(isOpen)}
        onLogout={logout}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
          onLogout={logout}
        />
        {/* <main style={mainContentStyle}> */}
          <Outlet />
        {/* </main> */}
      </div>
    </div>
  );
};

export default AppLayout;
