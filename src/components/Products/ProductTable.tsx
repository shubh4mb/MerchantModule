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
  Eye,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Ban
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchProductsByMerchantId, deleteProduct, updateSingleSizeStock, updateBatchSizesStock } from "../../api/products";
import { useAuth } from "../../context/AuthContext";
import ProductDetailsModal from "./ProductDetailsModal";
import { getMerchantEnteredSku } from "../../utils/skuUtils";

interface Size {
  size: string;
  stock: number;
  _id: string;
  productCode?: string;
  merchantSizeCode?: string;
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
  variants?: any[];
  productCode?: string;
  merchantSizeCode?: string;
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
  const [subCategoryFilter, setSubCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "ACTIVE" | "INACTIVE">("ALL");
  const [sizeFilter, setSizeFilter] = useState("ALL");
  const [priceRange, setPriceRange] = useState<"ALL" | "UNDER_500" | "500_1000" | "1000_2000" | "ABOVE_2000">("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "NAME_ASC" | "STOCK_DESC" | "STOCK_ASC" | "PRICE_DESC" | "PRICE_ASC">("NEWEST");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [gridCols, setGridCols] = useState<3 | 4 | 5>(4);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

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

  // Mobile Filter Drawer / Modal State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== "ALL") count++;
    if (subCategoryFilter !== "ALL") count++;
    if (statusFilter !== "ALL") count++;
    if (sizeFilter !== "ALL") count++;
    if (priceRange !== "ALL") count++;
    if (sortBy !== "NEWEST") count++;
    if (searchQuery.trim() !== "") count++;
    return count;
  }, [categoryFilter, subCategoryFilter, statusFilter, sizeFilter, priceRange, sortBy, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("ALL");
    setSubCategoryFilter("ALL");
    setStatusFilter("ALL");
    setSizeFilter("ALL");
    setPriceRange("ALL");
    setSortBy("NEWEST");
    setCurrentPage(1);
  };

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
      } else if (Array.isArray(p.variants) && p.variants.length > 0) {
        p.variants.forEach((v: any) => {
          if (Array.isArray(v.sizes)) incomingSizes.push(...v.sizes);
        });
      } else if (p.size) {
        incomingSizes.push({
          _id: p._id || p.id,
          size: p.size,
          stock: p.stock || 0,
          productCode: p.productCode,
          merchantSizeCode: p.merchantSizeCode
        });
      }

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          ...p,
          id: p.styleGroupId || p.id || p._id,
          styleGroupId: p.styleGroupId || p.id || p._id,
          merchantSizeCode: p.merchantSizeCode,
          sizes: incomingSizes,
          variants: p.variants || [],
          images: p.images || []
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
        if ((!existing.images || existing.images.length === 0) && p.images && p.images.length > 0) {
          existing.images = p.images;
        }
        if ((!existing.variants || existing.variants.length === 0) && p.variants && p.variants.length > 0) {
          existing.variants = p.variants;
        }
      }
    });

    return Array.from(map.values());
  };

  // Helper to extract clean merchant-entered display SKU / code
  const getProductDisplayCode = (product: Product | any): string => {
    const allSizes = product.sizes || (product.variants || []).flatMap((v: any) => v.sizes || []);
    const rawDisplay =
      product.merchantSizeCode ||
      product.productSku ||
      product.productCode ||
      product.styleCode;
    const cleanedSku = getMerchantEnteredSku(
      rawDisplay,
      product.merchantSizeCode || product.productSku,
      allSizes
    );
    return cleanedSku && cleanedSku !== "—" ? cleanedSku : (product.productCode || "—");
  };

  // Helper to calculate total stock
  const getProductTotalStock = (product: Product | any): number => {
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes.reduce((sum: number, sz: any) => sum + (Number(sz.stock) || 0), 0);
    }
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.reduce((sum: number, v: any) => {
        return sum + (v.sizes || []).reduce((sSum: number, sz: any) => sSum + (Number(sz.stock) || 0), 0);
      }, 0);
    }
    return Number(product.stock) || 0;
  };

  // Helper to extract aggregated size summary for card badges
  const getDetailSizeSummary = (product: Product | any) => {
    const sizeStockMap: { [key: string]: number } = {};
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      product.sizes.forEach((sz: any) => {
        const sName = sz.size || "Free";
        const sStock = Number(sz.stock) || 0;
        sizeStockMap[sName] = (sizeStockMap[sName] || 0) + sStock;
      });
    } else if (Array.isArray(product.variants) && product.variants.length > 0) {
      product.variants.forEach((v: any) => {
        (v.sizes || []).forEach((sz: any) => {
          const sName = sz.size || "Free";
          const sStock = Number(sz.stock) || 0;
          sizeStockMap[sName] = (sizeStockMap[sName] || 0) + sStock;
        });
      });
    }
    return Object.keys(sizeStockMap).map((sName) => ({
      size: sName,
      stock: sizeStockMap[sName]
    }));
  };

  // Helper to safely extract cover image
  const getCoverImage = (product: Product | any): string => {
    const firstImg = product.images?.[0];
    if (firstImg) {
      if (typeof firstImg === "string") return firstImg;
      if (firstImg.url) return firstImg.url;
    }
    const variantImg = product.variants?.[0]?.images?.[0];
    if (variantImg) {
      if (typeof variantImg === "string") return variantImg;
      if (variantImg.url) return variantImg.url;
    }
    return "";
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

  // Helper to safely extract category & subcategory strings
  const getCategoryName = (p: Product | any): string => {
    if (!p) return "";
    const cat = p.category;
    if (typeof cat === "string") return cat.trim();
    if (cat && typeof cat === "object" && cat.name) return String(cat.name).trim();
    if (p.categoryId && typeof p.categoryId === "object" && p.categoryId.name) {
      return String(p.categoryId.name).trim();
    }
    return "";
  };

  const getSubCategoryName = (p: Product | any): string => {
    if (!p) return "";
    const sub = p.subCategory;
    if (typeof sub === "string") return sub.trim();
    if (sub && typeof sub === "object" && sub.name) return String(sub.name).trim();
    if (p.subCategoryId && typeof p.subCategoryId === "object" && p.subCategoryId.name) {
      return String(p.subCategoryId.name).trim();
    }
    return "";
  };

  // Unique categories & item counts
  const { categoriesList, categoryCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = getCategoryName(p);
      if (cat) {
        set.add(cat);
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return {
      categoriesList: Array.from(set).sort(),
      categoryCounts: counts
    };
  }, [products]);

  // Subcategories & counts based on selected category (or across all products if category is ALL)
  const { subCategoriesList, subCategoryCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = getCategoryName(p);
      const sub = getSubCategoryName(p);
      if (!sub) return;

      if (categoryFilter === "ALL" || cat === categoryFilter) {
        set.add(sub);
        counts[sub] = (counts[sub] || 0) + 1;
      }
    });
    return {
      subCategoriesList: Array.from(set).sort(),
      subCategoryCounts: counts
    };
  }, [products, categoryFilter]);

  // Auto-reset subcategory filter if it doesn't belong to the active category
  useEffect(() => {
    if (subCategoryFilter !== "ALL" && !subCategoriesList.includes(subCategoryFilter)) {
      setSubCategoryFilter("ALL");
    }
  }, [categoryFilter, subCategoriesList, subCategoryFilter]);

  // Live status counts
  const statusCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let active = 0;
    let inactive = 0;
    products.forEach((p) => {
      const totalStock = p.sizes?.reduce((sum, sz) => sum + (sz.stock || 0), 0) || 0;
      if (totalStock > 0) inStock++;
      if (totalStock > 0 && totalStock <= 5) lowStock++;
      if (totalStock <= 0) outOfStock++;
      if (p.isActive) active++;
      else inactive++;
    });
    return { inStock, lowStock, outOfStock, active, inactive };
  }, [products]);

  // Available unique sizes across all products
  const availableSizesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.sizes?.forEach((s) => {
        if (s.size && s.size.trim()) {
          set.add(s.size.trim().toUpperCase());
        }
      });
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      const order = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL", "FREE SIZE"];
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [products]);

  // Robust normalized search helpers (handles hyphens, spaces, e.g. "tshirt" matches "T-Shirt")
  const normalizeSearch = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const matchesSearchNormalized = (target: string, query: string): boolean => {
    if (!target || !query) return false;
    const rawTarget = target.toLowerCase();
    const rawQuery = query.toLowerCase().trim();
    if (rawTarget.includes(rawQuery)) return true;

    const normTarget = normalizeSearch(target);
    const normQuery = normalizeSearch(query);
    if (normQuery && normTarget.includes(normQuery)) return true;

    // Plural/singular tolerance (e.g. "tshirts" matches "tshirt", "shirts" matches "shirt")
    if (normQuery.length > 3 && normQuery.endsWith('s')) {
      const stemQuery = normQuery.slice(0, -1);
      if (normTarget.includes(stemQuery)) return true;
    }
    if (normTarget.length > 3 && normTarget.endsWith('s')) {
      const stemTarget = normTarget.slice(0, -1);
      if (normQuery.includes(stemTarget)) return true;
    }

    const words = rawQuery.split(/[\s-_]+/).filter((w) => w.length > 0);
    if (words.length > 1) {
      const allWordsMatch = words.every((w) => {
        const nw = normalizeSearch(w);
        return rawTarget.includes(w) || (nw && normTarget.includes(nw)) || (nw.length > 3 && nw.endsWith('s') && normTarget.includes(nw.slice(0, -1)));
      });
      if (allWordsMatch) return true;
    }

    return false;
  };

  // Instant category & subcategory search suggestions (e.g. typing "tshirt" suggests "T-Shirt")
  const categorySuggestions = useMemo(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return [];
    return categoriesList.filter((cat) => matchesSearchNormalized(cat, q));
  }, [searchQuery, categoriesList]);

  const subCategorySuggestions = useMemo(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return [];
    return subCategoriesList.filter((sub) => matchesSearchNormalized(sub, q));
  }, [searchQuery, subCategoriesList]);

  // Filtered & Sorted products
  const processedProducts = useMemo(() => {
    return products
      .filter((p) => {
        const prodCat = getCategoryName(p);
        const prodSubCat = getSubCategoryName(p);

        // Search filter with hyphen & space tolerance
        if (searchQuery.trim()) {
          const q = searchQuery.trim();
          const enteredSku = getMerchantEnteredSku(p.productCode, p.merchantSizeCode, p.sizes);
          const allSkuStrings = [
            enteredSku,
            p.productCode,
            ...(p.sizes || []).map((s) => s.productCode),
            ...(p.sizes || []).map((s) => s.merchantSizeCode)
          ].filter(Boolean).join(" ");

          const matchName = matchesSearchNormalized(p.name, q) || matchesSearchNormalized(p.styleName || "", q);
          const matchSku = matchesSearchNormalized(allSkuStrings, q);
          const matchBrand = matchesSearchNormalized(p.brand, q);
          const matchCat = matchesSearchNormalized(prodCat, q) || matchesSearchNormalized(prodSubCat, q);
          const matchColor = matchesSearchNormalized(p.color?.name || "", q);

          if (!matchName && !matchSku && !matchBrand && !matchCat && !matchColor) {
            return false;
          }
        }

        // Category filter
        if (categoryFilter !== "ALL" && prodCat !== categoryFilter) {
          return false;
        }

        // SubCategory filter
        if (subCategoryFilter !== "ALL" && prodSubCat !== subCategoryFilter) {
          return false;
        }

        // Status filter
        const totalStock = p.sizes?.reduce((sum, sz) => sum + (sz.stock || 0), 0) || 0;
        if (statusFilter === "IN_STOCK" && totalStock <= 0) return false;
        if (statusFilter === "LOW_STOCK" && (totalStock <= 0 || totalStock > 5)) return false;
        if (statusFilter === "OUT_OF_STOCK" && totalStock > 0) return false;
        if (statusFilter === "ACTIVE" && !p.isActive) return false;
        if (statusFilter === "INACTIVE" && p.isActive) return false;

        // Size filter
        if (sizeFilter !== "ALL") {
          const hasSize = p.sizes?.some(
            (s) => s.size?.trim().toUpperCase() === sizeFilter.toUpperCase()
          );
          if (!hasSize) return false;
        }

        // Price range filter
        if (priceRange !== "ALL") {
          const pr = p.price || 0;
          if (priceRange === "UNDER_500" && pr >= 500) return false;
          if (priceRange === "500_1000" && (pr < 500 || pr > 1000)) return false;
          if (priceRange === "1000_2000" && (pr < 1000 || pr > 2000)) return false;
          if (priceRange === "ABOVE_2000" && pr <= 2000) return false;
        }

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
  }, [products, searchQuery, categoryFilter, subCategoryFilter, statusFilter, sizeFilter, priceRange, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(processedProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedProducts.slice(start, start + pageSize);
  }, [processedProducts, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, subCategoryFilter, statusFilter, sizeFilter, priceRange, sortBy, pageSize]);

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
    const prodAny = product as any;
    const effectiveSizes: Size[] = (product.sizes && product.sizes.length > 0)
      ? product.sizes
      : (prodAny.variants && prodAny.variants.length > 0)
        ? prodAny.variants.flatMap((v: any) => v.sizes || [])
        : prodAny.size
          ? [{ _id: product.id || prodAny._id, size: prodAny.size, stock: prodAny.stock || 0 }]
          : [];

    setQuickStockProduct({
      ...product,
      sizes: effectiveSizes
    });

    const initialMap: Record<string, number> = {};
    effectiveSizes.forEach((sz) => {
      initialMap[sz._id] = sz.stock || 0;
    });
    setQuickStockForm(initialMap);
    setQuickStockSuccess(false);
  };

  // 1-click Set Out of Stock (zero all sizes)
  const handleSetAllOutOfStock = () => {
    if (!quickStockProduct) return;
    const zeroMap: Record<string, number> = {};
    (quickStockProduct.sizes || []).forEach((sz) => {
      zeroMap[sz._id] = 0;
    });
    setQuickStockForm(zeroMap);
  };

  // Save Quick Stock changes
  const handleSaveQuickStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStockProduct) return;

    try {
      setSavingQuickStock(true);
      const prodId = quickStockProduct.styleGroupId || quickStockProduct.id;

      // Identify changed sizes
      const changedSizes = (quickStockProduct.sizes || []).filter((sz) => {
        const newStock = quickStockForm[sz._id];
        return newStock !== undefined && newStock !== sz.stock;
      });

      if (changedSizes.length === 0) {
        setQuickStockProduct(null);
        return;
      }

      const updates = changedSizes.map((sz) => ({
        productId: prodId,
        sizeId: sz._id,
        stock: quickStockForm[sz._id]
      }));

      try {
        await updateBatchSizesStock(updates);
      } catch (batchErr) {
        console.warn("Batch size stock update failed, falling back to sequential:", batchErr);
        for (const u of updates) {
          await updateSingleSizeStock(prodId, "any", u.sizeId, u.stock);
        }
      }

      // Update local state immediately
      setProducts((prev) =>
        prev.map((p) => {
          const matchId = p.styleGroupId || p.id;
          if (matchId === prodId || p.styleGroupId === prodId || p.id === prodId || (p as any)._id === prodId) {
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
      <div className="card" style={{ padding: "var(--space-3) var(--space-4)" }}>
        <div className="flex flex-col gap-3">
          {/* Top Row: Search + Accessible Filter Button + Desktop Selects */}
          <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center justify-between">
            {/* Search Input + Prominent Filter Button */}
            <div className="flex items-center gap-2 flex-1">
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
                  placeholder="Search SKU or products..."
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

              {/* Easily Accessible Filter Button */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className="btn btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs font-bold shrink-0 shadow-2xs"
                style={{
                  borderColor: activeFilterCount > 0 ? "var(--color-primary)" : "var(--color-border)",
                  color: activeFilterCount > 0 ? "var(--color-primary)" : "var(--color-text)",
                  background: activeFilterCount > 0 ? "rgba(59, 130, 246, 0.08)" : undefined
                }}
                title="Open Advanced Filters"
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center -mr-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop Quick Category + Subcategory + Sort Selects (hidden on mobile, managed in Filter Modal) */}
            <div className="hidden md:flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubCategoryFilter("ALL");
                }}
                className="input"
                style={{ fontSize: "12px", padding: "8px 10px", minWidth: "125px" }}
              >
                <option value="ALL">All Categories ({products.length})</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({categoryCounts[cat] || 0})
                  </option>
                ))}
              </select>

              <select
                value={subCategoryFilter}
                onChange={(e) => setSubCategoryFilter(e.target.value)}
                className="input"
                style={{ fontSize: "12px", padding: "8px 10px", minWidth: "140px" }}
                disabled={subCategoriesList.length === 0}
              >
                <option value="ALL">
                  {categoryFilter === "ALL"
                    ? `All Subcategories (${products.length})`
                    : `All ${categoryFilter} (${categoryCounts[categoryFilter] || 0})`}
                </option>
                {subCategoriesList.map((subCat) => (
                  <option key={subCat} value={subCat}>
                    {subCat} ({subCategoryCounts[subCat] || 0})
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input"
                style={{ fontSize: "12px", padding: "8px 10px", minWidth: "130px" }}
              >
                <option value="NEWEST">Sort: Newest</option>
                <option value="NAME_ASC">Sort: Name (A-Z)</option>
                <option value="STOCK_DESC">Sort: Stock (High-Low)</option>
                <option value="STOCK_ASC">Sort: Stock (Low-High)</option>
                <option value="PRICE_DESC">Sort: Price (High-Low)</option>
                <option value="PRICE_ASC">Sort: Price (Low-High)</option>
              </select>
            </div>
          </div>

          {/* Quick Category & Subcategory Suggestion Strip during Search */}
          {searchQuery.trim().length >= 2 && (categorySuggestions.length > 0 || subCategorySuggestions.length > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap px-2.5 py-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 text-xs animate-in fade-in duration-200">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1 shrink-0">
                <Box size={13} className="text-blue-600 dark:text-blue-400" /> Suggested Category:
              </span>
              {categorySuggestions.map((cat) => (
                <button
                  key={`cat-sug-${cat}`}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(cat);
                    setSubCategoryFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                  title={`Filter products by ${cat}`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-extrabold">
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              ))}
              {subCategorySuggestions.map((sub) => {
                const parentOfSub = products.find((p) => getSubCategoryName(p) === sub);
                const pCat = parentOfSub ? getCategoryName(parentOfSub) : "ALL";
                return (
                  <button
                    key={`sub-sug-${sub}`}
                    type="button"
                    onClick={() => {
                      if (pCat && pCat !== "ALL") setCategoryFilter(pCat);
                      setSubCategoryFilter(sub);
                      setSearchQuery("");
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer shadow-2xs"
                    title={`Filter products by subcategory ${sub}`}
                  >
                    <span>Sub: {sub}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-extrabold">
                      {subCategoryCounts[sub] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom Row: Status Filter Tabs + View Mode Toggle + Shortcuts */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar flex-nowrap">
              {(
                [
                  { key: "ALL", label: `All (${products.length})` },
                  { key: "IN_STOCK", label: "In Stock" },
                  { key: "LOW_STOCK", label: "Low (≤5)" },
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
                    className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0"
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

            {/* Right Controls: View Switcher & Stock Manager Shortcut */}
            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
              {/* Density / View Toggle (Ported from MerchantApp) */}
              <div
                className="flex items-center rounded-lg border p-0.5"
                style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("cards");
                    setGridCols(3);
                  }}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-all border-0 cursor-pointer ${
                    viewMode === "cards" && gridCols === 3
                      ? "bg-[var(--color-primary)] text-white shadow-2xs"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}
                  title="3 Columns"
                >
                  3 Col
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("cards");
                    setGridCols(4);
                  }}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-all border-0 cursor-pointer ${
                    viewMode === "cards" && gridCols === 4
                      ? "bg-[var(--color-primary)] text-white shadow-2xs"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}
                  title="4 Columns (Default)"
                >
                  4 Col
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("cards");
                    setGridCols(5);
                  }}
                  className={`hidden lg:block px-2 py-1 rounded text-xs font-semibold transition-all border-0 cursor-pointer ${
                    viewMode === "cards" && gridCols === 5
                      ? "bg-[var(--color-primary)] text-white shadow-2xs"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}
                  title="5 Columns (Compact Grid)"
                >
                  5 Col
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all border-0 cursor-pointer ${
                    viewMode === "table"
                      ? "bg-[var(--color-primary)] text-white shadow-2xs"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}
                  title="Table View"
                >
                  <List size={13} />
                  <span>Table</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate("/merchant/stock-update")}
                className="btn btn-outline btn-sm flex items-center gap-1.5 whitespace-nowrap"
                style={{ fontSize: "11px", padding: "4px 8px", color: "var(--color-primary)" }}
                title="Open dedicated full-screen stock manager"
              >
                <Sliders size={13} />
                <span>Quick Manager</span>
              </button>
            </div>
          </div>

          {/* Quick Subcategory Pills Row (Visible when subcategories exist) */}
          {subCategoriesList.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar flex-nowrap pt-2 border-t border-[var(--color-border)]/50">
              <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider shrink-0 mr-0.5">
                {categoryFilter !== "ALL" ? `${categoryFilter}:` : "Subcategory:"}
              </span>
              <button
                type="button"
                onClick={() => setSubCategoryFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  subCategoryFilter === "ALL"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400"
                }`}
              >
                All ({categoryFilter === "ALL" ? products.length : (categoryCounts[categoryFilter] || 0)})
              </button>
              {subCategoriesList.map((subCat) => {
                const isSel = subCategoryFilter === subCat;
                const count = subCategoryCounts[subCat] || 0;
                return (
                  <button
                    key={subCat}
                    type="button"
                    onClick={() => setSubCategoryFilter(subCat)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSel
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400"
                    }`}
                  >
                    <span>{subCat}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSel ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-800 text-[var(--color-text-tertiary)]"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Active Filters Bar (Quick Dismiss Chips) ── */}
      {activeFilterCount > 0 && (
        <div 
          className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mr-1">
            Active:
          </span>
          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 font-semibold">
              Search: "{searchQuery}"
              <button 
                type="button" 
                onClick={() => setSearchQuery("")} 
                className="hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer ml-0.5"
                title="Clear search"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {categoryFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 font-semibold">
              Category: {categoryFilter}
              <button 
                type="button" 
                onClick={() => { setCategoryFilter("ALL"); setSubCategoryFilter("ALL"); }} 
                className="hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer ml-0.5"
                title="Clear category filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {subCategoryFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 font-semibold">
              Subcategory: {subCategoryFilter}
              <button 
                type="button" 
                onClick={() => setSubCategoryFilter("ALL")} 
                className="hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer ml-0.5"
                title="Clear subcategory filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {statusFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 font-semibold">
              Status: {
                statusFilter === "IN_STOCK" ? "In Stock" :
                statusFilter === "LOW_STOCK" ? "Low Stock (≤5)" :
                statusFilter === "OUT_OF_STOCK" ? "Out of Stock" :
                statusFilter === "ACTIVE" ? "Active" : "Inactive"
              }
              <button 
                type="button" 
                onClick={() => setStatusFilter("ALL")} 
                className="hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer ml-0.5"
                title="Clear status filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {sizeFilter !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 font-semibold">
              Size: {sizeFilter}
              <button 
                type="button" 
                onClick={() => setSizeFilter("ALL")} 
                className="hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer ml-0.5"
                title="Clear size filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {priceRange !== "ALL" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 font-semibold">
              Price: {
                priceRange === "UNDER_500" ? "< ₹500" :
                priceRange === "500_1000" ? "₹500 - ₹1k" :
                priceRange === "1000_2000" ? "₹1k - ₹2k" : "> ₹2k"
              }
              <button 
                type="button" 
                onClick={() => setPriceRange("ALL")} 
                className="hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer ml-0.5"
                title="Clear price filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {sortBy !== "NEWEST" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 font-semibold">
              Sort: {
                sortBy === "NAME_ASC" ? "Name (A-Z)" :
                sortBy === "STOCK_DESC" ? "Stock: High-Low" :
                sortBy === "STOCK_ASC" ? "Stock: Low-High" :
                sortBy === "PRICE_DESC" ? "Price: High-Low" : "Price: Low-High"
              }
              <button 
                type="button" 
                onClick={() => setSortBy("NEWEST")} 
                className="hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer ml-0.5"
                title="Reset sort order"
              >
                <X size={12} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-rose-500 hover:text-rose-700 hover:underline font-bold ml-auto cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* ── Products Display (Image Preference Cards Grid vs Table) ── */}
      {viewMode === "cards" ? (
        paginatedProducts.length === 0 ? (
          <div className="card empty-state py-12 text-center space-y-3">
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
                  setSubCategoryFilter("ALL");
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
        ) : (
          /* ── Pure Image-Preference Product Grid (Ported from MerchantApp) ── */
          <div
            className={
              gridCols === 3
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2 sm:gap-3.5"
                : gridCols === 5
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-2.5"
                : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3"
            }
          >
            {paginatedProducts.map((product) => {
              const coverImg = getCoverImage(product);
              const displayCode = getProductDisplayCode(product);
              const totalStock = getProductTotalStock(product);
              const sizeSummary = getDetailSizeSummary(product);
              const firstVariant = product.variants?.[0];
              const displayPrice = firstVariant?.price ?? product.price ?? 0;
              const displayMrp = firstVariant?.mrp ?? product.mrp ?? 0;
              const isWh = product.source === "warehouse" || !!product.warehouseId;

              return (
                <div
                  key={product.id || product.styleGroupId}
                  onClick={() => handleViewDetails(product)}
                  className="group relative bg-[var(--color-surface, #ffffff)] rounded-xl border border-[var(--color-border, #e2e8f0)] overflow-hidden shadow-2xs hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer flex flex-col active:scale-[0.99]"
                >
                  {/* 1. Code Bar Above Image */}
                  <div
                    className="bg-[var(--color-surface-hover, #f8fafc)] px-2 py-1 text-center border-b border-[var(--color-border, #e2e8f0)] flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className="text-[10px] sm:text-[11px] font-mono font-extrabold text-[var(--color-text)] truncate flex-1 text-center"
                      title={displayCode}
                    >
                      {displayCode}
                    </span>
                    {displayCode && displayCode !== "—" && (
                      <button
                        type="button"
                        onClick={() => handleCopySku(displayCode)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5 cursor-pointer ml-1"
                        title="Copy SKU Code"
                      >
                        {copiedCode === displayCode ? (
                          <Check size={11} className="text-emerald-500" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    )}
                  </div>

                  {/* 2. Dress / Product Image Container (Aspect 4/5) */}
                  <div className="relative aspect-[4/5] w-full bg-[var(--color-surface-alt, #f1f5f9)] overflow-hidden">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={product.name || "Product"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800">
                        <Box size={24} className="opacity-50 mb-1" />
                        <span className="text-[10px] font-semibold text-slate-400">No Image</span>
                      </div>
                    )}

                    {/* Warehouse Consignment Badge */}
                    {isWh && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white shadow-xs tracking-wider">
                        WH
                      </span>
                    )}

                    {/* Hover Overlay with Eye Quick-View */}
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="px-2.5 py-1 rounded-full bg-white/95 text-slate-900 text-[11px] font-bold shadow-md flex items-center gap-1 backdrop-blur-xs">
                        <Eye size={12} />
                        <span>Quick View</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Stock Bar Directly Below Image */}
                  <div
                    className={`px-2 py-1 text-center font-black text-[10px] sm:text-[11px] tracking-wide border-b ${
                      totalStock === 0
                        ? "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300"
                        : totalStock <= 5
                        ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-300"
                        : "bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-300"
                    }`}
                  >
                    {totalStock === 0 ? "0 Out of stock" : `${totalStock} in stock`}
                  </div>

                  {/* 4. Available Sizes with Stock Below Stock Bar */}
                  <div className="p-1.5 bg-[var(--color-surface)] flex flex-wrap gap-1 items-center justify-center min-h-[30px]">
                    {sizeSummary.length > 0 ? (
                      sizeSummary.map((sz, sIdx) => {
                        const isSzOut = sz.stock <= 0;
                        return (
                          <span
                            key={sIdx}
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                              isSzOut
                                ? "bg-rose-50 text-rose-500 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/30 line-through opacity-75"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {sz.size}:{sz.stock}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">—</span>
                    )}
                  </div>

                  {/* 5. Selling Price Bar */}
                  <div className="px-2.5 py-1.5 border-t border-[var(--color-border, #e2e8f0)] bg-[var(--color-surface-hover, #f8fafc)] flex items-center justify-between mt-auto">
                    <div className="min-w-0 pr-1">
                      <div
                        className="text-[11px] font-bold text-[var(--color-text)] truncate"
                        title={product.brand || product.name}
                      >
                        {product.brand || "Product"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-black text-[var(--color-text)]">
                        ₹{displayPrice}
                      </span>
                      {displayMrp > displayPrice && (
                        <span className="text-[10px] text-slate-400 line-through ml-1 font-medium">
                          ₹{displayMrp}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── Full Desktop Products Table ── */
        <div className="table-wrapper" style={{ overflowX: "auto", borderRadius: "var(--radius-md)" }}>
          <table className="table w-full" style={{ minWidth: "820px" }}>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>Image</th>
                <th style={{ minWidth: "120px" }}>Item ID / SKU</th>
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
                  <td colSpan={8}>
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
                            setSubCategoryFilter("ALL");
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
                          <div
                            className="relative group cursor-pointer inline-block overflow-hidden"
                            onClick={() => handleViewDetails(product)}
                            title={product.brand ? `${product.brand}${product.styleName ? ` • ${product.styleName}` : ''}` : "Click to view product details"}
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--color-border)"
                            }}
                          >
                            <img
                              src={firstImg}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye size={16} className="text-white drop-shadow-sm" />
                            </div>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:border-blue-400 transition-all hover:scale-105"
                            onClick={() => handleViewDetails(product)}
                            title={product.brand ? `${product.brand}${product.styleName ? ` • ${product.styleName}` : ''}` : "Click to view product details"}
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
                        {(() => {
                          const enteredSku = getMerchantEnteredSku(product.productCode, product.merchantSizeCode, product.sizes);
                          return (
                            <div className="flex items-center gap-1.5">
                              <span
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "var(--color-text)",
                                  background: "var(--color-bg)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid var(--color-border)"
                                }}
                                title={product.productCode ? `System Code: ${product.productCode}` : undefined}
                              >
                                {enteredSku}
                              </span>
                              {enteredSku && enteredSku !== "—" && (
                                <button
                                  type="button"
                                  onClick={() => handleCopySku(enteredSku)}
                                  className="btn btn-ghost btn-xs"
                                  style={{ padding: "2px", color: "var(--color-text-tertiary)" }}
                                  title="Copy ID"
                                >
                                  {copiedCode === enteredSku ? (
                                    <Check size={12} className="text-green-500" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                        {isWarehouse && product.merchant?.shopName && (
                          <div
                            className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            title="Consignment Source Merchant"
                          >
                            From: {product.merchant.shopName}
                          </div>
                        )}
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

                      {/* Status Indicator (Simple: no background color) */}
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              product.isActive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
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
      )}

      {/* ── Pagination Controls ── */}
      {processedProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-6 relative z-10">
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="input"
                style={{ fontSize: "11px", padding: "3px 6px" }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span className="font-medium">
              {currentPage} / {totalPages} ({processedProducts.length} items)
            </span>
          </div>

          {/* Desktop Pagination */}
          <div className="hidden sm:flex items-center gap-1.5">
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

          {/* Mobile Simple Pagination */}
          <div className="flex sm:hidden items-center justify-between w-full gap-2 pt-1 border-t" style={{ borderColor: "var(--color-border)" }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="btn btn-outline btn-sm flex-1 flex items-center justify-center gap-1 py-1.5"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            <span className="text-xs font-semibold px-2 text-[var(--color-text)]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="btn btn-outline btn-sm flex-1 flex items-center justify-center gap-1 py-1.5"
            >
              Next <ChevronRight size={15} />
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
                    Update Stock: {quickStockProduct.brand || "Product"}
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    Color: {quickStockProduct.color?.name || "Default"} • ID: {getMerchantEnteredSku(quickStockProduct.productCode, quickStockProduct.merchantSizeCode, quickStockProduct.sizes)}
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
              <div className="flex items-center justify-between pb-1.5 border-b" style={{ borderColor: "var(--color-border)" }}>
                <span className="text-xs font-bold text-[var(--color-text)]">
                  Sizes & Stock
                </span>
                <button
                  type="button"
                  onClick={handleSetAllOutOfStock}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 active:scale-95 transition-all"
                  title="Zero all sizes to immediately mark product out of stock"
                >
                  <Ban size={12} /> Set Out of Stock (0 all)
                </button>
              </div>

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
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setQuickStockForm((prev) => ({
                                ...prev,
                                [sz._id]: Math.max(0, currentVal - 1)
                              }))
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white text-gray-700 hover:bg-gray-100 font-bold text-base cursor-pointer active:bg-gray-200"
                            style={{ borderColor: "var(--color-border)" }}
                            title="Decrease quantity"
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
                              height: "32px",
                              padding: "2px 4px",
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
                            className="w-8 h-8 flex items-center justify-center rounded-lg border bg-white text-gray-700 hover:bg-gray-100 font-bold text-base cursor-pointer active:bg-gray-200"
                            style={{ borderColor: "var(--color-border)" }}
                            title="Increase quantity"
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                <button
                  type="button"
                  onClick={() => {
                    const searchParam = quickStockProduct.brand || getMerchantEnteredSku(quickStockProduct.productCode, quickStockProduct.merchantSizeCode, quickStockProduct.sizes) || "";
                    setQuickStockProduct(null);
                    navigate(`/merchant/stock-update?search=${encodeURIComponent(searchParam)}`);
                  }}
                  className="text-xs text-blue-500 hover:underline flex items-center justify-center sm:justify-start gap-1 py-1"
                >
                  <ExternalLink size={12} /> Open Full Stock Manager
                </button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setQuickStockProduct(null)}
                    className="btn btn-ghost btn-sm flex-1 sm:flex-none justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingQuickStock}
                    className="btn btn-primary btn-sm flex-1 sm:flex-none justify-center flex items-center gap-1.5"
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

      {/* ── Mobile Filter Bottom Sheet / Modal ── */}
      {isFilterModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 p-0 sm:p-4"
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div 
            className="w-full sm:max-w-lg bg-[var(--color-surface)] rounded-t-2xl sm:rounded-2xl border border-[var(--color-border)] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-blue-500" />
                <h3 className="font-bold text-sm sm:text-base text-[var(--color-text)]">Filter & Search Products</h3>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-rose-500 hover:underline font-bold cursor-pointer"
                  >
                    Reset All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Quick Search Input */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                  Instant Search (SKU, Code, Name)
                </label>
                <div 
                  className="flex items-center px-3 py-2 rounded-xl border"
                  style={{
                    background: "var(--color-bg)",
                    borderColor: searchQuery ? "var(--color-primary)" : "var(--color-border)"
                  }}
                >
                  <Search size={15} className="text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by SKU, product code, name, color..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs text-[var(--color-text)] placeholder:text-gray-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Stock Status Selection */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                  Stock Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(
                    [
                      { key: "ALL", label: "All Items", count: products.length },
                      { key: "IN_STOCK", label: "In Stock", count: statusCounts.inStock },
                      { key: "LOW_STOCK", label: "Low Stock (≤5)", count: statusCounts.lowStock },
                      { key: "OUT_OF_STOCK", label: "Out of Stock", count: statusCounts.outOfStock },
                      { key: "ACTIVE", label: "Active Listings", count: statusCounts.active },
                      { key: "INACTIVE", label: "Inactive Listings", count: statusCounts.inactive }
                    ] as const
                  ).map((st) => {
                    const isSel = statusFilter === st.key;
                    return (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => { setStatusFilter(st.key); setCurrentPage(1); }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSel
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400"
                        }`}
                      >
                        <span className="truncate mr-1 text-[11px] sm:text-xs">{st.label}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isSel ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-800 text-[var(--color-text-tertiary)]"
                        }`}>
                          {st.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Category
                  </label>
                  {categoryFilter !== "ALL" && (
                    <button
                      type="button"
                      onClick={() => { setCategoryFilter("ALL"); setSubCategoryFilter("ALL"); }}
                      className="text-[11px] text-blue-500 hover:underline font-semibold cursor-pointer"
                    >
                      Reset Category
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => { setCategoryFilter("ALL"); setSubCategoryFilter("ALL"); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      categoryFilter === "ALL"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400"
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {categoriesList.map((cat) => {
                    const isSel = categoryFilter === cat;
                    const catCount = categoryCounts[cat] || 0;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategoryFilter(cat);
                          if (cat !== categoryFilter) setSubCategoryFilter("ALL");
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSel
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400"
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isSel ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-800 text-[var(--color-text-tertiary)]"
                        }`}>
                          {catCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subcategory Filter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Subcategory {categoryFilter !== "ALL" ? `(${categoryFilter})` : ""}
                  </label>
                  {subCategoryFilter !== "ALL" && (
                    <button
                      type="button"
                      onClick={() => setSubCategoryFilter("ALL")}
                      className="text-[11px] text-blue-500 hover:underline font-semibold cursor-pointer"
                    >
                      Reset Subcategory
                    </button>
                  )}
                </div>
                {subCategoriesList.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-tertiary)] italic py-1">
                    No subcategories available{categoryFilter !== "ALL" ? ` for ${categoryFilter}` : ""}.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => { setSubCategoryFilter("ALL"); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        subCategoryFilter === "ALL"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400"
                      }`}
                    >
                      All ({categoryFilter === "ALL" ? products.length : (categoryCounts[categoryFilter] || 0)})
                    </button>
                    {subCategoriesList.map((subCat) => {
                      const isSel = subCategoryFilter === subCat;
                      const subCount = subCategoryCounts[subCat] || 0;
                      return (
                        <button
                          key={subCat}
                          type="button"
                          onClick={() => { setSubCategoryFilter(subCat); setCurrentPage(1); }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSel
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400"
                          }`}
                        >
                          <span>{subCat}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            isSel ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-800 text-[var(--color-text-tertiary)]"
                          }`}>
                            {subCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Size Filter */}
              {availableSizesList.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                      Available Size
                    </label>
                    {sizeFilter !== "ALL" && (
                      <button
                        type="button"
                        onClick={() => setSizeFilter("ALL")}
                        className="text-[11px] text-blue-500 hover:underline font-semibold cursor-pointer"
                      >
                        Reset Size
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    <button
                      type="button"
                      onClick={() => { setSizeFilter("ALL"); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sizeFilter === "ALL"
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400"
                      }`}
                    >
                      All Sizes
                    </button>
                    {availableSizesList.map((sz) => {
                      const isSel = sizeFilter === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => { setSizeFilter(sz); setCurrentPage(1); }}
                          className={`min-w-8 px-2 py-1 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                            isSel
                              ? "bg-blue-600 text-white shadow-xs font-bold"
                              : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400"
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price Range Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                  Price Range
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { key: "ALL", label: "All Prices" },
                      { key: "UNDER_500", label: "Under ₹500" },
                      { key: "500_1000", label: "₹500 – ₹1,000" },
                      { key: "1000_2000", label: "₹1,000 – ₹2,000" },
                      { key: "ABOVE_2000", label: "Above ₹2,000" }
                    ] as const
                  ).map((pr) => {
                    const isSel = priceRange === pr.key;
                    return (
                      <button
                        key={pr.key}
                        type="button"
                        onClick={() => { setPriceRange(pr.key); setCurrentPage(1); }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSel
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400"
                        }`}
                      >
                        {pr.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                  Sort Order
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { key: "NEWEST", label: "Newest First" },
                      { key: "NAME_ASC", label: "Alphabetical (A-Z)" },
                      { key: "STOCK_DESC", label: "Stock: High to Low" },
                      { key: "STOCK_ASC", label: "Stock: Low to High" },
                      { key: "PRICE_DESC", label: "Price: High to Low" },
                      { key: "PRICE_ASC", label: "Price: Low to High" }
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => { setSortBy(s.key); setCurrentPage(1); }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        sortBy === s.key
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-gray-400"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer with Apply button */}
            <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-ghost btn-sm flex-1 text-xs"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="btn btn-primary btn-sm flex-2 font-bold text-xs py-2.5 justify-center shadow-md active:scale-98 transition-transform"
              >
                {processedProducts.length === 0
                  ? "0 Products (Adjust filters)"
                  : `Show ${processedProducts.length} ${processedProducts.length === 1 ? "Product" : "Products"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Details Modal (Ported to MerchantApp style) ── */}
      <ProductDetailsModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedViewProduct(null);
        }}
        product={selectedViewProduct}
        onEdit={(id) => handleEdit(id)}
        onProductUpdated={(updatedProd) => {
          setProducts((prev) =>
            prev.map((p) => {
              const pId = p.id || p.styleGroupId || (p as any)._id;
              const uId = updatedProd.id || updatedProd.styleGroupId || updatedProd._id;
              if (pId === uId) {
                return {
                  ...p,
                  ...updatedProd,
                  sizes: updatedProd.sizes || p.sizes,
                  variants: updatedProd.variants || p.variants,
                  price: updatedProd.price ?? p.price,
                  mrp: updatedProd.mrp ?? p.mrp
                };
              }
              return p;
            })
          );
        }}
        onProductDeleted={(deletedId) => {
          setProducts((prev) => prev.filter((p) => (p.id || p.styleGroupId || (p as any)._id) !== deletedId));
          setShowViewModal(false);
          setSelectedViewProduct(null);
        }}
      />
    </div>
  );
}