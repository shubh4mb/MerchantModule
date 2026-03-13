// components/Products/ProductTable.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Search,
  Plus,
  Loader2,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchProductsByMerchantId } from "../../api/products";

interface Size {
  size: string;
  stock: number;
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
interface Variant {
  color: Color;
  sizes: Size[];
  mrp: number;
  price: number;
  images: Image[];
  discount: number;
  _id: string;
}
interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  subSubCategory: string;
  gender: string;
  description: string;
  tags: string[];
  isTriable: boolean;
  ratings: number;
  numReviews: number;
  isActive: boolean;
  variants: Variant[];
  createdAt: string;
  updatedAt: string;
}

export default function ProductTable({ merchantId }: { merchantId: string }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    name: "",
    description: "",
    category: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProductsByMerchantId(merchantId);
        setProducts(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [merchantId]);

  const toggleExpand = (id: string) => {
    const copy = new Set(expandedRows);
    copy.has(id) ? copy.delete(id) : copy.add(id);
    setExpandedRows(copy);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const n = p.name.toLowerCase().includes(filters.name.toLowerCase());
      const d = p.description
        .toLowerCase()
        .includes(filters.description.toLowerCase());
      const c =
        p.category.toLowerCase().includes(filters.category.toLowerCase()) ||
        p.subCategory.toLowerCase().includes(filters.category.toLowerCase()) ||
        p.subSubCategory
          .toLowerCase()
          .includes(filters.category.toLowerCase());
      return n && d && c;
    });
  }, [products, filters]);

  const handleEdit = (id: string) => {
    navigate(`/merchant/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    alert("Deleted");
  };

  /** Helper: first image of the first variant (or undefined) */
  const getFirstImage = (variants: Variant[]): string | undefined => {
    if (!variants.length) return undefined;
    const firstVariant = variants[0];
    return firstVariant.images?.[0]?.url;
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Accessing Repository</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* FILTERS */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search by Name */}
          <div className="flex-grow flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 transition-all focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="SEARCH BY PRODUCT NAME..."
              className="bg-transparent border-none focus:outline-none w-full text-sm font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-black placeholder:tracking-widest uppercase italic"
              value={filters.name}
              onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 lg:w-1/2">
            <div className="flex-1 flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 transition-all focus-within:border-gray-900">
              <input
                type="text"
                placeholder="DESCRIPTION..."
                className="bg-transparent border-none focus:outline-none w-full text-sm font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-black placeholder:tracking-widest uppercase italic"
                value={filters.description}
                onChange={(e) => setFilters((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="flex-1 flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 transition-all focus-within:border-gray-900">
              <input
                type="text"
                placeholder="CATEGORY..."
                className="bg-transparent border-none focus:outline-none w-full text-sm font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-black placeholder:tracking-widest uppercase italic"
                value={filters.category}
                onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-auto border-collapse">
            <thead className="bg-gray-900">
              <tr>
                {[
                  { label: "Identity", width: "w-[30%]" },
                  { label: "Category", width: "w-[15%]" },
                  { label: "Financials", width: "w-[15%]" },
                  { label: "Repository", width: "w-[15%]" },
                  { label: "Status", width: "w-[10%]" },
                  { label: "Control", width: "w-[15%]" }
                ].map((h, i) => (
                  <th key={i} className={`${h.width} px-8 py-5 text-left text-[10px] font-black text-white/50 uppercase tracking-[0.2em]`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-200" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Null Data Result</h4>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No matching entities found in repository</p>
                      </div>
                      <button
                        onClick={() => navigate("/merchant/add-product")}
                        className="bg-black text-white font-black uppercase tracking-[0.2em] py-4 px-8 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xs flex items-center gap-3"
                      >
                        <Plus className="w-4 h-4" />
                        Initialize Item
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isExpanded = expandedRows.has(product.id);
                  const totalStock = product.variants.reduce(
                    (a, v) => a + v.sizes.reduce((s, sz) => s + sz.stock, 0),
                    0
                  );
                  const prices = product.variants.map((v) => v.price);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const firstImgUrl = getFirstImage(product.variants);

                  return (
                    <React.Fragment key={product.id}>
                      <tr className={`group transition-all duration-300 hover:bg-gray-50/50 ${isExpanded ? 'bg-gray-50/80 ring-1 ring-inset ring-gray-900/5' : ''}`}>
                        {/* Identity */}
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-6">
                            <button
                              onClick={() => toggleExpand(product.id)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-900 hover:text-white'}`}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <div className="relative group/img">
                              {firstImgUrl ? (
                                <img
                                  src={firstImgUrl}
                                  alt={product.name}
                                  className="w-14 h-14 object-cover rounded-2xl shadow-md border border-gray-100 transition-transform group-hover/img:scale-110"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-gray-100 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 tracking-tight uppercase mb-1 truncate max-w-[200px]">
                                {product.name}
                              </p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                                {product.brand}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <p className="text-xs font-black text-gray-900 uppercase">
                              {product.category}
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                              {product.subCategory}
                            </p>
                          </div>
                        </td>

                        {/* Financials */}
                        <td className="px-8 py-6 text-sm font-black text-gray-900 italic tracking-tighter">
                          ₹{minPrice} - ₹{maxPrice}
                        </td>

                        {/* Repository (Stock) */}
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${totalStock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className={`text-sm font-black ${totalStock > 0 ? "text-gray-900" : "text-red-600"}`}>
                              {totalStock} <span className="text-[10px] text-gray-400 uppercase tracking-widest ml-1 italic">Units</span>
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${product.isActive ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                            {product.isActive ? "Online" : "Paused"}
                          </span>
                        </td>

                        {/* Control */}
                        <td className="px-8 py-6">
                          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all shadow-sm"
                              onClick={() => handleEdit(product.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row (variants) */}
                      {isExpanded && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={6} className="p-0">
                            <div className="px-24 py-12 space-y-8 animate-in slide-in-from-top-4 duration-500">
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-black rounded-full"></div>
                                <h4 className="text-lg font-black text-gray-900 tracking-tighter uppercase">Entity Variants</h4>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {product.variants.map((v) => (
                                  <div key={v._id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all group/var">
                                    <div className="flex items-center justify-between mb-6">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full border-4 border-white shadow-md ring-1 ring-gray-100" style={{ backgroundColor: v.color.hex }} />
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-widest italic">{v.color.name}</span>
                                      </div>
                                      <span className="px-2 py-1 bg-black text-white rounded-lg text-[8px] font-black uppercase tracking-widest">
                                        {v.discount}% OFF
                                      </span>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                      <div className="flex justify-between items-end">
                                        <div>
                                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">MSRP</p>
                                          <p className="text-sm font-bold text-gray-400 line-through">₹{v.mrp}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Market</p>
                                          <p className="text-xl font-black text-gray-900 tracking-tighter italic">₹{v.price}</p>
                                        </div>
                                      </div>

                                      <div className="pt-4 border-t border-gray-50">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">Inventory Matrix</p>
                                        <div className="flex flex-wrap gap-2">
                                          {v.sizes.map((sz) => (
                                            <div
                                              key={sz._id}
                                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${sz.stock > 0 ? "bg-white border-gray-100" : "bg-red-50 border-red-100 opacity-50"}`}
                                            >
                                              <span className="text-[10px] font-black text-gray-900">{sz.size}</span>
                                              <div className="w-[1px] h-3 bg-gray-200"></div>
                                              <span className={`text-[10px] font-bold ${sz.stock > 0 ? "text-gray-500" : "text-red-500"}`}>{sz.stock}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    {v.images.length > 0 && (
                                      <div className="flex gap-2">
                                        {v.images.slice(0, 3).map((img, _i) => (
                                          <img
                                            key={img._id}
                                            src={img.url}
                                            className="w-12 h-12 object-cover rounded-xl border border-gray-100 shadow-sm transition-transform hover:scale-110"
                                          />
                                        ))}
                                        {v.images.length > 3 && (
                                          <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-[10px] font-black text-gray-400">
                                            +{v.images.length - 3}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}