import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('queueflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch 401 unauthenticated / expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or expired
      const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isAuthRoute) {
        localStorage.removeItem('queueflow_token');
        localStorage.removeItem('queueflow_manager');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// API endpoint methods
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const queueApi = {
  getQueues: () => api.get('/queues'),
  getQueue: (queueId) => api.get(`/queues/${queueId}`),
  createQueue: (data) => api.post('/queues', data),
  updateQueue: (queueId, data) => api.patch(`/queues/${queueId}`, data),
  deleteQueue: (queueId) => api.delete(`/queues/${queueId}`),
};

export const tokenApi = {
  getTokens: (queueId, status = 'waiting') =>
    api.get(`/queues/${queueId}/tokens`, { params: { status } }),
  createToken: (queueId, data) =>
    api.post(`/queues/${queueId}/tokens`, data),
  assignNextToken: (queueId) =>
    api.post(`/queues/${queueId}/tokens/assign-next`),
  moveToken: (queueId, tokenId, direction) =>
    api.patch(`/queues/${queueId}/tokens/${tokenId}/move`, { direction }),
  cancelToken: (queueId, tokenId) =>
    api.patch(`/queues/${queueId}/tokens/${tokenId}/cancel`),
  completeToken: (queueId, tokenId) =>
    api.patch(`/queues/${queueId}/tokens/${tokenId}/complete`),
};

export const analyticsApi = {
  getKpiMetrics: (params) => api.get('/analytics', { params }),
  getQueueBreakdown: (params) => api.get('/analytics/queues', { params }),
  getHourlyArrivals: (params) => api.get('/analytics/hourly', { params }),
};

export default api;
