import React, { useState, useEffect } from 'react';
import { Package, Tag, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchProductsByMerchantId, uploadImage, saveProductDetails, getBrands } from '../../api/products';
import ProductItem from './ProductItem';

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch products & brands
  useEffect(() => {
    const merchantData = localStorage.getItem('merchant_id');
    if (!merchantData) {
      console.error('No merchant data found in localStorage');
      setLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        const data = await fetchProductsByMerchantId(merchantData);
        console.log(data, 'brandsbrands.lengthbrands');
        setProducts(data || []);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadBrands = async () => {
      try {
        const data = await getBrands(merchantData);
        setBrands(data.brands || []);
        console.log(data.brands.length, '333e');
      } catch (err) {
        console.error("Failed to fetch brands:", err);
        setBrands([]);
      }
    };

    loadBrands();
    loadProducts();
  }, []);

  // Save product changes
  const saveProductChanges = async (product, tempProductData) => {
    try {
      const changedData = {};
      if (tempProductData.name !== undefined && tempProductData.name !== product.name) {
        changedData.name = tempProductData.name;
      }
      if (tempProductData.description !== undefined && tempProductData.description !== product.description) {
        changedData.description = tempProductData.description;
      }

      if (Object.keys(changedData).length > 0) {
        const productId = product._id || product.id;
        const updatedProduct = await saveProductDetails(productId, changedData);
        updateProducts(updatedProduct.product);
        return { success: true, updatedProduct };
      }

      return { success: true, updatedProduct: product };
    } catch (error) {
      console.error('Error saving product changes:', error);
      throw error;
    }
  };

  // Handle image upload
  const handleImageUpload = async (file, productId, variantIndex) => {
    try {
      const uploadedImageResponse = await uploadImage(file, productId, variantIndex);
      setProducts(prevProducts =>
        prevProducts.map(p => {
          const pId = p._id || p.id;
          return pId === productId
            ? {
                ...p,
                variants: p.variants.map((v, i) =>
                  i === variantIndex ? { ...v, images: uploadedImageResponse.images } : v
                ),
              }
            : p;
        })
      );
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Image upload failed. Please try again.");
    }
  };

  // Remove image
  const handleRemoveImage = (productId, variantIndex, imageIndex) => {
    setProducts(prevProducts =>
      prevProducts.map(product => {
        const pId = product._id || product.id;
        return pId === productId
          ? {
              ...product,
              variants: product.variants.map((variant, idx) =>
                idx === variantIndex
                  ? { ...variant, images: variant.images.filter((_, i) => i !== imageIndex) }
                  : variant
              )
            }
          : product;
      })
    );
  };

  // Delete product
  const deleteProduct = (productId) => {
    setProducts(prevProducts => 
      prevProducts.filter(product => {
        const pId = product._id || product.id;
        return pId !== productId;
      })
    );
  };

  // Update product list
  const updateProducts = (updatedProduct) => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        const productId = p._id || p.id;
        const updatedId = updatedProduct._id || updatedProduct.id;
        return productId === updatedId ? updatedProduct : p;
      })
    );
  };

  // Total stock calculation
  const getTotalStock = (variants) => {
    return variants.reduce((total, variant) =>
      total + variant.sizes.reduce((variantTotal, size) => variantTotal + size.stock, 0), 0
    );
  };

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.brand?.toLowerCase?.() || product.brandId?.name?.toLowerCase?.() || '').includes(searchTerm.toLowerCase()) ||
    (product.category?.toLowerCase?.() || product.categoryId?.name?.toLowerCase?.() || '').includes(searchTerm.toLowerCase())
  );

  const clearSearch = () => setSearchTerm('');

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading products...</div>;
  }

  return (
    <div className="!px-24 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen font-sans">
      {/* Header Section */}
      <div className="grid grid-cols-2 !gap-8 !pt-12">
        {brands.length === 0 ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl !p-8 flex items-center !gap-6 opacity-50 pointer-events-none cursor-not-allowed grayscale brightness-90 shadow-inner">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-300 text-slate-100">
              <Package size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-400 !mb-2 tracking-wide">NEW PRODUCT</h3>
              <p className="text-sm text-gray-400">You need to add a brand first</p>
            </div>
            <div className="text-2xl text-gray-400 ml-auto">→</div>
          </div>
        ) : (
          <Link 
            to="/merchant/add-product" 
            className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-2 border-transparent rounded-2xl !p-8 flex items-center !gap-6 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-blue-200 hover:from-blue-50 hover:to-blue-100 no-underline"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white transition-transform duration-300 group-hover:rotate-[10deg] group-hover:scale-110">
              <Package size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 !mb-2 tracking-wide">NEW PRODUCT</h3>
              <p className="text-sm text-slate-500">Add new items to inventory</p>
            </div>
            <div className="text-2xl text-slate-400 ml-auto transition-all duration-300 group-hover:translate-x-2 group-hover:text-slate-600">→</div>
          </Link>
        )}

        <Link 
          to="/merchant/add-brand" 
          className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-2 border-transparent rounded-2xl !p-8 flex items-center !gap-6 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-emerald-200 hover:from-emerald-50 hover:to-emerald-100 no-underline"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 text-white transition-transform duration-300 group-hover:rotate-[10deg] group-hover:scale-110">
            <Tag size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 !mb-2 tracking-wide">NEW BRAND</h3>
            <p className="text-sm text-slate-500">Register new brand</p>
          </div>
          <div className="text-2xl text-slate-400 ml-auto transition-all duration-300 group-hover:translate-x-2 group-hover:text-slate-600">→</div>
        </Link>
      </div>

      {/* Inventory Section */}
      <div className="bg-white rounded-3xl !p-8 !mt-8 shadow-xl">
        <div className="flex justify-between items-center !mb-8 !pb-4 border-b-4 border-slate-100 flex-wrap !gap-4">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-wider uppercase flex-shrink-0">INVENTORY</h2>

          {/* Search */}
          <div className={`relative w-[450px] min-w-[300px] max-w-full transition-all duration-300 ${isSearchFocused ? 'focused' : ''}`}>
            <div className={`relative flex items-center bg-gradient-to-br from-white to-slate-50 border-2 rounded-3xl shadow-md transition-all duration-400 overflow-hidden backdrop-blur-sm h-14 ${
              isSearchFocused 
                ? 'border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.08),0_8px_25px_-5px_rgba(59,130,246,0.2),0_4px_15px_-2px_rgba(0,0,0,0.1)] bg-gradient-to-br from-white to-blue-50 -translate-y-0.5' 
                : 'border-slate-200'
            }`}>
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-300 pointer-events-none z-10 ${
                isSearchFocused ? 'text-blue-500 scale-110' : ''
              }`}>
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search products by name, brand, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full !px-11 !pr-14 !py-4 border-0 bg-transparent text-base text-slate-800 outline-none font-medium transition-all duration-300 placeholder:text-slate-400 placeholder:font-normal relative z-20"
              />
              {searchTerm && (
                <button 
                  onClick={clearSearch} 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-100 border-0 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-slate-500 transition-all duration-300 shadow-sm hover:bg-red-500 hover:text-white hover:scale-110 active:scale-95 z-30"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className={`absolute -bottom-0.5 left-1/2 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-sm transition-all duration-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] -translate-x-1/2 ${
              isSearchFocused ? 'w-full' : 'w-0'
            }`}></div>
          </div>

          <div className="flex !gap-4">
            <span className="bg-gradient-to-br from-violet-100 to-violet-200 !px-5 !py-3 rounded-xl text-sm font-semibold text-violet-800 border border-violet-200 transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-lg">
              {filteredProducts.length} Products
            </span>
            <span className="bg-gradient-to-br from-amber-50 to-amber-200 !px-5 !py-3 rounded-xl text-sm font-semibold text-amber-900 border border-amber-200 transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-lg">
              {filteredProducts.reduce((total, product) => total + getTotalStock(product.variants), 0)} Total Units
            </span>
          </div>
        </div>

        <div className="flex flex-col !gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <ProductItem
                key={product._id || product.id}
                product={product}
                index={index}
                onImageUpload={handleImageUpload}
                onRemoveImage={handleRemoveImage}
                updateProducts={updateProducts}
                onDelete={deleteProduct}
                onSaveProductChanges={saveProductChanges}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center !py-16 !px-8 text-center text-slate-500">
              <Search size={48} className="!mb-4 text-slate-300 opacity-70" />
              <h3 className="text-2xl font-semibold text-slate-600 !mb-2">No products found</h3>
              <p className="text-white-500 text-sm max-w-sm">Try adjusting your search terms or add new products to your inventory.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;