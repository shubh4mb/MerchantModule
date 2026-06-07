import axiosInstance from '../utils/axiosInstance';

export interface ZipCoverOrder {
  _id: string;
  merchantId: string;
  quantities: {
    small: number;
    medium: number;
    large: number;
  };
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export const createZipCoverOrder = async (
  small: number,
  medium: number,
  large: number
): Promise<ZipCoverOrder> => {
  const response = await axiosInstance.post('/merchant/zip-covers/order', { small, medium, large });
  return response.data.order;
};

export const getMyZipCoverOrders = async (): Promise<ZipCoverOrder[]> => {
  const response = await axiosInstance.get('/merchant/zip-covers');
  return response.data.orders;
};
