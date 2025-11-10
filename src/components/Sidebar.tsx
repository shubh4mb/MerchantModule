import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  onLogout: () => void;
}

const NAVBAR_HEIGHT = 64;
const MOBILE_BREAKPOINT = 768;

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onLogout }) => {
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const isMobile = windowWidth <= MOBILE_BREAKPOINT;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { path: "inventory", label: "Inventory", icon: "📦" },
    // { path: "products", label: "Products", icon: "📦" },
    { path: "orders", label: "Orders", icon: "📋" },
    { path: "bulkupload", label: "Accounts", icon: "👥" },
  ];

  const DesktopSidebar = () => (
    <aside
      className={`
        fixed left-0 z-[1000] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900
        text-white flex flex-col transition-all duration-300 ease-in-out overflow-hidden
        backdrop-blur-md
        ${isOpen ? "w-60 shadow-xl" : "w-[80px] shadow-lg"}
      `}
      style={{
        top: `${NAVBAR_HEIGHT}px`,
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
      }}
    >
      <nav className="flex-1 py-5 px-3 flex flex-col gap-2.5">
        {navItems.map((item) => {
          const active = location.pathname.includes(item.path);
          return (
            <Link
              key={item.path}
              to={`/merchant/${item.path}`}
              className={`
                flex items-center rounded-xl font-medium transition-all duration-300
                ${isOpen ? "px-4 py-3" : "px-2 py-3 justify-center"}
                ${active
                  ? "bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-blue-600/30 text-white shadow-md ring-1 ring-purple-500/40"
                  : "text-white/80 hover:bg-white/10 hover:text-white hover:shadow-sm"
                }
              `}
            >
              <span className={`text-2xl ${isOpen ? "mr-3" : ""}`}>
                {item.icon}
              </span>
              {isOpen && (
                <span className="whitespace-nowrap tracking-wide">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  const MobileTabBar = () => (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1000] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900
                 flex justify-around items-center border-t border-white/10 backdrop-blur-md"
      style={{ height: "68px" }}
    >
      {navItems.map((item) => {
        const active = location.pathname.includes(item.path);
        return (
          <Link
            key={item.path}
            to={`/merchant/${item.path}`}
            className={`
              flex flex-col items-center justify-center flex-1 py-2 transition-all
              ${active ? "text-purple-400" : "text-white/70"}
            `}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs mt-0.5">{item.label}</span>
            {active && (
              <div className="absolute bottom-0 h-0.5 w-10 bg-purple-500 rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      {!isMobile && <DesktopSidebar />}

      {/* Mobile bottom tab bar */}
      {isMobile && <MobileTabBar />}

    </>
  );
};

export default Sidebar;