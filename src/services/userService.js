import API from '../Api';
import { getRequest, postRequest, putRequest, deleteRequest } from '../ApiFunction';

export const listTenantUsers = (tenantId) =>
  getRequest(API.tenantUsers(tenantId)).then((r) => r.data);

export const createTenantUser = (tenantId, payload) =>
  postRequest(API.tenantUsers(tenantId), payload).then((r) => r.data);

export const updateTenantUser = (tenantId, userId, payload) =>
  putRequest(API.tenantUser(tenantId, userId), payload).then((r) => r.data);

export const deactivateTenantUser = (tenantId, userId) =>
  deleteRequest(API.tenantUser(tenantId, userId)).then((r) => r.data);

export const resetTenantUserPassword = (tenantId, userId) =>
  postRequest(API.tenantUserResetPassword(tenantId, userId)).then((r) => r.data);

export const updateTenantUserPermissions = (tenantId, userId, permissions) =>
  putRequest(API.tenantUserPermissions(tenantId, userId), { permissions }).then((r) => r.data);

export const listPlatformUsers = () =>
  getRequest(API.USERS).then((r) => r.data);
