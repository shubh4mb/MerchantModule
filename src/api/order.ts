import axiosInstance from '../utils/axiosInstance'


export const getAllOrders = async () => {
  try {
      const res = await axiosInstance.get("/merchant/getAllOrders");
  return res.data.orders; // adjust depending on your backend response
  } catch (error) {
    throw error; // rethrow so caller can handle it too
  }

};


export const acceptOrRejectOrder = async (orderId: string, status: string, reason: string) => {
  try {
    // console.log("📤 Sending order update:", orderId, status);
    
    const response = await axiosInstance.put(
      `merchant/orderRequestForMerchant/${orderId}`,
      { status , reason} // 👈 send as JSON object
    );

    // console.log("✅ Order update success:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to update order:", error.response?.data || error.message);
    throw error; // rethrow so caller can handle it too
  }
};


export const fetchPlacedOrders = async () => {
  try {
    const res = await axiosInstance.get('merchant/getPlacedOrder');
    // console.log(res.data);
    
    return res.data;
  } catch (error) {
    console.error("Error fetching placed orders", error);
    throw error;
  }
};

export const packOrder = async (orderId: string) => {
  try {
    const res = await axiosInstance.post(`merchant/order/packed/${orderId}`);
    return res.data;
  } catch (error: any) {
    console.error("❌ Error packing order:", error);
    throw error.response?.data || error;
  }
};

export const getPackingPhotos = async (orderId: string) => {
  try {
    const res = await axiosInstance.get(`merchant/order/${orderId}/packing-photos`);
    return res.data;
  } catch (error) {
    console.error("Error fetching packing photos", error);
    throw error;
  }
};

export const uploadPackingPhoto = async (orderId: string, itemId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('orderId', orderId);
    formData.append('itemId', itemId);
    const res = await axiosInstance.post(`merchant/order/packing-photos/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  } catch (error) {
    console.error("Error uploading packing photo", error);
    throw error;
  }
};

export const deletePackingPhoto = async (orderId: string, photoId: string) => {
  try {
    const res = await axiosInstance.delete(`merchant/order/${orderId}/packing-photos/${photoId}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting packing photo", error);
    throw error;
  }
};
