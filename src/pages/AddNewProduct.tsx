import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  ChevronDown, Plus, X, Loader2, CheckCircle, AlertTriangle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCategories, addBaseProduct, getAttributes } from '../api/products';
// import VariantForm from '../components/Products/VariantForm';

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

interface ProductFormData {
  name: string;
  soldBy: string;
  styleName: string;
  categoryId: string;
  subCategoryId: string;
  gender: string[];
  description: string;
  features: Record<string, string>;
  attributes: { attributeId: string; value: any }[];
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
  const { merchant } = useAuth();
  const merchantId = merchant?.id ?? "";

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    soldBy: '',
    styleName: '',
    categoryId: '',
    subCategoryId: '',
    gender: ['MEN', 'WOMEN'],
    description: '',
    features: {},
    attributes: [],
    tags: '',
    merchantId,
    isTriable: true,
    isActive: true
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [dynamicAttributes, setDynamicAttributes] = useState<DynamicAttribute[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const [newFeature, setNewFeature] = useState({ key: '', value: '' });
  const [showFeatureForm, setShowFeatureForm] = useState(false);

  // -------------------- Fetch Data --------------------
  useEffect(() => {
    if (!merchantId) return;

    const loadCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res.categories as Category[]);
      } catch {
        setMessage("Failed to load categories");
        setMessageType("error");
      }
    };

    loadCategories();
  }, [merchantId]);

  // Fetch dynamic attributes when subSubCategoryId (Level 2) changes
  useEffect(() => {
    const fetchAttributes = async () => {
      if (!formData.subCategoryId) {
        setDynamicAttributes([]);
        setFormData(prev => ({ ...prev, attributes: [] }));
        return;
      }
      try {
        const res = await getAttributes(formData.subCategoryId);
        setDynamicAttributes(res.attributes || []);
        setFormData(prev => ({ ...prev, attributes: [] }));
      } catch (err) {
        console.error("Failed to fetch attributes:", err);
      }
    };

    fetchAttributes();
  }, [formData.subCategoryId]);


  // -------------------- Input Change --------------------
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const { name } = target;
    const isCheckbox = 'checked' in target && (target as HTMLInputElement).type === 'checkbox';
    const val = isCheckbox ? (target as HTMLInputElement).checked : target.value;

    setFormData(prev => ({ ...prev, [name]: val }));

    if (name === 'categoryId') setFormData(prev => ({ ...prev, subCategoryId: '' }));
  };

  // -------------------- Attribute Handlers --------------------
  const handleAttributeChange = (attributeId: string, value: any, isMultiselect: boolean = false) => {
    setFormData(prev => {
      let updatedAttributes = [...prev.attributes];
      const existingIndex = updatedAttributes.findIndex(a => a.attributeId === attributeId);

      if (isMultiselect) {
        // Handle multiselect logic
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
            updatedAttributes[existingIndex].value = currentValues;
          }
        } else {
          updatedAttributes.push({ attributeId, value: [value] });
        }
      } else {
        // Handle single value logic (select, text, number, boolean)
        if (existingIndex >= 0) {
          if (value === '' || value === false) {
            updatedAttributes.splice(existingIndex, 1);
          } else {
            updatedAttributes[existingIndex].value = value;
          }
        } else {
          if (value !== '' && value !== false) {
            updatedAttributes.push({ attributeId, value });
          }
        }
      }

      return { ...prev, attributes: updatedAttributes };
    });
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
      const payload = { ...formData };
      const finalPayload = {
        ...payload,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      await addBaseProduct(finalPayload) as AddBaseProductResponse;

      // setCreatedProductId(response.product._id);
      // setShowAddVariant(true);

      setMessage("Product created successfully!");
      setMessageType("success");

      setFormData(prev => ({
        ...prev,
        name: '',
        soldBy: '',
        styleName: '',
        categoryId: '',
        subCategoryId: '',
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
  const renderCategoryOptions = (level: 0 | 1) =>
    categories
      .filter(cat =>
        cat.level === level &&
        cat.isActive &&
        (level === 0 ||
          (level === 1 && cat.parentId === formData.categoryId))
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
                Create a product for: <span className="font-semibold">{merchant?.shopName || 'Your Store'}</span>
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
                  Product Name / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Slim Fit Cotton Shirt"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 font-medium text-gray-900"
                />
              </div>

              {/* Style, Fit, Material Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 !gap-5">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-800 !mb-2">Style Name</label>
                  <input
                    type="text"
                    name="styleName"
                    placeholder="e.g., Oxford Breeze"
                    value={formData.styleName}
                    onChange={handleChange}
                    className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 font-medium text-gray-900"
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-800 !mb-2">Sold By (Shop Name)</label>
                  <input
                    type="text"
                    name="soldBy"
                    placeholder="e.g., Fashion Hub"
                    value={formData.soldBy}
                    onChange={handleChange}
                    className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-gray-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 font-medium text-gray-900"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 !mb-3">
                  Product Categories <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 !gap-5">
                  {[
                    { label: "Main Category", name: "categoryId", required: true },
                    { label: "Sub Category", name: "subCategoryId", disabled: !formData.categoryId },
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
                        {renderCategoryOptions(idx as 0 | 1)}
                      </select>
                      <ChevronDown className="absolute right-3 top-10 w-4.5 h-4.5 text-indigo-600 pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="!mt-6 !p-4 !rounded-lg !bg-amber-50 !border !border-amber-200 !flex !items-start !gap-3">
                <AlertCircle className="!w-5 !h-5 !text-amber-600 !flex-shrink-0 !mt-0.5" />
                <p className="!text-sm !text-amber-800 !leading-relaxed">
                  <strong>Note:</strong> Once the product is created, you cannot edit <b>Categories</b>.
                  Please make sure the information is correct before submitting.
                </p>
              </div>

              {/* Gender Multi-Checkbox */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 !mb-2">Gender Target</label>
                <div className="flex gap-4 !p-4 rounded-xl border border-gray-200 bg-gray-50/70">
                  {['MEN', 'WOMEN', 'KIDS'].map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.gender.includes(g)}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            gender: e.target.checked
                              ? [...prev.gender, g]
                              : prev.gender.filter(x => x !== g)
                          }));
                        }}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <span className="font-medium text-gray-800">{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dynamic Attributes (Rendered based on category) */}
              {dynamicAttributes.length > 0 && (
                <div className="!mt-8 !mb-6 !p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100 shadow-sm">
                  <div className="!mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Category Attributes</h3>
                    <p className="text-sm text-gray-500">Provide specific details for this product category.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 !gap-6">
                    {dynamicAttributes.map((attr) => {
                      const selectedVal = formData.attributes.find(a => a.attributeId === attr._id)?.value ?? '';

                      return (
                        <div key={attr._id} className="group">
                          <label className="block text-sm font-semibold text-gray-800 !mb-2">
                            {attr.name} {attr.isRequired && <span className="text-red-500">*</span>}
                          </label>

                          {/* SELECT */}
                          {attr.inputType === 'select' && (
                            <div className="relative">
                              <select
                                value={selectedVal as string}
                                onChange={(e) => handleAttributeChange(attr._id, e.target.value)}
                                required={attr.isRequired}
                                className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer pr-10 font-medium text-gray-900 shadow-sm"
                              >
                                <option value="">Select {attr.name}</option>
                                {attr.values?.map(val => (
                                  <option key={val.value} value={val.value}>{val.label}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                          )}

                          {/* MULTISELECT */}
                          {attr.inputType === 'multiselect' && (
                            <div className="flex flex-wrap !gap-3 !p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                              {attr.values?.map((val) => {
                                const isChecked = Array.isArray(selectedVal) && selectedVal.includes(val.value);
                                return (
                                  <label key={val.value} className="flex items-center !gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 !px-3 !py-2 rounded-lg border border-gray-100 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleAttributeChange(attr._id, val.value, true)}
                                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{val.label}</span>
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
                              className="w-full !px-5 !py-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all font-medium text-gray-900"
                            />
                          )}

                          {/* BOOLEAN */}
                          {attr.inputType === 'boolean' && (
                            <label className="flex items-center !gap-3 cursor-pointer mt-3">
                              <input
                                type="checkbox"
                                checked={!!selectedVal}
                                onChange={(e) => handleAttributeChange(attr._id, e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 focus:ring-offset-0"
                              />
                              <span className="font-medium text-gray-800">Yes / Enabled</span>
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
        {/* {showAddVariant && createdProductId && (
          <div className="max-w-4xl mx-auto !mt-2">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 !p-8">
              <VariantForm
                product={createdProductId}
                onSubmit={(updatedProduct: any) => {
                  console.log("Variant added:", updatedProduct);
                  setShowAddVariant(false);
                }}
                onCancel={() => setShowAddVariant(false)}
                selectedVariantIndex={0}
              />
            </div>
          </div>
        )} */}
      </div>
    </>
  );
};

export default AddNewProduct;