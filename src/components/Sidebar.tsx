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
      className="fixed left-0 top-0 z-[1000] flex flex-col bg-white dark:bg-[#0a0a0a] border-r border-gray-100 dark:border-white/5 transition-all duration-300 ease-in-out overflow-hidden"
      style={{
        top: `${NAVBAR_HEIGHT}px`,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        width: isOpen ? `${EXPANDED_WIDTH}px` : `${COLLAPSED_WIDTH}px`,
      }}
    >
      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={`/merchant/${item.path}`}
                  className={`
                    group relative flex items-center h-12 rounded-xl transition-all duration-300
                    ${isActive
                      ? "bg-gray-900 dark:bg-white text-white dark:text-black shadow-xl shadow-black/10 dark:shadow-white/5 scale-[1.02]"
                      : "text-gray-400 dark:text-white/40 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                    }
                  `}
                >
                  {/* Centered Icon Container */}
                  <div className={`flex items-center justify-center h-full ${isOpen ? "w-15" : "w-full"}`}>
                    <Icon
                      className={`w-5 h-5 transition-all duration-300 ${isActive
                        ? "scale-110"
                        : "group-hover:scale-110"
                        }`}
                    />
                  </div>

                  {/* Label - fades in/out */}
                  {isOpen && (
                    <span
                      className="text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 
                        opacity-100 translate-x-0 ml-1"
                    >
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip when collapsed */}
                  {!isOpen && (
                    <div className="absolute left-full ml-4 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap pointer-events-none z-50 shadow-2xl border border-white/10">
                      {item.label}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-2 h-2 bg-gray-900 dark:bg-white rotate-45"></div>
                    </div>
                  )}

                  {/* Active bar */}
                  {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-white dark:bg-black rounded-full ml-1"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="border-t border-gray-100 dark:border-white/5 p-4">
        <button
          onClick={onLogout}
          className={`
            w-full flex items-center h-12 rounded-xl transition-all duration-300 group
            ${isOpen ? "px-4 gap-4" : "justify-center"}
            text-red-500/60 dark:text-red-400/60 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400
          `}
        >
          <div className="flex items-center justify-center">
            <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          </div>
          {isOpen && <span className="text-xs font-black uppercase tracking-[0.15em]">System Exit</span>}
        </button>
      </div>
    </aside>
  );

  // Mobile remains light theme (standard practice)
  const MobileTabBar = () => (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1000] bg-white/80 dark:bg-black/80 border-t border-gray-100 dark:border-white/5 backdrop-blur-xl shadow-2xl transition-all duration-300"
      style={{ height: "70px" }}
    >
      <div className="flex justify-around items-center h-full px-4">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.includes(item.path);

          return (
            <Link
              key={item.path}
              to={`/merchant/${item.path}`}
              className="flex flex-col items-center justify-center flex-1 h-full relative group"
            >
              {/* Icon */}
              <Icon
                className={`w-6 h-6 transition-all duration-300 ${isActive
                  ? "text-gray-900 dark:text-white scale-110"
                  : "text-gray-400 dark:text-white/20 hover:text-gray-900 dark:hover:text-white"
                  }`}
              />

              {/* Label */}
              <span
                className={`text-[8px] mt-1 font-black uppercase tracking-widest transition-all duration-300 ${isActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-white/20"
                  }`}
              >
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute bottom-0 h-1 w-12 bg-gray-900 dark:bg-white rounded-t-full" />
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