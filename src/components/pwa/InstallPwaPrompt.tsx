import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Download, Share, PlusSquare, X } from "lucide-react";
import { usePwaInstall } from "../../hooks/usePwaInstall";

const IosInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 flex items-end sm:items-center justify-center p-4"
    style={{ backgroundColor: "rgba(0, 0, 0, 0.55)", zIndex: 1300 }}
    onClick={onClose}
  >
    <div
      className="w-full max-w-sm rounded-2xl p-5"
      style={{
        background: "var(--color-surface)",
        color: "var(--color-text)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <img
            src="/pwa-192x192.png"
            alt="FlashFits Merchant"
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div>
            <h3 className="text-sm font-bold m-0">Install FlashFits Merchant</h3>
            <p className="text-xs m-0" style={{ color: "var(--color-text-secondary)" }}>
              Add to your iPhone / iPad home screen
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close install instructions"
          className="p-1 rounded-lg bg-transparent border-0 cursor-pointer"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <X size={18} />
        </button>
      </div>

      <ol className="text-xs space-y-2.5 pl-4 m-0 mb-4" style={{ color: "var(--color-text)" }}>
        <li className="leading-relaxed">
          Tap the{" "}
          <span className="inline-flex items-center gap-1 font-semibold">
            <Share size={13} /> Share
          </span>{" "}
          button in Safari&apos;s toolbar.
        </li>
        <li className="leading-relaxed">
          Scroll down and tap{" "}
          <span className="inline-flex items-center gap-1 font-semibold">
            <PlusSquare size={13} /> Add to Home Screen
          </span>
          .
        </li>
        <li className="leading-relaxed">
          Tap <span className="font-semibold">Add</span> in the top-right corner to install.
        </li>
      </ol>

      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 rounded-xl text-xs font-semibold border-0 cursor-pointer"
        style={{
          background: "var(--color-accent)",
          color: "var(--color-text-inverse)",
        }}
      >
        Got it
      </button>
    </div>
  </div>
);

/**
 * Compact navbar action button to trigger PWA installation anytime.
 */
export const InstallPwaButton: React.FC = () => {
  const { canInstall, isIos, promptInstall } = usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  if (!canInstall) return null;

  const handleClick = async () => {
    const result = await promptInstall();
    if (result === "ios" || isIos) {
      setShowIosGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3"
        style={{
          background: "rgba(255, 255, 255, 0.12)",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          color: "#FFFFFF",
          cursor: "pointer",
          borderRadius: "var(--radius-full)",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          fontFamily: "var(--font-family)",
          transition: "all var(--transition-fast)",
        }}
        title="Install FlashFits Merchant App"
      >
        <Download size={14} />
        <span>Install</span>
      </button>

      {showIosGuide && <IosInstallModal onClose={() => setShowIosGuide(false)} />}
    </>
  );
};

/**
 * Floating install banner shown when the merchant opens the website in a browser
 * and has not yet installed the PWA.
 */
export const InstallPwaBanner: React.FC = () => {
  const { shouldShowBanner, isIos, promptInstall, dismissBanner } = usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const location = useLocation();

  if (!shouldShowBanner) {
    return showIosGuide ? <IosInstallModal onClose={() => setShowIosGuide(false)} /> : null;
  }

  const isAuthPage =
    location.pathname.includes("/login") ||
    location.pathname.includes("/signup") ||
    location.pathname.includes("/forgot-password") ||
    location.pathname.includes("/register") ||
    location.pathname.includes("/payment") ||
    location.pathname.includes("/pending-verification") ||
    location.pathname.includes("/rejected");

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result === "ios" || isIos) {
      setShowIosGuide(true);
    }
  };

  return (
    <>
      <div
        role="region"
        aria-label="Install FlashFits Merchant app"
        className={`fixed left-3 right-3 sm:left-auto sm:right-5 sm:w-[360px] rounded-2xl p-3.5 flex items-center gap-3 ${
          isAuthPage ? "bottom-4" : "bottom-[72px] md:bottom-5"
        }`}
        style={{
          background: "#0A0A0A",
          color: "#FFFFFF",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.28)",
          zIndex: 1050,
        }}
      >
        <img
          src="/pwa-192x192.png"
          alt="FlashFits Merchant"
          className="w-10 h-10 rounded-xl flex-shrink-0 object-cover"
        />

        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white truncate">
            Install FlashFits Merchant
          </div>
          <div className="text-[11px] leading-snug" style={{ color: "#A3A3A3" }}>
            {isIos
              ? "Add to Home Screen for instant access & alerts"
              : "Install on your device for quick access & auto-updates"}
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 border-0 cursor-pointer"
          style={{
            background: "#FFFFFF",
            color: "#0A0A0A",
          }}
        >
          {isIos ? "How to" : "Install"}
        </button>

        <button
          type="button"
          onClick={dismissBanner}
          aria-label="Dismiss install prompt"
          className="p-1 rounded-lg bg-transparent border-0 cursor-pointer flex-shrink-0"
          style={{ color: "#A3A3A3" }}
        >
          <X size={16} />
        </button>
      </div>

      {showIosGuide && <IosInstallModal onClose={() => setShowIosGuide(false)} />}
    </>
  );
};
