import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrf = document.cookie
    .split('; ')
    .find((row) => row.startsWith('af_csrf='))
    ?.split('=')[1];
  if (csrf) config.headers['x-csrf-token'] = csrf;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      refreshing = refreshing || api.post('/auth/refresh');
      try {
        await refreshing;
        refreshing = null;
        return api(original);
      } catch (e) {
        refreshing = null;
        throw e;
      }
    }
    throw error;
  }
);

export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number(n) || 0
  );
