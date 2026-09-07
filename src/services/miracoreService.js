import API from '../Api';
import { getRequest, postRequest, putRequest } from '../ApiFunction';

export const listMiracoreTenants = (params = {}) =>
  getRequest(API.MIRACORE_TENANTS, { params }).then((r) => r.data);

export const getMiracoreTenant = (tenantId) =>
  getRequest(API.miracoreTenant(tenantId)).then((r) => r.data);

export const createMiracoreTenant = (payload) =>
  postRequest(API.MIRACORE_TENANTS, payload).then((r) => r.data);

export const updateMiracoreTenant = (tenantId, payload) =>
  putRequest(API.miracoreTenant(tenantId), payload).then((r) => r.data);

export const provisionMiracoreTenant = (tenantId) =>
  postRequest(API.miracoreProvision(tenantId), {}).then((r) => r.data);

export const bootstrapMiracoreTenant = (tenantId, payload) =>
  postRequest(API.miracoreBootstrap(tenantId), payload).then((r) => r.data);

export const activateMiracoreTenant = (tenantId) =>
  postRequest(API.miracoreActivate(tenantId), {}).then((r) => r.data);

// Returns { tenantId, wasRenamed } — tenantId is the requested slug if free,
// otherwise the next available variant (slug2, slug3, ...).
export const checkMiracoreTenantId = (slug) =>
  getRequest(API.MIRACORE_CHECK_TENANT_ID, { params: { slug } }).then((r) => r.data);
