import { useEffect, useState, useCallback } from "react";
import {
  getBaseProductById,
  addVariant,
  updateVariant,
} from "../../../api/products";
import DynamicSizesInput, { type Size } from "../../utils/DynamicSizesInput";
import CropperModal from "../../utils/CropperModal";
import "./AddVariant.css";

interface Color {
  name: string;
  hex: string;
}

interface ImageObj {
  url: string;
  file?: Blob;
  public_id?: string;
}

export interface VariantForm {
  color: Color;
  sizes: Size[];
  images: ImageObj[];
  mainImage: ImageObj | null;
  discount: number;
  mrp: number;
  price: number;
}

interface VariantResponse extends VariantForm {
  _id: string;
}

interface Product {
  _id: string;
  name: string;
  gender?: string;
  description?: string;
  tags?: string[];
  features?: Record<string, string>;
  isTriable?: boolean;
  isActive?: boolean;
  variants: VariantResponse[];
}

interface AddVariantProps {
  createdProductId: string;
}

function getEmptyVariantForm(): VariantForm {
  return {
    color: { name: "", hex: "#000000" },
    sizes: [{ size: "", stock: 0 }],
    images: [],
    mainImage: null,
    discount: 0,
    mrp: 0,
    price: 0,
  };
}

const AddVariant: React.FC<AddVariantProps> = ({ createdProductId }) => {
  const productId = createdProductId;

  const [product, setProduct] = useState<Product | null>(null);
  const [variantForm, setVariantForm] = useState<VariantForm>(getEmptyVariantForm());
  const [previewQueue, setPreviewQueue] = useState<string[]>([]);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);

  const fetchProduct = async () => {
    try {
      const res: Product = await getBaseProductById(productId);
      setProduct(res);

      if (res.variants?.length) {
        setSelectedVariantIndex(0);
        setVariantForm(res.variants[0]);
      } else {
        setSelectedVariantIndex(null);
        setVariantForm(getEmptyVariantForm());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const setSizes = useCallback((updatedSizes: Size[]) => {
    setVariantForm((prev) => ({ ...prev, sizes: updatedSizes }));
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const handleSelectVariant = (index: number) => {
    if (!product) return;
    setSelectedVariantIndex(index);
    setVariantForm(product.variants[index]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;

    const numericFields = ["mrp", "price", "discount"];
    const parsedValue = numericFields.includes(name) ? Number(value) : value;

    setVariantForm((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));

    if (type === "file" && files) {
      const fileList = Array.from(files);
      const previews = fileList.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
      );

      Promise.all(previews).then((urls) => {
        setPreviewQueue(urls);
        setShowCropper(true);
      });
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVariantForm((prev) => ({
      ...prev,
      color: { ...prev.color, [name]: value },
    }));
  };

  const handleCropComplete = (blob: Blob) => {
    if (!(blob instanceof Blob)) return;

    const objectUrl = URL.createObjectURL(blob);

    setVariantForm((prev) => {
      const updatedImages = [
        ...(prev.images || []),
        { url: objectUrl, file: blob },
      ];

      return {
        ...prev,
        images: updatedImages,
        mainImage: updatedImages[0],
      };
    });

    setPreviewQueue((prev) => {
      const [, ...rest] = prev;
      if (rest.length === 0) setShowCropper(false);
      return rest;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      const formData = new FormData();
      formData.append("color", JSON.stringify(variantForm.color));
      formData.append("sizes", JSON.stringify(variantForm.sizes));
      formData.append("mrp", String(variantForm.mrp));
      formData.append("price", String(variantForm.price));
      formData.append("discount", String(variantForm.discount));

      variantForm.images.forEach((imgObj) => {
        if (imgObj.file) {
          formData.append("images", imgObj.file);
        }
      });

      if (selectedVariantIndex !== null) {
        const variantId = product.variants[selectedVariantIndex]._id;
        await updateVariant(product._id, variantId, formData);
        alert("✅ Variant updated successfully!");
      } else {
        await addVariant(product._id, formData);
        alert("✅ Variant added successfully!");
      }

      await fetchProduct();
      setPreviewQueue([]);
      setShowCropper(false);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save variant.");
    }
  };

  if (!product) return <div className="loading">Loading...</div>;

  return (
    <div className="add-variant-container fade-in-up">
      {/* Header Section */}
      <div className="page-header">
        <h1 className="page-title">
          Add New Variant for:{" "}
          <span className="product-name">{product.name || "Product"}</span>
        </h1>
      </div>

      {/* Product Information Card */}
      <div className="product-info">
        <div className="product-info-grid">
          <div className="product-info-item">
            <div className="info-label">Product Name</div>
            <div className="info-value">{product.name || "Not specified"}</div>
          </div>
          <div className="product-info-item">
            <div className="info-label">Gender</div>
            <div className="info-value">
              {product.gender
                ? product.gender.charAt(0).toUpperCase() +
                  product.gender.slice(1)
                : "Not specified"}
            </div>
          </div>
          <div className="product-info-item">
            <div className="info-label">Description</div>
            <div className="info-value">
              {product.description || "No description available"}
            </div>
          </div>
          <div className="product-info-item">
            <div className="info-label">Tags</div>
            <div className="info-value">
              {product.tags && product.tags.length > 0
                ? product.tags.join(", ")
                : "No tags available"}
            </div>
          </div>
          <div className="product-info-item">
            <div className="info-label">Features</div>
            <div className="info-value">
              {product.features && Object.keys(product.features).length > 0
                ? Object.entries(product.features)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")
                : "No features specified"}
            </div>
          </div>
          <div className="product-info-item">
            <div className="info-label">Triable</div>
            <div className="info-value">{product.isTriable ? "Yes" : "No"}</div>
          </div>
          <div className="product-info-item">
            <div className="info-label">Status</div>
            <div
              className="info-value"
              style={{
                color: product.isActive ? "#10b981" : "#ef4444",
                fontWeight: "600",
              }}
            >
              {product.isActive ? "Active" : "Inactive"}
            </div>
          </div>
        </div>
      </div>

      {/* variants selector and edit */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-grow">
          <label className="block text-sm font-medium mb-1">
            Select Variant
          </label>
          <select
            className="border px-3 py-2 rounded w-full"
            onChange={(e) => handleSelectVariant(Number(e.target.value))}
            value={selectedVariantIndex ?? ""}
          >
            <option value="">-- Select Existing Variant --</option>
            {product.variants.map((variant, i) => (
              <option key={i} value={i}>
                {variant.color.name || `Variant ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="text-blue-600 hover:underline text-sm mt-1"
          onClick={() => {
            setSelectedVariantIndex(null);
            setVariantForm(getEmptyVariantForm());
          }}
        >
          + Add New Variant
        </button>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Color Section */}
          {/* <div className="form-group">
            <label className="form-label">Color Information</label>
            <div className="color-inputs">
              <input
                type="color"
                name="hex"
                value={variantForm.color.hex}
                onChange={handleColorChange}
                className="color-preview"
                title="Select color"
              />
            </div>
          </div> */}
          <div className="form-group">
  <label className="form-label">Color Information</label>
  <div className="color-inputs" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    {/* Color name input */}
    <input
      type="text"
      name="name"
      value={variantForm.color.name}
      onChange={(e) =>
        setVariantForm({
          ...variantForm,
          color: { ...variantForm.color, name: e.target.value },
        })
      }
      placeholder="Color Name"
      className="color-name-input"
      style={{ flex: 1 }}
    />

    {/* Color picker */}
    <input
      type="color"
      name="hex"
      value={variantForm.color.hex}
      onChange={handleColorChange}
      className="color-preview"
      title="Select color"
      style={{ width: "50px", height: "40px", padding: 0, border: "none" }}
    />
  </div>
</div>


          {/* Dynamic Sizes Input */}
          <DynamicSizesInput sizes={variantForm.sizes} setSizes={setSizes} />

          {/* Pricing Information */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Maximum Retail Price (MRP)</label>
              <input
                type="number"
                name="mrp"
                value={variantForm.mrp}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter MRP"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Selling Price</label>
              <input
                type="number"
                name="price"
                value={variantForm.price}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter selling price"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Discount Percentage</label>
              <input
                type="number"
                name="discount"
                value={variantForm.discount}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter discount %"
                min="0"
                max="100"
                step="1"
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="form-group">
            <label className="form-label">Product Images</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                name="image"
                multiple
                onChange={handleChange}
                className="file-input"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="file-input-label">
                <span className="file-input-icon">📸</span>
                <div>Click to upload images or drag and drop (Max 5 images)</div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    opacity: 0.7,
                    marginTop: "0.5rem",
                  }}
                >
                  PNG, JPG, GIF up to 10MB each
                </div>
              </label>
            </div>
          </div>

          {/* Image Preview Grid */}
          {variantForm.images?.length > 0 && (
            <div className="image-preview-grid">
              {variantForm.images.map((img, i) => (
                <div key={i} className="image-preview-item">
                  <img
                    src={img.url}
                    alt={`Variant ${i + 1}`}
                    className="preview-image"
                  />
                  {i === 0 && <div className="main-image-badge">Main</div>}
                  <div className="image-label">
                    {i === 0 ? "Main Image" : `Image ${i + 1}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary"
          disabled={!variantForm.price}
        >
          Add Product Variant
        </button>
      </form>

      {/* Cropper Modal */}
      {showCropper && previewQueue.length > 0 && (
        <CropperModal
          imageSrc={previewQueue[0]}
          onClose={() => {
            setShowCropper(false);
            setPreviewQueue([]);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default AddVariant;
