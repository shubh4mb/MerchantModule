import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronDown, Plus, X, Loader2, Search, Upload, Save, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCategories, createProductFull, getAttributes, searchBaseProducts, getBaseProductById } from '../../api/products';
import { addMyWarehouseProductFull } from '../../api/warehouseOrder';
import axiosInstance from '../../utils/axiosInstance';
import { ProductTitleInput } from '../../components/Products/ProductTitleInput';
import CustomColorDropdown from '../../components/utils/CustomColorDropdown';
import { POPULAR_COLORS } from '../../utils/colors';
import { calcDiscount, calcPriceFromDiscount } from '../../utils/price';
import CropperModal from '../../components/utils/CropperModal';
import '../../components/Products/AddNewProduct.css';

// ---------------------- Types ----------------------
interface Category {
  _id: string;
  name: string;
  level: 0 | 1;
  parentId?: string;
  isActive: boolean;
}

export interface DynamicAttribute {
  _id: string;
  name: string;
  slug: string;
  inputType: 'select' | 'multiselect' | 'text' | 'number' | 'boolean';
  isRequired: boolean;
  values?: { label: string; value: string }[];
}

interface Size {
  size: string;
  stock: number;
}

interface Color {
  name: string;
  hex: string;
}

interface Image {
  public_id: string;
  url: string;
  blob?: File;
}

interface CatalogProduct {
  _id: string;
  name: string;
  styleName: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  brandId: string;
  brandName: string;
  gender: string[];
  attributes: { attributeId: string; value: any }[];
  tags: string[];
  isTriable: boolean;
}

const AddNewProduct = () => {
  const { merchant } = useAuth();
  const merchantId = merchant?.id ?? "";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const copyFrom = searchParams.get('copyFrom');

  // Warehouse Operator State
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [merchants, setMerchants] = useState<any[]>([]);

  // Unified Form State
  const [name, setName] = useState('');
  const [styleName, setStyleName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [gender, setGender] = useState<string[]>(['MEN', 'WOMEN']);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<{ attributeId: string; value: any }[]>([]);
  const [isTriable, setIsTriable] = useState(true);

  // Variation properties
  const [productSku, setProductSku] = useState('');
  const [color, setColor] = useState<Color>({ name: "", hex: "" });
  const [mrp, setMrp] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [sizes, setSizes] = useState<Size[]>([
    { size: "S", stock: 0 },
    { size: "M", stock: 0 },
    { size: "L", stock: 0 },
  ]);
  const [images, setImages] = useState<Image[]>([]);

  // Autocomplete Search Catalog State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([]);
  const [searchingCatalog, setSearchingCatalog] = useState(false);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<CatalogProduct | null>(null);

  // Helpers / Metadata
  const [categories, setCategories] = useState<Category[]>([]);
  const [dynamicAttributes, setDynamicAttributes] = useState<DynamicAttribute[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Loading & Saving progress Overlay
  const [loading, setLoading] = useState(false);
  const [saveStepMessage, setSaveStepMessage] = useState('');
  
  // Cropper Modal States
  const [imageFilesToCrop, setImageFilesToCrop] = useState<File[]>([]);
  const [showCropper, setShowCropper] = useState(false);

  // Load Initial Metadata
  useEffect(() => {
    if (!merchantId) return;
    const loadCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res.categories as Category[]);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    loadCategories();
  }, [merchantId]);

  // Load Merchants if Warehouse Operator
  useEffect(() => {
    if (merchant?.accountType === 'warehouse') {
      axiosInstance.get('/merchant/assigned-merchants').then(res => {
        console.log("assigned-merchants response:", res.data);
        setMerchants(res.data?.merchants || res.data?.data?.merchants || []);
      }).catch(err => console.error("assigned-merchants error:", err));
    }
  }, [merchant]);

  // Load Subcategory Specifications
  useEffect(() => {
    const fetchAttributes = async () => {
      if (!subCategoryId) {
        setDynamicAttributes([]);
        return;
      }
      try {
        const res = await getAttributes(subCategoryId);
        setDynamicAttributes(res.attributes || []);
      } catch (err) {
        console.error("Failed to fetch attributes:", err);
      }
    };
    fetchAttributes();
  }, [subCategoryId]);

  // Load product if copyFrom param is present
  useEffect(() => {
    if (!copyFrom) return;
    const fetchCopyProduct = async () => {
      setLoading(true);
      setSaveStepMessage("Pre-filling details from existing product catalog...");
      try {
        const data = await getBaseProductById(copyFrom);
        if (data) {
          setName(data.name || '');
          setStyleName(data.styleName || '');
          setCategoryId(data.categoryId?._id || data.categoryId || '');
          setSubCategoryId(data.subCategoryId?._id || data.subCategoryId || '');
          setGender(data.gender || ['MEN', 'WOMEN']);
          setDescription(data.description || '');
          setTags(data.tags || []);
          setAttributes(data.attributes || []);
          setIsTriable(data.isTriable !== undefined ? data.isTriable : true);
          setSelectedCatalogProduct(data);
          setColor(data.color || { name: "", hex: "" });
          setSizes(data.sizes ? data.sizes.map((s: any) => ({ size: s.size, stock: s.stock })) : [{ size: "S", stock: 0 }]);
          setMrp(data.mrp || 0);
          setPrice(data.price || 0);
          setDiscount(data.discount || 0);
        }
      } catch (err) {
        console.error("Failed to fetch product for copyFrom:", err);
      } finally {
        setLoading(false);
        setSaveStepMessage("");
      }
    };
    fetchCopyProduct();
  }, [copyFrom]);

  // Search catalog as search query updates
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchingCatalog(true);
      try {
        const res = await searchBaseProducts(searchQuery);
        setSearchResults(res.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingCatalog(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Handle Dynamic Category Attribute selections
  const handleAttributeChange = (attributeId: string, value: any, isMultiselect: boolean = false) => {
    setAttributes(prev => {
      let updatedAttributes = [...prev];
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
      return updatedAttributes;
    });
  };

  // Add tag locally
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setTagInput("");
    }
  };

  // Remove tag locally
  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  // Autocomplete Select Product from Catalog
  const handleSelectCatalogProduct = (product: CatalogProduct) => {
    setSelectedCatalogProduct(product);
    setName(product.name);
    setStyleName(product.styleName);
    setCategoryId(product.categoryId);
    setSubCategoryId(product.subCategoryId);
    setGender(product.gender);
    setDescription(product.description);
    setAttributes(product.attributes || []);
    setTags(product.tags || []);
    setIsTriable(product.isTriable);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Clear linked catalog select
  const handleClearCatalogLink = () => {
    setSelectedCatalogProduct(null);
    setName('');
    setStyleName('');
    setCategoryId('');
    setSubCategoryId('');
    setGender(['MEN', 'WOMEN']);
    setDescription('');
    setAttributes([]);
    setTags([]);
    setIsTriable(true);
  };

  // Pricing calculations
  const handlePriceFieldChange = (field: 'mrp' | 'price' | 'discount', val: number) => {
    let nextMrp = mrp;
    let nextPrice = price;
    let nextDiscount = discount;

    if (field === 'mrp') nextMrp = val;
    if (field === 'price') nextPrice = val;
    if (field === 'discount') nextDiscount = val;

    if (field === 'mrp' || field === 'price') {
      if (nextMrp > 0 && nextPrice > 0 && nextPrice <= nextMrp) {
        nextDiscount = calcDiscount(nextMrp, nextPrice);
      }
    }
    if (field === 'discount') {
      if (nextMrp > 0) {
        nextPrice = calcPriceFromDiscount(nextMrp, nextDiscount);
      }
    }

    setMrp(nextMrp);
    setPrice(nextPrice);
    setDiscount(nextDiscount);
  };


  // Size adjustments
  const addSize = () => {
    setSizes(prev => [...prev, { size: "S", stock: 0 }]);
  };
  const removeSize = (index: number) => {
    setSizes(prev => prev.filter((_, idx) => idx !== index));
  };
  const updateSize = (index: number, field: keyof Size, val: string | number) => {
    setSizes(prev => prev.map((s, idx) => (idx === index ? { ...s, [field]: val } : s)));
  };

  // Image Upload & Crop
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    if (images.length + newFiles.length > 4) {
      alert("Max 4 images allowed per product.");
      setImageFilesToCrop(newFiles.slice(0, 4 - images.length));
    } else {
      setImageFilesToCrop(newFiles);
    }
    setShowCropper(true);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!croppedBlob) return;
    const public_id = `tmp_${Date.now()}`;
    const url = URL.createObjectURL(croppedBlob);
    const croppedFile = new File([croppedBlob], `cropped_${Date.now()}.jpg`, { type: "image/jpeg" });
    setImages(prev => [...prev, { public_id, url, blob: croppedFile }]);
  };

  // Global Submit form controller
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || !subCategoryId) {
      return alert("Please enter all required basic details.");
    }
    if (!productSku) {
      return alert("Please enter a custom product SKU prefix.");
    }
    if (!color.name || !color.hex) {
      return alert("Please select a product color variation.");
    }
    if (images.length === 0) {
      return alert("Please upload at least one image.");
    }

    setLoading(true);
    setSaveStepMessage("Creating product style group and SKU variations...");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("styleName", styleName);
      formData.append("categoryId", categoryId);
      formData.append("subCategoryId", subCategoryId);
      formData.append("description", description);
      formData.append("isTriable", String(isTriable));
      formData.append("gender", JSON.stringify(gender));
      formData.append("tags", JSON.stringify(tags));
      formData.append("attributes", JSON.stringify(attributes));

      if (merchant?.accountType === 'warehouse') {
        if (!selectedMerchantId) throw new Error("Please select a Source Merchant for this warehouse product.");
        formData.append("merchantId", selectedMerchantId);
        if (commissionRate) formData.append("commissionRate", commissionRate);
      } else {
        formData.append("merchantId", merchantId);
      }

      // Link catalog product reference if available
      const parentId = selectedCatalogProduct?._id || copyFrom;
      if (parentId) {
        formData.append("isLinkedToCatalog", "true");
        formData.append("selectedBaseProductId", parentId);
      }

      // Map single variant details to payload
      const imageFields: string[] = [];
      images.forEach((img, j) => {
        const fieldName = `var_0_img_${j}`;
        if (img.blob) {
          imageFields.push(fieldName);
          formData.append(fieldName, img.blob);
        }
      });

      const variantsPayload = [{
        color,
        mrp,
        price,
        discount,
        sizes,
        productSku,
        imageFields
      }];

      formData.append("variants", JSON.stringify(variantsPayload));

      setSaveStepMessage("Uploading product images and saving...");
      if (merchant?.accountType === 'warehouse') {
        await addMyWarehouseProductFull(formData);
      } else {
        await createProductFull(formData);
      }

      alert("Product created successfully!");
      navigate("/merchant/inventory");
    } catch (err: any) {
      console.error(err);
      alert("Failed to create product: " + (err.message || err));
    } finally {
      setLoading(false);
      setSaveStepMessage("");
    }
  };

  const renderCategoryOptions = (level: 0 | 1) =>
    categories
      .filter(cat =>
        cat.level === level &&
        cat.isActive &&
        (level === 0 || (level === 1 && cat.parentId === categoryId))
      )
      .map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>);

  // Compute clean merchant prefix
  const cleanShop = merchant?.shopName ? merchant.shopName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() : "SHOP";
  const last4 = merchant?.id ? merchant.id.slice(-4).toUpperCase() : "XXXX";
  const merchantPrefix = `${cleanShop}-${last4}`;

  return (
    <div className="products-page">
      {loading && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "16px", color: "white" }}>
          <Loader2 className="animate-spin" size={48} />
          <p style={{ fontWeight: 600, fontSize: "16px" }}>{saveStepMessage}</p>
        </div>
      )}

      <div className="products-container" style={{ maxWidth: "1000px" }}>
        {/* Header section */}
        <div className="products-card" style={{ marginBottom: "var(--space-6)" }}>
          <div className="products-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1>Add Product</h1>
              <p>Create a product catalog item for: <span>{merchant?.shopName || 'Your Store'}</span></p>
            </div>
            <button onClick={() => navigate(-1)} className="secondary-btn" style={{ padding: "8px 16px" }}>
              <ArrowLeft size={18} /> Back
            </button>
          </div>
        </div>

        {/* Autocomplete Catalog Link Bar (Only show if not doing copyFrom) */}
        {!copyFrom && (
          <div className="products-card" style={{ marginBottom: "var(--space-6)", position: "relative" }}>
            <div className="products-header" style={{ marginBottom: "var(--space-4)" }}>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Link to Global Product Catalog</h2>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>Select an existing product style group in the database to pre-fill brand, category, name, and description fields.</p>
            </div>

            {!selectedCatalogProduct ? (
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg)", padding: "4px 12px" }}>
                  <Search size={18} style={{ color: "var(--color-text-tertiary)", marginRight: "8px" }} />
                  <input
                    type="text"
                    placeholder="Type product name, code, or brand prefix to search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ border: "none", outline: "none", flex: 1, padding: "10px 4px", fontSize: "14px" }}
                  />
                  {searchingCatalog && <Loader2 className="animate-spin" size={16} />}
                </div>

                {searchResults.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", zIndex: 100, marginTop: "8px", overflow: "hidden" }}>
                    {searchResults.map(p => (
                      <div
                        key={p._id}
                        onClick={() => handleSelectCatalogProduct(p)}
                        style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        className="hover:bg-slate-50"
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--color-text)" }}>{p.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{p.brandName} • {p.categoryName} • {p.styleName || "No Style"}</div>
                        </div>
                        <Plus size={18} style={{ color: "var(--color-success)" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0fdf4", border: "1.5px solid #bbf7d0", padding: "14px 20px", borderRadius: "var(--radius-md)" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#166534" }}>Pre-filled from Global Catalog: {selectedCatalogProduct.name}</div>
                  <div style={{ fontSize: "12px", color: "#15803d" }}>Basic details are pre-filled below. You can customize them or leave them as is.</div>
                </div>
                <button onClick={handleClearCatalogLink} className="secondary-btn" style={{ border: "1px solid #bbf7d0", color: "#166534", padding: "6px 12px", fontSize: "12px", background: "white" }}>
                  <X size={14} style={{ marginRight: "4px" }} /> Clear prefill
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Single Flat Card wrapping all inputs */}
          <div className="products-card" style={{ marginBottom: "var(--space-6)" }}>
            <div className="products-header" style={{ marginBottom: "var(--space-6)" }}>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Product Details</h2>
              <p style={{ fontSize: "12px", color: "#6b7280" }}>Fill out all details below to create your product listing.</p>
            </div>
            
            <div className="products-form">
              {/* Product Title */}
              <div className="form-group">
                <ProductTitleInput 
                  value={name}
                  onChange={setName}
                />
              </div>

              {/* SKU & Color Selection (Placed side-by-side) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Product SKU <span className="required">*</span></label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={{ padding: "10px 14px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRight: "none", borderRadius: "var(--radius-md) 0 0 var(--radius-md)", fontSize: "14px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                      {merchantPrefix}-
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. AM90-BLK-LEATHER"
                      value={productSku}
                      onChange={e => setProductSku(e.target.value)}
                      style={{ borderRadius: "0 var(--radius-md) var(--radius-md) 0", flex: 1 }}
                      required
                    />
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
                    Database SKU: {merchantPrefix}-{productSku || 'YOURSKU'}-S
                  </p>
                </div>
                <div className="form-group">
                  <label>Select Product Color <span className="required">*</span></label>
                  <CustomColorDropdown
                    options={POPULAR_COLORS}
                    value={{ name: color.name, hex: color.hex }}
                    onChange={setColor}
                  />
                </div>
              </div>

              {/* Style Name & Gender Focus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label>Style Name <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
                  <input type="text" value={styleName} onChange={e => setStyleName(e.target.value)} placeholder="e.g. Oxford Classic" />
                </div>
                <div className="form-group">
                  <label>Gender Focus</label>
                  <div className="flex gap-4" style={{ marginTop: "10px" }}>
                    {['MEN', 'WOMEN', 'BOYS', 'GIRLS'].map(g => (
                      <label key={g} className="checkbox-group">
                        <input
                          type="checkbox"
                          checked={gender.includes(g)}
                          onChange={e => {
                            const updated = e.target.checked ? [...gender, g] : gender.filter(x => x !== g);
                            setGender(updated);
                          }}
                        />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Categories */}
              <div className="form-group">
                <label>Product Categories <span className="required">*</span></label>
                <div className="categories-row">
                  <div className="select-wrapper">
                    <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId(''); }} required>
                      <option value="">Main Category</option>
                      {renderCategoryOptions(0)}
                    </select>
                    <ChevronDown className="select-icon" />
                  </div>
                  <div className="select-wrapper">
                    <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} disabled={!categoryId} required>
                      <option value="">Sub Category</option>
                      {renderCategoryOptions(1)}
                    </select>
                    <ChevronDown className="select-icon" />
                  </div>
                </div>
              </div>

              {/* Dynamic Category Attributes */}
              {dynamicAttributes.length > 0 && (
                <div style={{ background: "var(--color-bg)", padding: "var(--space-5)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "var(--space-6)" }}>
                  <h4 style={{ fontWeight: 600, marginBottom: "var(--space-4)" }}>Category Attributes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dynamicAttributes.map(attr => {
                      const selectedVal = attributes.find(a => a.attributeId === attr._id)?.value ?? '';
                      return (
                        <div key={attr._id} className="form-group">
                          <label>{attr.name} {attr.isRequired && <span className="required">*</span>}</label>
                          {attr.inputType === 'select' && (
                            <div className="select-wrapper">
                              <select value={selectedVal as string} onChange={e => handleAttributeChange(attr._id, e.target.value)} required={attr.isRequired}>
                                <option value="">Select {attr.name}</option>
                                {attr.values?.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                              </select>
                              <ChevronDown className="select-icon" />
                            </div>
                          )}
                          {(attr.inputType === 'text' || attr.inputType === 'number') && (
                            <input type={attr.inputType} value={selectedVal} onChange={e => handleAttributeChange(attr._id, attr.inputType === 'number' ? Number(e.target.value) : e.target.value)} required={attr.isRequired} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Write high-quality fabric details, specifications, etc." />
              </div>

              {/* Pricing (MRP, Selling Price, Discount) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label>MRP <span className="required">*</span></label>
                  <input type="number" value={mrp || ''} onChange={e => handlePriceFieldChange('mrp', Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label>Selling Price <span className="required">*</span></label>
                  <input type="number" value={price || ''} onChange={e => handlePriceFieldChange('price', Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label>Discount (%)</label>
                  <input type="number" min="0" max="100" value={discount} onChange={e => handlePriceFieldChange('discount', Number(e.target.value))} />
                </div>
              </div>

              {/* Sizes & Stock Levels */}
              <div style={{ background: "var(--color-surface)", padding: "20px", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "var(--space-6)" }}>
                <div className="flex-between" style={{ marginBottom: "12px" }}>
                  <span style={{ fontWeight: 600 }}>Sizes & Stock levels <span className="required">*</span></span>
                  <button type="button" onClick={addSize} className="secondary-btn" style={{ padding: "6px 12px", fontSize: "12px" }}><Plus size={14} style={{ marginRight: "4px" }} /> Add Size Option</button>
                </div>
                {sizes.map((sz, szIdx) => (
                  <div key={szIdx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
                    <div className="select-wrapper" style={{ margin: 0 }}>
                      <select value={sz.size} onChange={(e) => updateSize(szIdx, "size", e.target.value)} required>
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free'].map((optionSize) => (
                          <option key={optionSize} value={optionSize}>{optionSize}</option>
                        ))}
                      </select>
                      <ChevronDown className="select-icon" />
                    </div>
                    <input type="number" min={0} value={sz.stock} onChange={e => updateSize(szIdx, "stock", Number(e.target.value))} placeholder="Stock" required />
                    <X size={18} onClick={() => removeSize(szIdx)} style={{ cursor: "pointer", color: "var(--color-danger)" }} />
                  </div>
                ))}
              </div>

              {/* Product Images */}
              <div style={{ marginBottom: "var(--space-6)" }}>
                <label style={{ display: "block", marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}>Product Images (Max 4, first is main) <span className="required">*</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {images.map((img, imgIdx) => (
                    <div key={imgIdx} style={{ position: "relative", width: "110px", height: "110px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid var(--color-border)" }}>
                      <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {imgIdx === 0 && <div style={{ position: "absolute", bottom: 0, width: "100%", background: "rgba(0,0,0,0.6)", color: "white", fontSize: "10px", textAlign: "center", padding: "2px" }}>MAIN</div>}
                      <button type="button" onClick={() => removeImage(imgIdx)} style={{ position: "absolute", top: "4px", right: "4px", background: "var(--color-danger)", color: "white", borderRadius: "4px", padding: "2px", border: "none" }}><X size={12} /></button>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <label style={{ width: "110px", height: "110px", border: "2px dashed var(--color-border)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--color-bg)" }}>
                      <Upload size={24} style={{ color: "var(--color-text-tertiary)" }} />
                      <input type="file" hidden accept="image/*" multiple onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              {/* Search Tags */}
              <div className="form-group">
                <label>Search Keywords / Tags</label>
                <div className="flex gap-2 !mb-3 flex-wrap">
                  {tags.map(t => (
                    <span key={t} className="tag-item" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {t} <X size={12} onClick={() => removeTag(t)} style={{ cursor: "pointer" }} />
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add search keywords..." style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                  <button type="button" onClick={addTag} className="secondary-btn">Add</button>
                </div>
              </div>

              {/* Warehouse Settings */}
              {merchant?.accountType === 'warehouse' && (
                <div style={{ background: "rgba(56, 189, 248, 0.05)", padding: "20px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.2)", marginTop: "20px" }}>
                  <h3 style={{ marginBottom: "16px", fontSize: "16px", color: "var(--color-primary)" }}>Warehouse Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label>Source Merchant (Consignment Owner) <span className="required">*</span></label>
                      <div className="select-wrapper">
                        <select required value={selectedMerchantId} onChange={(e) => setSelectedMerchantId(e.target.value)}>
                          <option value="">-- Select Merchant --</option>
                          {merchants.map(m => (
                            <option key={m._id} value={m._id}>
                              {m.shopName} {m.warehouseStatus === 'approved' ? '✓ (Approved)' : m.warehouseStatus === 'pending' ? '⏳ (Pending)' : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="select-icon" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Warehouse Commission (%)</label>
                      <input type="number" min="0" max="100" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} placeholder="Leave empty for default" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions bar */}
          <div className="products-card" style={{ padding: "var(--space-6)", display: "flex", justifyContent: "flex-end", gap: "var(--space-4)", background: "var(--color-surface)", marginBottom: "100px" }}>
            <button type="button" onClick={() => navigate(-1)} disabled={loading} className="secondary-btn" style={{ padding: "12px 24px" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-btn" style={{ padding: "12px 24px", display: "flex", gap: "8px", alignItems: "center" }}>
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} Create Product
            </button>
          </div>
        </form>
      </div>

      {showCropper && (
        <CropperModal
          imageSrcs={imageFilesToCrop.map((file) => URL.createObjectURL(file))}
          onClose={() => { setShowCropper(false); setImageFilesToCrop([]); }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default AddNewProduct;