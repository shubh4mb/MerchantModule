import React, { useState } from "react";
import OnlineToggle from "../utils/OnlineToggle";

interface NavbarProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, onSidebarToggle }) => {
  const [_dropdownOpen, setDropdownOpen] = useState(false);
  const merchantId = localStorage.getItem("merchant_id");
  return (
    <header className="h-16 bg-black text-white flex items-center justify-between px-6 sticky top-0 z-[1100] border-b border-gray-800 shadow-lg">
      {/* Sidebar toggle button */}
      <button
        onClick={onSidebarToggle}
        className="bg-transparent border-none text-white text-2xl cursor-pointer hover:text-gray-300 transition-colors flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-800"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Online/Offline Toggle */}
      <div className="flex items-center gap-4">
        {typeof merchantId === "string" ? <OnlineToggle merchantId={merchantId} /> : null}
      </div>

      {/* Profile dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="bg-transparent border-none text-white cursor-pointer font-semibold hover:text-gray-300 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          <span>Profile</span>
          <span className="text-xs">⏷</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
