import React, { useEffect, useState } from "react";
import {
  Edit3,
  Trash2,
  X,
  Save,
  Loader,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getStockStatus } from "./utils/stockUtils";
import { updatePrice } from "../../api/products";

type ProductHeaderProps = {
  product: any;
  index: number;
  isEditing: boolean;
  tempData: any;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateTempData: (field: string, value: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  onSave: () => void;
  error?: string;
  variants: any[];
  onPriceUpdate?: (updatedVariant: any) => void;
  disabled?: boolean;
  totalStock?: number;
};

const toMoney = (val: any) => {
  const n = Number(val);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
};

const ProductHeader: React.FC<ProductHeaderProps> = ({
  product,
  index,
  isEditing,
  tempData,
  onEdit,
  onDelete,
  onUpdateTempData,
  onCancel,
  isLoading = false,
  onSave,
  variants,
  onPriceUpdate,
  disabled,
}) => {
  const firstVariantImage =
    product?.variants?.[0]?.images?.[0]?.url || product.image || "";

  const [showDetails, setShowDetails] = useState(false);

  // Variant 0 guard
  const v0 = variants?.[0] ?? {};

  const [isPriceEditing, setIsPriceEditing] = useState(false);
  const [priceForm, setPriceForm] = useState<{
    mrp: number | "";
    price: number | "";
    discount: number | "";
  }>({
    mrp: Number(v0?.mrp ?? 0),
    price: Number(v0?.price ?? 0),
    discount: Number(v0?.discount ?? 0),
  });
  const [priceLoading, setPriceLoading] = useState(false);

  // recompute disabled
  const noVariants = !Array.isArray(variants) || variants.length === 0;
  const isDisabled = disabled ?? noVariants;

  useEffect(() => {
    setPriceForm({
      mrp: Number(v0?.mrp ?? 0),
      price: Number(v0?.price ?? 0),
      discount: Number(v0?.discount ?? 0),
    });
  }, [v0?.mrp, v0?.price, v0?.discount, variants?.length]);

  const handlePriceChange = (
    field: "mrp" | "price" | "discount",
    value: string
  ) => {
    const num = value === "" ? "" : Number(value);
    setPriceForm((prev) => {
      let { mrp, price, discount } = { ...prev };

      if (field === "mrp") {
        mrp = num;
        if (mrp !== "" && price !== "") {
          discount = Math.round(
            ((((mrp as number) - price) as number) / (mrp as number)) * 100
          );
        }
      } else if (field === "price") {
        price = num;
        if (mrp !== "" && price !== "") {
          discount = Math.round(
            ((((mrp as number) - price) as number) / (mrp as number)) * 100
          );
        }
      } else if (field === "discount") {
        discount = num;
        if (mrp !== "" && discount !== "") {
          price = Math.round(
            (mrp as number) - ((mrp as number) * (discount as number)) / 100
          );
        }
      }

      return { mrp, price, discount };
    });
  };

  const handlePriceSave = async () => {
    try {
      setPriceLoading(true);

      const payload = {
        mrp: Number(priceForm.mrp) || 0,
        price: Number(priceForm.price) || 0,
        discount: Number(priceForm.discount) || 0,
      };

      await updatePrice(product._id ?? product.id, v0._id, payload);

      onPriceUpdate?.({
        ...v0,
        ...payload,
      });

      setIsPriceEditing(false);
    } catch (err: any) {
      console.error("Failed to update price:", err);
      alert(err?.message ?? "Failed to update price");
    } finally {
      setPriceLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col md:flex-row items-start md:items-center justify-between !gap-4 !p-4 md:!p-4 max-[480px]:flex-row max-[480px]:items-center max-[480px]:justify-between max-[480px]:!p-3 border border-gray-200 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-gray-300 ${
        isDisabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Product Image */}
      <div className="w-[90px] h-[90px] max-[480px]:w-[70px] max-[480px]:h-[70px] flex-shrink-0 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
        {firstVariantImage ? (
          <img
            src={firstVariantImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex justify-center items-center text-gray-400 text-xs font-medium text-center">
            No Image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex items-start !gap-4 flex-1 min-w-0 w-full md:w-auto">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={tempData.name || ""}
              onChange={(e) => onUpdateTempData("name", e.target.value)}
              className="text-xl font-semibold text-gray-800 !m-0 !mb-4 border-2 border-gray-200 rounded-lg !px-3 !py-2.5 bg-white w-full transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] font-[inherit]"
              disabled={isLoading}
              placeholder="Product name"
              required
            />
          ) : (
            <h3
              className="text-[1.375rem] max-[480px]:text-[1.125rem] font-semibold text-gray-800 !m-0 !mb-4 leading-snug truncate max-w-full overflow-hidden text-ellipsis"
              title={product.name}
            >
              {product.name}
            </h3>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center !gap-3 flex-wrap !mb-2 max-[768px]:flex-col max-[768px]:items-start max-[768px]:!gap-2">
            <div className="hidden md:flex flex-wrap items-center gap-3 mb-2">
              <span className="!px-3 !py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide whitespace-nowrap border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-900">
                {product.brand || product.brandId?.name}
              </span>
              <span className="!px-3 !py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide whitespace-nowrap border border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-200 text-indigo-900">
                {product.category || product.categoryId?.name}
              </span>
              <span className="!px-3 !py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide whitespace-nowrap border border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-200 text-indigo-900">
                {product.subCategory ?? product.subCategoryId?.name ?? ""}
              </span>
              <span className="!px-3 !py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide whitespace-nowrap border border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-200 text-indigo-900">
                {product.subSubCategory ?? product.subSubCategoryId?.name ?? ""}
              </span>
            </div>

            {Array.isArray(variants) && variants.length === 1 && (
              <button
                className="bg-transparent border-2 border-gray-200 rounded-lg !px-3 !py-2 flex items-center !gap-2 cursor-pointer transition-all duration-300 text-gray-500 text-xs font-medium uppercase tracking-wide ml-auto max-[768px]:ml-0 max-[768px]:self-start hover:bg-gray-100 hover:border-indigo-500 hover:text-indigo-500 hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(99,102,241,0.1)] active:translate-y-0"
                onClick={() => setShowDetails((prev) => !prev)}
              >
                {showDetails ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}{" "}
                details
              </button>
            )}
          </div>

          {/* Variant details */}
          {Array.isArray(variants) && variants.length === 1 && showDetails && (
            <div className="!mt-4 !p-4 border border-gray-200 rounded-xl bg-gray-50 shadow-[0_2px_4px_rgba(0,0,0,0.05)] animate-[fadeSlide_0.4s_ease]">
              <style>{`
                @keyframes fadeSlide {
                  from {
                    opacity: 0;
                    transform: translateY(-8px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              <div className="flex flex-col md:flex-row items-start md:items-center !gap-3 flex-wrap !mt-2 max-[480px]:flex-col max-[480px]:items-start max-[480px]:!gap-2">
                {isPriceEditing ? (
                  <>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={priceForm.mrp}
                      onChange={(e) => handlePriceChange("mrp", e.target.value)}
                      className="border-2 border-gray-200 rounded-lg !px-3 !py-2 text-sm font-medium w-[110px] bg-white text-gray-800 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                      placeholder="MRP"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={priceForm.price}
                      onChange={(e) =>
                        handlePriceChange("price", e.target.value)
                      }
                      className="border-2 border-gray-200 rounded-lg !px-3 !py-2 text-sm font-medium w-[110px] bg-white text-gray-800 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                      placeholder="Selling Price"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={priceForm.discount}
                      onChange={(e) =>
                        handlePriceChange("discount", e.target.value)
                      }
                      className="border-2 border-gray-200 rounded-lg !px-3 !py-2 text-sm font-medium w-[110px] bg-white text-gray-800 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                      placeholder="Discount %"
                    />
                  </>
                ) : (
                  <>
                    <span className="!px-3 !py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border border-amber-500 bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-800">
                      MRP: ${toMoney(v0.mrp)}
                    </span>
                    <span className="!px-3 !py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border border-green-500 bg-gradient-to-br from-green-100 to-green-200 text-green-800">
                      Price: ${toMoney(v0.price)}
                    </span>
                    <span className="!px-3 !py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border border-red-500 bg-gradient-to-br from-red-100 to-red-200 text-red-700">
                      {Number(v0.discount ?? 0)}% OFF
                    </span>
                  </>
                )}
                <div className="flex !gap-2 items-center ml-auto max-[480px]:!ml-0 max-[480px]:!mt-2">
                  {isPriceEditing ? (
                    <>
                      <button
                        className="!m-0 border-none rounded-lg !px-3 !py-2 flex items-center justify-center !gap-2 cursor-pointer transition-all duration-300 font-semibold text-[0.8rem] min-w-0 shadow-[0_2px_4px_rgba(0,0,0,0.1)] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-300/50 hover:-translate-y-0.5 hover:shadow-[0_8px_15px_-3px_rgba(99,102,241,0.4)] hover:from-indigo-600 hover:to-indigo-800 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        onClick={handlePriceSave}
                        disabled={priceLoading}
                      >
                        {priceLoading ? (
                          <>
                            <Loader size={16} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <Save size={16} />
                        )}
                      </button>
                      <button
                        className="!m-0 border-none rounded-lg !px-3 !py-2 flex items-center justify-center !gap-2 cursor-pointer transition-all duration-300 font-semibold text-[0.8rem] min-w-0 shadow-[0_2px_4px_rgba(0,0,0,0.1)] bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-300/50 hover:-translate-y-0.5 hover:shadow-[0_8px_15px_-3px_rgba(239,68,68,0.4)] hover:from-red-600 hover:to-red-700 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        onClick={() => setIsPriceEditing(false)}
                        disabled={priceLoading}
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      className="!m-0 border-none rounded-lg !px-3 !py-2 flex items-center justify-center !gap-2 cursor-pointer transition-all duration-300 font-semibold text-[0.8rem] min-w-0 shadow-[0_2px_4px_rgba(0,0,0,0.1)] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-300/50 hover:-translate-y-0.5 hover:shadow-[0_8px_15px_-3px_rgba(99,102,241,0.4)] hover:from-indigo-600 hover:to-indigo-800 active:translate-y-0"
                      onClick={() => setIsPriceEditing(true)}
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap !gap-2 !mt-4 max-[480px]:!gap-1.5">
                {v0?.sizes?.map(
                  (sizeData: any, sizeIndex: number) =>
                    sizeData?.size && (
                      <div
                        key={sizeIndex}
                        className={`flex items-center justify-between min-w-[65px] max-[480px]:min-w-[55px] !px-3 !py-2 max-[480px]:!px-2 max-[480px]:!py-1.5 rounded-lg text-[0.8rem] font-medium bg-white border-2 shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.1)] ${
                          getStockStatus(sizeData.stock) === "in-stock"
                            ? "border-green-500"
                            : getStockStatus(sizeData.stock) === "low-stock"
                            ? "border-amber-500"
                            : "border-red-500 opacity-70"
                        }`}
                      >
                        <span className="font-semibold text-slate-700">
                          {sizeData.size}
                        </span>
                        <span
                          className={`text-xs font-bold !px-1.5 !py-0.5 rounded bg-black/5 ${
                            getStockStatus(sizeData.stock) === "in-stock"
                              ? "text-green-800 bg-green-100"
                              : getStockStatus(sizeData.stock) === "low-stock"
                              ? "text-yellow-800 bg-yellow-100"
                              : "text-red-800 bg-red-100"
                          }`}
                        >
                          {sizeData.stock}
                        </span>
                      </div>
                    )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col lg:flex-row !gap-3 flex-shrink-0 items-end lg:items-center w-full md:w-auto max-[768px]:flex-row max-[768px]:justify-start max-[768px]:w-full max-[768px]:!gap-3 max-[480px]:flex-col max-[480px]:w-full">
        {isEditing ? (
          <>
            <button
              className="border-none rounded-xl !px-5 !py-3 flex items-center justify-center !gap-2 cursor-pointer transition-all duration-300 font-semibold text-sm min-w-[120px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-300/50 hover:-translate-y-0.5 hover:shadow-[0_8px_15px_-3px_rgba(99,102,241,0.4)] hover:from-indigo-600 hover:to-indigo-800 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none max-[768px]:flex-1 max-[768px]:min-w-0 max-[480px]:w-full max-[480px]:justify-center"
              onClick={onSave}
              disabled={isLoading || isDisabled}
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save</span>
                </>
              )}
            </button>
            <button
              className="border-none rounded-xl !px-5 !py-3 flex items-center justify-center !gap-2 cursor-pointer transition-all duration-300 font-semibold text-sm min-w-[120px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-300/50 hover:-translate-y-0.5 hover:shadow-[0_8px_15px_-3px_rgba(239,68,68,0.4)] hover:from-red-600 hover:to-red-700 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none max-[768px]:flex-1 max-[768px]:min-w-0 max-[480px]:w-full max-[480px]:justify-center"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          </>
        ) : (
          <>
            <button
              className="border-none rounded-xl !px-5 !py-3 flex items-center justify-center !gap-2 cursor-pointer transition-all duration-300 font-semibold text-sm min-w-[120px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-300/50 hover:-translate-y-0.5 hover:shadow-[0_8px_15px_-3px_rgba(99,102,241,0.4)] hover:from-indigo-600 hover:to-indigo-800 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none max-[768px]:flex-1 max-[768px]:min-w-0 max-[480px]:w-full max-[480px]:justify-center"
              onClick={onEdit}
              disabled={isDisabled || isLoading}
            >
              <Edit3 size={16} />
              <span>Edit</span>
            </button>
            <button
              className="border-none rounded-xl !px-5 !py-3 flex items-center justify-center !gap-2 cursor-pointer transition-all duration-300 font-semibold text-sm min-w-[120px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-300/50 hover:-translate-y-0.5 hover:shadow-[0_8px_15px_-3px_rgba(239,68,68,0.4)] hover:from-red-600 hover:to-red-700 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none pointer-events-auto opacity-100 cursor-pointer max-[768px]:flex-1 max-[768px]:min-w-0 max-[480px]:w-full max-[480px]:justify-center"
              onClick={onDelete}
              disabled={isLoading}
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </>
        )}
        {isDisabled && (
          <p className="text-red-600 text-sm !mt-2 font-medium">
            Failed to add product variant, delete the listing
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductHeader;
