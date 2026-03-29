import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar Token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('goat_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const productService = {
  getAll: async () => {
    const response = await api.get('/products');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  update: async (id, productData) => {
    const response = await api.patch(`/products/${id}`, productData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  recalculateAll: async (mode, trmManual) => {
    const response = await api.post('/products/recalculate', { mode, trmManual });
    return response.data;
  }
};

export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  }
};

export const orderService = {
  getAll: async () => {
    const response = await api.get('/orders');
    return response.data;
  },
  create: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  createBatch: async (batchData) => {
    const response = await api.post('/orders/batch', batchData);
    return response.data;
  },
  updateStatus: async (id, statusData) => {
    const response = await api.patch(`/orders/${id}`, statusData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  }
};

export const reportService = {
  getDebtors: async () => {
    const response = await api.get('/reports/debtors');
    return response.data;
  }
};

export const paymentService = {
  getByOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/payments`);
    return response.data;
  },
  create: async (orderId, paymentData) => {
    const response = await api.post(`/orders/${orderId}/payments`, paymentData);
    return response.data;
  },
  delete: async (orderId, paymentId) => {
    const response = await api.delete(`/orders/${orderId}/payments/${paymentId}`);
    return response.data;
  }
};

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('goat_token', response.data.token);
    }
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('goat_token');
  }
};

export const categoryService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

export const calculationService = {
  calculatePrice: async (data) => {
    const response = await api.post('/calculate', data);
    return response.data;
  },
  calculateBatch: async (productos) => {
    const response = await api.post('/calculate/batch', { productos });
    return response.data;
  },
  getTrm: async () => {
    const response = await api.get('/calculate/trm');
    return response.data;
  },
};

export default api;
