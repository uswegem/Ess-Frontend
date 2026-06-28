import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Stepper, Step, StepLabel, Button, TextField, Typography, Paper,
  MenuItem, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { toast } from 'react-toastify';
import {
  validateFspCode, createDraft, getDraft, updateDraft, submitOnboarding,
} from '../../services/onboardingService';
import { validateMifosConfig, getIntegrationHealth } from '../../services/tenantService';
import { createApiKey } from '../../services/apiKeyService';

const STEPS = ['Organization', 'MIFOS Config', 'API Keys', 'Review', 'Submit'];

export default function OnboardingWizard() {
  const { tenantId: routeTenantId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [tenantId, setTenantId] = useState(routeTenantId || '');
  const [fspAvailable, setFspAvailable] = useState(null);
  const [health, setHealth] = useState(null);
  const [keyModal, setKeyModal] = useState(null);
  const [form, setForm] = useState({
    tenantName: '',
    fspCode: '',
    contactEmail: '',
    contactPerson: '',
    contactPhone: '',
    fspName: '',
    address: '',
    mifosMode: 'inherit_default',
    mifosBaseUrl: '',
    mifosTenantId: '',
    mifosUsername: '',
    mifosPassword: '',
    apiKeyName: 'Production',
  });

  useEffect(() => {
    if (routeTenantId) {
      loadDraft(routeTenantId);
    }
  }, [routeTenantId]);

  const loadDraft = async (id) => {
    try {
      const result = await getDraft(id);
      const t = result.data?.tenant || result.data;
      setTenantId(t.tenantId || id);
      setForm((f) => ({
        ...f,
        tenantName: t.tenantName || f.tenantName,
        fspCode: t.fspCode || f.fspCode,
        contactEmail: t.contactEmail || f.contactEmail,
        contactPerson: t.contactPerson || f.contactPerson,
        contactPhone: t.contactPhone || f.contactPhone,
        fspName: t.fspName || f.fspName,
        address: t.address || f.address,
        mifosMode: t.mifosConfig?.mode || f.mifosMode,
        mifosBaseUrl: t.mifosConfig?.baseUrl || f.mifosBaseUrl,
        mifosTenantId: t.mifosConfig?.tenantId || f.mifosTenantId,
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const saveOrganization = async () => {
    const check = await validateFspCode(form.fspCode, tenantId || undefined);
    if (!check.data?.available) {
      toast.error('FSP code is not available');
      return false;
    }
    if (!tenantId) {
      const created = await createDraft({
        tenantName: form.tenantName,
        fspCode: form.fspCode,
        contactEmail: form.contactEmail,
      });
      const id = created.data?.tenant?.tenantId || created.data?.tenantId;
      setTenantId(id);
      await updateDraft(id, {
        companyInfo: {
          tenantName: form.tenantName,
          fspCode: form.fspCode,
          fspName: form.fspName || form.tenantName,
          contactPerson: form.contactPerson,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          address: form.address,
        },
        completedSteps: ['organization'],
      });
      navigate(`/onboarding/${id}`, { replace: true });
    } else {
      await updateDraft(tenantId, {
        companyInfo: {
          tenantName: form.tenantName,
          fspCode: form.fspCode,
          fspName: form.fspName || form.tenantName,
          contactPerson: form.contactPerson,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          address: form.address,
        },
        completedSteps: ['organization'],
      });
    }
    return true;
  };

  const saveMifos = async () => {
    const mifosConfig = form.mifosMode === 'override'
      ? {
        mode: 'override',
        baseUrl: form.mifosBaseUrl,
        tenantId: form.mifosTenantId,
        username: form.mifosUsername,
        password: form.mifosPassword,
      }
      : { mode: 'inherit_default' };
    await updateDraft(tenantId, { mifosConfig, completedSteps: ['organization', 'mifos'] });
    const valid = await validateMifosConfig(tenantId);
    if (!valid.data?.valid && form.mifosMode === 'override') {
      toast.warn('MIFOS validation failed — check credentials');
    }
    return true;
  };

  const createFirstKey = async () => {
    if (!form.apiKeyName) return true;
    const result = await createApiKey(tenantId, { name: form.apiKeyName });
    setKeyModal(result.data);
    await updateDraft(tenantId, { completedSteps: ['organization', 'mifos', 'api_keys'] });
    return true;
  };

  const loadReview = async () => {
    const h = await getIntegrationHealth(tenantId);
    setHealth(h.data);
    await updateDraft(tenantId, { completedSteps: ['organization', 'mifos', 'api_keys', 'review'] });
  };

  const handleSubmit = async () => {
    await submitOnboarding(tenantId);
    toast.success('FSP submitted for review');
    navigate('/tenants');
  };

  const handleNext = async () => {
    try {
      if (activeStep === 0 && !(await saveOrganization())) return;
      if (activeStep === 1) await saveMifos();
      if (activeStep === 2) await createFirstKey();
      if (activeStep === 3) await loadReview();
      if (activeStep === 4) {
        await handleSubmit();
        return;
      }
      setActiveStep((s) => s + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="FSP Name" value={form.tenantName} onChange={(e) => setForm({ ...form, tenantName: e.target.value })} />
            <TextField label="FSP Code" value={form.fspCode} onChange={(e) => setForm({ ...form, fspCode: e.target.value.toUpperCase() })} />
            <Button size="small" onClick={async () => {
              const r = await validateFspCode(form.fspCode, tenantId);
              setFspAvailable(r.data?.available);
            }}>Check availability</Button>
            {fspAvailable === false && <Alert severity="error">FSP code taken</Alert>}
            {fspAvailable === true && <Alert severity="success">FSP code available</Alert>}
            <TextField label="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            <TextField label="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            <TextField label="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField select label="MIFOS Mode" value={form.mifosMode} onChange={(e) => setForm({ ...form, mifosMode: e.target.value })}>
              <MenuItem value="inherit_default">Inherit platform default</MenuItem>
              <MenuItem value="override">Override (own Fineract)</MenuItem>
            </TextField>
            {form.mifosMode === 'override' && (
              <>
                <TextField label="Base URL" value={form.mifosBaseUrl} onChange={(e) => setForm({ ...form, mifosBaseUrl: e.target.value })} />
                <TextField label="Fineract Tenant ID" value={form.mifosTenantId} onChange={(e) => setForm({ ...form, mifosTenantId: e.target.value })} />
                <TextField label="Username" value={form.mifosUsername} onChange={(e) => setForm({ ...form, mifosUsername: e.target.value })} />
                <TextField type="password" label="Password" value={form.mifosPassword} onChange={(e) => setForm({ ...form, mifosPassword: e.target.value })} />
              </>
            )}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography>Create first API key (optional — can skip with empty name)</Typography>
            <TextField label="Key name" value={form.apiKeyName} onChange={(e) => setForm({ ...form, apiKeyName: e.target.value })} />
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography>Tenant ID: {tenantId}</Typography>
            <Typography>FSP: {form.tenantName} ({form.fspCode})</Typography>
            <Typography>MIFOS mode: {form.mifosMode}</Typography>
            {health && <Alert severity="info" sx={{ mt: 2 }}>Integration health: {JSON.stringify(health)}</Alert>}
          </Box>
        );
      case 4:
        return <Alert severity="warning">Submit this FSP for platform review. You can approve it from the Tenants page.</Alert>;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>FSP Onboarding</Typography>
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {STEPS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>
      <Paper sx={{ p: 3, mb: 2 }}>{renderStep()}</Paper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button disabled={activeStep === 0} onClick={() => setActiveStep((s) => s - 1)}>Back</Button>
        <Button variant="contained" onClick={handleNext}>
          {activeStep === STEPS.length - 1 ? 'Submit' : 'Next'}
        </Button>
      </Box>

      <Dialog open={Boolean(keyModal)} onClose={() => setKeyModal(null)}>
        <DialogTitle>API Key Created — Save Now</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Key: {keyModal?.rawKey}</Typography>
          <Typography variant="body2">Secret: {keyModal?.rawSecret}</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setKeyModal(null)}>I have saved these</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
