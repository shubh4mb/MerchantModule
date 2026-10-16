import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Check,
  Copy,
  Package,
  Tag,
  Layers,
  Edit3,
  Trash2,
  Download,
  Loader2,
  Barcode,
  Eye,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Settings
} from "lucide-react";
import { getBaseProductById, updateSingleSizeStock, updatePrice, deleteVariant } from "../../api/products";
import { useNavigate } from "react-router-dom";
import { getMerchantEnteredSku } from "../../utils/skuUtils";
import { downloadImageFile, downloadMultipleImages } from "../../utils/imageDownloader";

interface SizeStock {
  _id: string;
  size: string;
  sizeCode?: string;
  merchantSizeCode?: string;
  productCode?: string;
  stock: number;
}

interface ProductVariant {
  _id: string;
  color: string | { name?: string; hex?: string };
  mrp: number;
  price: number;
  discount: number;
  images: (string | { public_id?: string; url: string; _id?: string })[];
  sizes: SizeStock[];
}

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  productId?: string;
  onEdit?: (id: string) => void;
  onProductUpdated?: (updatedProduct: any) => void;
  onProductDeleted?: (productId: string) => void;
}

const getImageUrl = (img: any): string => {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img.url) return img.url;
  return "";
};

export default function ProductDetailsModal({
  isOpen,
  onClose,
  product,
  productId: propProductId,
  onEdit,
  onProductUpdated,
  onProductDeleted
}: ProductDetailsModalProps) {
  const navigate = useNavigate();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<string>("");

  // Inline Stock Editing state
  const [editingSizeKey, setEditingSizeKey] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<string>("0");
  const [savingSizeId, setSavingSizeId] = useState<string | null>(null);

  // Inline Price Editing state
  const [editingPriceVarId, setEditingPriceVarId] = useState<string | null>(null);
  const [inlineMrp, setInlineMrp] = useState<string>("");
  const [inlinePrice, setInlinePrice] = useState<string>("");
  const [inlineDiscount, setInlineDiscount] = useState<string>("");
  const [savingPriceVarId, setSavingPriceVarId] = useState<string | null>(null);

  // Fullscreen Image Preview state
  const [previewImageVisible, setPreviewImageVisible] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const effectiveId = propProductId || product?.id || product?.styleGroupId || product?._id;

  useEffect(() => {
    if (!isOpen || !effectiveId) {
      setDetails(null);
      setEditingSizeKey(null);
      setEditingPriceVarId(null);
      setPreviewImageVisible(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await getBaseProductById(effectiveId);
        const data = res?.product || res?.data || res || product;
        setDetails(data);
      } catch (err) {
        console.error("Failed to load product details in modal:", err);
        setDetails(product);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [isOpen, effectiveId, product]);

  // Keyboard navigation for image preview
  useEffect(() => {
    if (!previewImageVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewImageVisible(false);
      } else if (e.key === "ArrowLeft") {
        setPreviewImageIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setPreviewImageIndex((prev) => (prev < allProductImages.length - 1 ? prev + 1 : prev));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImageVisible]);

  if (!isOpen) return null;

  const currentData = details || product || {};
  const prodId = currentData.styleGroupId || currentData.id || currentData._id || effectiveId || "";

  // Normalize variants matching MerchantApp logic
  const variants: ProductVariant[] = useMemo(() => {
    if (Array.isArray(currentData.variants) && currentData.variants.length > 0) {
      return currentData.variants.map((v: any, vIdx: number) => {
        const vSizes: SizeStock[] = Array.isArray(v.sizes) && v.sizes.length > 0
          ? v.sizes.map((s: any) => ({
              _id: s._id || `${v._id || prodId}_${s.size}`,
              size: s.size || "",
              stock: Number(s.stock) || 0,
              sizeCode: s.sizeCode || "",
              merchantSizeCode: s.merchantSizeCode || s.sizeCode || "",
              productCode: s.productCode || currentData.productCode || ""
            }))
          : Array.isArray(currentData.sizes) && currentData.sizes.length > 0
          ? currentData.sizes.map((s: any) => ({
              _id: s._id || `${v._id || prodId}_${s.size}`,
              size: s.size || "",
              stock: Number(s.stock) || 0,
              sizeCode: s.sizeCode || "",
              merchantSizeCode: s.merchantSizeCode || s.sizeCode || "",
              productCode: s.productCode || currentData.productCode || ""
            }))
          : [];

        return {
          _id: v._id || `var_${vIdx}`,
          color: v.color || currentData.color || { name: "Default", hex: "#64748b" },
          price: Number(v.price ?? currentData.price ?? 0),
          mrp: Number(v.mrp ?? currentData.mrp ?? currentData.price ?? 0),
          discount: Number(v.discount ?? currentData.discount ?? 0),
          images: Array.isArray(v.images) && v.images.length > 0 ? v.images : (currentData.images || []),
          sizes: vSizes
        };
      });
    }

    // Fallback: single variant from root properties
    const rootSizes: SizeStock[] = Array.isArray(currentData.sizes) && currentData.sizes.length > 0
      ? currentData.sizes.map((s: any) => ({
          _id: s._id || `${prodId}_${s.size}`,
          size: s.size || "",
          stock: Number(s.stock) || 0,
          sizeCode: s.sizeCode || "",
          merchantSizeCode: s.merchantSizeCode || s.sizeCode || "",
          productCode: s.productCode || currentData.productCode || ""
        }))
      : currentData.size
      ? [{
          _id: currentData._id || prodId,
          size: currentData.size,
          stock: Number(currentData.stock) || 0,
          merchantSizeCode: currentData.merchantSizeCode || "",
          sizeCode: currentData.sizeCode || "",
          productCode: currentData.productCode || ""
        }]
      : [];

    return [{
      _id: currentData._id || "default_var",
      color: currentData.color || { name: "Default", hex: "#64748b" },
      price: Number(currentData.price || 0),
      mrp: Number(currentData.mrp || currentData.price || 0),
      discount: Number(currentData.discount || 0),
      images: currentData.images || [],
      sizes: rootSizes
    }];
  }, [currentData, prodId]);

  // Collect all unique images for full-screen viewer
  const allProductImages = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const addImg = (img: any) => {
      const uri = getImageUrl(img);
      if (uri && !seen.has(uri)) {
        seen.add(uri);
        list.push(uri);
      }
    };

    (currentData.images || []).forEach(addImg);
    variants.forEach((v) => {
      (v.images || []).forEach(addImg);
    });

    return list;
  }, [currentData, variants]);

  const coverImageUri = allProductImages[0] || getImageUrl(currentData.images?.[0]) || "https://placehold.co/400x500?text=No+Image";

  // Aggregated size summary
  const sizeSummaryList = useMemo(() => {
    const sizeStockMap: { [key: string]: number } = {};
    variants.forEach((variant) => {
      (variant.sizes || []).forEach((sz) => {
        const sName = sz.size || "Free";
        const sStock = Number(sz.stock) || 0;
        sizeStockMap[sName] = (sizeStockMap[sName] || 0) + sStock;
      });
    });
    return Object.keys(sizeStockMap).map((sName) => ({
      size: sName,
      stock: sizeStockMap[sName]
    }));
  }, [variants]);

  const totalStock = useMemo(() => {
    return sizeSummaryList.reduce((sum, item) => sum + item.stock, 0);
  }, [sizeSummaryList]);

  const brandName = typeof currentData.brandId === "object"
    ? currentData.brandId?.name
    : (currentData.brand || currentData.soldBy || "No Brand");

  const categoryName = typeof currentData.categoryId === "object"
    ? currentData.categoryId?.name
    : (currentData.category || "General");

  const subCategoryName = typeof currentData.subCategoryId === "object"
    ? currentData.subCategoryId?.name
    : currentData.subCategory;

  const enteredSku = getMerchantEnteredSku(currentData.productCode, currentData.merchantSizeCode, currentData.sizes);
  const displayCode = enteredSku && enteredSku !== "—" ? enteredSku : (currentData.productCode || "");

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleOpenImagePreview = (index: number = 0) => {
    const validIndex = Math.max(0, Math.min(index, Math.max(0, allProductImages.length - 1)));
    setPreviewImageIndex(validIndex);
    setPreviewImageVisible(true);
  };

  // ── Inline Size Stock Update ──
  const handleSaveSingleSize = async (
    variant: ProductVariant,
    sz: SizeStock
  ) => {
    const vId = variant._id;
    const sId = sz._id || `${prodId}_${sz.size}`;
    const newStock = Math.max(0, parseInt(editingStockVal, 10) || 0);
    const sizeKey = `${vId}_${sz._id || sz.size}`;

    setSavingSizeId(sizeKey);
    try {
      await updateSingleSizeStock(prodId, vId, sz.size, newStock);

      // Optimistically update local details state
      setDetails((prev: any) => {
        if (!prev) return prev;
        const updatedVariants = (prev.variants || variants).map((v: any) => {
          if (v._id !== vId) return v;
          const updatedSizes = (v.sizes || []).map((s: any) => {
            if ((s._id && s._id === sz._id) || s.size === sz.size) {
              return { ...s, stock: newStock };
            }
            return s;
          });
          return { ...v, sizes: updatedSizes };
        });

        // Also update root sizes if present
        const updatedRootSizes = (prev.sizes || []).map((s: any) => {
          if ((s._id && s._id === sz._id) || s.size === sz.size) {
            return { ...s, stock: newStock };
          }
          return s;
        });

        const next = { ...prev, variants: updatedVariants, sizes: updatedRootSizes };
        if (onProductUpdated) onProductUpdated(next);
        return next;
      });

      setEditingSizeKey(null);
    } catch (err: any) {
      alert(err.message || "Failed to update size stock");
    } finally {
      setSavingSizeId(null);
    }
  };

  // ── Inline Price Update ──
  const handleSaveInlinePrice = async (variant: ProductVariant) => {
    const varId = variant._id;
    const numMrp = parseFloat(inlineMrp) || 0;
    const numPrice = parseFloat(inlinePrice) || 0;
    const numDiscount = parseFloat(inlineDiscount) || 0;

    if (numPrice <= 0 && numMrp <= 0) {
      alert("Please enter a valid price or MRP");
      return;
    }

    setSavingPriceVarId(varId);
    try {
      const colorVal = typeof variant.color === "object" ? variant.color?.name : variant.color;
      await updatePrice(prodId, varId, {
        mrp: numMrp,
        price: numPrice,
        discount: numDiscount,
        color: colorVal,
        colorName: colorVal,
        styleGroupId: currentData.styleGroupId || prodId
      });

      // Optimistically update local state
      setDetails((prev: any) => {
        if (!prev) return prev;
        const updatedVariants = (prev.variants || variants).map((v: any) => {
          if (v._id !== varId) return v;
          return {
            ...v,
            mrp: numMrp,
            price: numPrice,
            discount: numDiscount
          };
        });

        const isFirstVariant = (prev.variants || variants)?.[0]?._id === varId;
        const next = {
          ...prev,
          variants: updatedVariants,
          price: isFirstVariant ? numPrice : prev.price,
          mrp: isFirstVariant ? numMrp : prev.mrp,
          discount: isFirstVariant ? numDiscount : prev.discount
        };
        if (onProductUpdated) onProductUpdated(next);
        return next;
      });

      setEditingPriceVarId(null);
    } catch (error: any) {
      alert(error.message || "Failed to update pricing");
    } finally {
      setSavingPriceVarId(null);
    }
  };

  // ── Delete Variant ──
  const handleDeleteVariant = async (variantId: string) => {
    if (!window.confirm("Are you sure you want to delete this color variant? This cannot be undone.")) {
      return;
    }
    try {
      await deleteVariant(prodId, variantId);
      setDetails((prev: any) => {
        if (!prev) return prev;
        const updatedVariants = (prev.variants || variants).filter((v: any) => v._id !== variantId);
        const next = { ...prev, variants: updatedVariants };
        if (onProductUpdated) onProductUpdated(next);
        return next;
      });
    } catch (err: any) {
      alert(err.message || "Failed to delete variant");
    }
  };

  // ── Download Helpers ──
  const handleDownloadActiveImage = async () => {
    if (!coverImageUri) return;
    setDownloading(true);
    try {
      const prefix = displayCode || currentData.name || "product";
      const filename = `${prefix}-photo-1.jpg`;
      await downloadImageFile(coverImageUri, filename);
    } catch (e) {
      console.error("Failed to download image", e);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAllImages = async () => {
    if (!allProductImages || allProductImages.length === 0) return;
    setDownloading(true);
    try {
      const prefix = displayCode || currentData.name || "product";
      await downloadMultipleImages(
        allProductImages.map((url) => ({ url })),
        prefix,
        (curr, total) => setDownloadProgress(`${curr}/${total}`)
      );
    } catch (e) {
      console.error("Failed to download images", e);
    } finally {
      setDownloading(false);
      setDownloadProgress("");
    }
  };

  const handleEditClick = () => {
    onClose();
    if (onEdit) {
      onEdit(effectiveId);
    } else {
      navigate(`/merchant/edit/${effectiveId}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-[var(--color-surface, #ffffff)] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[var(--color-border, #e2e8f0)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Top Handle Bar (Mobile-friendly affordance) */}
        <div className="w-full flex justify-center pt-2 pb-1 bg-[var(--color-surface, #ffffff)]">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* ── Modal Header Row (Exact port from MerchantApp) ── */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 border-b border-[var(--color-border, #e2e8f0)] bg-[var(--color-surface, #ffffff)] gap-3">
          {/* Main Photo Thumbnail with Zoom and Counter Badges */}
          <div
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[var(--color-border, #e2e8f0)] bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer group shadow-2xs"
            onClick={() => handleOpenImagePreview(0)}
            title="Click to view large photos"
          >
            <img
              src={coverImageUri}
              alt={currentData.name || "Product"}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Eye size={16} className="text-white drop-shadow-sm" />
            </div>
            {allProductImages.length > 1 && (
              <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-black/75 text-white text-[9px] font-bold">
                {allProductImages.length}
              </span>
            )}
          </div>

          {/* Title, SKU & Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-[var(--color-text)] truncate m-0">
                {brandName}
              </h2>
              {displayCode ? (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold">
                  <Barcode size={12} className="text-slate-500" />
                  <span>{displayCode}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(displayCode);
                    }}
                    className="hover:text-blue-600 transition-colors ml-0.5 cursor-pointer p-0.5"
                    title="Copy SKU code"
                  >
                    {copiedCode ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  </button>
                </div>
              ) : null}
              {currentData.source === "warehouse" || currentData.warehouseId ? (
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-rose-500 text-white shadow-2xs tracking-wider">
                  WH
                </span>
              ) : null}
            </div>

            <div className="text-xs text-[var(--color-text-secondary)] mt-1 truncate">
              {categoryName}
              {subCategoryName ? ` • ${subCategoryName}` : ""}
              {currentData.name && currentData.name !== brandName ? ` • ${currentData.name}` : ""}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 size={32} className="animate-spin text-blue-600" />
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Loading product variants & stock...
              </p>
            </div>
          ) : (
            <>
              {/* ── Stock Overview Strip (Ported from MerchantApp) ── */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--color-border, #e2e8f0)] bg-slate-50 dark:bg-slate-900/40">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                  <Package size={13} className="text-slate-700 dark:text-slate-300" />
                  <span className="text-xs font-black text-[var(--color-text)]">
                    {totalStock} units total
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 py-0.5">
                  {sizeSummaryList.map((item, sIdx) => {
                    const isOut = item.stock <= 0;
                    return (
                      <div
                        key={sIdx}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 border ${
                          isOut
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/40"
                        }`}
                      >
                        <span className="font-extrabold">{item.size}</span>
                        <span>: {item.stock}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Variants & Sizes Breakdown Section ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase">
                    VARIANTS & SIZES ({variants.length})
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Click pencil icon to edit stock or price
                  </span>
                </div>

                {variants.map((variant, vIdx) => {
                  const varId = variant._id || String(vIdx);
                  const colorObj = typeof variant.color === "object"
                    ? variant.color
                    : { name: variant.color || "Default", hex: "#64748b" };
                  const isEditingPrice = editingPriceVarId === varId;

                  return (
                    <div
                      key={varId}
                      className="rounded-xl p-3 sm:p-4 border border-[var(--color-border, #e2e8f0)] bg-[var(--color-surface, #ffffff)] space-y-3 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {/* Variant Top Header: Color & Price */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs shrink-0"
                            style={{ backgroundColor: colorObj.hex || "#3b82f6" }}
                          />
                          <span className="text-xs sm:text-sm font-bold text-[var(--color-text)]">
                            {colorObj.name || "Default Color"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                              ₹{variant.price || 0}
                            </span>
                            {variant.mrp > variant.price && (
                              <span className="text-[11px] text-slate-400 line-through ml-1.5 font-medium">
                                ₹{variant.mrp}
                              </span>
                            )}
                          </div>

                          {/* Price Edit Pen Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditingPrice) {
                                setEditingPriceVarId(null);
                              } else {
                                setEditingPriceVarId(varId);
                                setInlineMrp(variant.mrp != null ? String(variant.mrp) : "");
                                setInlinePrice(variant.price != null ? String(variant.price) : "");
                                setInlineDiscount(variant.discount != null ? String(variant.discount) : "");
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isEditingPrice
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-800"
                            }`}
                            title="Edit Price & MRP"
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Delete Variant Button */}
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(varId)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800 transition-colors cursor-pointer"
                              title="Delete Variant"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ── Inline Price Editing Box (Ported from MerchantApp) ── */}
                      {isEditingPrice && (
                        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                              Edit Price & MRP
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={savingPriceVarId === varId}
                                onClick={() => setEditingPriceVarId(null)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={savingPriceVarId === varId}
                                onClick={() => handleSaveInlinePrice(variant)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-2xs hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                              >
                                {savingPriceVarId === varId ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Check size={12} />
                                )}
                                <span>Save</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                MRP (₹)
                              </label>
                              <input
                                type="number"
                                value={inlineMrp}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
                                  setInlineMrp(val);
                                  const m = parseFloat(val) || 0;
                                  const p = parseFloat(inlinePrice) || 0;
                                  if (m > 0 && p > 0 && m >= p) {
                                    setInlineDiscount(String(Math.round(((m - p) / m) * 100)));
                                  }
                                }}
                                className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[var(--color-text)] outline-none focus:border-blue-500"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Price (₹)
                              </label>
                              <input
                                type="number"
                                value={inlinePrice}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
                                  setInlinePrice(val);
                                  const m = parseFloat(inlineMrp) || 0;
                                  const p = parseFloat(val) || 0;
                                  if (m > 0 && p > 0) {
                                    setInlineDiscount(String(Math.max(0, Math.round(((m - p) / m) * 100))));
                                  }
                                }}
                                className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[var(--color-text)] outline-none focus:border-blue-500"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Disc (%)
                              </label>
                              <input
                                type="number"
                                value={inlineDiscount}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
                                  setInlineDiscount(val);
                                  const m = parseFloat(inlineMrp) || 0;
                                  const d = parseFloat(val) || 0;
                                  if (m > 0 && d >= 0) {
                                    const p = Math.max(0, Math.round(m * (1 - d / 100)));
                                    setInlinePrice(String(p));
                                  }
                                }}
                                className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[var(--color-text)] outline-none focus:border-blue-500"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Variant Photo Strip */}
                      {variant.images && variant.images.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                          {variant.images.map((img, imgIdx) => {
                            const uri = getImageUrl(img);
                            if (!uri) return null;
                            const targetIdx = allProductImages.indexOf(uri);
                            return (
                              <button
                                key={imgIdx}
                                type="button"
                                onClick={() => handleOpenImagePreview(targetIdx >= 0 ? targetIdx : 0)}
                                className="w-12 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 hover:border-blue-500 transition-all cursor-pointer shadow-2xs group"
                              >
                                <img
                                  src={uri}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Sizes & Stock List for this variant */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Sizes & Stock ({variant.sizes?.length || 0}):
                        </span>

                        <div className="space-y-1.5">
                          {(variant.sizes || []).map((sz, szIdx) => {
                            const sizeKey = `${varId}_${sz._id || sz.size}`;
                            const isEditing = editingSizeKey === sizeKey;
                            const isSaving = savingSizeId === sizeKey;
                            const isOutOfStock = sz.stock <= 0;
                            const isLowStock = sz.stock > 0 && sz.stock <= 3;

                            if (isEditing) {
                              return (
                                <div
                                  key={sz._id || szIdx}
                                  className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border-1.5 border-blue-500 gap-2 animate-in fade-in duration-100"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="px-2 py-1 rounded bg-blue-600 text-white font-extrabold text-xs">
                                      {sz.size}
                                    </span>
                                    {sz.merchantSizeCode && (
                                      <span className="text-[10px] text-slate-500 font-mono truncate">
                                        ({sz.merchantSizeCode})
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {/* Decrement Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cur = parseInt(editingStockVal, 10) || 0;
                                        setEditingStockVal(String(Math.max(0, cur - 1)));
                                      }}
                                      className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer active:scale-95"
                                    >
                                      <Minus size={12} />
                                    </button>

                                    {/* Stock Number Input */}
                                    <input
                                      type="number"
                                      value={editingStockVal}
                                      onChange={(e) => setEditingStockVal(e.target.value.replace(/[^0-9]/g, ""))}
                                      className="w-12 h-7 rounded-md bg-white dark:bg-slate-800 border border-blue-500 text-center font-bold text-xs text-[var(--color-text)] outline-none"
                                      autoFocus
                                    />

                                    {/* Increment Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cur = parseInt(editingStockVal, 10) || 0;
                                        setEditingStockVal(String(cur + 1));
                                      }}
                                      className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer active:scale-95"
                                    >
                                      <Plus size={12} />
                                    </button>

                                    {/* Save Button */}
                                    <button
                                      type="button"
                                      disabled={isSaving}
                                      onClick={() => handleSaveSingleSize(variant, sz)}
                                      className="w-7 h-7 rounded-md bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer shadow-2xs disabled:opacity-50"
                                      title="Save stock"
                                    >
                                      {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}
                                    </button>

                                    {/* Cancel Button */}
                                    <button
                                      type="button"
                                      disabled={isSaving}
                                      onClick={() => setEditingSizeKey(null)}
                                      className="w-7 h-7 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-500 flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={sz._id || szIdx}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-xs text-[var(--color-text)]">
                                    {sz.size}
                                  </span>
                                  {sz.merchantSizeCode && (
                                    <span className="text-[10px] text-slate-500 font-mono truncate">
                                      ({sz.merchantSizeCode})
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                      isOutOfStock
                                        ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40"
                                        : isLowStock
                                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/40"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/40"
                                    }`}
                                  >
                                    {isOutOfStock ? "0 in stock" : `${sz.stock} in stock`}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSizeKey(sizeKey);
                                      setEditingStockVal(String(sz.stock ?? 0));
                                    }}
                                    className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-800 transition-colors cursor-pointer"
                                    title="Edit Size Stock"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {(!variant.sizes || variant.sizes.length === 0) && (
                            <p className="text-xs text-slate-400 italic py-1">
                              No sizes configured for this variant
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Category Attributes (Collapsible details) */}
              {currentData.attributes && currentData.attributes.length > 0 && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-[var(--color-border, #e2e8f0)] space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={13} />
                    Category Specifications
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {currentData.attributes.map((attr: any, idx: number) => {
                      const label = attr.name || attr.attributeId?.name || "Attribute";
                      const val = Array.isArray(attr.value) ? attr.value.join(", ") : String(attr.value ?? "—");
                      return (
                        <div key={idx} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 font-medium block truncate">{label}</span>
                          <span className="text-xs font-semibold text-[var(--color-text)] block truncate mt-0.5">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description & Search Tags */}
              {currentData.description && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    Description
                  </span>
                  <p className="text-xs text-[var(--color-text-secondary)] bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-[var(--color-border)] leading-relaxed whitespace-pre-line">
                    {currentData.description}
                  </p>
                </div>
              )}

              {currentData.tags && currentData.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag size={12} className="text-slate-400" />
                  {currentData.tags.map((t: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 border-t border-[var(--color-border, #e2e8f0)] bg-slate-50 dark:bg-slate-900/50 gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadActiveImage}
              disabled={downloading}
              className="btn btn-ghost btn-sm text-xs flex items-center gap-1 border border-slate-300 dark:border-slate-700 py-1.5"
              title="Download photo"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Photo</span>
            </button>
            {allProductImages.length > 1 && (
              <button
                type="button"
                onClick={handleDownloadAllImages}
                disabled={downloading}
                className="btn btn-outline btn-sm text-xs flex items-center gap-1 py-1.5"
                style={{ color: "var(--color-primary)" }}
                title="Download all photos"
              >
                {downloading && downloadProgress ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>{downloadProgress}</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span>All ({allProductImages.length})</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEditClick}
              className="btn btn-secondary btn-sm text-xs font-bold flex items-center gap-1.5 py-1.5"
            >
              <Settings size={13} />
              <span>Edit Full Details</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary btn-sm text-xs font-bold px-4 py-1.5"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Big-Size Image Viewer Modal (Exact port from MerchantApp) ── */}
      {previewImageVisible && allProductImages.length > 0 && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setPreviewImageVisible(false)}
        >
          {/* Header */}
          <div
            className="w-full flex items-center justify-between text-white pb-3 max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageVisible(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close image viewer"
            >
              <X size={20} />
            </button>

            <div className="text-center min-w-0 px-2">
              <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md m-0">
                {brandName}
              </h3>
              {displayCode && (
                <span className="text-[11px] text-slate-300 font-mono">
                  SKU: {displayCode}
                </span>
              )}
            </div>

            <div className="px-2.5 py-1 rounded-full bg-white/15 text-xs font-bold text-white">
              {previewImageIndex + 1} / {allProductImages.length}
            </div>
          </div>

          {/* Main Photo with Nav Buttons */}
          <div
            className="relative flex-1 w-full max-w-4xl flex items-center justify-center overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={allProductImages[previewImageIndex]}
              alt=""
              className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
            />

            {/* Left Nav Arrow */}
            {allProductImages.length > 1 && previewImageIndex > 0 && (
              <button
                type="button"
                onClick={() => setPreviewImageIndex((prev) => Math.max(0, prev - 1))}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white transition-all cursor-pointer backdrop-blur-xs shadow-lg"
                title="Previous photo"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Right Nav Arrow */}
            {allProductImages.length > 1 && previewImageIndex < allProductImages.length - 1 && (
              <button
                type="button"
                onClick={() => setPreviewImageIndex((prev) => Math.min(allProductImages.length - 1, prev + 1))}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white transition-all cursor-pointer backdrop-blur-xs shadow-lg"
                title="Next photo"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {allProductImages.length > 1 && (
            <div
              className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {allProductImages.map((uri, idx) => {
                const isSelected = idx === previewImageIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewImageIndex(idx)}
                    className={`w-12 h-14 sm:w-14 sm:h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? "border-blue-500 scale-105 shadow-md"
                        : "border-white/30 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={uri} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
