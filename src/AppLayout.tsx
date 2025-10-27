import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar/Navbar";

export default function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar
        sidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setSidebarOpen(!isSidebarOpen)}
        onLogout={() => {}}
      />

      {/* Sidebar + Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`transition-all duration-300 bg-gray-800 text-white ${
            isSidebarOpen ? "w-60" : "w-16"
          }`}
        >
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={setSidebarOpen}
            onLogout={() => {}}
          />
        </div>

        {/* Main Content */}
        <main
          className={`flex-1 overflow-auto bg-gray-50 p-6 transition-all duration-300 ${
            isSidebarOpen ? "ml-0" : "ml-0"
          }`}
        >
          {/* Pass sidebar state to children */}
          <Outlet context={{ isSidebarOpen }} />
        </main>
      </div>
    </div>
  );
}
