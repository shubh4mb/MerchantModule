import axiosInstance from '../utils/axiosInstance';
import type { ProductItem } from '../utils/productTypes';

export interface BrandPayload {
  name: string;
  description: string;
  logo?: File | null;
  createdByType: 'Merchant' | 'Admin';
  createdById: string;
}

export interface AddBaseProductResponse {
  message: string;
  product?: any; // Replace `any` once you define your product type
}

export const addBaseProduct = async (
  productData: any
): Promise<AddBaseProductResponse> => {
  try {
    const response = await axiosInstance.post<AddBaseProductResponse>(
      'merchant/addBaseProduct',
      productData
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.errors?.length) {
      throw new Error(error.response.data.errors[0].message);
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Network or unknown error occurred.');
    }
  }
};

export const deleteProduct = async (productId: string): Promise<any> => {
  try {
    const response = await axiosInstance.delete(
      `merchant/deleteProduct/${productId}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting product:", error.response?.data || error.message);
    throw error;
  }
};

export const getCategories = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get('/merchant/getCategories');
    return response.data;
  } catch (error: any) {
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
    if (brand.logo) formData.append('logo', brand.logo);

    const response = await axiosInstance.post<AddBrandResponse>(
      '/merchant/brand/add',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding brand:', error);
    throw error;
  }
};

export const getBrands = async (merchantId: string): Promise<any> => {
  try {
    const response = await axiosInstance.get(
      `/merchant/brand/get?merchantId=${merchantId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting brands:", error);
    throw error;
  }
};

export const deleteBrand = async (merchantId: string, brandId: string): Promise<any> => {
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



export const deleteVariant = async (productId: string, variantId: string): Promise<any> => {
  try {
    const response = await axiosInstance.delete(
      `merchant/deleteVariant/${productId}/${variantId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};


// create my updatestock size api 

export const updateStock = async (
  productId: string,
  variantId: string,
  data: any
): Promise<any> => {
  try {
    const response = await axiosInstance.patch(
      `merchant/updateMultipleVariantSizes/${productId}/${variantId}`,
      data,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Update failed");
  }
};

// delete size
export const deleteSize = async (productId: string, variantId: string, sizeId: string): Promise<any> => {
  try {
    const response = await axiosInstance.delete(
      `merchant/deleteSize/${productId}/${variantId}/${sizeId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const editProduct = async (productId: string, data: Record<string, any>): Promise<any> => {
  try {
    console.log("Sending JSON:", data);

    const response = await axiosInstance.patch(
      `merchant/editProduct/${productId}`,
      data, // ← send plain JSON
      { headers: { "Content-Type": "application/json" } }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Update failed");
  }
};

export const addVariant = async (productId: string, formData: FormData) => {
  const response = await axiosInstance.post(
    `merchant/addVariant/${productId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const updateVariant = async (
  productId: string,
  variantId: string,
  formData: FormData
) => {
  const response = await axiosInstance.patch(
    `merchant/updateVariant/${productId}/${variantId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const updatePrice = async (
  productId: string,
  variantId: string,
  priceData: { mrp: number; price: number; discount?: number }
): Promise<any> => {
  const response = await axiosInstance.put(
    `merchant/updatePrice/${productId}/${variantId}`,
    priceData
  );
  return response.data;
};



export const deleteVariantSizes = async (
  productId: string,
  variantId: string,
  sizeId: string
): Promise<any> => {
  const response = await axiosInstance.delete(
    `/merchant/deleteSizes/${productId}/${variantId}/${sizeId}`
  );
  return response.data;
};

export const getBaseProductById = async (productId: string): Promise<any> => {
  const response = await axiosInstance.get(
    `merchant/getBaseProductById/${productId}`
  );
  return response.data;
};

export const fetchProductsByMerchantId = async (
  merchantId: string
): Promise<any[]> => {
  try {
    const response = await axiosInstance.get(
      `merchant/fetchProductsByMerchantId/${merchantId}`
    );
    return response.data;
  } catch {
    return [];
  }
};

export const uploadImage = async (
  file: File,
  productId: string,
  variantIndex: number
): Promise<any> => {
  const formData = new FormData();
  formData.append("images", file);
  formData.append("productId", productId);
  formData.append("variantIndex", variantIndex.toString());

  const response = await axiosInstance.post(
    "/merchant/upload/image",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const deleteImage = async (imageId: string): Promise<any> => {
  const { data } = await axiosInstance.delete(
    `merchant/deleteImage/${imageId}`
  );
  return data;
};

export const saveProductDetails = async (
  productId: string,
  productData: any
): Promise<any> => {
  const response = await axiosInstance.put(
    `merchant/products/${productId}/details`,
    productData
  );
  return response.data;
};

export const uploadBulkProducts = async (
  products: ProductItem[],
  onProgress: (percent: number) => void
): Promise<true> => {
  const total = products.length;

  for (let i = 0; i < total; i++) {
    const formData = new FormData();
    formData.append("data", JSON.stringify(products[i].data));
    products[i].images.forEach((img) => img.file && formData.append("images", img.file));

    await axiosInstance.post("merchant/bulk-upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    onProgress(Math.round(((i + 1) / total) * 100));
  }

  return true;
};
