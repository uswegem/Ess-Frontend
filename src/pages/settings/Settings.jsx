import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Tabs, Tab, TextField, Button, Paper, Typography, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
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
import { buildMifosConfigPayload, mifosConfigFromTenant } from '../../utils/mifosConfig';

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
      toast.error(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => { loadAll(); }, [tenantId]);

  const saveProfile = async () => {
    await updateTenant(tenantId, {
      tenantName: profile.tenantName,
      contactEmail: profile.contactEmail,
      contactPerson: profile.contactPerson,
      contactPhone: profile.contactPhone,
      address: profile.address,
    });
    toast.success('Profile saved');
  };

  const saveMifos = async () => {
    const payload = buildMifosConfigPayload(mifos);
    await saveMifosConfig(tenantId, payload);
    toast.success('MIFOS config saved');
  };

  const handleCreateKey = async () => {
    const result = await createApiKey(tenantId, { name: newKeyName });
    setKeyModal(result.data);
    loadAll();
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
              <>
                <TextField
                  label="Base URL"
                  helperText="e.g. https://host/fineract-provider/api (no /v1 suffix)"
                  value={mifos.baseUrl || ''}
                  onChange={(e) => setMifos({ ...mifos, baseUrl: e.target.value })}
                />
                <TextField label="Fineract Tenant" value={mifos.tenantId || ''} onChange={(e) => setMifos({ ...mifos, tenantId: e.target.value })} />
                <TextField label="Maker username" value={mifos.makerUsername || ''} onChange={(e) => setMifos({ ...mifos, makerUsername: e.target.value })} />
                <TextField type="password" label="Maker password" value={mifos.makerPassword || ''} onChange={(e) => setMifos({ ...mifos, makerPassword: e.target.value })} />
              </>
            )}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={saveMifos}>Save</Button>
              <Button onClick={async () => {
                const r = await validateMifosConfig(tenantId);
                toast.info(r.data?.valid ? 'MIFOS valid' : (r.data?.message || 'MIFOS invalid'));
              }}>Validate</Button>
            </Box>
          </Paper>
        </TabPanel>
      )}

      {can('api_keys:manage') && (
        <TabPanel value={tab} index={can('tenant:update') ? 2 : 1}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <TextField size="small" label="Key name" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
            <Button variant="contained" onClick={handleCreateKey}>Create Key</Button>
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
                  renderCell: (p) => (
                    <Box>
                      <Button size="small" onClick={async () => {
                        const r = await rotateApiKey(tenantId, p.row.id);
                        setKeyModal(r.data);
                        loadAll();
                      }}>Rotate</Button>
                      <Button size="small" color="error" onClick={async () => {
                        await revokeApiKey(tenantId, p.row.id);
                        loadAll();
                      }}>Revoke</Button>
                    </Box>
                  ),
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
              <Button variant="outlined" component="label">Public cert<input hidden type="file" onChange={(e) => setCertFiles({ ...certFiles, publicCert: e.target.files[0] })} /></Button>
              <Button variant="outlined" component="label">Private key<input hidden type="file" onChange={(e) => setCertFiles({ ...certFiles, privateKey: e.target.files[0] })} /></Button>
              <Button variant="outlined" component="label">CA cert (optional)<input hidden type="file" onChange={(e) => setCertFiles({ ...certFiles, caCert: e.target.files[0] })} /></Button>
              <Button variant="contained" onClick={async () => {
                const fd = new FormData();
                if (certFiles.publicCert) fd.append('publicCert', certFiles.publicCert);
                if (certFiles.privateKey) fd.append('privateKey', certFiles.privateKey);
                if (certFiles.caCert) fd.append('caCert', certFiles.caCert);
                await uploadCertificates(tenantId, fd);
                toast.success('Certificates uploaded');
                loadAll();
              }}>Upload</Button>
              {certs?.hasCertificates && (
                <Button color="error" onClick={async () => {
                  await deleteCertificates(tenantId);
                  toast.success('Certificates removed');
                  loadAll();
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
