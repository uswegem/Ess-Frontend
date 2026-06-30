import API from '../Api';
import { getRequest } from '../ApiFunction';

export const getIntegrationHealth = (tenantId) =>
  getRequest(API.tenantIntegrationHealth(tenantId)).then((r) => r.data);

export const getMifosPlatformHealth = () =>
  getRequest(API.MIFOS_HEALTH).then((r) => r.data);
