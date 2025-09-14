// components/ProductPage/VariantForm.jsx
import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import DynamicSizesInput from './DynamicSizesInput';
import { addVariant } from "../../api/products";
import CropperModal from '../../components/utils/CropperModal';
import './styles/VariantForm.css';

const VariantForm = ({ productId, onSubmit, onCancel, selectedVariantIndex, }) => {
  const [variantForm, setVariantForm] = useState({
    color: { name: '', hex: '#000000' },
    sizes: [{ size: '', stock: '' }],   // ✅ stock starts as empty string
    mrp: '',
    price: '',
    discount: '',
    images: []
  });
  const [previewQueue, setPreviewQueue] = useState([]);
  const [showCropper, setShowCropper] = useState(false);

  // ✅ Auto-calculate discount when mrp & price change
  useEffect(() => {
    const mrpNum = parseFloat(variantForm.mrp);
    const priceNum = parseFloat(variantForm.price);
    if (mrpNum > 0 && priceNum > 0 && priceNum <= mrpNum) {
      const discount = ((mrpNum - priceNum) / mrpNum) * 100;
      setVariantForm(prev => ({ ...prev, discount: discount.toFixed(2) }));
    }
  }, [variantForm.mrp, variantForm.price]);

  const handleFormChange = (field, value) => {
    setVariantForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColorChange = (e) => {
    const hex = e.target.value;
    setVariantForm(prev => ({
      ...prev,
      color: { ...prev.color, hex }
    }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewQueue(prev => [...prev, { src: e.target.result, file }]);
        if (!showCropper) setShowCropper(true);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCropComplete = (blob) => {
    if (!(blob instanceof Blob)) return;
    const file = new File([blob], `variant-${Date.now()}.jpg`, { type: "image/jpeg" });
    const objectUrl = URL.createObjectURL(file);

    setVariantForm((prev) => {
      const updatedImages = [...(prev.images || []), { url: objectUrl, file }];
      return { ...prev, images: updatedImages, mainImage: updatedImages[0] };
    });

    setPreviewQueue((prev) => {
      const [, ...rest] = prev;
      if (rest.length === 0) setShowCropper(false);
      return rest;
    });
  };

  const handleCropperClose = () => {
    setShowCropper(false);
    setPreviewQueue([]);
  };

  const removeImage = (index) => {
    setVariantForm(prev => {
      const updatedImages = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: updatedImages, mainImage: updatedImages[0] || null };
    });
  };

  const validateForm = () => {
    // ✅ Check numeric fields
    const mrpValid = /^\d+(\.\d{1,2})?$/.test(variantForm.mrp);
    const priceValid = /^\d+(\.\d{1,2})?$/.test(variantForm.price);
    if (!mrpValid || !priceValid) {
      alert("❌ Please enter valid numbers for MRP and Price.");
      return false;
    }

    // ✅ Sizes validation (convert stock to number here for validation)
    const invalidSize = variantForm.sizes.some(s => !s.size.trim() || Number(s.stock) <= 0);
    if (invalidSize) {
      alert("❌ Please fill all sizes and stocks before submitting.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const formData = new FormData();
      formData.append("color", JSON.stringify(variantForm.color));

      // ✅ Ensure stocks are numbers before sending
      formData.append("sizes", JSON.stringify(
        variantForm.sizes.map(s => ({ ...s, stock: Number(s.stock) }))
      ));

      formData.append("mrp", Number(variantForm.mrp));
      formData.append("price", Number(variantForm.price));
      formData.append("discount", Number(variantForm.discount));

      variantForm.images.forEach((imgObj) => {
        if (imgObj.file instanceof Blob) {
          formData.append("images", imgObj.file);
        }
      });

      let response = await addVariant(productId, formData);

      if (response?.product) {
        alert("✅ Variant added successfully!");
        if (onSubmit) onSubmit(response.product);

        // ✅ Reset with stock = "" (not 0)
        setVariantForm({
          color: { name: '', hex: '#000000' },
          sizes: [{ size: '', stock: '' }],
          mrp: '',
          price: '',
          discount: '',
          images: []
        });
        setPreviewQueue([]);
        setShowCropper(false);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save variant.");
    }
  };

  return (
    <div className="variant-form-container">
      <h3>ADD VARIANT </h3>
      <form onSubmit={handleSubmit} className="variant-form">
        <div className="form-grid">
          {/* Color Section */}
          <div className="form-group">
            <label className="form-label">Color Information</label>
            <div className="color-inputs">
              <input
                type="text"
                value={variantForm.color.name}
                onChange={(e) =>
                  setVariantForm({
                    ...variantForm,
                    color: { ...variantForm.color, name: e.target.value },
                  })
                }
                placeholder="Color Name"
                className="color-name-input"
                required
              />
              <input
                type="color"
                value={variantForm.color.hex}
                onChange={handleColorChange}
                className="color-preview"
                title="Select color"
              />
            </div>
          </div>

          <DynamicSizesInput 
            sizes={variantForm.sizes} 
            setSizes={(sizes) => handleFormChange('sizes', sizes)} 
          />

          {/* Pricing Information */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Maximum Retail Price (MRP)</label>
              <input
                type="text"
                value={variantForm.mrp}
                onChange={(e) => handleFormChange('mrp', e.target.value)}
                className="form-input"
                placeholder="Enter MRP"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Selling Price *</label>
              <input
                type="text"
                value={variantForm.price}
                onChange={(e) => handleFormChange('price', e.target.value)}
                className="form-input"
                placeholder="Enter selling price"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Discount Percentage %</label>
              <div className="input-with-symbol">
                <input
                  type="text"
                  value={variantForm.discount}
                  onChange={(e) => handleFormChange('discount', e.target.value)}
                  className="form-input"
                  placeholder="%"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="form-group">
            <label className="form-label">Product Images</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="file-input"
                id={`image-upload-${productId}`}
              />
              <label htmlFor={`image-upload-${productId}`} className="file-input-label">
                <span className="file-input-icon">📸</span>
                <div>Click to upload images or drag and drop (Max 5 images)</div>
                <div className="file-input-subtitle">PNG, JPG, GIF up to 10MB each</div>
              </label>
            </div>
          </div>

          {/* Image Preview */}
          {variantForm.images?.length > 0 && (
            <div className="image-preview-grid">
              {variantForm.images.map((img, i) => (
                <div key={i} className="image-preview-item">
                  <img src={img.url} alt={`Variant ${i + 1}`} className="preview-image" />
                  {i === 0 && <div className="main-image-badge">Main</div>}
                  <div className="image-label">{i === 0 ? "Main Image" : `Image ${i + 1}`}</div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="remove-preview-btn"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCropper && previewQueue.length > 0 && (
          <CropperModal
            imageSrc={previewQueue[0].src}
            onClose={handleCropperClose}
            onCropComplete={handleCropComplete}
          />
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={!variantForm.price || !variantForm.color.name}
          >
            <Save size={16} />
            {selectedVariantIndex !== null ? "Update Product Variant" : "Add Product Variant"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VariantForm;
