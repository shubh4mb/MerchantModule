import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Search,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchProductsByMerchantId, deleteProduct } from "../../api/products";

interface Size { size: string; stock: number; _id: string; }
interface Color { name: string; hex: string; }
interface Image { public_id: string; url: string; _id: string; }
interface Variant { color: Color; sizes: Size[]; mrp: number; price: number; images: Image[]; discount: number; _id: string; }
interface Product {
  id: string; name: string; brand: string; category: string; subCategory: string;
  subSubCategory: string; gender: string[]; description: string; tags: string[];
  isTriable: boolean; ratings: number; numReviews: number; isActive: boolean;
  variants: Variant[]; createdAt: string; updatedAt: string;
}

export default function ProductTable({ merchantId }: { merchantId: string }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ name: "", description: "", category: "" });

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
      const d = p.description.toLowerCase().includes(filters.description.toLowerCase());
      const c =
        p.category.toLowerCase().includes(filters.category.toLowerCase()) ||
        p.subCategory.toLowerCase().includes(filters.category.toLowerCase()) ||
        p.subSubCategory.toLowerCase().includes(filters.category.toLowerCase());
      return n && d && c;
    });
  }, [products, filters]);

  const handleEdit = (id: string) => navigate(`/merchant/edit/${id}`);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert("Deleted successfully");
    } catch (e) {
      alert("Failed to delete product");
    }
  };

  const getFirstImage = (variants: Variant[]): string | undefined => {
    if (!variants.length) return undefined;
    return variants[0].images?.[0]?.url;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ height: "256px" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
            <Search size={16} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name..."
              className="input"
              value={filters.name}
              onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="flex flex-col sm:flex-row" style={{ gap: "var(--space-3)" }}>
            <input
              type="text"
              placeholder="Filter by description..."
              className="input"
              style={{ flex: 1 }}
              value={filters.description}
              onChange={(e) => setFilters((p) => ({ ...p, description: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Category / Subcategory..."
              className="input"
              style={{ flex: 1 }}
              value={filters.category}
              onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper" style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: "800px" }}>
          <thead>
            <tr>
              {["", "Image", "Name", "Brand", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">
                    <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>No products found</p>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate("/merchant/add-product")}>
                      <Plus size={14} />
                      Add Your First Product
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const isExpanded = expandedRows.has(product.id);
                const totalStock = product.variants.reduce(
                  (a, v) => a + v.sizes.reduce((s, sz) => s + sz.stock, 0), 0
                );
                const prices = product.variants.map((v) => v.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const firstImgUrl = getFirstImage(product.variants);

                return (
                  <React.Fragment key={product.id}>
                    <tr>
                      <td>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "4px" }} onClick={() => toggleExpand(product.id)}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td>
                        {firstImgUrl ? (
                          <img src={firstImgUrl} alt={product.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }} />
                        ) : (
                          <div style={{ width: "40px", height: "40px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>—</span>
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 500 }} className="truncate">{product.name}</td>
                      <td style={{ color: "var(--color-text-secondary)" }}>{product.brand}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: "var(--text-sm)" }}>{product.category}</div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                            {product.subCategory} → {product.subSubCategory}
                          </div>
                        </div>
                      </td>
                      <td>₹{minPrice} - ₹{maxPrice}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: totalStock > 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                          {totalStock}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${product.isActive ? "badge-success" : "badge-danger"}`}>
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="flex" style={{ gap: "var(--space-1)" }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: "4px", color: "var(--color-info)" }} onClick={() => handleEdit(product.id)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: "4px", color: "var(--color-danger)" }} onClick={() => handleDelete(product.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} style={{ padding: 0, background: "var(--color-bg)" }}>
                          <div style={{ padding: "var(--space-4)" }}>
                            <h4 style={{ fontWeight: 600, marginBottom: "var(--space-3)", fontSize: "var(--text-base)" }}>Variants</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "var(--space-3)" }}>
                              {product.variants.map((v) => (
                                <div key={v._id} className="card" style={{ padding: "var(--space-3)" }}>
                                  <div className="flex items-center" style={{ gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "1px solid var(--color-border)", backgroundColor: v.color.hex }} />
                                    <span style={{ fontWeight: 500, fontSize: "var(--text-sm)" }}>{v.color.name}</span>
                                  </div>
                                  <div style={{ fontSize: "var(--text-xs)", display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <div><strong>MRP:</strong> ₹{v.mrp}</div>
                                    <div><strong>Price:</strong> <span style={{ color: "var(--color-success)", fontWeight: 600 }}>₹{v.price}</span></div>
                                    <div><strong>Discount:</strong> <span style={{ color: "var(--color-warning)" }}>{v.discount}%</span></div>
                                  </div>
                                  <div style={{ marginTop: "var(--space-2)" }}>
                                    <p style={{ fontSize: "var(--text-xs)", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>Sizes & Stock</p>
                                    <div className="flex flex-wrap" style={{ gap: "4px" }}>
                                      {v.sizes.map((sz) => (
                                        <span key={sz._id} className={`badge ${sz.stock > 0 ? "badge-success" : "badge-danger"}`}>
                                          {sz.size}: {sz.stock}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  {v.images.length > 0 && (
                                    <div className="flex flex-wrap" style={{ marginTop: "var(--space-2)", gap: "4px" }}>
                                      {v.images.slice(0, 3).map((img) => (
                                        <img key={img._id} src={img.url} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }} />
                                      ))}
                                      {v.images.length > 3 && (
                                        <div style={{ width: "36px", height: "36px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
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