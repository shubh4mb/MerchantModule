// src/api/auth.ts
import axiosInstance from '../utils/axiosInstance';

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const saveToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const clearToken = (): void => {
  localStorage.removeItem('token');
};

// 📧 Send OTP to email
export const sendEmailOtp = async (data: { email: string }) => {
  const res = await axiosInstance.post('merchant/auth/send-email-otp', data);
  console.log(data,'email');
  
  return res.data;
};

// 📧 Verify OTP
export const verifyEmailOtp = async (data: { email: string; otp: string }) => {
  const res = await axiosInstance.post('merchant/auth/verify-email-otp', data);
  return res.data;
};

// // ===== AUTH API CALLS =====
// // api/auth.ts
export const registerEmail = async (data: { email: string }) => {
  const res = await axiosInstance.post("merchant/register-email", data);
  return res.data;
};

// // 📱 Phone Registration
// export const registerPhone = async (data: { phoneNumber: string }) => {
//   const res = await axiosInstance.post("merchant/register-phone", data);
//   return res.data;
// };


// export const getMerchantByEmail = async (email: string) => {
//   try {
//     const res = await axiosInstance.get(`merchant/getMerchantByEmail/${email}`);
//     return res.data; // { success: true, merchant: { ... } }
//   } catch (error: any) {
//     console.error('Failed to fetch merchant by email:', error.response?.data || error.message);
//     return { success: false, merchant: null };
//   }
// };

export const getMerchantById = async () => {
  try {
    const res = await axiosInstance.get('merchant/getMerchant')
    return res.data.merchant; // return only merchant object
  } catch (error) {
    console.error("Error fetching merchant:", error);
    throw error.response?.data || { message: "Failed to fetch merchant" };
  }
};


export const updateMerchantShopDetails = async (merchantId: string, data: any) => {
  try {
    const response = await axiosInstance.put(
      `merchant/${merchantId}/shop-details`,
      data,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating shop details:", error.response?.data || error.message);
    throw error;
  }
};

export const updateMerchantBankDetails = async (merchantId: string, data: any) => {
  try {
    const res = await axiosInstance.put(`/merchant/${merchantId}/bank-details`, data);
    return res.data;
  } catch (error: any) {
    console.error("Error updating bank details:", error.response?.data || error.message);
    throw error.response?.data || { message: "Failed to update bank details" };
  }
};

export const updateMerchantOperatingHours = async (merchantId: string, data: any) => {
  try {
    const res = await axiosInstance.put(`merchant/${merchantId}/operating-hours`, data);
    return res.data;
  } catch (error: any) {
    console.error("Error updating operating hours:", error.response?.data || error.message);
    throw error.response?.data || { message: "Failed to update operating hours" };
  }
};

export const activateMerchant = async (merchantId: string) => {
  try {
    const res = await axiosInstance.put(`merchant/${merchantId}/activate`);
    return res.data;
  } catch (error: any) {
    console.error("Error activating merchant:", error.response?.data || error.message);
    throw error.response?.data || { message: "Failed to activate merchant" };
  }
};


export const login = async (email: string, password: string) => {
  // console.log('resresresresresres');


  const res = await axiosInstance.post('merchant/login', { 
    identifier: email,
    password 
  });

  console.log(res,'resresresresresres');
  

  // No manual localStorage here!
  return {
    merchant: res.data?.merchant,
    token: res.data?.token
  };
};
