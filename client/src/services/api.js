import axios from 'axios';

// Dynamically determine the backend URL
// If running locally (localhost or LAN IP like 192.168.x.x), point to backend port 5000.
// Otherwise, use the environment variable VITE_API_URL.
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mizan_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const apiService = {
  // Authentication
  auth: {
    login: async (email, password) => {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('mizan_token', response.data.token);
        localStorage.setItem('mizan_user', JSON.stringify(response.data.user));
      }
      return response.data;
    },
    register: async (shopData) => {
      const response = await api.post('/auth/register', shopData);
      if (response.data.success) {
        localStorage.setItem('mizan_token', response.data.token);
        localStorage.setItem('mizan_user', JSON.stringify(response.data.user));
      }
      return response.data;
    },
    me: async () => {
      const response = await api.get('/auth/me');
      return response.data;
    },
    logout: () => {
      localStorage.removeItem('mizan_token');
      localStorage.removeItem('mizan_user');
      window.location.reload();
    }
  },

  // Products
  products: {
    getAll: async () => {
      const response = await api.get('/products');
      return response.data.products || [];
    },
    create: async (productData) => {
      const response = await api.post('/products', productData);
      return response.data.product;
    },
    update: async (id, productData) => {
      const response = await api.put(`/products/${id}`, productData);
      return response.data.product;
    },
    delete: async (id) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    }
  },

  // Invoices
  invoices: {
    getAll: async () => {
      const response = await api.get('/invoices');
      return response.data.invoices || [];
    },
    create: async (invoiceData) => {
      const response = await api.post('/invoices', invoiceData);
      return response.data.invoice;
    },
    update: async (id, invoiceData) => {
      const response = await api.put(`/invoices/${id}`, invoiceData);
      return response.data.invoice;
    }
  }
};

export default apiService;
