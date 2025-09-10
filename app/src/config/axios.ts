import axios from 'axios';

const axiosInterface = axios.create({
  baseURL: `http://${process.env.NEXT_PUBLIC_SERVER_HOST}:${process.env.NEXT_PUBLIC_SERVER_PORT}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInterface.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = window.sessionStorage.getItem('jwt');
      const selectedCount = window.sessionStorage.getItem('selectedCount');
      
      if (selectedCount) {
        config.headers['X-Selected-Count'] = selectedCount;
      }
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInterface;
