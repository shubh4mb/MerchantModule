import { useState, useEffect, type ChangeEvent } from "react";
import { Trash2, Plus, Save, Upload, X, Loader2 } from "lucide-react";
import { useRef } from "react";
import { addVariant } from "../../api/products";
import { calcDiscount, calcPriceFromDiscount } from "../../utils/price";
import CropperAddVarient from "../utils/CropperAddVarient";
import CustomColorDropdown from "../utils/CustomColorDropdown";

import { POPULAR_COLORS } from "../../utils/colors";

interface ImageItem {
  public_id: string;
  url: string;
  blob: File;
}

type SizeOption = 'S' | 'M' | 'L' | 'XL' | 'XXL' | string;
interface SizeItem {
  size: SizeOption;
  stock: number;
}

interface VariantFormProps {
  product: any;
  onVariantAdded?: (newVariant: any, updatedProduct: any) => void;
}

export default function VariantForm({
  product,
  onVariantAdded
}: VariantFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    colorName: string;
    hexCode: string;
    discount: number;
    mrp: number;
    sellingPrice: number;
    sizes: SizeItem[];
    images: ImageItem[];
  }>({
    colorName: "",
    hexCode: "",
    discount: 0,
    mrp: 0,
    sellingPrice: 0,
    sizes: [
      { size: "S", stock: 0 },
      { size: "M", stock: 0 },
      { size: "L", stock: 0 },
    ],
    images: [] as ImageItem[],
  });

  const [imageFilesToCrop, setImageFilesToCrop] = useState<File[]>([]);
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    const handleCropped = (e: any) => {
      const croppedFile: File = e.detail;
      const public_id = `tmp_${Date.now()}_${Math.random()}`;
      const url = URL.createObjectURL(croppedFile);

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, { public_id, url, blob: croppedFile }],
      }));
    };

    window.addEventListener("variantFormCropped", handleCropped);
    return () => window.removeEventListener("variantFormCropped", handleCropped);
  }, []);



  const handleSizeChange = (index: number, field: keyof SizeItem, value: string | number) => {
    setFormData(prev => {
      const updatedSizes = [...prev.sizes];
      updatedSizes[index] = {
        ...updatedSizes[index],
        [field]: field === 'stock' ? Number(value) : value
      };
      return { ...prev, sizes: updatedSizes };
    });
  };

  const addSize = () =>
    setFormData((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: "", stock: 0 }],
    }));

  const removeSize = (i: number) =>
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, idx) => idx !== i),
    }));

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const buildVariantFormData = (): FormData => {
    const fd = new FormData();
    fd.append("mrp", String(formData.mrp));
    fd.append("price", String(formData.sellingPrice));
    fd.append("discount", String(formData.discount));
    fd.append("color", JSON.stringify({ name: formData.colorName, hex: formData.hexCode }));
    fd.append("sizes", JSON.stringify(formData.sizes));
    const imagesMetadata = formData.images.map((img) => ({
      url: img.url,
      public_id: img.public_id,
    }));
    fd.append("images", JSON.stringify(imagesMetadata));
    formData.images.forEach((img) => {
      fd.append("images", img.blob);
    });
    return fd;
  };

  const handleAddVariant = async () => {
    if (!product?._id) return alert("Product not loaded");
    if (!formData.colorName || !formData.hexCode) {
      return alert("Please select a color");
    }
    setLoading(true);
    const fd = buildVariantFormData();
    try {
      let res = await addVariant(product._id, fd);
      if (onVariantAdded) {
        onVariantAdded(res.variant, res.product);
      }
      alert("Variant added successfully");
    } catch (err) {
      console.error("Add variant failed:", err);
      alert("Failed to add variant.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const existingCount = formData.images.length;
    const newFiles = Array.from(files);
    const totalAfterUpload = existingCount + newFiles.length;

    if (totalAfterUpload > 4) {
      const allowed = 4 - existingCount;
      if (allowed <= 0) {
        alert("Maximum 4 images allowed per variant.");
        e.target.value = "";
        return;
      }
      const limitedFiles = newFiles.slice(0, allowed);
      setImageFilesToCrop(limitedFiles);
      alert(`Only ${allowed} more image(s) can be added.`);
    } else {
      setImageFilesToCrop(newFiles);
    }

    setShowCropper(true);
    e.target.value = "";
  };

  const updatePriceFields = (field: string, value: number) => {
    setFormData((prev) => {
      let mrp = prev.mrp;
      let price = prev.sellingPrice;
      let discount = prev.discount;

      if (field === "mrp") mrp = value;
      if (field === "sellingPrice") price = value;
      if (field === "discount") discount = value;

      if (field === "mrp" || field === "sellingPrice") {
        if (mrp > 0 && price > 0 && price <= mrp) {
          discount = calcDiscount(mrp, price);
        }
      }

      if (field === "discount") {
        if (mrp > 0) {
          price = calcPriceFromDiscount(mrp, discount);
        }
      }

      return { ...prev, mrp, sellingPrice: price, discount };
    });
  };



  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!croppedBlob) return;
    const public_id = `tmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = URL.createObjectURL(croppedBlob);
    const croppedFile = new File([croppedBlob], `cropped_${public_id}.jpg`, {
      type: croppedBlob.type || "image/jpeg",
    });
    setFormData((p) => ({
      ...p,
      images: [...p.images, { public_id, url, blob: croppedFile }],
    }));
  };

  return (
    <>
      <div className="variant-card" style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", background: "var(--color-surface)", padding: "var(--space-6)", marginTop: "var(--space-6)", boxShadow: "var(--shadow-sm)" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          <div
            style={{ width: "48px", height: "48px", borderRadius: "50%", background: formData.hexCode || '#ccc', border: "2px solid var(--color-border)" }}
          />
          <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-text)" }}>New Variant</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: "var(--space-6)" }}>
          <div className="form-group">
            <label>Select Variant Color</label>
            <CustomColorDropdown
              options={POPULAR_COLORS}
              value={{ name: formData.colorName, hex: formData.hexCode }}
              onChange={(color) => setFormData(prev => ({ ...prev, hexCode: color.hex, colorName: color.name }))}
            />
          </div>

          <div className="form-group">
            <label>Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.discount}
              onChange={(e) => updatePriceFields('discount', Number(e.target.value))}
              style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: "var(--space-6)" }}>
          <div className="form-group">
            <label>MRP</label>
            <input
              type="number"
              min="1"
              value={formData.mrp}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1) updatePriceFields('mrp', v);
              }}
              style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
            />
          </div>
          <div className="form-group">
            <label>Selling Price</label>
            <input
              type="number"
              min="1"
              value={formData.sellingPrice}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1) updatePriceFields('sellingPrice', v);
              }}
              style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
            />
            {formData.sellingPrice > formData.mrp && (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-xs)", marginTop: "4px" }}>Price cannot exceed MRP</p>
            )}
          </div>
        </div>

        <div style={{ background: "var(--color-bg)", padding: "var(--space-5)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "var(--space-6)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <label style={{ fontWeight: 600 }}>Sizes & Stock</label>
            <button
              type="button"
              onClick={addSize}
              style={{ background: "var(--color-success)", color: "white", border: "none", borderRadius: "var(--radius-md)", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Plus size={14} /> Add Size
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {formData.sizes.map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 40px", gap: "12px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Size"
                  value={s.size}
                  onChange={(e) => handleSizeChange(i, 'size', e.target.value.toUpperCase())}
                  style={{ textAlign: "center", fontWeight: 700, padding: "8px" }}
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={s.stock}
                  onChange={(e) => handleSizeChange(i, 'stock', Number(e.target.value))}
                  style={{ padding: "8px" }}
                />
                <button
                  type="button"
                  onClick={() => removeSize(i)}
                  style={{ background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", display: "flex", justifyContent: "center" }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "var(--space-8)" }}>
          <label style={{ display: "block", marginBottom: "var(--space-3)", fontWeight: 600 }}>Variant Images (Max 4)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {formData.images.map((img, index) => (
              <div key={index} style={{ position: "relative", width: "100px", height: "100px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  onClick={() => removeImage(index)}
                  style={{ position: "absolute", top: "4px", right: "4px", background: "var(--color-danger)", color: "white", border: "none", borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {formData.images.length < 4 && (
              <label style={{ width: "100px", height: "100px", border: "2px dashed var(--color-border)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--color-bg)" }}>
                <Upload size={24} style={{ color: "var(--color-text-tertiary)" }} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
        </div>

        <button
          onClick={handleAddVariant}
          disabled={loading || !formData.colorName || formData.sellingPrice <= 0 || formData.sellingPrice > formData.mrp}
          style={{ width: "100%", padding: "14px", background: "var(--color-accent)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "16px", cursor: "pointer", opacity: (loading || !formData.colorName || formData.sellingPrice <= 0 || formData.sellingPrice > formData.mrp) ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          Add Variant Details
        </button>
      </div>

      {showCropper && (
        <CropperAddVarient
          imageSrcs={imageFilesToCrop.map((file) => URL.createObjectURL(file))}
          onClose={() => {
            setShowCropper(false);
            setImageFilesToCrop([]);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
