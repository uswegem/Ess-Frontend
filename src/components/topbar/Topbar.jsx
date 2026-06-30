import React, { useEffect } from 'react';
import './topbar.css';
import { useDispatch } from 'react-redux';
import { setAuthSession } from '../../slice/authSlice';
import { setUser } from '../../slice/userInfo';
import { getProfile } from '../../services/authService';
import { usePermissions } from '../../hooks/usePermissions';
import TenantSwitcher from './TenantSwitcher';
import UserProfileMenu from './UserProfileMenu';

export default function Topbar() {
  const dispatch = useDispatch();
  const { isPlatformAdmin } = usePermissions();

  useEffect(() => {
    const loadProfile = async () => {
      if (!localStorage.getItem('adminToken')) return;
      try {
        const profile = await getProfile();
        const sessionUpdate = {
          user: profile.user,
          activeTenant: profile.activeTenant,
          authContext: profile.authContext,
          permissions: profile.authContext?.permissions || [],
        };
        if (!isPlatformAdmin) {
          sessionUpdate.memberships = profile.tenants || [];
        }
        dispatch(setAuthSession(sessionUpdate));
        dispatch(setUser(profile.user));
      } catch {
        // ignore on boot
      }
    };
    loadProfile();
  }, [dispatch, isPlatformAdmin]);

  return (
    <div className="topbarWrapper">
      <div className="logoContainer">
        <span className="spanName">MiraCore</span>
      </div>
      <div className="topRight" style={{ display: 'flex', alignItems: 'center' }}>
        <TenantSwitcher />
        <UserProfileMenu />
      </div>
    </div>
  );
}
