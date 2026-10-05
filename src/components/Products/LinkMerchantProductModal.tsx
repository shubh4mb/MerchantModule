import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link as LinkIcon,
  X,
  Search,
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { fetchProductsByMerchantId } from '../../api/products';
import { addMyWarehouseProductFull } from '../../api/warehouseOrder';

interface LinkMerchantProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LinkMerchantProductModal({
  isOpen,
  onClose,
  onSuccess
}: LinkMerchantProductModalProps) {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState<any[]>([]);
  const [linkMerchantId, setLinkMerchantId] = useState('');
  const [merchantProducts, setMerchantProducts] = useState<any[]>([]);
  const [loadingMerchantProducts, setLoadingMerchantProducts] = useState(false);
  const [selectedMerchantProduct, setSelectedMerchantProduct] = useState<any | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [linkStockMap, setLinkStockMap] = useState<{ [size: string]: number }>({});
  const [linkCommissionRate, setLinkCommissionRate] = useState('');
  const [submittingLink, setSubmittingLink] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    axiosInstance
      .get('/merchant/assigned-merchants')
      .then((res) => {
        setMerchants(res.data?.merchants || res.data?.data?.merchants || []);
      })
      .catch((err) => {
        console.error('Failed to load assigned merchants:', err);
      });
  }, [isOpen]);

  useEffect(() => {
    if (!linkMerchantId) {
      setMerchantProducts([]);
      setSelectedMerchantProduct(null);
      setLinkStockMap({});
      return;
    }
    setLoadingMerchantProducts(true);
    setSelectedMerchantProduct(null);
    setLinkStockMap({});
    fetchProductsByMerchantId(linkMerchantId)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.products || [];
        setMerchantProducts(list);
      })
      .catch((err) => {
        console.error('Failed to load merchant products for linking:', err);
        setMerchantProducts([]);
      })
      .finally(() => setLoadingMerchantProducts(false));
  }, [linkMerchantId]);

  const handleSelectLinkProduct = (prod: any) => {
    setSelectedMerchantProduct(prod);
    const initialStock: { [size: string]: number } = {};
    if (prod.sizes && Array.isArray(prod.sizes)) {
      prod.sizes.forEach((s: any) => {
        initialStock[s.size] = 0;
      });
    } else {
      initialStock['FREE'] = 0;
    }
    setLinkStockMap(initialStock);
  };

  const handleLinkProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkMerchantId) {
      alert('Please select a source merchant');
      return;
    }
    if (!selectedMerchantProduct) {
      alert('Please select an existing merchant product to link');
      return;
    }

    try {
      setSubmittingLink(true);
      const formData = new FormData();
      formData.append('merchantId', linkMerchantId);
      if (linkCommissionRate) {
        formData.append('commissionRate', linkCommissionRate);
      }
      formData.append(
        'linkedMerchantProductId',
        selectedMerchantProduct.id ||
          selectedMerchantProduct.styleGroupId ||
          selectedMerchantProduct._id ||
          ''
      );
      formData.append('name', selectedMerchantProduct.name || '');
      formData.append('styleName', selectedMerchantProduct.styleName || '');
      formData.append('description', selectedMerchantProduct.description || '');
      formData.append(
        'categoryId',
        selectedMerchantProduct.categoryId?._id ||
          selectedMerchantProduct.categoryId ||
          ''
      );
      if (selectedMerchantProduct.subCategoryId) {
        formData.append(
          'subCategoryId',
          selectedMerchantProduct.subCategoryId?._id ||
            selectedMerchantProduct.subCategoryId ||
            ''
        );
      }
      formData.append(
        'gender',
        JSON.stringify(
          Array.isArray(selectedMerchantProduct.gender)
            ? selectedMerchantProduct.gender
            : [selectedMerchantProduct.gender || 'MEN']
        )
      );
      formData.append(
        'isTriable',
        String(
          selectedMerchantProduct.isTriable !== undefined
            ? selectedMerchantProduct.isTriable
            : true
        )
      );
      formData.append('tags', JSON.stringify(selectedMerchantProduct.tags || []));

      const rawAttrs = Array.isArray(selectedMerchantProduct.attributes)
        ? selectedMerchantProduct.attributes
        : [];
      const cleanAttrs = rawAttrs
        .map((a: any) => {
          let rawId = a.attributeId || a.attribute;
          if (rawId && typeof rawId === 'object') {
            rawId = rawId._id || rawId.id;
          }
          return {
            attributeId: String(rawId || ''),
            value: a.value
          };
        })
        .filter((a: any) => a.attributeId);
      formData.append('attributes', JSON.stringify(cleanAttrs));

      const sizesPayload =
        selectedMerchantProduct.sizes && selectedMerchantProduct.sizes.length > 0
          ? selectedMerchantProduct.sizes.map((s: any) => ({
              size: s.size,
              stock: Number(linkStockMap[s.size] || 0)
            }))
          : [{ size: 'FREE', stock: Number(linkStockMap['FREE'] || 0) }];

      const existingImages = (selectedMerchantProduct.images || [])
        .map((img: any) => ({
          url: typeof img === 'string' ? img : img.url || '',
          public_id: img.public_id || ''
        }))
        .filter((img: any) => img.url);

      const variantsPayload = [
        {
          color: selectedMerchantProduct.color || { name: 'Default', hex: '#cccccc' },
          mrp: selectedMerchantProduct.mrp || 0,
          price: selectedMerchantProduct.price || 0,
          discount: selectedMerchantProduct.discount || 0,
          sizes: sizesPayload,
          productSku: `WH-${selectedMerchantProduct.productCode || Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          existingImages
        }
      ];

      formData.append('variants', JSON.stringify(variantsPayload));

      await addMyWarehouseProductFull(formData);
      alert('Product successfully linked and allocated to warehouse inventory!');
      onClose();
      onSuccess();
    } catch (err: any) {
      console.error('Failed to link warehouse product:', err);
      alert('Failed to link product: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingLink(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        className="card max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--color-surface, #ffffff)',
          color: 'var(--color-text, #0f172a)',
          borderRadius: 'var(--radius-lg, 16px)'
        }}
      >
        <div
          className="flex justify-between items-center border-b pb-3"
          style={{ borderColor: 'var(--color-border, #e2e8f0)' }}
        >
          <div>
            <h2
              className="text-lg font-bold flex items-center gap-2"
              style={{ color: 'var(--color-text)' }}
            >
              <LinkIcon className="text-blue-500" size={20} /> Link Existing Merchant Product
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginTop: '2px' }}>
              Allocate consignment inventory to your warehouse from partner merchants.
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px', color: 'var(--color-text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleLinkProductSubmit} className="space-y-4">
          {/* Step 1: Select Source Merchant */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              1. Source Merchant (Consignment Owner) <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={linkMerchantId}
              onChange={(e) => {
                setLinkMerchantId(e.target.value);
                setProductSearchTerm('');
              }}
              className="input w-full"
              style={{ fontSize: '13px' }}
            >
              <option value="">-- Select Source Merchant --</option>
              {merchants.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.shopName} {m.warehouseStatus === 'approved' ? '✓ (Approved)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Choose Product from Merchant */}
          {linkMerchantId && (
            <div
              className="space-y-3 pt-2 border-t"
              style={{ borderColor: 'var(--color-border, #e2e8f0)' }}
            >
              <label
                className="block text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                2. Select Product from Merchant's Catalog <span className="text-red-500">*</span>
              </label>

              {loadingMerchantProducts ? (
                <div
                  className="flex items-center justify-center py-6 gap-2 text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <Loader2 className="animate-spin text-blue-500" size={18} />
                  Loading merchant catalog...
                </div>
              ) : merchantProducts.length === 0 ? (
                <div
                  className="text-center py-6 rounded-xl border border-dashed space-y-2"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg, #f8fafc)'
                  }}
                >
                  <AlertCircle className="mx-auto text-amber-500" size={24} />
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    This merchant has not added any products to their shop yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    />
                    <input
                      type="text"
                      placeholder="Search product by name or SKU..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="input w-full pl-9"
                      style={{ fontSize: '12px', padding: '6px 12px 6px 32px' }}
                    />
                  </div>

                  {/* Selected Product Banner */}
                  {selectedMerchantProduct ? (
                    <div
                      className="p-3 rounded-xl border flex items-center justify-between"
                      style={{
                        borderColor: 'var(--color-primary)',
                        background: 'rgba(59, 130, 246, 0.08)'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {selectedMerchantProduct.images?.[0]?.url ||
                        (typeof selectedMerchantProduct.images?.[0] === 'string'
                          ? selectedMerchantProduct.images[0]
                          : null) ? (
                          <img
                            src={
                              selectedMerchantProduct.images[0]?.url ||
                              selectedMerchantProduct.images[0]
                            }
                            alt={selectedMerchantProduct.name}
                            className="w-12 h-12 rounded-lg object-cover border"
                            style={{ borderColor: 'var(--color-border)' }}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center border"
                            style={{
                              borderColor: 'var(--color-border)',
                              background: 'var(--color-bg)'
                            }}
                          >
                            <ImageIcon size={18} style={{ color: 'var(--color-text-tertiary)' }} />
                          </div>
                        )}
                        <div>
                          <div
                            className="text-xs font-semibold flex items-center gap-1"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <Check size={14} /> Selected Product
                          </div>
                          <div
                            className="font-bold text-sm truncate"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {selectedMerchantProduct.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            Price: ₹{selectedMerchantProduct.price || selectedMerchantProduct.mrp} • Color:{' '}
                            {selectedMerchantProduct.color?.name || 'Default'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMerchantProduct(null)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '11px' }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div
                      className="max-h-52 overflow-y-auto space-y-2 pr-1"
                      style={{ minHeight: '80px' }}
                    >
                      {merchantProducts
                        .filter(
                          (p) =>
                            !productSearchTerm ||
                            p.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                            p.productCode?.toLowerCase().includes(productSearchTerm.toLowerCase())
                        )
                        .map((p) => {
                          const imgSrc =
                            p.images?.[0]?.url ||
                            (typeof p.images?.[0] === 'string' ? p.images[0] : null);
                          return (
                            <div
                              key={p.id || p.styleGroupId || p._id}
                              onClick={() => handleSelectLinkProduct(p)}
                              className="p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all hover:border-blue-400"
                              style={{
                                borderColor: 'var(--color-border)',
                                background: 'var(--color-bg)'
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={p.name}
                                    className="w-10 h-10 rounded-lg object-cover border"
                                    style={{ borderColor: 'var(--color-border)' }}
                                  />
                                ) : (
                                  <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center border"
                                    style={{
                                      borderColor: 'var(--color-border)',
                                      background: 'var(--color-surface)'
                                    }}
                                  >
                                    <ImageIcon size={16} />
                                  </div>
                                )}
                                <div>
                                  <div
                                    className="text-xs font-semibold"
                                    style={{ color: 'var(--color-text)' }}
                                  >
                                    {p.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '11px',
                                      color: 'var(--color-text-secondary)'
                                    }}
                                  >
                                    {p.category || p.categoryId?.name || 'Category'} • ₹
                                    {p.price || p.mrp || 0}
                                    {p.color?.name && ` • ${p.color.name}`}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectLinkProduct(p);
                                }}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '11px', padding: '3px 10px' }}
                              >
                                Select
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Warehouse Stock & Commission */}
          {selectedMerchantProduct && (
            <div
              className="space-y-4 pt-3 border-t"
              style={{ borderColor: 'var(--color-border, #e2e8f0)' }}
            >
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  3. Received Warehouse Stock per Size <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(selectedMerchantProduct.sizes && selectedMerchantProduct.sizes.length > 0
                    ? selectedMerchantProduct.sizes
                    : [{ size: 'FREE' }]
                  ).map((s: any) => (
                    <div
                      key={s.size}
                      className="p-2.5 rounded-lg border flex items-center justify-between"
                      style={{
                        borderColor: 'var(--color-border)',
                        background: 'var(--color-bg)'
                      }}
                    >
                      <span
                        className="text-xs font-bold uppercase"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {s.size}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}
                        >
                          Stock:
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={linkStockMap[s.size] ?? 0}
                          onChange={(e) =>
                            setLinkStockMap({
                              ...linkStockMap,
                              [s.size]: Math.max(0, parseInt(e.target.value) || 0)
                            })
                          }
                          className="input"
                          style={{
                            width: '56px',
                            padding: '3px 6px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Warehouse Commission Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 10 (optional)"
                  value={linkCommissionRate}
                  onChange={(e) => setLinkCommissionRate(e.target.value)}
                  className="input"
                  style={{ maxWidth: '240px', fontSize: '13px' }}
                />
              </div>
            </div>
          )}

          <div
            className="pt-4 flex items-center justify-between border-t"
            style={{ borderColor: 'var(--color-border, #e2e8f0)' }}
          >
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/merchant/add-product');
              }}
              style={{ fontSize: '12px', color: 'var(--color-primary)' }}
              className="hover:underline"
            >
              Need new listing from scratch? Create here &rarr;
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedMerchantProduct || submittingLink}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                {submittingLink ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <LinkIcon size={14} />
                )}
                {submittingLink ? 'Allocating...' : 'Allocate to Warehouse'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
