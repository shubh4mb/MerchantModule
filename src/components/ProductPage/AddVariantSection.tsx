import React, { useState } from "react";
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Minus,
  Trash2,
} from "lucide-react";
import VariantForm from "./VariantForm";
import ImageGallery from "./ImageGallery";
import { getStockStatus } from "./utils/stockUtils";
import { deleteVariantSizes } from "../../api/products";
import AddSizeInput from "./AddSizeInput";

interface Size {
  _id: string;
  size: string;
  stock: number;
}

interface Variant {
  _id: string;
  color?: string;
  images?: string[];
  sizes?: Size[];
}

interface AddVariantSectionProps {
  productId: string;
  isAddingVariant: boolean;
  setAddingVariant: React.Dispatch<React.SetStateAction<boolean>>;
  variants: Variant[];
  onVariantUpdate: (variants: Variant[]) => void;
  showVariants: boolean;
  onToggleShowVariants: () => void;
  onImageUpload?: (productId: string, image: File) => void;
  onRemoveImage?: (productId: string, imageId: string) => void;
  onUpdateStock: (variantIndex: number, sizeIndex: number, delta: number) => void;
  updateProducts: (updatedProduct: any) => void;
}

const AddVariantSection: React.FC<AddVariantSectionProps> = ({
  productId,
  isAddingVariant,
  setAddingVariant,
  variants,
  onVariantUpdate,
  showVariants,
  onToggleShowVariants,
  onImageUpload,
  onRemoveImage,
  onUpdateStock,
  updateProducts,
}) => {
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showAddSize, setShowAddSize] = useState(false);

  const toggleAddVariant = () => setAddingVariant(!isAddingVariant);

  const handleDeleteSize = async (
    productId: string,
    variantId: string,
    sizeId: string
  ) => {
    try {
      const updatedProduct = await deleteVariantSizes(productId, variantId, sizeId);
      onVariantUpdate(updatedProduct.product.variants);
    } catch (err: any) {
      console.error("Error deleting size:", err.message);
    }
  };

  const handleVariantSubmit = (updatedProduct: any) => {
    onVariantUpdate(updatedProduct.variants);
    updateProducts(updatedProduct);
    setAddingVariant(false);
  };

  return (
    <div className="flex flex-col gap-4 mt-4 w-full">
      {/* ===== Variant Actions ===== */}
      <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start">
        {/* Show / Hide Variants or Gallery */}
        {variants.length > 1 ? (
          <button
            onClick={onToggleShowVariants}
            className="flex items-center gap-1.5 !px-3 !py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 text-sm font-medium transition-all hover:bg-gray-200 hover:border-gray-400"
          >
            {showVariants ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{showVariants ? "Hide Variants" : "Show Variants"}</span>
            <span className="text-xs text-gray-600 font-medium">
              ({variants.length})
            </span>
          </button>
        ) : (
          <button
            onClick={() => setShowImageGallery(!showImageGallery)}
            className="flex items-center gap-1.5 !px-3 !py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 text-sm font-medium transition-all hover:bg-gray-200 hover:border-gray-400"
          >
            <ImageIcon size={16} />
            <span>Images & Stock</span>
          </button>
        )}

        {/* Add Variant Button */}
        <button
          onClick={toggleAddVariant}
          className="flex items-center gap-1.5 !px-3 !py-2 bg-blue-600 text-white rounded-md text-sm font-medium border border-blue-600 transition-all hover:bg-blue-700"
        >
          {isAddingVariant ? <X size={16} /> : <Plus size={16} />}
          <span>{isAddingVariant ? "Cancel" : "Add Variant"}</span>
        </button>
      </div>

      {/* ===== Variant Form ===== */}
      {isAddingVariant && (
        <div className="mt-3 w-full">
          <VariantForm
            productId={productId}
            onSubmit={handleVariantSubmit}
            onCancel={() => setAddingVariant(false)}
            selectedVariantIndex={variants.length}
          />
        </div>
      )}

      {/* ===== Image Gallery & Sizes ===== */}
      {showImageGallery && variants.length === 1 && (
        <>
          {variants.map((variant, variantIndex) => (
            <div key={variant._id} className="mt-4">
              {/* 🖼️ Image Gallery */}
              <ImageGallery
                images={variant.images || []}
                productId={productId}
                variantIndex={variantIndex}
                variantColor={variant.color || "Default"}
                onImageUpload={onImageUpload}
                onRemoveImage={onRemoveImage}
              />

              {/* 🧩 Size Grid */}
              <div className="mt-4">
                <div
                  className="
                    grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
                    gap-3 sm:gap-4
                    overflow-x-auto sm:overflow-visible
                    pb-2
                  "
                >
                  {variant.sizes?.map((sizeData, sizeIndex) => {
                    const stockStatus = getStockStatus(sizeData.stock);

                    const statusColors: Record<string, string> = {
                      "in-stock": "border-emerald-400 bg-emerald-50",
                      "low-stock": "border-amber-400 bg-amber-50",
                      "out-of-stock": "border-red-400 bg-red-50",
                    };

                    const stockColors: Record<string, string> = {
                      "in-stock": "text-emerald-700 bg-emerald-100",
                      "low-stock": "text-amber-700 bg-amber-100",
                      "out-of-stock": "text-red-700 bg-red-100",
                    };

                    return (
                      <div
                        key={sizeData._id}
                        className={`relative border-2 rounded-xl p-3 sm:!p-4 transition-all duration-200 hover:shadow-md ${
                          statusColors[stockStatus] || "border-gray-300 bg-gray-50"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex justify-between items-center !mb-2">
                          <span className="font-semibold text-gray-800 text-sm sm:text-base">
                            {sizeData.size}
                          </span>
                          <span
                            className={`text-xs sm:text-sm font-bold !px-2 !py-0.5 rounded-full ${
                              stockColors[stockStatus] ||
                              "text-gray-700 bg-gray-100"
                            }`}
                          >
                            {sizeData.stock}
                          </span>
                        </div>

                        {/* Stock Controls */}
                        <div className="flex gap-1.5 !mb-2">
                          <button
                            className="flex-1 flex items-center justify-center !p-1.5 bg-red-500 text-white rounded transition-all hover:bg-red-600 disabled:opacity-50"
                            onClick={() =>
                              onUpdateStock(variantIndex, sizeIndex, -1)
                            }
                            disabled={sizeData.stock === 0}
                          >
                            <Minus size={12} />
                          </button>
                          <button
                            className="flex-1 flex items-center justify-center !p-1.5 bg-emerald-500 text-white rounded transition-all hover:bg-emerald-600"
                            onClick={() =>
                              onUpdateStock(variantIndex, sizeIndex, 1)
                            }
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Delete Size */}
                        <button
                          onClick={() =>
                            handleDeleteSize(productId, variant._id, sizeData._id)
                          }
                          title="Delete size"
                          className="w-full flex items-center justify-center gap-1 !py-1.5 bg-red-100 text-red-600 border border-red-300 rounded text-xs sm:text-sm hover:bg-red-200"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* ➕ Add Size Toggle */}
                <button
                  onClick={() => setShowAddSize((prev) => !prev)}
                  className="flex items-center gap-1.5 !px-3.5 !py-2 bg-gray-50 border border-dashed border-gray-400 rounded-md !mt-2 text-sm sm:text-base transition-all hover:bg-gray-100"
                >
                  {showAddSize ? <X size={16} /> : <Plus size={16} />}
                  <span>{showAddSize ? "Close" : "Add Size"}</span>
                </button>
              </div>
            </div>
          ))}

          {/* 🧾 Add Size Input */}
          {showAddSize && (
            <div className="!mt-1 sm:!mt-4">
              <AddSizeInput
                productId={productId}
                variantId={variants[0]._id}
                onSuccess={(updatedVariants: Variant[]) => {
                  onVariantUpdate(updatedVariants);
                  setShowAddSize(false);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddVariantSection;
