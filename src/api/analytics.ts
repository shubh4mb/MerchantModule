import axiosInstance from '../utils/axiosInstance';

export const getMerchantAnalytics = async (startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await axiosInstance.get(`merchant/analytics?${params.toString()}`);
  return res.data;
};

export const getMerchantWallet = async () => {
  const res = await axiosInstance.get('merchant/wallet');
  return res.data;
};

export const getMerchantCurrentWeek = async () => {
  const res = await axiosInstance.get('merchant/earnings/current-week');
  return res.data;
};

export const getMerchantPayoutHistory = async (page = 1, limit = 10) => {
  const res = await axiosInstance.get(`merchant/earnings/history?page=${page}&limit=${limit}`);
  return res.data;
};
