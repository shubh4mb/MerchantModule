import axios from 'axios';
import mitt from 'mitt';

export const authEvents = mitt<{
  'auth:refreshed': { token: string; merchant: any };
  'auth:logout': void;
}>();

const backend_url = import.meta.env.VITE_BACKEND_URL;
const axiosInstance = axios.create({
  baseURL: `${backend_url}/api`,
  timeout: 30000,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data?.success !== undefined && response.data?.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return axiosInstance(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${backend_url}/api/merchant/auth/refresh`, {}, { withCredentials: true });
        const { token, merchant } = res.data;

        if (token) {
          localStorage.setItem('token', token);
          if (merchant) {
            localStorage.setItem('merchant', JSON.stringify(merchant));
            localStorage.setItem('merchant_id', merchant.id);
          }
          
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          authEvents.emit('auth:refreshed', { token, merchant });
          
          processQueue(null, token);
          isRefreshing = false;
          
          return axiosInstance(originalRequest);
        } else {
          throw new Error('Refresh token invalid');
        }
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        
        localStorage.removeItem('token');
        localStorage.removeItem('merchant');
        localStorage.removeItem('merchant_id');
        authEvents.emit('auth:logout');
        
        if (window.location.pathname !== '/merchant/login') {
            window.location.href = '/merchant/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;


