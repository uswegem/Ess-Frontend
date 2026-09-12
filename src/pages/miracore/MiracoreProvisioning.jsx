import React, { useCallback, useEffect, useState } from 'react';
import {
  Paper, Button, Box, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Typography, Grid, CircularProgress, Divider,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import {
  listMiracoreTenants,
  createMiracoreTenant,
  provisionMiracoreTenant,
  bootstrapMiracoreTenant,
  activateMiracoreTenant,
  checkMiracoreTenantId,
} from '../../services/miracoreService';

// Must match ProvisioningTenant.status exactly (see backend model) — this
// list drifting from the backend enum is what silently broke every action
// button before (the UI was written against an earlier, different set of
// status names that the backend never actually used).
const MIRACORE_STATUS_PILL = {
  active: 'green',
  ready: 'green',
  draft: 'gray',
  provisioning: 'gray',
  inactive: 'gray',
  failed: 'red',
};

// Must match ProvisioningTenant.bootstrap.status exactly (see backend
// model / provisioningTenantService.js) — same reasoning as above.
const BOOTSTRAP_STATUS_PILL = {
  completed: 'green',
  awaiting_restart: 'gray',
  in_progress: 'gray',
  not_started: 'gray',
  failed: 'red',
};

const statusPillSx = (status, map = MIRACORE_STATUS_PILL) => {
  const pillKey = map[status] || 'gray';
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

// First-significant-word slug, matching the example: "Madaba Microfinance" -> "madaba".
// Falls back to a condensed full-name slug if the first word alone isn't usable
// (e.g. too short, or entirely non-alphanumeric) rather than producing an empty id.
function slugifyTenantName(tenantName) {
  const words = String(tenantName || '')
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);

  const firstWord = words[0] || '';
  if (firstWord.length >= 3) return firstWord;

  const condensed = words.join('').slice(0, 30);
  return condensed || 'tenant';
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Generic E.164-ish check (optional leading +, 8-15 digits) — not restricted
// to Tanzania (+255) even though that's the common case here.
const PHONE_PATTERN = /^\+?[0-9]{8,15}$/;

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
  contactFirstName: '',
  contactSurname: '',
  contactEmail: '',
  contactPhone: '',
};

// Tracks which auto-generated fields are still "auto" (safe to overwrite on
// the next Tenant Name blur) vs. manually overridden by the admin. Every
// field starts auto-managed; editing one directly takes it out of auto mode
// so the admin's override is never silently clobbered by a later blur.
const initialAutoState = { tenantId: true, databaseName: true, schemaName: true };

export default function MiracoreProvisioning() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [bootstrapOpen, setBootstrapOpen] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [autoFields, setAutoFields] = useState(initialAutoState);
  const [formErrors, setFormErrors] = useState({});
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
        // 'not_started' matches the backend's own default (bootstrap.status
        // on ProvisioningTenant) — not a UI-invented placeholder.
        bootstrapStatus: t.bootstrap?.status || 'not_started',
        provisioningError: t.provisioningJob?.lastError || null,
        bootstrapError: t.bootstrap?.lastError || null,
      }));
      setRows(tenants);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  // Auto-generates Tenant ID / Database Name / Schema Name from Tenant Name
  // when the Tenant Name field loses focus. Only overwrites fields still in
  // "auto" mode — an admin who has already typed their own Tenant ID (etc.)
  // keeps their value even if they go back and tweak Tenant Name afterward.
  const handleTenantNameBlur = async () => {
    if (!formData.tenantName.trim()) return;
    if (!autoFields.tenantId && !autoFields.databaseName && !autoFields.schemaName) return;

    const baseSlug = slugifyTenantName(formData.tenantName);

    let finalTenantId = baseSlug;
    try {
      const result = await checkMiracoreTenantId(baseSlug);
      finalTenantId = result.data?.tenantId || baseSlug;
      if (result.data?.wasRenamed) {
        toast.info(`Tenant ID "${baseSlug}" is already in use — using "${finalTenantId}" instead.`);
      }
    } catch (err) {
      // Uniqueness check is a convenience, not a hard gate — the create
      // endpoint re-checks and auto-renames on collision as a safety net
      // regardless, so fall back to the plain slug if the check itself fails.
      finalTenantId = baseSlug;
    }

    setFormData((prev) => ({
      ...prev,
      tenantId: autoFields.tenantId ? finalTenantId : prev.tenantId,
      // Matches this form's existing Database Name / Schema Name pattern
      // (both derived as <tenant_id>_db).
      databaseName: autoFields.databaseName ? `${finalTenantId}_db` : prev.databaseName,
      schemaName: autoFields.schemaName ? `${finalTenantId}_db` : prev.schemaName,
    }));
  };

  // Any manual edit to an auto-generated field takes it out of auto mode,
  // so a later Tenant Name blur won't overwrite the admin's own value.
  const handleAutoFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setAutoFields((prev) => ({ ...prev, [field]: false }));
  };

  const resetCreateForm = () => {
    setFormData(initialFormState);
    setAutoFields(initialAutoState);
    setFormErrors({});
  };

  const validateContactFields = () => {
    const errors = {};
    if (!formData.contactFirstName.trim()) errors.contactFirstName = 'First name is required.';
    if (!formData.contactSurname.trim()) errors.contactSurname = 'Surname is required.';
    if (!formData.contactEmail.trim()) {
      errors.contactEmail = 'Email address is required.';
    } else if (!EMAIL_PATTERN.test(formData.contactEmail.trim())) {
      errors.contactEmail = 'Enter a valid email address.';
    }
    if (!formData.contactPhone.trim()) {
      errors.contactPhone = 'Mobile phone number is required.';
    } else if (!PHONE_PATTERN.test(formData.contactPhone.trim())) {
      errors.contactPhone = 'Enter a valid phone number (e.g. +255712345678).';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateContactFields()) {
      toast.error('Please fix the highlighted contact fields.');
      return;
    }

    try {
      setProcessing(true);
      const result = await createMiracoreTenant({
        tenantId: formData.tenantId,
        tenantName: formData.tenantName,
        runtimeHost: formData.runtimeHost,
        runtimePort: formData.runtimePort,
        databaseName: formData.databaseName,
        schemaName: formData.schemaName,
        contactFirstName: formData.contactFirstName,
        contactSurname: formData.contactSurname,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
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

      // Safety-net collision handling can also trigger server-side (e.g. a
      // race with another admin submitting the same slug) — surface it the
      // same way the client-side check does, rather than silently renaming.
      const assignedTenantId = result.data?.tenant?.tenantId;
      if (assignedTenantId && assignedTenantId !== formData.tenantId) {
        toast.info(`Tenant ID "${formData.tenantId}" was already taken — created as "${assignedTenantId}" instead.`);
      }

      toast.success('MiraCore tenant created. A confirmation email has been sent to the contact address.');
      setCreateOpen(false);
      resetCreateForm();
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

  // Bootstrap takes no input from the admin — it registers the tenant with
  // Fineract's own control-plane DB over SSH; Fineract seeds its own
  // default admin user automatically on its next restart. There used to be
  // a form here asking for an admin username/email/password, but the
  // backend has never read those fields (they're not part of how bootstrap
  // actually works) — removed rather than leaving a dialog that implies
  // the admin has a say in credentials that Fineract generates itself.
  const handleBootstrap = async (tenantId) => {
    try {
      setProcessing(true);
      await bootstrapMiracoreTenant(tenantId);
      toast.success('Tenant registered with Fineract — a runtime host restart is still needed before it is live.');
      setBootstrapOpen(null);
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
      width: 130,
      renderCell: (p) => {
        const chip = <Chip size="small" label={p.value} sx={statusPillSx(p.value)} />;
        // Surfaces provisioningJob.lastError, which the backend already
        // tracks but the UI previously never showed anywhere — a failed
        // provision was only diagnosable from server logs before this.
        return p.row.provisioningError
          ? <Tooltip title={p.row.provisioningError}>{chip}</Tooltip>
          : chip;
      },
    },
    {
      field: 'bootstrapStatus',
      headerName: 'Bootstrap',
      width: 150,
      renderCell: (p) => {
        const label = p.value === 'awaiting_restart' ? 'Awaiting restart' : p.value;
        const chip = <Chip size="small" label={label} sx={statusPillSx(p.value, BOOTSTRAP_STATUS_PILL)} />;
        return p.row.bootstrapError
          ? <Tooltip title={p.row.bootstrapError}>{chip}</Tooltip>
          : chip;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 360,
      // Every branch here is keyed off the backend's real status/
      // bootstrap.status values (ProvisioningTenant model,
      // provisioningTenantService.js) — not placeholder names invented on
      // the frontend, which is what silently broke every button before.
      renderCell: (p) => {
        const { status, bootstrapStatus } = p.row;

        if (status === 'active') {
          return <Chip size="small" label="✓ Active" color="success" />;
        }

        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {status === 'draft' && (
              <Button
                size="small"
                variant="contained"
                onClick={() => handleProvision(p.row.tenantId)}
                disabled={processing}
              >
                Provision
              </Button>
            )}
            {status === 'failed' && (
              <Button
                size="small"
                variant="contained"
                color="warning"
                onClick={() => handleProvision(p.row.tenantId)}
                disabled={processing}
              >
                Retry Provision
              </Button>
            )}
            {status === 'ready' && (bootstrapStatus === 'not_started' || bootstrapStatus === 'failed') && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => setBootstrapOpen(p.row)}
                disabled={processing}
              >
                {bootstrapStatus === 'failed' ? 'Retry Bootstrap' : 'Bootstrap'}
              </Button>
            )}
            {status === 'ready' && bootstrapStatus === 'in_progress' && (
              <Chip size="small" label="Bootstrapping…" sx={statusPillSx('in_progress', BOOTSTRAP_STATUS_PILL)} />
            )}
            {status === 'ready' && bootstrapStatus === 'awaiting_restart' && (
              <Tooltip title="Registered with Fineract — an admin still needs to restart Fineract on the runtime host before this tenant is live.">
                <Chip size="small" label="Awaiting runtime restart" sx={statusPillSx('awaiting_restart', BOOTSTRAP_STATUS_PILL)} />
              </Tooltip>
            )}
            {status === 'ready' && bootstrapStatus === 'completed' && (
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
          </Box>
        );
      },
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
                label="Tenant Name"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                onBlur={handleTenantNameBlur}
                required
                helperText="Tenant ID, Database Name, and Schema Name are auto-generated from this."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tenant ID"
                value={formData.tenantId}
                onChange={(e) => handleAutoFieldChange('tenantId', e.target.value)}
                required
                helperText={autoFields.tenantId
                  ? 'Auto-generated — edit to override. Must be lowercase letters/numbers/underscore, e.g. madaba.'
                  : 'Manually set. Must be lowercase letters/numbers/underscore, e.g. madaba (not the full tenant name).'}
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
                onChange={(e) => setFormData({ ...formData, runtimePort: parseInt(e.target.value, 10) })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Database Name"
                value={formData.databaseName}
                onChange={(e) => handleAutoFieldChange('databaseName', e.target.value)}
                required
                helperText={autoFields.databaseName ? 'Auto-generated — edit to override.' : 'Manually set.'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Schema Name"
                value={formData.schemaName}
                onChange={(e) => handleAutoFieldChange('schemaName', e.target.value)}
                required
                helperText={autoFields.schemaName ? 'Auto-generated — edit to override.' : 'Manually set.'}
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

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Contact Details (MFI Onboarding)</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.contactFirstName}
                onChange={(e) => setFormData({ ...formData, contactFirstName: e.target.value })}
                required
                error={Boolean(formErrors.contactFirstName)}
                helperText={formErrors.contactFirstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Surname"
                value={formData.contactSurname}
                onChange={(e) => setFormData({ ...formData, contactSurname: e.target.value })}
                required
                error={Boolean(formErrors.contactSurname)}
                helperText={formErrors.contactSurname}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                required
                error={Boolean(formErrors.contactEmail)}
                helperText={formErrors.contactEmail || 'Receives the request confirmation, and later the login details.'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile Phone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                required
                error={Boolean(formErrors.contactPhone)}
                helperText={formErrors.contactPhone || 'e.g. +255712345678'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateOpen(false); resetCreateForm(); }} disabled={processing}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={processing}>
            {processing ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bootstrap Dialog — no admin credential fields: Fineract seeds its
          own default admin user automatically once the runtime host is
          restarted, so there is nothing for the operator to fill in here. */}
      <Dialog open={!!bootstrapOpen} onClose={() => !processing && setBootstrapOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Bootstrap Tenant: {bootstrapOpen?.tenantName}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            This registers <strong>{bootstrapOpen?.tenantId}</strong> with Fineract's own tenant
            control-plane database on the runtime host.
          </Typography>
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            A runtime host restart is still required afterward before the tenant is actually
            live — Fineract only applies the tenant's database schema and creates its default
            admin login the next time it starts up. That restart is a separate, manual step and
            is not triggered by this action.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBootstrapOpen(null)} disabled={processing}>Cancel</Button>
          <Button onClick={() => handleBootstrap(bootstrapOpen.tenantId)} variant="contained" disabled={processing}>
            {processing ? <CircularProgress size={20} /> : 'Register Tenant'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
