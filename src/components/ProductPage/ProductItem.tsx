// components/ProductPage/ProductItem.jsx
import React, { useState, useEffect } from 'react';
import ProductHeader from './ProductHeader';
import { deleteProduct, updateSizeCount } from '../../api/products';
import ProductDescription from './ProductDescription';
import VariantsList from './VariantsList';
import AddVariantSection from './AddVariantSection';
import { useConfirmDialog } from "../../context/ConfirmDialogContext";
import './styles/ProductItem.css';

const ProductItem = ({ 
  product, 
  index, 
  updateProducts, 
  onDelete, 
  onImageUpload, 
  onRemoveImage, 
  onSaveProductChanges 
}) => {
  const productId = product._id || product.id;

  const [isEditing, setIsEditing] = useState(false);
  const [tempProductData, setTempProductData] = useState({});
  const [addingVariant, setAddingVariant] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [hasStockChanges, setHasStockChanges] = useState(false);
  const [tempVariants, setTempVariants] = useState(product.variants);
  const [changedStocks, setChangedStocks] = useState([]);

  const { openConfirm } = useConfirmDialog();

  useEffect(() => {
    setTempVariants(product.variants);
    setChangedStocks([]);
  }, [product]);

  // console.log(product.variants.length,'product.variants.lengthproduct.variants.length');
  

  // ✅ Save only changed stocks
  const saveStockChanges = async () => {
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
    } catch (err) {
      console.error("Error updating stock:", err);
      setError(err.message || "Failed to update stock");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
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

  const toggleProductEdit = () => {
    if (isEditing) return;
    setTempProductData({ name: product.name, description: product.description });
    setIsEditing(true);
    setError('');
  };

  const saveProductChanges = async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await onSaveProductChanges(product, tempProductData);
      if (result.success) {
        setTempProductData({});
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving product changes:', error);
      setError(error.message || 'Failed to save product changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVariantUpdate = (updatedVariants) => {
    updateProducts({ ...product, variants: updatedVariants });
    setTempVariants(updatedVariants);
    setHasStockChanges(false);
    setChangedStocks([]);
  };

  // ✅ Track stock changes
  const handleStockUpdate = (variantIndex, sizeIndex, increment) => {
    const updatedVariants = [...tempVariants];
    const sizeObj = updatedVariants[variantIndex].sizes[sizeIndex];

    sizeObj.stock = Math.max(0, sizeObj.stock + increment);

    setTempVariants(updatedVariants);

    setChangedStocks(prev => {
      const filtered = prev.filter(c => !(c.variantId === updatedVariants[variantIndex]._id && c.sizeId === sizeObj._id));
      return [...filtered, { variantId: updatedVariants[variantIndex]._id, sizeId: sizeObj._id, size: sizeObj.size, stock: sizeObj.stock }];
    });

    setHasStockChanges(true);
  };

const handlePriceUpdate = (updatedVariant) => {
  const numericVariant = {
    ...updatedVariant,
    mrp: Number(updatedVariant.mrp) || 0,
    price: Number(updatedVariant.price) || 0,
    discount: Number(updatedVariant.discount) || 0,
  };

  // 🔹 Update product.variants
  const updatedVariants = (product.variants || []).map(v =>
    v._id === numericVariant._id ? numericVariant : v
  );

  // 🔹 Push change into parent
  updateProducts({ ...product, variants: updatedVariants });

  // 🔹 Also sync local tempVariants so UI shows correct price even when hasStockChanges is true
  setTempVariants(updatedVariants);
};

  const cancelStockChanges = () => {
    setTempVariants(product.variants);
    setHasStockChanges(false);
    setChangedStocks([]);
  };

  const updateTempProductData = (field, value) => {
    setTempProductData(prev => ({ ...prev, [field]: value }));
  };

  const getTotalStock = (variants) =>
    variants.reduce((total, variant) => 
      total + variant.sizes.reduce((sum, s) => sum + s.stock, 0), 0
    );

  return (
    <div className="product-item">
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
  disabled={product.variants.length === 0}   // 👈 pass disabled prop
  onCancel={() => setIsEditing(false)}   
/>

      {error && <div className="error-message">⚠️ {error}</div>}

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
        <div className="stock-update-controls">
          <span>You have unsaved stock changes</span>
          <div className="stock-update-buttons">
            <button onClick={saveStockChanges} disabled={isLoading} className="save-stock-btn">
              {isLoading ? "Updating..." : "Update Stock"}
            </button>
            <button onClick={cancelStockChanges} disabled={isLoading} className="cancel-stock-btn">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div> 
  );
};

export default ProductItem;
