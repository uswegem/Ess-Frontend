import { useSelector } from 'react-redux';

export function usePermissions() {
  const { user, permissions, authContext } = useSelector((state) => state.auth);

  const isSuperAdmin = user?.role === 'super_admin' || authContext?.isSuperAdmin;
  const isPlatformAdmin = isSuperAdmin || user?.role === 'admin';

  const can = (permission) => {
    if (isPlatformAdmin) return true;
    return (permissions || []).includes(permission);
  };

  return {
    user,
    permissions: permissions || [],
    isSuperAdmin,
    isPlatformAdmin,
    can,
  };
}

export default usePermissions;
