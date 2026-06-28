import React, { useEffect } from 'react';
import './topbar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button, Menu, MenuItem } from '@mui/material';
import { Person, Key, Logout } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthSession, clearAuth } from '../../slice/authSlice';
import { setUser } from '../../slice/userInfo';
import { logout } from '../../services/authService';
import { getProfile } from '../../services/authService';
import TenantSwitcher from './TenantSwitcher';

export default function Topbar() {
  const auth = useSelector((state) => state.auth);
  const user = auth.user || {};
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const loadProfile = async () => {
      if (!localStorage.getItem('adminToken')) return;
      try {
        const profile = await getProfile();
        dispatch(setAuthSession({
          user: profile.user,
          activeTenant: profile.activeTenant,
          memberships: profile.tenants || [],
          authContext: profile.authContext,
          permissions: profile.authContext?.permissions || [],
        }));
        dispatch(setUser(profile.user));
      } catch {
        // ignore on boot
      }
    };
    loadProfile();
  }, [dispatch]);

  const logoutClick = async () => {
    try {
      await logout();
      dispatch(clearAuth());
      dispatch(setUser({}));
      navigate('/');
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="topbarWrapper">
      <div className="logoContainer">
        <span className="spanName">MiraCore</span>
      </div>
      <div className="topRight" style={{ display: 'flex', alignItems: 'center' }}>
        <TenantSwitcher />
        <Button
          id="basic-button"
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ shadow: 'none', color: '#fff' }}
        >
          {user?.fullName || user?.username || 'Admin'}
        </Button>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={() => setAnchorEl(null)}
        >
          <NavLink to="/my-profile" className="link">
            <MenuItem onClick={() => setAnchorEl(null)}>
              <Person className="menuIcons" /> Profile
            </MenuItem>
          </NavLink>
          <NavLink to="/change-password" className="link">
            <MenuItem onClick={() => setAnchorEl(null)}>
              <Key className="menuIcons" /> Change Password
            </MenuItem>
          </NavLink>
          <MenuItem onClick={logoutClick}>
            <Logout className="menuIcons" /> Logout
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
}
