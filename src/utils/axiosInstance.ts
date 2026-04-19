import axios from 'axios';
const backend_url = import.meta.env.VITE_BACKEND_URL
const axiosInstance = axios.create({
  // baseURL: 'http://192.168.0.106:5000/api', // no trailing slash
  baseURL: `${backend_url}/api`, // no trailing slash
  timeout: 30000,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') as string;

    if (token) {
      // ✅ Correct usage
      config.headers.Authorization = `Bearer ${token}`;
      // Or if your backend does not need "Bearer":
      // config.headers.Authorization = token;
      config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    // Only unwrap if it looks like an ApiResponse
    if (response.data?.success !== undefined && response.data?.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Wait, let's avoid intercepting the /login or /refresh endpoints to prevent loops
    if (error.response?.status === 401 && !originalRequest._retry && window.location.pathname !== '/merchant/login') {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return axiosInstance(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // We use plain axios here so we don't trigger the interceptors on refresh failure
        const res = await axios.post(`${backend_url}/api/merchant/auth/refresh`, {}, { withCredentials: true });
        
        const token = res.data?.token || res.data?.data?.token;

        if (token) {
          localStorage.setItem('token', token);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
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
        window.location.href = '/merchant/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

