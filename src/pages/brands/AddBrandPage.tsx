import React, { useState } from "react";
import AddBrandForm from "../../components/Brand/AddBrandForm";
import BrandTable from "../../components/Brand/BrandTable";
import { useAuth } from "../../context/AuthContext";

const AddBrandPage: React.FC = () => {
  const { merchant, isLoading } = useAuth();
  const createdByType: "Merchant" | "Admin" = "Merchant";

  const [refreshKey, setRefreshKey] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!merchant) return null;

  return (
    <>
      <AddBrandForm
        createdById={merchant.id}
        createdByType={createdByType}
        onSuccess={() => setRefreshKey((prev) => prev + 1)} // 👈 bump key
      />
      <BrandTable key={refreshKey} merchantId={merchant.id} />
    </>
  );
};

export default AddBrandPage;

