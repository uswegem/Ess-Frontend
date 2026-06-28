import { createSlice } from '@reduxjs/toolkit';
import { AUTH_STORAGE_KEYS } from '../ApiFunction';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const initialState = {
  user: readJson(AUTH_STORAGE_KEYS.user, null),
  token: localStorage.getItem(AUTH_STORAGE_KEYS.token) || null,
  refreshToken: localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken) || null,
  activeTenant: readJson(AUTH_STORAGE_KEYS.activeTenant, null),
  memberships: readJson(AUTH_STORAGE_KEYS.memberships, []),
  permissions: readJson(AUTH_STORAGE_KEYS.permissions, []),
  authContext: readJson(AUTH_STORAGE_KEYS.authContext, null),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthSession: (state, action) => {
      const {
        token,
        refreshToken,
        user,
        activeTenant,
        memberships,
        permissions,
        authContext,
      } = action.payload;
      if (token !== undefined) state.token = token;
      if (refreshToken !== undefined) state.refreshToken = refreshToken;
      if (user !== undefined) state.user = user;
      if (activeTenant !== undefined) state.activeTenant = activeTenant;
      if (memberships !== undefined) state.memberships = memberships;
      if (permissions !== undefined) state.permissions = permissions;
      if (authContext !== undefined) state.authContext = authContext;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.activeTenant = null;
      state.memberships = [];
      state.permissions = [];
      state.authContext = null;
    },
  },
});

export const { setAuthSession, clearAuth } = authSlice.actions;
export default authSlice.reducer;
