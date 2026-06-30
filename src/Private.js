import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePermissions } from './hooks/usePermissions';

const ROUTE_PERMISSIONS = {
  '/users': 'users:manage',
  '/settings': 'tenant:read',
  '/settings/api-keys': 'api_keys:manage',
  '/settings/mifos': 'tenant:update',
  '/settings/certificates': 'tenant:update',
  '/audit': 'audit:read',
  '/onboarding': null,
  '/tenants': null,
};

function Private() {
  const auth = localStorage.getItem('adminToken');
  const location = useLocation();
  const { can, isPlatformAdmin } = usePermissions();

  if (!auth) {
    return <Navigate to="/" replace />;
  }

  const path = location.pathname;
  const matched = Object.entries(ROUTE_PERMISSIONS).find(([route]) =>
    path === route || path.startsWith(`${route}/`)
  );

  if (matched) {
    const [, permission] = matched;
    if (path.startsWith('/onboarding') || path.startsWith('/tenants')) {
      if (!isPlatformAdmin) {
        return <Navigate to="/dashboard" replace />;
      }
    } else if (permission && !can(permission)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}

export default Private;
