import axiosInstance from '../utils/axiosInstance'

export interface BrandPayload {
  name: string;
  description: string;
  logo?: File | null;
  createdByType: 'Merchant' | 'Admin';
  createdById: string;
}

export const addBaseProduct = async (productData) => {
    try {
        const response = await axiosInstance.post('merchant/addBaseProduct', productData);
        console.log(response,'responseresponseresponseresponseresponse');    
        return response.data;
    } catch (error) {
        if (error.response?.data?.errors?.length) {
          // Throw the first validation error as a string
          throw new Error(error.response.data.errors[0].message);
        } else if (error.response?.data?.message) {
          // Generic backend error message
          throw new Error(error.response.data.message);
        } else {
          throw new Error('Network or unknown error occurred.');
        }
      }
};

export const deleteProduct = async (productId) => {
  try {
    const response = await axiosInstance.delete(`merchant/deleteProduct/${productId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting product:", error.response?.data || error.message);
    throw error;
  }
};

export const getCategories = async () => {

  try {
    const response = await axiosInstance.get('/merchant/getCategories');
    // console.log(response.data,'responsere33333333xsponse');

    return response.data;
  } catch (error) {
    console.log(error)
    throw error.response ? error.response.data : new Error('Network Error');
  }
};


export interface AddBrandResponse {
  brand: {
    _id: string;
    name: string;
    description: string;
    logo: {
      public_id: string;
      url: string;
    } | null;
    createdByType: 'Merchant' | 'Admin';
    createdById: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    // add further fields as required
  };
}

export const addBrand = async (
  brand: BrandPayload
): Promise<AddBrandResponse> => {
  try {
    const formData = new FormData();
    formData.append('name', brand.name);
    formData.append('description', brand.description);
    formData.append('createdByType', brand.createdByType);
    formData.append('createdById', brand.createdById);
    if (brand.logo) {
      formData.append('logo', brand.logo);
    }

    const response = await axiosInstance.post<AddBrandResponse>(
      '/merchant/brand/add',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error adding brand:', error);
    throw error;
  }
};

export const getBrands = async (merchantId) => {
  try {
          console.log('Merchant ID passed to getBrands:', merchantId);

    const response = await axiosInstance.get(`/merchant/brand/get?merchantId=${merchantId}`);
    return response.data;
  } catch (error) {
    console.error("Error getting brands:", error);
    throw error;
  }
};

export const deleteBrand = async (merchantId, brandId) => {
  try {
    const response = await axiosInstance.delete(`/merchant/brand/deleteBrand`, {
      params: { merchantId, brandId }
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting brand:", error);
    throw error;
  }
};

export const addVariant = async (productId, formData) => {
  try {
    console.log("📤 Sending formData to backend...");
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }

    const response = await axiosInstance.post(
      `merchant/addVariant/${productId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.data?.errors?.length) {
      throw new Error(error.response.data.errors[0].message);
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Network or unknown error occurred.");
    }
  }
};

export const deleteVariant = async (productId, variantId) => {
  try {
    const response = await axiosInstance.delete(`merchant/deleteVariant/${productId}/${variantId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting variant:", error.response?.data || error.message);
    throw error;
  }
};

export const updateVariant = async (productId, variantId, formData) => {
  try {
    const res = await axiosInstance.put(
      `merchant/updateVariant/${productId}/${variantId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Update failed");
  }
};

export const updateSize = async (productId, variantId, sizeData) => {
  const { sizeId, size, stock } = sizeData;

  console.log(productId, variantId, sizeData);
  

  try {
    const url = sizeId
      ? `merchant/updateStock/${productId}/${variantId}/${sizeId}`
      : `merchant/updateStock/${productId}/${variantId}`;

    const res = await axiosInstance.put(url, { size, stock });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Stock update failed");
  }
};

export const updateSizeCount = async (productId, variantId, sizeData) => {

  console.log(productId, variantId, sizeData);
  
  const { sizeId, stock } = sizeData;

  console.log(productId, variantId, sizeData);
  
  // Validate required parameters
  if (!sizeId) {
    throw new Error("Size ID is required for stock updates");
  }

  try {
    // ✅ Always use sizeId in URL since it's now required
    const url = `merchant/updateStock/${productId}/${variantId}/${sizeId}`;

    // ✅ Only send stock in request body
    const res = await axiosInstance.put(url, { stock });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Stock update failed");
  }
};

export const updatePrice = async (productId, variantId, priceData) => {
  const { mrp, price, discount } = priceData;

  console.log(productId, variantId, priceData);

  try {
    const url = `merchant/updatePrice/${productId}/${variantId}`;
    const res = await axiosInstance.put(url, { mrp, price, discount });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Price update failed");
  }
};

export const deleteVariantSizes = async (productId, variantId, sizeId) => {
  console.log(productId, variantId, sizeId);
  
  try {
    const res = await axiosInstance.delete(
      `/merchant/deleteSizes/${productId}/${variantId}/${sizeId}`
    );
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to delete size");
  }
};

export const getBaseProductById = async (productId) => {
    try {
        const response = await axiosInstance.get(`merchant/getBaseProductById/${productId}`);
        return response.data;
    } catch (error) {
        console.log(error)
        throw error.response ? error.response.data : new Error('Network Error');
    }
}

export const fetchProductsByMerchantId = async (merchantId) => {

  
  try {
    const res = await axiosInstance.get(
      `merchant/fetchProductsByMerchantId/${merchantId}`
    );

  console.log(res,'res.data');

    // console.log("Fetched products:", res.data); // ✅ actual data
    return res.data;  // axios automatically parses JSON
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const uploadImage = async (file, productId, variantIndex) => {
  const formData = new FormData();
  formData.append("images", file);          // must match multer field
  formData.append("productId", productId);
  formData.append("variantIndex", variantIndex);

  console.log("📤 Uploading file:", file.name, file.type, file.size);

  try {
    const response = await axiosInstance.post(
      "/merchant/upload/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data; // axios already parses JSON
  } catch (error) {
    console.error("❌ Upload failed:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || "Failed to upload image"
    );
  }
};

export const deleteImage = async (imageId) => {
  const { data } = await axiosInstance.delete(`merchant/deleteImage/${imageId}`);
  return data;
};

export const saveProductDetails = async (productId, productData) => {

  console.log(productId, productData,'productId, productDataproductId, productData');
  
    try {
        const response = await axiosInstance.put(`merchant/products/${productId}/details`, productData); 
        return response.data;
    } catch (error) {
        if (error.response?.data?.errors?.length) {
            throw new Error(error.response.data.errors[0].message);
        } else if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        } else {
            throw new Error('Network or unknown error occurred.');
        }
    }
};





  