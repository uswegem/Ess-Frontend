import React, { useCallback, useEffect, useState } from 'react';
import {
  Paper, Button, Box, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Typography, Grid, CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import {
  listMiracoreTenants,
  createMiracoreTenant,
  provisionMiracoreTenant,
  bootstrapMiracoreTenant,
  activateMiracoreTenant,
} from '../../services/miracoreService';

const MIRACORE_STATUS_PILL = {
  active: 'green',
  provisioned: 'green',
  bootstrapped: 'green',
  pending: 'gray',
  created: 'gray',
  provisioning: 'gray',
  bootstrapping: 'gray',
  failed: 'red',
  error: 'red',
};

const statusPillSx = (status) => {
  const pillKey = MIRACORE_STATUS_PILL[status] || 'gray';
  return { bgcolor: `statusPill.${pillKey}.bg`, color: `statusPill.${pillKey}.text` };
};

function NoRowsOverlay() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.muted' }}>
      <Box sx={{ fontSize: 24, mb: 1 }}>📁</Box>
      <Typography sx={{ fontSize: 14, color: 'text.muted' }}>No MiraCore tenants found</Typography>
    </Box>
  );
}

const initialFormState = {
  tenantId: '',
  tenantName: '',
  runtimeHost: '102.204.1.22',
  runtimePort: 3002,
  databaseName: '',
  schemaName: '',
  defaultCurrency: 'TZS',
  emailProvider: 'sendgrid',
  smsProvider: 'africastalking',
  otpProvider: 'totp',
  emailEnabled: true,
  smsEnabled: true,
  otpEnabled: true,
};

export default function MiracoreProvisioning() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [bootstrapOpen, setBootstrapOpen] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [bootstrapData, setBootstrapData] = useState({
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [processing, setProcessing] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const result = await listMiracoreTenants();
      const tenants = (result.data?.tenants || []).map((t) => ({
        id: t.tenantId,
        tenantId: t.tenantId,
        tenantName: t.tenantName,
        runtimeHost: t.runtimeHost,
        runtimePort: t.runtimePort,
        databaseName: t.databaseName,
        status: t.status,
        bootstrapStatus: t.bootstrap?.status || 'pending',
      }));
      setRows(tenants);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleCreate = async () => {
    try {
      setProcessing(true);
      await createMiracoreTenant({
        tenantId: formData.tenantId,
        tenantName: formData.tenantName,
        runtimeHost: formData.runtimeHost,
        runtimePort: formData.runtimePort,
        databaseName: formData.databaseName,
        schemaName: formData.schemaName,
        appConfig: {
          defaultCurrency: formData.defaultCurrency,
          emailProvider: formData.emailProvider,
          smsProvider: formData.smsProvider,
          otpProvider: formData.otpProvider,
        },
        notificationConfig: {
          emailEnabled: formData.emailEnabled,
          smsEnabled: formData.smsEnabled,
          otpEnabled: formData.otpEnabled,
        },
      });
      toast.success('MiraCore tenant created');
      setCreateOpen(false);
      setFormData(initialFormState);
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleProvision = async (tenantId) => {
    try {
      setProcessing(true);
      await provisionMiracoreTenant(tenantId);
      toast.success('Provisioning initiated');
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBootstrap = async () => {
    try {
      setProcessing(true);
      await bootstrapMiracoreTenant(bootstrapOpen.tenantId, bootstrapData);
      toast.success('Bootstrap completed');
      setBootstrapOpen(null);
      setBootstrapData({ adminUsername: '', adminEmail: '', adminPassword: '' });
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleActivate = async (tenantId) => {
    try {
      setProcessing(true);
      await activateMiracoreTenant(tenantId);
      toast.success('Tenant activated');
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    { field: 'tenantId', headerName: 'Tenant ID', width: 140 },
    { field: 'tenantName', headerName: 'Name', flex: 1 },
    { field: 'runtimeHost', headerName: 'Runtime Host', width: 140 },
    { field: 'databaseName', headerName: 'Database', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (p) => <Chip size="small" label={p.value} sx={statusPillSx(p.value)} />,
    },
    {
      field: 'bootstrapStatus',
      headerName: 'Bootstrap',
      width: 120,
      renderCell: (p) => <Chip size="small" label={p.value} sx={statusPillSx(p.value)} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 360,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {p.row.status === 'created' && (
            <Button
              size="small"
              variant="contained"
              onClick={() => handleProvision(p.row.tenantId)}
              disabled={processing}
            >
              Provision
            </Button>
          )}
          {p.row.status === 'provisioned' && p.row.bootstrapStatus === 'pending' && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => setBootstrapOpen(p.row)}
              disabled={processing}
            >
              Bootstrap
            </Button>
          )}
          {p.row.bootstrapStatus === 'completed' && p.row.status !== 'active' && (
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={() => handleActivate(p.row.tenantId)}
              disabled={processing}
            >
              Activate
            </Button>
          )}
          {p.row.status === 'active' && (
            <Chip size="small" label="✓ Active" color="success" />
          )}
        </Box>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">MiraCore Provisioning</Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          Create Tenant
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          slots={{ noRowsOverlay: NoRowsOverlay }}
        />
      </Paper>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => !processing && setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create MiraCore Tenant</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tenant ID"
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tenant Name"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Runtime Host"
                value={formData.runtimeHost}
                onChange={(e) => setFormData({ ...formData, runtimeHost: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Runtime Port"
                type="number"
                value={formData.runtimePort}
                onChange={(e) => setFormData({ ...formData, runtimePort: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Database Name"
                value={formData.databaseName}
                onChange={(e) => setFormData({ ...formData, databaseName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Schema Name"
                value={formData.schemaName}
                onChange={(e) => setFormData({ ...formData, schemaName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Currency"
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Email Provider"
                value={formData.emailProvider}
                onChange={(e) => setFormData({ ...formData, emailProvider: e.target.value })}
              >
                <option value="sendgrid">SendGrid</option>
                <option value="ses">AWS SES</option>
                <option value="smtp">SMTP</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="SMS Provider"
                value={formData.smsProvider}
                onChange={(e) => setFormData({ ...formData, smsProvider: e.target.value })}
              >
                <option value="africastalking">Africa's Talking</option>
                <option value="twilio">Twilio</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="OTP Provider"
                value={formData.otpProvider}
                onChange={(e) => setFormData({ ...formData, otpProvider: e.target.value })}
              >
                <option value="totp">TOTP</option>
                <option value="sms">SMS</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={processing}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={processing}>
            {processing ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bootstrap Dialog */}
      <Dialog open={!!bootstrapOpen} onClose={() => !processing && setBootstrapOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Bootstrap Tenant: {bootstrapOpen?.tenantName}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Admin Username"
                value={bootstrapData.adminUsername}
                onChange={(e) => setBootstrapData({ ...bootstrapData, adminUsername: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Admin Email"
                type="email"
                value={bootstrapData.adminEmail}
                onChange={(e) => setBootstrapData({ ...bootstrapData, adminEmail: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Admin Password"
                type="password"
                value={bootstrapData.adminPassword}
                onChange={(e) => setBootstrapData({ ...bootstrapData, adminPassword: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBootstrapOpen(null)} disabled={processing}>Cancel</Button>
          <Button onClick={handleBootstrap} variant="contained" disabled={processing}>
            {processing ? <CircularProgress size={20} /> : 'Bootstrap'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
