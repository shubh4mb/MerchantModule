import React, { useState, useEffect } from "react";
import ProductHeader from "./ProductHeader";
import { deleteProduct, updateSizeCount } from "../../api/products";
import ProductDescription from "./ProductDescription";
import VariantsList from "./VariantsList";
import AddVariantSection from "./AddVariantSection";
import { useConfirmDialog } from "../../context/ConfirmDialogContext";

// ===================
// Type Definitions
// ===================
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

// ✅ This matches what AddVariantSection & VariantsList should expect
interface AddVariantSectionProps {
  productId: string;
  variants: Variant[];
  onVariantUpdate: (updatedVariants: Variant[]) => void;
  onUpdateStock: (
    variantIndex: number,
    sizeIndex: number,
    increment: number
  ) => void;
  onImageUpload?: (productId: string, image: File) => void;
  onRemoveImage?: (productId: string, imageId: string) => void;
  updateProducts: (updatedProduct: Product) => void;
  isAddingVariant: boolean;
  setAddingVariant: React.Dispatch<React.SetStateAction<boolean>>;
  showVariants: boolean;
  onToggleShowVariants: () => void;
}

// ===================
// Component
// ===================
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

  // ===================
  // Save stock changes
  // ===================
  const saveStockChanges = async (): Promise<void> => {
    if (changedStocks.length === 0) return;
    try {
      setIsLoading(true);
      setError("");

      for (const { variantId, sizeId, stock } of changedStocks) {
        if (!sizeId) continue;
        await updateSizeCount(productId, variantId, { sizeId, stock });
      }

      updateProducts({ ...product, variants: tempVariants });
      setHasStockChanges(false);
      setChangedStocks([]);
    } catch (err: any) {
      console.error("Error updating stock:", err);
      setError(err.message || "Failed to update stock");
    } finally {
      setIsLoading(false);
    }
  };

  // ===================
  // Delete product
  // ===================
  const handleDeleteProduct = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await deleteProduct(productId);
      onDelete?.(productId);
    } catch (err) {
      console.error("Failed to delete product:", err);
      setError("Failed to delete product");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductEdit = (): void => {
    if (isEditing) return;
    setTempProductData({ name: product.name, description: product.description });
    setIsEditing(true);
    setError("");
  };

  const saveProductChanges = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError("");
      const result = await onSaveProductChanges(product, tempProductData);
      if (result.success) {
        setTempProductData({});
        setIsEditing(false);
      }
    } catch (err: any) {
      console.error("Error saving product changes:", err);
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

  // ===================
  // Track stock changes
  // ===================
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
    const numericVariant = {
      ...updatedVariant,
      mrp: Number(updatedVariant.mrp) || 0,
      price: Number(updatedVariant.price) || 0,
      discount: Number(updatedVariant.discount) || 0,
    };

    const updatedVariants = (product.variants || []).map((v) =>
      v._id === numericVariant._id ? numericVariant : v
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

  // ===================
  // JSX
  // ===================
  return (
    <div className="relative overflow-hidden bg-linear-to-br rounded-2xl p-6 backdrop-blur-sm shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#4a9eff] group">
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

      {error && (
        <div className="bg-red-600/10 border border-red-500/30 rounded-xl p-3 my-3 text-red-300 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

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

      {(showVariants || isEditing) && (
        <ProductDescription
          product={product}
          isEditing={isEditing}
          tempData={tempProductData}
          onUpdateTempData={updateTempProductData}
          onSave={saveProductChanges}
        />
      )}

      {showVariants && (
        <VariantsList
          variants={hasStockChanges ? tempVariants : product.variants}
          productId={productId}
          onVariantUpdate={handleVariantUpdate}
          onUpdateStock={handleStockUpdate}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveImage}
          onPriceUpdate={handlePriceUpdate}
        />
      )}

      {hasStockChanges && (
        <div className="bg-yellow-500/15 border border-yellow-500/40 rounded-2xl p-4 my-4 flex items-center justify-between">
          <span className="text-yellow-200 font-semibold text-sm">
            ⚠️ You have unsaved stock changes
          </span>
          <div className="flex gap-3">
            <button
              onClick={saveStockChanges}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              {isLoading ? "Updating..." : "Update Stock"}
            </button>
            <button
              onClick={cancelStockChanges}
              disabled={isLoading}
              className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-2xl z-10 pointer-events-none"></div>
      )}
    </div>
  );
};

export default ProductItem;
