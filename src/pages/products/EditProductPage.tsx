import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, Plus, Upload, X, Save, ArrowLeft, AlertCircle, ChevronDown, RefreshCcw, Loader2 } from "lucide-react";
import { getBaseProductById, editProduct, updateStock, updateVariant, deleteVariant, getAttributes } from "../../api/products";
import VariantForm from "../../components/Products/VariantForm";
import { calcDiscount, calcPriceFromDiscount } from "../../utils/price";
import CropperModal from "../../components/utils/CropperModal";
import '../../components/Products/AddNewProduct.css'; // Reusing the product styles

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
    blob?: File;
}
interface Variant {
    color: Color;
    sizes: Size[];
    mrp: number;
    price: number;
    images: Image[];
    discount: number;
    _id?: string;
    tempId?: string;
}
interface Product {
    _id: string;
    name: string;
    brand: string;
    category: string;
    subCategory: string;
    gender: string[];
    description: string;
    styleName: string;
    attributes: { attributeId: string; value: any }[];
    tags: string[];
    isTriable: boolean;
    isActive: boolean;
    variants: Variant[];
}

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
        gender: ['MEN', 'WOMEN'],
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

    useEffect(() => {
        const fetchAttributes = async () => {
            const subCatId = (product as any)?.subCategoryId?._id || form?.subCategory;
            if (!subCatId) {
                setDynamicAttributes([]);
                return;
            }
            try {
                const res = await getAttributes(subCatId);
                setDynamicAttributes(res.attributes || []);
            } catch (err) {
                console.error("Failed to fetch attributes:", err);
            }
        };
        fetchAttributes();
    }, [product?.subCategory, form.subCategory, product]);

    const handleAttributeChange = (attributeId: string, value: any, isMultiselect: boolean = false) => {
        setForm(prev => {
            let updatedAttributes = [...(prev.attributes || [])];
            const existingIndex = updatedAttributes.findIndex(a => a.attributeId === attributeId);
            if (isMultiselect) {
                if (existingIndex >= 0) {
                    let currentValues = updatedAttributes[existingIndex].value as string[];
                    if (!Array.isArray(currentValues)) currentValues = [currentValues].filter(Boolean);
                    if (currentValues.includes(value)) currentValues = currentValues.filter(v => v !== value);
                    else currentValues.push(value);
                    if (currentValues.length === 0) updatedAttributes.splice(existingIndex, 1);
                    else updatedAttributes[existingIndex] = { ...updatedAttributes[existingIndex], value: currentValues };
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
        if (!product || saving) return;
        setSaving(true);
        try {
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
            await editProduct(product._id, payload);
            alert("Basic information updated successfully.");
        } catch (err) {
            console.error(err);
            alert("Failed to update basic info.");
        } finally {
            setSaving(false);
        }
    };

    const buildVariantFormData = (variant: Variant, isNew: boolean): FormData => {
        const formData = new FormData();
        formData.append("mrp", String(variant.mrp));
        formData.append("price", String(variant.price));
        formData.append("discount", String(variant.discount));
        formData.append("color[name]", variant.color.name);
        formData.append("color[hex]", variant.color.hex);
        variant.sizes.forEach((s, i) => {
            formData.append(`sizes[${i}][size]`, s.size);
            formData.append(`sizes[${i}][stock]`, String(s.stock));
            if (s._id) formData.append(`sizes[${i}][_id]`, s._id);
        });
        if (isNew) {
            variant.images.forEach((img) => { if (img.blob) formData.append("images", img.blob); });
        } else {
            const imagePayload: Array<{ public_id?: string; url: string }> = [];
            variant.images.forEach((img, idx) => {
                if (img.blob) {
                    imagePayload.push({ url: `blob:${idx}` });
                    formData.append("images", img.blob);
                } else {
                    imagePayload.push({ public_id: img.public_id, url: img.url });
                }
            });
            formData.append("images", JSON.stringify(imagePayload));
        }
        return formData;
    };

    const saveVariantDetails = async (variant: Variant, tid: string, isNew: boolean) => {
        if (!product) return;
        const formData = buildVariantFormData(variant, isNew);
        try {
            if (!variant._id) throw new Error("Variant ID missing for update");
            const res = await updateVariant(product._id, variant._id, formData);
            const updatedVariant: Variant = { ...variant, ...(res.variant ?? res) };
            return { res, updatedVariant, tid, isNew };
        } catch (err) {
            console.error("Failed to save variant:", err);
            throw err;
        }
    };

    const updateVariantStock = async (variant: Variant) => {
        if (!product || !variant._id) return;
        const payload = { sizes: variant.sizes.map((s) => ({ size: s.size, stock: s.stock })) };
        await updateStock(product._id, variant._id, payload);
    };

    const handleSaveVariantDetails = async (tid: string) => {
        if (saving) return;
        setSaveVariantApi(true);
        try {
            const variant = form.variants?.find((v) => v._id === tid || v.tempId === tid);
            if (!variant) return alert("Variant not found");
            const isNew = !variant._id;
            const result = await saveVariantDetails(variant, tid, isNew);
            if (!result) return;
            const { updatedVariant } = result;
            if (isNew) {
                setForm((prev) => ({ ...prev, variants: prev.variants?.map((v) => (v.tempId === tid ? updatedVariant : v)) || [] }));
                setProduct((prev) => ({ ...prev!, variants: [...(prev?.variants || []), updatedVariant] }));
            } else {
                setForm((prev) => ({ ...prev, variants: prev.variants?.map((v) => (v._id === tid ? updatedVariant : v)) || [] }));
                setProduct((prev) => prev ? { ...prev, variants: prev.variants.map((v) => (v._id === tid ? updatedVariant : v)) } : null);
            }
            alert(isNew ? "Variant added." : "Variant details updated.");
        } catch (err) {
            console.error(err);
            alert("Failed to save variant.");
        } finally {
            setSaveVariantApi(false);
        }
    };

    const handleUpdateStock = async (tid: string) => {
        if (saving) return;
        setSaving(true);
        try {
            const variant = form.variants?.find((v) => v._id === tid || v.tempId === tid);
            if (!variant || !variant._id) return alert("Save variant first.");
            await updateVariantStock(variant);
            setProduct((prev) => prev ? { ...prev, variants: prev.variants.map((v) => (v._id === tid || v.tempId === tid ? { ...v, sizes: variant.sizes } : v)) } : null);
            alert("Stock updated.");
        } catch (err) {
            console.error(err);
            alert("Failed to update stock.");
        } finally {
            setSaving(false);
        }
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !form.tags?.includes(tag)) {
            setForm((p) => ({ ...p, tags: [...(p.tags ?? []), tag] }));
            setTagInput("");
        }
    };
    const removeTag = (tag: string) => { setForm((p) => ({ ...p, tags: p.tags?.filter((t) => t !== tag) })); };

    const addVariantForm = () => {
        setShowNewVariantForm(true);
        setTimeout(() => {
            const element = document.getElementById('newVariant');
            if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
    };

    const removeVariant = async (pid: string, vid: string) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteVariant(pid, vid);
            setForm((p) => ({ ...p, variants: p.variants?.filter((v) => v._id !== vid) }));
            setProduct((prev) => prev ? { ...prev, variants: prev.variants.filter((v) => v._id !== vid) } : null);
        } catch (error) {
            console.error(error);
            alert("Failed to remove variant.");
        }
    };

    const handleVariantAdded = () => { setShowNewVariantForm(false); };

    const saveVariant = (tid: string, upd: Partial<Variant>) => {
        setForm((p) => ({
            ...p,
            variants: p.variants?.map((v) => {
                if (v._id !== tid && v.tempId !== tid) return v;
                const updated = { ...v, ...upd };
                if (upd.mrp !== undefined || upd.price !== undefined) {
                    updated.discount = calcDiscount(updated.mrp, updated.price);
                }
                if (upd.discount !== undefined) {
                    updated.price = calcPriceFromDiscount(updated.mrp, updated.discount);
                }
                return updated;
            }),
        }));
    };

    const isVariantValid = (variant: Variant): boolean => variant.mrp > 0 && variant.price > 0 && variant.price <= variant.mrp;

    const addSize = (tid: string) => {
        setForm((p) => ({
            ...p,
            variants: p.variants?.map((v) =>
                v._id === tid || v.tempId === tid ? { ...v, sizes: [...v.sizes, { size: "S", stock: 0 }] } : v
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
                v._id === tid || v.tempId === tid ? { ...v, sizes: v.sizes.map((s) => (s._id === sid ? { ...s, [field]: val } : s)) } : v
            ),
        }));
    };

    const handleImageUpload = (tid: string, e: ChangeEvent<HTMLInputElement>, isMainReplacement = false) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const variant = form.variants?.find((v) => v._id === tid || v.tempId === tid);
        if (!variant) return;
        if (isMainReplacement) {
            setImageFilesToCrop([files[0]]);
            setActiveVariantId(`REPLACE_MAIN_${tid}`);
            setShowCropper(true);
            return;
        }
        const newFiles = Array.from(files);
        if (variant.images.length + newFiles.length > 4) {
            alert("Max 4 images allowed.");
            setImageFilesToCrop(newFiles.slice(0, 4 - variant.images.length));
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
        const public_id = `tmp_${Date.now()}`;
        const url = URL.createObjectURL(croppedBlob);
        const croppedFile = new File([croppedBlob], `cropped_${Date.now()}.jpg`, { type: "image/jpeg" });
        if (activeVariantId?.startsWith('REPLACE_MAIN_')) {
            const actualId = activeVariantId.replace('REPLACE_MAIN_', '');
            setForm((p) => ({
                ...p,
                variants: p.variants?.map((v) => {
                    if (v._id === actualId || v.tempId === actualId) {
                        const newImages = [...v.images];
                        if (newImages.length > 0) newImages[0] = { public_id, url, blob: croppedFile };
                        else newImages.push({ public_id, url, blob: croppedFile });
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
                    ? { ...v, images: [...v.images, { public_id, url, blob: croppedFile }] }
                    : v
            ),
        }));
    };

    if (loading) return <div className="flex-center h-screen"><Loader2 className="animate-spin" size={40} /></div>;

    return (
        <div className="products-page">
            <div className="products-container" style={{ maxWidth: "1000px" }}>
                {/* Header Section */}
                <div className="products-card" style={{ marginBottom: "var(--space-6)" }}>
                    <div className="products-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h1>Edit Product</h1>
                            <p>Modifying details for: <span>{product?.name}</span></p>
                        </div>
                        <div style={{ display: "flex", gap: "var(--space-3)" }}>
                            <button onClick={() => navigate(-1)} className="secondary-btn" style={{ padding: "8px 16px" }}>
                                <ArrowLeft size={18} /> Back
                            </button>
                            <button onClick={addVariantForm} className="primary-btn" style={{ background: "var(--color-success)", color: "white" }}>
                                <Plus size={18} /> Add Variant
                            </button>
                        </div>
                    </div>
                </div>

                {/* Step 1: Basic Info */}
                <div className="products-card" style={{ marginBottom: "var(--space-6)" }}>
                    <div className="products-header">
                        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>1. Basic Information</h2>
                    </div>
                    <div className="products-form">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="form-group">
                                <label>Product Name</label>
                                <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label>Style Name</label>
                                <input type="text" value={form.styleName} onChange={(e) => setForm(p => ({ ...p, styleName: e.target.value }))} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Gender Focus</label>
                            <div className="flex gap-4">
                                {['MEN', 'WOMEN', 'KIDS'].map(g => (
                                    <label key={g} className="checkbox-group">
                                        <input type="checkbox" checked={form.gender?.includes(g)} onChange={(e) => {
                                            const updated = e.target.checked ? [...(form.gender || []), g] : (form.gender || []).filter(x => x !== g);
                                            setForm(p => ({ ...p, gender: updated }));
                                        }} />
                                        <span>{g}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {dynamicAttributes.length > 0 && (
                            <div style={{ background: "var(--color-bg)", padding: "var(--space-5)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                                <h4 style={{ fontWeight: 600, marginBottom: "var(--space-4)" }}>Category Attributes</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dynamicAttributes.map(attr => {
                                        const selectedVal = form.attributes?.find(a => a.attributeId === attr._id)?.value ?? '';
                                        return (
                                            <div key={attr._id} className="form-group">
                                                <label>{attr.name}</label>
                                                {attr.inputType === 'select' && (
                                                    <div className="select-wrapper">
                                                        <select value={selectedVal as string} onChange={(e) => handleAttributeChange(attr._id, e.target.value)}>
                                                            <option value="">Select {attr.name}</option>
                                                            {attr.values?.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                                                        </select>
                                                        <ChevronDown className="select-icon" />
                                                    </div>
                                                )}
                                                {/* Text/Number support */}
                                                {(attr.inputType === 'text' || attr.inputType === 'number') && (
                                                    <input type={attr.inputType} value={selectedVal} onChange={(e) => handleAttributeChange(attr._id, attr.inputType === 'number' ? Number(e.target.value) : e.target.value)} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Description</label>
                            <textarea rows={5} value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
                        </div>

                        <div className="form-group">
                            <label>Search Tags</label>
                            <div className="flex gap-2 !mb-3 flex-wrap">
                                {form.tags?.map(t => (
                                    <span key={t} className="tag-item" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        {t} <X size={12} onClick={() => removeTag(t)} style={{ cursor: "pointer" }} />
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add a tag..." style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && addTag()} />
                                <button type="button" onClick={addTag} className="secondary-btn">Add</button>
                            </div>
                        </div>

                        <div className="settings-row">
                            <label className="checkbox-group">
                                <input type="checkbox" checked={form.isTriable} onChange={e => setForm(p => ({ ...p, isTriable: e.target.checked }))} />
                                <span>Try and Buy Enabled</span>
                            </label>
                            <label className="checkbox-group">
                                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                                <span>Product is Active</span>
                            </label>
                        </div>

                        <div className="submit-group">
                            <button onClick={updateProductBasics} disabled={saving} className="submit-btn">
                                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Basic Changes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Step 2: Variants */}
                <div className="products-card" style={{ marginBottom: "var(--space-6)" }}>
                    <div className="products-header">
                        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>2. Product Variants ({form.variants?.length})</h2>
                    </div>
                    <div className="products-form" style={{ gap: "var(--space-8)" }}>
                        {form.variants?.map((variant, index) => {
                            const tid = variant._id || variant.tempId;
                            const isNew = !variant._id;
                            return (
                                <div key={tid} style={{ padding: "var(--space-6)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", position: "relative", background: "var(--color-bg)" }}>
                                    <button onClick={() => variant._id && removeVariant(product!._id, variant._id)} style={{ position: "absolute", top: "16px", right: "16px", color: "var(--color-danger)", background: "transparent", border: "none", cursor: "pointer" }}>
                                        <Trash2 size={20} />
                                    </button>

                                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: variant.color.hex, border: "1px solid var(--color-border)" }} />
                                        <h3 style={{ fontWeight: 700 }}>Variant: {variant.color.name} {isNew && "(Unsaved)"}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="form-group">
                                            <label>MRP</label>
                                            <input type="number" value={variant.mrp} onChange={e => saveVariant(tid!, { mrp: Number(e.target.value) })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Selling Price</label>
                                            <input type="number" value={variant.price} onChange={e => saveVariant(tid!, { price: Number(e.target.value) })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Discount (%)</label>
                                            <input type="number" value={variant.discount} onChange={e => saveVariant(tid!, { discount: Number(e.target.value) })} />
                                        </div>
                                    </div>

                                    {/* Stock Section */}
                                    <div style={{ marginTop: "24px", background: "var(--color-surface)", padding: "16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                                        <div className="flex-between" style={{ marginBottom: "12px" }}>
                                            <span style={{ fontWeight: 600 }}>Sizes & Stock</span>
                                            <button onClick={() => addSize(tid!)} className="secondary-btn" style={{ padding: "4px 8px", fontSize: "12px" }}><Plus size={14} /> Add Size</button>
                                        </div>
                                        {variant.sizes.map(sz => (
                                            <div key={sz._id || sz.size} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                                                <input type="text" value={sz.size} onChange={e => updateSize(tid!, sz._id!, "size", e.target.value.toUpperCase())} placeholder="Size" />
                                                <input type="number" value={sz.stock} onChange={e => updateSize(tid!, sz._id!, "stock", Number(e.target.value))} placeholder="Stock" />
                                                <X size={16} onClick={() => removeSize(tid!, sz._id!)} style={{ cursor: "pointer", color: "var(--color-danger)" }} />
                                            </div>
                                        ))}
                                        <button onClick={() => handleUpdateStock(tid!)} disabled={saving} className="secondary-btn" style={{ marginTop: "10px", width: "100%", padding: "10px" }}>Update Stock Only</button>
                                    </div>

                                    {/* Images Section */}
                                    <div style={{ marginTop: "24px" }}>
                                        <label style={{ display: "block", marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}>Variant Images (Max 4)</label>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                                            {variant.images.map((img, i) => (
                                                <div key={img._id || i} style={{ position: "relative", width: "100px", height: "100px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid var(--color-border)" }}>
                                                    <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    {i === 0 && <div style={{ position: "absolute", bottom: 0, width: "100%", background: "rgba(0,0,0,0.6)", color: "white", fontSize: "10px", textAlign: "center", padding: "2px" }}>MAIN</div>}
                                                    <button onClick={() => removeImage(tid!, img._id!)} style={{ position: "absolute", top: "4px", right: "4px", background: "var(--color-danger)", color: "white", borderRadius: "4px", padding: "2px", border: "none" }}><X size={12} /></button>
                                                </div>
                                            ))}
                                            {variant.images.length < 4 && (
                                                <label style={{ width: "100px", height: "100px", border: "2px dashed var(--color-border)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--color-bg)" }}>
                                                    <Upload size={20} style={{ color: "var(--color-text-tertiary)" }} />
                                                    <input type="file" hidden accept="image/*" multiple onChange={e => handleImageUpload(tid!, e)} />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <button onClick={() => handleSaveVariantDetails(tid!)} disabled={saveVariantApi || !isVariantValid(variant)} className="submit-btn" style={{ marginTop: "24px" }}>
                                        {saveVariantApi ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save All Variant Changes
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {showNewVariantForm && (
                     <div id='newVariant' className="products-card" style={{ padding: "var(--space-6)", background: "var(--color-surface)", marginBottom: "100px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Add New Variant</h2>
                            <X size={24} onClick={() => setShowNewVariantForm(false)} style={{ cursor: "pointer" }} />
                        </div>
                        <VariantForm product={product} onVariantAdded={handleVariantAdded} />
                     </div>
                )}
            </div>

            {showCropper && (
                <CropperModal
                    imageSrcs={imageFilesToCrop.map((file) => URL.createObjectURL(file))}
                    onClose={() => { setShowCropper(false); setImageFilesToCrop([]); setActiveVariantId(null); }}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    );
}