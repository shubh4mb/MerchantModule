// components/Brands/BrandTable.jsx
import React, { useEffect, useState } from "react";
import { getBrands ,deleteBrand} from "../../api/products";
import "./BrandTable.css"; // Import the CSS file

const BrandTable = ({ merchantId }) => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantId) return;
    fetchBrands();
  }, [merchantId]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await getBrands(merchantId);
      console.log("API Response:", res);
      setBrands(res.brands || []);
    } catch (err) {
      console.error("Error fetching brands:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (brandId) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;

  try {
    await deleteBrand(merchantId, brandId);
    setBrands(prev => prev.filter(b => b._id !== brandId));
  } catch (err) {
    console.error(err);
  }

  };


  if (loading) return (
    <div className="brand-table-container">
      <div className="brand-table">
        <p className="loading-message">Loading brands...</p>
      </div>
    </div>
  );

  return (
    <div className="brand-table-container">
      <div className="brand-table">
        <h2>Brand Management</h2>
        {brands.length === 0 ? (
          <p className="no-brands-message">No brands found</p>
        ) : (
          <table className="brands-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Logo</th>
                <th>Brand Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand, index) => (
                <tr key={brand._id}>
                  <td>{index + 1}</td>
                  <td>
                    <img
                      src={brand.logo?.url}
                      alt={brand.name}
                      className="brand-logo"
                    />
                  </td>
                  <td className="brand-name">{brand.name}</td>
                  <td>
                                        <button
                      className="delete-btn"
                      onClick={() => handleDelete(brand._id)}
                    >
                      Delete
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BrandTable;