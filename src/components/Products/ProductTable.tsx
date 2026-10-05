import { useState, useEffect, useMemo } from "react";
import {
  Edit,
  Trash2,
  Search,
  Plus,
  Sliders,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Box,
  ExternalLink,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchProductsByMerchantId, deleteProduct, updateSingleSizeStock } from "../../api/products";
import { useAuth } from "../../context/AuthContext";
import ProductDetailsModal from "./ProductDetailsModal";

interface Size {
  size: string;
  stock: number;
  _id: string;
  productCode?: string;
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
  styleGroupId?: string;
  name: string;
  styleName?: string;
  brand: string;
  category: string;
  subCategory: string;
  subSubCategory?: string;
  gender: string[];
  description: string;
  tags: string[];
  isTriable: boolean;
  ratings: number;
  numReviews: number;
  isActive: boolean;
  color?: Color;
  mrp: number;
  price: number;
  discount: number;
  images?: Image[];
  productCode?: string;
  sizes?: Size[];
  source?: string;
  warehouseId?: string;
  merchant?: {
    id?: string;
    shopName?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProductTableProps {
  merchantId: string;
  onStatsCalculated?: (stats: {
    totalProducts: number;
    totalStockUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
  }) => void;
  refreshTrigger?: number;
}

export default function ProductTable({
  merchantId,
  onStatsCalculated,
  refreshTrigger = 0
}: ProductTableProps) {
  const navigate = useNavigate();
  const { merchant } = useAuth();
  const isWarehouse = merchant?.accountType === "warehouse";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "ACTIVE" | "INACTIVE">("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "NAME_ASC" | "STOCK_DESC" | "STOCK_ASC" | "PRICE_DESC" | "PRICE_ASC">("NEWEST");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Quick Stock Modal State
  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [quickStockForm, setQuickStockForm] = useState<Record<string, number>>({});
  const [savingQuickStock, setSavingQuickStock] = useState(false);
  const [quickStockSuccess, setQuickStockSuccess] = useState(false);

  // View Details Modal State
  const [selectedViewProduct, setSelectedViewProduct] = useState<Product | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const handleViewDetails = (prod: Product) => {
    setSelectedViewProduct(prod);
    setShowViewModal(true);
  };

  // Copy Feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Grouping helper: merges single-size variant rows into a unified product entry
  const groupRawProducts = (rawList: Product[]): Product[] => {
    const map = new Map<string, Product>();

    rawList.forEach((p: any) => {
      const colorName = p.color?.name?.trim().toLowerCase() || "default";
      // Group by styleGroupId + color, or fallback to name + brand + color
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

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data: any = await fetchProductsByMerchantId(merchantId);
      const rawList: Product[] = Array.isArray(data) ? data : data?.products || [];
      const list: Product[] = groupRawProducts(rawList);
      setProducts(list);

      // Compute summary stats
      if (onStatsCalculated) {
        let totalUnits = 0;
        let lowCount = 0;
        let outCount = 0;

        list.forEach((p) => {
          const pStock = p.sizes?.reduce((sum, sz) => sum + (sz.stock || 0), 0) || 0;
          totalUnits += pStock;
          if (pStock === 0) outCount++;
          else if (pStock <= 5) lowCount++;
        });

        onStatsCalculated({
          totalProducts: list.length,
          totalStockUnits: totalUnits,
          lowStockCount: lowCount,
          outOfStockCount: outCount
        });
      }
    } catch (e) {
      console.error("Failed to load products in ProductTable:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (merchantId) {
      loadProducts();
    }
  }, [merchantId, refreshTrigger]);

  // Unique categories for dropdown
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered & Sorted products
  const processedProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchSku = p.productCode?.toLowerCase().includes(q) || p.sizes?.some(s => s.productCode?.toLowerCase().includes(q));
          const matchBrand = p.brand?.toLowerCase().includes(q);
          const matchCat = p.category?.toLowerCase().includes(q) || p.subCategory?.toLowerCase().includes(q);
          const matchColor = p.color?.name?.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchBrand && !matchCat && !matchColor) {
            return false;
          }
        }

        // Category filter
        if (categoryFilter !== "ALL" && p.category !== categoryFilter) {
          return false;
        }

        // Status filter
        const totalStock = p.sizes?.reduce((sum, sz) => sum + (sz.stock || 0), 0) || 0;
        if (statusFilter === "IN_STOCK" && totalStock <= 0) return false;
        if (statusFilter === "LOW_STOCK" && (totalStock <= 0 || totalStock > 5)) return false;
        if (statusFilter === "OUT_OF_STOCK" && totalStock > 0) return false;
        if (statusFilter === "ACTIVE" && !p.isActive) return false;
        if (statusFilter === "INACTIVE" && p.isActive) return false;

        return true;
      })
      .sort((a, b) => {
        const stockA = a.sizes?.reduce((sum, sz) => sum + (sz.stock || 0), 0) || 0;
        const stockB = b.sizes?.reduce((sum, sz) => sum + (sz.stock || 0), 0) || 0;

        switch (sortBy) {
          case "NAME_ASC":
            return (a.name || "").localeCompare(b.name || "");
          case "STOCK_DESC":
            return stockB - stockA;
          case "STOCK_ASC":
            return stockA - stockB;
          case "PRICE_DESC":
            return (b.price || 0) - (a.price || 0);
          case "PRICE_ASC":
            return (a.price || 0) - (b.price || 0);
          case "NEWEST":
          default:
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
      });
  }, [products, searchQuery, categoryFilter, statusFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(processedProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedProducts.slice(start, start + pageSize);
  }, [processedProducts, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter, sortBy, pageSize]);

  const handleCopySku = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleEdit = (id: string) => navigate(`/merchant/edit/${id}`);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id && p.styleGroupId !== id));
      alert("Product deleted successfully");
    } catch (e: any) {
      alert("Failed to delete product: " + (e.response?.data?.message || e.message));
    }
  };

  // Open Quick Stock Modal for a product
  const handleOpenQuickStock = (product: Product, _targetSizeId?: string) => {
    setQuickStockProduct(product);
    const initialMap: Record<string, number> = {};
    product.sizes?.forEach((sz) => {
      initialMap[sz._id] = sz.stock || 0;
    });
    setQuickStockForm(initialMap);
    setQuickStockSuccess(false);
  };

  // Save Quick Stock changes
  const handleSaveQuickStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStockProduct) return;

    try {
      setSavingQuickStock(true);
      const prodId = quickStockProduct.styleGroupId || quickStockProduct.id;

      // Update every size that has changed
      for (const sz of quickStockProduct.sizes || []) {
        const newStock = quickStockForm[sz._id];
        if (newStock !== undefined && newStock !== sz.stock) {
          await updateSingleSizeStock(prodId, "any", sz._id, newStock);
        }
      }

      // Update local state immediately
      setProducts((prev) =>
        prev.map((p) => {
          const matchId = p.styleGroupId || p.id;
          if (matchId === prodId) {
            return {
              ...p,
              sizes: p.sizes?.map((sz) => ({
                ...sz,
                stock: quickStockForm[sz._id] ?? sz.stock
              }))
            };
          }
          return p;
        })
      );

      setQuickStockSuccess(true);
      setTimeout(() => {
        setQuickStockProduct(null);
        setQuickStockSuccess(false);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to update stock:", err);
      alert("Failed to update stock: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingQuickStock(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-24" style={{ minHeight: "320px" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-500" size={36} />
          <p style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>Loading catalog inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Search, Filter & View Controls Bar ── */}
      <div className="card" style={{ padding: "var(--space-4)" }}>
        <div className="flex flex-col gap-3">
          {/* Top Row: Search + Category + Sort */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div
              className="flex items-center flex-1 rounded-lg border px-3 py-2"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-bg)",
                gap: "8px"
              }}
            >
              <Search size={16} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by product name, SKU barcode, brand, color..."
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
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input"
                style={{ fontSize: "12px", padding: "8px 12px", minWidth: "140px" }}
              >
                <option value="ALL">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input"
                style={{ fontSize: "12px", padding: "8px 12px", minWidth: "150px" }}
              >
                <option value="NEWEST">Sort: Newest First</option>
                <option value="NAME_ASC">Sort: Name (A to Z)</option>
                <option value="STOCK_DESC">Sort: Stock (High to Low)</option>
                <option value="STOCK_ASC">Sort: Stock (Low to High)</option>
                <option value="PRICE_DESC">Sort: Price (High to Low)</option>
                <option value="PRICE_ASC">Sort: Price (Low to High)</option>
              </select>
            </div>
          </div>

          {/* Bottom Row: Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "ALL", label: `All (${products.length})` },
                  { key: "IN_STOCK", label: "In Stock" },
                  { key: "LOW_STOCK", label: "Low Stock (≤5)" },
                  { key: "OUT_OF_STOCK", label: "Out of Stock" },
                  { key: "ACTIVE", label: "Active" },
                  { key: "INACTIVE", label: "Inactive" }
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

            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              <span>
                Showing <strong>{processedProducts.length}</strong> of <strong>{products.length}</strong> products
              </span>
              <button
                type="button"
                onClick={() => navigate("/merchant/stock-update")}
                className="btn btn-outline btn-sm flex items-center gap-1.5"
                style={{ fontSize: "11px", padding: "4px 10px", color: "var(--color-primary)" }}
                title="Open dedicated full-screen stock manager"
              >
                <Sliders size={13} />
                Bulk Stock Manager
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Products Table ── */}
      <div className="table-wrapper" style={{ overflowX: "auto", borderRadius: "var(--radius-md)" }}>
        <table className="table w-full" style={{ minWidth: "980px" }}>
          <thead>
            <tr>
              <th style={{ width: "60px" }}>Image</th>
              <th style={{ minWidth: "130px" }}>SKU Code</th>
              <th style={{ minWidth: "200px" }}>Product & Brand</th>
              <th style={{ minWidth: "120px" }}>Category</th>
              <th style={{ minWidth: "220px" }}>Sizes & Stock</th>
              <th style={{ minWidth: "90px" }}>Total Stock</th>
              <th style={{ minWidth: "110px" }}>Price</th>
              <th style={{ minWidth: "80px" }}>Status</th>
              <th style={{ minWidth: "120px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state py-12 text-center space-y-3">
                    <Box size={36} className="mx-auto text-gray-400 opacity-60" />
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
                      No products found matching your current filters.
                    </p>
                    <div className="flex justify-center gap-2">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setSearchQuery("");
                          setCategoryFilter("ALL");
                          setStatusFilter("ALL");
                        }}
                      >
                        Clear Filters
                      </button>
                      <button
                        className="btn btn-primary btn-sm flex items-center gap-1"
                        onClick={() => navigate("/merchant/add-product")}
                      >
                        <Plus size={14} /> Add Product
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => {
                const firstImg = product.images?.[0]?.url || "";
                const totalStock = product.sizes?.reduce((sum, sz) => sum + (sz.stock || 0), 0) || 0;
                const isOutOfStock = totalStock <= 0;
                const isLowStock = totalStock > 0 && totalStock <= 5;
                const discount =
                  product.mrp && product.price && product.mrp > product.price
                    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                    : 0;

                return (
                  <tr key={product.id || product.styleGroupId} className="hover:bg-slate-500/5 transition-colors">
                    {/* Thumbnail */}
                    <td>
                      {firstImg ? (
                        <img
                          src={firstImg}
                          alt={product.name}
                          style={{
                            width: "44px",
                            height: "44px",
                            objectFit: "cover",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--color-border)"
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            background: "var(--color-bg)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--color-text-tertiary)"
                          }}
                        >
                          <Box size={18} />
                        </div>
                      )}
                    </td>

                    {/* SKU Code */}
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "11px",
                            color: "var(--color-text)",
                            background: "var(--color-bg)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid var(--color-border)"
                          }}
                        >
                          {product.productCode || "—"}
                        </span>
                        {product.productCode && (
                          <button
                            type="button"
                            onClick={() => handleCopySku(product.productCode!)}
                            className="btn btn-ghost btn-xs"
                            style={{ padding: "2px", color: "var(--color-text-tertiary)" }}
                            title="Copy SKU Code"
                          >
                            {copiedCode === product.productCode ? (
                              <Check size={12} className="text-green-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        )}
                      </div>
                      {isWarehouse && product.merchant?.shopName && (
                        <div
                          className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          title="Consignment Source Merchant"
                        >
                          From: {product.merchant.shopName}
                        </div>
                      )}
                    </td>

                    {/* Product Name & Brand */}
                    <td>
                      <div 
                        className="font-semibold text-sm truncate cursor-pointer hover:underline" 
                        style={{ color: "var(--color-text)", maxWidth: "240px" }}
                        onClick={() => handleViewDetails(product)}
                        title="Click to view product details"
                      >
                        {product.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "1px" }}>
                        {product.brand ? <span className="font-medium">{product.brand}</span> : "No Brand"}
                        {product.styleName && <span> • {product.styleName}</span>}
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text)" }}>
                        {product.category || "General"}
                      </div>
                      {product.subCategory && (
                        <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>
                          {product.subCategory}
                        </div>
                      )}
                    </td>

                    {/* Sizes & Stock (Interactive Quick Edit) */}
                    <td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {product.sizes && product.sizes.length > 0 ? (
                          product.sizes.map((sz) => {
                            const isSzOut = (sz.stock || 0) <= 0;
                            const isSzLow = (sz.stock || 0) > 0 && (sz.stock || 0) <= 5;
                            return (
                              <button
                                key={sz._id}
                                type="button"
                                onClick={() => handleOpenQuickStock(product, sz._id)}
                                title={`Click to quick-update ${sz.size} stock`}
                                className="group relative px-2 py-0.5 rounded text-xs font-mono font-medium transition-all hover:scale-105"
                                style={{
                                  background: isSzOut
                                    ? "rgba(239, 68, 68, 0.1)"
                                    : isSzLow
                                    ? "rgba(245, 158, 11, 0.1)"
                                    : "rgba(34, 197, 94, 0.1)",
                                  color: isSzOut
                                    ? "var(--color-danger, #ef4444)"
                                    : isSzLow
                                    ? "#d97706"
                                    : "var(--color-success, #22c55e)",
                                  border: `1px solid ${
                                    isSzOut
                                      ? "rgba(239, 68, 68, 0.25)"
                                      : isSzLow
                                      ? "rgba(245, 158, 11, 0.25)"
                                      : "rgba(34, 197, 94, 0.25)"
                                  }`
                                }}
                              >
                                {sz.size}: <span className="font-bold">{sz.stock ?? 0}</span>
                              </button>
                            );
                          })
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
                            No sizes
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickStock(product)}
                          className="btn btn-ghost btn-xs text-blue-500 hover:bg-blue-500/10 p-1"
                          title="Quick update size stock"
                        >
                          <Sliders size={12} />
                        </button>
                      </div>
                    </td>

                    {/* Total Stock */}
                    <td>
                      <span
                        className="px-2 py-1 rounded-md text-xs font-bold font-mono inline-block"
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
                    </td>

                    {/* Price & MRP */}
                    <td>
                      <div className="flex items-baseline gap-1.5">
                        <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--color-text)" }}>
                          ₹{product.price}
                        </span>
                        {product.mrp && product.mrp > product.price && (
                          <span style={{ fontSize: "11px", textDecoration: "line-through", color: "var(--color-text-tertiary)" }}>
                            ₹{product.mrp}
                          </span>
                        )}
                      </div>
                      {discount > 0 && (
                        <span className="text-[10px] text-green-600 font-semibold">{discount}% off</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span
                        className={`badge ${product.isActive ? "badge-success" : "badge-danger"}`}
                        style={{ fontSize: "10px", padding: "2px 6px" }}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td style={{ textAlign: "right" }}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "5px", color: "var(--color-primary)" }}
                          onClick={() => handleOpenQuickStock(product)}
                          title="Quick Stock Editor"
                        >
                          <Sliders size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "5px", color: "var(--color-success)" }}
                          onClick={() => navigate(`/merchant/add-product?copyFrom=${product.id}`)}
                          title="Duplicate SKU (Create variant)"
                        >
                          <Plus size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "5px", color: "var(--color-text)" }}
                          onClick={() => handleViewDetails(product)}
                          title="View Product Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "5px", color: "var(--color-info)" }}
                          onClick={() => handleEdit(product.id)}
                          title="Edit Product Details"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: "5px", color: "var(--color-danger)" }}
                          onClick={() => handleDelete(product.id, product.name)}
                          title="Delete Product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination Controls ── */}
      {processedProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="input"
              style={{ fontSize: "11px", padding: "3px 8px" }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="btn btn-outline btn-sm"
              style={{ padding: "4px 8px" }}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className="btn btn-sm"
                  style={{
                    padding: "4px 10px",
                    background: currentPage === pageNum ? "var(--color-primary)" : "transparent",
                    color: currentPage === pageNum ? "#ffffff" : "var(--color-text)",
                    border: "1px solid var(--color-border)"
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="btn btn-outline btn-sm"
              style={{ padding: "4px 8px" }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Quick Stock Popover / Modal ── */}
      {quickStockProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className="card max-w-md w-full p-5 space-y-4"
            style={{
              background: "var(--color-surface, #ffffff)",
              borderRadius: "var(--radius-lg, 16px)",
              border: "1px solid var(--color-border)"
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2">
                <Sliders className="text-blue-500" size={18} />
                <div>
                  <h3 className="font-bold text-sm truncate" style={{ color: "var(--color-text)", maxWidth: "300px" }}>
                    Update Stock: {quickStockProduct.name}
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    Color: {quickStockProduct.color?.name || "Default"} • SKU: {quickStockProduct.productCode || "—"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickStockProduct(null)}
                className="btn btn-ghost btn-sm"
                style={{ padding: "4px", color: "var(--color-text-secondary)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick stock form */}
            <form onSubmit={handleSaveQuickStock} className="space-y-4">
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {quickStockProduct.sizes && quickStockProduct.sizes.length > 0 ? (
                  quickStockProduct.sizes.map((sz) => {
                    const currentVal = quickStockForm[sz._id] ?? sz.stock ?? 0;
                    return (
                      <div
                        key={sz._id}
                        className="flex items-center justify-between p-2.5 rounded-lg border"
                        style={{
                          background: "var(--color-bg)",
                          borderColor: "var(--color-border)"
                        }}
                      >
                        <div>
                          <span className="font-bold text-xs" style={{ color: "var(--color-text)" }}>
                            Size: {sz.size}
                          </span>
                          {sz.productCode && (
                            <div style={{ fontSize: "9px", color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>
                              {sz.productCode}
                            </div>
                          )}
                        </div>

                        {/* Counter Controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setQuickStockForm((prev) => ({
                                ...prev,
                                [sz._id]: Math.max(0, currentVal - 1)
                              }))
                            }
                            className="w-7 h-7 flex items-center justify-center rounded border bg-white text-gray-700 hover:bg-gray-100 font-bold text-sm"
                            style={{ borderColor: "var(--color-border)" }}
                          >
                            –
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={currentVal}
                            onChange={(e) =>
                              setQuickStockForm((prev) => ({
                                ...prev,
                                [sz._id]: Math.max(0, parseInt(e.target.value) || 0)
                              }))
                            }
                            className="input"
                            style={{
                              width: "56px",
                              padding: "4px",
                              textAlign: "center",
                              fontSize: "13px",
                              fontWeight: 700,
                              fontFamily: "monospace"
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setQuickStockForm((prev) => ({
                                ...prev,
                                [sz._id]: currentVal + 1
                              }))
                            }
                            className="w-7 h-7 flex items-center justify-center rounded border bg-white text-gray-700 hover:bg-gray-100 font-bold text-sm"
                            style={{ borderColor: "var(--color-border)" }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-4">No sizes configured for this product.</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                <button
                  type="button"
                  onClick={() => {
                    const name = quickStockProduct.name;
                    setQuickStockProduct(null);
                    navigate(`/merchant/stock-update?search=${encodeURIComponent(name)}`);
                  }}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Open Full Stock Manager
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickStockProduct(null)}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingQuickStock}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    {savingQuickStock ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : quickStockSuccess ? (
                      <Check size={14} className="text-white" />
                    ) : (
                      <Sliders size={14} />
                    )}
                    {savingQuickStock ? "Saving..." : quickStockSuccess ? "Saved!" : "Save Stock"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedViewProduct(null);
        }}
        product={selectedViewProduct}
        onEdit={(id) => handleEdit(id)}
      />
    </div>
  );
}