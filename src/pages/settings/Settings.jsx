import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Tabs, Tab, TextField, Button, Paper, Typography, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import toast from 'react-hot-toast';
import { useActiveTenant } from '../../hooks/useActiveTenant';
import { usePermissions } from '../../hooks/usePermissions';
import {
  getTenant, updateTenant, saveMifosConfig, validateMifosConfig,
  getCertificates, uploadCertificates, deleteCertificates,
} from '../../services/tenantService';
import {
  listApiKeys, createApiKey, revokeApiKey, rotateApiKey,
} from '../../services/apiKeyService';
import { listTenants } from '../../services/tenantService';
import { buildMifosConfigPayload, buildMifosValidatePayload, mifosConfigFromTenant } from '../../utils/mifosConfig';
import { isApiKeyActive } from '../../utils/apiKeyUtils';

function getApiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || err?.message || fallback;
}

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseInt(searchParams.get('tab') || '0', 10);
  const { tenantId: activeTenantId } = useActiveTenant();
  const { can, isPlatformAdmin } = usePermissions();
  const [selectedTenantId, setSelectedTenantId] = useState(activeTenantId || '');
  const [tenantOptions, setTenantOptions] = useState([]);
  const [profile, setProfile] = useState({});
  const [mifos, setMifos] = useState({ mode: 'inherit_default' });
  const [keys, setKeys] = useState([]);
  const [certs, setCerts] = useState(null);
  const [keyModal, setKeyModal] = useState(null);
  const [newKeyName, setNewKeyName] = useState('Production');
  const [certFiles, setCertFiles] = useState({ publicCert: null, privateKey: null, caCert: null });
  const [certUploading, setCertUploading] = useState(false);
  const [mifosSaving, setMifosSaving] = useState(false);
  const [mifosValidating, setMifosValidating] = useState(false);
  const [keyActionLoading, setKeyActionLoading] = useState(null);

  const tenantId = selectedTenantId || activeTenantId;

  useEffect(() => {
    if (isPlatformAdmin) {
      listTenants({ limit: 100 }).then((r) => {
        setTenantOptions(r.data?.tenants || []);
      });
    }
  }, [isPlatformAdmin]);

  useEffect(() => {
    const tenantFromUrl = searchParams.get('tenantId');
    if (tenantFromUrl) {
      setSelectedTenantId(tenantFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!searchParams.get('tenantId') && activeTenantId && !selectedTenantId) {
      setSelectedTenantId(activeTenantId);
    }
  }, [activeTenantId, selectedTenantId, searchParams]);

  const loadAll = async () => {
    if (!tenantId) return;
    try {
      const t = await getTenant(tenantId);
      const data = t.data?.tenant || t.data;
      setProfile(data);
      setMifos(mifosConfigFromTenant(data.mifosConfig));
      if (can('api_keys:manage')) {
        const k = await listApiKeys(tenantId);
        setKeys(k.data?.apiKeys || k.data?.keys || []);
      }
      if (can('tenant:read')) {
        const c = await getCertificates(tenantId);
        setCerts(c.data);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  useEffect(() => { loadAll(); }, [tenantId]);

  const saveProfile = async () => {
    const toastId = toast.loading('Saving profile...');
    try {
      await updateTenant(tenantId, {
        tenantName: profile.tenantName,
        contactEmail: profile.contactEmail,
        contactPerson: profile.contactPerson,
        contactPhone: profile.contactPhone,
        address: profile.address,
        subscription: profile.subscription ? {
          plan: profile.subscription.plan || 'standard',
          monthlyLimit: profile.subscription.monthlyLimit,
        } : undefined,
      });
      toast.success('Profile saved successfully', { id: toastId });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save profile'), { id: toastId });
    }
  };

  const saveMifos = async () => {
    setMifosSaving(true);
    const toastId = toast.loading('Saving MIFOS configuration...');
    try {
      const payload = buildMifosConfigPayload(mifos);
      const result = await saveMifosConfig(tenantId, payload);
      const tenant = result.data?.tenant || result.tenant;
      if (tenant?.mifosConfig) {
        setMifos(mifosConfigFromTenant(tenant.mifosConfig));
      }
      toast.success('MIFOS configuration saved successfully', { id: toastId });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save MIFOS configuration'), { id: toastId });
    } finally {
      setMifosSaving(false);
    }
  };

  const validateMifos = async () => {
    setMifosValidating(true);
    const toastId = toast.loading('Validating MIFOS connection...');
    try {
      const result = await validateMifosConfig(tenantId, buildMifosValidatePayload(mifos));
      const validation = result.data || result;
      if (validation.valid) {
        const usedStoredPassword = mifos.mode === 'override'
          && mifos.hasMakerPassword
          && !mifos.makerPassword;
        toast.success(
          usedStoredPassword
            ? 'MIFOS connection validated using the saved password'
            : 'MIFOS connection validated successfully',
          { id: toastId }
        );
      } else {
        toast.error(
          validation.message || 'MIFOS validation failed. Check your credentials and try again.',
          { id: toastId }
        );
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'MIFOS validation failed'), { id: toastId });
    } finally {
      setMifosValidating(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName?.trim()) {
      toast.error('Enter a name for the API key');
      return;
    }
    setKeyActionLoading('create');
    const toastId = toast.loading('Creating API key...');
    try {
      const result = await createApiKey(tenantId, { name: newKeyName.trim() });
      setKeyModal(result.data || result);
      toast.success('API key created. Copy the credentials now — they are shown only once.', { id: toastId });
      loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create API key'), { id: toastId });
    } finally {
      setKeyActionLoading(null);
    }
  };

  const handleRotateKey = async (keyId) => {
    setKeyActionLoading(`rotate-${keyId}`);
    const toastId = toast.loading('Rotating API key...');
    try {
      const result = await rotateApiKey(tenantId, keyId);
      setKeyModal(result.data || result);
      toast.success('API key rotated. Update integrations with the new credentials.', { id: toastId });
      loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to rotate API key'), { id: toastId });
    } finally {
      setKeyActionLoading(null);
    }
  };

  const handleRevokeKey = async (keyId) => {
    setKeyActionLoading(`revoke-${keyId}`);
    const toastId = toast.loading('Revoking API key...');
    try {
      await revokeApiKey(tenantId, keyId);
      toast.success('API key revoked', { id: toastId });
      loadAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to revoke API key'), { id: toastId });
    } finally {
      setKeyActionLoading(null);
    }
  };

  if (!tenantId) {
    return <Box sx={{ p: 3 }}>No tenant selected. Use the tenant switcher or pick a tenant below.</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>FSP Settings</Typography>
      {isPlatformAdmin && (
        <TextField
          select sx={{ mb: 2, minWidth: 280 }} label="Tenant"
          value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)}
        >
          {tenantOptions.map((t) => (
            <MenuItem key={t.tenantId} value={t.tenantId}>{t.tenantName} ({t.tenantId})</MenuItem>
          ))}
        </TextField>
      )}
      <Tabs value={tab} onChange={(_, v) => setSearchParams({ tab: v })}>
        <Tab label="Profile" />
        {can('tenant:update') && <Tab label="MIFOS" />}
        {can('api_keys:manage') && <Tab label="API Keys" />}
        {can('tenant:update') && <Tab label="Certificates" />}
      </Tabs>

      <TabPanel value={tab} index={0}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
          <TextField label="Tenant Name" value={profile.tenantName || ''} onChange={(e) => setProfile({ ...profile, tenantName: e.target.value })} />
          <TextField label="FSP Code" value={profile.fspCode || ''} disabled />
          <TextField label="Contact Email" value={profile.contactEmail || ''} onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })} />
          <TextField label="Contact Person" value={profile.contactPerson || ''} onChange={(e) => setProfile({ ...profile, contactPerson: e.target.value })} />
          <TextField label="Phone" value={profile.contactPhone || ''} onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })} />
          {can('tenant:update') && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Subscription</Typography>
              <TextField
                select
                label="Plan"
                value={profile.subscription?.plan || 'standard'}
                onChange={(e) => setProfile({
                  ...profile,
                  subscription: { ...profile.subscription, plan: e.target.value },
                })}
              >
                <MenuItem value="trial">Trial</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </TextField>
              <TextField
                type="number"
                label="Monthly transaction limit"
                value={profile.subscription?.monthlyLimit ?? ''}
                onChange={(e) => setProfile({
                  ...profile,
                  subscription: {
                    ...profile.subscription,
                    plan: profile.subscription?.plan || 'standard',
                    monthlyLimit: Number(e.target.value),
                  },
                })}
              />
            </>
          )}
          {can('tenant:update') && <Button variant="contained" onClick={saveProfile}>Save</Button>}
        </Paper>
      </TabPanel>

      {can('tenant:update') && (
        <TabPanel value={tab} index={1}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
            <TextField select label="Mode" value={mifos.mode || 'inherit_default'} onChange={(e) => setMifos({ ...mifos, mode: e.target.value })}>
              <MenuItem value="inherit_default">Inherit default</MenuItem>
              <MenuItem value="override">Override</MenuItem>
            </TextField>
            {mifos.mode === 'override' && (
              <Box component="form" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                <TextField
                  label="Base URL"
                  helperText="e.g. https://host/fineract-provider/api (no /v1 suffix)"
                  value={mifos.baseUrl || ''}
                  onChange={(e) => setMifos({ ...mifos, baseUrl: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Fineract Tenant"
                  value={mifos.tenantId || ''}
                  onChange={(e) => setMifos({ ...mifos, tenantId: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Maker username"
                  name="mifos-maker-username"
                  autoComplete="off"
                  value={mifos.makerUsername || ''}
                  onChange={(e) => setMifos({ ...mifos, makerUsername: e.target.value })}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  key={`mifos-password-${tenantId}`}
                  type="password"
                  label="Maker password"
                  name="mifos-maker-credential"
                  autoComplete="new-password"
                  placeholder={mifos.hasMakerPassword ? 'Leave blank to keep saved password' : 'Enter maker password'}
                  helperText={
                    mifos.hasMakerPassword
                      ? 'A password is stored securely on the server. Leave blank to keep it, or type a new one to replace.'
                      : 'Enter the MIFOS maker password for this tenant.'
                  }
                  value={mifos.makerPassword || ''}
                  onChange={(e) => setMifos({ ...mifos, makerPassword: e.target.value })}
                  onInput={(e) => setMifos({ ...mifos, makerPassword: e.target.value })}
                  inputProps={{
                    autoComplete: 'new-password',
                    'data-lpignore': 'true',
                    'data-1p-ignore': 'true',
                  }}
                  fullWidth
                />
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={saveMifos}
                disabled={mifosSaving || mifosValidating}
                startIcon={mifosSaving ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {mifosSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={validateMifos}
                disabled={mifosSaving || mifosValidating}
                startIcon={mifosValidating ? <CircularProgress size={18} /> : null}
              >
                {mifosValidating ? 'Validating...' : 'Validate'}
              </Button>
            </Box>
          </Paper>
        </TabPanel>
      )}

      {can('api_keys:manage') && (
        <TabPanel value={tab} index={can('tenant:update') ? 2 : 1}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <TextField size="small" label="Key name" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
            <Button
              variant="contained"
              onClick={handleCreateKey}
              disabled={Boolean(keyActionLoading)}
              startIcon={keyActionLoading === 'create' ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {keyActionLoading === 'create' ? 'Creating...' : 'Create Key'}
            </Button>
          </Box>
          <Paper sx={{ height: 360 }}>
            <DataGrid
              rows={keys.map((k) => ({ ...k, id: k._id }))}
              columns={[
                { field: 'name', headerName: 'Name', flex: 1 },
                { field: 'keyPrefix', headerName: 'Prefix', width: 140 },
                { field: 'status', headerName: 'Status', width: 100 },
                {
                  field: 'actions', headerName: 'Actions', width: 200,
                  renderCell: (p) => {
                    if (!isApiKeyActive(p.row.status)) {
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: '36px' }}>
                          No actions
                        </Typography>
                      );
                    }

                    const rotating = keyActionLoading === `rotate-${p.row.id}`;
                    const revoking = keyActionLoading === `revoke-${p.row.id}`;
                    const busy = Boolean(keyActionLoading);

                    return (
                      <Box>
                        <Button
                          size="small"
                          disabled={busy}
                          onClick={() => handleRotateKey(p.row.id)}
                          startIcon={rotating ? <CircularProgress size={14} /> : null}
                        >
                          {rotating ? 'Rotating...' : 'Rotate'}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={busy}
                          onClick={() => handleRevokeKey(p.row.id)}
                          startIcon={revoking ? <CircularProgress size={14} /> : null}
                        >
                          {revoking ? 'Revoking...' : 'Revoke'}
                        </Button>
                      </Box>
                    );
                  },
                },
              ]}
            />
          </Paper>
        </TabPanel>
      )}

      {can('tenant:update') && (
        <TabPanel value={tab} index={can('api_keys:manage') ? 3 : 2}>
          <Paper sx={{ p: 2, maxWidth: 520 }}>
            {certs?.hasCertificates && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Certificates uploaded. Fingerprint: {certs.certificateFingerprint}
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 2 }}>Upload ESS signing certificates (PEM format)</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="outlined" component="label">
                Public cert
                <input
                  hidden
                  type="file"
                  accept=".pem,.crt"
                  onChange={(e) => setCertFiles({ ...certFiles, publicCert: e.target.files?.[0] || null })}
                />
              </Button>
              {certFiles.publicCert && (
                <Typography variant="caption" color="text.secondary">Selected: {certFiles.publicCert.name}</Typography>
              )}
              <Button variant="outlined" component="label">
                Private key
                <input
                  hidden
                  type="file"
                  accept=".pem,.key"
                  onChange={(e) => setCertFiles({ ...certFiles, privateKey: e.target.files?.[0] || null })}
                />
              </Button>
              {certFiles.privateKey && (
                <Typography variant="caption" color="text.secondary">Selected: {certFiles.privateKey.name}</Typography>
              )}
              <Button variant="outlined" component="label">
                CA cert (optional)
                <input
                  hidden
                  type="file"
                  accept=".pem,.crt"
                  onChange={(e) => setCertFiles({ ...certFiles, caCert: e.target.files?.[0] || null })}
                />
              </Button>
              {certFiles.caCert && (
                <Typography variant="caption" color="text.secondary">Selected: {certFiles.caCert.name}</Typography>
              )}
              <Button
                variant="contained"
                disabled={certUploading || !certFiles.publicCert || !certFiles.privateKey}
                startIcon={certUploading ? <CircularProgress size={16} color="inherit" /> : null}
                onClick={async () => {
                  if (!certFiles.publicCert || !certFiles.privateKey) {
                    toast.error('Select both public certificate and private key before uploading.');
                    return;
                  }
                  setCertUploading(true);
                  const toastId = toast.loading('Uploading certificates...');
                  try {
                    const fd = new FormData();
                    fd.append('publicCert', certFiles.publicCert);
                    fd.append('privateKey', certFiles.privateKey);
                    if (certFiles.caCert) fd.append('caCert', certFiles.caCert);
                    await uploadCertificates(tenantId, fd);
                    toast.success('Certificates uploaded successfully', { id: toastId });
                    setCertFiles({ publicCert: null, privateKey: null, caCert: null });
                    loadAll();
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, 'Failed to upload certificates'), { id: toastId });
                  } finally {
                    setCertUploading(false);
                  }
                }}
              >
                {certUploading ? 'Uploading...' : 'Upload'}
              </Button>
              {certs?.hasCertificates && (
                <Button color="error" onClick={async () => {
                  const toastId = toast.loading('Removing certificates...');
                  try {
                    await deleteCertificates(tenantId);
                    toast.success('Certificates removed successfully', { id: toastId });
                    loadAll();
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, 'Failed to remove certificates'), { id: toastId });
                  }
                }}>Delete certificates</Button>
              )}
            </Box>
          </Paper>
        </TabPanel>
      )}

      <Dialog open={Boolean(keyModal)} onClose={() => setKeyModal(null)}>
        <DialogTitle>Save API credentials</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Key: {keyModal?.rawKey}</Typography>
          <Typography variant="body2">Secret: {keyModal?.rawSecret}</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setKeyModal(null)}>Done</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
