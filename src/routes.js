import { lazy } from 'react';

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const TenantsList = lazy(() => import('./pages/tenants/TenantsList'));
const OnboardingWizard = lazy(() => import('./pages/onboarding/OnboardingWizard'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const AuditLogs = lazy(() => import('./pages/audit/AuditLogs'));
const Users = lazy(() => import('./pages/user/Users'));
const UserDetails = lazy(() => import('./pages/user/UserDetails'));
const Profile = lazy(() => import('./pages/admin/Profile'));
const ChangePassword = lazy(() => import('./pages/admin/ChangePassword'));
const Product = lazy(() => import('./pages/product/Product'));
const Loan = lazy(() => import('./pages/loan/Loan'));
const NotificationManagement = lazy(() => import('./pages/notification/NotificationManagement'));
const PendingResponsesManager = lazy(() => import('./pages/messages/PendingResponsesManager'));

const routes = [
  { path: '/dashboard', Component: Dashboard },
  { path: '/tenants', Component: TenantsList },
  { path: '/onboarding', Component: OnboardingWizard },
  { path: '/onboarding/:tenantId', Component: OnboardingWizard },
  { path: '/settings', Component: Settings },
  { path: '/audit', Component: AuditLogs },
  { path: '/users', Component: Users },
  { path: '/users/:id', Component: UserDetails },
  { path: '/my-profile', Component: Profile },
  { path: '/change-password', Component: ChangePassword },
  { path: '/notifications', Component: NotificationManagement },
  { path: '/products', Component: Product },
  { path: '/loan', Component: Loan },
  { path: '/messages/pending', Component: PendingResponsesManager },
];

export default routes;
