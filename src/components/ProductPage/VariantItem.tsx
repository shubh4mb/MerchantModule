// components/ProductPage/VariantItem.jsx
import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  Minus,
  X,
  Edit3,
  Save,
} from "lucide-react";
import ImageGallery from "./ImageGallery";
import { getStockStatus } from "./utils/stockUtils";
import { deleteVariantSizes, updatePrice } from "../../api/products";
import { useConfirmDialog } from "../../context/ConfirmDialogContext";
import AddSizeInput from "./AddSizeInput";

const VariantItem = ({
  variant,
  variantIndex,
  productId,
  isExpanded,
  onToggleExpansion,
  onDelete,
  onUpdateStock,
  onImageUpload,
  onRemoveImage,
  onVariantUpdate,
  onPriceUpdate,
}) => {
  const [showAddSize, setShowAddSize] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [mrp, setMrp] = useState(variant.mrp || 0);
  const [price, setPrice] = useState(variant.price || 0);
  const [discount, setDiscount] = useState(variant.discount || 0);
  const { openConfirm } = useConfirmDialog();

  useEffect(() => {
    if (mrp > 0 && price >= 0) {
      const calculatedDiscount = Math.round(((mrp - price) / mrp) * 100);
      setDiscount(calculatedDiscount);
    } else setDiscount(0);
  }, [mrp, price]);

  useEffect(() => {
    setMrp(variant.mrp || 0);
    setPrice(variant.price || 0);
    setDiscount(variant.discount || 0);
  }, [variant._id, variant.mrp, variant.price, variant.discount]);

  const handlePriceChange = (field, value) => {
    const numValue = value === "" ? 0 : parseFloat(value) || 0;
    if (field === "mrp") setMrp(numValue);
    else if (field === "price") setPrice(numValue);
  };

  const handleSavePrice = async () => {
    try {
      setIsEditing(false);
      const updatedProduct = await updatePrice(productId, variant._id, {
        mrp: parseFloat(mrp),
        price: parseFloat(price),
        discount,
      });
      const updatedVariant = updatedProduct.product.variants.find(
        (v) => v._id === variant._id
      );
      onPriceUpdate?.(updatedVariant);
    } catch (err) {
      console.error("Price update failed:", err.message);
    }
  };

  const toMoney = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };

  const displayDiscount = isEditing ? discount : variant.discount || 0;

  const handleDeleteVariant = () => {
    openConfirm({
      title: "Delete Variant",
      message: `Are you sure you want to delete "${
        typeof variant.color === "object" ? variant.color.name : variant.color
      }"?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      confirmColor: "red",
      onConfirm: () => onDelete?.(variant._id),
    });
  };

return (
  <div
    className={`bg-slate-50 border border-slate-200 rounded-xl !p-5 transition-all duration-300 hover:bg-slate-100 ${
      isExpanded ? "shadow-md" : ""
    }`}
  >
    {/* HEADER */}
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 ">
      {/* Left section */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="w-4 h-4 rounded-full border-2 border-slate-300"
          style={{ backgroundColor: variant.color?.hex || variant.color }}
        />
        <span className="font-semibold text-gray-800 capitalize">
          {typeof variant.color === "object"
            ? variant.color.name
            : variant.color}
        </span>
        <span className="bg-amber-200 border border-amber-400 text-amber-800 text-xs font-semibold  !px-2  !py-1 rounded-full">
          {variant.sizes.reduce((t, s) => t + s.stock, 0)} units
        </span>

        {/* Pricing */}
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                value={mrp}
                onChange={(e) => handlePriceChange("mrp", e.target.value)}
                className="border border-gray-300 rounded-md  !px-2  !py-1 text-sm w-20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                placeholder="MRP"
              />
              <input
                type="number"
                value={price}
                onChange={(e) => handlePriceChange("price", e.target.value)}
                className="border border-gray-300 rounded-md  !px-2  !py-1 text-sm w-20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
                placeholder="Price"
              />
              <span className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md  !px-2  !py-1 text-xs font-semibold">
                {discount}% OFF
              </span>
              <div className="flex gap-1">
                <button
                  onClick={handleSavePrice}
                  className="bg-green-500 hover:bg-green-600 text-white [!p-1.5] rounded-md shadow"
                >
                  <Save size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setMrp(variant.mrp);
                    setPrice(variant.price);
                    setDiscount(variant.discount);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 !p-1.5 rounded-md"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <span className="bg-red-100 text-red-600 border border-red-300 rounded-md !px-2 [!py-1] text-xs font-semibold">
                MRP: ${toMoney(mrp)}
              </span>
              <span className="bg-green-100 text-green-700 border border-green-300 rounded-md !px-2 !py-1 text-xs font-semibold">
                Price: ${toMoney(price)}
              </span>
              <span className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md !px-2 !py-1 text-xs font-semibold">
                {displayDiscount}% OFF
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="border border-gray-300 bg-gray-50 hover:bg-gray-100 !p-1.5 rounded-md"
              >
                <Edit3 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
        <button
          onClick={onToggleExpansion}
          className="flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md !px-3 !py-1.5 text-xs font-medium shadow"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={14} /> Collapse
            </>
          ) : (
            <>
              <ChevronDown size={14} /> Images & Stock
            </>
          )}
        </button>

        <button
          onClick={handleDeleteVariant}
          className="bg-red-500 hover:bg-red-600 text-white rounded-md !p-2 shadow"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>

    {/* Compact Sizes */}
    {!isExpanded && (
      <div className="flex flex-wrap gap-2">
        {variant.sizes.map((size, i) => (
          <div
            key={i}
            className={`flex justify-between items-center !px-3 !py-1 border rounded-lg min-w-[70px] text-xs font-semibold ${
              getStockStatus(size.stock) === "high-stock"
                ? "border-green-400 bg-green-50 text-green-800"
                : getStockStatus(size.stock) === "medium-stock"
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : getStockStatus(size.stock) === "low-stock"
                ? "border-red-400 bg-red-50 text-red-700"
                : "border-gray-300 bg-gray-50 text-gray-500 opacity-60"
            }`}
          >
            <span>{size.size}</span>
            <span>{size.stock}</span>
          </div>
        ))}
      </div>
    )}

    {/* Expanded section */}
    {isExpanded && (
      <>
        <ImageGallery
          images={variant.images}
          productId={productId}
          variantIndex={variantIndex}
          variantColor={variant.color?.name || variant.color}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveImage}
        />

        {/* Sizes grid */}
        <div className="[!mt-4]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {variant.sizes.map((size, i) => (
              <div
                key={i}
                className={`relative [!p-3] rounded-xl border-2 transition hover:-translate-y-1 ${
                  getStockStatus(size.stock) === "high-stock"
                    ? "border-green-400 bg-green-50"
                    : getStockStatus(size.stock) === "medium-stock"
                    ? "border-amber-400 bg-amber-50"
                    : getStockStatus(size.stock) === "low-stock"
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 bg-gray-50 opacity-60"
                }`}
              >
                <div className="flex justify-between items-center [!mb-2]">
                  <span className="font-semibold text-sm text-gray-800">
                    {size.size}
                  </span>
                  <span
                    className={`text-xs font-bold [!px-2] [!py-1] rounded ${
                      getStockStatus(size.stock) === "high-stock"
                        ? "bg-green-500 text-white"
                        : getStockStatus(size.stock) === "medium-stock"
                        ? "bg-amber-500 text-white"
                        : getStockStatus(size.stock) === "low-stock"
                        ? "bg-red-500 text-white"
                        : "bg-gray-400 text-white"
                    }`}
                  >
                    {size.stock}
                  </span>
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onUpdateStock(variantIndex, i, -1)}
                    disabled={size.stock === 0}
                    className="w-8 h-8 rounded-md bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    onClick={() => onUpdateStock(variantIndex, i, 1)}
                    className="w-8 h-8 rounded-md bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <button
                  onClick={async () => {
                    const updatedProduct = await deleteVariantSizes(
                      productId,
                      variant._id,
                      size._id
                    );
                    onVariantUpdate(updatedProduct.product.variants);
                  }}
                  className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full [!p-1.5] shadow"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAddSize((p) => !p)}
            className="[!mt-3] flex items-center gap-1 border border-dashed border-gray-400 rounded-md [!px-3] [!py-2] text-sm text-gray-700 hover:bg-gray-100"
          >
            {showAddSize ? <X size={16} /> : <Plus size={16} />}
            <span>{showAddSize ? "Close" : "Add Size"}</span>
          </button>
        </div>

        {showAddSize && (
          <AddSizeInput
            productId={productId}
            variantId={variant._id}
            onSuccess={(updated) => {
              onVariantUpdate(updated);
              setShowAddSize(false);
            }}
          />
        )}
      </>
    )}
  </div>
);

};

export default VariantItem;
