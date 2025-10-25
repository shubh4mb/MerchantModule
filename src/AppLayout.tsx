import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar/Navbar";

const AppLayout: React.FC = () => {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={(isOpen) => setSidebarOpen(isOpen)}
        onLogout={logout}
      />

      {/* Main Layout */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "md:pl-64" : "md:pl-20"
        }`}
      >
        {/* Navbar */}
        <Navbar
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen((prev) => !prev)}
          onLogout={logout}
        />

        {/* Main Outlet Area */}
        <main className="flex-1 p-6 pt-24 transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
