/**
 * FSP tenant roles and default permissions (mirrors Ess-Backend/src/models/TenantUser.js).
 */
export const TENANT_ROLES = [
  'tenant_admin',
  'operations_manager',
  'finance_officer',
  'support_staff',
];

export const ROLE_LABELS = {
  tenant_admin: 'Tenant admin',
  operations_manager: 'Operations manager',
  finance_officer: 'Finance officer',
  support_staff: 'Support staff',
};

export const ROLE_DESCRIPTIONS = {
  tenant_admin: 'FSP IT / head of operations — settings, users, API keys, audit',
  operations_manager: 'Loan operations — loans, ESS messages, dashboard',
  finance_officer: 'Finance and reporting — loans, repayments, reports',
  support_staff: 'Customer support — read loans, messages, notifications',
};

// Mirrors backend/src/models/TenantUser.js's ROLE_PERMISSIONS exactly - keep in sync by
// hand (no shared package between frontend/backend). Previously drifted (was missing
// messages:trigger, messages:trigger_sensitive, products:submit) - found and fixed while
// building the permission editor below.
export const ROLE_PERMISSIONS = {
  tenant_admin: [
    'tenant:read',
    'tenant:update',
    'users:manage',
    'api_keys:manage',
    'dashboard:read',
    'audit:read',
    'messages:trigger',
    'messages:trigger_sensitive',
    'products:submit',
  ],
  operations_manager: [
    'loans:read',
    'loans:operate',
    'messages:read',
    'messages:operate',
    'messages:trigger',
    'products:submit',
    'dashboard:read',
  ],
  finance_officer: [
    'loans:read',
    'repayments:read',
    'dashboard:read',
    'reports:read',
  ],
  support_staff: [
    'loans:read',
    'messages:read',
    'notifications:read',
  ],
};

export const PERMISSION_DESCRIPTIONS = {
  'tenant:read': 'View FSP profile, MIFOS status, certificates',
  'tenant:update': 'Edit profile, MIFOS config, certificates, products',
  'users:manage': 'Invite and manage FSP staff',
  'api_keys:manage': 'Create, rotate, revoke integration API keys',
  'dashboard:read': 'View dashboard KPIs and charts',
  'audit:read': 'View tenant audit trail',
  'loans:read': 'View loan applications and statuses',
  'loans:operate': 'Loan operational actions (e.g. disbursement notifications)',
  'messages:read': 'View ESS message logs and pending responses',
  'messages:operate': 'Resend and manage message workflows',
  'messages:trigger': 'Send outgoing ESS messages and loan-status requests',
  'messages:trigger_sensitive': 'Send sensitive messages (e.g. loan liquidation notifications)',
  'products:submit': 'Submit loan products for approval',
  'repayments:read': 'View repayment schedules and status',
  'reports:read': 'Access financial and operational reports',
  'notifications:read': 'View notification templates and delivery status',
};

/** Union of all permissions across roles, stable order for matrix rows. */
export const ALL_PERMISSIONS = [
  'tenant:read',
  'tenant:update',
  'users:manage',
  'api_keys:manage',
  'dashboard:read',
  'audit:read',
  'loans:read',
  'loans:operate',
  'messages:read',
  'messages:operate',
  'messages:trigger',
  'messages:trigger_sensitive',
  'products:submit',
  'repayments:read',
  'reports:read',
  'notifications:read',
];

// Same set as ALL_PERMISSIONS - the permission editor uses this name to make explicit that
// these are the only strings the backend will accept (backend/src/models/TenantUser.js's
// ASSIGNABLE_PERMISSIONS, enforced server-side by Joi). Deliberately excludes reporting:read
// / reporting:all_tenants: those are API-key-only grants (see routes/reporting.js), never
// assignable to a human tenant user, on any role, through this UI.
export const ASSIGNABLE_PERMISSIONS = ALL_PERMISSIONS;

export function roleHasPermission(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}
