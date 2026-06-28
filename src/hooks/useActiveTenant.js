import { useSelector, useDispatch } from 'react-redux';
import { setAuthSession } from '../slice/authSlice';
import { selectTenant as selectTenantApi } from '../services/authService';

export function useActiveTenant() {
  const dispatch = useDispatch();
  const { activeTenant, memberships } = useSelector((state) => state.auth);

  const switchTenant = async (tenantId) => {
    const session = await selectTenantApi(tenantId);
    dispatch(setAuthSession({
      token: session.token,
      refreshToken: session.refreshToken,
      activeTenant: session.activeTenant,
      permissions: session.permissions,
      authContext: session.authContext,
    }));
    return session;
  };

  return {
    activeTenant,
    memberships: memberships || [],
    tenantId: activeTenant?.tenantId || null,
    switchTenant,
  };
}

export default useActiveTenant;
