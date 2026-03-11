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
            ? "bg-green-500 shadow-[0_2px_12px_rgba(34,197,94,0.4)]" 
            : "bg-white/10 shadow-glass border border-white/10"
          }
        `}
      >
        <span
          className={`
            absolute text-[10px] font-bold transition-all
            ${online ? "left-2 text-white" : "left-10 text-white/40"}
          `}
        >
          {online ? "ONLINE" : "OFFLINE"}
        </span>

        <div
          className={`
            absolute w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center 
            transition-transform duration-300
            ${online ? "translate-x-[54px]" : "translate-x-0"}
          `}
        >
          <div
            className={`w-2 h-2 rounded-full ${online ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
          />
        </div>
      </button>

      {/* ●●● MODAL ●●● */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center animate-fade-in">
          <div className="bg-glass backdrop-blur-xl rounded-2xl p-8 w-[320px] shadow-glass border border-glass-border text-center animate-form-in">
            <h2 className="text-xl font-bold text-white mb-3">Confirmation</h2>

            <p className="text-white/70 mb-8 leading-relaxed">
              Switch store status to{" "}
              <span className={`font-bold ${pendingStatus ? "text-green-400" : "text-red-400"}`}>
                {pendingStatus ? "ONLINE" : "OFFLINE"}
              </span>?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={confirmToggle}
                className="w-full py-3.5 rounded-xl font-bold bg-primary-gradient text-white shadow-xl hover:scale-[1.02] transition-all"
              >
                Confirm Switch
              </button>
              
              <button
                onClick={cancelToggle}
                className="w-full py-3.5 rounded-xl font-semibold bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OnlineToggle;
