import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer, Box, Typography, IconButton, Divider, Chip, Button,
  CircularProgress, Alert, Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getTenant, getIntegrationHealth } from '../../services/tenantService';

const STATUS_COLORS = {
  active: 'success',
  approved: 'info',
  submitted: 'warning',
  under_review: 'warning',
  suspended: 'warning',
  rejected: 'error',
  disabled: 'error',
  draft: 'default',
};

function DetailRow({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{value}</Typography>
    </Box>
  );
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

function formatAddress(address) {
  if (!address) return null;
  const parts = [address.line1, address.line2, address.city, address.region, address.country]
    .filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export default function TenantDetailDrawer({ tenantId, onClose }) {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantId) {
      setTenant(null);
      setHealth(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tenantRes, healthRes] = await Promise.all([
          getTenant(tenantId),
          getIntegrationHealth(tenantId).catch(() => null),
        ]);
        if (cancelled) return;
        setTenant(tenantRes.data?.tenant || tenantRes.data);
        setHealth(healthRes?.data || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [tenantId]);

  const open = Boolean(tenantId);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ pr: 1 }}>
            {tenant?.tenantName || 'FSP Details'}
          </Typography>
          <IconButton onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 2 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {!loading && tenant && (
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={tenant.status}
                  color={STATUS_COLORS[tenant.status] || 'default'}
                  size="small"
                />
                {tenant.mifosConfigured && (
                  <Chip label="MIFOS configured" color="success" variant="outlined" size="small" />
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Organization
                </Typography>
                <DetailRow label="Tenant ID" value={tenant.tenantId} />
                <DetailRow label="FSP Name" value={tenant.fspName} />
                <DetailRow label="FSP Code" value={tenant.fspCode} />
                <DetailRow label="Contact Person" value={tenant.contactPerson} />
                <DetailRow label="Email" value={tenant.contactEmail} />
                <DetailRow label="Phone" value={tenant.contactPhone} />
                <DetailRow label="Registration No." value={tenant.organizationRegistrationNumber} />
                <DetailRow label="Address" value={formatAddress(tenant.address)} />
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  MIFOS / CBS
                </Typography>
                <DetailRow
                  label="Mode"
                  value={health?.mifos?.mode === 'override' ? 'Override (tenant-specific)' : 'Inherit platform default'}
                />
                {health?.mifos?.baseUrl && (
                  <DetailRow label="Base URL" value={health.mifos.baseUrl} />
                )}
                {health?.mifos?.fineractTenantId && (
                  <DetailRow label="Fineract Tenant" value={health.mifos.fineractTenantId} />
                )}
                {health?.mifos && (
                  <DetailRow
                    label="Connection"
                    value={health.mifos.valid ? 'Valid' : `Invalid${health.mifos.message ? ` — ${health.mifos.message}` : ''}`}
                  />
                )}
                <DetailRow label="Last checked" value={formatDate(health?.mifos?.checkedAt)} />
                <DetailRow label="Active API keys" value={health?.apiKeys?.active} />
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Lifecycle
                </Typography>
                <DetailRow label="Submitted" value={formatDate(tenant.onboarding?.submittedAt)} />
                <DetailRow label="Reviewed" value={formatDate(tenant.onboarding?.reviewedAt)} />
                {tenant.onboarding?.rejectionReason && (
                  <DetailRow label="Rejection reason" value={tenant.onboarding.rejectionReason} />
                )}
                {tenant.metadata?.suspensionReason && (
                  <DetailRow label="Suspension reason" value={tenant.metadata.suspensionReason} />
                )}
                <DetailRow label="Created" value={formatDate(tenant.createdAt)} />
                <DetailRow label="Updated" value={formatDate(tenant.updatedAt)} />
              </Box>

              {tenant.subscription && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Subscription
                    </Typography>
                    <DetailRow label="Plan" value={tenant.subscription.plan} />
                    <DetailRow label="Monthly limit" value={tenant.subscription.monthlyLimit} />
                    <DetailRow label="Current usage" value={tenant.subscription.currentMonthUsage} />
                  </Box>
                </>
              )}

              {tenant.metadata?.notes && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2">{tenant.metadata.notes}</Typography>
                  </Box>
                </>
              )}
            </Stack>
          )}
        </Box>

        {tenant && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
            <Button fullWidth variant="outlined" onClick={onClose}>Close</Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                onClose();
                navigate(`/settings?tenantId=${tenant.tenantId}`);
              }}
            >
              Manage Settings
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

export function shouldOpenOnboarding(status) {
  return ['draft', 'submitted'].includes(status);
}
