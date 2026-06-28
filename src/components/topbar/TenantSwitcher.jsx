import React, { useState } from 'react';
import {
  FormControl, Select, MenuItem, InputLabel, Box, Typography,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useActiveTenant } from '../../hooks/useActiveTenant';
import { setAuthSession } from '../../slice/authSlice';

export default function TenantSwitcher() {
  const dispatch = useDispatch();
  const { activeTenant, memberships, switchTenant } = useActiveTenant();
  const [loading, setLoading] = useState(false);

  if (!memberships.length && !activeTenant) return null;

  const options = memberships.length
    ? memberships
    : activeTenant
      ? [{ tenantId: activeTenant.tenantId, tenantName: activeTenant.fspName, fspCode: activeTenant.fspCode }]
      : [];

  if (options.length <= 1 && !activeTenant) return null;

  const handleChange = async (e) => {
    const tenantId = e.target.value;
    if (!tenantId || tenantId === activeTenant?.tenantId) return;
    setLoading(true);
    try {
      const session = await switchTenant(tenantId);
      dispatch(setAuthSession({
        token: session.token,
        refreshToken: session.refreshToken,
        activeTenant: session.activeTenant,
        permissions: session.permissions,
        authContext: session.authContext,
      }));
      toast.success(`Switched to ${session.activeTenant?.fspName || tenantId}`);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mr: 2, minWidth: 180 }}>
      {options.length > 1 ? (
        <FormControl size="small" fullWidth disabled={loading}>
          <InputLabel id="tenant-switcher-label">FSP</InputLabel>
          <Select
            labelId="tenant-switcher-label"
            label="FSP"
            value={activeTenant?.tenantId || ''}
            onChange={handleChange}
          >
            {options.map((m) => (
              <MenuItem key={m.tenantId} value={m.tenantId}>
                {m.tenantName || m.tenantId}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <Typography variant="body2" sx={{ color: '#fff' }}>
          {activeTenant?.fspName || activeTenant?.tenantId || 'Platform'}
        </Typography>
      )}
    </Box>
  );
}
