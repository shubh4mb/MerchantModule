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

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);

  useEffect(() => {
    if (online) {
      connectSocket(merchantId);
    } else {
      disconnectSocket();
    }

    const handleSync = () => {
      setOnline(localStorage.getItem("onlineStatus") === "true");
    };
    window.addEventListener("onlineStatusChanged", handleSync);
    return () => window.removeEventListener("onlineStatusChanged", handleSync);
  }, [online, merchantId]);

  const handleToggle = () => {
    // User clicked toggle → ask for confirmation
    const next = !online;
    setPendingStatus(next);
    setShowConfirm(true);
  };

  const confirmToggle = () => {
    if (pendingStatus !== null) {
      setOnline(pendingStatus);
      localStorage.setItem("onlineStatus", String(pendingStatus));
      window.dispatchEvent(new Event("onlineStatusChanged"));
    }
    setShowConfirm(false);
  };

  const cancelToggle = () => {
    setPendingStatus(null);
    setShowConfirm(false);
  };

  return (
    <>
      {/* ●●● MAIN TOGGLE ●●● */}
      <button
        onClick={handleToggle}
        aria-label={online ? "Go offline" : "Go online"}
        role="switch"
        aria-checked={online}
        className={`
          relative w-24 h-10 flex items-center rounded-full px-1
          transition-all duration-300 ease-in-out outline-none border-none
          ${online 
            ? "bg-green-500 shadow-[0_4px_15px_rgba(34,197,94,0.3)]" 
            : "bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/5"
          }
        `}
      >
        <span
          className={`
            absolute top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest transition-all duration-300
            ${online ? "left-3 text-white" : "left-10 text-gray-400 dark:text-white/40"}
          `}
        >
          {online ? "ON" : "OFF"}
        </span>

        <div
          className={`
            absolute top-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center 
            transition-transform duration-300
            ${online ? "translate-x-[54px]" : "translate-x-0"}
          `}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${online ? "bg-green-500 animate-pulse" : "bg-gray-300 dark:bg-gray-600"}`}
          />
        </div>
      </button>

      {/* ●●● MODAL ●●● */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center animate-fade-in">
          <div className="bg-white/90 dark:bg-[#111111]/90 backdrop-blur-2xl rounded-[2.5rem] p-10 w-[380px] shadow-2xl border border-gray-100 dark:border-white/5 text-center animate-form-in">
            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${pendingStatus ? "bg-green-50 dark:bg-green-500/10 text-green-500" : "bg-red-50 dark:bg-red-500/10 text-red-500"}`}>
               {pendingStatus ? <div className="w-4 h-4 rounded-full bg-current animate-pulse" /> : <div className="w-4 h-4 rounded-full bg-current" />}
            </div>

            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Security Hash</h2>
            
            <p className="text-gray-500 dark:text-white/40 text-sm font-bold uppercase tracking-widest mb-10 italic">
              Acknowledge transition to{" "}
              <span className={`not-italic ${pendingStatus ? "text-green-500" : "text-red-500"}`}>
                {pendingStatus ? "Online" : "Offline"}
              </span> Repository?
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={confirmToggle}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-[0.98] ${pendingStatus ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-red-500 text-white shadow-lg shadow-red-500/20"}`}
              >
                Confirm Protocol
              </button>
              
              <button
                onClick={cancelToggle}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-all"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OnlineToggle;
