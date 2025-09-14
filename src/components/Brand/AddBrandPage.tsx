import React, { useState } from "react";
import AddBrandForm from "./AddBrandForm";
import BrandTable from "./BrandTable";

const AddBrandPage: React.FC = () => {
  const createdById = localStorage.getItem("merchant_id") || "";
  const createdByType: "Merchant" | "Admin" = "Merchant";

  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <AddBrandForm
        createdById={createdById}
        createdByType={createdByType}
        onSuccess={() => setRefreshKey((prev) => prev + 1)} // 👈 bump key
      />
      {createdById ? (
        <BrandTable key={refreshKey} merchantId={createdById} /> // 👈 remount on success
      ) : (
        <p>No merchant ID found in localStorage</p>
      )}
    </>
  );
};

export default AddBrandPage;
