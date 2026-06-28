import API from '../Api';
import { getRequest } from '../ApiFunction';

export const getDashboardOverview = (params = {}) =>
  getRequest(API.DASHBOARD_OVERVIEW, { params }).then((r) => r.data);

export const getDashboardActivity = (params = {}) =>
  getRequest(API.DASHBOARD_ACTIVITY, { params }).then((r) => r.data);

export const getDashboardMessages = () =>
  getRequest(API.DASHBOARD_MESSAGES).then((r) => r.data);

export const getAuditLogs = (params = {}) =>
  getRequest(API.AUDIT_LOGS, { params }).then((r) => r.data);

export const getAuditStats = () =>
  getRequest(API.AUDIT_STATS).then((r) => r.data);
