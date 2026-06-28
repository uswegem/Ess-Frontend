import Users from './pages/user/Users';
import UserDetails from './pages/user/UserDetails';
import Profile from './pages/admin/Profile';
import ChangePassword from './pages/admin/ChangePassword';
import Product from './pages/product/Product';
import Loan from './pages/loan/Loan';
import NotificationManagement from './pages/notification/NotificationManagement';
import Dashboard from './pages/dashboard/Dashboard';
import PendingResponsesManager from './pages/messages/PendingResponsesManager';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import TenantsList from './pages/tenants/TenantsList';
import Settings from './pages/settings/Settings';
import AuditLogs from './pages/audit/AuditLogs';

const routes = [
  { path: '/dashboard', Component: <Dashboard /> },
  { path: '/tenants', Component: <TenantsList /> },
  { path: '/onboarding', Component: <OnboardingWizard /> },
  { path: '/onboarding/:tenantId', Component: <OnboardingWizard /> },
  { path: '/settings', Component: <Settings /> },
  { path: '/audit', Component: <AuditLogs /> },
  { path: '/users', Component: <Users /> },
  { path: '/users/:id', Component: <UserDetails /> },
  { path: '/my-profile', Component: <Profile /> },
  { path: '/change-password', Component: <ChangePassword /> },
  { path: '/notifications', Component: <NotificationManagement /> },
  { path: '/products', Component: <Product /> },
  { path: '/loan', Component: <Loan /> },
  { path: '/messages/pending', Component: <PendingResponsesManager /> },
];

export default routes;
