export const BASE_URL = process.env.REACT_APP_API_V1_BASE_URL || 'http://localhost:3008/api/v1';

const API = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  SELECT_TENANT: '/auth/select-tenant',
  PROFILE: '/auth/profile',
  CHANGE_PASSWORD: '/auth/change-password',

  // Tenants
  TENANTS: '/tenants',
  tenant: (id) => `/tenants/${id}`,
  tenantStatus: (id) => `/tenants/${id}/status`,
  tenantMifosConfig: (id) => `/tenants/${id}/mifos-config`,
  tenantMifosValidate: (id) => `/tenants/${id}/mifos-config/validate`,
  tenantIntegrationHealth: (id) => `/tenants/${id}/integration/health`,
  tenantAudit: (id) => `/tenants/${id}/audit`,
  tenantUsers: (id) => `/tenants/${id}/users`,
  tenantUser: (tenantId, userId) => `/tenants/${tenantId}/users/${userId}`,
  tenantApiKeys: (id) => `/tenants/${id}/api-keys`,
  tenantApiKey: (tenantId, keyId) => `/tenants/${tenantId}/api-keys/${keyId}`,
  tenantApiKeyUsage: (tenantId, keyId) => `/tenants/${tenantId}/api-keys/${keyId}/usage`,
  tenantApiKeyRotate: (tenantId, keyId) => `/tenants/${tenantId}/api-keys/${keyId}/rotate`,
  tenantCertificates: (id) => `/tenants/${id}/certificates`,

  // Onboarding
  ONBOARDING_DRAFTS: '/onboarding/drafts',
  onboardingDraft: (id) => `/onboarding/drafts/${id}`,
  ONBOARDING_VALIDATE_FSP: '/onboarding/validate-fsp-code',
  onboardingSubmit: (id) => `/onboarding/${id}/submit`,
  onboardingReview: (id) => `/onboarding/${id}/review`,

  // Platform users
  USERS: '/users',
  user: (id) => `/users/${id}`,

  // Products & loans
  PRODUCTS: '/products',
  product: (id) => `/products/${id}`,
  PRODUCTS_DECOMMISSION: '/products/decommission',
  productSubmit: (id) => `/products/${id}/submit`,
  ALL_PRODUCTS: '/loan/list-products',
  ALL_EMPLOYEES_LOAN: '/loan/list-employee-loan',
  loanDetail: (id) => `/loan/${id}`,

  // Dashboard & audit
  DASHBOARD_OVERVIEW: '/dashboard/overview',
  DASHBOARD_ACTIVITY: '/dashboard/activity',
  DASHBOARD_MESSAGES: '/dashboard/messages',
  MIFOS_HEALTH: '/mifos/health',
  AUDIT_LOGS: '/audit/logs',
  AUDIT_STATS: '/audit/stats',

  // Notifications & messages
  NOTIFICATIONS: '/notification/list',
  notificationRead: (id) => `/notification/read/${id}`,
  PENDING_RESPONSES: '/messages/pending-responses',
  MANUAL_OUTGOING_MESSAGE: '/outgoing-message',
  MANUAL_LOAN_STATUS_REQUEST: '/loan-status-request',
  MESSAGE_LOGS: '/messages/logs',
  messageResend: (messageId) => `/messages/${messageId}/resend`,
  suggestedMessages: (loanId) => `/loan-actions/${loanId}/suggested-messages`,
};

export default API;
