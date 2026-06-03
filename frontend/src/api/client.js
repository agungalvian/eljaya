import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ejp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Terjadi kesalahan server';
    return Promise.reject(new Error(message));
  }
);

// ─── Projects ───────────────────────────────────────────────────
export const projectsApi = {
  list: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  remove: (id) => api.delete(`/projects/${id}`),
};

// ─── Transactions ────────────────────────────────────────────────
export const transactionsApi = {
  list: (params) => api.get('/transactions', { params }),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  clearAll: (month, year) => api.delete('/transactions', { params: { month, year } }),
  importCSV: (file, month, year) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/transactions/import-csv?month=${month}&year=${year}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Period Locks ────────────────────────────────────────────────
export const periodLocksApi = {
  getStatus: (month, year) => api.get('/period-locks/status', { params: { month, year } }),
  setLockStatus: (month, year, lock) => api.post('/period-locks/lock', { month, year, lock }),
};

// ─── Debts ───────────────────────────────────────────────────────
export const debtsApi = {
  list: () => api.get('/debts'),
  create: (data) => api.post('/debts', data),
  update: (id, data) => api.put(`/debts/${id}`, data),
  remove: (id) => api.delete(`/debts/${id}`),
};

// ─── Employees ───────────────────────────────────────────────────
export const employeesApi = {
  list: (params) => api.get('/employees', { params }),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  remove: (id) => api.delete(`/employees/${id}`),
  importCSV: (file, month, year) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/employees/import-csv?month=${month}&year=${year}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Assets ──────────────────────────────────────────────────────
export const assetsApi = {
  list: () => api.get('/assets'),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  remove: (id) => api.delete(`/assets/${id}`),
};

// ─── Receipts ────────────────────────────────────────────────────
export const receiptsApi = {
  list: () => api.get('/receipts'),
  create: (data) => api.post('/receipts', data),
  remove: (id) => api.delete(`/receipts/${id}`),
};

// ─── Reports ─────────────────────────────────────────────────────
export const reportsApi = {
  summary: (params) => api.get('/reports/summary', { params }),
  profitLoss: (params) => api.get('/reports/profit-loss', { params }),
  balanceSheet: (params) => api.get('/reports/balance-sheet', { params }),
  cashflow: (params) => api.get('/reports/cashflow', { params }),
};

// ─── Auth & Users ────────────────────────────────────────────────
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const usersApi = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export default api;
