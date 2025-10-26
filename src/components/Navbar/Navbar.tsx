import React, { useState } from "react";
import OnlineToggle from "../utils/OnlineToggle"; 

interface NavbarProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, onSidebarToggle, onLogout }) => {
  const merchantId = localStorage.getItem("merchant_id"); 
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header
      // Added !px-4 for important padding
      className="h-16 bg-[#1e1e2e] text-white flex items-center justify-between !px-4 shadow-lg sticky top-0 z-[1100]"
    >
      {/* Sidebar toggle button */}
      <button
        onClick={onSidebarToggle}
        className="bg-transparent border-none text-white text-xl cursor-pointer"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Online/Offline Toggle */}
      <div>
        <OnlineToggle merchantId={merchantId} />
      </div>

      {/* Profile dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="bg-transparent border-none text-white cursor-pointer font-semibold"
        >
          Profile ⏷
        </button>

        {dropdownOpen && (
          <div
            // Added !mt-2 for important margin-top
            className="absolute right-0 !mt-2 bg-[#2a2d47] rounded-lg shadow-xl overflow-hidden min-w-[120px]" 
          >
            {/* Settings Button */}
            <button
              // Added !py-3 !px-4 for important padding
              className="block w-full !py-3 !px-4 text-left bg-transparent border-none text-white cursor-pointer hover:bg-[#34385a]" 
            >
              Settings
            </button>
            
            {/* Logout Button */}
            <button
              onClick={onLogout}
              // Added !py-3 !px-4 for important padding
              className="block w-full !py-3 !px-4 text-left bg-transparent border-none text-[#e74c3c] cursor-pointer hover:bg-[#34385a]"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;