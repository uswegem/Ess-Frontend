import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar, Box, Divider, IconButton, Menu, MenuItem, Typography,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useDispatch, useSelector } from 'react-redux';
import { clearAuth } from '../../slice/authSlice';
import { setUser } from '../../slice/userInfo';
import { logout } from '../../services/authService';
import { usePermissions } from '../../hooks/usePermissions';

function getInitials(user) {
  const name = user?.fullName || user?.username || 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatRole(user, isPlatformAdmin) {
  if (user?.role === 'super_admin') return 'Super Admin';
  if (user?.role === 'admin') return 'Platform Admin';
  if (isPlatformAdmin) return 'Platform Admin';
  return 'User';
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

function ActionRow({ icon, label, onClick, color }) {
  return (
    <MenuItem onClick={onClick} sx={{ py: 1.25, gap: 1.5 }}>
      <Box sx={{ color: color || 'text.secondary', display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
      <Typography variant="body2" color={color || 'text.primary'}>{label}</Typography>
    </MenuItem>
  );
}

export default function UserProfileMenu() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, activeTenant } = useSelector((state) => state.auth);
  const { isPlatformAdmin } = usePermissions();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const initials = getInitials(user);
  const roleLabel = formatRole(user, isPlatformAdmin);
  const fspLabel = activeTenant?.fspName || activeTenant?.tenantName || activeTenant?.tenantId;

  const close = () => setAnchorEl(null);

  const go = (path) => {
    close();
    navigate(path);
  };

  const logoutClick = async () => {
    close();
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
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ p: 0.5 }}
        aria-label="User profile menu"
      >
        <Avatar
          sx={{
            width: 38,
            height: 38,
            bgcolor: 'primary.main',
            fontSize: '0.9rem',
            fontWeight: 700,
          }}
        >
          {initials}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 320,
            mt: 1.5,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'visible',
          },
        }}
      >
        <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: 'divider',
              color: 'text.secondary',
              fontSize: '1.1rem',
              fontWeight: 700,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {user?.fullName || user?.username || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              {roleLabel}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ px: 2.5, py: 1.5 }}>
          <InfoRow label="Active FSP" value={fspLabel} />
          <InfoRow label="FSP Code" value={activeTenant?.fspCode} />
          <InfoRow label="Phone" value={user?.phone} />
          <InfoRow label="Email" value={user?.email} />
        </Box>

        <Divider />

        <Box sx={{ py: 0.5 }}>
          <ActionRow
            icon={<PersonOutlineIcon fontSize="small" />}
            label="Profile"
            onClick={() => go('/my-profile')}
          />
          <ActionRow
            icon={<LockOutlinedIcon fontSize="small" />}
            label="Change Password"
            onClick={() => go('/change-password')}
          />
          <ActionRow
            icon={<SettingsOutlinedIcon fontSize="small" />}
            label="FSP Settings"
            onClick={() => go('/settings')}
          />
          {isPlatformAdmin && (
            <ActionRow
              icon={<BusinessOutlinedIcon fontSize="small" />}
              label="FSP Tenants"
              onClick={() => go('/tenants')}
            />
          )}
          <ActionRow
            icon={<LogoutOutlinedIcon fontSize="small" />}
            label="Logout"
            onClick={logoutClick}
            color="error.main"
          />
        </Box>
      </Menu>
    </>
  );
}
