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
import { buildMifosConfigPayload } from '../../utils/mifosConfig';

const STEPS = ['Organization', 'MIFOS Config', 'API Keys', 'Review', 'Submit'];

const COUNTRY_OPTIONS = [
  { code: 'TZ', name: 'Tanzania' },
  { code: 'KE', name: 'Kenya' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'BI', name: 'Burundi' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'ZA', name: 'South Africa' },
];

const EMPTY_ADDRESS = {
  line1: '',
  line2: '',
  city: '',
  region: '',
  country: 'TZ',
};

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
    address: { ...EMPTY_ADDRESS },
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

  const updateAddress = (field, value) => {
    setForm((f) => ({
      ...f,
      address: { ...f.address, [field]: value },
    }));
  };

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
        address: {
          line1: t.address?.line1 || '',
          line2: t.address?.line2 || '',
          city: t.address?.city || '',
          region: t.address?.region || '',
          country: t.address?.country || 'TZ',
        },
        mifosMode: t.mifosConfig?.mode || f.mifosMode,
        mifosBaseUrl: t.mifosConfig?.baseUrl || f.mifosBaseUrl,
        mifosTenantId: t.mifosConfig?.tenantId || f.mifosTenantId,
        mifosUsername: t.mifosConfig?.makerUsername || f.mifosUsername,
        mifosPassword: '',
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const buildCompanyInfo = () => {
    const companyInfo = {
      tenantName: form.tenantName,
      fspCode: form.fspCode,
      fspName: form.fspName || form.tenantName,
      contactPerson: form.contactPerson,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
    };

    const { line1, line2, city, region, country } = form.address;
    if (line1?.trim() || line2?.trim() || city?.trim() || region?.trim()) {
      companyInfo.address = {
        line1: line1?.trim() || '',
        line2: line2?.trim() || '',
        city: city?.trim() || '',
        region: region?.trim() || '',
        country: country || 'TZ',
      };
    }

    return companyInfo;
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
        companyInfo: buildCompanyInfo(),
        completedSteps: ['organization'],
      });
      navigate(`/onboarding/${id}`, { replace: true });
    } else {
      await updateDraft(tenantId, {
        companyInfo: buildCompanyInfo(),
        completedSteps: ['organization'],
      });
    }
    return true;
  };

  const saveMifos = async () => {
    const mifosConfig = buildMifosConfigPayload({
      mode: form.mifosMode,
      baseUrl: form.mifosBaseUrl,
      tenantId: form.mifosTenantId,
      makerUsername: form.mifosUsername,
      makerPassword: form.mifosPassword,
    });
    await updateDraft(tenantId, { mifosConfig, completedSteps: ['organization', 'mifos'] });
    const valid = await validateMifosConfig(tenantId);
    if (!valid.data?.valid) {
      toast.warn(valid.data?.message || 'MIFOS validation failed — check credentials');
      return false;
    }
    toast.success('MIFOS configuration validated');
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
      if (activeStep === 1 && !(await saveMifos())) return;
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
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Address</Typography>
            <TextField
              label="Address line 1"
              value={form.address.line1}
              onChange={(e) => updateAddress('line1', e.target.value)}
            />
            <TextField
              label="Address line 2 (optional)"
              value={form.address.line2}
              onChange={(e) => updateAddress('line2', e.target.value)}
            />
            <TextField
              label="City"
              value={form.address.city}
              onChange={(e) => updateAddress('city', e.target.value)}
            />
            <TextField
              label="Region"
              value={form.address.region}
              onChange={(e) => updateAddress('region', e.target.value)}
            />
            <TextField
              select
              label="Country"
              value={form.address.country}
              onChange={(e) => updateAddress('country', e.target.value)}
            >
              {COUNTRY_OPTIONS.map(({ code, name }) => (
                <MenuItem key={code} value={code}>{name}</MenuItem>
              ))}
            </TextField>
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
                <TextField
                  label="Base URL"
                  helperText="e.g. https://host/fineract-provider/api (no /v1 suffix)"
                  value={form.mifosBaseUrl}
                  onChange={(e) => setForm({ ...form, mifosBaseUrl: e.target.value })}
                />
                <TextField label="Fineract Tenant ID" value={form.mifosTenantId} onChange={(e) => setForm({ ...form, mifosTenantId: e.target.value })} />
                <TextField label="Maker username" value={form.mifosUsername} onChange={(e) => setForm({ ...form, mifosUsername: e.target.value })} />
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
            {form.address.line1 && (
              <Typography sx={{ mt: 1 }}>
                Address: {[form.address.line1, form.address.city, form.address.region].filter(Boolean).join(', ')}
                {form.address.country ? ` (${form.address.country})` : ''}
              </Typography>
            )}
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
