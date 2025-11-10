import { useEffect, useState } from "react";
import { getBrands, deleteBrand } from "../../api/products";

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
      console.log("API Response:", res);
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
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center !p-5 bg-slate-50">
      <div className="bg-white rounded-xl shadow-lg !p-8 w-full max-w-4xl">
        <p className="text-center !py-10 text-base text-gray-500">Loading brands...</p>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center !p-5 bg-slate-50">
      <div className="bg-white rounded-xl shadow-lg !p-8 w-full max-w-4xl">
        <h2 className="!m-0 !mb-6 text-2xl font-semibold text-gray-800 text-center">Brand Management</h2>
        
        {brands.length === 0 ? (
          <p className="text-center !py-10 text-base text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            No brands found
          </p>
        ) : (
          <div className="!mt-4 overflow-hidden rounded-lg shadow-sm">
            <table className="w-full border-collapse">
              <thead className="bg-gradient-to-br from-indigo-500 to-purple-600">
                <tr>
                  <th className="!px-5 !py-4 text-left font-semibold text-sm text-white uppercase tracking-wide border-0 text-center w-[60px]">
                    #
                  </th>
                  <th className="!px-5 !py-4 text-left font-semibold text-sm text-white uppercase tracking-wide border-0 text-center w-[80px]">
                    Logo
                  </th>
                  <th className="!px-5 !py-4 text-left font-semibold text-sm text-white uppercase tracking-wide border-0">
                    Brand Name
                  </th>
                  <th className="!px-5 !py-4 text-left font-semibold text-sm text-white uppercase tracking-wide border-0 text-center w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand, index) => (
                  <tr 
                    key={brand._id}
                    className={`transition-all duration-200 hover:bg-slate-200 hover:-translate-y-0.5 hover:shadow-md ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <td className="!px-5 !py-4 border-b border-gray-200 align-middle text-sm text-gray-700 text-center font-semibold text-gray-500">
                      {index + 1}
                    </td>
                    <td className="!px-5 !py-4 border-b border-gray-200 align-middle text-sm text-gray-700 text-center">
                      <img
                        src={brand.logo?.url}
                        alt={brand.name}
                        className="w-[50px] h-[50px] object-cover rounded-lg border-2 border-gray-200 transition-transform duration-200 hover:scale-110 hover:border-indigo-500 inline-block"
                      />
                    </td>
                    <td className="!px-5 !py-4 border-b border-gray-200 align-middle text-sm text-gray-700 font-medium text-gray-800">
                      {brand.name}
                    </td>
                    <td className="!px-5 !py-4 border-b border-gray-200 align-middle text-sm text-gray-700 text-center">
                      <button
                        className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 !px-4 !py-2 rounded-md text-xs font-medium uppercase tracking-wide cursor-pointer transition-all duration-200 shadow-[0_2px_4px_rgba(239,68,68,0.3)] hover:bg-gradient-to-br hover:from-red-600 hover:to-red-700 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(239,68,68,0.4)] active:translate-y-0 active:shadow-[0_2px_4px_rgba(239,68,68,0.3)]"
                        onClick={() => handleDelete(brand._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .flex.justify-center {
            padding: 10px !important;
          }
          
          .bg-white.rounded-xl {
            padding: 20px !important;
            border-radius: 8px !important;
          }
          
          h2 {
            font-size: 20px !important;
            margin-bottom: 16px !important;
          }
          
          th, td {
            padding: 12px 8px !important;
            font-size: 12px !important;
          }
          
          .w-\\[50px\\] {
            width: 40px !important;
            height: 40px !important;
          }
          
          button {
            padding: 6px 12px !important;
            font-size: 11px !important;
          }
        }

        @media (max-width: 480px) {
          tr td:first-child,
          tr th:first-child {
            display: none;
          }
          
          th, td {
            padding: 10px 6px !important;
          }
          
          .w-\\[50px\\] {
            width: 35px !important;
            height: 35px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BrandTable;