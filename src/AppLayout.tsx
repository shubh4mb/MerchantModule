import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar/Navbar";

export default function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar at the top */}
      <Navbar
        sidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setSidebarOpen(!isSidebarOpen)}
        onLogout={() => {}}
      />

      {/* Sidebar + Main Content layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`transition-all duration-300 ${
            isSidebarOpen ? "w-64" : "w-16"
          } bg-gray-800 text-white`}
        >
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={setSidebarOpen}
            onLogout={() => {}}
          />
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6 transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
