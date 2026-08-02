import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, Upload, X, Save, ArrowLeft, ChevronDown, Loader2, Plus } from "lucide-react";
import { getBaseProductById, editProduct, getAttributes, uploadImage, deleteImage } from "../../api/products";
import { updateMyWarehouseProduct } from "../../api/warehouseOrder";
import { calcDiscount, calcPriceFromDiscount } from "../../utils/price";
import { POPULAR_COLORS } from "../../utils/colors";
import CropperModal from "../../components/utils/CropperModal";
import { ProductTitleInput } from "../../components/Products/ProductTitleInput";
import CustomColorDropdown from "../../components/utils/CustomColorDropdown";
import { useAuth } from "../../context/AuthContext";
import '../../components/Products/AddNewProduct.css';

/* ----------- Types ------------ */
interface Color {
    name: string;
    hex: string;
}
interface Image {
    public_id: string;
    url: string;
    _id?: string;
}
interface Product {
    _id: string;
    name: string;
    brand: string;
    brandId?: any;
    categoryId?: any;
    subCategoryId?: any;
    category: string;
    subCategory: string;
    gender: string[];
    description: string;
    styleName: string;
    attributes: { attributeId: string; value: any }[];
    tags: string[];
    isTriable: boolean;
    isActive: boolean;
    collectionIds?: string[];
    color?: Color;
    size?: string;
    stock: number;
    mrp: number;
    price: number;
    discount: number;
    images?: Image[];
    productCode?: string;
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
    const { merchant } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStepMessage, setSaveStepMessage] = useState("");
    const [product, setProduct] = useState<Product | null>(null);

    // Form States
    const [name, setName] = useState("");
    const [styleName, setStyleName] = useState("");
    const [description, setDescription] = useState("");
    const [gender, setGender] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [attributes, setAttributes] = useState<{ attributeId: string; value: any }[]>([]);
    const [isTriable, setIsTriable] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [tagInput, setTagInput] = useState("");

    // Flat SKU attributes
    const [color, setColor] = useState<Color>({ name: "", hex: "" });
    const [sizes, setSizes] = useState<Size[]>([]);
    const [mrp, setMrp] = useState<number>(0);
    const [price, setPrice] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [images, setImages] = useState<Image[]>([]);

    const [dynamicAttributes, setDynamicAttributes] = useState<DynamicAttribute[]>([]);
    const [imageFilesToCrop, setImageFilesToCrop] = useState<File[]>([]);
    const [showCropper, setShowCropper] = useState(false);

    /* -------- LOAD PRODUCT -------- */
    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const data: Product = await getBaseProductById(id);
                setProduct(data);
                
                // Prefill Form
                setName(data.name || "");
                setStyleName(data.styleName || "");
                setDescription(data.description || "");
                setGender(data.gender || []);
                setTags(data.tags || []);
                setAttributes(data.attributes || []);
                setIsTriable(data.isTriable ?? true);
                setIsActive(data.isActive ?? true);

                // Prefill flat SKU attributes
                setColor(data.color || { name: "", hex: "" });
                setSizes(data.sizes || []);
                setMrp(data.mrp ?? 0);
                setPrice(data.price ?? 0);
                setDiscount(data.discount ?? 0);
                setImages(data.images || []);
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
            const subCatId = product?.subCategoryId?._id || product?.subCategoryId || product?.categoryId?._id || product?.categoryId;
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
    }, [product]);

    const handleAttributeChange = (attributeId: string, value: any, isMultiselect: boolean = false) => {
        let updatedAttributes = [...attributes];
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
        setAttributes(updatedAttributes);
    };

    /* -------- GLOBAL SAVE -------- */
    const handleGlobalSave = async () => {
        if (!id || saving) return;
        setSaving(true);
        setSaveStepMessage("Saving product updates...");

        try {
            const payload = {
                name,
                styleName,
                description,
                gender,
                tags,
                attributes,
                isTriable,
                isActive,
                color,
                mrp,
                price,
                discount,
            };

            if (merchant?.accountType === 'warehouse') {
                await updateMyWarehouseProduct(id, payload);
                alert("Product updated successfully!");
                navigate("/merchant/warehouse-products");
            } else {
                await editProduct(id, payload);
                alert("Product updated successfully!");
                navigate("/merchant/inventory");
            }
        } catch (err: any) {
            console.error("Save product failed:", err);
            alert("Failed to save changes: " + (err.message || err));
        } finally {
            setSaving(false);
            setSaveStepMessage("");
        }
    };

    const addSizeOption = () => {
        setSizes(prev => [...prev, { size: "S", stock: 0, _id: "" }]);
    };
    const removeSizeOption = (index: number) => {
        setSizes(prev => prev.filter((_, idx) => idx !== index));
    };
    const updateSizeOption = (index: number, field: keyof Size, val: string | number) => {
        setSizes(prev => prev.map((s, idx) => (idx === index ? { ...s, [field]: val } : s)));
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
            setTagInput("");
        }
    };
    const removeTag = (tag: string) => { setTags(tags.filter((t) => t !== tag)); };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (images.length + files.length > 5) {
            alert("Max 5 images allowed.");
            return;
        }
        setImageFilesToCrop(Array.from(files));
        setShowCropper(true);
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!croppedBlob || !id) return;
        setSaving(true);
        setSaveStepMessage("Uploading image...");
        try {
            const croppedFile = new File([croppedBlob], `image_${Date.now()}.jpg`, { type: "image/jpeg" });
            const res = await uploadImage(croppedFile, id, 0);
            if (res.images) {
                setImages(res.images);
            } else {
                // Fetch fresh images fallback
                const data: Product = await getBaseProductById(id);
                setImages(data.images || []);
            }
        } catch (err) {
            console.error(err);
            alert("Image upload failed.");
        } finally {
            setSaving(false);
            setSaveStepMessage("");
        }
    };

    const handleRemoveImage = async (imageId: string) => {
        if (!window.confirm("Are you sure you want to delete this image?")) return;
        setSaving(true);
        setSaveStepMessage("Deleting image...");
        try {
            await deleteImage(imageId);
            setImages(images.filter(img => img._id !== imageId && img.public_id !== imageId));
        } catch (err) {
            console.error(err);
            alert("Failed to delete image.");
        } finally {
            setSaving(false);
            setSaveStepMessage("");
        }
    };

    const handleMRPChange = (val: number) => {
        setMrp(val);
        setPrice(calcPriceFromDiscount(val, discount));
    };

    const handlePriceChange = (val: number) => {
        setPrice(val);
        setDiscount(calcDiscount(mrp, val));
    };

    const handleDiscountChange = (val: number) => {
        setDiscount(val);
        setPrice(calcPriceFromDiscount(mrp, val));
    };

    if (loading) return <div className="flex-center h-screen"><Loader2 className="animate-spin" size={40} /></div>;

    return (
        <div className="products-page">
            {saving && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "16px", color: "white" }}>
                    <Loader2 className="animate-spin" size={48} />
                    <p style={{ fontWeight: 600, fontSize: "16px" }}>{saveStepMessage}</p>
                </div>
            )}

            <div className="products-container" style={{ maxWidth: "1000px" }}>
                {/* Header Section */}
                <div className="products-card" style={{ marginBottom: "var(--space-6)" }}>
                    <div className="products-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h1>Edit SKU</h1>
                            <p>Modifying details for: <span>{name}</span></p>
                        </div>
                        <div style={{ display: "flex", gap: "var(--space-3)" }}>
                            <button onClick={() => navigate(-1)} className="secondary-btn" style={{ padding: "8px 16px" }}>
                                <ArrowLeft size={18} /> Back
                            </button>
                            <button onClick={handleGlobalSave} className="primary-btn" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Save size={18} /> Save SKU
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
                        <div className="form-group">
                            <ProductTitleInput 
                                value={name}
                                onChange={setName}
                            />
                        </div>
                        <div className="form-group">
                            <label>Style Name <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
                            <input type="text" value={styleName} onChange={(e) => setStyleName(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Gender Focus</label>
                            <div className="flex gap-4">
                                {['MEN', 'WOMEN', 'BOYS', 'GIRLS'].map(g => (
                                    <label key={g} className="checkbox-group">
                                        <input type="checkbox" checked={gender.includes(g)} onChange={(e) => {
                                            const updated = e.target.checked ? [...gender, g] : gender.filter(x => x !== g);
                                            setGender(updated);
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
                                        const selectedVal = attributes.find(a => a.attributeId === attr._id)?.value ?? '';
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
                            <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Search Tags</label>
                            <div className="flex gap-2 !mb-3 flex-wrap">
                                {tags.map(t => (
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
                    </div>
                </div>

                {/* Step 2: SKU Specification Details */}
                <div className="products-card" style={{ marginBottom: "var(--space-6)" }}>
                    <div className="products-header">
                        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>2. SKU Specification & Stock</h2>
                    </div>
                    <div className="products-form">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: "var(--space-6)" }}>
                            {/* Color Dropdown */}
                            <div className="form-group">
                                <label>Product Color</label>
                                <CustomColorDropdown
                                    options={POPULAR_COLORS}
                                    value={{ name: color.name, hex: color.hex }}
                                    onChange={setColor}
                                />
                            </div>

                            {/* Pricing */}
                            <div className="form-group">
                                <label>MRP (Max Retail Price)</label>
                                <input type="number" min={0} value={mrp} onChange={(e) => handleMRPChange(Math.max(0, Number(e.target.value)))} />
                            </div>

                            <div className="form-group">
                                <label>Discount Percentage (%)</label>
                                <input type="number" min={0} max={100} value={discount} onChange={(e) => handleDiscountChange(Math.min(100, Math.max(0, Number(e.target.value))))} />
                            </div>

                            <div className="form-group">
                                <label>Final Selling Price (₹)</label>
                                <input type="number" min={0} value={price} onChange={(e) => handlePriceChange(Math.max(0, Number(e.target.value)))} />
                            </div>
                        </div>

                        {/* Sizes & Stock Levels */}
                        <div style={{ background: "var(--color-surface)", padding: "20px", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "var(--space-6)" }}>
                            <div className="flex-between" style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 600 }}>Sizes & Stock levels <span className="required">*</span></span>
                                <button type="button" onClick={addSizeOption} className="secondary-btn" style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <Plus size={14} /> Add Size Option
                                </button>
                            </div>
                            {sizes.map((sz, szIdx) => (
                                <div key={szIdx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
                                    <div className="select-wrapper" style={{ margin: 0 }}>
                                        <select value={sz.size} onChange={(e) => updateSizeOption(szIdx, "size", e.target.value)} required>
                                            {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free'].map((optionSize) => (
                                                <option key={optionSize} value={optionSize}>{optionSize}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="select-icon" />
                                    </div>
                                    <input type="number" min={0} value={sz.stock} onChange={e => updateSizeOption(szIdx, "stock", Number(e.target.value))} placeholder="Stock" required />
                                    <button type="button" onClick={() => removeSizeOption(szIdx)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step 3: Product Images */}
                <div className="products-card" style={{ marginBottom: "var(--space-6)" }}>
                    <div className="products-header">
                        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>3. SKU Gallery</h2>
                    </div>
                    <div className="products-form">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {images.map((img, index) => (
                                <div key={img._id || index} className="image-preview-card" style={{ position: "relative", width: "100%", paddingBottom: "100%", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
                                    <img src={img.url} alt={`Preview ${index}`} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
                                    <button onClick={() => handleRemoveImage(img._id || img.public_id)} style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(220, 38, 38, 0.9)", border: "none", color: "white", padding: "4px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {images.length < 5 && (
                                <label className="image-upload-card" style={{ width: "100%", height: "auto", minHeight: "120px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer", gap: "8px", background: "var(--color-bg)" }}>
                                    <Upload size={24} style={{ color: "var(--color-text-secondary)" }} />
                                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 500 }}>Upload Image</span>
                                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cropper Modal */}
            {showCropper && (
                <CropperModal
                    imageSrcs={imageFilesToCrop.map((file) => URL.createObjectURL(file))}
                    onClose={() => {
                        setShowCropper(false);
                        setImageFilesToCrop([]);
                    }}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    );
}