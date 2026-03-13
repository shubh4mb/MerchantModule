import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, Plus, Upload, X, Save, ArrowLeft, AlertCircle, ChevronDown, RefreshCcw } from "lucide-react";
import { getBaseProductById, editProduct, updateStock, updateVariant, deleteVariant, getAttributes } from "../../api/products";
import VariantForm from "./VariantForm";
import { calcDiscount, calcPriceFromDiscount } from "../../utils/price";
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
    styleName: string;
    attributes: { attributeId: string; value: any }[];
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
interface DynamicAttribute {
    _id: string;
    name: string;
    inputType: 'select' | 'multiselect' | 'text' | 'number' | 'boolean';
    isRequired: boolean;
    values?: { label: string; value: string }[];
}


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
        styleName: "",
        attributes: [],
        tags: [],
        isTriable: true,
        isActive: true,
        variants: [],
    });
    const [tagInput, setTagInput] = useState("");
    const [dynamicAttributes, setDynamicAttributes] = useState<DynamicAttribute[]>([]);
    const [imageFilesToCrop, setImageFilesToCrop] = useState<File[]>([]);
    const [showCropper, setShowCropper] = useState(false);
    const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
    const [showNewVariantForm, setShowNewVariantForm] = useState(false);


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

    // Fetch dynamic attributes based on subSubCategory
    useEffect(() => {
        const fetchAttributes = async () => {
            // we use the object id of subSubCategoryId. Note: The API returns `product.subSubCategoryId` as an object or string? 
            // In getBaseProductsById, `.populate('subSubCategoryId', 'name')` means it's an object with `_id` and `name`! Wait, we need the `_id`.
            // Let's rely on the populate result
            const subSubId = (product as any)?.subSubCategoryId?._id || form?.subSubCategory; // form.subSubCategory might just be a string if not populated properly, but getBaseProductById populates it.

            if (!subSubId) {
                setDynamicAttributes([]);
                return;
            }
            try {
                const res = await getAttributes(subSubId);
                setDynamicAttributes(res.attributes || []);
            } catch (err) {
                console.error("Failed to fetch attributes:", err);
            }
        };

        fetchAttributes();
    }, [product?.subSubCategory, form.subSubCategory, product]);


    const handleAttributeChange = (attributeId: string, value: any, isMultiselect: boolean = false) => {
        setForm(prev => {
            let updatedAttributes = [...(prev.attributes || [])];
            const existingIndex = updatedAttributes.findIndex(a => a.attributeId === attributeId);

            if (isMultiselect) {
                if (existingIndex >= 0) {
                    let currentValues = updatedAttributes[existingIndex].value as string[];
                    if (!Array.isArray(currentValues)) currentValues = [currentValues].filter(Boolean);

                    if (currentValues.includes(value)) {
                        currentValues = currentValues.filter(v => v !== value);
                    } else {
                        currentValues.push(value);
                    }

                    if (currentValues.length === 0) {
                        updatedAttributes.splice(existingIndex, 1);
                    } else {
                        updatedAttributes[existingIndex] = { ...updatedAttributes[existingIndex], value: currentValues };
                    }
                } else {
                    updatedAttributes.push({ attributeId, value: [value] });
                }
            } else {
                if (existingIndex >= 0) {
                    updatedAttributes[existingIndex] = { ...updatedAttributes[existingIndex], value };
                } else {
                    updatedAttributes.push({ attributeId, value });
                }
            }

            return { ...prev, attributes: updatedAttributes };
        });
    };

    const updateProductBasics = async () => {
        if (!product) return;
        if (saving) return;
        setSaving(true);
        const payload = {
            name: form.name,
            description: form.description,
            tags: form.tags || [],
            gender: form.gender,
            styleName: form.styleName,
            attributes: form.attributes,
            isTriable: form.isTriable,
            isActive: form.isActive,
        };
        const res = await editProduct(product._id, payload);
        console.log(res);
        setSaving(false);
    };

    const buildVariantFormData = (variant: Variant, isNew: boolean): FormData => {

        console.log(variant, 'variant');
        const formData = new FormData();

        // ----- scalar fields (same for add & update) -----
        formData.append("mrp", String(variant.mrp));
        formData.append("price", String(variant.price));
        formData.append("discount", String(variant.discount));

        // ----- nested color -----
        formData.append("color[name]", variant.color.name);
        formData.append("color[hex]", variant.color.hex);

        // ----- sizes array -----
        variant.sizes.forEach((s, i) => {
            formData.append(`sizes[${i}][size]`, s.size);
            formData.append(`sizes[${i}][stock]`, String(s.stock));
            if (s._id) formData.append(`sizes[${i}][_id]`, s._id);
        });

        // ----- IMAGES ----------------------------------------------------
        if (isNew) {
            // **ADD** – just upload the blobs, no existing images
            variant.images.forEach((img) => {
                if (img.blob) formData.append("images", img.blob);
            });
        } else {
            // **UPDATE** – send a JSON string + files in the SAME order
            const imagePayload: Array<{ public_id?: string; url: string }> = [];

            variant.images.forEach((img, idx) => {
                if (img.blob) {
                    // new file – will be in req.files[idx]
                    imagePayload.push({ url: `blob:${idx}` }); // marker for backend
                    formData.append("images", img.blob);      // file part
                } else {
                    // existing Cloudinary image – keep it
                    imagePayload.push({
                        public_id: img.public_id,
                        url: img.url,
                    });
                }
            });

            // send the JSON payload (exactly what backend parses)
            formData.append("images", JSON.stringify(imagePayload));
        }

        logFormData(formData);


        return formData;
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


    const saveVariantDetails = async (
        variant: Variant,
        tid: string,
        isNew: boolean
    ) => {
        if (!product) return;

        const formData = buildVariantFormData(variant, isNew);
        let res: any;

        logFormData(formData);

        try {
            if (!variant._id) throw new Error("Variant ID missing for update");
            res = await updateVariant(product._id, variant._id, formData);
            console.log(res, logFormData(formData), 'responce');

            const updatedVariant: Variant = {
                ...variant,
                ...(res.variant ?? res), // backend returns `{ variant: … }` for add, full doc for update
            };

            return { res, updatedVariant, tid, isNew };
        } catch (err) {
            console.error("Failed to save variant:", err);
            throw err;
        }
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
        setShowNewVariantForm(true);  // Show only the new variant form

        // Wait for render, then scroll
        setTimeout(() => {
            // const index = form?.variants?.length ?? 0; // new variant index (0-based)
            const element = document.getElementById('newVarient');
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
                element.classList.add("highlight");
                setTimeout(() => element.classList.remove("highlight"), 1200);
            }
        }, 150);
    };

    const removeVariant = async (pid: string, vid: string) => {
        const isConfirmed = window.confirm("Are you sure you want to delete this variant?");
        if (!isConfirmed) return;

        console.log(pid, vid);

        try {
            await deleteVariant(pid, vid);

            setForm((p) => ({
                ...p,
                variants: p.variants?.filter((v) => v._id !== vid && v.tempId !== vid),
            }));

            setProduct((prev) => ({
                ...prev!,
                variants: prev?.variants?.filter((v) => v._id !== vid) || [],
            }));

        } catch (error) {
            console.error(error);
            alert("Failed to remove variant.");
        }
    };

    const handleVariantAdded = () => {
        // 1. Close the form
        setShowNewVariantForm(false);
        console.log("New variant added");
    };


    const saveVariant = (tid: string, upd: Partial<Variant>) => {
        setForm((p) => ({
            ...p,
            variants: p.variants?.map((v) => {
                if (v._id !== tid && v.tempId !== tid) return v;

                const updated = { ...v, ...upd };

                // ---- 1. MRP or PRICE changed → recalc discount ----
                if (upd.mrp !== undefined || upd.price !== undefined) {
                    const mrp = updated.mrp ?? v.mrp;
                    const price = updated.price ?? v.price;
                    updated.discount = calcDiscount(mrp, price);
                }

                // ---- 2. DISCOUNT changed → recalc price ----
                if (upd.discount !== undefined) {
                    const mrp = updated.mrp ?? v.mrp;
                    updated.price = calcPriceFromDiscount(mrp, updated.discount);
                }

                return updated;
            }),
        }));
    };

    const isVariantValid = (variant: Variant): boolean => {
        return (
            variant.mrp > 0 &&          // MRP must be > 0
            variant.price > 0 &&        // Price must be > 0
            variant.price <= variant.mrp // Price cannot be higher than MRP
        );
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

    const handleImageUpload = (tid: string, e: ChangeEvent<HTMLInputElement>, isMainReplacement = false) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Find current variant
        const variant = form.variants?.find((v) => v._id === tid || v.tempId === tid);
        if (!variant) return;

        // If replacing the main image, handle differently
        if (isMainReplacement) {
            setImageFilesToCrop([files[0]]);
            setActiveVariantId(`REPLACE_MAIN_${tid}`);
            setShowCropper(true);
            return;
        }

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
        if (!croppedBlob) return;

        const public_id = `tmp_${Date.now()}_${Math.random()}`;
        const url = URL.createObjectURL(croppedBlob);
        const croppedFile = new File([croppedBlob], `cropped_${Date.now()}.jpg`, {
            type: croppedBlob.type || "image/jpeg",
        });

        // Check if we are replacing the main image (special active identifier)
        if (activeVariantId?.startsWith('REPLACE_MAIN_')) {
            const actualId = activeVariantId.replace('REPLACE_MAIN_', '');
            setForm((p) => ({
                ...p,
                variants: p.variants?.map((v) => {
                    if (v._id === actualId || v.tempId === actualId) {
                        const newImages = [...v.images];
                        if (newImages.length > 0) {
                            newImages[0] = { public_id, url, blob: croppedFile };
                        } else {
                            newImages.push({ public_id, url, blob: croppedFile });
                        }
                        return { ...v, images: newImages };
                    }
                    return v;
                })
            }));
            setActiveVariantId(null);
            return;
        }

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
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-500 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
            {/* ----- Top Indicator Bar ----- */}
            <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>

            <div className="max-w-7xl mx-auto p-6 lg:p-12">
                {/* ----- Header ----- */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 animate-in fade-in slide-in-from-top-8 duration-1000">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:scale-105 active:scale-95 transition-all shadow-sm"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1">Logistics & Supply</p>
                                <h1 className="text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                                    Edit Product
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-12 w-[1px] bg-gray-100 dark:bg-white/10 hidden md:block"></div>
                        <button
                            onClick={addVariantForm}
                            className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-black/10 hover:scale-[1.05] active:scale-[0.98] transition-all group"
                        >
                            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                            Initialize Variant
                        </button>
                    </div>
                </header>

                {/* ----- Basic Info Section ----- */}
                <section className="bg-white dark:bg-white/5 backdrop-blur-2xl p-8 lg:p-12 rounded-[2.5rem] border border-gray-100 dark:border-white/5 mb-12 shadow-2xl shadow-black/5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 overflow-hidden relative">
                    {/* Decorative Background Element */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit">
                                <AlertCircle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Core Manifest</span>
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Primary Configuration</h2>
                        </div>

                        <button
                            onClick={updateProductBasics}
                            disabled={saving}
                            className="bg-gray-900 dark:bg-white/10 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-black dark:hover:bg-white/20 transition-all shadow-xl shadow-black/5 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {saving ? "Commiting Changes..." : "Push Core Updates"}
                        </button>
                    </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Product Name */}
                    <div className="space-y-3 group/field">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20 group-focus-within/field:text-blue-500 transition-colors">
                            Asset Designation
                        </label>
                        <input
                            type="text"
                            value={form.name ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Classic Leather Jacket"
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-gray-300 dark:placeholder:text-white/10"
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-3 group/field">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20 group-focus-within/field:text-blue-500 transition-colors">
                            Target Demographic
                        </label>
                        <div className="relative">
                            <select
                                value={form.gender ?? "women"}
                                onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="men" className="bg-white dark:bg-black">Men</option>
                                <option value="women" className="bg-white dark:bg-black">Women</option>
                                <option value="kids" className="bg-white dark:bg-black">Kids</option>
                                <option value="unisex" className="bg-white dark:bg-black">Unisex</option>
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Style Name */}
                    <div className="space-y-3 group/field">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20 group-focus-within/field:text-blue-500 transition-colors">
                            Signature Style
                        </label>
                        <input
                            type="text"
                            value={form.styleName ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, styleName: e.target.value }))}
                            placeholder="e.g. Oxford Breeze"
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-gray-300 dark:placeholder:text-white/10"
                        />
                    </div>
                </div>

                {/* Dynamic Attributes */}
                {dynamicAttributes.length > 0 && (
                    <div className="mt-12 pt-12 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight italic">Technical Specification</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {dynamicAttributes.map((attr) => {
                                const selectedVal = form.attributes?.find(a => a.attributeId === attr._id)?.value ?? '';

                                return (
                                    <div key={attr._id} className="space-y-4 group/field">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20 group-focus-within/field:text-blue-500 transition-colors">
                                            {attr.name} {attr.isRequired && <span className="text-red-500 opacity-50">*</span>}
                                        </label>

                                        {/* SELECT */}
                                        {attr.inputType === 'select' && (
                                            <div className="relative">
                                                <select
                                                    value={selectedVal as string}
                                                    onChange={(e) => handleAttributeChange(attr._id, e.target.value)}
                                                    required={attr.isRequired}
                                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none cursor-pointer pr-10"
                                                >
                                                    <option value="" className="bg-white dark:bg-black">Identify {attr.name}</option>
                                                    {attr.values?.map(val => (
                                                        <option key={val.value} value={val.value} className="bg-white dark:bg-black">{val.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        )}

                                        {/* MULTISELECT */}
                                        {attr.inputType === 'multiselect' && (
                                            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl">
                                                {attr.values?.map((val) => {
                                                    const isChecked = Array.isArray(selectedVal) && selectedVal.includes(val.value);
                                                    return (
                                                        <label key={val.value} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all border ${isChecked ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-white/5 text-gray-400 dark:text-white/20 border-gray-100 dark:border-white/10 hover:border-blue-500'}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handleAttributeChange(attr._id, val.value, true)}
                                                                className="hidden"
                                                            />
                                                            {val.label}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* TEXT & NUMBER */}
                                        {(attr.inputType === 'text' || attr.inputType === 'number') && (
                                            <input
                                                type={attr.inputType}
                                                value={selectedVal as string | number}
                                                onChange={(e) => handleAttributeChange(attr._id, attr.inputType === 'number' ? Number(e.target.value) : e.target.value)}
                                                required={attr.isRequired}
                                                placeholder={`Enter ${attr.name}`}
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                            />
                                        )}

                                        {/* BOOLEAN */}
                                        {attr.inputType === 'boolean' && (
                                            <label className="flex items-center gap-4 cursor-pointer">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selectedVal}
                                                        onChange={(e) => handleAttributeChange(attr._id, e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-12 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-blue-500 transition-all"></div>
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6"></div>
                                                </div>
                                                <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Toggle Binary</span>
                                            </label>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {/* Description & Metadata Section */}
                <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Description */}
                    <div className="space-y-4 group/field">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20 group-focus-within/field:text-blue-500 transition-colors">
                            Product Description
                        </label>
                        <textarea
                            rows={6}
                            value={form.description ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Detail the asset specification..."
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl px-8 py-6 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-gray-300 dark:placeholder:text-white/10 resize-none leading-relaxed"
                        />
                    </div>

                    {/* Tags & Status */}
                    <div className="space-y-12">
                        {/* Tags */}
                        <div className="space-y-4 group/field">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20 group-focus-within/field:text-blue-500 transition-colors">
                                Indexing Keywords
                            </label>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {form.tags?.map((t) => (
                                    <span
                                        key={t}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10"
                                    >
                                        {t}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(t)}
                                            className="hover:scale-125 transition-transform"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                                    placeholder="Add keyword..."
                                    className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                />
                                <button
                                    onClick={addTag}
                                    className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Status Toggles */}
                        <div className="flex gap-8 px-2">
                            <label className="flex items-center gap-4 cursor-pointer group/toggle">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={form.isTriable ?? false}
                                        onChange={(e) => setForm((p) => ({ ...p, isTriable: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-8 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full peer peer-checked:bg-blue-500 transition-all"></div>
                                    <div className="absolute left-1.5 top-1.5 w-5 h-5 bg-white dark:bg-gray-400 rounded-full transition-all peer-checked:translate-x-6 peer-checked:bg-white"></div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20 group-hover/toggle:text-gray-900 dark:group-hover/toggle:text-white transition-colors">Triable Mode</span>
                            </label>

                            <label className="flex items-center gap-4 cursor-pointer group/toggle">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive ?? false}
                                        onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-8 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full peer peer-checked:bg-green-500 transition-all"></div>
                                    <div className="absolute left-1.5 top-1.5 w-5 h-5 bg-white dark:bg-gray-400 rounded-full transition-all peer-checked:translate-x-6 peer-checked:bg-white"></div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20 group-hover/toggle:text-gray-900 dark:group-hover/toggle:text-white transition-colors">Publication Status</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Logistics Warning */}
                <div className="mt-12 p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                        <AlertCircle size={20} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Inventory Immutable Clause</p>
                        <p className="text-sm font-bold text-amber-900/60 dark:text-amber-200/40 leading-relaxed">
                            Once defined, category and brand signatures are permanent for this asset. Change requires asset deletion and re-initialization.
                        </p>
                    </div>
                </div>
            </section>

            {/* ----- Variants Section ----- */}
            <section className="bg-white dark:bg-white/5 backdrop-blur-2xl p-8 lg:p-12 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-black/5 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 w-fit">
                            <Plus size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{product?.variants?.length} Active Modules</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Variant Specifications</h2>
                    </div>
                </div>

                <div className="space-y-12">
                    {form.variants?.map((variant, index) => {
                        const tid = variant._id || variant.tempId;
                        const isNew = !variant._id;
                        return (
                            <div
                                key={tid}
                                id={`variant-${index}`}
                                className="group/variant relative bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-[3rem] p-8 lg:p-12 transition-all hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-black/5 mb-12 last:mb-0"
                            >
                                {/* Remove Variant */}
                                <button
                                    onClick={() => {
                                        if (product && variant._id) {
                                            removeVariant(product._id, variant._id);
                                        }
                                    }}
                                    className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-red-500/5 text-red-500 flex items-center justify-center opacity-0 group-hover/variant:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-300 z-10"
                                >
                                    <Trash2 size={18} />
                                </button>

                                {/* Variant Identity */}
                                <div className="flex items-center gap-6 mb-12">
                                    <div
                                        className="w-16 h-16 rounded-full ring-4 ring-gray-100 dark:ring-white/10 shadow-inner"
                                        style={{ backgroundColor: variant.color.hex || '#ccc' }}
                                    />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20">Module Signature</p>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter italic">
                                            {variant.color.name || 'Unnamed'} {isNew && <span className="text-blue-500 font-black not-italic ml-2">(Draft)</span>}
                                        </h3>
                                    </div>
                                </div>

                                {/* Configuration Matrix */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                                    {/* Color Identity */}
                                    <div className="space-y-4 group/field">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20 group-focus-within/field:text-blue-500 transition-colors">
                                            Signature Color
                                        </label>
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                value={variant.color.name}
                                                onChange={(e) => saveVariant(tid!, { color: { ...variant.color, name: e.target.value } })}
                                                placeholder="e.g. Carbon Black"
                                                className="flex-1 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono uppercase"
                                            />
                                            <div className="relative w-14 h-14 group/picker">
                                                <input
                                                    type="color"
                                                    value={variant.color.hex}
                                                    onChange={(e) => saveVariant(tid!, { color: { ...variant.color, hex: e.target.value } })}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div 
                                                    className="w-full h-full rounded-2xl border-2 border-white dark:border-black shadow-xl transition-transform group-hover/picker:scale-110"
                                                    style={{ backgroundColor: variant.color.hex || '#000' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financials */}
                                    <div className="space-y-4 group/field">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20 group-focus-within/field:text-blue-500 transition-colors">
                                            MRP Valuation
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">₹</span>
                                            <input
                                                type="number"
                                                value={variant.mrp}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    if (val >= 1) saveVariant(tid!, { mrp: val });
                                                }}
                                                className="w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 group/field">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/20 group-focus-within/field:text-blue-500 transition-colors">
                                            Market Price
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">₹</span>
                                            <input
                                                type="number"
                                                value={variant.price}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    if (val >= 1) saveVariant(tid!, { price: val });
                                                }}
                                                className={`w-full bg-white dark:bg-white/5 border ${variant.price > variant.mrp ? 'border-red-500' : 'border-gray-100 dark:border-white/10'} rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Logistics Center (Sizes & Stock) */}
                                <div className="bg-gray-900/[0.02] dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 lg:p-10 mb-12">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Inventory Matrix</h4>
                                        </div>
                                        <button
                                            onClick={() => addSize(tid!)}
                                            className="h-10 px-6 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                                        >
                                            Add Capacity
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {variant.sizes.map((sz) => (
                                            <div key={sz._id} className="flex items-center gap-2 p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl group/size">
                                                <input
                                                    type="text"
                                                    value={sz.size}
                                                    onChange={(e) => updateSize(tid!, sz._id!, "size", e.target.value.toUpperCase())}
                                                    placeholder="SIZE"
                                                    className="w-16 bg-gray-50 dark:bg-white/5 border-none rounded-xl px-2 py-2 text-center text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                                <div className="h-4 w-[1px] bg-gray-100 dark:bg-white/10"></div>
                                                <input
                                                    type="number"
                                                    value={sz.stock}
                                                    onChange={(e) => updateSize(tid!, sz._id!, "stock", Number(e.target.value))}
                                                    placeholder="STK"
                                                    className="flex-1 bg-transparent border-none px-2 py-2 text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                                <button
                                                    onClick={() => removeSize(tid!, sz._id!)}
                                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleUpdateStock(tid!)}
                                        disabled={!variant._id || saving}
                                        className="mt-8 w-full h-14 bg-blue-500 text-white rounded-[1.25rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        Synchronize Stock Level
                                    </button>
                                </div>

                                {/* Visual Assets (Images) */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Visual Assets</h4>
                                    </div>

                                    <div className="flex flex-wrap gap-6">
                                        {/* Main Card Image */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Primary Focus</p>
                                            {variant.images.length > 0 ? (
                                                <div className="relative w-40 h-40 rounded-[2rem] overflow-hidden group/img ring-2 ring-gray-100 dark:ring-white/10">
                                                    <img src={variant.images[0].url} alt="Main" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                        <label className="cursor-pointer bg-white text-black p-3 rounded-full hover:scale-110 transition-transform">
                                                            <RefreshCcw size={16} />
                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(tid!, e, true)} />
                                                        </label>
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Swap</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2rem] cursor-pointer hover:border-blue-500 transition-all group/upload">
                                                    <Upload size={24} className="text-gray-300 group-hover/upload:text-blue-500 transition-colors" />
                                                    <span className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-[0.2em]">Upload Master</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(tid!, e)} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Gallery */}
                                        <div className="space-y-3 flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gallery Cluster (Max 3)</p>
                                            <div className="flex flex-wrap gap-4">
                                                {variant.images.slice(1).map((img) => (
                                                    <div key={img.public_id} className="relative w-24 h-24 rounded-2xl overflow-hidden group/gall shadow-lg">
                                                        <img src={img.url} className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => removeImage(tid!, img._id!)}
                                                            className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover/gall:opacity-100 transition-opacity flex items-center justify-center"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {variant.images.length < 4 && (
                                                    <label className="w-24 h-24 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all group/gallup">
                                                        <Plus size={20} className="text-gray-300 group-hover/gallup:text-blue-500" />
                                                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(tid!, e)} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 flex items-center justify-between pt-8 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex items-center gap-3 text-gray-400">
                                        <div className={`w-2 h-2 rounded-full ${isVariantValid(variant) ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {isVariantValid(variant) ? 'Structural Integrity Verified' : 'Missing Specifications'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleSaveVariantDetails(tid!)}
                                        disabled={saving || !isVariantValid(variant)}
                                        className="bg-black dark:bg-white text-white dark:text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20 disabled:opacity-50"
                                    >
                                        Commit Module State
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {showNewVariantForm && (
                    <div id='newVarient' className="mt-12 pt-12 border-t border-gray-100 dark:border-white/5">
                        <VariantForm product={product} onVariantAdded={handleVariantAdded} />
                    </div>
                )}
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
        </div>
    );
}