import axios from 'axios';
import { BASE_URL } from './Api';

const AUTH_STORAGE_KEYS = {
  token: 'adminToken',
  refreshToken: 'refreshToken',
  user: 'user',
  activeTenant: 'activeTenant',
  memberships: 'memberships',
  permissions: 'permissions',
  authContext: 'authContext',
};

const instance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let refreshQueue = [];
let onSessionRefreshed = null;

function setOnSessionRefreshed(handler) {
  onSessionRefreshed = handler;
}

function getStoredToken() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.token) || '';
}

function setAuthHeader(token) {
  if (token) {
    instance.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete instance.defaults.headers.common.Authorization;
  }
}

function setToken(newToken) {
  if (newToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.token, newToken);
    setAuthHeader(newToken);
  }
}

function clearAuthStorage() {
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  setAuthHeader('');
}

function persistAuthSession(session) {
  if (session.token) setToken(session.token);
  if (session.refreshToken) localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, session.refreshToken);
  if (session.user) localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(session.user));
  if (session.activeTenant !== undefined) {
    localStorage.setItem(AUTH_STORAGE_KEYS.activeTenant, JSON.stringify(session.activeTenant));
  }
  if (session.memberships) {
    localStorage.setItem(AUTH_STORAGE_KEYS.memberships, JSON.stringify(session.memberships));
  }
  if (session.permissions) {
    localStorage.setItem(AUTH_STORAGE_KEYS.permissions, JSON.stringify(session.permissions));
  }
  if (session.authContext) {
    localStorage.setItem(AUTH_STORAGE_KEYS.authContext, JSON.stringify(session.authContext));
  }
}

function loadStoredAuth() {
  const token = getStoredToken();
  if (token) setAuthHeader(token);
}

loadStoredAuth();

instance.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function applyRefreshedSession(data) {
  const session = {
    token: data.token,
    refreshToken: data.refreshToken,
    activeTenant: data.activeTenant,
    permissions: data.permissions,
  };

  setToken(data.token);
  if (data.refreshToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, data.refreshToken);
  }
  if (data.activeTenant !== undefined) {
    localStorage.setItem(AUTH_STORAGE_KEYS.activeTenant, JSON.stringify(data.activeTenant));
  }
  if (data.permissions) {
    localStorage.setItem(AUTH_STORAGE_KEYS.permissions, JSON.stringify(data.permissions));
    try {
      const user = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.user) || 'null');
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEYS.authContext, JSON.stringify({
          role: user.role,
          permissions: data.permissions,
          isSuperAdmin: user.role === 'super_admin',
        }));
        session.authContext = {
          role: user.role,
          permissions: data.permissions,
          isSuperAdmin: user.role === 'super_admin',
        };
      }
    } catch {
      // ignore corrupt storage
    }
  }

  onSessionRefreshed?.(session);
  return data.token;
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
  if (!refreshToken) throw new Error('No refresh token');

  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  if (!data?.success) throw new Error(data?.message || 'Refresh failed');

  return applyRefreshedSession(data.data);
}

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (original.url?.includes('/auth/login') || original.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return instance(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      refreshQueue.forEach(({ resolve }) => resolve(newToken));
      refreshQueue = [];
      original.headers.Authorization = `Bearer ${newToken}`;
      return instance(original);
    } catch (refreshError) {
      refreshQueue.forEach(({ reject }) => reject(refreshError));
      refreshQueue = [];
      clearAuthStorage();
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

const getRequest = (path, config) => instance.get(path, config);
const postRequest = (path, data, config) => instance.post(path, data, config);
const putRequest = (path, data, config) => instance.put(path, data, config);
const patchRequest = (path, data, config) => instance.patch(path, data, config);
const deleteRequest = (path, config) => instance.delete(path, config);

const uploadRequest = (path, formData, config = {}) =>
  instance.post(path, formData, {
    ...config,
    headers: { ...config.headers, 'Content-Type': 'multipart/form-data' },
  });

export {
  getRequest,
  postRequest,
  putRequest,
  patchRequest,
  deleteRequest,
  uploadRequest,
  setToken,
  clearAuthStorage,
  persistAuthSession,
  loadStoredAuth,
  setOnSessionRefreshed,
  AUTH_STORAGE_KEYS,
  instance as apiClient,
};
