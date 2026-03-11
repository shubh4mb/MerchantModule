import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProductTable from "../components/Products/ProductTable";
import { Package, Tag, ArrowRight } from "lucide-react";

export default function InventoryPage() {
  const { merchant, isLoading } = useAuth();

  if (isLoading) return null;
  if (!merchant) return null;

  return (
    <div className="bg-slate-50 min-h-screen font-sans p-4 sm:p-6">
      {/* Header Cards – always 1 column */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* NEW PRODUCT */}
        <Link
          to="/merchant/add-product"
          className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-2 border-transparent rounded-2xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 hover:from-blue-50 hover:to-blue-100 no-underline flex-1 min-w-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 flex-shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">NEW PRODUCT</h3>
            <p className="text-xs text-slate-500">Add new items to inventory</p>
          </div>
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </Link>

        {/* NEW BRAND */}
        <Link
          to="/merchant/add-brand"
          className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-2 border-transparent rounded-2xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 hover:from-emerald-50 hover:to-emerald-100 no-underline flex-1 min-w-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 text-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 flex-shrink-0">
            <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">NEW BRAND</h3>
            <p className="text-xs text-slate-500">Register new brand</p>
          </div>
          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </Link>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b-4 border-slate-100 gap-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wider uppercase">
          INVENTORY
        </h2>
      </div>

      <ProductTable merchantId={merchant.id} />
    </div>
  );
}

