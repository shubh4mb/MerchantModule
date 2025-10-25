import React, { useState, useEffect } from "react";
import { connectSocket, disconnectSocket } from "../../utils/socket";

interface OnlineToggleProps {
  merchantId: string;
}

const OnlineToggle: React.FC<OnlineToggleProps> = ({ merchantId }) => {
  const [online, setOnline] = useState<boolean>(() => {
    const stored = localStorage.getItem("onlineStatus");
    return stored === "true";
  });

  useEffect(() => {
    if (online) {
      connectSocket(merchantId);
    } else {
      disconnectSocket();
    }
  }, [online, merchantId]);

  const handleToggle = () => {
    setOnline((prev) => {
      const newStatus = !prev;
      localStorage.setItem("onlineStatus", String(newStatus));
      return newStatus;
    });
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={online ? "Go offline" : "Go online"}
      role="switch"
      aria-checked={online}
      className={`
        relative w-24 h-10 flex items-center rounded-full px-1
        transition-all duration-300 ease-in-out outline-none border-none
        ${online 
          ? "bg-green-400 shadow-[0_2px_8px_rgba(74,222,128,0.3)]" 
          : "bg-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
        }
      `}
    >
      <span
        className={`
          absolute text-[10px] font-semibold text-white transition-all duration-300 select-none
          ${online ? "left-2 opacity-90" : "left-10 opacity-90"}
        `}
      >
        {online ? "ONLINE" : "OFFLINE"}
      </span>

      <div
        className={`
          absolute w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center 
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${online ? "translate-x-[63px]" : "translate-x-0"}
        `}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full ${online ? "bg-green-500" : "bg-gray-400"}`}
        />
      </div>
    </button>
  );
};

export default OnlineToggle;
