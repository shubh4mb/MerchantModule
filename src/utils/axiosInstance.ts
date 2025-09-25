import axios from 'axios';
const backend_url = import.meta.env.VITE_BACKEND_URL
const axiosInstance = axios.create({
  // baseURL: 'http://192.168.0.106:5000/api', // no trailing slash
  baseURL:`${backend_url}/api`, // no trailing slash
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
        config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
