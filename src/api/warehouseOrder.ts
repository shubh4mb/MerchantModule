import axiosInstance from '../utils/axiosInstance';

// ── Warehouse Operator API ──

export const fetchWarehouseStats = async () => {
  const res = await axiosInstance.get('/merchant/warehouse-orders/stats');
  return res.data.stats;
};

export const fetchWarehousePlacedOrders = async () => {
  const res = await axiosInstance.get('/merchant/warehouse-orders/placed');
  return res.data.orders;
};

export const fetchAllWarehouseOrders = async (params?: {
  orderStatus?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await axiosInstance.get('/merchant/warehouse-orders/all', { params });
  return res.data;
};

export const fetchWarehouseOrderDetail = async (orderId: string) => {
  const res = await axiosInstance.get(`/merchant/warehouse-orders/${orderId}`);
  return res.data.order;
};

export const acceptWarehouseOrder = async (orderId: string) => {
  const res = await axiosInstance.patch(`/merchant/warehouse-orders/${orderId}/accept`);
  return res.data;
};

export const rejectWarehouseOrder = async (orderId: string, reason?: string) => {
  const res = await axiosInstance.patch(`/merchant/warehouse-orders/${orderId}/reject`, { reason });
  return res.data;
};

export const markWarehouseOrderPacked = async (orderId: string) => {
  const res = await axiosInstance.patch(`/merchant/warehouse-orders/${orderId}/packed`);
  return res.data;
};

export const uploadWarehousePackingPhoto = async (orderId: string, formData: FormData) => {
  const res = await axiosInstance.post(
    `/merchant/warehouse-orders/${orderId}/packing-photo`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data;
};

// ── Warehouse Operator Product Management ──

export const fetchMyWarehouseProducts = async (params?: {
  isVerified?: boolean;
  isActive?: boolean;
  gender?: string;
  page?: number;
  limit?: number;
}) => {
  const res = await axiosInstance.get('/merchant/warehouse-products', { params });
  return res.data;
};

export const addMyWarehouseProduct = async (data: any) => {
  const res = await axiosInstance.post('/merchant/warehouse-products/add', data);
  return res.data;
};

export const addMyWarehouseProductFull = async (formData: FormData) => {
  const res = await axiosInstance.post('/merchant/warehouse-products/full', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const updateMyWarehouseProduct = async (warehouseProductId: string, data: any) => {
  const res = await axiosInstance.patch(`/merchant/warehouse-products/${warehouseProductId}`, data);
  return res.data;
};

export const addMyWarehouseProductVariant = async (warehouseProductId: string, formData: FormData) => {
  const res = await axiosInstance.post(
    `/merchant/warehouse-products/${warehouseProductId}/variants`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data;
};

export const updateMyWarehouseProductStock = async (warehouseProductId: string, data: { variantId: string; size: string; stock: number }) => {
  const res = await axiosInstance.patch(`/merchant/warehouse-products/${warehouseProductId}/stock`, data);
  return res.data;
};

export const deleteMyWarehouseProduct = async (warehouseProductId: string) => {
  const res = await axiosInstance.delete(`/merchant/warehouse-products/${warehouseProductId}`);
  return res.data;
};

