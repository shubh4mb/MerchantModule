import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProductTable from "../components/Products/ProductTable";
import { Package, Plus } from "lucide-react";

export default function InventoryPage() {
  const { merchant, isLoading } = useAuth();

  if (isLoading) return null;
  if (!merchant) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-sans selection:bg-black selection:text-white pb-20 -m-4 sm:-m-6">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#0a0a0a]/80 border-b border-gray-100 dark:border-white/5 sticky top-0 z-30 backdrop-blur-xl px-4 sm:px-6 lg:px-12 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.2em] mb-2">
            <Package className="w-4 h-4" />
            <span>Repository Core</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase italic">
            Inventory <span className="text-blue-500 not-italic">Data</span>
          </h1>
        </div>

        <Link
          to="/merchant/add-product"
          className="group flex items-center gap-4 bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-black/10 hover:scale-[1.05] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
          Initialize Asset
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">

        <ProductTable merchantId={merchant.id} />
      </div>
    </div>
  );
}

