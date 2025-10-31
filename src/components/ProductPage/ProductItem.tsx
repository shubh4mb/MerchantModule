import React, { useState, useEffect } from "react";
import ProductHeader from "./ProductHeader";
import { deleteProduct, updateSizeCount } from "../../api/products";
import ProductDescription from "./ProductDescription";
import VariantsList from "./VariantsList";
import AddVariantSection from "./AddVariantSection";
import { useConfirmDialog } from "../../context/ConfirmDialogContext";

interface Size {
  _id: string;
  size: string;
  stock: number;
}

interface Variant {
  _id: string;
  mrp: number;
  price: number;
  discount: number;
  sizes: Size[];
  [key: string]: any;
}

interface Product {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  variants: Variant[];
  totalStock?: number;
  [key: string]: any;
}

interface ProductItemProps {
  product: Product;
  index: number;
  updateProducts: (updatedProduct: Product) => void;
  onDelete?: (productId: string) => void;
  onImageUpload?: (productId: string, image: File) => void;
  onRemoveImage?: (productId: string, imageId: string) => void;
  onSaveProductChanges: (
    product: Product,
    updatedData: Partial<Product>
  ) => Promise<{ success: boolean }>;
}

interface ChangedStock {
  variantId: string;
  sizeId: string;
  size: string;
  stock: number;
}

const ProductItem: React.FC<ProductItemProps> = ({
  product,
  index,
  updateProducts,
  onDelete,
  onImageUpload,
  onRemoveImage,
  onSaveProductChanges,
}) => {
  const productId = product._id || product.id || "";
  const [isEditing, setIsEditing] = useState(false);
  const [tempProductData, setTempProductData] = useState<Partial<Product>>({});
  const [addingVariant, setAddingVariant] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasStockChanges, setHasStockChanges] = useState(false);
  const [tempVariants, setTempVariants] = useState<Variant[]>(product.variants);
  const [changedStocks, setChangedStocks] = useState<ChangedStock[]>([]);
  const { openConfirm } = useConfirmDialog();

  useEffect(() => {
    setTempVariants(product.variants);
    setChangedStocks([]);
  }, [product]);

  const saveStockChanges = async (): Promise<void> => {
    if (changedStocks.length === 0) return;
    try {
      setIsLoading(true);
      for (const { variantId, sizeId, stock } of changedStocks) {
        if (!sizeId) continue;
        await updateSizeCount(productId, variantId, { sizeId, stock });
      }
      updateProducts({ ...product, variants: tempVariants });
      setHasStockChanges(false);
      setChangedStocks([]);
    } catch (err: any) {
      setError(err.message || "Failed to update stock");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await deleteProduct(productId);
      onDelete?.(productId);
    } catch {
      setError("Failed to delete product");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductEdit = (): void => {
    if (isEditing) return;
    setTempProductData({ name: product.name, description: product.description });
    setIsEditing(true);
  };

  const saveProductChanges = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const result = await onSaveProductChanges(product, tempProductData);
      if (result.success) {
        setIsEditing(false);
        setTempProductData({});
      }
    } catch (err: any) {
      setError(err.message || "Failed to save product changes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVariantUpdate = (updatedVariants: Variant[]): void => {
    updateProducts({ ...product, variants: updatedVariants });
    setTempVariants(updatedVariants);
    setHasStockChanges(false);
    setChangedStocks([]);
  };

  const handleStockUpdate = (
    variantIndex: number,
    sizeIndex: number,
    increment: number
  ): void => {
    const updatedVariants = [...tempVariants];
    const sizeObj = updatedVariants[variantIndex].sizes[sizeIndex];
    sizeObj.stock = Math.max(0, sizeObj.stock + increment);
    setTempVariants(updatedVariants);

    setChangedStocks((prev) => {
      const filtered = prev.filter(
        (c) =>
          !(
            c.variantId === updatedVariants[variantIndex]._id &&
            c.sizeId === sizeObj._id
          )
      );
      return [
        ...filtered,
        {
          variantId: updatedVariants[variantIndex]._id,
          sizeId: sizeObj._id,
          size: sizeObj.size,
          stock: sizeObj.stock,
        },
      ];
    });
    setHasStockChanges(true);
  };

  const handlePriceUpdate = (updatedVariant: Variant): void => {
    const updatedVariants = product.variants.map((v) =>
      v._id === updatedVariant._id ? updatedVariant : v
    );
    updateProducts({ ...product, variants: updatedVariants });
    setTempVariants(updatedVariants);
  };

  const cancelStockChanges = (): void => {
    setTempVariants(product.variants);
    setHasStockChanges(false);
    setChangedStocks([]);
  };

  const updateTempProductData = (field: string, value: any): void => {
    setTempProductData((prev) => ({ ...prev, [field]: value }));
  };

  const getTotalStock = (variants: Variant[]): number =>
    variants.reduce(
      (total, variant) =>
        total + variant.sizes.reduce((sum, s) => sum + s.stock, 0),
      0
    );

  return (
    <div
      className="
        relative
        rounded-2xl 
        backdrop-blur-sm shadow-lg
        transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
        overflow-hidden w-full
      "
    >
      {/* ✅ Header */}
      <ProductHeader
        product={product}
        index={index}
        isEditing={isEditing}
        tempData={tempProductData}
        totalStock={getTotalStock(hasStockChanges ? tempVariants : product.variants)}
        onEdit={toggleProductEdit}
        onSave={saveProductChanges}
        onDelete={() =>
          openConfirm({
            title: "Confirm Deletion",
            message: `Are you sure you want to delete "${product.name}"?`,
            onConfirm: handleDeleteProduct,
          })
        }
        onUpdateTempData={updateTempProductData}
        isLoading={isLoading}
        error={error}
        variants={product.variants}
        onPriceUpdate={handlePriceUpdate}
        disabled={product.variants.length === 0}
        onCancel={() => setIsEditing(false)}
      />

      {/* ⚠️ Error */}
      {error && (
        <div className="bg-red-600/10 border border-red-500/30 rounded-xl !p-3 !my-3 text-red-300 text-xs sm:text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ➕ Add Variant */}
      <AddVariantSection
        productId={productId}
        isAddingVariant={addingVariant}
        setAddingVariant={setAddingVariant}
        variants={product.variants}
        onVariantUpdate={handleVariantUpdate}
        onUpdateStock={handleStockUpdate}
        showVariants={showVariants}
        onToggleShowVariants={() => setShowVariants(!showVariants)}
        onImageUpload={onImageUpload}
        onRemoveImage={onRemoveImage}
        updateProducts={updateProducts}
      />

      {/* 📝 Description */}
      {(showVariants || isEditing) && (
        <div className="mt-4 sm:mt-6">
          <ProductDescription
            product={product}
            isEditing={isEditing}
            tempData={tempProductData}
            onUpdateTempData={updateTempProductData}
            onSave={saveProductChanges}
          />
        </div>
      )}

      {/* 📦 Variants */}
      {showVariants && (
        <div className="!mt-2 sm:!mt-3 overflow-x-auto">
          <VariantsList
            variants={hasStockChanges ? tempVariants : product.variants}
            productId={productId}
            onVariantUpdate={handleVariantUpdate}
            onUpdateStock={handleStockUpdate}
            onImageUpload={onImageUpload}
            onRemoveImage={onRemoveImage}
            onPriceUpdate={handlePriceUpdate}
          />
        </div>
      )}

      {/* ⚠️ Unsaved Stock Warning */}
      {hasStockChanges && (
        <div className="bg-yellow-500/15 border border-yellow-500/40 rounded-2xl p-4 my-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-yellow-200 font-medium text-xs sm:text-sm text-center sm:text-left">
            ⚠️ You have unsaved stock changes
          </span>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
            <button
              onClick={saveStockChanges}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold"
            >
              {isLoading ? "Updating..." : "Update Stock"}
            </button>
            <button
              onClick={cancelStockChanges}
              disabled={isLoading}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 🌀 Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-2xl z-10 pointer-events-none"></div>
      )}
    </div>
  );
};

export default ProductItem;
