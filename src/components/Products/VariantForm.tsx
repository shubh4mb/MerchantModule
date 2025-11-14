import { useState, useEffect, type ChangeEvent } from "react";
import { Trash2, Plus, Save, Upload, X } from "lucide-react";
import { useRef } from "react";
import { addVariant } from "../../api/products";
import CropperAddVarient from "../utils/CropperAddVarient";

interface ImageItem {
  public_id: string;
  url: string;
  blob: File;
}

interface VariantFormProps {
  product: any;
}

export default function VariantForm({
  product,
}: VariantFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
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

  const handleSizeChange = (i: number, field: string, value: any) => {
    const updated = [...formData.sizes];
    updated[i][field] = value;
    setFormData((prev) => ({ ...prev, sizes: updated }));
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

  /* ---------- IMAGE HANDLING ---------- */
  // const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files;
  //   if (!files || files.length === 0) return;

  //   const newFiles = Array.from(files);
  //   const total = formData.images.length + newFiles.length;

  //   if (total > 4) {
  //     const allowed = 4 - formData.images.length;
  //     if (allowed <= 0) {
  //       alert("Maximum 4 images allowed per variant.");
  //       return;
  //     }
  //     alert(`Only ${allowed} image(s) will be added.`);
  //     setPendingFiles(newFiles.slice(0, allowed));
  //     setIsCropperOpen(true);
  //   } else {
  //     setPendingFiles(newFiles);
  //     setIsCropperOpen(true);
  //   }

  //   // Reset input
  //   e.target.value = "";
  // };
  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  /* ---------- API BUILDERS ---------- */
  const buildVariantFormData = (): FormData => {
    const fd = new FormData();
    fd.append("mrp", String(formData.mrp));
    fd.append("price", String(formData.sellingPrice));
    fd.append("discount", String(formData.discount));
    fd.append("color[name]", formData.colorName);
    fd.append("color[hex]", formData.hexCode);

    formData.sizes.forEach((s, i) => {
      fd.append(`sizes[${i}][size]`, s.size);
      fd.append(`sizes[${i}][stock]`, String(s.stock));
    });

    formData.images.forEach((img) => fd.append("images", img.blob));

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
      await addVariant(product._id, fd);
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

    // Limit: max 4 images
    if (totalAfterUpload > 4) {
      const allowed = 4 - existingCount;
      if (allowed <= 0) {
        alert(`Maximum 4 images allowed per variant.`);
        // ✅ Reset input to prevent re-trigger
        e.target.value = "";
        return;
      }
      const limitedFiles = newFiles.slice(0, allowed);
      setImageFilesToCrop(limitedFiles);
      alert(`Only ${allowed} more image(s) can be added. ${newFiles.length - allowed} ignored.`);
    } else {
      setImageFilesToCrop(newFiles);
    }

    setShowCropper(true);

    // ✅ Reset the file input value after use
    e.target.value = "";
  };





  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!croppedBlob) return;

    const public_id = `tmp_${Date.now()}_${Math.random()}`;
    const url = URL.createObjectURL(croppedBlob);
    const croppedFile = new File([croppedBlob], `cropped_${Date.now()}.jpg`, {
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
      <div className="border border-gray-200 rounded-2xl mt-4! p-5! sm:p-6! lg:p-8! bg-gradient-to-br from-green-60 to-green-50 shadow-md hover:shadow-lg transition-all duration-300 relative group/card">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4!">
          <div
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full ring-2 ring-gray-200 flex-shrink-0"
            style={{ backgroundColor: formData.hexCode || "#ccc" }}
          />
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">New Variant</h3>
        </div>

        {/* Color, Discount, Prices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2!">
              Color Name
            </label>
            <input
              type="text"
              placeholder="Color Name"
              value={formData.colorName}
              onChange={(e) => handleChange("colorName", e.target.value)}
              className="w-full px-4! py-3! border border-gray-200 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm sm:text-base transition-all"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2!">
              Color Picker
            </label>
            <input
              type="color"
              value={formData.hexCode}
              onChange={(e) => handleChange("hexCode", e.target.value)}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm hover:scale-105 transition-transform"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2!">
              Discount (%)
            </label>
            <input
              type="number"
              placeholder="Discount"
              min="0"
              max="100"
              value={formData.discount}
              onChange={(e) => handleChange("discount", Number(e.target.value))}
              className="w-full px-4! py-3! border border-gray-200 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm sm:text-base transition-all"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2!">
              MRP
            </label>
            <input
              type="number"
              placeholder="MRP"
              value={formData.mrp}
              onChange={(e) => handleChange("mrp", Number(e.target.value))}
              className="w-full px-4! py-3! border border-gray-200 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm sm:text-base transition-all"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2!">
              Selling Price
            </label>
            <input
              type="number"
              placeholder="Selling Price"
              value={formData.sellingPrice}
              onChange={(e) => handleChange("sellingPrice", Number(e.target.value))}
              className="w-full px-4! py-3! border border-gray-200 rounded-xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm sm:text-base transition-all"
            />
          </div>
        </div>

        {/* Sizes & Stock Section */}
        <div className="p-5! bg-white rounded-xl border border-gray-200 mt-6!">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4! gap-3">
            <label className="text-sm sm:text-base font-bold text-gray-800">
              Sizes & Stock
            </label>
            <button
              type="button"
              onClick={addSize}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4! py-2! text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Add Size
            </button>
          </div>

          <div className="space-y-3">
            {formData.sizes.map((s, i) => (
              <div
                key={i}
                className="grid grid-cols-1 sm:grid-cols-[100px_1fr_48px] gap-2 sm:gap-3 bg-gray-50 p-3! sm:p-4! rounded-lg border border-gray-200"
              >
                <input
                  type="text"
                  placeholder="Size"
                  value={s.size}
                  onChange={(e) => handleSizeChange(i, "size", e.target.value)}
                  className="w-full px-3! py-2!.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-center uppercase text-sm sm:text-base"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={s.stock}
                  onChange={(e) =>
                    handleSizeChange(i, "stock", Number(e.target.value))
                  }
                  className="w-full px-3! py-2!.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => removeSize(i)}
                  className="flex items-center justify-center text-red-600 hover:text-red-700 p-2! rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="flex flex-wrap gap-4 mt-6!">
          {formData.images.map((img, index) => (
            <div
              key={index}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md group"
            >
              <img
                src={img.url}
                alt={`Variant ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-2! bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {formData.images.length < 4 && (
            <label
              className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
            >
              <Upload className="w-6 h-6 text-gray-500 group-hover:text-blue-600 transition-colors" />
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

          {formData.images.length >= 4 && (
            <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-500 text-xs font-medium">
              Max 4
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6!">
          <button
            onClick={handleAddVariant}
            className="px-5! py-3! bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-sm sm:text-base"
          >
            <Save className="w-4 h-4" /> Add Variant Details
          </button>
        </div>
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
