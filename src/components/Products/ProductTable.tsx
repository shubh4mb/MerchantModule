// components/Products/ProductTable.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Search,
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
      <div className="flex justify-center items-center !h-64">
        <div className="animate-spin rounded-full !h-12 !w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <>
      {/* FILTERS */}
      <div className="!mb-4 !p-3 sm:!p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex flex-col gap-3 sm:gap-4">

          {/* Search by Name */}
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name..."
              className="flex-1 !px-3 !py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400"
              value={filters.name}
              onChange={(e) =>
                setFilters((p) => ({ ...p, name: e.target.value }))
              }
            />
          </div>

          {/* Description + Category (Responsive Flex) */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
            <input
              type="text"
              placeholder="Filter by description..."
              className="flex-1 !px-3 !py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400"
              value={filters.description}
              onChange={(e) =>
                setFilters((p) => ({ ...p, description: e.target.value }))
              }
            />

            <input
              type="text"
              placeholder="Category / Subcategory..."
              className="flex-1 !px-3 !py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400"
              value={filters.category}
              onChange={(e) =>
                setFilters((p) => ({ ...p, category: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[800px] table-auto">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Expand", "Image", "Name", "Brand", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                <th key={h} className="!px-2 sm:!px-4 !py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="!px-4 !py-8 text-center text-gray-500 text-sm">
                  No products found
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
                    <tr className="hover:bg-gray-50">
                      {/* Expand button */}
                      <td className="!px-2 sm:!px-4 !py-2">
                        <button
                          onClick={() => toggleExpand(product.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* NEW IMAGE COLUMN */}
                      <td className="!px-2 sm:!px-4 !py-2">
                        {firstImgUrl ? (
                          <img
                            src={firstImgUrl}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 border rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">—</span>
                          </div>
                        )}
                      </td>

                      <td className="!px-2 sm:!px-4 !py-2 text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </td>

                      <td className="!px-2 sm:!px-4 !py-2 text-xs sm:text-sm text-gray-600 truncate">
                        {product.brand}
                      </td>

                      <td className="!px-2 sm:!px-4 !py-2 text-xs sm:text-sm text-gray-600">
                        <div>
                          <div className="font-medium">{product.category}</div>
                          <div className="text-xs text-gray-500">
                            {product.subCategory} → {product.subSubCategory}
                          </div>
                        </div>
                      </td>

                      <td className="!px-2 sm:!px-4 !py-2 text-xs sm:text-sm text-gray-600">
                        ₹{minPrice} - ₹{maxPrice}
                      </td>

                      <td className="!px-2 sm:!px-4 !py-2 text-xs sm:text-sm">
                        <span className={`font-medium ${totalStock > 0 ? "text-green-600" : "text-red-600"}`}>
                          {totalStock}
                        </span>
                      </td>

                      <td className="!px-2 sm:!px-4 !py-2">
                        <span
                          className={`inline-flex !px-2 !py-1 text-xs font-semibold rounded-full ${product.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="!px-2 sm:!px-4 !py-2">
                        <div className="flex gap-1 sm:gap-2">
                          <button className="!p-1 text-blue-600 hover:bg-blue-50 rounded" onClick={() => handleEdit(product.id)}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="!p-1 text-red-600 hover:bg-red-50 rounded" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row (variants) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="!p-0 bg-gray-50">
                          <div className="!p-3 sm:!p-4">
                            <h4 className="font-semibold text-gray-800 !mb-3">Variants</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {product.variants.map((v) => (
                                <div key={v._id} className="border rounded-lg !p-3 bg-white">
                                  <div className="flex items-center gap-2 !mb-2">
                                    <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: v.color.hex }} />
                                    <span className="font-medium text-sm">{v.color.name}</span>
                                  </div>

                                  <div className="text-xs space-y-0.5">
                                    <div><strong>MRP:</strong> ₹{v.mrp}</div>
                                    <div><strong>Price:</strong> <span className="text-green-600 font-semibold">₹{v.price}</span></div>
                                    <div><strong>Discount:</strong> <span className="text-orange-600">{v.discount}%</span></div>
                                  </div>

                                  <div className="!mt-2">
                                    <p className="text-xs font-medium text-gray-700 !mb-1">Sizes & Stock:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {v.sizes.map((sz) => (
                                        <span
                                          key={sz._id}
                                          className={`inline-block !px-1.5 !py-0.5 text-xs rounded ${sz.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                          {sz.size}: {sz.stock}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {v.images.length > 0 && (
                                    <div className="!mt-2 flex gap-1 flex-wrap">
                                      {v.images.slice(0, 3).map((img, i) => (
                                        <img
                                          key={img._id}
                                          src={img.url}
                                          className="w-10 h-10 object-cover rounded border"
                                        />
                                      ))}
                                      {v.images.length > 3 && (
                                        <div className="w-10 h-10 bg-gray-200 border rounded flex items-center justify-center text-xs">
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
    </>
  );
}