import axios from 'axios';

const axiosInstance = axios.create({
  // baseURL: 'http://192.168.0.106:5000/api', // no trailing slash
  baseURL: 'http://192.168.29.18:5000/api', // no trailing slash
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') as string;
    if (token) {
      // ✅ Correct usage
      config.headers.Authorization = `Bearer ${token}`;
      // Or if your backend does not need "Bearer":
      // config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
