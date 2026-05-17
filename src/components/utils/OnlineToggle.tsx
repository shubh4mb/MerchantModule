import React, { useState, useEffect } from "react";
import { connectSocket, disconnectSocket } from "../../utils/socket";
import { toggleMerchantOnlineStatus } from "../../api/auth";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (online) {
      connectSocket(merchantId);
    } else {
      disconnectSocket();
    }
  }, [online, merchantId]);

  const handleToggle = () => {
    // User clicked toggle → ask for confirmation
    const next = !online;
    setPendingStatus(next);
    setShowConfirm(true);
  };

  const confirmToggle = async () => {
    if (pendingStatus !== null) {
      setLoading(true);
      try {
        await toggleMerchantOnlineStatus(merchantId, pendingStatus);
        setOnline(pendingStatus);
        localStorage.setItem("onlineStatus", String(pendingStatus));
        setShowConfirm(false);
      } catch (err) {
        console.error("Failed to sync online status:", err);
        alert("Failed to update online status. Please try again.");
      } finally {
        setLoading(false);
      }
    }
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
          relative w-24 h-10 flex items-center rounded-full !px-1
          transition-all duration-300 ease-in-out outline-none border-none
          ${online 
            ? "bg-green-400 shadow-[0_2px_8px_rgba(74,222,128,0.3)]" 
            : "bg-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
          }
        `}
      >
        <span
          className={`
            absolute text-[10px] font-semibold text-white transition-all
            ${online ? "left-2" : "left-10"}
          `}
        >
          {online ? "ONLINE" : "OFFLINE"}
        </span>

        <div
          className={`
            absolute w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center 
            transition-transform duration-300
            ${online ? "translate-x-[63px]" : "translate-x-0"}
          `}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${online ? "bg-green-500" : "bg-gray-400"}`}
          />
        </div>
      </button>

      {/* ●●● MODAL ●●● */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center">
          <div className="bg-white rounded-2xl !p-6 w-80 shadow-xl text-center">
            <h2 className="text-lg font-semibold !mb-2">Confirm Status Change</h2>

            <p className="text-gray-600 !mb-5">
              Switch to{" "}
              <span className="font-bold">
                {pendingStatus ? "ONLINE" : "OFFLINE"}?
              </span>
            </p>

            <div className="flex justify-between gap-3">
              <button
                onClick={cancelToggle}
                className="flex-1 !py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={confirmToggle}
                disabled={loading}
                className={`flex-1 !py-2 rounded-lg text-white transition-opacity ${
                  loading ? "bg-blue-400 cursor-not-allowed opacity-70" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OnlineToggle;
