import API from '../Api';
import { getRequest, postRequest, putRequest, patchRequest, uploadRequest, deleteRequest } from '../ApiFunction';

export const listTenants = (params = {}) =>
  getRequest(API.TENANTS, { params }).then((r) => r.data);

export const getTenant = (tenantId) =>
  getRequest(API.tenant(tenantId)).then((r) => r.data);

export const createTenant = (payload) =>
  postRequest(API.TENANTS, payload).then((r) => r.data);

export const updateTenant = (tenantId, payload) =>
  putRequest(API.tenant(tenantId), payload).then((r) => r.data);

export const patchTenantStatus = (tenantId, payload) =>
  patchRequest(API.tenantStatus(tenantId), payload).then((r) => r.data);

export const saveMifosConfig = (tenantId, payload) =>
  putRequest(API.tenantMifosConfig(tenantId), payload).then((r) => r.data);

export const validateMifosConfig = (tenantId, payload = {}) =>
  postRequest(API.tenantMifosValidate(tenantId), payload).then((r) => r.data);

export const getIntegrationHealth = (tenantId) =>
  getRequest(API.tenantIntegrationHealth(tenantId)).then((r) => r.data);

export const getCertificates = (tenantId) =>
  getRequest(API.tenantCertificates(tenantId)).then((r) => r.data);

export const uploadCertificates = (tenantId, formData) =>
  uploadRequest(API.tenantCertificates(tenantId), formData).then((r) => r.data);

export const deleteCertificates = (tenantId) =>
  deleteRequest(API.tenantCertificates(tenantId)).then((r) => r.data);
