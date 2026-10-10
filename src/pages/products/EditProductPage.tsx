import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, X, Save, ArrowLeft, ChevronDown, Loader2, Plus, ChevronLeft, ChevronRight, Trash2, Download } from "lucide-react";
import { getBaseProductById, editProduct, deleteProduct, getAttributes, uploadImage, deleteImage, getCategories, getAllBrands } from "../../api/products";
import { downloadImageFile, downloadMultipleImages } from "../../utils/imageDownloader";
import { updateMyWarehouseProduct } from "../../api/warehouseOrder";
import { calcDiscount, calcPriceFromDiscount } from "../../utils/price";
import { POPULAR_COLORS } from "../../utils/colors";
import CropperModal from "../../components/utils/CropperModal";
import { ProductTitleInput } from "../../components/Products/ProductTitleInput";
import CustomColorDropdown from "../../components/utils/CustomColorDropdown";
import MatchingProductsModal from "../../components/Products/MatchingProductsModal";
import { useAuth } from "../../context/AuthContext";
import '../../components/Products/AddNewProduct.css';

/* ----------- Types ------------ */
interface Color {
    name: string;
    hex: string;
}
interface Size {
    size: string;
    stock: number;
    _id?: string;
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
    additionalCategoryIds?: any[];
    category: string;
    subCategory: string;
    gender: string[];
    description: string;
    styleName: string;
    soldBy?: string;
    attributes: { attributeId: string; value: any }[];
    tags: string[];
    isTriable: boolean;
    isActive: boolean;
    collectionIds?: string[];
    color?: Color;
    size?: string;
    sizes?: Size[];
    stock: number;
    mrp: number;
    price: number;
    discount: number;
    images?: Image[];
    productCode?: string;
    styleGroupId?: string;
    matchingProducts?: string[];
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

    // Category and Brand States
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("");
    const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
    const [addSecMainCatId, setAddSecMainCatId] = useState<string>("");
    const [addSecSubCatId, setAddSecSubCatId] = useState<string>("");
    const [brands, setBrands] = useState<any[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string>("");
    const [soldBy, setSoldBy] = useState<string>("");

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

    // Matching Products State
    const [showMatchingModal, setShowMatchingModal] = useState(false);
    const [matchingProducts, setMatchingProducts] = useState<string[]>([]);

    /* -------- LOAD METADATA & PRODUCT -------- */
    useEffect(() => {
        getCategories()
            .then(res => setCategories(res.categories || res || []))
            .catch(err => console.error("Failed to load categories:", err));

        getAllBrands()
            .then(res => setBrands(res.brands || res || []))
            .catch(err => console.error("Failed to load brands:", err));
    }, []);

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
                const normalizedAttrs = (data.attributes || []).map((a: any) => ({
                    attributeId: typeof a.attributeId === 'object' ? (a.attributeId?._id || a.attributeId?.id) : String(a.attributeId || ''),
                    value: a.value
                }));
                setAttributes(normalizedAttrs);
                setIsTriable(data.isTriable ?? true);
                setIsActive(data.isActive ?? true);

                // Prefill Category & Brand
                const catId = (data.categoryId as any)?._id || data.categoryId || "";
                setSelectedCategoryId(typeof catId === 'object' ? (catId._id || '') : String(catId));

                const subCatId = (data.subCategoryId as any)?._id || data.subCategoryId || "";
                setSelectedSubCategoryId(typeof subCatId === 'object' ? (subCatId._id || '') : String(subCatId));

                const rawAddCats = data.additionalCategoryIds || (data as any).additionalCategories || [];
                const normalizedAddCats = Array.isArray(rawAddCats)
                    ? rawAddCats.map((c: any) => typeof c === 'object' ? (c._id || c.id) : String(c)).filter(Boolean)
                    : [];
                setAdditionalCategoryIds(normalizedAddCats);

                const bId = (data.brandId as any)?._id || data.brandId || "";
                setSelectedBrandId(typeof bId === 'object' ? (bId._id || '') : String(bId));
                setSoldBy(data.soldBy || data.brand || "");

                // Prefill flat SKU attributes
                setColor(data.color || { name: "", hex: "" });
                setSizes(data.sizes || []);
                setMrp(data.mrp ?? 0);
                setPrice(data.price ?? 0);
                setDiscount(data.discount ?? 0);
                setImages(data.images || []);
                setMatchingProducts(data.matchingProducts || []);
            } catch (error) {
                console.error(error);
                alert("Failed to load product.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // Robust category sync: Ensures selectedCategoryId and selectedSubCategoryId always match valid category IDs
    useEffect(() => {
        if (!product || !categories || categories.length === 0) return;

        const normStr = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        // 1. Resolve Primary Category ID if not matching an active category _id
        let resolvedParentId = selectedCategoryId;
        const parentMatch = categories.find(c => String(c._id) === String(resolvedParentId));
        if (!parentMatch) {
            const rawCatId = String((product.categoryId as any)?._id || product.categoryId || '');
            const rawCatName = product.category || '';
            const matchedParent = categories.find(c => 
                (c.level === 0 || !c.parentId) && (
                    (rawCatId && String(c._id) === rawCatId) ||
                    (rawCatName && normStr(c.name) === normStr(rawCatName))
                )
            );
            if (matchedParent) {
                resolvedParentId = matchedParent._id;
                setSelectedCategoryId(matchedParent._id);
            }
        }

        // 2. Resolve Sub Category ID if not matching an active subcategory _id
        const subMatch = categories.find(c => String(c._id) === String(selectedSubCategoryId));
        if (!subMatch) {
            const rawSubId = String((product.subCategoryId as any)?._id || product.subCategoryId || '');
            const rawSubName = product.subCategory || '';
            const matchedSub = categories.find(c => {
                const parentIdStr = String(c.parentId?._id || c.parentId || '');
                const matchesParent = resolvedParentId ? (parentIdStr === String(resolvedParentId)) : true;
                return matchesParent && (
                    (rawSubId && String(c._id) === rawSubId) ||
                    (rawSubName && normStr(c.name) === normStr(rawSubName))
                );
            });
            if (matchedSub) {
                setSelectedSubCategoryId(matchedSub._id);
                if (!resolvedParentId && matchedSub.parentId) {
                    const pId = String(matchedSub.parentId?._id || matchedSub.parentId);
                    setSelectedCategoryId(pId);
                }
            }
        }
    }, [categories, product, selectedCategoryId, selectedSubCategoryId]);

    useEffect(() => {
        const targetCatId = selectedSubCategoryId || selectedCategoryId;
        if (!targetCatId) {
            setDynamicAttributes([]);
            return;
        }
        const fetchAttributes = async () => {
            try {
                const res = await getAttributes(targetCatId);
                setDynamicAttributes(res.attributes || []);
            } catch (err) {
                console.error("Failed to fetch attributes:", err);
            }
        };
        fetchAttributes();
    }, [selectedCategoryId, selectedSubCategoryId]);

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
            if (value === '' || value === undefined || value === null) {
                if (existingIndex >= 0) {
                    updatedAttributes.splice(existingIndex, 1);
                }
            } else {
                if (existingIndex >= 0) {
                    updatedAttributes[existingIndex] = { ...updatedAttributes[existingIndex], value };
                } else {
                    updatedAttributes.push({ attributeId, value });
                }
            }
        }
        setAttributes(updatedAttributes);
    };

    /* -------- GLOBAL SAVE -------- */
    const handleGlobalSave = async () => {
        if (!price || Number(price) <= 0) {
            alert("Please enter a valid Selling Price.");
            return;
        }

        if (!selectedCategoryId) {
            alert("Please select a Primary Category.");
            return;
        }

        if (!selectedSubCategoryId) {
            alert("Please select a Sub Category. Subcategory is mandatory.");
            return;
        }

        if (!gender || gender.length === 0) {
            alert("Please select at least one Gender Focus (e.g. MEN, WOMEN, KIDS).");
            return;
        }

        const finalName = name.trim() || styleName.trim() || 'New Product';
        const finalPrice = Number(price);
        const finalMrp = (mrp && Number(mrp) > 0) ? Number(mrp) : finalPrice;
        const finalDiscount = (finalMrp > 0 && finalPrice <= finalMrp) ? calcDiscount(finalMrp, finalPrice) : 0;

        setSaving(true);
        setSaveStepMessage("Saving product updates...");

        try {
            const cleanAttributes = attributes.filter(a => {
                if (a.value === undefined || a.value === null || a.value === '') return false;
                if (Array.isArray(a.value) && a.value.length === 0) return false;
                return true;
            }).map(a => ({
                attributeId: typeof a.attributeId === 'object' ? String((a.attributeId as any)?._id || (a.attributeId as any)?.id || '') : String(a.attributeId || ''),
                value: a.value
            })).filter(a => a.attributeId);

            const payload = {
                name: finalName,
                styleName,
                description,
                categoryId: selectedCategoryId || null,
                subCategoryId: selectedSubCategoryId || null,
                additionalCategoryIds,
                brandId: selectedBrandId || null,
                soldBy: soldBy.trim() || undefined,
                gender,
                tags,
                attributes: cleanAttributes,
                isTriable,
                isActive,
                color,
                mrp: finalMrp,
                price: finalPrice,
                discount: finalDiscount,
                images: images.map(img => ({
                    url: img.url,
                    public_id: img.public_id || '',
                    ...(img._id ? { _id: img._id } : {})
                })),
                sizes: sizes.map(s => ({
                    size: s.size,
                    stock: Number(s.stock) || 0,
                    _id: s._id || undefined
                })),
                matchingProducts
            };

            if (merchant?.accountType === 'warehouse') {
                await updateMyWarehouseProduct(id!, payload);
                alert("Product updated successfully!");
                navigate("/merchant/warehouse-products");
            } else {
                await editProduct(id!, payload);
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

    const moveImage = (index: number, direction: 'left' | 'right') => {
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= images.length) return;
        setImages(prev => {
            const updated = [...prev];
            const [moved] = updated.splice(index, 1);
            updated.splice(targetIndex, 0, moved);
            return updated;
        });
    };

    const handleDeleteProduct = async () => {
        if (!id) return;
        const confirmDelete = window.confirm(`Are you sure you want to delete "${name || 'this product'}" and all its variations? This action cannot be undone.`);
        if (!confirmDelete) return;

        setSaving(true);
        setSaveStepMessage("Deleting product...");
        try {
            await deleteProduct(id);
            alert("Product deleted successfully");
            navigate("/merchant/inventory");
        } catch (err: any) {
            console.error("Delete product error:", err);
            alert("Failed to delete product: " + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
            setSaveStepMessage("");
        }
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

    const [downloadingImages, setDownloadingImages] = useState(false);

    const handleDownloadSingleImage = async (url: string, index: number) => {
        if (!url) return;
        setDownloadingImages(true);
        try {
            const base = product?.productCode || name || styleName || "product";
            const filename = `${base}-photo-${index + 1}.jpg`;
            await downloadImageFile(url, filename);
        } catch (err) {
            console.error("Failed to download image", err);
        } finally {
            setDownloadingImages(false);
        }
    };

    const handleDownloadAllImages = async () => {
        if (images.length === 0) return;
        setDownloadingImages(true);
        try {
            const base = product?.productCode || name || styleName || "product";
            await downloadMultipleImages(images, base);
        } catch (err) {
            console.error("Failed to download images", err);
        } finally {
            setDownloadingImages(false);
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
                            <button
                                type="button"
                                onClick={handleDeleteProduct}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "#FEF2F2",
                                    color: "#DC2626",
                                    border: "1px solid #FCA5A5",
                                    padding: "8px 16px",
                                    borderRadius: "var(--radius-md)",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "14px"
                                }}
                            >
                                <Trash2 size={16} /> Delete Product
                            </button>
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

                        {/* Product Categories */}
                        <div className="form-group">
                            <label>Primary Category * <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Determines main specs and commission)</span></label>
                            <div className="categories-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="select-wrapper">
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#4b5563', marginBottom: '4px', display: 'block' }}>
                                        Main Category <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <select 
                                        value={selectedCategoryId} 
                                        onChange={(e) => { 
                                            setSelectedCategoryId(e.target.value); 
                                            setSelectedSubCategoryId(''); 
                                        }}
                                        required
                                    >
                                        <option value="">-- Main Category --</option>
                                        {categories.filter(c => c.level === 0 || !c.parentId).map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="select-icon" />
                                </div>
                                <div className="select-wrapper">
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#4b5563', marginBottom: '4px', display: 'block' }}>
                                        Sub Category <span style={{ color: '#ef4444' }}>* (Required)</span>
                                    </label>
                                    <select 
                                        value={selectedSubCategoryId} 
                                        onChange={(e) => setSelectedSubCategoryId(e.target.value)} 
                                        disabled={!selectedCategoryId}
                                        required
                                    >
                                        <option value="">-- Sub Category --</option>
                                        {categories
                                            .filter(c => selectedCategoryId && (String(c.parentId?._id || c.parentId) === String(selectedCategoryId)))
                                            .map(c => (
                                                <option key={c._id} value={c._id}>{c.name}</option>
                                            ))
                                        }
                                    </select>
                                    <ChevronDown className="select-icon" />
                                </div>
                            </div>

                            {/* Additional / Secondary Categories */}
                            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <label style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                                        Also List In Categories <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>(e.g. Activewear / Track Pants)</span>
                                    </label>
                                    {additionalCategoryIds.length > 0 && (
                                        <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                            {additionalCategoryIds.length} secondary {additionalCategoryIds.length === 1 ? 'category' : 'categories'}
                                        </span>
                                    )}
                                </div>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 10px 0' }}>
                                    Show this product in secondary sections too without altering its main garment specs.
                                </p>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div className="select-wrapper" style={{ flex: '1 1 200px' }}>
                                        <select 
                                            value={addSecMainCatId} 
                                            onChange={e => { 
                                                setAddSecMainCatId(e.target.value); 
                                                setAddSecSubCatId(''); 
                                            }}
                                        >
                                            <option value="">-- Main Category --</option>
                                            {categories
                                                .filter(c => (c.level === 0 || !c.parentId) && c.isActive)
                                                .map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))
                                            }
                                        </select>
                                        <ChevronDown className="select-icon" />
                                    </div>

                                    <div className="select-wrapper" style={{ flex: '1 1 200px' }}>
                                        <select 
                                            value={addSecSubCatId} 
                                            onChange={e => setAddSecSubCatId(e.target.value)}
                                            disabled={!addSecMainCatId}
                                        >
                                            <option value="">-- Sub Category (Optional) --</option>
                                            {categories
                                                .filter(c => addSecMainCatId && (c.parentId === addSecMainCatId || c.parentId?._id === addSecMainCatId) && c.isActive)
                                                .map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))
                                            }
                                        </select>
                                        <ChevronDown className="select-icon" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const targetId = addSecSubCatId || addSecMainCatId;
                                            if (!targetId) return;
                                            if (targetId === selectedSubCategoryId || targetId === selectedCategoryId) {
                                                alert("This is already selected as the primary category.");
                                                return;
                                            }
                                            if (additionalCategoryIds.includes(targetId)) {
                                                alert("This category has already been added.");
                                                return;
                                            }
                                            setAdditionalCategoryIds(prev => [...prev, targetId]);
                                            setAddSecMainCatId('');
                                            setAddSecSubCatId('');
                                        }}
                                        disabled={!addSecMainCatId && !addSecSubCatId}
                                        className="secondary-btn"
                                        style={{
                                            height: '42px',
                                            padding: '0 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontWeight: 600,
                                            cursor: (!addSecMainCatId && !addSecSubCatId) ? 'not-allowed' : 'pointer',
                                            opacity: (!addSecMainCatId && !addSecSubCatId) ? 0.6 : 1
                                        }}
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                </div>

                                {/* Chips for Selected Additional Categories */}
                                {additionalCategoryIds.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                        {additionalCategoryIds.map(catId => {
                                            const cat = categories.find(c => String(c._id) === String(catId));
                                            const parentCat = cat?.parentId ? categories.find(c => String(c._id) === String(cat.parentId?._id || cat.parentId)) : null;
                                            const label = cat 
                                                ? (parentCat ? `${parentCat.name} > ${cat.name}` : cat.name) 
                                                : 'Category';
                                            return (
                                                <span 
                                                    key={catId} 
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        background: '#f1f5f9',
                                                        border: '1px solid #cbd5e1',
                                                        padding: '5px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        color: '#0f172a'
                                                    }}
                                                >
                                                    {label}
                                                    <button
                                                        type="button"
                                                        onClick={() => setAdditionalCategoryIds(prev => prev.filter(id => id !== catId))}
                                                        style={{
                                                            border: 'none',
                                                            background: 'transparent',
                                                            cursor: 'pointer',
                                                            padding: '2px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            color: '#64748b'
                                                        }}
                                                        title="Remove category"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Brand / Sold By */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label>Brand <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
                                <div className="select-wrapper">
                                    <select value={selectedBrandId} onChange={(e) => setSelectedBrandId(e.target.value)}>
                                        <option value="">-- Select Brand --</option>
                                        {brands.map(b => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="select-icon" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Sold By / Brand Name <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
                                <input 
                                    type="text" 
                                    value={soldBy} 
                                    onChange={(e) => setSoldBy(e.target.value)} 
                                    placeholder="e.g. My Boutique" 
                                />
                            </div>
                        </div>

                        {/* Status Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: "16px", padding: "14px 16px", background: "var(--color-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                            <label className="checkbox-group" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: "14px" }}>Product Active</span>
                                    <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>Visible to shoppers in discovery catalog</p>
                                </div>
                            </label>
                            <label className="checkbox-group" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                <input type="checkbox" checked={isTriable} onChange={(e) => setIsTriable(e.target.checked)} />
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: "14px" }}>Try & Buy Eligible</span>
                                    <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>Available for 30-min doorstep trial</p>
                                </div>
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Gender Focus <span className="required">*</span></label>
                            <div className="flex gap-4 flex-wrap">
                                {['MEN', 'WOMEN', 'KIDS', 'BOYS', 'GIRLS'].map(g => (
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
                                <h4 style={{ fontWeight: 600, marginBottom: "var(--space-4)" }}>
                                    Category Attributes <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 400 }}>(Optional)</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dynamicAttributes.map(attr => {
                                        const selectedVal = attributes.find(a => a.attributeId === attr._id)?.value ?? '';
                                        return (
                                            <div key={attr._id} className="form-group">
                                                <label>{attr.name} <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
                                                {attr.inputType === 'select' && (
                                                    <div className="select-wrapper">
                                                        <select value={selectedVal as string} onChange={(e) => handleAttributeChange(attr._id, e.target.value)}>
                                                            <option value="">Select {attr.name} (Optional)</option>
                                                            {attr.values?.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                                                        </select>
                                                        <ChevronDown className="select-icon" />
                                                    </div>
                                                )}
                                                {(attr.inputType === 'text' || attr.inputType === 'number') && (
                                                    <input
                                                        type={attr.inputType}
                                                        value={selectedVal}
                                                        placeholder={`Enter ${attr.name} (Optional)`}
                                                        onChange={(e) => handleAttributeChange(attr._id, attr.inputType === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                                                    />
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

                        <div className="form-group" style={{ marginTop: "16px", padding: "16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h4 style={{ fontWeight: 600, fontSize: "14px" }}>Matching Products</h4>
                                    <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                                        {matchingProducts.length} product(s) linked
                                    </p>
                                </div>
                                <button type="button" onClick={() => setShowMatchingModal(true)} className="secondary-btn" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Plus size={16} /> Set Matching Products
                                </button>
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
                                <label>Product Color <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
                                <CustomColorDropdown
                                    options={POPULAR_COLORS}
                                    value={{ name: color.name, hex: color.hex }}
                                    onChange={setColor}
                                />
                            </div>

                            {/* Pricing */}
                            <div className="form-group">
                                <label>MRP (Max Retail Price) <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
                                <input type="number" min={0} value={mrp} onChange={(e) => handleMRPChange(Math.max(0, Number(e.target.value)))} placeholder="Defaults to Selling Price" />
                            </div>

                            <div className="form-group">
                                <label>Discount Percentage (%)</label>
                                <input type="number" min={0} max={100} value={discount} onChange={(e) => handleDiscountChange(Math.min(100, Math.max(0, Number(e.target.value))))} />
                            </div>

                            <div className="form-group">
                                <label>Final Selling Price (₹) <span className="required">*</span></label>
                                <input type="number" min={0} value={price} onChange={(e) => handlePriceChange(Math.max(0, Number(e.target.value)))} required />
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
                    <div className="products-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>3. SKU Gallery</h2>
                        {images.length > 0 && (
                            <button
                                type="button"
                                onClick={handleDownloadAllImages}
                                disabled={downloadingImages}
                                className="secondary-btn"
                                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 14px", color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
                                title="Download all photos for this product"
                            >
                                <Download size={14} />
                                <span>Download All Photos ({images.length})</span>
                            </button>
                        )}
                    </div>
                    <div className="products-form">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {images.map((img, index) => (
                                <div key={img._id || index} className="image-preview-card" style={{ position: "relative", width: "100%", paddingBottom: "100%", borderRadius: "var(--radius-md)", border: "1.5px solid var(--color-border)", overflow: "hidden", background: "var(--color-bg)" }}>
                                    <img src={img.url} alt={`Preview ${index}`} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
                                    
                                    {/* Cover Badge */}
                                    {index === 0 ? (
                                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(16, 185, 129, 0.9)", color: "white", fontSize: "10px", fontWeight: 700, textAlign: "center", padding: "2px 0", letterSpacing: "0.5px" }}>
                                            MAIN COVER
                                        </div>
                                    ) : (
                                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "white", fontSize: "9px", textAlign: "center", padding: "1px 0" }}>
                                            #{index + 1}
                                        </div>
                                    )}

                                    {/* Reorder Buttons */}
                                    <div style={{ position: "absolute", top: "6px", left: "6px", display: "flex", gap: "3px" }}>
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                title="Move Left"
                                                onClick={() => moveImage(index, 'left')}
                                                style={{ background: "rgba(15, 23, 42, 0.8)", border: "none", color: "white", width: "22px", height: "22px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                        )}
                                        {index < images.length - 1 && (
                                            <button
                                                type="button"
                                                title="Move Right"
                                                onClick={() => moveImage(index, 'right')}
                                                style={{ background: "rgba(15, 23, 42, 0.8)", border: "none", color: "white", width: "22px", height: "22px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Download Image Button */}
                                    <button
                                        type="button"
                                        title="Download Image"
                                        onClick={() => handleDownloadSingleImage(img.url, index)}
                                        style={{ position: "absolute", top: "6px", right: "32px", background: "rgba(16, 185, 129, 0.9)", border: "none", color: "white", width: "22px", height: "22px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                                    >
                                        <Download size={13} />
                                    </button>

                                    {/* Delete Image Button */}
                                    <button
                                        type="button"
                                        title="Delete Image"
                                        onClick={() => handleRemoveImage(img._id || img.public_id)}
                                        style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(220, 38, 38, 0.9)", border: "none", color: "white", width: "22px", height: "22px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                                    >
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

            {/* Matching Products Modal */}
            {showMatchingModal && id && product?.styleGroupId && (
                <MatchingProductsModal
                    productId={id}
                    currentProductStyleGroupId={product.styleGroupId}
                    initialMatchingProducts={matchingProducts}
                    onClose={() => setShowMatchingModal(false)}
                    onSaveSuccess={(selectedIds) => setMatchingProducts(selectedIds)}
                />
            )}
        </div>
    );
}