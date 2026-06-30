import API from '../Api';
import {
  getRequest,
  postRequest,
  persistAuthSession,
  clearAuthStorage,
  AUTH_STORAGE_KEYS,
} from '../ApiFunction';

export async function login(credentials) {
  const { data } = await postRequest(API.LOGIN, credentials);
  if (!data.success) throw new Error(data.message || 'Login failed');

  const session = {
    token: data.data.token,
    refreshToken: data.data.refreshToken,
    user: data.data.user,
    activeTenant: data.data.activeTenant || null,
    memberships: data.data.memberships || [],
    permissions: data.data.permissions || [],
    authContext: {
      role: data.data.user?.role,
      permissions: data.data.permissions || [],
      isSuperAdmin: data.data.user?.role === 'super_admin',
    },
  };
  persistAuthSession(session);
  return session;
}

export async function selectTenant(tenantId) {
  const { data } = await postRequest(API.SELECT_TENANT, { tenantId });
  if (!data.success) throw new Error(data.message || 'Tenant switch failed');

  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEYS.user) || 'null');
  } catch {
    storedUser = null;
  }

  const session = {
    token: data.data.token,
    refreshToken: data.data.refreshToken,
    activeTenant: data.data.activeTenant,
    permissions: data.data.permissions || [],
    authContext: {
      permissions: data.data.permissions || [],
      isSuperAdmin: storedUser?.role === 'super_admin',
      role: storedUser?.role,
    },
  };
  persistAuthSession(session);
  return session;
}

export async function getProfile() {
  const { data } = await getRequest(API.PROFILE);
  if (!data.success) throw new Error(data.message || 'Profile fetch failed');
  return data.data;
}

export async function logout() {
  try {
    await postRequest(API.LOGOUT, {});
  } catch {
    // proceed with local cleanup
  }
  clearAuthStorage();
}

export async function changePassword(payload) {
  const { data } = await postRequest(API.CHANGE_PASSWORD, payload);
  if (!data.success) throw new Error(data.message || 'Password change failed');
  return data;
}
