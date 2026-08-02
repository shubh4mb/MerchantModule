import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchMyWarehouseProducts,
  addMyWarehouseProduct,
  updateMyWarehouseProduct,
  addMyWarehouseProductVariant,
  updateMyWarehouseProductStock,
  deleteMyWarehouseProduct
} from '../../api/warehouseOrder';
import { getCategories } from '../../api/products';
import axiosInstance from '../../utils/axiosInstance';
import { Plus, Trash2, Edit, Layers, Image as ImageIcon, Box, Loader2, X, PlusCircle } from 'lucide-react';
import VariantForm from '../../components/Products/VariantForm';

interface SizeStock {
  size: string;
  stock: number;
}

interface Variant {
  _id: string;
  color: { name: string; hex: string };
  sizes: SizeStock[];
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
  variants: Variant[];
  merchantId?: { shopName: string };
  brandId?: { name: string };
  categoryId?: { name: string };
}

const WarehouseInventory: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WarehouseProduct | null>(null);

  // Form State - Add Product
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    brandId: '',
    categoryId: '',
    merchantId: '',
    gender: 'Men',
    isTriable: true,
    commissionRate: ''
  });

  // Form State - Edit Stock
  const [stockForm, setStockForm] = useState({
    variantId: '',
    size: '',
    stock: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, brandRes, merchantRes] = await Promise.all([
        fetchMyWarehouseProducts().catch(() => ({ products: [] })),
        getCategories().catch(() => ({ categories: [] })),
        axiosInstance.get('/merchant/brand/getAllBrands').catch(() => ({ data: { brands: [] } })),
        axiosInstance.get('/merchant/assigned-merchants').catch(() => ({ data: { merchants: [] } }))
      ]);
      setProducts(prodRes.products || prodRes.data?.products || []);
      setCategories(catRes.categories || []);
      setBrands(brandRes.data?.brands || []);
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

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.categoryId || !productForm.merchantId) {
      alert('Name, Category, and Source Merchant are required');
      return;
    }
    try {
      await addMyWarehouseProduct({
        ...productForm,
        commissionRate: productForm.commissionRate ? parseFloat(productForm.commissionRate as string) : null
      });
      alert('Product created! Now click "Add Variant" on the product to add stock and colors.');
      setIsProductModalOpen(false);
      loadData();
    } catch (err) {
      alert('Failed to add warehouse product');
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
        <button
          onClick={() => {
            navigate('/merchant/add-product');
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} />
          Add Product to Warehouse
        </button>
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
                        {prod.variants.map((v) => (
                          <div key={v._id} className="flex items-center gap-3 bg-slate-50/50 p-2 rounded-lg border" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
                            {v.images?.[0]?.url ? (
                              <img src={v.images[0].url} alt={v.color?.name || 'Variant'} className="w-8 h-8 rounded object-cover border border-white/10 flex-shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: v.color?.hex || '#ccc' }} />
                            )}
                            <div className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
                              <span className="font-medium">{v.color?.name || 'Default'}</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {v.sizes.map((s) => (
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
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
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
                            setVariantForm({
                              colorName: '',
                              colorHex: '#000000',
                              sizeStr: 'M',
                              stockNum: 10,
                              mrp: '',
                              price: '',
                              discount: 0,
                            });
                            setIsVariantModalOpen(true);
                          }}
                          className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-semibold"
                        >
                          Add Variant
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

      {/* Add Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-white/10" style={{ background: 'var(--color-card)' }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Add Product to Warehouse</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Air Max Sneakers"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Details..."
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:outline-none text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:outline-none text-white"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id} className="bg-slate-900">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Brand</label>
                  <select
                    value={productForm.brandId}
                    onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:outline-none text-white"
                  >
                    {brands.map((b) => (
                      <option key={b._id} value={b._id} className="bg-slate-900">{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Source Merchant (Consignment Owner)</label>
                <select
                  required
                  value={productForm.merchantId}
                  onChange={(e) => setProductForm({ ...productForm, merchantId: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:outline-none text-white"
                >
                  <option value="" className="bg-slate-900">-- Select Merchant --</option>
                  {merchants.map((m) => (
                    <option key={m._id} value={m._id} className="bg-slate-900">{m.shopName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Gender Group</label>
                  <select
                    value={productForm.gender}
                    onChange={(e) => setProductForm({ ...productForm, gender: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:outline-none text-white"
                  >
                    <option value="Men" className="bg-slate-900">Men</option>
                    <option value="Women" className="bg-slate-900">Women</option>
                    <option value="Kids" className="bg-slate-900">Kids</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Warehouse Commission (%)</label>
                  <input
                    type="number"
                    value={productForm.commissionRate}
                    onChange={(e) => setProductForm({ ...productForm, commissionRate: e.target.value })}
                    placeholder="Leave empty for default"
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:outline-none text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                >
                  Save Product
                </button>
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
    </div>
  );
};

export default WarehouseInventory;
