import React, { useState, useEffect } from 'react';
import { fetchMyConsignedWarehouseStock, applyForWarehouseService } from '../../api/products';
import { Warehouse, Package, Box, Layers, Loader2, AlertCircle, CheckCircle2, Clock, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

interface SizeStock {
  size: string;
  stock: number;
  reservedStock?: number;
}

interface Variant {
  _id: string;
  color: { name: string; hex: string };
  sizes: SizeStock[];
  mrp: number;
  price: number;
  discount: number;
  images?: Array<{ url: string }>;
}

interface ConsignedProduct {
  _id: string;
  name: string;
  description?: string;
  commissionRate?: number;
  warehouseId?: {
    _id: string;
    name: string;
    code?: string;
  };
  categoryId?: { name: string };
  brandId?: { name: string };
  variants: Variant[];
  createdAt: string;
}

const MerchantWarehouseStock: React.FC = () => {
  const [products, setProducts] = useState<ConsignedProduct[]>([]);
  const [warehouseStatus, setWarehouseStatus] = useState<string>('none');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchMyConsignedWarehouseStock();
      const status = res.data?.warehouseStatus || res.warehouseStatus || 'none';
      const prods = res.data?.products || res.products || [];
      
      setWarehouseStatus(status);
      setProducts(prods);
    } catch (err: any) {
      console.error("Failed to load consigned warehouse stock:", err);
      setError("Failed to load your warehouse status.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setSubmitting(true);
      setError('');
      const res = await applyForWarehouseService();
      const newStatus = res.data?.warehouseStatus || res.warehouseStatus || 'pending';
      setWarehouseStatus(newStatus);
    } catch (err: any) {
      console.error("Failed to apply for warehouse service:", err);
      setError("Failed to submit warehouse application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((acc, prod) => {
    return acc + prod.variants.reduce((vAcc, v) => {
      return vAcc + v.sizes.reduce((sAcc, s) => sAcc + (s.stock || 0), 0);
    }, 0);
  }, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  // ----------------------------------------------------
  // UN-APPROVED / NOT OPTED-IN VIEW
  // ----------------------------------------------------
  if (warehouseStatus === 'none' || warehouseStatus === 'rejected') {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-8" style={{ color: 'var(--color-text-primary)' }}>
        {/* Banner Card */}
        <div className="relative overflow-hidden rounded-3xl p-8 border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(3, 105, 161, 0.2) 100%)' }}>
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Zap size={14} /> FlashFits Warehouse Fulfillment
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Supercharge Sales with FlashFits Local Warehouses
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed">
              Store your inventory in our regional FlashFits micro-hubs to unlock <strong>Express 60-Minute Delivery</strong> and <strong>Try & Buy</strong> for customers in your area!
            </p>

            {warehouseStatus === 'rejected' && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                Your previous application was declined. You can submit a new request below.
              </div>
            )}

            <button
              onClick={handleApply}
              disabled={submitting}
              className="mt-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Submitting Request...
                </>
              ) : (
                <>
                  Apply for Warehouse Service <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-white/10 space-y-3" style={{ background: 'var(--color-card)' }}>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Zap size={22} />
            </div>
            <h3 className="font-bold text-white text-base">Ultra-Fast Shipping</h3>
            <p className="text-xs text-gray-400 leading-normal">
              Local warehouse stock qualifies for instant dispatch and priority rider assignment.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 space-y-3" style={{ background: 'var(--color-card)' }}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <h3 className="font-bold text-white text-base">Hassle-Free Inventory</h3>
            <p className="text-xs text-gray-400 leading-normal">
              Our warehouse operators handle storage, stock counts, packing, and returns for you.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 space-y-3" style={{ background: 'var(--color-card)' }}>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
            <h3 className="font-bold text-white text-base">Try & Buy Ready</h3>
            <p className="text-xs text-gray-400 leading-normal">
              Customers can try your products in multiple sizes right at their doorstep before buying.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // PENDING APPROVAL VIEW
  // ----------------------------------------------------
  if (warehouseStatus === 'pending') {
    return (
      <div className="p-6 max-w-3xl mx-auto my-12 space-y-6 text-center">
        <div className="p-10 rounded-3xl border border-amber-500/20 bg-amber-500/5 space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Clock size={32} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white">Application Under Review</h2>
          <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
            Your request for <strong>FlashFits Warehouse Service</strong> has been submitted! Our operations team is reviewing your profile and will approve your account shortly.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs text-amber-300">
            <AlertCircle size={14} /> Status: Pending Admin Approval
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // APPROVED / ACTIVE WAREHOUSE INVENTORY VIEW
  // ----------------------------------------------------
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" style={{ color: 'var(--color-text-primary)' }}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Warehouse className="text-blue-500" size={28} />
            Warehouse Consignment Stock
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Track your inventory items currently stored and fulfilled by FlashFits Warehouses.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={14} /> Warehouse Opt-In Approved
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-white/10 flex items-center gap-4" style={{ background: 'var(--color-card)' }}>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Package size={28} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Consigned Product Styles</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{totalProducts}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 flex items-center gap-4" style={{ background: 'var(--color-card)' }}>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Box size={28} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Consigned Units</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{totalStockUnits}</h3>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center py-16 border border-dashed rounded-2xl border-white/10">
          <Warehouse className="h-12 w-12 mx-auto mb-3 text-gray-500 opacity-60" />
          <h3 className="text-lg font-medium text-white mb-1">No Warehouse Stock Found</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Your account is approved for warehouse service! When warehouse operators assign consigned products for your brand, they will appear here.
          </p>
        </div>
      )}

      {/* Products Listing */}
      {products.length > 0 && (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product._id}
              className="p-5 rounded-2xl border border-white/10 space-y-4"
              style={{ background: 'var(--color-card)' }}
            >
              {/* Product Info Header */}
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b pb-3 border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{product.name}</h2>
                    {product.categoryId && (
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-gray-300 border border-white/10">
                        {product.categoryId.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Location: <strong className="text-blue-400">{product.warehouseId?.name || 'FlashFits Warehouse'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-300">
                  <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-white/10">
                    Warehouse Commission: <strong className="text-amber-400">{product.commissionRate ?? 'Standard'}%</strong>
                  </div>
                </div>
              </div>

              {/* Variants Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} /> Available Color Variants ({product.variants.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {product.variants.map((v) => {
                    const totalVariantStock = v.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
                    return (
                      <div
                        key={v._id}
                        className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-2 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/20"
                              style={{ backgroundColor: v.color?.hex || '#ccc' }}
                            />
                            <span className="font-semibold text-white">{v.color?.name || 'Default Color'}</span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                            {totalVariantStock} units in stock
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>Price: <strong className="text-white">₹{v.price}</strong> <span className="line-through text-gray-500">₹{v.mrp}</span></span>
                          {v.discount > 0 && <span className="text-amber-400 font-semibold">{v.discount}% OFF</span>}
                        </div>

                        {/* Size Breakdown */}
                        <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1.5">
                          {v.sizes.map((s) => (
                            <span
                              key={s.size}
                              className={`px-2 py-0.5 rounded text-xs font-mono border ${
                                s.stock > 0
                                  ? 'bg-slate-800 text-gray-200 border-white/10'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}
                            >
                              {s.size}: <strong>{s.stock}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MerchantWarehouseStock;
