import API from '../Api';
import { getRequest } from '../ApiFunction';

export const getDashboardOverview = (params = {}) =>
  getRequest(API.DASHBOARD_OVERVIEW, { params }).then((r) => r.data);

export const getDashboardActivity = (params = {}) =>
  getRequest(API.DASHBOARD_ACTIVITY, { params }).then((r) => r.data);

export const getDashboardMessages = (params = {}) =>
  getRequest(API.DASHBOARD_MESSAGES, { params }).then((r) => r.data);

export const getDashboardDetail = (metric, params = {}) =>
  getRequest(API.dashboardDetail(metric), { params }).then((r) => r.data);

// Returns the raw PDF Blob - DashboardDetail.js turns it into a browser download.
export const getDashboardDetailPdf = (metric, params = {}) =>
  getRequest(API.dashboardDetailExportPdf(metric), { params, responseType: 'blob' }).then((r) => r.data);

// Re-export audit helpers from dedicated service for backward compatibility
export { getAuditLogs, getAuditStats } from './auditLogService';
