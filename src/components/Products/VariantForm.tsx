import { useState, useEffect, type ChangeEvent } from "react";
import { Trash2, Plus, Save, Upload, X } from "lucide-react";
import { useRef } from "react";
import { addVariant } from "../../api/products";
import { calcDiscount, calcPriceFromDiscount } from "../../utils/price";
import CropperAddVarient from "../utils/CropperAddVarient";

interface ImageItem {
  public_id: string;
  url: string;
  blob: File;
}

type SizeOption = 'S' | 'M' | 'L' | 'XL' | 'XXL' | string; // Add other sizes as needed
interface SizeItem {
  size: SizeOption;
  stock: number;
}

interface VariantFormProps {
  product: any;
  onVariantAdded?: (newVariant: any, updatedProduct: any) => void; // <-- callback
}

export default function VariantForm({
  product,
  onVariantAdded
}: VariantFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  hexCode: "#000000",
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
  // const [isCropperOpen, setIsCropperOpen] = useState(false);
  // const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [imageFilesToCrop, setImageFilesToCrop] = useState<File[]>([]);
  const [showCropper, setShowCropper] = useState(false);

  // const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
  /* ---------- FORM HANDLERS ---------- */
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

  /* ---------- API BUILDERS ---------- */
  const buildVariantFormData = (): FormData => {
    const fd = new FormData();

    // Basic fields
    fd.append("mrp", String(formData.mrp));
    fd.append("price", String(formData.sellingPrice));
    fd.append("discount", String(formData.discount));
    fd.append("color", JSON.stringify({ name: formData.colorName, hex: formData.hexCode }));

    // Sizes as JSON string
    fd.append("sizes", JSON.stringify(formData.sizes));

    // Images metadata as JSON string
    const imagesMetadata = formData.images.map((img) => ({
      url: img.url,           // blob: URL
      public_id: img.public_id,
    }));
    fd.append("images", JSON.stringify(imagesMetadata));

    // Upload actual files in order
    formData.images.forEach((img) => {
      fd.append("images", img.blob); // Use "files" to match req.files
    });

    return fd;
  };

  const logFormData = (formData: FormData) => {
    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(key, value, `(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(key, value);
      }
    }
  };


  /* ---------- API ACTIONS ---------- */
  const handleAddVariant = async () => {
    if (!product?._id) return alert("Product not loaded");
    const fd = buildVariantFormData();
    logFormData(fd);
    try {
      let res = await addVariant(product._id, fd);
      console.log(res);
      if (onVariantAdded) {
        onVariantAdded(res.variant, res.product);
      }
      alert("Variant added successfully (mock)");
    } catch (err) {
      console.error("Add variant failed:", err);
      alert("Failed to add variant.");
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
    e.target.value = ""; // reset
  };

  const updatePriceFields = (field: string, value: number) => {
    setFormData((prev) => {
      let mrp = prev.mrp;
      let price = prev.sellingPrice;
      let discount = prev.discount;

      if (field === "mrp") mrp = value;
      if (field === "sellingPrice") price = value;
      if (field === "discount") discount = value;

      // 1️⃣ If MRP or selling price changed → recalc discount
      if (field === "mrp" || field === "sellingPrice") {
        if (mrp > 0 && price > 0 && price <= mrp) {
          discount = calcDiscount(mrp, price);
        }
      }

      // 2️⃣ If discount changed → recalc selling price
      if (field === "discount") {
        if (mrp > 0) {
          price = calcPriceFromDiscount(mrp, discount);
        }
      }

      return {
        ...prev,
        mrp,
        sellingPrice: price,
        discount,
      };
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
      images: [
        ...p.images,
        { public_id, url, blob: croppedFile },
      ],
    }));
  };



  /* ---------- RENDER ---------- */
  return (
    <>
      <div className="border border-gray-200 rounded-2xl !mt-4 !p-5 sm:!p-6 lg:!p-8 bg-gradient-to-br from-green-200 to-green-50 shadow-md hover:shadow-lg transition-all duration-300 relative group/card">

        {/* ---------- Header ---------- */}
        <div className="flex items-center gap-4 !mb-6">
          <div
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex-shrink-0 ring-2 ring-gray-200"
            style={{ backgroundColor: formData.hexCode || '#ccc' }}
          />
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
            New Variant
          </h3>
        </div>

        {/* ---------- Color, Discount, Prices ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 !mb-6">

          {/* Color Name */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
              Color Name
            </label>
            <input
              type="text"
              placeholder="Color Name"
              value={formData.colorName}
              onChange={(e) => handleChange('colorName', e.target.value)}
              className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium text-sm sm:text-base"
            />
          </div>

          {/* Hex Code + Color Picker */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
              Hex Code
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={formData.hexCode}
                onChange={(e) => handleChange('hexCode', e.target.value)}
                placeholder="#000000"
                className="flex-1 !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium text-sm sm:text-base"
              />
              <input
                type="color"
                value={formData.hexCode}
                onChange={(e) => handleChange('hexCode', e.target.value)}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg cursor-pointer border-2 border-gray-300 shadow-sm hover:scale-105 transition-transform"
                style={{ WebkitAppearance: 'none', padding: 0, overflow: 'hidden' }}
              />
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.discount}
              onChange={(e) => updatePriceFields('discount', Number(e.target.value))}
              className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium text-sm sm:text-base"
            />
          </div>

        </div>

        {/* ---------- Pricing ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 !mb-6">

          {/* MRP */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
              MRP
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={formData.mrp}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1) updatePriceFields('mrp', v);
              }}
              className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium text-sm sm:text-base"
            />
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
              Selling Price
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={formData.sellingPrice}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 1) updatePriceFields('sellingPrice', v);
              }}
              className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium text-sm sm:text-base"
            />

            {/* Validation messages – same as reference */}
            {formData.sellingPrice <= 0 && (
              <p className="mt-1 text-xs text-red-600">
                Selling price must be greater than 0
              </p>
            )}
            {formData.sellingPrice > formData.mrp && formData.mrp > 0 && (
              <p className="mt-1 text-xs text-red-600">
                Selling price cannot exceed MRP
              </p>
            )}
          </div>

        </div>

        {/* ---------- Sizes & Stock ---------- */}
        <div className="!mb-6 !p-5 bg-white rounded-xl border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between !mb-4 gap-3">
            <label className="text-sm sm:text-base font-bold text-gray-800">
              Sizes & Stock
            </label>
            <button
              type="button"
              onClick={addSize}
              className="flex items-center justify-center gap-2 w-full sm:w-auto !px-4 !py-2 text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Size
            </button>
          </div>

          <div className="space-y-3">
            {formData.sizes.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-[100px_1fr_48px] gap-2 sm:gap-3 bg-gray-50 !p-3 sm:!p-4 rounded-lg border border-gray-200"
              >
                {/* Size */}
                <input
                  type="text"
                  placeholder="Size"
                  value={s.size}
                  onChange={(e) => handleSizeChange(i, 'size', e.target.value.toUpperCase())}
                  className="w-full !px-3 !py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-center uppercase text-sm sm:text-base"
                />

                {/* Stock */}
                <input
                  type="number"
                  min="0"
                  placeholder="Stock"
                  value={s.stock}
                  onChange={(e) => handleSizeChange(i, 'stock', Number(e.target.value))}
                  className="w-full !px-3 !py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm sm:text-base"
                />

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeSize(i)}
                  className="flex items-center justify-center text-red-600 hover:text-red-700 !p-2 sm:!p-2.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Images ---------- */}
        <div className="!mb-6">
          <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-3">
            Product Images
          </label>
          <div className="flex flex-wrap gap-3">
            {formData.images.map((img, index) => (
              <div
                key={index}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md group/img"
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 !p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {formData.images.length < 4 ? (
              <label className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group/upload">
                <Upload className="w-6 h-6 text-gray-500 group-hover/upload:text-blue-600 transition-colors" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            ) : (
              <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-500 text-xs font-medium">
                Max 4
              </div>
            )}
          </div>
        </div>

        {/* ---------- Add Variant Button ---------- */}
        <button
          onClick={handleAddVariant}
          className={`
      w-full sm:w-auto flex items-center justify-center gap-2
      !px-5 !py-3 bg-gradient-to-r from-blue-600 to-blue-700
      text-white font-semibold rounded-xl
      hover:from-blue-700 hover:to-blue-800
      shadow-lg hover:shadow-xl transition-all duration-200
      text-sm sm:text-base
    `}
        >
          <Save className="w-4 h-4" />
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
