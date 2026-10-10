import { useState, useEffect } from 'react';
import { 
  X, Check, Copy, Package, Tag, Layers, 
  Edit, Download, Loader2
} from 'lucide-react';
import { getBaseProductById } from '../../api/products';
import { useNavigate } from 'react-router-dom';
import { getMerchantEnteredSku } from '../../utils/skuUtils';
import { downloadImageFile, downloadMultipleImages } from '../../utils/imageDownloader';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  productId?: string;
  onEdit?: (id: string) => void;
}

export default function ProductDetailsModal({
  isOpen,
  onClose,
  product,
  productId: propProductId,
  onEdit,
}: ProductDetailsModalProps) {
  const navigate = useNavigate();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  const effectiveId = propProductId || product?.id || product?.styleGroupId || product?._id;

  useEffect(() => {
    if (!isOpen || !effectiveId) {
      setDetails(null);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await getBaseProductById(effectiveId);
        const data = res?.product || res?.data || res || product;
        setDetails(data);
        setSelectedColorIndex(0);
        setActiveImageIndex(0);
      } catch (err) {
        console.error("Failed to load product details in modal:", err);
        setDetails(product);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [isOpen, effectiveId, product]);

  if (!isOpen) return null;

  const currentData = details || product || {};

  // Formulate color variants list
  const variants = (currentData.variants && currentData.variants.length > 0)
    ? currentData.variants
    : [
        {
          _id: currentData._id,
          color: currentData.color || { name: 'Default', hex: '#64748b' },
          price: currentData.price || 0,
          mrp: currentData.mrp || currentData.price || 0,
          discount: currentData.discount || 0,
          images: currentData.images || [],
          sizes: currentData.sizes || []
        }
      ];

  const currentVariant = variants[selectedColorIndex] || variants[0] || {};
  const currentImages = (currentVariant.images && currentVariant.images.length > 0)
    ? currentVariant.images
    : (currentData.images && currentData.images.length > 0 ? currentData.images : []);

  const activeImage = currentImages[activeImageIndex]?.url || currentImages[0]?.url || "https://placehold.co/400x500?text=No+Image";

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const brandName = typeof currentData.brandId === 'object' ? currentData.brandId?.name : (currentData.brand || currentData.soldBy || 'No Brand');
  const categoryName = typeof currentData.categoryId === 'object' ? currentData.categoryId?.name : (currentData.category || 'General');
  const subCategoryName = typeof currentData.subCategoryId === 'object' ? currentData.subCategoryId?.name : currentData.subCategory;

  const totalStock = variants.reduce((sum: number, v: any) => {
    return sum + (v.sizes || []).reduce((sSum: number, sz: any) => sSum + (Number(sz.stock) || 0), 0);
  }, 0);

  const handleDownloadActiveImage = async () => {
    if (!activeImage) return;
    setDownloading(true);
    try {
      const enteredSku = getMerchantEnteredSku(currentData.productCode, currentData.merchantSizeCode, currentData.sizes);
      const prefix = enteredSku && enteredSku !== '—' ? enteredSku : (currentData.name || 'product');
      const filename = `${prefix}-color-${selectedColorIndex + 1}-img-${activeImageIndex + 1}.jpg`;
      await downloadImageFile(activeImage, filename);
    } catch (e) {
      console.error("Failed to download image", e);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAllImages = async () => {
    if (!currentImages || currentImages.length === 0) return;
    setDownloading(true);
    try {
      const enteredSku = getMerchantEnteredSku(currentData.productCode, currentData.merchantSizeCode, currentData.sizes);
      const prefix = enteredSku && enteredSku !== '—' ? enteredSku : (currentData.name || 'product');
      const baseName = `${prefix}-color-${selectedColorIndex + 1}`;
      await downloadMultipleImages(currentImages, baseName, (curr, total) => {
        setDownloadProgress(`${curr}/${total}`);
      });
    } catch (e) {
      console.error("Failed to download images", e);
    } finally {
      setDownloading(false);
      setDownloadProgress('');
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
        className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] bg-[var(--color-surface)] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[var(--color-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3 sm:px-6 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] shrink-0">
              <Package size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-[var(--color-text)] truncate max-w-[200px] sm:max-w-md" title={currentData.name}>
                  {currentData.name || 'Product Details'}
                </h2>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold rounded-full border ${
                    currentData.isActive 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    {currentData.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {currentData.source === 'warehouse' && (
                    <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Warehouse
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5 flex-wrap">
                <span className="font-mono truncate max-w-[120px] sm:max-w-none">SKU: {effectiveId}</span>
                <button 
                  onClick={() => handleCopy(effectiveId)}
                  className="hover:text-[var(--color-text)] transition-colors p-0.5"
                  title="Copy Product ID"
                >
                  {copiedCode ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
                {(() => {
                  const enteredSku = getMerchantEnteredSku(currentData.productCode, currentData.merchantSizeCode, currentData.sizes);
                  if (!enteredSku || enteredSku === '—') return null;
                  return (
                    <>
                      <span>•</span>
                      <span className="font-mono truncate max-w-[140px] sm:max-w-none" title={currentData.productCode ? `System Code: ${currentData.productCode}` : undefined}>
                        SKU: {enteredSku}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] rounded-xl transition-colors shrink-0"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[var(--color-text-secondary)] font-medium">Loading full product details...</p>
            </div>
          ) : (
            <>
              {/* Top Section: Media & Commercials Overview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Media Gallery (5 cols) */}
                <div className="md:col-span-5 space-y-3">
                  <div className="relative aspect-[4/5] bg-[var(--color-surface-alt)] rounded-xl border border-[var(--color-border)] overflow-hidden flex items-center justify-center group">
                    <img 
                      src={activeImage} 
                      alt={currentData.name} 
                      className="w-full h-full object-cover"
                    />
                    {currentVariant.discount > 0 && (
                      <span className="absolute top-2 left-2 px-2 py-1 text-xs font-bold bg-rose-500 text-white rounded-lg shadow-sm">
                        {currentVariant.discount}% OFF
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleDownloadActiveImage}
                      disabled={downloading}
                      className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/75 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Download this photo"
                    >
                      {downloading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Download size={13} />
                      )}
                      <span>Download</span>
                    </button>
                  </div>

                  {/* Thumbnail Row */}
                  {currentImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {currentImages.map((img: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                            activeImageIndex === idx 
                              ? 'border-[var(--color-primary)] shadow-sm scale-105' 
                              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                          }`}
                        >
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Download Options Bar */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadActiveImage}
                      disabled={downloading}
                      className="btn btn-ghost btn-sm flex-1 flex items-center justify-center gap-1.5 text-xs border border-[var(--color-border)] py-1.5 font-medium hover:bg-[var(--color-surface-hover)]"
                      title="Download current photo"
                    >
                      <Download size={13} />
                      <span>Download Photo</span>
                    </button>
                    {currentImages.length > 1 && (
                      <button
                        type="button"
                        onClick={handleDownloadAllImages}
                        disabled={downloading}
                        className="btn btn-outline btn-sm flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5"
                        style={{ color: "var(--color-primary)" }}
                        title="Download all photos"
                      >
                        {downloading && downloadProgress ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Downloading ({downloadProgress})</span>
                          </>
                        ) : (
                          <>
                            <Download size={13} />
                            <span>All Photos ({currentImages.length})</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Color Variants Switcher */}
                  {variants.length > 1 && (
                    <div className="p-3 bg-[var(--color-surface-hover)] rounded-xl border border-[var(--color-border)]">
                      <label className="text-xs font-semibold text-[var(--color-text)] block mb-2">
                        Color Variants ({variants.length})
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {variants.map((v: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedColorIndex(i);
                              setActiveImageIndex(0);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              selectedColorIndex === i
                                ? 'bg-[var(--color-surface)] border-[var(--color-text)] text-[var(--color-text)] shadow-sm'
                                : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
                            }`}
                          >
                            <span 
                              className="w-3 h-3 rounded-full border border-black/10 shrink-0" 
                              style={{ backgroundColor: v.color?.hex || '#CBD5E1' }}
                            />
                            <span>{v.color?.name || `Color ${i + 1}`}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Key Commercials & Metadata (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  {/* Pricing Card */}
                  <div className="p-4 bg-[var(--color-surface-hover)] rounded-xl border border-[var(--color-border)] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[var(--color-text-secondary)] font-medium">Selling Price</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-extrabold text-[var(--color-text)]">
                          ₹{currentVariant.price ?? currentData.price ?? 0}
                        </span>
                        {(currentVariant.mrp || currentData.mrp) && (currentVariant.mrp > currentVariant.price || currentData.mrp > currentData.price) && (
                          <span className="text-sm text-[var(--color-text-tertiary)] line-through">
                            ₹{currentVariant.mrp || currentData.mrp}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-[var(--color-text-secondary)] font-medium">Total Stock</span>
                      <p className="text-lg font-bold text-[var(--color-text)] mt-0.5">
                        {totalStock} units
                      </p>
                    </div>
                  </div>

                  {/* Core Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                      <span className="text-[var(--color-text-secondary)] font-medium block">Brand</span>
                      <span className="font-semibold text-[var(--color-text)] mt-0.5 block">{brandName}</span>
                    </div>

                    <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                      <span className="text-[var(--color-text-secondary)] font-medium block">Category</span>
                      <span className="font-semibold text-[var(--color-text)] mt-0.5 block">
                        {categoryName} {subCategoryName ? `› ${subCategoryName}` : ''}
                      </span>
                    </div>

                    <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                      <span className="text-[var(--color-text-secondary)] font-medium block">Gender</span>
                      <span className="font-semibold text-[var(--color-text)] mt-0.5 block">
                        {Array.isArray(currentData.gender) ? currentData.gender.join(', ') : (currentData.gender || 'Unisex')}
                      </span>
                    </div>

                    <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                      <span className="text-[var(--color-text-secondary)] font-medium block">Try at Home</span>
                      <span className={`font-semibold mt-0.5 inline-flex items-center gap-1 ${currentData.isTriable ? 'text-emerald-600' : 'text-[var(--color-text-secondary)]'}`}>
                        {currentData.isTriable ? 'Eligible' : 'Not Eligible'}
                      </span>
                    </div>

                    {currentData.styleName && (
                      <div className="col-span-2 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                        <span className="text-[var(--color-text-secondary)] font-medium block">Style Name / Model</span>
                        <span className="font-semibold text-[var(--color-text)] mt-0.5 block">{currentData.styleName}</span>
                      </div>
                    )}
                  </div>

                  {/* Sizes & Stock for Active Color */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
                        Sizes & Inventory ({currentVariant.color?.name || 'Selected Color'})
                      </h4>
                      <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                        {(currentVariant.sizes || []).length} size(s)
                      </span>
                    </div>

                    <div className="border border-[var(--color-border)] rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[320px]">
                        <thead className="bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border-b border-[var(--color-border)] font-semibold">
                          <tr>
                            <th className="px-3 py-2">Size</th>
                            <th className="px-3 py-2">Merchant Code</th>
                            <th className="px-3 py-2">Stock Level</th>
                            <th className="px-3 py-2 text-right">SKU Code</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                          {(currentVariant.sizes || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-3 py-4 text-center text-[var(--color-text-tertiary)] italic">
                                No size configurations found for this color.
                              </td>
                            </tr>
                          ) : (
                            currentVariant.sizes.map((sz: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                                <td className="px-3 py-2 font-bold text-[var(--color-text)]">{sz.size}</td>
                                <td className="px-3 py-2 text-[var(--color-text-secondary)]">{sz.merchantSizeCode || '—'}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                    Number(sz.stock) > 5
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : Number(sz.stock) > 0
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-rose-50 text-rose-600'
                                  }`}>
                                    {Number(sz.stock) > 0 ? `${sz.stock} in stock` : 'Out of stock'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-[11px] text-[var(--color-text-secondary)]">
                                  {sz.productCode ? getMerchantEnteredSku(sz.productCode, sz.merchantSizeCode, [sz]) : '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Category Attributes */}
              <div className="p-4 bg-[var(--color-surface-hover)] rounded-xl border border-[var(--color-border)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={15} />
                  Category Attributes & Specifications
                </h4>

                {(!currentData.attributes || currentData.attributes.length === 0) ? (
                  <p className="text-xs text-[var(--color-text-tertiary)] italic">No specific attributes configured for this product.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {currentData.attributes.map((attr: any, idx: number) => {
                      const label = attr.name || attr.attributeId?.name || (attr.attributeId && typeof attr.attributeId === 'object' ? attr.attributeId.name : null) || 'Attribute';
                      const val = Array.isArray(attr.value) ? attr.value.join(', ') : String(attr.value ?? '—');
                      return (
                        <div key={idx} className="p-2.5 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                          <span className="text-[11px] text-[var(--color-text-secondary)] font-medium block truncate" title={label}>
                            {label}
                          </span>
                          <span className="text-xs font-semibold text-[var(--color-text)] mt-0.5 block truncate" title={val}>
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Description & Search Tags */}
              <div className="space-y-3">
                {currentData.description && (
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-1">
                      Description
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] whitespace-pre-line">
                      {currentData.description}
                    </p>
                  </div>
                )}

                {currentData.tags && currentData.tags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Tag size={13} className="text-[var(--color-text-secondary)]" /> Tags
                    </h4>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {currentData.tags.map((t: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 bg-[var(--color-surface-alt)] text-[var(--color-text)] rounded-lg text-xs font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-3.5 py-3 sm:px-6 sm:py-4 border-t border-[var(--color-border)] bg-[var(--color-surface-hover)] gap-2.5">
          <button
            onClick={handleEditClick}
            className="btn btn-secondary btn-sm flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-semibold"
          >
            <Edit size={14} /> <span className="truncate">Edit Details</span>
          </button>

          <button
            onClick={onClose}
            className="btn btn-primary btn-sm flex-1 sm:flex-initial px-5 text-xs font-semibold justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
