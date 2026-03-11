import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  LogOut,
  Settings,
  BarChart3,
  Banknote,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  onLogout: () => void;
}

const NAVBAR_HEIGHT = 64;
const MOBILE_BREAKPOINT = 768;
const COLLAPSED_WIDTH = 80;
const EXPANDED_WIDTH = 250;

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onLogout }) => {
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= MOBILE_BREAKPOINT;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { path: "orders", label: "Orders", icon: ShoppingBag },
    { path: "inventory", label: "Inventory", icon: Package },
    { path: "revenue", label: "Revenue", icon: Banknote },
    { path: "analytics", label: "Analytics", icon: BarChart3 },
    { path: "settings", label: "Settings", icon: Settings },
  ];

  const DesktopSidebar = () => (
    <aside
      className="fixed left-0 top-0 z-[1000] flex flex-col bg-black border-r border-gray-800 transition-all duration-300 ease-in-out overflow-hidden"
      style={{
        top: `${NAVBAR_HEIGHT}px`,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        width: isOpen ? `${EXPANDED_WIDTH}px` : `${COLLAPSED_WIDTH}px`,
      }}
    >
      {/* Navigation Items */}
      <nav className="flex-1 py-2 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={`/merchant/${item.path}`}
                  className={`
                    group relative flex items-center h-12 rounded-xl transition-all duration-200
                    ${isActive
                      ? "bg-gray-800 text-white shadow-lg shadow-black/20"
                      : "text-gray-400 hover:bg-gray-900 hover:text-white"
                    }
                  `}
                >
                  {/* Centered Icon Container */}
                  <div className={`flex items-center justify-center h-full ${isOpen ? "w-15" : "w-full"}`}>
                    <Icon
                      className={`w-5 h-5 transition-all duration-200 ${isActive
                        ? "text-white scale-110"
                        : "text-gray-500 group-hover:text-white group-hover:scale-110"
                        }`}
                    />
                  </div>

                  {/* Label - fades in/out */}
                  {isOpen && (
                    <span
                      className="text-sm font-medium transition-all duration-300 
                        opacity-100 translate-x-0"
                    >
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip when collapsed */}
                  {!isOpen && (
                    <div className="absolute left-full ml-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-gray-700">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-3 h-3 bg-gray-900 rotate-45 border-l border-b border-gray-700"></div>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button - only visible when open */}
      {isOpen && (
        <div className="border-t border-gray-800 p-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 h-12 px-4 text-sm font-medium text-red-400 hover:bg-gray-900 rounded-xl transition-all duration-200 group"
          >
            <div className="flex items-center justify-center w-14">
              <LogOut className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );

  // Mobile remains light theme (standard practice)
  const MobileTabBar = () => (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1000] bg-black border-t border-gray-800 shadow-2xl"
      style={{ height: "70px" }}
    >
      <div className="flex justify-around items-center h-full !px-4">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.includes(item.path);

          return (
            <Link
              key={item.path}
              to={`/merchant/${item.path}`}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              {/* Icon */}
              <Icon
                className={`w-6 h-6 transition-all duration-300 ${isActive
                  ? "text-white scale-110 drop-shadow-lg"
                  : "text-gray-500 hover:text-gray-300 hover:scale-110"
                  }`}
              />

              {/* Label */}
              <span
                className={`text-xs mt-1 font-medium transition-all duration-300 ${isActive ? "text-white" : "text-gray-500"
                  }`}
              >
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute bottom-0 h-1 w-14 bg-white rounded-t-full shadow-lg" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
  return (
    <>
      {!isMobile && <DesktopSidebar />}
      {isMobile && <MobileTabBar />}
    </>
  );
};

export default Sidebar;