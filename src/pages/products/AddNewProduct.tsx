import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  ChevronDown, Plus, X, Loader2, CheckCircle, AlertTriangle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCategories, addBaseProduct, getAttributes } from '../../api/products';
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

  const handleAttributeChange = (attributeId: string, value: any, isMultiselect: boolean = false) => {
    setFormData(prev => {
      let updatedAttributes = [...prev.attributes];
      const existingIndex = updatedAttributes.findIndex(a => a.attributeId === attributeId);
      if (isMultiselect) {
        if (existingIndex >= 0) {
          let currentValues = updatedAttributes[existingIndex].value as string[];
          if (!Array.isArray(currentValues)) currentValues = [currentValues].filter(Boolean);
          if (currentValues.includes(value)) currentValues = currentValues.filter(v => v !== value);
          else currentValues.push(value);
          if (currentValues.length === 0) updatedAttributes.splice(existingIndex, 1);
          else updatedAttributes[existingIndex].value = currentValues;
        } else {
          updatedAttributes.push({ attributeId, value: [value] });
        }
      } else {
        if (existingIndex >= 0) {
          if (value === '' || value === false) updatedAttributes.splice(existingIndex, 1);
          else updatedAttributes[existingIndex].value = value;
        } else {
          if (value !== '' && value !== false) updatedAttributes.push({ attributeId, value });
        }
      }
      return { ...prev, attributes: updatedAttributes };
    });
  };

  const handleAddFeature = () => {
    if (!newFeature.key.trim() || !newFeature.value.trim()) return;
    setFormData(prev => ({ ...prev, features: { ...prev.features, [newFeature.key.trim()]: newFeature.value.trim() } }));
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      const finalPayload = { ...payload, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) };
      await addBaseProduct(finalPayload) as AddBaseProductResponse;
      setMessage("Product created successfully!");
      setMessageType("success");
      setFormData(prev => ({ ...prev, name: '', soldBy: '', styleName: '', categoryId: '', subCategoryId: '', description: '', features: {}, tags: '' }));
    } catch (err: any) {
      setMessage(err?.message ?? "Failed to create product");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryOptions = (level: 0 | 1) =>
    categories
      .filter(cat =>
        cat.level === level &&
        cat.isActive &&
        (level === 0 || (level === 1 && cat.parentId === formData.categoryId))
      )
      .map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>);

  return (
    <div className="products-page">
      <div className="products-container">
        <div className="products-card">
          <div className="products-header">
            <h1>Add New Product</h1>
            <p>Create a product for: <span>{merchant?.shopName || 'Your Store'}</span></p>
            <div className="products-field-note">Fill all required fields to publish your product.</div>
          </div>

          <form onSubmit={handleSubmit} className="products-form">
            <div className="form-group">
              <label>Product Name / Title <span className="required">*</span></label>
              <input type="text" name="name" placeholder="e.g., Slim Fit Cotton Shirt" value={formData.name} onChange={handleChange} required />
              <p className="field-help">Use a clear, descriptive name.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label>Style Name</label>
                <input type="text" name="styleName" placeholder="e.g., Oxford Breeze" value={formData.styleName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Sold By (Shop Name)</label>
                <input type="text" name="soldBy" placeholder="e.g., Fashion Hub" value={formData.soldBy} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Product Categories <span className="required">*</span></label>
              <div className="categories-row">
                <div className="select-wrapper">
                  <select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                    <option value="">Main Category</option>
                    {renderCategoryOptions(0)}
                  </select>
                  <ChevronDown className="select-icon" />
                </div>
                <div className="select-wrapper">
                  <select name="subCategoryId" value={formData.subCategoryId} onChange={handleChange} disabled={!formData.categoryId}>
                    <option value="">Sub Category</option>
                    {renderCategoryOptions(1)}
                  </select>
                  <ChevronDown className="select-icon" />
                </div>
              </div>
              <div className="products-field-note" style={{ color: "var(--color-warning)", marginTop: "8px", display: "flex", gap: "6px" }}>
                <AlertCircle size={14} /> Note: Categories cannot be changed after creation.
              </div>
            </div>

            <div className="form-group">
              <label>Gender Focus</label>
              <div className="flex flex-wrap" style={{ gap: "var(--space-4)" }}>
                {['MEN', 'WOMEN', 'KIDS'].map(g => (
                  <label key={g} className="checkbox-group" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.gender.includes(g)}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          gender: e.target.checked ? [...prev.gender, g] : prev.gender.filter(x => x !== g)
                        }));
                      }}
                    />
                    <span style={{ fontWeight: 500 }}>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {dynamicAttributes.length > 0 && (
              <div style={{ background: "var(--color-bg)", padding: "var(--space-5)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                <h4 style={{ fontWeight: 600, marginBottom: "var(--space-4)" }}>Category Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dynamicAttributes.map((attr) => {
                    const selectedVal = formData.attributes.find(a => a.attributeId === attr._id)?.value ?? '';
                    return (
                      <div key={attr._id} className="form-group">
                        <label>{attr.name} {attr.isRequired && <span className="required">*</span>}</label>
                        {attr.inputType === 'select' && (
                          <div className="select-wrapper" style={{ width: "100%" }}>
                            <select value={selectedVal as string} onChange={(e) => handleAttributeChange(attr._id, e.target.value)} required={attr.isRequired}>
                              <option value="">Select {attr.name}</option>
                              {attr.values?.map(val => <option key={val.value} value={val.value}>{val.label}</option>)}
                            </select>
                            <ChevronDown className="select-icon" />
                          </div>
                        )}
                        {attr.inputType === 'multiselect' && (
                          <div className="flex flex-wrap" style={{ gap: "8px", padding: "8px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}>
                            {attr.values?.map((val) => (
                              <label key={val.value} className="checkbox-group" style={{ background: "var(--color-bg)", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                                <input type="checkbox" checked={Array.isArray(selectedVal) && selectedVal.includes(val.value)} onChange={() => handleAttributeChange(attr._id, val.value, true)} />
                                {val.label}
                              </label>
                            ))}
                          </div>
                        )}
                        {(attr.inputType === 'text' || attr.inputType === 'number') && (
                          <input type={attr.inputType} value={selectedVal as string} onChange={(e) => handleAttributeChange(attr._id, attr.inputType === 'number' ? Number(e.target.value) : e.target.value)} required={attr.isRequired} />
                        )}
                        {attr.inputType === 'boolean' && (
                          <label className="checkbox-group"><input type="checkbox" checked={!!selectedVal} onChange={(e) => handleAttributeChange(attr._id, e.target.checked)} /> Yes / Enabled</label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Description</label>
              <textarea name="description" placeholder="Product details, fabric, intent, etc." value={formData.description} onChange={handleChange} rows={5} />
            </div>

            <div className="form-group">
              <div className="flex-between" style={{ marginBottom: "var(--space-2)" }}>
                <label>Key Features</label>
                <button type="button" className="add-feature-btn" onClick={() => setShowFeatureForm(!showFeatureForm)}>
                  <Plus size={16} /> Add Feature
                </button>
              </div>

              {Object.keys(formData.features).length > 0 && (
                <div className="features-list">
                  {Object.entries(formData.features).map(([key, value]) => (
                    <div key={key} className="feature-item">
                      <div><span className="feature-key">{key}:</span> <span className="feature-val">{value}</span></div>
                      <button type="button" className="feature-remove" onClick={() => handleRemoveFeature(key)}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              {showFeatureForm && (
                <div className="feature-form">
                  <div>
                    <label>Property</label>
                    <input type="text" placeholder="e.g. Fit" value={newFeature.key} onChange={(e) => setNewFeature(prev => ({ ...prev, key: e.target.value }))} />
                  </div>
                  <div>
                    <label>Value</label>
                    <input type="text" placeholder="e.g. Slim" value={newFeature.value} onChange={(e) => setNewFeature(prev => ({ ...prev, value: e.target.value }))} />
                  </div>
                  <div className="feature-form-actions">
                    <button type="button" className="primary-btn" onClick={handleAddFeature}>Add</button>
                    <button type="button" className="secondary-btn" onClick={() => setShowFeatureForm(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Search Tags</label>
              <input type="text" name="tags" placeholder="summer, casual, best-seller (comma separated)" value={formData.tags} onChange={handleChange} />
              {formData.tags && (
                <div className="tags-list">
                  {formData.tags.split(',').map((t, i) => t.trim() && <span key={i} className="tag-item">{t.trim()}</span>)}
                </div>
              )}
            </div>

            <div className="settings-row">
              <label className="checkbox-group">
                <input type="checkbox" name="isTriable" checked={formData.isTriable} onChange={handleChange} />
                <span>Trial and Buy</span>
                <p className="field-help" style={{ margin: 0 }}>Allow customers to try before paying</p>
              </label>
              <label className="checkbox-group">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                <span>Active Status</span>
                <p className="field-help" style={{ margin: 0 }}>Visible to customers on store</p>
              </label>
            </div>

            <div className="submit-group">
              <button type="submit" disabled={loading || !formData.name.trim() || !formData.categoryId} className="submit-btn">
                {loading ? <Loader2 className="loader" /> : 'Create Product'}
              </button>
            </div>
          </form>

          {message && (
            <div className={`message-box ${messageType === 'success' ? 'success' : 'error'}`}>
              <div className="icon">
                {messageType === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <span>{messageType === 'success' ? 'Success' : 'Attention'}</span>
                <p>{message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddNewProduct;