import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Save,
  ArrowLeft,
  Plus,
  Minus,
  Check,
  Loader2,
  Sliders,
  X,
  AlertTriangle,
  RotateCcw,
  CheckCheck,
  Box,
  Copy
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  source?: string;
  merchant?: {
    id?: string;
    shopName?: string;
  };
}

export default function StockQuickUpdate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const { merchant } = useAuth();
  const merchantId = localStorage.getItem("merchant_id") || merchant?.id || "";
  const isWarehouse = merchant?.accountType === "warehouse";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Track inline loading states and temp inputs per size
  // key: "productId_sizeId"
  const [updatingSizes, setUpdatingSizes] = useState<Record<string, boolean>>({});
  const [successSizes, setSuccessSizes] = useState<Record<string, boolean>>({});
  const [tempStocks, setTempStocks] = useState<Record<string, number>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Grouping helper: merges single-size variant rows into a unified product entry
  const groupRawProducts = (rawList: Product[]): Product[] => {
    const map = new Map<string, Product>();

    rawList.forEach((p: any) => {
      const colorName = p.color?.name?.trim().toLowerCase() || "default";
      const groupKey = p.styleGroupId
        ? `${p.styleGroupId}_${colorName}`
        : `${(p.name || "").trim().toLowerCase()}_${(p.brand || "").trim().toLowerCase()}_${colorName}`;

      const incomingSizes: Size[] = [];
      if (Array.isArray(p.sizes) && p.sizes.length > 0) {
        incomingSizes.push(...p.sizes);
      } else if (p.size) {
        incomingSizes.push({
          _id: p._id || p.id,
          size: p.size,
          stock: p.stock || 0,
          productCode: p.productCode
        });
      }

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          ...p,
          id: p.styleGroupId || p.id || p._id,
          styleGroupId: p.styleGroupId || p.id || p._id,
          sizes: incomingSizes
        });
      } else {
        const existing = map.get(groupKey)!;
        const existingSizes = existing.sizes || [];
        incomingSizes.forEach((newSz) => {
          const foundIdx = existingSizes.findIndex(
            (s) => s.size?.trim().toUpperCase() === newSz.size?.trim().toUpperCase()
          );
          if (foundIdx >= 0) {
            existingSizes[foundIdx].stock = Math.max(existingSizes[foundIdx].stock, newSz.stock);
            if (!existingSizes[foundIdx]._id && newSz._id) existingSizes[foundIdx]._id = newSz._id;
          } else {
            existingSizes.push(newSz);
          }
        });
        existing.sizes = existingSizes;
      }
    });

    return Array.from(map.values());
  };

  useEffect(() => {
    if (!merchantId) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const data: any = await fetchProductsByMerchantId(merchantId);
        const rawList: Product[] = Array.isArray(data) ? data : data?.products || [];
        const list: Product[] = groupRawProducts(rawList);
        setProducts(list);

        // Initialize temporary stock inputs
        const initialTemp: Record<string, number> = {};
        list.forEach((p: Product) => {
          const pId = p.styleGroupId || p.id;
          p.sizes?.forEach((sz) => {
            initialTemp[`${pId}_${sz._id}`] = sz.stock;
          });
        });
        setTempStocks(initialTemp);
      } catch (err) {
        console.error("Failed to load products for stock update:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [merchantId]);

  // Autofocus search input
  useEffect(() => {
    if (!loading && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [loading]);

  // Unique categories list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filter products by search query, status, and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSku =
          p.productCode?.toLowerCase().includes(q) ||
          p.sizes?.some((s) => s.productCode?.toLowerCase().includes(q));
        const matchBrand = p.brand?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q) || p.subCategory?.toLowerCase().includes(q);
        const matchColor = p.color?.name?.toLowerCase().includes(q);
        const matchSize = p.sizes?.some((s) => s.size?.toLowerCase() === q);

        if (!matchName && !matchSku && !matchBrand && !matchCat && !matchColor && !matchSize) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "ALL" && p.category !== categoryFilter) {
        return false;
      }

      // Status filter
      const totalStock = p.sizes?.reduce((sum, sz) => sum + (sz.stock || 0), 0) || 0;
      if (statusFilter === "OUT_OF_STOCK" && totalStock > 0) return false;
      if (statusFilter === "LOW_STOCK" && (totalStock <= 0 || totalStock > 5)) return false;
      if (statusFilter === "IN_STOCK" && totalStock <= 0) return false;

      return true;
    });
  }, [products, searchQuery, statusFilter, categoryFilter]);

  // Identify all modified (dirty) sizes across all products
  const dirtyItems = useMemo(() => {
    const dirty: Array<{ product: Product; size: Size; newStock: number; key: string }> = [];
    products.forEach((p) => {
      const pId = p.styleGroupId || p.id;
      p.sizes?.forEach((sz) => {
        const key = `${pId}_${sz._id}`;
        const currentVal = tempStocks[key];
        if (currentVal !== undefined && currentVal !== sz.stock) {
          dirty.push({ product: p, size: sz, newStock: currentVal, key });
        }
      });
    });
    return dirty;
  }, [products, tempStocks]);

  const handleStockChange = (key: string, value: number) => {
    setTempStocks((prev) => ({
      ...prev,
      [key]: Math.max(0, value)
    }));
  };

  const handleFastAdjust = (key: string, delta: number) => {
    const current = tempStocks[key] ?? 0;
    handleStockChange(key, current + delta);
  };

  const handleSetZero = (key: string) => {
    handleStockChange(key, 0);
  };

  const handleReset = (product: Product, sizeId: string) => {
    const pId = product.styleGroupId || product.id;
    const key = `${pId}_${sizeId}`;
    const original = product.sizes?.find((s) => s._id === sizeId)?.stock ?? 0;
    handleStockChange(key, original);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSku(code);
    setTimeout(() => setCopiedSku(null), 1500);
  };

  // Save a single size stock
  const handleSaveStock = async (product: Product, sizeId: string) => {
    const pId = product.styleGroupId || product.id;
    const key = `${pId}_${sizeId}`;
    const newStock = tempStocks[key] ?? 0;

    setUpdatingSizes((prev) => ({ ...prev, [key]: true }));
    try {
      await updateSingleSizeStock(pId, "any", sizeId, newStock);

      // Update local products state
      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const matchId = p.styleGroupId || p.id;
          if (matchId === pId) {
            return {
              ...p,
              sizes: p.sizes?.map((sz) =>
                sz._id === sizeId ? { ...sz, stock: newStock } : sz
              )
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
    } catch (err: any) {
      console.error(err);
      alert("Failed to update stock: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingSizes((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Save all modified sizes in bulk
  const handleSaveAll = async () => {
    if (dirtyItems.length === 0) return;

    try {
      setSavingAll(true);
      for (const item of dirtyItems) {
        const pId = item.product.styleGroupId || item.product.id;
        await updateSingleSizeStock(pId, "any", item.size._id, item.newStock);
      }

      // Update products state with all new stocks
      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const pId = p.styleGroupId || p.id;
          return {
            ...p,
            sizes: p.sizes?.map((sz) => {
              const key = `${pId}_${sz._id}`;
              const updated = tempStocks[key];
              return updated !== undefined ? { ...sz, stock: updated } : sz;
            })
          };
        })
      );

      alert(`Successfully saved all ${dirtyItems.length} modified size stock counts!`);
    } catch (err: any) {
      console.error("Bulk save error:", err);
      alert("Failed to save some stock updates: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-32" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-500" size={40} />
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            Loading catalog for rapid stock manager...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-4" style={{ padding: "var(--space-4) var(--space-4)" }}>
      {/* ── Top Navigation & Title Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/merchant/inventory")}
            style={{ padding: "6px", color: "var(--color-text-secondary)" }}
            title="Back to Inventory"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--color-primary, #3b82f6)", color: "#ffffff" }}
              >
                <Sliders size={16} />
              </div>
              <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 800, margin: 0, color: "var(--color-text)" }}>
                Stock Quick Manager
              </h1>
              {isWarehouse && (
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  Warehouse Mode
                </span>
              )}
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "12px", marginTop: "2px" }}>
              Quick barcode/SKU search with 1-click steppers and instant stock saving.
            </p>
          </div>
        </div>

        {/* Save All Floating Header Button */}
        {dirtyItems.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
              {dirtyItems.length} unsaved changes
            </span>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savingAll}
              className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
            >
              {savingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              {savingAll ? "Saving..." : `Save All (${dirtyItems.length})`}
            </button>
          </div>
        )}
      </div>

      {/* ── Search Bar & Filter Controls ── */}
      <div className="card p-3 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Main Search Input */}
          <div
            className="flex items-center flex-1 rounded-lg border px-3 py-2.5"
            style={{
              background: "var(--color-bg)",
              borderColor: "var(--color-border)",
              gap: "8px"
            }}
          >
            <Search size={18} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Type product name, barcode SKU, size (e.g. XL), color, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                width: "100%",
                color: "var(--color-text)",
                fontSize: "13px"
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ color: "var(--color-text-tertiary)", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
            style={{ fontSize: "12px", minWidth: "150px" }}
          >
            <option value="ALL">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: "ALL", label: `All (${products.length})` },
                { key: "OUT_OF_STOCK", label: "Out of Stock (0)" },
                { key: "LOW_STOCK", label: "Low Stock (≤5)" },
                { key: "IN_STOCK", label: "In Stock" }
              ] as const
            ).map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                  style={{
                    background: isActive ? "var(--color-primary)" : "var(--color-bg)",
                    color: isActive ? "#ffffff" : "var(--color-text-secondary)",
                    border: `1px solid ${isActive ? "var(--color-primary)" : "var(--color-border)"}`
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            Showing <strong>{filteredProducts.length}</strong> matching products
          </div>
        </div>
      </div>

      {/* ── Product List for Stock Updates ── */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="card py-16 text-center space-y-3">
            <Box size={40} className="mx-auto text-gray-400 opacity-60" />
            <p style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
              No products found matching "{searchQuery}".
            </p>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
              }}
            >
              Clear Search & Filters
            </button>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const pId = product.styleGroupId || product.id;
            const firstImg = product.images?.[0]?.url || "";
            const totalStock = product.sizes?.reduce((sum, sz) => {
              const currentVal = tempStocks[`${pId}_${sz._id}`] ?? sz.stock ?? 0;
              return sum + currentVal;
            }, 0) || 0;

            const isOutOfStock = totalStock <= 0;
            const isLowStock = totalStock > 0 && totalStock <= 5;

            return (
              <div
                key={pId}
                className="card p-4 transition-all hover:border-blue-400"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface, #ffffff)"
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Product Header / Details */}
                  <div className="flex items-start gap-3.5 min-w-0 lg:max-w-md">
                    {firstImg ? (
                      <img
                        src={firstImg}
                        alt={product.name}
                        className="w-14 h-14 rounded-lg object-cover border flex-shrink-0"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-lg flex items-center justify-center border flex-shrink-0"
                        style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
                      >
                        <Box size={22} style={{ color: "var(--color-text-tertiary)" }} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm truncate" style={{ color: "var(--color-text)", margin: 0 }}>
                          {product.name}
                        </h3>
                        {product.productCode && (
                          <div className="flex items-center gap-1">
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              {product.productCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(product.productCode!)}
                              className="btn btn-ghost btn-xs p-0.5 text-gray-400"
                              title="Copy SKU Code"
                            >
                              {copiedSku === product.productCode ? (
                                <Check size={11} className="text-green-500" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        <span>{product.brand || "General"}</span>
                        <span>•</span>
                        <span>{product.category}</span>
                        {product.color?.name && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full border"
                                style={{
                                  backgroundColor: product.color.hex || "#ccc",
                                  borderColor: "var(--color-border)"
                                }}
                              />
                              <span>{product.color.name}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Consignment Badge if warehouse */}
                      {isWarehouse && product.merchant?.shopName && (
                        <div className="mt-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 font-medium">
                            Consigned by: {product.merchant.shopName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stock Counters & Size Adjustment Grid */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:flex-1 justify-end">
                    {/* Overall Stock Status Indicator */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-b sm:border-b-0 sm:border-r pb-2 sm:pb-0 sm:pr-4" style={{ borderColor: "var(--color-border)" }}>
                      <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Total Available
                      </span>
                      <span
                        className="px-2.5 py-1 rounded-md text-xs font-bold font-mono inline-block mt-0.5"
                        style={{
                          background: isOutOfStock
                            ? "rgba(239, 68, 68, 0.1)"
                            : isLowStock
                            ? "rgba(245, 158, 11, 0.1)"
                            : "rgba(34, 197, 94, 0.1)",
                          color: isOutOfStock
                            ? "var(--color-danger, #ef4444)"
                            : isLowStock
                            ? "#d97706"
                            : "var(--color-success, #22c55e)"
                        }}
                      >
                        {totalStock} units
                      </span>
                    </div>

                    {/* Size Adjustment Chips */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {product.sizes && product.sizes.length > 0 ? (
                        product.sizes.map((sz) => {
                          const key = `${pId}_${sz._id}`;
                          const currentVal = tempStocks[key] ?? sz.stock ?? 0;
                          const isSaving = updatingSizes[key] || false;
                          const isSuccess = successSizes[key] || false;
                          const isDirty = currentVal !== sz.stock;

                          return (
                            <div
                              key={sz._id}
                              className="rounded-lg border p-2 flex flex-col items-center transition-all"
                              style={{
                                background: isDirty
                                  ? "rgba(59, 130, 246, 0.05)"
                                  : "var(--color-bg)",
                                borderColor: isDirty
                                  ? "var(--color-primary)"
                                  : "var(--color-border)",
                                minWidth: "150px"
                              }}
                            >
                              {/* Size Label & Details */}
                              <div className="flex items-center justify-between w-full mb-1.5 px-0.5">
                                <span className="font-bold text-xs" style={{ color: "var(--color-text)" }}>
                                  Size {sz.size}
                                </span>
                                {isDirty && (
                                  <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                                    <AlertTriangle size={10} /> Edited
                                  </span>
                                )}
                              </div>

                              {/* Stepper Controls */}
                              <div className="flex items-center gap-1 w-full justify-between">
                                <button
                                  type="button"
                                  onClick={() => handleStockChange(key, currentVal - 1)}
                                  disabled={isSaving || currentVal <= 0}
                                  className="w-7 h-7 flex items-center justify-center rounded border bg-white text-gray-700 hover:bg-gray-100 font-bold disabled:opacity-40"
                                  style={{ borderColor: "var(--color-border)" }}
                                  title="Minus 1"
                                >
                                  <Minus size={12} />
                                </button>

                                <input
                                  type="number"
                                  min={0}
                                  value={currentVal}
                                  onChange={(e) =>
                                    handleStockChange(key, Math.max(0, parseInt(e.target.value) || 0))
                                  }
                                  disabled={isSaving}
                                  className="input"
                                  style={{
                                    width: "46px",
                                    padding: "3px 0",
                                    textAlign: "center",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    fontFamily: "monospace"
                                  }}
                                />

                                <button
                                  type="button"
                                  onClick={() => handleStockChange(key, currentVal + 1)}
                                  disabled={isSaving}
                                  className="w-7 h-7 flex items-center justify-center rounded border bg-white text-gray-700 hover:bg-gray-100 font-bold"
                                  style={{ borderColor: "var(--color-border)" }}
                                  title="Plus 1"
                                >
                                  <Plus size={12} />
                                </button>

                                {/* Save Button */}
                                <button
                                  type="button"
                                  onClick={() => handleSaveStock(product, sz._id)}
                                  disabled={!isDirty || isSaving}
                                  className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                                  style={{
                                    background: isSuccess
                                      ? "var(--color-success, #22c55e)"
                                      : isDirty
                                      ? "var(--color-primary, #3b82f6)"
                                      : "transparent",
                                    color: isSuccess || isDirty ? "#ffffff" : "var(--color-text-tertiary)",
                                    border: isDirty || isSuccess ? "none" : "1px solid var(--color-border)",
                                    cursor: isDirty && !isSaving ? "pointer" : "default"
                                  }}
                                  title={isSuccess ? "Saved successfully" : isDirty ? "Save size stock" : "No changes"}
                                >
                                  {isSaving ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : isSuccess ? (
                                    <Check size={13} />
                                  ) : (
                                    <Save size={13} />
                                  )}
                                </button>
                              </div>

                              {/* Fast Adjustment Chips */}
                              <div className="flex items-center gap-1 w-full justify-between mt-1.5 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                                <button
                                  type="button"
                                  onClick={() => handleFastAdjust(key, 5)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                                  title="Add 5 units"
                                >
                                  +5
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFastAdjust(key, 10)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                                  title="Add 10 units"
                                >
                                  +10
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetZero(key)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 font-medium"
                                  title="Set to 0 (Out of stock)"
                                >
                                  0
                                </button>
                                {isDirty && (
                                  <button
                                    type="button"
                                    onClick={() => handleReset(product, sz._id)}
                                    className="text-[10px] text-gray-500 hover:text-gray-700 p-0.5"
                                    title="Undo edits"
                                  >
                                    <RotateCcw size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
                          No size variants configured.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
