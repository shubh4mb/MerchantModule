import React, { useState, useEffect, useContext } from 'react';
import { ChevronDown, Plus, X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
// import { AuthContext } from '../../context/AuthContext';
import { getCategories, addBaseProduct, getBrands } from '../../api/products';
import {getMerchantById} from '../../api/auth'
// import AddVariant from './AddVarient/AddVarient';
import VariantForm from '../ProductPage/VariantForm';
// import AddBrandPage from '../Brand/AddBrandPage';
import './AddNewProduct.css';

const AddNewProduct = () => {
      const merchant  = localStorage.getItem("merchant_id") // ✅ Get merchant directly


  const [formData, setFormData] = useState({
    name: '',
    brandId: '',
    categoryId: '',
    subCategoryId: '',
    subSubCategoryId: '',
    gender: 'unisex',
    description: '',
    features: {},
    tags: '',
    merchantId: merchant || '', // ✅ Safe access
    isTriable: true,
    isActive: true,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [newFeature, setNewFeature] = useState({ key: '', value: '' });
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
const [createdProductId, setCreatedProductId] = useState(null);
const [showAddVariant, setShowAddVariant] = useState(false); // renamed for clarity
const [merchantDetails, SetmerchantDetails] = useState(null)


useEffect(() => {
  if (!merchant) return; // wait until merchantId is in localStorage

  const fetchMerchant = async () => {
    try {
      const data = await getMerchantById(merchant);
      SetmerchantDetails( data.shopName);
    } catch (err) {
      setMessage("Failed to load merchant details");
      setMessageType("error");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.categories);
    } catch (error) {
      setMessage("Failed to load categories");
      setMessageType("error");
    }
  };

  const fetchBrands = async () => {
    setBrandsLoading(true);
    try {
      const res = await getBrands(merchant);
      setBrands(res.brands || []);
    } catch (err) {
      setMessage("Failed to load brands");
      setMessageType("error");
    } finally {
      setBrandsLoading(false);
    }
  };

  fetchMerchant();
  fetchCategories();
  fetchBrands();

  setFormData((prev) => ({
    ...prev,
    merchantId: merchant,
  }));
}, [merchant]);



  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'categoryId') {
      setFormData((prev) => ({
        ...prev,
        subCategoryId: '',
        subSubCategoryId: '',
      }));
    }
    if (name === 'subCategoryId') {
      setFormData((prev) => ({
        ...prev,
        subSubCategoryId: '',
      }));
    }
  };

  const handleAddFeature = () => {
    if (newFeature.key.trim() && newFeature.value.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: {
          ...prev.features,
          [newFeature.key.trim()]: newFeature.value.trim(),
        },
      }));
      setNewFeature({ key: '', value: '' });
      setShowFeatureForm(false);
    }
  };

  const handleRemoveFeature = (key) => {
    setFormData((prev) => {
      const updatedFeatures = { ...prev.features };
      delete updatedFeatures[key];
      return {
        ...prev,
        features: updatedFeatures,
      };
    });
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage('');
  try {
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };
    const response = await addBaseProduct(payload);

    console.log(response.product,'response.product');
    

    if (response && response.product) {
      setCreatedProductId(response.product._id);
      setShowAddVariant(true); // ✅ Only here we enable AddVariant
    }

    setMessage('Product created successfully!');
    setMessageType('success');

    setFormData({
      name: '',
      brandId: '',
      categoryId: '',
      subCategoryId: '',
      subSubCategoryId: '',
      gender: 'unisex',
      description: '',
      features: {},
      tags: '',
      merchantId: merchant || '',
      isTriable: true,
      isActive: true,
    });
  } catch (err) {
    setMessage(err.message || 'Failed to create product');
    setMessageType('error');
  } finally {
    setLoading(false);
  }
};





  const renderCategoryOptions = (level) => {
    if (level === 0) {
      return categories
        .filter((cat) => cat.level === 0 && cat.isActive)
        .map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ));
    } else if (level === 1) {
      return categories
        .filter((cat) => cat.level === 1 && cat.parentId === formData.categoryId && cat.isActive)
        .map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ));
    } else if (level === 2) {
      return categories
        .filter((cat) => cat.level === 2 && cat.parentId === formData.subCategoryId && cat.isActive)
        .map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ));
    }
  };

  console.log(merchant,'merchantmerchant');
  

  return (
    <>
    <div className="products-page">
      <div className="products-container">
        <div className="products-card">
          <div className="products-header">
            <h1>Add New Product</h1>
            <p>
              Create a new product for:
              <span>{merchantDetails || 'Your Store'}</span>
            </p>
            <p className="products-field-note">
              Fill out all the required fields to publish your product.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="products-form">
            <div className="form-group">
              <label>
                Product Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                Brand <span className="required">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  name="brandId"
                  value={formData.brandId}
                  onChange={handleChange}
                  required
                  disabled={brandsLoading}
                >
                  <option value="">
                    {brandsLoading ? "Loading Brands..." : "Select Brand"}
                  </option>
                  {brands.map(brand => (
                    <option key={brand._id} value={brand._id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-icon" />
              </div>
              <p className="field-help">
                Brand is fetched from your account
              </p>
            </div>


            <div className="form-group">
              <label>
                Product Categories <span className="required">*</span>
              </label>
              <div className="categories-row">
                <div>
                  <label>
                    Main Category <span className="required">*</span>
                  </label>
                  <div className="select-wrapper">
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {renderCategoryOptions(0)}
                    </select>
                    <ChevronDown className="select-icon" />
                  </div>
                </div>
                <div>
                  <label>Sub Category</label>
                  <div className="select-wrapper">
                    <select
                      name="subCategoryId"
                      value={formData.subCategoryId}
                      onChange={handleChange}
                      disabled={!formData.categoryId}
                    >
                      <option value="">Select Sub Category</option>
                      {renderCategoryOptions(1)}
                    </select>
                    <ChevronDown className="select-icon" />
                  </div>
                </div>
                <div>
                  <label>Sub-Sub Category</label>
                  <div className="select-wrapper">
                    <select
                      name="subSubCategoryId"
                      value={formData.subSubCategoryId}
                      onChange={handleChange}
                      disabled={!formData.subCategoryId}
                    >
                      <option value="">Select Sub-Sub Category</option>
                      {renderCategoryOptions(2)}
                    </select>
                    <ChevronDown className="select-icon" />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Gender Target</label>
              <div className="select-wrapper">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="unisex">Unisex</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                  <option value="babies">Babies</option>
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Product details, fabric, use-case etc."
                value={formData.description}
                onChange={handleChange}
                rows={5}
              />
            </div>

            <div className="form-group">
              <div className="flex-between mb-4">
                <div>
                  <label>Product Features</label>
                  <p className="field-help">
                    E.g. Material: Cotton, Color: Blue, etc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFeatureForm(!showFeatureForm)}
                  className="add-feature-btn"
                >
                  <Plus size={16} />
                  Add Feature
                </button>
              </div>
              {Object.entries(formData.features).length > 0 && (
                <div className="features-list">
                  {Object.entries(formData.features).map(([key, value]) => (
                    <div key={key} className="feature-item">
                      <span className="feature-key">{key}:</span>
                      <span className="feature-val">{value}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(key)}
                        className="feature-remove"
                        title={`Remove ${key}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showFeatureForm && (
                <div className="feature-form">
                  <div>
                    <label>Feature Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Material"
                      value={newFeature.key}
                      onChange={(e) =>
                        setNewFeature((prev) => ({
                          ...prev,
                          key: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label>Feature Value</label>
                    <input
                      type="text"
                      placeholder="e.g., Cotton"
                      value={newFeature.value}
                      onChange={(e) =>
                        setNewFeature((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="feature-form-actions">
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      disabled={
                        !newFeature.key.trim() || !newFeature.value.trim()
                      }
                      className="primary-btn"
                    >
                      Add Feature
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFeatureForm(false);
                        setNewFeature({ key: '', value: '' });
                      }}
                      className="secondary-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Tags</label>
              <input
                type="text"
                name="tags"
                placeholder="e.g., summer, casual, bestseller"
                value={formData.tags}
                onChange={handleChange}
              />
              <p className="field-help">
                Separate tags by comma
              </p>
              {formData.tags && (
                <div className="tags-list">
                  {formData.tags
                    .split(',')
                    .map((tag, idx) =>
                      tag.trim() ? (
                        <span key={idx} className="tag-item">
                          {tag.trim()}
                        </span>
                      ) : null
                    )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Product Settings</label>
              <div className="settings-row">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="isTriable"
                    name="isTriable"
                    checked={formData.isTriable}
                    onChange={handleChange}
                  />
                  <label htmlFor="isTriable">
                    Trial and Buy
                    <span className="field-help">Enable try-before-buy option</span>
                  </label>
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <label htmlFor="isActive">
                    Is Active
                    <span className="field-help">Make this product visible on store</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group submit-group">
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || !formData.categoryId}
                className="submit-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="loader" />
                    Creating Product...
                  </>
                ) : (
                  'Create Product'
                )}
              </button>
              <p className="field-help center">
                * Required fields must be filled to create the product
              </p>
            </div>
          </form>

          {message && (
            <div
              className={`message-box ${messageType === 'success' ? 'success' : 'error'}`}
            >
              {messageType === 'success' ? (
                <CheckCircle className="icon" />
              ) : (
                <AlertTriangle className="icon" />
              )}
              <div>
                <span>
                  {messageType === 'success' ? 'Success!' : 'Error'}
                </span>
                <p>{message} ADD VARINNT BELOW ↓</p>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>

{showAddVariant && createdProductId && (
  <div className="variant-form-wrapper">
    <div className="variant-form-container">
      <VariantForm
        productId={createdProductId}
        onSubmit={(updatedProduct) => {
          console.log("✅ Variant added:", updatedProduct);
          setShowAddVariant(false);
        }}
        onCancel={() => setShowAddVariant(false)}
        selectedVariantIndex={0}
      />
    </div>
  </div>
)}

          {/* <AddBrandPage/> */}
          </>
  );
};

export default AddNewProduct;
