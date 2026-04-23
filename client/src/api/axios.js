import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Note: This will need to be changed for production
});

// Add a request interceptor to automatically attach the token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
