import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronDown, ChevronLeft, ChevronRight, Plus, X, Loader2, Search, Upload, Save, ArrowLeft, Link as LinkIcon, Check, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCategories, createProductFull, getAttributes, searchBaseProducts, getBaseProductById, fetchProductsByMerchantId, analyzeProductWithAi } from '../../api/products';
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
  parentId?: any;
  isActive: boolean;
  description?: string;
  prompts?: {
    front?: string;
    back?: string;
    closeUp?: string;
  };
  promptFront?: string;
  promptBack?: string;
  promptCloseUp?: string;
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
  additionalCategoryIds?: string[];
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
  const [merchantProducts, setMerchantProducts] = useState<any[]>([]);
  const [loadingMerchantProducts, setLoadingMerchantProducts] = useState(false);
  const [selectedMerchantProduct, setSelectedMerchantProduct] = useState<any | null>(null);
  const [merchantProductSearch, setMerchantProductSearch] = useState('');
  const [linkedMerchantProductId, setLinkedMerchantProductId] = useState<string>('');

  // Unified Form State
  const [name, setName] = useState('');
  const [styleName, setStyleName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [addSecMainCatId, setAddSecMainCatId] = useState<string>('');
  const [addSecSubCatId, setAddSecSubCatId] = useState<string>('');
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
  const [promptCopied, setPromptCopied] = useState<string | null>(null);

  // Helpers / Metadata
  const [categories, setCategories] = useState<Category[]>([]);
  const [dynamicAttributes, setDynamicAttributes] = useState<DynamicAttribute[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Gemini AI Auto-Fill States
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiAnalysisStep, setAiAnalysisStep] = useState('');
  const [aiAutoFilled, setAiAutoFilled] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    categoryName?: string;
    subCategoryName?: string;
    colorName?: string;
    colorHex?: string;
  } | null>(null);

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

  // Fetch merchant products when source merchant changes (for warehouse operators)
  useEffect(() => {
    if (merchant?.accountType === 'warehouse' && selectedMerchantId) {
      setLoadingMerchantProducts(true);
      fetchProductsByMerchantId(selectedMerchantId)
        .then((res: any) => {
          const list = Array.isArray(res) ? res : res?.products || [];
          setMerchantProducts(list);
        })
        .catch((err) => {
          console.error("Failed to load merchant products:", err);
          setMerchantProducts([]);
        })
        .finally(() => setLoadingMerchantProducts(false));
    } else {
      setMerchantProducts([]);
      setSelectedMerchantProduct(null);
      setLinkedMerchantProductId('');
    }
  }, [selectedMerchantId, merchant]);

  const handleSelectMerchantProduct = (prod: any) => {
    setSelectedMerchantProduct(prod);
    setLinkedMerchantProductId(prod.id || prod.styleGroupId || prod._id || '');
    setName(prod.name || '');
    setStyleName(prod.styleName || '');
    setDescription(prod.description || '');
    const catId = prod.categoryId?._id || prod.categoryId || '';
    const subCatId = prod.subCategoryId?._id || prod.subCategoryId || '';
    setCategoryId(catId);
    setSubCategoryId(subCatId);
    const addCatIds = Array.isArray(prod.additionalCategoryIds)
      ? prod.additionalCategoryIds.map((c: any) => typeof c === 'object' ? (c._id || c.id) : String(c)).filter(Boolean)
      : [];
    setAdditionalCategoryIds(addCatIds);
    setGender(Array.isArray(prod.gender) ? prod.gender : prod.gender ? [prod.gender] : ['MEN', 'WOMEN']);
    setTags(prod.tags || []);
    
    // Normalize attributes array
    const rawAttrs = Array.isArray(prod.attributes) ? prod.attributes : [];
    const cleanAttrs = rawAttrs.map((a: any) => {
      let rawId = a.attributeId || a.attribute;
      if (rawId && typeof rawId === 'object') {
        rawId = rawId._id || rawId.id;
      }
      return {
        attributeId: String(rawId || ''),
        value: a.value
      };
    }).filter((a: any) => a.attributeId);
    setAttributes(cleanAttrs);
    setIsTriable(prod.isTriable !== undefined ? prod.isTriable : true);

    setColor(prod.color || { name: 'Default', hex: '#cccccc' });
    setMrp(prod.mrp || 0);
    setPrice(prod.price || 0);
    setDiscount(prod.discount || 0);
    setProductSku(`WH-${prod.productCode || Math.random().toString(36).substring(2, 7).toUpperCase()}`);

    if (prod.sizes && Array.isArray(prod.sizes) && prod.sizes.length > 0) {
      setSizes(prod.sizes.map((s: any) => ({ size: s.size, stock: 0 })));
    }

    if (prod.images && Array.isArray(prod.images) && prod.images.length > 0) {
      setImages(prod.images.map((img: any) => ({
        public_id: img.public_id || '',
        url: typeof img === 'string' ? img : img.url || ''
      })));
    }

    // Immediately trigger fetching attributes for selected category
    fetchCategoryAttributes(subCatId, catId);
  };

  const handleClearMerchantProductLink = () => {
    setSelectedMerchantProduct(null);
    setLinkedMerchantProductId('');
    setAdditionalCategoryIds([]);
  };

  // Load Category / Subcategory Specifications
  const fetchCategoryAttributes = async (targetSub?: string, targetCat?: string) => {
    const subId = targetSub !== undefined ? targetSub : subCategoryId;
    const catId = targetCat !== undefined ? targetCat : categoryId;
    const primaryId = subId || catId;

    if (!primaryId) {
      setDynamicAttributes([]);
      return;
    }
    try {
      let res = await getAttributes(primaryId);
      let attrs = res?.attributes || res?.data?.attributes || [];
      // Fallback to parent category if subcategory has no attributes configured
      if ((!attrs || attrs.length === 0) && catId && catId !== primaryId) {
        const catRes = await getAttributes(catId);
        attrs = catRes?.attributes || catRes?.data?.attributes || [];
      }
      setDynamicAttributes(attrs || []);
    } catch (err) {
      console.error("Failed to fetch attributes:", err);
    }
  };

  useEffect(() => {
    fetchCategoryAttributes(subCategoryId, categoryId);
  }, [subCategoryId, categoryId]);

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
          const addCatIds = Array.isArray(data.additionalCategoryIds)
            ? data.additionalCategoryIds.map((c: any) => typeof c === 'object' ? (c._id || c.id) : String(c)).filter(Boolean)
            : [];
          setAdditionalCategoryIds(addCatIds);
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
      const existingIndex = updatedAttributes.findIndex(a => {
        const rawId = typeof a.attributeId === 'object' ? ((a.attributeId as any)?._id || (a.attributeId as any)?.id) : (a.attributeId || (a as any).attribute);
        return String(rawId) === String(attributeId);
      });
      if (isMultiselect) {
        if (existingIndex >= 0) {
          let currentValues = updatedAttributes[existingIndex].value as string[];
          if (!Array.isArray(currentValues)) currentValues = [currentValues].filter(Boolean);
          if (currentValues.includes(value)) currentValues = currentValues.filter(v => v !== value);
          else currentValues.push(value);
          if (currentValues.length === 0) updatedAttributes.splice(existingIndex, 1);
          else updatedAttributes[existingIndex] = { ...updatedAttributes[existingIndex], attributeId: String(attributeId), value: currentValues };
        } else {
          updatedAttributes.push({ attributeId: String(attributeId), value: [value] });
        }
      } else {
        if (value === '' || value === undefined || value === null) {
          if (existingIndex >= 0) {
            updatedAttributes.splice(existingIndex, 1);
          }
        } else {
          if (existingIndex >= 0) {
            updatedAttributes[existingIndex] = { ...updatedAttributes[existingIndex], attributeId: String(attributeId), value };
          } else {
            updatedAttributes.push({ attributeId: String(attributeId), value });
          }
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
    setAdditionalCategoryIds(product.additionalCategoryIds || []);
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
    setAdditionalCategoryIds([]);
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

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!croppedBlob) return;
    const public_id = `tmp_${Date.now()}`;
    const url = URL.createObjectURL(croppedBlob);
    const croppedFile = new File([croppedBlob], `cropped_${Date.now()}.jpg`, { type: "image/jpeg" });
    setImages(prev => [...prev, { public_id, url, blob: croppedFile }]);
  };

  // Gemini AI Auto-Fill Handler
  const handleAiAnalyzeFile = async (file: File | Blob) => {
    if (!file) return;
    setAnalyzingAi(true);
    setAiAnalysisStep('Scanning garment image with Gemini AI...');

    try {
      const stepTimer = setTimeout(() => {
        setAiAnalysisStep('Identifying silhouette, style & FlashFits categories...');
      }, 900);

      const metadata = await analyzeProductWithAi(file);
      clearTimeout(stepTimer);

      if (metadata.name) setName(metadata.name);
      if (metadata.styleName) setStyleName(metadata.styleName);
      if (metadata.description) setDescription(metadata.description);

      if (metadata.categoryId) {
        setCategoryId(metadata.categoryId);
      }
      if (metadata.subCategoryId) {
        setSubCategoryId(metadata.subCategoryId);
      }

      if (metadata.gender && Array.isArray(metadata.gender) && metadata.gender.length > 0) {
        setGender(metadata.gender);
      }

      if (metadata.color?.name) {
        setColor({
          name: metadata.color.name,
          hex: metadata.color.hex || '#111827',
        });
      }

      if (metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
        setTags(metadata.tags);
      }

      if (typeof metadata.isTriable === 'boolean') {
        setIsTriable(metadata.isTriable);
      }

      const fileObj = file instanceof File ? file : new File([file], `ai_product_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const public_id = `ai_${Date.now()}`;
      const url = URL.createObjectURL(fileObj);

      setImages(prev => {
        const alreadyAdded = prev.some(img => img.blob && img.blob.size === fileObj.size);
        if (!alreadyAdded && prev.length < 4) {
          return [{ public_id, url, blob: fileObj }, ...prev];
        }
        return prev;
      });

      setAiAutoFilled(true);
      setAiSummary({
        categoryName: metadata.category,
        subCategoryName: metadata.subCategory,
        colorName: metadata.color?.name,
        colorHex: metadata.color?.hex,
      });
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      alert(`AI Analysis failed: ${err.message || 'Could not analyze product image. Please try another photo.'}`);
    } finally {
      setAnalyzingAi(false);
      setAiAnalysisStep('');
    }
  };

  // Global Submit form controller
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!price || price <= 0) {
      return alert("Please enter a valid Selling Price.");
    }
    const validSizes = sizes.filter(s => s.size && !isNaN(Number(s.stock)));
    if (validSizes.length === 0) {
      return alert("Please enter at least one size with stock quantity.");
    }
    if (images.length === 0) {
      return alert("Please upload at least one product image.");
    }
    if (!gender || gender.length === 0) {
      return alert("Please select at least one Gender Focus (e.g. MEN, WOMEN, KIDS).");
    }

    const finalName = name.trim() || styleName.trim() || 'New Product';
    const finalSku = productSku.trim() || `SKU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const finalColor = (color.name && color.hex) ? color : { name: 'Standard', hex: '#111827' };
    const finalSellingPrice = Number(price);
    const finalMrp = (mrp && mrp > 0) ? mrp : finalSellingPrice;
    const finalDiscount = (finalMrp > 0 && finalSellingPrice <= finalMrp) ? calcDiscount(finalMrp, finalSellingPrice) : 0;

    setLoading(true);
    setSaveStepMessage("Creating product style group and SKU variations...");

    try {
      const formData = new FormData();
      formData.append("name", finalName);
      formData.append("styleName", styleName);
      if (categoryId) formData.append("categoryId", categoryId);
      if (subCategoryId) formData.append("subCategoryId", subCategoryId);
      if (additionalCategoryIds.length > 0) {
        formData.append("additionalCategoryIds", JSON.stringify(additionalCategoryIds));
      }
      formData.append("description", description);
      formData.append("isTriable", String(isTriable));
      formData.append("gender", JSON.stringify(gender));
      formData.append("tags", JSON.stringify(tags));
      const cleanAttributes = attributes.filter(a => {
        if (a.value === undefined || a.value === null || a.value === '') return false;
        if (Array.isArray(a.value) && a.value.length === 0) return false;
        return true;
      });
      formData.append("attributes", JSON.stringify(cleanAttributes));

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

      if (linkedMerchantProductId) {
        formData.append("linkedMerchantProductId", linkedMerchantProductId);
      }

      // Map single variant details to payload while preserving exact user reordered sequence
      const existingImages: { url: string; public_id: string }[] = [];
      const imageFields: string[] = [];
      const orderedImages: any[] = [];

      images.forEach((img, j) => {
        if (img.blob) {
          const fieldName = `var_0_img_${j}`;
          imageFields.push(fieldName);
          formData.append(fieldName, img.blob);
          orderedImages.push({ type: 'file', fieldname: fieldName });
        } else if (img.url) {
          const existingObj = { url: img.url, public_id: img.public_id || '' };
          existingImages.push(existingObj);
          orderedImages.push({ type: 'existing', ...existingObj });
        }
      });

      const variantsPayload = [{
        color: finalColor,
        mrp: finalMrp,
        price: finalSellingPrice,
        discount: finalDiscount,
        sizes: validSizes,
        productSku: finalSku,
        imageFields,
        existingImages,
        orderedImages
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

        {/* Warehouse Consignment & Source Merchant Section */}
        {merchant?.accountType === 'warehouse' && (
          <div className="products-card" style={{ marginBottom: "var(--space-6)", border: "1.5px solid rgba(56, 189, 248, 0.3)", background: "rgba(56, 189, 248, 0.03)" }}>
            <div className="products-header" style={{ marginBottom: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <LinkIcon size={20} style={{ color: "var(--color-primary)" }} />
                <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, margin: 0 }}>Warehouse Consignment & Source Merchant</h2>
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                Select the consignment owner merchant and link an existing product from their catalog to auto-populate images, variants, and specs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: "16px" }}>
              <div className="form-group">
                <label>Source Merchant (Consignment Owner) <span className="required">*</span></label>
                <div className="select-wrapper">
                  <select
                    required
                    value={selectedMerchantId}
                    onChange={(e) => {
                      setSelectedMerchantId(e.target.value);
                      setSelectedMerchantProduct(null);
                      setLinkedMerchantProductId('');
                    }}
                  >
                    <option value="">-- Select Source Merchant --</option>
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
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="Leave empty for default"
                />
              </div>
            </div>

            {/* Merchant Product Search & Selection */}
            {selectedMerchantId && (
              <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 600 }}>
                  Link Product from {merchants.find(m => m._id === selectedMerchantId)?.shopName || 'Merchant'}
                </label>

                {loadingMerchantProducts ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", gap: "8px", color: "var(--color-text-secondary)", fontSize: "13px" }}>
                    <Loader2 className="animate-spin" size={18} />
                    Loading merchant's product catalog...
                  </div>
                ) : selectedMerchantProduct ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(16, 185, 129, 0.1)", border: "1.5px solid rgba(16, 185, 129, 0.3)", padding: "14px 18px", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {selectedMerchantProduct.images?.[0]?.url || (typeof selectedMerchantProduct.images?.[0] === 'string' ? selectedMerchantProduct.images?.[0] : null) ? (
                        <img
                          src={selectedMerchantProduct.images[0]?.url || selectedMerchantProduct.images[0]}
                          alt=""
                          style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                      ) : (
                        <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: "#10b981", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Check size={16} /> Linked to: {selectedMerchantProduct.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                          Price: ₹{selectedMerchantProduct.price || selectedMerchantProduct.mrp} • Color: {selectedMerchantProduct.color?.name || 'Default'} • {selectedMerchantProduct.sizes?.length || 0} size(s) pre-filled
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearMerchantProductLink}
                      className="secondary-btn"
                      style={{ padding: "6px 14px", fontSize: "12px" }}
                    >
                      Unlink / Change
                    </button>
                  </div>
                ) : merchantProducts.length === 0 ? (
                  <div style={{ padding: "16px", background: "rgba(0,0,0,0.1)", borderRadius: "8px", fontSize: "13px", color: "var(--color-text-secondary)", textAlign: "center" }}>
                    No products found for this merchant. You can fill in the details below to create a new product from scratch.
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg)", padding: "4px 12px", marginBottom: "12px" }}>
                      <Search size={16} style={{ color: "var(--color-text-tertiary)", marginRight: "8px" }} />
                      <input
                        type="text"
                        placeholder="Search merchant's products by name or code..."
                        value={merchantProductSearch}
                        onChange={e => setMerchantProductSearch(e.target.value)}
                        style={{ border: "none", outline: "none", flex: 1, padding: "8px 4px", fontSize: "13px" }}
                      />
                    </div>

                    <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {merchantProducts
                        .filter(p => !merchantProductSearch || p.name?.toLowerCase().includes(merchantProductSearch.toLowerCase()) || p.productCode?.toLowerCase().includes(merchantProductSearch.toLowerCase()))
                        .map(p => {
                          const imgSrc = p.images?.[0]?.url || (typeof p.images?.[0] === 'string' ? p.images[0] : null);
                          return (
                            <div
                              key={p.id || p.styleGroupId || p._id}
                              onClick={() => handleSelectMerchantProduct(p)}
                              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-surface)", cursor: "pointer", transition: "all 0.15s" }}
                              className="hover:border-blue-500 hover:bg-slate-50/5"
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {imgSrc ? (
                                  <img src={imgSrc} alt="" style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }} />
                                ) : (
                                  <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                                    <ImageIcon size={16} />
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: "13px" }}>{p.name}</div>
                                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                                    {p.category || p.categoryId?.name || 'Category'} • ₹{p.price || p.mrp || 0} {p.color?.name ? `• ${p.color.name}` : ''}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleSelectMerchantProduct(p); }}
                                className="primary-btn"
                                style={{ padding: "6px 12px", fontSize: "12px" }}
                              >
                                Link Product
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Autocomplete Catalog Link Bar (Only show if not doing copyFrom and not warehouse operator) */}
        {!copyFrom && merchant?.accountType !== 'warehouse' && (
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

        {/* ✨ GEMINI AI AUTO-FILL HERO COMPONENT */}
        <div className="ai-autofill-hero">
          <div className="ai-autofill-header">
            <div>
              <div className="ai-autofill-title">
                <Sparkles size={22} />
                <span>Gemini AI Smart Auto-Fill</span>
                <span className="ai-badge">Flash AI ⚡</span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                Drop or upload a dress photo. Gemini AI automatically identifies the dress type, product title, category, gender, color, description & tags!
              </p>
            </div>
            {aiAutoFilled && (
              <button
                type="button"
                onClick={() => {
                  setAiAutoFilled(false);
                  setAiSummary(null);
                }}
                className="secondary-btn"
                style={{ padding: "4px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <X size={12} /> Clear AI Tag
              </button>
            )}
          </div>

          {analyzingAi ? (
            <div className="ai-scanning-overlay">
              <div className="ai-pulse-orb">
                <Sparkles size={26} />
              </div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#4338ca" }}>
                {aiAnalysisStep || "Analyzing photo with Gemini AI..."}
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Extracting fashion silhouette, category hierarchy, fabric details, and colors...
              </p>
            </div>
          ) : (
            <div>
              <label className="ai-autofill-dropzone" style={{ cursor: "pointer", padding: "20px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#4f46e5", fontWeight: 600, fontSize: "15px" }}>
                  <Upload size={20} />
                  <span>Choose Product Image File or Drag & Drop</span>
                </div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Supports JPG, PNG, WEBP • Gemini AI reads photo and automatically fills Title, Category, Color & Description
                </span>
                <span
                  className="primary-btn"
                  style={{
                    padding: "6px 16px",
                    fontSize: "12px",
                    marginTop: "4px",
                    background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                    borderRadius: "6px",
                    pointerEvents: "none"
                  }}
                >
                  Browse File
                </span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleAiAnalyzeFile(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />
              </label>

              {aiSummary && (
                <div className="ai-success-banner">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#10b981", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#065f46" }}>
                        ✨ Auto-filled successfully by Gemini AI!
                      </div>
                      <div style={{ fontSize: "12px", color: "#047857" }}>
                        Detected: <strong>{aiSummary.categoryName} &gt; {aiSummary.subCategoryName}</strong>
                        {aiSummary.colorName ? ` • Color: ${aiSummary.colorName}` : ''}
                        {" "}— Review & adjust below, set your Price & Stock, then save!
                      </div>
                    </div>
                  </div>
                  <span className="ai-badge" style={{ background: "#d1fae5", color: "#065f46", borderColor: "#a7f3d0" }}>
                    Ready to review
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Single Flat Card wrapping all inputs */}
          <div className="products-card" style={{ marginBottom: "var(--space-6)" }}>
            <div className="products-header" style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Product Details</h2>
                <p style={{ fontSize: "12px", color: "#6b7280" }}>Fill out all details below to create your product listing.</p>
              </div>
              {aiAutoFilled && (
                <span className="ai-badge">✨ Auto-filled by Gemini AI</span>
              )}
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
                  <label>Product SKU <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
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
                    />
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
                    Database SKU: {merchantPrefix}-{productSku || 'YOURSKU'}-S
                  </p>
                </div>
                <div className="form-group">
                  <label>Select Product Color <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
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
                  <label>Gender Focus <span className="required">*</span></label>
                  <div className="flex gap-4 flex-wrap" style={{ marginTop: "10px" }}>
                    {['MEN', 'WOMEN', 'KIDS', 'BOYS', 'GIRLS'].map(g => (
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
                <label>Primary Category <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Determines main specs and commission)</span></label>
                <div className="categories-row">
                  <div className="select-wrapper">
                    <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId(''); }}>
                      <option value="">Main Category (Optional)</option>
                      {renderCategoryOptions(0)}
                    </select>
                    <ChevronDown className="select-icon" />
                  </div>
                  <div className="select-wrapper">
                    <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} disabled={!categoryId}>
                      <option value="">Sub Category (Optional)</option>
                      {renderCategoryOptions(1)}
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
                    Show this product in secondary sections too without changing its main garment specs.
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
                        if (targetId === subCategoryId || targetId === categoryId) {
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

              {/* Dynamic Category Attributes */}
              {dynamicAttributes.length > 0 && (
                <div style={{ background: "var(--color-bg)", padding: "var(--space-5)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "var(--space-6)" }}>
                  <h4 style={{ fontWeight: 600, marginBottom: "var(--space-4)" }}>
                    Category Attributes <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 400 }}>(Optional)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dynamicAttributes.map(attr => {
                      const selectedVal = attributes.find(a => {
                        const existingId = typeof a.attributeId === 'object'
                          ? ((a.attributeId as any)?._id || (a.attributeId as any)?.id)
                          : (a.attributeId || (a as any).attribute);
                        return String(existingId) === String(attr._id);
                      })?.value ?? '';
                      return (
                        <div key={attr._id} className="form-group">
                          <label>{attr.name} <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
                          {attr.inputType === 'select' && (
                            <div className="select-wrapper">
                              <select
                                value={selectedVal as string}
                                onChange={e => handleAttributeChange(attr._id, e.target.value)}
                              >
                                <option value="">Select {attr.name} (Optional)</option>
                                {attr.values?.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                              </select>
                              <ChevronDown className="select-icon" />
                            </div>
                          )}
                          {attr.inputType === 'multiselect' && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {attr.values?.map(v => {
                                const isChecked = Array.isArray(selectedVal) && selectedVal.includes(v.value);
                                return (
                                  <button
                                    key={v.value}
                                    type="button"
                                    onClick={() => handleAttributeChange(attr._id, v.value, true)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                      isChecked
                                        ? 'bg-blue-600 border-blue-500 text-white'
                                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                    }`}
                                  >
                                    {v.label || v.value}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {(attr.inputType === 'text' || attr.inputType === 'number') && (
                            <input
                              type={attr.inputType}
                              value={selectedVal}
                              placeholder={`Enter ${attr.name} (Optional)`}
                              onChange={e => handleAttributeChange(attr._id, attr.inputType === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Linked Product Attributes preview fallback */}
              {attributes.length > 0 && dynamicAttributes.length === 0 && (
                <div style={{ background: "var(--color-bg)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", marginBottom: "var(--space-6)" }}>
                  <h4 style={{ fontWeight: 600, marginBottom: "var(--space-2)", fontSize: "13px" }}>Imported Attributes ({attributes.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {attributes.map((a, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs">
                        {Array.isArray(a.value) ? a.value.join(', ') : String(a.value || '')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Prompts Helper (Front, Back, Close-Up) */}
              {(() => {
                const activeSubCat = categories.find(c => c._id === subCategoryId);
                const activeParentCat = categories.find(c => c._id === categoryId);
                const activeCat = activeSubCat || activeParentCat;
                const pFront = (activeSubCat?.promptFront || activeSubCat?.prompts?.front || activeParentCat?.promptFront || activeParentCat?.prompts?.front || '').trim();
                const pBack = (activeSubCat?.promptBack || activeSubCat?.prompts?.back || activeParentCat?.promptBack || activeParentCat?.prompts?.back || '').trim();
                const pCloseUp = (activeSubCat?.promptCloseUp || activeSubCat?.prompts?.closeUp || activeParentCat?.promptCloseUp || activeParentCat?.prompts?.closeUp || '').trim();
                const legacyDesc = (!pFront && !pBack && !pCloseUp) ? (activeSubCat?.description || activeParentCat?.description || '').trim() : '';
                const hasPrompts = !!(pFront || pBack || pCloseUp || legacyDesc);

                if (!hasPrompts) return null;

                return (
                  <div style={{ background: "rgba(147, 51, 234, 0.04)", border: "1px solid rgba(147, 51, 234, 0.2)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", marginBottom: "var(--space-5)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Sparkles size={16} style={{ color: "#9333ea" }} />
                        <span style={{ fontWeight: 600, fontSize: "13px", color: "#581c87" }}>
                          Category Prompts Available ({activeCat?.name}):
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const combined = [
                            pFront ? `Front: ${pFront}` : '',
                            pBack ? `Back: ${pBack}` : '',
                            pCloseUp ? `Close-Up: ${pCloseUp}` : '',
                            legacyDesc ? `Prompt: ${legacyDesc}` : '',
                          ].filter(Boolean).join("\n\n");
                          setDescription(prev => prev ? `${prev}\n\n${combined}` : combined);
                        }}
                        className="secondary-btn"
                        style={{ padding: "4px 10px", fontSize: "11px", fontWeight: 600, background: "#9333ea", color: "white", border: "none" }}
                      >
                        Insert All Prompts
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {pFront && (
                        <div style={{ background: "white", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "6px", padding: "10px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e40af" }}>Front View</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(pFront);
                                setPromptCopied('front');
                                setTimeout(() => setPromptCopied(null), 2000);
                              }}
                              style={{ background: "none", border: "none", color: "#2563eb", fontSize: "10px", cursor: "pointer" }}
                            >
                              {promptCopied === 'front' ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <p style={{ fontSize: "11px", color: "#475569", margin: 0, fontFamily: "monospace", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {pFront}
                          </p>
                          <button
                            type="button"
                            onClick={() => setDescription(prev => prev ? `${prev}\n\n${pFront}` : pFront)}
                            style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: 500 }}
                          >
                            + Use Front Prompt
                          </button>
                        </div>
                      )}

                      {pBack && (
                        <div style={{ background: "white", border: "1px solid rgba(147, 51, 234, 0.2)", borderRadius: "6px", padding: "10px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#6b21a8" }}>Back View</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(pBack);
                                setPromptCopied('back');
                                setTimeout(() => setPromptCopied(null), 2000);
                              }}
                              style={{ background: "none", border: "none", color: "#9333ea", fontSize: "10px", cursor: "pointer" }}
                            >
                              {promptCopied === 'back' ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <p style={{ fontSize: "11px", color: "#475569", margin: 0, fontFamily: "monospace", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {pBack}
                          </p>
                          <button
                            type="button"
                            onClick={() => setDescription(prev => prev ? `${prev}\n\n${pBack}` : pBack)}
                            style={{ background: "#faf5ff", border: "1px solid #e9d5ff", color: "#7e22ce", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: 500 }}
                          >
                            + Use Back Prompt
                          </button>
                        </div>
                      )}

                      {pCloseUp && (
                        <div style={{ background: "white", border: "1px solid rgba(217, 119, 6, 0.2)", borderRadius: "6px", padding: "10px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#92400e" }}>Close-Up View</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(pCloseUp);
                                setPromptCopied('closeup');
                                setTimeout(() => setPromptCopied(null), 2000);
                              }}
                              style={{ background: "none", border: "none", color: "#d97706", fontSize: "10px", cursor: "pointer" }}
                            >
                              {promptCopied === 'closeup' ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <p style={{ fontSize: "11px", color: "#475569", margin: 0, fontFamily: "monospace", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {pCloseUp}
                          </p>
                          <button
                            type="button"
                            onClick={() => setDescription(prev => prev ? `${prev}\n\n${pCloseUp}` : pCloseUp)}
                            style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: 500 }}
                          >
                            + Use Close-Up Prompt
                          </button>
                        </div>
                      )}

                      {legacyDesc && !pFront && !pBack && !pCloseUp && (
                        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px", gridColumn: "span 3" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>General Prompt</span>
                            <button
                              type="button"
                              onClick={() => setDescription(prev => prev ? `${prev}\n\n${legacyDesc}` : legacyDesc)}
                              style={{ background: "none", border: "none", color: "#9333ea", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
                            >
                              Use in Description
                            </button>
                          </div>
                          <p style={{ fontSize: "11px", color: "#475569", margin: 0, fontFamily: "monospace" }}>{legacyDesc}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Write high-quality fabric details, specifications, etc." />
              </div>

              {/* Pricing (MRP, Selling Price, Discount) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-group">
                  <label>MRP <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>(Optional)</span></label>
                  <input type="number" value={mrp || ''} onChange={e => handlePriceFieldChange('mrp', Number(e.target.value))} placeholder="Defaults to Selling Price" />
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
                    <div key={imgIdx} style={{ position: "relative", width: "110px", height: "110px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid var(--color-border)", background: "var(--color-bg)" }}>
                      <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {imgIdx === 0 ? (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(16, 185, 129, 0.9)", color: "white", fontSize: "10px", fontWeight: 700, textAlign: "center", padding: "2px 0", letterSpacing: "0.5px" }}>MAIN COVER</div>
                      ) : (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "white", fontSize: "9px", textAlign: "center", padding: "1px 0" }}>#{imgIdx + 1}</div>
                      )}
                      
                      {/* Reorder Buttons */}
                      <div style={{ position: "absolute", top: "4px", left: "4px", display: "flex", gap: "2px" }}>
                        {imgIdx > 0 && (
                          <button
                            type="button"
                            title="Move Left"
                            onClick={() => moveImage(imgIdx, 'left')}
                            style={{ background: "rgba(15, 23, 42, 0.8)", color: "white", border: "none", borderRadius: "4px", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                          >
                            <ChevronLeft size={13} />
                          </button>
                        )}
                        {imgIdx < images.length - 1 && (
                          <button
                            type="button"
                            title="Move Right"
                            onClick={() => moveImage(imgIdx, 'right')}
                            style={{ background: "rgba(15, 23, 42, 0.8)", color: "white", border: "none", borderRadius: "4px", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
                          >
                            <ChevronRight size={13} />
                          </button>
                        )}
                      </div>

                      {/* AI Analyze this specific image */}
                      {img.blob && (
                        <button
                          type="button"
                          title="Analyze this photo with Gemini AI"
                          disabled={analyzingAi}
                          onClick={() => {
                            if (img.blob) handleAiAnalyzeFile(img.blob);
                          }}
                          style={{
                            position: "absolute",
                            bottom: imgIdx === 0 ? "20px" : "18px",
                            right: "4px",
                            background: "rgba(109, 40, 217, 0.9)",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "10px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                          }}
                        >
                          <Sparkles size={10} /> AI
                        </button>
                      )}

                      <button
                        type="button"
                        title="Remove Image"
                        onClick={() => removeImage(imgIdx)}
                        style={{ position: "absolute", top: "4px", right: "4px", background: "var(--color-danger, #ef4444)", color: "white", borderRadius: "4px", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        <X size={12} />
                      </button>
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