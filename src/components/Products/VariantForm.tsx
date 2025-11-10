import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Save, X, Upload } from "lucide-react";
import DynamicSizesInput from "../ProductPage/DynamicSizesInput";
import { addVariant } from "../../api/products";
import CropperModal from "../../components/utils/CropperModal";

/* ---------- Types ---------- */

export interface Size {
  size: string;
  stock: number;
}

export interface ColorType {
  name: string;
  hex: string;
}

export interface VariantImage {
  url: string;
  file?: File | Blob;
}

interface VariantFormState {
  color: ColorType;
  sizes: Size[];
  mrp: string;
  price: string;
  discount: string;
  images: VariantImage[];
  mainImage?: VariantImage | null;
}

interface PreviewQueueItem {
  src: string | null;
  file: File;
}

interface VariantFormProps {
  productId: string;
  onSubmit?: (updatedProduct: any) => void;
  onCancel?: () => void;
  selectedVariantIndex?: number | null;
}

/* ---------- Component ---------- */

const VariantForm = ({
  productId,
  onSubmit,
  onCancel,
  selectedVariantIndex = null,
}: VariantFormProps) => {
  const [variantForm, setVariantForm] = useState<VariantFormState>({
    color: { name: "", hex: "#000000" },
    sizes: [{ size: "", stock: 0 }],
    mrp: "",
    price: "",
    discount: "",
    images: [],
    mainImage: null,
  });

  const [previewQueue, setPreviewQueue] = useState<PreviewQueueItem[]>([]);
  const [showCropper, setShowCropper] = useState(false);

  /* ---------- Auto Discount Calculation ---------- */
  useEffect(() => {
    const mrpNum = parseFloat(variantForm.mrp);
    const priceNum = parseFloat(variantForm.price);
    if (mrpNum > 0 && priceNum > 0 && priceNum <= mrpNum) {
      const discount = ((mrpNum - priceNum) / mrpNum) * 100;
      setVariantForm((p) => ({ ...p, discount: discount.toFixed(2) }));
    }
  }, [variantForm.mrp, variantForm.price]);

  const handleFormChange = <K extends keyof VariantFormState>(
    field: K,
    value: VariantFormState[K]
  ) => {
    setVariantForm((p) => ({ ...p, [field]: value }));
  };

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setVariantForm((p) => ({ ...p, color: { ...p.color, hex } }));
  };

  /* ---------- Image Upload + Crop Flow ---------- */
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        setPreviewQueue((prev) => [
          ...prev,
          { src: typeof result === "string" ? result : null, file },
        ]);
        if (!showCropper) setShowCropper(true);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCropComplete = (blob: Blob) => {
    const file = new File([blob], `variant-${Date.now()}.jpg`, { type: "image/jpeg" });
    const objectUrl = URL.createObjectURL(file);

    setVariantForm((prev) => {
      const updatedImages = [...prev.images, { url: objectUrl, file }];
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

  const removeImage = (index: number) => {
    setVariantForm((prev) => {
      const updatedImages = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: updatedImages, mainImage: updatedImages[0] ?? null };
    });
  };

  /* ---------- Validation ---------- */
  const validateForm = () => {
    if (!/^\d+(\.\d{1,2})?$/.test(variantForm.mrp) || !/^\d+(\.\d{1,2})?$/.test(variantForm.price)) {
      alert("Please enter valid numbers for MRP and Price.");
      return false;
    }

    if (variantForm.sizes.some((s) => !s.size.trim() || s.stock <= 0)) {
      alert("Please fill all sizes and stock values.");
      return false;
    }

    return true;
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const formData = new FormData();
      formData.append("color", JSON.stringify(variantForm.color));
      formData.append(
        "sizes",
        JSON.stringify(variantForm.sizes.map((s) => ({ ...s, stock: Number(s.stock) })))
      );
      formData.append("mrp", variantForm.mrp);
      formData.append("price", variantForm.price);
      formData.append("discount", variantForm.discount);

      variantForm.images.forEach((img) => {
        if (img.file) formData.append("images", img.file);
      });

      const response = await addVariant(productId, formData);

      if (response?.product && onSubmit) onSubmit(response.product);

      // reset
      setVariantForm({
        color: { name: "", hex: "#000000" },
        sizes: [{ size: "", stock: 0 }],
        mrp: "",
        price: "",
        discount: "",
        images: [],
        mainImage: null,
      });

      setShowCropper(false);
      setPreviewQueue([]);
      alert("Variant added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save variant.");
    }
  };


  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 !p-6 text-white relative">
        <h3 className="text-2xl font-bold text-center tracking-wider uppercase">Add Variant</h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-4 top-1/2 -translate-y-1/2 !p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="!p-6 md:!p-8 ">
        <div className="!grid !gap-8 lg:!grid-cols-2">
          {/* Color Section */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-800 !mb-3">Color Information</label>
            <div className="flex items-center !gap-4">
              <input
                type="text"
                value={variantForm.color.name}
                onChange={(e) =>
                  setVariantForm({
                    ...variantForm,
                    color: { ...variantForm.color, name: e.target.value },
                  })
                }
                placeholder="Color Name (e.g. Midnight Blue)"
                className="flex-1 !px-5 !py-4 rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-900"
                required
              />
              <input
                type="color"
                value={variantForm.color.hex}
                onChange={handleColorChange}
                className="w-16 h-16 rounded-xl border-2 border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                title="Select color"
              />
            </div>
          </div>

          {/* Dynamic Sizes */}
          <div>
            <DynamicSizesInput 
              sizes={variantForm.sizes} 
              setSizes={(next) => {
                const computed = typeof next === 'function' ? (next as (prev: Size[]) => Size[])(variantForm.sizes) : next;
                handleFormChange('sizes', computed);
              }} 
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 !gap-5 !mt-6">
          <div className="group">
            <label className="block text-sm font-semibold text-gray-800 !mb-2">MRP</label>
            <input
              type="text"
              value={variantForm.mrp}
              onChange={(e) => handleFormChange('mrp', e.target.value)}
              placeholder="₹ 999"
              className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-900"
            />
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-800 !mb-2">Selling Price <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={variantForm.price}
              onChange={(e) => handleFormChange('price', e.target.value)}
              placeholder="₹ 799"
              className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900"
              required
            />
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-800 !mb-2">Discount %</label>
            <div className="relative">
              <input
                type="text"
                value={variantForm.discount}
                onChange={(e) => handleFormChange('discount', e.target.value)}
                placeholder="0.00"
                className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 font-bold text-emerald-700 text-center"
                readOnly
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="!mt-8">
          <label className="block text-sm font-semibold text-gray-800 !mb-4">Product Images</label>
          <label
            htmlFor={`image-upload-${productId}`}
            className="relative block !p-10 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-400 transition-all duration-300 group overflow-hidden"
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id={`image-upload-${productId}`}
            />
            <div className="flex flex-col items-center !gap-3 text-center">
              <Upload className="w-12 h-12 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              <p className="text-lg font-semibold text-gray-700 group-hover:text-indigo-700">
                Click to upload or drag & drop
              </p>
              <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB (Max 5)</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
          </label>
        </div>

        {/* Image Preview */}
        {variantForm.images?.length > 0 && (
          <div className="!mt-6 !p-5 bg-gray-50/70 rounded-2xl border border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 !gap-4">
              {variantForm.images.map((img, i) => (
                <div
                  key={i}
                  className="relative group/img aspect-square rounded-xl overflow-hidden border-2 border-gray-300 hover:border-indigo-500 transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  <img
                    src={img.url}
                    alt={`Variant ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {i === 0 && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white !px-2 !py-1 rounded-md text-xs font-bold shadow-lg">
                      MAIN
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent !p-2">
                    <p className="text-white text-xs font-medium text-center">
                      {i === 0 ? "Main Image" : `Image ${i + 1}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 !p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-all hover:bg-red-700 hover:scale-110"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Cropper Modal */}
        {showCropper && previewQueue.length > 0 && (
          <CropperModal
            imageSrc={previewQueue[0].src}
            onClose={handleCropperClose}
            onCropComplete={handleCropComplete}
          />
        )}
        {/* Submit */}
        <div className="!mt-10 !pt-6 !border-t !border-gray-200">
          <button
            type="submit"
            disabled={!variantForm.price || !variantForm.color.name}
            className="w-full !py-4 !px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center !gap-3 group relative overflow-hidden"
          >
            <Save className="w-5 h-5 group-hover:animate-pulse" />
            {selectedVariantIndex !== null ? "Update Product Variant" : "Add Product Variant"}
            <span className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default VariantForm;