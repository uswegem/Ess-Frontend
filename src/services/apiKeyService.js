import API from '../Api';
import { getRequest, postRequest, deleteRequest } from '../ApiFunction';

export const listApiKeys = (tenantId) =>
  getRequest(API.tenantApiKeys(tenantId)).then((r) => r.data);

export const createApiKey = (tenantId, payload) =>
  postRequest(API.tenantApiKeys(tenantId), payload).then((r) => r.data);

export const revokeApiKey = (tenantId, keyId) =>
  deleteRequest(API.tenantApiKey(tenantId, keyId)).then((r) => r.data);

export const getApiKeyUsage = (tenantId, keyId) =>
  getRequest(API.tenantApiKeyUsage(tenantId, keyId)).then((r) => r.data);

export const rotateApiKey = (tenantId, keyId) =>
  postRequest(API.tenantApiKeyRotate(tenantId, keyId), {}).then((r) => r.data);
