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

export const ROLE_PERMISSIONS = {
  tenant_admin: [
    'tenant:read',
    'tenant:update',
    'users:manage',
    'api_keys:manage',
    'dashboard:read',
    'audit:read',
  ],
  operations_manager: [
    'loans:read',
    'loans:operate',
    'messages:read',
    'messages:operate',
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
  'repayments:read',
  'reports:read',
  'notifications:read',
];

export function roleHasPermission(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}
