import axios from 'axios';

// Base URL — aponta para o proxy do Vite (que redireciona ao Django na porta 8000)
// Em produção, trocar por URL do Supabase/servidor real
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: adiciona token JWT em toda requisição autenticada
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: refresh automático do token quando expirar
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isLoginRequest = originalRequest.url.includes('/api/auth/login/') && !originalRequest.url.includes('/refresh/');
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${API_BASE_URL}/api/auth/login/refresh/`, {
          refresh: refreshToken,
        });

        localStorage.setItem('access_token', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// =============================================
// API Methods — mapeiam para o Django REST API
// =============================================

// Auth
export const authAPI = {
  register: (data) => api.post('/api/auth/register/', data),
  login: (data) => api.post('/api/auth/login/', data),
  refreshToken: (refresh) => api.post('/api/auth/login/refresh/', { refresh }),
  getMe: () => api.get('/api/auth/me/'),
};

// Profile
export const profileAPI = {
  getMe: () => api.get('/api/auth/profile/me/'),
  updateMe: (data) => api.put('/api/auth/profile/me/', data),
  patchMe: (data) => api.patch('/api/auth/profile/me/', data),
  updateDateOfBirth: (date_of_birth) => api.patch('/api/auth/me/', { date_of_birth }),
  uploadPhoto: (formData) =>
    api.post('/api/auth/profile/photos/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updatePhoto: (photoId, data) => api.patch(`/api/auth/profile/photos/${photoId}/`, data),
  deletePhoto: (photoId) => api.delete(`/api/auth/profile/photos/${photoId}/`),
  
  getPrompts: () => api.get('/api/auth/profile/prompts/'),
  createPrompt: (data) => api.post('/api/auth/profile/prompts/', data),
  updatePrompt: (id, data) => api.patch(`/api/auth/profile/prompts/${id}/`, data),
  deletePrompt: (id) => api.delete(`/api/auth/profile/prompts/${id}/`),
  
  changePassword: (data) => api.post('/api/auth/profile/change-password/', data),
  deleteAccount: () => api.delete('/api/auth/profile/delete-account/'),
};

// Discovery
export const discoveryAPI = {
  getFeed: () => api.get('/api/discover/feed/'),
};

// Matching
export const matchingAPI = {
  giveLike: (toUserId, isSuperLike = false) =>
    api.post('/api/matching/like/', { to_user_id: toUserId, is_super_like: isSuperLike }),
  givePass: (toUserId) => api.post('/api/matching/pass/', { to_user_id: toUserId }),
  getCurrentMatch: () => api.get('/api/matching/current/'),
  unmatch: (matchId) => api.post(`/api/matching/${matchId}/unmatch/`),
};
export default api;

// Chat
export const chatAPI = {
  getMessages: (matchId) => api.get(`/api/chat/${matchId}/messages/`),
};
