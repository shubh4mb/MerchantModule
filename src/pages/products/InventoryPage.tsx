import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProductTable from "../../components/Products/ProductTable";
import { Package, Tag, ArrowRight } from "lucide-react";

export default function InventoryPage() {
  const { merchant, isLoading } = useAuth();

  if (isLoading) return null;
  if (!merchant) return null;

  return (
    <div className="page-container">
      {/* Action Cards */}
      <div className="flex flex-col md:flex-row" style={{ gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        <Link
          to="/merchant/add-product"
          className="card group flex items-center flex-1"
          style={{
            padding: "var(--space-5) var(--space-6)",
            gap: "var(--space-4)",
            textDecoration: "none",
            transition: "all var(--transition-base)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--color-accent)",
              color: "var(--color-text-inverse)",
              flexShrink: 0,
              transition: "transform var(--transition-fast)",
            }}
          >
            <Package size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--color-text)" }}>New Product</h4>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>Add new items to inventory</p>
          </div>
          <ArrowRight size={18} style={{ color: "var(--color-text-tertiary)" }} />
        </Link>

        <Link
          to="/merchant/add-brand"
          className="card group flex items-center flex-1"
          style={{
            padding: "var(--space-5) var(--space-6)",
            gap: "var(--space-4)",
            textDecoration: "none",
            transition: "all var(--transition-base)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--color-accent)",
              color: "var(--color-text-inverse)",
              flexShrink: 0,
            }}
          >
            <Tag size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--color-text)" }}>New Brand</h4>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>Register a new brand</p>
          </div>
          <ArrowRight size={18} style={{ color: "var(--color-text-tertiary)" }} />
        </Link>
      </div>

      {/* Title */}
      <div className="page-header" style={{ marginBottom: "var(--space-4)" }}>
        <h1>Inventory</h1>
      </div>

      <ProductTable merchantId={merchant.id} />
    </div>
  );
}
