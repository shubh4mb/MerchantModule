import axiosInstance from '../utils/axiosInstance';

/**
 * Get all courier orders for the logged-in merchant
 */
export const getCourierOrders = async () => {
  try {
    const res = await axiosInstance.get('/merchant/courier/getAllOrders');
    return res.data.orders;
  } catch (error: any) {
    console.error('Failed to fetch courier orders:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Update courier order status
 */
export const updateCourierOrderStatus = async (orderId: string, status: string) => {
  try {
    const res = await axiosInstance.patch(`/merchant/courier/order/${orderId}/status`, { status });
    return res.data;
  } catch (error: any) {
    console.error('Failed to update courier order status:', error.response?.data || error.message);
    throw error;
  }
};
