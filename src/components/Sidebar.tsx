import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  onLogout: () => void;
}

const NAVBAR_HEIGHT = 64;

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onLogout }) => {
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { path: "products", label: "Products", icon: "📦" },
    { path: "orders", label: "Orders", icon: "📋" },
    { path: "accounts", label: "Accounts", icon: "👥" },
  ];

  return (
    <>
      <aside
        className={`fixed left-0 z-[1000] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out overflow-hidden backdrop-blur-md
          ${isOpen
            ? isMobile
              ? "w-screen shadow-2xl"
              : "w-80 shadow-xl"
            : "w-[80px] shadow-lg"}`}
        style={{
          top: `${NAVBAR_HEIGHT}px`,
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        }}
      >
        <nav className="flex-1 py-5 px-3! py-2! flex flex-col gap-2.5">
          {navItems.map((item) => {
            const active = location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={`/merchant/${item.path}`}
                style={{
                  padding: isOpen ? "12px 16px" : "12px 8px", // Inline override ensures no unwanted padding
                }}
                className={`
                  flex items-center rounded-xl font-medium transition-all duration-300 ease-in-out
                  ${isOpen ? "!px-4 !py-3 " : "!px-2 !py-3 justify-center"}
                  ${isMobile ? "text-lg" : "text-base"}
                  ${
                    active
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

      {isMobile && isOpen && (
        <div
          className="fixed left-0 w-screen bg-black/50 z-[999] backdrop-blur-sm"
          style={{
            top: `${NAVBAR_HEIGHT}px`,
            height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          }}
          onClick={() => onToggle(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
