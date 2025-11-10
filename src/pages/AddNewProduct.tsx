import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  ChevronDown, Plus, X, Loader2, CheckCircle, AlertTriangle, AlertCircle
} from 'lucide-react';
import { getCategories, addBaseProduct, getBrands } from '../api/products';
import VariantForm from '../components/Products/VariantForm';

// ---------------------- Types ----------------------
interface Category {
  _id: string;
  name: string;
  level: 0 | 1 | 2;
  parentId?: string;
  isActive: boolean;
}

interface Brand {
  _id: string;
  name: string;
}


interface ProductFormData {
  name: string;
  brandId: string;
  categoryId: string;
  subCategoryId: string;
  subSubCategoryId: string;
  gender: 'unisex' | 'men' | 'women' | 'boys' | 'girls' | 'babies';
  description: string;
  features: Record<string, string>;
  tags: string;
  merchantId: string;
  isTriable: boolean;
  isActive: boolean;
}

interface AddBaseProductResponse {
  product: { _id: string };
}

// ---------------------------------------------------

const AddNewProduct = () => {
  const merchantId = localStorage.getItem("merchant_id") ?? "";

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    brandId: '',
    categoryId: '',
    subCategoryId: '',
    subSubCategoryId: '',
    gender: 'unisex',
    description: '',
    features: {},
    tags: '',
    merchantId,
    isTriable: true,
    isActive: true
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [merchantDetails, _setMerchantDetails] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const [newFeature, setNewFeature] = useState({ key: '', value: '' });
  const [showFeatureForm, setShowFeatureForm] = useState(false);

  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [showAddVariant, setShowAddVariant] = useState(false);

  // -------------------- Fetch Data --------------------
  useEffect(() => {
    if (!merchantId) return;

    // const fetchMerchant = async () => {
    //   try {
    //     const data = await getMerchantById() as MerchantResponse;
    //     setMerchantDetails(data.shopName);
    //   } catch {
    //     setMessage("Failed to load merchant details");
    //     setMessageType("error");
    //   }
    // };

    const loadCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res.categories as Category[]);
      } catch {
        setMessage("Failed to load categories");
        setMessageType("error");
      }
    };

    const loadBrands = async () => {
      setBrandsLoading(true);
      try {
        const res = await getBrands(merchantId);
        setBrands((res.brands || []) as Brand[]);
      } catch {
        setMessage("Failed to load brands");
        setMessageType("error");
      } finally {
        setBrandsLoading(false);
      }
    };

    // fetchMerchant();
    loadCategories();
    loadBrands();
  }, [merchantId]);

  // -------------------- Input Change --------------------
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name } = target;
    const isCheckbox = 'checked' in target && (target as HTMLInputElement).type === 'checkbox';
    const val = isCheckbox ? (target as HTMLInputElement).checked : target.value;

    setFormData(prev => ({ ...prev, [name]: val }));

    if (name === 'categoryId') setFormData(prev => ({ ...prev, subCategoryId: '', subSubCategoryId: '' }));
    if (name === 'subCategoryId') setFormData(prev => ({ ...prev, subSubCategoryId: '' }));
  };

  // -------------------- Feature Handlers --------------------
  const handleAddFeature = () => {
    if (!newFeature.key.trim() || !newFeature.value.trim()) return;

    setFormData(prev => ({
      ...prev,
      features: { ...prev.features, [newFeature.key.trim()]: newFeature.value.trim() }
    }));

    setNewFeature({ key: '', value: '' });
    setShowFeatureForm(false);
  };

  const handleRemoveFeature = (key: string) => {
    setFormData(prev => {
      const updated = { ...prev.features };
      delete updated[key];
      return { ...prev, features: updated };
    });
  };

  // -------------------- Submit --------------------
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const response = await addBaseProduct(payload) as AddBaseProductResponse;

      setCreatedProductId(response.product._id);
      setShowAddVariant(true);

      setMessage("Product created successfully!");
      setMessageType("success");

      setFormData(prev => ({
        ...prev,
        name: '',
        brandId: '',
        categoryId: '',
        subCategoryId: '',
        subSubCategoryId: '',
        description: '',
        features: {},
        tags: ''
      }));
    } catch (err: any) {
      setMessage(err?.message ?? "Failed to create product");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Category Options --------------------
  const renderCategoryOptions = (level: 0 | 1 | 2) =>
    categories
      .filter(cat =>
        cat.level === level &&
        cat.isActive &&
        (level === 0 ||
          (level === 1 && cat.parentId === formData.categoryId) ||
          (level === 2 && cat.parentId === formData.subCategoryId))
      )
      .map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>);


  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 !p-4 md:!p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full mx-auto">
          {/* Main Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 !p-8 text-white">
              <h1 className="text-3xl md:text-4xl font-bold !mb-2">Add New Product</h1>
              <p className="text-blue-100 !text-lg">
                Create a product for: <span className="font-semibold">{merchantDetails || 'Your Store'}</span>
              </p>
              <p className="text-blue-200 !text-sm !mt-2 opacity-90">
                Fill all required fields to publish your product.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="!p-6 md:!p-10 !space-y-8">
              {/* Product Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 !mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Premium Cotton T-Shirt"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 font-medium text-gray-900"
                />
              </div>

              {/* Brand */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 !mb-2">
                  Brand <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="brandId"
                    value={formData.brandId}
                    onChange={handleChange}
                    required
                    disabled={brandsLoading}
                    className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer pr-12 font-medium text-gray-900"
                  >
                    <option value="">{brandsLoading ? "Loading Brands..." : "Select Brand"}</option>
                    {brands.map(brand => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 !mt-2">Brand is fetched from your account</p>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 !mb-3">
                  Product Categories <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 !gap-5">
                  {[
                    { label: "Main Category", name: "categoryId", required: true },
                    { label: "Sub Category", name: "subCategoryId", disabled: !formData.categoryId },
                    { label: "Sub-Sub Category", name: "subSubCategoryId", disabled: !formData.subCategoryId },
                  ].map((field, idx) => (
                    <div key={field.name} className="relative group">
                      <label className="block text-xs font-medium text-gray-600 !mb-1.5">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        name={field.name}
                        value={formData[field.name as keyof ProductFormData] as any}
                        onChange={handleChange}
                        required={field.required}
                        disabled={field.disabled}
                        className="w-full !px-4 !py-3.5 rounded-lg border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer pr-10 font-medium text-gray-800 disabled:opacity-50"
                      >
                        <option value="">Select {field.label.split(' ')[0]}</option>
                        {renderCategoryOptions(idx as 0 | 1 | 2)}
                      </select>
                      <ChevronDown className="absolute right-3 top-10 w-4.5 h-4.5 text-indigo-600 pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="!mt-6 !p-4 !rounded-lg !bg-amber-50 !border !border-amber-200 !flex !items-start !gap-3">
                <AlertCircle className="!w-5 !h-5 !text-amber-600 !flex-shrink-0 !mt-0.5" />
                <p className="!text-sm !text-amber-800 !leading-relaxed">
                  <strong>Note:</strong> Once the product is created, you cannot edit <b> Brand </b> and <b> Categories </b>.
                  Please make sure the information is correct before submitting.
                </p>
              </div>

              {/* Gender */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 !mb-2">Gender Target</label>
                <div className="relative">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer pr-12 font-medium text-gray-900"
                  >
                    {['unisex', 'men', 'women', 'boys', 'girls', 'babies'].map(g => (
                      <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600 pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 !mb-2">Description</label>
                <textarea
                  name="description"
                  placeholder="Product details, fabric, use-case, etc."
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400 font-medium text-gray-900"
                />
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between !mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800">Product Features</label>
                    <p className="text-xs text-gray-500">E.g. Material: Cotton, Color: Blue</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFeatureForm(!showFeatureForm)}
                    className="flex items-center !gap-2 !px-4 !py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Feature
                  </button>
                </div>

                {Object.keys(formData.features).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 !gap-3 !mb-4">
                    {Object.entries(formData.features).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between !px-4 !py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
                        <div>
                          <span className="font-semibold text-emerald-800">{key}:</span>
                          <span className="text-emerald-700 !ml-2">{value}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(key)}
                          className="text-red-600 hover:text-red-800 hover:scale-110 transition-transform"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showFeatureForm && (
                  <div className="bg-blue-50/50 border border-blue-200 rounded-xl !p-5 !space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 !gap-4">
                      <input
                        type="text"
                        placeholder="Feature Name (e.g. Material)"
                        value={newFeature.key}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFeature(prev => ({ ...prev, key: e.target.value }))}
                        className="w-full !px-4 !py-3 rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. Cotton)"
                        value={newFeature.value}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFeature(prev => ({ ...prev, value: e.target.value }))}
                        className="w-full !px-4 !py-3 rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div className="flex !gap-3">
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        disabled={!newFeature.key.trim() || !newFeature.value.trim()}
                        className="flex-1 !py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 font-medium shadow-md hover:shadow-lg transition-all"
                      >
                        Add Feature
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowFeatureForm(false);
                          setNewFeature({ key: '', value: '' });
                        }}
                        className="flex-1 !py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 !mb-2">Tags</label>
                <input
                  type="text"
                  name="tags"
                  placeholder="e.g., summer, casual, bestseller"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-gray-900"
                />
                <p className="text-xs text-gray-500 !mt-2">Separate tags by comma</p>
                {formData.tags && (
                  <div className="flex flex-wrap !gap-2 !mt-3">
                    {formData.tags.split(',').map((tag, i) => tag.trim() && (
                      <span key={i} className="inline-flex items-center !px-3 !py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="flex flex-col sm:flex-row !gap-8 !mt-6">
                <label className="flex items-center !gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="isTriable"
                    checked={formData.isTriable}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <div>
                    <div className="font-semibold text-gray-800">Trial and Buy</div>
                    <div className="text-xs text-gray-500">Enable try-before-buy option</div>
                  </div>
                </label>
                <label className="flex items-center !gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 text-green-600 rounded-lg border-gray-300 focus:ring-green-500 focus:ring-offset-0"
                  />
                  <div>
                    <div className="font-semibold text-gray-800">Is Active</div>
                    <div className="text-xs text-gray-500">Make product visible on store</div>
                  </div>
                </label>
              </div>

              {/* Submit */}
              <div className="!pt-6 !border-t !border-gray-200">
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim() || !formData.categoryId}
                  className="w-full !py-4 !px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center !gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Product...
                    </>
                  ) : (
                    'Create Product'
                  )}
                </button>
                <p className="text-center text-xs text-gray-500 !mt-3">
                  * Required fields must be filled
                </p>
              </div>
            </form>

            {/* Message */}
            {message && (
              <div className={`!mx-6 !mb-6 !p-5 rounded-xl border-2 flex items-start !gap-4 shadow-lg ${messageType === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                {messageType === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold">{messageType === 'success' ? 'Success!' : 'Error'}</div>
                  <p className="text-sm !mt-1">{message} {messageType === 'success' && 'ADD VARIANT BELOW ↓'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Variant Form */}
        {showAddVariant && createdProductId && (
          <div className="max-w-4xl mx-auto !mt-2">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 !p-8">
              <VariantForm
                productId={createdProductId}
                onSubmit={(updatedProduct: any) => {
                  console.log("Variant added:", updatedProduct);
                  setShowAddVariant(false);
                }}
                onCancel={() => setShowAddVariant(false)}
                selectedVariantIndex={0}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AddNewProduct;