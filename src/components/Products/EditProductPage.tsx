import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, Plus, Upload, X, Save, ArrowLeft, AlertCircle } from "lucide-react";
import { getBaseProductById, editProduct, updateStock, updateVariant, addVariant } from "../../api/products";
// import VariantForm from "./VariantForm";
import CropperModal from "../utils/CropperModal";

/* ----------- Types ------------ */
interface Size {
    size: string;
    stock: number;
    _id?: string;
}
interface Color {
    name: string;
    hex: string;
}
interface Image {
    public_id: string;
    url: string;
    _id?: string;
    blob?: File;  // Added to store the cropped file/blob for upload
}
interface Variant {
    color: Color;
    sizes: Size[];
    mrp: number;
    price: number;
    images: Image[];
    discount: number;
    _id?: string;
    tempId?: string;  // Added to track new variants before server _id is assigned
}
interface Product {
    _id: string;
    name: string;
    brand: string;
    category: string;
    subCategory: string;
    subSubCategory: string;
    gender: string;
    description: string;
    tags: string[];
    isTriable: boolean;
    isActive: boolean;
    variants: Variant[];
}

// interface CropperModalProps {
//     imageSrcs: string[]; // <-- Array of data URLs
//     onClose: () => void;
//     onCropComplete: (croppedBlob: Blob) => void;
//     isUploading?: boolean;
// }



export default function EditProductPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveVariantApi, setSaveVariantApi] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [form, setForm] = useState<Partial<Product>>({
        name: "",
        brand: "",
        category: "",
        subCategory: "",
        subSubCategory: "",
        gender: "women",
        description: "",
        tags: [],
        isTriable: true,
        isActive: true,
        variants: [],
    });
    const [tagInput, setTagInput] = useState("");
    const [imageFilesToCrop, setImageFilesToCrop] = useState<File[]>([]);
    const [showCropper, setShowCropper] = useState(false);
    const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

    /* -------- LOAD PRODUCT -------- */
    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const data: Product = await getBaseProductById(id);
                console.log(data, 'data');
                setProduct(data);
                setForm({
                    ...data,
                    variants: data.variants.map((v) => ({
                        ...v,
                        sizes: v.sizes.map((s) => ({ ...s })),
                        images: v.images.map((i) => ({ ...i })),
                    })),
                });
            } catch (error) {
                console.error(error);
                alert("Failed to load product.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const updateProductBasics = async () => {
        if (!product) return;
        if (saving) return;
        setSaving(true);
        const payload = {
            name: form.name,
            description: form.description,
            tags: form.tags || [],
            gender: form.gender,
            isTriable: form.isTriable,
            isActive: form.isActive,
        };
        const res = await editProduct(product._id, payload);
        console.log(res);
        setSaving(false);
    };

    const saveVariantDetails = async (variant: Variant, tid: string, isNew: boolean) => {
        if (!product) return;

        // Build JSON payload exactly as backend expects
        const payload = {
            color: variant.color, // { name, hex }
            sizes: variant.sizes, // array of { size, stock, _id }
            mrp: variant.mrp,
            price: variant.price,
            discount: variant.discount,
            images: variant.images.map((img) => ({
                public_id: img.public_id,
                url: img.url
            })),
        };

        let res: any;
        if (isNew) {
            console.log("Sending JSON variant:", payload);
            res = await addVariant(product._id, payload);
        } else {
            console.log("Sending JSON variant:", payload);
            res = await updateVariant(product._id, variant._id!, payload);
        }

        const updatedVariant: Variant = {
            ...variant,
            ...res.variant, // if backend returns variant
        };

        return { res, updatedVariant, tid, isNew };
    };


    const updateVariantStock = async (variant: Variant) => {
        if (!product || !variant._id) return;
        const payload = {
            sizes: variant.sizes.map((s) => ({
                size: s.size,
                stock: s.stock,
            })),
        };
        try {
            await updateStock(product._id, variant._id, payload);
            console.log("Stock updated successfully:", payload);
        } catch (err) {
            console.error("Failed to update stock:", err);
            throw err;
        }
    };

    const handleSaveVariantDetails = async (tid: string) => {
        if (saving) return;
        setSaveVariantApi(true);
        try {
            const variant = form.variants?.find((v) => v._id === tid || v.tempId === tid);
            if (!variant) return alert("Variant not found");
            const isNew = !variant._id;
            if (isNew && !product?._id) return alert("Product not loaded");
            const result = await saveVariantDetails(variant, tid, isNew);
            if (!result) {
                alert("Failed to save variant details: Product not found");
                return;
            }
            const { updatedVariant } = result;
            if (isNew) {
                setForm((prev) => ({
                    ...prev,
                    variants: prev.variants?.map((v) => (v.tempId === tid ? updatedVariant : v)) || [],
                }));
                setProduct((prev) => ({
                    ...prev!,
                    variants: [...(prev?.variants || []), updatedVariant],
                }));
            } else {
                setForm((prev) => ({
                    ...prev,
                    variants: prev.variants?.map((v) => (v._id === tid ? updatedVariant : v)) || [],
                }));
                setProduct((prev) => {
                    if (!prev) return null; // or return a default product object if that makes sense for your use case
                    return {
                        ...prev,
                        variants: prev.variants.map((v) => (v._id === tid ? updatedVariant : v)),
                    };
                });
            }
            alert(isNew ? "Variant added successfully." : "Variant details updated successfully.");
        } catch (err) {
            console.error(err);
            alert("Failed to save variant details.");
        } finally {
            setSaveVariantApi(false);
        }
    };

    const handleUpdateStock = async (tid: string) => {
        if (saving) return;
        setSaving(true);
        try {
            const variant = form.variants?.find((v) => v._id === tid || v.tempId === tid);
            if (!variant) return alert("Variant not found");
            if (!variant._id) return alert("Please save variant details first to create the variant on the server.");
            await updateVariantStock(variant);
            // Sync to product (stock is now updated on server)
            setProduct((prev) => {
                if (!prev) return null;  // Handle the case where prev is null
                return {
                    ...prev,
                    variants: prev.variants.map((v) => (v._id === tid || v.tempId === tid ? { ...v, sizes: variant.sizes } : v)),
                };
            });
            alert("Stock updated successfully.");
        } catch (err) {
            console.error(err);
            alert("Failed to update stock.");
        } finally {
            setSaving(false);
        }
    };

    /* -------- TAGS -------- */
    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !form.tags?.includes(tag)) {
            setForm((p) => ({ ...p, tags: [...(p.tags ?? []), tag] }));
            setTagInput("");
        }
    };
    const removeTag = (tag: string) => {
        setForm((p) => ({ ...p, tags: p.tags?.filter((t) => t !== tag) }));
    };

    /* -------- VARIANTS -------- */
    const addVariantForm = () => {
        const newVariant: Variant = {
            color: { name: "", hex: "#000000" },
            sizes: [{ size: "M", stock: 0 }],
            mrp: 0,
            price: 0,
            images: [],
            discount: 0,
        };

        setForm((prev) => {
            const updatedVariants = [...(prev.variants ?? []), newVariant];
            return { ...prev, variants: updatedVariants };
        });

        // Wait for render, then scroll
        setTimeout(() => {
            const index = form?.variants?.length ?? 0; // new variant index (0-based)
            const element = document.getElementById(`variant-${index}`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
                element.classList.add("highlight");
                setTimeout(() => element.classList.remove("highlight"), 1200);
            }
        }, 150);
    };

    const removeVariant = (tid: string) => {
        setForm((p) => ({
            ...p,
            variants: p.variants?.filter((v) => v._id !== tid && v.tempId !== tid),
        }));
        // Also remove from product if it was saved
        setProduct((prev) => ({
            ...prev!,
            variants: prev?.variants?.filter((v) => v._id !== tid) || [],
        }));
    };
    const saveVariant = (tid: string, upd: Partial<Variant>) => {
        setForm((p) => ({
            ...p,
            variants: p.variants?.map((v) => (v._id === tid || v.tempId === tid ? { ...v, ...upd } : v)),
        }));
    };

    /* -------- SIZES -------- */
    const addSize = (tid: string) => {
        setForm((p) => ({
            ...p,
            variants: p.variants?.map((v) =>
                v._id === tid || v.tempId === tid
                    ? { ...v, sizes: [...v.sizes, { size: "S", stock: 0 }] }
                    : v
            ),
        }));
    };
    const removeSize = (tid: string, sid: string) => {
        setForm((p) => ({
            ...p,
            variants: p.variants?.map((v) =>
                v._id === tid || v.tempId === tid ? { ...v, sizes: v.sizes.filter((s) => s._id !== sid) } : v
            ),
        }));
    };
    const updateSize = (tid: string, sid: string, field: keyof Size, val: string | number) => {
        setForm((p) => ({
            ...p,
            variants: p.variants?.map((v) =>
                v._id === tid || v.tempId === tid
                    ? {
                        ...v,
                        sizes: v.sizes.map((s) => (s._id === sid ? { ...s, [field]: val } : s)),
                    }
                    : v
            ),
        }));
    };

    const handleImageUpload = (tid: string, e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Find current variant
        const variant = form.variants?.find((v) => v._id === tid || v.tempId === tid);
        if (!variant) return;

        // Count existing + new images
        const existingCount = variant.images.length;
        const newFiles = Array.from(files);
        const totalAfterUpload = existingCount + newFiles.length;

        // Limit: max 4 images
        if (totalAfterUpload > 4) {
            const allowed = 4 - existingCount;
            if (allowed <= 0) {
                alert(`Maximum 4 images allowed per variant.`);
                return;
            }
            // Slice to only allow up to 4 total
            const limitedFiles = newFiles.slice(0, allowed);
            setImageFilesToCrop(limitedFiles);
            alert(`Only ${allowed} more image(s) can be added. ${newFiles.length - allowed} ignored.`);
        } else {
            setImageFilesToCrop(newFiles);
        }

        setActiveVariantId(tid);
        setShowCropper(true);
    };


    const removeImage = (tid: string, iid: string) => {
        setForm((p) => ({
            ...p,
            variants: p.variants?.map((v) =>
                v._id === tid || v.tempId === tid ? { ...v, images: v.images.filter((i) => i._id !== iid) } : v
            ),
        }));
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!activeVariantId || !croppedBlob) return;

        const public_id = `tmp_${Date.now()}_${Math.random()}`;
        const url = URL.createObjectURL(croppedBlob);
        const croppedFile = new File([croppedBlob], `cropped_${Date.now()}.jpg`, {
            type: croppedBlob.type || "image/jpeg",
        });

        setForm((p) => ({
            ...p,
            variants: p.variants?.map((v) =>
                v._id === activeVariantId || v.tempId === activeVariantId
                    ? {
                        ...v,
                        images: [
                            ...v.images,
                            { public_id, url, blob: croppedFile },
                        ],
                    }
                    : v
            ),
        }));
    };

    /* ------------------------------------------------------------------ */
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto !p-4 sm:!p-6 lg:!p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            {/* ----- Header ----- */}
            <div className="bg-white/80 backdrop-blur-sm !p-4 sm:!p-5 lg:!p-6 rounded-2xl shadow-lg border border-gray-100 !mb-6 sm:!mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="!p-2.5 sm:!p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 hover:shadow-md flex-shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
                            Edit Product
                        </h1>
                    </div>
                    <button
                        onClick={addVariantForm}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto !!px-5 lg:!px-6 !py-2.5 lg:!py-3 text-sm lg:text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                        Add Variant
                    </button>
                </div>
            </div>

            {/* ----- Basic Info ----- */}
            <section className="bg-white/90 backdrop-blur-md !p-5 sm:!p-6 lg:!p-8 rounded-2xl shadow-xl border border-gray-100 !mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between !mb-6 gap-4">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="w-8 h-8 lg:w-9 lg:h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm lg:text-base font-bold flex-shrink-0">
                            1
                        </span>
                        Basic Information
                    </h2>
                    <button
                        onClick={updateProductBasics}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto !px-5 lg:!px-6 !py-2.5 lg:!py-3 text-sm lg:text-base bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <Save className="w-4 h-4 lg:w-5 lg:h-5" />
                        {saving ? "Saving…" : "Save Basic Info"}
                    </button>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
                    {/* Product Name */}
                    <div className="group">
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
                            Product Name
                        </label>
                        <input
                            type="text"
                            value={form.name ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Classic Leather Jacket"
                            className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 group-hover:bg-white transition-all duration-200 placeholder:text-gray-400 text-gray-900 font-medium text-sm sm:text-base"
                        />
                    </div>

                    {/* Gender */}
                    <div className="group">
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
                            Gender
                        </label>
                        <select
                            value={form.gender ?? "women"}
                            onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                            className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 group-hover:bg-white transition-all duration-200 text-gray-900 font-medium appearance-none cursor-pointer text-sm sm:text-base"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 0.75rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.2em',
                            }}
                        >
                            <option value="men">Men</option>
                            <option value="women">Women</option>
                            <option value="kids">Kids</option>
                            <option value="unisex">Unisex</option>
                        </select>
                    </div>
                </div>

                {/* Alert */}
                <div className="!mt-5 !p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 !mt-0.5" />
                    <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                        <strong>Note:</strong> Once the product is created, you cannot edit brand and categories.
                        Please make sure the information is correct before submitting.
                    </p>
                </div>

                {/* Description */}
                <div className="!mt-6 group">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
                        Description
                    </label>
                    <textarea
                        rows={5}
                        value={form.description ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Describe the product in detail..."
                        className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 group-hover:bg-white transition-all duration-200 resize-none placeholder:text-gray-400 text-gray-900 font-medium text-sm sm:text-base"
                    />
                </div>

                {/* Tags */}
                <div className="!mt-6">
                    <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
                        Tags
                    </label>
                    <div className="flex flex-wrap gap-2 !mb-3">
                        {form.tags?.map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-1.5 !px-3 !py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs sm:text-sm font-medium shadow-sm hover:shadow transition-shadow"
                            >
                                {t}
                                <button
                                    type="button"
                                    onClick={() => removeTag(t)}
                                    className="!ml-1 hover:scale-110 transition-transform"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addTag()}
                            placeholder="Type tag and press Enter..."
                            className="flex-1 !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all placeholder:text-gray-400 font-medium text-sm sm:text-base"
                        />
                        <button
                            onClick={addTag}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto !px-5 !py-3 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            Add Tag
                        </button>
                    </div>
                </div>

                {/* Checkboxes */}
                <div className="!mt-6 flex flex-wrap gap-6 sm:gap-8">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={form.isTriable ?? false}
                            onChange={(e) => setForm((p) => ({ ...p, isTriable: e.target.checked }))}
                            className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 focus:ring-offset-0 transition-all"
                        />
                        <span className="text-sm sm:text-base font-semibold text-gray-700 group-hover:text-gray-900">
                            Triable
                        </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={form.isActive ?? false}
                            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                            className="w-5 h-5 text-green-600 rounded-lg border-gray-300 focus:ring-green-500 focus:ring-offset-0 transition-all"
                        />
                        <span className="text-sm sm:text-base font-semibold text-gray-700 group-hover:text-gray-900">
                            Active
                        </span>
                    </label>
                </div>
            </section>

            {/* ----- Variants ----- */}
            <section className="bg-white/90 backdrop-blur-md !p-5 sm:!p-6 lg:!p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between !mb-6 gap-4">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="w-8 h-8 lg:w-9 lg:h-9 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm lg:text-base font-bold flex-shrink-0">
                            2
                        </span>
                        Product Variants
                    </h2>
                </div>

                <div className="space-y-8">
                    {form.variants?.map((variant, index) => {
                        const tid = variant._id || variant.tempId;
                        const isNew = !variant._id;
                        return (
                            <div
                                key={tid}
                                id={`variant-${index}`}
                                className="border border-gray-200 rounded-2xl !mt-2 !p-5 sm:!p-6 lg:!p-8 bg-gradient-to-br from-gray-50 to-white shadow-md hover:shadow-lg transition-all duration-300 relative group/card"

                            >
                                <button
                                    onClick={() => removeVariant(tid!)}
                                    className="absolute top-4 right-4 !p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:scale-110 transition-all duration-200 opacity-0 group-hover/card:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>

                                {/* Variant Header */}
                                <div className="flex items-center gap-4 !mb-6">
                                    <div
                                        className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex-shrink-0 ring-2 ring-gray-200"
                                        style={{ backgroundColor: variant.color.hex || '#ccc' }}
                                    />
                                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                                        Variant {variant.color.name || 'Unnamed'} {isNew && '(New)'}
                                    </h3>
                                </div>

                                {/* Color Fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 !mb-6">
                                    {/* Color Name */}
                                    <div>
                                        <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
                                            Color Name
                                        </label>
                                        <input
                                            type="text"
                                            value={variant.color.name}
                                            onChange={(e) =>
                                                saveVariant(tid!, {
                                                    color: { ...variant.color, name: e.target.value },
                                                })
                                            }
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
                                                value={variant.color.hex}
                                                onChange={(e) =>
                                                    saveVariant(tid!, {
                                                        color: { ...variant.color, hex: e.target.value },
                                                    })
                                                }
                                                placeholder="#000000"
                                                className="flex-1 !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium text-sm sm:text-base"
                                            />
                                            {/* Responsive Color Picker */}
                                            <input
                                                type="color"
                                                value={variant.color.hex}
                                                onChange={(e) =>
                                                    saveVariant(tid!, {
                                                        color: { ...variant.color, hex: e.target.value },
                                                    })
                                                }
                                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg cursor-pointer border-2 border-gray-300 shadow-sm hover:scale-105 transition-transform"
                                                style={{
                                                    // Improve mobile tap target
                                                    WebkitAppearance: 'none',
                                                    padding: 0,
                                                    overflow: 'hidden',
                                                }}
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
                                            value={variant.discount}
                                            onChange={(e) =>
                                                saveVariant(tid!, {
                                                    discount: Number(e.target.value),
                                                })
                                            }
                                            className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                                {/* Pricing */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 !mb-6">
                                    <div>
                                        <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
                                            MRP
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={variant.mrp}
                                            onChange={(e) =>
                                                saveVariant(tid!, {
                                                    mrp: Number(e.target.value),
                                                })
                                            }
                                            className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium text-sm sm:text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-2">
                                            Selling Price
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={variant.price}
                                            onChange={(e) =>
                                                saveVariant(tid!, {
                                                    price: Number(e.target.value),
                                                })
                                            }
                                            className="w-full !px-4 !py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all font-medium text-sm sm:text-base"
                                        />
                                    </div>
                                </div>

                                {/* Sizes & Stock - IMPROVED SECTION */}
                                <div className="!mb-6 !p-5 bg-white rounded-xl border border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between !mb-4 gap-3">
                                        <label className="text-sm sm:text-base font-bold text-gray-800">
                                            Sizes & Stock
                                        </label>
                                        <button
                                            onClick={() => addSize(tid!)}
                                            className="flex items-center justify-center gap-2 w-full sm:w-auto !px-4 !py-2 text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Size
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {variant.sizes.map((sz) => (
                                            <div
                                                key={sz._id}
                                                className="grid grid-cols-1 sm:grid-cols-[100px_1fr_48px] gap-2 sm:gap-3 bg-gray-50 !p-3 sm:!p-4 rounded-lg border border-gray-200"
                                            >
                                                {/* Size Input */}
                                                <input
                                                    type="text"
                                                    placeholder="Size"
                                                    value={sz.size}
                                                    onChange={(e) =>
                                                        updateSize(tid!, sz._id!, "size", e.target.value.toUpperCase())
                                                    }
                                                    className="w-full !px-3 !py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-center uppercase text-sm sm:text-base"
                                                />

                                                {/* Stock Input */}
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Stock"
                                                    value={sz.stock}
                                                    onChange={(e) =>
                                                        updateSize(tid!, sz._id!, "stock", Number(e.target.value))
                                                    }
                                                    className="w-full !px-3 !py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm sm:text-base"
                                                />

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => removeSize(tid!, sz._id!)}
                                                    className="flex items-center justify-center text-red-600 hover:text-red-700 !p-2 sm:!p-2.5 rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleUpdateStock(tid!)}
                                        disabled={!variant._id || saving}  // Disabled for new variants until saved
                                        className="!mt-4 w-full sm:w-auto flex items-center justify-center gap-2 !px-5 !py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? "Saving…" : "Update Stock"}
                                    </button>
                                </div>

                                {/* Images */}
                                <div className="!mb-6">
                                    <label className="block text-sm sm:text-base font-semibold text-gray-700 !mb-3">
                                        Product Images
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {variant.images.map((img) => (
                                            <div
                                                key={img._id}
                                                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md group/img"
                                            >
                                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeImage(tid!, img._id!)}
                                                    className="absolute top-1 right-1 !p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-700"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {variant.images.length < 4 ? (
                                            <label className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all group/upload">
                                                <Upload className="w-6 h-6 text-gray-500 group-hover/upload:text-blue-600 transition-colors" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(tid!, e)}
                                                />
                                            </label>
                                        ) : (
                                            <div className="flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-500 text-xs font-medium">
                                                Max 4
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Save Variant */}
                                <button
                                    onClick={() => handleSaveVariantDetails(tid!)}
                                    disabled={saving}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 !px-5 !py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                                >
                                    <Save className="w-4 h-4" />
                                    {saveVariantApi ? "Saving…" : isNew ? "Add Variant Details" : "Save Variant Details"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>
            {showCropper && imageFilesToCrop.length > 0 && (
                <CropperModal
                    imageSrcs={imageFilesToCrop.map((file) => URL.createObjectURL(file))}
                    onClose={() => {
                        setShowCropper(false);
                        setImageFilesToCrop([]);
                        setActiveVariantId(null);
                    }}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>

    );
}