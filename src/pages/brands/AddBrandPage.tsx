import React, { useState } from "react";
import AddBrandForm from "../../components/Brand/AddBrandForm";
import BrandTable from "../../components/Brand/BrandTable";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

const AddBrandPage: React.FC = () => {
  const { merchant, isLoading } = useAuth();
  const createdByType: "Merchant" | "Admin" = "Merchant";

  const [refreshKey, setRefreshKey] = useState(0);

  if (isLoading) {
    return (
      <div className="flex-center h-[50vh]">
        <Loader2 className="animate-spin text-gray-400" size={40} />
        <p className="!ml-3 font-medium text-gray-500">Loading your profile...</p>
      </div>
    );
  }

  if (!merchant) return (
    <div className="flex-center h-[50vh]">
        <p className="font-semibold text-red-500">Access Denied: Merchant account not found.</p>
    </div>
  );

  return (
    <div className="brand-page-container">
      <AddBrandForm
        createdById={merchant.id}
        createdByType={createdByType}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />
      <BrandTable key={refreshKey} merchantId={merchant.id} />
    </div>
  );
};

export default AddBrandPage;
