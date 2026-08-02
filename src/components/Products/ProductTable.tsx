import React, { useState, useEffect, useMemo } from "react";
import {
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
interface Product {
  id: string; name: string; brand: string; category: string; subCategory: string;
  subSubCategory: string; gender: string[]; description: string; tags: string[];
  isTriable: boolean; ratings: number; numReviews: number; isActive: boolean;
  color?: Color; mrp: number; price: number;
  discount: number; images?: Image[]; productCode?: string; sizes?: Size[]; createdAt: string; updatedAt: string;
}

export default function ProductTable({ merchantId }: { merchantId: string }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
              {["Image", "SKU Code", "Name", "Brand", "Category", "Color", "Sizes & Stock", "Total Stock", "MRP", "Price", "Status", "Actions"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={12}>
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
                const firstImgUrl = product.images?.[0]?.url || "";
                const totalStock = product.sizes?.reduce((sum: number, sz: any) => sum + (sz.stock || 0), 0) || 0;

                return (
                  <tr key={product.id}>
                    <td>
                      {firstImgUrl ? (
                        <img src={firstImgUrl} alt={product.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }} />
                      ) : (
                        <div style={{ width: "40px", height: "40px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>—</span>
                        </div>
                      )}
                    </td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", fontFamily: "monospace" }}>
                      {product.productCode || "N/A"}
                    </td>
                    <td style={{ fontWeight: 500 }} className="truncate">{product.name}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{product.brand}</td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: "var(--text-sm)" }}>{product.category}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                          {product.subCategory}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                        <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "1px solid var(--color-border)", backgroundColor: product.color?.hex || "#ccc" }} />
                        <span style={{ fontSize: "var(--text-sm)" }}>{product.color?.name || "Default"}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: "200px" }}>
                      <div className="flex flex-wrap" style={{ gap: "4px" }}>
                        {product.sizes?.map((sz: any) => (
                          <span key={sz._id} className={`badge ${sz.stock > 0 ? "badge-success" : "badge-danger"}`} style={{ fontSize: "11px", padding: "2px 6px" }}>
                            {sz.size}: {sz.stock}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: totalStock > 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                        {totalStock}
                      </span>
                    </td>
                    <td style={{ textDecoration: "line-through", color: "var(--color-text-tertiary)" }}>₹{product.mrp}</td>
                    <td style={{ color: "var(--color-success)", fontWeight: 600 }}>₹{product.price}</td>
                    <td>
                      <span className={`badge ${product.isActive ? "badge-success" : "badge-danger"}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex" style={{ gap: "var(--space-1)" }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "4px", color: "var(--color-success)" }} onClick={() => navigate(`/merchant/add-product?copyFrom=${product.id}`)} title="Duplicate SKU (Create variant)">
                          <Plus size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "4px", color: "var(--color-info)" }} onClick={() => handleEdit(product.id)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: "4px", color: "var(--color-danger)" }} onClick={() => handleDelete(product.id)}>
                          <Trash2 size={14} />
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
    </>
  );
}