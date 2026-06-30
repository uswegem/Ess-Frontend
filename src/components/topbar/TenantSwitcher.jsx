import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, Menu, MenuItem, Box, Typography, ListItemIcon, ListItemText, Divider,
  CircularProgress,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useActiveTenant } from '../../hooks/useActiveTenant';
import { usePermissions } from '../../hooks/usePermissions';
import { setAuthSession } from '../../slice/authSlice';
import { persistAuthSession } from '../../ApiFunction';
import { listTenants } from '../../services/tenantService';

function mapTenantOption(t) {
  return {
    tenantId: t.tenantId,
    tenantName: t.tenantName || t.fspName,
    fspCode: t.fspCode,
  };
}

export default function TenantSwitcher() {
  const dispatch = useDispatch();
  const { activeTenant, memberships, switchTenant } = useActiveTenant();
  const { isPlatformAdmin } = usePermissions();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(false);
  const [platformOptions, setPlatformOptions] = useState([]);

  const loadPlatformTenants = useCallback(async () => {
    if (!isPlatformAdmin) return;
    setFetchingOptions(true);
    try {
      const result = await listTenants({ status: 'active', limit: 100 });
      const tenants = (result.data?.tenants || []).map(mapTenantOption);
      setPlatformOptions(tenants);
      persistAuthSession({ memberships: tenants });
      dispatch(setAuthSession({ memberships: tenants }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load FSP list');
    } finally {
      setFetchingOptions(false);
    }
  }, [dispatch, isPlatformAdmin]);

  useEffect(() => {
    if (isPlatformAdmin) {
      loadPlatformTenants();
    }
  }, [isPlatformAdmin, loadPlatformTenants]);

  const membershipOptions = memberships.map(mapTenantOption);
  const options = isPlatformAdmin
    ? (platformOptions.length ? platformOptions : membershipOptions)
    : membershipOptions.length
      ? membershipOptions
      : activeTenant
        ? [mapTenantOption({
          tenantId: activeTenant.tenantId,
          tenantName: activeTenant.fspName || activeTenant.tenantName,
          fspCode: activeTenant.fspCode,
        })]
        : [];

  const showSwitcher = isPlatformAdmin
    ? options.length > 0
    : options.length > 1;

  const handleOpen = async (e) => {
    setAnchorEl(e.currentTarget);
    if (isPlatformAdmin) {
      await loadPlatformTenants();
    }
  };

  const handleSelect = async (tenantId) => {
    setAnchorEl(null);
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
      toast.success(`Switched to ${session.activeTenant?.fspName || session.activeTenant?.tenantName || tenantId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!showSwitcher) {
    if (!activeTenant) return null;
    return (
      <Box sx={{ mr: 2 }}>
        <Typography variant="body2" sx={{ color: '#555', fontWeight: 500 }}>
          {activeTenant.fspName || activeTenant.tenantName || activeTenant.tenantId}
        </Typography>
      </Box>
    );
  }

  const label = activeTenant?.fspName || activeTenant?.tenantName || activeTenant?.tenantId || 'Select FSP';

  return (
    <Box sx={{ mr: 2 }}>
      <Button
        variant="outlined"
        size="small"
        disabled={loading || fetchingOptions}
        onClick={handleOpen}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          textTransform: 'none',
          color: '#2f323b',
          borderColor: 'rgba(47, 50, 59, 0.25)',
          maxWidth: 220,
          '& .MuiButton-endIcon': { ml: 0.5 },
        }}
      >
        <Typography noWrap variant="body2" sx={{ fontWeight: 600, maxWidth: 160 }}>
          {label}
        </Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { minWidth: 260, mt: 1, borderRadius: 2 },
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            Switch FSP
          </Typography>
          {fetchingOptions && <CircularProgress size={14} />}
        </Box>
        <Divider />
        {options.map((m) => {
          const selected = m.tenantId === activeTenant?.tenantId;
          return (
            <MenuItem
              key={m.tenantId}
              selected={selected}
              onClick={() => handleSelect(m.tenantId)}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {selected ? <CheckIcon fontSize="small" color="primary" /> : <BusinessIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText
                primary={m.tenantName || m.tenantId}
                secondary={m.fspCode}
                primaryTypographyProps={{ fontWeight: selected ? 600 : 400 }}
              />
            </MenuItem>
          );
        })}
        {!fetchingOptions && options.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">No active FSPs</Typography>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
