import React, { useState, useEffect } from "react";
import { connectSocket, disconnectSocket } from "../../utils/socket";
import { toggleMerchantOnlineStatus } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

interface OnlineToggleProps {
  merchantId: string;
}

const OnlineToggle: React.FC<OnlineToggleProps> = ({ merchantId }) => {
  const { merchant } = useAuth();
  const [online, setOnline] = useState<boolean>(() => {
    const stored = localStorage.getItem("onlineStatus");
    return stored === "true";
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (online) {
      connectSocket(merchantId, {
        accountType: merchant?.accountType || 'merchant',
        warehouseId: merchant?.warehouseId,
      });
    } else {
      disconnectSocket();
    }
  }, [online, merchantId, merchant?.accountType, merchant?.warehouseId]);

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
          relative flex items-center rounded-full transition-all duration-300 ease-in-out cursor-pointer select-none outline-none border-0
          w-[62px] h-[26px] sm:w-[84px] sm:h-[30px]
          ${online 
            ? "bg-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.35)]" 
            : "bg-slate-700 shadow-inner border border-slate-600/40"
          }
        `}
      >
        {/* Label */}
        <span
          className={`
            absolute text-[9px] sm:text-[10px] font-black tracking-wider text-white transition-all duration-300 pointer-events-none
            ${online 
              ? "left-2 sm:left-2.5 opacity-100" 
              : "right-2 sm:right-2.5 opacity-90"
            }
          `}
        >
          <span className="sm:hidden">{online ? "ON" : "OFF"}</span>
          <span className="hidden sm:inline">{online ? "ONLINE" : "OFFLINE"}</span>
        </span>

        {/* Knob */}
        <div
          className={`
            absolute top-[3px] sm:top-[4px] left-[3px] sm:left-[4px]
            w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]
            bg-white rounded-full shadow-md flex items-center justify-center 
            transition-transform duration-300 ease-out
            ${online 
              ? "translate-x-[36px] sm:translate-x-[54px]" 
              : "translate-x-0"
            }
          `}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`}
          />
        </div>
      </button>

      {/* ●●● MODAL ●●● */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface,#ffffff)] text-[var(--color-text,#1e293b)] rounded-2xl p-5 sm:p-6 w-full max-w-xs shadow-2xl text-center border border-[var(--color-border,#e2e8f0)]">
            <h2 className="text-base sm:text-lg font-bold mb-1.5 text-[var(--color-text)]">Confirm Status Change</h2>

            <p className="text-xs sm:text-sm text-[var(--color-text-secondary,#64748b)] mb-5">
              Switch store status to{" "}
              <span className={`font-bold ${pendingStatus ? "text-emerald-500" : "text-rose-500"}`}>
                {pendingStatus ? "ONLINE" : "OFFLINE"}
              </span>
              ?
            </p>

            <div className="flex justify-between gap-2.5">
              <button
                onClick={cancelToggle}
                className="btn btn-secondary flex-1 py-2 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={confirmToggle}
                disabled={loading}
                className={`btn flex-1 py-2 text-xs font-bold text-white transition-opacity ${
                  loading 
                    ? "opacity-60 cursor-not-allowed bg-blue-400" 
                    : pendingStatus 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-rose-600 hover:bg-rose-700"
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
