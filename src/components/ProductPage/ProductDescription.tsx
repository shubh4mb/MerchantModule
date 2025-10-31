// import React from 'react';
import './styles/ProductDescription.css';

const ProductDescription = ({ 
  product, 
  isEditing, 
  tempData, 
  onUpdateTempData, 
  isLoading = false ,
  onSave
}) => (
<div
  className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-xl transition-all duration-300 ease-in-out hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
  style={{
    padding: "1.25rem !important",  // p-5
    marginBottom: "1.5rem !important", // mb-6
  }}
>
  {/* HEADER */}
  <div
    className="flex items-center gap-2 mb-3"
    style={{ marginBottom: "0.75rem !important" }}
  >
    <h4 className="text-base font-semibold text-gray-700 flex items-center gap-2">
      <span role="img" aria-label="note">📝</span>
      Description
    </h4>
  </div>

  {/* CONTENT / EDIT MODE */}
  {isEditing ? (
    <textarea
      value={tempData?.description ?? product?.description ?? ""}
      onChange={(e) => onUpdateTempData("description", e.target.value)}
      rows={4}
      placeholder="Product description..."
      disabled={isLoading}
      className="w-full border-2 border-slate-200 rounded-lg text-sm text-gray-700 bg-white resize-y transition-all duration-300 ease-in-out focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-sans"
      style={{
        padding: "0.75rem !important", // p-3
      }}
    />
  ) : (
    <div className="relative overflow-hidden max-h-12 transition-all duration-500 ease-in-out hover:max-h-40">
      <p
        className="text-gray-500 leading-relaxed text-sm"
        style={{ margin: "0 !important" }}
      >
        {product?.description || "No description available."}
      </p>
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-50 to-transparent transition-opacity duration-500 ease-in-out hover:opacity-0"></div>
    </div>
  )}
</div>

);

export default ProductDescription;
