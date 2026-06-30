import API from '../Api';
import { getRequest } from '../ApiFunction';

export const getAuditLogs = (params = {}) =>
  getRequest(API.AUDIT_LOGS, { params }).then((r) => r.data);

export const getAuditStats = () =>
  getRequest(API.AUDIT_STATS).then((r) => r.data);
