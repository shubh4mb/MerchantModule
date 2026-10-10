import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProductTable from "../../components/Products/ProductTable";
import LinkMerchantProductModal from "../../components/Products/LinkMerchantProductModal";
import {
  Package,
  ArrowRight,
  UploadCloud,
  Sliders,
  Link as LinkIcon,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  XCircle,
  Warehouse
} from "lucide-react";

export default function InventoryPage() {
  const { merchant, isLoading } = useAuth();
  const isWarehouse = merchant?.accountType === "warehouse";

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });

  if (isLoading) return null;
  if (!merchant) return null;

  return (
    <div className="page-container space-y-4 sm:space-y-6" style={{ padding: "var(--space-3) var(--space-4)" }}>
      {/* ── Page Header & Action Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            {isWarehouse ? (
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#ffffff" }}
              >
                <Warehouse size={16} />
              </div>
            ) : null}
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-[var(--color-text)] m-0">
              {isWarehouse ? "Warehouse Hub Inventory" : "Inventory Management"}
            </h1>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 hidden sm:block">
            {isWarehouse
              ? "Allocate, track, and edit stock for all products stored at this warehouse facility."
              : "Manage products, track variant inventory, and quickly adjust size quantities."}
          </p>
        </div>

        {/* Desktop Header Actions (hidden on mobile to avoid giant duplicate buttons) */}
        <div className="hidden sm:flex items-center gap-2">
          {isWarehouse && (
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="btn btn-outline btn-sm flex items-center gap-1.5"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
            >
              <LinkIcon size={14} />
              <span>Link Product</span>
            </button>
          )}
          <Link
            to="/merchant/stock-update"
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            style={{ color: "var(--color-text)" }}
          >
            <Sliders size={14} />
            <span>Stock Manager</span>
          </Link>
          <Link
            to="/merchant/add-product"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Package size={14} />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      {/* ── Metric Summary Cards (Compact 4-column row on mobile) ── */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        {/* Total Products */}
        <div className="card p-1.5 sm:p-3.5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
          <div
            className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}
          >
            <Boxes size={13} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] sm:text-xs text-[var(--color-text-secondary)] font-medium truncate">
              Listings
            </div>
            <div className="text-xs sm:text-lg font-black text-[var(--color-text)]">
              {stats.totalProducts}
            </div>
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="card p-1.5 sm:p-3.5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
          <div
            className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}
          >
            <CheckCircle2 size={13} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] sm:text-xs text-[var(--color-text-secondary)] font-medium truncate">
              In Stock
            </div>
            <div className="text-xs sm:text-lg font-black text-[var(--color-text)]">
              {stats.totalStockUnits}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card p-1.5 sm:p-3.5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
          <div
            className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}
          >
            <AlertTriangle size={13} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] sm:text-xs text-[var(--color-text-secondary)] font-medium truncate">
              Low (≤5)
            </div>
            <div className={`text-xs sm:text-lg font-black ${stats.lowStockCount > 0 ? "text-amber-600" : "text-[var(--color-text)]"}`}>
              {stats.lowStockCount}
            </div>
          </div>
        </div>

        {/* Out of Stock Alert */}
        <div className="card p-1.5 sm:p-3.5 flex flex-col sm:flex-row items-center text-center sm:text-left gap-1 sm:gap-3">
          <div
            className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
          >
            <XCircle size={13} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] sm:text-xs text-[var(--color-text-secondary)] font-medium truncate">
              Out
            </div>
            <div className={`text-xs sm:text-lg font-black ${stats.outOfStockCount > 0 ? "text-rose-600" : "text-[var(--color-text)]"}`}>
              {stats.outOfStockCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Compact Action Strip (Small side-by-side buttons) ── */}
      <div className="grid grid-cols-3 gap-1.5 sm:hidden">
        <Link
          to="/merchant/add-product"
          className="card p-2 flex flex-col items-center justify-center text-center gap-1 active:scale-95 transition-transform"
          style={{ textDecoration: "none" }}
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Package size={14} />
          </div>
          <span className="text-[10px] font-bold text-[var(--color-text)] leading-tight">New Listing</span>
        </Link>

        <Link
          to="/merchant/stock-update"
          className="card p-2 flex flex-col items-center justify-center text-center gap-1 active:scale-95 transition-transform"
          style={{ textDecoration: "none", background: "rgba(59, 130, 246, 0.05)", borderColor: "rgba(59, 130, 246, 0.3)" }}
        >
          <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-xs">
            <Sliders size={14} />
          </div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 leading-tight">Stock Quick</span>
        </Link>

        {isWarehouse ? (
          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="card p-2 flex flex-col items-center justify-center text-center gap-1 active:scale-95 transition-transform w-full"
            style={{ textDecoration: "none" }}
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <LinkIcon size={14} />
            </div>
            <span className="text-[10px] font-bold text-[var(--color-text)] leading-tight">Link Stock</span>
          </button>
        ) : (
          <Link
            to="/merchant/bulk-upload"
            className="card p-2 flex flex-col items-center justify-center text-center gap-1 active:scale-95 transition-transform"
            style={{ textDecoration: "none" }}
          >
            <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shadow-xs">
              <UploadCloud size={14} />
            </div>
            <span className="text-[10px] font-bold text-[var(--color-text)] leading-tight">Bulk CSV</span>
          </Link>
        )}
      </div>

      {/* ── Desktop Action Hub Cards (hidden on mobile) ── */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        {/* Card 1: Add New Product */}
        <Link
          to="/merchant/add-product"
          className="card group flex items-center p-3.5 sm:p-4 gap-3 transition-all hover:border-blue-400"
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--color-accent, #3b82f6)",
              color: "#ffffff",
              flexShrink: 0
            }}
          >
            <Package size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontWeight: 700, fontSize: "13px", color: "var(--color-text)", margin: 0 }}>
              New Product Listing
            </h4>
            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
              Add a brand new item with full photos & sizing
            </p>
          </div>
          <ArrowRight size={16} style={{ color: "var(--color-text-tertiary)" }} />
        </Link>

        {/* Card 2: Quick Stock Manager */}
        <Link
          to="/merchant/stock-update"
          className="card group flex items-center p-3.5 sm:p-4 gap-3 transition-all hover:border-blue-400"
          style={{
            textDecoration: "none",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            background: "rgba(59, 130, 246, 0.03)"
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--color-primary, #3b82f6)",
              color: "#ffffff",
              flexShrink: 0
            }}
          >
            <Sliders size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center gap-1.5">
              <h4 style={{ fontWeight: 700, fontSize: "13px", color: "var(--color-text)", margin: 0 }}>
                Stock Quick Manager
              </h4>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500 text-white font-bold">FAST</span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
              1-click stepper & barcode SKU audits
            </p>
          </div>
          <ArrowRight size={16} style={{ color: "var(--color-text-tertiary)" }} />
        </Link>

        {/* Card 3: Link Consignment Product (Warehouse) OR Bulk Upload (Merchant) */}
        {isWarehouse ? (
          <div
            onClick={() => setIsLinkModalOpen(true)}
            className="card group flex items-center p-3.5 sm:p-4 gap-3 transition-all hover:border-blue-400 cursor-pointer"
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#ffffff",
                flexShrink: 0
              }}
            >
              <LinkIcon size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontWeight: 700, fontSize: "13px", color: "var(--color-text)", margin: 0 }}>
                Link Merchant Product
              </h4>
              <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
                Allocate stock from registered partner brands
              </p>
            </div>
            <ArrowRight size={16} style={{ color: "var(--color-text-tertiary)" }} />
          </div>
        ) : (
          <Link
            to="/merchant/bulk-upload"
            className="card group flex items-center p-3.5 sm:p-4 gap-3 transition-all hover:border-blue-400"
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--color-accent, #3b82f6)",
                color: "#ffffff",
                flexShrink: 0
              }}
            >
              <UploadCloud size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontWeight: 700, fontSize: "13px", color: "var(--color-text)", margin: 0 }}>
                Bulk CSV Upload
              </h4>
              <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "2px 0 0" }}>
                Import hundreds of items via spreadsheet
              </p>
            </div>
            <ArrowRight size={16} style={{ color: "var(--color-text-tertiary)" }} />
          </Link>
        )}
      </div>

      {/* ── Unified Production-Grade Product Table ── */}
      <ProductTable
        merchantId={merchant.id}
        onStatsCalculated={setStats}
        refreshTrigger={refreshTrigger}
      />

      {/* ── Link Merchant Consignment Modal (Warehouse) ── */}
      {isWarehouse && (
        <LinkMerchantProductModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
        />
      )}
    </div>
  );
}
