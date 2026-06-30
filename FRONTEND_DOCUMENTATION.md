# MiraCore Ess-Frontend — Documentation (M5)

## Overview

React admin portal for multi-tenant FSP onboarding, settings, dashboard, and user management.

**Stack:** React 18, MUI, react-router v6, axios, recharts, react-hot-toast.

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `REACT_APP_API_V1_BASE_URL` | `http://localhost:3008/api/v1` | Backend REST base URL |

## Routes

| Path | Component | Permission |
|------|-----------|------------|
| `/dashboard` | Dashboard | Authenticated |
| `/tenants` | TenantsList | Platform admin |
| `/onboarding` | OnboardingWizard | Platform admin |
| `/settings` | Settings | `tenant:read` |
| `/users` | Users | `users:manage` |
| `/audit` | AuditLogs | `audit:read` |
| `/products`, `/loan` | Legacy compat screens | Authenticated |

## Services (`src/services/`)

| File | Purpose |
|------|---------|
| `authService.js` | Login, refresh, select-tenant |
| `tenantService.js` | Tenant CRUD, MIFOS config, certificates |
| `onboardingService.js` | Draft wizard, submit, review |
| `apiKeyService.js` | API key CRUD, rotate, revoke |
| `dashboardService.js` | Dashboard KPIs, activity |
| `auditLogService.js` | Audit log queries |
| `integrationService.js` | MIFOS / integration health |
| `userService.js` | Tenant user invite and roles |

## Key hooks

- `useActiveTenant` — active `tenantId` from JWT / localStorage
- `usePermissions` — RBAC `can()`, `isPlatformAdmin`

## Onboarding wizard (`src/components/OnboardingWizard/`)

Five steps: Organization → MIFOS → API Keys & Certificates → Review → Submit. Success screen shown after submit.

## Performance (`src/utils/performance.js`)

- `debounce` — filter inputs
- `getCached` / `setCached` — short TTL API cache (dashboard)
- Lazy-loaded routes in `src/routes.js`

## Tests

```bash
npm run test:integration
npm run build
```

## Related docs

- User guide: `client documents/milestone 5 submission/USER_GUIDE.md`
- Deployment: `client documents/milestone 5 submission/DEPLOYMENT_GUIDE.md`
