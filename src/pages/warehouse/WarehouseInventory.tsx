import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchMyWarehouseProducts,
  addMyWarehouseProductFull,
  addMyWarehouseProductVariant,
  updateMyWarehouseProductStock,
  deleteMyWarehouseProduct
} from '../../api/warehouseOrder';
import { fetchProductsByMerchantId } from '../../api/products';
import { Plus, Trash2, Edit, Image as ImageIcon, Box, Loader2, X, Link as LinkIcon, Search, Check, AlertCircle, Eye } from 'lucide-react';
import VariantForm from '../../components/Products/VariantForm';
import ProductDetailsModal from '../../components/Products/ProductDetailsModal';
import axiosInstance from '../../utils/axiosInstance';

interface SizeStock {
  size: string;
  stock: number;
}

interface Variant {
  _id: string;
  color: { name: string; hex: string };
  sizes?: SizeStock[];
  mrp: number;
  price: number;
  discount: number;
  images: { url: string; public_id: string }[];
}

interface WarehouseProduct {
  _id: string;
  name: string;
  description: string;
  gender: string[];
  isTriable: boolean;
  commissionRate: number | null;
  variants?: Variant[];
  merchantId?: { shopName: string };
  brandId?: { name: string };
  categoryId?: { name: string };
}

const WarehouseInventory: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WarehouseProduct | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);

  // Link Modal State
  const [linkMerchantId, setLinkMerchantId] = useState('');
  const [merchantProducts, setMerchantProducts] = useState<any[]>([]);
  const [loadingMerchantProducts, setLoadingMerchantProducts] = useState(false);
  const [selectedMerchantProduct, setSelectedMerchantProduct] = useState<any | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [linkStockMap, setLinkStockMap] = useState<{ [size: string]: number }>({});
  const [linkCommissionRate, setLinkCommissionRate] = useState('');
  const [submittingLink, setSubmittingLink] = useState(false);

  // Form State - Edit Stock
  const [stockForm, setStockForm] = useState({
    variantId: '',
    size: '',
    stock: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, merchantRes] = await Promise.all([
        fetchMyWarehouseProducts().catch(() => ({ products: [] })),
        axiosInstance.get('/merchant/assigned-merchants').catch(() => ({ data: { merchants: [] } }))
      ]);
      setProducts(prodRes.products || prodRes.data?.products || []);
      setMerchants(merchantRes.data?.merchants || merchantRes.data?.data?.merchants || []);
    } catch (err) {
      console.error('Failed to load warehouse inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch products of selected merchant for linking
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
      formData.append('linkedMerchantProductId', selectedMerchantProduct.id || selectedMerchantProduct.styleGroupId || selectedMerchantProduct._id || '');
      formData.append('name', selectedMerchantProduct.name || '');
      formData.append('styleName', selectedMerchantProduct.styleName || '');
      formData.append('description', selectedMerchantProduct.description || '');
      formData.append('categoryId', selectedMerchantProduct.categoryId?._id || selectedMerchantProduct.categoryId || '');
      if (selectedMerchantProduct.subCategoryId) {
        formData.append('subCategoryId', selectedMerchantProduct.subCategoryId?._id || selectedMerchantProduct.subCategoryId || '');
      }
      formData.append('gender', JSON.stringify(Array.isArray(selectedMerchantProduct.gender) ? selectedMerchantProduct.gender : [selectedMerchantProduct.gender || 'MEN']));
      formData.append('isTriable', String(selectedMerchantProduct.isTriable !== undefined ? selectedMerchantProduct.isTriable : true));
      formData.append('tags', JSON.stringify(selectedMerchantProduct.tags || []));

      const rawAttrs = Array.isArray(selectedMerchantProduct.attributes) ? selectedMerchantProduct.attributes : [];
      const cleanAttrs = rawAttrs.map((a: any) => {
        let rawId = a.attributeId || a.attribute;
        if (rawId && typeof rawId === 'object') {
          rawId = rawId._id || rawId.id;
        }
        return {
          attributeId: String(rawId || ''),
          value: a.value
        };
      }).filter((a: any) => a.attributeId);
      formData.append('attributes', JSON.stringify(cleanAttrs));

      const sizesPayload = (selectedMerchantProduct.sizes && selectedMerchantProduct.sizes.length > 0)
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

      const variantsPayload = [{
        color: selectedMerchantProduct.color || { name: 'Default', hex: '#cccccc' },
        mrp: selectedMerchantProduct.mrp || 0,
        price: selectedMerchantProduct.price || 0,
        discount: selectedMerchantProduct.discount || 0,
        sizes: sizesPayload,
        productSku: `WH-${selectedMerchantProduct.productCode || Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        existingImages
      }];

      formData.append('variants', JSON.stringify(variantsPayload));

      await addMyWarehouseProductFull(formData);
      alert('Product successfully linked and added to warehouse inventory!');
      setIsLinkModalOpen(false);
      setSelectedMerchantProduct(null);
      setLinkMerchantId('');
      setLinkStockMap({});
      loadData();
    } catch (err: any) {
      console.error('Failed to link warehouse product:', err);
      alert('Failed to link product: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingLink(false);
    }
  };





  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await updateMyWarehouseProductStock(selectedProduct._id, stockForm);
      alert('Stock updated successfully');
      setIsStockModalOpen(false);
      loadData();
    } catch (err) {
      alert('Failed to update stock');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this product from the warehouse?')) return;
    try {
      await deleteMyWarehouseProduct(id);
      alert('Product removed');
      loadData();
    } catch (err) {
      alert('Failed to remove product');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ color: "var(--color-text-primary)" }}>
            Warehouse Inventory
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Allocate and manage products stored in this warehouse</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
          >
            <LinkIcon size={18} />
            Link Existing Merchant Product
          </button>
          <button
            onClick={() => navigate('/merchant/add-product')}
            className="bg-slate-800 hover:bg-slate-700 text-gray-200 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors text-sm"
          >
            <Plus size={16} />
            Create From Scratch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {products.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <Box className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
            <p style={{ color: 'var(--color-text-secondary)' }}>No warehouse products allocated yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'var(--color-card)' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                  <th className="p-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Product Info</th>
                  <th className="p-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Source Merchant</th>
                  <th className="p-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Category / Brand</th>
                  <th className="p-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Variants & Stock</th>
                  <th className="p-4 font-semibold text-right" style={{ color: 'var(--color-text-primary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod._id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {prod.variants?.[0]?.images?.[0]?.url ? (
                          <img
                            src={prod.variants[0].images[0].url}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg object-cover border border-white/10 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center flex-shrink-0 text-gray-500">
                            <ImageIcon size={20} />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-800" style={{ color: 'var(--color-text-primary)' }}>{prod.name}</div>
                          <div className="text-xs text-slate-500" style={{ color: 'var(--color-text-secondary)' }}>{prod.description?.slice(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4" style={{ color: 'var(--color-text-primary)' }}>
                      {prod.merchantId?.shopName || 'Unknown Merchant'}
                    </td>
                    <td className="p-4">
                      <div style={{ color: 'var(--color-text-primary)' }}>{prod.categoryId?.name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{prod.brandId?.name || 'No Brand'}</div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        {prod.variants && prod.variants.length > 0 ? (
                          prod.variants.map((v) => (
                            <div key={v._id} className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-lg border" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                              {v.images?.[0]?.url ? (
                                <img src={v.images[0].url} alt={v.color?.name || 'Variant'} className="w-8 h-8 rounded object-cover border border-white/10 flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: v.color?.hex || '#ccc' }} />
                              )}
                              <div className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                                <span className="font-medium">{v.color?.name || 'Default'}</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {v.sizes && v.sizes.length > 0 ? (
                                    v.sizes.map((s) => (
                                      <button
                                        key={s.size}
                                        onClick={() => {
                                          setSelectedProduct(prod);
                                          setStockForm({ variantId: v._id, size: s.size, stock: s.stock });
                                          setIsStockModalOpen(true);
                                        }}
                                        className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20 text-[10px] hover:bg-blue-500/20 transition-colors"
                                      >
                                        {s.size}: {s.stock}
                                      </button>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-gray-400">No sizes</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-amber-500/80 italic">No variants added</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setViewingProduct(prod);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 rounded transition-colors"
                          title="View Product Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/merchant/edit/${prod._id}`)}
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProduct(prod);
                            setIsVariantModalOpen(true);
                          }}
                          className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded transition-colors"
                          title="Add Variant"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod._id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                          title="Remove Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Link Existing Merchant Product Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-white/10 my-8 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-card)' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                  <LinkIcon className="text-blue-500" size={22} /> Link Existing Merchant Product
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Allocate inventory to your warehouse from products already created by merchants.
                </p>
              </div>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLinkProductSubmit} className="space-y-4">
              {/* Step 1: Select Source Merchant */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                  1. Source Merchant (Consignment Owner) <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={linkMerchantId}
                  onChange={(e) => {
                    setLinkMerchantId(e.target.value);
                    setProductSearchTerm('');
                  }}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm focus:outline-none text-white"
                >
                  <option value="" className="bg-slate-900">-- Select Source Merchant --</option>
                  {merchants.map((m) => (
                    <option key={m._id} value={m._id} className="bg-slate-900">
                      {m.shopName} {m.warehouseStatus === 'approved' ? '✓ (Approved)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Choose Product from Merchant */}
              {linkMerchantId && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    2. Select Product from Merchant's Catalog <span className="text-red-400">*</span>
                  </label>

                  {loadingMerchantProducts ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-400">
                      <Loader2 className="animate-spin text-blue-500" size={18} />
                      Loading merchant products...
                    </div>
                  ) : merchantProducts.length === 0 ? (
                    <div className="text-center py-6 bg-black/10 rounded-xl border border-white/5 space-y-2">
                      <AlertCircle className="mx-auto text-amber-400" size={24} />
                      <p className="text-xs text-gray-300">This merchant has not added any products to their shop yet.</p>
                      <button
                        type="button"
                        onClick={() => navigate('/merchant/add-product')}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Create a product from scratch &rarr;
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Search Bar */}
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search product by name or SKU..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-white/10 bg-black/20 text-white placeholder-gray-500 focus:outline-none"
                        />
                      </div>

                      {/* Selected Product Banner */}
                      {selectedMerchantProduct ? (
                        <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {selectedMerchantProduct.images?.[0]?.url || (typeof selectedMerchantProduct.images?.[0] === 'string' ? selectedMerchantProduct.images?.[0] : null) ? (
                              <img
                                src={selectedMerchantProduct.images[0]?.url || selectedMerchantProduct.images[0]}
                                alt={selectedMerchantProduct.name}
                                className="w-12 h-12 rounded-lg object-cover border border-white/10"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-black/20 flex items-center justify-center text-gray-400 border border-white/10">
                                <ImageIcon size={20} />
                              </div>
                            )}
                            <div>
                              <div className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                                <Check size={14} /> Linked Product
                              </div>
                              <div className="font-bold text-sm text-white">{selectedMerchantProduct.name}</div>
                              <div className="text-xs text-gray-300">
                                Price: ₹{selectedMerchantProduct.price || selectedMerchantProduct.mrp} • Color: {selectedMerchantProduct.color?.name || 'Default'}
                              </div>
                              {selectedMerchantProduct.attributes && selectedMerchantProduct.attributes.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedMerchantProduct.attributes.map((a: any, aIdx: number) => (
                                    <span key={aIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                      {Array.isArray(a.value) ? a.value.join(', ') : String(a.value || '')}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMerchantProduct(null)}
                            className="text-xs px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-200 transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                          {merchantProducts
                            .filter((p) =>
                              !productSearchTerm ||
                              p.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                              p.productCode?.toLowerCase().includes(productSearchTerm.toLowerCase())
                            )
                            .map((p) => {
                              const imgSrc = p.images?.[0]?.url || (typeof p.images?.[0] === 'string' ? p.images[0] : null);
                              return (
                                <div
                                  key={p.id || p.styleGroupId || p._id}
                                  onClick={() => handleSelectLinkProduct(p)}
                                  className="p-2.5 rounded-lg border border-white/5 bg-black/10 hover:bg-white/5 hover:border-blue-500/30 cursor-pointer flex items-center justify-between transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    {imgSrc ? (
                                      <img src={imgSrc} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center text-gray-500">
                                        <ImageIcon size={18} />
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-xs font-semibold text-white">{p.name}</div>
                                      <div className="text-[11px] text-gray-400">
                                        {p.category || p.categoryId?.name || 'Category'} • ₹{p.price || p.mrp || 0}
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
                                    className="px-2.5 py-1 text-xs rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 font-medium"
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
                <div className="space-y-4 pt-3 border-t border-white/5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                      3. Received Warehouse Stock per Size <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(selectedMerchantProduct.sizes && selectedMerchantProduct.sizes.length > 0 ? selectedMerchantProduct.sizes : [{ size: 'FREE' }]).map((s: any) => (
                        <div key={s.size} className="bg-black/20 p-2.5 rounded-lg border border-white/10 flex items-center justify-between">
                          <span className="text-xs font-bold text-white uppercase">{s.size}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400">Stock:</span>
                            <input
                              type="number"
                              min="0"
                              value={linkStockMap[s.size] ?? 0}
                              onChange={(e) =>
                                setLinkStockMap({
                                  ...linkStockMap,
                                  [s.size]: parseInt(e.target.value) || 0
                                })
                              }
                              className="w-16 px-2 py-1 text-xs text-right font-mono rounded bg-black/40 border border-white/20 text-white focus:outline-none focus:border-blue-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Warehouse Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g. 10 (optional)"
                        value={linkCommissionRate}
                        onChange={(e) => setLinkCommissionRate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-white/10 bg-black/20 text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end text-xs text-gray-400 pb-1">
                      Images and color ({selectedMerchantProduct.color?.name || 'Default'}) will be preserved from the merchant product.
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    navigate('/merchant/add-product');
                  }}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Need full customization? Open Add Product Page &rarr;
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedMerchantProduct || submittingLink}
                    className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      !selectedMerchantProduct || submittingLink
                        ? 'bg-blue-600/50 text-white/50 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {submittingLink ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                    {submittingLink ? 'Adding to Warehouse...' : 'Add to Warehouse Inventory'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Add Variant Modal */}
      {isVariantModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl max-w-3xl w-full p-6 space-y-4 border border-white/10 my-8 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-card)' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                Add Color Variant & Stock - {selectedProduct.name}
              </h2>
              <button onClick={() => setIsVariantModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <VariantForm
              product={selectedProduct}
              customAddVariantApi={addMyWarehouseProductVariant}
              onVariantAdded={() => {
                setIsVariantModalOpen(false);
                loadData();
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-white/10" style={{ background: 'var(--color-card)' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Update Size Stock</h2>
              <button onClick={() => setIsStockModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">Size: <span className="font-bold text-white">{stockForm.size}</span></label>
                <input
                  type="number"
                  required
                  value={stockForm.stock}
                  onChange={(e) => setStockForm({ ...stockForm, stock: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:outline-none text-white font-mono"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingProduct(null);
        }}
        product={viewingProduct}
        onEdit={(id) => navigate(`/merchant/edit/${id}`)}
      />
    </div>
  );
};

export default WarehouseInventory;
