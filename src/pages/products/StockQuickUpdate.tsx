import React, { useState, useEffect, useMemo } from "react";
import { Search, Save, ArrowLeft, Plus, Minus, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchProductsByMerchantId, updateSingleSizeStock } from "../../api/products";
import { useAuth } from "../../context/AuthContext";

interface Size {
  size: string;
  stock: number;
  productCode?: string;
  _id: string;
}

interface Color {
  name: string;
  hex: string;
}

interface Image {
  public_id: string;
  url: string;
  _id: string;
}

interface Product {
  id: string;
  styleGroupId: string;
  name: string;
  productCode?: string;
  brand: string;
  category: string;
  subCategory: string;
  color?: Color;
  mrp: number;
  price: number;
  discount: number;
  images?: Image[];
  sizes?: Size[];
  isActive: boolean;
}

export default function StockQuickUpdate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const merchantId = localStorage.getItem("merchant_id") || user?.id || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Track inline loading states and temp inputs per size
  // key: "productId_sizeId"
  const [updatingSizes, setUpdatingSizes] = useState<Record<string, boolean>>({});
  const [successSizes, setSuccessSizes] = useState<Record<string, boolean>>({});
  const [tempStocks, setTempStocks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!merchantId) return;
    const loadData = async () => {
      try {
        const data = await fetchProductsByMerchantId(merchantId);
        setProducts(data);
        
        // Initialize temporary stock inputs
        const initialTemp: Record<string, number> = {};
        data.forEach((p: Product) => {
          p.sizes?.forEach((sz) => {
            initialTemp[`${p.styleGroupId}_${sz._id}`] = sz.stock;
          });
        });
        setTempStocks(initialTemp);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [merchantId]);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.productCode && p.productCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.color?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleStockChange = (key: string, value: number) => {
    setTempStocks((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  const handleSaveStock = async (product: Product, sizeId: string) => {
    const key = `${product.styleGroupId}_${sizeId}`;
    const newStock = tempStocks[key] ?? 0;

    setUpdatingSizes((prev) => ({ ...prev, [key]: true }));
    try {
      await updateSingleSizeStock(product.styleGroupId, "any", sizeId, newStock);
      
      // Update local products state
      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          if (p.styleGroupId === product.styleGroupId) {
            return {
              ...p,
              sizes: p.sizes?.map((sz) =>
                sz._id === sizeId ? { ...sz, stock: newStock } : sz
              ),
            };
          }
          return p;
        })
      );

      // Trigger success flash
      setSuccessSizes((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setSuccessSizes((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to update stock");
    } finally {
      setUpdatingSizes((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: "var(--space-4) var(--space-4)" }}>
      {/* Dynamic Responsive Stylesheet */}
      <style>{`
        .quick-stock-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-border, #cbd5e1);
          background: var(--color-surface, #ffffff);
          transition: background-color 0.15s;
        }
        .quick-stock-row:last-child {
          border-bottom: none;
        }
        .quick-stock-row:hover {
          background-color: var(--color-bg, #f8fafc);
        }
        
        .quick-stock-info {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        
        .quick-stock-sizes {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          width: 100%;
        }

        @media (min-width: 1024px) {
          .quick-stock-row {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
          }
          .quick-stock-info {
            width: 380px;
            flex-shrink: 0;
          }
          .quick-stock-sizes {
            width: auto;
            flex-grow: 1;
            justify-content: flex-end;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex-between" style={{ marginBottom: "var(--space-4)" }}>
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ padding: "4px" }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 800, margin: 0 }}>Quick Stock Manager</h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", marginTop: "2px" }}>
              Search style variants and instantly update stock counts.
            </p>
          </div>
        </div>
      </div>

      {/* Search Filter bar */}
      <div className="card" style={{ padding: "10px 14px", marginBottom: "var(--space-4)" }}>
        <div className="search-box" style={{ display: "flex", alignItems: "center", width: "100%", background: "var(--color-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", padding: "2px 10px" }}>
          <Search size={16} style={{ color: "var(--color-text-tertiary)", marginRight: "8px" }} />
          <input
            type="text"
            placeholder="Search by product name, code, color, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", padding: "6px 0", color: "var(--color-text)", fontSize: "13px" }}
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {filteredProducts.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary)" }}>
            No products found matching your search
          </div>
        ) : (
          filteredProducts.map((product) => {
            const firstImg = product.images?.[0]?.url || "";
            const totalStock = product.sizes?.reduce((sum, sz) => sum + (sz.stock || 0), 0) || 0;

            return (
              <div key={product.id} className="quick-stock-row">
                {/* Product Thumbnail & Basic Info */}
                <div className="quick-stock-info">
                  {firstImg ? (
                    <img
                      src={firstImg}
                      alt={product.name}
                      style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--color-border)", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: "40px", height: "40px", background: "var(--color-bg)", borderRadius: "6px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)", flexShrink: 0 }}>
                      —
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "var(--color-text)" }} className="truncate">
                      {product.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                        {product.brand} • {product.category}
                      </span>
                      {product.productCode && (
                        <span
                          style={{ fontSize: "10px", color: "var(--color-text-tertiary)", background: "var(--color-bg)", padding: "1px 4px", borderRadius: "3px", border: "1px solid var(--color-border)", fontFamily: "monospace" }}
                          title="Variant Code Prefix"
                        >
                          {product.productCode}
                        </span>
                      )}
                      <div className="flex items-center" style={{ gap: "3px" }}>
                        <div
                          style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: product.color?.hex || "#ccc", border: "1px solid var(--color-border)" }}
                        />
                        <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>
                          {product.color?.name || "Default"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Summary Badge & Size Stock Adjuster Flex Row */}
                <div className="quick-stock-sizes">
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: totalStock > 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: totalStock > 0 ? "var(--color-success)" : "var(--color-danger)", marginRight: "8px" }}>
                    Total: {totalStock}
                  </span>
                  {product.sizes?.map((sz) => {
                    const key = `${product.styleGroupId}_${sz._id}`;
                    const currentVal = tempStocks[key] ?? 0;
                    const isSaving = updatingSizes[key] || false;
                    const isSuccess = successSizes[key] || false;
                    const isDirty = currentVal !== sz.stock;

                    return (
                      <div
                        key={sz._id}
                        style={{
                          background: "var(--color-bg, #f8fafc)",
                          border: "1px solid var(--color-border, #e2e8f0)",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          alignItems: "center",
                          minWidth: "140px",
                        }}
                      >
                        {/* Size & Code Details */}
                        <div style={{ textAlign: "center", width: "100%" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                            Size: {sz.size}
                          </span>
                          {sz.productCode && (
                            <div 
                              style={{ 
                                fontSize: "9px", 
                                color: "var(--color-text-tertiary)", 
                                fontFamily: "monospace", 
                                marginTop: "2px", 
                                background: "white", 
                                padding: "1px 4px", 
                                borderRadius: "3px", 
                                border: "1px dashed var(--color-border)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                              title={sz.productCode}
                            >
                              {sz.productCode}
                            </div>
                          )}
                        </div>

                        {/* Controls Block */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%", justifyContent: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                            <button
                              type="button"
                              onClick={() => handleStockChange(key, currentVal - 1)}
                              style={{ width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--color-border)", borderRadius: "3px", background: "white", cursor: "pointer" }}
                              disabled={isSaving}
                            >
                              <Minus size={10} />
                            </button>

                            <input
                              type="number"
                              min={0}
                              value={currentVal}
                              onChange={(e) => handleStockChange(key, Number(e.target.value))}
                              style={{
                                width: "32px",
                                textAlign: "center",
                                border: "1px solid var(--color-border)",
                                borderRadius: "3px",
                                fontSize: "11px",
                                fontWeight: 600,
                                background: "white",
                                padding: "1px 0"
                              }}
                              disabled={isSaving}
                            />

                            <button
                              type="button"
                              onClick={() => handleStockChange(key, currentVal + 1)}
                              style={{ width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--color-border)", borderRadius: "3px", background: "white", cursor: "pointer" }}
                              disabled={isSaving}
                            >
                              <Plus size={10} />
                            </button>
                          </div>

                          {/* Save Button */}
                          <button
                            type="button"
                            onClick={() => handleSaveStock(product, sz._id)}
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "4px",
                              border: "none",
                              cursor: isDirty && !isSaving ? "pointer" : "default",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isSuccess ? "var(--color-success, #22c55e)" : isDirty ? "var(--color-primary, #3b82f6)" : "transparent",
                              color: isSuccess || isDirty ? "white" : "var(--color-text-tertiary)",
                              transition: "background-color 0.15s, color 0.15s"
                            }}
                            disabled={!isDirty || isSaving}
                            title={isSuccess ? "Saved successfully" : isDirty ? "Save changes" : "No changes"}
                          >
                            {isSaving ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : isSuccess ? (
                              <Check size={10} />
                            ) : (
                              <Save size={10} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
