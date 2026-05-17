import { useEffect, useState } from "react";
import { getBrands, deleteBrand } from "../../api/products";
import { Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import "./BrandTable.css";

interface BrandLogo {
  public_id: string;
  url: string;
}

interface Brand {
  _id: string;
  name: string;
  description: string;
  logo: BrandLogo | null;
}

interface BrandTableProps {
  merchantId: string;
}

const BrandTable = ({ merchantId }: BrandTableProps) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;
    fetchBrands();
  }, [merchantId]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await getBrands(merchantId);
      setBrands((res.brands as Brand[]) || []);
    } catch (err) {
      console.error("Error fetching brands:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (brandId: string) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;
    try {
      await deleteBrand(merchantId, brandId);
      setBrands((prev) => prev.filter((b) => b._id !== brandId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete brand.");
    }
  };

  if (loading) return (
    <div className="brand-table-section">
      <div className="brand-table-card flex-center" style={{ minHeight: "200px" }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    </div>
  );

  return (
    <div className="brand-table-section">
      <div className="brand-table-card">
        <div className="brand-table-header">
          <h2 className="brand-table-title">Registered Brands</h2>
          <p className="brand-table-subtitle">You have {brands.length} brand(s) active in your store.</p>
        </div>

        {brands.length === 0 ? (
          <div className="empty-state">
            <ImageIcon size={48} style={{ color: "var(--color-text-tertiary)", marginBottom: "var(--space-4)" }} />
            <p>No brands found. Start by adding one above.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="brand-table">
              <thead>
                <tr>
                  <th style={{ width: "60px", textAlign: "center" }}>#</th>
                  <th style={{ width: "100px" }}>Logo</th>
                  <th>Brand Identity</th>
                  <th style={{ width: "120px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand, index) => (
                  <tr key={brand._id}>
                    <td style={{ textAlign: "center", color: "var(--color-text-tertiary)" }}>{index + 1}</td>
                    <td>
                      <div className="brand-logo-container">
                        {brand.logo?.url ? (
                          <img src={brand.logo.url} alt={brand.name} />
                        ) : (
                          <div className="brand-logo-placeholder"><ImageIcon size={20} /></div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="brand-info">
                        <span className="brand-name">{brand.name}</span>
                        {brand.description && <p className="brand-description">{brand.description}</p>}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(brand._id)}
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandTable;